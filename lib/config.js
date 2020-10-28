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

function prepareConfig({ servers, api, cloudflare, force }) {
  if (!cloudflare || !cloudflare.token) {
    console.error('Cloudflare API token not configured');
    return;
  }
  const client = makeClient(cloudflare);


  if (!api || !api.url) {
    console.error('API URL not configured');
    return;
  }

  const { domain, zone } = getDomainAndZone(api);

  const timeout = parseInt(api.timeout, 10);
  api.timeout = timeout || 250;
  api.domain = domain;
  api.zone = zone;

  return [{
    servers,
    api,
    client,
    force
  }];
}
