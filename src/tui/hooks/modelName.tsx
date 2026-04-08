import { createContext, useContext, type ReactNode } from "react";
import { AGENT_MODEL_LABEL } from "../../agent/modelLabel";

const ModelNameContext = createContext<string>(AGENT_MODEL_LABEL);

export function ModelNameProvider({
    modelName = AGENT_MODEL_LABEL,
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
