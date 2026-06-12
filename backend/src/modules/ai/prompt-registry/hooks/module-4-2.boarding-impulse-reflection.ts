import type { HookDefinition } from '../../../../shared/types/ai.js';
import { readSiblingFile } from '../../../../shared/utils/fs.js';

const promptBaseDir = '../prompts/module-4-2.boarding-impulse-reflection';

export const module42BoardingImpulseReflectionHook: HookDefinition = {
    hookId: 'module-4-2.boarding-impulse-reflection',
    moduleId: '4-2',
    version: 'v1',
    provider: 'deepseek',
    model: 'deepseek-v4-flash',
    temperature: 0.2,
    maxOutputChars: 100,
    fallbackKey: 'module42_boarding_impulse_default',
    defaultVariant: 'default',
    userPromptTemplate: readSiblingFile(import.meta.url, `${promptBaseDir}/v1.user.md`),
    variants: [
        {
            key: 'default',
            systemPrompt: readSiblingFile(import.meta.url, `${promptBaseDir}/v1.system.md`)
        }
    ]
};
