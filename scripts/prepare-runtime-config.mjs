import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const deploymentId = String(process.argv[2] || process.env.RESILIENCE_DEPLOYMENT || '').trim().toLowerCase();
const allowedDeployments = new Set(['cloudflare', 'mainland']);

if (!allowedDeployments.has(deploymentId)) {
    throw new Error('Usage: node scripts/prepare-runtime-config.mjs <cloudflare|mainland>');
}

const sourcePath = path.join(projectRoot, 'deploy', 'runtime-config', `${deploymentId}.js`);
const outputPath = path.join(projectRoot, 'dist', deploymentId);
fs.rmSync(outputPath, { recursive: true, force: true });
fs.cpSync(path.join(projectRoot, 'src'), outputPath, { recursive: true });
fs.copyFileSync(sourcePath, path.join(outputPath, 'runtime-config.js'));
console.log(`Prepared ${deploymentId} static site at ${path.relative(projectRoot, outputPath)}`);
