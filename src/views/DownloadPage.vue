<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/home"></ion-back-button>
        </ion-buttons>
        <ion-title>Daten synchronisieren</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <ion-header collapse="condense">
        <ion-toolbar>
          <ion-title size="large">Synchronisieren</ion-title>
        </ion-toolbar>
      </ion-header>

      <div class="download-container">
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
            <p class="sync-description">
              Lädt alle Lieder und Notendateien vom Server herunter und
              speichert sie lokal für die Offline-Nutzung.
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
            <div class="progress-container">
              <ion-spinner name="crescent"></ion-spinner>
              <p v-if="syncProgress.phase === 'songs'">
                Lieder werden geladen...
              </p>
              <p
                v-else-if="
                  syncProgress.phase === 'files' && syncProgress.total > 0
                "
              >
                {{ syncProgress.current }} von {{ syncProgress.total }} Dateien
                heruntergeladen
              </p>
              <p v-else>Daten werden geladen...</p>
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
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonBackButton,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonButton,
  IonIcon,
  IonList,
  IonItem,
  IonLabel,
  IonSpinner,
  IonProgressBar,
} from "@ionic/vue";
import {
  syncOutline,
  musicalNotesOutline,
  imageOutline,
  timeOutline,
  wifiOutline,
} from "ionicons/icons";
import { useSongsStore } from "@/stores/songs";
import { storeToRefs } from "pinia";
import { ref, onMounted } from "vue";

const songsStore = useSongsStore();
const { isSyncing, error, lastSyncTime, syncProgress } =
  storeToRefs(songsStore);

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
    console.error("Sync failed:", err);
  }
}

function formatSyncTime(date: Date): string {
  return new Intl.DateTimeFormat("de-DE", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}
</script>

<style scoped>
.download-container {
  padding: 1rem;
  max-width: 800px;
  margin: 0 auto;
}

.sync-description {
  margin-bottom: 1rem;
  color: var(--ion-color-medium);
}

.progress-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 1rem 0;
}

.progress-container p {
  margin: 0;
  text-align: center;
}

ion-card {
  margin-bottom: 1rem;
}

ion-list {
  background: transparent;
}

ion-item {
  --background: transparent;
}
</style>
