<template>
    <div ref="containerRef" class="abc-renderer">
        <!-- Notation will be rendered here -->
        <div ref="notationRef" class="notation-container"></div>

        <!-- Audio control container for abcjs synth (hidden) -->
        <div id="audio-control"></div>

        <!-- Error State -->
        <div v-if="renderError" class="render-error">
            <ion-icon :icon="alertCircleOutline" />
            <span>{{ renderError }}</span>
        </div>
    </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';

import { IonIcon } from '@ionic/vue';
// Import abcjs dynamically to avoid SSR issues
import type ABCJS from 'abcjs';
import { alertCircleOutline } from 'ionicons/icons';

const props = defineProps<{
    abc: string;
    isPlaying?: boolean;
    tempo?: number;
    loop?: boolean;
    scale?: number; // Scale factor for rendering (0.5 - 2.0)
}>();

const emit = defineEmits<{
    (e: 'playStarted'): void;
    (e: 'playStopped'): void;
}>();

// Expose methods for parent component
defineExpose({
    stop: stopPlayback,
});

const containerRef = ref<HTMLElement | null>(null);
const notationRef = ref<HTMLElement | null>(null);
const renderError = ref<string | null>(null);

// ABCJS instances - using lower-level CreateSynth + TimingCallbacks for proper pause/resume
let abcjs: typeof ABCJS | null = null;
let createSynth: any = null; // ABCJS.synth.CreateSynth instance
let timingCallbacks: any = null; // ABCJS.TimingCallbacks instance
let visualObj: ABCJS.TuneObject[] | null = null;
let isAudioPrimed = false;
let isPaused = false;

// Load and initialize abcjs
async function initAbcjs() {
    try {
        // Dynamic import
        const abcjsModule = await import('abcjs');
        abcjs = abcjsModule.default || abcjsModule;
        renderNotation();
    } catch (error) {
        console.error('Failed to load abcjs:', error);
        renderError.value = 'Notation konnte nicht geladen werden';
    }
}

// Render the ABC notation
function renderNotation() {
    if (!abcjs || !notationRef.value || !props.abc) {
        return;
    }

    try {
        renderError.value = null;

        // Use scale prop (default to 1.0 if not provided)
        const renderScale = props.scale ?? 1.0;

        // Render the notation (cast to any to allow titlefont which is valid but not in types)
        visualObj = abcjs.renderAbc(notationRef.value, props.abc, {
            responsive: 'resize',
            add_classes: true,
            staffwidth: 600,
            scale: renderScale,
            paddingTop: 0,
            paddingLeft: 0,
            paddingRight: 0,
            paddingBottom: 0,
            titlefont: 'Arial 0', // Hide title by setting font size to 0
            infofont: 'Arial 0', // Hide info text
            composerfont: 'Arial 0', // Hide composer
            wrap: {
                minSpacing: 1.5,
                maxSpacing: 2.5,
                preferredMeasuresPerLine: 4,
            },
        } as ABCJS.AbcVisualParams);

        // Adjust the viewBox to remove top padding created by hidden meta elements
        requestAnimationFrame(() => {
            const svg = notationRef.value?.querySelector('svg');
            const container = notationRef.value;
            if (svg && container) {
                const viewBox = svg.getAttribute('viewBox');
                if (viewBox) {
                    const [x, , width, height] = viewBox.split(' ').map(Number);
                    // Find the first staff wrapper to determine actual content start
                    const staffWrapper = svg.querySelector('.abcjs-staff-wrapper');
                    if (staffWrapper) {
                        const staffY = (staffWrapper as SVGGElement).getBBox().y;
                        const topOffset = Math.max(0, staffY - 10); // 10px padding above staff
                        const newHeight = height - topOffset;
                        svg.setAttribute('viewBox', `${x} ${topOffset} ${width} ${newHeight}`);

                        // Update the container's padding-bottom to match new aspect ratio
                        const newAspectRatio = (newHeight / width) * 100;
                        container.style.paddingBottom = `${newAspectRatio}%`;
                    }
                }
            }
        });
    } catch (error) {
        console.error('Failed to render ABC notation:', error);
        renderError.value = 'Fehler beim Rendern der Notation';
    }
}

