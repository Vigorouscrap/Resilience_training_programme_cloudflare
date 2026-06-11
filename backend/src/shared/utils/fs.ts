import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export function readSiblingFile(moduleUrl: string, relativePath: string): string {
    const currentFilePath = fileURLToPath(moduleUrl);
    const currentDir = dirname(currentFilePath);
    const targetPath = resolve(currentDir, relativePath);
    return readFileSync(targetPath, 'utf8').trim();
}
