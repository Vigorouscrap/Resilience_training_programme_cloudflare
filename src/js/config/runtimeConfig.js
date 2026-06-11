const DEFAULT_LOCAL_API_BASE_URL = 'http://127.0.0.1:8787';
const API_BASE_URL_STORAGE_KEY = '__resilience_api_base_url__';

function normalizeApiBaseUrl(value) {
    const rawValue = String(value || '').trim();
    if (!rawValue) return '';
    return rawValue.replace(/\/+$/, '');
}

function resolveApiBaseUrl() {
    const searchParams = new URLSearchParams(globalThis.location?.search || '');
    const queryValue = normalizeApiBaseUrl(searchParams.get('apiBaseUrl'));
    const windowValue = normalizeApiBaseUrl(globalThis.__RESILIENCE_RUNTIME__?.apiBaseUrl);
    const storedValue = normalizeApiBaseUrl(globalThis.sessionStorage?.getItem(API_BASE_URL_STORAGE_KEY));

    if (queryValue) {
        globalThis.sessionStorage?.setItem(API_BASE_URL_STORAGE_KEY, queryValue);
        return queryValue;
    }

    if (windowValue) {
        return windowValue;
    }

    if (storedValue) {
        return storedValue;
    }

    const hostname = globalThis.location?.hostname || '';
    if (hostname === '127.0.0.1' || hostname === 'localhost') {
        return DEFAULT_LOCAL_API_BASE_URL;
    }

    return '';
}

export function getRuntimeConfig() {
    const apiBaseUrl = resolveApiBaseUrl();
    return {
        apiBaseUrl,
        aiHooksEnabled: Boolean(apiBaseUrl)
    };
}
