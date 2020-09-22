const fetch = require('node-fetch');

/* global globalThis */

if (!globalThis.fetch) {
    globalThis.fetch = fetch;
    globalThis.Headers = fetch.Headers;
}

const fa = require('fetchagent');

module.exports = client;

function client({ token }) {
  const apiUrlPrefix = 'https://api.cloudflare.com/client/v4/zones';
  const authorization = `Bearer ${token}`;

  async function switchToService(domain, good) {
    const zone = await getZone(domain);
    const record = await getRecord(zone.id, domain);
    await updateRecord(zone.id, record.id, good);
  }

  async function listRecords(zoneName, domain) {
    const zone = await getZone(zoneName);
    return await getRecord(zone.id, domain);
  }

  async function getZone(domain) {
    const { success, errors, messages, result } = await fa
      .get(apiUrlPrefix)
      .query({
        name: domain,
        status: 'active'
      })
      .set('Authorization', authorization)
      .json();

    if (!success) {
      throw new Error(errors[0]);
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
      throw new Error(errors[0]);
    }

    if (result.length !== 1) {
      throw new Error(`Need exactly one result - got ${result.length}`);
    }

    return result[0];
  }

  async function updateRecord(zoneId, recordId, domain, good) {
    const { success, errors, messages, result } = await fa
      .put(`${apiUrlPrefix}/${zoneId}/dns_records/${recordId}`)
      .send({
        name: domain,
        content: good.server,
        type: 'CNAME'
      })
      .set('Authorization', authorization)
      .json();

    if (!success) {
      throw new Error(errors[0]);
    }
  }

  return {
    switchToService,
    listRecords
  };
}