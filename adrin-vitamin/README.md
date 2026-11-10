# ADRIN Vitamin — Cinematic 3D Party Experience

A premium, scroll-driven 3D campaign site for **ADRIN Vitamin**, a sparkling vitamin drink sold in five flavours in a contoured glass bottle with a red crown cap.

**Stack:** React 19 · TypeScript · Vite · Tailwind CSS v4 · Three.js · React Three Fiber · drei · postprocessing · GSAP (ScrollTrigger + SplitText) · Lenis · Framer Motion · Zustand

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # type-check + production build to dist/
```

## The experience

The whole site is set in a night-time festival: stage beams sweep down from the rig, a backlit crowd fills the bottom of the frame, and confetti and soft bokeh lights drift in the air. **Every light in the experience follows the selected flavour.** That covers the stage beams, the crowd rim light, confetti, particles, the rim light on the bottle, bloom, buttons, highlights and the neon wordmark.

| # | Section | What happens in 3D |
|---|---------|--------------------|
| 1 | **Hero** (`#home`) | The bottle floats above the crowd, spins slowly and follows the mouse |
| 2 | **Formula** (`#ingredients`, pinned) | The camera moves in while the bottle turns to show six ingredient callouts and then the nutrition panel |
| 3 | **Feel the Power** (pinned) | Liquid ribbons wrap around the tilted bottle. Droplets and bubbles burst outwards, and a macro splash photo is re-tinted to the flavour colour |
| 4 | **Products** (`#products`) | Five flavours. Picking one runs a glowing scan-line across the label, spins the bottle and relights the whole venue |
| 5 | **Story** (`#story`) | An editorial page with party photography and parallax |
| 6 | **Final CTA** (`#vibe`) | The bottle rises in front of a giant neon ADRIN wordmark. The CTA opens the Vibe Finder quiz |

## Flavours

| Flavour | Liquid (top → bottom) | Glow |
|---|---|---|
| Cactus | `#F27AAE` → `#D4169B` | neon pink |
| Sparkling | `#C3C8D2` → `#2FC2E6` | electric cyan |
| Mandarin (default) | `#FF4B33` → `#EF331C` | fire orange |
| Pomegranate | `#8A2584` → `#B5206B` | ultra violet |
| Sparkling Lime | `#E6F41E` → `#3DBE3C` | acid lime |

Flavour data lives in `src/lib/flavors.ts`. Changing `accent` / `accent2` there relights both the 3D scene and the UI. The UI uses the registered CSS custom properties `--accent` / `--accent-2` (Tailwind tokens `glow` / `glow2`), which animate smoothly between flavours.

## How the 3D works

- **There are no model or HDR files.** Everything is built in code:
  - **Bottle** (`src/three/bottleProfile.ts`, `buildBottle.ts`): the silhouette was traced from the product key visual and is turned into lathe geometry. It has three parts:
    - a glossy liquid body with clearcoat condensation
    - a clear glass neck with a rolled lip
    - a crown cap with 21 crimped flutes
  - **Label** (`src/three/textures.ts`): a full-colour canvas with the two-tone liquid gradient, carbonation, the ADRIN logo, the flavour name and a back panel (nutrition facts and barcode). The lathe UVs follow arc length, so the artwork is placed by bottle height and corrected for curvature.
  - **Party layer** (`src/three/Party.tsx`): additive stage-beam cones, bokeh points, GPU-animated instanced confetti, and a crowd silhouette with an accent-coloured rim light. Beam, crowd and confetti strength are set per section in `poses.ts`.
  - **Studio lighting**: procedural softboxes pre-filtered with PMREM (`src/three/studioEnv.ts`).
- **Scroll choreography:** ScrollTrigger progress is stored in `src/lib/sceneState.ts`. The render loop blends the per-section poses with damping.
- **Product renders:** flavour cards and cart thumbnails are snapshots of the same procedural bottle, rendered once offscreen (`src/three/productShots.ts`).
- **Post-processing:** bloom, ACES tone mapping, film grain and vignette.

## Brand assets

- `src/assets/adrin-logo.webp` (UI) and `adrin-logo-hd.webp` (printed on the 3D label)
- `public/favicon-32.png`, `favicon-64.png`, `apple-touch-icon.png`
- The ADRIN wordmark is set in Orbitron.

## Performance and accessibility

- three.js and R3F load in a separate chunk, after the fonts and logo.
- Pixel ratio adapts through `PerformanceMonitor`. Low-power devices get fewer beams, particles and confetti.
- `prefers-reduced-motion` turns off smooth scroll, idle spin, parallax and split-text animations.
- **No WebGL** (or a WebGL crash): a matching vector bottle replaces the 3D scene.
- Dialogs trap focus and close with Esc. Arrow keys switch flavours in the product showcase.

Party photography and the crowd silhouette in `public/images` are AI-generated and were optimised to WebP.
