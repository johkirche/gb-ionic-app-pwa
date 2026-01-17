<template>
    <div class="onboarding-step">
        <div class="step-icon">
            <ion-icon :icon="downloadOutline"></ion-icon>
        </div>

        <h1 class="onboarding-title">App installieren</h1>
        <p class="onboarding-description">
            Installieren Sie das Gesangbuch als App auf Ihrem Gerät für schnellen Zugriff und
            Offline-Nutzung.
        </p>

        <!-- iOS Instructions -->
        <div v-if="isIOS" class="install-instructions">
            <div class="instruction-card">
                <div class="instruction-step">
                    <span class="instruction-number">1</span>
                    <div class="instruction-content">
                        <p>
                            Tippen Sie auf das
                            <strong>Teilen-Symbol</strong>
                        </p>
                        <ion-icon :icon="shareOutline" class="instruction-icon"></ion-icon>
                    </div>
                </div>
                <div class="instruction-step">
                    <span class="instruction-number">2</span>
                    <div class="instruction-content">
                        <p>
                            Scrollen Sie nach unten und tippen Sie auf
                            <strong>"Zum Home-Bildschirm"</strong>
                        </p>
                        <ion-icon :icon="addOutline" class="instruction-icon"></ion-icon>
                    </div>
                </div>
                <div class="instruction-step">
                    <span class="instruction-number">3</span>
                    <div class="instruction-content">
                        <p>
                            Tippen Sie auf
                            <strong>"Hinzufügen"</strong>
                        </p>
                    </div>
                </div>
            </div>
        </div>

        <!-- Android Instructions -->
        <div v-else-if="isAndroid" class="install-instructions">
            <div class="instruction-card">
                <div class="instruction-step">
                    <span class="instruction-number">1</span>
                    <div class="instruction-content">
                        <p>
                            Tippen Sie auf das
                            <strong>Menü-Symbol</strong>
                            (drei Punkte)
                        </p>
                        <ion-icon :icon="ellipsisVertical" class="instruction-icon"></ion-icon>
                    </div>
                </div>
                <div class="instruction-step">
                    <span class="instruction-number">2</span>
                    <div class="instruction-content">
                        <p>
                            Wählen Sie
                            <strong>"App installieren"</strong>
                            oder
                            <strong>"Zum Startbildschirm hinzufügen"</strong>
                        </p>
                        <ion-icon :icon="downloadOutline" class="instruction-icon"></ion-icon>
                    </div>
                </div>
            </div>

            <!-- Native Install Prompt for Android -->
            <ion-button v-if="canInstall" expand="block" @click="installPWA" class="install-button">
                <ion-icon slot="start" :icon="downloadOutline"></ion-icon>
                Jetzt installieren
            </ion-button>
        </div>

        <!-- Desktop Instructions -->
        <div v-else class="install-instructions">
            <div class="instruction-card">
                <div class="instruction-step">
                    <span class="instruction-number">1</span>
                    <div class="instruction-content">
                        <p>
                            Klicken Sie auf das
                            <strong>Installations-Symbol</strong>
                            in der Adressleiste
                        </p>
                        <ion-icon :icon="desktopOutline" class="instruction-icon"></ion-icon>
                    </div>
                </div>
                <div class="instruction-step">
                    <span class="instruction-number">2</span>
                    <div class="instruction-content">
                        <p>
                            Bestätigen Sie mit
                            <strong>"Installieren"</strong>
                        </p>
                    </div>
                </div>
            </div>

            <!-- Native Install Prompt for Desktop -->
            <ion-button v-if="canInstall" expand="block" @click="installPWA" class="install-button">
                <ion-icon slot="start" :icon="downloadOutline"></ion-icon>
                App installieren
            </ion-button>
        </div>

        <div class="already-installed" v-if="isStandalone">
            <ion-icon :icon="checkmarkCircleOutline" color="success"></ion-icon>
            <span>App ist bereits installiert</span>
        </div>

        <div class="step-actions">
            <ion-button expand="block" @click="$emit('next')">
                Weiter
                <ion-icon slot="end" :icon="arrowForwardOutline"></ion-icon>
            </ion-button>
            <ion-button expand="block" fill="clear" color="medium" @click="$emit('skip')">
                Überspringen
            </ion-button>
        </div>
    </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';

import { IonButton, IonIcon } from '@ionic/vue';
import {
    addOutline,
    arrowForwardOutline,
    checkmarkCircleOutline,
    desktopOutline,
    downloadOutline,
    ellipsisVertical,
    shareOutline,
} from 'ionicons/icons';

import { usePWA } from '@/composables/usePWA';

// Emits
defineEmits<{
    next: [];
    skip: [];
}>();

// Use the PWA composable
const { isIOS, isAndroid, isStandalone, canInstall, installPWA, initPWAListeners } = usePWA();

// Initialize PWA listeners on mount
onMounted(() => {
    initPWAListeners();
});
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

/* Install Instructions */
.install-instructions {
    margin-bottom: var(--spacing-lg);
}

.instruction-card {
    background: var(--ion-color-light);
    border-radius: var(--radius-lg);
    padding: var(--spacing-md);
}

.instruction-step {
    display: flex;
    align-items: flex-start;
    gap: var(--spacing-md);
    padding: var(--spacing-sm) 0;
}

.instruction-step:not(:last-child) {
    border-bottom: 1px solid var(--ion-color-light-shade);
}

.instruction-number {
    width: 1.75rem;
    height: 1.75rem;
    border-radius: 50%;
    background: var(--ion-color-primary);
    color: var(--ion-color-primary-contrast);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: var(--font-size-sm);
    font-weight: 600;
    flex-shrink: 0;
}

.instruction-content {
    flex: 1;
}

.instruction-content p {
    margin: 0;
    line-height: 1.5;
}

.instruction-icon {
    font-size: 1.5rem;
    color: var(--ion-color-medium);
    margin-top: var(--spacing-xs);
}

.install-button {
    margin-top: var(--spacing-md);
}

.already-installed {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--spacing-sm);
    padding: var(--spacing-md);
    background: var(--ion-color-success-tint);
    border-radius: var(--radius-md);
    margin-bottom: var(--spacing-lg);
}

.already-installed ion-icon {
    font-size: 1.25rem;
}

.already-installed span {
    color: var(--ion-color-success-shade);
    font-weight: 500;
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
