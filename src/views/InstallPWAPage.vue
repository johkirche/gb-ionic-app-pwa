<template>
    <ion-page>
        <ion-content :fullscreen="true">
            <div class="content-container">
                <!-- Page Header -->
                <div class="page-header">
                    <ion-button fill="clear" class="back-button" @click="$router.back()">
                        <ion-icon slot="icon-only" :icon="arrowBackOutline"></ion-icon>
                    </ion-button>
                    <h1 class="page-title">App installieren</h1>
                </div>

                <InstallPWAStep mode="standalone" @done="handleDone" />
            </div>
        </ion-content>
    </ion-page>
</template>

<script setup lang="ts">
import { IonButton, IonContent, IonIcon, IonPage } from '@ionic/vue';
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
    max-width: var(--container-sm);
    margin: 0 auto;
}
</style>
