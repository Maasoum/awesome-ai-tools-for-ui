import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { rig } from './poses'
import { sceneState } from '../lib/sceneState'


/*
 * The party layer floating in front of the venue photo: out-of-focus bokeh and confetti.
 * Every colour reads from rig.accent / rig.accent2, so the whole venue relights
 * when a different flavour is picked.
 */

const damp = THREE.MathUtils.damp

/* -------------------------------- Bokeh -------------------------------- */

export function Bokeh() {
  const COUNT = sceneState.lowPower ? 32 : 64
  const { gl } = useThree()
  const mat = useRef<THREE.ShaderMaterial>(null!)
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry()
    const p = new Float32Array(COUNT * 3)
    const s = new Float32Array(COUNT)
    for (let i = 0; i < COUNT; i++) {
      p[i * 3] = (Math.random() - 0.5) * 26
      p[i * 3 + 1] = -3 + Math.random() * 9.5
      p[i * 3 + 2] = -9 - Math.random() * 6
      s[i] = Math.random()
    }
    g.setAttribute('position', new THREE.BufferAttribute(p, 3))
    g.setAttribute('aSeed', new THREE.BufferAttribute(s, 1))
    return g
  }, [COUNT])
  useEffect(() => () => geo.dispose(), [geo])
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uA: { value: rig.accent.clone() },
      uB: { value: rig.accent2.clone() },
      uPR: { value: Math.min(gl.getPixelRatio(), 2) },
      uOpacity: { value: 1 },
    }),
    [gl],
  )
  useFrame((state) => {
    const u = mat.current.uniforms
    u.uTime.value = sceneState.reduced ? 4 : state.clock.elapsedTime
    u.uA.value.copy(rig.accent)
    u.uB.value.copy(rig.accent2)
    u.uOpacity.value = damp(u.uOpacity.value, 0.45 + rig.beams * 0.55, 3, 1 / 60)
  })
  return (
    <points geometry={geo} frustumCulled={false} renderOrder={-7}>
      <shaderMaterial
        ref={mat}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        vertexShader={/* glsl */ `
          attribute float aSeed;
          uniform float uTime; uniform float uPR;
          varying float vSeed; varying float vTw;
          void main(){
            vec3 p = position;
            p.x += sin(uTime * 0.05 + aSeed * 40.0) * 0.6;
            p.y += sin(uTime * 0.07 + aSeed * 23.0) * 0.3;
            vec4 mv = modelViewMatrix * vec4(p, 1.0);
            gl_Position = projectionMatrix * mv;
            gl_PointSize = (90.0 + aSeed * 160.0) * uPR * 7.0 / -mv.z;
            vSeed = aSeed;
            vTw = 0.7 + 0.3 * fract(aSeed * 13.7);
          }`}
        fragmentShader={/* glsl */ `
          uniform vec3 uA; uniform vec3 uB; uniform float uOpacity;
          varying float vSeed; varying float vTw;
          void main(){
            float d = length(gl_PointCoord - 0.5) * 2.0;
            if (d > 1.0) discard;
            float disc = smoothstep(1.0, 0.82, d);
            float ring = smoothstep(0.7, 0.95, d) * disc;
            vec3 col = vSeed < 0.5 ? uA : (vSeed < 0.85 ? uB : vec3(1.0, 0.95, 0.9));
            float a = (disc * 0.55 + ring * 0.45) * vTw * uOpacity * (0.05 + vSeed * 0.06);
            gl_FragColor = vec4(col * a, a);
          }`}
      />
    </points>
  )
}

/* ------------------------------- Confetti ------------------------------- */

