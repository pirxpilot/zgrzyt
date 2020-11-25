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
  return {
    address,
    server,
    ok: await checkApi(api, address)
  };
}

function checkApi({ url, timeout, method = 'HEAD' }, address) {
  debug('Checking %s on %s with timeout %dms', url, address, timeout);

  const { protocol } = new URL(url);
  const { request, Agent } = 'https:' === protocol ? https : http;

  const agent = new Agent({
    lookup: makeLookup(address)
  });
  return new Promise(resolve => request(url, {
      method,
      agent,
      timeout,
      headers: { 'User-Agent': USER_AGENT }
    })
    .on('response', res => resolve(isOk(res)))
    .on('error', () => resolve(false))
    .end()
  );

  function isOk({ statusCode }) {
    return statusCode >= 200 && statusCode < 300;
  }

  function makeLookup(address) {
    return (domain, options, fn) => fn(null, address, 4);
  }
}

async function checkServices(servers, selected, api, force) {
  const items = await Promise.all(servers.map(s => checkService(s, api)));
  const okItems = items.filter(item => item.ok);
  if (force) {
    return okItems[0];
  }
  const best = okItems.find(item => item.server === selected);
  return best ? best : okItems[0];
}
