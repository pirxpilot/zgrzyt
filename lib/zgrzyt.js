import { checkServices } from './check.js';

export async function zgrzyt({ servers, api, client, force, repair }) {
  const { domain, zone, proxied } = api;
  const record = await client.listRecords(zone, domain);
  const good = await checkServices(servers, record.content, api, {
    force,
    repair
  });
  const result = {
    url: api.url,
    domain,
    record,
    good
  };
  if (!good) {
    return result;
  }
  good.proxied = proxied ?? record.proxied;
  // need to switch if different good server is found or different proxied setting
  if (good.server !== record.content || good.proxied !== record.proxied) {
    result.switched = await client.switchToService(zone, domain, good);
  }
  return result;
}
