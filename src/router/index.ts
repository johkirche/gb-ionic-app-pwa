import { createRouter, createWebHistory } from '@ionic/vue-router';
import { RouteRecordRaw } from 'vue-router';

import { useUserStore } from '@/stores/user';

import DownloadPage from '../views/DownloadPage.vue';
import HomePage from '../views/HomePage.vue';
import LoginPage from '../views/LoginPage.vue';
import OnboardingPage from '../views/OnboardingPage.vue';
import PasswordResetPage from '../views/PasswordResetPage.vue';
import RegisterPage from '../views/RegisterPage.vue';
import SongPage from '../views/SongPage.vue';
import SongsListPage from '../views/SongsListPage.vue';

const routes: Array<RouteRecordRaw> = [
    {
        path: '/',
        redirect: '/home',
    },
    {
        path: '/home',
        name: 'Home',
        component: HomePage,
        meta: { requiresAuth: true },
    },
    {
        path: '/login',
        name: 'Login',
        component: LoginPage,
        meta: { requiresAuth: false },
    },
    {
        path: '/register',
        name: 'Register',
        component: RegisterPage,
        meta: { requiresAuth: false },
    },
    {
        path: '/onboarding',
        name: 'Onboarding',
        component: OnboardingPage,
        meta: { requiresAuth: true },
    },
    {
        path: '/password-reset',
        name: 'PasswordReset',
        component: PasswordResetPage,
        meta: { requiresAuth: false },
    },
    {
        path: '/songs',
        name: 'Songs',
        component: SongsListPage,
        meta: { requiresAuth: true },
    },
    {
        path: '/songs/:id',
        name: 'Song',
        component: SongPage,
        meta: { requiresAuth: true },
    },
    {
        path: '/download',
        name: 'Download',
        component: DownloadPage,
        meta: { requiresAuth: true },
    },
];

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes,
});

// Navigation guard for authentication
router.beforeEach(async (to, from, next) => {
    const userStore = useUserStore();

    // Wait for user data to be loaded from IndexedDB
    await userStore.initPromise;

    const requiresAuth = to.meta.requiresAuth;

    // If skip auth is enabled, allow all navigation
    if (userStore.skipAuth) {
        next();
        return;
    }

    // If route requires authentication and user is not logged in
    if (requiresAuth && !userStore.isLoggedIn) {
        // Redirect to login page
        next({ name: 'Login' });
        return;
    }

    // If user is logged in and trying to access login/register, redirect to home
    if (userStore.isLoggedIn && (to.name === 'Login' || to.name === 'Register')) {
        next({ name: 'Home' });
        return;
    }

    // If onboarding is in progress, keep the user on onboarding instead of landing on Home
    // (e.g. when the PWA is installed and launched fresh)
    try {
        const onboardingInProgress = localStorage.getItem('onboarding.inProgress') === '1';
        if (onboardingInProgress && userStore.isLoggedIn && to.name === 'Home') {
            next({ name: 'Onboarding' });
            return;
        }
    } catch {
        // ignore storage errors
    }

    // Allow navigation
    next();
});

export default router;
