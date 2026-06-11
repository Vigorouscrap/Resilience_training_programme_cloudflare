import type { ProviderCompletionInput, ProviderCompletionResult } from '../../../shared/types/ai.js';

export interface AiProvider {
    readonly name: string;
    complete(input: ProviderCompletionInput): Promise<ProviderCompletionResult>;
}
