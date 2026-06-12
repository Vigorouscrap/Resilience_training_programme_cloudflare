import type { HookDefinition, HookPromptVariant } from '../../../shared/types/ai.js';
import { module11IntroReplyHook } from './hooks/module-1-1.intro-reply.js';
import { module13BodySensationReflectionHook } from './hooks/module-1-3.body-sensation-reflection.js';
import { module13ThoughtReflectionHook } from './hooks/module-1-3.thought-reflection.js';
import { module22CaseEmotionFeedbackHook } from './hooks/module-2-2.case-emotion-feedback.js';
import { module32PositiveRuminationFeedbackHook } from './hooks/module-3-2.positive-rumination-feedback.js';
import { module42BoardingImpulseReflectionHook } from './hooks/module-4-2.boarding-impulse-reflection.js';
import { module42ThoughtTrainReflectionHook } from './hooks/module-4-2.thought-train-reflection.js';
import { module44LabelFeedbackHook } from './hooks/module-4-4.label-feedback.js';
import { module46SupporterResponseFeedbackHook } from './hooks/module-4-6.supporter-response-feedback.js';
import { module62ValueDesireInsightHook } from './hooks/module-6-2.value-desire-insight.js';

const hooks = [
    module11IntroReplyHook,
    module13BodySensationReflectionHook,
    module13ThoughtReflectionHook,
    module22CaseEmotionFeedbackHook,
    module32PositiveRuminationFeedbackHook,
    module42ThoughtTrainReflectionHook,
    module42BoardingImpulseReflectionHook,
    module44LabelFeedbackHook,
    module46SupporterResponseFeedbackHook,
    module62ValueDesireInsightHook
] satisfies HookDefinition[];

export function getHookDefinition(hookId: string): HookDefinition {
    const hook = hooks.find(item => item.hookId === hookId);
    if (!hook) {
        throw new Error(`Unknown AI hook: ${hookId}`);
    }
    return hook;
}

export function getHookVariant(hook: HookDefinition, requestedVariant?: string): HookPromptVariant {
    const targetVariant = requestedVariant || hook.defaultVariant || hook.variants[0]?.key;
    const variant = hook.variants.find(item => item.key === targetVariant);
    if (!variant) {
        throw new Error(`Unknown variant "${requestedVariant}" for hook "${hook.hookId}".`);
    }
    return variant;
}

export function listHookDefinitions(): HookDefinition[] {
    return [...hooks];
}
