import { ref } from "vue";
import { useSongsStore } from "@/stores/songs";

/**
 * Composable for working with stored files from Dexie
 */
export function useStoredFiles() {
  const songsStore = useSongsStore();

  /**
   * Get a blob URL for a stored file
   * @param fileId The Directus file ID
   * @returns A blob URL that can be used in img src, or null if not found
   */
  async function getFileUrl(fileId: string): Promise<string | null> {
    const blob = await songsStore.getFileBlob(fileId);
    if (!blob) return null;
    return URL.createObjectURL(blob);
  }

  /**
   * Create a reactive image URL for a file
   * @param fileId The Directus file ID
   */
  function useFileUrl(fileId: string) {
    const url = ref<string | null>(null);
    const isLoading = ref(true);

    getFileUrl(fileId)
      .then((blobUrl) => {
        url.value = blobUrl;
      })
      .catch((err) => {
        console.error("Error loading file:", err);
      })
      .finally(() => {
        isLoading.value = false;
      });

    return { url, isLoading };
  }

  return {
    getFileUrl,
    useFileUrl,
  };
}
