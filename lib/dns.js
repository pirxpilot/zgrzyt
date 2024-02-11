import { Resolver } from 'node:dns/promises';
import makeDebug from 'debug';

const debug = makeDebug('dns:zgrzyt');

const cache = Object.create(null);

const resolver = new Resolver();

/**
 * Resolve domain to IP addresses
 *
 * @param {String} domain
 * @returns {Promise<Array<{address: String, family: String}>>} list of resolved addresses
 */
export function resolve(domain) {
  let p = cache[domain];
  if (!p) {
    cache[domain] = p = doResolve(domain);
  }
  return p;
}

const RRTYPE_TO_FAMILY = {
  A: 4,
  AAAA: 6
};

async function doResolve(domain) {
  debug('Resolving %s', domain);

  const addresses = await Promise.all(['A', 'AAAA'].map(resolveWithFamily));
  return addresses.flat();

  async function resolveWithFamily(rrtype) {
    try {
      const addresses = await resolver.resolve(domain, rrtype);
      return addresses.map(address => ({ address, family: RRTYPE_TO_FAMILY[rrtype] }));
    } catch (error) {
      debug('Failed to resolve %s with type %s: %s', domain, rrtype, error);
      return [];
    }
  }
}
