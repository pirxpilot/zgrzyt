const http = require('http');
const https = require('https');

const { resolve } = require('./dns');

/* global URL */

module.exports = {
  checkServices
};

async function checkService(server, api) {
  const address = await resolve(server) ;
  console.log('Resolved', server, address);
  return {
    address: address,
    server,
    ok: await checkApi(api, address)
  };
}

function checkApi({ url, timeout }, address) {
  console.log('Checking',  url, timeout, address);

  const { protocol } = new URL(url);
  const { get, Agent } = 'https:' === protocol ? https : http;

  const agent = new Agent({
    lookup: makeLookup(address)
  });
  return new Promise(resolve => get(url, { agent, timeout })
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
  const best = okItems.find(item => item.address === selected);
  return best ? best : okItems[0];
}
