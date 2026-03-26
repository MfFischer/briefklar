import schedule from 'node-schedule'
import { Notification, BrowserWindow } from 'electron'
import { dbGetLetters, dbUpdateLetter } from './db'

const jobs = new Map<string, schedule.Job>()

export function initScheduler(getWindow: () => BrowserWindow | null): void {
  // On startup, reschedule any pending reminders from the database
  const letters = dbGetLetters()
  const now = Date.now()

  for (const letter of letters) {
    if (letter.reminder_at && letter.reminder_at > now && letter.status === 'pending') {
      scheduleReminder(letter.id, letter.reminder_at, getWindow)
    }
  }
}

export function scheduleReminder(
  letterId: string,
  remindAt: number,
  getWindow: () => BrowserWindow | null
): void {
  cancelReminder(letterId)

  const date = new Date(remindAt)
  if (date <= new Date()) return

  const job = schedule.scheduleJob(date, () => {
    const win = getWindow()
    const notification = new Notification({
      title: 'BriefKlar Reminder',
      body: 'You have a letter deadline coming up. Open BriefKlar to review it.',
      silent: false
    })
    notification.on('click', () => {
      win?.show()
      win?.webContents.send('open-letter', letterId)
    })
    notification.show()
    jobs.delete(letterId)
  })

  jobs.set(letterId, job)
  dbUpdateLetter(letterId, { reminder_at: remindAt })
}

export function cancelReminder(letterId: string): void {
  const job = jobs.get(letterId)
  if (job) {
    job.cancel()
    jobs.delete(letterId)
  }
}
