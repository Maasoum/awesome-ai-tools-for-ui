import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { gsap } from 'gsap'
import { buildBottle } from './buildBottle'
import { getAssets } from './assets'
import { getPoses, lerpPose, rig, ENTER_FROM, type Pose } from './poses'
import { sceneState, sectionTime } from '../lib/sceneState'
import { flavorById } from '../lib/flavors'
import { useUI } from '../store/ui'
import { LiquidSwirl } from './LiquidSwirl'
import { BurstDroplets } from './BurstDroplets'

const TAU = Math.PI * 2
const damp = THREE.MathUtils.damp

export function BottleRig() {
  const { camera, size } = useThree()
  const assets = getAssets()
  const initialFlavor = useUI.getState().flavor
  const bottle = useMemo(
    () =>
      buildBottle({
        labelA: assets.labels[initialFlavor],
        accent: flavorById(initialFlavor).accent,
        quality: sceneState.lowPower ? 'low' : 'high',
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )
  useEffect(() => () => bottle.dispose(), [bottle])

  const pos = useRef<THREE.Group>(null!)
  const tilt = useRef<THREE.Group>(null!)
  const spin = useRef<THREE.Group>(null!)
  const rimL = useRef<THREE.PointLight>(null!)
  const rimR = useRef<THREE.PointLight>(null!)
  const under = useRef<THREE.PointLight>(null!)
  const sweepL = useRef<THREE.PointLight>(null!)

  const poses = useMemo(() => getPoses(size.width / size.height), [size.width, size.height])
  const cur = useRef<Pose>({ ...poses[0] })
  const target = useRef<Pose>({ ...poses[0] })
  const idle = useRef(0)
  const boost = useRef({ v: 0 })
  const accentTarget = useRef(new THREE.Color(flavorById(initialFlavor).accent))
  const accent2Target = useRef(new THREE.Color(flavorById(initialFlavor).accent2))
  const first = useRef(true)

  // flavour switching: scan-wipe the label + spin boost
  useEffect(() => {
    let tween: gsap.core.Tween | null = null
    let pendingId = initialFlavor
    const unsub = useUI.subscribe((s, prev) => {
      if (s.flavor === prev.flavor) return
      const f = flavorById(s.flavor)
      const u = bottle.uniforms
      if (tween) {
        // finish the running transition instantly
        tween.kill()
        bottle.setLabelA(assets.labels[pendingId])
        u.uAccentA.value.copy(u.uAccentB.value)
      }
      pendingId = s.flavor
      u.uLabelB.value = assets.labels[s.flavor]
      u.uAccentB.value.set(f.accent)
      accentTarget.current.set(f.accent)
      accent2Target.current.set(f.accent2)
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
            bottle.setLabelA(assets.labels[s.flavor])
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
  }, [bottle, assets, initialFlavor])

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

    // idle spin; when spin -> 0 the bottle settles facing the camera
    const spinW = THREE.MathUtils.clamp(P.spin / 0.3, 0, 1)
    if (!reduced) idle.current += P.spin * dt
    const nearest = Math.round(idle.current / TAU) * TAU
    idle.current = damp(idle.current, nearest, (1 - spinW) * 1.6, dt)
    // small sway only, so the logo and flavour name stay readable
    const sway = reduced ? 0 : Math.sin(time * 0.45) * 0.12 * (1 - spinW)
    spin.current.rotation.y = idle.current + P.turn + boost.current.v + sway + px * 0.25

    // camera dolly + gentle parallax
    camera.position.x = damp(camera.position.x, px * 0.18, 2.5, dt)
    camera.position.y = damp(camera.position.y, py * 0.1, 2.5, dt)
    camera.position.z = P.camZ
    camera.lookAt(0, 0, 0)

    // accent colour + glow
    const ka = 1 - Math.exp(-dt * 3)
    rig.accent.lerp(accentTarget.current, ka)
    rig.accent2.lerp(accent2Target.current, ka)
    rig.particles = P.particles
    rig.swirl = P.swirl
    rig.drops = P.drops
    rig.bigType = P.bigType
    rig.glow = P.glow
    rig.beams = P.beams
    rig.crowd = P.crowd
    rig.confetti = P.confetti
    rig.burst = THREE.MathUtils.damp(rig.burst, sceneState.power, 4, dt)
    pos.current.getWorldPosition(rig.productWorld)

    const u = bottle.uniforms
    u.uRimColor.value.copy(rig.accent)
    u.uRimIntensity.value = 0.32 * P.glow
    u.uInkGlow.value = 0.16 + 0.08 * P.glow
    rimL.current.color.copy(rig.accent)
    rimR.current.color.copy(rig.accent)
    under.current.color.copy(rig.accent)
    rimL.current.intensity = 20 * P.glow
    rimR.current.intensity = 15 * P.glow
    under.current.intensity = 6 + P.swirl * 14

    // slow light play on the glass: the stage lights drift behind the bottle,
    // a soft white sweep glides across the front and reflections slide over the surface
    const lt = reduced ? 0 : time
    rimL.current.position.set(-3.4 + Math.sin(lt * 0.23) * 1.1, 1.4 + Math.sin(lt * 0.17 + 1.0) * 1.3, -2.6)
    rimR.current.position.set(3.6 + Math.sin(lt * 0.19 + 2.0) * 1.1, 2.2 + Math.sin(lt * 0.21) * 1.3, -2.8)
    sweepL.current.position.set(Math.sin(lt * 0.28) * 3.2, 1.2 + Math.sin(lt * 0.13) * 1.4, 3.2)
    sweepL.current.color.set('#ffffff').lerp(rig.accent, 0.25)
    state.scene.environmentRotation.y = Math.sin(lt * 0.12) * 0.55
  })

  return (
    <>
      <ambientLight intensity={0.12} />
      <directionalLight position={[-4, 3, 5]} intensity={1.1} />
      <pointLight position={[0, 4.5, 2]} intensity={10} color="#ffffff" />
      <pointLight ref={rimL} position={[-3.4, 1.4, -2.6]} intensity={30} />
      <pointLight ref={rimR} position={[3.6, 2.2, -2.8]} intensity={24} />
      <pointLight ref={under} position={[0, -3, 1.5]} intensity={6} />
      <pointLight ref={sweepL} position={[0, 1.2, 3.2]} intensity={7} distance={9} />
      <group ref={pos}>
        <group ref={tilt}>
          <group ref={spin}>
            <primitive object={bottle.group} />
          </group>
          <LiquidSwirl />
        </group>
        <BurstDroplets />
      </group>
    </>
  )
}
