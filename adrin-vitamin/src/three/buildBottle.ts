import * as THREE from 'three'
import { LIQUID_PROFILE, glassNeckProfile, capProfile, BOTTLE } from './bottleProfile'

export { BOTTLE }

export interface BottleUniforms {
  uLabelB: { value: THREE.Texture }
  uWipe: { value: number }
  uWipeActive: { value: number }
  uAccentA: { value: THREE.Color }
  uAccentB: { value: THREE.Color }
  uInkGlow: { value: number }
  uRimColor: { value: THREE.Color }
  uRimIntensity: { value: number }
}

export interface BottleHandle {
  group: THREE.Group
  body: THREE.Mesh
  bodyMaterial: THREE.MeshPhysicalMaterial
  uniforms: BottleUniforms
  setLabelA: (t: THREE.Texture) => void
  dispose: () => void
}

/** wraps the crown cap skirt into 21 crimped flutes */
function crimp(geo: THREE.BufferGeometry) {
  const p = geo.attributes.position as THREE.BufferAttribute
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i)
    const y = p.getY(i)
    const z = p.getZ(i)
    if (y > 1.574) continue
    const th = Math.atan2(x, z)
    const w = THREE.MathUtils.smoothstep(y, 1.468, 1.49) * (1 - THREE.MathUtils.smoothstep(y, 1.555, 1.574))
    const flute = Math.pow(Math.abs(Math.cos(th * 10.5)), 0.6)
    const k = 1 + (flute * 0.06 - 0.02) * w
    p.setX(i, x * k)
    p.setZ(i, z * k)
  }
  p.needsUpdate = true
  geo.computeVertexNormals()
}

