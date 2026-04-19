"use client"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"

interface Bill {
  id: string
  title: string
  sender: string
  amount: number
  due_date: string
  status: "akut" | "snart" | "betald" | "kommande"
}

function formatAmount(n: number) {
  return n.toLocaleString("sv-SE") + " kr"
}

function daysUntil(dateStr: string) {
  return Math.ceil((new Date(dateStr).getTime() - new Date().getTime()) / 86400000)
}

function EmptyState({ emoji, title, text }: { emoji: string; title: string; text: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-14 px-6 text-center bg-white border border-[rgba(28,26,23,0.10)] rounded-2xl">
      <span className="text-[52px] mb-4 block">{emoji}</span>
      <h3 className="text-xl font-bold text-[#1C1A17] mb-2">{title}</h3>
      <p className="text-[15px] text-[#9C9690] leading-relaxed">{text}</p>
    </div>
  )
}

function BillCard({ bill, onPay, onSnooze }: { bill: Bill; onPay: () => void; onSnooze: () => void }) {
  const isAkut = bill.status === "akut"
  const color = isAkut ? "#A0522D" : "#8B6914"
  const cardBg = isAkut ? "#EDD5C4" : "#EAD9AA"
  const days = daysUntil(bill.due_date)
  return (
    <div className="relative rounded-2xl overflow-hidden mb-4" style={{ background: cardBg, border: `1px solid ${isAkut ? "rgba(160,82,45,0.2)" : "rgba(139,105,20,0.2)"}` }}>
      <div className="absolute left-0 top-0 bottom-0 w-1" style={{ background: color }} />
      <div className="pl-6 pr-5 pt-5 pb-5">
        <div className="flex items-start justify-between gap-3 mb-5">
          <div className="flex-1 min-w-0">
            <h3 className="text-[17px] font-bold text-[#1C1A17] mb-1 truncate">{bill.title}</h3>
            <p className="text-[13px] text-[#9C9690]">{bill.sender} · {days <= 0 ? "Idag" : days === 1 ? "Imorgon" : `Om ${days} dagar`}</p>
          </div>
          <div className="text-right flex-shrink-0">
            <div className="text-[26px] font-black" style={{ color }}>{formatAmount(bill.amount)}</div>
            <div className="text-[10px] font-bold uppercase tracking-wider mt-1" style={{ color }}>{isAkut ? "Akut" : "Snart"}</div>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={onSnooze} className="flex-1 flex items-center justify-center gap-2 min-h-[52px] rounded-2xl bg-[#EAE4DC] border border-[rgba(28,26,23,0.10)] text-[#5C5650] text-[14px] font-bold active:scale-[0.97] transition-transform">⏰ Snooze</button>
          <button onClick={onPay} className="flex-1 flex items-center justify-center gap-2 min-h-[52px] rounded-2xl text-white text-[14px] font-bold active:scale-[0.97] transition-transform" style={{ background: color }}>✓ Betald</button>
        </div>
      </div>
    </div>
  )
}

