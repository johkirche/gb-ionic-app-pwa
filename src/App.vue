<template>
    <ion-app>
        <ion-router-outlet class="mobile-container" />
    </ion-app>
</template>

<script setup lang="ts">
import { IonApp, IonRouterOutlet } from '@ionic/vue';
</script>

<style>
.mobile-container {
    max-width: 600px;
    margin: 0 auto;
}
</style>
