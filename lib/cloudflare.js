const fetch = require('node-fetch');
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
    const { success, errors, result } = await fa
      .get(apiUrlPrefix)
      .query({
        name: domain,
        status: 'active'
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

  async function getRecord(zoneId, domain) {
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
