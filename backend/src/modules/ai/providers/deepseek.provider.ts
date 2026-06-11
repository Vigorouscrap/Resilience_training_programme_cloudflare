import type { AppEnv } from '../../../config/env.js';
import type { ProviderCompletionInput, ProviderCompletionResult } from '../../../shared/types/ai.js';
import type { AiProvider } from './ai-provider.js';

interface DeepSeekMessage {
    role: 'system' | 'user';
    content: string;
}

interface DeepSeekResponse {
    choices?: Array<{
        message?: {
            content?: string;
        };
    }>;
    [key: string]: unknown;
}

export class DeepSeekProvider implements AiProvider {
    readonly name = 'deepseek';

    constructor(private readonly env: AppEnv) {}

    async complete(input: ProviderCompletionInput): Promise<ProviderCompletionResult> {
        const requestBody = {
            model: input.model,
            temperature: input.temperature,
            messages: [
                { role: 'system', content: input.systemPrompt },
                { role: 'user', content: input.userPrompt }
            ] satisfies DeepSeekMessage[]
        };

        const abortController = new AbortController();
        const timeoutId = setTimeout(() => abortController.abort(), input.timeoutMs);

        try {
            const response = await fetch(`${this.env.deepseekBaseUrl}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${this.env.deepseekApiKey}`
                },
                body: JSON.stringify(requestBody),
                signal: abortController.signal
            });

            if (!response.ok) {
                const errorBody = await response.text();
                throw new Error(`DeepSeek request failed with ${response.status}: ${errorBody}`);
            }

            const responseJson = (await response.json()) as DeepSeekResponse;
            const text = responseJson.choices?.[0]?.message?.content?.trim();

            if (!text) {
                throw new Error('DeepSeek returned an empty completion.');
            }

            return {
                text,
                raw: responseJson as Record<string, unknown>
            };
        } finally {
            clearTimeout(timeoutId);
        }
    }
}
