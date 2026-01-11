<template>
    <ion-page>
        <ion-content
            ref="contentRef"
            :fullscreen="true"
            :scroll-events="true"
            @ionScroll="onScroll"
        >
            <!-- Back button and title integrated into content -->
            <div class="page-header">
                <ion-button fill="clear" class="back-button" @click="$router.back()">
                    <ion-icon slot="icon-only" :icon="arrowBackOutline"></ion-icon>
                </ion-button>
                <h1 class="page-title">Gesangbuch</h1>

                <!-- Sort Mode Selector -->
                <ion-button
                    v-if="hasSongs"
                    fill="clear"
                    class="sort-button"
                    @click="showSortOptions = true"
                >
                    <ion-icon slot="icon-only" :icon="currentSortIcon"></ion-icon>
                </ion-button>
            </div>

            <!-- Sort Options Action Sheet -->
            <ion-action-sheet
                :is-open="showSortOptions"
                header="Sortierung"
                :buttons="sortActionButtons"
                @didDismiss="showSortOptions = false"
            />

            <!-- Loading State -->
            <div v-if="isLoading" class="state-container">
                <ion-spinner name="crescent"></ion-spinner>
                <p>Lieder werden synchronisiert...</p>
            </div>

            <!-- Error State -->
            <ion-card v-else-if="error" color="danger" class="ion-margin">
                <ion-card-content>
                    <p>{{ error }}</p>
                </ion-card-content>
            </ion-card>

            <!-- Empty State -->
            <div v-else-if="!hasSongs" class="state-container empty-state">
                <ion-icon :icon="musicalNotesOutline" size="large"></ion-icon>
                <h2>Keine Lieder vorhanden</h2>
                <p>Tippen Sie auf das Sync-Symbol, um Lieder zu laden.</p>
            </div>

            <!-- Songs List with Sections -->
            <ion-list v-else class="songs-list">
                <template v-for="section in sortedSections" :key="section.key">
                    <!-- Section Header (only shown when showHeaders is true) -->
                    <SongSectionHeader
                        v-if="showHeaders"
                        :section-key="section.key"
                        :label="section.label"
                    />

                    <!-- Songs in this section -->
                    <ion-item
                        v-for="song in section.songs"
                        :key="song.id"
                        button
                        detail
                        :data-section="section.key"
                    >
                        <ion-label>
                            <h2>
                                <span v-if="sortMode === 'index'" class="song-index">
                                    {{ song.index }}.
                                </span>
                                {{ song.titel }}
                            </h2>
                            <p v-if="song.kategorien.length > 0 && sortMode !== 'category'">
                                {{ song.kategorien.join(', ') }}
                            </p>
                            <p v-if="song.textAutoren.length > 0" class="authors">
                                Text: {{ formatAuthors(song.textAutoren) }}
                            </p>
                            <p v-if="song.melodieAutoren.length > 0" class="authors">
                                Melodie: {{ formatAuthors(song.melodieAutoren) }}
                            </p>
                        </ion-label>
                    </ion-item>
                </template>
            </ion-list>

            <!-- Last Sync Info -->
            <div v-if="lastSyncTime" class="sync-info">
                <p>Zuletzt synchronisiert: {{ formatSyncTime(lastSyncTime) }}</p>
            </div>

            <!-- Floating Action Button for Download Page -->
            <ion-fab slot="fixed" vertical="bottom" horizontal="end">
                <ion-fab-button @click="navigateToDownload">
                    <ion-icon :icon="downloadOutline"></ion-icon>
                </ion-fab-button>
            </ion-fab>
        </ion-content>

        <!-- Index Scroll Sidebar -->
        <IndexScroll
            v-if="hasSongs && indexItems.length > 1"
            :items="indexItems"
            :active-key="activeSection"
            @select="scrollToSection"
        />
    </ion-page>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';

import {
    IonActionSheet,
    IonButton,
    IonCard,
    IonCardContent,
    IonContent,
    IonFab,
    IonFabButton,
    IonIcon,
    IonItem,
    IonLabel,
    IonList,
    IonPage,
    IonSpinner,
    type ScrollDetail,
} from '@ionic/vue';
import {
    arrowBackOutline,
    checkmarkOutline,
    downloadOutline,
    listOutline,
    musicalNotesOutline,
    pricetagOutline,
    textOutline,
} from 'ionicons/icons';
import { storeToRefs } from 'pinia';
import { useRouter } from 'vue-router';

