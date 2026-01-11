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
                    <ion-icon :icon="keyOutline" class="icon-hero"></ion-icon>
                    <h1 class="heading-lg">Passwort zurücksetzen</h1>
                    <p v-if="!token && !emailSent" class="text-muted text-muted--relaxed">
                        Geben Sie Ihre E-Mail-Adresse ein, um einen Link zum Zurücksetzen Ihres
                        Passworts zu erhalten
                    </p>
                    <p v-else-if="emailSent" class="text-muted text-muted--relaxed">
                        Eine E-Mail mit einem Link zum Zurücksetzen wurde gesendet
                    </p>
                    <p v-else class="text-muted text-muted--relaxed">
                        Geben Sie Ihr neues Passwort ein
                    </p>
                </div>

                <!-- Email request form (no token) -->
                <form v-if="!token && !emailSent" @submit.prevent="handleRequestReset">
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

                    <ion-button
                        expand="block"
                        type="submit"
                        :disabled="isLoading || !email"
                        class="ion-margin-top"
                    >
                        <ion-spinner v-if="isLoading" name="crescent"></ion-spinner>
                        <span v-else>Link senden</span>
                    </ion-button>

                    <ion-text v-if="error" color="danger" class="ion-margin-top">
                        <p class="error-message">{{ error }}</p>
                    </ion-text>
                </form>

                <!-- Success message after email sent -->
                <div v-else-if="emailSent && !token">
                    <ion-text color="success">
                        <div class="result-box result-box--success">
                            <ion-icon
                                :icon="checkmarkCircleOutline"
                                class="result-box__icon"
                            ></ion-icon>
                            <h2 class="result-box__title">E-Mail gesendet!</h2>
                            <p class="result-box__message">
                                Wir haben Ihnen eine E-Mail mit einem Link zum Zurücksetzen Ihres
                                Passworts gesendet. Bitte überprüfen Sie Ihren Posteingang.
                            </p>
                        </div>
                    </ion-text>

                    <ion-button expand="block" router-link="/login" class="ion-margin-top">
                        Zurück zur Anmeldung
                    </ion-button>
                </div>

                <!-- Password reset form (with token) -->
                <form v-else @submit.prevent="handleResetPassword">
                    <div class="form-stack">
                        <ion-input
                            v-model="newPassword"
                            type="password"
                            label="Neues Passwort"
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
                        :disabled="isLoading || !isPasswordValid"
                        class="ion-margin-top"
                    >
                        <ion-spinner v-if="isLoading" name="crescent"></ion-spinner>
                        <span v-else>Passwort zurücksetzen</span>
                    </ion-button>

                    <ion-text v-if="error" color="danger" class="ion-margin-top">
                        <p class="error-message">{{ error }}</p>
                    </ion-text>

                    <ion-text v-if="resetSuccess" color="success" class="ion-margin-top">
                        <div class="result-box result-box--success">
                            <ion-icon
                                :icon="checkmarkCircleOutline"
                                class="result-box__icon"
                            ></ion-icon>
                            <h2 class="result-box__title">Passwort zurückgesetzt!</h2>
                            <p class="result-box__message">
                                Ihr Passwort wurde erfolgreich geändert.
                            </p>
                        </div>
                    </ion-text>

                    <ion-button
                        v-if="resetSuccess"
                        expand="block"
                        router-link="/login"
                        class="ion-margin-top"
                    >
                        Zur Anmeldung
                    </ion-button>
                </form>

                <div class="back-link ion-margin-top">
                    <ion-button fill="clear" router-link="/login">Zurück zur Anmeldung</ion-button>
                </div>
            </div>
        </ion-content>
    </ion-page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';

import { IonButton, IonContent, IonIcon, IonInput, IonPage, IonSpinner, IonText } from '@ionic/vue';
import { arrowBackOutline, checkmarkCircleOutline, keyOutline } from 'ionicons/icons';
import { useRoute } from 'vue-router';

import { useAuth } from '@/composables/useAuth';

const route = useRoute();
const { requestPasswordReset, resetPassword, isLoading, error } = useAuth();

const token = ref<string | null>(null);
const email = ref('');
const newPassword = ref('');
const confirmPassword = ref('');
const passwordError = ref('');
const emailSent = ref(false);
const resetSuccess = ref(false);

const isPasswordValid = computed(() => {
    return (
        newPassword.value &&
        confirmPassword.value &&
        newPassword.value === confirmPassword.value &&
        newPassword.value.length >= 8
    );
});

onMounted(() => {
    // Check if there's a token in the URL query params
    const urlToken = route.query.token as string;
    if (urlToken) {
        token.value = urlToken;
    }
});

async function handleRequestReset() {
    const result = await requestPasswordReset(email.value);
    if (result.success) {
        emailSent.value = true;
    }
}

async function handleResetPassword() {
    passwordError.value = '';

    if (newPassword.value.length < 8) {
        passwordError.value = 'Passwort muss mindestens 8 Zeichen lang sein';
        return;
    }

    if (newPassword.value !== confirmPassword.value) {
        passwordError.value = 'Passwörter stimmen nicht überein';
        return;
    }

    if (!token.value) {
        passwordError.value = 'Ungültiger Reset-Token';
        return;
    }

    const result = await resetPassword(token.value, newPassword.value);
    if (result.success) {
        resetSuccess.value = true;
    }
}
</script>

<style scoped>
/* PasswordResetPage - uses global result-box classes from variables.css */
.back-link {
    text-align: center;
}
</style>
