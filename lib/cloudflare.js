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

  async function switchToService(domain, good) {
    const zoneId = await getZone(domain);
    const recordId = await getRecord(zoneId, domain);
    await updateRecord(zoneId, recordId, good);
  }

  async function listRecords(zone, domain) {
    try {
      const zoneId = await getZone(zone);
      return await getRecord(zoneId, domain);
    }
    catch(e) {
      console.log(e);
    }
  }

  async function getZone(domain) {
    const { success, errors, messages, result } = await fa
      .get(apiUrlPrefix)
      .query({
        name: domain,
        status: 'active'
      })
      .set('Authorization', `Bearer ${token}`)
      .json();

    if (!success) {
      throw new Error(errors[0]);
    }

    if (result.length !== 1) {
      throw new Error(`Need exactly one result - got ${result.length}`);
    }

    return result[0].id;
  }

  async function getRecord(zoneId, domain) {
    const { success, result, errors } = await fa
      .get(`${apiUrlPrefix}/${zoneId}/dns_records`)
      .query({
        name: domain,
        type: 'CNAME'
      })
      .set('Authorization', `Bearer ${token}`)
      .json();

    console.log(success, errors, result);

    if (!success) {
      throw new Error(errors[0]);
    }

    if (result.length !== 1) {
      throw new Error(`Need exactly one result - got ${result.length}`);
    }

    return result[0].id;
  }

  async function updateRecord(zoneId, recordId, domain, good) {
    const { success, errors, messages, result } = await fa
      .put(`${apiUrlPrefix}/${zoneId}/dns_records/${recordId}`)
      .send({
        name: domain,
        content: good.server,
        type: 'CNAME'
      })
      .set('Authorization', `Bearer ${token}`)
      .json();

    console.log(success, errors, result, messages);

    if (!success) {
      throw new Error(errors[0]);
    }
  }

  return {
    switchToService,
    listRecords
  };

}
