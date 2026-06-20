const baseUrl = String(process.env.WORKER_BASE_URL || process.argv[2] || '').replace(/\/+$/, '');
const allowFallbacks = process.env.ALLOW_FALLBACKS === '1';

if (!baseUrl) {
    console.error('Usage: WORKER_BASE_URL=https://your-worker.workers.dev npm run smoke:hooks');
    console.error('Or: npm run smoke:hooks -- https://your-worker.workers.dev');
    process.exit(1);
}

const hookCases = [
    {
        hookId: 'module-1-1.intro-reply',
        body: {
            moduleId: '1-1',
            step: 1,
            userInput: '我最近压力有点大，希望能更好地调整自己。',
            context: { source: 'cloudflare-worker-smoke-test' }
        }
    },
    {
        hookId: 'module-1-3.body-sensation-reflection',
        body: {
            moduleId: '1-3',
            step: 1,
            userInput: '想到这件事的时候，我胸口有点紧，肩膀也很僵。',
            context: { classification: 'body_sensation' }
        }
    },
    {
        hookId: 'module-1-3.thought-reflection',
        body: {
            moduleId: '1-3',
            step: 2,
            userInput: '我会想是不是自己不够好，所以才总是处理不好这些事。',
            context: { classification: 'self_critical_thought' }
        }
    },
    {
        hookId: 'module-2-2.case-emotion-feedback',
        body: {
            moduleId: '2-2',
            step: 1,
            variant: 'zhangtian',
            userInput: '他可能很害怕失业，也担心让家人失望。',
            context: { caseId: 'zhangtian' }
        }
    },
    {
        hookId: 'module-2-2.case-emotion-feedback',
        body: {
            moduleId: '2-2',
            step: 1,
            variant: 'xiaolin',
            userInput: '她其实很孤独，也害怕关系继续变差。',
            context: { caseId: 'xiaolin' }
        }
    },
    {
        hookId: 'module-2-2.case-emotion-feedback',
        body: {
            moduleId: '2-2',
            step: 1,
            variant: 'jiayi',
            userInput: '她可能害怕别人失望，也不太敢开口求助。',
            context: { caseId: 'jiayi' }
        }
    },
    {
        hookId: 'module-3-2.positive-rumination-feedback',
        body: {
            moduleId: '3-2',
            step: 1,
            userInput: '我以前会逼自己积极一点，不太允许自己难过。',
            context: { classification: 'recognized_pattern' }
        }
    },
    {
        hookId: 'module-4-2.thought-train-reflection',
        body: {
            moduleId: '4-2',
            step: 1,
            userInput: '我看到一列关于失败的火车，还有一列关于别人怎么看我的火车。',
            context: { classification: 'described_trains' }
        }
    },
    {
        hookId: 'module-4-2.boarding-impulse-reflection',
        body: {
            moduleId: '4-2',
            step: 2,
            userInput: '有一瞬间很想跟着担心未来那列火车走。',
            context: { classification: 'has_impulse' }
        }
    },
    {
        hookId: 'module-4-4.label-feedback',
        body: {
            moduleId: '4-4',
            step: 1,
            userInput: '灾难化预测',
            context: { classification: 'descriptive_label' }
        }
    },
    {
        hookId: 'module-4-6.supporter-response-feedback',
        body: {
            moduleId: '4-6',
            step: 1,
            userInput: '你现在真的很痛苦，这个想法像是在告诉你未来都没希望了，但它只是一个想法，不一定是事实。',
            context: { classification: 'supportive_defusion_response' }
        }
    },
    {
        hookId: 'module-6-2.value-desire-insight',
        body: {
            moduleId: '6-2',
            step: 1,
            userInput: '他很在乎稳定和被家人理解。',
            context: { classification: 'value_desire' }
        }
    }
];

async function requestJson(path, options = {}) {
    const response = await fetch(`${baseUrl}${path}`, options);
    const text = await response.text();

    let data;
    try {
        data = JSON.parse(text);
    } catch {
        throw new Error(`${path} returned non-JSON response: ${text.slice(0, 180)}`);
    }

    if (!response.ok) {
        throw new Error(`${path} failed with ${response.status}: ${JSON.stringify(data)}`);
    }

    return data;
}

async function main() {
    console.log(`Testing Worker: ${baseUrl}`);

    const health = await requestJson('/health');
    if (health.ok !== true) {
        throw new Error(`/health did not return ok: true: ${JSON.stringify(health)}`);
    }
    console.log(`OK /health (${Array.isArray(health.hooks) ? health.hooks.length : 0} hooks listed)`);

    const failures = [];

    for (const testCase of hookCases) {
        try {
            const data = await requestJson(`/api/v1/ai/hooks/${encodeURIComponent(testCase.hookId)}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(testCase.body)
            });

            const ok = data.hookId === testCase.hookId
                && typeof data.replyText === 'string'
                && data.replyText.trim().length > 0
                && (allowFallbacks || data.fallbackUsed === false);

            if (!ok) {
                failures.push(`${testCase.hookId} returned unexpected payload: ${JSON.stringify(data)}`);
                console.log(`FAIL ${testCase.hookId}`);
                continue;
            }

            console.log(`OK ${testCase.hookId} fallbackUsed=${data.fallbackUsed}`);
        } catch (error) {
            failures.push(`${testCase.hookId}: ${error instanceof Error ? error.message : String(error)}`);
            console.log(`FAIL ${testCase.hookId}`);
        }
    }

    if (failures.length > 0) {
        console.error('\nSmoke test failed:');
        for (const failure of failures) {
            console.error(`- ${failure}`);
        }
        console.error('\nTip: set ALLOW_FALLBACKS=1 only when you want to verify routing shape without requiring a successful DeepSeek call.');
        process.exit(1);
    }

    console.log('\nAll Worker hook smoke tests passed.');
}

main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
});
