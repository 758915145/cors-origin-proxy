var express = require('express');
var fs = require('fs')
var { createProxyMiddleware} = require('http-proxy-middleware');

var app = express();
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
  var corsOrigin, localOrigin, key, targetOrigin
  var target = req.query['cors-origin'] || req.headers['cors-origin'] // 在url里或者header里加都行，优先使用url里的
  var myCookie = req.headers.cookie
  if (myCookie) {
    localOrigin = myCookie.match(/local-origin=([^\s;]+);*/)
    localOrigin = localOrigin && localOrigin[1]

    corsOrigin = myCookie.match(/cors-origin=([^\s;]+);*/)
    corsOrigin = corsOrigin && corsOrigin[1]

    key = myCookie.match(/cors-key=([^\s;]+);*/)
    key = key && key[1]
  }
  if (key && corsOrigin && localOrigin) {
    targetOrigin = req.url.includes(key) ? corsOrigin : localOrigin
  }
  if (target || /^http/.test(targetOrigin || '')) {
    createProxyMiddleware({
      target: target || targetOrigin,
      changeOrigin: true,
      onProxyReq: function (proxyReq, req, res) {
        proxyReq.removeHeader('cors-origin')
        proxyReq.removeHeader('Origin')
        return proxyReq
      },
      onProxyRes: function (proxyRes, req) {
        let proxyCookie = proxyRes.headers["set-cookie"];
        if (proxyCookie) {
          res.header('cookie', proxyCookie.join(';'))
        }
      },
    })(req, res, next)
  } else {
    res.header('Content-Type', 'text/html; charset=UTF-8')
    res.send(fs.readFileSync('./main.html').toString())
  }
})
app.listen(3000)