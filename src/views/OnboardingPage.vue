<template>
    <ion-page>
        <ion-content :fullscreen="true">
            <div class="onboarding-container">
                <!-- Step Indicator Dots -->
                <StepIndicator :current-step="currentStep" :total-steps="totalSteps" />

                <!-- Step 1: Install PWA -->
                <InstallPWAStep v-if="currentStep === 1" @next="nextStep" @skip="skipOnboarding" />

                <!-- Step 2: Download Content -->
                <DownloadContentStep
                    v-if="currentStep === 2"
                    :is-syncing="isSyncing"
                    :sync-error="syncError"
                    :sync-progress="syncProgress"
                    :download-complete="downloadComplete"
                    @download="handleDownload"
                    @finish="finishOnboarding"
                    @skip="skipOnboarding"
                />
            </div>
        </ion-content>
    </ion-page>
</template>

<script setup lang="ts">
import { ref } from 'vue';

import { IonContent, IonPage } from '@ionic/vue';
import { storeToRefs } from 'pinia';
import { useRouter } from 'vue-router';

import { useSongsStore } from '@/stores/songs';

import DownloadContentStep from '@/components/onboarding/DownloadContentStep.vue';
import InstallPWAStep from '@/components/onboarding/InstallPWAStep.vue';
import StepIndicator from '@/components/utils/StepIndicator.vue';

const router = useRouter();
const songsStore = useSongsStore();
const { isSyncing, error: syncError, syncProgress } = storeToRefs(songsStore);

// Step management
const currentStep = ref(1);
const totalSteps = 2;

// Download state
const downloadComplete = ref(false);

function nextStep() {
    if (currentStep.value < totalSteps) {
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
</style>
