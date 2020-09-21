const { Resolver } = require('dns').promises;
const resolver = new Resolver();

module.exports = {
  resolve
};

async function resolve(domain) {
  // const r6 = await resolver.resolve6(domain);
  const r4 = await resolver.resolve4(domain);
  return r4[0];
}
