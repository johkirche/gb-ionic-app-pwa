<template>
    <ion-page>
        <ion-header :translucent="true">
            <ion-toolbar>
                <ion-buttons slot="start">
                    <ion-button @click="$router.back()">
                        <ion-icon slot="icon-only" :icon="arrowBackOutline" />
                    </ion-button>
                </ion-buttons>
                <ion-title v-if="song">Nr. {{ song.index }}</ion-title>
                <ion-buttons slot="end">
                    <ion-button id="song-menu-trigger">
                        <ion-icon slot="icon-only" :icon="settingsOutline" />
                    </ion-button>
                </ion-buttons>
            </ion-toolbar>
        </ion-header>

        <!-- Song Menu Popover -->
        <ion-popover trigger="song-menu-trigger" :dismiss-on-select="false">
            <ion-content class="menu-content">
                <ion-list lines="none">
                    <ion-list-header>
                        <ion-label>Anzeige</ion-label>
                    </ion-list-header>
                    <ion-item>
                        <ion-icon slot="start" :icon="musicalNotesOutline" />
                        <ion-label>Steuerung anzeigen</ion-label>
                        <ion-toggle
                            slot="end"
                            :checked="showControls"
                            @ionChange="showControls = $event.detail.checked"
                        />
                    </ion-item>
                    <ion-item v-if="hasMelody || hasMelodyImage">
                        <ion-icon slot="start" :icon="imageOutline" />
                        <ion-label>Notenbild anzeigen</ion-label>
                        <ion-toggle
                            slot="end"
                            :checked="melodyDisplayMode === 'image'"
                            :disabled="!hasMelodyImage"
                            @ionChange="
                                preferencesStore.setMelodyDisplayMode(
                                    $event.detail.checked ? 'image' : 'abc',
                                )
                            "
                        />
                    </ion-item>
                    <ion-item v-if="hasMelody && melodyDisplayMode === 'abc'">
                        <ion-icon slot="start" :icon="musicalNoteOutline" />
                        <ion-label>
                            <p>Notengröße</p>
                            <p class="scale-value">{{ Math.round(notationScale * 100) }}%</p>
                        </ion-label>
                        <ion-range
                            slot="end"
                            :min="0.5"
                            :max="2.0"
                            :step="0.1"
                            :value="notationScale"
                            :pin="true"
                            :pin-formatter="(value: number) => `${Math.round(value * 100)}%`"
                            @ionInput="updateNotationScale($event.detail.value)"
                        />
                    </ion-item>
                </ion-list>
            </ion-content>
        </ion-popover>

        <ion-content :fullscreen="true">
            <!-- Loading State -->
            <div v-if="isLoading" class="state-container">
                <ion-spinner name="crescent"></ion-spinner>
                <p>Lied wird geladen...</p>
            </div>

            <!-- Error / Not Found State -->
            <div v-else-if="!song" class="state-container empty-state">
                <ion-icon :icon="alertCircleOutline" size="large"></ion-icon>
                <h2>Lied nicht gefunden</h2>
                <p>Das angeforderte Lied konnte nicht gefunden werden.</p>
                <ion-button fill="outline" @click="$router.back()">Zurück</ion-button>
            </div>

            <!-- Song Content -->
            <div v-else class="song-content" :class="`text-size-${textSize}`">
                <!-- Song Title -->
                <h1 class="song-title">
                    <span class="song-title-index">{{ song.index }}.</span>
                    {{ song.titel }}
                </h1>

                <!-- Melody Display: Image or ABC Rendering -->
                <div v-if="melodyDisplayMode === 'image' && hasMelodyImage" class="melody-section">
                    <div v-if="imageLoading" class="image-loading">
                        <ion-spinner name="crescent"></ion-spinner>
                        <p>Notenbild wird geladen...</p>
                    </div>
                    <img
                        v-else-if="melodyImageUrl"
                        :src="melodyImageUrl"
                        alt="Notenbild"
                        class="melody-image"
                    />
                    <div v-else class="no-melody-notice">
                        <ion-icon :icon="imageOutline" />
                        <span>Notenbild nicht verfügbar</span>
                    </div>
                </div>

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

                    <!-- Audio Controls -->
                    <div v-if="showControls" class="audio-controls">
                        <ion-button
                            fill="clear"
                            size="small"
                            :color="loopEnabled ? 'primary' : 'medium'"
                            @click="loopEnabled = !loopEnabled"
                        >
                            <ion-icon slot="icon-only" :icon="repeatOutline" />
                        </ion-button>

                        <ion-button fill="solid" shape="round" color="primary" @click="togglePlay">
                            <ion-icon
                                slot="icon-only"
                                :icon="isPlaying ? pauseOutline : playOutline"
                            />
                        </ion-button>

                        <ion-button
                            fill="clear"
                            size="small"
                            :color="hasPaused ? 'medium' : 'medium'"
                            :disabled="!isPlaying && !hasPaused"
                            @click="stopPlayback"
                        >
                            <ion-icon slot="icon-only" :icon="playSkipBackOutline" />
                        </ion-button>

                        <div class="tempo-control">
                            <ion-button fill="clear" size="small" @click="decreaseTempo">
                                <ion-icon slot="icon-only" :icon="removeOutline" />
                            </ion-button>
                            <span class="tempo-value">{{ tempo }} BPM</span>
                            <ion-button fill="clear" size="small" @click="increaseTempo">
                                <ion-icon slot="icon-only" :icon="addOutline" />
                            </ion-button>
                        </div>
                    </div>
                </div>

                <!-- No Melody Notice -->
                <div v-else-if="!hasMelody && !hasMelodyImage" class="no-melody-notice">
                    <ion-icon :icon="musicalNotesOutline" />
                    <span>Keine Melodie verfügbar</span>
                </div>

                <!-- Song Verses -->
                <div class="verses-section">
                    <div v-for="(strophe, idx) in song.strophen" :key="idx" class="verse">
                        <span class="verse-number">{{ idx + 1 }}.</span>
                        <p
                            class="verse-text"
                            v-html="
                                formatVerse(
                                    typeof strophe.text === 'object'
                                        ? strophe.text?.strophe
                                        : strophe.text || strophe.strophe,
                                )
                            "
                        ></p>
                    </div>
                </div>

                <!-- Authors Section -->
                <div class="authors-section">
                    <div v-if="song.textAutoren.length > 0" class="author-row">
                        <ion-icon :icon="documentTextOutline" />
                        <div class="author-info">
                            <span class="author-label">Text:</span>
                            <span class="author-names">{{ formatAuthors(song.textAutoren) }}</span>
                        </div>
                    </div>
                    <div v-if="song.melodieAutoren.length > 0" class="author-row">
                        <ion-icon :icon="musicalNoteOutline" />
                        <div class="author-info">
                            <span class="author-label">Melodie:</span>
                            <span class="author-names">
                                {{ formatAuthors(song.melodieAutoren) }}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </ion-content>
    </ion-page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';

