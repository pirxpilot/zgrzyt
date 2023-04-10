import { Resolver } from 'node:dns/promises';
import makeDebug from 'debug';

const resolver = new Resolver();
const debug = makeDebug('dns:zgrzyt');

const cache = Object.create(null);

export function resolve(domain) {
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
