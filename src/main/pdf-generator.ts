import { BrowserWindow, dialog, app } from 'electron'
import { writeFileSync, unlinkSync } from 'fs'
import { join } from 'path'
import type { Letter } from '../shared/types'

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function buildDin5008Html(content: string, letterTitle: string): string {
  const today = new Date().toLocaleDateString('de-DE')
  return `<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="UTF-8">
<title>${escapeHtml(letterTitle)}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  @page { size: A4; margin: 0; }
  html, body { width: 210mm; background: white; }

  .page {
    width: 210mm;
    min-height: 297mm;
    padding: 20mm 20mm 20mm 25mm;
    font-family: Arial, Helvetica, sans-serif;
    font-size: 11pt;
    line-height: 1.5;
    color: #111;
  }

  /* DIN 5008 Form B – sender small line above address window */
  .sender-line {
    font-size: 8pt;
    color: #555;
    border-bottom: 0.5pt solid #bbb;
    padding-bottom: 2mm;
    margin-bottom: 3mm;
    white-space: nowrap;
    overflow: hidden;
  }

  .letter-body {
    white-space: pre-wrap;
    font-family: Arial, Helvetica, sans-serif;
    font-size: 11pt;
    line-height: 1.6;
  }

  .footer {
    margin-top: 15mm;
    padding-top: 4mm;
    border-top: 0.5pt solid #ddd;
    font-size: 7.5pt;
    color: #aaa;
    text-align: center;
  }
</style>
</head>
<body>
<div class="page">
  <div class="sender-line">BriefKlar · Erstellt am ${today}</div>
  <div class="letter-body">${escapeHtml(content)}</div>
  <div class="footer">
    Erstellt mit BriefKlar · Kein Rechtsbeistand · Vor dem Versenden prüfen
  </div>
</div>
</body>
</html>`
}

export async function exportReplyToPdf(
  content: string,
  letter: Letter
): Promise<string | null> {
  // Ask user where to save
  const defaultName = `Antwort_${(letter.type_label ?? 'Brief').replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`
  const { filePath } = await dialog.showSaveDialog({
    title: 'Antwort als PDF speichern',
    defaultPath: join(app.getPath('documents'), defaultName),
    filters: [{ name: 'PDF Dokument', extensions: ['pdf'] }]
  })
  if (!filePath) return null

  // Write HTML to a temp file (data: URLs can fail for complex HTML)
  const tmpHtml = join(app.getPath('temp'), `briefklar-${Date.now()}.html`)
  const html = buildDin5008Html(content, letter.type_label ?? 'Brief')
  writeFileSync(tmpHtml, html, 'utf-8')

  // Hidden window to render and export
  const win = new BrowserWindow({
    show: false,
    width: 794,  // ~A4 at 96dpi
    height: 1123,
    webPreferences: { sandbox: true }
  })

  try {
    await new Promise<void>((resolve, reject) => {
      win.webContents.once('did-finish-load', resolve)
      win.webContents.once('did-fail-load', (_e, _code, desc) => reject(new Error(desc)))
      win.loadFile(tmpHtml)
    })

    // Small settle delay for fonts/layout
    await new Promise((r) => setTimeout(r, 250))

    const pdfBuffer = await win.webContents.printToPDF({
      pageSize: 'A4',
      printBackground: true,
      margins: { marginType: 'none' }
    })

    writeFileSync(filePath, pdfBuffer)
    return filePath
  } finally {
    win.close()
    try { unlinkSync(tmpHtml) } catch { /* ignore */ }
  }
}
