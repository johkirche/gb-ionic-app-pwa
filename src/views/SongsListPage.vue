<template>
    <ion-page>
        <ion-content :fullscreen="true">
            <!-- Back button and title integrated into content -->
            <div class="page-header">
                <ion-button fill="clear" class="back-button" @click="$router.back()">
                    <ion-icon slot="icon-only" :icon="arrowBackOutline"></ion-icon>
                </ion-button>
                <h1 class="page-title">Gesangbuch</h1>
            </div>

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

            <!-- Songs List -->
            <ion-list v-else>
                <ion-item v-for="song in songs" :key="song.id" button detail>
                    <ion-label>
                        <h2>{{ song.titel }}</h2>
                        <p v-if="song.kategorien.length > 0">
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
    </ion-page>
</template>

<script setup lang="ts">
import {
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
} from '@ionic/vue';
import { arrowBackOutline, downloadOutline, musicalNotesOutline } from 'ionicons/icons';
import { storeToRefs } from 'pinia';
import { useRouter } from 'vue-router';

import { useSongsStore } from '@/stores/songs';

import type { Autor } from '@/db';

const songsStore = useSongsStore();
const { songs, isLoading, error, lastSyncTime, hasSongs } = storeToRefs(songsStore);
const router = useRouter();

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
.authors {
    font-size: var(--font-size-sm);
    color: var(--ion-color-medium);
}

ion-list {
    padding-top: 0;
}
</style>
