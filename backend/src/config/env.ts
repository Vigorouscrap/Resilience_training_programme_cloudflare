import 'dotenv/config';

const REQUIRED_ENV_KEYS = [
    'AI_PROVIDER',
    'DEEPSEEK_BASE_URL',
    'DEEPSEEK_API_KEY',
    'DEEPSEEK_MODEL',
    'DATABASE_URL',
    'SESSION_SECRET'
] as const;

export interface AppEnv {
    nodeEnv: string;
    port: number;
    corsOrigin: string;
    aiProvider: string;
    deepseekBaseUrl: string;
    deepseekApiKey: string;
    deepseekModel: string;
    deepseekTimeoutMs: number;
    databaseUrl: string;
    sessionSecret: string;
}

function requireEnv(name: (typeof REQUIRED_ENV_KEYS)[number]): string {
    const value = process.env[name];
    if (!value || !value.trim()) {
        throw new Error(`Missing required environment variable: ${name}`);
    }
    return value.trim();
}

function parsePositiveInteger(value: string | undefined, fallbackValue: number): number {
    const parsedValue = Number.parseInt(String(value ?? ''), 10);
    return Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : fallbackValue;
}

export function loadEnv(): AppEnv {
    return {
        nodeEnv: process.env.NODE_ENV?.trim() || 'development',
        port: parsePositiveInteger(process.env.PORT, 8787),
        corsOrigin: process.env.CORS_ORIGIN?.trim() || 'http://localhost:8000',
        aiProvider: requireEnv('AI_PROVIDER'),
        deepseekBaseUrl: requireEnv('DEEPSEEK_BASE_URL'),
        deepseekApiKey: requireEnv('DEEPSEEK_API_KEY'),
        deepseekModel: requireEnv('DEEPSEEK_MODEL'),
        deepseekTimeoutMs: parsePositiveInteger(process.env.DEEPSEEK_TIMEOUT_MS, 15000),
        databaseUrl: requireEnv('DATABASE_URL'),
        sessionSecret: requireEnv('SESSION_SECRET')
    };
}
