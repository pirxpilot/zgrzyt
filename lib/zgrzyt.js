
const { checkServices } = require('./check');

module.exports = zgrzyt;


async function zgrzyt({ servers, api, client, force }) {
  const { domain, zone } = api;
  const record = await client.listRecords(zone, domain);
  const good = await checkServices(servers, record.content, api, force);
  if (!good) {
    console.error('None of the servers is up at the moment for %s', api.url);
    return;
  }
  if (good.server === record.content) {
    console.log(' Not changing anything. Good server for %s is %s with address %s.',
      record.name, good.server, good.address);
    return;
  }
  console.log('Switching %s from %s to %s with address %s',
    domain, record.content, good.server, good.address);
  client.switchToService(zone, domain, good);
}
