import express from 'express'
import multer from 'multer'
import { createServer, Server } from 'http'
import { networkInterfaces } from 'os'
import { join } from 'path'
import { mkdirSync } from 'fs'
import { app } from 'electron'
import QRCode from 'qrcode'
import { v4 as uuidv4 } from 'uuid'
import type { Letter } from '../shared/types'

export interface HandoffServerResult {
  port: number
  localIp: string
  url: string
  qrDataUrl: string
}

let server: Server | null = null
let calendarServer: Server | null = null

export async function startHandoffServer(
  onPhotoReceived: (imagePath: string) => void
): Promise<HandoffServerResult> {
  if (server) await stopHandoffServer()

  const tempDir = join(app.getPath('userData'), 'temp')
  mkdirSync(tempDir, { recursive: true })

  const storage = multer.diskStorage({
    destination: tempDir,
    filename: (_req, _file, cb) => cb(null, `scan-${uuidv4()}.jpg`)
  })
  const upload = multer({ storage, limits: { fileSize: 20 * 1024 * 1024 } })

  const expressApp = express()

  // Mobile scan page
  expressApp.get('/scan', (_req, res) => {
    res.send(getMobilePage())
  })

  // Photo upload endpoint
  expressApp.post('/upload', upload.single('photo'), (req, res) => {
    if (!req.file) {
      res.status(400).json({ error: 'No file received' })
      return
    }
    res.json({ ok: true })
    onPhotoReceived(req.file.path)
  })

  const port = await findFreePort(3456)
  const localIp = getLocalIp()
  const url = `http://${localIp}:${port}/scan`

  return new Promise((resolve, reject) => {
    server = createServer(expressApp)
    server.listen(port, '0.0.0.0', async () => {
      try {
        const qrDataUrl = await QRCode.toDataURL(url, {
          width: 280,
          margin: 2,
          color: { dark: '#0c4a6e', light: '#ffffff' }
        })
        resolve({ port, localIp, url, qrDataUrl })
      } catch (err) {
        reject(err)
      }
    })
    server.on('error', reject)
  })
}

export async function stopHandoffServer(): Promise<void> {
  return new Promise((resolve) => {
    if (!server) { resolve(); return }
    server.close(() => { server = null; resolve() })
  })
}

// ── Calendar server (serves .ics for phone QR handoff) ────────────────────────

export async function startCalendarServer(
  letter: Letter
): Promise<{ qrDataUrl: string; url: string }> {
  if (calendarServer) await stopCalendarServer()

  const icsContent = generateIcs(letter)
  const expressApp = express()

  expressApp.get('/calendar.ics', (_req, res) => {
    res.setHeader('Content-Type', 'text/calendar; charset=utf-8')
    res.setHeader('Content-Disposition', 'attachment; filename="briefklar-deadline.ics"')
    res.send(icsContent)
  })

  const port = await findFreePort(3460)
  const localIp = getLocalIp()
  const url = `http://${localIp}:${port}/calendar.ics`

  return new Promise((resolve, reject) => {
    calendarServer = createServer(expressApp)
    calendarServer.listen(port, '0.0.0.0', async () => {
      try {
        const qrDataUrl = await QRCode.toDataURL(url, {
          width: 240, margin: 2,
          color: { dark: '#0c4a6e', light: '#ffffff' }
        })
        resolve({ qrDataUrl, url })
      } catch (err) { reject(err) }
    })
    calendarServer.on('error', reject)
    // Auto-stop after 5 minutes
    setTimeout(() => stopCalendarServer(), 5 * 60 * 1000)
  })
}

export async function stopCalendarServer(): Promise<void> {
  return new Promise((resolve) => {
    if (!calendarServer) { resolve(); return }
    calendarServer.close(() => { calendarServer = null; resolve() })
  })
}

