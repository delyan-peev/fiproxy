'use strict';

const toxy = require('toxy');
const express = require('express');
const log = require('./log');
const admin = require('./admin');
const middlewares = require('./fit-server/middlewares');
const proxyConnect = require('./fit-server/proxy-connect');

const fitPort = process.env.SERVER_PORT || 1337;
const adminFitPort = process.env.ADMIN_SERVER_PORT || 1338;

const faultInjectionProxy = toxy();

const app = middlewares({ app: express(), faultInjectionProxy: faultInjectionProxy });

const fitServer = app.listen(fitPort, () => {
  log.info(`Fault injection server started on port ${fitPort}`);
});

proxyConnect(fitServer);


admin({ proxy: faultInjectionProxy, serverPort: adminFitPort });
