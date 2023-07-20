import { Preferences } from "@capacitor/preferences";
import { compare } from 'compare-versions';

export async function migrate() {
    const current_semver_version = import.meta.env.VITE_APP_VERSION;
    const previous_semver_version = await Preferences.get({ key: "AppVersion" });
    if (previous_semver_version.value === current_semver_version) {
        return;
    }

    // Pre-2.0.0, as after this version, we always set the AppVersion.
    if (previous_semver_version.value == null) {
        // Migrate from 1.X.Y to 2.0.0
        // All that's required to migrate, is to move bookmark data from localStorage to Capacitor Storage.
        // and to change from { book: string, song: string } to { book: string, number: string }
        const bookmarks = JSON.parse(localStorage.getItem("bookmarks") ?? "[]");
        let new_bookmarks = JSON.parse((await Preferences.get({ key: "bookmarks" })).value ?? "[]"); // Don't overwrite existing bookmarks just in case
        for (const bookmark of bookmarks) {
            if (bookmark.song) {
                new_bookmarks.push({ book: bookmark.book, number: bookmark.song });
            } else {
                // We've already been migrated.??
                new_bookmarks.push(bookmark);
            }
        }
        new_bookmarks = [...new Set(new_bookmarks)]; // Remove duplicates, if any
        await Preferences.set({ key: "bookmarks", value: JSON.stringify(new_bookmarks) });
    } else if (compare(previous_semver_version.value, "2.0.3", "<")) {
        // Migrate from 2.X.Y to 2.0.3
        // Migrate from URLs for external books to references
        const external_books: string[] = JSON.parse((await Preferences.get({ key: "externalBooks" })).value ?? "[]");
        for (let i = 0; i < external_books.length; i++) {
            const url = external_books[i];
            const book_reference = url.split("books/")[1]; // Get the book reference, ex: acchymns.app/books/CH -> CH
            external_books[i] = book_reference;
        }
        await Preferences.set({ key: "externalBooks", value: JSON.stringify(external_books) });
    }

    // Update the "previous semver version"
    await Preferences.set({ key: "AppVersion", value: current_semver_version });
}
