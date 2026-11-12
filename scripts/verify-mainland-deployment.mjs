import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { SUPPORTED_HOOK_IDS } from '../shared-contract/index.mjs';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const siteUrl = String(process.env.MAINLAND_SITE_URL || process.argv[2] || 'https://www.resilience-training.cloud').replace(/\/+$/, '');
const apiUrl = String(process.env.MAINLAND_API_URL || process.argv[3] || 'https://api.resilience-training.cloud').replace(/\/+$/, '');
const deploymentFiles = [
    'runtime-config.js',
    'js/main.js',
    'js/dialogue/DialogueManager.js',
    'js/services/participantSession.js',
    'js/services/researchEventQueue.js'
];

function normalizeText(value) {
    return String(value).replace(/\r\n/g, '\n');
}

function digest(value) {
    return createHash('sha256').update(normalizeText(value)).digest('hex').slice(0, 12);
}

function buildMainlandSite() {
    const result = spawnSync(process.execPath, ['scripts/prepare-runtime-config.mjs', 'mainland'], {
        cwd: projectRoot,
        encoding: 'utf8',
        stdio: 'pipe'
    });
    if (result.status !== 0) {
        throw new Error(result.stderr || result.stdout || 'Mainland build failed');
    }
}

async function fetchText(url, options = {}) {
    const response = await fetch(url, { signal: AbortSignal.timeout(15000), ...options });
    const text = await response.text();
    return { response, text };
}

async function verifyStaticFiles() {
    const mismatches = [];
    const cacheBuster = Date.now();

    for (const relativePath of deploymentFiles) {
        const localPath = path.join(projectRoot, 'dist', 'mainland', ...relativePath.split('/'));
        assert.ok(fs.existsSync(localPath), `Missing local build file: ${relativePath}`);
        const localText = fs.readFileSync(localPath, 'utf8');
        const { response, text: remoteText } = await fetchText(`${siteUrl}/${relativePath}?deployment_check=${cacheBuster}`);
        if (response.status !== 200) {
            mismatches.push({ relativePath, localHash: digest(localText), remoteHash: `HTTP-${response.status}` });
            continue;
        }

        const localHash = digest(localText);
        const remoteHash = digest(remoteText);
        if (localHash !== remoteHash) {
            mismatches.push({ relativePath, localHash, remoteHash });
        } else {
            console.log(`PASS static ${relativePath} ${remoteHash}`);
        }
    }

    if (mismatches.length) {
        for (const mismatch of mismatches) {
            console.error(`MISMATCH ${mismatch.relativePath} local=${mismatch.localHash} remote=${mismatch.remoteHash}`);
        }
        throw new Error(`${mismatches.length} mainland deployment file(s) do not match this release`);
    }
}

async function verifyRuntimeConfig() {
    const { response, text } = await fetchText(`${siteUrl}/runtime-config.js?runtime_check=${Date.now()}`);
    assert.equal(response.status, 200);
    assert.match(text, /deploymentId:\s*['"]mainland['"]/);
    assert.match(text, /apiBaseUrl:\s*['"]https:\/\/api\.resilience-training\.cloud['"]/);
    console.log('PASS runtime config is locked to the mainland API');
}

async function verifyApi() {
    const origin = new URL(siteUrl).origin;
    const health = await fetch(`${apiUrl}/health`, {
        headers: { Origin: origin },
        signal: AbortSignal.timeout(15000)
    });
    assert.equal(health.status, 200);
    assert.equal(health.headers.get('access-control-allow-origin'), origin);
    const data = await health.json();
    assert.equal(data.ok, true);
    assert.equal(data.runtime, 'fastify-node');
    assert.deepEqual([...data.hooks].sort(), [...SUPPORTED_HOOK_IDS].sort());
    console.log('PASS API health, runtime, hooks and CORS');

    const preflight = await fetch(`${apiUrl}/api/v1/participants/start`, {
        method: 'OPTIONS',
        headers: {
            Origin: origin,
            'Access-Control-Request-Method': 'POST',
            'Access-Control-Request-Headers': 'content-type'
        },
        signal: AbortSignal.timeout(15000)
    });
    assert.equal(preflight.status, 204);
    assert.equal(preflight.headers.get('access-control-allow-origin'), origin);
    console.log('PASS API preflight');
}

buildMainlandSite();
await verifyRuntimeConfig();
await verifyStaticFiles();
await verifyApi();
console.log(`PASS mainland deployment ${siteUrl} -> ${apiUrl}`);
