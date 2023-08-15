import { cancellableFetchJSON } from "@/composables/cancelable_fetch";
import type { BookReference } from "@/scripts/constants";

import { Dialog } from "@capacitor/dialog";
import type { BookSummary } from "./types";
import { getLocalBookUrl } from "@/composables/book_metadata";
import { useCapacitorPreferences } from "@/composables/preferences";

const imported_book_refs = useCapacitorPreferences<BookReference[]>("externalBooks", []);

export async function displayMissingBookDialog(book_ref: BookReference) {
    // We prioritize speed here to the user, so use the local version of the book.
    const book_summary = await cancellableFetchJSON<BookSummary>(getLocalBookUrl(book_ref) + "/summary.json", {});

    if (!imported_book_refs.value.includes(book_ref)) {
        if (book_summary) {
            const confirmed = await Dialog.confirm({
                title: "Import Missing Book?",
                message: `Would you like to import ${book_summary.name.long}?`,
                okButtonTitle: "Yes",
                cancelButtonTitle: "No",
            });

            if (confirmed.value) {
                imported_book_refs.value.push(book_ref);
            }
        }
    }
}
