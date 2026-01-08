<template>
    <ion-page>
        <ion-content :fullscreen="true">
            <!-- Logout button in top right -->
            <ion-button
                v-if="isLoggedIn"
                fill="clear"
                class="absolute top-4 right-4 z-10"
                style="--color: var(--ion-color-medium)"
                @click="handleLogout"
            >
                <ion-icon slot="icon-only" :icon="logOutOutline"></ion-icon>
            </ion-button>

            <div class="text-center px-6 py-8 min-h-full flex flex-col justify-center">
                <ion-img src="/logo.png" alt="Logo" class="w-52 h-52 mb-8 mx-auto block" />
                <h1 class="text-3xl font-semibold mb-2">Willkommen</h1>
                <p v-if="user" class="text-base text-[color:var(--ion-color-medium)] mb-8">
                    {{ user.firstName || user.email }}
                </p>
                <p v-else class="text-base text-[color:var(--ion-color-medium)] mb-8">
                    Johannisches Gesangbuch
                </p>

                <!-- Show loading spinner while checking auth state -->
                <div v-if="isLoading" class="flex flex-col items-center gap-4">
                    <ion-spinner name="crescent"></ion-spinner>
                </div>

                <!-- Main navigation buttons -->
                <div v-else class="space-y-3">
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
/* HomePage specific styles - layout handled by Tailwind */
</style>