import {
    IonButton,
    IonButtons,
    IonContent,
    IonHeader,
    IonIcon,
    IonItem,
    IonLabel,
    IonList,
    IonListHeader,
    IonPage,
    IonPopover,
    IonRange,
    IonSelect,
    IonSelectOption,
    IonSpinner,
    IonTitle,
    IonToggle,
    IonToolbar,
} from '@ionic/vue';
import {
    addOutline,
    alertCircleOutline,
    arrowBackOutline,
    documentTextOutline,
    imageOutline,
    musicalNoteOutline,
    musicalNotesOutline,
    pauseOutline,
    playOutline,
    playSkipBackOutline,
    removeOutline,
    repeatOutline,
    settingsOutline,
    textOutline,
} from 'ionicons/icons';
import { storeToRefs } from 'pinia';
import { useRoute } from 'vue-router';

import { usePreferencesStore } from '@/stores/preferences';
import { useSongsStore } from '@/stores/songs';

import { useStoredFiles } from '@/composables/useStoredFiles';

import AbcRenderer from '@/components/songview/AbcRenderer.vue';

import type { Autor, Song } from '@/db';

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

// Format authors for display
function formatAuthors(authors: Autor[]): string {
    return authors
        .map((a) => {
            const name = `${a.vorname} ${a.nachname}`;
            return a.sterbejahr ? `${name} (†${a.sterbejahr})` : name;
        })
        .join(', ');
}

