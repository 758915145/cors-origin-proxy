var express = require('express');
var { createProxyMiddleware} = require('http-proxy-middleware');

var app = express();

app.all('*', function (req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', '*');
  res.header('Access-Control-Allow-Methods', '*');
  if (req.method.toLowerCase() == 'options') {
    res.sendStatus(200);  // 让options尝试请求快速结束
    return
  }
  var target = req.query['cors-origin'] || req.headers['cors-origin'] // 在url里或者header里加都行，优先使用url里的
  if (target) {
    createProxyMiddleware({
      target: target,
      changeOrigin: true
    })(req, res, next)
  } else {
    res.send('{code: -1, message: "添加cors-origin请求头才能跨域，如：cors-origin:\"https://www.baidu.com\""}')
  }
})
app.listen(3000)