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
import { onMounted, ref, watch } from 'vue';

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

const ONBOARDING_IN_PROGRESS_KEY = 'onboarding.inProgress';
const ONBOARDING_STEP_KEY = 'onboarding.currentStep';

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
    localStorage.removeItem(ONBOARDING_IN_PROGRESS_KEY);
    localStorage.removeItem(ONBOARDING_STEP_KEY);
    router.push('/home');
}

function skipOnboarding() {
    localStorage.removeItem(ONBOARDING_IN_PROGRESS_KEY);
    localStorage.removeItem(ONBOARDING_STEP_KEY);
    router.push('/home');
}

onMounted(() => {
    localStorage.setItem(ONBOARDING_IN_PROGRESS_KEY, '1');

    const storedStep = Number(localStorage.getItem(ONBOARDING_STEP_KEY));
    if (!Number.isNaN(storedStep) && storedStep >= 1 && storedStep <= totalSteps) {
        currentStep.value = storedStep;
    }
});

watch(
    currentStep,
    (step) => {
        localStorage.setItem(ONBOARDING_STEP_KEY, String(step));
    },
    { immediate: true },
);
</script>

<style scoped>
.onboarding-container {
    min-height: 100%;
    display: flex;
    flex-direction: column;
    padding: var(--spacing-xl) var(--spacing-lg);
    /* max-width: var(--container-sm); */
    margin: 0 auto;
}
</style>
