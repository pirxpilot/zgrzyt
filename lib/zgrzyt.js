
const { checkServices } = require('./check');

module.exports = zgrzyt;


async function zgrzyt({ servers, api, client, force }) {
  const { domain, zone } = api;
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