export function buildBottle(opts: {
  labelA: THREE.Texture
  condensation: { normal: THREE.Texture; mask: THREE.Texture }
  accent: string
  quality?: 'high' | 'low'
}): BottleHandle {
  const segs = opts.quality === 'low' ? 84 : 168
  const group = new THREE.Group()
  group.name = 'adrin-bottle'

  const condNormal = opts.condensation.normal.clone()
  condNormal.repeat.set(3, 3)
  condNormal.needsUpdate = true
  const condMask = opts.condensation.mask.clone()
  condMask.repeat.set(3, 3)
  condMask.needsUpdate = true

  const uniforms: BottleUniforms = {
    uLabelB: { value: opts.labelA },
    uWipe: { value: -0.2 },
    uWipeActive: { value: 0 },
    uAccentA: { value: new THREE.Color(opts.accent) },
    uAccentB: { value: new THREE.Color(opts.accent) },
    uInkGlow: { value: 0.3 },
    uRimColor: { value: new THREE.Color(opts.accent) },
    uRimIntensity: { value: 0.4 },
  }

  /* ---------------- liquid + printed glass (one glossy body) ---------------- */
  const bodyMaterial = new THREE.MeshPhysicalMaterial({
    map: opts.labelA,
    color: '#ffffff',
    metalness: 0,
    roughness: 0.2,
    clearcoat: 1,
    clearcoatMap: condMask,
    clearcoatNormalMap: condNormal,
    clearcoatNormalScale: new THREE.Vector2(0.9, 0.9),
    clearcoatRoughness: 0.03,
    specularIntensity: 1,
    ior: 1.5,
    envMapIntensity: 1.35,
  })
  bodyMaterial.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms)
    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
        uniform sampler2D uLabelB;
        uniform float uWipe; uniform float uWipeActive;
        uniform vec3 uAccentA; uniform vec3 uAccentB;
        uniform float uInkGlow; uniform vec3 uRimColor; uniform float uRimIntensity;
        float adr_edge; vec3 adr_accent; vec3 adr_lab;`,
      )
      .replace(
        '#include <map_fragment>',
        `
        vec4 lA = texture2D( map, vMapUv );
        vec4 lB = texture2D( uLabelB, vMapUv );
        float nb = 1.0 - smoothstep( uWipe - 0.012, uWipe + 0.012, vMapUv.y );
        vec4 lab = mix( lA, lB, nb );
        adr_accent = mix( uAccentA, uAccentB, nb );
        adr_lab = lab.rgb;
        diffuseColor.rgb *= lab.rgb;
        float dE = ( vMapUv.y - uWipe ) * 55.0;
        adr_edge = exp( -dE * dE ) * uWipeActive;
        `,
      )
      .replace(
        '#include <emissivemap_fragment>',
        `#include <emissivemap_fragment>
        float adr_nv = saturate( dot( normal, normalize( vViewPosition ) ) );
        float adr_f = pow( 1.0 - adr_nv, 3.0 );
        // light scattering through the coloured liquid: brighter toward the silhouette
        totalEmissiveRadiance += adr_lab * uInkGlow * ( 0.35 + 0.9 * pow( 1.0 - adr_nv, 1.5 ) );
        totalEmissiveRadiance += uRimColor * adr_f * uRimIntensity;
        totalEmissiveRadiance += uAccentB * adr_edge * 4.0;`,
      )
  }
  bodyMaterial.customProgramCacheKey = () => 'adrin-bottle-body'

  const bodyGeo = new THREE.LatheGeometry(LIQUID_PROFILE, segs)
  const body = new THREE.Mesh(bodyGeo, bodyMaterial)
  group.add(body)

  /* ---------------- clear glass neck with a rolled lip ---------------- */
  const glass = new THREE.MeshPhysicalMaterial({
    color: '#eef6f4',
    metalness: 0,
    roughness: 0.04,
    transparent: true,
    opacity: 0.32,
    clearcoat: 1,
    clearcoatRoughness: 0.02,
    envMapIntensity: 2.2,
    specularIntensity: 1,
    side: THREE.DoubleSide,
    depthWrite: false,
  })
  const neck = new THREE.Mesh(new THREE.LatheGeometry(glassNeckProfile(), segs), glass)
  neck.renderOrder = 2
  group.add(neck)

  // inner neck wall seen through the glass: faint frosted tint
  const innerGlass = new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.06, side: THREE.BackSide, depthWrite: false })
  const neckInner = new THREE.Mesh(new THREE.LatheGeometry(glassNeckProfile().map((p) => new THREE.Vector2(p.x * 0.9, p.y)), segs), innerGlass)
  neckInner.renderOrder = 1
  group.add(neckInner)

  /* ---------------- red crown cap ---------------- */
  const capMat = new THREE.MeshPhysicalMaterial({
    color: '#D7141A',
    metalness: 0.55,
    roughness: 0.28,
    clearcoat: 1,
    clearcoatRoughness: 0.08,
    envMapIntensity: 1.3,
  })
  const capGeo = new THREE.LatheGeometry(capProfile(), segs)
  crimp(capGeo)
  const cap = new THREE.Mesh(capGeo, capMat)
  group.add(cap)

  // thin silver ring between cap and lip catches a sharp highlight
  const ringMat = new THREE.MeshStandardMaterial({ color: '#d9dede', metalness: 1, roughness: 0.2 })
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.247, 0.006, 8, segs), ringMat)
  ring.rotation.x = Math.PI / 2
  ring.position.y = 1.47
  group.add(ring)

  // center the bottle vertically around the origin (base -1.594 → cap 1.592)
  group.position.y = -(BOTTLE.baseY + BOTTLE.capTop) / 2

  const root = new THREE.Group()
  root.add(group)

  return {
    group: root,
    body,
    bodyMaterial,
    uniforms,
    setLabelA: (t) => {
      bodyMaterial.map = t
    },
    dispose: () => {
      root.traverse((o) => {
        const m = o as THREE.Mesh
        if (m.isMesh) m.geometry.dispose()
      })
      bodyMaterial.dispose()
      glass.dispose()
      innerGlass.dispose()
      capMat.dispose()
      ringMat.dispose()
      condNormal.dispose()
      condMask.dispose()
    },
  }
}
