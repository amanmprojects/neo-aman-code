/** Default cap when the tool omits headLimit (schema: "Defaults to 250"). */
const DEFAULT_HEAD_LIMIT = 250;

/**
 * Resolved limit: `undefined` means unlimited (caller passed `0`); otherwise a positive int.
 * When `headLimit` is omitted, uses {@link DEFAULT_HEAD_LIMIT}.
 */
function resolveHeadLimit(headLimit: number | undefined): number | undefined {
	if (headLimit === undefined) {
		return DEFAULT_HEAD_LIMIT;
	}

	if (headLimit === 0) {
		return undefined;
	}

	return headLimit;
}

/**
 * How many raw lines from ripgrep to keep before stat/sort in files_with_matches mode.
 * `undefined` means use the full list (unlimited).
 */
export function getPreStatLimit(
	headLimit: number | undefined,
	offset: number | undefined,
): number | undefined {
	const limit = resolveHeadLimit(headLimit);
	if (limit === undefined) {
		return undefined;
	}

	const o = offset ?? 0;
	return o + limit;
}

export function applyHeadLimit<T>(
	items: readonly T[],
	headLimit: number | undefined,
	offset: number = 0,
): {
	items: T[];
	appliedLimit: number | undefined;
	wasTruncated: boolean;
} {
	const limit = resolveHeadLimit(headLimit);
	const start = Math.max(0, offset);
	const afterOffset = items.slice(start);

	if (limit === undefined) {
		return {
			items: [...afterOffset],
			appliedLimit: undefined,
			wasTruncated: false,
		};
	}

	const page = afterOffset.slice(0, limit);
	const wasTruncated = afterOffset.length > limit;

	return {
		items: page,
		appliedLimit: limit,
		wasTruncated,
	};
}
