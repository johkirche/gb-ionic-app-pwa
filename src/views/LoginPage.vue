<template>
    <ion-page>
        <ion-content :fullscreen="true">
            <div class="max-w-md mx-auto px-6 py-16 min-h-screen flex flex-col justify-center">
                <div class="text-center mb-8">
                    <ion-img src="/logo.png" alt="Logo" class="w-52 h-52 mx-auto block" />
                    <h1 class="text-4xl font-semibold mb-2">Gesangbuch</h1>
                    <p class="text-[color:var(--ion-color-medium)] text-sm">
                        Melden Sie sich an, um fortzufahren
                    </p>
                </div>

                <form @submit.prevent="handleLogin">
                    <ion-list>
                        <ion-item>
                            <ion-input
                                v-model="email"
                                type="email"
                                label="E-Mail"
                                label-placement="floating"
                                required
                                autocomplete="email"
                                :disabled="isLoading"
                            ></ion-input>
                        </ion-item>

                        <ion-item>
                            <ion-input
                                v-model="password"
                                type="password"
                                label="Passwort"
                                label-placement="floating"
                                required
                                autocomplete="current-password"
                                :disabled="isLoading"
                            ></ion-input>
                        </ion-item>
                    </ion-list>

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
                        class="mt-2"
                    >
                        Passwort vergessen?
                    </ion-button>

                    <div class="flex items-center text-center my-6">
                        <div
                            class="flex-1 border-b border-[color:var(--ion-color-light-shade)]"
                        ></div>
                        <span class="px-4 text-[color:var(--ion-color-medium)] text-sm">oder</span>
                        <div
                            class="flex-1 border-b border-[color:var(--ion-color-light-shade)]"
                        ></div>
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
                    <p class="text-center text-sm">{{ error }}</p>
                </ion-text>
            </div>
        </ion-content>
    </ion-page>
</template>

<script setup lang="ts">
import { ref } from 'vue';

import {
    IonButton,
    IonContent,
    IonInput,
    IonItem,
    IonList,
    IonPage,
    IonSpinner,
    IonText,
} from '@ionic/vue';
import { useRouter } from 'vue-router';

import { useAuth } from '@/composables/useAuth';

const router = useRouter();
const { login, setSkipAuth, isLoading, error } = useAuth();

const email = ref('');
const password = ref('');

async function handleLogin() {
    if (!email.value || !password.value) {
        return;
    }

    const result = await login(email.value, password.value);

    if (result.success) {
        // Navigate to home, which will handle routing based on activation status
        router.push('/home');
    }
}

async function handleSkip() {
    await setSkipAuth(true);
    router.push('/home');
}
</script>

<style scoped>
/* LoginPage specific styles - layout handled by Tailwind */
</style>
