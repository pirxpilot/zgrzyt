const conf = require('rc')('zgrzyt', {
  domain: '',
  services: [],
  timeout: 250
});

const zgrzyt = require('./lib/zgrzyt');
zgrzyt(conf);
