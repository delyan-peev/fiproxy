'use strict';

const bunyan = require('bunyan');
const PrettyStream = require('bunyan-prettystream');

const prettyStdOut = new PrettyStream();
prettyStdOut.pipe(process.stdout);

exports = module.exports = bunyan.createLogger({
    name: 'fit-server',
    streams: [{
      level: process.env.LOG_LEVEL || 'info',
      type: 'raw',
      stream: prettyStdOut
    }]
  });