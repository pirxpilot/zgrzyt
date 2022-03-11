
1.6.0 / 2022-03-11
==================

 * add support for adding headers
 * revert the report order

1.5.0 / 2021-11-09
==================

 * add support for repair option
 * persist servers health
 * upgrade parse-domain to ~4

1.4.0 / 2020-12-18
==================

 * configure retry/timeout/force for each API
 * add retry functionality to checkApi
 * simplify displaying results

1.3.5 / 2020-12-09
==================

 * handle request timeout properly

1.3.4 / 2020-11-29
==================

 * add support for large (> 50 zones) accounts
 * use `got`  instead of `fetch` for Cloudflare API

1.3.3 / 2020-11-28
==================

 * optimize requests for zone data
 * cache DNS requests for servers

1.3.2 / 2020-11-28
==================

 * throttle request to Cloudflare API
 * fix displaying error massages for CloudFlare API

1.3.1 / 2020-11-26
==================

 * better formating for reports
 * report results grouped by action
 * add debug module

1.3.0 / 2020-11-25
==================

 * use `HTTP HEAD` by default

1.2.1 / 2020-11-24
==================

 * use package.homepage to format User Agent

1.2.0 / 2020-10-29
==================

 * make zgrzyt less verbose
 * add support for multiple API in one config
 * allow for specifying API domain
 * add User-Agent header to HTTP checks

1.1.0 / 2020-10-25
==================

 * handle proxied records properly

1.0.1 / 2020-10-05
==================

 * update dependencies
 * fix docs typos

1.0.0 / 2020-10-04
==================

 * implement switching records when forced
 * add bin/zgrzyt executable
 * add support for switching dbs record
 * add http/https support
