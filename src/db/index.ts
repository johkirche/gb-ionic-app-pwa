import Dexie, { Table } from 'dexie';

// Type definitions based on GraphQL schema
export interface Autor {
    vorname: string;
    nachname: string;
    sterbejahr?: number;
}

export interface NotenFile {
    filename_download: string;
    id: string;
    blob?: Blob; // Store the actual file data
}

export interface Category {
    index: string;
    name: string;
}

export interface Strophe {
    text?:
        | {
              text: string;
              strophe: string;
              aenderungsvorschlag?: string | null;
              anmerkung?: string | null;
          }
        | string;
    strophe: string;
    aenderungsvorschlag?: string | null;
    anmerkung?: string | null;
}

export interface AbcNotation {
    name: string;
    abc_notation: string;
    is_default: boolean;
    file_id: string;
}

export interface MelodieAbc {
    name: string;
    abc_notation: AbcNotation[] | string;
    is_default: boolean;
    file_id: string;
}

export interface Song {
    id: string;
    index: number;
    titel: string;
    strophen: Strophe[];
    textAutoren: Autor[];
    melodieAbc: MelodieAbc[];
    melodieAutoren: Autor[];
    noten: NotenFile[];
    kategorien: Category[];
}

// Auth related types
export interface AuthData {
    id: string;
    accessToken: string;
    refreshToken: string;
    expiresAt: number;
}

export interface UserData {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    role: string;
    activated: boolean;
    skipAuth: boolean; // Dev flag to skip auth checks
}

// Playlist types
export interface Playlist {
    id: string;
    name: string;
    emoji: string;
    songIds: string[];
    createdAt: Date;
    updatedAt: Date;
}

// Preferences types
export interface PreferencesData {
    id: string;
    notationScale: number;
    textSize: 'small' | 'medium' | 'large' | 'xlarge';
    melodyDisplayMode: 'abc' | 'image';
}

// Dexie database class
export class GesangbuchDatabase extends Dexie {
    songs!: Table<Song, string>;
    files!: Table<{ id: string; blob: Blob; filename: string }, string>;
    auth!: Table<AuthData, string>;
    users!: Table<UserData, string>;
    playlists!: Table<Playlist, string>;
    preferences!: Table<PreferencesData, string>;

    constructor() {
        super('GesangbuchDB');

        this.version(1).stores({
            songs: 'id, titel',
            files: 'id, filename',
        });

        // Version 2: Add auth and users tables
        this.version(2).stores({
            songs: 'id, titel',
            files: 'id, filename',
            auth: 'id',
            users: 'id, email, role',
        });

        // Version 3: Add playlists table
        this.version(3).stores({
            songs: 'id, titel',
            files: 'id, filename',
            auth: 'id',
            users: 'id, email, role',
            playlists: 'id, name, createdAt',
        });

        // Version 4: Add preferences table
        this.version(4).stores({
            songs: 'id, titel',
            files: 'id, filename',
            auth: 'id',
            users: 'id, email, role',
            playlists: 'id, name, createdAt',
            preferences: 'id',
        });
    }
}

// Export singleton instance
export const db = new GesangbuchDatabase();
