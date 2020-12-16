const express = require('express');
const fs = require('fs')
const bodyParser = require("body-parser");
const { createProxyMiddleware} = require('http-proxy-middleware');
const app = express();
const utils = require('./utils.js')
const defaultConfig = `// 通用代理
function createProxyMiddleware(url, utils) {
  let target = 'http://172.16.20.192:8080'
  //if (/api/.test(url)) { // url中有api关键字时访问的地址
  //  target = 'http://172.16.20.109:8081'
  //}
  // 默认访问地址
  return {
    target: target,
    selfHandleResponse: true, // 是否修改 res
    onProxyReq: function (proxyReq, req, res) {
      proxyReq.path = getPath(req.url)
      proxyReq.setHeader('Cache-Control', 'no-cache')
      proxyReq.removeHeader('Origin')
      // 'Cache-Control': 'no-cache',
      return proxyReq
      function getPath(url) {
        switch (true) {
          case /static/.test(url):
          case /favicon/.test(url):
          case /api/.test(url):
            return url
          default:
            return url
        }
      }
    },
    onProxyRes: async function (proxyRes, req, res) {
      let body = await utils.getBody(proxyRes)
      res.header(proxyRes.headers)
      if (typeof body === 'string') {
        res.write(body.replace(/400/g, '200'));
      } else {
        res.write(body)
      }
      res.end();
    },
  }
}`
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
  // res.header('Content-Type', 'application/json;charset=UTF-8')
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
  let cfg = config.find(req.url)
  if (req.query['target']) {
    cfg.target = req.query['target']
  }
  if (!cfg.target) {
    toAdmin(req, res)
    return
  }
  createProxyMiddleware(Object.assign({
    changeOrigin: true,
    secure: false,
    https: /^https/.test(cfg.target)
  }, cfg))(req, res, next)
})
app.listen(Number(port))

function toAdmin(req, res) {
  res.header('Content-Type', 'text/html; charset=UTF-8')
  res.send(fs.readFileSync('./admin.html').toString().replace(/%%/, config.toString()))
}

function useConfig(port) {
  let path = './config/config_' + port + '.js'
  if (!fs.existsSync(path)) {
    fs.writeFileSync(path, defaultConfig)
  }
  let config = {
    value: function () {},
    toString() {
      return fs.readFileSync(path).toString()
    },
    update(text) {
      fs.writeFileSync(path, text)
      config.value = eval(`(${config.toString()})`)
    },
    find(url) {
      return config.value(url, utils)
    }
  }
  config.update(config.toString())
  return config
}
