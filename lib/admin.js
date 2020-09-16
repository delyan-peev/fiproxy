'use strict';

const express = require('express');
const serveStatic = require('serve-static');
const log = require('./log');
const bodyParser = require('body-parser');
const toxy = require('toxy');

exports = module.exports = function manage({ proxy, serverPort }) {
  const app = express();

  app.use(bodyParser.json());
  app.use(serveStatic('web/'));

  const expireTable = {};

  app.get('/poisons', (req, res) => {
    log.info('Getting poisons');

    res.json(
      proxy.routes
        .filter(route => route.unregistered !== true)
        .map(route => {
          return {
            id: route.id,
            path: route.path,
            rules: route.getRules(),
            poisons: route.getPoisons(),
            expireDate: expireTable[route.id]
          };
        }));
  });

  /**
   * {
   *  "api": "/test/**",
   *  "duration": 300000,
   *  "probability": 50,
   *  "poison": {
   *    "type": "abort",
   *    "delay": 100
   *  }
   * }
   */
  app.post('/poisons', (req, res) => {
    log.info(`Creating poison ${JSON.stringify(req.body)}`);

    const matchingRoutes = proxy.routes
      .filter(route => (route.unregistered !== true) && (route.path === req.body.api));

    if (matchingRoutes.length !== 0) {
      res.statusCode = 409;
      res.end('Route alredy exists');
      return;
    }

    let poison;
    if (req.body.poison.type === 'abort') {
      poison = toxy.poisons.abort({ delay: req.body.poison.delay || 0});
    } else if (req.body.poison.type === 'latency') {
      poison = toxy.poisons.latency({ jitter: req.body.poison.latency || 1000 });
    } else if (req.body.poison.type === 'bandwidth') {
      poison = toxy.poisons.bandwidth({
          bytes: req.body.poison.chunk || 1,
          threshold: req.body.poison.bandwidthdelay || 100
      });
    } else if (req.body.poison.type === 'response') {
      const contentType = req.body.poison.contenttype || 'application/json';
      const code = req.body.poison.code || 500;
      const body = req.body.poison.body || "";
      poison = toxy.poisons.inject({
          code: code,
          headers: {'Content-Type': contentType},
          body: body
      });
    } else {
      res.end(`Not understood poison ${req.body.poison}`);
      return;
    }

    proxy
      .all(req.body.api)
      .poison(poison)
      .rule(toxy.rules.probability(req.body.probability || 100))
      .use((req, res, next) => {
        req.rocky.options.target = req.url;
        log.info(`Routing request ${req.url} to target server.`);
        next();
      });

    const id = proxy.routes
      .filter(route => route.path === req.body.api)[0].id;

    log.info('Created poison', req.body);

    res
      .status(201)
      .json({ id, api: req.body.api });   
    const today = new Date()
    today.setMilliseconds(today.getMilliseconds() + req.body.duration);
    expireTable[id] = today.toISOString();
    setTimeout(() => unregisterPoison(id, proxy), req.body.duration);
  });

  app
    .delete('/poisons/:id', (req, res) => {
      log.info('Deleting poison', req.params.id);

      unregisterPoison(req.params.id, proxy);
      res.statusCode = 204;
      res.end();
    });


  function unregisterPoison(id, proxy) {
    log.info(`Poison deleting ${id}`);

    proxy
      .routes
      .filter(route => route.id === id)
      .forEach(route => route.unregister());
    
    delete expireTable[id];
    log.info(`Poison unregistered ${id}`, expireTable);
  }

  app.listen(serverPort, () => {
    log.info(`Admin REST API on ${serverPort}`);
  });
}
