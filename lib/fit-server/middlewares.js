'use strict';

const httpProxy = require('http-proxy-middleware');
const requestIp = require('request-ip');
const log = require('../log');
const { poisons } = require('toxy');

exports = module.exports = ({ app, faultInjectionProxy }) => {
  app.use(function loggingMiddleware(req, res, next) {
    log.info(`Routing ${req.method} request from ${requestIp.getClientIp(req)} to ${req.url}.`);
    return next();
  });

  app.use(faultInjectionProxy.middleware());
  app.use(function headerPoisonInjection(req, res, next) {
    const probability = req.headers['x-fit-probability'];
    if (typeof probability !== 'undefined') {
      if (Math.round(Math.random() * 100) > probability) {
        log.info(`Ignoring fault injection rules for ${req.url} due to probability`)
        return next();
      }
    }

    const test = req.headers['x-fit-test'];
    if (test === 'latency') {
      log.info(`Running ${test} test with latency ${req.headers['x-fit-latency']}`);
      poisons.latency({ jitter: req.headers['x-fit-latency'] })(req, res, next);
    } else if (test === 'bandwidth') {
      log.info(`Running ${test} test with bandwidth ${req.headers['x-fit-bandwidth']}/s`);
      poisons.bandwidth({
        threshold: req.headers['x-fit-bandwidth-threshold'],
        bytes: req.headers['x-fit-bandwidth-bytes']
      })(req, res, next);
    } else if (test === 'abort') {
      log.info(`Running ${test} test with delay ${req.headers['x-fit-abort']}`);
      poisons.abort({ delay: req.headers['x-fit-abort'] })(req, res, next);
    } else if (test === 'timeout') {
      log.info(`Running ${test} test with delay ${req.headers['x-fit-timeout']}`);
      poisons.timeout(req.headers['x-fit-timeout'])(req, res, next);
    } else if (test === 'slowOpen') {
      log.info(`Running ${test} test with delay ${req.headers['x-fit-slowopen']}`);
      poisons.slowOpen({ delay: req.headers['x-fit-slowopen'] })(req, res, next);
    } else if (test === 'slowRead') {
      log.info(`Running ${test} test with chunk ${req.headers['x-fit-slowread-chunk']} and threshold ${req.headers['x-fit-slowread-threshold']}`);
      poisons.slowRead({ bps: req.headers['x-fit-slowread'] })(req, res, next);
    } else {
      log.info(`No header poison injection rules for ${req.url}`);
      return next();
    }
  });
  app.use(httpProxy({
    target: "http://httpbin.org",
    changeOrigin: true,
    logLevel: "warn",
    logProvider: () => log,
    router: req => {
      if (req.socket.fitServer) {
        return `http://${req.socket.fitServer.target}`;
      } else {
        const url = new URL(req.url);
        url.pathname = '';
        return url;
      }
    }
  }));

  return app;
};