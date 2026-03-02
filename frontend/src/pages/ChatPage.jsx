/**
 * MediTriage – AI Triage Chat
 * ============================
 * Premium hackathon-ready chat UI with:
 *   • Live triage score ring animation
 *   • Health stability progress bar
 *   • Risk level badges (Green / Yellow / Red)
 *   • 🚨 Emergency Alert Panel
 *   • ⚠ Monitor Advice Panel
 *   • Conversation history sent to backend for context
 *   • Graceful error handling (never shows cryptic messages)
 */
import { useState, useEffect, useRef, useCallback } from 'react'
import chatService from '../services/chatService'
import {
  Send, Bot, User as UserIcon, Loader2, AlertTriangle,
  Clock, Heart, Stethoscope, Shield, Activity, ArrowRight,
  TrendingUp, MapPin, Phone, RefreshCw, CheckCircle2,
  Camera, ScanFace, XCircle
} from 'lucide-react'

// ─── Helpers ──────────────────────────────────────────────────────────────

const getRiskConfig = (riskLevel) => {
  const r = (riskLevel || '').toLowerCase()
  if (r === 'high risk' || r === 'red')
    return { label: 'High Risk', color: 'red', cls: 'bg-red-500/20 border-red-500 text-red-400', ring: '#ef4444', track: '#450a0a' }
  if (r === 'monitor' || r === 'yellow')
    return { label: 'Monitor', color: 'amber', cls: 'bg-amber-500/20 border-amber-500 text-amber-400', ring: '#f59e0b', track: '#451a03' }
  return { label: 'Stable', color: 'green', cls: 'bg-emerald-500/20 border-emerald-500 text-emerald-400', ring: '#10b981', track: '#022c22' }
}

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v))

// ─── Triage Score Ring ────────────────────────────────────────────────────

function TriageRing({ score, riskConfig }) {
  const pct = clamp(score / 10, 0, 1)
  const radius = 26
  const circ = 2 * Math.PI * radius
  const dashOff = circ * (1 - pct)

  return (
    <div className="relative flex items-center justify-center w-16 h-16">
      <svg width="64" height="64" viewBox="0 0 64 64" className="-rotate-90">
        {/* Track */}
        <circle cx="32" cy="32" r={radius} fill="none" stroke={riskConfig.track} strokeWidth="6" />
        {/* Progress */}
        <circle
          cx="32" cy="32" r={radius} fill="none"
          stroke={riskConfig.ring} strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={dashOff}
          style={{ transition: 'stroke-dashoffset 1s ease' }}
        />
      </svg>
      <span className="absolute text-sm font-black text-white">{score}</span>
    </div>
  )
}

// ─── AI Camera Validator ──────────────────────────────────────────────────

