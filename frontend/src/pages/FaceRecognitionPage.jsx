/**
 * Face Recognition Page
 * Secure facial recognition login for patients
 * 
 * Features:
 * - Live webcam feed
 * - Face scanning with visual feedback
 * - Confidence meter
 * - Success/error animations
 * - Fallback to manual login
 */
import { useState, useRef, useCallback, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { verifyFace } from '../services/faceService'
import {
  Camera,
  ScanFace,
  CheckCircle2,
  XCircle,
  Loader2,
  RefreshCw,
  User,
  Shield,
  AlertTriangle,
  ArrowLeft
} from 'lucide-react'

const FaceRecognitionPage = () => {
  const navigate = useNavigate()
  const { user, login } = useAuth()
  
  // Webcam state
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)
  
  const [cameraActive, setCameraActive] = useState(false)
  const [cameraPermission, setCameraPermission] = useState('pending') // pending, granted, denied
  const [isScanning, setIsScanning] = useState(false)
  const [scanResult, setScanResult] = useState(null) // { success: boolean, message: string, confidence?: number, user?: object }
  const [attemptsRemaining, setAttemptsRemaining] = useState(5)
  const [error, setError] = useState(null)

  // If already logged in, redirect to dashboard
  useEffect(() => {
    if (user) {
      navigate('/dashboard')
    }
  }, [user, navigate])

  // Cleanup camera on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }
    }
  }, [])

  /**
   * Request camera permission and start video stream
   */
  const startCamera = useCallback(async () => {
    try {
      setError(null)
      setScanResult(null)
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        }
      })
      
      streamRef.current = stream
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
      
      setCameraActive(true)
      setCameraPermission('granted')
    } catch (err) {
      console.error('Camera access error:', err)
      setCameraPermission('denied')
      setError('Camera access denied. Please allow camera permission to use face login.')
    }
  }, [])

  /**
   * Stop camera stream
   */
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    setCameraActive(false)
  }, [])

  /**
   * Capture frame from video and convert to base64
   */
  const captureFrame = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return null
    
    const video = videoRef.current
    const canvas = canvasRef.current
    const context = canvas.getContext('2d')
    
    // Set canvas dimensions to match video
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    
    // Draw video frame to canvas (mirror horizontally for selfie view)
    context.translate(canvas.width, 0)
    context.scale(-1, 1)
    context.drawImage(video, 0, 0, canvas.width, canvas.height)
    context.setTransform(1, 0, 0, 1, 0, 0) // Reset transform
    
    // Convert to base64
    return canvas.toDataURL('image/jpeg', 0.8)
  }, [])

  /**
   * Scan face and verify
   */
  const handleScanFace = useCallback(async () => {
    if (!cameraActive || isScanning) return
    
    setIsScanning(true)
    setScanResult(null)
    setError(null)
    
    try {
      const faceImage = captureFrame()
      
      if (!faceImage) {
        throw new Error('Failed to capture image')
      }
      
      const result = await verifyFace(faceImage)
      
      if (result.match) {
        // Success - login the user
        setScanResult({
          success: true,
          message: `Welcome back, ${result.user.name}!`,
          confidence: result.confidence,
          user: result.user
        })
        
        // Store token and user
        localStorage.setItem('token', result.access_token)
        localStorage.setItem('user', JSON.stringify(result.user))
        
        // Wait for animation, then redirect
        setTimeout(() => {
          window.location.href = '/dashboard'
        }, 2000)
        
      } else {
        setScanResult({
          success: false,
          message: 'Face not recognized',
          confidence: result.confidence
        })
        setAttemptsRemaining(result.attempts_remaining || attemptsRemaining - 1)
      }
      
    } catch (err) {
      console.error('Face verification error:', err)
      setScanResult({
        success: false,
        message: err.error || 'Face verification failed'
      })
      
      if (err.attempts_remaining !== undefined) {
        setAttemptsRemaining(err.attempts_remaining)
      }
    } finally {
      setIsScanning(false)
    }
  }, [cameraActive, isScanning, captureFrame, attemptsRemaining])

  /**
   * Reset scan state
   */
  const handleRetry = useCallback(() => {
    setScanResult(null)
    setError(null)
  }, [])

  return (
    <div className="min-h-screen bg-[#030712] flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <ScanFace className="h-6 w-6 text-white" />
            </div>
            <div className="text-left">
              <h1 className="text-2xl font-bold text-white">Face Login</h1>
              <p className="text-sm text-cyan-500 font-medium">MediTriage AI</p>
            </div>
          </div>
          <p className="text-slate-400 text-sm">
            Secure facial recognition login - no password needed
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-[#0a192f] border border-gray-800 rounded-3xl p-6 shadow-2xl">
          
          {/* Camera Preview */}
          <div className="relative mb-6">
            <div 
              className={`
                relative w-64 h-64 mx-auto rounded-full overflow-hidden
                border-4 transition-all duration-500
                ${scanResult?.success 
                  ? 'border-green-500 shadow-lg shadow-green-500/30' 
                  : scanResult?.success === false 
                    ? 'border-red-500 shadow-lg shadow-red-500/30'
                    : isScanning
                      ? 'border-cyan-500 animate-pulse shadow-lg shadow-cyan-500/30'
                      : 'border-gray-700'
                }
              `}
            >
              {/* Video Element */}
              <video
                ref={videoRef}
                className={`
                  w-full h-full object-cover scale-x-[-1]
                  ${cameraActive ? 'block' : 'hidden'}
                `}
                playsInline
                muted
              />
              
              {/* Placeholder when camera is off */}
              {!cameraActive && (
                <div className="w-full h-full bg-gray-900 flex items-center justify-center">
                  <Camera className="h-16 w-16 text-gray-700" />
                </div>
              )}
              
              {/* Scanning overlay */}
              {isScanning && (
                <div className="absolute inset-0 bg-cyan-500/10 flex items-center justify-center">
                  <div className="absolute inset-4 border-2 border-cyan-500/50 rounded-full animate-ping" />
                  <Loader2 className="h-12 w-12 text-cyan-400 animate-spin" />
                </div>
              )}
              
              {/* Success overlay */}
              {scanResult?.success && (
                <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center">
                  <CheckCircle2 className="h-16 w-16 text-green-400 animate-bounce" />
                </div>
              )}
              
              {/* Error overlay */}
              {scanResult?.success === false && (
                <div className="absolute inset-0 bg-red-500/20 flex items-center justify-center">
                  <XCircle className="h-16 w-16 text-red-400" />
                </div>
              )}
            </div>
            
            {/* Hidden canvas for capture */}
            <canvas ref={canvasRef} className="hidden" />
          </div>

          {/* Confidence Meter */}
          {scanResult && scanResult.confidence !== undefined && (
            <div className="mb-6">
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="text-slate-400">Confidence</span>
                <span className={`font-bold ${
                  scanResult.confidence >= 0.75 ? 'text-green-400' : 
                  scanResult.confidence >= 0.5 ? 'text-yellow-400' : 'text-red-400'
                }`}>
                  {Math.round(scanResult.confidence * 100)}%
                </span>
              </div>
              <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-500 ${
                    scanResult.confidence >= 0.75 ? 'bg-green-500' : 
                    scanResult.confidence >= 0.5 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${scanResult.confidence * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* Result Message */}
          {scanResult && (
            <div className={`
              p-4 rounded-xl mb-6 text-center
              ${scanResult.success 
                ? 'bg-green-500/10 border border-green-500/30' 
                : 'bg-red-500/10 border border-red-500/30'
              }
            `}>
              {scanResult.success ? (
                <CheckCircle2 className="h-6 w-6 text-green-400 mx-auto mb-2" />
              ) : (
                <XCircle className="h-6 w-6 text-red-400 mx-auto mb-2" />
              )}
              <p className={`font-bold ${scanResult.success ? 'text-green-400' : 'text-red-400'}`}>
                {scanResult.message}
              </p>
              {scanResult.success && (
                <p className="text-slate-400 text-sm mt-1">Redirecting to dashboard...</p>
              )}
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-4 rounded-xl mb-6 bg-red-500/10 border border-red-500/30">
              <div className="flex items-center gap-2 text-red-400">
                <AlertTriangle className="h-5 w-5 flex-shrink-0" />
                <p className="text-sm">{error}</p>
              </div>
            </div>
          )}

          {/* Camera Permission Denied */}
          {cameraPermission === 'denied' && (
            <div className="p-4 rounded-xl mb-6 bg-yellow-500/10 border border-yellow-500/30">
              <div className="flex items-start gap-3">
                <Shield className="h-5 w-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-yellow-400 font-medium text-sm">Camera Permission Required</p>
                  <p className="text-slate-400 text-xs mt-1">
                    Please enable camera access in your browser settings to use face login.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-3">
            {!cameraActive ? (
              <button
                onClick={startCamera}
                className="w-full py-4 px-6 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-cyan-500/25 transition-all flex items-center justify-center gap-2"
              >
                <Camera className="h-5 w-5" />
                Enable Camera
              </button>
            ) : scanResult?.success === false ? (
              <button
                onClick={handleRetry}
                disabled={attemptsRemaining <= 0}
                className="w-full py-4 px-6 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-cyan-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw className="h-5 w-5" />
                Try Again ({attemptsRemaining} attempts left)
              </button>
            ) : !scanResult?.success && (
              <button
                onClick={handleScanFace}
                disabled={isScanning}
                className="w-full py-4 px-6 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-cyan-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isScanning ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Scanning...
                  </>
                ) : (
                  <>
                    <ScanFace className="h-5 w-5" />
                    Scan Face
                  </>
                )}
              </button>
            )}
            
            {/* Manual Login Fallback */}
            <Link
              to="/login"
              className="w-full py-3 px-6 border border-gray-700 text-slate-300 font-medium rounded-xl hover:bg-gray-800/50 transition-all flex items-center justify-center gap-2"
            >
              <User className="h-4 w-4" />
              Use Manual Login
            </Link>
          </div>

          {/* Attempts Warning */}
          {attemptsRemaining <= 2 && attemptsRemaining > 0 && (
            <div className="mt-4 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
              <p className="text-yellow-400 text-xs text-center">
                <AlertTriangle className="h-4 w-4 inline mr-1" />
                {attemptsRemaining} attempts remaining before temporary lockout
              </p>
            </div>
          )}

          {/* Rate Limited */}
          {attemptsRemaining <= 0 && (
            <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30">
              <p className="text-red-400 text-xs text-center">
                Too many failed attempts. Please use manual login or try again in 5 minutes.
              </p>
            </div>
          )}
        </div>

        {/* Security Note */}
        <div className="mt-6 text-center">
          <p className="text-slate-500 text-xs flex items-center justify-center gap-2">
            <Shield className="h-4 w-4" />
            Your face data is encrypted and never stored as images
          </p>
        </div>

        {/* Back to Home */}
        <div className="mt-4 text-center">
          <Link to="/" className="text-cyan-400 hover:text-cyan-300 text-sm flex items-center justify-center gap-1">
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}

export default FaceRecognitionPage
