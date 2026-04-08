# PrimeVue Design Token Reference

PrimeVue v4+ uses a CSS custom property system. When using `@primevue/themes` with Tailwind, these tokens are exposed as Tailwind utilities via the PrimeVue Tailwind preset.

## Surface Colors (Background / Border)

| Token                 | Usage                           |
|-----------------------|---------------------------------|
| `bg-surface-0`        | Pure white (card background)    |
| `bg-surface-50`       | Off-white (sidebar bg)          |
| `bg-surface-100`      | Light gray (hover states)       |
| `bg-surface-200`      | Dividers, borders               |
| `bg-surface-700`      | Dark backgrounds (header dark)  |
| `bg-surface-900`      | Near-black                      |
| `border-surface-200`  | Standard border color           |
| `border-surface-300`  | Slightly darker border          |

## Text Colors

| Token               | Usage                        |
|---------------------|------------------------------|
| `text-surface-700`  | Primary body text            |
| `text-surface-500`  | Secondary / muted text       |
| `text-surface-300`  | Placeholder text             |
| `text-primary`      | Accent/link color            |
| `text-primary-contrast` | Text on primary bg       |

## Primary (Theme Color)

| Token                   | Usage                     |
|-------------------------|---------------------------|
| `bg-primary`            | Primary button, highlight |
| `bg-primary-50`         | Light tint (badge bg)     |
| `text-primary`          | Links, active states      |
| `border-primary`        | Focused input border      |

## Shadows

| Token           | Usage                    |
|-----------------|--------------------------|
| `shadow-card`   | Standard card shadow     |
| `shadow-overlay`| Modal/dropdown shadow    |

## Z-Index Layers

| Token        | Value | Usage              |
|--------------|-------|--------------------|
| `z-overlay`  | 1000  | Dialogs, drawers   |
| `z-toast`    | 9999  | Toast notifications|
