const conf = require('rc')('zgrzyt', {
  services: [],
  api: {
    timeout: 250
  }
});


if (!conf.api.url) {
  console.error('API URL needs to be specified');
}

const zgrzyt = require('./lib/zgrzyt');
zgrzyt(conf);
