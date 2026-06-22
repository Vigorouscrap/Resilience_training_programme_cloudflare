const baseUrl = String(process.env.WORKER_BASE_URL || process.argv[2] || '').replace(/\/+$/, '');
const participantCode = String(process.env.PARTICIPANT_CODE || process.argv[3] || 'P001').trim();
const clientSessionId = String(process.env.CLIENT_SESSION_ID || process.argv[4] || 'smoke-session-001').trim();

if (!baseUrl) {
    console.error('Usage: WORKER_BASE_URL=https://your-worker.workers.dev npm run smoke:participant');
    console.error('Or: npm run smoke:participant -- https://your-worker.workers.dev P001 smoke-session-001');
    process.exit(1);
}

async function main() {
    console.log(`Testing participant start endpoint: ${baseUrl}`);
    console.log(`participantCode=${participantCode} clientSessionId=${clientSessionId}`);

    const response = await fetch(`${baseUrl}/api/v1/participants/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            participantCode,
            clientSessionId,
            metadata: {
                source: 'cloudflare-worker-participant-smoke-test'
            }
        })
    });

    const text = await response.text();
    let data;
    try {
        data = JSON.parse(text);
    } catch {
        throw new Error(`Expected JSON response, got: ${text.slice(0, 180)}`);
    }

    if (!response.ok) {
        throw new Error(`Request failed with ${response.status}: ${JSON.stringify(data)}`);
    }

    const ok = data.participantCode === participantCode.toUpperCase()
        && typeof data.participantId === 'string'
        && data.participantId.length > 0
        && typeof data.sessionId === 'string'
        && data.sessionId.length > 0
        && typeof data.persisted === 'boolean';

    if (!ok) {
        throw new Error(`Unexpected participant response: ${JSON.stringify(data)}`);
    }

    console.log('OK /api/v1/participants/start');
    console.log(JSON.stringify(data, null, 2));
}

main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
});
