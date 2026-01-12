<template>
    <ion-modal
        :is-open="isOpen"
        :initial-breakpoint="0.5"
        :breakpoints="[0, 0.25, 0.5, 0.75, 1]"
        :handle="true"
        @didDismiss="$emit('close')"
    >
        <ion-header>
            <ion-toolbar>
                <ion-title>Filter</ion-title>
                <ion-buttons slot="end">
                    <ion-button v-if="hasActiveFilters" fill="clear" @click="$emit('clearAll')">
                        <ion-icon slot="start" :icon="refreshOutline" />
                        Zurücksetzen
                    </ion-button>
                </ion-buttons>
            </ion-toolbar>
        </ion-header>

        <ion-content class="ion-padding filter-content">
            <!-- Categories as Chip Mosaic -->
            <div class="filter-section">
                <ion-label class="section-label">Kategorien</ion-label>
                <div class="category-chips">
                    <ion-chip
                        v-for="category in availableCategories"
                        :key="category.value"
                        :color="selectedCategories.includes(category.value) ? 'primary' : 'medium'"
                        :outline="!selectedCategories.includes(category.value)"
                        @click="$emit('toggleCategory', category.value)"
                    >
                        <ion-label>{{ category.label }}</ion-label>
                        <ion-badge
                            :color="
                                selectedCategories.includes(category.value) ? 'light' : 'medium'
                            "
                            class="category-count"
                        >
                            {{ category.count }}
                        </ion-badge>
                    </ion-chip>
                </div>
                <div v-if="availableCategories.length === 0" class="empty-state">
                    <ion-text color="medium">Keine Kategorien verfügbar</ion-text>
                </div>
            </div>

            <!-- Dev Filters (may be removed later) -->
            <div class="filter-section dev-section">
                <ion-label class="section-label">Dev Filter</ion-label>

                <ion-item lines="none">
                    <ion-label>Hat Noten</ion-label>
                    <ion-segment
                        :value="hasNotesValue"
                        @ionChange="onHasNotesChange($event)"
                        mode="ios"
                    >
                        <ion-segment-button value="all">
                            <ion-label>Alle</ion-label>
                        </ion-segment-button>
                        <ion-segment-button value="yes">
                            <ion-label>Ja</ion-label>
                        </ion-segment-button>
                        <ion-segment-button value="no">
                            <ion-label>Nein</ion-label>
                        </ion-segment-button>
                    </ion-segment>
                </ion-item>

                <ion-item lines="none">
                    <ion-label>Hat Melodie</ion-label>
                    <ion-segment :value="hasMelodyValue" @ionChange="onHasMelodyChange($event)">
                        <ion-segment-button value="all">
                            <ion-label>Alle</ion-label>
                        </ion-segment-button>
                        <ion-segment-button value="yes">
                            <ion-label>Ja</ion-label>
                        </ion-segment-button>
                        <ion-segment-button value="no">
                            <ion-label>Nein</ion-label>
                        </ion-segment-button>
                    </ion-segment>
                </ion-item>

                <ion-label class="section-label" style="margin-top: 16px">
                    Liedernummer: {{ currentMin }} - {{ currentMax }}
                </ion-label>

                <ion-range
                    :dual-knobs="true"
                    :min="indexRange.min"
                    :max="indexRange.max"
                    :value="{ lower: currentMin, upper: currentMax }"
                    :pin="true"
                    :snaps="false"
                    @ionChange="onRangeChange($event)"
                />

                <ion-button
                    v-if="isRangeActive"
                    fill="clear"
                    size="small"
                    expand="block"
                    @click="$emit('setIndexRange', null)"
                >
                    Bereich zurücksetzen
                </ion-button>
            </div>
        </ion-content>
    </ion-modal>
</template>

<script setup lang="ts">
import { computed } from 'vue';

import {
    IonBadge,
    IonButton,
    IonButtons,
    IonChip,
    IonContent,
    IonHeader,
    IonIcon,
    IonItem,
    IonLabel,
    IonModal,
    IonRange,
    IonSegment,
    IonSegmentButton,
    IonText,
    IonTitle,
    IonToolbar,
} from '@ionic/vue';
import { refreshOutline } from 'ionicons/icons';

import type { FilterOption } from '@/composables/useSongFiltering';

const props = defineProps<{
    isOpen: boolean;
    availableCategories: FilterOption[];
    selectedCategories: string[];
    hasNotes: boolean | null;
    hasMelody: boolean | null;
    filterIndexRange: { min: number; max: number } | null;
    indexRange: { min: number; max: number };
    hasActiveFilters: boolean;
}>();

const emit = defineEmits<{
    (e: 'close'): void;
    (e: 'toggleCategory', category: string): void;
    (e: 'setHasNotes', value: boolean | null): void;
    (e: 'setHasMelody', value: boolean | null): void;
    (e: 'setIndexRange', range: { min: number; max: number } | null): void;
    (e: 'clearAll'): void;
}>();

// Convert boolean | null to segment value
const hasNotesValue = computed(() => {
    if (props.hasNotes === true) return 'yes';
    if (props.hasNotes === false) return 'no';
    return 'all';
});

const hasMelodyValue = computed(() => {
    if (props.hasMelody === true) return 'yes';
    if (props.hasMelody === false) return 'no';
    return 'all';
});

// Current range values
const currentMin = computed(() => props.filterIndexRange?.min ?? props.indexRange.min);
const currentMax = computed(() => props.filterIndexRange?.max ?? props.indexRange.max);

const isRangeActive = computed(() => props.filterIndexRange !== null);

function onHasNotesChange(event: CustomEvent) {
    const value = event.detail.value;
    if (value === 'yes') emit('setHasNotes', true);
    else if (value === 'no') emit('setHasNotes', false);
    else emit('setHasNotes', null);
}

function onHasMelodyChange(event: CustomEvent) {
    const value = event.detail.value;
    if (value === 'yes') emit('setHasMelody', true);
    else if (value === 'no') emit('setHasMelody', false);
    else emit('setHasMelody', null);
}

function onRangeChange(event: CustomEvent) {
    const { lower, upper } = event.detail.value;
    // Only emit if actually different from full range
    if (lower !== props.indexRange.min || upper !== props.indexRange.max) {
        emit('setIndexRange', { min: lower, max: upper });
    } else {
        emit('setIndexRange', null);
    }
}
</script>

<style scoped>
.filter-section {
    margin-bottom: 24px;
}

.section-label {
    display: block;
    font-weight: 600;
    font-size: 0.9rem;
    color: var(--ion-color-medium);
    margin-bottom: 8px;
}

.category-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
}

.category-chips ion-chip {
    margin: 0;
    height: auto;
    padding: 8px 12px;
}

.category-count {
    margin-left: 6px;
    font-size: 0.75rem;
    min-width: 24px;
    text-align: center;
}

.empty-state {
    padding: 16px;
    text-align: center;
}

.dev-section {
    margin-top: 24px;
    padding-top: 16px;
    border-top: 1px solid var(--ion-color-light-shade);
}

ion-item {
    --padding-start: 0;
    --inner-padding-end: 0;
}

ion-segment {
    min-width: 180px;
}
</style>
