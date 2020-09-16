'use strict';

const requestIp = require('request-ip');
const log = require('../log');


exports = module.exports = (server) => {
  log.info('Configured connect magic');
  server.on('connect', (req, cltSocket, head) => {
    log.info(`Connection established from ${requestIp.getClientIp(req)}`);    
    server.emit('connection', cltSocket);
    cltSocket.write('HTTP/1.1 200 Connection Established\r\n\r\n');
    cltSocket.fitServer = {target: req.url};
  });
};