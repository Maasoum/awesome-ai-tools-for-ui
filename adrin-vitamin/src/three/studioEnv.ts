import * as THREE from 'three'

/**
 * Builds a procedural photo-studio environment (softboxes + strip lights)
 * and pre-filters it with PMREM. No HDR download required.
 */
export function createStudioEnv(renderer: THREE.WebGLRenderer) {
  const env = new THREE.Scene()
  env.background = new THREE.Color('#020303')

  const panel = (w: number, h: number, intensity: number, color = '#ffffff') => {
    const m = new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(intensity), side: THREE.DoubleSide })
    m.toneMapped = false
    return new THREE.Mesh(new THREE.PlaneGeometry(w, h), m)
  }

  // large overhead softbox
  const top = panel(10, 4, 1.6)
  top.position.set(0, 7, 0)
  top.rotation.x = Math.PI / 2
  env.add(top)

  // tall key strip, front-left -> long vertical highlight on the bottle
  const key = panel(1.2, 12, 4.5)
  key.position.set(-6, 0, 4)
  key.lookAt(0, 0, 0)
  env.add(key)

  // thin fill strip front-right
  const fill = panel(0.5, 12, 2.2)
  fill.position.set(6, 0, 3)
  fill.lookAt(0, 0, 0)
  env.add(fill)

  // back rim strips (lime tinted so reflections carry the brand)
  const rimL = panel(0.35, 12, 2.2, '#eef5e6')
  rimL.position.set(-4, 0, -6)
  rimL.lookAt(0, 0, 0)
  env.add(rimL)
  const rimR = panel(0.35, 12, 2.2, '#eef5e6')
  rimR.position.set(4.5, 0, -6)
  rimR.lookAt(0, 0, 0)
  env.add(rimR)

  // floor bounce, very dim
  const floor = panel(14, 14, 0.12)
  floor.position.set(0, -6, 0)
  floor.rotation.x = -Math.PI / 2
  env.add(floor)

  // horizontal accent bar for the glossy droplets
  const bar = panel(8, 0.25, 2.4)
  bar.position.set(0, 2.5, 6)
  bar.lookAt(0, 0, 0)
  env.add(bar)

  const pmrem = new THREE.PMREMGenerator(renderer)
  const rt = pmrem.fromScene(env, 0.02)
  pmrem.dispose()
  env.traverse((o) => {
    if ((o as THREE.Mesh).isMesh) {
      ;(o as THREE.Mesh).geometry.dispose()
      ;((o as THREE.Mesh).material as THREE.Material).dispose()
    }
  })
  return rt.texture
}
