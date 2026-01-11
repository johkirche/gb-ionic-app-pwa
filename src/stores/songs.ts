import { computed, ref } from 'vue';

import { defineStore } from 'pinia';

import { fetchFile } from '@/api/files.api';
import { fetchSongsWithFiles } from '@/api/songs.api';
import { type Song, db } from '@/db';

export const useSongsStore = defineStore('songs', () => {
    // State
    const songs = ref<Song[]>([]);
    const isLoading = ref(false);
    const isSyncing = ref(false);
    const error = ref<string | null>(null);
    const lastSyncTime = ref<Date | null>(null);
    const syncProgress = ref({
        current: 0,
        total: 0,
        phase: '' as 'songs' | 'files' | '',
    });

    // Getters
    const hasSongs = computed(() => songs.value.length > 0);
    const sortedSongs = computed(() =>
        [...songs.value].sort((a, b) => a.titel.localeCompare(b.titel)),
    );

    // Actions
    async function loadSongsFromDB() {
        try {
            error.value = null;
            isLoading.value = true;
            const allSongs = await db.songs.toArray();
            songs.value = allSongs;
            return allSongs;
        } catch (err) {
            console.error('Error loading songs from DB:', err);
            error.value = 'Failed to load songs from local database';
            throw err;
        } finally {
            isLoading.value = false;
        }
    }

    async function syncAll() {
        isSyncing.value = true;
        error.value = null;
        syncProgress.value = { current: 0, total: 0, phase: 'songs' };

        try {
            // Step 1: Fetch and save songs
            syncProgress.value.phase = 'songs';
            const { songs: fetchedSongs } = await fetchSongsWithFiles();

            await db.transaction('rw', db.songs, async () => {
                await db.songs.clear();
                await db.songs.bulkAdd(fetchedSongs);
            });

            songs.value = fetchedSongs;

            // Step 2: Download all files
            syncProgress.value.phase = 'files';

            // Collect all unique file IDs from fetched songs
            const fileIds = new Set<string>();
            fetchedSongs.forEach((song) => {
                song.noten.forEach((note) => {
                    const filename = note.filename_download.toLowerCase();
                    if (
                        filename.endsWith('.png') ||
                        filename.endsWith('.jpg') ||
                        filename.endsWith('.svg')
                    ) {
                        fileIds.add(note.id);
                    }
                });
            });

            const fileIdsArray = Array.from(fileIds);
            syncProgress.value.total = fileIdsArray.length;
            syncProgress.value.current = 0;

            // Download files in batches to avoid overwhelming the browser
            const batchSize = 5;
            for (let i = 0; i < fileIdsArray.length; i += batchSize) {
                const batch = fileIdsArray.slice(i, i + batchSize);

                await Promise.all(
                    batch.map(async (fileId) => {
                        try {
                            const blob = await fetchFile(fileId);
                            const song = fetchedSongs.find((s) =>
                                s.noten.some((n) => n.id === fileId),
                            );
                            const filename =
                                song?.noten.find((n) => n.id === fileId)?.filename_download ||
                                `${fileId}.png`;

                            await db.files.put({ id: fileId, blob, filename });
                            syncProgress.value.current++;
                        } catch (err) {
                            console.error(`Failed to download file ${fileId}:`, err);
                        }
                    }),
                );
            }

            lastSyncTime.value = new Date();
            syncProgress.value.phase = '';
        } catch (err) {
            console.error('Error during sync:', err);
            error.value = err instanceof Error ? err.message : 'Failed to complete sync';
            throw err;
        } finally {
            isSyncing.value = false;
        }
    }

    async function getFileBlob(fileId: string): Promise<Blob | null> {
        try {
            const file = await db.files.get(fileId);
            return file?.blob || null;
        } catch (err) {
            console.error('Error getting file blob:', err);
            return null;
        }
    }

    async function getStoredFilesCount(): Promise<number> {
        try {
            return await db.files.count();
        } catch (err) {
            console.error('Error counting files:', err);
            return 0;
        }
    }

    async function clearAllData() {
        try {
            error.value = null;
            await db.transaction('rw', db.songs, db.files, async () => {
                await db.songs.clear();
                await db.files.clear();
            });
            songs.value = [];
            lastSyncTime.value = null;
        } catch (err) {
            console.error('Error clearing data:', err);
            error.value = 'Failed to clear local data';
            throw err;
        }
    }

    // Initialize on store creation
    loadSongsFromDB();

    return {
        // State
        songs: sortedSongs,
        isLoading,
        isSyncing,
        error,
        lastSyncTime,
        syncProgress,
        hasSongs,

        // Actions
        loadSongsFromDB,
        syncAll,
        getFileBlob,
        getStoredFilesCount,
        clearAllData,
    };
});
