import { customProvider, wrapLanguageModel } from "ai";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

if (!process.env.LITELLM_API_KEY) {
    throw new Error('LITELLM_API_KEY is not set');
}

export const MODEL_LIST: string[] = [
    'zai-org/glm-4.7-maas',
]

const defaultModel = MODEL_LIST[0]
if (defaultModel === undefined) {
    throw new Error('MODEL_LIST must contain at least one model')
}
export const DEFAULT_MODEL = defaultModel

export const litellm = createOpenAICompatible({
    name: 'litellm',
    apiKey: process.env.LITELLM_API_KEY,
    baseURL: 'https://openai-litellm.duckdns.org/v1',
    includeUsage: true,
});


