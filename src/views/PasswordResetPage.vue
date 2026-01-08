<template>
    <ion-page>
        <ion-content :fullscreen="true">
            <!-- Back button integrated into content -->
            <ion-button
                fill="clear"
                class="back-button absolute top-4 left-2 z-10"
                @click="$router.back()"
            >
                <ion-icon slot="icon-only" :icon="arrowBackOutline"></ion-icon>
            </ion-button>

            <div class="max-w-md mx-auto px-6 pt-16 pb-8 min-h-screen">
                <div class="text-center mb-8">
                    <ion-icon
                        :icon="keyOutline"
                        class="text-6xl text-[color:var(--ion-color-primary)] mb-4"
                    ></ion-icon>
                    <h1 class="text-3xl font-semibold mb-2">Passwort zurücksetzen</h1>
                    <p
                        v-if="!token && !emailSent"
                        class="text-[color:var(--ion-color-medium)] text-sm leading-relaxed"
                    >
                        Geben Sie Ihre E-Mail-Adresse ein, um einen Link zum Zurücksetzen Ihres
                        Passworts zu erhalten
                    </p>
                    <p
                        v-else-if="emailSent"
                        class="text-[color:var(--ion-color-medium)] text-sm leading-relaxed"
                    >
                        Eine E-Mail mit einem Link zum Zurücksetzen wurde gesendet
                    </p>
                    <p v-else class="text-[color:var(--ion-color-medium)] text-sm leading-relaxed">
                        Geben Sie Ihr neues Passwort ein
                    </p>
                </div>

                <!-- Email request form (no token) -->
                <form v-if="!token && !emailSent" @submit.prevent="handleRequestReset">
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
                    </ion-list>

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
                        <div class="result-box success">
                            <ion-icon :icon="checkmarkCircleOutline" class="result-icon"></ion-icon>
                            <h2>E-Mail gesendet!</h2>
                            <p>
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
                    <ion-list>
                        <ion-item>
                            <ion-input
                                v-model="newPassword"
                                type="password"
                                label="Neues Passwort"
                                label-placement="floating"
                                required
                                autocomplete="new-password"
                                :disabled="isLoading"
                            ></ion-input>
                        </ion-item>

                        <ion-item>
                            <ion-input
                                v-model="confirmPassword"
                                type="password"
                                label="Passwort bestätigen"
                                label-placement="floating"
                                required
                                autocomplete="new-password"
                                :disabled="isLoading"
                            ></ion-input>
                        </ion-item>
                    </ion-list>

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
                        <div class="result-box success">
                            <ion-icon :icon="checkmarkCircleOutline" class="result-icon"></ion-icon>
                            <h2>Passwort zurückgesetzt!</h2>
                            <p>Ihr Passwort wurde erfolgreich geändert.</p>
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

import {
    IonButton,
    IonContent,
    IonIcon,
    IonInput,
    IonItem,
    IonList,
    IonPage,
    IonSpinner,
    IonText,
} from '@ionic/vue';
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
/* PasswordResetPage specific styles - layout handled by Tailwind */
.result-box {
    text-align: center;
    padding: 2rem;
    border-radius: 12px;
    margin-top: 1rem;
}

.result-box.success {
    background: var(--ion-color-success-tint);
}

.result-icon {
    font-size: 4rem;
    margin-bottom: 1rem;
}

.result-box h2 {
    font-size: 1.5rem;
    margin-bottom: 0.5rem;
}

.result-box p {
    font-size: 0.875rem;
    line-height: 1.5;
}
</style>
