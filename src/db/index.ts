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

export interface Song {
    id: string;
    index: number;
    titel: string;
    strophen: string[];
    textAutoren: Autor[];
    melodieAbc: string;
    melodieAutoren: Autor[];
    noten: NotenFile[];
    kategorien: string[];
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

// Dexie database class
export class GesangbuchDatabase extends Dexie {
    songs!: Table<Song, string>;
    files!: Table<{ id: string; blob: Blob; filename: string }, string>;
    auth!: Table<AuthData, string>;
    users!: Table<UserData, string>;

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
    }
}

// Export singleton instance
export const db = new GesangbuchDatabase();
