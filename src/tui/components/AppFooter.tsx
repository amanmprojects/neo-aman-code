import { TextAttributes } from "@opentui/core";
import { useEffect, useState } from "react";
import { useChatSessionStatus } from "../hooks/chatSession";
import { theme } from "../theme";

export type AppFooterVariant = "splash" | "chat";

type AppFooterProps = {
    variant: AppFooterVariant;
    cwdDisplay: string;
    version: string;
};

const PHRASES = [
    'Accomplishing',
    'Actioning',
    'Actualizing',
    'Architecting',
    'Baking',
    'Beaming',
    "Beboppin'",
    'Befuddling',
    'Billowing',
    'Blanching',
    'Bloviating',
    'Boogieing',
    'Boondoggling',
    'Booping',
    'Bootstrapping',
    'Brewing',
    'Bunning',
    'Burrowing',
    'Calculating',
    'Canoodling',
    'Caramelizing',
    'Cascading',
    'Catapulting',
    'Cerebrating',
    'Channeling',
    'Channelling',
    'Choreographing',
    'Churning',
    'Clauding',
    'Coalescing',
    'Cogitating',
    'Combobulating',
    'Composing',
    'Computing',
    'Concocting',
    'Considering',
    'Contemplating',
    'Cooking',
    'Crafting',
    'Creating',
    'Crunching',
    'Crystallizing',
    'Cultivating',
    'Deciphering',
    'Deliberating',
    'Determining',
    'Dilly-dallying',
    'Discombobulating',
    'Doing',
    'Doodling',
    'Drizzling',
    'Ebbing',
    'Effecting',
    'Elucidating',
    'Embellishing',
    'Enchanting',
    'Envisioning',
    'Evaporating',
    'Fermenting',
    'Fiddle-faddling',
    'Finagling',
    'Flambéing',
    'Flibbertigibbeting',
    'Flowing',
    'Flummoxing',
    'Fluttering',
    'Forging',
    'Forming',
    'Frolicking',
    'Frosting',
    'Gallivanting',
    'Galloping',
    'Garnishing',
    'Generating',
    'Gesticulating',
    'Germinating',
    'Gitifying',
    'Grooving',
    'Gusting',
    'Harmonizing',
    'Hashing',
    'Hatching',
    'Herding',
    'Honking',
    'Hullaballooing',
    'Hyperspacing',
    'Ideating',
    'Imagining',
    'Improvising',
    'Incubating',
    'Inferring',
    'Infusing',
    'Ionizing',
    'Jitterbugging',
    'Julienning',
    'Kneading',
    'Leavening',
    'Levitating',
    'Lollygagging',
    'Manifesting',
    'Marinating',
    'Meandering',
    'Metamorphosing',
    'Misting',
    'Moonwalking',
    'Moseying',
    'Mulling',
    'Mustering',
    'Musing',
    'Nebulizing',
    'Nesting',
    'Newspapering',
    'Noodling',
    'Nucleating',
    'Orbiting',
    'Orchestrating',
    'Osmosing',
    'Perambulating',
    'Percolating',
    'Perusing',
    'Philosophising',
    'Photosynthesizing',
    'Pollinating',
    'Pondering',
    'Pontificating',
    'Pouncing',
    'Precipitating',
    'Prestidigitating',
    'Processing',
    'Proofing',
    'Propagating',
    'Puttering',
    'Puzzling',
    'Quantumizing',
    'Razzle-dazzling',
    'Razzmatazzing',
    'Recombobulating',
    'Reticulating',
    'Roosting',
    'Ruminating',
    'Sautéing',
    'Scampering',
    'Schlepping',
    'Scurrying',
    'Seasoning',
    'Shenaniganing',
    'Shimmying',
    'Simmering',
    'Skedaddling',
    'Sketching',
    'Slithering',
    'Smooshing',
    'Sock-hopping',
    'Spelunking',
    'Spinning',
    'Sprouting',
    'Stewing',
    'Sublimating',
    'Swirling',
    'Swooping',
    'Symbioting',
    'Synthesizing',
    'Tempering',
    'Thinking',
    'Thundering',
    'Tinkering',
    'Tomfoolering',
    'Topsy-turvying',
    'Transfiguring',
    'Transmuting',
    'Twisting',
    'Undulating',
    'Unfurling',
    'Unravelling',
    'Vibing',
    'Waddling',
    'Wandering',
    'Warping',
    'Whatchamacalliting',
    'Whirlpooling',
    'Whirring',
    'Whisking',
    'Wibbling',
    'Working',
    'Wrangling',
    'Zesting',
    'Zigzagging',
] as const;

const PHRASE_INTERVAL_MS = 1000;

/**
 * Footer activity: opentui-spinner (cli-spinners) + rotating status copy.
 */
function FooterAgentActivity() {
    const status = useChatSessionStatus();
    const active = status === "streaming" || status === "submitted";
    const [phraseIndex, setPhraseIndex] = useState(0);

    useEffect(() => {
        if (!active) {
            setPhraseIndex(0);
            return;
        }
        const id = setInterval(() => {
            setPhraseIndex((i) => (i + 1) % PHRASES.length);
        }, PHRASE_INTERVAL_MS);
        return () => clearInterval(id);
    }, [active]);

    if (!active) {
        return null;
    }

    return (
        <box flexDirection="row" flexShrink={1} minWidth={0} gap={1}>
            <spinner name="moon" color={theme.accent} />
            <text flexShrink={1} minWidth={0}>
                <span fg={theme.muted}>{PHRASES[phraseIndex]}</span>
            </text>
        </box>
    );
}

export function AppFooter({ variant, cwdDisplay, version }: AppFooterProps) {
    if (variant === "splash") {
        return (
            <box flexShrink={0} paddingX={1} paddingY={0} flexDirection="row" justifyContent="space-between" width="100%">
                <text attributes={TextAttributes.DIM} fg={theme.dim}>
                    {cwdDisplay}
                </text>
                <text attributes={TextAttributes.DIM} fg={theme.dim}>
                    {version}
                </text>
            </box>
        );
    }

    return (
        <box
            flexShrink={0}
            paddingX={0}
            paddingY={0}
            flexDirection="row"
            justifyContent="space-between"
            width="100%"
            minWidth={0}
            gap={1}
        >
            <box minWidth={0} flexShrink={1}>
                <FooterAgentActivity />
            </box>
            <text flexShrink={0} attributes={TextAttributes.DIM} fg={theme.dim}>
                {
                    "esc interrupt · tab agents · ctrl+p commands · ctrl+s sidebar · ctrl+f footer · ctrl+v verbose"
                }
            </text>
        </box>
    );
}
