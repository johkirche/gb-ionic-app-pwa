<template>
    <div class="onboarding-step">
        <div class="step-icon">
            <ion-icon :icon="cloudDownloadOutline"></ion-icon>
        </div>

        <h1 class="onboarding-title">Inhalte herunterladen</h1>
        <p class="onboarding-description">
            Laden Sie alle Lieder und Noten herunter, um das Gesangbuch auch ohne Internetverbindung
            nutzen zu können.
        </p>

        <div class="download-info">
            <div class="info-item">
                <ion-icon :icon="musicalNotesOutline"></ion-icon>
                <span>Alle Lieder und Texte</span>
            </div>
            <div class="info-item">
                <ion-icon :icon="imageOutline"></ion-icon>
                <span>Notendateien zum Offline-Lesen</span>
            </div>
            <div class="info-item">
                <ion-icon :icon="wifiOutline"></ion-icon>
                <span>WLAN-Verbindung empfohlen</span>
            </div>
        </div>

        <!-- Download Progress -->
        <div v-if="isSyncing" class="download-progress">
            <ion-spinner name="crescent"></ion-spinner>
            <p v-if="syncProgress.phase === 'songs'">Lieder werden geladen...</p>
            <p v-else-if="syncProgress.phase === 'files' && syncProgress.total > 0">
                {{ syncProgress.current }} von {{ syncProgress.total }} Dateien
            </p>
            <p v-else>Daten werden geladen...</p>
            <ion-progress-bar
                v-if="syncProgress.phase === 'files' && syncProgress.total > 0"
                :value="syncProgress.current / syncProgress.total"
            ></ion-progress-bar>
        </div>

        <!-- Download Complete -->
        <div v-if="downloadComplete" class="download-complete">
            <ion-icon :icon="checkmarkCircleOutline" color="success"></ion-icon>
            <p>Alle Inhalte wurden erfolgreich heruntergeladen!</p>
        </div>

        <!-- Error -->
        <div v-if="syncError" class="download-error">
            <ion-icon :icon="alertCircleOutline" color="danger"></ion-icon>
            <p>{{ syncError }}</p>
            <ion-button fill="clear" @click="$emit('download')">Erneut versuchen</ion-button>
        </div>

        <div class="step-actions">
            <ion-button
                v-if="!isSyncing && !downloadComplete"
                expand="block"
                @click="$emit('download')"
            >
                <ion-icon slot="start" :icon="cloudDownloadOutline"></ion-icon>
                Jetzt herunterladen
            </ion-button>
            <ion-button v-if="downloadComplete" expand="block" @click="$emit('finish')">
                Fertig
                <ion-icon slot="end" :icon="checkmarkOutline"></ion-icon>
            </ion-button>
            <ion-button
                v-if="!isSyncing"
                expand="block"
                fill="clear"
                color="medium"
                @click="$emit('skip')"
            >
                {{ downloadComplete ? 'Zum Gesangbuch' : 'Später herunterladen' }}
            </ion-button>
        </div>
    </div>
</template>

<script setup lang="ts">
import { IonButton, IonIcon, IonProgressBar, IonSpinner } from '@ionic/vue';
import {
    alertCircleOutline,
    checkmarkCircleOutline,
    checkmarkOutline,
    cloudDownloadOutline,
    imageOutline,
    musicalNotesOutline,
    wifiOutline,
} from 'ionicons/icons';

// Props
defineProps<{
    isSyncing: boolean;
    syncError: string | null;
    syncProgress: {
        phase: string;
        current: number;
        total: number;
    };
    downloadComplete: boolean;
}>();

// Emits
defineEmits<{
    download: [];
    finish: [];
    skip: [];
}>();
</script>

<style scoped>
/* Step Content */
.onboarding-step {
    flex: 1;
    display: flex;
    flex-direction: column;
    animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
    from {
        opacity: 0;
        transform: translateY(10px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.step-icon {
    width: 5rem;
    height: 5rem;
    border-radius: 50%;
    background: rgba(var(--ion-color-primary-rgb), 0.15);
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto var(--spacing-lg);
}

.step-icon ion-icon {
    font-size: 2.5rem;
    color: var(--ion-color-primary-shade);
}

.onboarding-title {
    font-size: var(--font-size-2xl);
    font-weight: 600;
    text-align: center;
    margin: 0 0 var(--spacing-sm);
}

.onboarding-description {
    text-align: center;
    color: var(--ion-color-medium);
    line-height: 1.6;
    margin: 0 0 var(--spacing-xl);
}

/* Download Info */
.download-info {
    background: var(--ion-color-light);
    border-radius: var(--radius-lg);
    padding: var(--spacing-md);
    margin-bottom: var(--spacing-lg);
}

.info-item {
    display: flex;
    align-items: center;
    gap: var(--spacing-md);
    padding: var(--spacing-sm) 0;
}

.info-item:not(:last-child) {
    border-bottom: 1px solid var(--ion-color-light-shade);
}

.info-item ion-icon {
    font-size: 1.25rem;
    color: var(--ion-color-primary);
}

.info-item span {
    color: var(--ion-color-dark);
}

/* Download Progress */
.download-progress {
    text-align: center;
    padding: var(--spacing-lg);
    background: var(--ion-color-light);
    border-radius: var(--radius-lg);
    margin-bottom: var(--spacing-lg);
}

.download-progress ion-spinner {
    margin-bottom: var(--spacing-sm);
}

.download-progress p {
    margin: 0 0 var(--spacing-md);
    color: var(--ion-color-medium);
}

.download-progress ion-progress-bar {
    border-radius: var(--radius-sm);
}

/* Download Complete */
.download-complete {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--spacing-sm);
    padding: var(--spacing-lg);
    background: rgba(var(--ion-color-success-rgb), 0.1);
    border-radius: var(--radius-lg);
    margin-bottom: var(--spacing-lg);
}

.download-complete ion-icon {
    font-size: 2.5rem;
}

.download-complete p {
    margin: 0;
    color: var(--ion-color-success);
    font-weight: 500;
    text-align: center;
}

/* Download Error */
.download-error {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--spacing-sm);
    padding: var(--spacing-lg);
    background: rgba(var(--ion-color-danger-rgb), 0.1);
    border-radius: var(--radius-lg);
    margin-bottom: var(--spacing-lg);
}

.download-error ion-icon {
    font-size: 2rem;
}

.download-error p {
    margin: 0;
    color: var(--ion-color-danger);
    text-align: center;
}

/* Step Actions */
.step-actions {
    margin-top: auto;
    padding-top: var(--spacing-lg);
}

.step-actions ion-button {
    margin-bottom: var(--spacing-sm);
}
</style>
