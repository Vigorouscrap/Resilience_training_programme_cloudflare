import type { AppEnv } from './env.js';

export interface RuntimeConfig {
    appName: string;
    apiVersion: string;
    defaultModel: string;
    supportsAnonymousSessions: boolean;
}

export function buildRuntimeConfig(env: AppEnv): RuntimeConfig {
    return {
        appName: 'resilience-programme-backend',
        apiVersion: 'v1',
        defaultModel: env.deepseekModel,
        supportsAnonymousSessions: true
    };
}
