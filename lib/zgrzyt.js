
const { checkServices } = require('./check');

module.exports = zgrzyt;


async function zgrzyt({ servers, api, client, force, repair }) {
  const { domain, zone } = api;
  const record = await client.listRecords(zone, domain);
  const good = await checkServices(servers, record.content, api, { force, repair });
  const result = {
    url: api.url,
    domain,
    record,
    good
  };
  if (good && good.server !== record.content) {
    result.switched = await client.switchToService(zone, domain, good);
  }
  return result;
}
