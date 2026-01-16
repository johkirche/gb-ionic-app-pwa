<template>
    <ion-page>
        <ion-content :fullscreen="true">
            <div class="onboarding-container">
                <!-- Step Indicator Dots -->
                <div class="dot-indicator">
                    <span
                        v-for="step in totalSteps"
                        :key="step"
                        class="dot"
                        :class="{ active: currentStep === step, completed: currentStep > step }"
                    ></span>
                </div>

                <!-- Step 1: Install PWA -->
                <div v-if="currentStep === 1" class="onboarding-step">
                    <div class="step-icon">
                        <ion-icon :icon="downloadOutline"></ion-icon>
                    </div>

                    <h1 class="onboarding-title">App installieren</h1>
                    <p class="onboarding-description">
                        Installieren Sie das Gesangbuch als App auf Ihrem Gerät für schnellen
                        Zugriff und Offline-Nutzung.
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
                                    <ion-icon
                                        :icon="shareOutline"
                                        class="instruction-icon"
                                    ></ion-icon>
                                </div>
                            </div>
                            <div class="instruction-step">
                                <span class="instruction-number">2</span>
                                <div class="instruction-content">
                                    <p>
                                        Scrollen Sie nach unten und tippen Sie auf
                                        <strong>"Zum Home-Bildschirm"</strong>
                                    </p>
                                    <ion-icon
                                        :icon="addOutline"
                                        class="instruction-icon"
                                    ></ion-icon>
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
                                    <ion-icon
                                        :icon="ellipsisVertical"
                                        class="instruction-icon"
                                    ></ion-icon>
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
                                    <ion-icon
                                        :icon="downloadOutline"
                                        class="instruction-icon"
                                    ></ion-icon>
                                </div>
                            </div>
                        </div>

                        <!-- Native Install Prompt for Android -->
                        <ion-button
                            v-if="canInstall"
                            expand="block"
                            @click="installPWA"
                            class="install-button"
                        >
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
                                    <ion-icon
                                        :icon="desktopOutline"
                                        class="instruction-icon"
                                    ></ion-icon>
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
                        <ion-button
                            v-if="canInstall"
                            expand="block"
                            @click="installPWA"
                            class="install-button"
                        >
                            <ion-icon slot="start" :icon="downloadOutline"></ion-icon>
                            App installieren
                        </ion-button>
                    </div>

                    <div class="already-installed" v-if="isStandalone">
                        <ion-icon :icon="checkmarkCircleOutline" color="success"></ion-icon>
                        <span>App ist bereits installiert</span>
                    </div>

                    <div class="step-actions">
                        <ion-button expand="block" @click="nextStep">
                            Weiter
                            <ion-icon slot="end" :icon="arrowForwardOutline"></ion-icon>
                        </ion-button>
                        <ion-button
                            expand="block"
                            fill="clear"
                            color="medium"
                            @click="skipOnboarding"
                        >
                            Überspringen
                        </ion-button>
                    </div>
                </div>

                <!-- Step 2: Download Content -->
                <div v-if="currentStep === 2" class="onboarding-step">
                    <div class="step-icon">
                        <ion-icon :icon="cloudDownloadOutline"></ion-icon>
                    </div>

                    <h1 class="onboarding-title">Inhalte herunterladen</h1>
                    <p class="onboarding-description">
                        Laden Sie alle Lieder und Noten herunter, um das Gesangbuch auch ohne
                        Internetverbindung nutzen zu können.
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
                        <ion-button fill="clear" @click="handleDownload">
                            Erneut versuchen
                        </ion-button>
                    </div>

                    <div class="step-actions">
                        <ion-button
                            v-if="!isSyncing && !downloadComplete"
                            expand="block"
                            @click="handleDownload"
                        >
                            <ion-icon slot="start" :icon="cloudDownloadOutline"></ion-icon>
                            Jetzt herunterladen
                        </ion-button>
                        <ion-button
                            v-if="downloadComplete"
                            expand="block"
                            @click="finishOnboarding"
                        >
                            Fertig
                            <ion-icon slot="end" :icon="checkmarkOutline"></ion-icon>
                        </ion-button>
                        <ion-button
                            v-if="!isSyncing"
                            expand="block"
                            fill="clear"
                            color="medium"
                            @click="skipOnboarding"
                        >
                            {{ downloadComplete ? 'Zum Gesangbuch' : 'Später herunterladen' }}
                        </ion-button>
                    </div>
                </div>
            </div>
        </ion-content>
    </ion-page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';

