<template>
    <ion-page>
        <ion-content :fullscreen="true">
            <!-- Settings button in top right -->
            <ion-button
                fill="clear"
                class="floating-button floating-button--top-right"
                style="--color: var(--ion-color-medium)"
                @click="navigateToSettings"
            >
                <ion-icon slot="icon-only" :icon="settingsOutline"></ion-icon>
            </ion-button>

            <div class="centered-container">
                <ion-img src="/logo.svg" alt="Logo" class="logo logo--md" />
                <h1 class="heading-lg">Willkommen</h1>
                <p v-if="user" class="text-description">
                    {{ user.firstName || user.email }}
                </p>
                <p v-else class="text-description">Johannisches Gesangbuch</p>

                <!-- Show loading spinner while checking auth state -->
                <div v-if="isLoading" class="state-container--inline">
                    <ion-spinner name="crescent"></ion-spinner>
                </div>

                <!-- Main navigation buttons -->
                <div v-else class="nav-buttons">
                    <ion-button expand="block" @click="navigateToSongs">
                        <ion-icon slot="start" :icon="listOutline"></ion-icon>
                        Lieder anzeigen
                    </ion-button>
                    <ion-button expand="block" color="secondary" @click="navigateToPlaylists">
                        <ion-icon slot="start" :icon="albumsOutline"></ion-icon>
                        Playlisten
                    </ion-button>
                </div>
            </div>
        </ion-content>
    </ion-page>
</template>

<script setup lang="ts">
import { IonButton, IonContent, IonIcon, IonImg, IonPage, IonSpinner } from '@ionic/vue';
import { albumsOutline, downloadOutline, listOutline, settingsOutline } from 'ionicons/icons';
import { useRouter } from 'vue-router';

import { useSongsStore } from '@/stores/songs';

import { useAuth } from '@/composables/useAuth';

const router = useRouter();
const { user, isLoading } = useAuth();
const songsStore = useSongsStore();

function navigateToSongs() {
    // Check if songs are downloaded
    if (songsStore.songs.length === 0) {
        // Suggest download first
        router.push('/download');
    } else {
        router.push('/songs');
    }
}

function navigateToDownload() {
    router.push('/download');
}

function navigateToPlaylists() {
    router.push('/playlists');
}

function navigateToSettings() {
    router.push('/settings');
}
</script>

<style scoped>
.nav-buttons {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-sm);
    width: 100%;
    max-width: 300px;
}

.nav-buttons ion-button::part(native) {
    justify-content: flex-start;
    padding-left: 24px;
}

.nav-buttons ion-icon {
    width: 24px;
    text-align: center;
}
</style>
