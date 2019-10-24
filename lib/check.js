const { Resolver } = require('dns').promises;
const resolver = new Resolver();

module.exports = {
  checkServices
};

async function checkServices(services, timeout) {
  await resolver.resolve6('mahi.code42day.com');
  await resolver.resolve4('mahi.code42day.com');
  console.log(services, timeout);
  return 'good';
}
