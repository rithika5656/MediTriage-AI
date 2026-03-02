/**
 * Face Registration Page
 * Allows authenticated users to register their face for future logins
 * 
 * Features:
 * - Webcam feed with face capture
 * - Multi-sample capture (5 samples recommended)
 * - Visual progress feedback
 * - Registration status display
 * - Delete face registration option
 */
import { useState, useRef, useCallback, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { 
  registerFace, 
  checkFaceRegistration, 
  deleteFaceRegistration 
} from '../services/faceService'
import {
  Camera,
  ScanFace,
  CheckCircle2,
  XCircle,
  Loader2,
  Trash2,
  ArrowLeft,
  Shield,
  AlertCircle,
  Image,
  RefreshCw
} from 'lucide-react'

const FaceRegistrationPage = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  
  // Webcam state
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)
  
  const [cameraActive, setCameraActive] = useState(false)
  const [hasFaceRegistered, setHasFaceRegistered] = useState(null) // null = loading
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  
  // Capture state
  const [captures, setCaptures] = useState([])
  const [isCapturing, setIsCapturing] = useState(false)
  const [isRegistering, setIsRegistering] = useState(false)
  const [registrationSuccess, setRegistrationSuccess] = useState(false)
  
  const REQUIRED_SAMPLES = 5
  const MAX_SAMPLES = 7

  // Redirect if not logged in
  useEffect(() => {
    if (!user) {
      navigate('/login')
    }
  }, [user, navigate])

  // Check existing face registration
  useEffect(() => {
    const checkRegistration = async () => {
      try {
        const result = await checkFaceRegistration()
        setHasFaceRegistered(result.has_face_registered)
      } catch (err) {
        console.error('Failed to check face registration:', err)
        setHasFaceRegistered(false)
      } finally {
        setIsLoading(false)
      }
    }
    
    if (user) {
      checkRegistration()
    }
  }, [user])

  // Cleanup camera on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }
    }
  }, [])

  /**
   * Start camera stream
   */
  const startCamera = useCallback(async () => {
    try {
      setError(null)
      
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
    } catch (err) {
      console.error('Camera access error:', err)
      setError('Camera access denied. Please allow camera permission.')
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
   * Capture a single frame
   */
  const captureFrame = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return null
    
    const video = videoRef.current
    const canvas = canvasRef.current
    const context = canvas.getContext('2d')
    
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    
    // Mirror image for consistency with selfie view
    context.translate(canvas.width, 0)
    context.scale(-1, 1)
    context.drawImage(video, 0, 0, canvas.width, canvas.height)
    context.setTransform(1, 0, 0, 1, 0, 0)
    
    return canvas.toDataURL('image/jpeg', 0.9)
  }, [])

  /**
   * Add a capture
   */
  const handleCapture = useCallback(() => {
    if (!cameraActive || captures.length >= MAX_SAMPLES) return
    
    setIsCapturing(true)
    
    // Visual feedback delay
    setTimeout(() => {
      const image = captureFrame()
      if (image) {
        setCaptures(prev => [...prev, image])
      }
      setIsCapturing(false)
    }, 200)
  }, [cameraActive, captures.length, captureFrame])

  /**
   * Remove a capture
   */
  const removeCapture = useCallback((index) => {
    setCaptures(prev => prev.filter((_, i) => i !== index))
  }, [])

  /**
   * Clear all captures
   */
  const clearCaptures = useCallback(() => {
    setCaptures([])
    setRegistrationSuccess(false)
    setError(null)
  }, [])

  /**
   * Submit face registration
   */
  const handleRegister = useCallback(async () => {
    if (captures.length < 3) {
      setError('Please capture at least 3 face samples')
      return
    }
    
    setIsRegistering(true)
    setError(null)
    
    try {
      const result = await registerFace(captures)
      
      if (result.success) {
        setRegistrationSuccess(true)
        setHasFaceRegistered(true)
        stopCamera()
        setCaptures([])
      }
    } catch (err) {
      console.error('Registration error:', err)
      setError(err.error || 'Face registration failed. Please try again.')
    } finally {
      setIsRegistering(false)
    }
  }, [captures, stopCamera])

  /**
   * Delete face registration
   */
  const handleDeleteRegistration = useCallback(async () => {
    if (!confirm('Are you sure you want to remove your face registration?')) {
      return
    }
    
    setIsLoading(true)
    setError(null)
    
    try {
      await deleteFaceRegistration()
      setHasFaceRegistered(false)
      setRegistrationSuccess(false)
    } catch (err) {
      console.error('Delete error:', err)
      setError(err.error || 'Failed to delete face registration')
    } finally {
      setIsLoading(false)
    }
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#030712] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-cyan-500 animate-spin mx-auto" />
          <p className="text-slate-400 mt-4">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#030712] py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link 
            to="/dashboard" 
            className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 text-sm mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
          
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <ScanFace className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Face Registration</h1>
              <p className="text-slate-400 text-sm">
                Set up face login for quick and secure access
              </p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-[#0a192f] border border-gray-800 rounded-3xl p-6 shadow-2xl">
          
          {/* Already Registered Status */}
          {hasFaceRegistered && !registrationSuccess && (
            <div className="mb-6 p-4 rounded-xl bg-green-500/10 border border-green-500/30">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-6 w-6 text-green-400 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="font-bold text-green-400">Face Already Registered</h3>
                  <p className="text-slate-400 text-sm mt-1">
                    You can use face login to access your account. Want to update your registration?
                  </p>
                  <div className="flex gap-3 mt-4">
                    <button
                      onClick={handleDeleteRegistration}
                      className="px-4 py-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg hover:bg-red-500/20 transition-all text-sm font-medium flex items-center gap-2"
                    >
                      <Trash2 className="h-4 w-4" />
                      Remove Registration
                    </button>
                    <Link
                      to="/face-recognition"
                      className="px-4 py-2 bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 rounded-lg hover:bg-cyan-500/20 transition-all text-sm font-medium"
                    >
                      Test Face Login
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Registration Success */}
          {registrationSuccess && (
            <div className="mb-6 p-6 rounded-xl bg-green-500/10 border border-green-500/30 text-center">
              <CheckCircle2 className="h-16 w-16 text-green-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-green-400">Registration Successful!</h3>
              <p className="text-slate-400 text-sm mt-2 mb-4">
                You can now use face login to access your account
              </p>
              <Link
                to="/face-recognition"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-cyan-500/25 transition-all"
              >
                <ScanFace className="h-5 w-5" />
                Try Face Login
              </Link>
            </div>
          )}

          {/* Camera & Capture Section */}
          {!hasFaceRegistered && !registrationSuccess && (
            <>
              {/* Instructions */}
              <div className="mb-6 p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/30">
                <h3 className="font-bold text-cyan-400 flex items-center gap-2">
                  <AlertCircle className="h-5 w-5" />
                  How to Register Your Face
                </h3>
                <ul className="text-slate-400 text-sm mt-2 space-y-1 ml-7 list-disc">
                  <li>Ensure good lighting on your face</li>
                  <li>Look directly at the camera</li>
                  <li>Capture {REQUIRED_SAMPLES} photos with slight head movements</li>
                  <li>Remove glasses if possible for better accuracy</li>
                </ul>
              </div>

              {/* Camera Preview */}
              <div className="mb-6">
                <div 
                  className={`
                    relative w-full aspect-video rounded-2xl overflow-hidden
                    border-2 transition-all
                    ${isCapturing 
                      ? 'border-cyan-500 shadow-lg shadow-cyan-500/30' 
                      : 'border-gray-700'
                    }
                  `}
                >
                  <video
                    ref={videoRef}
                    className={`
                      w-full h-full object-cover scale-x-[-1]
                      ${cameraActive ? 'block' : 'hidden'}
                    `}
                    playsInline
                    muted
                  />
                  
                  {!cameraActive && (
                    <div className="w-full h-full bg-gray-900 flex flex-col items-center justify-center">
                      <Camera className="h-16 w-16 text-gray-700 mb-4" />
                      <button
                        onClick={startCamera}
                        className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-cyan-500/25 transition-all flex items-center gap-2"
                      >
                        <Camera className="h-5 w-5" />
                        Start Camera
                      </button>
                    </div>
                  )}
                  
                  {/* Flash effect on capture */}
                  {isCapturing && (
                    <div className="absolute inset-0 bg-white/30 animate-pulse" />
                  )}
                </div>
                
                <canvas ref={canvasRef} className="hidden" />
              </div>

              {/* Capture Controls */}
              {cameraActive && (
                <div className="mb-6 flex items-center justify-center gap-4">
                  <button
                    onClick={handleCapture}
                    disabled={captures.length >= MAX_SAMPLES || isCapturing}
                    className="px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-cyan-500/25 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Camera className="h-5 w-5" />
                    Capture ({captures.length}/{REQUIRED_SAMPLES})
                  </button>
                  
                  {captures.length > 0 && (
                    <button
                      onClick={clearCaptures}
                      className="px-4 py-4 border border-gray-700 text-slate-400 rounded-xl hover:bg-gray-800/50 transition-all"
                    >
                      <RefreshCw className="h-5 w-5" />
                    </button>
                  )}
                </div>
              )}

              {/* Captured Images Grid */}
              {captures.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-bold text-slate-400 mb-3 flex items-center gap-2">
                    <Image className="h-4 w-4" />
                    Captured Samples ({captures.length}/{REQUIRED_SAMPLES} minimum)
                  </h3>
                  <div className="grid grid-cols-5 gap-2">
                    {captures.map((img, index) => (
                      <div 
                        key={index} 
                        className="relative aspect-square rounded-lg overflow-hidden border border-gray-700 group"
                      >
                        <img 
                          src={img} 
                          alt={`Capture ${index + 1}`} 
                          className="w-full h-full object-cover"
                        />
                        <button
                          onClick={() => removeCapture(index)}
                          className="absolute top-1 right-1 p-1 bg-red-500/80 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <XCircle className="h-4 w-4 text-white" />
                        </button>
                        <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-center text-xs text-white py-1">
                          {index + 1}
                        </div>
                      </div>
                    ))}
                    
                    {/* Empty slots */}
                    {Array.from({ length: Math.max(0, REQUIRED_SAMPLES - captures.length) }).map((_, i) => (
                      <div 
                        key={`empty-${i}`}
                        className="aspect-square rounded-lg border-2 border-dashed border-gray-700 flex items-center justify-center"
                      >
                        <span className="text-gray-600 text-xs">{captures.length + i + 1}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Progress Bar */}
              {captures.length > 0 && (
                <div className="mb-6">
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="text-slate-400">Progress</span>
                    <span className={`font-bold ${
                      captures.length >= REQUIRED_SAMPLES ? 'text-green-400' : 'text-cyan-400'
                    }`}>
                      {Math.min(100, Math.round((captures.length / REQUIRED_SAMPLES) * 100))}%
                    </span>
                  </div>
                  <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-300 ${
                        captures.length >= REQUIRED_SAMPLES ? 'bg-green-500' : 'bg-cyan-500'
                      }`}
                      style={{ width: `${Math.min(100, (captures.length / REQUIRED_SAMPLES) * 100)}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Register Button */}
              {captures.length >= 3 && (
                <button
                  onClick={handleRegister}
                  disabled={isRegistering}
                  className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-green-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isRegistering ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Registering Face...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-5 w-5" />
                      Register Face ({captures.length} samples)
                    </>
                  )}
                </button>
              )}
            </>
          )}

          {/* Error Message */}
          {error && (
            <div className="mt-4 p-4 rounded-xl bg-red-500/10 border border-red-500/30">
              <div className="flex items-center gap-2 text-red-400">
                <XCircle className="h-5 w-5 flex-shrink-0" />
                <p className="text-sm">{error}</p>
              </div>
            </div>
          )}
        </div>

        {/* Security Note */}
        <div className="mt-6 text-center">
          <p className="text-slate-500 text-xs flex items-center justify-center gap-2">
            <Shield className="h-4 w-4" />
            Face images are processed locally. Only encrypted embeddings are stored.
          </p>
        </div>
      </div>
    </div>
  )
}

export default FaceRegistrationPage
