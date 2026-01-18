<template>
    <ion-page>
        <ion-header>
            <ion-toolbar>
                <ion-buttons slot="start">
                    <ion-back-button default-href="/playlists" text=""></ion-back-button>
                </ion-buttons>
                <ion-title>
                    {{ reorderMode ? 'Reihenfolge ändern' : playlist?.name || 'Playlist' }}
                </ion-title>
                <ion-buttons slot="end">
                    <ion-button v-if="reorderMode" @click="toggleReorderMode" color="primary">
                        Fertig
                    </ion-button>
                    <ion-button v-else id="playlist-menu-trigger">
                        <ion-icon slot="icon-only" :icon="ellipsisVertical"></ion-icon>
                    </ion-button>
                </ion-buttons>
            </ion-toolbar>
        </ion-header>

        <!-- Playlist Menu Popover -->
        <ion-popover trigger="playlist-menu-trigger" :dismiss-on-select="true">
            <ion-content>
                <ion-list lines="none">
                    <ion-item button @click="toggleReorderMode">
                        <ion-icon slot="start" :icon="reorderThreeOutline"></ion-icon>
                        <ion-label>Reihenfolge ändern</ion-label>
                    </ion-item>
                    <ion-item button @click="showEditModal = true">
                        <ion-icon slot="start" :icon="createOutline"></ion-icon>
                        <ion-label>Bearbeiten</ion-label>
                    </ion-item>
                    <ion-item button @click="confirmDelete">
                        <ion-icon slot="start" :icon="trashOutline" color="danger"></ion-icon>
                        <ion-label color="danger">Löschen</ion-label>
                    </ion-item>
                </ion-list>
            </ion-content>
        </ion-popover>

        <ion-content :fullscreen="true">
            <!-- Loading State -->
            <div v-if="isLoading" class="state-container">
                <ion-spinner name="crescent"></ion-spinner>
            </div>

            <!-- Playlist Not Found -->
            <div v-else-if="!playlist" class="state-container empty-state">
                <ion-icon :icon="alertCircleOutline" size="large"></ion-icon>
                <h2>Playlist nicht gefunden</h2>
                <ion-button @click="router.push('/playlists')">Zurück zu Playlisten</ion-button>
            </div>

            <!-- Playlist Content -->
            <template v-else>
                <!-- Playlist Header -->
                <div class="playlist-header">
                    <div class="playlist-emoji-large">{{ playlist.emoji }}</div>
                    <h1 class="playlist-title">{{ playlist.name }}</h1>
                    <p class="playlist-meta">
                        {{ songs.length }} {{ songs.length === 1 ? 'Lied' : 'Lieder' }} · Erstellt
                        am {{ formatDate(playlist.createdAt) }}
                    </p>
                </div>

                <!-- Empty Playlist State -->
                <div v-if="songs.length === 0" class="state-container empty-state">
                    <ion-icon :icon="musicalNotesOutline" size="large"></ion-icon>
                    <h2>Keine Lieder</h2>
                    <p>Fügen Sie Lieder zu dieser Playlist hinzu.</p>
                    <ion-button @click="navigateToAddSongs">
                        <ion-icon slot="start" :icon="addOutline"></ion-icon>
                        Lieder hinzufügen
                    </ion-button>
                </div>

                <!-- Songs List -->
                <ion-list v-else class="songs-list">
                    <ion-reorder-group :disabled="!reorderMode" @ionItemReorder="handleReorder">
                        <ion-item
                            v-for="song in songs"
                            :key="song.id"
                            :button="!reorderMode"
                            :detail="!reorderMode"
                            @click="!reorderMode && navigateToSong(song.id)"
                            @contextmenu.prevent="!reorderMode && showSongActions(song)"
                            v-long-press="() => !reorderMode && showSongActions(song)"
                        >
                            <ion-label class="ion-padding-horizontal">
                                <h2>
                                    <span class="song-index">{{ song.index }}.</span>
                                    {{ song.titel }}
                                </h2>
                                <p v-if="song.kategorien.length > 0">
                                    {{ formatCategories(song.kategorien) }}
                                </p>
                            </ion-label>
                            <ion-reorder slot="end"></ion-reorder>
                        </ion-item>
                    </ion-reorder-group>
                </ion-list>

                <!-- FAB for adding songs -->
                <ion-fab v-if="songs.length > 0" slot="fixed" vertical="bottom" horizontal="end">
                    <ion-fab-button @click="navigateToAddSongs">
                        <ion-icon :icon="addOutline"></ion-icon>
                    </ion-fab-button>
                </ion-fab>
            </template>

            <!-- Delete Confirmation Alert -->
            <ion-alert
                :is-open="showDeleteAlert"
                header="Playlist löschen?"
                :message="`Möchten Sie die Playlist '${playlist?.name}' wirklich löschen?`"
                :buttons="deleteAlertButtons"
                @didDismiss="showDeleteAlert = false"
            ></ion-alert>

            <!-- Edit Modal -->
            <ion-modal :is-open="showEditModal" @didDismiss="showEditModal = false">
                <ion-header>
                    <ion-toolbar>
                        <ion-buttons slot="start">
                            <ion-button @click="showEditModal = false">Abbrechen</ion-button>
                        </ion-buttons>
                        <ion-title>Playlist bearbeiten</ion-title>
                        <ion-buttons slot="end">
                            <ion-button :disabled="!editName.trim()" @click="saveEdit">
                                Speichern
                            </ion-button>
                        </ion-buttons>
                    </ion-toolbar>
                </ion-header>
                <ion-content class="ion-padding">
                    <div class="edit-form">
                        <!-- Emoji Picker -->
                        <div class="emoji-section">
                            <button class="emoji-display" @click="showEmojiPicker = true">
                                {{ editEmoji }}
                            </button>
                        </div>

                        <!-- Name Input -->
                        <ion-item>
                            <ion-input
                                v-model="editName"
                                label="Name der Playlist"
                                label-placement="stacked"
                                :clear-input="true"
                            ></ion-input>
                        </ion-item>
                    </div>

                    <!-- Emoji Picker (nested) -->
                    <ion-modal :is-open="showEmojiPicker" @didDismiss="showEmojiPicker = false">
                        <ion-header>
                            <ion-toolbar>
                                <ion-title>Emoji wählen</ion-title>
                                <ion-buttons slot="end">
                                    <ion-button @click="showEmojiPicker = false">Fertig</ion-button>
                                </ion-buttons>
                            </ion-toolbar>
                        </ion-header>
                        <ion-content class="ion-padding">
                            <div class="emoji-grid">
                                <button
                                    v-for="emoji in commonEmojis"
                                    :key="emoji"
                                    class="emoji-option"
                                    :class="{ selected: emoji === editEmoji }"
                                    @click="selectEmoji(emoji)"
                                >
                                    {{ emoji }}
                                </button>
                            </div>
                        </ion-content>
                    </ion-modal>
                </ion-content>
            </ion-modal>
        </ion-content>
    </ion-page>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';

