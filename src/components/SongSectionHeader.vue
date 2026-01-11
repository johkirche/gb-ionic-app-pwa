<template>
    <ion-item-divider :id="sectionId" sticky class="section-header">
        <ion-label>{{ label }}</ion-label>
    </ion-item-divider>
</template>

<script setup lang="ts">
import { computed } from 'vue';

import { IonItemDivider, IonLabel } from '@ionic/vue';

const props = defineProps<{
    sectionKey: string;
    label: string;
}>();

const sectionId = computed(() => `section-${props.sectionKey}`);
</script>

<style scoped>
.section-header {
    --background: var(--ion-color-light);
    --color: var(--ion-color-dark);
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    font-size: 13px;
}
</style>
