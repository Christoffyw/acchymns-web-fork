import { isRef, ref, watch, type Ref } from "vue";

export type UseCancelableFetchOptions = RequestInit & {
    timeout?: number;
    slowFetchThreshold?: number;
    bestAttempt?: boolean;
    cacheLife?: number; // How long to retain the cache in milliseconds
};

export async function fetchJSON<T>(url: RequestInfo | URL, options: UseCancelableFetchOptions): Promise<T> {
    const controller = new AbortController();
    let id;
    if (options.timeout) {
        id = setTimeout(() => controller.abort(), options.timeout);
    }
    const resp = await fetch(url, {
        ...options,
        signal: controller.signal,
    });
    clearTimeout(id);
    const json: T = await resp.json();
    return json;
}

export async function cancellableFetchJSON<T>(url: RequestInfo | URL, options: UseCancelableFetchOptions): Promise<T | null> {
    try {
        return fetchJSON<T>(url, options);
    } catch (ex: any) {
        // Any extra errors should be reported, aborts we can ignore
        const e = ex as DOMException;
        if (e.name != "AbortError") {
            console.error("Primary URL:", e, e.stack);
        }
    }
    return null;
}

export function useJSONFetch<T>(url: RequestInfo | URL, options: UseCancelableFetchOptions) {
    const data: Ref<T | null> = ref(null);
    const isFetching = ref<boolean>(false);
    const isSlowFetch = ref<boolean>(false);
    const isFinished = ref<boolean>(false);
    const isFailed = ref<boolean>(false);

    async function execute() {
        // Set starting lifecycle reporting
        isFetching.value = false;
        isSlowFetch.value = false;
        isFinished.value = false;
        isFailed.value = false;
        isFetching.value = true;

        // When no timeout is set, a slow fetch is 5 seconds
        // When a timeout is set, a slow fetch is 20% of the timeout duration, or past the threshold if used
        const slow_fetch_threshold = options.timeout ? options.slowFetchThreshold ?? 0.2 * options.timeout : 5000;
        const slow_fetch_id = setTimeout(() => (isSlowFetch.value = true), slow_fetch_threshold);

        try {
            data.value = await fetchJSON(url, options);
        } catch (ex: any) {
            // Any extra errors should be reported, aborts we can ignore
            const e = ex as DOMException;
            if (e.name != "AbortError") {
                console.error("Primary URL:", e, e.stack);
                isFailed.value = true;
            }
        }
        clearTimeout(slow_fetch_id);
        isFetching.value = false;
        isFinished.value = true;
    }

    execute();

    // Refresh fetch results if url changes
    if (isRef(url)) {
        watch(url, () => execute());
    }

    return { data, isFetching, isSlowFetch, isFinished, isFailed };
}
