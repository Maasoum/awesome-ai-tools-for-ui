import * as THREE from 'three'

/**
 * Procedural 500ml "slim" aluminium can.
 * Units: 1 unit ≈ 53 mm. Height = 3.0, radius = 0.62.
 */
export const CAN = {
  radius: 0.62,
  bodyTop: 1.15,
  bodyBottom: -1.3,
  height: 3.0,
}

export interface CanUniforms {
  uLabelB: { value: THREE.Texture }
  uWipe: { value: number }
  uWipeActive: { value: number }
  uAccentA: { value: THREE.Color }
  uAccentB: { value: THREE.Color }
  uBase: { value: THREE.Color }
  uWhite: { value: THREE.Color }
  uInkGlow: { value: number }
  uRimColor: { value: THREE.Color }
  uRimIntensity: { value: number }
}

export interface CanHandle {
  group: THREE.Group
  body: THREE.Mesh
  bodyMaterial: THREE.MeshPhysicalMaterial
  uniforms: CanUniforms
  setLabelA: (t: THREE.Texture) => void
  dispose: () => void
}

function profileTop(): THREE.Vector2[] {
  const shoulder = new THREE.CubicBezierCurve(
    new THREE.Vector2(CAN.radius, CAN.bodyTop),
    new THREE.Vector2(CAN.radius, 1.28),
    new THREE.Vector2(0.53, 1.36),
    new THREE.Vector2(0.505, 1.44),
  )
  const pts = [new THREE.Vector2(CAN.radius, CAN.bodyTop - 0.02), ...shoulder.getPoints(28)]
  // neck + rolled rim + countersink + lid
  pts.push(
    new THREE.Vector2(0.505, 1.455),
    new THREE.Vector2(0.512, 1.474),
    new THREE.Vector2(0.522, 1.49),
    new THREE.Vector2(0.522, 1.502),
    new THREE.Vector2(0.512, 1.51),
    new THREE.Vector2(0.497, 1.506),
    new THREE.Vector2(0.488, 1.49),
    new THREE.Vector2(0.482, 1.462),
    new THREE.Vector2(0.474, 1.446),
    new THREE.Vector2(0.462, 1.444),
    new THREE.Vector2(0.452, 1.452),
    new THREE.Vector2(0.43, 1.458),
    new THREE.Vector2(0.2, 1.46),
    new THREE.Vector2(0.0, 1.46),
  )
  return pts.reverse()
}

function profileBottom(): THREE.Vector2[] {
  const taper = new THREE.CubicBezierCurve(
    new THREE.Vector2(0.47, -1.5),
    new THREE.Vector2(0.53, -1.49),
    new THREE.Vector2(CAN.radius, -1.42),
    new THREE.Vector2(CAN.radius, CAN.bodyBottom),
  )
  return [
    new THREE.Vector2(0.0, -1.405),
    new THREE.Vector2(0.18, -1.41),
    new THREE.Vector2(0.32, -1.43),
    new THREE.Vector2(0.4, -1.465),
    new THREE.Vector2(0.43, -1.492),
    new THREE.Vector2(0.45, -1.502),
    ...taper.getPoints(24),
    new THREE.Vector2(CAN.radius, CAN.bodyBottom + 0.02),
  ]
}

function pullTabGeometry() {
  const s = new THREE.Shape()
  const w = 0.1
  const L1 = 0.13
  const L2 = 0.22
  s.moveTo(-w, -L1 + 0.04)
  s.quadraticCurveTo(-w, -L1, -w + 0.04, -L1)
  s.lineTo(w - 0.04, -L1)
  s.quadraticCurveTo(w, -L1, w, -L1 + 0.04)
  s.lineTo(w * 1.05, L2 - 0.07)
  s.quadraticCurveTo(w * 1.05, L2, 0, L2)
  s.quadraticCurveTo(-w * 1.05, L2, -w * 1.05, L2 - 0.07)
  s.closePath()
  const hole = new THREE.Path()
  hole.moveTo(-0.065, 0.06)
  hole.lineTo(0.065, 0.06)
  hole.quadraticCurveTo(0.072, 0.16, 0, 0.165)
  hole.quadraticCurveTo(-0.072, 0.16, -0.065, 0.06)
  s.holes.push(hole)
  const rivetHole = new THREE.Path()
  rivetHole.absarc(0, -0.04, 0.022, 0, Math.PI * 2, true)
  s.holes.push(rivetHole)
  const g = new THREE.ExtrudeGeometry(s, { depth: 0.012, bevelEnabled: true, bevelThickness: 0.004, bevelSize: 0.004, bevelSegments: 2, curveSegments: 18 })
  g.rotateX(-Math.PI / 2)
  return g
}