// Start playback - using CreateSynth + TimingCallbacks for proper pause/resume
async function startPlayback() {
    console.log('[ABC Debug] startPlayback called', {
        hasAbcjs: !!abcjs,
        hasVisualObj: !!visualObj,
        hasNotationRef: !!notationRef.value,
        isAudioPrimed,
        isPaused,
    });

    if (!abcjs || !visualObj || visualObj.length === 0 || !notationRef.value) {
        console.log('[ABC Debug] startPlayback early return - missing dependencies');
        return;
    }

    try {
        // If we're resuming from a paused state
        if (isPaused && createSynth && timingCallbacks) {
            console.log('[ABC Debug] Resuming from paused state');
            await createSynth.resume();
            timingCallbacks.start();
            isPaused = false;
            emit('playStarted');
            return;
        }

        // Create new synth instance
        createSynth = new abcjs.synth.CreateSynth();

        // Calculate milliseconds per measure from tempo
        const qpm = props.tempo || 120;

        // Get the meter from the visualObj to calculate millisecondsPerMeasure
        // Default to 4/4 if not specified (beatLength of 0.25 = quarter note)
        const beatLength = visualObj[0].getBeatLength() || 0.25;
        const beatsPerMeasure = 1 / beatLength; // e.g., 4 for 4/4 time
        const millisecondsPerMeasure = (60000 / qpm) * beatsPerMeasure;

        // Initialize the synth with the visual object
        await createSynth.init({
            visualObj: visualObj[0],
            millisecondsPerMeasure: millisecondsPerMeasure,
        });

        console.log('[ABC Debug] Synth initialized, priming audio buffer');

        // Prime the audio buffer
        const primeResult = await createSynth.prime();
        console.log('[ABC Debug] Prime result:', primeResult);
        isAudioPrimed = true;

        // Create timing callbacks for cursor/highlighting
        timingCallbacks = new abcjs.TimingCallbacks(visualObj[0], {
            qpm: qpm,
            beatCallback: (beatNumber: number, totalBeats: number, totalTime: number) => {
                // Called on each beat
            },
            eventCallback: (event: any): any => {
                if (!event) {
                    // End of tune
                    console.log('[ABC Debug] End of tune reached');
                    stopPlayback();
                    return;
                }

                // Skip tie events across measure lines
                if (event.measureStart && event.left === null) {
                    return;
                }

                // Remove previous highlighting
                const lastSelection = notationRef.value?.querySelectorAll('.abcjs-note_selected');
                lastSelection?.forEach((el: Element) => {
                    el.classList.remove('abcjs-note_selected');
                });

                // Add highlighting to current elements
                if (event.elements) {
                    for (let i = 0; i < event.elements.length; i++) {
                        const note = event.elements[i];
                        for (let j = 0; j < note.length; j++) {
                            if (note[j] && note[j].classList) {
                                note[j].classList.add('abcjs-note_selected');
                            }
                        }
                    }
                }

                // Update cursor position
                const cursor = notationRef.value?.querySelector('.abcjs-cursor');
                if (cursor && event.left != null) {
                    cursor.setAttributeNS(null, 'x1', String(event.left - 2));
                    cursor.setAttributeNS(null, 'x2', String(event.left - 2));
                    cursor.setAttributeNS(null, 'y1', String(event.top));
                    cursor.setAttributeNS(null, 'y2', String(event.top + event.height));
                }
            },
        });

        // Create cursor element
        const svg = notationRef.value?.querySelector('svg');
        if (svg && !svg.querySelector('.abcjs-cursor')) {
            const cursor = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            cursor.setAttribute('class', 'abcjs-cursor');
            cursor.setAttributeNS(null, 'x1', '0');
            cursor.setAttributeNS(null, 'y1', '0');
            cursor.setAttributeNS(null, 'x2', '0');
            cursor.setAttributeNS(null, 'y2', '0');
            svg.appendChild(cursor);
        }

        // Start both audio and timing callbacks together
        console.log('[ABC Debug] Starting audio and timing callbacks');
        await createSynth.start();
        timingCallbacks.start();
        isPaused = false;

        emit('playStarted');
        console.log('[ABC Debug] Playback started successfully');
    } catch (error) {
        console.error('Playback error:', error);
        renderError.value = 'Wiedergabe fehlgeschlagen';
        emit('playStopped');
    }
}

// Pause playback
function pausePlayback() {
    console.log('[ABC Debug] pausePlayback called', {
        hasCreateSynth: !!createSynth,
        hasTimingCallbacks: !!timingCallbacks,
    });

    if (createSynth && timingCallbacks) {
        createSynth.pause();
        timingCallbacks.pause();
        isPaused = true;
        console.log('[ABC Debug] Playback paused');
    }
}

// Resume playback
async function resumePlayback() {
    console.log('[ABC Debug] resumePlayback called', {
        hasCreateSynth: !!createSynth,
        hasTimingCallbacks: !!timingCallbacks,
        isPaused,
    });

    if (!createSynth || !timingCallbacks) {
        console.log('[ABC Debug] No synth/callbacks, starting fresh');
        await startPlayback();
        return;
    }

    try {
        console.log('[ABC Debug] Resuming audio and timing callbacks');
        await createSynth.resume();
        timingCallbacks.start();
        isPaused = false;
        emit('playStarted');
        console.log('[ABC Debug] Playback resumed successfully');
    } catch (error) {
        console.error('[ABC Debug] Resume error:', error);
        // If resume fails, try starting fresh
        isAudioPrimed = false;
        isPaused = false;
        await startPlayback();
    }
}