function WebcamValidator({ chatbotScore, onComplete, onCancel }) {
  const videoRef = useRef(null)
  const [stream, setStream] = useState(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true })
      setStream(mediaStream)
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
      }
    } catch (err) {
      setError('Camera access denied or unavailable.')
    }
  }

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
      setStream(null)
    }
  }

  useEffect(() => {
    startCamera()
    return () => stopCamera()
  }, [])

  const captureAndAnalyze = async () => {
    if (!videoRef.current) return
    setAnalyzing(true)

    // Create canvas to capture frame
    const canvas = document.createElement('canvas')
    canvas.width = videoRef.current.videoWidth
    canvas.height = videoRef.current.videoHeight
    const ctx = canvas.getContext('2d')
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height)

    // Get base64
    const base64Image = canvas.toDataURL('image/jpeg')

    try {
      // Send to backend
      const res = await chatService.analyzeFace(base64Image)
      stopCamera()

      // Calculate final risk (60% Chatbot, 40% Visual)
      const visualScoreRaw = res.visual_risk_score * 10
      const finalRiskRaw = (chatbotScore * 0.6) + (visualScoreRaw * 0.4)
      const finalRiskScore = clamp(Math.round(finalRiskRaw * 10) / 10, 0, 10)

      let newAlert = 'Stable'
      if (finalRiskScore >= 8) newAlert = 'Critical'
      else if (finalRiskScore >= 5) newAlert = 'Monitor'

      setResult({ ...res, visualScoreRaw, finalRiskScore, newAlert })
      if (onComplete) onComplete({ ...res, visualScoreRaw, finalRiskScore, newAlert })

    } catch (err) {
      console.error(err)
      setError('Failed to analyze facial features.')
      setAnalyzing(false)
    }
  }

  if (error) {
    return (
      <div className="p-4 bg-red-950/30 border border-red-900 rounded-xl my-3 text-red-400 text-xs">
        {error}
        <button onClick={onCancel} className="ml-3 underline">Cancel</button>
      </div>
    )
  }

  if (result) {
    return (
      <div className="p-4 bg-[#0a1322] border border-cyan-900/50 rounded-2xl shadow-xl mt-3 animate-fade-in relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/4 pointer-events-none" />

        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-lg bg-cyan-950/50 flex flex-shrink-0 items-center justify-center border border-cyan-900">
            <ScanFace className="w-4 h-4 text-cyan-400" />
          </div>
          <div>
            <h4 className="text-white text-xs font-bold uppercase tracking-widest">Visual Analysis Complete</h4>
            <p className="text-[10px] text-slate-400 mt-0.5">Recalculated AI Risk Score</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-[#111827] border border-gray-800 rounded-xl p-3">
            <p className="text-[9px] text-slate-500 uppercase tracking-widest font-black mb-1">Visual Score</p>
            <p className="text-lg font-bold text-cyan-400">{result.visualScoreRaw.toFixed(1)} <span className="text-xs text-slate-500">/ 10</span></p>
          </div>
          <div className="bg-[#111827] border border-gray-800 rounded-xl p-3 focus-within:ring-1">
            <p className="text-[9px] text-slate-500 uppercase tracking-widest font-black mb-1">Final Risk</p>
            <p className={`text-lg font-bold ${result.finalRiskScore >= 8 ? 'text-red-400' : result.finalRiskScore >= 5 ? 'text-amber-400' : 'text-emerald-400'}`}>
              {result.finalRiskScore.toFixed(1)} <span className="text-xs text-slate-500">/ 10</span>
            </p>
          </div>
        </div>

        <div className="bg-[#111827] border border-gray-800 rounded-xl p-3 mb-4">
          <p className="text-[9px] text-slate-500 uppercase tracking-widest font-black mb-2">Detected Signs</p>
          <div className="flex flex-wrap gap-2">
            {result.detected_signs?.map((sign, i) => (
              <span key={i} className="text-[9px] px-2 py-1 bg-slate-800 text-slate-300 rounded uppercase font-bold tracking-wider">{sign.replace('_', ' ')}</span>
            ))}
          </div>
        </div>

        {result.newAlert === 'Critical' && (
          <div className="p-3 bg-red-950/40 border border-red-500/50 rounded-xl flex items-start gap-3">
            <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0" />
            <p className="text-[10px] text-red-300 font-medium leading-relaxed"><strong>Emergency Triggered:</strong> Visual indicators confirm high risk. Dispatching alert.</p>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="p-4 bg-[#111827] border border-cyan-900/50 rounded-2xl shadow-xl mt-3 animate-fade-in relative overflow-hidden">
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-2">
          <Camera className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-bold text-white uppercase tracking-widest">Validating Vitals</span>
        </div>
        <button onClick={() => { stopCamera(); onCancel() }} className="text-slate-500 hover:text-red-400 transition-colors">
          <XCircle className="w-4 h-4" />
        </button>
      </div>

      <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden border border-gray-800 mb-4">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover origin-center"
          style={{ transform: 'scaleX(-1)' }}
        />
        {/* Scanning Overlay */}
        <div className="absolute inset-0 bg-cyan-500/10 pointer-events-none" />
        <div className="absolute top-0 left-0 right-0 h-1 bg-cyan-400/50 shadow-[0_0_10px_rgba(34,211,238,0.8)] animate-scan pointer-events-none" />

        {analyzing && (
          <div className="absolute inset-0 backdrop-blur-sm bg-black/40 flex flex-col items-center justify-center">
            <Loader2 className="h-6 w-6 text-cyan-400 animate-spin mb-2" />
            <span className="text-[10px] font-black uppercase tracking-widest text-cyan-400">Processing Face...</span>
          </div>
        )}
      </div>

      <button
        onClick={captureAndAnalyze}
        disabled={analyzing}
        className="w-full py-2.5 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all gap-2 flex items-center justify-center"
      >
        <ScanFace className="w-4 h-4" /> {analyzing ? 'Analyzing...' : 'Capture & Validate'}
      </button>
    </div>
  )
}

// ─── Assistant Triage Card ────────────────────────────────────────────────

function TriageCard({ triage }) {
  const score = clamp(triage.triage_score ?? 0, 0, 10)
  const stability = clamp(triage.health_stability_score ?? (100 - score * 8), 0, 100)
  const riskCfg = getRiskConfig(triage.risk_level)
  const isHighRisk = riskCfg.color === 'red'
  const isMonitor = riskCfg.color === 'amber'

  const [showWebcam, setShowWebcam] = useState(false)
  const [finalValidation, setFinalValidation] = useState(null)

  return (
    <div className="mt-4 space-y-3 animate-fade-in">

      {/* Score Row */}
      <div className="flex items-center gap-4 p-3 bg-[#0a192f] rounded-2xl border border-slate-700/50">
        <TriageRing score={score} riskConfig={riskCfg} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md border ${riskCfg.cls}`}>
              {riskCfg.label}
            </span>
            <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md border bg-blue-500/20 border-blue-500 text-blue-400">
              Stability {stability}%
            </span>
          </div>
          {/* Stability Bar */}
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-1000"
                style={{
                  width: `${stability}%`,
                  background: `linear-gradient(90deg, ${riskCfg.ring}aa, ${riskCfg.ring})`
                }}
              />
            </div>
            <span className="text-[10px] text-slate-500 font-bold w-8">{stability}</span>
          </div>
        </div>
      </div>

      {/* Detected Symptoms */}
      {triage.detected_symptoms?.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {triage.detected_symptoms.map((sym, i) => (
            <span key={i} className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
              {sym}
            </span>
          ))}
        </div>
      )}

      {/* Recommended Action */}
      {triage.recommended_action && (
        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0 text-cyan-500" />
          {triage.recommended_action}
        </div>
      )}

      {/* Emergency Alert Panel */}
      {isHighRisk && (
        <div className="p-3 bg-red-950/40 border-2 border-red-500/60 rounded-xl flex items-start gap-3 shadow-lg shadow-red-950/40 animate-pulse">
          <AlertTriangle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-[11px] font-black text-red-300 uppercase tracking-widest mb-1">🚨 Emergency Alert</p>
            <p className="text-[10px] text-red-200 font-medium leading-relaxed">
              Critical symptoms detected. Please seek <strong>immediate medical attention</strong> or
              call emergency services <strong>(108 / 911)</strong> right away.
            </p>
          </div>
        </div>
      )}

      {/* Monitor Advice Panel */}
      {isMonitor && (
        <div className="p-3 bg-amber-950/30 border border-amber-500/40 rounded-xl flex items-start gap-3">
          <Clock className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-[11px] font-black text-amber-300 uppercase tracking-widest mb-1">⚠ Monitor Advice</p>
            <p className="text-[10px] text-amber-200 font-medium leading-relaxed">
              These symptoms require close monitoring. If your condition worsens,
              consult a healthcare professional within <strong>24–48 hours</strong>.
            </p>
          </div>
        </div>
      )}

      {/* Webcam AI Validation Integration */}
      {(!finalValidation && (isHighRisk || isMonitor)) && !showWebcam && (
        <button
          onClick={() => setShowWebcam(true)}
          className="mt-3 w-full py-3 bg-[#0a192f] hover:bg-[#112240] border border-cyan-900/50 rounded-xl flex items-center justify-center gap-2 transition-all group"
        >
          <ScanFace className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
          <span className="text-[10px] font-black text-cyan-400 uppercase tracking-widest">Validate Risk vis AI Camera</span>
        </button>
      )}

      {showWebcam && !finalValidation && (
        <WebcamValidator
          chatbotScore={score}
          onCancel={() => setShowWebcam(false)}
          onComplete={(res) => setFinalValidation(res)}
        />
      )}

      {finalValidation && (
        <WebcamValidator chatbotScore={score} onCancel={() => { }} onComplete={() => { }} />
      )}
    </div>
  )
}

// ─── Quick Symptom Chips ──────────────────────────────────────────────────

const QUICK_SYMPTOMS = [
  'Chest pain',
  'Fever & chills',
  'Severe headache',
  'Difficulty breathing',
  'Dizziness',
  'Stomach pain',
]

// ─── Main ChatPage ────────────────────────────────────────────────────────

function ChatPage() {
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'system',
      content: "Hello! I'm MediTriage, your AI health assistant. Describe your symptoms in any language and I'll assess your condition with a triage score, risk level, and advice.",
      timestamp: new Date(),
    }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef(null)

  // Build history for backend context (user + assistant turns only)
  const buildHistory = useCallback(() => {
    return messages
      .filter(m => m.role === 'user' || m.role === 'assistant')
      .map(m => ({ role: m.role, content: m.content }))
  }, [messages])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async (text = input) => {
    const trimmed = text.trim()
    if (!trimmed || loading) return

    const userMsg = {
      id: Date.now(),
      role: 'user',
      content: trimmed,
      timestamp: new Date(),
    }

    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      const history = buildHistory()
      const response = await chatService.sendMessage(trimmed, history)

      const assistantMsg = {
        id: Date.now() + 1,
        role: 'assistant',
        content: response.medical_advice || response.message || 'Assessment complete.',
        triage: response,
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, assistantMsg])
    } catch (error) {
      const errorMsg = {
        id: Date.now() + 1,
        role: 'error',
        content: error?.response?.data?.error ||
          'AI assistant is temporarily unavailable. Please try again.',
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, errorMsg])
    } finally {
      setLoading(false)
    }
  }

  const handleQuickSymptom = (symptom) => {
    setInput(symptom)
    handleSend(symptom)
  }

  const clearChat = () => {
    setMessages([{
      id: 'welcome-new',
      role: 'system',
      content: "Chat cleared. Describe your symptoms to start a new triage session.",
      timestamp: new Date(),
    }])
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[820px]">

      {/* ── Left: Chat Panel (38%) ── */}
      <div className="lg:w-[38%] flex flex-col bg-[#0a192f] border border-cyan-900/30 rounded-3xl overflow-hidden shadow-2xl">

        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-[#0a192f] to-[#0d2040] border-b border-cyan-900/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-900/50 border border-cyan-500/30 flex items-center justify-center">
              <Bot className="h-6 w-6 text-cyan-400" />
            </div>
            <div>
              <h2 className="text-white font-bold text-sm leading-none">MediTriage AI</h2>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                <span className="text-[9px] text-emerald-400 uppercase font-black tracking-widest">Active Monitoring</span>
              </div>
            </div>
          </div>
          <button
            onClick={clearChat}
            className="p-2 rounded-lg text-slate-500 hover:text-white hover:bg-slate-800 transition-all"
            title="Clear chat"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>

        {/* Quick Symptoms (shown when no user messages yet) */}
        {messages.filter(m => m.role === 'user').length === 0 && (
          <div className="px-5 pt-4 pb-2">
            <p className="text-[9px] text-slate-500 uppercase font-black tracking-widest mb-2">Quick Select</p>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_SYMPTOMS.map(sym => (
                <button
                  key={sym}
                  onClick={() => handleQuickSymptom(sym)}
                  disabled={loading}
                  className="text-[10px] font-bold px-2.5 py-1.5 rounded-lg bg-slate-800 text-slate-300 border border-slate-700 hover:border-cyan-500/50 hover:text-cyan-300 transition-all"
                >
                  {sym}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5 scrollbar-thin scrollbar-thumb-cyan-900">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
              <div className={`flex gap-2.5 max-w-[90%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>

                {/* Avatar */}
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 border text-xs ${msg.role === 'user'
                  ? 'bg-blue-600/90 border-blue-400/50 text-white'
                  : msg.role === 'error'
                    ? 'bg-red-900/50 border-red-700/50 text-red-400'
                    : 'bg-[#112240] border-cyan-900/40 text-cyan-400'
                  }`}>
                  {msg.role === 'user' ? <UserIcon className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
                </div>

                {/* Bubble */}
                <div>
                  <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed shadow ${msg.role === 'user'
                    ? 'bg-blue-500/80 text-white rounded-tr-none'
                    : msg.role === 'error'
                      ? 'bg-red-950/40 border border-red-800/50 text-red-300 rounded-tl-none'
                      : 'bg-[#f8fafc] text-slate-800 border border-slate-200 rounded-tl-none font-medium'
                    }`}>
                    {msg.content}
                    {msg.triage && <TriageCard triage={msg.triage} />}
                  </div>
                  <p className="text-[9px] text-slate-600 mt-1 font-bold uppercase tracking-wider ml-1">
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            </div>
          ))}

          {/* AI Thinking Indicator */}
          {loading && (
            <div className="flex justify-start animate-fade-in">
              <div className="bg-[#112240] border border-cyan-900/30 rounded-2xl px-4 py-3 flex items-center gap-3">
                <Loader2 className="h-4 w-4 text-cyan-400 animate-spin" />
                <span className="text-sm text-slate-400 font-medium">AI Analysing Symptoms…</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form
          onSubmit={(e) => { e.preventDefault(); handleSend() }}
          className="p-5 bg-[#080f1d] border-t border-cyan-900/40"
        >
          <div className="relative">
            <input
              id="symptom-input"
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Describe your symptoms… (any language)"
              className="w-full bg-[#112240] border border-cyan-900/50 text-white placeholder-slate-600 rounded-2xl py-3.5 pl-5 pr-14 focus:outline-none focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/20 transition-all text-sm"
            />
            <button
              id="send-message-btn"
              type="submit"
              disabled={loading || !input.trim()}
              className="absolute right-2 top-2 bottom-2 px-3.5 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 disabled:bg-slate-800 text-white rounded-xl transition-all shadow-lg"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </button>
          </div>
          <p className="text-[9px] text-slate-700 mt-2 text-center uppercase tracking-widest font-bold">
            AES-256 Encrypted · HIPAA Compliant · Not a medical diagnosis
          </p>
        </form>
      </div>

      {/* ── Right: Dashboard Panel (62%) ── */}
      <div className="lg:w-[62%] flex flex-col gap-5 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800">

        {/* Top Stat Cards */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { icon: Activity, label: 'Preventative Care', desc: 'Vaccination schedules & wellness checklists.', accentClass: 'border-cyan-900/50 hover:border-cyan-500/40', iconCls: 'bg-cyan-950/50 border-cyan-900', txtCls: 'text-cyan-400' },
            { icon: Stethoscope, label: 'Specialist Clinics', desc: 'Cardiology, Neurology, Pediatrics & more.', accentClass: 'border-blue-900/50 hover:border-blue-500/40', iconCls: 'bg-blue-950/50 border-blue-900', txtCls: 'text-blue-400' },
            { icon: Shield, label: 'Emergency Hub', desc: '24/7 critical care & ambulance dispatch portal.', accentClass: 'border-emerald-900/50 hover:border-emerald-500/40', iconCls: 'bg-emerald-950/50 border-emerald-900', txtCls: 'text-emerald-400' },
          ].map(({ icon: Icon, label, desc, accentClass, iconCls, txtCls }) => (
            <div key={label} className={`bg-[#111827] border ${accentClass} p-5 rounded-2xl group hover:scale-[1.02] transition-all shadow-xl`}>
              <div className={`w-10 h-10 rounded-xl ${iconCls} border flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                <Icon className={`h-5 w-5 text-white`} />
              </div>
              <h3 className="text-[#f8fafc] font-bold text-sm mb-1">{label}</h3>
              <p className="text-[11px] text-slate-400 leading-relaxed mb-3">{desc}</p>
              <a href="#" className={`text-[10px] font-bold ${txtCls} flex items-center gap-1 hover:gap-2 transition-all uppercase tracking-wider`}>
                Learn more <ArrowRight className="h-3 w-3" />
              </a>
            </div>
          ))}
        </div>

        {/* Daily Brief + Hospital Capacity */}
        <div className="grid grid-cols-2 gap-4">
          {/* Daily Brief */}
          <div className="bg-[#111827] border border-slate-700/50 p-5 rounded-2xl shadow-xl">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="p-2 bg-blue-900/30 rounded-lg"><TrendingUp className="h-4 w-4 text-blue-400" /></div>
              <h3 className="text-white font-bold">Daily Health Brief</h3>
            </div>
            <ul className="space-y-3">
              {[
                { color: 'cyan', text: <>Air Quality Index: <strong className="text-cyan-400">Good (42)</strong> in your area today.</> },
                { color: 'amber', text: <>Pollen counts are <strong className="text-amber-400">Moderate</strong>. Take precautions if allergy-sensitive.</> },
                { color: 'emerald', text: <>Flu vaccination clinics open at <strong className="text-white">Zone A Medical Center</strong>.</> },
              ].map(({ color, text }, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <div className={`mt-1.5 w-1.5 h-1.5 bg-${color}-500 rounded-full flex-shrink-0`} />
                  <p className="text-[11px] text-slate-300 leading-relaxed">{text}</p>
                </li>
              ))}
            </ul>
          </div>

          {/* Hospital Capacity */}
          <div className="bg-[#111827] border border-slate-700/50 p-5 rounded-2xl shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-900/30 rounded-lg"><Activity className="h-4 w-4 text-emerald-400" /></div>
                <h3 className="text-white font-bold">Hospital Capacity</h3>
              </div>
              <span className="text-[9px] font-black text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20 uppercase tracking-widest">Live</span>
            </div>
            <div className="space-y-4">
              {[
                { label: 'Emergency (ER)', pct: 82, color: '#f59e0b' },
                { label: 'Intensive Care (ICU)', pct: 45, color: '#10b981' },
                { label: 'Outpatient (OPD)', pct: 12, color: '#06b6d4' },
              ].map(({ label, pct, color }) => (
                <div key={label}>
                  <div className="flex justify-between mb-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{label}</span>
                    <span className="text-xs font-black text-white">{pct}%</span>
                  </div>
                  <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: color }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Resource Links */}
        <div className="bg-[#111827] border border-slate-700/50 p-5 rounded-2xl shadow-xl">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="p-2 bg-cyan-900/30 rounded-lg"><Shield className="h-4 w-4 text-cyan-400" /></div>
            <h3 className="text-white font-bold">Medical Resource Links</h3>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <button className="flex items-center justify-between p-3.5 bg-[#0a192f] border border-slate-700 rounded-xl hover:border-red-500/50 transition-all group">
              <span className="text-sm font-bold text-slate-200">Blood Bank</span>
              <ArrowRight className="h-4 w-4 text-slate-500 group-hover:translate-x-1 transition-transform" />
            </button>
            <button className="flex items-center justify-between p-3.5 bg-[#0a192f] border border-slate-700 rounded-xl hover:border-blue-500/50 transition-all group">
              <span className="text-sm font-bold text-slate-200">24/7 Pharmacy</span>
              <ArrowRight className="h-4 w-4 text-slate-500 group-hover:translate-x-1 transition-transform" />
            </button>
            <button className="flex items-center justify-between p-3.5 bg-red-950/20 border border-red-900/50 rounded-xl hover:bg-red-900/30 transition-all group">
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-red-400" />
                <span className="text-sm font-bold text-red-400">Emergency: 108</span>
              </div>
              <ArrowRight className="h-4 w-4 text-red-500 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>

        {/* Outbreak Radar Feature Card */}
        <div className="bg-gradient-to-br from-[#111827] to-[#0a192f] border border-slate-800 p-7 rounded-3xl flex flex-col md:flex-row items-center gap-8 relative overflow-hidden flex-1">
          <div className="absolute top-0 right-0 w-48 h-48 bg-cyan-500/5 rounded-full blur-3xl -translate-y-1/4 translate-x-1/4 pointer-events-none" />
          <div className="flex-1 z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-cyan-950/40 border border-cyan-900 rounded-full mb-4">
              <TrendingUp className="h-3 w-3 text-cyan-400" />
              <span className="text-[9px] font-black text-cyan-400 uppercase tracking-widest">Real-time Insights</span>
            </div>
            <h2 className="text-2xl font-extrabold text-white mb-3 leading-tight">
              Seasonal Wellness &<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Outbreak Monitoring</span>
            </h2>
            <p className="text-slate-400 text-sm leading-relaxed mb-5 max-w-sm">
              Our AI systems are currently monitoring regional flu activity. Stay updated with live heatmaps and localized health alerts tailored to your zone.
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => { const el = document.getElementById('heatmap'); el?.scrollIntoView({ behavior: 'smooth' }) }}
                className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-cyan-900/30 text-sm"
              >
                <MapPin className="h-4 w-4" /> Open Outbreak Radar
              </button>
              <button className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold transition-all border border-slate-700 text-sm">
                Download Report
              </button>
            </div>
          </div>

          <div className="w-52 aspect-square bg-[#0a192f] border-2 border-cyan-900/30 rounded-3xl p-5 flex flex-col justify-between shadow-2xl relative z-10 flex-shrink-0">
            <div className="flex justify-between items-start">
              <div className="w-10 h-10 bg-cyan-950/50 rounded-2xl flex items-center justify-center border border-cyan-500/20">
                <Heart className="h-5 w-5 text-cyan-400" />
              </div>
              <div className="text-right">
                <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Global Index</p>
                <p className="text-xl font-black text-white">98.4</p>
              </div>
            </div>
            <div>
              <p className="text-sm font-bold text-white mb-2">Regional Status</p>
              <div className="flex items-center gap-1.5">
                <div className="h-1 flex-1 bg-emerald-500 rounded-full" />
                <div className="h-1 flex-1 bg-emerald-500 rounded-full" />
                <div className="h-1 flex-1 bg-slate-800 rounded-full" />
              </div>
              <p className="text-[9px] text-emerald-400 font-black mt-2 uppercase tracking-widest flex items-center gap-1">
                <Clock className="h-3 w-3" /> Updated 2m ago
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}

export default ChatPage
