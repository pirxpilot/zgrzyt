[![NPM version][npm-image]][npm-url]
[![Build Status][travis-image]][travis-url]
[![Dependency Status][deps-image]][deps-url]
[![Dev Dependency Status][deps-dev-image]][deps-dev-url]

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
url=https://trips.furkot.com
timeout=250 ; in millis

```


## License

MIT © [Damian Krzeminski](https://pirxpilot.me)

[rc]: https://www.npmjs.com/package/rc
[Cloudflare DNS]: https://www.cloudflare.com/dns/

[npm-image]: https://img.shields.io/npm/v/zgrzyt.svg
[npm-url]: https://npmjs.org/package/zgrzyt

[travis-url]: https://travis-ci.com/pirxpilot/zgrzyt
[travis-image]: https://img.shields.io/travis/com/pirxpilot/zgrzyt.svg

[deps-image]: https://img.shields.io/david/pirxpilot/zgrzyt.svg
[deps-url]: https://david-dm.org/pirxpilot/zgrzyt

[deps-dev-image]: https://img.shields.io/david/dev/pirxpilot/zgrzyt.svg
[deps-dev-url]: https://david-dm.org/pirxpilot/zgrzyt?type=dev
