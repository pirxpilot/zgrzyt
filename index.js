const conf = require('rc')('zgrzyt');
const prepareConfig = require('./lib/config');
const zgrzyt = require('./lib/zgrzyt');

const apis = prepareConfig(conf);

if (!apis) {
  console.error('Invalid configuration - no APIs to check');
}

Promise
  .all(apis.map(zgrzyt))
  .catch(e => {
    console.error('Errors:', e);
  });
