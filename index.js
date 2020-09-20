const conf = require('rc')('zgrzyt', {
  domain: '',
  services: [],
  api: {
    timeout: 250
  }
});


if (!conf.domain) {
  console.error('Domain needs to be specified');
}

const zgrzyt = require('./lib/zgrzyt');
zgrzyt(conf);
