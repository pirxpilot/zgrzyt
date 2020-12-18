const test = require('tape');
const ini = require('ini');
const { readFileSync } = require('fs');

const prepareConfig = require('../lib/config');

test('config should require cloudflare.token', function (t) {
  const apis = prepareConfig({});
  t.notOk(apis, 'Invalid config needs to render empty APIs list');
  t.end();
});

test('config should require api.url', function (t) {
  const apis = prepareConfig({
    cloudflare: { token: 'abc' }
  });
  t.equal(0, apis.length, 'Invalid config needs to render empty APIs list');
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
    retry: 2,
    domain: 'api.example.net',
    zone: 'example.net',
    method: 'HEAD'
  });
  t.deepEqual(api.servers, ['alpha.example.com', 'beta.example.com']);

  t.end();
});

test('multi config', function (t) {
  const iniStr = readFileSync(`${__dirname}/fixtures/multi.ini`, 'utf-8');
  const conf = ini.parse(iniStr);

  const apis = prepareConfig(conf);

  t.equal(apis.length, 3, '3 APIs configured');
  const [ d, one, two ] = apis;
  t.deepEqual(d.servers, [ 'a.example.com', 'b.example.com' ]);
  t.deepEqual(d.api, {
    url: 'https://api.example.org',
    timeout: 350,
    retry: 3,
    domain: 'api.example.org',
    zone: 'example.org',
    method: 'HEAD'
  });
  t.notOk(d.force);

  t.deepEqual(one.servers, ['a.example.com', 'b.example.com']);
  t.deepEqual(one.api, {
    url: 'https://one.example.com/status',
    timeout: 250,
    retry: 4,
    domain: 'one.example.com',
    zone: 'example.com',
    method: 'GET'
  });
  t.notOk(one.force);

  t.deepEqual(two.servers, ['a.example.net', 'b.example.net']);
  t.deepEqual(two.api, {
    url: 'https://two.example.net',
    timeout: 250,
    retry: 3,
    domain: 'example.net',
    zone: 'example.net',
    method: 'HEAD'
  });
  t.equal(two.force, true);

  t.end();
});
