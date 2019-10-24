const { checkServices } = require('./check');
const { getSelectedService, switchToService } = require('./dns');

module.exports = zgrzyt;

async function zgrzyt({ domain, services, timeout }) {
  const good = await checkServices(services, timeout);
  const selected = await getSelectedService(domain);
  if (good && selected !== good) {
    return switchToService(domain, good);
  }
}
