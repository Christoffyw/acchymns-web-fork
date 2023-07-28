<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { Toast } from "@capacitor/toast";
import { RouterLink } from "vue-router";
import HomeBookBox from "@/components/HomeBookBox.vue";
import { known_references, public_references, type BookReference, includes } from "@/scripts/constants";
import { useCapacitorPreferences } from "@/composables/preferences";
import { useLocalStorage } from "@vueuse/core";

// Not watching deeply, must assign new array

const imported_book_refs = useCapacitorPreferences<BookReference[]>("externalBooks", []);
let import_books_tooltip_status = useLocalStorage<boolean>("import_books_tooltip_complete", false);

// Preview books are books that haven't been imported, and are publicly available
const preview_book_refs = computed(() => {
    return public_references.filter(book_ref => !imported_book_refs.value.includes(book_ref));
});

const reference_input = ref("");

async function addImportedBookByCode(short_book_name: string) {
    // Check if the inputted reference is valid
    if (!includes(known_references, short_book_name)) {
        await Toast.show({
            text: `Unknown hymnal reference (${short_book_name})!`,
        });
        return;
    }

    // Check for duplicate reference
    if (imported_book_refs.value.includes(short_book_name)) {
        await Toast.show({
            text: `Hymnal (${short_book_name}) already imported!`,
        });
        return;
    }

    // Otherwise, add the reference
    imported_book_refs.value.unshift(short_book_name);
    await Toast.show({
        text: `Successfully imported hymnal (${short_book_name})!`,
    });
}

onMounted(() => {
    if (!import_books_tooltip_status.value) import_books_tooltip_status.value = true;
});

function removeImportedReference(to_remove: BookReference) {
    imported_book_refs.value = imported_book_refs.value.filter(book_ref => book_ref != to_remove);
}
</script>

<template>
    <div class="menu">
        <div class="title">
            <img @click="$router.back()" class="ionicon title--left" src="/assets/chevron-back-outline.svg" />
            <h1 class="title--center">Import Hymnals</h1>
        </div>
    </div>

    <div class="main-content">
        <div class="input-option reference-option">
            <input v-model.trim="reference_input" type="text" class="search-bar" placeholder="Reference" />
            <a :disabled="reference_input.length === 0" @click="addImportedBookByCode(reference_input)" class="reference-button">
                <img class="ionicon enter-button-icon" src="/assets/enter-outline.svg" />
            </a>
        </div>
        <div class="warning-label-container">
            <img class="ionicon warning-icon" src="/assets/alert-circle-outline.svg" />
            <h5 class="warning-label">The hymnals below require an internet connection</h5>
        </div>

        <!-- Publicly available, but not imported books -->
        <h2 v-if="preview_book_refs.length != 0">Available Hymnals</h2>
        <div>
            <HomeBookBox v-for="book_ref in preview_book_refs" :key="book_ref" :book_ref="book_ref" :with_link="false">
                <button @click="addImportedBookByCode(book_ref)">
                    <img class="ionicon ionicon-custom booktext--right add-button-icon" src="/assets/add-circle-outline.svg" />
                </button>
            </HomeBookBox>
        </div>

        <!-- Imported Books -->
        <h2 v-if="imported_book_refs.length != 0">Imported Hymnals</h2>
        <div style="padding-bottom: 200px">
            <HomeBookBox v-for="book_ref in imported_book_refs" :key="book_ref" :book_ref="book_ref" :with_link="false">
                <button @click="removeImportedReference(book_ref)">
                    <img class="ionicon ionicon-custom add-button-icon" src="/assets/close.svg" />
                </button>
            </HomeBookBox>
        </div>
    </div>

    <nav class="nav">
        <RouterLink to="/" class="nav__link">
            <img class="ionicon nav__icon" src="/assets/home-outline.svg" />
            <span class="nav__text">Home</span>
        </RouterLink>
        <RouterLink to="/search" class="nav__link">
            <img class="ionicon nav__icon" src="/assets/search-outline.svg" />
            <span class="nav__text">Search</span>
        </RouterLink>
        <RouterLink to="/bookmarks" class="nav__link">
            <img class="ionicon nav__icon" src="/assets/bookmark-outline.svg" />
            <span class="nav__text">Bookmarks</span>
        </RouterLink>
        <RouterLink to="/settings" class="nav__link nav__link--active">
            <img class="ionicon nav__icon--active" src="/assets/settings.svg" />
            <span class="nav__text">Settings</span>
        </RouterLink>
    </nav>
</template>

<style>
@import "@/assets/css/settings.css";
@import "@/assets/css/book.css";
</style>

<style scoped>
.add-button-icon {
    vertical-align: middle;
}
.warning-icon {
    width: 20px;
    display: inline-block;
    margin: 0 5px 0 0;
}
.warning-label-container {
    margin: 10px 30px;
    display: flex;
    justify-content: left;
    text-align: left;
}

.warning-label {
    color: var(--toolbar-text);
    display: inline-block;
    margin: 0 0;
    line-height: 25px;
}

.ionicon-custom {
    filter: invert(100%) sepia(9%) saturate(7497%) hue-rotate(180deg) brightness(103%) contrast(93%);
}

.book {
    max-height: 50px;
}

.reference-option {
    border-bottom: 0;
}

.enter-button-icon {
    translate: -2px 4px;
}

.reference-button {
    background-color: var(--div-color);
    border-radius: 15px;
    padding: 5px 10px;
    box-shadow: 0 0 15px rgb(0, 0, 0, 0.1);
    height: 32px;
}

.search-bar {
    background-color: var(--search-color);
    height: 30px;
    border-radius: 15px;
    margin: 0px 15px 0px 0px;
    display: flex;
    flex-direction: row;
    align-items: center;
}
</style>
