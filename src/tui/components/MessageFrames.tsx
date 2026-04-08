import type { ReactNode } from "react";
import type { BorderSides, BorderStyle, RGBA } from "@opentui/core";
import { theme } from "../theme";
import { MessageFrame } from "./MessageFrame";

type SharedFrameProps = {
    children: ReactNode;
    backgroundColor?: string | RGBA;
    paddingY?: number;
};

/** Assistant markdown text — left rule, blends with background. */
export function AssistantMessageFrame({ children, ...rest }: SharedFrameProps) {
    return (
        <MessageFrame {...rest} border={["left"]} borderColor={theme.bg}>
            {children}
        </MessageFrame>
    );
}

/** Assistant reasoning — heavier left rule, same border color as body text. */
export function AssistantReasoningFrame({ children, ...rest }: SharedFrameProps) {
    return (
        <MessageFrame {...rest} border={["left"]} borderColor={theme.panel} borderStyle="heavy">
            {children}
        </MessageFrame>
    );
}

type AssistantToolFrameBordered = SharedFrameProps & {
    border?: true | BorderSides[];
    borderStyle?: BorderStyle;
};

type AssistantToolFramePlain = SharedFrameProps & {
    border: false;
    borderStyle?: never;
};

export type AssistantToolFrameProps = AssistantToolFrameBordered | AssistantToolFramePlain;

/** Tool invocations — same chrome as user text (strip, padding, heavy rule) but border uses bg, not accent. */
export function AssistantToolFrame(props: AssistantToolFrameProps) {
    const { children, backgroundColor, paddingY } = props;
    if (props.border === false) {
        return (
            <MessageFrame border={false} backgroundColor={backgroundColor} paddingY={paddingY}>
                {children}
            </MessageFrame>
        );
    }
    const border = props.border ?? ["left"];
    const borderStyle = props.borderStyle ?? "heavy";
    return (
        <MessageFrame
            border={border}
            borderColor={theme.bg}
            borderStyle={borderStyle}
            backgroundColor={backgroundColor ?? theme.stripBar}
            paddingY={paddingY ?? 1}
        >
            {children}
        </MessageFrame>
    );
}

type UserMessageFrameProps =
    | ({ variant?: "text"; children: ReactNode } & SharedFrameProps)
    | ({ variant: "unknown"; children: ReactNode } & SharedFrameProps);

/** User bubble — accent strip for text, full accent border for unknown parts. */
export function UserMessageFrame(props: UserMessageFrameProps) {
    const { children, variant = "text", backgroundColor, paddingY } = props;
    if (variant === "unknown") {
        return (
            <MessageFrame
                backgroundColor={backgroundColor}
                paddingY={paddingY}
                borderColor={theme.accent}
            >
                {children}
            </MessageFrame>
        );
    }
    return (
        <MessageFrame
            border={["left"]}
            borderColor={theme.accent}
            backgroundColor={backgroundColor ?? theme.stripBar}
            paddingY={paddingY ?? 1}
            borderStyle="heavy"
        >
            {children}
        </MessageFrame>
    );
}
