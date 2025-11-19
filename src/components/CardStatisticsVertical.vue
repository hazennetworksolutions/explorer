<script setup lang="ts">
import { Icon } from '@iconify/vue';
import { controlledComputed } from '@vueuse/core'

interface Props {
  title: string;
  color?: string;
  icon: string;
  stats: string;
  change?: number;
  subtitle?: string;
}

const props = withDefaults(defineProps<Props>(), {
  color: 'primary',
});

const isPositive = controlledComputed(
  () => props.change,
  () => Math.sign(props.change || 0) === 1
);
</script>

<template>
  <div class="bg-base-100 shadow-md rounded-lg p-5 border border-gray-100 dark:border-gray-700 hover:shadow-lg transition-all duration-200">
    <div class="flex items-center justify-center">
      <div
        v-if="props.icon"
        class="relative w-10 h-10 rounded-lg overflow-hidden flex items-center justify-center"
      >
        <Icon :class="[`text-${props?.color}`]" :icon="props.icon" size="32" />
        <div
          class="absolute top-0 left-0 bottom-0 right-0 opacity-20 rounded-lg"
          :class="[`bg-${props?.color}`]"
        ></div>
      </div>

      <div
        v-if="props.change"
        :class="isPositive ? 'text-success' : 'text-error'"
        class="flex items-center text-sm font-semibold"
      >
        <span>{{ isPositive ? `+${props.change}` : props.change }}%</span>
        <Icon :icon="isPositive ? 'mdi-chevron-up' : 'mdi-chevron-down'" />
      </div>
    </div>

    <div class="">
      <h6 class="text-xl text-center font-bold mt-3 mb-2 text-main leading-tight">
        {{ props.stats || '-'}}
      </h6>
      <p class="text-sm text-center text-gray-600 dark:text-gray-400">
        {{ props.title }}
      </p>

      <div v-if="props.subtitle" class="font-semibold text-center mt-1">
        <span class="truncate text-xs text-gray-500">{{ props.subtitle }}</span>
      </div>
    </div>
  </div>
</template>
