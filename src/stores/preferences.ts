import { ref } from 'vue';

import { defineStore } from 'pinia';

import { db } from '@/db';

export interface PreferencesData {
    id: string;
    notationScale: number; // Scale factor for ABC notation (0.5 - 2.0)
    textSize: 'small' | 'medium' | 'large' | 'xlarge'; // Text size for song lyrics
}

export const usePreferencesStore = defineStore('preferences', () => {
    // State
    const notationScale = ref<number>(1.0); // Default scale
    const textSize = ref<'small' | 'medium' | 'large' | 'xlarge'>('medium'); // Default text size
    const isLoading = ref(false);

    // Actions
    async function loadPreferences() {
        try {
            isLoading.value = true;

            // Load preferences from IndexedDB
            const prefs = await db.preferences.get('default');
            if (prefs) {
                notationScale.value = prefs.notationScale;
                textSize.value = prefs.textSize;
            }
        } catch (err) {
            console.error('Error loading preferences:', err);
        } finally {
            isLoading.value = false;
        }
    }

    async function setNotationScale(scale: number) {
        try {
            // Clamp scale between 0.5 and 2.0
            const clampedScale = Math.max(0.5, Math.min(2.0, scale));
            notationScale.value = clampedScale;

            // Get current preferences and update
            const current = await db.preferences.get('default');
            await db.preferences.put({
                id: 'default',
                notationScale: clampedScale,
                textSize: current?.textSize || textSize.value,
            });
        } catch (err) {
            console.error('Error saving notation scale:', err);
            throw err;
        }
    }

    async function setTextSize(size: 'small' | 'medium' | 'large' | 'xlarge') {
        try {
            textSize.value = size;

            // Get current preferences and update
            const current = await db.preferences.get('default');
            await db.preferences.put({
                id: 'default',
                notationScale: current?.notationScale || notationScale.value,
                textSize: size,
            });
        } catch (err) {
            console.error('Error saving text size:', err);
            throw err;
        }
    }

    // Initialize store on creation
    const initPromise = loadPreferences();

    return {
        // State
        notationScale,
        textSize,
        isLoading,

        // Actions
        loadPreferences,
        setNotationScale,
        setTextSize,

        // Initialization promise
        initPromise,
    };
});
