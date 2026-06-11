import type { AiHookResolvedContext } from '../../shared/types/ai.js';

export interface ModuleContextSnapshot {
    sessionId: string;
    moduleId: string;
    step: number | null;
    variant: string | null;
    summary: Record<string, unknown>;
}

export class ModuleContextBuilder {
    build(input: AiHookResolvedContext): ModuleContextSnapshot {
        return {
            sessionId: input.sessionId,
            moduleId: input.moduleId,
            step: input.step,
            variant: input.variant,
            summary: {
                ...input.context,
                latestUserInput: input.userInput
            }
        };
    }
}
