import { postJson } from './apiClient.js';

export async function requestAiReply(hookId, payload, options = {}) {
    return postJson(`/api/v1/ai/hooks/${encodeURIComponent(hookId)}`, payload, options);
}
