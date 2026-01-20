<template>
    <ion-list class="songs-list" lines="full">
        <ion-reorder-group :disabled="!reorderMode" @ionItemReorder="handleReorder">
            <ion-item
                v-for="song in songs"
                :key="song.id"
                :button="!reorderMode"
                :detail="!reorderMode"
                @click="handleSongClick(song)"
                @contextmenu.prevent="handleSongContextMenu(song)"
                v-long-press="() => handleSongLongPress(song)"
            >
                <ion-label>
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
</template>

<script setup lang="ts">
import { IonItem, IonLabel, IonList, IonReorder, IonReorderGroup } from '@ionic/vue';
import type { ItemReorderEventDetail } from '@ionic/vue';

import type { Category, Song } from '@/db';
import { longPressDirective as vLongPress } from '@/directives/longPress';

const props = defineProps<{
    songs: Song[];
    reorderMode: boolean;
}>();

const emit = defineEmits<{
    songClick: [song: Song];
    songContextMenu: [song: Song];
    reorder: [event: CustomEvent<ItemReorderEventDetail>];
}>();

function handleSongClick(song: Song) {
    if (!props.reorderMode) {
        emit('songClick', song);
    }
}

function handleSongContextMenu(song: Song) {
    if (!props.reorderMode) {
        emit('songContextMenu', song);
    }
}

function handleSongLongPress(song: Song) {
    if (!props.reorderMode) {
        emit('songContextMenu', song);
    }
}

function handleReorder(event: CustomEvent<ItemReorderEventDetail>) {
    emit('reorder', event);
}

function formatCategories(categories: Category[]): string {
    return categories.map((c) => c.name).join(', ');
}
</script>

<style scoped>
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
</style>
