import { useMemo, useRef, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { rig } from './poses'
import { simplex3 } from './glsl'
import { sceneState } from '../lib/sceneState'

function helix(turns: number, phase: number, r0: number, y0: number, y1: number, wobble: number) {
  const pts: THREE.Vector3[] = []
  const N = 40
  for (let i = 0; i <= N; i++) {
    const t = i / N
    const a = phase + t * turns * Math.PI * 2
    const r = r0 + Math.sin(t * Math.PI * 1.3 + phase) * wobble + Math.sin(t * 9 + phase) * 0.05
    pts.push(new THREE.Vector3(Math.cos(a) * r, THREE.MathUtils.lerp(y0, y1, t) + Math.sin(t * 7 + phase) * 0.12, Math.sin(a) * r))
  }
  return new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.5)
}

function makeLiquidMaterial(uniforms: Record<string, { value: unknown }>, radius: number) {
  const m = new THREE.MeshPhysicalMaterial({
    color: '#B6FF00',
    roughness: 0.05,
    metalness: 0,
    clearcoat: 1,
    clearcoatRoughness: 0.02,
    emissive: '#B6FF00',
    emissiveIntensity: 0.32,
    transparent: true,
    opacity: 0.94,
    envMapIntensity: 2.2,
    ior: 1.34,
    specularIntensity: 1,
  })
  m.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms)
    shader.vertexShader = shader.vertexShader
      .replace(
        '#include <common>',
        `#include <common>
        uniform float uTime; uniform float uReveal; uniform float uFade; varying float vS; varying float vThick;
        ${simplex3}`,
      )
      .replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
        float s = uv.x;
        vS = s;
        float head = smoothstep( uReveal, uReveal - 0.14, s );
        float taper = pow( sin( clamp( s, 0.0, 1.0 ) * 3.14159 ), 0.7 );
        float thick = taper * head * uFade;
        vThick = thick;
        float n = snoise( position * 1.7 + vec3( 0.0, -uTime * 0.7, uTime * 0.2 ) );
        float n2 = snoise( position * 4.0 + vec3( uTime * 0.5 ) );
        transformed -= normal * ${radius.toFixed(3)} * ( 1.0 - thick );
        transformed += normal * ( n * 0.045 + n2 * 0.012 ) * thick;
        `,
      )
    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
        uniform float uReveal; varying float vS; varying float vThick;`,
      )
      .replace(
        '#include <dithering_fragment>',
        `#include <dithering_fragment>
        if ( vS > uReveal ) discard;
        float vf = pow( 1.0 - saturate( dot( normal, normalize( vViewPosition ) ) ), 2.0 );
        gl_FragColor.a *= mix( 0.55, 1.0, vf ) * smoothstep( 0.08, 0.4, vThick );`,
      )
  }
  return m
}

export function LiquidSwirl() {
  const group = useRef<THREE.Group>(null!)
  const uniforms = useMemo(() => ({ uTime: { value: 0 }, uReveal: { value: 0 }, uFade: { value: 0 } }), [])
  const uniforms2 = useMemo(() => ({ uTime: { value: 0 }, uReveal: { value: 0 }, uFade: { value: 0 } }), [])

  const { geoA, geoB, matA, matB } = useMemo(() => {
    const segs = sceneState.lowPower ? 220 : 420
    const geoA = new THREE.TubeGeometry(helix(1.55, 0.3, 1.05, -1.9, 2.05, 0.28), segs, 0.1, 18, false)
    const geoB = new THREE.TubeGeometry(helix(1.2, 2.6, 1.28, 1.6, -1.6, 0.22), segs, 0.065, 14, false)
    return { geoA, geoB, matA: makeLiquidMaterial(uniforms, 0.1), matB: makeLiquidMaterial(uniforms2, 0.065) }
  }, [uniforms, uniforms2])

  useEffect(
    () => () => {
      geoA.dispose()
      geoB.dispose()
      matA.dispose()
      matB.dispose()
    },
    [geoA, geoB, matA, matB],
  )

  useFrame((state) => {
    const reveal = rig.swirl
    group.current.visible = reveal > 0.03
    uniforms.uFade.value = uniforms2.uFade.value = THREE.MathUtils.smoothstep(reveal, 0.03, 0.4)
    if (!group.current.visible) return
    const t = sceneState.reduced ? 0 : state.clock.elapsedTime
    uniforms.uTime.value = t
    uniforms2.uTime.value = t * 1.1
    // ease the leading edge so the liquid "shoots" around the bottle
    uniforms.uReveal.value = THREE.MathUtils.smoothstep(reveal, 0, 1) * 1.15
    uniforms2.uReveal.value = THREE.MathUtils.smoothstep(reveal, 0.15, 1) * 1.15
    matA.color.copy(rig.accent)
    matA.emissive.copy(rig.accent)
    matB.color.copy(rig.accent)
    matB.emissive.copy(rig.accent)
    group.current.rotation.y = t * 0.25
  })

  return (
    <group ref={group}>
      <mesh geometry={geoA} material={matA} />
      <mesh geometry={geoB} material={matB} />
    </group>
  )
}
