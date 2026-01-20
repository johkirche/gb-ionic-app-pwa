import { computed, ref } from 'vue';

// Store the deferred prompt globally so it persists across component instances
let deferredPrompt: any = null;
const canInstallRef = ref(false);
const isInstalledRef = ref(false);
let isListening = false;

export function usePWA() {
    // Platform detection
    const isIOS = computed(() => {
        const userAgent = navigator.userAgent.toLowerCase();
        return /iphone|ipad|ipod/.test(userAgent);
    });

    const isAndroid = computed(() => {
        const userAgent = navigator.userAgent.toLowerCase();
        return /android/.test(userAgent);
    });

    const isStandalone = computed(() => {
        return (
            window.matchMedia('(display-mode: standalone)').matches ||
            (window.navigator as any).standalone === true ||
            document.referrer.includes('android-app://')
        );
    });

    const canInstall = computed(() => canInstallRef.value && !isStandalone.value);

    // Check if install button should be shown (Android/Desktop with prompt, or iOS with instructions)
    const showInstallButton = computed(() => {
        return canInstallRef.value && !isStandalone.value;
    });

    // Initialize listeners (call once in main.ts or App.vue)
    function initPWAListeners() {
        if (isListening) return;
        isListening = true;

        console.log('PWA: Initializing listeners');
        console.log('PWA: User Agent', navigator.userAgent);

        const isStandaloneMatch = window.matchMedia('(display-mode: standalone)').matches;
        const isNavigatorStandalone = (window.navigator as any).standalone === true;
        const isReferrerAndroidAction = document.referrer.includes('android-app://');

        console.log('PWA: Standalone check:', {
            matchMedia: isStandaloneMatch,
            navigatorStandalone: isNavigatorStandalone,
            referrer: isReferrerAndroidAction,
        });

        // Check if already installed
        isInstalledRef.value = isStandaloneMatch || isNavigatorStandalone;
        console.log('PWA: isInstalledRef initialized to:', isInstalledRef.value);

        // Capture the beforeinstallprompt event
        window.addEventListener('beforeinstallprompt', (e: Event) => {
            console.log('PWA: beforeinstallprompt fired');
            e.preventDefault();
            deferredPrompt = e;
            canInstallRef.value = true;
            console.log('PWA: canInstallRef set to true');
        });

        // Handle successful installation
        window.addEventListener('appinstalled', () => {
            console.log('PWA: appinstalled fired');
            deferredPrompt = null;
            canInstallRef.value = false;
            isInstalledRef.value = true;
        });
    }

    // Trigger the install prompt
    async function installPWA(): Promise<boolean> {
        console.log('PWA: installPWA called. deferredPrompt exists:', !!deferredPrompt);
        if (!deferredPrompt) return false;

        try {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            console.log('PWA: User choice outcome:', outcome);

            if (outcome === 'accepted') {
                deferredPrompt = null;
                canInstallRef.value = false;
                return true;
            }
            return false;
        } catch (error) {
            console.error('PWA: Error during PWA installation:', error);
            return false;
        }
    }

    return {
        isIOS,
        isAndroid,
        isStandalone,
        canInstall,
        showInstallButton,
        isInstalled: isInstalledRef,
        initPWAListeners,
        installPWA,
    };
}
