import { isRef, ref, watch, type Ref } from "vue";

export type UseCachedFetchOptions = RequestInit & {
    timeout?: number;
    slowFetchThreshold?: number;
    bestAttempt?: boolean;
    cacheLife?: number; // How long to retain the cache in milliseconds
};

export function useFallbackJSONFetch<T>(url: RequestInfo | URL, fallback_url: RequestInfo | URL, options: UseCachedFetchOptions) {
    const result: Ref<T | null> = ref(null);
    const isFetching = ref<boolean>(false);
    const isSlowFetch = ref<boolean>(false);
    const isFinished = ref<boolean>(false);

    async function fetchJSON(url: RequestInfo | URL, options: UseCachedFetchOptions) {
        const controller = new AbortController();
        let id;
        if (options.timeout) {
            id = setTimeout(() => controller.abort(), options.timeout);
        }
        const resp = await fetch(url, {
            ...options,
            signal: controller.signal,
        });
        if (options.timeout) {
            clearTimeout(id);
        }
        isFetching.value = false;
        const json: T = await resp.json();
        return json;
    }

    async function execute() {
        // Set starting lifecycle reporting
        result.value = null;
        isFetching.value = false;
        isSlowFetch.value = false;
        isFinished.value = false;

        isFetching.value = true;

        // When no timeout is set, a slow fetch is 5 seconds
        // When a timeout is set, a slow fetch is 20% of the timeout duration, or past the threshold if used
        const slow_fetch_threshold = options.timeout ? options.slowFetchThreshold ?? 0.2 * options.timeout : 5000;
        const slow_fetch_id = setTimeout(() => (isSlowFetch.value = true), slow_fetch_threshold);

        try {
            result.value = await fetchJSON(url, options);
        } catch (ex: any) {
            // Any extra errors should be reported, aborts we can ignore
            const e = ex as DOMException;
            if (e.name != "AbortError") {
                console.error("Primary URL:", e, e.stack);
            }
            try {
                result.value = await fetchJSON(fallback_url, options);
            } catch (ex2: any) {
                const e2 = ex2 as DOMException;
                if (e2.name != "AbortError") {
                    console.error("Fallback URL:", e, e.stack);
                    isFetching.value = false;
                    return;
                }
            }
        }
        clearTimeout(slow_fetch_id);
        isFetching.value = false;
        isFinished.value = true;
    }

    execute();

    if (isRef(url)) {
        watch(url, () => execute());
    }

    return { result, isFetching, isSlowFetch, isFinished };
}