import {
    IonAlert,
    IonBackButton,
    IonButton,
    IonButtons,
    IonContent,
    IonFab,
    IonFabButton,
    IonHeader,
    IonIcon,
    IonInput,
    IonItem,
    IonLabel,
    IonList,
    IonModal,
    IonPage,
    IonPopover,
    IonReorder,
    IonReorderGroup,
    IonSpinner,
    IonTitle,
    IonToolbar,
    actionSheetController,
} from '@ionic/vue';
import type { ItemReorderEventDetail } from '@ionic/vue';
import {
    addOutline,
    alertCircleOutline,
    createOutline,
    ellipsisVertical,
    musicalNotesOutline,
    reorderThreeOutline,
    trashOutline,
} from 'ionicons/icons';
import { storeToRefs } from 'pinia';
import { useRoute, useRouter } from 'vue-router';

import { usePlaylistsStore } from '@/stores/playlists';
import { useSongsStore } from '@/stores/songs';

import type { Category, Song } from '@/db';

const route = useRoute();
const router = useRouter();
const playlistsStore = usePlaylistsStore();
const songsStore = useSongsStore();

const { isLoading } = storeToRefs(playlistsStore);
const { songs: allSongs } = storeToRefs(songsStore);

// UI State
const showDeleteAlert = ref(false);
const showEditModal = ref(false);
const showEmojiPicker = ref(false);
const editName = ref('');
const editEmoji = ref('');
const reorderMode = ref(false);

// Get current playlist
const playlist = computed(() => {
    const id = route.params.id as string;
    return playlistsStore.getPlaylistById(id);
});

// Get songs in playlist
const songs = computed<Song[]>(() => {
    if (!playlist.value) return [];
    return playlist.value.songIds
        .map((id) => allSongs.value.find((s) => s.id === id))
        .filter((s): s is Song => s !== undefined);
});

// Watch for playlist changes to update edit form
watch(
    playlist,
    (p) => {
        if (p) {
            editName.value = p.name;
            editEmoji.value = p.emoji;
        }
    },
    { immediate: true },
);

// Common emojis
const commonEmojis = [
    '🎵',
    '🎶',
    '🎼',
    '🎹',
    '🎸',
    '🎺',
    '🎻',
    '🥁',
    '🎤',
    '🎧',
    '🎭',
    '⛪',
    '✝️',
    '🙏',
    '💒',
    '📖',
    '📿',
    '🕊️',
    '👼',
    '😇',
    '🌟',
    '⭐',
    '✨',
    '💫',
    '🌈',
    '🌸',
    '🌺',
    '🌻',
    '🌹',
    '💐',
    '❤️',
    '💙',
    '💚',
    '💛',
    '💜',
    '🤍',
    '☀️',
    '🌙',
    '🕯️',
    '🔔',
    '🎄',
    '🐣',
    '🎃',
    '🍂',
    '❄️',
    '🎉',
    '🎊',
    '👨‍👩‍👧‍👦',
    '👶',
    '👧',
    '👦',
    '🧒',
    '👴',
    '👵',
    '🤝',
    '💪',
    '🏃',
    '🧘',
    '📅',
    '📌',
    '🏠',
    '🌍',
];