export function generateIcs(letter: Letter): string {
  if (!letter.deadline) return ''
  const deadline = new Date(letter.deadline)
  const tomorrow = new Date(deadline.getTime() + 86_400_000)

  const dtStamp = new Date().toISOString().replace(/[-:.]/g, '').slice(0, 15) + 'Z'
  const dtStart = deadline.toISOString().split('T')[0].replace(/-/g, '')
  const dtEnd = tomorrow.toISOString().split('T')[0].replace(/-/g, '')
  const summary = `Deadline: ${letter.type_label ?? 'Official Letter'}`
  const desc = [letter.what_it_is ?? '', letter.sender ? `From: ${letter.sender}` : '']
    .filter(Boolean).join(' | ').replace(/\n/g, '\\n')

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//BriefKlar//BriefKlar//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${letter.id}@briefklar`,
    `DTSTAMP:${dtStamp}`,
    `DTSTART;VALUE=DATE:${dtStart}`,
    `DTEND;VALUE=DATE:${dtEnd}`,
    `SUMMARY:${summary}`,
    `DESCRIPTION:${desc}`,
    'BEGIN:VALARM',
    'TRIGGER:-P7D',
    'ACTION:DISPLAY',
    `DESCRIPTION:7 days until: ${summary}`,
    'END:VALARM',
    'BEGIN:VALARM',
    'TRIGGER:-P1D',
    'ACTION:DISPLAY',
    `DESCRIPTION:Tomorrow: ${summary}`,
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n')
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function getLocalIp(): string {
  const nets = networkInterfaces()
  for (const name of Object.keys(nets)) {
    for (const net of nets[name] ?? []) {
      if (net.family === 'IPv4' && !net.internal) return net.address
    }
  }
  return '127.0.0.1'
}

async function findFreePort(start: number): Promise<number> {
  const { createServer } = await import('net')
  return new Promise((resolve) => {
    const s = createServer()
    s.listen(start, () => {
      const port = (s.address() as any).port
      s.close(() => resolve(port))
    })
    s.on('error', () => resolve(findFreePort(start + 1)))
  })
}

function getMobilePage(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>BriefKlar — Scan Letter</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: #0f172a;
      height: 100dvh;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    /* ── Camera viewfinder ── */
    #camera-view {
      position: relative;
      flex: 1;
      overflow: hidden;
      background: #000;
    }
    #viewfinder {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    /* ── Alignment overlay ── */
    #overlay {
      position: absolute;
      inset: 0;
      pointer-events: none;
    }
    /* Dark vignette around the guide frame */
    #overlay::before {
      content: '';
      position: absolute;
      inset: 0;
      background:
        linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, transparent 20%, transparent 80%, rgba(0,0,0,0.5) 100%),
        linear-gradient(to right,  rgba(0,0,0,0.5) 0%, transparent 15%, transparent 85%, rgba(0,0,0,0.5) 100%);
    }
    #guide-frame {
      position: absolute;
      top: 50%; left: 50%;
      transform: translate(-50%, -52%);
      width: 85%;
      aspect-ratio: 0.707; /* A4 portrait ratio */
      border: 2.5px solid rgba(255,255,255,0.85);
      border-radius: 6px;
      box-shadow: 0 0 0 9999px rgba(0,0,0,0.35);
    }
    /* Corner accents */
    #guide-frame::before, #guide-frame::after {
      content: '';
      position: absolute;
      width: 22px; height: 22px;
      border-color: #14b8a6;
      border-style: solid;
    }
    #guide-frame::before {
      top: -2px; left: -2px;
      border-width: 3px 0 0 3px;
      border-radius: 4px 0 0 0;
    }
    #guide-frame::after {
      bottom: -2px; right: -2px;
      border-width: 0 3px 3px 0;
      border-radius: 0 0 4px 0;
    }
    #guide-label {
      position: absolute;
      bottom: 14%;
      left: 50%;
      transform: translateX(-50%);
      color: rgba(255,255,255,0.8);
      font-size: 12px;
      font-weight: 500;
      text-align: center;
      white-space: nowrap;
      text-shadow: 0 1px 3px rgba(0,0,0,0.8);
    }

    /* ── Bottom bar ── */
    #bottom-bar {
      background: #0f172a;
      padding: 20px 24px 32px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
    }
    #shutter-btn {
      width: 72px; height: 72px;
      border-radius: 50%;
      background: white;
      border: 4px solid #14b8a6;
      cursor: pointer;
      position: relative;
      transition: transform 0.1s;
      flex-shrink: 0;
    }
    #shutter-btn:active { transform: scale(0.92); }
    #shutter-btn::after {
      content: '';
      position: absolute;
      inset: 6px;
      border-radius: 50%;
      background: #14b8a6;
    }
    #bottom-hint {
      color: #94a3b8;
      font-size: 12px;
      text-align: center;
    }

    /* ── Preview / confirm screen ── */
    #preview-view {
      display: none;
      flex-direction: column;
      height: 100dvh;
      background: #0f172a;
    }
    #preview-img {
      flex: 1;
      object-fit: contain;
      width: 100%;
    }
    #preview-bar {
      padding: 16px 24px 32px;
      display: flex;
      gap: 12px;
    }
    .btn-retake {
      flex: 1;
      padding: 15px;
      border: 1.5px solid #334155;
      background: transparent;
      color: #94a3b8;
      border-radius: 14px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
    }
    .btn-send {
      flex: 2;
      padding: 15px;
      background: linear-gradient(135deg, #14b8a6, #0f766e);
      color: white;
      border: none;
      border-radius: 14px;
      font-size: 16px;
      font-weight: 700;
      cursor: pointer;
    }
    .btn-send:disabled { opacity: 0.6; }

    /* ── Fallback (no camera permission) ── */
    #fallback-view {
      display: none;
      flex: 1;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 32px 24px;
      text-align: center;
    }
    #fallback-view h2 { color: white; font-size: 20px; margin-bottom: 12px; }
    #fallback-view p  { color: #94a3b8; font-size: 14px; margin-bottom: 24px; }
    label.btn-file {
      display: inline-block;
      padding: 15px 32px;
      background: linear-gradient(135deg, #14b8a6, #0f766e);
      color: white;
      border-radius: 14px;
      font-size: 16px;
      font-weight: 700;
      cursor: pointer;
    }
    input[type=file] { display: none; }

    /* ── Success screen ── */
    #success-view {
      display: none;
      flex: 1;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: 32px;
    }
    #success-view .icon { font-size: 56px; margin-bottom: 16px; }
    #success-view h2 { color: #14b8a6; font-size: 22px; font-weight: 700; margin-bottom: 8px; }
    #success-view p  { color: #94a3b8; font-size: 14px; }
  </style>
