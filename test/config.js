const test = require('tape');
const prepareConfig = require('../lib/config');

test('config should require cloudflare.token', function (t) {
  const apis = prepareConfig({});
  t.equal(undefined, apis, 'Invalid config needs to render empty APIs list');
  t.end();
});

test('config should require api.url', function (t) {
  const apis = prepareConfig({
    cloudflare: { token: 'abc' }
  });
  t.equal(undefined, apis, 'Invalid config needs to render empty APIs list');
  t.end();
});

test('valid.config should return api list', function (t) {
  const apis = prepareConfig({
    cloudflare: { token: 'abc' },
    servers: [ 'alpha.example.com', 'beta.example.com' ],
    api: {
      url: 'https://api.example.net/status',
    }
  });
  t.equal(apis.length, 1, 'single API configured');

  const [ api ] = apis;
  t.deepEqual(api.api, {
    url: 'https://api.example.net/status',
    timeout: 250,
    domain: 'api.example.net',
    zone: 'example.net',
  });
  t.deepEqual(api.servers, ['alpha.example.com', 'beta.example.com']);

  t.end();
});
