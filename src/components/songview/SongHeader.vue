<template>
    <ion-header :translucent="true">
        <ion-toolbar>
            <ion-buttons slot="start">
                <ion-button @click="$router.back()">
                    <ion-icon slot="icon-only" :icon="arrowBackOutline" />
                </ion-button>
            </ion-buttons>
            <ion-title>
                <span v-if="songIndex" class="song-index">{{ songIndex }}.</span>
                <span class="song-title">{{ songTitle }}</span>
            </ion-title>
            <ion-buttons slot="end">
                <ion-button
                    v-if="songId"
                    :aria-label="
                        isFavorited ? 'Aus Favoriten entfernen' : 'Zu Favoriten hinzufügen'
                    "
                    @click="toggleFavorite"
                >
                    <ion-icon
                        slot="icon-only"
                        :icon="isFavorited ? heart : heartOutline"
                        :class="{ 'favorite-active': isFavorited }"
                    />
                </ion-button>
                <ion-button id="song-menu-trigger">
                    <ion-icon slot="icon-only" :icon="settingsOutline" />
                </ion-button>
            </ion-buttons>
        </ion-toolbar>
    </ion-header>
</template>

<script setup lang="ts">
import { computed } from 'vue';

import { IonButton, IonButtons, IonHeader, IonIcon, IonTitle, IonToolbar } from '@ionic/vue';
import { arrowBackOutline, heart, heartOutline, settingsOutline } from 'ionicons/icons';

import { useFavoritesStore } from '@/stores/favorites';

const props = defineProps<{
    songId?: string;
    songIndex?: number;
    songTitle?: string;
}>();

const favoritesStore = useFavoritesStore();

const isFavorited = computed(() =>
    props.songId ? favoritesStore.isFavorite(props.songId) : false,
);

function toggleFavorite() {
    if (!props.songId) return;
    favoritesStore.toggleFavorite(props.songId);
}
</script>

<style scoped>
ion-title {
    padding-inline-start: 8px;
    padding-inline-end: 8px;
    text-align: start;
}

.song-index {
    font-weight: 700;
    color: var(--ion-color-primary);
    margin-right: 0.4em;
}

.favorite-active {
    color: var(--ion-color-danger);
}
</style>
