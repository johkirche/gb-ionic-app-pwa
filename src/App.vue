<template>
    <ion-app>
        <ion-router-outlet class="mobile-container" />
        <PWAInstallBanner />
    </ion-app>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';

import { IonApp, IonRouterOutlet } from '@ionic/vue';

import PWAInstallBanner from '@/components/PWAInstallBanner.vue';
import { usePWA } from '@/composables/usePWA';

// Initialize PWA listeners at the app level
const { initPWAListeners } = usePWA();

onMounted(() => {
    initPWAListeners();
});
</script>

<style>
/* Mobile container styles are defined in theme/variables.css */
</style>
