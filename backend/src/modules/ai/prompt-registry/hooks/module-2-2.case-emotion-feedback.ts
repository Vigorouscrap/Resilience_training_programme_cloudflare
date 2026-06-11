import type { HookDefinition } from '../../../../shared/types/ai.js';
import { readSiblingFile } from '../../../../shared/utils/fs.js';

const promptBaseDir = '../prompts/module-2-2.case-emotion-feedback';

export const module22CaseEmotionFeedbackHook: HookDefinition = {
    hookId: 'module-2-2.case-emotion-feedback',
    moduleId: '2-2',
    version: 'v1',
    provider: 'deepseek',
    model: 'deepseek-v4-flash',
    temperature: 0.3,
    maxOutputChars: 150,
    fallbackKey: 'module22_case_emotion_default',
    defaultVariant: 'zhangtian',
    userPromptTemplate: readSiblingFile(import.meta.url, `${promptBaseDir}/v1.user.md`),
    variants: [
        {
            key: 'zhangtian',
            systemPrompt: readSiblingFile(import.meta.url, `${promptBaseDir}/zhangtian.v1.system.md`)
        },
        {
            key: 'xiaolin',
            systemPrompt: readSiblingFile(import.meta.url, `${promptBaseDir}/xiaolin.v1.system.md`)
        },
        {
            key: 'jiayi',
            systemPrompt: readSiblingFile(import.meta.url, `${promptBaseDir}/jiayi.v1.system.md`)
        }
    ]
};
