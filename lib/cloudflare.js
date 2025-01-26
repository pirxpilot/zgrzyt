import makeDebug from 'debug';

const debug = makeDebug('zgrzyt:cloudflare');

export default client;

/* global AbortController, fetch, URLSearchParams */

class CloudflareError extends Error {
  constructor(errors) {
    super(`Cloudflare API error: ${errors[0].message}`);
  }
}

function makeFetch({ token, timeout, retry }) {
  const authorization = `Bearer ${token}`;
  return {
    put: (...args) => retryFetch('PUT', ...args),
    get: (...args) => retryFetch('GET', ...args)
  };

  async function retryFetch(...args) {
    while (true) {
      try {
        return await doFetch(...args);
      } catch (err) {
        if (--retry <= 0) {
          throw err;
        }
      }
    }
  }

  async function doFetch(method, command, { searchParams, json }) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    const url = new URL(command, 'https://api.cloudflare.com/client/v4/');
    if (searchParams) {
      url.search = new URLSearchParams(searchParams);
    }
    const options = {
      method,
      headers: { authorization },
      signal: controller.signal
    };
    if (json) {
      options.headers['Content-Type'] = 'application/json';
      options.body = JSON.stringify(json);
    }
    const res = await fetch(url, options);
    clearTimeout(id);
    return res.json();
  }
}

function client({ token, timeout = 4000, retry = 2 }) {
  const cf = makeFetch({ token, timeout, retry });
  const cacheZones = Object.create(null);
  let pZones;
  return {
    switchToService,
    listRecords
  };

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
      throw new Error(`Cannot find zone for ${domain}`);
    }
    cacheZones[domain] = zone;
    return zone;
  }

  async function listZones() {
    const zones = [];

    async function getPage(page) {
      debug('Getting page %d', page);
      const {
        success,
        errors,
        result,
        result_info
      } = await cf.get('zones', {
        searchParams: {
          status: 'active',
          page,
          per_page: 50 // max value
        }
      });

      if (!success) {
        throw new CloudflareError(errors);
      }

      zones.push(...result);
      return zones.length < result_info.total_count;
    }

    debug('Listing zones...');
    for (let page = 1; await getPage(page); page++) { }
    debug('Listing zones done.');

    return zones;
  }

  async function getRecord(zoneId, domain) {
    const { success, result, errors } = await cf.get(`zones/${zoneId}/dns_records`, {
      searchParams: {
        name: domain,
        type: 'CNAME'
      }
    });

    if (!success) {
      throw new CloudflareError(errors);
    }

    if (result.length !== 1) {
      throw new Error(`Need exactly one result - got ${result.length}`);
    }

    return result[0];
  }

  async function updateRecord(zoneId, recordId, proxied, domain, good) {
    const { success, errors, result } = await cf.put(`zones/${zoneId}/dns_records/${recordId}`, {
      json: {
        name: domain,
        proxied,
        content: good.server,
        type: 'CNAME'
      }
    });

    debug('Update record', success, errors, result);

    if (!success) {
      throw new CloudflareError(errors);
    }

    return success;
  }
}
