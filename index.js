import rc from 'rc';
import prepareConfig from './lib/config.js';
import { zgrzyt } from './lib/zgrzyt.js';
import { report } from './lib/report.js';
import { onExit } from './lib/state.js';

const conf = rc('zgrzyt');
const apis = prepareConfig(conf);

if (!apis) {
  console.error('Invalid configuration - no APIs to check');
}

main(apis).catch(e => {
  console.error('Errors:', e);
  process.exit(-1);
});

async function main(apis) {
  const promises = await Promise.allSettled(apis.map(zgrzyt));
  const results = [];
  const errors = [];
  promises.forEach(p => {
    if (p.status === 'fulfilled') {
      results.push(p.value);
    } else {
      errors.push(p.reason);
    }
  });
  const { exitCode, lines } = report(results, errors);
  console.log(lines.join('\n'));
  await onExit();
  process.exit(exitCode);
}
