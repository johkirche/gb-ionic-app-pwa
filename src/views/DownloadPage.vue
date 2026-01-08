<template>
    <ion-page>
        <ion-content :fullscreen="true">
            <!-- Back button and title integrated into content -->
            <div class="page-header">
                <ion-button fill="clear" class="back-button m-0" @click="$router.back()">
                    <ion-icon slot="icon-only" :icon="arrowBackOutline"></ion-icon>
                </ion-button>
                <h1 class="page-title">Synchronisieren</h1>
            </div>

            <div class="p-4 max-w-3xl mx-auto">
                <!-- Sync Status Card -->
                <ion-card>
                    <ion-card-header>
                        <ion-card-title>Synchronisierungsstatus</ion-card-title>
                    </ion-card-header>
                    <ion-card-content>
                        <ion-list>
                            <ion-item>
                                <ion-icon :icon="musicalNotesOutline" slot="start"></ion-icon>
                                <ion-label>
                                    <h3>Lieder</h3>
                                    <p>{{ songsCount }} Lieder gespeichert</p>
                                </ion-label>
                            </ion-item>
                            <ion-item>
                                <ion-icon :icon="imageOutline" slot="start"></ion-icon>
                                <ion-label>
                                    <h3>Notendateien (PNG)</h3>
                                    <p>{{ filesCount }} Dateien gespeichert</p>
                                </ion-label>
                            </ion-item>
                            <ion-item v-if="lastSyncTime">
                                <ion-icon :icon="timeOutline" slot="start"></ion-icon>
                                <ion-label>
                                    <h3>Letzte Synchronisierung</h3>
                                    <p>{{ formatSyncTime(lastSyncTime) }}</p>
                                </ion-label>
                            </ion-item>
                        </ion-list>
                    </ion-card-content>
                </ion-card>

                <!-- Sync Actions Card -->
                <ion-card>
                    <ion-card-header>
                        <ion-card-title>Synchronisierung</ion-card-title>
                    </ion-card-header>
                    <ion-card-content>
                        <p class="mb-4 text-[color:var(--ion-color-medium)] leading-relaxed">
                            Lädt alle Lieder und Notendateien vom Server herunter und speichert sie
                            lokal für die Offline-Nutzung.
                        </p>

                        <ion-button
                            expand="block"
                            color="primary"
                            @click="handleSync"
                            :disabled="isSyncing"
                            size="large"
                        >
                            <ion-icon slot="start" :icon="syncOutline"></ion-icon>
                            Jetzt synchronisieren
                        </ion-button>
                    </ion-card-content>
                </ion-card>

                <!-- Progress Card (shown during sync) -->
                <ion-card v-if="isSyncing">
                    <ion-card-header>
                        <ion-card-title>Wird synchronisiert...</ion-card-title>
                    </ion-card-header>
                    <ion-card-content>
                        <div class="flex flex-col items-center gap-4 py-4">
                            <ion-spinner name="crescent"></ion-spinner>
                            <p v-if="syncProgress.phase === 'songs'" class="m-0 text-center">
                                Lieder werden geladen...
                            </p>
                            <p
                                v-else-if="syncProgress.phase === 'files' && syncProgress.total > 0"
                                class="m-0 text-center"
                            >
                                {{ syncProgress.current }} von {{ syncProgress.total }} Dateien
                                heruntergeladen
                            </p>
                            <p v-else class="m-0 text-center">Daten werden geladen...</p>
                            <ion-progress-bar
                                v-if="syncProgress.phase === 'files' && syncProgress.total > 0"
                                :value="syncProgress.current / syncProgress.total"
                            ></ion-progress-bar>
                        </div>
                    </ion-card-content>
                </ion-card>

                <!-- Error Card -->
                <ion-card v-if="error" color="danger">
                    <ion-card-header>
                        <ion-card-title>Fehler</ion-card-title>
                    </ion-card-header>
                    <ion-card-content>
                        <p>{{ error }}</p>
                    </ion-card-content>
                </ion-card>

                <!-- Info Card -->
                <ion-card>
                    <ion-card-header>
                        <ion-card-title>Hinweise</ion-card-title>
                    </ion-card-header>
                    <ion-card-content>
                        <ion-list>
                            <ion-item lines="none">
                                <ion-icon
                                    :icon="wifiOutline"
                                    slot="start"
                                    color="warning"
                                ></ion-icon>
                                <ion-label class="ion-text-wrap">
                                    <p>
                                        Für die Synchronisierung wird eine Internetverbindung
                                        benötigt. Der Download kann je nach Verbindung einige
                                        Minuten dauern.
                                    </p>
                                </ion-label>
                            </ion-item>
                        </ion-list>
                    </ion-card-content>
                </ion-card>
            </div>
        </ion-content>
    </ion-page>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';

import {
    IonButton,
    IonCard,
    IonCardContent,
    IonCardHeader,
    IonCardTitle,
    IonContent,
    IonIcon,
    IonItem,
    IonLabel,
    IonList,
    IonPage,
    IonProgressBar,
    IonSpinner,
} from '@ionic/vue';
import {
    arrowBackOutline,
    imageOutline,
    musicalNotesOutline,
    syncOutline,
    timeOutline,
    wifiOutline,
} from 'ionicons/icons';
import { storeToRefs } from 'pinia';

import { useSongsStore } from '@/stores/songs';

const songsStore = useSongsStore();
const { isSyncing, error, lastSyncTime, syncProgress } = storeToRefs(songsStore);

const songsCount = ref(0);
const filesCount = ref(0);

// Load counts on mount
onMounted(async () => {
    await updateCounts();
});

async function updateCounts() {
    songsCount.value = songsStore.songs.length;
    filesCount.value = await songsStore.getStoredFilesCount();
}

async function handleSync() {
    try {
        await songsStore.syncAll();
        await updateCounts();
    } catch (err) {
        console.error('Sync failed:', err);
    }
}

function formatSyncTime(date: Date): string {
    return new Intl.DateTimeFormat('de-DE', {
        dateStyle: 'short',
        timeStyle: 'short',
    }).format(date);
}
</script>

<style scoped>
/* DownloadPage specific styles - layout handled by Tailwind */
ion-list {
    background: transparent;
}

ion-item {
    --background: transparent;
}
</style>
