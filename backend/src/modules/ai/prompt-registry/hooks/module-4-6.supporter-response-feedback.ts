import type { HookDefinition } from '../../../../shared/types/ai.js';
import { readSiblingFile } from '../../../../shared/utils/fs.js';

const promptBaseDir = '../prompts/module-4-6.supporter-response-feedback';

export const module46SupporterResponseFeedbackHook: HookDefinition = {
    hookId: 'module-4-6.supporter-response-feedback',
    moduleId: '4-6',
    version: 'v1',
    provider: 'deepseek',
    model: 'deepseek-v4-flash',
    temperature: 0.2,
    maxOutputChars: 420,
    fallbackKey: 'module46_supporter_response_default',
    defaultVariant: 'default',
    userPromptTemplate: readSiblingFile(import.meta.url, `${promptBaseDir}/v1.user.md`),
    variants: [
        {
            key: 'default',
            systemPrompt: readSiblingFile(import.meta.url, `${promptBaseDir}/v1.system.md`)
        }
    ]
};