// Format verse text (preserve line breaks)
function formatVerse(text: string | null | undefined): string {
    if (typeof text !== 'string') return '';
    // remove ¬ from text
    text = text.replace(/¬/g, '');
    return text.replace(/\n/g, '<br>');
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

.state-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 48px 24px;
    text-align: center;
}

.state-container ion-icon {
    font-size: 64px;
    color: var(--ion-color-medium);
    margin-bottom: 16px;
}

.state-container h2 {
    margin: 0 0 8px;
    color: var(--ion-color-dark);
}

.state-container p {
    margin: 0 0 16px;
    color: var(--ion-color-medium);
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

/* Melody Section */
.melody-section {
    background: var(--ion-color-light);
    border-radius: var(--radius-lg);
    padding: var(--spacing-sm);
    margin-bottom: var(--spacing-lg);
    overflow-x: auto;
}

/* Audio Controls */
.audio-controls {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--spacing-md);
    padding-top: var(--spacing-md);
    border-top: 1px solid var(--ion-color-medium-tint);
    margin-top: var(--spacing-md);
    margin-left: calc(var(--spacing-sm) * -1);
    margin-right: calc(var(--spacing-sm) * -1);
}

.tempo-control {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
}

.tempo-value {
    min-width: 40px;
    text-align: center;
    font-size: var(--font-size-sm);
    font-weight: 500;
    color: var(--ion-color-medium);
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

/* Melody Image */
.melody-image {
    width: 100%;
    height: auto;
    display: block;
    border-radius: var(--radius-md);
}

.image-loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: var(--spacing-xl);
    text-align: center;
    gap: var(--spacing-sm);
}

.image-loading p {
    margin: 0;
    color: var(--ion-color-medium);
    font-size: var(--font-size-sm);
}

/* Verses Section */
.verses-section {
    margin-bottom: var(--spacing-xl);
}

.verse {
    display: flex;
    gap: var(--spacing-sm);
    margin-bottom: var(--spacing-lg);
}

.verse-number {
    flex-shrink: 0;
    font-weight: 600;
    color: var(--ion-color-primary);
    min-width: 24px;
    font-size: var(--verse-font-size, var(--font-size-base));
}

.verse-text {
    margin: 0;
    font-size: var(--verse-font-size, var(--font-size-base));
    line-height: var(--verse-line-height, 1.6);
    color: var(--ion-color-dark);
}

/* Authors Section */
.authors-section {
    border-top: 1px solid var(--ion-color-light-shade);
    padding-top: var(--spacing-lg);
    margin-top: var(--spacing-lg);
}

.author-row {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    margin-bottom: var(--spacing-sm);
    color: var(--ion-color-medium);
}

.author-row ion-icon {
    flex-shrink: 0;
    margin-top: 2px;
    font-size: 18px;
}

.author-info {
    display: flex;
    flex-wrap: wrap;
    padding-top: 4px;
    gap: var(--spacing-xs);
}

.author-label {
    font-weight: 500;
}

.author-names {
    color: var(--ion-color-dark);
}

/* Menu popover styles */
ion-popover {
    --width: 280px;
}

ion-popover ion-list-header {
    font-size: var(--font-size-xs);
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    padding-top: var(--spacing-sm);
    padding-bottom: var(--spacing-sm);
}

ion-popover ion-item {
    --padding-start: var(--spacing-md);
    --padding-end: var(--spacing-md);
    --inner-padding-end: 0;
}

.scale-value {
    font-size: 0.85rem;
    color: var(--ion-color-primary);
    font-weight: 500;
}

ion-popover ion-range {
    --bar-background: var(--ion-color-light);
    --bar-background-active: var(--ion-color-primary);
    --knob-background: var(--ion-color-primary);
    --knob-size: 20px;
    --pin-background: var(--ion-color-primary);
    padding: 0 8px;
    width: 120px;
}
</style>
