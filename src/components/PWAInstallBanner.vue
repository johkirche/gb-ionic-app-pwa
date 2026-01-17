<template>
    <Transition name="install-banner">
        <div v-if="showInstallButton && !dismissed" class="pwa-install-banner">
            <div class="banner-content">
                <ion-icon :icon="downloadOutline" class="banner-icon"></ion-icon>
                <div class="banner-text">
                    <strong>App installieren</strong>
                    <p>Für schnelleren Zugriff und Offline-Nutzung</p>
                </div>
            </div>
            <div class="banner-actions">
                <ion-button fill="clear" size="small" color="medium" @click="dismiss">
                    Später
                </ion-button>
                <ion-button size="small" @click="install">Installieren</ion-button>
            </div>
        </div>
    </Transition>
</template>

<script setup lang="ts">
import { ref } from 'vue';

import { IonButton, IonIcon } from '@ionic/vue';
import { downloadOutline } from 'ionicons/icons';

import { usePWA } from '@/composables/usePWA';

const { showInstallButton, installPWA } = usePWA();
const dismissed = ref(false);

// Check if user has previously dismissed (persist for the session)
const DISMISS_KEY = 'pwa-install-dismissed';
const sessionDismissed = sessionStorage.getItem(DISMISS_KEY);
if (sessionDismissed === 'true') {
    dismissed.value = true;
}

function dismiss() {
    dismissed.value = true;
    sessionStorage.setItem(DISMISS_KEY, 'true');
}

async function install() {
    await installPWA();
}
</script>

<style scoped>
.pwa-install-banner {
    position: fixed;
    bottom: calc(env(safe-area-inset-bottom, 0px) + 16px);
    left: 16px;
    right: 16px;
    background: var(--ion-color-primary);
    color: var(--ion-color-primary-contrast);
    border-radius: 12px;
    padding: 12px 16px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
    z-index: 9999;
    max-width: 400px;
    margin: 0 auto;
}

@media (min-width: 600px) {
    .pwa-install-banner {
        flex-direction: row;
        align-items: center;
        justify-content: space-between;
    }
}

.banner-content {
    display: flex;
    align-items: center;
    gap: 12px;
}

.banner-icon {
    font-size: 24px;
    flex-shrink: 0;
}

.banner-text {
    flex: 1;
}

.banner-text strong {
    display: block;
    font-size: 14px;
    margin-bottom: 2px;
}

.banner-text p {
    margin: 0;
    font-size: 12px;
    opacity: 0.9;
}

.banner-actions {
    display: flex;
    gap: 8px;
    justify-content: flex-end;
}

.banner-actions ion-button {
    --padding-start: 12px;
    --padding-end: 12px;
}

.banner-actions ion-button[fill='clear'] {
    --color: var(--ion-color-primary-contrast);
    opacity: 0.8;
}

.banner-actions ion-button:not([fill='clear']) {
    --background: var(--ion-color-primary-contrast);
    --color: var(--ion-color-primary);
}

/* Transition animations */
.install-banner-enter-active,
.install-banner-leave-active {
    transition: all 0.3s ease;
}

.install-banner-enter-from,
.install-banner-leave-to {
    opacity: 0;
    transform: translateY(100%);
}
</style>
