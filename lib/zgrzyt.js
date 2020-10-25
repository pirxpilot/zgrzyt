const { parseDomain, fromUrl } = require('parse-domain');

const { checkServices } = require('./check');
const makeClient = require('./cloudflare');

module.exports = zgrzyt;

function getDomainAndZone({ url }) {
  const { subDomains, domain, topLevelDomains } = parseDomain(fromUrl(url));
  return {
    domain: [...subDomains, domain, ...topLevelDomains ].join('.'),
    zone: [ domain, ...topLevelDomains ].join('.')
  };
}

async function zgrzyt({ servers, api, cloudflare, force }) {
  const { domain, zone } = getDomainAndZone(api);
  const client = makeClient(cloudflare);
  const record = await client.listRecords(zone, domain);
  console.log('Selected server for %s is %s', record.name, record.content);
  const good = await checkServices(servers, record.content, api, force);
  console.log('Good server for %s is %s with address %s', record.name, good.server, good.address);
  if (!good) {
    console.error('None of the servers is up at the moment');
  }
  if (good.server !== record.content) {
    console.log('Switching %s to %s', domain, good.server);
    return client.switchToService(zone, domain, good);
  } else {
    console.log('Good servers is %s. Not changing anything.', good.server);
  }
}
