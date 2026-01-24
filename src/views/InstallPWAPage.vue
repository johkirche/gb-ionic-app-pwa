<template>
    <ion-page>
        <ion-header :translucent="true" class="ion-no-border">
            <ion-toolbar>
                <ion-buttons slot="start">
                    <ion-button @click="$router.back()">
                        <ion-icon slot="icon-only" :icon="arrowBackOutline"></ion-icon>
                    </ion-button>
                </ion-buttons>
                <ion-title>App installieren</ion-title>
            </ion-toolbar>
        </ion-header>

        <ion-content :fullscreen="true">
            <div class="content-container">
                <InstallPWAStep mode="standalone" @done="handleDone" />
            </div>
        </ion-content>
    </ion-page>
</template>

<script setup lang="ts">
import {
    IonButton,
    IonButtons,
    IonContent,
    IonHeader,
    IonIcon,
    IonPage,
    IonTitle,
    IonToolbar,
} from '@ionic/vue';
import { arrowBackOutline } from 'ionicons/icons';
import { useRouter } from 'vue-router';

import InstallPWAStep from '@/components/onboarding/InstallPWAStep.vue';

const router = useRouter();

function handleDone() {
    router.back();
}
</script>

<style scoped>
.content-container {
    min-height: 100%;
    display: flex;
    flex-direction: column;
    padding: var(--spacing-xl) var(--spacing-lg);
    /* max-width: var(--container-sm); */
    margin: 0 auto;
}
</style>
