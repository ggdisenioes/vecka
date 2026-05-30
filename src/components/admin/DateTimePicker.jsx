'use client'

import { useMemo } from 'react'

// Formato compatible con el valor que produce <input type="datetime-local">:
// "YYYY-MM-DDTHH:MM" (sin segundos, sin zona horaria).
function splitValue(value) {
  if (!value) return { date: '', time: '' }
  const [date = '', timeWithSeconds = ''] = String(value).split('T')
  // Tomamos HH:MM por si vino con segundos.
  const time = timeWithSeconds ? timeWithSeconds.slice(0, 5) : ''
  return { date, time }
}

function joinValue(date, time) {
  if (!date) return ''
  return `${date}T${time || '00:00'}`
}

export default function DateTimePicker({
  value,
  onChange,
  disabled = false,
  includeTime = true,
  required = false,
  ariaLabel,
}) {
  const { date, time } = useMemo(() => splitValue(value), [value])

  function emit(nextDate, nextTime) {
    if (!nextDate) {
      onChange('')
      return
    }
    onChange(joinValue(nextDate, includeTime ? nextTime : ''))
  }

  return (
    <div className="datetime-picker">
      <input
        type="date"
        className="datetime-picker-date"
        value={date}
        onChange={(e) => emit(e.target.value, time)}
        disabled={disabled}
        required={required}
        aria-label={ariaLabel ? `${ariaLabel} (fecha)` : 'Fecha'}
      />
      {includeTime ? (
        <input
          type="time"
          className="datetime-picker-time"
          value={time}
          onChange={(e) => emit(date, e.target.value)}
          disabled={disabled || !date}
          aria-label={ariaLabel ? `${ariaLabel} (hora)` : 'Hora'}
        />
      ) : null}
      {date ? (
        <button
          type="button"
          className="datetime-picker-clear"
          onClick={() => emit('', '')}
          disabled={disabled}
          aria-label="Limpiar fecha"
        >
          ×
        </button>
      ) : null}
    </div>
  )
}
