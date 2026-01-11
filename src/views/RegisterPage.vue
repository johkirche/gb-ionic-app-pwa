<template>
    <ion-page>
        <ion-content :fullscreen="true">
            <!-- Back button integrated into content -->
            <ion-button
                fill="clear"
                class="back-button floating-button floating-button--top-left"
                @click="$router.back()"
            >
                <ion-icon slot="icon-only" :icon="arrowBackOutline"></ion-icon>
            </ion-button>

            <div class="auth-container">
                <div class="section-header">
                    <h1 class="heading-lg">Konto erstellen</h1>
                    <p class="text-muted">Erstellen Sie ein Konto mit Ihrem Aktivierungscode</p>
                </div>

                <form @submit.prevent="handleRegister">
                    <div class="form-stack">
                        <ion-input
                            v-model="activationCode"
                            type="text"
                            label="Aktivierungscode"
                            label-placement="floating"
                            required
                            :disabled="isLoading"
                            fill="outline"
                            placeholder="XXXX-XXXX-XXXX"
                        ></ion-input>

                        <ion-input
                            v-model="firstName"
                            type="text"
                            label="Vorname (optional)"
                            label-placement="floating"
                            autocomplete="given-name"
                            fill="outline"
                            :disabled="isLoading"
                        ></ion-input>

                        <ion-input
                            v-model="lastName"
                            type="text"
                            label="Nachname (optional)"
                            label-placement="floating"
                            autocomplete="family-name"
                            fill="outline"
                            :disabled="isLoading"
                        ></ion-input>

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
                            autocomplete="new-password"
                            fill="outline"
                            :disabled="isLoading"
                        ></ion-input>

                        <ion-input
                            v-model="confirmPassword"
                            type="password"
                            label="Passwort bestätigen"
                            label-placement="floating"
                            required
                            autocomplete="new-password"
                            fill="outline"
                            :disabled="isLoading"
                        ></ion-input>
                    </div>

                    <ion-text v-if="passwordError" color="danger" class="ion-margin-top">
                        <p class="error-message">{{ passwordError }}</p>
                    </ion-text>

                    <ion-button
                        expand="block"
                        type="submit"
                        :disabled="isLoading || !isFormValid"
                        class="ion-margin-top"
                    >
                        <ion-spinner v-if="isLoading" name="crescent"></ion-spinner>
                        <span v-else>Registrieren</span>
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
                    <p class="error-message">{{ error }}</p>
                </ion-text>

                <div class="section-footer">
                    <ion-text color="medium">
                        Bereits ein Konto?
                        <router-link to="/login">Anmelden</router-link>
                    </ion-text>
                </div>
            </div>
        </ion-content>
    </ion-page>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';

import { IonButton, IonContent, IonIcon, IonInput, IonPage, IonSpinner, IonText } from '@ionic/vue';
import { arrowBackOutline } from 'ionicons/icons';
import { useRouter } from 'vue-router';

import { useAuth } from '@/composables/useAuth';

const router = useRouter();
const { register, setSkipAuth, isLoading, error } = useAuth();

const activationCode = ref('');
const firstName = ref('');
const lastName = ref('');
const email = ref('');
const password = ref('');
const confirmPassword = ref('');
const passwordError = ref('');

const isFormValid = computed(() => {
    return (
        activationCode.value &&
        email.value &&
        password.value &&
        confirmPassword.value &&
        password.value === confirmPassword.value &&
        password.value.length >= 8
    );
});

async function handleRegister() {
    passwordError.value = '';

    if (!activationCode.value) {
        passwordError.value = 'Bitte geben Sie einen Aktivierungscode ein';
        return;
    }

    if (password.value.length < 8) {
        passwordError.value = 'Passwort muss mindestens 8 Zeichen lang sein';
        return;
    }

    if (password.value !== confirmPassword.value) {
        passwordError.value = 'Passwörter stimmen nicht überein';
        return;
    }

    const result = await register(
        email.value,
        password.value,
        activationCode.value,
        firstName.value || undefined,
        lastName.value || undefined,
    );

    if (result.success) {
        // Navigate to home - user is automatically activated if code was valid
        router.push('/home');
    }
}

async function handleSkip() {
    await setSkipAuth(true);
    router.push('/home');
}
</script>

<style scoped>
/* RegisterPage - no component-specific styles needed */
</style>
