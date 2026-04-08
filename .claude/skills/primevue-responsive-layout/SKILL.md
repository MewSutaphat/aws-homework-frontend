---
name: primevue-responsive-layout
description: |
  Use this skill whenever the user wants to create or fix a responsive page layout using PrimeVue and Tailwind CSS.
  Trigger this skill when the user mentions: responsive design, mobile/tablet/desktop layout, breakpoints,
  PrimeVue layout, full-width layout, adaptive UI, viewport sizing, sidebar layout, header/footer layout,
  or asks for Vue component structure with PrimeVue + Tailwind.

  This skill produces complete, ready-to-use Vue 3 layout components with:
  - 3 breakpoints: Mobile (under 640px), Tablet (640-1023px), Desktop (1024px and up)
  - Full-width content areas (w-full, max-w-screen)
  - PrimeVue component integration (Menubar, Sidebar, Drawer, etc.)
  - Tailwind CSS utility classes aligned with PrimeVue's design tokens
  - Verification via a sub-agent that checks responsive behavior programmatically
---

# PrimeVue Responsive Layout Skill

This skill creates production-quality responsive page layouts for Vue 3 projects using **PrimeVue** components and **Tailwind CSS** utilities together. The goal is layouts that feel native in both frameworks — not a patchwork of competing styles.

## Breakpoints Used

| Name    | Min Width | Tailwind Prefix | PrimeVue Breakpoint |
|---------|-----------|-----------------|---------------------|
| Mobile  | < 640px   | (default)       | sm (hidden)         |
| Tablet  | ≥ 640px   | `sm:`           | md                  |
| Desktop | ≥ 1024px  | `lg:`           | lg                  |

Always design mobile-first: write the default (no prefix) styles for mobile, then override with `sm:` and `lg:`.

## Layout Architecture

A standard page layout has these zones:
```
┌─────────────────────────────────────┐
│  Header / Navbar (full width)       │
├────────┬────────────────────────────┤
│Sidebar │  Main Content (flex-1)     │  ← Desktop only
├────────┴────────────────────────────┤
│  Footer (full width)                │
└─────────────────────────────────────┘
```

On Mobile/Tablet: sidebar becomes a PrimeVue `Drawer` (slide-in panel).

## Standard Component Template

```vue
<template>
  <!-- Navbar: always full-width -->
  <Menubar :model="navItems" class="w-full rounded-none border-x-0 border-t-0" />

  <div class="flex min-h-screen w-full">
    <!-- Sidebar: visible on lg+, Drawer on mobile/tablet -->
    <aside class="hidden lg:flex lg:w-64 lg:flex-col bg-surface-50 border-r border-surface-200">
      <Listbox :options="menuItems" optionLabel="label" class="border-0 w-full" />
    </aside>

    <!-- Drawer for mobile/tablet -->
    <Drawer v-model:visible="drawerOpen" position="left" class="lg:hidden w-72">
      <Listbox :options="menuItems" optionLabel="label" class="border-0 w-full" />
    </Drawer>

    <!-- Main content: full width on mobile, expands on desktop -->
    <main class="flex-1 w-full min-w-0 p-4 sm:p-6 lg:p-8">
      <slot />
    </main>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import Menubar from 'primevue/menubar'
import Drawer from 'primevue/drawer'
import Listbox from 'primevue/listbox'

const drawerOpen = ref(false)
const navItems = ref([...])
const menuItems = ref([...])
</script>
```

## PrimeVue + Tailwind Integration Rules

These rules prevent the two systems from fighting each other:

1. **Spacing**: Use Tailwind utilities (`p-4`, `gap-6`) for layout spacing. Use PrimeVue's own padding only inside components.
2. **Colors**: Prefer PrimeVue's surface tokens (`bg-surface-0`, `text-surface-700`) over raw Tailwind colors so theming works.
3. **Borders**: Use `border-surface-200` (PrimeVue token mapped to Tailwind) rather than `border-gray-200`.
4. **Width**: Content areas use `w-full` and `min-w-0` (the latter prevents flex children from overflowing).
5. **Remove PrimeVue rounded corners on edge components**: Add `rounded-none` to Menubar, Panel etc. when they touch screen edges.
6. **Avoid `container` class**: Use `w-full max-w-screen-xl mx-auto` if you need a content cap, but default to true full-width.

## Responsive Grid Patterns

For content grids inside the main area:

```html
<!-- Cards: 1 col mobile → 2 cols tablet → 3 cols desktop -->
<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
  <Card v-for="item in items" :key="item.id" class="w-full" />
</div>

<!-- Two-panel form: stack mobile → side-by-side desktop -->
<div class="flex flex-col lg:flex-row gap-6">
  <div class="w-full lg:w-1/3"><!-- filters --></div>
  <div class="flex-1 min-w-0"><!-- results --></div>
</div>
```

## Common Patterns by Component

### DataTable (responsive)
```vue
<DataTable :value="rows" scrollable scrollHeight="flex"
           class="w-full"
           :pt="{ wrapper: { class: 'w-full overflow-x-auto' } }">
```
Use `overflow-x-auto` on the wrapper so tables scroll horizontally on mobile.

### Dialog / Modal
```vue
<Dialog v-model:visible="show"
        :style="{ width: 'min(90vw, 600px)' }"
        :breakpoints="{ '640px': '95vw' }">
```

### Toolbar
```vue
<Toolbar class="w-full rounded-none">
  <template #start>
    <Button icon="pi pi-bars" text class="lg:hidden" @click="drawerOpen = true" />
  </template>
</Toolbar>
```

## Verification Step (Sub-Agent)

After generating the layout, spawn a verification sub-agent with this prompt:

```
Review the Vue component code I just generated. Check for:
1. Does it use mobile-first Tailwind classes (default → sm: → lg:)?
2. Does the sidebar use `hidden lg:flex` and does a Drawer exist for mobile?
3. Does the main content area have `flex-1 w-full min-w-0`?
4. Are PrimeVue surface tokens used for colors (bg-surface-*, text-surface-*)?
5. Is `overflow-x-auto` applied to any DataTable wrapper?
6. Do all full-width components have `rounded-none` when at screen edges?

Report: PASS or FAIL for each point with a one-line explanation.
```

Fix any FAIL items before returning the component to the user.

## Output Format

Always produce:
1. A complete `.vue` single-file component (template + script setup + any needed style)
2. A brief usage note: what props/slots are available, how to toggle the sidebar
3. If the user asked for multiple components, produce one file per component

## Reference Files

- `references/primevue-tokens.md` — PrimeVue design token names for colors, spacing, and shadows
- `references/tailwind-primevue-compat.md` — Known conflicts and how to resolve them
