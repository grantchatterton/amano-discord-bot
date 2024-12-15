import fs from 'node:fs';
import path from 'node:path';
import appRoot from 'app-root-path';

export const SWEAR_WORDS = JSON.parse(fs.readFileSync(path.join(appRoot.path, 'swears.json')));
