/**
 * Chat Page – Professional Navy Blue Theme
 */
import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import chatService from '../services/chatService'
import appointmentService from '../services/appointmentService'
import {
  Send, RefreshCw, AlertTriangle, CheckCircle,
  Calendar, MapPin, Phone, Clock, ChevronRight,
  Activity, Sparkles
} from 'lucide-react'

function ChatPage() {
  const navigate = useNavigate()
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [phase, setPhase] = useState('greeting')
  const [triageData, setTriageData] = useState(null)
  const [hospitals, setHospitals] = useState([])
  const [recommendedDoctors, setRecommendedDoctors] = useState([])
  const [quickResponses, setQuickResponses] = useState([])

  useEffect(() => {
    setMessages([{
      id: 1,
      type: 'system',
      content: "Hello! I'm your virtual health assistant. 👋\n\nPlease describe your symptoms and I'll help assess your condition. You can start by telling me what's bothering you today.",
      timestamp: new Date().toISOString()
    }])
    loadQuickResponses()
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const loadQuickResponses = async () => {
    try {
      const response = await chatService.getQuickResponses()
      setQuickResponses(response.quick_responses)
    } catch (error) {
      console.error('Failed to load quick responses:', error)
    }
  }

  const sendMessage = async (messageText = input) => {
    if (!messageText.trim() || loading) return

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: messageText.trim(),
      timestamp: new Date().toISOString()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setLoading(true)

    try {
      const response = await chatService.sendMessage(messageText)

      const systemMessage = {
        id: Date.now() + 1,
        type: 'system',
        content: response.message,
        phase: response.phase,
        triage: response.triage,
        timestamp: new Date().toISOString()
      }

      setMessages(prev => [...prev, systemMessage])
      setPhase(response.phase)

      if (response.triage) setTriageData(response.triage)
      if (response.hospitals) setHospitals(response.hospitals)
      if (response.recommended_doctors) setRecommendedDoctors(response.recommended_doctors)

    } catch (error) {
      console.error('Failed to send message:', error)
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        type: 'system',
        content: 'Sorry, I encountered an error. Please try again.',
        error: true,
        timestamp: new Date().toISOString()
      }])
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const resetConversation = async () => {
    try {
      await chatService.resetSession()
      setMessages([{
        id: Date.now(),
        type: 'system',
        content: 'Conversation reset. How can I help you today?',
        timestamp: new Date().toISOString()
      }])
      setPhase('greeting')
      setTriageData(null)
      setHospitals([])
      setRecommendedDoctors([])
    } catch (error) {
      console.error('Failed to reset session:', error)
    }
  }

  const getRelevantQuickResponses = () => {
    if (phase === 'greeting' || phase === 'collecting') {
      return quickResponses.filter(q =>
        ['symptoms', 'severity', 'duration', 'temperature'].includes(q.category)
      )
    }
    return quickResponses.filter(q => q.category === 'actions')
  }

  const getPhaseChip = (msgPhase) => {
    if (!msgPhase || !['emergency', 'appointment', 'query'].includes(msgPhase)) return null
    const map = {
      emergency: { text: '🚨 Emergency', bg: '#fef2f2', border: '#fca5a5', color: '#991b1b' },
      appointment: { text: '📅 Appointment Recommended', bg: '#fffbeb', border: '#fcd34d', color: '#92400e' },
      query: { text: '✅ Assessment Complete', bg: '#f0fdf4', border: '#86efac', color: '#14532d' },
    }
    const c = map[msgPhase]
    return (
      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold mb-2"
        style={{ background: c.bg, border: `1px solid ${c.border}`, color: c.color }}>
        {c.text}
      </div>
    )
  }

  const statusLabel = () => {
    if (phase === 'emergency') return { text: '🚨 Emergency Mode', color: '#ef4444' }
    if (phase === 'appointment') return { text: '📅 Appointment Suggested', color: '#f59e0b' }
    if (phase === 'query') return { text: '✅ Assessment Complete', color: '#10b981' }
    return { text: 'Online', color: '#10b981' }
  }
  const status = statusLabel()

  return (
    <div className="h-full flex flex-col" style={{ background: '#f0f4fb', height: '100vh' }}>

      {/* ── Header ── */}
      <div className="flex items-center justify-between px-6 py-4 bg-white border-b"
        style={{ borderColor: 'var(--border)', boxShadow: '0 1px 8px rgba(15,33,62,0.07)' }}>
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #1b3a6b, #4e8cff)' }}>
              <Activity className="h-5 w-5 text-white" />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white"
              style={{ background: '#10b981' }} />
          </div>
          <div>
            <h1 className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>Health Assistant</h1>
            <p className="text-xs font-medium" style={{ color: status.color }}>{status.text}</p>
          </div>
        </div>
        <button
          onClick={resetConversation}
          className="p-2.5 rounded-xl transition-all duration-200 hover:scale-105"
          style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}
          title="Start new conversation"
        >
          <RefreshCw className="h-4 w-4" style={{ color: 'var(--text-secondary)' }} />
        </button>
      </div>

      {/* ── Messages ── */}
      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-4 scrollbar-thin" style={{ background: '#f0f4fb' }}>
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex animate-fade-in ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {/* System avatar */}
            {message.type === 'system' && (
              <div className="w-8 h-8 rounded-xl flex-shrink-0 mr-2.5 mt-1 flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #0f213e, #1b3a6b)' }}>
                <Sparkles className="h-4 w-4 text-white" />
              </div>
            )}

            <div style={{ maxWidth: '72%' }}>
              {/* Phase chip */}
              {message.type === 'system' && getPhaseChip(message.phase)}

              <div className={`px-4 py-3 text-sm leading-relaxed ${message.type === 'user'
                  ? 'rounded-2xl rounded-br-sm text-white'
                  : message.error
                    ? 'rounded-2xl rounded-bl-sm bg-red-50 text-red-700 border border-red-200'
                    : 'rounded-2xl rounded-bl-sm bg-white text-[var(--text-primary)] border'
                }`}
                style={message.type === 'user' ? {
                  background: 'linear-gradient(135deg, #1b3a6b, #3d68b4)',
                  boxShadow: '0 4px 14px rgba(27,58,107,0.35)'
                } : message.error ? {} : {
                  borderColor: 'var(--border)',
                  boxShadow: '0 2px 8px rgba(15,33,62,0.07)'
                }}>
                <div className="whitespace-pre-wrap">{message.content}</div>

                {/* Risk score */}
                {message.triage && (
                  <div className="mt-3 pt-2 border-t flex items-center gap-2"
                    style={{ borderColor: 'rgba(15,33,62,0.1)' }}>
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Risk Score:</span>
                    <span className={`text-xs font-bold ${message.triage.risk_score > 6 ? 'text-red-600' :
                        message.triage.risk_score > 3 ? 'text-amber-600' : 'text-emerald-600'
                      }`}>
                      {message.triage.risk_score}/10
                    </span>
                  </div>
                )}
              </div>

              {/* Timestamp */}
              <div className={`text-xs mt-1 ${message.type === 'user' ? 'text-right' : 'text-left pl-1'}`}
                style={{ color: 'var(--text-muted)' }}>
                {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {loading && (
          <div className="flex items-center gap-2 animate-fade-in">
            <div className="w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #0f213e, #1b3a6b)' }}>
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <div className="px-4 py-3 bg-white rounded-2xl rounded-bl-sm border"
              style={{ borderColor: 'var(--border)', boxShadow: '0 2px 8px rgba(15,33,62,0.07)' }}>
              <div className="flex gap-1.5 items-center">
                {[0, 150, 300].map((delay) => (
                  <span key={delay}
                    className="w-2 h-2 rounded-full animate-bounce"
                    style={{ background: '#7794c8', animationDelay: `${delay}ms` }} />
                ))}
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ── Emergency Panel ── */}
      {phase === 'emergency' && hospitals.length > 0 && (
        <div className="animate-slide-up border-t-4 px-4 py-4"
          style={{ background: '#fff5f5', borderTopColor: '#ef4444' }}>
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <h3 className="font-bold text-red-800 text-sm">Nearby Emergency Facilities</h3>
          </div>
          <div className="space-y-2 max-h-36 overflow-y-auto scrollbar-thin">
            {hospitals.slice(0, 3).map((hospital, i) => (
              <div key={i} className="bg-white rounded-xl px-4 py-3 flex items-center justify-between border border-red-100">
                <div>
                  <p className="font-semibold text-gray-800 text-sm">{hospital.name}</p>
                  <p className="text-xs text-gray-500 flex items-center gap-2 mt-0.5">
                    <MapPin className="h-3 w-3" />{hospital.distance}
                    <Clock className="h-3 w-3" />{hospital.wait_time}
                  </p>
                </div>
                <a href={`tel:${hospital.phone}`}
                  className="p-2 rounded-full bg-red-50 hover:bg-red-100 transition-colors">
                  <Phone className="h-4 w-4 text-red-600" />
                </a>
              </div>
            ))}
          </div>
          <button onClick={() => navigate('/appointments')}
            className="btn-danger w-full mt-3 py-2.5">
            <Activity className="h-4 w-4" />
            Book Emergency Appointment
          </button>
        </div>
      )}

      {/* ── Appointment Panel ── */}
      {phase === 'appointment' && recommendedDoctors.length > 0 && (
        <div className="animate-slide-up border-t-4 px-4 py-4"
          style={{ background: '#fffdf0', borderTopColor: '#f59e0b' }}>
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="h-5 w-5 text-amber-600" />
            <h3 className="font-bold text-amber-800 text-sm">Recommended Doctors</h3>
          </div>
          <div className="space-y-2 max-h-36 overflow-y-auto scrollbar-thin">
            {recommendedDoctors.slice(0, 3).map((doctor, i) => (
              <div key={i} className="bg-white rounded-xl px-4 py-3 flex items-center justify-between border border-amber-100">
                <div>
                  <p className="font-semibold text-gray-800 text-sm">{doctor.name}</p>
                  <p className="text-xs text-gray-500">{doctor.specialization} · ⭐ {doctor.rating}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-gray-400" />
              </div>
            ))}
          </div>
          <button onClick={() => navigate('/doctors')}
            className="btn-primary w-full mt-3 py-2.5">
            <Calendar className="h-4 w-4" />
            Book Appointment
          </button>
        </div>
      )}

      {/* ── Quick Replies ── */}
      {!loading && getRelevantQuickResponses().length > 0 && (
        <div className="bg-white border-t px-4 py-3 overflow-x-auto scrollbar-thin"
          style={{ borderColor: 'var(--border)' }}>
          <div className="flex gap-2">
            {getRelevantQuickResponses().flatMap(category =>
              category.options.slice(0, 3).map((option, index) => (
                <button
                  key={`${category.category}-${index}`}
                  onClick={() => sendMessage(option)}
                  className="flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-medium
                             transition-all duration-200 hover:scale-[1.03]"
                  style={{
                    background: 'var(--surface-2)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-primary)',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = '#1b3a6b'
                    e.currentTarget.style.color = '#fff'
                    e.currentTarget.style.borderColor = '#1b3a6b'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'var(--surface-2)'
                    e.currentTarget.style.color = 'var(--text-primary)'
                    e.currentTarget.style.borderColor = 'var(--border)'
                  }}
                >
                  {option}
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {/* ── Input Bar ── */}
      <div className="bg-white border-t px-4 py-4" style={{ borderColor: 'var(--border)' }}>
        <div className="flex gap-3 items-center">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your symptoms or message…"
            className="flex-1 px-4 py-3 rounded-2xl text-sm focus:outline-none focus:ring-2"
            style={{
              background: 'var(--surface-2)',
              border: '1.5px solid var(--border)',
              color: 'var(--text-primary)',
              '--tw-ring-color': '#1b3a6b'
            }}
            disabled={loading}
          />
          <button
            id="chat-send-btn"
            onClick={() => sendMessage()}
            disabled={loading || !input.trim()}
            className="w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-200
                       disabled:opacity-40 disabled:cursor-not-allowed hover:scale-105 flex-shrink-0"
            style={{
              background: (!loading && input.trim()) ? 'linear-gradient(135deg, #1b3a6b, #3d68b4)' : 'var(--surface-2)',
              color: (!loading && input.trim()) ? '#fff' : 'var(--text-muted)',
              boxShadow: (!loading && input.trim()) ? '0 4px 14px rgba(27,58,107,0.35)' : 'none',
            }}
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

export default ChatPage
