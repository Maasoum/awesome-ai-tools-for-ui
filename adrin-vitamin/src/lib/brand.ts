import logoHdUrl from '../assets/adrin-logo-hd.webp'
import logoUrl from '../assets/adrin-logo.webp'

export const BRAND = {
  name: 'ADRIN',
  full: 'ADRIN VITAMIN',
  logo: logoUrl,
  logoHd: logoHdUrl,
}

let logoImage: HTMLImageElement | null = null

/** Decodes the high-res logo so it can be printed onto the 3D bottle label. */
export async function loadBrandImages() {
  const img = new Image()
  img.decoding = 'async'
  img.src = logoHdUrl
  try {
    await img.decode()
    logoImage = img
  } catch {
    logoImage = null
  }
}

export const getLogoImage = () => logoImage
