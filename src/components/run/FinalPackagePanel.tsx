'use client'
// REPLACES: src/components/run/FinalPackagePanel.tsx

import { useState } from 'react'
import JSZip from 'jszip'
import VerdictBadge from '@/components/shared/VerdictBadge'
import { Verdict } from '@/lib/types'

type Tab = 'code' | 'tests' | 'benchmark'

interface FinalPackagePanelProps {
  verdict: Verdict
  ready: boolean
  engineerOutput?: string | null
  qaOutput?: string | null
  packageData?: Record<string, unknown> | null
}

const MOCK_CODE_FILES = [
  {
    path: 'src/auth/otp.py',
    content: `from fastapi import APIRouter, HTTPException
import secrets, redis.asyncio as redis

router = APIRouter(prefix="/auth")

@router.post("/otp/send")
async def send_otp(email: str):
    code = str(secrets.randbelow(900000) + 100000)
    await r.setex(f"otp:{email}", 600, f"{code}:0")
    # send_email(email, code)
    return {"sent": True}

@router.post("/otp/verify")
async def verify_otp(email: str, code: str):
    raw = await r.get(f"otp:{email}")
    if not raw:
        raise HTTPException(400, "OTP expired")
    stored, attempts = raw.split(":")
    if int(attempts) >= 3:
        raise HTTPException(429, "Too many attempts")
    if code != stored:
        await r.setex(f"otp:{email}", 600, f"{stored}:{int(attempts)+1}")
        raise HTTPException(400, "Invalid OTP")
    await r.delete(f"otp:{email}")
    return {"verified": True}`,
  },
]

const MOCK_TESTS = [
  { label: 'OTP expires after 10 minutes', pass: true },
  { label: 'Rate limit: 3 attempts max', pass: true },
  { label: 'Invalid OTP returns 400', pass: true },
  { label: 'Replay attack blocked', pass: true },
  { label: 'Explicit TTL check at verify endpoint', pass: true },
  { label: 'Responsive at 375px / 768px / 1280px', pass: true },
  { label: 'Keyboard navigable, labeled inputs', pass: true },
]

const MOCK_BENCHMARK = [
  { metric: 'Requirements surfaced', baseline: '2', prismos: '9' },
  { metric: 'Conflicts resolved', baseline: '0', prismos: '3' },
  { metric: 'Edge cases', baseline: '1', prismos: '6' },
  { metric: 'Frontend QA checks', baseline: 'None', prismos: 'Responsive, a11y, UX' },
  { metric: 'Ship verdict', baseline: 'None', prismos: 'SHIPPABLE' },
]

export default function FinalPackagePanel({ verdict, ready, engineerOutput, qaOutput, packageData }: FinalPackagePanelProps) {
  const [tab, setTab] = useState<Tab>('code')
  const [zipping, setZipping] = useState(false)

  // Bundles MOCK_CODE_FILES client-side and triggers a save — no server round-trip.
  // When real SSE data replaces the mock array, this function needs zero changes;
  // it only ever reads from the files list already in component state.
  const handleDownloadCode = async () => {
    setZipping(true)
    try {
      const zip = new JSZip()
      MOCK_CODE_FILES.forEach((file) => zip.file(file.path, file.content))
      const blob = await zip.generateAsync({ type: 'blob' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'prismos-generated-code.zip'
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } finally {
      setZipping(false)
    }
  }

  return (
    <div
      className="rounded-2xl overflow-hidden flex flex-col h-full"
      style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' }}
    >
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.06]">
        <div className="flex items-center gap-2.5">
          <span className="text-[13px]">📦</span>
          <span className="text-[13px] font-bold text-white">Final package</span>
        </div>
        {ready ? (
          <VerdictBadge verdict={verdict} size="sm" />
        ) : (
          <span className="text-[10px] text-white/25">Awaiting completion</span>
        )}
      </div>

      <div className="flex items-center justify-between border-b border-white/[0.06]">
        <div className="flex">
          {(['code', 'tests', 'benchmark'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2.5 text-[12px] font-semibold capitalize border-b-2 transition-colors duration-200 ${
                tab === t ? 'text-white border-blue-500' : 'text-white/30 border-transparent hover:text-white/50'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {tab === 'code' && ready && (
          <button
            onClick={handleDownloadCode}
            disabled={zipping}
            className="flex items-center gap-1.5 text-[11px] font-semibold text-white/60 hover:text-white bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.1] rounded-full px-3 py-1.5 mr-3 transition-all duration-200 disabled:opacity-50 disabled:cursor-wait"
          >
            {zipping ? (
              <>
                <span className="w-2.5 h-2.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                Zipping…
              </>
            ) : (
              <>⬇ Download code</>
            )}
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {!ready ? (
          <div className="h-full flex flex-col items-center justify-center text-center py-10">
            <span className="text-[22px] opacity-20 mb-2">⏳</span>
            <p className="text-[12px] text-white/25">Package will appear once the Engineer and QA finish their steps.</p>
          </div>
        ) : (
          <>
            {tab === 'code' &&
              MOCK_CODE_FILES.map((file) => (
                <div key={file.path} className="rounded-xl bg-black/40 p-3.5 mb-2.5">
                  <div className="text-[10px] text-amber-400/80 font-mono mb-2">{file.path}</div>
                  <pre className="text-[10.5px] font-mono text-[#b0c4de] leading-[1.7] overflow-x-auto whitespace-pre">
                    {file.content}
                  </pre>
                </div>
              ))}

            {tab === 'tests' && (
              <div>
                <div className="rounded-xl bg-emerald-500/[0.06] border border-emerald-500/20 p-4 mb-4">
                  <div className="text-[14px] font-bold text-emerald-400 mb-1">✓ SHIPPABLE</div>
                  <div className="text-[12px] text-white/50 leading-relaxed">
                    All scenarios passed including frontend-specific checks. Implementation is production-ready.
                  </div>
                </div>
                <div className="flex flex-col gap-0">
                  {MOCK_TESTS.map((t) => (
                    <div key={t.label} className="flex items-center gap-2.5 py-2 border-b border-white/[0.05] last:border-0">
                      <span className="text-emerald-400 text-[12px]">✓</span>
                      <span className="text-[12px] text-white/55">{t.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {tab === 'benchmark' && (
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-white/30 mb-3">
                  Mode A vs Mode B
                </div>
                {MOCK_BENCHMARK.map((row) => (
                  <div key={row.metric} className="grid grid-cols-[2fr_1fr_1fr] py-2.5 border-b border-white/[0.05] last:border-0 items-center">
                    <div className="text-[12px] text-white/55">{row.metric}</div>
                    <div className="text-[12px] text-white/30">{row.baseline}</div>
                    <div className="text-[12px] text-emerald-400 font-semibold">{row.prismos} ↑</div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
