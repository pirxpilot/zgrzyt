import { parseDomain, fromUrl } from 'parse-domain';
import makeClient from './cloudflare.js';

export default prepareConfig;

function getDomainAndZone({ url, domain: apiDomain }) {
  if (!apiDomain) {
    apiDomain = fromUrl(url);
  }
  const { subDomains, domain, topLevelDomains } = parseDomain(apiDomain);
  return {
    domain: [...subDomains, domain, ...topLevelDomains].join('.'),
    zone: [domain, ...topLevelDomains].join('.')
  };
}

function prepareConfig(config) {
  const {
    cloudflare,
    api = {},
    cluster = {}
  } = config;

  if (!cloudflare?.token) {
    console.error('Cloudflare API token not configured');
    return;
  }
  if (typeof cloudflare.timeout === 'string') {
    cloudflare.timeout = parseInt(cloudflare.timeout);
  }
  if (typeof cloudflare.retry === 'string') {
    cloudflare.retry = parseInt(cloudflare.retry);
  }

  // collect all APIs
  const apis = [
    api,
    ...Object.values(api).filter(v => typeof v.url === 'string')
  ].filter(Boolean);

  const client = makeClient(cloudflare);

  return apis.map(decorateApi).filter(Boolean);

  function decorateApi(api) {
    if (!api.url) {
      // skip apis for which we do not have URL
      return;
    }

    const { domain, zone } = getDomainAndZone(api);
    const timeout = parseInt(api.timeout || config.timeout, 10) || 250;
    const retry = parseInt(api.retry || config.retry, 10) || 2;
    const force = 'force' in api ? api.force : config.force;
    const repair = parseInt(api.repair || config.repair, 10) || 5;

    const { servers } = api.cluster in cluster ? cluster[api.cluster] : config;
    if (!servers || !servers.length) {
      console.error('Servers for %s not configured', api.url);
      return;
    }

    if (api.header && !Array.isArray(api.header)) {
      api.header = [api.header];
    }
    const headers = (api.header || []).reduce((headers, str) => {
      const [name, value] = str.split('=', 2);
      headers[name] = value;
      return headers;
    }, {});

    return {
      servers,
      api: {
        url: api.url,
        method: api.method || 'HEAD',
        headers,
        timeout,
        retry,
        domain,
        zone
      },
      client,
      force,
      repair
    };

  }
}
