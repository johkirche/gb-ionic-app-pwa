import Dexie, { Table } from "dexie";

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
  titel: string;
  strophen: string[];
  textAutoren: Autor[];
  melodieAbc: string;
  melodieAutoren: Autor[];
  noten: NotenFile[];
  kategorien: string[];
}

// Dexie database class
export class GesangbuchDatabase extends Dexie {
  songs!: Table<Song, string>;
  files!: Table<{ id: string; blob: Blob; filename: string }, string>;

  constructor() {
    super("GesangbuchDB");

    this.version(1).stores({
      songs: "id, titel",
      files: "id, filename",
    });
  }
}

// Export singleton instance
export const db = new GesangbuchDatabase();
