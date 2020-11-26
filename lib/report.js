const sprintf = require('sprintfjs');

module.exports = report;

function report(results) {
  const collected = results.reduce(collect, {
    missing: [],
    switched: [],
    noops: []
  });
  return reportAll(collected);
}

function collect(context, { url, domain, record, good, switched }) {
  if (!good) {
    context.missing.push(url);
  } else if (switched) {
    const line = sprintf('%-25s %-25s => %-25s [%s]', domain, record.content, good.server, good.address);
    context.switched.push(line);
  } else {
    const line = sprintf('%-25s %-25s [%s]', record.name, good.server, good.address);
    context.noops.push(line);
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
  const lines = [];

  if (noops.length > 0) {
    console.log('No changes:\n');
    lines.push(...noops, '\n');
  }
  if (switched.length > 0) {
    console.log('Switched DNS for:\n');
    lines.push(...switched, '\n');
    exitCode += 1;
  }
  if (missing.length > 0) {
    lines.push('No good servers for:\n');
    lines.push(...missing, '\n');
    exitCode += 2;
  }

  return { exitCode, lines: lines.slice(0, -1) };
}

