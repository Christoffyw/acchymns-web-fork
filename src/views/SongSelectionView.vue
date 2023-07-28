<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useBookSummary, useBookSongList } from "@/composables/book_metadata";
import { RouterLink, useRouter } from "vue-router";
import { useLocalStorage, useSessionStorage } from "@vueuse/core";
import type { BookReference } from "@/scripts/constants";

const props = defineProps<{
    book: string;
}>();
const router = useRouter();

let topical_index_tooltip_status = useLocalStorage<boolean>("topical_index_tooltip_complete", false);

const error_active = ref(false);

const { summary: book } = useBookSummary(props.book as BookReference);
const { song_list } = useBookSongList(props.book as BookReference);
const song_numbers = computed(() => {
    if (song_list.value == null) return [];
    return Object.keys(song_list.value).sort((a, b) => a.localeCompare(b, "en", { numeric: true }));
});

onMounted(async () => {
    useSessionStorage<boolean>("isAlphabetical", false).value = false;
});

function hideTooltip() {
    tooltip.value?.classList.add("tooltiphidden");
    tooltip.value?.classList.add("tooltip");
    setTimeout(() => {
        topical_index_tooltip_status.value = true;
    }, 1000);
}
</script>

<template>
    <div class="menu">
        <div class="title">
            <div class="title--left">
                <img @click="router.back()" class="ionicon" src="/assets/chevron-back-outline.svg" />
            </div>
            <div class="title--center">
                <h1>{{ error_active ? "Unavailable" : book.name.medium }}</h1>
            </div>
            <div class="title--right">
                <div @click="hideTooltip">
                    <RouterLink v-if="book.indexAvailable" :to="`/topical/${props.book}`" @click="topical_index_tooltip_status = true">
                        <img class="ionicon" src="/assets/book-outline.svg" />
                    </RouterLink>
                    <div v-if:="!topical_index_tooltip_status && book.indexAvailable" class="tooltip" ref="tooltip">
                        <p class="tooltiptext">New! Topical Index</p>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <div v-if="error_active" class="fallback-container">
        <img class="wifi-fallback" src="/assets/wifi_off.svg" />
    </div>
    <div v-else class="songs main-content">
        <!-- Buttons will be added here -->
        <RouterLink v-for="song_num in song_numbers" :key="song_num" :to="`/display/${props.book}/${song_num}`" class="song-btn" :style="{ background: book.primaryColor }">
            {{ song_num }}
        </RouterLink>
    </div>

    <nav class="nav">
        <RouterLink to="/" class="nav__link nav__link--active">
            <img class="ionicon nav__icon--active" src="/assets/home.svg" />
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
        <RouterLink to="/settings" class="nav__link">
            <img class="ionicon nav__icon" src="/assets/settings-outline.svg" />
            <span class="nav__text">Settings</span>
        </RouterLink>
    </nav>
</template>

<style scoped>
.songs {
    display: flex;
    justify-content: center;
    flex-wrap: wrap;
    padding: 0px 10px 110px 10px;
    margin-top: 80px;
}

.song-btn {
    width: 60px;
    height: 60px;
    border-radius: 30px;
    color: #fff;
    font-weight: 900;
    font-size: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 5px;
}

.tooltip {
    min-width: 150px;
    height: 25px;
    background-color: #2196f3;
    box-shadow: 0 0 15px rgb(0, 0, 0, 0.25);
    text-align: center;
    border-radius: 6px;
    padding: 5px 0;
    position: absolute;
    z-index: 1;
    translate: -105px 10px;
    opacity: 1;
}

.tooltiphidden {
    background-color: #2196f3;
    box-shadow: 0 0 15px rgb(0, 0, 0, 0.25);
    text-align: center;
    border-radius: 6px;
    padding: 5px 0;
    position: absolute;
    z-index: 1;
    opacity: 0;
    transition: opacity 500ms ease;
}

.tooltip::after {
    content: "";
    position: absolute;
    bottom: 100%;
    left: 75%;
    margin-left: -5px;
    border-width: 10px;
    border-style: solid;
    border-color: transparent transparent #2196f3 transparent;
}

.tooltiptext {
    margin: 0px 10px;
    line-height: 25px;
    font-size: 15px;
    color: white;
}

.wifi-fallback {
    filter: var(--svg-back-filter);
    display: block;
    width: 50%;
    z-index: -1;
}

.fallback-container {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100vh;
}
</style>
