'use client'

import { useEffect, useRef, useState } from 'react'

interface BloomMessage { title: string; sub: string; id: number }

let listeners: ((msg: BloomMessage) => void)[] = []

export function bloom(title: string, sub = '') {
  const id = Date.now()
  listeners.forEach(fn => fn({ title, sub, id }))
}

export default function BloomToast() {
  const [toasts, setToasts] = useState<BloomMessage[]>([])
  const timers = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map())

  useEffect(() => {
    const handler = (msg: BloomMessage) => {
      setToasts(prev => [...prev, msg])
      const t = setTimeout(() => {
        setToasts(prev => prev.filter(m => m.id !== msg.id))
        timers.current.delete(msg.id)
      }, 3200)
      timers.current.set(msg.id, t)
    }
    listeners.push(handler)
    return () => {
      listeners = listeners.filter(fn => fn !== handler)
      timers.current.forEach(t => clearTimeout(t))
    }
  }, [])

  return (
    <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[200] flex flex-col gap-2 pointer-events-none"
      style={{ maxWidth: '340px', width: '90vw' }}>
      {toasts.map(msg => (
        <div key={msg.id} className="bloom-enter rounded-2xl px-5 py-3.5 shadow-xl"
          style={{
            background: 'rgba(26,26,46,0.97)',
            border: '1px solid rgba(123,110,255,0.3)',
            backdropFilter: 'blur(16px)',
          }}>
          <div className="font-bold text-[15px]" style={{ color: '#F2F2FF' }}>{msg.title}</div>
          {msg.sub && <div className="text-[13px] mt-0.5" style={{ color: '#9898B8' }}>{msg.sub}</div>}
        </div>
      ))}
    </div>
  )
}
