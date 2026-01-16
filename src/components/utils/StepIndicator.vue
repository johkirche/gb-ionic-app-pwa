<template>
    <div class="step-indicator">
        <span
            v-for="step in totalSteps"
            :key="step"
            class="dot"
            :class="{ active: currentStep === step, completed: currentStep > step }"
        ></span>
    </div>
</template>

<script setup lang="ts">
interface Props {
    currentStep: number;
    totalSteps: number;
}

defineProps<Props>();
</script>

<style scoped>
.step-indicator {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--spacing-sm);
    margin-bottom: var(--spacing-xl);
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
