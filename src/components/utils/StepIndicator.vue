<template>
    <div class="step-indicator">
        <ion-button
            v-if="currentStep > 1"
            fill="clear"
            size="small"
            class="back-button"
            @click="$emit('back')"
        >
            <ion-icon slot="icon-only" :icon="arrowBack"></ion-icon>
        </ion-button>
        <div v-else class="back-button-placeholder"></div>
        <div class="dots">
            <span
                v-for="step in totalSteps"
                :key="step"
                class="dot"
                :class="{ active: currentStep === step, completed: currentStep > step }"
            ></span>
        </div>
        <div class="back-button-placeholder"></div>
    </div>
</template>

<script setup lang="ts">
import { IonButton, IonIcon } from '@ionic/vue';
import { arrowBack } from 'ionicons/icons';

interface Props {
    currentStep: number;
    totalSteps: number;
}

defineProps<Props>();
defineEmits<{
    back: [];
}>();
</script>

<style scoped>
.step-indicator {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: var(--spacing-xl);
}

.dots {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--spacing-sm);
}

.back-button {
    --padding-start: 8px;
    --padding-end: 8px;
}

.back-button-placeholder {
    width: 40px;
}

.dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--ion-color-light-shade);
    transition: all 0.3s ease;
}

.dot.active {
    width: 24px;
    border-radius: 4px;
    background: var(--ion-color-primary);
}

.dot.completed {
    background: var(--ion-color-success);
}
</style>