export default function RakningarPage() {
  const [bills, setBills] = useState<Bill[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => { load() }, [])

  async function load() {
    try {
      const { data } = await supabase.from("bills").select("*").is("deleted_at", null).order("due_date", { ascending: true })
      if (data) setBills(data)
    } finally { setLoading(false) }
  }

  async function markPaid(id: string) {
    await supabase.from("bills").update({ status: "betald" }).eq("id", id)
    load()
  }

  async function snooze(id: string) {
    const bill = bills.find(b => b.id === id)
    if (!bill) return
    const d = new Date(bill.due_date)
    d.setDate(d.getDate() + 3)
    await supabase.from("bills").update({ due_date: d.toISOString().split("T")[0], status: "snart" }).eq("id", id)
    load()
  }

  const akuta = bills.filter(b => b.status === "akut")
  const snart = bills.filter(b => b.status === "snart")
  const betalda = bills.filter(b => b.status === "betald")
  const total = [...akuta, ...snart].reduce((s, b) => s + b.amount, 0)

  return (
    <div className="px-5 pt-8 pb-32 min-h-screen max-w-3xl mx-auto">
      <div className="flex items-start justify-between mb-8">
        <div>
          <p className="text-[11px] font-bold tracking-[0.18em] uppercase text-[#9C9690] mb-2">Ekonomi</p>
          <h1 className="text-[36px] font-black text-[#1C1A17] tracking-tight">Räkningar</h1>
        </div>
        <button className="mt-2 bg-[#A0522D] text-white text-[14px] font-bold px-5 min-h-[48px] rounded-2xl">+ Lägg till</button>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: "Totalt", value: loading ? "–" : total > 0 ? Math.round(total/1000)+"k" : "0", color: "text-[#1C1A17]", labelColor: "text-[#9C9690]", sub: "kr" },
          { label: "Akuta",  value: loading ? "–" : String(akuta.length),  color: "text-[#A0522D]", labelColor: "text-[#A0522D]", sub: "st" },
          { label: "Snart",  value: loading ? "–" : String(snart.length),  color: "text-[#8B6914]", labelColor: "text-[#8B6914]", sub: "st" },
        ].map(s => (
          <div key={s.label} className="bg-white border border-[rgba(28,26,23,0.10)] rounded-2xl p-5 text-center shadow-sm">
            <p className={`text-[11px] font-bold tracking-[0.15em] uppercase mb-3 ${s.labelColor}`}>{s.label}</p>
            <p className={`text-[32px] font-black leading-none mb-1 ${s.color}`}>{s.value}</p>
            <p className="text-[12px] text-[#9C9690] mt-1">{s.sub}</p>
          </div>
        ))}
      </div>

      {loading && <div className="flex justify-center py-16"><div className="w-8 h-8 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" /></div>}

      {!loading && <>
        <div className="flex items-center gap-2 mb-4 mt-2">
          <span className="text-[11px] font-bold tracking-[0.18em] uppercase text-[#F87171]">🔴 Akuta</span>
          <div className="flex-1 h-px bg-white/[0.07]" />
        </div>
        {akuta.length === 0 ? <EmptyState emoji="✅" title="Allt klart!" text="Inga akuta räkningar 🎉" /> : akuta.map(b => <BillCard key={b.id} bill={b} onPay={() => markPaid(b.id)} onSnooze={() => snooze(b.id)} />)}

        <div className="flex items-center gap-2 mb-4 mt-6">
          <span className="text-[11px] font-bold tracking-[0.18em] uppercase text-[#FBBF24]">🟡 Snart förfaller</span>
          <div className="flex-1 h-px bg-white/[0.07]" />
        </div>
        {snart.length === 0 ? <EmptyState emoji="✅" title="Allt klart!" text="Inga räkningar inom 7 dagar" /> : snart.map(b => <BillCard key={b.id} bill={b} onPay={() => markPaid(b.id)} onSnooze={() => snooze(b.id)} />)}

        {betalda.length > 0 && <>
          <div className="flex items-center gap-2 mb-4 mt-6">
            <span className="text-[11px] font-bold tracking-[0.18em] uppercase text-[#34D399]">✅ Betalda</span>
            <div className="flex-1 h-px bg-white/[0.07]" />
          </div>
          {betalda.map(b => (
            <div key={b.id} className="flex items-center justify-between bg-white border border-[rgba(28,26,23,0.10)] rounded-2xl px-5 py-4 mb-3 opacity-40">
              <div><p className="text-[15px] font-semibold text-[#1C1A17]">{b.title}</p><p className="text-[12px] text-[#9C9690] mt-0.5">{b.sender}</p></div>
              <p className="text-[15px] font-bold text-[#34D399]">{formatAmount(b.amount)}</p>
            </div>
          ))}
        </>}
      </>}
    </div>
  )
}
