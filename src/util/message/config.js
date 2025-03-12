import fs from 'node:fs';
import path from 'node:path';
import appRoot from 'app-root-path';

const config = JSON.parse(fs.readFileSync(path.join(appRoot.path, 'config.json')));
export const { MESSAGE_CHANCE, MESSAGE_FUNNY_CHANCE, MESSAGE_DELAY, MESSAGE_IMAGE } = config;

export default config;
