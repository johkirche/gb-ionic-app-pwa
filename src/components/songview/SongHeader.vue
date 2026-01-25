<template>
    <ion-header :translucent="true">
        <ion-toolbar>
            <ion-buttons slot="start">
                <ion-button @click="$router.back()">
                    <ion-icon slot="icon-only" :icon="arrowBackOutline" />
                </ion-button>
            </ion-buttons>
            <ion-title v-if="songIndex">Nr. {{ songIndex }}</ion-title>
            <ion-buttons slot="end">
                <ion-button id="song-menu-trigger">
                    <ion-icon slot="icon-only" :icon="settingsOutline" />
                </ion-button>
            </ion-buttons>
        </ion-toolbar>
    </ion-header>
</template>

<script setup lang="ts">
import { IonButton, IonButtons, IonHeader, IonIcon, IonTitle, IonToolbar } from '@ionic/vue';
import { arrowBackOutline, settingsOutline } from 'ionicons/icons';

defineProps<{
    songIndex?: number;
}>();
</script>
