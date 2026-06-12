import type { HookDefinition } from '../../../../shared/types/ai.js';
import { readSiblingFile } from '../../../../shared/utils/fs.js';

const promptBaseDir = '../prompts/module-3-2.positive-rumination-feedback';

export const module32PositiveRuminationFeedbackHook: HookDefinition = {
    hookId: 'module-3-2.positive-rumination-feedback',
    moduleId: '3-2',
    version: 'v1',
    provider: 'deepseek',
    model: 'deepseek-v4-flash',
    temperature: 0.2,
    maxOutputChars: 120,
    fallbackKey: 'module32_positive_rumination_default',
    defaultVariant: 'default',
    userPromptTemplate: readSiblingFile(import.meta.url, `${promptBaseDir}/v1.user.md`),
    variants: [
        {
            key: 'default',
            systemPrompt: readSiblingFile(import.meta.url, `${promptBaseDir}/v1.system.md`)
        }
    ]
};
