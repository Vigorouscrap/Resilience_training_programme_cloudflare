const baseUrl = String(process.env.WORKER_BASE_URL || process.argv[2] || '').replace(/\/+$/, '');
const participantCode = String(process.env.PARTICIPANT_CODE || process.argv[3] || 'C_TEST').trim();
const participantName = String(process.env.PARTICIPANT_NAME || process.argv[4] || 'sxq').trim();
const clientSessionId = String(process.env.CLIENT_SESSION_ID || process.argv[5] || 'smoke-session-001').trim();

if (!baseUrl) {
    console.error('Usage: WORKER_BASE_URL=https://your-worker.workers.dev npm run smoke:participant');
    console.error('Or: npm run smoke:participant -- https://your-worker.workers.dev C_TEST sxq smoke-session-001');
    process.exit(1);
}

async function startSession(code, name, sessionId) {
    const response = await fetch(baseUrl + '/api/v1/participants/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            participantCode: code,
            participantName: name,
            clientSessionId: sessionId,
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
        throw new Error('Expected JSON response, got: ' + text.slice(0, 180));
    }

    if (!response.ok) {
        throw new Error('Request failed with ' + response.status + ': ' + JSON.stringify(data));
    }

    return data;
}

function assertSession(data, expectedCode, expectedName) {
    const ok = data.participantCode === expectedCode.toUpperCase()
        && data.participantName === expectedName
        && typeof data.participantId === 'string'
        && data.participantId.length > 0
        && typeof data.sessionId === 'string'
        && data.sessionId.length > 0
        && typeof data.persisted === 'boolean'
        && typeof data.role === 'string'
        && typeof data.unlockStartAt === 'string'
        && typeof data.access === 'object'
        && typeof data.access.canAccessAllModules === 'boolean'
        && typeof data.access.unlockedDayIndex === 'number';

    if (!ok) {
        throw new Error('Unexpected participant response: ' + JSON.stringify(data));
    }
}

async function main() {
    console.log('Testing participant start endpoint: ' + baseUrl);
    console.log('participantCode=' + participantCode + ' participantName=' + participantName);

    const first = await startSession(participantCode, participantName, clientSessionId);
    assertSession(first, participantCode, participantName);
    console.log('OK first identity accepted');

    const restored = await startSession(participantCode, participantName, clientSessionId + '-restore');
    assertSession(restored, participantCode, participantName);
    if (restored.participantId !== first.participantId) {
        throw new Error('Same code/name did not restore the same participant identity.');
    }
    console.log('OK same code/name restored');

    const separateName = participantName + ' 2';
    const separate = await startSession(participantCode, separateName, clientSessionId + '-separate');
    assertSession(separate, participantCode, separateName);
    if (separate.participantId === first.participantId) {
        throw new Error('Same code with a different name reused the participant identity.');
    }
    console.log('OK same code/different name is independent');

    if (process.env.EXPECT_TESTER_ROLE === '1' && first.role !== 'tester') {
        throw new Error('Expected tester role, got: ' + first.role);
    }
    console.log(JSON.stringify({
        participantId: first.participantId,
        role: first.role,
        persisted: first.persisted,
        access: first.access
    }, null, 2));
}

main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
});