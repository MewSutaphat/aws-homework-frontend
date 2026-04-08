# Tailwind + PrimeVue Compatibility Guide

## Required Setup

### tailwind.config.js
```js
import { defineConfig } from 'tailwindcss'
import primeui from 'tailwindcss-primeui'

export default defineConfig({
  content: [
    './index.html',
    './src/**/*.{vue,js,ts}',
  ],
  plugins: [primeui],  // Adds PrimeVue surface/primary tokens as Tailwind utilities
})
```

### main.js
```js
import { createApp } from 'vue'
import PrimeVue from 'primevue/config'
import Aura from '@primevue/themes/aura'  // or Lara, Nora
import 'primeicons/primeicons.css'

const app = createApp(App)
app.use(PrimeVue, {
  theme: {
    preset: Aura,
    options: {
      darkModeSelector: '.dark',
      cssLayer: { name: 'primevue', order: 'tailwind-base, primevue, tailwind-utilities' }
    }
  }
})
```

The `cssLayer` config ensures Tailwind utilities always override PrimeVue's default styles when both apply.

## Known Conflicts and Fixes

### 1. PrimeVue border-radius vs Tailwind rounded
**Problem**: PrimeVue components have built-in border-radius from their theme.
**Fix**: Use PrimeVue's `pt` (passthrough) prop OR add `rounded-none` as a Tailwind class:
```vue
<Panel class="rounded-none" />  <!-- removes PrimeVue default radius -->
```

### 2. PrimeVue padding vs Tailwind padding
**Problem**: DataTable, Card etc. add internal padding that stacks with your Tailwind `p-*` classes.
**Fix**: Apply Tailwind padding to wrappers, not to the PrimeVue component itself:
```html
<div class="p-4">   <!-- Tailwind padding on wrapper -->
  <Card />           <!-- No extra Tailwind padding on Card -->
</div>
```

### 3. Flexbox overflow with DataTable
**Problem**: DataTable inside a flex container may overflow.
**Fix**: Always wrap DataTable in a `min-w-0 overflow-x-auto` div:
```html
<div class="min-w-0 overflow-x-auto w-full">
  <DataTable ... />
</div>
```

### 4. Dark mode
**Problem**: PrimeVue dark mode uses `system` or `class` selector; Tailwind uses `dark:` prefix.
**Fix**: Set `darkModeSelector: '.dark'` in PrimeVue config AND `darkMode: 'class'` in tailwind.config.js. Toggle with `document.documentElement.classList.toggle('dark')`.

### 5. Tailwind's `container` class vs full-width layouts
**Problem**: Tailwind's `container` has max-width constraints that fight full-width layouts.
**Fix**: Don't use `container`. Use `w-full` on layout wrappers, and `max-w-screen-xl mx-auto` only for content caps when intentionally limiting width.

### 6. PrimeVue Dialog/Drawer z-index
**Problem**: Tailwind's `z-10`, `z-20` etc. may conflict with PrimeVue overlays.
**Fix**: Don't set z-index on layout elements. Let PrimeVue manage overlay z-indexes via its tokens (`--p-zindex-overlay: 1000`).
