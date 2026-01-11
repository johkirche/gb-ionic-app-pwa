import { useUserStore } from '@/stores/user';

import { refreshAuthToken } from '@/composables/useAuth';

import type { Autor, NotenFile, Song } from '@/db';
import { directusClient } from '@/services/directus';

/**
 * Songs API
 *
 * Handles GraphQL queries and data transformation for songs from Directus.
 */

// GraphQL response types (nested structure from Directus)
interface DirectusAutor {
    autor_id: {
        vorname: string;
        nachname: string;
        sterbejahr?: number;
    };
}

interface DirectusNotenFile {
    directus_files_id: {
        filename_download: string;
        id: string;
    };
}

interface DirectusKategorie {
    kategorie_id: {
        name: string;
    };
}

interface DirectusGesangbuchlied {
    id: string;
    titel: string;
    textId: {
        strophenEinzeln: string[];
        autorId: DirectusAutor[];
    } | null;
    melodieId: {
        abc_melodie: string;
        autorId: DirectusAutor[];
        noten: DirectusNotenFile[];
    } | null;
    kategorieId: DirectusKategorie[];
}

interface DirectusResponse {
    gesangbuchlied: DirectusGesangbuchlied[];
}

// GraphQL query
const SONGS_QUERY = `
    { gesangbuchlied( filter: { bewertungKleinerKreis: { bezeichner: { _eq: "Rein" } } } limit: 5000 ) { id titel textId { strophenEinzeln autorId { autor_id { vorname nachname sterbejahr } } } melodieId { abc_melodie autorId { autor_id { vorname nachname sterbejahr } } noten { directus_files_id { filename_download id } } } kategorieId { kategorie_id { name } } } }
`;

// Get current token from user store or env variable for debug mode
function getCurrentToken(): string | null {
    const userStore = useUserStore();

    // If skipAuth is enabled (debug mode), use the environment variable token
    if (userStore.skipAuth) {
        return import.meta.env.VITE_AUTH_TOKEN || null;
    }

    return userStore.authData?.accessToken || null;
}

// Transform nested Directus response to flat Song structure
function transformSong(directusSong: DirectusGesangbuchlied, index: number): Song {
    const textAutoren: Autor[] =
        directusSong.textId?.autorId?.map((a) => ({
            vorname: a.autor_id.vorname,
            nachname: a.autor_id.nachname,
            sterbejahr: a.autor_id.sterbejahr,
        })) || [];

    const melodieAutoren: Autor[] =
        directusSong.melodieId?.autorId?.map((a) => ({
            vorname: a.autor_id.vorname,
            nachname: a.autor_id.nachname,
            sterbejahr: a.autor_id.sterbejahr,
        })) || [];

    const noten: NotenFile[] =
        directusSong.melodieId?.noten?.map((n) => ({
            filename_download: n.directus_files_id.filename_download,
            id: n.directus_files_id.id,
        })) || [];

    const kategorien: string[] = directusSong.kategorieId?.map((k) => k.kategorie_id.name) || [];

    return {
        id: directusSong.id,
        index,
        titel: directusSong.titel,
        strophen: directusSong.textId?.strophenEinzeln || [],
        textAutoren,
        melodieAbc: directusSong.melodieId?.abc_melodie || '',
        melodieAutoren,
        noten,
        kategorien,
    };
}

// Fetch songs from Directus
export async function fetchSongs(): Promise<Song[]> {
    try {
        const token = getCurrentToken();
        if (token) {
            await directusClient.setToken(token);
        }

        const response = await directusClient.query<DirectusResponse>(SONGS_QUERY);

        return response.gesangbuchlied.map((song, index) => transformSong(song, index + 1));
    } catch (error) {
        // If unauthorized, try to refresh token and retry
        if (error instanceof Error && error.message.includes('401')) {
            const refreshed = await refreshAuthToken();
            if (refreshed) {
                const newToken = getCurrentToken();
                if (newToken) {
                    await directusClient.setToken(newToken);
                }
                const response = await directusClient.query<DirectusResponse>(SONGS_QUERY);
                return response.gesangbuchlied.map((song, index) => transformSong(song, index + 1));
            }
        }
        console.error('Error fetching songs from Directus:', error);
        throw new Error('Failed to fetch songs from server');
    }
}

// Fetch songs with their PNG files
export async function fetchSongsWithFiles(): Promise<{
    songs: Song[];
    fileIds: string[];
}> {
    const songs = await fetchSongs();

    // Collect all unique file IDs
    const fileIds = new Set<string>();
    songs.forEach((song) => {
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

    return {
        songs,
        fileIds: Array.from(fileIds),
    };
}
