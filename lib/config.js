import { fromUrl, parseDomain } from 'parse-domain';
import makeClient from './cloudflare.js';

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

export default function prepareConfig(config) {
  const { cloudflare, api = {}, cluster = {} } = config;

  if (!cloudflare?.token) {
    console.error('Cloudflare API token not configured');
    return;
  }
  if (typeof cloudflare.timeout === 'string') {
    cloudflare.timeout = Number.parseInt(cloudflare.timeout, 10);
  }
  if (typeof cloudflare.retry === 'string') {
    cloudflare.retry = Number.parseInt(cloudflare.retry, 10);
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
    const timeout = Number.parseInt(api.timeout || config.timeout, 10) || 250;
    const retry = Number.parseInt(api.retry || config.retry, 10) || 2;
    const force = 'force' in api ? api.force : config.force;
    const proxied = 'proxied' in api ? api.proxied : config.proxied;
    const repair = Number.parseInt(api.repair || config.repair, 10) || 5;
    const ipv6 = Boolean(api.ipv6 ?? config.ipv6);
    const ipv4 = Boolean(api.ipv4 ?? config.ipv4 ?? true);

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
        proxied,
        method: api.method || 'HEAD',
        headers,
        timeout,
        retry,
        domain,
        ipv4,
        ipv6,
        zone
      },
      client,
      force,
      repair
    };
  }
}
