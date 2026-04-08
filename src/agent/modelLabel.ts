import type { LanguageModel } from "ai";
import { MODEL_LIST } from "./providers";

/** Index into `MODEL_LIST` passed to `ToolLoopAgent` — keep in sync with `agent/index.ts` usage. */
export const AGENT_MODEL_INDEX = 1 as const;

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

export const AGENT_MODEL = MODEL_LIST[AGENT_MODEL_INDEX]!;
export const AGENT_MODEL_LABEL = languageModelLabel(AGENT_MODEL);