export function buildCan(opts: {
  labelA: THREE.Texture
  condensation: { normal: THREE.Texture; mask: THREE.Texture }
  accent: string
  quality?: 'high' | 'low'
}): CanHandle {
  const segs = opts.quality === 'low' ? 72 : 144
  const group = new THREE.Group()
  group.name = 'volt-can'

  const condNormal = opts.condensation.normal.clone()
  condNormal.repeat.set(3, 2)
  condNormal.needsUpdate = true
  const condMask = opts.condensation.mask.clone()
  condMask.repeat.set(3, 2)
  condMask.needsUpdate = true

  const uniforms: CanUniforms = {
    uLabelB: { value: opts.labelA },
    uWipe: { value: -0.2 },
    uWipeActive: { value: 0 },
    uAccentA: { value: new THREE.Color(opts.accent) },
    uAccentB: { value: new THREE.Color(opts.accent) },
    uBase: { value: new THREE.Color('#0d1010') },
    uWhite: { value: new THREE.Color('#e9eded') },
    uInkGlow: { value: 0.55 },
    uRimColor: { value: new THREE.Color(opts.accent) },
    uRimIntensity: { value: 0.55 },
  }

  const bodyMaterial = new THREE.MeshPhysicalMaterial({
    map: opts.labelA,
    color: '#ffffff',
    metalness: 0.55,
    roughness: 0.4,
    clearcoat: 1,
    clearcoatMap: condMask,
    clearcoatNormalMap: condNormal,
    clearcoatNormalScale: new THREE.Vector2(1.1, 1.1),
    clearcoatRoughness: 0.035,
    envMapIntensity: 1.25,
    emissive: '#000000',
  })
  bodyMaterial.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms)
    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
        uniform sampler2D uLabelB;
        uniform float uWipe; uniform float uWipeActive;
        uniform vec3 uAccentA; uniform vec3 uAccentB; uniform vec3 uBase; uniform vec3 uWhite;
        uniform float uInkGlow; uniform vec3 uRimColor; uniform float uRimIntensity;
        float vlt_edge; float vlt_ink; vec3 vlt_accent;`,
      )
      .replace(
        '#include <map_fragment>',
        `
        vec4 lA = texture2D( map, vMapUv );
        vec4 lB = texture2D( uLabelB, vMapUv );
        float nb = 1.0 - smoothstep( uWipe - 0.012, uWipe + 0.012, vMapUv.y );
        vec4 lab = mix( lA, lB, nb );
        vlt_accent = mix( uAccentA, uAccentB, nb );
        vlt_ink = clamp( lab.r, 0.0, 1.0 );
        float vlt_white = clamp( lab.g, 0.0, 1.0 ) * ( 1.0 - vlt_ink );
        vec3 vcol = mix( uBase, vlt_accent, vlt_ink );
        vcol = mix( vcol, uWhite, vlt_white );
        diffuseColor.rgb *= vcol;
        float dE = ( vMapUv.y - uWipe ) * 55.0;
        vlt_edge = exp( -dE * dE ) * uWipeActive;
        `,
      )
      .replace(
        '#include <metalnessmap_fragment>',
        `#include <metalnessmap_fragment>
        metalnessFactor = mix( metalnessFactor, 0.15, max( vlt_ink, vlt_white ) );`,
      )
      .replace(
        '#include <roughnessmap_fragment>',
        `#include <roughnessmap_fragment>
        roughnessFactor = mix( roughnessFactor, 0.3, max( vlt_ink, vlt_white ) );`,
      )
      .replace(
        '#include <emissivemap_fragment>',
        `#include <emissivemap_fragment>
        float vlt_f = pow( 1.0 - saturate( dot( normal, normalize( vViewPosition ) ) ), 3.0 );
        totalEmissiveRadiance += vlt_accent * vlt_ink * uInkGlow;
        totalEmissiveRadiance += uRimColor * vlt_f * uRimIntensity;
        totalEmissiveRadiance += uAccentB * vlt_edge * 5.0;`,
      )
  }
  bodyMaterial.customProgramCacheKey = () => 'volt-can-body'

  const bodyGeo = new THREE.CylinderGeometry(CAN.radius, CAN.radius, CAN.bodyTop - CAN.bodyBottom, segs, 1, true)
  const body = new THREE.Mesh(bodyGeo, bodyMaterial)
  body.position.y = (CAN.bodyTop + CAN.bodyBottom) / 2
  group.add(body)

  const metalNormal = opts.condensation.normal.clone()
  metalNormal.repeat.set(4, 1)
  metalNormal.needsUpdate = true
  const metalMask = opts.condensation.mask.clone()
  metalMask.repeat.set(4, 1)
  metalMask.needsUpdate = true
  const metal = new THREE.MeshPhysicalMaterial({
    color: '#cfd5d5',
    metalness: 1,
    roughness: 0.24,
    clearcoat: 0.8,
    clearcoatMap: metalMask,
    clearcoatNormalMap: metalNormal,
    clearcoatRoughness: 0.04,
    envMapIntensity: 1.1,
    side: THREE.DoubleSide,
  })
  const lidMat = new THREE.MeshPhysicalMaterial({ color: '#b2b9b9', metalness: 1, roughness: 0.32, envMapIntensity: 1, side: THREE.DoubleSide })

  const top = new THREE.Mesh(new THREE.LatheGeometry(profileTop(), segs), metal)
  group.add(top)
  const bottom = new THREE.Mesh(new THREE.LatheGeometry(profileBottom(), segs), metal)
  group.add(bottom)

  // embossed mouth score on the lid
  const scoreGeo = new THREE.TorusGeometry(0.17, 0.006, 6, 48, Math.PI * 1.2)
  const score = new THREE.Mesh(scoreGeo, lidMat)
  score.rotation.x = -Math.PI / 2
  score.rotation.z = Math.PI * 0.4
  score.position.set(0, 1.462, 0.2)
  score.scale.set(1, 0.75, 1)
  group.add(score)
  const lidRing = new THREE.Mesh(new THREE.TorusGeometry(0.4, 0.007, 6, 96), lidMat)
  lidRing.rotation.x = -Math.PI / 2
  lidRing.position.y = 1.461
  group.add(lidRing)

  const tab = new THREE.Mesh(pullTabGeometry(), lidMat)
  tab.position.set(0, 1.466, -0.02)
  tab.rotation.x = -0.03
  group.add(tab)
  const rivet = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.03, 0.02, 20), metal)
  rivet.position.set(0, 1.47, 0.02)
  group.add(rivet)

  group.traverse((o) => {
    if ((o as THREE.Mesh).isMesh) {
      o.castShadow = false
      o.receiveShadow = false
    }
  })

  return {
    group,
    body,
    bodyMaterial,
    uniforms,
    setLabelA: (t) => {
      bodyMaterial.map = t
    },
    dispose: () => {
      group.traverse((o) => {
        const m = o as THREE.Mesh
        if (m.isMesh) m.geometry.dispose()
      })
      bodyMaterial.dispose()
      metal.dispose()
      lidMat.dispose()
      condNormal.dispose()
      condMask.dispose()
      metalNormal.dispose()
      metalMask.dispose()
    },
  }
}
