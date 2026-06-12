import type { HookDefinition } from '../../../../shared/types/ai.js';
import { readSiblingFile } from '../../../../shared/utils/fs.js';

const promptBaseDir = '../prompts/module-4-4.label-feedback';

export const module44LabelFeedbackHook: HookDefinition = {
    hookId: 'module-4-4.label-feedback',
    moduleId: '4-4',
    version: 'v1',
    provider: 'deepseek',
    model: 'deepseek-v4-flash',
    temperature: 0.2,
    maxOutputChars: 140,
    fallbackKey: 'module44_label_feedback_default',
    defaultVariant: 'default',
    userPromptTemplate: readSiblingFile(import.meta.url, `${promptBaseDir}/v1.user.md`),
    variants: [
        {
            key: 'default',
            systemPrompt: readSiblingFile(import.meta.url, `${promptBaseDir}/v1.system.md`)
        }
    ]
};
