import { useMemo, useRef, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { rig } from './poses'
import { sceneState } from '../lib/sceneState'

const dummy = new THREE.Object3D()

/** Liquid droplets + carbonation bubbles flung outwards by the energy burst. */
export function BurstDroplets() {
  const drops = useRef<THREE.InstancedMesh>(null!)
  const bubbles = useRef<THREE.InstancedMesh>(null!)
  const COUNT = sceneState.lowPower ? 40 : 80
  const BUB = sceneState.lowPower ? 50 : 110

  const data = useMemo(() => {
    const r = Math.random
    const d = Array.from({ length: COUNT }, () => {
      const dir = new THREE.Vector3(r() * 2 - 1, (r() * 2 - 1) * 0.75, r() * 2 - 1).normalize()
      return { dir, base: 0.75 + r() * 0.35, travel: 0.8 + r() * 2.6, size: 0.016 + Math.pow(r(), 2.4) * 0.05, phase: r() * 10, stretch: 1 + r() * 0.5 }
    })
    const b = Array.from({ length: BUB }, () => ({
      a: r() * Math.PI * 2,
      rad: 0.75 + r() * 1.7,
      speed: 0.25 + r() * 0.55,
      off: r() * 6,
      size: 0.01 + Math.pow(r(), 2) * 0.035,
      wob: r() * 10,
    }))
    return { d, b }
  }, [COUNT, BUB])

  const liquidMat = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: '#B6FF00',
        roughness: 0.03,
        clearcoat: 1,
        clearcoatRoughness: 0.02,
        emissive: '#B6FF00',
        emissiveIntensity: 0.35,
        envMapIntensity: 2.4,
        transparent: true,
        opacity: 0.9,
      }),
    [],
  )
  const bubbleMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: { uColor: { value: new THREE.Color('#B6FF00') }, uOpacity: { value: 0 } },
        vertexShader: /* glsl */ `
          varying vec3 vN; varying vec3 vV;
          void main(){
            vec4 mv = modelViewMatrix * instanceMatrix * vec4(position,1.0);
            vN = normalize(normalMatrix * mat3(instanceMatrix) * normal);
            vV = normalize(-mv.xyz);
            gl_Position = projectionMatrix * mv;
          }`,
        fragmentShader: /* glsl */ `
          uniform vec3 uColor; uniform float uOpacity;
          varying vec3 vN; varying vec3 vV;
          void main(){
            float f = pow(1.0 - abs(dot(vN, vV)), 2.5);
            vec3 c = mix(vec3(1.0), uColor, 0.55) * (0.25 + f * 1.6);
            float spec = pow(max(dot(reflect(-vV, vN), normalize(vec3(-0.4,0.8,0.5))), 0.0), 40.0);
            gl_FragColor = vec4(c + spec, (f * 0.9 + spec) * uOpacity);
          }`,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    [],
  )
  const sphere = useMemo(() => new THREE.SphereGeometry(1, 20, 14), [])
  const bubbleGeo = useMemo(() => new THREE.SphereGeometry(1, 14, 10), [])
  useEffect(
    () => () => {
      liquidMat.dispose()
      bubbleMat.dispose()
      sphere.dispose()
      bubbleGeo.dispose()
    },
    [liquidMat, bubbleMat, sphere, bubbleGeo],
  )

  useFrame((state) => {
    const vis = rig.swirl
    const on = vis > 0.03
    drops.current.visible = on
    bubbles.current.visible = on
    if (!on) return
    const time = sceneState.reduced ? 0 : state.clock.elapsedTime
    const burst = 0.25 + rig.burst * 0.75
    liquidMat.color.copy(rig.accent)
    liquidMat.emissive.copy(rig.accent)
    bubbleMat.uniforms.uColor.value.copy(rig.accent)
    bubbleMat.uniforms.uOpacity.value = vis

    data.d.forEach((p, i) => {
      const k = THREE.MathUtils.smoothstep(vis, 0.2, 1)
      const dist = p.base + p.travel * burst * k
      dummy.position.copy(p.dir).multiplyScalar(dist)
      dummy.position.y += Math.sin(time * 0.6 + p.phase) * 0.06 - burst * 0.15 * p.travel * 0.2
      dummy.rotation.set(0, 0, Math.atan2(p.dir.y, p.dir.x))
      const s = p.size * k
      dummy.scale.set(s * p.stretch, s, s)
      dummy.updateMatrix()
      drops.current.setMatrixAt(i, dummy.matrix)
    })
    drops.current.instanceMatrix.needsUpdate = true

    data.b.forEach((b, i) => {
      const y = ((time * b.speed + b.off) % 5) - 2.4
      const a = b.a + time * 0.1
      dummy.position.set(Math.cos(a) * b.rad + Math.sin(time + b.wob) * 0.04, y, Math.sin(a) * b.rad)
      dummy.rotation.set(0, 0, 0)
      const fade = THREE.MathUtils.smoothstep(y, -2.4, -1.8) * (1 - THREE.MathUtils.smoothstep(y, 2.0, 2.6))
      dummy.scale.setScalar(b.size * fade * vis)
      dummy.updateMatrix()
      bubbles.current.setMatrixAt(i, dummy.matrix)
    })
    bubbles.current.instanceMatrix.needsUpdate = true
  })

  return (
    <>
      <instancedMesh ref={drops} args={[sphere, liquidMat, COUNT]} frustumCulled={false} />
      <instancedMesh ref={bubbles} args={[bubbleGeo, bubbleMat, BUB]} frustumCulled={false} />
    </>
  )
}
