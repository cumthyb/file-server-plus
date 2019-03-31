let yargs = require('yargs');
let Server = require('../server.js');
let argv = yargs.option('r', {
  alias: 'root',
  demand: 'false',
  type: 'string',
  default: process.cwd(),
  description: '静态文件根目录'
}).option('o', {
  alias: 'host',
  demand: 'false',
  default: 'localhost',
  type: 'string',
  description: '请配置监听的主机'
}).option('p', {
  alias: 'port',
  demand: 'false',
  type: 'number',
  default: 8080,
  description: '请配置端口号'
})
  .usage('file-server-plus [options]')
  .example(
    'file-server-plus -r / -p 9090 -o localhost', '在本机的9090端口上监听客户端的请求'
  ).help('h').argv;

// argv = {d,root,o,host,p,port}
let server = new Server(argv);
server.start();