</head>
<body>

  <!-- Camera viewfinder -->
  <div id="camera-view">
    <video id="viewfinder" autoplay playsinline muted></video>
    <div id="overlay">
      <div id="guide-frame"></div>
      <div id="guide-label">Align letter inside the frame · Hold phone flat above it</div>
    </div>
  </div>
  <div id="bottom-bar">
    <button id="shutter-btn" title="Take photo"></button>
    <div id="bottom-hint">Good lighting · Phone directly above · Letter fills frame</div>
  </div>

  <!-- Preview / confirm -->
  <div id="preview-view">
    <img id="preview-img" alt="Preview">
    <div id="preview-bar">
      <button class="btn-retake" id="btn-retake">Retake</button>
      <button class="btn-send" id="btn-send">Send to Desktop</button>
    </div>
  </div>

  <!-- Fallback (no getUserMedia) -->
  <div id="fallback-view">
    <h2>📷 Choose Photo</h2>
    <p>Lay the letter flat on a light surface, hold your phone directly above it, and take a clear photo.</p>
    <label class="btn-file" for="file-input">📸 Take / Choose Photo</label>
    <input type="file" id="file-input" accept="image/*" capture="environment">
  </div>

  <!-- Success -->
  <div id="success-view">
    <div class="icon">✅</div>
    <h2>Photo received!</h2>
    <p>BriefKlar is processing your letter on the desktop now.</p>
  </div>

  <canvas id="canvas" style="display:none"></canvas>

  <script>
    const cameraView  = document.getElementById('camera-view');
    const bottomBar   = document.getElementById('bottom-bar');
    const previewView = document.getElementById('preview-view');
    const fallbackView= document.getElementById('fallback-view');
    const successView = document.getElementById('success-view');
    const viewfinder  = document.getElementById('viewfinder');
    const shutterBtn  = document.getElementById('shutter-btn');
    const previewImg  = document.getElementById('preview-img');
    const btnRetake   = document.getElementById('btn-retake');
    const btnSend     = document.getElementById('btn-send');
    const canvas      = document.getElementById('canvas');
    const fileInput   = document.getElementById('file-input');

    let capturedBlob = null;
    let stream = null;

    // ── Start camera ──────────────────────────────────────────────────────────
    async function startCamera() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 3840 }, height: { ideal: 2160 } },
          audio: false
        });
        viewfinder.srcObject = stream;
      } catch (e) {
        // No camera permission — show file input fallback
        cameraView.style.display = 'none';
        bottomBar.style.display = 'none';
        fallbackView.style.display = 'flex';
      }
    }

    // ── Capture from viewfinder ───────────────────────────────────────────────
    shutterBtn.addEventListener('click', () => {
      canvas.width  = viewfinder.videoWidth;
      canvas.height = viewfinder.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(viewfinder, 0, 0);
      canvas.toBlob((blob) => {
        capturedBlob = blob;
        previewImg.src = URL.createObjectURL(blob);
        cameraView.style.display = 'none';
        bottomBar.style.display = 'none';
        previewView.style.display = 'flex';
      }, 'image/jpeg', 0.96);
    });

    // ── Retake ────────────────────────────────────────────────────────────────
    btnRetake.addEventListener('click', () => {
      capturedBlob = null;
      previewView.style.display = 'none';
      cameraView.style.display = 'block';
      bottomBar.style.display = 'flex';
    });

    // ── Fallback file input ───────────────────────────────────────────────────
    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      capturedBlob = file;
      previewImg.src = URL.createObjectURL(file);
      fallbackView.style.display = 'none';
      previewView.style.display = 'flex';
    });

    // ── Send to desktop ───────────────────────────────────────────────────────
    btnSend.addEventListener('click', async () => {
      if (!capturedBlob) return;
      btnSend.disabled = true;
      btnSend.textContent = 'Sending…';

      const formData = new FormData();
      formData.append('photo', capturedBlob, 'scan.jpg');

      try {
        const res = await fetch('/upload', { method: 'POST', body: formData });
        if (res.ok) {
          if (stream) stream.getTracks().forEach(t => t.stop());
          previewView.style.display = 'none';
          successView.style.display = 'flex';
        } else {
          throw new Error('Upload failed');
        }
      } catch {
        btnSend.disabled = false;
        btnSend.textContent = 'Send to Desktop';
      }
    });

    startCamera();
  </script>
</body>
</html>`
}
