<template>
    <ion-page>
        <SongHeader :song-index="song?.index" />

        <SongMenuPopover
            v-model:show-controls="showControls"
            :song-id="songId"
            :has-melody="hasMelody"
            :has-melody-image="hasMelodyImage"
            :melody-display-mode="melodyDisplayMode"
            :notation-scale="notationScale"
            :song-font-size="textSize"
            @update:melody-display-mode="preferencesStore.setMelodyDisplayMode($event)"
            @update:notation-scale="updateNotationScale"
            @update:song-font-size="preferencesStore.setTextSize($event)"
        />

        <ion-content :fullscreen="true">
            <!-- Loading State -->
            <SongLoadingState v-if="isLoading" />

            <!-- Error / Not Found State -->
            <SongErrorState v-else-if="!song" />

            <!-- Song Content -->
            <div v-else class="song-content" :class="`text-size-${textSize}`">
                <!-- Song Title -->
                <h1 class="song-title">
                    <span class="song-title-index">{{ song.index }}.</span>
                    {{ song.titel }}
                </h1>

                <!-- Melody Display: Image or ABC Rendering -->
                <SongMelodyImage
                    v-if="melodyDisplayMode === 'image' && hasMelodyImage"
                    :image-url="melodyImageUrl"
                    :is-loading="imageLoading"
                />

                <!-- ABC Melody Rendering -->
                <div v-else-if="melodyDisplayMode === 'abc' && hasMelody" class="melody-section">
                    <AbcRenderer
                        ref="abcRendererRef"
                        :abc="defaultMelodyAbc"
                        :is-playing="isPlaying"
                        :tempo="tempo"
                        :loop="loopEnabled"
                        :scale="notationScale"
                        @play-started="isPlaying = true"
                        @play-stopped="isPlaying = false"
                    />

                    <SongAudioControls
                        v-if="showControls"
                        v-model:loop-enabled="loopEnabled"
                        :is-playing="isPlaying"
                        :has-paused="hasPaused"
                        :tempo="tempo"
                        @toggle-play="togglePlay"
                        @stop="stopPlayback"
                        @increase-tempo="increaseTempo"
                        @decrease-tempo="decreaseTempo"
                    />
                </div>

                <!-- No Melody Notice -->
                <div v-else-if="!hasMelody && !hasMelodyImage" class="no-melody-notice">
                    <ion-icon :icon="musicalNotesOutline" />
                    <span>Keine Melodie verfügbar</span>
                </div>

                <!-- Song Verses -->
                <SongVerses :strophes="song.strophen" />

                <!-- Authors Section -->
                <SongAuthors
                    :text-authors="song.textAutoren"
                    :melody-authors="song.melodieAutoren"
                />
            </div>
        </ion-content>
    </ion-page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';

import { IonContent, IonIcon, IonPage } from '@ionic/vue';
import { musicalNotesOutline } from 'ionicons/icons';
import { storeToRefs } from 'pinia';
import { useRoute } from 'vue-router';

import { usePreferencesStore } from '@/stores/preferences';
import { useSongsStore } from '@/stores/songs';

import { useStoredFiles } from '@/composables/useStoredFiles';

import AbcRenderer from '@/components/songview/AbcRenderer.vue';
import SongAudioControls from '@/components/songview/SongAudioControls.vue';
import SongAuthors from '@/components/songview/SongAuthors.vue';
import SongErrorState from '@/components/songview/SongErrorState.vue';
import SongHeader from '@/components/songview/SongHeader.vue';
import SongLoadingState from '@/components/songview/SongLoadingState.vue';
import SongMelodyImage from '@/components/songview/SongMelodyImage.vue';
import SongMenuPopover from '@/components/songview/SongMenuPopover.vue';
import SongVerses from '@/components/songview/SongVerses.vue';

import type { Song } from '@/db';

const route = useRoute();
const songsStore = useSongsStore();
const { songs, isLoading } = storeToRefs(songsStore);

const preferencesStore = usePreferencesStore();
const { notationScale, textSize, melodyDisplayMode } = storeToRefs(preferencesStore);

const { getFileUrl } = useStoredFiles();
const melodyImageUrl = ref<string | null>(null);
const imageLoading = ref(false);

// Refs
const abcRendererRef = ref<InstanceType<typeof AbcRenderer> | null>(null);

// Current song
const song = ref<Song | null>(null);

// Song ID from route
const songId = computed(() => route.params.id as string);

// Playback state
const isPlaying = ref(false);
const hasPaused = ref(false);
const loopEnabled = ref(false);
const tempo = ref(120);

// Display options
const showControls = ref(true);

// Get the default melody ABC notation
const defaultMelodyAbc = computed(() => {
    const melodies = song.value?.melodieAbc;
    if (!Array.isArray(melodies) || melodies.length === 0) return '';
    // Find default melody or use first one
    const defaultMelody = melodies.find((m) => m.is_default) || melodies[0];

    // Handle nested abc_notation structure
    let abcNotation: string | undefined = defaultMelody?.abc_notation as any;

    // If abc_notation is an array, get the default or first notation
    if (Array.isArray(abcNotation)) {
        const notation = abcNotation.find((n: any) => n.is_default) || abcNotation[0];
        abcNotation = notation?.abc_notation;
    }

    if (!abcNotation || typeof abcNotation !== 'string') return '';
    // Replace escaped newlines with actual newlines
    return abcNotation.replace(/\\n/g, '\n');
});

