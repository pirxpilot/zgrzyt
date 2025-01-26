import { readFile, writeFile } from 'node:fs/promises';

export { updateHealth, onExit };

const { ZGRZYT_STATE = '/var/lib/zgrzyt/state.json' } = process.env;

const state_p = read();
let hook;

async function onExit() {
  if (hook) {
    await hook();
  }
}

async function updateHealth({ url }, serverName, ok) {
  const state = await peak(url, serverName);
  let health = 0;
  if (ok) {
    health = (state.health || 0) + 1;
  }
  state.health = health;
  return health;
}

async function peak(url, serverName) {
  const state = await state_p;
  if (!hook) {
    hook = async () => await write(state);
  }
  let api = state[url];
  if (!api) {
    api = state[url] = Object.create(null);
  }
  let server = api[serverName];
  if (!server) {
    server = api[serverName] = Object.create(null);
  }
  return server;
}

async function read(path = ZGRZYT_STATE) {
  try {
    const str = await readFile(path);
    return JSON.parse(str);
  } catch {
    return Object.create(null);
  }
}

async function write(state, path = ZGRZYT_STATE) {
  await writeFile(path, JSON.stringify(state, null, 2));
}
