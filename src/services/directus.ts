import { authentication, createDirectus, graphql, rest } from "@directus/sdk";
import { directusConfig } from "@/config/directus";
import type { Song, Autor, NotenFile } from "@/db";

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

// Initialize Directus client
const client = createDirectus(directusConfig.url)
  .with(graphql())
  .with(authentication());

// GraphQL query
const SONGS_QUERY = `
    { gesangbuchlied( filter: { bewertungKleinerKreis: { bezeichner: { _eq: "Rein" } } } limit: 5000 ) { id titel textId { strophenEinzeln autorId { autor_id { vorname nachname sterbejahr } } } melodieId { abc_melodie autorId { autor_id { vorname nachname sterbejahr } } noten { directus_files_id { filename_download id } } } kategorieId { kategorie_id { name } } } }
`;

// Transform nested Directus response to flat Song structure
function transformSong(directusSong: DirectusGesangbuchlied): Song {
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

  const kategorien: string[] =
    directusSong.kategorieId?.map((k) => k.kategorie_id.name) || [];

  return {
    id: directusSong.id,
    titel: directusSong.titel,
    strophen: directusSong.textId?.strophenEinzeln || [],
    textAutoren,
    melodieAbc: directusSong.melodieId?.abc_melodie || "",
    melodieAutoren,
    noten,
    kategorien,
  };
}

// Fetch a file (PNG) from Directus
export async function fetchFile(fileId: string): Promise<Blob> {
  try {
    const url = `${directusConfig.url}/assets/${fileId}`;
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${directusConfig.token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch file: ${response.statusText}`);
    }

    return await response.blob();
  } catch (error) {
    console.error("Error fetching file from Directus:", error);
    throw error;
  }
}

// Fetch songs from Directus
export async function fetchSongs(): Promise<Song[]> {
  try {
    await client.setToken(directusConfig.token);
    const response = await client.query<DirectusResponse>(SONGS_QUERY);

    return response.gesangbuchlied.map(transformSong);
  } catch (error) {
    console.error("Error fetching songs from Directus:", error);
    throw new Error("Failed to fetch songs from server");
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
        filename.endsWith(".png") ||
        filename.endsWith(".jpg") ||
        filename.endsWith(".svg")
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
