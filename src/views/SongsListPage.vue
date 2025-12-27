<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/home"></ion-back-button>
        </ion-buttons>
        <ion-title>Gesangbuch</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <ion-header collapse="condense">
        <ion-toolbar>
          <ion-title size="large">Gesangbuch</ion-title>
        </ion-toolbar>
      </ion-header>

      <!-- Loading State -->
      <div v-if="isLoading" class="loading-container">
        <ion-spinner name="crescent"></ion-spinner>
        <p>Lieder werden synchronisiert...</p>
      </div>

      <!-- Error State -->
      <ion-card v-else-if="error" color="danger">
        <ion-card-content>
          <p>{{ error }}</p>
        </ion-card-content>
      </ion-card>

      <!-- Empty State -->
      <div v-else-if="!hasSongs" class="empty-container">
        <ion-icon :icon="musicalNotesOutline" size="large"></ion-icon>
        <h2>Keine Lieder vorhanden</h2>
        <p>Tippen Sie auf das Sync-Symbol, um Lieder zu laden.</p>
      </div>

      <!-- Songs List -->
      <ion-list v-else>
        <ion-item v-for="song in songs" :key="song.id" button detail>
          <ion-label>
            <h2>{{ song.titel }}</h2>
            <p v-if="song.kategorien.length > 0">
              {{ song.kategorien.join(", ") }}
            </p>
            <p v-if="song.textAutoren.length > 0" class="authors">
              Text: {{ formatAuthors(song.textAutoren) }}
            </p>
            <p v-if="song.melodieAutoren.length > 0" class="authors">
              Melodie: {{ formatAuthors(song.melodieAutoren) }}
            </p>
          </ion-label>
        </ion-item>
      </ion-list>

      <!-- Last Sync Info -->
      <div v-if="lastSyncTime" class="sync-info">
        <p>Zuletzt synchronisiert: {{ formatSyncTime(lastSyncTime) }}</p>
      </div>

      <!-- Floating Action Button for Download Page -->
      <ion-fab slot="fixed" vertical="bottom" horizontal="end">
        <ion-fab-button @click="navigateToDownload">
          <ion-icon :icon="downloadOutline"></ion-icon>
        </ion-fab-button>
      </ion-fab>
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
  IonList,
  IonItem,
  IonLabel,
  IonButtons,
  IonBackButton,
  IonFab,
  IonFabButton,
  IonIcon,
  IonSpinner,
  IonCard,
  IonCardContent,
} from "@ionic/vue";
import { downloadOutline, musicalNotesOutline } from "ionicons/icons";
import { useSongsStore } from "@/stores/songs";
import { storeToRefs } from "pinia";
import type { Autor } from "@/db";
import { useRouter } from "vue-router";

const songsStore = useSongsStore();
const { songs, isLoading, error, lastSyncTime, hasSongs } =
  storeToRefs(songsStore);
const router = useRouter();

// Navigate to download page
function navigateToDownload() {
  router.push("/download");
}

// Format authors for display
function formatAuthors(authors: Autor[]): string {
  return authors
    .map((a) => {
      const name = `${a.vorname} ${a.nachname}`;
      return a.sterbejahr ? `${name} (†${a.sterbejahr})` : name;
    })
    .join(", ");
}

// Format sync time for display
function formatSyncTime(date: Date): string {
  return new Intl.DateTimeFormat("de-DE", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}
</script>

<style scoped>
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 1rem;
}

.empty-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  text-align: center;
  padding: 2rem;
  color: var(--ion-color-medium);
}

.empty-container ion-icon {
  font-size: 64px;
  margin-bottom: 1rem;
}

.empty-container h2 {
  margin: 0.5rem 0;
  color: var(--ion-color-dark);
}

.authors {
  font-size: 0.875rem;
  color: var(--ion-color-medium);
}

.sync-info {
  text-align: center;
  padding: 1rem;
  font-size: 0.875rem;
  color: var(--ion-color-medium);
}

ion-card {
  margin: 1rem;
}
</style>
