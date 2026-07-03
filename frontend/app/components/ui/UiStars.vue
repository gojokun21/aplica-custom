<script setup lang="ts">
const model = defineModel<number>({ default: 0 });
const props = withDefaults(
  defineProps<{
    readonly?: boolean;
    size?: 'sm' | 'md' | 'lg';
  }>(),
  { readonly: false, size: 'md' },
);

const sizeClass = { sm: 'size-3.5', md: 'size-5', lg: 'size-7' }[props.size];

const hover = ref(0);
function displayValue() {
  return hover.value || model.value;
}
function set(n: number) {
  if (!props.readonly) model.value = n;
}
</script>

<template>
  <div class="inline-flex items-center gap-0.5" :class="readonly ? '' : 'cursor-pointer'">
    <component
      :is="readonly ? 'span' : 'button'"
      v-for="i in 5"
      :key="i"
      :type="readonly ? undefined : 'button'"
      class="leading-none"
      @click="set(i)"
      @mouseenter="!readonly && (hover = i)"
      @mouseleave="!readonly && (hover = 0)"
    >
      <Icon
        name="lucide:star"
        :class="[
          sizeClass,
          i <= Math.round(displayValue()) ? 'fill-amber-400 text-amber-400' : 'text-slate-300',
        ]"
      />
    </component>
  </div>
</template>