import { IonButton, IonContent, IonIcon, IonPage, IonProgressBar, IonSpinner } from '@ionic/vue';
import {
    addOutline,
    alertCircleOutline,
    arrowForwardOutline,
    checkmarkCircleOutline,
    checkmarkOutline,
    cloudDownloadOutline,
    desktopOutline,
    downloadOutline,
    ellipsisVertical,
    imageOutline,
    musicalNotesOutline,
    shareOutline,
    wifiOutline,
} from 'ionicons/icons';
import { storeToRefs } from 'pinia';
import { useRouter } from 'vue-router';

import { useSongsStore } from '@/stores/songs';

const router = useRouter();
const songsStore = useSongsStore();
const { isSyncing, error: syncError, syncProgress } = storeToRefs(songsStore);

// Step management
const currentStep = ref(1);
const totalSteps = 2;

// PWA Install state
const deferredPrompt = ref<any>(null);
const canInstall = computed(() => !!deferredPrompt.value);

// Download state
const downloadComplete = ref(false);

// Platform detection
const isIOS = computed(() => {
    const userAgent = navigator.userAgent.toLowerCase();
    return /iphone|ipad|ipod/.test(userAgent);
});

const isAndroid = computed(() => {
    const userAgent = navigator.userAgent.toLowerCase();
    return /android/.test(userAgent);
});

const isStandalone = computed(() => {
    return (
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true
    );
});

// Capture the beforeinstallprompt event
onMounted(() => {
    window.addEventListener('beforeinstallprompt', (e: Event) => {
        e.preventDefault();
        deferredPrompt.value = e;
    });

    window.addEventListener('appinstalled', () => {
        deferredPrompt.value = null;
    });
});

async function installPWA() {
    if (!deferredPrompt.value) return;

    deferredPrompt.value.prompt();
    const { outcome } = await deferredPrompt.value.userChoice;

    if (outcome === 'accepted') {
        deferredPrompt.value = null;
    }
}

function nextStep() {
    // Skip PWA step if already installed
    if (currentStep.value === 1 && isStandalone.value) {
        currentStep.value = 2;
    } else if (currentStep.value < totalSteps) {
        currentStep.value++;
    }
}

async function handleDownload() {
    try {
        downloadComplete.value = false;
        await songsStore.syncAll();
        downloadComplete.value = true;
    } catch (err) {
        console.error('Download failed:', err);
    }
}

function finishOnboarding() {
    router.push('/home');
}

function skipOnboarding() {
    router.push('/home');
}
</script>

<style scoped>
.onboarding-container {
    min-height: 100%;
    display: flex;
    flex-direction: column;
    padding: var(--spacing-xl) var(--spacing-lg);
    max-width: var(--container-sm);
    margin: 0 auto;
}

/* Dot Indicator */
.dot-indicator {
    display: flex;
    justify-content: center;
    gap: var(--spacing-sm);
    margin-bottom: var(--spacing-xl);
}

.dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--ion-color-light-shade);
    transition: all 0.3s ease;
}

.dot.active {
    width: 24px;
    border-radius: 4px;
    background: var(--ion-color-primary);
}

.dot.completed {
    background: var(--ion-color-success);
}

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
    background: var(--ion-color-primary-tint);
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto var(--spacing-lg);
}

.step-icon ion-icon {
    font-size: 2.5rem;
    color: var(--ion-color-primary);
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
    background: var(--ion-color-success-tint);
    border-radius: var(--radius-lg);
    margin-bottom: var(--spacing-lg);
}

.download-complete ion-icon {
    font-size: 2.5rem;
}

.download-complete p {
    margin: 0;
    color: var(--ion-color-success-shade);
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