function removeHighlighting() {
    const highlighted = notationRef.value?.querySelectorAll('.abcjs-note_selected');
    highlighted?.forEach((el: Element) => {
        el.classList.remove('abcjs-note_selected');
    });

    const cursor = notationRef.value?.querySelector('.abcjs-cursor');
    if (cursor) {
        cursor.setAttributeNS(null, 'x1', '0');
        cursor.setAttributeNS(null, 'x2', '0');
        cursor.setAttributeNS(null, 'y1', '0');
        cursor.setAttributeNS(null, 'y2', '0');
    }
}

// Stop playback
function stopPlayback() {
    console.log('[ABC Debug] stopPlayback called');

    if (createSynth) {
        createSynth.stop();
    }

    if (timingCallbacks) {
        timingCallbacks.stop();
    }

    // Remove highlighting and reset cursor
    removeHighlighting();

    // Reset state
    isAudioPrimed = false;
    isPaused = false;
    createSynth = null;
    timingCallbacks = null;

    emit('playStopped');
    console.log('[ABC Debug] stopPlayback completed');
}

// Watch for play state changes
watch(
    () => props.isPlaying,
    (newValue, oldValue) => {
        console.log('[ABC Debug] isPlaying watch triggered', {
            newValue,
            oldValue,
            isAudioPrimed,
            isPaused,
        });
        if (newValue) {
            // If we're resuming from pause, use resumePlayback
            if (isPaused && createSynth && timingCallbacks) {
                console.log('[ABC Debug] isPlaying=true -> calling resumePlayback (paused state)');
                resumePlayback();
            } else {
                console.log('[ABC Debug] isPlaying=true -> calling startPlayback (fresh start)');
                startPlayback();
            }
        } else {
            console.log('[ABC Debug] isPlaying=false -> calling pausePlayback');
            pausePlayback();
        }
    },
);

// Watch for tempo changes during playback
watch(
    () => props.tempo,
    async (newTempo, oldTempo) => {
        console.log('[ABC Debug] Tempo changed', {
            newTempo,
            oldTempo,
            isPlaying: props.isPlaying,
            isPaused,
        });
        // Tempo changes require restarting the synth with new settings
        if ((props.isPlaying || isPaused) && (createSynth || timingCallbacks)) {
            console.log('[ABC Debug] Tempo changed, stopping and restarting with new tempo');
            const wasPlaying = props.isPlaying;

            // Stop the current playback without emitting playStopped event
            // to avoid changing parent's isPlaying state
            if (createSynth) {
                createSynth.stop();
            }
            if (timingCallbacks) {
                timingCallbacks.stop();
            }

            // Remove highlighting and reset cursor
            removeHighlighting();

            // Reset internal state
            isAudioPrimed = false;
            isPaused = false;
            createSynth = null;
            timingCallbacks = null;

            // Restart playback if it was playing
            if (wasPlaying) {
                await startPlayback();
            }
        }
    },
);

// Watch for ABC content changes
watch(
    () => props.abc,
    () => {
        // Reset state when content changes
        if (createSynth || timingCallbacks) {
            stopPlayback();
        }
        renderNotation();
    },
);

// Watch for scale changes
watch(
    () => props.scale,
    () => {
        // Re-render when scale changes
        renderNotation();
    },
);

onMounted(() => {
    initAbcjs();
});

onBeforeUnmount(() => {
    if (createSynth) {
        createSynth.stop();
        createSynth = null;
    }
    if (timingCallbacks) {
        timingCallbacks.stop();
        timingCallbacks = null;
    }
    visualObj = null;
    isAudioPrimed = false;
    isPaused = false;
});
</script>

<style scoped>
.abc-renderer {
    position: relative;
}

.notation-container {
    width: 100%;
    overflow-x: auto;
    overflow-y: hidden;
}

/* Highlight currently playing notes */
.notation-container :deep(.abcjs-cursor) {
    stroke: var(--ion-color-primary);
    stroke-width: 3px;
}

.notation-container :deep(.abcjs-note_selected) {
    fill: var(--ion-color-primary);
}

/* Hide the title in the rendered notation */
.notation-container :deep(.abcjs-title) {
    display: none;
}

/* Hide other header elements that may take space */
.notation-container :deep(.abcjs-subtitle),
.notation-container :deep(.abcjs-composer),
.notation-container :deep(.abcjs-rhythm),
.notation-container :deep(.abcjs-info),
.notation-container :deep(.abcjs-author),
.notation-container :deep(.abcjs-partsfont),
.notation-container :deep(.abcjs-tempo),
.notation-container :deep(.abcjs-meta-top) {
    display: none;
}

/* Style the rendered SVG */
.notation-container :deep(svg) {
    max-width: 100%;
    height: auto;
}

.render-error {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    padding: var(--spacing-md);
    background: var(--ion-color-danger-tint);
    border-radius: var(--radius-md);
    color: var(--ion-color-danger-shade);
    font-size: var(--font-size-sm);
}

.render-error ion-icon {
    flex-shrink: 0;
    font-size: 20px;
}

/* Hidden audio control container for abcjs synth */
#audio-control {
    display: none;
}
</style>
