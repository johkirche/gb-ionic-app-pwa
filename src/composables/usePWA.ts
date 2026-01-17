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

        // Check if already installed
        isInstalledRef.value =
            window.matchMedia('(display-mode: standalone)').matches ||
            (window.navigator as any).standalone === true;

        // Capture the beforeinstallprompt event
        window.addEventListener('beforeinstallprompt', (e: Event) => {
            e.preventDefault();
            deferredPrompt = e;
            canInstallRef.value = true;
        });

        // Handle successful installation
        window.addEventListener('appinstalled', () => {
            deferredPrompt = null;
            canInstallRef.value = false;
            isInstalledRef.value = true;
        });
    }

    // Trigger the install prompt
    async function installPWA(): Promise<boolean> {
        if (!deferredPrompt) return false;

        try {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;

            if (outcome === 'accepted') {
                deferredPrompt = null;
                canInstallRef.value = false;
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error during PWA installation:', error);
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
