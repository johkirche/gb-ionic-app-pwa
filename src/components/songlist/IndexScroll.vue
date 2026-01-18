<template>
    <div
        ref="containerRef"
        class="index-scroll"
        :class="{ 'is-scrollable': isScrollable }"
        @touchstart.prevent="onTouchStart"
        @touchmove.prevent="onTouchMove"
        @touchend="onTouchEnd"
        @mousedown.prevent="onMouseDown"
    >
        <div ref="itemsContainerRef" class="index-items">
            <div
                v-for="item in items"
                :key="item.key"
                class="index-item"
                :class="{ active: item.key === activeKey }"
                :data-key="item.key"
                @click="onItemClick(item.key)"
            >
                <span class="index-label">{{ item.label }}</span>
            </div>
        </div>

        <!-- Floating indicator shown during drag -->
        <Transition name="indicator-fade">
            <div
                v-if="isDragging && currentDragItem"
                class="drag-indicator"
                :style="{ top: indicatorTop + 'px' }"
            >
                {{ currentDragItem.label }}
            </div>
        </Transition>
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';

export interface IndexItem {
    key: string;
    label: string;
}

const props = defineProps<{
    items: IndexItem[];
    activeKey?: string;
    headerOffset?: number; // Offset from top (for header)
}>();

const emit = defineEmits<{
    (e: 'select', key: string): void;
}>();

const containerRef = ref<HTMLElement | null>(null);
const itemsContainerRef = ref<HTMLElement | null>(null);
const isDragging = ref(false);
const currentDragItem = ref<IndexItem | null>(null);
const indicatorTop = ref(0);
const maxHeight = ref(0);

// Check if the index scroll needs to be scrollable
const isScrollable = computed(() => {
    if (!itemsContainerRef.value) return false;
    return itemsContainerRef.value.scrollHeight > maxHeight.value;
});

// Calculate max available height
function updateMaxHeight() {
    const headerOffset = props.headerOffset ?? 120; // Default header + FAB offset
    const bottomOffset = 80; // FAB button area
    maxHeight.value = window.innerHeight - headerOffset - bottomOffset;
}

onMounted(() => {
    updateMaxHeight();
    window.addEventListener('resize', updateMaxHeight);
});

onUnmounted(() => {
    window.removeEventListener('resize', updateMaxHeight);
});

