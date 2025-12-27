<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-title>Johannisches Gesangbuch</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <ion-header collapse="condense">
        <ion-toolbar>
          <ion-title size="large">Gesangbuch</ion-title>
        </ion-toolbar>
      </ion-header>

      <div id="container">
        <ion-img src="/logo.png" alt="Logo" id="logo"></ion-img>
        <h1>Willkommen</h1>
        <p>Johannisches Gesangbuch</p>

        <ion-button expand="block" @click="navigateToSongs">
          <ion-icon slot="start" :icon="listOutline"></ion-icon>
          Lieder anzeigen
        </ion-button>

        <ion-button expand="block" fill="outline" @click="navigateToDownload">
          <ion-icon slot="start" :icon="downloadOutline"></ion-icon>
          Daten synchronisieren
        </ion-button>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonButton,
  IonIcon,
  IonImg,
} from "@ionic/vue";
import {
  musicalNotesOutline,
  listOutline,
  downloadOutline,
} from "ionicons/icons";
import { useRouter } from "vue-router";

const router = useRouter();

function navigateToSongs() {
  router.push("/songs");
}

function navigateToDownload() {
  router.push("/download");
}
</script>

<style scoped>
#container {
  text-align: center;

  position: absolute;
  left: 0;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
}

#logo {
  width: 250px;
  height: 250px;
  margin-bottom: 1rem;
  /* center the logo */
  display: block;
  margin-left: auto;
  margin-right: auto;
}

#container strong {
  font-size: 20px;
  line-height: 26px;
}

#container p {
  font-size: 16px;
  line-height: 22px;

  color: #8c8c8c;

  margin: 0;
}

#container a {
  text-decoration: none;
}

ion-button {
  margin-top: 0.5rem;
}
</style>
