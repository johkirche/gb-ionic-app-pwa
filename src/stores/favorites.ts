import { computed, ref } from 'vue';

import { defineStore } from 'pinia';

import { type Favorite, db } from '@/db';

export const useFavoritesStore = defineStore('favorites', () => {
    const favorites = ref<Favorite[]>([]);
    const isLoading = ref(false);
    const error = ref<string | null>(null);

    const favoriteIds = computed(() => new Set(favorites.value.map((f) => f.id)));
    const sortedFavorites = computed(() =>
        [...favorites.value].sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        ),
    );

    async function loadFavorites() {
        try {
            error.value = null;
            isLoading.value = true;
            favorites.value = await db.favorites.toArray();
            return favorites.value;
        } catch (err) {
            console.error('Error loading favorites from DB:', err);
            error.value = 'Failed to load favorites';
            throw err;
        } finally {
            isLoading.value = false;
        }
    }

    function isFavorite(songId: string): boolean {
        return favoriteIds.value.has(songId);
    }

    async function addFavorite(songId: string): Promise<void> {
        if (favoriteIds.value.has(songId)) return;
        const favorite: Favorite = { id: songId, createdAt: new Date() };
        await db.favorites.put(favorite);
        favorites.value.push(favorite);
    }

    async function removeFavorite(songId: string): Promise<void> {
        await db.favorites.delete(songId);
        favorites.value = favorites.value.filter((f) => f.id !== songId);
    }

    async function toggleFavorite(songId: string): Promise<boolean> {
        if (isFavorite(songId)) {
            await removeFavorite(songId);
            return false;
        }
        await addFavorite(songId);
        return true;
    }

    async function clearAll(): Promise<void> {
        await db.favorites.clear();
        favorites.value = [];
    }

    loadFavorites();

    return {
        favorites,
        isLoading,
        error,
        favoriteIds,
        sortedFavorites,
        loadFavorites,
        isFavorite,
        addFavorite,
        removeFavorite,
        toggleFavorite,
        clearAll,
    };
});
