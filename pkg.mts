import { readFileSync } from "fs";
import { dirname } from "path";
import { fileURLToPath } from 'url'

export const pkg = JSON.parse(readFileSync(fileURLToPath(`${dirname(import.meta.url)}/package.json`), 'utf8'));
