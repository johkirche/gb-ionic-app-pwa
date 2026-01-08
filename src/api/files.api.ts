import { useUserStore } from '@/stores/user';

import { refreshAuthToken } from '@/composables/useAuth';

import { directusConfig } from '@/services/directus';

/**
 * Files API
 *
 * Handles file fetching from Directus assets endpoint with authentication.
 */

// Get current token from user store
function getCurrentToken(): string | null {
    const userStore = useUserStore();
    return userStore.authData?.accessToken || null;
}

// Fetch a file (PNG/JPG/SVG) from Directus
export async function fetchFile(fileId: string): Promise<Blob> {
    try {
        const token = getCurrentToken();
        const url = `${directusConfig.url}/assets/${fileId}`;
        const response = await fetch(url, {
            headers: {
                Authorization: token ? `Bearer ${token}` : '',
            },
        });

        if (!response.ok) {
            // If unauthorized, try to refresh token
            if (response.status === 401) {
                const refreshed = await refreshAuthToken();
                if (refreshed) {
                    // Retry with new token
                    const newToken = getCurrentToken();
                    const retryResponse = await fetch(url, {
                        headers: {
                            Authorization: newToken ? `Bearer ${newToken}` : '',
                        },
                    });
                    if (retryResponse.ok) {
                        return await retryResponse.blob();
                    }
                }
            }
            throw new Error(`Failed to fetch file: ${response.statusText}`);
        }

        return await response.blob();
    } catch (error) {
        console.error('Error fetching file from Directus:', error);
        throw error;
    }
}
