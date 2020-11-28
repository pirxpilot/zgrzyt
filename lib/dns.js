const { Resolver } = require('dns').promises;
const resolver = new Resolver();

const debug = require('debug')('dns:zgrzyt');

module.exports = {
  resolve
};

const cache = Object.create(null);

function resolve(domain) {
  let p = cache[domain];
  if (!p) {
    cache[domain] = p = doResolve(domain);
  }
  return p;
}

async function doResolve(domain) {
  debug('Resolving %s', domain);
  // const r6 = await resolver.resolve6(domain);
  const [ addr4 ] = await resolver.resolve4(domain);
  return addr4;
}
