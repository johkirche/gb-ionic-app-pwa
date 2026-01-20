<template>
    <div class="playlist-header">
        <div class="playlist-emoji-large">{{ emoji }}</div>
        <h1 class="playlist-title">{{ name }}</h1>
        <p class="playlist-meta">
            {{ songCount }} {{ songCount === 1 ? 'Lied' : 'Lieder' }} · Erstellt am
            {{ formattedDate }}
        </p>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
    emoji: string;
    name: string;
    songCount: number;
    createdAt: Date;
}>();

const formattedDate = computed(() => {
    return new Intl.DateTimeFormat('de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    }).format(new Date(props.createdAt));
});
</script>

<style scoped>
.playlist-header {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 24px 16px;
    text-align: center;
    background: linear-gradient(
        180deg,
        var(--ion-color-light) 0%,
        var(--ion-background-color) 100%
    );
}

.playlist-emoji-large {
    font-size: 4rem;
    margin-bottom: 8px;
}

.playlist-title {
    margin: 0 0 4px;
    font-size: 1.5rem;
}

.playlist-meta {
    margin: 0;
    color: var(--ion-color-medium);
    font-size: 0.9rem;
}
</style>
