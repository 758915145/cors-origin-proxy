const express = require('express');
const fs = require('fs')
const bodyParser = require("body-parser");
const { createProxyMiddleware} = require('http-proxy-middleware');
const app = express();
// 解析以 application/json 和 application/x-www-form-urlencoded 提交的数据
var jsonParser = bodyParser.json();
var urlencodedParser = bodyParser.urlencoded({ extended: false });
const configStr = fs.readFileSync('./config').toString()
let config = eval(`(${configStr})`)

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
app.get('/admin', function (req, res, next) {
  res.header('Content-Type', 'text/html; charset=UTF-8')
  const config = fs.readFileSync('./config').toString()
  res.send(fs.readFileSync('./admin.html').toString().replace(/%%/, config))
})
// 配置
app.post('/config', urlencodedParser, function (req, res, next) {
  config = eval(`(${req.body.text})`)
  fs.writeFileSync('./config', req.body.text)
  res.send({isOk: true})
})
app.all('*', function (req, res, next) {
  let target
  for (let i = 0; i < config.length; i++) {
    let match = config[i].match.test(req.url)
    if (match) {
      target = config[i].proxy
      break
    }
  }
  console.log(target)
  if (!target) {
    res.header('Content-Type', 'text/html; charset=UTF-8')
    const config = fs.readFileSync('./config').toString()
    res.send(fs.readFileSync('./admin.html').toString().replace(/%%/, config))
    return
  }
  createProxyMiddleware({
    target: target,
    changeOrigin: true,
    secure: false,
    https: /^https/.test(target)
  })(req, res, next)
})
let port = process.argv.find(i => i.includes('--port='))
app.listen((port && port.split('--port=')[1]) || 3000)