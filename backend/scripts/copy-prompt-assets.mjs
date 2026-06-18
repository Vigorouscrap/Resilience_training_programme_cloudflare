import { cpSync, existsSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

const sourceDir = resolve('src/modules/ai/prompt-registry/prompts');
const targetDir = resolve('dist/modules/ai/prompt-registry/prompts');

if (!existsSync(sourceDir)) {
    throw new Error(`Prompt source directory does not exist: ${sourceDir}`);
}

mkdirSync(targetDir, { recursive: true });
cpSync(sourceDir, targetDir, {
    recursive: true,
    force: true
});

console.log(`Copied prompt assets to ${targetDir}`);
