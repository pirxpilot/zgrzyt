[![NPM version][npm-image]][npm-url]
[![Build Status][build-image]][build-url]

# zgrzyt

Poor man's load balancing DNS switcher.

## Install

```sh
$ npm install --global zgrzyt
```

## Usage

Zgrzyt assumes that you have two or more servers (`alfa` and `beta` in our below) configured to serve an API or a web site (`example.com`). It also assumes that you are using [Cloudflare DNS] to configure CNAME records for `example.com` to point to either `alfa` or `beta` servers.

Zgrzyt will poll all configured servers and will ensure that CNAME record points to the server that responds (HTTP 2xx code) to the poll.

```sh

# using command line only
zgrzyt --servers alfa.example.net --servers alfa.example.net --api.url  https://example.com --cloudflare.token XXXX

# using config only but forcing the first responding server to become the active one
zgrzyt --force

```

## Configuration


`zgrzyt` is using [rc] package to read its config - you can keep one or more config files in the standard places described in `rc` documentation (such as `/etc/zgrzytrc` or `/etc/zgrzyt/config`). You can pass one or more locations using `--config` parameter.

```ini
; list of potential servers configured for this domain CNAME record
servers[]=alfa.example.net
servers[]=beta.example.net

[cloudflare]
; cloudflare API token
token=XXXXXX

[api]
; API URL to be tested on each of the servers
url=https://api.example.net/status
timeout=250        ; optional, in millis
retry=2            ; optional, by default zgrzyt retries 2 times before assuming API endpoint is down 
domain=example.net ; optional, domain for which zgrzyt will update DNS record
method=HEAD        ; optional, HTTP method used by zgrzyt
```

If `api.domain` is not specified its value is deduced from `api.url`.
If `api.method` is not specified zgrzyt will send `HEAD` requests to poll the servers. `api.method` can be set to `GET` if needed. `retry` and `timeout` can be either configured globally or separately for each API.

### Multiple checks

It's possible to check multiple domains from a single config

```ini
[api.one]
url=https://one.example.net/status

[api.two]
url=https://two.example.net/status
```

Each API can specify its own list of servers (presumably different from the default list of servers) using cluster parameter.

```ini
[cluster.europe]
servers[]=berlin.example.com
servers[]=warsaw.example.com

[api.one]
url=https://one.example.net/status
cluster=europe
```

## License

MIT © [Damian Krzeminski](https://pirxpilot.me)

[rc]: https://www.npmjs.com/package/rc
[Cloudflare DNS]: https://www.cloudflare.com/dns/

[npm-image]: https://img.shields.io/npm/v/zgrzyt
[npm-url]: https://npmjs.org/package/zgrzyt

[build-url]: https://github.com/pirxpilot/zgrzyt/actions/workflows/check.yaml
[build-image]: https://img.shields.io/github/actions/workflow/status/pirxpilot/zgrzyt/check.yaml?branch=main
