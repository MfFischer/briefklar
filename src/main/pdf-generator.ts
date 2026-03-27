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

function buildAnalysisHtml(letter: Letter): string {
  const esc = escapeHtml
  const deadline = letter.deadline
    ? new Date(letter.deadline).toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' })
    : null
  const daysLeft = letter.deadline
    ? Math.ceil((letter.deadline - Date.now()) / 86_400_000)
    : null
  const scannedAt = new Date(letter.scanned_at).toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' })
  const urgencyColors: Record<string, string> = {
    critical: '#dc2626', high: '#ea580c', medium: '#ca8a04', low: '#16a34a'
  }
  const urgencyColor = urgencyColors[letter.urgency] ?? '#64748b'

  const whatToDoRows = (letter.what_to_do ?? []).map((step, i) =>
    `<li style="margin-bottom:4px;"><span style="font-weight:700;color:#0d9488;">${i + 1}.</span> ${esc(step)}</li>`
  ).join('')

  const freeHelpRows = (letter.free_help ?? []).map((tip) =>
    `<li style="margin-bottom:4px;color:#1e40af;">• ${esc(tip)}</li>`
  ).join('')

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>BriefKlar — ${esc(letter.type_label ?? 'Letter Analysis')}</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  @page { size: A4; margin: 0; }
  html, body { width: 210mm; background: white; }
  .page { width:210mm; min-height:297mm; padding:18mm 18mm 18mm 22mm; font-family:Arial,Helvetica,sans-serif; font-size:10pt; color:#1e293b; }
  .header { display:flex; align-items:center; justify-content:space-between; border-bottom:2pt solid #0d9488; padding-bottom:5mm; margin-bottom:7mm; }
  .app-name { font-size:18pt; font-weight:800; color:#134e4a; }
  .app-sub { font-size:8pt; color:#0d9488; }
  .badge { display:inline-block; padding:3px 10px; border-radius:20px; font-size:9pt; font-weight:700; color:white; background:${urgencyColor}; }
  .section { margin-bottom:6mm; }
  .section-label { font-size:7.5pt; font-weight:700; text-transform:uppercase; letter-spacing:0.08em; color:#94a3b8; margin-bottom:3mm; }
  .field-row { display:flex; gap:8mm; font-size:10pt; margin-bottom:3mm; }
  .field-label { width:30mm; color:#94a3b8; flex-shrink:0; }
  .field-value { color:#1e293b; font-weight:600; }
  .card { background:#f8fafc; border:1pt solid #e2e8f0; border-radius:6px; padding:4mm 5mm; margin-bottom:4mm; }
  .card-warn { background:#fffbeb; border-color:#fde68a; }
  .card-info { background:#eff6ff; border-color:#bfdbfe; }
  ol,ul { padding-left:4mm; }
  li { font-size:10pt; line-height:1.5; }
  .footer { position:fixed; bottom:10mm; left:0; right:0; text-align:center; font-size:7pt; color:#cbd5e1; }
  .overdue { color:#dc2626; font-weight:700; }
  .deadline-soon { color:#ea580c; font-weight:600; }
</style>
</head>
<body>
<div class="page">
  <div class="header">
    <div>
      <div class="app-name">BriefKlar</div>
      <div class="app-sub">German letters, made clear</div>
    </div>
    <div style="text-align:right;">
      <div class="badge">${esc(letter.urgency.charAt(0).toUpperCase() + letter.urgency.slice(1))}</div>
      <div style="font-size:8pt;color:#94a3b8;margin-top:3px;">Scanned ${esc(scannedAt)}</div>
    </div>
  </div>

  <div class="section">
    <div style="font-size:16pt;font-weight:800;color:#134e4a;margin-bottom:2mm;">${esc(letter.type_label ?? 'Unknown Letter')}</div>
    ${letter.sender ? `<div style="font-size:10pt;color:#64748b;">From: <strong>${esc(letter.sender)}</strong></div>` : ''}
  </div>

  <div class="section">
    <div class="section-label">Key Details</div>
    <div class="card">
      ${deadline ? `<div class="field-row"><span class="field-label">Deadline</span><span class="field-value ${daysLeft !== null && daysLeft < 0 ? 'overdue' : daysLeft !== null && daysLeft <= 7 ? 'deadline-soon' : ''}">${esc(deadline)}${daysLeft !== null ? ` (${daysLeft < 0 ? 'OVERDUE' : daysLeft === 0 ? 'TODAY' : `${daysLeft} days left`})` : ''}</span></div>` : ''}
      ${letter.amount != null ? `<div class="field-row"><span class="field-label">Amount</span><span class="field-value">€${letter.amount.toLocaleString('de-DE', { minimumFractionDigits: 2 })}</span></div>` : ''}
      <div class="field-row"><span class="field-label">Status</span><span class="field-value">${esc(letter.status === 'done' ? '✓ Handled' : 'Pending')}</span></div>
    </div>
  </div>

  ${letter.what_it_is ? `
  <div class="section">
    <div class="section-label">What This Is</div>
    <div class="card">${esc(letter.what_it_is)}</div>
  </div>` : ''}

  ${whatToDoRows ? `
  <div class="section">
    <div class="section-label">What To Do</div>
    <div class="card"><ol style="list-style:none;padding:0;">${whatToDoRows}</ol></div>
  </div>` : ''}

  ${letter.consequence ? `
  <div class="section">
    <div class="section-label">If Ignored</div>
    <div class="card card-warn"><span style="font-weight:700;color:#92400e;">Warning: </span><span style="color:#78350f;">${esc(letter.consequence)}</span></div>
  </div>` : ''}

  ${freeHelpRows ? `
  <div class="section">
    <div class="section-label">Free Help Available</div>
    <div class="card card-info"><ul style="list-style:none;padding:0;">${freeHelpRows}</ul></div>
  </div>` : ''}

  <div class="footer">Created with BriefKlar · Not legal advice · Always verify deadlines independently</div>
</div>
</body>
</html>`
}

export async function exportAnalysisToPdf(letter: Letter): Promise<string | null> {
  const defaultName = `BriefKlar_${(letter.type_label ?? 'Letter').replace(/[^a-zA-Z0-9äöüÄÖÜß]/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`
  const { filePath } = await dialog.showSaveDialog({
    title: 'Export Letter Analysis as PDF',
    defaultPath: join(app.getPath('documents'), defaultName),
    filters: [{ name: 'PDF Document', extensions: ['pdf'] }]
  })
  if (!filePath) return null

  const tmpHtml = join(app.getPath('temp'), `briefklar-analysis-${Date.now()}.html`)
  writeFileSync(tmpHtml, buildAnalysisHtml(letter), 'utf-8')

  const win = new BrowserWindow({
    show: false, width: 794, height: 1123,
    webPreferences: { sandbox: true }
  })
  try {
    await new Promise<void>((resolve, reject) => {
      win.webContents.once('did-finish-load', resolve)
      win.webContents.once('did-fail-load', (_e, _code, desc) => reject(new Error(desc)))
      win.loadFile(tmpHtml)
    })
    await new Promise((r) => setTimeout(r, 250))
    const pdfBuffer = await win.webContents.printToPDF({
      pageSize: 'A4', printBackground: true,
      margins: { marginType: 'none' }
    })
    writeFileSync(filePath, pdfBuffer)
    return filePath
  } finally {
    win.close()
    try { unlinkSync(tmpHtml) } catch { /* ignore */ }
  }
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
