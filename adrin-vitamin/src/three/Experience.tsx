import { useEffect, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { EffectComposer, Bloom, Vignette, Noise, ToneMapping } from '@react-three/postprocessing'
import { BlendFunction, ToneMappingMode } from 'postprocessing'
import { PerformanceMonitor } from '@react-three/drei'
import * as THREE from 'three'
import { BottleRig } from './BottleRig'
import { Party } from './Party'
import { PhotoBackdrop } from './PhotoBackdrop'
import { EnergyParticles, AirDroplets, Smoke, BigType } from './Atmosphere'
import { createStudioEnv } from './studioEnv'
import { useUI } from '../store/ui'
import { sceneState } from '../lib/sceneState'
import { renderProductShots } from './productShots'
import { getAssets } from './assets'

function StudioEnvironment() {
  const { gl, scene } = useThree()
  useEffect(() => {
    const tex = createStudioEnv(gl)
    scene.environment = tex
    return () => {
      scene.environment = null
      tex.dispose()
    }
  }, [gl, scene])
  return null
}

/** Signals readiness after a few real frames so the preloader can lift without a hitch. */
function ReadySignal() {
  const frames = useRef(0)
  const done = useRef(false)
  useFrame(() => {
    if (done.current) return
    frames.current++
    if (frames.current === 2) useUI.getState().setLoadStage(0.92)
    if (frames.current > 6) {
      done.current = true
      useUI.getState().setLoadStage(1)
      useUI.getState().setSceneReady(true)
    }
  })
  return null
}

function Effects({ quality }: { quality: 'high' | 'low' }) {
  return (
    <EffectComposer multisampling={quality === 'high' ? 4 : 0} enableNormalPass={false}>
      <Bloom mipmapBlur intensity={0.85} luminanceThreshold={0.55} luminanceSmoothing={0.25} radius={0.72} />
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
      <Noise premultiply blendFunction={BlendFunction.SOFT_LIGHT} opacity={0.16} />
      <Vignette eskil={false} offset={0.22} darkness={0.78} />
    </EffectComposer>
  )
}

export default function Experience() {
  const paused = useUI((s) => s.canvasPaused)
  const [dpr, setDpr] = useState<number>(() => Math.min(window.devicePixelRatio, sceneState.lowPower ? 1.25 : 1.75))
  const [quality, setQuality] = useState<'high' | 'low'>(sceneState.lowPower ? 'low' : 'high')
  const shotsDone = useRef(false)

  useEffect(() => {
    useUI.getState().setLoadStage(0.7)
    // product renders are produced from the very same procedural bottle
    const id = window.setTimeout(() => {
      if (shotsDone.current) return
      shotsDone.current = true
      try {
        useUI.getState().setRenders(renderProductShots(getAssets()))
      } catch (e) {
        console.warn('[adrin] product shots failed', e)
      }
    }, 300)
    return () => window.clearTimeout(id)
  }, [])

  return (
    <Canvas
      style={{ position: 'fixed', inset: 0, width: '100vw', height: '100lvh' }}
      dpr={dpr}
      frameloop={paused ? 'never' : 'always'}
      flat
      camera={{ fov: 32, position: [0, 0, 8], near: 0.1, far: 60 }}
      gl={{ antialias: false, powerPreference: 'high-performance', alpha: false, stencil: false, depth: true }}
      onCreated={({ gl }) => {
        gl.setClearColor('#07050a', 1)
        gl.toneMapping = THREE.NoToneMapping
        gl.outputColorSpace = THREE.SRGBColorSpace
      }}
      aria-hidden
    >
      <PerformanceMonitor
        onDecline={() => {
          setDpr((d) => Math.max(1, d - 0.25))
          setQuality('low')
        }}
        onIncline={() => setDpr((d) => Math.min(window.devicePixelRatio, d + 0.25, 1.75))}
      />
      <StudioEnvironment />
      <PhotoBackdrop />
      <Party />
      <BigType />
      <Smoke />
      <EnergyParticles />
      <AirDroplets />
      <BottleRig />
      <Effects quality={quality} />
      <ReadySignal />
    </Canvas>
  )
}
