import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import dotenv from 'dotenv';

const envFileCandidates = [
    resolve(process.cwd(), '.env.local'),
    resolve(process.cwd(), '.env')
];

for (const envFilePath of envFileCandidates) {
    if (existsSync(envFilePath)) {
        dotenv.config({ path: envFilePath, override: false });
    }
}

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
    corsOrigins: string[];
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

function parseCorsOrigins(value: string | undefined): string[] {
    const rawValue = String(value ?? '').trim();
    if (!rawValue) {
        return ['http://localhost:8000'];
    }

    return rawValue
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
}

export function loadEnv(): AppEnv {
    return {
        nodeEnv: process.env.NODE_ENV?.trim() || 'development',
        port: parsePositiveInteger(process.env.PORT, 8787),
        corsOrigins: parseCorsOrigins(process.env.CORS_ORIGIN),
        aiProvider: requireEnv('AI_PROVIDER'),
        deepseekBaseUrl: requireEnv('DEEPSEEK_BASE_URL'),
        deepseekApiKey: requireEnv('DEEPSEEK_API_KEY'),
        deepseekModel: requireEnv('DEEPSEEK_MODEL'),
        deepseekTimeoutMs: parsePositiveInteger(process.env.DEEPSEEK_TIMEOUT_MS, 15000),
        databaseUrl: requireEnv('DATABASE_URL'),
        sessionSecret: requireEnv('SESSION_SECRET')
    };
}
