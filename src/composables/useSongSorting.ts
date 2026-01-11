import { type Ref, computed, ref } from 'vue';

import type { Song } from '@/db';

export type SortMode = 'index' | 'alphabetical' | 'category';

export interface SortOption {
    value: SortMode;
    label: string;
    icon: string;
    showHeaders: boolean;
}

export const SORT_OPTIONS: SortOption[] = [
    { value: 'index', label: 'Nummer', icon: 'list-outline', showHeaders: false },
    { value: 'alphabetical', label: 'Alphabetisch', icon: 'text-outline', showHeaders: true },
    { value: 'category', label: 'Kategorie', icon: 'pricetag-outline', showHeaders: true },
];

export interface SongSection {
    key: string;
    label: string;
    songs: Song[];
}

export interface IndexItem {
    key: string;
    label: string;
}

/**
 * Composable for song sorting and grouping logic
 */
export function useSongSorting(songs: Ref<Song[]>) {
    const sortMode = ref<SortMode>('index');

    // Get the current sort option config
    const currentSortOption = computed(
        () => SORT_OPTIONS.find((opt) => opt.value === sortMode.value) || SORT_OPTIONS[0],
    );

    // Check if headers should be shown for current sort mode
    const showHeaders = computed(() => currentSortOption.value.showHeaders);

    // Sort and group songs based on current mode
    const sortedSections = computed((): SongSection[] => {
        const songList = songs.value;

        switch (sortMode.value) {
            case 'index':
                return groupByIndex(songList);
            case 'alphabetical':
                return groupByAlphabet(songList);
            case 'category':
                return groupByCategory(songList);
            default:
                return groupByIndex(songList);
        }
    });

    // Flat list of all songs in sorted order
    const sortedSongs = computed((): Song[] => {
        return sortedSections.value.flatMap((section) => section.songs);
    });

    // Index items for the scroll indicator
    const indexItems = computed((): IndexItem[] => {
        return sortedSections.value.map((section) => ({
            key: section.key,
            label: section.label,
        }));
    });

    return {
        sortMode,
        currentSortOption,
        showHeaders,
        sortedSections,
        sortedSongs,
        indexItems,
    };
}

/**
 * Group songs by index number (tenner groups: 1-9, 10-19, 20-29, etc.)
 */
function groupByIndex(songs: Song[]): SongSection[] {
    const sorted = [...songs].sort((a, b) => a.index - b.index);
    const groups = new Map<number, Song[]>();

    for (const song of sorted) {
        // Calculate tenner group: 0 for 1-9, 10 for 10-19, etc.
        const tenner = Math.floor((song.index - 1) / 20) * 20;
        const key = tenner === 0 ? 1 : tenner;

        if (!groups.has(key)) {
            groups.set(key, []);
        }
        groups.get(key)!.push(song);
    }

    // Convert to sections with proper labels
    return Array.from(groups.entries())
        .sort(([a], [b]) => a - b)
        .map(([key, groupSongs]) => ({
            key: String(key),
            label: String(key), // "1", "10", "20", etc.
            songs: groupSongs,
        }));
}

/**
 * Group songs alphabetically by first letter of title
 */
function groupByAlphabet(songs: Song[]): SongSection[] {
    const sorted = [...songs].sort((a, b) => a.titel.localeCompare(b.titel, 'de'));
    const groups = new Map<string, Song[]>();

    for (const song of sorted) {
        const firstChar = song.titel.charAt(0).toUpperCase();
        // Handle numbers and special characters
        const letter = /[A-ZÄÖÜ]/.test(firstChar) ? firstChar : '#';

        if (!groups.has(letter)) {
            groups.set(letter, []);
        }
        groups.get(letter)!.push(song);
    }

    // Sort alphabetically, with # at the end
    return Array.from(groups.entries())
        .sort(([a], [b]) => {
            if (a === '#') return 1;
            if (b === '#') return -1;
            return a.localeCompare(b, 'de');
        })
        .map(([letter, groupSongs]) => ({
            key: letter,
            label: letter,
            songs: groupSongs,
        }));
}

/**
 * Group songs by category
 */
function groupByCategory(songs: Song[]): SongSection[] {
    const groups = new Map<string, Song[]>();

    for (const song of songs) {
        const categories = song.kategorien.length > 0 ? song.kategorien : ['Unkategorisiert'];

        // Add song to each of its categories
        for (const category of categories) {
            if (!groups.has(category)) {
                groups.set(category, []);
            }
            groups.get(category)!.push(song);
        }
    }

    // Sort categories alphabetically, with Unkategorisiert at the end
    return Array.from(groups.entries())
        .sort(([a], [b]) => {
            if (a === 'Unkategorisiert') return 1;
            if (b === 'Unkategorisiert') return -1;
            return a.localeCompare(b, 'de');
        })
        .map(([category, groupSongs]) => ({
            key: category,
            label: category,
            // Sort songs within category by title
            songs: [...groupSongs].sort((a, b) => a.titel.localeCompare(b.titel, 'de')),
        }));
}
