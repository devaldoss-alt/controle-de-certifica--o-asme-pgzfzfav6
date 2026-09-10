import React, { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar as CalendarIcon, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface HybridDatePickerProps {
  value?: string // YYYY-MM-DD or empty
  onChange: (isoDate: string) => void
  placeholder?: string
  className?: string
  disabled?: boolean
}

function isoToBr(iso?: string): string {
  if (!iso) return ''
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (!m) return ''
  return `${m[3]}/${m[2]}/${m[1]}`
}

function brToIso(br?: string): string | null {
  if (!br) return null
  const m = br.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  if (!m) return null
  const [, d, mo, y] = m
  const day = parseInt(d, 10)
  const month = parseInt(mo, 10)
  const year = parseInt(y, 10)
  if (month < 1 || month > 12) return null
  if (day < 1 || day > 31) return null
  return `${y}-${mo.padStart(2, '0')}-${d.padStart(2, '0')}`
}

export function HybridDatePicker({
  value,
  onChange,
  placeholder = 'DD/MM/AAAA',
  className,
  disabled = false,
}: HybridDatePickerProps) {
  const [textVal, setTextVal] = useState(isoToBr(value))
  const [popoverOpen, setPopoverOpen] = useState(false)

  useEffect(() => {
    setTextVal(isoToBr(value))
  }, [value])

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value.replace(/[^\d]/g, '').slice(0, 8)
    if (raw.length > 4) {
      raw = `${raw.slice(0, 2)}/${raw.slice(2, 4)}/${raw.slice(4)}`
    } else if (raw.length > 2) {
      raw = `${raw.slice(0, 2)}/${raw.slice(2)}`
    }
    setTextVal(raw)

    if (raw.length === 10) {
      const iso = brToIso(raw)
      if (iso) onChange(iso)
    } else if (raw.length === 0) {
      onChange('')
    }
  }

  const handleNativeDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const iso = e.target.value
    onChange(iso)
    setTextVal(isoToBr(iso))
    setPopoverOpen(false)
  }

  const clear = () => {
    setTextVal('')
    onChange('')
  }

  return (
    <div className={cn('relative flex items-center', className)}>
      <Input
        value={textVal}
        onChange={handleTextChange}
        placeholder={placeholder}
        maxLength={10}
        disabled={disabled}
        className="bg-black/20 border-white/10 text-white pr-16 font-mono text-xs"
      />
      <div className="absolute right-1 flex items-center gap-0.5">
        {textVal && !disabled && (
          <button
            type="button"
            onClick={clear}
            className="p-1 text-muted-foreground hover:text-white rounded"
            title="Limpar"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
        <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={disabled}
              className="h-7 w-7 p-0 text-muted-foreground hover:text-white hover:bg-white/10"
            >
              <CalendarIcon className="w-3.5 h-3.5" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-3 bg-zinc-900 border-white/10 text-white" align="end">
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground block font-sans">
                Selecione no calendário:
              </label>
              <Input
                type="date"
                value={value || ''}
                onChange={handleNativeDateChange}
                className="bg-black/40 border-white/10 text-white text-xs"
              />
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  )
}
