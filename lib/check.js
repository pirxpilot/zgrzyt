const dns = require('dns');
const { get, Agent } = require('https');

const { Resolver } = dns.promises;
const resolver = new Resolver();

module.exports = {
  checkServices
};

async function checkService(server, api) {
  const addresses = await resolver.resolve4(server) ;
  console.log('Resolved', server, addresses);
  return {
    address: addresses[0],
    server,
    ok: await checkApi(api, addresses[0])
  };
}

async function checkApi({ url }, address) {
  console.log('try checking',  url, address);

  const agent = new Agent({
    lookup: makeLookup(address)
  });
  return new Promise((resolve) => {
    const req = get(url, { agent }, res => resolve(isOk(res)));
    req.on('error', () => resolve(false));
    req.end();
  });

  function isOk({ statusCode }) {
    return statusCode >= 200 && statusCode < 300;
  }

  function makeLookup(address) {
    return function lookup(domain, options, fn) {

      console.log('Lookup', domain);
      return fn(null, address, 4);
    };
  }
}

async function checkServices(servers, selected, api) {
  const items = await Promise.all(servers.map(s => checkService(s, api)));
  console.log(items);
  const okItems = items.filter(item => item.ok);
  const best = okItems.find(item => item.address === selected);
  return best ? best : okItems[0];
}

