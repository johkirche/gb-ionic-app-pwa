<template>
    <ion-page>
        <ion-content :fullscreen="true">
            <div class="auth-container auth-container--centered">
                <div class="section-header">
                    <ion-img src="/logo.png" alt="Logo" class="logo logo--md" />
                    <h1 class="heading-xl">Gesangbuch</h1>
                    <p class="text-muted">Melden Sie sich an, um fortzufahren</p>
                </div>

                <form @submit.prevent="handleLogin">
                    <div class="form-stack">
                        <ion-input
                            v-model="email"
                            type="email"
                            label="E-Mail"
                            label-placement="floating"
                            required
                            autocomplete="email"
                            fill="outline"
                            :disabled="isLoading"
                        ></ion-input>

                        <ion-input
                            v-model="password"
                            type="password"
                            label="Passwort"
                            label-placement="floating"
                            required
                            fill="outline"
                            autocomplete="current-password"
                            :disabled="isLoading"
                        ></ion-input>
                    </div>

                    <ion-button
                        expand="block"
                        type="submit"
                        :disabled="isLoading"
                        class="ion-margin-top"
                    >
                        <ion-spinner v-if="isLoading" name="crescent"></ion-spinner>
                        <span v-else>Anmelden</span>
                    </ion-button>

                    <ion-button
                        expand="block"
                        fill="clear"
                        router-link="/password-reset"
                        :disabled="isLoading"
                        size="small"
                        class="ion-margin-top"
                    >
                        Passwort vergessen?
                    </ion-button>

                    <div class="divider-text">
                        <span class="divider-text__text">oder</span>
                    </div>

                    <ion-button
                        expand="block"
                        fill="outline"
                        router-link="/register"
                        :disabled="isLoading"
                    >
                        Neues Konto erstellen
                    </ion-button>

                    <ion-button
                        v-if="showDevSkip"
                        expand="block"
                        fill="clear"
                        @click="handleSkip"
                        :disabled="isLoading"
                        size="small"
                        color="medium"
                        class="ion-margin-top"
                    >
                        Überspringen (Entwicklermodus)
                    </ion-button>
                </form>

                <ion-text v-if="error" color="danger" class="ion-margin-top">
                    <p class="error-message">{{ error }}</p>
                </ion-text>
            </div>
        </ion-content>
    </ion-page>
</template>

<script setup lang="ts">
import { ref } from 'vue';

import { IonButton, IonContent, IonImg, IonInput, IonPage, IonSpinner, IonText } from '@ionic/vue';
import { useRouter } from 'vue-router';

import { useSongsStore } from '@/stores/songs';

import { useAuth } from '@/composables/useAuth';

const router = useRouter();
const { login, setSkipAuth, isLoading, error } = useAuth();
const songsStore = useSongsStore();

const email = ref('');
const password = ref('');

// Show dev skip button only if env var is set
const showDevSkip = import.meta.env.VITE_SHOW_DEV_SKIP === 'true';

async function handleLogin() {
    if (!email.value || !password.value) {
        return;
    }

    const result = await login(email.value, password.value);

    if (result.success) {
        // Check if user has downloaded data
        const hasData = songsStore.songs.length > 0;

        // If no data, go to onboarding; otherwise go to home
        if (!hasData) {
            router.push('/onboarding');
        } else {
            router.push('/home');
        }
    }
}

async function handleSkip() {
    await setSkipAuth(true);
    router.push('/home');
}
</script>

<style scoped>
/* LoginPage - no component-specific styles needed */
</style>
