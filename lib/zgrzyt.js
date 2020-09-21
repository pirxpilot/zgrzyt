const { parseDomain, fromUrl } = require('parse-domain');

const { checkServices } = require('./check');
const { resolve } = require('./dns');
const makeClient = require('./cloudflare');

module.exports = zgrzyt;

function getDomainAndZone({ url }) {
  const { subDomains, domain, topLevelDomains } = parseDomain(fromUrl(url));
  return {
    domain: [...subDomains, domain, ...topLevelDomains ].join('.'),
    zone: [ domain, ...topLevelDomains ].join('.')
  };
}

async function zgrzyt({ servers, api, cloudflare }) {
  const { domain, zone } = getDomainAndZone(api);
  const client = makeClient(cloudflare);
  const records = await client.listRecords(zone, domain);
  console.log('Selected server %s for %s', records.content, records.name);
  const selectedAddress = await resolve(domain);
  const good = await checkServices(servers, selectedAddress, api);
  if (!good) {
    console.error('none of the servers is up at the moment');
  }
  if (good.address !== selectedAddress) {
    console.log('Switching %s to %s', domain, good);
    return client.switchToService(domain, good);
  } else {
    console.log('Good servers is %s. Not changing anything.', good.server);
  }
}
