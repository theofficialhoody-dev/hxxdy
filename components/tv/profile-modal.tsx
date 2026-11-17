'use client'

import { useEffect, useRef, useState } from 'react'
import { EyeOff, Pencil, Plus, Trash2, UserRound, X } from 'lucide-react'
import { MAX_PROFILES, type Profile } from '@/lib/profiles'
import { cn } from '@/lib/utils'

type ProfileModalProps = {
  isOpen: boolean
  profiles: Profile[]
  activeId: string
  onClose: () => void
  onSwitch: (id: string) => void
  onAdd: () => void
  onRename: (id: string, name: string) => void
  onDelete: (id: string) => void
  onRestoreHidden: (id: string) => void
}

type Action = 'rename' | 'delete' | 'restore' | 'close'

export function ProfileModal({
  isOpen,
  profiles,
  activeId,
  onClose,
  onSwitch,
  onAdd,
  onRename,
  onDelete,
  onRestoreHidden,
}: ProfileModalProps) {
  const canAdd = profiles.length < MAX_PROFILES
  const cardCount = profiles.length + (canAdd ? 1 : 0)
  const [row, setRow] = useState<0 | 1>(0)
  const [card, setCard] = useState(0)
  const [action, setAction] = useState(0)
  const [editing, setEditing] = useState<string | null>(null)
  const [draft, setDraft] = useState('')
  const cardRefs = useRef<(HTMLButtonElement | null)[]>([])
  const actionRefs = useRef<(HTMLButtonElement | null)[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  const selected = profiles[card]
  const actions: { id: Action; label: string; icon: typeof Pencil }[] = selected
    ? [
        { id: 'rename', label: 'Rename', icon: Pencil },
        ...(profiles.length > 1 ? [{ id: 'delete' as const, label: 'Delete', icon: Trash2 }] : []),
        ...(selected.hidden.length ? [{ id: 'restore' as const, label: `Restore ${selected.hidden.length} hidden`, icon: EyeOff }] : []),
        { id: 'close', label: 'Done', icon: X },
      ]
    : [{ id: 'close', label: 'Done', icon: X }]

  useEffect(() => {
    if (!isOpen) return
    setRow(0)
    setEditing(null)
    setCard(Math.max(0, profiles.findIndex((p) => p.id === activeId)))
    // Only reset on open.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen])

  useEffect(() => {
    if (!isOpen || editing) return
    if (row === 0) cardRefs.current[Math.min(card, cardCount - 1)]?.focus({ preventScroll: true })
    else actionRefs.current[Math.min(action, actions.length - 1)]?.focus({ preventScroll: true })
  }, [isOpen, row, card, action, editing, cardCount, actions.length])

  useEffect(() => {
    if (editing) inputRef.current?.select()
  }, [editing])

  const commitRename = () => {
    if (editing) onRename(editing, draft.trim() || profiles.find((p) => p.id === editing)?.name || 'Profile')
    setEditing(null)
  }

  const runAction = (id: Action) => {
    if (!selected) return onClose()
    if (id === 'rename') {
      setDraft(selected.name)
      setEditing(selected.id)
    } else if (id === 'delete') {
      onDelete(selected.id)
      setRow(0)
      setCard(0)
    } else if (id === 'restore') {
      onRestoreHidden(selected.id)
    } else {
      onClose()
    }
  }

  const activateCard = (index: number) => {
    if (index >= profiles.length) {
      onAdd()
      setCard(profiles.length)
    } else {
      onSwitch(profiles[index].id)
    }
  }

  useEffect(() => {
    if (!isOpen) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (editing) {
        if (e.key === 'Escape') {
          e.preventDefault()
          setEditing(null)
        } else if (e.key === 'Enter') {
          e.preventDefault()
          commitRename()
        }
        return
      }
      switch (e.key) {
        case 'Escape':
        case 'Backspace':
          e.preventDefault()
          if (row === 1) setRow(0)
          else onClose()
          break
        case 'ArrowLeft':
        case 'ArrowRight': {
          e.preventDefault()
          const d = e.key === 'ArrowLeft' ? -1 : 1
          if (row === 0) setCard((c) => Math.min(cardCount - 1, Math.max(0, c + d)))
          else setAction((a) => Math.min(actions.length - 1, Math.max(0, a + d)))
          break
        }
        case 'ArrowDown':
          e.preventDefault()
          if (row === 0 && card < profiles.length) {
            setAction(0)
            setRow(1)
          }
          break
        case 'ArrowUp':
          e.preventDefault()
          setRow(0)
          break
        case 'Enter':
        case ' ':
          e.preventDefault()
          if (row === 0) activateCard(card)
          else runAction(actions[Math.min(action, actions.length - 1)].id)
          break
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  })

  if (!isOpen) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="profile-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-6 animate-in fade-in duration-300"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.84)' }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        className="flex w-full max-w-[1000px] flex-col items-center gap-[4vh] rounded-[28px] border border-white/15 bg-neutral-950/90 px-10 py-12 text-white animate-in zoom-in-95 slide-in-from-bottom-4 duration-300"
        style={{ boxShadow: '0 0 80px var(--tv-glow, rgba(56,189,248,0.2))' }}
      >
        <div className="flex flex-col items-center gap-2">
          <span
            className="grid size-12 place-items-center rounded-2xl"
            style={{ backgroundColor: 'var(--tv-accent, #38bdf8)', color: 'var(--tv-accent-text, #000)' }}
          >
            <UserRound className="size-6" />
          </span>
          <h2 id="profile-modal-title" className="text-3xl font-bold tracking-tight">
            Who&apos;s watching?
          </h2>
          <p className="text-sm text-white/60">Each profile keeps its own theme and Continue Watching list.</p>
        </div>

        <ul className="flex flex-wrap items-start justify-center gap-[2vw]">
          {profiles.map((profile, i) => {
            const focused = row === 0 && card === i
            const isActive = profile.id === activeId
            return (
              <li key={profile.id} className="flex w-[10vw] min-w-[120px] flex-col items-center gap-3 animate-in fade-in zoom-in-90 duration-300" style={{ animationDelay: `${i * 50}ms` }}>
                <button
                  ref={(el) => {
                    cardRefs.current[i] = el
                  }}
                  type="button"
                  onMouseEnter={() => {
                    setRow(0)
                    setCard(i)
                  }}
                  onClick={() => activateCard(i)}
                  className={cn(
                    'relative grid aspect-square w-full place-items-center rounded-[28%] text-5xl font-bold text-black outline-none transition-all duration-300',
                    focused ? 'scale-110 ring-4 ring-white shadow-[0_12px_40px_rgba(0,0,0,0.6)]' : 'opacity-80',
                  )}
                  style={{ backgroundColor: profile.color }}
                >
                  {profile.name.slice(0, 1).toUpperCase()}
                  {isActive && <span className="absolute -right-1 -top-1 size-5 rounded-full bg-emerald-400 ring-4 ring-neutral-950" />}
                </button>
                {editing === profile.id ? (
                  <input
                    ref={inputRef}
                    value={draft}
                    maxLength={14}
                    onChange={(e) => setDraft(e.target.value)}
                    onBlur={commitRename}
                    className="w-full rounded-lg bg-white/10 px-2 py-1 text-center text-lg outline-none ring-2 ring-white/60"
                    autoFocus
                  />
                ) : (
                  <span className={cn('max-w-full truncate text-lg font-medium', focused ? 'text-white' : 'text-white/60')}>{profile.name}</span>
                )}
              </li>
            )
          })}
          {canAdd && (
            <li className="flex w-[10vw] min-w-[120px] flex-col items-center gap-3 animate-in fade-in zoom-in-90 duration-300" style={{ animationDelay: `${profiles.length * 50}ms` }}>
              <button
                ref={(el) => {
                  cardRefs.current[profiles.length] = el
                }}
                type="button"
                onMouseEnter={() => {
                  setRow(0)
                  setCard(profiles.length)
                }}
                onClick={() => activateCard(profiles.length)}
                className={cn(
                  'grid aspect-square w-full place-items-center rounded-[28%] border-2 border-dashed border-white/40 text-white outline-none transition-all duration-300',
                  row === 0 && card === profiles.length ? 'scale-110 border-white bg-white/15 ring-4 ring-white' : 'opacity-70',
                )}
              >
                <Plus className="size-1/3" />
              </button>
              <span className="text-lg font-medium text-white/60">Add profile</span>
            </li>
          )}
        </ul>

        <div className="flex min-h-[3.5rem] items-center justify-center gap-3">
          {actions.map((a, i) => {
            const Icon = a.icon
            const focused = row === 1 && action === i
            return (
              <button
                key={a.id}
                ref={(el) => {
                  actionRefs.current[i] = el
                }}
                type="button"
                onClick={() => {
                  setRow(1)
                  setAction(i)
                  runAction(a.id)
                }}
                className={cn(
                  'flex items-center gap-2 rounded-full border px-5 py-2.5 text-sm font-semibold outline-none transition-all duration-300',
                  focused ? 'scale-105 border-transparent' : 'border-white/20 bg-white/5 text-white/80',
                )}
                style={focused ? { backgroundColor: 'var(--tv-accent, #fff)', color: 'var(--tv-accent-text, #000)' } : undefined}
              >
                <Icon className="size-4" />
                {a.label}
              </button>
            )
          })}
        </div>
        <p className="text-xs text-white/40">OK to switch · Down for rename and delete · Back to close</p>
      </div>
    </div>
  )
}
