import sharp from 'sharp'
import { app } from 'electron'
import { join } from 'path'
import { mkdirSync } from 'fs'
import { v4 as uuidv4 } from 'uuid'

export interface ProcessedImage {
  id: string
  originalPath: string
  processedPath: string
  width: number
  height: number
}

export async function processImage(inputPath: string): Promise<ProcessedImage> {
  const scansDir = join(app.getPath('userData'), 'scans')
  mkdirSync(scansDir, { recursive: true })

  const id = uuidv4()
  const outputPath = join(scansDir, `${id}.png`)

  const image = sharp(inputPath)
  const metadata = await image.metadata()

  // Determine resize dimensions — keep longest side at 2400px max
  const maxSide = 3000
  const longest = Math.max(metadata.width ?? 0, metadata.height ?? 0)
  const scale = longest > maxSide ? maxSide / longest : 1
  const targetWidth = Math.round((metadata.width ?? 1200) * scale)
  const targetHeight = Math.round((metadata.height ?? 1600) * scale)

  await sharp(inputPath)
    // 1. Auto-rotate from EXIF (fixes upside-down/sideways phone photos)
    .rotate()
    // 2. Resize — 3000px max for better character detail on dense text
    .resize(targetWidth, targetHeight, { fit: 'inside', withoutEnlargement: true })
    // 3. Grayscale — removes colour noise
    .grayscale()
    // 4. Median filter — removes camera sensor noise and JPEG artifacts
    //    without blurring text edges
    .median(3)
    // 5. Normalize — stretches histogram to full 0-255 range
    //    Critical for phone photos with uneven/dim lighting
    .normalize()
    // 6. Moderate contrast boost — enough to darken text without crushing
    //    shadows from uneven phone lighting (threshold was too aggressive)
    .linear(1.3, -15)
    // 7. Sharpen — unsharp mask tuned for printed text edges
    .sharpen({ sigma: 1.2, m1: 1.5, m2: 2.0 })
    // 8. Save as lossless PNG for best OCR input
    .png({ compressionLevel: 6 })
    .toFile(outputPath)

  return {
    id,
    originalPath: inputPath,
    processedPath: outputPath,
    width: targetWidth,
    height: targetHeight
  }
}

/**
 * Phase 2: 4-point perspective correction.
 * Takes corner points from the mobile browser's jscanify detection
 * and warps the image to a flat rectangle.
 *
 * corners: [topLeft, topRight, bottomRight, bottomLeft]
 * each corner: { x: number, y: number } in image pixel coordinates
 */
export async function correctPerspective(
  inputPath: string,
  corners: { x: number; y: number }[]
): Promise<string> {
  // TODO Phase 2: implement using opencv4nodejs or a manual affine transform
  // For now, returns the original path — the normalize+sharpen pipeline
  // handles most real-world cases without explicit warp
  return inputPath
}
