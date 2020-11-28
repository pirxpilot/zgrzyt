const fetch = require('node-fetch');
const promiseRateLimit = require('promise-ratelimit');
const debug = require('debug')('zgrzyt:cloudflare');

/* global globalThis */

if (!globalThis.fetch) {
    globalThis.fetch = fetch;
    globalThis.Headers = fetch.Headers;
}
if (!globalThis.Blob) {
    globalThis.Blob = class Blob {};
}
if (!globalThis.FormData) {
    globalThis.FormData = class FormData {};
}

const fa = require('fetchagent');

module.exports = client;

class CloudflareError extends Error {
  constructor(errors) {
    super(`Cloudflare API error: ${errors[0].message}`);
  }
}

function client({ token }) {
  const apiUrlPrefix = 'https://api.cloudflare.com/client/v4/zones';
  const authorization = `Bearer ${token}`;
  const throttle = promiseRateLimit(200);
  const cacheZones = Object.create(null);
  let pZones;

  async function switchToService(zoneName, domain, good) {
    const zone = await getZone(zoneName);
    const record = await getRecord(zone.id, domain);
    if (record.type === 'CNAME') {
      return updateRecord(zone.id, record.id, record.proxied, domain, good);
    } else {
      console.error('Cannot only update CNAME records');
    }
  }

  async function listRecords(zoneName, domain) {
    const zone = await getZone(zoneName);
    return await getRecord(zone.id, domain);
  }

  async function getZone(domain) {
    debug('Getting zone for %s', domain);

    let zone = cacheZones[domain];
    if (zone) {
      return zone;
    }
    if (!pZones) {
      pZones = listZones();
    }
    zone = (await pZones).find(z => z.name === domain);
    if (!zone) {
      throw new Error('Cannot find zone for %s', domain);
    }
    cacheZones[domain] = zone;
    return zone;
  }

  async function listZones() {
    await throttle();
    debug('Listing zones...');
    const { success, errors, result } = await fa
      .get(apiUrlPrefix)
      .query({
        status: 'active'
      })
      .set('Authorization', authorization)
      .json();

    if (!success) {
      throw new CloudflareError(errors);
    }

    debug('Listing zones done.');
    return result;
  }

  async function getRecord(zoneId, domain) {
    await throttle();
    const { success, result, errors } = await fa
    .get(`${apiUrlPrefix}/${zoneId}/dns_records`)
      .query({
        name: domain,
        type: 'CNAME'
      })
      .set('Authorization', authorization)
      .json();

    if (!success) {
      throw new CloudflareError(errors);
    }

    if (result.length !== 1) {
      throw new Error(`Need exactly one result - got ${result.length}`);
    }

    return result[0];
  }

  async function updateRecord(zoneId, recordId, proxied, domain, good) {
    await throttle();
    const { success, errors, result } = await fa
      .put(`${apiUrlPrefix}/${zoneId}/dns_records/${recordId}`)
      .send({
        name: domain,
        proxied,
        content: good.server,
        type: 'CNAME'
      })
      .set('Authorization', authorization)
      .json();

    debug('Update record', success, errors, result);

    if (!success) {
      throw new CloudflareError(errors);
    }

    return success;
  }

  return {
    switchToService,
    listRecords
  };
}
