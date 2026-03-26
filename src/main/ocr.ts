import Tesseract from 'tesseract.js'
import { join } from 'path'
import { app } from 'electron'

let worker: Tesseract.Worker | null = null

export async function getOcrWorker(): Promise<Tesseract.Worker> {
  if (worker) return worker

  // tessdata is bundled in resources/ and copied to userData on first run
  const tessdataPath = join(app.getPath('userData'), 'tessdata')

  worker = await Tesseract.createWorker('deu', 1, {
    // Use bundled tessdata — no internet required
    langPath: tessdataPath,
    // Log progress to main process console in dev
    logger: (m) => {
      if (m.status === 'recognizing text') {
        process.stdout.write(`\rOCR: ${Math.round(m.progress * 100)}%`)
      }
    }
  })

  // Tune for printed document text (not handwriting, not low-res)
  await worker.setParameters({
    tessedit_pageseg_mode: Tesseract.PSM.AUTO,         // 3 = auto page segmentation
    tessedit_ocr_engine_mode: Tesseract.OEM.LSTM_ONLY, // 3 = LSTM neural net only
    preserve_interword_spaces: '1'
  })

  return worker
}

export async function runOcr(imagePath: string): Promise<string> {
  const w = await getOcrWorker()
  const result = await w.recognize(imagePath)
  process.stdout.write('\n')
  return result.data.text.trim()
}

export async function terminateOcrWorker(): Promise<void> {
  if (worker) {
    await worker.terminate()
    worker = null
  }
}
