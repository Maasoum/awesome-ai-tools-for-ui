import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { rig } from './poses'
import { getAssets } from './assets'
import { sceneState } from '../lib/sceneState'

/* ---------------- Energy particles (GPU animated points) ---------------- */

export function EnergyParticles() {
  const COUNT = sceneState.lowPower ? 900 : 2200
  const { gl } = useThree()
  const mat = useRef<THREE.ShaderMaterial>(null!)
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry()
    const p = new Float32Array(COUNT * 3)
    const s = new Float32Array(COUNT)
    for (let i = 0; i < COUNT; i++) {
      // denser near the centre, spread wide in x
      const r = 0.9 + Math.pow(Math.random(), 1.4) * 7
      const a = Math.random() * Math.PI * 2
      p[i * 3] = Math.cos(a) * r * 1.3
      p[i * 3 + 1] = (Math.random() - 0.5) * 12
      p[i * 3 + 2] = Math.sin(a) * r * 0.8 - 1.5
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
      uOpacity: { value: 0.5 },
      uColor: { value: rig.accent.clone() },
      uPR: { value: Math.min(gl.getPixelRatio(), 2) },
      uSpeed: { value: 1 },
    }),
    [gl],
  )

  useFrame((state) => {
    const u = mat.current.uniforms
    u.uTime.value = sceneState.reduced ? 12 : state.clock.elapsedTime
    u.uOpacity.value = THREE.MathUtils.damp(u.uOpacity.value, rig.particles, 3, 1 / 60)
    u.uColor.value.copy(rig.accent)
    u.uSpeed.value = 0.6 + rig.swirl * 1.4
  })

  return (
    <points geometry={geo} frustumCulled={false}>
      <shaderMaterial
        ref={mat}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        vertexShader={/* glsl */ `
          attribute float aSeed;
          uniform float uTime; uniform float uOpacity; uniform float uPR; uniform float uSpeed;
          varying float vA; varying float vHot;
          void main(){
            vec3 p = position;
            float t = uTime * (0.08 + aSeed * 0.12) * uSpeed;
            p.y = mod(p.y + t * 2.0 + 6.0, 12.0) - 6.0;
            float sw = uTime * 0.08 * (0.5 + aSeed);
            float c = cos(sw), s = sin(sw);
            p.xz = mat2(c, -s, s, c) * p.xz;
            p.x += sin(uTime * 0.35 + aSeed * 31.0) * 0.18;
            vec4 mv = modelViewMatrix * vec4(p, 1.0);
            gl_Position = projectionMatrix * mv;
            float size = (aSeed > 0.93 ? 2.6 : 1.0) * (0.6 + aSeed * 0.9);
            gl_PointSize = size * uPR * 34.0 / -mv.z;
            float tw = 0.55 + 0.45 * sin(uTime * (1.5 + aSeed * 3.0) + aSeed * 50.0);
            float edge = smoothstep(-6.0, -4.5, p.y) * (1.0 - smoothstep(4.5, 6.0, p.y));
            float near = smoothstep(0.6, 2.5, -mv.z);
            vA = uOpacity * tw * edge * near;
            vHot = step(0.93, aSeed);
          }`}
        fragmentShader={/* glsl */ `
          uniform vec3 uColor; varying float vA; varying float vHot;
          void main(){
            vec2 c = gl_PointCoord - 0.5;
            float d = length(c);
            float core = smoothstep(0.5, 0.0, d);
            core = pow(core, 2.4);
            vec3 col = mix(uColor, vec3(1.0), core * (0.35 + vHot * 0.4));
            gl_FragColor = vec4(col * 1.4, core * vA);
          }`}
      />
    </points>
  )
}

/* -------------- Floating condensation droplets around the bottle -------------- */

function makeDropSprite() {
  const S = 128
  const c = document.createElement('canvas')
  c.width = c.height = S
  const ctx = c.getContext('2d')!
  const r = S * 0.42
  ctx.translate(S / 2, S / 2)
  // refractive body: faint, darker core with a lit rim
  const body = ctx.createRadialGradient(0, 0, r * 0.2, 0, 0, r)
  body.addColorStop(0, 'rgba(255,255,255,0.03)')
  body.addColorStop(0.75, 'rgba(255,255,255,0.08)')
  body.addColorStop(0.93, 'rgba(255,255,255,0.55)')
  body.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = body
  ctx.beginPath()
  ctx.arc(0, 0, r, 0, Math.PI * 2)
  ctx.fill()
  // caustic crescent at the bottom
  ctx.strokeStyle = 'rgba(255,255,255,0.55)'
  ctx.lineWidth = S * 0.05
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.arc(0, 0, r * 0.72, Math.PI * 0.2, Math.PI * 0.8)
  ctx.stroke()
  // specular hotspot
  const spec = ctx.createRadialGradient(-r * 0.38, -r * 0.42, 0, -r * 0.38, -r * 0.42, r * 0.3)
  spec.addColorStop(0, 'rgba(255,255,255,1)')
  spec.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = spec
  ctx.beginPath()
  ctx.arc(-r * 0.38, -r * 0.42, r * 0.3, 0, Math.PI * 2)
  ctx.fill()
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  return t
}