// Check if song has melody
const hasMelody = computed(() => {
    return defaultMelodyAbc.value.trim().length > 0;
});

// Get the default melody image file ID
const defaultMelodyImageId = computed(() => {
    const melodies = song.value?.melodieAbc;
    if (!Array.isArray(melodies) || melodies.length === 0) return null;
    // Find default melody or use first one
    const defaultMelody = melodies.find((m) => m.is_default) || melodies[0];
    return defaultMelody?.file_id || null;
});

// Check if song has melody image
const hasMelodyImage = computed(() => {
    if (!song.value?.noten || song.value.noten.length === 0) return false;
    // Check if there are any PNG/JPG/SVG files
    return song.value.noten.some((note) => {
        const filename = note.filename_download.toLowerCase();
        return filename.endsWith('.png') || filename.endsWith('.jpg') || filename.endsWith('.svg');
    });
});

// Load melody image from stored files
async function loadMelodyImage() {
    if (!song.value?.noten || song.value.noten.length === 0) {
        melodyImageUrl.value = null;
        return;
    }

    imageLoading.value = true;
    try {
        // Find the first PNG/JPG/SVG file
        const imageFile = song.value.noten.find((note) => {
            const filename = note.filename_download.toLowerCase();
            return (
                filename.endsWith('.png') || filename.endsWith('.jpg') || filename.endsWith('.svg')
            );
        });

        if (imageFile) {
            const url = await getFileUrl(imageFile.id);
            melodyImageUrl.value = url;
        } else {
            melodyImageUrl.value = null;
        }
    } catch (err) {
        console.error('Error loading melody image:', err);
        melodyImageUrl.value = null;
    } finally {
        imageLoading.value = false;
    }
}

// Find song by ID
function loadSong() {
    const songId = route.params.id as string;
    if (songId) {
        song.value = songs.value.find((s) => s.id === songId) || null;
        // Load melody image when song is loaded
        loadMelodyImage();
    }
    console.log('Loaded song:', song.value);
}

// Load song on mount and when route changes
onMounted(() => {
    loadSong();
});

watch(
    () => route.params.id,
    () => {
        loadSong();
    },
);

// Also reload when songs are loaded
watch(
    () => songs.value,
    () => {
        if (!song.value) {
            loadSong();
        }
    },
);

// Reload image when display mode changes
watch(melodyDisplayMode, () => {
    if (melodyDisplayMode.value === 'image') {
        loadMelodyImage();
    }
});

// Toggle play/pause
function togglePlay() {
    isPlaying.value = !isPlaying.value;
    if (isPlaying.value) {
        hasPaused.value = true;
    }
}

// Stop playback completely
function stopPlayback() {
    isPlaying.value = false;
    hasPaused.value = false;
    // Call the stop method on the renderer to reset everything
    abcRendererRef.value?.stop();
}

// Tempo controls
function increaseTempo() {
    if (tempo.value < 200) {
        tempo.value += 10;
    }
}

function decreaseTempo() {
    if (tempo.value > 60) {
        tempo.value -= 10;
    }
}

// Notation scale control
function updateNotationScale(value: number | number[] | { lower: number; upper: number }) {
    let scale: number;
    if (typeof value === 'object' && !Array.isArray(value)) {
        scale = value.lower; // For dual knob ranges (we don't use this)
    } else {
        scale = Array.isArray(value) ? value[0] : value;
    }
    preferencesStore.setNotationScale(scale);
}
</script>

<style scoped>
/* Song Title */
.song-title {
    margin: 0 0 var(--spacing-lg);
    font-size: var(--font-size-xl);
    font-weight: 600;
    color: var(--ion-color-dark);
    line-height: 1.3;
}

.song-title-index {
    font-weight: 700;
    color: var(--ion-color-primary);
}

.song-content {
    padding: var(--spacing-md);
    max-width: 800px;
    margin: 0 auto;
}

/* Text size variations */
.song-content.text-size-small {
    --verse-font-size: var(--font-size-sm);
    --verse-line-height: 1.5;
}

.song-content.text-size-medium {
    --verse-font-size: var(--font-size-base);
    --verse-line-height: 1.6;
}

.song-content.text-size-large {
    --verse-font-size: var(--font-size-lg);
    --verse-line-height: 1.7;
}

.song-content.text-size-xlarge {
    --verse-font-size: var(--font-size-xl);
    --verse-line-height: 1.8;
}

/* Melody Section */
.melody-section {
    background: var(--ion-color-light);
    border-radius: var(--radius-lg);
    padding: var(--spacing-sm);
    margin-bottom: var(--spacing-lg);
    overflow-x: auto;
}

.no-melody-notice {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--spacing-sm);
    padding: var(--spacing-lg);
    background: var(--ion-color-light);
    border-radius: var(--radius-lg);
    margin-bottom: var(--spacing-lg);
    color: var(--ion-color-medium);
    font-style: italic;
}

.no-melody-notice ion-icon {
    font-size: 20px;
}
</style>
