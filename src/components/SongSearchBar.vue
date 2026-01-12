<template>
    <div class="search-bar" :class="{ expanded: isExpanded }">
        <Transition name="search-expand">
            <div v-if="isExpanded" class="search-input-wrapper">
                <ion-icon :icon="searchOutline" class="search-icon" />
                <input
                    ref="inputRef"
                    v-model="localQuery"
                    type="text"
                    class="search-input"
                    placeholder="Suchen..."
                    @input="onInput"
                    @keyup.escape="collapse"
                />
                <ion-button
                    v-if="localQuery"
                    fill="clear"
                    size="small"
                    class="clear-button"
                    @click="clearAndCollapse"
                >
                    <ion-icon slot="icon-only" :icon="closeCircleOutline" />
                </ion-button>
                <ion-button fill="clear" size="small" class="close-button" @click="collapse">
                    <ion-icon slot="icon-only" :icon="closeOutline" />
                </ion-button>
            </div>
        </Transition>

        <ion-button
            v-if="!isExpanded"
            fill="clear"
            class="search-toggle"
            @click="expand"
        >
            <ion-icon slot="icon-only" :icon="searchOutline" />
        </ion-button>
    </div>
</template>

<script setup lang="ts">
import { nextTick, ref, watch } from 'vue';

import { IonButton, IonIcon } from '@ionic/vue';
import { closeCircleOutline, closeOutline, searchOutline } from 'ionicons/icons';

const props = defineProps<{
    modelValue: string;
}>();

const emit = defineEmits<{
    (e: 'update:modelValue', value: string): void;
    (e: 'search', value: string): void;
    (e: 'clear'): void;
    (e: 'expand'): void;
    (e: 'collapse'): void;
}>();

const isExpanded = ref(false);
const localQuery = ref(props.modelValue);
const inputRef = ref<HTMLInputElement | null>(null);

// Sync with parent
watch(
    () => props.modelValue,
    (newVal) => {
        localQuery.value = newVal;
    },
);

// Debounce timer
let debounceTimer: ReturnType<typeof setTimeout> | null = null;

function onInput() {
    emit('update:modelValue', localQuery.value);

    // Debounced search emit
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
        emit('search', localQuery.value);
    }, 300);
}

async function expand() {
    isExpanded.value = true;
    emit('expand');
    await nextTick();
    inputRef.value?.focus();
}

function collapse() {
    isExpanded.value = false;
    emit('collapse');
}

function clearAndCollapse() {
    localQuery.value = '';
    emit('update:modelValue', '');
    emit('clear');
    collapse();
}
</script>

<style scoped>
.search-bar {
    display: flex;
    align-items: center;
}

.search-toggle {
    --padding-start: 8px;
    --padding-end: 8px;
}

.search-input-wrapper {
    display: flex;
    align-items: center;
    background: var(--ion-color-light);
    border-radius: 8px;
    padding: 4px 8px;
    gap: 4px;
    flex: 1;
}

.search-icon {
    color: var(--ion-color-medium);
    font-size: 18px;
    flex-shrink: 0;
}

.search-input {
    flex: 1;
    border: none;
    background: transparent;
    font-size: 16px;
    padding: 8px 4px;
    outline: none;
    min-width: 120px;
    color: var(--ion-text-color);
}

.search-input::placeholder {
    color: var(--ion-color-medium);
}

.clear-button,
.close-button {
    --padding-start: 4px;
    --padding-end: 4px;
    margin: 0;
}

.clear-button ion-icon {
    font-size: 18px;
    color: var(--ion-color-medium);
}

.close-button ion-icon {
    font-size: 20px;
}

/* Expand animation */
.search-expand-enter-active {
    animation: expand-in 0.2s ease-out;
}

.search-expand-leave-active {
    animation: expand-in 0.15s ease-in reverse;
}

@keyframes expand-in {
    from {
        opacity: 0;
        transform: scaleX(0.8);
        transform-origin: right;
    }
    to {
        opacity: 1;
        transform: scaleX(1);
    }
}
</style>
