<template>
    <ion-page>
        <ion-header>
            <ion-toolbar>
                <ion-buttons slot="start">
                    <ion-back-button default-href="/home" text=""></ion-back-button>
                </ion-buttons>
                <ion-title>Playlisten</ion-title>
            </ion-toolbar>
        </ion-header>

        <ion-content :fullscreen="true">
            <!-- Loading State -->
            <div v-if="isLoading" class="state-container">
                <ion-spinner name="crescent"></ion-spinner>
                <p>Playlisten werden geladen...</p>
            </div>

            <!-- Empty State -->
            <div v-else-if="!hasPlaylists" class="state-container empty-state">
                <ion-icon :icon="albumsOutline" size="large"></ion-icon>
                <h2>Keine Playlisten</h2>
                <p>Erstellen Sie Ihre erste Playlist, um Lieder zu organisieren.</p>
                <ion-button
                    @click="navigateToCreate"
                    class="create-button"
                    size="default"
                    fill="solid"
                >
                    <ion-icon slot="start" :icon="addOutline"></ion-icon>
                    Playlist erstellen
                </ion-button>
            </div>

            <!-- Playlists List -->
            <ion-list v-else class="playlist-list" lines="full">
                <ion-item
                    v-for="playlist in sortedPlaylists"
                    :key="playlist.id"
                    button
                    detail
                    v-long-press="() => showActionSheet(playlist)"
                    @click="navigateToPlaylist(playlist.id)"
                >
                    <div slot="start" class="playlist-emoji">
                        {{ playlist.emoji }}
                    </div>
                    <ion-label>
                        <h2>{{ playlist.name }}</h2>
                        <p>
                            {{ playlist.songIds.length }}
                            {{ playlist.songIds.length === 1 ? 'Lied' : 'Lieder' }}
                            · {{ formatDate(playlist.createdAt) }}
                        </p>
                    </ion-label>
                </ion-item>
            </ion-list>

            <!-- FAB for creating new playlist -->
            <ion-fab v-if="hasPlaylists" slot="fixed" vertical="bottom" horizontal="end">
                <ion-fab-button @click="navigateToCreate">
                    <ion-icon :icon="addOutline"></ion-icon>
                </ion-fab-button>
            </ion-fab>
        </ion-content>
    </ion-page>
</template>

<script setup lang="ts">
import {
    IonBackButton,
    IonButton,
    IonButtons,
    IonContent,
    IonFab,
    IonFabButton,
    IonHeader,
    IonIcon,
    IonItem,
    IonLabel,
    IonList,
    IonPage,
    IonSpinner,
    IonTitle,
    IonToolbar,
    actionSheetController,
} from '@ionic/vue';
import { addOutline, albumsOutline, closeOutline, trashOutline } from 'ionicons/icons';
import { storeToRefs } from 'pinia';
import { useRouter } from 'vue-router';

import { usePlaylistsStore } from '@/stores/playlists';

import type { Playlist } from '@/db';
import { longPressDirective as vLongPress } from '@/directives/longPress';

const router = useRouter();
const playlistsStore = usePlaylistsStore();
const { isLoading, hasPlaylists, sortedPlaylists } = storeToRefs(playlistsStore);

function navigateToCreate() {
    router.push('/playlists/create');
}

function navigateToPlaylist(id: string) {
    router.push(`/playlists/${id}`);
}

function formatDate(date: Date): string {
    return new Intl.DateTimeFormat('de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    }).format(new Date(date));
}

async function showActionSheet(playlist: Playlist) {
    const actionSheet = await actionSheetController.create({
        header: playlist.name,
        buttons: [
            {
                text: 'Löschen',
                role: 'destructive',
                icon: trashOutline,
                handler: () => {
                    deletePlaylist(playlist);
                },
            },
            {
                text: 'Abbrechen',
                role: 'cancel',
                icon: closeOutline,
            },
        ],
    });

    await actionSheet.present();
}

async function deletePlaylist(playlist: Playlist) {
    try {
        await playlistsStore.deletePlaylist(playlist.id);
    } catch (error) {
        console.error('Failed to delete playlist:', error);
    }
}
</script>

<style scoped>
.playlist-list {
    padding-top: 0;
    padding-bottom: 0;
}

.playlist-emoji {
    font-size: 2rem;
    width: 48px;
    height: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--ion-color-light);
    border-radius: 8px;
    margin-right: 8px;
}

.state-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 48px 24px;
    text-align: center;
    min-height: 60vh;
}

.state-container ion-icon {
    font-size: 64px;
    color: var(--ion-color-medium);
}

.state-container h2 {
    margin: 0 0 8px;
    color: var(--ion-color-dark);
}

.state-container p {
    margin: 0 0 16px;
    color: var(--ion-color-medium);
}

.empty-state .create-button {
    margin-top: 24px;
    --padding-start: 24px;
    --padding-end: 24px;
    --padding-top: 12px;
    --padding-bottom: 12px;
    font-weight: 500;
    text-transform: none;
    letter-spacing: 0.5px;
}

.empty-state .create-button ion-icon {
    color: white;
    margin-right: 8px;
    font-size: 20px;
}
</style>
