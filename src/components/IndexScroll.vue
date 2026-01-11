<template>
    <div
        ref="containerRef"
        class="index-scroll"
        @touchstart.prevent="onTouchStart"
        @touchmove.prevent="onTouchMove"
        @touchend="onTouchEnd"
        @mousedown.prevent="onMouseDown"
    >
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
import { computed, ref } from 'vue';

export interface IndexItem {
    key: string;
    label: string;
}

const props = defineProps<{
    items: IndexItem[];
    activeKey?: string;
}>();

const emit = defineEmits<{
    (e: 'select', key: string): void;
}>();

const containerRef = ref<HTMLElement | null>(null);
const isDragging = ref(false);
const currentDragItem = ref<IndexItem | null>(null);
const indicatorTop = ref(0);

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
    if (!containerRef.value || props.items.length === 0) return;

    const container = containerRef.value;
    const rect = container.getBoundingClientRect();
    const relativeY = clientY - rect.top;
    const itemHeight = rect.height / props.items.length;

    // Clamp to valid range
    const clampedY = Math.max(0, Math.min(relativeY, rect.height - 1));
    const index = Math.floor(clampedY / itemHeight);
    const clampedIndex = Math.max(0, Math.min(index, props.items.length - 1));

    const item = props.items[clampedIndex];
    if (item && item.key !== currentDragItem.value?.key) {
        currentDragItem.value = item;
        indicatorTop.value = clampedIndex * itemHeight + itemHeight / 2 - 20;
        emit('select', item.key);
    }
}

function onItemClick(key: string) {
    emit('select', key);
}
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
    background: rgba(var(--ion-background-color-rgb), 0.8);
    border-radius: 12px;
    backdrop-filter: blur(8px);
    user-select: none;
    touch-action: none;
}

.index-item {
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 24px;
    min-height: 18px;
    padding: 2px 4px;
    cursor: pointer;
    transition: all 0.15s ease;
    border-radius: 4px;
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
}

.drag-indicator {
    position: absolute;
    right: 40px;
    background: var(--ion-color-primary);
    color: var(--ion-color-primary-contrast);
    padding: 8px 16px;
    border-radius: 8px;
    font-size: 24px;
    font-weight: bold;
    min-width: 48px;
    text-align: center;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    pointer-events: none;
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
