/**
 * Chat Page Component
 * Main conversational interface for symptom collection and triage
 * Features WhatsApp-style chat UI with real-time responses
 */
import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import chatService from '../services/chatService'
import appointmentService from '../services/appointmentService'
import { 
  Send, RefreshCw, AlertTriangle, CheckCircle, 
  Calendar, MapPin, Phone, Clock, ChevronRight,
  AlertCircle, Activity
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

  // Initial greeting message
  useEffect(() => {
    setMessages([{
      id: 1,
      type: 'system',
      content: "Hello! I'm your virtual health assistant. 👋\n\nPlease describe your symptoms and I'll help assess your condition. You can start by telling me what's bothering you today.",
      timestamp: new Date().toISOString()
    }])
    
    loadQuickResponses()
  }, [])

  // Scroll to bottom when new messages arrive
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

      // Update triage data if available
      if (response.triage) {
        setTriageData(response.triage)
      }

      // Set hospitals for emergency phase
      if (response.hospitals) {
        setHospitals(response.hospitals)
      }

      // Set recommended doctors for appointment phase
      if (response.recommended_doctors) {
        setRecommendedDoctors(response.recommended_doctors)
      }

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
        content: "Conversation reset. How can I help you today?",
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

  const handleQuickResponse = (response) => {
    sendMessage(response)
  }

  const getPhaseColor = (messagePhase) => {
    switch (messagePhase) {
      case 'emergency': return 'bg-red-100 border-red-500 text-red-800'
      case 'appointment': return 'bg-yellow-100 border-yellow-500 text-yellow-800'
      case 'query': return 'bg-green-100 border-green-500 text-green-800'
      default: return 'bg-gray-100 border-gray-300 text-gray-800'
    }
  }

  const getPhaseIcon = (messagePhase) => {
    switch (messagePhase) {
      case 'emergency': return <AlertTriangle className="h-5 w-5 text-red-600" />
      case 'appointment': return <Calendar className="h-5 w-5 text-yellow-600" />
      case 'query': return <CheckCircle className="h-5 w-5 text-green-600" />
      default: return <Activity className="h-5 w-5 text-primary-600" />
    }
  }

  // Filter quick responses based on phase
  const getRelevantQuickResponses = () => {
    if (phase === 'greeting' || phase === 'collecting') {
      return quickResponses.filter(q => 
        ['symptoms', 'severity', 'duration', 'temperature'].includes(q.category)
      )
    }
    return quickResponses.filter(q => q.category === 'actions')
  }

  return (
    <div className="h-full flex flex-col bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
            <Activity className="h-5 w-5 text-primary-600" />
          </div>
          <div>
            <h1 className="font-semibold text-gray-800">Health Assistant</h1>
            <p className="text-xs text-gray-500">
              {phase === 'emergency' && '🚨 Emergency Mode'}
              {phase === 'appointment' && '📅 Appointment Suggested'}
              {phase === 'query' && '✅ Assessment Complete'}
              {!['emergency', 'appointment', 'query'].includes(phase) && 'Online'}
            </p>
          </div>
        </div>
        <button
          onClick={resetConversation}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          title="Start new conversation"
        >
          <RefreshCw className="h-5 w-5 text-gray-500" />
        </button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
          >
            <div
              className={`
                max-w-[85%] md:max-w-[70%] rounded-2xl px-4 py-3
                ${message.type === 'user' 
                  ? 'bg-primary-600 text-white rounded-br-md' 
                  : message.error 
                    ? 'bg-red-100 text-red-800 rounded-bl-md border border-red-200'
                    : message.phase === 'emergency'
                      ? 'bg-red-50 text-red-900 rounded-bl-md border-2 border-red-400'
                      : 'bg-white text-gray-800 rounded-bl-md shadow-sm'
                }
              `}
            >
              {/* Phase indicator for system messages */}
              {message.type === 'system' && message.phase && ['emergency', 'appointment', 'query'].includes(message.phase) && (
                <div className={`flex items-center gap-2 mb-2 pb-2 border-b ${
                  message.phase === 'emergency' ? 'border-red-200' : 'border-gray-200'
                }`}>
                  {getPhaseIcon(message.phase)}
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${getPhaseColor(message.phase)}`}>
                    {message.phase === 'emergency' && 'Emergency'}
                    {message.phase === 'appointment' && 'Appointment Recommended'}
                    {message.phase === 'query' && 'Mild Symptoms'}
                  </span>
                </div>
              )}
              
              {/* Message content */}
              <div className="whitespace-pre-wrap text-sm">{message.content}</div>
              
              {/* Triage score if available */}
              {message.triage && (
                <div className="mt-3 pt-2 border-t border-gray-200">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-gray-500">Risk Score:</span>
                    <span className={`font-bold ${
                      message.triage.risk_score > 6 ? 'text-red-600' :
                      message.triage.risk_score > 3 ? 'text-yellow-600' : 'text-green-600'
                    }`}>
                      {message.triage.risk_score}/10
                    </span>
                  </div>
                </div>
              )}
              
              {/* Timestamp */}
              <div className={`text-xs mt-1 ${message.type === 'user' ? 'text-primary-200' : 'text-gray-400'}`}>
                {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}

        {/* Loading indicator */}
        {loading && (
          <div className="flex justify-start animate-fade-in">
            <div className="bg-white rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Emergency Alert Panel */}
      {phase === 'emergency' && hospitals.length > 0 && (
        <div className="bg-red-50 border-t-2 border-red-400 p-4 animate-slide-up">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <h3 className="font-semibold text-red-800">Nearby Emergency Facilities</h3>
          </div>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {hospitals.slice(0, 3).map((hospital, index) => (
              <div key={index} className="bg-white rounded-lg p-3 flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-800 text-sm">{hospital.name}</p>
                  <p className="text-xs text-gray-500 flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> {hospital.distance}
                    <span className="mx-1">•</span>
                    <Clock className="h-3 w-3" /> {hospital.wait_time}
                  </p>
                </div>
                <a 
                  href={`tel:${hospital.phone}`}
                  className="p-2 bg-red-100 rounded-full hover:bg-red-200 transition-colors"
                >
                  <Phone className="h-4 w-4 text-red-600" />
                </a>
              </div>
            ))}
          </div>
          <button
            onClick={() => navigate('/appointments')}
            className="mt-3 w-full btn-danger flex items-center justify-center gap-2"
          >
            <Activity className="h-4 w-4" />
            Book Emergency Appointment
          </button>
        </div>
      )}

      {/* Appointment Suggestion Panel */}
      {phase === 'appointment' && recommendedDoctors.length > 0 && (
        <div className="bg-yellow-50 border-t-2 border-yellow-400 p-4 animate-slide-up">
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="h-5 w-5 text-yellow-600" />
            <h3 className="font-semibold text-yellow-800">Recommended Doctors</h3>
          </div>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {recommendedDoctors.slice(0, 3).map((doctor, index) => (
              <div key={index} className="bg-white rounded-lg p-3 flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-800 text-sm">{doctor.name}</p>
                  <p className="text-xs text-gray-500">{doctor.specialization} • ⭐ {doctor.rating}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-gray-400" />
              </div>
            ))}
          </div>
          <button
            onClick={() => navigate('/doctors')}
            className="mt-3 w-full bg-yellow-500 hover:bg-yellow-600 text-white font-medium py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <Calendar className="h-4 w-4" />
            Book Appointment
          </button>
        </div>
      )}

      {/* Quick Responses */}
      {!loading && getRelevantQuickResponses().length > 0 && (
        <div className="bg-white border-t border-gray-200 px-4 py-2 overflow-x-auto">
          <div className="flex gap-2">
            {getRelevantQuickResponses().flatMap(category => 
              category.options.slice(0, 3).map((option, index) => (
                <button
                  key={`${category.category}-${index}`}
                  onClick={() => handleQuickResponse(option)}
                  className="flex-shrink-0 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-full text-sm text-gray-700 transition-colors"
                >
                  {option}
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="bg-white border-t border-gray-200 p-4">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your symptoms or message..."
            className="flex-1 px-4 py-3 bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-primary-500"
            disabled={loading}
          />
          <button
            onClick={() => sendMessage()}
            disabled={loading || !input.trim()}
            className={`p-3 rounded-full transition-colors ${
              loading || !input.trim()
                ? 'bg-gray-200 text-gray-400'
                : 'bg-primary-600 text-white hover:bg-primary-700'
            }`}
          >
            <Send className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  )
}

export default ChatPage