export function Confetti() {
  const COUNT = sceneState.lowPower ? 140 : 280
  const mat = useRef<THREE.ShaderMaterial>(null!)
  const geo = useMemo(() => {
    const base = new THREE.PlaneGeometry(0.07, 0.13)
    const g = new THREE.InstancedBufferGeometry()
    g.index = base.index
    g.setAttribute('position', base.attributes.position)
    g.setAttribute('uv', base.attributes.uv)
    const off = new Float32Array(COUNT * 3)
    const seed = new Float32Array(COUNT * 4)
    for (let i = 0; i < COUNT; i++) {
      off[i * 3] = (Math.random() - 0.5) * 18
      off[i * 3 + 1] = Math.random() * 12
      off[i * 3 + 2] = -6.5 + Math.random() * 5.4 // stays behind the bottle
      seed[i * 4] = Math.random()
      seed[i * 4 + 1] = Math.random()
      seed[i * 4 + 2] = Math.random()
      seed[i * 4 + 3] = Math.random() // density threshold
    }
    g.setAttribute('aOffset', new THREE.InstancedBufferAttribute(off, 3))
    g.setAttribute('aSeed', new THREE.InstancedBufferAttribute(seed, 4))
    g.instanceCount = COUNT
    return g
  }, [COUNT])
  useEffect(() => () => geo.dispose(), [geo])
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uA: { value: rig.accent.clone() },
      uB: { value: rig.accent2.clone() },
      uDensity: { value: 0.6 },
    }),
    [],
  )
  useFrame((state) => {
    const u = mat.current.uniforms
    u.uTime.value = sceneState.reduced ? 3 : state.clock.elapsedTime
    u.uA.value.copy(rig.accent)
    u.uB.value.copy(rig.accent2)
    u.uDensity.value = damp(u.uDensity.value, rig.confetti, 2.5, 1 / 60)
  })
  return (
    <mesh geometry={geo} frustumCulled={false} renderOrder={-3}>
      <shaderMaterial
        ref={mat}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        side={THREE.DoubleSide}
        vertexShader={/* glsl */ `
          attribute vec3 aOffset; attribute vec4 aSeed;
          uniform float uTime; uniform float uDensity;
          varying float vGlint; varying float vPick; varying float vAlpha;
          mat3 rot(vec3 a, float ang){
            a = normalize(a); float s = sin(ang), c = cos(ang), oc = 1.0 - c;
            return mat3(oc*a.x*a.x + c, oc*a.x*a.y + a.z*s, oc*a.z*a.x - a.y*s,
                        oc*a.x*a.y - a.z*s, oc*a.y*a.y + c, oc*a.y*a.z + a.x*s,
                        oc*a.z*a.x + a.y*s, oc*a.y*a.z - a.x*s, oc*a.z*a.z + c);
          }
          void main(){
            float sp = 0.25 + aSeed.x * 0.35;
            vec3 c = aOffset;
            c.y = mod(c.y - uTime * sp, 12.0) - 6.0;
            c.x += sin(uTime * (0.4 + aSeed.y) + aSeed.z * 20.0) * 0.35;
            float ang = uTime * (1.5 + aSeed.y * 2.5) + aSeed.z * 30.0;
            mat3 R = rot(vec3(aSeed.x - 0.5, 1.0, aSeed.z - 0.5), ang);
            vec3 p = R * position * (0.7 + aSeed.y * 0.6);
            vec3 n = R * vec3(0.0, 0.0, 1.0);
            vec4 mv = modelViewMatrix * vec4(c + p, 1.0);
            gl_Position = projectionMatrix * mv;
            vGlint = pow(abs(n.z), 6.0);
            vPick = aSeed.z;
            float edge = smoothstep(-6.0, -4.5, c.y) * (1.0 - smoothstep(4.0, 6.0, c.y));
            vAlpha = step(aSeed.w, uDensity) * edge;
          }`}
        fragmentShader={/* glsl */ `
          uniform vec3 uA; uniform vec3 uB;
          varying float vGlint; varying float vPick; varying float vAlpha;
          void main(){
            if (vAlpha < 0.01) discard;
            vec3 col = vPick < 0.42 ? uA : (vPick < 0.74 ? uB : (vPick < 0.9 ? vec3(0.95) : mix(uA, uB, 0.5)));
            col *= 0.5 + vGlint * 0.45;
            gl_FragColor = vec4(col, 0.85 * vAlpha);
          }`}
      />
    </mesh>
  )
}

export function Party() {
  return (
    <>
      <Bokeh />
      <Confetti />
    </>
  )
}
