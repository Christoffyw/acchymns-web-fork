import { useJSONFetch } from "@/composables/cancelable_fetch";
import { prepackaged_books, includes, known_references } from "@/scripts/constants";
import type { BookSummary, BookIndex, SongList } from "@/scripts/types";
import type { BookReference } from "@/scripts/constants";
import { Capacitor } from "@capacitor/core";

function getRemoteBookUrl(book_short_name: BookReference): string {
    return `https://raw.githubusercontent.com/ACC-Hymns/acchymns-web/${import.meta.env.VITE_GIT_BRANCH}/` + "books/" + book_short_name;
}

function getLocalBookUrl(book_short_name: BookReference): string {
    return import.meta.env.BASE_URL + "books/" + book_short_name;
}

export function getBookUrl(book_short_name: BookReference): string {
    // If on the web, always use the local copy of the book (which also is the remote copy)
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

    return getRemoteBookUrl(book_short_name);
}

export function getSongSrc(book: BookSummary, song_num: string): string {
    const fileName = song_num + "." + book.fileExtension;
    return `${getBookUrl(book.name.short as BookReference)}/songs/${fileName}`;
}

export function useBookSummary(book_short_name: BookReference) {
    const url = getBookUrl(book_short_name);
    const { data: summary, ...rest } = useJSONFetch<BookSummary>(url + "/summary.json", {});
    return { summary, ...rest };
}

export function useBookSongList(book_short_name: BookReference) {
    const url = getBookUrl(book_short_name);
    const { data: list, ...rest } = useJSONFetch<SongList>(url + "/songs.json", {});
    return { list, ...rest };
}

export function useBookIndex(book_short_name: BookReference) {
    const url = getBookUrl(book_short_name);
    const { data: index, ...rest } = useJSONFetch<BookIndex>(url + "/index.json", {});
    return { index, ...rest };
}

export function useAllBookSummaries(book_references: BookReference[] = [...known_references]) {
    return book_references.map(book_short_name => useBookSummary(book_short_name));
}

export function useAllSongSummaries(book_references: BookReference[] = [...known_references]) {
    return book_references.map(book_short_name => useBookSummary(book_short_name));
}
