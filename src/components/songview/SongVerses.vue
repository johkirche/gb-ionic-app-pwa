<template>
    <div class="verses-container">
        <div class="verses-section">
            <div v-for="(strophe, idx) in strophes" :key="idx" class="verse">
                <span class="verse-number">{{ idx + 1 }}.</span>
                <p class="verse-text" v-html="formatVerse(getStropheText(strophe))"></p>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
interface Strophe {
    text?: string | { strophe?: string };
    strophe?: string;
}

defineProps<{
    strophes: Strophe[];
}>();

function getStropheText(strophe: Strophe): string | null | undefined {
    if (typeof strophe.text === 'object') {
        return strophe.text?.strophe;
    }
    return strophe.text || strophe.strophe;
}

function formatVerse(text: string | null | undefined): string {
    if (typeof text !== 'string') return '';
    // remove ¬ from text
    text = text.replace(/¬/g, '');
    return text.replace(/\n/g, '<br>');
}
</script>

<style scoped>
.verses-container {
    display: flex;
    justify-content: center;
    margin-bottom: var(--spacing-xl);
}

.verses-section {
    display: inline-flex;
    flex-direction: column;
    align-items: flex-start;
}

.verse {
    display: flex;
    align-items: baseline;
    gap: var(--spacing-sm);
    margin-bottom: var(--spacing-lg);
}

.verse-number {
    flex-shrink: 0;
    font-weight: 600;
    color: var(--ion-color-primary);
    min-width: 24px;
    font-size: var(--verse-font-size, var(--font-size-base));
    line-height: var(--verse-line-height, 1.6);
}

.verse-text {
    margin: 0;
    font-size: var(--verse-font-size, var(--font-size-base));
    line-height: var(--verse-line-height, 1.6);
    color: var(--ion-color-dark);
}
</style>
