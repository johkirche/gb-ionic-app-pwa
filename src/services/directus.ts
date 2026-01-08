import { authentication, createDirectus, graphql, rest } from '@directus/sdk';

import { directusConfig } from '@/config/directus';

/**
 * Directus Service
 *
 * Simple service that initializes and exports the Directus client.
 * All domain-specific logic (songs, files, auth) should be in separate modules.
 */

// Initialize Directus client
const client = createDirectus(directusConfig.url)
    .with(graphql())
    .with(rest())
    .with(authentication('json'));

// Export client for use in API modules and composables
export const directusClient = client;

// Export config for URL access
export { directusConfig };
