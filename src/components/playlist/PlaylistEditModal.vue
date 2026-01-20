<template>
    <ion-modal :is-open="isOpen" @didDismiss="emit('close')">
        <ion-header>
            <ion-toolbar>
                <ion-buttons slot="start">
                    <ion-button @click="emit('close')">
                        <ion-icon slot="icon-only" :icon="closeOutline"></ion-icon>
                    </ion-button>
                </ion-buttons>
                <ion-buttons slot="end">
                    <ion-button :disabled="!localName.trim()" @click="handleSave">
                        <ion-icon slot="icon-only" :icon="checkmarkOutline"></ion-icon>
                    </ion-button>
                </ion-buttons>
            </ion-toolbar>
        </ion-header>
        <ion-content class="ion-padding">
            <div class="edit-form">
                <div class="edit-form--title">Playlist bearbeiten</div>
                <!-- Emoji Picker -->
                <div class="emoji-section">
                    <button class="emoji-display" @click="showEmojiPicker = true">
                        {{ localEmoji }}
                    </button>
                </div>

                <!-- Name Input -->
                <ion-input
                    v-model="localName"
                    label="Name der Playlist"
                    label-placement="stacked"
                    :clear-input="true"
                    fill="outline"
                ></ion-input>
            </div>

            <!-- Emoji Picker Modal -->
            <EmojiPicker
                :is-open="showEmojiPicker"
                :selected-emoji="localEmoji"
                @close="showEmojiPicker = false"
                @select="handleEmojiSelect"
            />
        </ion-content>
    </ion-modal>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';

import {
    IonButton,
    IonButtons,
    IonContent,
    IonHeader,
    IonIcon,
    IonInput,
    IonItem,
    IonModal,
    IonTitle,
    IonToolbar,
} from '@ionic/vue';
import { checkmarkOutline, closeOutline } from 'ionicons/icons';

import EmojiPicker from './EmojiPicker.vue';

const props = defineProps<{
    isOpen: boolean;
    name: string;
    emoji: string;
}>();

const emit = defineEmits<{
    close: [];
    save: [data: { name: string; emoji: string }];
}>();

const localName = ref(props.name);
const localEmoji = ref(props.emoji);
const showEmojiPicker = ref(false);

// Sync local state when props change
watch(
    () => props.isOpen,
    (isOpen) => {
        if (isOpen) {
            localName.value = props.name;
            localEmoji.value = props.emoji;
        }
    },
);

function handleEmojiSelect(emoji: string) {
    localEmoji.value = emoji;
    showEmojiPicker.value = false;
}

function handleSave() {
    if (!localName.value.trim()) return;
    emit('save', {
        name: localName.value.trim(),
        emoji: localEmoji.value,
    });
}
</script>

<style scoped>
.edit-form {
    display: flex;
    flex-direction: column;
    gap: 24px;
}

.edit-form--title {
    font-size: 1.4rem;
}

.emoji-section {
    display: flex;
    justify-content: center;
    padding-top: 16px;
}

.emoji-display {
    font-size: 4rem;
    width: 100px;
    height: 100px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--ion-color-light);
    border: 2px solid var(--ion-color-medium);
    border-radius: 20px;
    cursor: pointer;
}
</style>
