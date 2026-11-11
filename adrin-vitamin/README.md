# ADRIN Vitamin — Cinematic 3D Party Experience

A premium, scroll-driven 3D campaign site for **ADRIN Vitamin**, a sparkling vitamin drink sold in five flavours in a contoured glass bottle with a red crown cap.

**Stack:** React 19 · TypeScript · Vite · Tailwind CSS v4 · Three.js · React Three Fiber · drei · postprocessing · GSAP (ScrollTrigger + SplitText) · Lenis · Framer Motion · Zustand

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # type-check + production build to dist/
```

## The experience

The whole site is set in a night-time arena: a full-screen venue photograph sits behind the bottle, with confetti and soft bokeh lights drifting in front of it. **Every light in the experience follows the selected flavour.** The photo is colour-graded live (warm stage wash → the flavour colour, cool spotlights → its second colour), and the same colours drive the confetti, particles, the rim light on the bottle, bloom, buttons, highlights and the neon wordmark.

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
| Pomegranate | `#8A2584` → `#B5206B` | deep magenta `#A91C8E` |
| Sparkling Lime | `#E6F41E` → `#3DBE3C` | lime green `#3DAF2C` |

Flavour data lives in `src/lib/flavors.ts`. Changing `accent` / `accent2` there relights both the 3D scene and the UI. The UI uses the registered CSS custom properties `--accent` / `--accent-2` (Tailwind tokens `glow` / `glow2`), which animate smoothly between flavours.

## How the 3D works

- **There are no model or HDR files.** Everything is built in code:
  - **Bottle** (`src/three/bottleProfile.ts`, `buildBottle.ts`): the silhouette was traced from the product key visual and is turned into lathe geometry. It has three parts:
    - a smooth, glossy liquid body with a flawless clearcoat (no grain or micro-texture on the colour)
    - a clear glass neck with a rolled lip
    - a crown cap with 21 crimped flutes
  - **Label** (`src/three/textures.ts`): a full-colour canvas with the two-tone liquid gradient, carbonation, the ADRIN logo, the flavour name and a back panel (nutrition facts and barcode). The lathe UVs follow arc length, so the artwork is placed by bottle height and corrected for curvature.
  - **Venue backdrop** (`src/three/PhotoBackdrop.tsx`): `public/images/venue.webp` (`venue-sm.webp` on small or low-power screens) drawn as a cover-fit full-screen quad. A shader re-tints it to the flavour, dims it per section, keeps a vignette for legibility and drifts slowly with the pointer and scroll.
  - **Party layer** (`src/three/Party.tsx`): bokeh points and GPU-animated instanced confetti. Backdrop, bokeh and confetti strength are set per section in `poses.ts`.
  - **Studio lighting**: procedural softboxes pre-filtered with PMREM (`src/three/studioEnv.ts`).
- **Scroll choreography:** ScrollTrigger progress is stored in `src/lib/sceneState.ts`. The render loop blends the per-section poses with damping.
- **Product renders:** flavour cards and cart thumbnails are snapshots of the same procedural bottle, rendered once offscreen (`src/three/productShots.ts`).
- **Post-processing:** bloom, ACES tone mapping and vignette.

## Brand assets

- `src/assets/adrin-logo.webp` (UI) and `adrin-logo-hd.webp` (printed on the 3D label)
- `public/favicon-32.png`, `favicon-64.png`, `apple-touch-icon.png`
- The ADRIN wordmark is set in Orbitron.

## Performance and accessibility

- three.js and R3F load in a separate chunk, after the fonts and logo.
- Pixel ratio adapts through `PerformanceMonitor`. Low-power devices get fewer particles and confetti and a smaller backdrop image.
- `prefers-reduced-motion` turns off smooth scroll, idle spin, parallax and split-text animations.
- **No WebGL** (or a WebGL crash): a matching vector bottle replaces the 3D scene.
- Dialogs trap focus and close with Esc. Arrow keys switch flavours in the product showcase.

Photography in `public/images` is optimised to WebP.

## Deploying to Cloudflare (free)

The build is a fully static site (no server code), so it runs on Cloudflare's free plan. Use Node 22 (pinned in `.node-version`).

**Option A: Cloudflare Pages (Git integration)**

1. Cloudflare dashboard → *Workers & Pages* → *Create* → *Pages* → *Connect to Git*, then pick this repository.
2. Production branch: the branch that holds this project.
3. Framework preset: *None* (or *Vite*). Root directory: `adrin-vitamin`. Build command: `npm run build`. Build output directory: `dist`.
4. Save and deploy. The site is live at `https://<project>.pages.dev`, and every push redeploys it.

**Option B: Cloudflare Workers (static assets), from Git or the CLI**

- Git: *Workers & Pages* → *Create* → *Import a repository*. Root directory `adrin-vitamin`, build command `npm run build`, deploy command `npx wrangler deploy`.
- CLI: `npm run build && npx wrangler deploy` (uses `wrangler.jsonc`; first run asks you to log in).

`public/_headers` is copied into `dist/` and sets long-term caching for the fingerprinted `/assets/*`, a week for images, and no-cache for `index.html`. Cloudflare serves Brotli/gzip automatically. Serve the site from the root of a domain or subdomain, because image paths are absolute.
