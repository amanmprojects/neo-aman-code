import type { LanguageModel } from "ai";
import { AGENT_MODEL_ID, AGENT_MODEL_INDEX, getModelById } from "./providers";

export { AGENT_MODEL_ID, AGENT_MODEL_INDEX };

/** Human-readable model id for the TUI: gateway string id, or `modelId` from a provider model instance. */
export function languageModelLabel(model: LanguageModel): string {
    if (typeof model === "string") {
        return model;
    }
    if (model !== null && typeof model === "object" && "modelId" in model) {
        const id = (model as { modelId: unknown }).modelId;
        if (typeof id === "string" && id.length > 0) {
            return id;
        }
    }
    return "unknown-model";
}

export const AGENT_MODEL = getModelById(AGENT_MODEL_ID);
export const AGENT_MODEL_LABEL = languageModelLabel(AGENT_MODEL);
