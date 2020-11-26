const conf = require('rc')('zgrzyt');
const prepareConfig = require('./lib/config');
const zgrzyt = require('./lib/zgrzyt');
const report = require('./lib/report');

const apis = prepareConfig(conf);

if (!apis) {
  console.error('Invalid configuration - no APIs to check');
}

main(apis).catch(e => {
  console.error('Errors:', e);
  process.exit(-1);
});

async function main(apis) {
  const results = await Promise.all(apis.map(zgrzyt));
  const { exitCode, lines }  = report(results);
  lines.forEach(l => console.log(l));
  process.exit(exitCode);
}
