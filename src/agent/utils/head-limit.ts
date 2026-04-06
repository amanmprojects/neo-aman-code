const DEFAULT_HEAD_LIMIT = 250;

export type HeadLimitResult<T> = {
    items: T[];
    appliedLimit?: number;
    wasTruncated: boolean;
};

/**
 * Slices items for pagination. When `headLimit` is omitted, default cap is 250.
 * `headLimit === 0` means unlimited (after `offset`).
 *
 * Two-argument form `applyHeadLimit(items, cap)` takes the first `cap` items (no offset).
 */
export function applyHeadLimit<T>(
    items: T[],
    headLimit?: number,
    offset?: number,
): HeadLimitResult<T> {
    if (arguments.length === 2 && offset === undefined) {
        const cap = headLimit ?? DEFAULT_HEAD_LIMIT;
        if (cap <= 0) {
            return { items: [...items], wasTruncated: false };
        }
        const sliced = items.slice(0, cap);
        return {
            items: sliced,
            appliedLimit: cap,
            wasTruncated: items.length > cap,
        };
    }

    const off = offset ?? 0;
    let effective = headLimit;
    if (effective === undefined) {
        effective = DEFAULT_HEAD_LIMIT;
    }
    if (effective === 0) {
        const sliced = items.slice(off);
        return {
            items: sliced,
            wasTruncated: false,
            appliedLimit: undefined,
        };
    }

    const sliced = items.slice(off, off + effective);
    const wasTruncated = off + effective < items.length;
    return {
        items: sliced,
        appliedLimit: effective,
        wasTruncated,
    };
}

/**
 * Max number of raw rg lines to stat when paginating; `undefined` uses all lines.
 */
export function getPreStatLimit(
    headLimit?: number,
    offset?: number,
): number | undefined {
    const off = offset ?? 0;
    if (headLimit === 0) {
        return undefined;
    }
    const cap = headLimit ?? DEFAULT_HEAD_LIMIT;
    return off + cap;
}
