import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { gsap } from 'gsap'
import { buildCan } from './buildCan'
import { getAssets } from './assets'
import { getPoses, lerpPose, rig, ENTER_FROM, type Pose } from './poses'
import { sceneState, sectionTime } from '../lib/sceneState'
import { flavorById } from '../lib/flavors'
import { useUI } from '../store/ui'
import { LiquidSwirl } from './LiquidSwirl'
import { BurstDroplets } from './BurstDroplets'

const TAU = Math.PI * 2
const damp = THREE.MathUtils.damp

export function CanRig() {
  const { camera, size } = useThree()
  const assets = getAssets()
  const initialFlavor = useUI.getState().flavor
  const can = useMemo(
    () =>
      buildCan({
        labelA: assets.labels[initialFlavor],
        condensation: assets.condensation,
        accent: flavorById(initialFlavor).accent,
        quality: sceneState.lowPower ? 'low' : 'high',
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )
  useEffect(() => () => can.dispose(), [can])

  const pos = useRef<THREE.Group>(null!)
  const tilt = useRef<THREE.Group>(null!)
  const spin = useRef<THREE.Group>(null!)
  const rimL = useRef<THREE.PointLight>(null!)
  const rimR = useRef<THREE.PointLight>(null!)
  const under = useRef<THREE.PointLight>(null!)

  const poses = useMemo(() => getPoses(size.width / size.height), [size.width, size.height])
  const cur = useRef<Pose>({ ...poses[0] })
  const target = useRef<Pose>({ ...poses[0] })
  const idle = useRef(0)
  const boost = useRef({ v: 0 })
  const accentTarget = useRef(new THREE.Color(flavorById(initialFlavor).accent))
  const first = useRef(true)

  // flavour switching: scan-wipe the label + spin boost
  useEffect(() => {
    let tween: gsap.core.Tween | null = null
    let pendingId = initialFlavor
    const unsub = useUI.subscribe((s, prev) => {
      if (s.flavor === prev.flavor) return
      const f = flavorById(s.flavor)
      const u = can.uniforms
      if (tween) {
        // finish the running transition instantly
        tween.kill()
        can.setLabelA(assets.labels[pendingId])
        u.uAccentA.value.copy(u.uAccentB.value)
      }
      pendingId = s.flavor
      u.uLabelB.value = assets.labels[s.flavor]
      u.uAccentB.value.set(f.accent)
      accentTarget.current.set(f.accent)
      u.uWipeActive.value = 1
      const reduced = sceneState.reduced
      tween = gsap.fromTo(
        u.uWipe,
        { value: -0.06 },
        {
          value: 1.06,
          duration: reduced ? 0.01 : 1.15,
          ease: 'power2.inOut',
          onComplete: () => {
            can.setLabelA(assets.labels[s.flavor])
            u.uAccentA.value.set(f.accent)
            u.uWipe.value = -0.2
            u.uWipeActive.value = 0
            tween = null
          },
        },
      )
      if (!reduced) gsap.to(boost.current, { v: `+=${TAU}`, duration: 1.4, ease: 'power3.inOut' })
    })
    return () => {
      unsub()
      tween?.kill()
    }
  }, [can, assets, initialFlavor])

  useFrame((state, dtRaw) => {
    const dt = Math.min(dtRaw, 1 / 20)
    const reduced = sceneState.reduced
    const t = sectionTime()
    const n = poses.length
    const i = Math.min(Math.floor(t), n - 1)
    const fRaw = Math.min(1, t - i)
    const f = fRaw * fRaw * (3 - 2 * fRaw)
    const B = poses[Math.min(i + 1, n - 1)]
    let A = poses[i]
    const enter = ENTER_FROM[i + 1]
    if (enter && fRaw > 0.001) A = { ...B, ...enter }
    lerpPose(A, B, f, target.current)
    // the formula section adds a slow scrubbed half turn while pinned
    target.current.turn += sceneState.formula * Math.PI

    const P = cur.current
    const lambda = reduced ? 20 : 3.2
    if (first.current) {
      Object.assign(P, target.current)
      first.current = false
    } else {
      for (const k of Object.keys(P) as (keyof Pose)[]) P[k] = damp(P[k], target.current[k], lambda, dt)
    }

    // layout in screen-relative units
    const persp = camera as THREE.PerspectiveCamera
    const halfH = Math.tan(THREE.MathUtils.degToRad(persp.fov / 2)) * P.camZ
    const halfW = halfH * persp.aspect
    rig.halfH = halfH
    rig.halfW = halfW

    const time = state.clock.elapsedTime
    const floatY = reduced ? 0 : Math.sin(time * 0.9) * 0.07
    pos.current.position.set(P.x * halfW, P.y * halfH + floatY, 0)
    pos.current.scale.setScalar(P.scale)

    const px = reduced ? 0 : sceneState.pointer.x
    const py = reduced ? 0 : sceneState.pointer.y
    tilt.current.rotation.z = damp(tilt.current.rotation.z, P.tilt - px * 0.06 + (reduced ? 0 : Math.sin(time * 0.6) * 0.02), 4, dt)
    tilt.current.rotation.x = damp(tilt.current.rotation.x, P.tiltX + py * 0.16, 4, dt)

    // idle spin; when spin -> 0 the can settles facing the camera
    const spinW = THREE.MathUtils.clamp(P.spin / 0.3, 0, 1)
    if (!reduced) idle.current += P.spin * dt
    const nearest = Math.round(idle.current / TAU) * TAU
    idle.current = damp(idle.current, nearest, (1 - spinW) * 1.6, dt)
    const sway = reduced ? 0 : Math.sin(time * 0.55) * 0.22 * (1 - spinW)
    spin.current.rotation.y = idle.current + P.turn + boost.current.v + sway + px * 0.4

    // camera dolly + gentle parallax
    camera.position.x = damp(camera.position.x, px * 0.18, 2.5, dt)
    camera.position.y = damp(camera.position.y, py * 0.1, 2.5, dt)
    camera.position.z = P.camZ
    camera.lookAt(0, 0, 0)

    // accent colour + glow
    rig.accent.lerp(accentTarget.current, 1 - Math.exp(-dt * 3))
    rig.particles = P.particles
    rig.swirl = P.swirl
    rig.drops = P.drops
    rig.bigType = P.bigType
    rig.glow = P.glow
    rig.burst = THREE.MathUtils.damp(rig.burst, sceneState.power, 4, dt)
    pos.current.getWorldPosition(rig.canWorld)

    const u = can.uniforms
    u.uRimColor.value.copy(rig.accent)
    u.uRimIntensity.value = 0.2 * P.glow
    u.uInkGlow.value = 0.32 + 0.16 * P.glow
    rimL.current.color.copy(rig.accent)
    rimR.current.color.copy(rig.accent)
    under.current.color.copy(rig.accent)
    rimL.current.intensity = 20 * P.glow
    rimR.current.intensity = 15 * P.glow
    under.current.intensity = 6 + P.swirl * 14
  })

  return (
    <>
      <ambientLight intensity={0.12} />
      <directionalLight position={[-4, 3, 5]} intensity={1.1} />
      <pointLight position={[0, 4.5, 2]} intensity={10} color="#ffffff" />
      <pointLight ref={rimL} position={[-3.4, 1.4, -2.6]} intensity={30} />
      <pointLight ref={rimR} position={[3.6, 2.2, -2.8]} intensity={24} />
      <pointLight ref={under} position={[0, -3, 1.5]} intensity={6} />
      <group ref={pos}>
        <group ref={tilt}>
          <group ref={spin}>
            <primitive object={can.group} />
          </group>
          <LiquidSwirl />
        </group>
        <BurstDroplets />
      </group>
    </>
  )
}