export function AirDroplets() {
  const COUNT = sceneState.lowPower ? 22 : 48
  const { gl } = useThree()
  const mat = useRef<THREE.ShaderMaterial>(null!)
  const pts = useRef<THREE.Points>(null!)
  const { geo, tex } = useMemo(() => {
    const g = new THREE.BufferGeometry()
    const p = new Float32Array(COUNT * 3)
    const s = new Float32Array(COUNT)
    const ph = new Float32Array(COUNT)
    for (let i = 0; i < COUNT; i++) {
      const a = Math.random() * Math.PI * 2
      const r = 1.05 + Math.random() * 2.6
      p[i * 3] = Math.cos(a) * r * 1.25
      p[i * 3 + 1] = (Math.random() - 0.5) * 4
      p[i * 3 + 2] = Math.sin(a) * r * 0.6 + 0.5
      s[i] = 0.25 + Math.pow(Math.random(), 2.2) * 1.1
      ph[i] = Math.random() * 10
    }
    g.setAttribute('position', new THREE.BufferAttribute(p, 3))
    g.setAttribute('aSize', new THREE.BufferAttribute(s, 1))
    g.setAttribute('aPhase', new THREE.BufferAttribute(ph, 1))
    return { geo: g, tex: makeDropSprite() }
  }, [COUNT])
  useEffect(
    () => () => {
      geo.dispose()
      tex.dispose()
    },
    [geo, tex],
  )
  const uniforms = useMemo(
    () => ({ uTex: { value: tex }, uTime: { value: 0 }, uOpacity: { value: 1 }, uPR: { value: Math.min(gl.getPixelRatio(), 2) }, uTint: { value: rig.accent.clone() } }),
    [tex, gl],
  )

  useFrame((state) => {
    const vis = rig.drops
    pts.current.visible = vis > 0.02
    if (!pts.current.visible) return
    const u = mat.current.uniforms
    u.uTime.value = sceneState.reduced ? 0 : state.clock.elapsedTime
    u.uOpacity.value = vis
    u.uTint.value.copy(rig.accent)
    pts.current.position.set(rig.productWorld.x, rig.productWorld.y, 0)
  })

  return (
    <points ref={pts} geometry={geo} frustumCulled={false}>
      <shaderMaterial
        ref={mat}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        vertexShader={/* glsl */ `
          attribute float aSize; attribute float aPhase;
          uniform float uTime; uniform float uPR;
          varying float vFade;
          void main(){
            vec3 p = position;
            p.x += sin(uTime * 0.3 + aPhase) * 0.08;
            p.y += sin(uTime * 0.22 + aPhase * 2.0) * 0.14;
            vec4 mv = modelViewMatrix * vec4(p, 1.0);
            gl_Position = projectionMatrix * mv;
            gl_PointSize = aSize * uPR * 60.0 / -mv.z;
            vFade = smoothstep(1.0, 3.0, -mv.z);
          }`}
        fragmentShader={/* glsl */ `
          uniform sampler2D uTex; uniform float uOpacity; uniform vec3 uTint;
          varying float vFade;
          void main(){
            vec4 t = texture2D(uTex, gl_PointCoord);
            vec3 col = mix(vec3(1.0), uTint, 0.25) * t.rgb;
            gl_FragColor = vec4(col, t.a * uOpacity * vFade * 0.85);
          }`}
      />
    </points>
  )
}

/* ------------------------------- Smoke ------------------------------- */

export function Smoke() {
  const { smoke } = getAssets()
  const group = useRef<THREE.Group>(null!)
  const puffs = useMemo(
    () =>
      Array.from({ length: sceneState.lowPower ? 5 : 9 }, (_, i) => ({
        x: (Math.random() - 0.5) * 9,
        y: -2.2 + Math.random() * 3.5,
        z: -3.5 + Math.random() * 3,
        s: 4 + Math.random() * 5,
        r: Math.random() * Math.PI,
        sp: (Math.random() - 0.5) * 0.06,
        o: 0.035 + Math.random() * 0.045,
        drift: 0.05 + Math.random() * 0.1,
        i,
      })),
    [],
  )
  const mats = useMemo(
    () =>
      puffs.map(
        (p) =>
          new THREE.MeshBasicMaterial({
            map: smoke,
            transparent: true,
            opacity: p.o,
            depthWrite: false,
            color: '#9aa3a3',
          }),
      ),
    [puffs, smoke],
  )
  const plane = useMemo(() => new THREE.PlaneGeometry(1, 1), [])
  useEffect(
    () => () => {
      mats.forEach((m) => m.dispose())
      plane.dispose()
    },
    [mats, plane],
  )

  useFrame((state) => {
    const t = sceneState.reduced ? 0 : state.clock.elapsedTime
    group.current.children.forEach((m, i) => {
      const p = puffs[i]
      m.rotation.z = p.r + t * p.sp
      m.position.x = p.x + Math.sin(t * p.drift + i) * 0.6
      const mat = mats[i]
      // tint smoke very slightly with the accent
      mat.color.setRGB(0.5, 0.54, 0.54).lerp(rig.accent, 0.1)
      mat.opacity = p.o * (0.7 + rig.glow * 0.3)
    })
  })

  return (
    <group ref={group}>
      {puffs.map((p, i) => (
        <mesh key={p.i} geometry={plane} material={mats[i]} position={[p.x, p.y, p.z]} scale={p.s} />
      ))}
    </group>
  )
}

