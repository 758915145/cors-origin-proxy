module.exports = {
  /**
  * 从proxyRes获取body数据，返回json对象
  * @param {*} proxyRes
  * @param {*} res
  */
  getBody: async function (proxyRes) {
      return new Promise((resolve, reject) => {
        let body = []
        proxyRes.on('data', function (chunk) {
          body.push(chunk)
        })
        proxyRes.on('end', function () {
          body = Buffer.concat(body)
          let bs = body.toString()
          if (
            bs.includes('html') ||
            bs.includes('var ') ||
            bs.includes('let ') ||
            bs.includes('code')
          ) {
            
            resolve(bs)
          } else {
            resolve(body)
          }
        })
      })
    }
}

