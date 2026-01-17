import { useUserStore } from '@/stores/user';

import { refreshAuthToken } from '@/composables/useAuth';

import type { Autor, Category, NotenFile, Song } from '@/db';
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
        id: number;
        name: string;
    };
}

interface DirectusStrophe {
    strophe: string;
    anmerkung: string | null;
    aenderungsvorschlag: string | null;
}

interface DirectusAbcMelodie {
    name: string;
    abc_notation: string;
    is_default: boolean;
    file_id: string;
}

interface DirectusGesangbuchlied {
    id: string;
    titel: string;
    textId: {
        strophenEinzeln: DirectusStrophe[];
        autorId: DirectusAutor[];
    } | null;
    melodieId: {
        abc_melodie: DirectusAbcMelodie[];
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
    { gesangbuchlied( filter: { bewertungKleinerKreis: { bezeichner: { _eq: "Rein" } } } limit: 5000 ) { id titel textId { strophenEinzeln autorId { autor_id { vorname nachname sterbejahr } } } melodieId { abc_melodie autorId { autor_id { vorname nachname sterbejahr } } noten { directus_files_id { filename_download id } } } kategorieId { kategorie_id { name id } } } }
`;

// Get current token from user store or env variable for debug mode
async function getCurrentToken(): Promise<string | null> {
    const userStore = useUserStore();

    // If skipAuth is enabled (debug mode), use the environment variable token
    if (userStore.skipAuth) {
        return import.meta.env.VITE_AUTH_TOKEN || null;
    }

    const token = userStore.authData?.accessToken || null;
    if (!token) return null;

    // Refresh if access token is expired/near-expiry (store includes a buffer)
    if (userStore.isTokenExpired && userStore.authData?.refreshToken) {
        const refreshed = await refreshAuthToken();
        if (refreshed) {
            return userStore.authData?.accessToken || null;
        }
    }

    return token;
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

    const kategorien: Category[] =
        directusSong.kategorieId?.map((k) => ({
            name: k.kategorie_id.name,
            index: String(k.kategorie_id.id),
        })) || [];

    // Transform strophen - flatten the structure properly
    const strophen = (directusSong.textId?.strophenEinzeln || []).map((s, idx) => ({
        text: s.strophe, // The actual verse text from backend
        strophe: String(idx + 1), // Verse number
        anmerkung: s.anmerkung || null,
        aenderungsvorschlag: s.aenderungsvorschlag || null,
    }));

    // Transform abc_melodie array - flatten the nested structure
    const melodieAbc = directusSong.melodieId?.abc_melodie || [];

    return {
        id: directusSong.id,
        index,
        titel: directusSong.titel,
        strophen,
        textAutoren,
        melodieAbc,
        melodieAutoren,
        noten,
        kategorien,
    };
}

// Fetch songs from Directus
export async function fetchSongs(): Promise<Song[]> {
    try {
        const token = await getCurrentToken();
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
                const newToken = await getCurrentToken();
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
