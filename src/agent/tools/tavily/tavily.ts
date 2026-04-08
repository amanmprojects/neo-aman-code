import { tavilySearch, tavilyExtract } from "@tavily/ai-sdk";
import type { UIToolInvocation } from "ai";

export type TavilySearchToolInvocation = UIToolInvocation<
    ReturnType<typeof tavilySearch>
>;
export type TavilyExtractToolInvocation = UIToolInvocation<
    ReturnType<typeof tavilyExtract>
>;

/** Registers Tavily search + extract when `TAVILY_API_KEY` is set; otherwise `{}`. */
export function createTavilyTools() {
    const key = process.env.TAVILY_API_KEY?.trim();
    if (!key) {
        return {};
    }
    const auth = { apiKey: key };
    return {
        tavilySearch: tavilySearch({
            ...auth,
            searchDepth: "basic",
            maxResults: 5,
            includeAnswer: true,
        }),
        tavilyExtract: tavilyExtract({
            ...auth,
            extractDepth: "basic",
            format: "markdown",
        }),
    };
}
