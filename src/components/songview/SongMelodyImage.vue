<template>
    <div class="melody-section">
        <div v-if="isLoading" class="image-loading">
            <ion-spinner name="crescent"></ion-spinner>
            <p>Notenbild wird geladen...</p>
        </div>
        <img v-else-if="imageUrl" :src="imageUrl" alt="Notenbild" class="melody-image" />
        <div v-else class="no-melody-notice">
            <ion-icon :icon="imageOutline" />
            <span>Notenbild nicht verfügbar</span>
        </div>
    </div>
</template>

<script setup lang="ts">
import { IonIcon, IonSpinner } from '@ionic/vue';
import { imageOutline } from 'ionicons/icons';

defineProps<{
    imageUrl: string | null;
    isLoading: boolean;
}>();
</script>

<style scoped>
.melody-section {
    background: var(--ion-color-light);
    border-radius: var(--radius-lg);
    padding: var(--spacing-sm);
    margin-bottom: var(--spacing-lg);
    overflow-x: auto;
}

.melody-image {
    width: 100%;
    height: auto;
    display: block;
    border-radius: var(--radius-md);
}

.image-loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: var(--spacing-xl);
    text-align: center;
    gap: var(--spacing-sm);
}

.image-loading p {
    margin: 0;
    color: var(--ion-color-medium);
    font-size: var(--font-size-sm);
}

.no-melody-notice {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--spacing-sm);
    padding: var(--spacing-lg);
    background: var(--ion-color-light);
    border-radius: var(--radius-lg);
    color: var(--ion-color-medium);
    font-style: italic;
}

.no-melody-notice ion-icon {
    font-size: 20px;
}
</style>
