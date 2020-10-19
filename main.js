const express = require('express');
const fs = require('fs')
const bodyParser = require("body-parser");
const { createProxyMiddleware} = require('http-proxy-middleware');
const app = express();
const defaultConfig = `[
  {match: /api/, proxy: "http://cloudbae.natapp1.cc"},
  {match: /^.+$/, proxy: "http://192.168.1.8:8897"},
]`
let port = process.argv.find(i => i.includes('--port='))
port = (port && port.split('--port=')[1]) || 3000
// 解析以 application/json 和 application/x-www-form-urlencoded 提交的数据
const jsonParser = bodyParser.json();
const urlencodedParser = bodyParser.urlencoded({ extended: false });
const config = useConfig(port)

// 允许所有请求跨域
app.all('*', function (req, res, next) {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Headers', req.headers['access-control-request-headers'] || '*')
  res.header('Access-Control-Allow-Methods', '*')
  res.header('Content-Type', 'application/json;charset=UTF-8')
  res.header('Access-Control-Expose-Headers', req.headers['access-control-expose-headers'] || '*')
  if (req.method.toLowerCase() == 'options') {
    res.sendStatus(200);  // 让options尝试请求快速结束
    return
  }
  next()
})
// 管理页面
app.get('/admin', toAdmin)
// 配置
app.post('/config', urlencodedParser, function (req, res, next) {
  config.update(req.body.text)
  res.send({isOk: true})
})
app.all('*', function (req, res, next) {
  let target = config.find(req.url)
  if (!target.proxy) {
    toAdmin(req, res)
    return
  }
  createProxyMiddleware({
    target: target.proxy,
    changeOrigin: true,
    onProxyReq: function (proxyReq, req, res) {
      if (target.onProxyReq) {
        target.onProxyReq(proxyReq, req)
      }
      return proxyReq
    },
    secure: false,
    https: /^https/.test(target.proxy)
  })(req, res, next)
})
app.listen(Number(port))

function toAdmin(req, res) {
  res.header('Content-Type', 'text/html; charset=UTF-8')
  res.send(fs.readFileSync('./admin.html').toString().replace(/%%/, config.toString()))
}

function useConfig(port) {
  let path = './config_' + port
  if (!fs.existsSync(path)) {
    fs.writeFileSync(path, defaultConfig)
  }
  let config = {
    value: [],
    toString() {
      return fs.readFileSync(path).toString()
    },
    update(text) {
      fs.writeFileSync(path, text)
      config.value = eval(`(${config.toString()})`)
    },
    find(url) {
      let target
      for (let i = 0; i < config.value.length; i++) {
        let match = config.value[i].match.test(url)
        if (match) {
          target = config.value[i]
          break
        }
      }
      return target
    }
  }
  config.update(config.toString())
  return config
}