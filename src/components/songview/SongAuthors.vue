<template>
    <div class="authors-section">
        <div v-if="textAuthors.length > 0" class="author-row">
            <ion-icon :icon="documentTextOutline" />
            <div class="author-info">
                <span class="author-label">Text:</span>
                <span class="author-names">{{ formatAuthors(textAuthors) }}</span>
            </div>
        </div>
        <div v-if="melodyAuthors.length > 0" class="author-row">
            <ion-icon :icon="musicalNoteOutline" />
            <div class="author-info">
                <span class="author-label">Melodie:</span>
                <span class="author-names">{{ formatAuthors(melodyAuthors) }}</span>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { IonIcon } from '@ionic/vue';
import { documentTextOutline, musicalNoteOutline } from 'ionicons/icons';

import type { Autor } from '@/db';

defineProps<{
    textAuthors: Autor[];
    melodyAuthors: Autor[];
}>();

function formatAuthors(authors: Autor[]): string {
    return authors
        .map((a) => {
            const name = `${a.vorname} ${a.nachname}`;
            return a.sterbejahr ? `${name} (†${a.sterbejahr})` : name;
        })
        .join(', ');
}
</script>

<style scoped>
.authors-section {
    border-top: 1px solid var(--ion-color-light-shade);
    padding-top: var(--spacing-lg);
    margin-top: var(--spacing-lg);
}

.author-row {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    margin-bottom: var(--spacing-sm);
    color: var(--ion-color-medium);
}

.author-row ion-icon {
    flex-shrink: 0;
    margin-top: 2px;
    font-size: 18px;
}

.author-info {
    display: flex;
    flex-wrap: wrap;
    padding-top: 4px;
    gap: var(--spacing-xs);
}

.author-label {
    font-weight: 500;
}

.author-names {
    color: var(--ion-color-dark);
}
</style>
