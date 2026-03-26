import { useState } from 'react'
import type { Letter } from '../../../shared/types'

interface Props {
  letter: Letter
  onSaved: () => void
  onCancel: () => void
}

export default function ReminderPicker({ letter, onSaved, onCancel }: Props) {
  const defaultDate = letter.deadline
    ? new Date(letter.deadline - 86_400_000 * 2).toISOString().split('T')[0]
    : new Date(Date.now() + 86_400_000 * 7).toISOString().split('T')[0]

  const [date, setDate] = useState(defaultDate)
  const [time, setTime] = useState('09:00')
  const [saving, setSaving] = useState(false)

  const quickOptions = [
    { label: 'In 3 days', days: 3 },
    { label: 'In 1 week', days: 7 },
    { label: '2 days before deadline', days: -2, relative: true },
  ]

  const setQuick = (days: number, relative = false) => {
    const base = relative && letter.deadline ? new Date(letter.deadline) : new Date()
    base.setDate(base.getDate() + (relative ? -Math.abs(days) : days))
    setDate(base.toISOString().split('T')[0])
  }

  const handleSave = async () => {
    setSaving(true)
    const remindAt = new Date(`${date}T${time}:00`).getTime()
    await window.briefklar.scheduleReminder(letter.id, remindAt)
    setSaving(false)
    onSaved()
  }

  return (
    <div className="bg-white border border-surface-border rounded-2xl p-5 mb-4">
      <h3 className="font-semibold text-slate-800 mb-3">Set Reminder</h3>

      <div className="flex gap-2 flex-wrap mb-4">
        {quickOptions.map((o) => (
          <button
            key={o.label}
            onClick={() => setQuick(o.days, o.relative)}
            className="text-xs px-3 py-1.5 border border-surface-border rounded-lg text-slate-600 hover:bg-slate-50"
          >
            {o.label}
          </button>
        ))}
      </div>

      <div className="flex gap-3 mb-4">
        <div className="flex-1">
          <label className="text-xs text-slate-500 mb-1 block">Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full border border-surface-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
        <div className="w-32">
          <label className="text-xs text-slate-500 mb-1 block">Time</label>
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="w-full border border-surface-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={onCancel}
          className="flex-1 border border-surface-border text-slate-600 text-sm py-2 rounded-xl hover:bg-slate-50"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={saving || !date}
          className="flex-1 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white text-sm font-semibold py-2 rounded-xl"
        >
          {saving ? 'Saving…' : 'Set Reminder'}
        </button>
        {letter.reminder_at && (
          <button
            onClick={async () => { await window.briefklar.cancelReminder(letter.id); onSaved() }}
            className="px-4 text-red-500 hover:text-red-700 text-sm border border-red-200 rounded-xl"
          >
            Remove
          </button>
        )}
      </div>
    </div>
  )
}
