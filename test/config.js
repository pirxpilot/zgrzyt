import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import ini from 'ini';
import prepareConfig from '../lib/config.js';

test('config should require cloudflare.token', () => {
  const apis = prepareConfig({});
  assert.ok(!apis, 'Invalid config needs to render empty APIs list');
});

test('config should require api.url', () => {
  const apis = prepareConfig({
    cloudflare: { token: 'abc' }
  });
  assert.equal(0, apis.length, 'Invalid config needs to render empty APIs list');
});

test('valid.config should return api list', () => {
  const apis = prepareConfig({
    cloudflare: { token: 'abc' },
    servers: ['alpha.example.com', 'beta.example.com'],
    api: {
      url: 'https://api.example.net/status',
    }
  });
  assert.equal(apis.length, 1, 'single API configured');

  const [api] = apis;
  assert.deepEqual(api.api, {
    url: 'https://api.example.net/status',
    timeout: 250,
    retry: 2,
    domain: 'api.example.net',
    zone: 'example.net',
    method: 'HEAD',
    headers: {}
  });
  assert.deepEqual(api.servers, ['alpha.example.com', 'beta.example.com']);

});

test('multi config', () => {
  const iniStr = readFileSync(new URL('fixtures/multi.ini', import.meta.url), 'utf-8');
  const conf = ini.parse(iniStr);

  const apis = prepareConfig(conf);

  assert.equal(apis.length, 3, '3 APIs configured');
  const [d, one, two] = apis;
  assert.deepEqual(d.servers, ['a.example.com', 'b.example.com']);
  assert.deepEqual(d.api, {
    url: 'https://api.example.org',
    timeout: 350,
    retry: 3,
    domain: 'api.example.org',
    zone: 'example.org',
    method: 'HEAD',
    headers: {}
  });
  assert.ok(!d.force);

  assert.deepEqual(one.servers, ['a.example.com', 'b.example.com']);
  assert.deepEqual(one.api, {
    url: 'https://one.example.com/status',
    timeout: 250,
    retry: 4,
    domain: 'one.example.com',
    zone: 'example.com',
    method: 'GET',
    headers: {
      'x-key': 'abc123'
    }
  });
  assert.ok(!one.force);

  assert.deepEqual(two.servers, ['a.example.net', 'b.example.net']);
  assert.deepEqual(two.api, {
    url: 'https://two.example.net',
    timeout: 250,
    retry: 3,
    domain: 'example.net',
    zone: 'example.net',
    method: 'HEAD',
    headers: {
      referer: 'example.com',
      origin: 'example.net'
    }
  });
  assert.equal(two.force, true);

});
