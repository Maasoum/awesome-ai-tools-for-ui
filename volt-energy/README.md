# VOLT ENERGY — Cinematic 3D Website Experience

A premium, scroll-driven 3D campaign site for the fictional energy drink **VOLT ENERGY**.

**Stack:** React 19 · TypeScript · Vite · Tailwind CSS v4 · Three.js · React Three Fiber · drei · postprocessing · GSAP (ScrollTrigger + SplitText) · Lenis · Framer Motion · Zustand

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # type-check + production build to dist/
```

## The experience

| # | Section | What happens in 3D |
|---|---------|--------------------|
| 1 | **Hero** (`#home`) | The can floats in the centre, spins slowly and follows the mouse, surrounded by energy particles, floating droplets and drifting smoke |
| 2 | **Formula** (`#ingredients`, pinned) | The camera moves in while the can finishes a 360° turn. Six ingredient callouts appear one at a time, and the can keeps turning to show the nutrition panel |
| 3 | **Feel the Power** (pinned) | Two liquid ribbons wrap around the tilted can. Droplets and carbonation bubbles burst outwards, with a high-speed liquid splash and streak layers behind them |
| 4 | **Products** (`#products`) | The can settles facing the camera. Picking a flavour runs a glowing scan-line across the label, spins the can and changes the colour of all the lighting |
| 5 | **Story** (`#story`) | An editorial page with parallax images and text reveals. Rendering is paused while this page fully covers the screen |
| 6 | **Final CTA** (`#voltage`) | The can rises from below in front of a giant VOLT wordmark. The CTA opens the Voltage Finder quiz |

## How the 3D works

- **There are no model or HDR files.** Everything is built in code:
  - The can is made from lathe and cylinder geometry, with a rolled rim, countersunk lid, score line, extruded pull-tab and rivet (`src/three/buildCan.ts`).
  - The label is drawn on a canvas as a two-channel ink mask. The colour is applied in a shader, which is what lets flavours cross-fade with the scan-line wipe.
  - **Condensation** is a generated height field: mist, beads, large drops and running drips. It becomes a clearcoat normal map plus a clearcoat mask, so the droplets reflect light as wet highlights on matte black paint (`src/three/textures.ts`).
  - The **studio lighting** is a set of virtual softboxes and strip lights, pre-filtered with PMREM (`src/three/studioEnv.ts`). The coloured rim light comes from a fresnel term added to the shader plus coloured point lights.
- **Scroll choreography:** ScrollTrigger writes how far each section has progressed into a shared state object (`src/lib/sceneState.ts`). The render loop blends between camera/can positions defined per section (`src/three/poses.ts`), and every value is eased with damping.
- **Product renders:** the flavour cards and cart thumbnails are snapshots of the same procedural can. They are rendered once in a short-lived offscreen renderer (`src/three/productShots.ts`).
- **Post-processing:** bloom, ACES tone mapping, film grain and vignette.

## Performance and accessibility

- three.js and R3F load in a separate chunk, after the fonts.
- The preloader tracks real loading stages.
- Pixel ratio adapts through `PerformanceMonitor`. Low-power devices get fewer particles and simpler geometry.
- The WebGL loop is paused while it is hidden.
- `prefers-reduced-motion`: Lenis, idle spin, parallax and text-split animations are turned off, and transitions become instant.
- **No WebGL** (or a WebGL crash): a matching vector packshot replaces the 3D can.
- Dialogs trap focus and close with Esc. Every control has an accessible label. Arrow keys switch flavours while the product showcase is on screen.

## Interactions

- Every nav item and CTA scrolls smoothly to its section. The nav highlights the current section and hides when you scroll down. On mobile there is an animated hamburger menu.
- **Explore product** opens a product sheet with pack sizes and quantity. Adding to the cart opens the cart drawer, which has quantity controls, a free-shipping meter and a demo checkout.
- **Discover your energy** opens a 3-question Voltage Finder. It recommends a flavour and can switch the 3D can to it.
- The footer newsletter form validates the email address.

Story imagery in `public/images` is AI-generated and was optimised to WebP.
