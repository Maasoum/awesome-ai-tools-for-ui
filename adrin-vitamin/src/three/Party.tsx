import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { rig } from './poses'
import { sceneState } from '../lib/sceneState'

const crowdUrl = `${import.meta.env.BASE_URL}images/crowd-mask.webp`

/*
 * The party layer: stage beams, out-of-focus bokeh, confetti and a backlit crowd.
 * Every colour reads from rig.accent / rig.accent2, so the whole venue relights
 * when a different flavour is picked.
 */

const damp = THREE.MathUtils.damp

/* ------------------------------ Stage beams ------------------------------ */

export function StageBeams() {
  const COUNT = sceneState.lowPower ? 4 : 6
  const L = 15
  const group = useRef<THREE.Group>(null!)
  const geo = useMemo(() => {
    const g = new THREE.CylinderGeometry(0.05, 1.5, L, 40, 1, true)
    g.translate(0, -L / 2, 0) // apex at origin
    return g
  }, [])
  const beams = useMemo(
    () =>
      Array.from({ length: COUNT }, (_, i) => {
        const t = i / (COUNT - 1)
        return {
          x: THREE.MathUtils.lerp(-7.5, 7.5, t),
          z: -6 - (i % 2) * 1.2,
          base: (t - 0.5) * -0.9,
          amp: 0.22 + (i % 3) * 0.08,
          speed: 0.22 + ((i * 37) % 10) * 0.018,
          phase: i * 1.7,
          second: i % 2 === 1,
        }
      }),
    [COUNT],
  )
  const mats = useMemo(
    () =>
      beams.map(
        () =>
          new THREE.ShaderMaterial({
            uniforms: { uColor: { value: new THREE.Color() }, uIntensity: { value: 0 } },
            transparent: true,
            depthWrite: false,
            side: THREE.DoubleSide,
            blending: THREE.AdditiveBlending,
            vertexShader: /* glsl */ `
              varying vec2 vUv; varying vec3 vN; varying vec3 vV;
              void main(){
                vUv = uv;
                vec4 mv = modelViewMatrix * vec4(position, 1.0);
                vN = normalize(normalMatrix * normal);
                vV = normalize(-mv.xyz);
                gl_Position = projectionMatrix * mv;
              }`,
            fragmentShader: /* glsl */ `
              uniform vec3 uColor; uniform float uIntensity;
              varying vec2 vUv; varying vec3 vN; varying vec3 vV;
              void main(){
                float facing = pow(abs(dot(normalize(vN), normalize(vV))), 1.4);
                float along = pow(vUv.y, 1.1) * smoothstep(0.0, 0.3, vUv.y);
                float a = facing * along * uIntensity;
                gl_FragColor = vec4(uColor * a, a);
              }`,
          }),
      ),
    [beams],
  )
  useEffect(
    () => () => {
      geo.dispose()
      mats.forEach((m) => m.dispose())
    },
    [geo, mats],
  )

  const tmp = useMemo(() => new THREE.Color(), [])
  useFrame((state) => {
    const t = sceneState.reduced ? 0 : state.clock.elapsedTime
    const halfW = Math.max(rig.halfW, 3)
    group.current.children.forEach((m, i) => {
      const b = beams[i]
      m.position.set(b.x * (halfW / 6.5), 7.6, b.z)
      m.rotation.z = b.base + Math.sin(t * b.speed + b.phase) * b.amp
      m.rotation.x = 0.18 + Math.sin(t * b.speed * 0.7 + b.phase) * 0.08
      const mat = mats[i]
      tmp.copy(b.second ? rig.accent2 : rig.accent)
      mat.uniforms.uColor.value.copy(tmp)
      // gentle, slow shimmer — no strobing
      const flicker = 0.8 + 0.2 * Math.sin(t * 0.9 + b.phase * 2.0)
      mat.uniforms.uIntensity.value = damp(mat.uniforms.uIntensity.value, 0.42 * rig.beams * flicker, 3, 1 / 60)
    })
  })

  return (
    <group ref={group}>
      {beams.map((_, i) => (
        <mesh key={i} geometry={geo} material={mats[i]} renderOrder={-6} frustumCulled={false} />
      ))}
    </group>
  )
}

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
            vTw = 0.6 + 0.4 * sin(uTime * (0.3 + aSeed * 0.6) + aSeed * 60.0);
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
            col *= 0.35 + vGlint * 1.1;
            gl_FragColor = vec4(col, 0.85 * vAlpha);
          }`}
      />
    </mesh>
  )
}

/* -------------------------------- Crowd -------------------------------- */

export function Crowd() {
  const mesh = useRef<THREE.Mesh>(null!)
  const tex = useMemo(() => {
    const t = new THREE.TextureLoader().load(crowdUrl)
    t.wrapS = THREE.MirroredRepeatWrapping
    t.wrapT = THREE.ClampToEdgeWrapping
    t.colorSpace = THREE.NoColorSpace
    t.anisotropy = 4
    return t
  }, [])
  const ASPECT = 2048 / 869
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uTex: { value: tex },
          uRepeat: { value: 1 },
          uA: { value: rig.accent.clone() },
          uB: { value: rig.accent2.clone() },
          uOpacity: { value: 1 },
          uTime: { value: 0 },
        },
        transparent: true,
        depthWrite: false,
        vertexShader: /* glsl */ `
          varying vec2 vUv;
          void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
        fragmentShader: /* glsl */ `
          uniform sampler2D uTex; uniform float uRepeat; uniform vec3 uA; uniform vec3 uB; uniform float uOpacity; uniform float uTime;
          varying vec2 vUv;
          void main(){
            vec2 uv = vec2((vUv.x - 0.5) * uRepeat + 0.5, vUv.y);
            float m = texture2D(uTex, uv).r;
            float above = texture2D(uTex, uv + vec2(0.0, 0.006)).r;
            float alpha = smoothstep(0.25, 0.55, m);
            float front = smoothstep(0.78, 0.93, m);
            // back row catches stage light, front row is pure silhouette
            vec3 lightCol = mix(uA, uB, 0.5 + 0.5 * sin(vUv.x * 9.0 + uTime * 0.4));
            vec3 col = mix(lightCol * 0.10 + vec3(0.006), vec3(0.003, 0.002, 0.004), front);
            // backlit rim along the heads and raised hands
            float rim = clamp((m - above) * 2.4, 0.0, 1.0);
            col += mix(uA, lightCol, 0.4) * rim * 0.9;
            // fade into the floor
            col *= smoothstep(-0.05, 0.35, vUv.y) * 0.8 + 0.2;
            gl_FragColor = vec4(col, max(alpha, rim) * uOpacity);
          }`,
      }),
    [tex],
  )
  useEffect(
    () => () => {
      tex.dispose()
      mat.dispose()
    },
    [tex, mat],
  )
  const Z = -4.6
  useFrame((state) => {
    const u = mat.uniforms
    u.uA.value.copy(rig.accent)
    u.uB.value.copy(rig.accent2)
    u.uTime.value = sceneState.reduced ? 0 : state.clock.elapsedTime
    u.uOpacity.value = damp(u.uOpacity.value, rig.crowd, 3, 1 / 60)
    mesh.current.visible = u.uOpacity.value > 0.01
    const cam = state.camera as THREE.PerspectiveCamera
    const dist = cam.position.z - Z
    const halfH = Math.tan(THREE.MathUtils.degToRad(cam.fov / 2)) * dist
    const halfW = halfH * cam.aspect
    const w = halfW * 2.3
    // crowd fills roughly the lower third of the frame
    const h = Math.min(halfH * 2 * (cam.aspect < 0.8 ? 0.26 : 0.36), w / ASPECT)
    u.uRepeat.value = w / (h * ASPECT)
    mesh.current.scale.set(w, h, 1)
    // sink slightly with the camera's vertical parallax for depth
    mesh.current.position.set(cam.position.x * 0.6, cam.position.y - halfH + h * 0.5 - halfH * 0.03, Z)
  })
  return (
    <mesh ref={mesh} material={mat} renderOrder={-4} frustumCulled={false}>
      <planeGeometry args={[1, 1]} />
    </mesh>
  )
}

export function Party() {
  return (
    <>
      <Bokeh />
      <StageBeams />
      <Crowd />
      <Confetti />
    </>
  )
}
