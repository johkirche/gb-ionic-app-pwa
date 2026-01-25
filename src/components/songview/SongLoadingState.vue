<template>
    <div class="state-container">
        <ion-spinner name="crescent"></ion-spinner>
        <p>Lied wird geladen...</p>
    </div>
</template>

<script setup lang="ts">
import { IonSpinner } from '@ionic/vue';
</script>

<style scoped>
.state-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 48px 24px;
    text-align: center;
}

.state-container p {
    margin: 0 0 16px;
    color: var(--ion-color-medium);
}
</style>
