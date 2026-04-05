import { createContext, useContext, type ReactNode } from "react";
import { DEFAULT_MODEL } from "../../agent/providers";

const ModelNameContext = createContext<string>(DEFAULT_MODEL);

export function ModelNameProvider({
    modelName = DEFAULT_MODEL,
    children,
}: {
    modelName?: string;
    children: ReactNode;
}) {
    return (
        <ModelNameContext.Provider value={modelName}>{children}</ModelNameContext.Provider>
    );
}

export function useModelName(): string {
    return useContext(ModelNameContext);
}
