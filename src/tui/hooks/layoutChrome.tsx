import { useKeyboard } from "@opentui/react";
import { useState } from "react";

export type LayoutChrome = {
    showSidebar: boolean;
    showFooter: boolean;
};

/**
 * Global chrome toggles for the chat layout: sidebar (Ctrl+S) and footer hints (Ctrl+F).
 */
export function useLayoutChrome(): LayoutChrome {
    const [showSidebar, setShowSidebar] = useState(true);
    const [showFooter, setShowFooter] = useState(true);

    useKeyboard((key) => {
        if (!key.ctrl) return;
        if (key.name === "s") setShowSidebar((prev) => !prev);
        if (key.name === "f") setShowFooter((prev) => !prev);
    });

    return { showSidebar, showFooter };
}
