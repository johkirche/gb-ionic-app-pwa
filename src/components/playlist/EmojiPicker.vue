<template>
    <ion-modal :is-open="isOpen" @didDismiss="emit('close')">
        <ion-header>
            <ion-toolbar>
                <ion-title>Emoji wählen</ion-title>
                <ion-buttons slot="end">
                    <ion-button @click="emit('close')">Fertig</ion-button>
                </ion-buttons>
            </ion-toolbar>
        </ion-header>
        <ion-content class="ion-padding">
            <div class="emoji-grid">
                <button
                    v-for="emoji in emojis"
                    :key="emoji"
                    class="emoji-option"
                    :class="{ selected: emoji === selectedEmoji }"
                    @click="emit('select', emoji)"
                >
                    {{ emoji }}
                </button>
            </div>
        </ion-content>
    </ion-modal>
</template>

<script setup lang="ts">
import {
    IonButton,
    IonButtons,
    IonContent,
    IonHeader,
    IonModal,
    IonTitle,
    IonToolbar,
} from '@ionic/vue';

defineProps<{
    isOpen: boolean;
    selectedEmoji?: string;
}>();

const emit = defineEmits<{
    close: [];
    select: [emoji: string];
}>();

// Common emojis for playlist selection
const emojis = [
    '🎵',
    '🎶',
    '🎼',
    '🎹',
    '🎸',
    '🎺',
    '🎻',
    '🥁',
    '🎤',
    '🎧',
    '🎭',
    '⛪',
    '✝️',
    '🙏',
    '💒',
    '📖',
    '📿',
    '🕊️',
    '👼',
    '😇',
    '🌟',
    '⭐',
    '✨',
    '💫',
    '🌈',
    '🌸',
    '🌺',
    '🌻',
    '🌹',
    '💐',
    '❤️',
    '💙',
    '💚',
    '💛',
    '💜',
    '🤍',
    '☀️',
    '🌙',
    '🕯️',
    '🔔',
    '🎄',
    '🐣',
    '🎃',
    '🍂',
    '❄️',
    '🎉',
    '🎊',
    '👨‍👩‍👧‍👦',
    '👶',
    '👧',
    '👦',
    '🧒',
    '👴',
    '👵',
    '🤝',
    '💪',
    '🏃',
    '🧘',
    '📅',
    '📌',
    '🏠',
    '🌍',
];
</script>

<style scoped>
.emoji-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(48px, 1fr));
    gap: 8px;
}

.emoji-option {
    font-size: 1.75rem;
    width: 48px;
    height: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--ion-color-light);
    border: 2px solid transparent;
    border-radius: 8px;
    cursor: pointer;
}

.emoji-option.selected {
    border-color: var(--ion-color-primary);
    background: var(--ion-color-primary-tint);
}
</style>
