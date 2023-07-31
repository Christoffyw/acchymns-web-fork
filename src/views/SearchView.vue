<script setup lang="ts">
import { RouterLink } from "vue-router";
import { computed, ref, watch } from "vue";
import { useSessionStorage } from "@vueuse/core";
import { Capacitor } from "@capacitor/core";
import type { BookSummary, Song, SongSearchInfo, SearchParams } from "@/scripts/types";
import { hexToRgb, Color, Solver } from "@/scripts/color";
import { cleanStr } from "@/scripts/search";
import { useAvailableBookRefs, useBookSummaries, useBookSongLists } from "@/composables/book_metadata";
import type { BookReference } from "@/scripts/constants";

const search_params = useSessionStorage<SearchParams>("searchParams", { search: "", bookFilters: [] });
const available_book_refs = useAvailableBookRefs();
const book_summaries = useBookSummaries(available_book_refs);
const song_lists = useBookSongLists(available_book_refs);

const search_query = ref(search_params.value.search);
const stripped_query = computed(() => {
    return cleanStr(search_query.value);
});

watch(search_query, new_query => {
    search_params.value.search = new_query;
});

const search_results = computed(() => {
    if (search_params.value.bookFilters.length > 0) {
        return available_songs.value
            .filter(s => {
                return (
                    (s.stripped_title?.includes(stripped_query.value) || s?.stripped_first_line?.includes(stripped_query.value) || s?.number == stripped_query.value) &&
                    search_params.value.bookFilters.find(b => b == s.book.name.short)
                );
            })
            .sort((a, b) => a.title.replace(/[.,/#!$%^&*;:{}=\-_'"`~()]/g, "").localeCompare(b.title.replace(/[.,/#!$%^&*;:{}=\-_'"`~()]/g, "")));
    } else {
        if (search_query.value === "") return [];
        return available_songs.value
            .filter(s => {
                return s.stripped_title?.includes(stripped_query.value) || s?.stripped_first_line?.includes(stripped_query.value) || s?.number == stripped_query.value;
            })
            .sort((a, b) => a.title.replace(/[.,/#!$%^&*;:{}=\-_'"`~()]/g, "").localeCompare(b.title.replace(/[.,/#!$%^&*;:{}=\-_'"`~()]/g, "")));
    }
});

const increment = 50;
const display_limit = ref(increment);

const limited_search_results = computed(() => {
    // Fuzzy limiting of search results, I.E. if the limit is 50, but there are 90 songs, just show the 90 songs
    if (search_results.value.length - display_limit.value < increment) {
        return search_results.value;
    }
    return search_results.value.slice(0, display_limit.value);
});

const available_songs = computed<SongSearchInfo[]>(() => {
    const result: SongSearchInfo[] = [];
    for (const book_ref of available_book_refs.value) {
        for (const song_number of Object.keys(song_lists.value[book_ref].list.value ?? {})) {
            const song: Song | null = song_lists.value[book_ref].list.value?.[song_number] ?? null;
            const summary: BookSummary | null = book_summaries.value?.[book_ref]?.summary.value;
            if (song && summary) {
                result.push({
                    title: song.title ?? "",
                    number: song_number,
                    book: summary,
                    stripped_title: cleanStr(song.title ?? ""),
                } as SongSearchInfo);
            }
        }
    }
    return result;
});

const filter_content = ref<Element>();

var isOpen = false;

function resetModals() {
    if (filter_content.value?.classList.contains("dropdown-content-active") && !isOpen) filter_content.value?.classList.remove("dropdown-content-active");
    isOpen = false;
}

function showDropdown() {
    if (filter_content.value?.classList.contains("dropdown-content-active")) {
        filter_content.value?.classList.remove("dropdown-content-active");
        isOpen = false;
    } else {
        isOpen = true;
        filter_content.value?.classList.add("dropdown-content-active");
    }
}

let book_filters = ref<Element[]>([]);
let all_hymnals_filter = ref<Element>();

function filterBook(short_book_name: string) {
    isOpen = true;
    if (search_params.value.bookFilters.includes(short_book_name as BookReference)) {
        let index = search_params.value.bookFilters.findIndex(b => b == short_book_name);
        search_params.value.bookFilters.splice(index, 1);
    } else {
        search_params.value.bookFilters.push(short_book_name as BookReference);
    }
}

function clearFilters() {
    search_params.value.bookFilters = [];
}

function checkmarked(selected: boolean) {
    if (selected) {
        return "./assets/checkmark-circle.svg";
    } else {
        return "./assets/ellipse-outline.svg";
    }
}

function colorFilter(primary_color?: string) {
    const rgb = hexToRgb(primary_color ?? "#000000");
    if (rgb?.length !== 3) {
        return "#000000";
    }
    const solver = new Solver(new Color(rgb[0], rgb[1], rgb[2]));
    const result = solver.solve();
    return result.filter;
}
</script>

<template>
    <div @click="resetModals" class="blocker">
        <h1 class="pagetitle">Search</h1>
        <div class="search-bar">
            <input v-model="search_query" placeholder="Search for a song title or number..." aria-label="Search through site content" />
            <button disabled>
                <svg viewBox="0 0 1024 1024">
                    <path
                        class="path1"
                        d="M848.471 928l-263.059-263.059c-48.941 36.706-110.118 55.059-177.412 55.059-171.294 0-312-140.706-312-312s140.706-312 312-312c171.294 0 312 140.706 312 312 0 67.294-24.471 128.471-55.059 177.412l263.059 263.059-79.529 79.529zM189.623 408.078c0 121.364 97.091 218.455 218.455 218.455s218.455-97.091 218.455-218.455c0-121.364-103.159-218.455-218.455-218.455-121.364 0-218.455 97.091-218.455 218.455z"
                    ></path>
                </svg>
            </button>
        </div>
        <div class="filters">
            <a @click="showDropdown()" class="dropdown">
                <p class="dropdown-text">Filters</p>
                <img class="ionicon filter-icon" src="/assets/filter-outline.svg" />
            </a>
            <div class="dropdown-content" ref="filter_content">
                <a>
                    <div class="dropdown-content-top-item" ref="all_hymnals_filter" @click="clearFilters">
                        <img class="ionicon checkmark-icon" :src="checkmarked(search_params.bookFilters.length == 0)" />
                        <div class="dropdown-content-text">All Hymnals</div>
                    </div>
                </a>
                <a v-for="book_ref in available_book_refs" :key="book_ref" @click="filterBook(book_ref)" ref="book_filters">
                    <div class="dropdown-content-item">
                        <img class="ionicon" :src="checkmarked(search_params.bookFilters.includes(book_ref))" :style="colorFilter(book_summaries[book_ref].summary.value?.primaryColor)" />
                        <div class="dropdown-content-text">{{ book_summaries[book_ref].summary.value?.name?.medium }}</div>
                    </div>
                </a>
            </div>
        </div>

        <h2 v-if="search_results.length > 0" style="margin-top: 10px; margin-bottom: 10px">Search Results ({{ search_results.length }})</h2>
        <div class="songlist">
            <RouterLink
                v-for="song in limited_search_results"
                :key="song.title + song.number + song.book.name.short"
                :to="`/display/${song.book.name.short}/${song.number}`"
                class="song"
                :style="`background: linear-gradient(135deg, ${song.book.primaryColor}, ${song.book.secondaryColor})`"
            >
                <div>
                    <div class="song__title">{{ song.title }}</div>
                    <div class="book__title">{{ song.book.name.medium }}</div>
                </div>
                <div class="booktext--right">
                    <div class="song__number">#{{ song.number }}</div>
                    <img
                        v-if="song.book.addOn && Capacitor.getPlatform() !== 'web'"
                        class="ionicon"
                        style="filter: invert(100%) sepia(9%) saturate(7497%) hue-rotate(180deg) brightness(103%) contrast(93%)"
                        src="/assets/wifi.svg"
                    />
                </div>
            </RouterLink>
            <div v-if="limited_search_results.length < search_results.length" @click="display_limit += increment" class="song" style="background: #2196f3; justify-content: center">
                <div class="song__title">Show more</div>
            </div>
        </div>
    </div>

    <nav class="nav">
        <RouterLink to="/" class="nav__link">
            <img class="ionicon nav__icon" src="/assets/home-outline.svg" />
            <span class="nav__text">Home</span>
        </RouterLink>
        <RouterLink to="/search" class="nav__link nav__link--active">
            <img class="ionicon nav__icon--active" src="/assets/search.svg" />
            <span class="nav__text">Search</span>
        </RouterLink>
        <RouterLink to="/bookmarks" class="nav__link">
            <img class="ionicon nav__icon" src="/assets/bookmark-outline.svg" />
            <span class="nav__text">Bookmarks</span>
        </RouterLink>
        <RouterLink to="/settings" class="nav__link">
            <img class="ionicon nav__icon" src="/assets/settings-outline.svg" />
            <span class="nav__text">Settings</span>
        </RouterLink>
    </nav>
</template>

<style>
@import "@/assets/css/search.css";
@import "@/assets/css/song.css";

.blocker {
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    width: 100vw;
    height: 100vh;
    content: " ";
}

.dropdown-content {
    visibility: hidden;
    position: absolute;
    background-color: var(--button-color);
    color: var(--color);
    border-radius: 15px;
    min-width: 160px;
    box-shadow: 0 0 20px rgba(0, 0, 0, 0.1);
    padding-bottom: 5px;
    margin: 10px 0px 0px 0px;
    z-index: 0.5;
    opacity: 0;
    transform: translate(0px, -10px);
    transition: all 0.2s ease;
}

.dropdown-content-top-item {
    cursor: pointer;
    border-bottom: var(--border-color);
    padding: 0px 15px;
    display: flex;
    justify-content: flex-start;
    align-items: center;
}

.dropdown-content-active {
    transform: translateY(0px);
    visibility: visible;
    opacity: 1;
    display: inline-block;
}

.dropdown-content-item {
    cursor: pointer;
    padding: 0px 15px;
    display: flex;
    justify-content: flex-start;
    align-items: center;
}

.dropdown-content-text {
    padding: 15px;
}

.dropdown {
    cursor: pointer;
    background-color: var(--button-color);
    color: var(--color);
    padding: 10px 15px;
    border-radius: 30px;
    border-width: 2px;
    box-shadow: 0 0 3px rgba(0, 0, 0, 0.1);
    display: flex;
    justify-content: center;
    margin-top: 5px;
    margin-right: 10px;
    z-index: 1;
}

.dropdown-text {
    margin: 0;
    height: 25px;
    line-height: 25px;
}

.filter-icon {
    filter: var(--change-svg-filter);
    display: inline-block;
    position: relative;
    margin: auto auto;
    padding-left: 15px;
}

.checkmark-icon {
    filter: var(--svg-color);
}
</style>
