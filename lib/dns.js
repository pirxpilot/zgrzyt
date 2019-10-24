const { Resolver } = require('dns').promises;
const resolver = new Resolver();

module.exports = {
  getSelectedService,
  switchToService
};

async function getSelectedService(domain) {
  await resolver.resolve6('mahi.code42day.com');
  await resolver.resolve4('mahi.code42day.com');
  console.log(domain);
  return 'selected';
}

async function switchToService(domain, good) {
  console.log('switching', domain, good);
}
