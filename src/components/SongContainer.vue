<script setup lang="ts">
import type { SongReference } from "@/scripts/types";
import type { PanZoom } from "panzoom";
import createPanZoom from "panzoom";
import { Capacitor } from "@capacitor/core";
import { ref, onMounted, readonly, computed, onUpdated } from "vue";
import PDFWrapper from "./PDFWrapper.vue";
import { useLocalStorage, useMediaQuery } from "@vueuse/core";
import { useBookSummary, getSongSrc } from "@/composables/book_metadata";
import type { BookReference } from "@/scripts/constants";

const props = defineProps<SongReference>();

const panzoom_container = ref<HTMLDivElement>();
const error_is_active = ref(false);

const system_prefers_dark_mode = useMediaQuery("(prefers-color-scheme: dark)");
const override_system_theme = useLocalStorage("ACCOptions.overrideSystemTheme", false);
const user_prefers_dark_mode = useLocalStorage("ACCOptions.overrideDarkMode", false);
let song_invert = useLocalStorage("ACCOptions.songInverted", false);

const dark_mode = computed(() => {
    if (override_system_theme.value) {
        return user_prefers_dark_mode.value;
    } else {
        return system_prefers_dark_mode.value;
    }
});

const actually_invert = computed(() => dark_mode.value && song_invert.value);

const panzoom_enabled = readonly(useLocalStorage("ACCOptions.panzoomEnable", true));
const isMobile = Capacitor.getPlatform() !== "web";

const { summary: book_summary, isFailed } = useBookSummary(props.book as BookReference);
const song_src = computed(() => {
    if (book_summary.value != null) {
        return getSongSrc(book_summary.value, props.number);
    }
    return "";
});

let panzoom: PanZoom;

onMounted(async () => {
    if (panzoom_enabled.value) {
        panzoom = createPanZoom(panzoom_container.value as HTMLDivElement, {
            beforeWheel: e => {
                return e.shiftKey;
            },
            maxZoom: 3,
            minZoom: isMobile ? 1 : 0.25,
            bounds: true,
            boundsPadding: isMobile ? 1 : 0.5,
        });
    }
    if (isMobile) {
        setInterval(() => {
            observer.refresh();
        }, 10);
    }
});

class IntersectionObserverManager {
    _observer;
    _observedNodes;

    constructor(observer: IntersectionObserver) {
        this._observer = observer;
        this._observedNodes = new Set<Element>();
    }
    observe(node: Element) {
        this._observedNodes.add(node);
        this._observer.observe(node);
    }
    unobserve(node: Element) {
        this._observedNodes.delete(node);
        this._observer.unobserve(node);
    }
    disconnect() {
        this._observedNodes.clear();
        this._observer.disconnect();
    }
    refresh() {
        for (let node of this._observedNodes) {
            this._observer.unobserve(node as Element);
            this._observer.observe(node as Element);
        }
    }
}

const observer = new IntersectionObserverManager(
    new IntersectionObserver(
        (entries, _observer) => {
            for (const entry of entries) {
                let rootRect = entry.boundingClientRect;
                let visibleRect = entry.intersectionRect;
                if (visibleRect.height < rootRect.height) panzoom.setVerticalPan(true);
                else panzoom.setVerticalPan(false);
            }
        },
        {
            root: null,
            rootMargin: "0px",
            threshold: 1,
        }
    )
);

onUpdated(async () => {
    if (isMobile) observer.observe(panzoom_container.value as Element);
});
</script>

<template>
    <div v-if="isFailed || error_is_active" class="fallback-container">
        <img src="/assets/wifi_off.svg" class="wifi-fallback" />
    </div>
    <div v-else ref="panzoom_container" class="panzoom-container">
        <PDFWrapper v-if="book_summary?.fileExtension == 'pdf'" @error="error_is_active = true" :src="song_src" class="song-img" :class="{ 'inverted-song': actually_invert }" />
        <img v-else-if="book_summary?.fileExtension" @error="error_is_active = true" :src="song_src" class="song-img" :class="{ 'inverted-song': actually_invert }" />
    </div>
</template>

<style scoped>
.song-img {
    display: block;
    width: 100%;
    z-index: -1;
}

.inverted-song {
    filter: invert(92%);
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
    height: 100vh;
}

.panzoom-container {
    display: block;
    height: max-content;
    width: 100%;
    z-index: -1;
    padding-top: calc(61.16px + env(safe-area-inset-top));
    padding-bottom: 61.16px;
    top: 0;
    left: 0;
    background-color: var(--song-background);
}
</style>
