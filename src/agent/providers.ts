import { customProvider, wrapLanguageModel } from "ai";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { type LanguageModel } from "ai";

if (!process.env.AI_GATEWAY_API_KEY?.trim()) {
    throw new Error("AI_GATEWAY_API_KEY is not set");
}

if (!process.env.LITELLM_API_KEY) {
    throw new Error('LITELLM_API_KEY is not set');
}

export const litellm = createOpenAICompatible({
    name: 'litellm',
    apiKey: process.env.LITELLM_API_KEY,
    baseURL: 'https://openai-litellm.duckdns.org/v1',
    includeUsage: true,
});

const MODEL_ID_PRIMARY = "zai-org/glm-4.7-maas";
const MODEL_ID_AGENT = "minimax/minimax-m2.7";

export const MODEL_LIST: LanguageModel[] = [
    litellm(MODEL_ID_PRIMARY),
    MODEL_ID_AGENT,
];

const defaultModel = MODEL_LIST[0]
if (defaultModel === undefined) {
    throw new Error('MODEL_LIST must contain at least one model')
}
export const DEFAULT_MODEL = defaultModel
