<template>
    <ion-modal
        :is-open="isOpen"
        :initial-breakpoint="0.5"
        :breakpoints="[0, 0.5, 0.75, 1]"
        @didDismiss="emit('close')"
    >
        <ion-header>
            <ion-toolbar>
                <ion-title>Zu Playlist hinzufügen</ion-title>
                <ion-buttons slot="end">
                    <ion-button @click="emit('close')">Fertig</ion-button>
                </ion-buttons>
            </ion-toolbar>
        </ion-header>

        <ion-content>
            <!-- Loading State -->
            <div v-if="isLoading" class="state-container">
                <ion-spinner name="crescent"></ion-spinner>
            </div>

            <!-- Empty State -->
            <div v-else-if="!hasPlaylists" class="empty-state">
                <ion-icon :icon="albumsOutline" size="large"></ion-icon>
                <p>Keine Playlisten vorhanden</p>
                <ion-button
                    class="create-button"
                    size="default"
                    fill="solid"
                    @click="navigateToCreate"
                >
                    <ion-icon slot="start" :icon="addOutline"></ion-icon>
                    Playlist erstellen
                </ion-button>
            </div>

            <!-- Playlists List -->
            <ion-list v-else>
                <!-- Create New Option -->
                <ion-item button :detail="true" @click.stop="navigateToCreate">
                    <ion-icon slot="start" :icon="addCircleOutline" color="primary"></ion-icon>
                    <ion-label color="primary">Neue Playlist erstellen</ion-label>
                </ion-item>

                <ion-item-divider>
                    <ion-label>Playlisten</ion-label>
                </ion-item-divider>

                <!-- Existing Playlists -->
                <ion-item
                    v-for="playlist in sortedPlaylists"
                    :key="playlist.id"
                    button
                    :disabled="isSongInPlaylist(playlist.id)"
                    @click="addToPlaylist(playlist.id)"
                >
                    <div slot="start" class="playlist-emoji">
                        {{ playlist.emoji }}
                    </div>
                    <ion-label>
                        <h2>{{ playlist.name }}</h2>
                        <p>{{ playlist.songIds.length }} Lieder</p>
                    </ion-label>
                    <ion-icon
                        v-if="isSongInPlaylist(playlist.id)"
                        slot="end"
                        :icon="checkmarkCircle"
                        color="success"
                    ></ion-icon>
                    <ion-icon
                        v-else-if="addedToPlaylistId === playlist.id"
                        slot="end"
                        :icon="checkmarkCircle"
                        color="success"
                    ></ion-icon>
                </ion-item>
            </ion-list>
        </ion-content>
    </ion-modal>
</template>

<script setup lang="ts">
import { ref } from 'vue';

import {
    IonButton,
    IonButtons,
    IonContent,
    IonHeader,
    IonIcon,
    IonItem,
    IonItemDivider,
    IonLabel,
    IonList,
    IonModal,
    IonSpinner,
    IonTitle,
    IonToolbar,
} from '@ionic/vue';
import { addCircleOutline, addOutline, albumsOutline, checkmarkCircle } from 'ionicons/icons';
import { storeToRefs } from 'pinia';
import { useRouter } from 'vue-router';

import { usePlaylistsStore } from '@/stores/playlists';

const props = defineProps<{
    isOpen: boolean;
    songId: string;
}>();

const emit = defineEmits<{
    close: [];
    added: [playlistId: string];
}>();

const router = useRouter();
const playlistsStore = usePlaylistsStore();
const { isLoading, hasPlaylists, sortedPlaylists } = storeToRefs(playlistsStore);

// Track which playlist was just added to (for visual feedback)
const addedToPlaylistId = ref<string | null>(null);

function isSongInPlaylist(playlistId: string): boolean {
    const playlist = playlistsStore.getPlaylistById(playlistId);
    return playlist?.songIds.includes(props.songId) ?? false;
}

async function addToPlaylist(playlistId: string) {
    if (isSongInPlaylist(playlistId)) return;

    try {
        await playlistsStore.addSongToPlaylist(playlistId, props.songId);
        addedToPlaylistId.value = playlistId;
        emit('added', playlistId);

        // Auto-close after a short delay
        setTimeout(() => {
            emit('close');
            addedToPlaylistId.value = null;
        }, 500);
    } catch (error) {
        console.error('Failed to add song to playlist:', error);
    }
}

function navigateToCreate() {
    const returnPath = router.currentRoute.value.fullPath;
    const songId = props.songId;

    emit('close');

    // Small delay to ensure modal dismisses properly on mobile before navigation
    setTimeout(() => {
        router.push({
            path: '/playlists/create',
            query: {
                returnTo: returnPath,
                addSongId: songId,
            },
        });
    }, 100);
}
</script>

<style scoped>
.playlist-emoji {
    font-size: 1.5rem;
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--ion-color-light);
    border-radius: 6px;
}

.state-container {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 48px 24px;
}

.empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 48px 24px;
    text-align: center;
}

.empty-state ion-icon {
    font-size: 48px;
    color: var(--ion-color-medium);
}

.empty-state p {
    margin: 0 0 16px;
    color: var(--ion-color-medium);
}

.empty-state .create-button {
    margin-top: 8px;
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
