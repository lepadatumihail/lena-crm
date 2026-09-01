# Lena UI — how to build with it

Lena is a **Tailwind CSS v4 + shadcn/ui** design system with a warm, terracotta-forward
palette. Components are styled with utility classes that read **semantic color tokens** —
build layouts the same way.

## Setup

- **No provider or wrapper is required.** These primitives render fully styled on their
  own as long as the bundle's `styles.css` is loaded (it `@import`s the token stylesheet
  and `_ds_bundle.css`).
- **Fonts:** text renders in **Geist** by default (applied on `body` — you don't need to
  set it); **Geist Mono** is available for code/figures. Both are wired in `styles.css`.
- **Dark mode:** add `class="dark"` to an ancestor (e.g. `<html>` or a wrapper `<div>`).
  Every token below has a dark value, so children re-theme automatically. Default is light.

## Styling idiom — semantic tokens, not raw colors

Never use raw Tailwind palette colors (`bg-red-500`, `text-gray-700`). Use the semantic
token utilities so light/dark and brand stay correct. Each token exists as
`bg-*`, `text-*`, and `border-*` utilities:

| Token family | Use for | Pairs with |
|---|---|---|
| `primary` / `primary-foreground` | terracotta brand actions, primary buttons | `bg-primary text-primary-foreground` |
| `secondary` / `secondary-foreground` | low-emphasis surfaces/buttons | `bg-secondary text-secondary-foreground` |
| `background` / `foreground` | page surface + default text | `bg-background text-foreground` |
| `card` / `card-foreground` | elevated card surface (warm off-white) | `bg-card text-card-foreground` |
| `muted` / `muted-foreground` | subtle fills + secondary text | `text-muted-foreground` |
| `accent` / `accent-foreground` | hover/highlight surfaces | `bg-accent text-accent-foreground` |
| `destructive` / `*-foreground` | dangerous actions, errors | `bg-destructive text-destructive-foreground` |
| `success` / `success-foreground` | positive status (closed, won) — **Lena extension** | `bg-success text-success-foreground` |
| `warning` / `warning-foreground` | attention status (pipeline, due) — **Lena extension** | `bg-warning text-warning-foreground` |
| `border` / `input` / `ring` | borders, input borders, focus rings | `border`, `focus-visible:ring-ring` |

Radius scale: `rounded-sm | rounded-md | rounded-lg | rounded-xl` (all derive from
`--radius`, ~0.625rem). Spacing/typography use stock Tailwind utilities.

## Where the truth lives

- `styles.css` and `_ds_bundle.css` — the shipped tokens and compiled component styles.
- Per-component `<Name>.d.ts` (the prop contract) and `<Name>.prompt.md` (usage) — read
  these before composing a component.

## Idiomatic snippet

```tsx
import { Card, CardHeader, CardTitle, CardDescription, CardAction,
         CardContent, CardFooter, Badge, Button } from "lena";

<Card className="w-90">
  <CardHeader>
    <CardTitle>Sofia Marković</CardTitle>
    <CardDescription>Seller · 3-bed apartment</CardDescription>
    <CardAction><Badge variant="warning">Offer made</Badge></CardAction>
  </CardHeader>
  <CardContent>
    <Badge variant="success">€48,000 in pipeline</Badge>
  </CardContent>
  <CardFooter className="gap-2">
    <Button size="sm">Open deal</Button>
    <Button size="sm" variant="outline">Log call</Button>
  </CardFooter>
</Card>
```

Use library components for controls; use the token utilities above for your own layout
glue. `Button` variants: `default | secondary | outline | destructive | ghost | link`.
`Badge` variants: `default | secondary | outline | destructive | success | warning`.
