<template>
    <ion-page>
        <ion-content :fullscreen="true">
            <!-- Back button and title integrated into content -->
            <div class="page-header">
                <ion-button fill="clear" class="back-button" @click="$router.back()">
                    <ion-icon slot="icon-only" :icon="arrowBackOutline"></ion-icon>
                </ion-button>
                <h1 class="page-title">Synchronisieren</h1>
            </div>

            <div class="content-container card-stack">
                <!-- Sync Status Card -->
                <ion-card>
                    <ion-card-header>
                        <ion-card-title>Synchronisierungsstatus</ion-card-title>
                    </ion-card-header>
                    <ion-card-content>
                        <ion-list class="transparent">
                            <ion-item class="transparent">
                                <ion-icon :icon="musicalNotesOutline" slot="start"></ion-icon>
                                <ion-label>
                                    <h3>Lieder</h3>
                                    <p>{{ songsCount }} Lieder gespeichert</p>
                                </ion-label>
                            </ion-item>
                            <ion-item class="transparent">
                                <ion-icon :icon="imageOutline" slot="start"></ion-icon>
                                <ion-label>
                                    <h3>Notendateien (PNG)</h3>
                                    <p>{{ filesCount }} Dateien gespeichert</p>
                                </ion-label>
                            </ion-item>
                            <ion-item v-if="lastSyncTime" class="transparent">
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
                        <p class="sync-description">
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
                        <div class="state-container--inline">
                            <ion-spinner name="crescent"></ion-spinner>
                            <p
                                v-if="syncProgress.phase === 'songs'"
                                class="ion-no-margin ion-text-center"
                            >
                                Lieder werden geladen...
                            </p>
                            <p
                                v-else-if="syncProgress.phase === 'files' && syncProgress.total > 0"
                                class="ion-no-margin ion-text-center"
                            >
                                {{ syncProgress.current }} von {{ syncProgress.total }} Dateien
                                heruntergeladen
                            </p>
                            <p v-else class="ion-no-margin ion-text-center">
                                Daten werden geladen...
                            </p>
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
                        <ion-list class="transparent">
                            <ion-item lines="none" class="transparent">
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

                <!-- Delete Data Card -->
                <ion-card>
                    <ion-card-header>
                        <ion-card-title>Daten löschen</ion-card-title>
                    </ion-card-header>
                    <ion-card-content>
                        <p class="sync-description">
                            Löscht alle lokal gespeicherten Lieder und Notendateien. Diese können
                            jederzeit erneut synchronisiert werden.
                        </p>

                        <ion-button
                            expand="block"
                            color="danger"
                            @click="handleDelete"
                            :disabled="
                                isSyncing || isDeleting || (songsCount === 0 && filesCount === 0)
                            "
                            size="large"
                        >
                            <ion-icon slot="start" :icon="trashOutline"></ion-icon>
                            Alle Daten löschen
                        </ion-button>
                    </ion-card-content>
                </ion-card>
            </div>
        </ion-content>
    </ion-page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';

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
    alertController,
} from '@ionic/vue';
import {
    arrowBackOutline,
    imageOutline,
    musicalNotesOutline,
    syncOutline,
    timeOutline,
    trashOutline,
    wifiOutline,
} from 'ionicons/icons';
import { storeToRefs } from 'pinia';

import { useSongsStore } from '@/stores/songs';

const songsStore = useSongsStore();
const { isSyncing, error, lastSyncTime, syncProgress, songs } = storeToRefs(songsStore);

const songsCount = computed(() => songs.value.length);
const filesCount = ref(0);
const isDeleting = ref(false);

// Load counts on mount
onMounted(async () => {
    await updateFilesCount();
});

async function updateFilesCount() {
    filesCount.value = await songsStore.getStoredFilesCount();
}

async function handleSync() {
    try {
        await songsStore.syncAll();
        await updateFilesCount();
    } catch (err) {
        console.error('Sync failed:', err);
    }
}

async function handleDelete() {
    const alert = await alertController.create({
        header: 'Daten löschen',
        message: 'Möchten Sie wirklich alle lokal gespeicherten Lieder und Notendateien löschen?',
        buttons: [
            {
                text: 'Abbrechen',
                role: 'cancel',
            },
            {
                text: 'Löschen',
                role: 'destructive',
            },
        ],
    });
    await alert.present();

    const { role } = await alert.onDidDismiss();

    if (role === 'destructive') {
        isDeleting.value = true;
        try {
            await songsStore.clearAllData();
            await updateFilesCount();
        } catch (err) {
            console.error('Delete failed:', err);
        } finally {
            isDeleting.value = false;
        }
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
.sync-description {
    color: var(--ion-color-medium);
    line-height: 1.6;
    margin-bottom: var(--spacing-md);
}
</style>
