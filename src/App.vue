<template>
    <ion-app>
        <ion-router-outlet class="mobile-container" />
    </ion-app>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';

import { IonApp, IonRouterOutlet } from '@ionic/vue';

// Apply theme on app startup
function applyTheme(theme: 'system' | 'light' | 'dark') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    if (theme === 'dark' || (theme === 'system' && prefersDark)) {
        document.documentElement.classList.add('ion-palette-dark');
    } else {
        document.documentElement.classList.remove('ion-palette-dark');
    }
}

function initializeTheme() {
    const savedTheme = localStorage.getItem('settings.theme') as 'system' | 'light' | 'dark' | null;
    const theme =
        savedTheme && ['system', 'light', 'dark'].includes(savedTheme) ? savedTheme : 'system';
    applyTheme(theme);

    // Listen for system theme changes when using 'system' mode
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
        const currentTheme = localStorage.getItem('settings.theme') as
            | 'system'
            | 'light'
            | 'dark'
            | null;
        if (!currentTheme || currentTheme === 'system') {
            applyTheme('system');
        }
    });
}

onMounted(() => {
    initializeTheme();
});
</script>

<style>
/* Mobile container styles are defined in theme/variables.css */
</style>
