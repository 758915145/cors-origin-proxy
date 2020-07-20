# cors-origin-proxy
解决跨域的代理工具

# 用法
在本目录里执行（推荐使用pm2来执行这个命令，然后做成.bat脚本文件放到开机启动目录中去）：
```
node main.js
```
业务代码中可以这么使用：
```javascript
// 比如业务代码要访问ip.taobao.com，因为跨域所以访问不了
$.ajax({
  url: 'http://ip.taobao.com/service/getIpInfo.php?ip=142.18.19.19',
  complete: function (res) {
    console.log(res)
  }
})
// 启动这个代理服务器之后，可以改为访问localhost:3000，然后再请求头了加cors-origin字段（你要访问的实际域名）即可
$.ajax({
  url: 'http://localhost:3000/service/getIpInfo.php?ip=142.18.19.19',
  headers: {
    'cors-origin': 'http://ip.taobao.com'
  }, complete: function(res) {
    console.log(res)
  }
})
// 假如因为某种原因，你无法修改请求头，那么再url里加cors-origin参数也是可以的
$.ajax({
  url: 'http://localhost:3000?cors-origin='+encodeURIComponent('http://ip.taobao.com/service/getIpInfo.php?ip=142.18.19.19'),
  complete: function (res) {
    console.log(res)
  }
})
```