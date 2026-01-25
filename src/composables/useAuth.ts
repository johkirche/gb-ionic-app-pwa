import { computed } from 'vue';

import { readMe, refresh } from '@directus/sdk';

import { useUserStore } from '@/stores/user';

import type { UserData } from '@/db';
import { directusClient } from '@/services/directus';
import { handleApiError, isInvalidCredentialsError } from '@/services/errorHandler';

/**
 * Refresh auth token - exported separately for use in API modules
 */
export async function refreshAuthToken(): Promise<boolean> {
    try {
        const userStore = useUserStore();
        const refreshToken = userStore.authData?.refreshToken;

        if (!refreshToken) {
            return false;
        }

        const result = await directusClient.request(
            refresh({
                refresh_token: refreshToken,
                mode: 'json',
            }),
        );

        if (result.access_token && result.refresh_token) {
            const expiresAt = Date.now() + (result.expires || 900000);
            await userStore.updateTokens(result.access_token, result.refresh_token, expiresAt);
            return true;
        }

        return false;
    } catch (error) {
        console.error('Error refreshing token:', error);

        // Check for invalid credentials error (user account deleted)
        if (isInvalidCredentialsError(error)) {
            await handleApiError(error);
            return false;
        }

        return false;
    }
}

export function useAuth() {
    const userStore = useUserStore();

    // Computed properties from store
    const isLoggedIn = computed(() => userStore.isLoggedIn);
    const isActivated = computed(() => userStore.isActivated);
    const skipAuth = computed(() => userStore.skipAuth);
    const user = computed(() => userStore.user);
    const isLoading = computed(() => userStore.isLoading);
    const error = computed(() => userStore.error);

    // Login function
    async function login(email: string, password: string) {
        try {
            userStore.isLoading = true;
            userStore.error = null;

            // Login with Directus SDK
            const result = await directusClient.login({ email, password });

            if (!result.access_token || !result.refresh_token) {
                throw new Error('Invalid response from server');
            }

            // Calculate token expiration (default 15 minutes)
            const expiresAt = Date.now() + (result.expires || 900000);

            // Fetch user data
            const userData = await directusClient.request(
                readMe({
                    fields: ['id', 'email', 'first_name', 'last_name', 'role'],
                }),
            );

            // Map user data to our format
            const user: UserData = {
                id: userData.id,
                email: userData.email,
                firstName: userData.first_name,
                lastName: userData.last_name,
                role:
                    typeof userData.role === 'string'
                        ? userData.role
                        : userData.role?.name || 'user',
                activated: userData.role === 'activated' || userData.role?.name === 'activated',
                skipAuth: false,
            };

            // Save to store and IndexedDB
            await userStore.setUser(user, {
                accessToken: result.access_token,
                refreshToken: result.refresh_token,
                expiresAt,
            });

            return { success: true, user };
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Login failed';
            userStore.error = errorMessage;
            console.error('Login error:', err);
            return { success: false, error: errorMessage };
        } finally {
            userStore.isLoading = false;
        }
    }

    // Register function - includes activation code validation
    async function register(
        email: string,
        password: string,
        activationCode: string,
        firstName?: string,
        lastName?: string,
    ) {
        try {
            userStore.isLoading = true;
            userStore.error = null;

            // Register with custom Directus extension that validates code and creates activated user
            // This endpoint will return 200 if code is valid and user is created with activated role
            const response = await directusClient.request({
                path: '/custom/register',
                body: JSON.stringify({
                    email,
                    password,
                    code: activationCode,
                    first_name: firstName,
                    last_name: lastName,
                }),
            } as any);

            // After successful registration with valid code, automatically log in
            return await login(email, password);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Registration failed';
            userStore.error = errorMessage;
            console.error('Registration error:', err);
            return { success: false, error: errorMessage };
        } finally {
            userStore.isLoading = false;
        }
    }

    // Note: Activation is now handled during registration via the /custom/register endpoint
    // No separate activation step is needed

    // Request password reset
    async function requestPasswordReset(email: string) {
        try {
            userStore.isLoading = true;
            userStore.error = null;

            await directusClient.request({
                path: '/auth/password/request',
                body: JSON.stringify({
                    email,
                    reset_url: `${window.location.origin}/password-reset`,
                }),
            } as any);

            return { success: true };
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to send reset email';
            userStore.error = errorMessage;
            console.error('Password reset request error:', err);
            return { success: false, error: errorMessage };
        } finally {
            userStore.isLoading = false;
        }
    }

    // Reset password with token
    async function resetPassword(token: string, password: string) {
        try {
            userStore.isLoading = true;
            userStore.error = null;

            await directusClient.request({
                path: '/auth/password/reset',
                body: JSON.stringify({
                    token,
                    password,
                }),
            } as any);

            return { success: true };
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Password reset failed';
            userStore.error = errorMessage;
            console.error('Password reset error:', err);
            return { success: false, error: errorMessage };
        } finally {
            userStore.isLoading = false;
        }
    }

    // Logout function
    async function logout() {
        try {
            userStore.isLoading = true;

            // Logout from Directus
            try {
                await directusClient.logout();
            } catch (err) {
                console.warn('Directus logout failed, continuing with local logout:', err);
            }

            // Clear local data
            await userStore.logout();

            return { success: true };
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Logout failed';
            userStore.error = errorMessage;
            console.error('Logout error:', err);
            return { success: false, error: errorMessage };
        } finally {
            userStore.isLoading = false;
        }
    }

    // Refresh token if needed
    async function ensureValidToken() {
        if (userStore.isTokenExpired && userStore.authData?.refreshToken) {
            return await refreshAuthToken();
        }
        return true;
    }

    // Skip auth for dev purposes
    async function setSkipAuth(skip: boolean) {
        await userStore.setSkipAuth(skip);
    }

    return {
        // State
        isLoggedIn,
        isActivated,
        skipAuth,
        user,
        isLoading,
        error,

        // Methods
        login,
        register,
        logout,
        requestPasswordReset,
        resetPassword,
        ensureValidToken,
        setSkipAuth,
    };
}
