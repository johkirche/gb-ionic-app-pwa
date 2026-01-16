<template>
    <ion-page>
        <ion-content :fullscreen="true">
            <!-- Logout button in top right -->
            <ion-button
                v-if="isLoggedIn"
                fill="clear"
                class="floating-button floating-button--top-right"
                style="--color: var(--ion-color-medium)"
                @click="handleLogout"
            >
                <ion-icon slot="icon-only" :icon="logOutOutline"></ion-icon>
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

                    <ion-button expand="block" fill="outline" @click="navigateToDownload">
                        <ion-icon slot="start" :icon="downloadOutline"></ion-icon>
                        Daten synchronisieren
                    </ion-button>
                </div>
            </div>
        </ion-content>
    </ion-page>
</template>

<script setup lang="ts">
import { IonButton, IonContent, IonIcon, IonImg, IonPage, IonSpinner } from '@ionic/vue';
import { downloadOutline, listOutline, logOutOutline } from 'ionicons/icons';
import { useRouter } from 'vue-router';

import { useSongsStore } from '@/stores/songs';

import { useAuth } from '@/composables/useAuth';

const router = useRouter();
const { user, logout, isLoading, isLoggedIn } = useAuth();
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

async function handleLogout() {
    await logout();
    router.push('/login');
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
</style>
