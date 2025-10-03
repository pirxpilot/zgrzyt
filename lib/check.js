import http from 'node:http';
import https from 'node:https';
import makeDebug from 'debug';

const debug = makeDebug('zgrzyt:check');

import packageJson from '../package.json' with { type: 'json' };
import { resolve } from './dns.js';
import { updateHealth } from './state.js';

const {
  name,
  version,
  homepage = 'https://github.com/pirxpilot/zgrzyt'
} = packageJson;

const USER_AGENT = `${name}/${version} (${homepage})`;

/* global URL */

export { checkServices };

async function checkService(server, api) {
  const { ipv4 = true, ipv6 = false } = api;
  const addresses = await resolve(server, { ipv4, ipv6 });
  if (debug.enabled) {
    debug(
      'Resolved %s to %s',
      server,
      addresses.map(a => a.address).join(', ')
    );
  }
  const oks = await Promise.all(addresses.map(a => checkApi(api, a)));
  // collate results
  const ok = oks.every(ok => ok);
  const health = await updateHealth(api, server, ok);
  return {
    address: addresses[0].address,
    server,
    health,
    ok
  };
}

async function checkApi(api, { address, family }) {
  const { url, method = 'HEAD', timeout = 5000, headers = {} } = api;

  debug('Checking %s on %s with timeout %dms', url, address, timeout);

  const { protocol } = new URL(url);
  const { request } = 'https:' === protocol ? https : http;

  let result;
  let retry = api.retry || 3;
  do {
    result = await makeRequest();
    if (result) {
      break;
    }
    await waitRandom(timeout);
  } while (--retry);

  return result;

  function makeRequest() {
    return new Promise(resolve =>
      request(url, {
        method,
        family,
        lookup,
        timeout,
        headers: {
          'User-Agent': USER_AGENT,
          ...headers
        }
      })
        .on('timeout', function () {
          debug('Timeout for %s on %s', url, address);
          this.destroy(new Error('Request timeout.'));
        })
        .on('response', res => resolve(isOk(res)))
        .on('error', e => {
          debug('request error:', e);
          resolve(false);
        })
        .end()
    );

    function isOk({ statusCode }) {
      const ok = statusCode >= 200 && statusCode < 300;
      debug('Result for %s on %s is %s', url, address, ok);
      return ok;
    }
  }

  function lookup(domain, options, fn) {
    debug('lookup', domain, address, options);
    if (options.all) {
      address = [address];
    }
    setImmediate(fn, null, address, options.family);
  }
}

async function checkServices(servers, selected, api, { force, repair }) {
  const items = await Promise.all(servers.map(s => checkService(s, api)));
  const okItems = items.filter(item => item.ok);
  if (okItems.length === 0) {
    return;
  }
  if (force) {
    return okItems[0];
  }
  if (repair && okItems[0].health >= repair) {
    return okItems[0];
  }
  const best = okItems.find(item => item.server === selected);
  return best ? best : okItems[0];
}

function waitRandom(millisMax) {
  const millis = Math.floor(millisMax * Math.random());
  return new Promise(resolve => setTimeout(resolve, millis));
}
