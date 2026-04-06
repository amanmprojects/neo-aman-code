import { useKeyboard } from "@opentui/react";
import { createContext, useContext, useState, type ReactNode } from "react";

const VerboseContext = createContext<boolean | undefined>(undefined);

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
    const value = useContext(VerboseContext);
    if (value === undefined) {
        throw new Error("useVerbose must be used within VerboseProvider");
    }
    return value;
}
