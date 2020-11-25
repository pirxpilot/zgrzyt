const conf = require('rc')('zgrzyt');
const prepareConfig = require('./lib/config');
const zgrzyt = require('./lib/zgrzyt');

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
  const collected = results.reduce(collect, {
    missing: [],
    switched: [],
    noops: []
  });
  const exitCode = reportAll(collected);
  process.exit(exitCode);

  function collect(context, r) {
    if (!r.good) {
      context.missing.push(r);
    } else if (r.switched) {
      context.switched.push(r);
    } else {
      context.noops.push(r);
    }
    return context;
  }

  function reportAll(collected) {
    const {
      missing,
      noops,
      switched
    } = collected;

    let exitCode = 0;
    if (missing.length > 0) {
      console.log('\nNo good servers at the moment for:\n');
      missing.forEach(({ url }) =>
        console.log('  ', url)
      );
    }
    if (switched.length > 0) {
      console.log('\nSwitched DNS for:\n');
      switched.forEach(({ domain, record: { content }, good: { server, address } }) =>
        console.log('  %s\t%s\t=>\t%s\tt[%s]', domain, content, server, address)
      );
      exitCode = 1;
    }
    if (noops.length > 0) {
      console.log('\nNo changes:\n');
      noops.forEach(({ record: { name }, good: { server, address } }) =>
        console.log('  %s\t\t%s\t\t[%s]', name, server, address)
      );
      exitCode = 2;
    }
    return exitCode;
  }
}

