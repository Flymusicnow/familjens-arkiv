"use client"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"

interface Task {
  id: string
  title: string
  description?: string
  completed: boolean
  points?: number
}

const FILTERS = ["Alla", "🏠 Hem", "👶 Barn", "✅ Klara"]

export default function UppgifterPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState("Alla")
  const supabase = createClient()

  useEffect(() => { load() }, [])

  async function load() {
    try {
      const { data } = await supabase.from("tasks").select("*").order("created_at", { ascending: false })
      if (data) setTasks(data)
    } finally { setLoading(false) }
  }

  async function toggle(id: string, completed: boolean) {
    await supabase.from("tasks").update({ completed: !completed }).eq("id", id)
    load()
  }

  const totalPoints = tasks.filter(t => t.completed).reduce((s, t) => s + (t.points || 10), 0)
  const active = tasks.filter(t => !t.completed)

  return (
    <div className="px-4 pt-6 pb-28 min-h-screen">
      <div className="flex items-start justify-between mb-6">
        <div>
          <p className="text-[11px] font-bold tracking-[0.18em] uppercase text-white/30 mb-1">Familjen</p>
          <h1 className="text-[32px] font-black text-white tracking-tight">Uppgifter</h1>
        </div>
        <button className="mt-1 bg-[#7C71FF] text-white text-[13px] font-bold px-4 min-h-[44px] rounded-2xl">+ Ny</button>
      </div>

      <div className="flex items-center justify-between bg-[#FBBF24]/10 border border-[#FBBF24]/20 rounded-2xl p-6 mb-6">
        <div>
          <p className="text-[11px] font-bold tracking-[0.18em] uppercase text-[#FBBF24]/60 mb-2">Familjepoäng idag</p>
          <div className="flex items-baseline gap-2">
            <span className="text-[56px] font-black text-[#FBBF24] leading-none">{totalPoints}</span>
            <span className="text-[22px] font-semibold text-[#FBBF24]/40">poäng</span>
          </div>
        </div>
        <span className="text-[56px]">🏆</span>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 mb-5">
        {FILTERS.map(f => (
          <button key={f} onClick={() => setActiveFilter(f)}
            className={`flex-shrink-0 h-10 px-4 rounded-full border text-[13px] font-semibold whitespace-nowrap transition-all ${activeFilter === f ? "bg-[#7C71FF] border-[#7C71FF] text-white" : "border-white/[0.1] text-white/40"}`}>
            {f}
          </button>
        ))}
      </div>

      {loading && <div className="flex justify-center py-16"><div className="w-8 h-8 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" /></div>}

      {!loading && active.length === 0 && (
        <div className="flex flex-col items-center justify-center py-14 px-6 text-center bg-[#141420] border border-white/[0.07] rounded-2xl">
          <span className="text-[52px] mb-4 block">🎉</span>
          <h3 className="text-xl font-bold text-white mb-2">Inga uppgifter!</h3>
          <p className="text-[15px] text-white/40 leading-relaxed max-w-[260px]">Lägg till uppgifter med knappen ovan och tjäna familjepoäng.</p>
        </div>
      )}

      {!loading && active.map(task => (
        <div key={task.id} onClick={() => toggle(task.id, task.completed)}
          className="flex items-center gap-4 bg-[#141420] border border-white/[0.07] rounded-2xl p-5 mb-3 cursor-pointer active:scale-[0.98] transition-transform">
          <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${task.completed ? "bg-[#34D399] border-[#34D399]" : "border-white/20"}`}>
            {task.completed && <span className="text-white text-[14px]">✓</span>}
          </div>
          <div className="flex-1 min-w-0">
            <p className={`text-[15px] font-semibold ${task.completed ? "text-white/40 line-through" : "text-white"}`}>{task.title}</p>
            {task.description && <p className="text-[12px] text-white/30 mt-0.5 truncate">{task.description}</p>}
          </div>
          <span className="text-[13px] font-bold text-[#FBBF24]/60 flex-shrink-0">+{task.points || 10}p</span>
        </div>
      ))}
    </div>
  )
}