/* ------------------------------ Backdrop ------------------------------ */

export function Backdrop() {
  const mat = useRef<THREE.ShaderMaterial>(null!)
  const { camera } = useThree()
  const uniforms = useMemo(
    () => ({
      uColor: { value: rig.accent.clone() },
      uColor2: { value: rig.accent2.clone() },
      uStage: { value: 1 },
      uCenter: { value: new THREE.Vector2(0.5, 0.5) },
      uIntensity: { value: 1 },
      uTime: { value: 0 },
    }),
    [],
  )
  const v = new THREE.Vector3()
  useFrame((state) => {
    const u = mat.current.uniforms
    u.uColor.value.copy(rig.accent)
    u.uColor2.value.copy(rig.accent2)
    u.uStage.value = THREE.MathUtils.damp(u.uStage.value, 0.35 + rig.crowd * 0.65, 3, 1 / 60)
    v.copy(rig.productWorld).project(camera)
    u.uCenter.value.set(v.x * 0.5 + 0.5, v.y * 0.5 + 0.5)
    u.uIntensity.value = rig.glow
    u.uTime.value = state.clock.elapsedTime
  })
  return (
    <mesh renderOrder={-10} frustumCulled={false}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        ref={mat}
        uniforms={uniforms}
        depthWrite={false}
        depthTest={false}
        vertexShader={/* glsl */ `
          varying vec2 vUv;
          void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.9999, 1.0); }`}
        fragmentShader={/* glsl */ `
          uniform vec3 uColor; uniform vec3 uColor2; uniform float uStage; uniform vec2 uCenter; uniform float uIntensity; uniform float uTime;
          varying vec2 vUv;
          float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233))) * 43758.5453); }
          void main(){
            // club darkness: near-black with a violet cast
            vec3 base = vec3(0.0085, 0.0052, 0.0115);
            vec2 d = vUv - uCenter; d.x *= 1.6;
            float g = exp(-dot(d,d) * 3.2);
            float halo = exp(-dot(d,d) * 14.0);
            vec3 col = base + uColor * (g * 0.022 + halo * 0.04) * uIntensity;
            // stage glow rising behind the crowd
            float band = exp(-pow((vUv.y - 0.2) / 0.17, 2.0));
            float pulse = 0.85 + 0.15 * sin(uTime * 1.3);
            col += uColor * band * 0.05 * uStage * pulse * (0.6 + 0.4 * (1.0 - abs(vUv.x - 0.5) * 1.4));
            // coloured haze in the upper corners (secondary light rig)
            col += uColor2 * 0.018 * uStage * (exp(-dot(vUv - vec2(0.05, 1.0), vUv - vec2(0.05, 1.0)) * 6.0) + exp(-dot(vUv - vec2(0.95, 1.0), vUv - vec2(0.95, 1.0)) * 6.0));
            col *= 1.0 - 0.35 * smoothstep(0.2, 0.9, length(vUv - 0.5));
            col += (hash(vUv * 900.0 + uTime) - 0.5) * 0.004;
            gl_FragColor = vec4(col, 1.0);
          }`}
      />
    </mesh>
  )
}

/* ---------------------- Final-shot giant wordmark ---------------------- */

export function BigType() {
  const { bigType } = getAssets()
  const mesh = useRef<THREE.Mesh>(null!)
  const mat = useMemo(
    () => new THREE.MeshBasicMaterial({ map: bigType.texture, transparent: true, depthWrite: false, toneMapped: false, opacity: 0 }),
    [bigType],
  )
  useEffect(() => () => mat.dispose(), [mat])
  useFrame(() => {
    const o = rig.bigType
    mesh.current.visible = o > 0.01
    if (!mesh.current.visible) return
    // fit to viewport at z = -3
    const dist = 3 + 7.8
    const halfH = (rig.halfH / 7.8) * dist
    const halfW = (rig.halfW / 7.8) * dist
    const w = Math.min(halfW * 2 * 0.98, halfH * 2 * bigType.aspect * 0.9)
    mesh.current.scale.set(w, w / bigType.aspect, 1)
    mesh.current.position.set(0, rig.productWorld.y * 0.4 + halfH * 0.02, -3)
    mat.opacity = o * 0.85
    // neon tube: takes the colour of the selected flavour
    mat.color.copy(rig.accent).multiplyScalar(1.35)
  })
  return (
    <mesh ref={mesh} material={mat} renderOrder={-5}>
      <planeGeometry args={[1, 1]} />
    </mesh>
  )
}
