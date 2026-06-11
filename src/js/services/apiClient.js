import { getRuntimeConfig } from '../config/runtimeConfig.js';

export class ApiClientError extends Error {
    constructor(message, details = {}) {
        super(message);
        this.name = 'ApiClientError';
        this.details = details;
    }
}

export async function postJson(path, payload, options = {}) {
    const runtimeConfig = getRuntimeConfig();
    if (!runtimeConfig.apiBaseUrl) {
        throw new ApiClientError('API base URL is not configured.');
    }

    const timeoutMs = options.timeoutMs ?? 12000;
    const abortController = new AbortController();
    const timeoutId = setTimeout(() => abortController.abort(), timeoutMs);

    try {
        const response = await fetch(`${runtimeConfig.apiBaseUrl}${path}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload),
            signal: abortController.signal
        });

        const responseText = await response.text();
        const responseData = responseText ? JSON.parse(responseText) : {};

        if (!response.ok) {
            throw new ApiClientError('Request failed.', {
                status: response.status,
                responseData
            });
        }

        return responseData;
    } catch (error) {
        if (error instanceof ApiClientError) {
            throw error;
        }
        if (error instanceof Error && error.name === 'AbortError') {
            throw new ApiClientError('Request timed out.');
        }
        throw new ApiClientError(
            error instanceof Error ? error.message : 'Unknown network error.'
        );
    } finally {
        clearTimeout(timeoutId);
    }
}
