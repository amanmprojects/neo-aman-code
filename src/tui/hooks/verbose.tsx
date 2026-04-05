import { useKeyboard } from "@opentui/react";
import { createContext, useContext, useState, type ReactNode } from "react";

const VerboseContext = createContext(false);

export function VerboseProvider({ children }: { children: ReactNode }) {
    const [verbose, setVerbose] = useState(false);

    useKeyboard((key) => {
        if (key.ctrl && key.name === "v") {
            setVerbose((prev) => !prev);
        }
    });

    return <VerboseContext.Provider value={verbose}>{children}</VerboseContext.Provider>;
}

export function useVerbose(): boolean {
    return useContext(VerboseContext);
}
