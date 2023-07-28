import { useCachedJSONFetch, type UseCachedFetchOptions } from "@/composables/cached_fetch";
import { prepackaged_books, includes } from "@/scripts/constants";
import type { BookSummary, BookIndex, SongList } from "@/scripts/types";
import { computed, ref } from "vue";
import type { BookReference } from "@/scripts/constants";
import { Capacitor } from "@capacitor/core";

export function getBookUrl(book_short_name: BookReference, fallback = false): string {
    // If on the web, always use the local copy of the book
    if (Capacitor.getPlatform() == "web") {
        return getLocalBookUrl(book_short_name);
    }

    // Prepackaged books are always local
    if (includes(prepackaged_books, book_short_name)) {
        return getLocalBookUrl(book_short_name);
    }

    // If in development, always use your local copy of the book
    if (!import.meta.env.PROD) {
        return getLocalBookUrl(book_short_name);
    }

    // If falling back because of a failure use the local version of the book
    if (fallback) {
        return getLocalBookUrl(book_short_name);
    }

    return getRemoteBookUrl(book_short_name);
}

function getRemoteBookUrl(book_short_name: BookReference): string {
    return `https://raw.githubusercontent.com/ACC-Hymns/acchymns-web/${import.meta.env.VITE_GIT_BRANCH}/` + "books/" + book_short_name;
}

function getLocalBookUrl(book_short_name: BookReference): string {
    return import.meta.env.BASE_URL + "books/" + book_short_name;
}

export function useBookSummary(book_short_name: BookReference) {
    const url = getBookUrl(book_short_name);
    const summary = ref<BookSummary | null>(null);

    async function execute() {
        const result = await fetch(url + "/summary.json");
        summary.value = await result.json();
    }

    execute();

    return { summary };
}

export function useBookSongList(book_short_name: BookReference) {
    const url = getBookUrl(book_short_name);
    const song_list = ref<SongList | null>(null);

    async function execute() {
        const result = await fetch(url + "/songs.json");
        song_list.value = await result.json();
    }

    execute();

    return { song_list };
}

export function useBookIndex(book_short_name: BookReference) {
    const url = getBookUrl(book_short_name);
    const index = ref<BookIndex | null>(null);

    async function execute() {
        const result = await fetch(url + "/index.json");
        index.value = await result.json();
    }

    execute();

    return { index };
}
