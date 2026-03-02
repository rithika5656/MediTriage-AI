import { useState } from 'react'
import { Upload, FileText, AlertTriangle, Activity, CheckCircle, Loader2, HeartPulse, ChevronRight, X } from 'lucide-react'

function ReportAnalyzerPage() {
    const [file, setFile] = useState(null)
    const [analyzing, setAnalyzing] = useState(false)
    const [results, setResults] = useState(null)

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0])
            setResults(null) // Reset results when a new file is uploaded
        }
    }

    const handleDragOver = (e) => {
        e.preventDefault()
    }

    const handleDrop = (e) => {
        e.preventDefault()
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            setFile(e.dataTransfer.files[0])
            setResults(null)
        }
    }

    const clearFile = () => {
        setFile(null)
        setResults(null)
    }

    const analyzeReport = () => {
        if (!file) return

        setAnalyzing(true)

        // Simulate AI processing delay for hackathon demo
        setTimeout(() => {
            setAnalyzing(false)
            // Mock AI Analysis Results based on a generic blood report
            setResults({
                summary: "Patient shows signs of elevated LDL cholesterol and mild hypertension. Immediate lifestyle modifications are recommended to prevent cardiovascular complications.",
                riskLevel: "Medium Risk",
                riskColor: "text-amber-400 font-bold",
                keyMetrics: [
                    { label: "LDL Cholesterol", value: "158 mg/dL", status: "High", icon: Activity, color: "text-red-400" },
                    { label: "Blood Pressure", value: "135/85 mmHg", status: "Elevated", icon: HeartPulse, color: "text-amber-400" },
                    { label: "Fasting Glucose", value: "95 mg/dL", status: "Normal", icon: CheckCircle, color: "text-emerald-400" }
                ],
                actionItems: [
                    "Consult with Cardiology within 2 weeks",
                    "Begin low-sodium, heart-healthy diet",
                    "Schedule follow-up lipid panel in 3 months"
                ]
            })
        }, 3500)
    }

    return (
        <div className="bg-transparent text-slate-50">

            <div className="mb-10 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-950/50 border border-purple-500/30 flex items-center justify-center">
                    <FileText className="h-5 w-5 text-purple-400" />
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-white tracking-tight">AI Report Analyzer</h2>
                    <p className="text-sm text-slate-400 mt-0.5 uppercase tracking-widest font-black text-[10px]">Medical Document Processing Hub</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                {/* Upload Column */}
                <div className="bg-[#111827] border border-gray-800 rounded-[32px] p-8 flex flex-col items-center justify-center text-center shadow-lg hover:border-cyan-500/30 transition-all">
                    {!file ? (
                        <div
                            onDragOver={handleDragOver}
                            onDrop={handleDrop}
                            className="w-full h-full min-h-[300px] border-2 border-dashed border-gray-700 rounded-2xl flex flex-col items-center justify-center p-6 hover:bg-[#1e293b]/30 transition-colors cursor-pointer"
                            onClick={() => document.getElementById('report-upload').click()}
                        >
                            <div className="w-16 h-16 bg-cyan-950/30 rounded-full flex items-center justify-center mb-4">
                                <Upload className="h-8 w-8 text-cyan-400" />
                            </div>
                            <h3 className="font-bold text-lg text-[#f8fafc] mb-2">Upload Medical Report</h3>
                            <p className="text-sm text-slate-500 max-w-[250px] mx-auto mb-6">Drag and drop your PDF, JPG, or PNG here, or click to browse files.</p>

                            <button className="px-6 py-2.5 bg-[#1e293b] hover:bg-slate-800 text-cyan-400 border border-cyan-900 rounded-xl text-xs font-black uppercase tracking-widest transition-all">
                                Select File
                            </button>
                            <input
                                id="report-upload"
                                type="file"
                                accept=".pdf,.jpg,.jpeg,.png"
                                className="hidden"
                                onChange={handleFileChange}
                            />
                        </div>
                    ) : (
                        <div className="w-full flex-col items-center">
                            <div className="w-20 h-20 bg-blue-950/50 border border-blue-900 rounded-2xl flex items-center justify-center mx-auto mb-6 text-blue-400">
                                <FileText className="h-10 w-10" />
                            </div>
                            <h3 className="font-bold text-lg text-white mb-2">{file.name}</h3>
                            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-8">
                                {(file.size / 1024 / 1024).toFixed(2)} MB • Ready for Analysis
                            </p>

                            <div className="flex gap-4 w-full">
                                <button
                                    onClick={clearFile}
                                    className="flex-1 py-3 bg-[#1e293b] hover:bg-slate-800 text-slate-400 border border-gray-700 rounded-xl font-bold uppercase tracking-widest text-xs transition-all"
                                >
                                    Remove
                                </button>
                                <button
                                    onClick={analyzeReport}
                                    disabled={analyzing}
                                    className="flex-[2] py-3 bg-cyan-600 hover:bg-cyan-500 disabled:bg-cyan-900 disabled:text-cyan-600 text-white rounded-xl font-black uppercase tracking-widest text-xs transition-all shadow-lg flex items-center justify-center gap-2"
                                >
                                    {analyzing ? (
                                        <><Loader2 className="h-4 w-4 animate-spin" /> Scanning Data...</>
                                    ) : (
                                        <><Activity className="h-4 w-4" /> Start AI Analysis</>
                                    )}
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Results Column */}
                <div className={`bg-[#0a1322] border border-[#1e293b] rounded-[32px] p-8 shadow-xl relative overflow-hidden transition-all duration-500 ${results ? 'opacity-100' : 'opacity-40 grayscale pointer-events-none'}`}>
                    {analyzing && (
                        <div className="absolute inset-0 z-10 bg-[#0a1322]/80 backdrop-blur-sm flex flex-col items-center justify-center">
                            <div className="w-20 h-20 border-4 border-cyan-900 border-t-cyan-400 rounded-full animate-spin mb-4" />
                            <p className="text-sm font-black text-cyan-400 uppercase tracking-[0.2em] animate-pulse">Extracting Biomarkers</p>
                        </div>
                    )}

                    <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-800">
                        <h3 className="font-bold text-xl text-[#f8fafc]">Analysis Results</h3>
                        {results && <span className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest bg-[#111827] border border-gray-800 ${results.riskColor}`}>{results.riskLevel}</span>}
                    </div>

                    {results ? (
                        <div className="space-y-6 animate-fade-in">
                            <div className="bg-[#111827] p-5 rounded-2xl border border-gray-800">
                                <div className="flex items-start gap-3">
                                    <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                                    <p className="text-sm text-slate-300 leading-relaxed">{results.summary}</p>
                                </div>
                            </div>

                            <div>
                                <p className="text-[10px] text-slate-600 font-black uppercase tracking-[0.2em] mb-4">Extracted Metrics</p>
                                <div className="grid gap-3">
                                    {results.keyMetrics.map((metric, i) => (
                                        <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-[#111827] rounded-xl border border-gray-800/50 hover:border-cyan-500/20 transition-colors">
                                            <div className="flex items-center gap-3 mb-2 sm:mb-0">
                                                <metric.icon className={`h-4 w-4 ${metric.color}`} />
                                                <span className="font-bold text-sm text-[#f8fafc]">{metric.label}</span>
                                            </div>
                                            <div className="flex items-center gap-4 sm:flex-row-reverse">
                                                <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded bg-[#0a1322] border border-gray-800 ${metric.color}`}>{metric.status}</span>
                                                <span className="text-slate-400 text-sm font-medium">{metric.value}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <p className="text-[10px] text-slate-600 font-black uppercase tracking-[0.2em] mb-4 mt-8">Recommended Actions</p>
                                <ul className="space-y-3">
                                    {results.actionItems.map((action, i) => (
                                        <li key={i} className="flex items-start gap-3 text-sm text-slate-300">
                                            <ChevronRight className="h-4 w-4 text-cyan-500 shrink-0 mt-0.5" />
                                            {action}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    ) : (
                        <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-center">
                            <Activity className="h-12 w-12 text-slate-800 mb-4" />
                            <p className="text-slate-600 text-sm font-medium max-w-[200px]">Upload a report and initialize analysis to view extracted insights here.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default ReportAnalyzerPage