import { useSongsStore } from '@/stores/songs';

import { SORT_OPTIONS, type SortMode, useSongSorting } from '@/composables/useSongSorting';

import IndexScroll from '@/components/IndexScroll.vue';
import SongSectionHeader from '@/components/SongSectionHeader.vue';

import type { Autor } from '@/db';

const songsStore = useSongsStore();
const { songs, isLoading, error, lastSyncTime, hasSongs } = storeToRefs(songsStore);
const router = useRouter();

// Content ref for scroll operations
const contentRef = ref<InstanceType<typeof IonContent> | null>(null);

// Sorting
const { sortMode, showHeaders, sortedSections, indexItems } = useSongSorting(songs);

// UI State
const showSortOptions = ref(false);
const activeSection = ref<string>('');

// Map sort modes to icons
const sortModeIcons: Record<SortMode, string> = {
    index: listOutline,
    alphabetical: textOutline,
    category: pricetagOutline,
};

const currentSortIcon = computed(() => sortModeIcons[sortMode.value]);

// Action sheet buttons for sort options
const sortActionButtons = computed(() => [
    ...SORT_OPTIONS.map((option) => ({
        text: option.label,
        icon: sortMode.value === option.value ? checkmarkOutline : undefined,
        handler: () => {
            sortMode.value = option.value;
            // Reset active section when changing sort mode
            if (sortedSections.value.length > 0) {
                activeSection.value = sortedSections.value[0].key;
            }
        },
    })),
    {
        text: 'Abbrechen',
        role: 'cancel' as const,
    },
]);

// Scroll to a specific section
async function scrollToSection(sectionKey: string) {
    const element = document.getElementById(`section-${sectionKey}`);
    if (element && contentRef.value) {
        const scrollElement = await contentRef.value.$el.getScrollElement();
        const headerOffset = 60; // Account for sticky header
        const elementTop = element.offsetTop - headerOffset;

        await contentRef.value.$el.scrollToPoint(0, elementTop, 300);
    } else if (!showHeaders.value) {
        // For index mode without headers, find first item in section
        const firstItem = document.querySelector(`[data-section="${sectionKey}"]`);
        if (firstItem && contentRef.value) {
            const scrollElement = await contentRef.value.$el.getScrollElement();
            const elementTop = (firstItem as HTMLElement).offsetTop - 60;
            await contentRef.value.$el.scrollToPoint(0, elementTop, 300);
        }
    }
}

// Handle scroll events to update active section
function onScroll(event: CustomEvent<ScrollDetail>) {
    const scrollTop = event.detail.scrollTop;
    const viewportMiddle = scrollTop + 150; // Offset for better UX

    // Find the section that's currently in view
    for (let i = sortedSections.value.length - 1; i >= 0; i--) {
        const section = sortedSections.value[i];
        const element = showHeaders.value
            ? document.getElementById(`section-${section.key}`)
            : document.querySelector(`[data-section="${section.key}"]`);

        if (element && (element as HTMLElement).offsetTop <= viewportMiddle) {
            if (activeSection.value !== section.key) {
                activeSection.value = section.key;
            }
            break;
        }
    }
}

// Navigate to download page
function navigateToDownload() {
    router.push('/download');
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

// Format sync time for display
function formatSyncTime(date: Date): string {
    return new Intl.DateTimeFormat('de-DE', {
        dateStyle: 'short',
        timeStyle: 'short',
    }).format(date);
}
</script>

<style scoped>
.page-header {
    display: flex;
    align-items: center;
    padding: 8px 8px 8px 4px;
}

.page-title {
    flex: 1;
    margin: 0;
    font-size: 1.5rem;
}

.sort-button {
    --padding-start: 8px;
    --padding-end: 8px;
}

.authors {
    font-size: var(--font-size-sm);
    color: var(--ion-color-medium);
}

.songs-list {
    padding-top: 0;
    padding-right: 32px; /* Make room for index scroll */
}

.song-index {
    font-weight: 600;
    color: var(--ion-color-primary);
    margin-right: 4px;
}

.sync-info {
    padding: 16px;
    padding-right: 48px;
    text-align: center;
    color: var(--ion-color-medium);
    font-size: 0.85rem;
}
</style>
