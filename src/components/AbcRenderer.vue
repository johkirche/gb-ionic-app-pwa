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

// ABCJS instances
let abcjs: typeof ABCJS | null = null;
let synthControl: ABCJS.SynthObjectController | null = null;
let visualObj: ABCJS.TuneObject[] | null = null;
let isAudioLoaded = false;

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

        // Render the notation (cast to any to allow titlefont which is valid but not in types)
        visualObj = abcjs.renderAbc(notationRef.value, props.abc, {
            responsive: 'resize',
            add_classes: true,
            staffwidth: 600,
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

// Start playback
async function startPlayback() {
    console.log('Starting playback');
    if (!abcjs || !visualObj || visualObj.length === 0 || !notationRef.value) {
        return;
    }

    try {
        // Initialize audio context on user interaction
        if (!synthControl) {
            // Create synth control with cursor control
            synthControl = new abcjs.synth.SynthController();

            // Check if audio is supported
            if (abcjs.synth.supportsAudio()) {
                // Create cursor control object for note highlighting
                const cursorControl = {
                    onStart: () => {
                        // Create SVG cursor line element
                        const svg = notationRef.value?.querySelector('svg');
                        if (svg) {
                            const cursor = document.createElementNS(
                                'http://www.w3.org/2000/svg',
                                'line',
                            );
                            cursor.setAttribute('class', 'abcjs-cursor');
                            cursor.setAttributeNS(null, 'x1', '0');
                            cursor.setAttributeNS(null, 'y1', '0');
                            cursor.setAttributeNS(null, 'x2', '0');
                            cursor.setAttributeNS(null, 'y2', '0');
                            svg.appendChild(cursor);
                        }
                        emit('playStarted');
                    },
                    onFinished: () => {
                        // Remove highlighting and reset cursor
                        const highlighted =
                            notationRef.value?.querySelectorAll('.abcjs-note_selected');
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
                        emit('playStopped');
                    },
                    onBeat: (beatNumber: number, totalBeats: number, totalTime: number) => {
                        // Called on each beat - can be used for metronome
                    },
                    onEvent: (event: any) => {
                        // Skip tie events across measure lines
                        if (event.measureStart && event.left === null) {
                            return;
                        }

                        // Remove previous highlighting
                        const lastSelection =
                            notationRef.value?.querySelectorAll('.abcjs-note_selected');
                        lastSelection?.forEach((el: Element) => {
                            el.classList.remove('abcjs-note_selected');
                        });

                        // Add highlighting to current elements
                        // event.elements is an array of notes, each note is an array of SVG elements
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
                };

                await synthControl.load('#audio-control', cursorControl, {
                    displayLoop: false,
                    displayRestart: false,
                    displayPlay: false,
                    displayProgress: true,
                    displayWarp: false,
                });
            }
        }

        // Set up the tune with tempo
        await synthControl.setTune(visualObj[0], false, {
            qpm: props.tempo || 120,
        });

        isAudioLoaded = true;

        // Start playback
        await synthControl.play();
    } catch (error) {
        console.error('Playback error:', error);
        renderError.value = 'Wiedergabe fehlgeschlagen';
        emit('playStopped');
    }
}

// Pause playback
function pausePlayback() {
    console.log('Pausing playback');
    if (synthControl) {
        synthControl.pause();
    }
    emit('playStopped');
}

// Resume playback
async function resumePlayback() {
    console.log('Resuming playback');
    if (synthControl) {
        try {
            await synthControl.play();
            emit('playStarted');
        } catch (error) {
            console.error('Resume error:', error);
            emit('playStopped');
        }
    }
}

// Stop playback
function stopPlayback() {
    console.log('Stopping playback');
    if (synthControl) {
        synthControl.pause();

        // Seek back to the beginning
        try {
            // Check if seek method exists (abcjs API may vary by version)
            if ('seek' in synthControl && typeof synthControl.seek === 'function') {
                synthControl.seek(0);
            } else {
                // Alternative: restart playback
                synthControl.pause();
            }
        } catch (error) {
            console.error('Error seeking to start:', error);
        }

        // Remove highlighting and reset cursor
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

    // Reset audio loaded state so it can start fresh
    isAudioLoaded = false;
    emit('playStopped');
}

// Watch for play state changes
watch(
    () => props.isPlaying,
    (newValue) => {
        if (newValue) {
            // If audio is already loaded, just resume, otherwise start fresh
            if (isAudioLoaded && synthControl) {
                resumePlayback();
            } else {
                startPlayback();
            }
        } else {
            pausePlayback();
        }
    },
);

// Watch for tempo changes during playback
watch(
    () => props.tempo,
    async (newTempo) => {
        if (synthControl && visualObj && isAudioLoaded) {
            // If playing, we need to reload with new tempo
            if (props.isPlaying) {
                try {
                    // Pause first
                    synthControl.pause();

                    // Reload the tune with new tempo
                    await synthControl.setTune(visualObj[0], false, {
                        qpm: newTempo || 120,
                    });

                    // Resume playback
                    await synthControl.play();
                } catch (error) {
                    console.error('Error changing tempo:', error);
                }
            } else {
                // Not playing, just update the tune settings for next play
                await synthControl.setTune(visualObj[0], false, {
                    qpm: newTempo || 120,
                });
            }
        }
    },
);

// Watch for ABC content changes
watch(
    () => props.abc,
    () => {
        // Reset audio loaded state when content changes
        isAudioLoaded = false;
        if (synthControl) {
            stopPlayback();
        }
        renderNotation();
    },
);

onMounted(() => {
    initAbcjs();
});

onBeforeUnmount(() => {
    if (synthControl) {
        synthControl.pause();
        synthControl = null;
    }
    visualObj = null;
    isAudioLoaded = false;
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
