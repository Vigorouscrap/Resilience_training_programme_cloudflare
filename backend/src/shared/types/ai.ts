export interface AiHookRequestBody {
    sessionId?: string;
    moduleId: string;
    step?: number;
    variant?: string;
    userInput: string;
    context?: Record<string, unknown>;
}

export interface AiHookResolvedContext {
    sessionId: string;
    moduleId: string;
    step: number | null;
    variant: string | null;
    userInput: string;
    context: Record<string, unknown>;
}

export interface AiHookResponseBody {
    sessionId: string;
    moduleId: string;
    hookId: string;
    replyText: string;
    fallbackUsed: boolean;
    promptVersion: string;
    provider: string;
    model: string;
    metadata: Record<string, unknown>;
}

export interface ProviderCompletionInput {
    model: string;
    temperature: number;
    systemPrompt: string;
    userPrompt: string;
    timeoutMs: number;
    metadata?: Record<string, unknown>;
}

export interface ProviderCompletionResult {
    text: string;
    raw: Record<string, unknown>;
}

export interface HookPromptVariant {
    key: string;
    systemPrompt: string;
}

export interface HookDefinition {
    hookId: string;
    moduleId: string;
    version: string;
    provider: string;
    model: string;
    temperature: number;
    maxOutputChars: number;
    fallbackKey: string;
    defaultVariant?: string;
    userPromptTemplate: string;
    variants: HookPromptVariant[];
}
