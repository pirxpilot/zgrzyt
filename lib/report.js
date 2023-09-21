import sprintf from 'sprintfjs';

export function report(results) {
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

  if (missing.length > 0) {
    lines.push('No good servers for:\n', ...missing, '\n');
    exitCode += 2;
  }
  if (switched.length > 0) {
    lines.push('Switched DNS for:\n', ...switched, '\n');
    exitCode += 1;
  }
  if (noops.length > 0) {
    lines.push('No changes:\n', ...noops, '\n');
  }

  return { exitCode, lines: lines.slice(0, -1) };
}
