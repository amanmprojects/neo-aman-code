import { theme } from "../theme";

export function UserMessage({ message }: { message: string }) {
    return (
        <box flexDirection="row"
            alignItems="stretch"
            flexShrink={0}
            borderColor={theme.accent}
            border={['left']}
            borderStyle="heavy">

            <box
                flexGrow={1}
                backgroundColor={theme.stripBar}
                paddingX={2}
                paddingY={1}
            >
                <text fg={theme.text}>{message}</text>
            </box>
        </box>
    );
}

