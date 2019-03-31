const http = require('http')
const path = require('path')
const debug = require('debug')('file-server-plus')
const chalk = require('chalk')
const util = require('util')
const url = require('url')
const fs = require('fs')
const handlebars = require('handlebars')
const mime = require('mime')
const zlib = require('zlib');
const open = require('open');
const config = require('./config.js')

const statPromisify = util.promisify(fs.stat)
const readdirPromisify = util.promisify(fs.readdir)

/**
 * @parmas: 
 * @Description: 获取模板文件
 */
function getTemplate() {
  let tmpl = fs.readFileSync(path.resolve(__dirname, 'template.html'), 'utf8');
  return handlebars.compile(tmpl);
}


class StaticFileServer {
  constructor(argv) {
    this.config = Object.assign({}, config,argv)
    this.template = getTemplate()
  }

  start() {
    let server = http.createServer()
    server.on('request', this.request.bind(this))
    server.listen(this.config.port, this.config.host, _ => {
      const url = `http://${this.config.host}:${this.config.port} `
      open(url);//用默认浏览器打开
      debug(`file-server-plus started at ${chalk.green(url)}`)
    })
  }

  request(req, res) {
    //获取路由
    let { pathname } = url.parse(req.url)
    if (pathname == '/favicon.ico') {
      res.end()
    } else {
      let filepath = path.join(this.config.root, pathname);
      statPromisify(filepath).then(
        stat => {
          if (stat.isDirectory()) {
            readdirPromisify(filepath).then(files => {
              let data = files.map(file => ({
                name: file,
                url: path.join(pathname, file)
              }));
              debug(`${chalk.yellow(req.url)}`)
              let page = this.template({ files: data })
              res.setHeader('Content-Type', 'text/html');
              res.end(page);
            }).catch(error => {
              this.sendError(req, res, error)
            })
          }
          else {
            this.sendFile(req, res, filepath)
          }
        }
      ).catch(
        error => {
          this.sendError(req, res, error)
        }
      )
    }
  }

  /**
   * @parmas: 
   * @Description: 发送文件
   */
  sendFile(req, res, filepath) {
    res.setHeader('Content-Type', mime.getType(filepath) + ';charset=utf-8');
    let encoding = this.getEncoding(req, res);
    let rs = fs.createReadStream(filepath)
    debug(`${chalk.yellow(req.url)}`)
    if (encoding) {
      rs.pipe(encoding).pipe(res);
    } else {
      rs.pipe(res);
    }
  }

  /**
   * @parmas: 
   * @Description: 发送错误日志
   */
  sendError(req, res, error) {
    let errorStr = util.inspect(error)
    debug(`${chalk.red(req.url)}`)
    debug(`${chalk.red(errorStr)}`)
    res.write(errorStr)
    res.end()
  }

  /**
   * @parmas: 
   * @Description: 获取客户端可接受的encoding
   */
  getEncoding(req, res) {
    //Accept-Encoding:gzip, deflate
    let acceptEncoding = req.headers['accept-encoding'];
    if (/\bgzip\b/.test(acceptEncoding)) {
      res.setHeader('Content-Encoding', 'gzip');
      return zlib.createGzip();
    } else if (/\bdeflate\b/.test(acceptEncoding)) {
      res.setHeader('Content-Encoding', 'deflate');
      return zlib.createDeflate();
    } else {
      return null;
    }
  }
}

// var server = new StaticFileServer()
// server.start()