// Mouse event handlers for desktop
function onMouseDown(event: MouseEvent) {
    isDragging.value = true;
    updateFromPosition(event.clientY);

    const onMouseMove = (e: MouseEvent) => {
        if (isDragging.value) {
            updateFromPosition(e.clientY);
        }
    };

    const onMouseUp = () => {
        isDragging.value = false;
        currentDragItem.value = null;
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
}

// Touch event handlers for mobile
function onTouchStart(event: TouchEvent) {
    isDragging.value = true;
    const touch = event.touches[0];
    updateFromPosition(touch.clientY);
}

function onTouchMove(event: TouchEvent) {
    if (!isDragging.value) return;
    const touch = event.touches[0];
    updateFromPosition(touch.clientY);
}

function onTouchEnd() {
    isDragging.value = false;
    currentDragItem.value = null;
}

// Calculate which item is at the given Y position
function updateFromPosition(clientY: number) {
    if (!itemsContainerRef.value || props.items.length === 0) return;

    const container = itemsContainerRef.value;
    const itemElements = container.querySelectorAll('.index-item');
    if (itemElements.length === 0) return;

    // Find which item the cursor/touch is over using viewport coordinates directly
    let targetIndex = -1;

    for (let i = 0; i < itemElements.length; i++) {
        const itemRect = itemElements[i].getBoundingClientRect();

        if (clientY >= itemRect.top && clientY < itemRect.bottom) {
            targetIndex = i;
            break;
        }
    }

    // Handle edge cases: above first item or below last item
    if (targetIndex === -1) {
        const firstRect = itemElements[0].getBoundingClientRect();
        const lastRect = itemElements[itemElements.length - 1].getBoundingClientRect();

        if (clientY < firstRect.top) {
            targetIndex = 0;
        } else if (clientY >= lastRect.bottom) {
            targetIndex = props.items.length - 1;
        } else {
            // Cursor is in a gap or the container itself - find closest
            let closestDist = Infinity;
            for (let i = 0; i < itemElements.length; i++) {
                const itemRect = itemElements[i].getBoundingClientRect();
                const itemCenter = itemRect.top + itemRect.height / 2;
                const dist = Math.abs(clientY - itemCenter);
                if (dist < closestDist) {
                    closestDist = dist;
                    targetIndex = i;
                }
            }
        }
    }

    if (targetIndex === -1) targetIndex = 0;

    const item = props.items[targetIndex];

    if (item) {
        // Calculate indicator position
        const itemElement = itemElements[targetIndex] as HTMLElement;
        const itemRect = itemElement.getBoundingClientRect();
        const outerContainerRect = containerRef.value?.getBoundingClientRect();
        if (outerContainerRect) {
            indicatorTop.value = itemRect.top - outerContainerRect.top + itemRect.height / 2 - 20;
        }

        if (item.key !== currentDragItem.value?.key) {
            currentDragItem.value = item;
            emit('select', item.key);
        }
    }
}

function onItemClick(key: string) {
    emit('select', key);
}

// Auto-scroll the index container when active item changes
watch(
    () => props.activeKey,
    (newKey) => {
        if (!newKey || !itemsContainerRef.value || isDragging.value) return;

        const activeElement = itemsContainerRef.value.querySelector(
            `[data-key="${newKey}"]`,
        ) as HTMLElement;
        if (activeElement) {
            activeElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        }
    },
);
</script>

<style scoped>
.index-scroll {
    position: fixed;
    right: 4px;
    top: 50%;
    transform: translateY(-50%);
    display: flex;
    flex-direction: column;
    align-items: center;
    z-index: 1000;
    padding: 8px 4px;
    background: rgba(var(--ion-background-color-rgb), 0.9);
    border-radius: 12px;
    backdrop-filter: blur(8px);
    user-select: none;
    touch-action: none;
    max-height: calc(100vh - 200px);
    max-height: calc(100dvh - 200px);
}

.index-items {
    display: flex;
    flex-direction: column;
    align-items: center;
    overflow-y: auto;
    overflow-x: hidden;
    scrollbar-width: none; /* Firefox */
    -ms-overflow-style: none; /* IE/Edge */
}

.index-items::-webkit-scrollbar {
    display: none; /* Chrome/Safari */
}

.is-scrollable .index-items {
    /* Visual indicator that it's scrollable */
    mask-image: linear-gradient(
        to bottom,
        transparent 0,
        black 8px,
        black calc(100% - 8px),
        transparent 100%
    );
    -webkit-mask-image: linear-gradient(
        to bottom,
        transparent 0,
        black 8px,
        black calc(100% - 8px),
        transparent 100%
    );
}

.index-item {
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 24px;
    min-height: 20px;
    padding: 3px 6px;
    cursor: pointer;
    transition: all 0.15s ease;
    border-radius: 4px;
    flex-shrink: 0;
}

.index-item:hover {
    background: rgba(var(--ion-color-primary-rgb), 0.1);
}

.index-item.active {
    background: var(--ion-color-primary);
    color: var(--ion-color-primary-contrast);
}

.index-label {
    font-size: 11px;
    font-weight: 600;
    line-height: 1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 32px;
}

.drag-indicator {
    position: absolute;
    right: 48px;
    background: var(--ion-color-primary);
    color: var(--ion-color-primary-contrast);
    padding: 12px 16px;
    border-radius: 8px;
    font-size: 18px;
    font-weight: bold;
    min-width: 60px;
    max-width: 200px;
    text-align: center;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    pointer-events: none;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.indicator-fade-enter-active,
.indicator-fade-leave-active {
    transition: opacity 0.15s ease;
}

.indicator-fade-enter-from,
.indicator-fade-leave-to {
    opacity: 0;
}
</style>
