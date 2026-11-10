import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { rig } from './poses'
import { sceneState, sectionTime } from '../lib/sceneState'

const IMG_ASPECT = 2560 / 1254
const ZOOM = 1.07

/**
 * Full-screen venue photograph, colour-graded live to the selected flavour.
 * The warm stage lights of the photo take the flavour's main colour and the cool
 * spotlights its second colour, so the room relights with every drink.
 */
export function PhotoBackdrop() {
  const mat = useRef<THREE.ShaderMaterial>(null!)
  const texRef = useRef<THREE.Texture | null>(null)
  const { camera, size } = useThree()
  const uniforms = useMemo(
    () => ({
      uMap: { value: null as THREE.Texture | null },
      uReady: { value: 0 },
      uScale: { value: new THREE.Vector2(1, 1) },
      uOffset: { value: new THREE.Vector2(0, 0) },
      uColor: { value: rig.accent.clone() },
      uColor2: { value: rig.accent2.clone() },
      uStage: { value: 1 },
      uCenter: { value: new THREE.Vector2(0.5, 0.5) },
      uIntensity: { value: 1 },
    }),
    [],
  )

  useEffect(() => {
    const small = sceneState.lowPower || Math.max(window.innerWidth, window.innerHeight) < 1000
    const loader = new THREE.TextureLoader()
    let tex: THREE.Texture | null = null
    let alive = true
    loader.load(small ? '/images/venue-sm.webp' : '/images/venue.webp', (t) => {
      if (!alive) return t.dispose()
      t.colorSpace = THREE.SRGBColorSpace
      t.minFilter = THREE.LinearFilter
      t.generateMipmaps = false
      t.anisotropy = 1
      tex = t
      texRef.current = t
    })
    return () => {
      alive = false
      tex?.dispose()
      texRef.current = null
    }
  }, [])

  const v = new THREE.Vector3()
  useFrame((_, dt) => {
    const u = mat.current.uniforms
    const a = size.width / size.height
    if (a < IMG_ASPECT) u.uScale.value.set(a / IMG_ASPECT / ZOOM, 1 / ZOOM)
    else u.uScale.value.set(1 / ZOOM, IMG_ASPECT / a / ZOOM)
    const mx = (1 - u.uScale.value.x) * 0.5
    const my = (1 - u.uScale.value.y) * 0.5
    // slow drift: pointer sways it sideways, scrolling tilts the view down the room
    const st = THREE.MathUtils.clamp(sectionTime() / 5, 0, 1)
    const k = 1 - Math.exp(-dt * 2.2)
    const tx = sceneState.reduced ? 0 : sceneState.pointer.x * mx * 0.6
    const ty = sceneState.reduced ? 0 : THREE.MathUtils.lerp(my * 0.55, -my * 0.75, st) + sceneState.pointer.y * my * 0.2
    u.uOffset.value.x += (tx - u.uOffset.value.x) * k
    u.uOffset.value.y += (ty - u.uOffset.value.y) * k

    if (u.uMap.value !== texRef.current) u.uMap.value = texRef.current
    if (u.uMap.value) u.uReady.value = Math.min(1, u.uReady.value + dt * 1.2)
    u.uColor.value.copy(rig.accent)
    u.uColor2.value.copy(rig.accent2)
    u.uStage.value = THREE.MathUtils.damp(u.uStage.value, 0.45 + rig.crowd * 0.55, 3, dt)
    v.copy(rig.productWorld).project(camera)
    u.uCenter.value.set(v.x * 0.5 + 0.5, v.y * 0.5 + 0.5)
    u.uIntensity.value = rig.glow
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
          uniform sampler2D uMap; uniform float uReady;
          uniform vec2 uScale; uniform vec2 uOffset;
          uniform vec3 uColor; uniform vec3 uColor2;
          uniform float uStage; uniform vec2 uCenter; uniform float uIntensity;
          varying vec2 vUv;
          void main(){
            vec3 base = vec3(0.0085, 0.0052, 0.0115);
            vec2 uv = (vUv - 0.5) * uScale + 0.5 + uOffset;
            vec3 t = texture2D(uMap, uv).rgb;
            float l = dot(t, vec3(0.2126, 0.7152, 0.0722));
            // warm stage wash -> flavour colour, cool spotlights -> second flavour colour
            float warm = smoothstep(-0.02, 0.10, t.r - t.b);
            vec3 tint = mix(uColor2, uColor, warm);
            float m = pow(l, 0.8);
            vec3 col = tint * m * 1.0;
            // hot lamp cores bloom towards a pale version of the tint
            col = mix(col, mix(tint, vec3(1.0), 0.3) * 0.8, smoothstep(0.45, 1.0, l));
            // a little of the original photo keeps faces and textures readable
            col += t * 0.06;
            col *= 0.5 * uStage;
            // keep the bottle zone clean: soft accent halo behind the product
            vec2 d = vUv - uCenter; d.x *= 1.6;
            col += uColor * exp(-dot(d, d) * 12.0) * 0.035 * uIntensity;
            // vignette + darker floor so copy stays legible
            col *= 1.0 - 0.55 * smoothstep(0.2, 0.95, length((vUv - 0.5) * vec2(1.25, 1.0)));
            col *= mix(0.55, 1.0, smoothstep(0.0, 0.45, vUv.y));
            gl_FragColor = vec4(mix(base, base + col, uReady), 1.0);
          }`}
      />
    </mesh>
  )
}
