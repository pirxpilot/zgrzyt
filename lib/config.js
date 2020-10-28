const { parseDomain, fromUrl } = require('parse-domain');
const makeClient = require('./cloudflare');

module.exports = prepareConfig;

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
    force,
    cluster = {}
  } = config;

  if (!cloudflare || !cloudflare.token) {
    console.error('Cloudflare API token not configured');
    return;
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
      console.error('API URL not configured');
      return;
    }

    const { domain, zone } = getDomainAndZone(api);
    const timeout = parseInt(api.timeout, 10) || 250;

    const { servers } = api.cluster in cluster ? cluster[api.cluster] : config;
    if (!servers || !servers.length) {
      console.error('Servers for %s not configured', api.url);
      return;
    }

    return {
      servers,
      api: {
        url: api.url,
        timeout,
        domain,
        zone
      },
      client,
      force
    };

  }


}
