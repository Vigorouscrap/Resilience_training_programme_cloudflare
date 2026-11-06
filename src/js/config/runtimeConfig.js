const DEFAULT_LOCAL_API_BASE_URL = 'http://127.0.0.1:8787';
const API_BASE_URL_STORAGE_KEY = '__resilience_api_base_url__';

function normalizeApiBaseUrl(value) {
    const rawValue = String(value || '').trim();
    if (!rawValue) return '';
    return rawValue.replace(/\/+$/, '');
}

function isLocalHost() {
    const hostname = globalThis.location?.hostname || '';
    return hostname === '127.0.0.1' || hostname === 'localhost';
}

function resolveApiBaseUrl() {
    const searchParams = new URLSearchParams(globalThis.location?.search || '');
    const queryValue = normalizeApiBaseUrl(searchParams.get('apiBaseUrl'));
    const runtimeConfig = globalThis.__RESILIENCE_RUNTIME__ || {};
    const windowValue = normalizeApiBaseUrl(runtimeConfig.apiBaseUrl);
    const allowApiOverride = isLocalHost();
    const storedValue = normalizeApiBaseUrl(globalThis.sessionStorage?.getItem(API_BASE_URL_STORAGE_KEY));

    if (allowApiOverride && queryValue) {
        globalThis.sessionStorage?.setItem(API_BASE_URL_STORAGE_KEY, queryValue);
        return queryValue;
    }

    if (allowApiOverride && storedValue) {
        return storedValue;
    }

    if (windowValue) {
        return windowValue;
    }

    if (isLocalHost()) {
        return DEFAULT_LOCAL_API_BASE_URL;
    }

    return '';
}

export function getRuntimeConfig() {
    const apiBaseUrl = resolveApiBaseUrl();
    return {
        deploymentId: String(globalThis.__RESILIENCE_RUNTIME__?.deploymentId || 'unknown'),
        apiBaseUrl,
        aiHooksEnabled: Boolean(apiBaseUrl)
    };
}
