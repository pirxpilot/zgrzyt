const http = require('http');
const https = require('https');
const debug = require('debug')('zgrzyt:check');

const { resolve } = require('./dns');

const {
  name,
  version,
  homepage = 'https://github.com/pirxpilot/zgrzyt'
} = require('../package.json');

const USER_AGENT = `${name}/${version} (${homepage})`;

/* global URL */

module.exports = {
  checkServices
};

async function checkService(server, api) {
  const address = await resolve(server) ;
  debug('Resolved %s to %s', server, address);
  const ok = await checkApi(api, address);
  server.health = ok ? server.health + 1 : 0;
  return {
    address,
    server,
    ok
  };
}

async function checkApi({ url, timeout, method = 'HEAD', retry = 2 }, address) {
  debug('Checking %s on %s with timeout %dms', url, address, timeout);

  const { protocol } = new URL(url);
  const { request, Agent } = 'https:' === protocol ? https : http;

  const agent = new Agent({
    lookup: makeLookup(address)
  });

  let result;
  do {
    result = await makeRequest();
    if (result) {
      break;
    }
    await waitRandom(timeout);
  } while(--retry);

  return result;

  function makeRequest() {
    return new Promise(resolve => request(url, {
      method,
      agent,
      timeout,
      headers: { 'User-Agent': USER_AGENT }
    })
    .on('timeout', function () {
      debug('Timeout for %s on %s', url, address);
      this.destroy(new Error('Request timeout.'));
    })
    .on('response', res => resolve(isOk(res)))
    .on('error', () => resolve(false))
    .end());

    function isOk({ statusCode }) {
      const ok = statusCode >= 200 && statusCode < 300;
      debug('Result for %s on %s is %s', url, address, ok);
      return ok;
    }
  }

  function makeLookup(address) {
    return (domain, options, fn) => fn(null, address, 4);
  }
}

async function checkServices(servers, selected, api, { force, repair }) {
  const items = await Promise.all(servers.map(s => checkService(s, api)));
  const okItems = items.filter(item => item.ok);
  if (force) {
    return okItems[0];
  }
  if (repair && okItems[0].server.health >= repair) {
    return okItems[0];
  }
  const best = okItems.find(item => item.server === selected);
  return best ? best : okItems[0];
}

function waitRandom(millisMax) {
  const millis = Math.floor(millisMax * Math.random());
  return new Promise(resolve => setTimeout(resolve, millis));
}
