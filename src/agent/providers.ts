import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { type LanguageModel } from "ai";

if (!process.env.LITELLM_API_KEY) {
    throw new Error('LITELLM_API_KEY is not set');
}

export const litellm = createOpenAICompatible({
    name: 'litellm',
    apiKey: process.env.LITELLM_API_KEY,
    baseURL: 'https://openai-litellm.duckdns.org/v1',
    includeUsage: true,
});

/** Model roster: order is default chat / picker order. Set `viaLitellm: false` for plain string ids (gateway passthrough). */
export const MODEL_SPECS = [
    // { id: "zai-org/glm-4.7-maas", viaLitellm: true as const },
    // { id: "zai/glm-4.7-flash", viaLitellm: false as const },
    { id: "minimax/minimax-m2.7", viaLitellm: false as const },
] as const;

export const AGENT_MODEL_ID = "minimax/minimax-m2.7";

export const MODEL_LIST: LanguageModel[] = MODEL_SPECS.map((spec) =>
    spec.viaLitellm ? litellm(spec.id) : spec.id,
);

export function getModelById(modelId: string): LanguageModel {
    const modelIndex = MODEL_SPECS.findIndex((spec) => spec.id === modelId);
    if (modelIndex === -1) {
        throw new Error(`Unknown model id: ${modelId}`);
    }

    const model = MODEL_LIST[modelIndex];
    if (model === undefined) {
        throw new Error(`MODEL_LIST is missing the configured model: ${modelId}`);
    }

    return model;
}

export const AGENT_MODEL_INDEX = MODEL_SPECS.findIndex(
    (spec) => spec.id === AGENT_MODEL_ID,
);

if (AGENT_MODEL_INDEX === -1) {
    throw new Error(`AGENT_MODEL_ID is not present in MODEL_SPECS: ${AGENT_MODEL_ID}`);
}

const defaultModelSpec = MODEL_SPECS[0];
if (defaultModelSpec === undefined) {
    throw new Error('MODEL_SPECS must contain at least one model');
}

export const DEFAULT_MODEL = getModelById(defaultModelSpec.id);