// Delete alert buttons
const deleteAlertButtons = [
    {
        text: 'Abbrechen',
        role: 'cancel',
    },
    {
        text: 'Löschen',
        role: 'destructive',
        handler: () => {
            deletePlaylist();
        },
    },
];

function confirmDelete() {
    showDeleteAlert.value = true;
}

async function deletePlaylist() {
    if (!playlist.value) return;
    try {
        await playlistsStore.deletePlaylist(playlist.value.id);
        router.replace('/playlists');
    } catch (error) {
        console.error('Failed to delete playlist:', error);
    }
}

function toggleReorderMode() {
    reorderMode.value = !reorderMode.value;
}

async function handleReorder(event: CustomEvent<ItemReorderEventDetail>) {
    if (!playlist.value) return;

    // Get the reordered song IDs
    const reorderedSongIds = [...playlist.value.songIds];
    const movedItem = reorderedSongIds.splice(event.detail.from, 1)[0];
    reorderedSongIds.splice(event.detail.to, 0, movedItem);

    // Complete the reorder animation
    event.detail.complete();

    // Save the new order
    try {
        await playlistsStore.reorderSongs(playlist.value.id, reorderedSongIds);
    } catch (error) {
        console.error('Failed to reorder songs:', error);
    }
}

function selectEmoji(emoji: string) {
    editEmoji.value = emoji;
    showEmojiPicker.value = false;
}

async function saveEdit() {
    if (!playlist.value || !editName.value.trim()) return;
    try {
        await playlistsStore.updatePlaylist(playlist.value.id, {
            name: editName.value.trim(),
            emoji: editEmoji.value,
        });
        showEditModal.value = false;
    } catch (error) {
        console.error('Failed to update playlist:', error);
    }
}

async function removeSong(songId: string) {
    if (!playlist.value) return;
    try {
        await playlistsStore.removeSongFromPlaylist(playlist.value.id, songId);
    } catch (error) {
        console.error('Failed to remove song:', error);
    }
}

async function showSongActions(song: Song) {
    const actionSheet = await actionSheetController.create({
        header: song.titel,
        buttons: [
            {
                text: 'Aus Playlist entfernen',
                role: 'destructive',
                icon: trashOutline,
                handler: () => {
                    removeSong(song.id);
                },
            },
            {
                text: 'Abbrechen',
                role: 'cancel',
            },
        ],
    });
    await actionSheet.present();
}

function navigateToAddSongs() {
    if (!playlist.value) return;
    router.push(`/playlists/${playlist.value.id}/add-songs`);
}

function navigateToSong(songId: string) {
    router.push(`/songs/${songId}`);
}

function formatDate(date: Date): string {
    return new Intl.DateTimeFormat('de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    }).format(new Date(date));
}

function formatCategories(categories: Category[]): string {
    return categories.map((c) => c.name).join(', ');
}
</script>

<style scoped>
.playlist-header {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 24px 16px;
    text-align: center;
    background: linear-gradient(
        180deg,
        var(--ion-color-light) 0%,
        var(--ion-background-color) 100%
    );
}

.playlist-emoji-large {
    font-size: 4rem;
    margin-bottom: 8px;
}

.playlist-title {
    margin: 0 0 4px;
    font-size: 1.5rem;
}

.playlist-meta {
    margin: 0;
    color: var(--ion-color-medium);
    font-size: 0.9rem;
}

.songs-list {
    margin-top: 1rem;
    padding-top: 0;
    padding-bottom: 0;
}

.song-index {
    font-weight: 600;
    color: var(--ion-color-primary);
    margin-right: 4px;
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

.empty-state ion-button {
    margin-top: 8px;
}

.edit-form {
    display: flex;
    flex-direction: column;
    gap: 24px;
}

.emoji-section {
    display: flex;
    justify-content: center;
    padding-top: 16px;
}

.emoji-display {
    font-size: 4rem;
    width: 100px;
    height: 100px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--ion-color-light);
    border: 2px solid var(--ion-color-medium);
    border-radius: 20px;
    cursor: pointer;
}

.emoji-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(48px, 1fr));
    gap: 8px;
}

.emoji-option {
    font-size: 1.75rem;
    width: 48px;
    height: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--ion-color-light);
    border: 2px solid transparent;
    border-radius: 8px;
    cursor: pointer;
}

.emoji-option.selected {
    border-color: var(--ion-color-primary);
    background: var(--ion-color-primary-tint);
}
</style>
