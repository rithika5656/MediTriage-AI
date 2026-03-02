import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Camera, 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  RefreshCw,
  Eye,
  Heart,
  Shield,
  Zap
} from 'lucide-react';
import { analyzeFaceSeverity } from '../services/faceSeverityService';

const FaceSeverityPage = () => {
  // Refs
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  
  // State
  const [cameraActive, setCameraActive] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [cameraError, setCameraError] = useState(null);
  
  // Start camera
  const startCamera = useCallback(async () => {
    try {
      setCameraError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        }
      });
      
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      
      setCameraActive(true);
    } catch (err) {
      console.error('Camera error:', err);
      setCameraError('Unable to access camera. Please allow camera permissions.');
    }
  }, []);
  
  // Stop camera
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    setCameraActive(false);
  }, []);
  
  // Capture frame
  const captureFrame = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return null;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    ctx.drawImage(video, 0, 0);
    
    return canvas.toDataURL('image/jpeg', 0.9);
  }, []);
  
  // Analyze face
  const analyzeFace = async () => {
    const imageData = captureFrame();
    
    if (!imageData) {
      setError('Failed to capture image. Please try again.');
      return;
    }
    
    setAnalyzing(true);
    setError(null);
    setResult(null);
    
    try {
      const data = await analyzeFaceSeverity(imageData);
      
      if (data.error) {
        setError(data.error);
      } else {
        setResult(data);
      }
    } catch (err) {
      console.error('Analysis error:', err);
      setError('Failed to analyze. Please check your connection and try again.');
    } finally {
      setAnalyzing(false);
    }
  };
  
  // Reset analysis
  const resetAnalysis = () => {
    setResult(null);
    setError(null);
  };
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);
  
  // Auto-start camera on mount
  useEffect(() => {
    startCamera();
  }, [startCamera]);
  
  // Get risk color
  const getRiskColor = (riskLevel) => {
    switch (riskLevel) {
      case 'Stable':
        return 'text-green-500';
      case 'Monitor':
        return 'text-yellow-500';
      case 'High Risk':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };
  
  // Get risk background
  const getRiskBg = (riskLevel) => {
    switch (riskLevel) {
      case 'Stable':
        return 'bg-green-500/10 border-green-500/30';
      case 'Monitor':
        return 'bg-yellow-500/10 border-yellow-500/30';
      case 'High Risk':
        return 'bg-red-500/10 border-red-500/30';
      default:
        return 'bg-gray-500/10 border-gray-500/30';
    }
  };
  
  // Get severity color for meter
  const getSeverityColor = (score) => {
    if (score <= 3) return '#22c55e'; // green
    if (score <= 6) return '#eab308'; // yellow
    return '#ef4444'; // red
  };
  
  // Severity meter component
  const SeverityMeter = ({ score }) => {
    const percentage = (score / 10) * 100;
    const color = getSeverityColor(score);
    const radius = 70;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percentage / 100) * circumference;
    
    return (
      <div className="relative w-48 h-48 mx-auto">
        <svg className="w-48 h-48 transform -rotate-90">
          {/* Background circle */}
          <circle
            cx="96"
            cy="96"
            r={radius}
            stroke="#374151"
            strokeWidth="12"
            fill="none"
          />
          {/* Progress circle */}
          <circle
            cx="96"
            cy="96"
            r={radius}
            stroke={color}
            strokeWidth="12"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-bold" style={{ color }}>
            {score}
          </span>
          <span className="text-sm text-gray-400">/ 10</span>
          <span className="text-xs text-gray-500 mt-1">Severity</span>
        </div>
      </div>
    );
  };
  
  // Health stability bar
  const StabilityBar = ({ score }) => {
    const getStabilityColor = (s) => {
      if (s >= 70) return 'bg-green-500';
      if (s >= 40) return 'bg-yellow-500';
      return 'bg-red-500';
    };
    
    return (
      <div className="w-full">
        <div className="flex justify-between mb-2">
          <span className="text-sm text-gray-400 flex items-center gap-2">
            <Heart className="w-4 h-4" />
            Health Stability
          </span>
          <span className="text-sm font-semibold text-white">{score}%</span>
        </div>
        <div className="w-full h-3 bg-gray-700 rounded-full overflow-hidden">
          <div
            className={`h-full ${getStabilityColor(score)} transition-all duration-1000 ease-out rounded-full`}
            style={{ width: `${score}%` }}
          />
        </div>
      </div>
    );
  };
  
  // Sign badge component
  const SignBadge = ({ sign }) => {
    const signLabels = {
      'pale_skin': { label: 'Pale Skin', icon: Eye, color: 'text-blue-400 bg-blue-500/10' },
      'lip_discoloration': { label: 'Lip Discoloration', icon: AlertTriangle, color: 'text-purple-400 bg-purple-500/10' },
      'eye_fatigue': { label: 'Eye Fatigue', icon: Eye, color: 'text-orange-400 bg-orange-500/10' },
      'stress_expression': { label: 'Stress Expression', icon: Zap, color: 'text-yellow-400 bg-yellow-500/10' },
      'rapid_breathing': { label: 'Rapid Breathing', icon: Activity, color: 'text-red-400 bg-red-500/10' },
    };
    
    const info = signLabels[sign] || { label: sign, icon: AlertTriangle, color: 'text-gray-400 bg-gray-500/10' };
    const Icon = info.icon;
    
    return (
      <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${info.color}`}>
        <Icon className="w-4 h-4" />
        <span className="text-sm">{info.label}</span>
      </div>
    );
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white">Visual Health Analysis</h1>
          </div>
          <p className="text-gray-400 max-w-xl mx-auto">
            Analyze visible health indicators through facial recognition. 
            This module detects signs of distress and provides a visual severity assessment.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-8">
          {/* Camera Section */}
          <div className="space-y-4">
            <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700/50">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Camera className="w-5 h-5 text-cyan-400" />
                Camera Preview
              </h2>
              
              {/* Camera Preview Container */}
              <div className="relative aspect-square max-w-sm mx-auto">
                {/* Circular mask container */}
                <div className="relative w-full h-full rounded-full overflow-hidden border-4 border-cyan-500/30 bg-gray-900">
                  {/* Video element */}
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="absolute inset-0 w-full h-full object-cover scale-x-[-1]"
                  />
                  
                  {/* Scanning animation when analyzing */}
                  {analyzing && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                      <div className="w-full h-1 bg-cyan-400/50 animate-pulse absolute top-1/2" />
                      <div className="animate-spin">
                        <RefreshCw className="w-12 h-12 text-cyan-400" />
                      </div>
                    </div>
                  )}
                  
                  {/* Face guide overlay */}
                  {cameraActive && !analyzing && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-3/4 h-3/4 border-2 border-dashed border-cyan-400/40 rounded-full" />
                    </div>
                  )}
                </div>
                
                {/* Camera error */}
                {cameraError && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-900 rounded-full">
                    <div className="text-center p-4">
                      <Camera className="w-12 h-12 text-gray-600 mx-auto mb-2" />
                      <p className="text-sm text-gray-400">{cameraError}</p>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Hidden canvas for capture */}
              <canvas ref={canvasRef} className="hidden" />
              
              {/* Action buttons */}
              <div className="flex gap-3 mt-6 justify-center">
                {!cameraActive ? (
                  <button
                    onClick={startCamera}
                    className="px-6 py-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-medium transition-colors flex items-center gap-2"
                  >
                    <Camera className="w-5 h-5" />
                    Start Camera
                  </button>
                ) : (
                  <button
                    onClick={analyzeFace}
                    disabled={analyzing}
                    className={`px-8 py-3 rounded-xl font-medium transition-all flex items-center gap-2 ${
                      analyzing
                        ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                        : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-lg shadow-cyan-500/25'
                    }`}
                  >
                    {analyzing ? (
                      <>
                        <RefreshCw className="w-5 h-5 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Activity className="w-5 h-5" />
                        Analyze Face
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
            
            {/* Error display */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-red-400 font-medium">Analysis Error</p>
                  <p className="text-red-300/70 text-sm mt-1">{error}</p>
                </div>
              </div>
            )}
          </div>
          
          {/* Results Section */}
          <div className="space-y-4">
            {result ? (
              <>
                {/* Severity Score */}
                <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700/50">
                  <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                    <Shield className="w-5 h-5 text-cyan-400" />
                    Severity Assessment
                  </h2>
                  
                  <SeverityMeter score={result.visual_severity_score} />
                  
                  {/* Risk Level Badge */}
                  <div className={`mt-6 p-4 rounded-xl border ${getRiskBg(result.risk_level)} text-center`}>
                    <div className={`text-2xl font-bold ${getRiskColor(result.risk_level)}`}>
                      {result.risk_level === 'Stable' && <CheckCircle className="w-8 h-8 mx-auto mb-2" />}
                      {result.risk_level === 'Monitor' && <Eye className="w-8 h-8 mx-auto mb-2" />}
                      {result.risk_level === 'High Risk' && <AlertTriangle className="w-8 h-8 mx-auto mb-2" />}
                      {result.risk_level}
                    </div>
                  </div>
                </div>
                
                {/* Health Stability */}
                <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700/50">
                  <StabilityBar score={result.health_stability_score} />
                </div>
                
                {/* Detected Signs */}
                {result.detected_signs && result.detected_signs.length > 0 && (
                  <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700/50">
                    <h3 className="text-sm font-medium text-gray-400 mb-3 flex items-center gap-2">
                      <Eye className="w-4 h-4" />
                      Detected Signs
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {result.detected_signs.map((sign, index) => (
                        <SignBadge key={index} sign={sign} />
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Recommendation */}
                {result.recommendation && (
                  <div className={`rounded-2xl p-6 border ${getRiskBg(result.risk_level)}`}>
                    <h3 className="text-sm font-medium text-gray-400 mb-2">Recommendation</h3>
                    <p className="text-white">{result.recommendation}</p>
                  </div>
                )}
                
                {/* Reset Button */}
                <button
                  onClick={resetAnalysis}
                  className="w-full px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-5 h-5" />
                  Analyze Again
                </button>
              </>
            ) : (
              /* Placeholder when no results */
              <div className="bg-gray-800/50 rounded-2xl p-8 border border-gray-700/50 text-center">
                <div className="w-24 h-24 bg-gray-700/50 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <Activity className="w-12 h-12 text-gray-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-400 mb-2">
                  No Analysis Yet
                </h3>
                <p className="text-gray-500 text-sm max-w-xs mx-auto">
                  Position your face in the camera preview and click "Analyze Face" to check visual health indicators.
                </p>
                
                {/* What we analyze */}
                <div className="mt-8 text-left">
                  <h4 className="text-sm font-medium text-gray-400 mb-3">What We Analyze:</h4>
                  <div className="space-y-2">
                    {[
                      { icon: Eye, label: 'Facial pallor (pale skin)', color: 'text-blue-400' },
                      { icon: Heart, label: 'Lip color analysis', color: 'text-pink-400' },
                      { icon: Eye, label: 'Eye fatigue detection', color: 'text-orange-400' },
                      { icon: Zap, label: 'Stress expression', color: 'text-yellow-400' },
                      { icon: Activity, label: 'Breathing indicators', color: 'text-cyan-400' },
                    ].map((item, index) => (
                      <div key={index} className="flex items-center gap-3 text-sm">
                        <item.icon className={`w-4 h-4 ${item.color}`} />
                        <span className="text-gray-400">{item.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Disclaimer */}
        <div className="mt-8 p-4 bg-gray-800/30 rounded-xl border border-gray-700/30 text-center">
          <p className="text-sm text-gray-500">
            <strong className="text-gray-400">Disclaimer:</strong> This analysis is for informational purposes only and does not constitute medical advice. 
            Please consult a healthcare professional for accurate diagnosis and treatment.
          </p>
        </div>
      </div>
    </div>
  );
};

export default FaceSeverityPage;
