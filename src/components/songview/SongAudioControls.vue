<template>
    <div class="audio-controls">
        <ion-button
            fill="clear"
            size="small"
            :color="loopEnabled ? 'primary' : 'medium'"
            @click="$emit('update:loopEnabled', !loopEnabled)"
        >
            <ion-icon slot="icon-only" :icon="repeatOutline" />
        </ion-button>

        <ion-button fill="solid" shape="round" color="primary" @click="$emit('togglePlay')">
            <ion-icon slot="icon-only" :icon="isPlaying ? pauseOutline : playOutline" />
        </ion-button>

        <ion-button
            fill="clear"
            size="small"
            color="medium"
            :disabled="!isPlaying && !hasPaused"
            @click="$emit('stop')"
        >
            <ion-icon slot="icon-only" :icon="playSkipBackOutline" />
        </ion-button>

        <div class="tempo-control">
            <ion-button fill="clear" size="small" @click="$emit('decreaseTempo')">
                <ion-icon slot="icon-only" :icon="removeOutline" />
            </ion-button>
            <span class="tempo-value">{{ tempo }} BPM</span>
            <ion-button fill="clear" size="small" @click="$emit('increaseTempo')">
                <ion-icon slot="icon-only" :icon="addOutline" />
            </ion-button>
        </div>
    </div>
</template>

<script setup lang="ts">
import { IonButton, IonIcon } from '@ionic/vue';
import {
    addOutline,
    pauseOutline,
    playOutline,
    playSkipBackOutline,
    removeOutline,
    repeatOutline,
} from 'ionicons/icons';

defineProps<{
    isPlaying: boolean;
    hasPaused: boolean;
    loopEnabled: boolean;
    tempo: number;
}>();

defineEmits<{
    togglePlay: [];
    stop: [];
    increaseTempo: [];
    decreaseTempo: [];
    'update:loopEnabled': [value: boolean];
}>();
</script>

<style scoped>
.audio-controls {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--spacing-md);
    padding-top: var(--spacing-md);
    border-top: 1px solid var(--ion-color-medium-tint);
    margin-top: var(--spacing-md);
    margin-left: calc(var(--spacing-sm) * -1);
    margin-right: calc(var(--spacing-sm) * -1);
}

.tempo-control {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
}

.tempo-value {
    min-width: 40px;
    text-align: center;
    font-size: var(--font-size-sm);
    font-weight: 500;
    color: var(--ion-color-medium);
}
</style>
