import type { AppEnv } from '../../config/env.js';
import type {
    AiHookResolvedContext,
    AiHookResponseBody,
    HookDefinition
} from '../../shared/types/ai.js';
import { ModuleContextBuilder } from '../module-state/module-context.builder.js';
import { ModuleStateService } from '../module-state/module-state.service.js';
import { SessionService } from '../sessions/session.service.js';
import { fallbackMessages } from './fallbacks/fallback-messages.js';
import { getHookDefinition, getHookVariant } from './prompt-registry/index.js';
import type { AiProvider } from './providers/ai-provider.js';
import { validateReplyText } from './validators/reply-validator.js';

function renderTemplate(template: string, input: Record<string, string>): string {
    return Object.entries(input).reduce((result, [key, value]) => {
        return result.replaceAll(`{{${key}}}`, value);
    }, template);
}

export class AiService {
    constructor(
        private readonly env: AppEnv,
        private readonly provider: AiProvider,
        private readonly sessionService: SessionService,
        private readonly moduleContextBuilder: ModuleContextBuilder,
        private readonly moduleStateService: ModuleStateService
    ) {}

    async generateHookReply(hookId: string, input: AiHookResolvedContext): Promise<AiHookResponseBody> {
        const hook = getHookDefinition(hookId);
        this.assertModuleMatch(hook, input.moduleId);

        const sessionId = this.sessionService.ensureSession(input.sessionId, { moduleId: input.moduleId });
        const variant = getHookVariant(hook, input.variant ?? undefined);

        const snapshot = this.moduleContextBuilder.build({
            ...input,
            sessionId
        });
        this.moduleStateService.save(snapshot);

        const userPrompt = renderTemplate(hook.userPromptTemplate, {
            moduleId: input.moduleId,
            hookId,
            step: input.step == null ? 'null' : String(input.step),
            variant: variant.key,
            userInput: input.userInput,
            contextJson: JSON.stringify(snapshot.summary, null, 2)
        });

        try {
            const completion = await this.provider.complete({
                model: hook.model || this.env.deepseekModel,
                temperature: hook.temperature,
                systemPrompt: variant.systemPrompt,
                userPrompt,
                timeoutMs: this.env.deepseekTimeoutMs,
                metadata: {
                    hookId,
                    moduleId: input.moduleId,
                    sessionId,
                    variant: variant.key
                }
            });

            const validation = validateReplyText(completion.text, hook.maxOutputChars);
            if (!validation.ok) {
                return this.buildFallbackResponse(sessionId, hook, input, validation.reason || 'invalid_output');
            }

            return {
                sessionId,
                moduleId: input.moduleId,
                hookId,
                replyText: validation.sanitizedText,
                fallbackUsed: false,
                promptVersion: hook.version,
                provider: this.provider.name,
                model: hook.model,
                metadata: {
                    variant: variant.key
                }
            };
        } catch (error) {
            return this.buildFallbackResponse(
                sessionId,
                hook,
                input,
                error instanceof Error ? error.message : 'unknown_error'
            );
        }
    }

    private assertModuleMatch(hook: HookDefinition, moduleId: string): void {
        if (hook.moduleId !== moduleId) {
            throw new Error(`Hook "${hook.hookId}" does not belong to module "${moduleId}".`);
        }
    }

    private buildFallbackResponse(
        sessionId: string,
        hook: HookDefinition,
        input: AiHookResolvedContext,
        reason: string
    ): AiHookResponseBody {
        return {
            sessionId,
            moduleId: input.moduleId,
            hookId: hook.hookId,
            replyText: fallbackMessages[hook.fallbackKey] || '谢谢你的分享，我们先继续当前练习。',
            fallbackUsed: true,
            promptVersion: hook.version,
            provider: hook.provider,
            model: hook.model,
            metadata: {
                fallbackReason: reason
            }
        };
    }
}
