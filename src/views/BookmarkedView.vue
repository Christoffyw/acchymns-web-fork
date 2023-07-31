<script setup lang="ts">
import { RouterLink } from "vue-router";
import { computed, readonly, ref, unref } from "vue";
import { Capacitor } from "@capacitor/core";
import type { SongReference, SongSearchInfo, BookSummary, SongList } from "@/scripts/types";

import { useCapacitorPreferences } from "@/composables/preferences";
import { useBookSummaries, useBookSongLists } from "@/composables/book_metadata";
import { cleanStr } from "@/scripts/search";

const search_query = ref("");
const stripped_query = computed(() => cleanStr(search_query.value));

const search_results = computed(() => {
    return available_songs.value
        .filter(s => {
            return s.stripped_title?.includes(stripped_query.value) || s?.number?.includes(stripped_query.value);
        })
        .sort((a, b) => a.title.localeCompare(b.title));
});

const bookmarks = useCapacitorPreferences<SongReference[]>("bookmarks", []);
const book_summaries = readonly(useBookSummaries());
const song_lists = readonly(useBookSongLists());

const available_songs = computed<SongSearchInfo[]>(() => {
    const result: SongSearchInfo[] = [];
    for (const bookmark of bookmarks.value) {
        const song_list: SongList | null = unref(song_lists.value[bookmark.book]?.list) as SongList | null;
        const summary: BookSummary | null = unref(book_summaries.value?.[bookmark.book]?.summary);
        if (song_list != null && summary != null) {
            result.push({
                title: song_list[bookmark.number].title ?? "",
                number: bookmark.number,
                book: summary,
                stripped_title: cleanStr(song_list[bookmark.number].title ?? ""),
            } as SongSearchInfo);
        }
    }
    return result;
});
</script>

<template>
    <h1 class="pagetitle">Bookmarks</h1>
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

    <h2>Bookmarked Songs</h2>
    <div class="songlist">
        <RouterLink
            v-for="song in search_results"
            :key="song.book.name.short + song.number"
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
        <RouterLink to="/bookmarks" class="nav__link nav__link--active">
            <img class="ionicon nav__icon--active" src="/assets/bookmark.svg" />
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
</style>
