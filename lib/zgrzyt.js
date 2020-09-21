const { checkServices } = require('./check');
const { resolve, switchToService } = require('./dns');

module.exports = zgrzyt;

async function zgrzyt({ domain, servers, api }) {
  const selectedAddress = await resolve(domain);
  const good = await checkServices(servers, selectedAddress, api);
  if (!good) {
    console.error('none of the servers is up at the moment');
  }
  if (good.address !== selectedAddress) {
    return switchToService(domain, good);
  } else {
    console.log('Not changing anything. Good servers is', good.server);
  }
}
