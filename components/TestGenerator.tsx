
import React, { useState, useEffect } from 'react';
import { PenTool, Clock, CheckCircle, AlertCircle, BarChart2, Play, RefreshCcw, FileText, Check, Loader2, UploadCloud, Type } from 'lucide-react';
import { TestConfig, Test, TestResult, LibraryFile } from '../types';
import { api } from '../services/api.client';

const TestGenerator: React.FC = () => {
    const [step, setStep] = useState<'CONFIG' | 'TESTING' | 'RESULTS'>('CONFIG');
    const [config, setConfig] = useState<TestConfig>({
        difficulty: 'Medium',
        questionCount: 10,
        sources: [],
        topic: ''
    });
    const [libraryFiles, setLibraryFiles] = useState<LibraryFile[]>([]);
    const [isLoadingFiles, setIsLoadingFiles] = useState(false);

    const [isGenerating, setIsGenerating] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [activeTest, setActiveTest] = useState<Test | null>(null);
    const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
    const [testResult, setTestResult] = useState<TestResult | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [timeLeft, setTimeLeft] = useState(0);

    useEffect(() => {
        if (step === 'CONFIG') loadFiles();
    }, [step]);

    useEffect(() => {
        let timer: any;
        if (step === 'TESTING' && timeLeft > 0) {
            timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
        }
        return () => clearInterval(timer);
    }, [step, timeLeft]);

    const loadFiles = async () => {
        setIsLoadingFiles(true);
        try {
            const files = await api.getLibraryFiles();
            setLibraryFiles(files.filter(f => f.status === 'ready' && f.type === 'PDF'));
        } finally {
            setIsLoadingFiles(false);
        }
    };

    const toggleSource = (id: string) => {
        const current = config.sources;
        if (current.includes(id)) {
            setConfig({ ...config, sources: current.filter(s => s !== id) });
        } else {
            setConfig({ ...config, sources: [...current, id] });
        }
    };

    const handleDirectUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;
        setIsUploading(true);
        try {
            const file = e.target.files[0];
            const newFile = await api.uploadLibraryFile(file);
            await loadFiles();
            setConfig({ ...config, sources: [newFile.id] }); // Auto-select new file
        } catch (e) {
            console.error(e);
            alert("Upload failed. Please try again.");
        } finally {
            setIsUploading(false);
        }
    };

    const handleGenerate = async () => {
        if (config.sources.length === 0 && (!config.topic || config.topic.trim() === '')) {
            alert("Please enter a TOPIC or select a PDF file to generate the test.");
            return;
        }
        console.log("Starting generation...");
        setIsGenerating(true);
        try {
            const test = await api.generateStrictTest(config);
            console.log("Test generated successfully:", test);
            setActiveTest(test);
            setTimeLeft(config.questionCount * 90); // 1.5 mins per question
            setStep('TESTING');
        } catch (e: any) {
            console.error("Generation failed:", e);
            alert(`Failed to generate test: ${e.message || "Unknown error"}`);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSubmit = async () => {
        if (!activeTest || !activeTest.studyPlan) return;
        setIsSubmitting(true);
        try {
            const result = await api.submitTest(activeTest.id, userAnswers, activeTest.studyPlan.practiceQuestions);
            setTestResult(result);
            setStep('RESULTS');
        } catch (e) {
            console.error(e);
        } finally {
            setIsSubmitting(false);
        }
    };

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    if (step === 'CONFIG') {
        return (
            <div className="max-w-3xl mx-auto h-full flex flex-col justify-center animate-fade-in py-10 px-6">
                <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-[#E2E8F0] dark:border-slate-800 overflow-hidden flex flex-col h-full max-h-[800px]">
                    <div className="bg-[#0A1A3F] dark:bg-slate-800 p-8 text-white shrink-0">
                        <h2 className="text-2xl font-bold flex items-center gap-3"><PenTool size={28} /> Test Generator</h2>
                        <p className="text-blue-200 mt-2">Generate a test from a topic OR from your uploaded PDF notes.</p>
                    </div>

                    <div className="p-8 space-y-8 overflow-y-auto flex-1">
                        <div className="space-y-4">
                            <h3 className="text-sm font-bold text-[#64748B] uppercase tracking-wide">1. Configuration</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-[#64748B] mb-1">Questions</label>
                                    <input
                                        type="number"
                                        min="5" max="50"
                                        value={config.questionCount}
                                        onChange={(e) => setConfig({ ...config, questionCount: parseInt(e.target.value) })}
                                        className="w-full bg-[#F8FAFC] dark:bg-slate-800 border border-[#E2E8F0] dark:border-slate-700 rounded-lg p-2"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-[#64748B] mb-1">Difficulty</label>
                                    <select
                                        value={config.difficulty}
                                        onChange={(e) => setConfig({ ...config, difficulty: e.target.value as any })}
                                        className="w-full bg-[#F8FAFC] dark:bg-slate-800 border border-[#E2E8F0] dark:border-slate-700 rounded-lg p-2"
                                    >
                                        <option value="Easy">Easy</option>
                                        <option value="Medium">Medium</option>
                                        <option value="Hard">Hard</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-sm font-bold text-[#64748B] uppercase tracking-wide">2. Choose Source (Topic OR File)</h3>

                            {/* Topic Input */}
                            <div>
                                <label className="flex items-center gap-2 text-sm font-bold text-[#0F172A] dark:text-white mb-2">
                                    <Type size={16} /> Enter Topic
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g. Thermodynamics, World War 2, Organic Chemistry"
                                    value={config.topic}
                                    onChange={(e) => setConfig({ ...config, topic: e.target.value, sources: [] })}
                                    className="w-full bg-[#F8FAFC] dark:bg-slate-800 border border-[#E2E8F0] dark:border-slate-700 rounded-xl p-3 outline-none focus:border-[#0A1A3F] dark:focus:border-indigo-500"
                                />
                                <p className="text-xs text-[#64748B] mt-1">Leave empty if you want to use a PDF file below.</p>
                            </div>

                            <div className="flex items-center gap-4">
                                <div className="h-px bg-[#E2E8F0] dark:bg-slate-700 flex-1"></div>
                                <span className="text-xs font-bold text-[#94A3B8]">OR</span>
                                <div className="h-px bg-[#E2E8F0] dark:bg-slate-700 flex-1"></div>
                            </div>

                            {/* File Selection */}
                            <div className="space-y-3">
                                <label className="flex items-center gap-2 text-sm font-bold text-[#0F172A] dark:text-white">
                                    <FileText size={16} /> Select PDF Source
                                </label>

                                <div className="border border-[#E2E8F0] dark:border-slate-700 rounded-xl overflow-hidden max-h-[200px] overflow-y-auto bg-[#F8FAFC] dark:bg-slate-900/50">
                                    {isLoadingFiles ? (
                                        <div className="p-8 flex justify-center text-[#64748B]"><Loader2 className="animate-spin" /></div>
                                    ) : libraryFiles.length === 0 ? (
                                        <div className="p-8 text-center text-[#64748B] text-sm">
                                            No existing PDFs. Upload one below.
                                        </div>
                                    ) : (
                                        <div className="divide-y divide-[#E2E8F0] dark:divide-slate-800">
                                            {libraryFiles.map(file => (
                                                <div
                                                    key={file.id}
                                                    onClick={() => {
                                                        toggleSource(file.id);
                                                        setConfig(prev => ({ ...prev, topic: '' })); // Clear topic if file selected
                                                    }}
                                                    className={`p-3 flex items-center gap-3 cursor-pointer hover:bg-white dark:hover:bg-slate-800 transition-colors ${config.sources.includes(file.id) ? 'bg-indigo-50 dark:bg-indigo-900/10' : ''}`}
                                                >
                                                    <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${config.sources.includes(file.id) ? 'bg-[#0A1A3F] dark:bg-indigo-500 border-[#0A1A3F] dark:border-indigo-500 text-white' : 'border-[#CBD5E1] dark:border-slate-600'}`}>
                                                        {config.sources.includes(file.id) && <Check size={12} />}
                                                    </div>
                                                    <span className="text-sm font-medium text-[#0F172A] dark:text-slate-200 truncate flex-1">{file.name}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="relative">
                                    <input
                                        type="file"
                                        accept="application/pdf"
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                        onChange={handleDirectUpload}
                                    />
                                    <button className="w-full border-2 border-dashed border-[#CBD5E1] dark:border-slate-700 text-[#64748B] dark:text-slate-400 p-3 rounded-xl text-sm font-bold hover:border-[#0A1A3F] hover:text-[#0A1A3F] dark:hover:border-indigo-500 dark:hover:text-indigo-400 transition-colors flex items-center justify-center gap-2">
                                        {isUploading ? <Loader2 className="animate-spin" size={16} /> : <UploadCloud size={16} />}
                                        Upload New PDF
                                    </button>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={handleGenerate}
                            disabled={isGenerating || (config.sources.length === 0 && !config.topic) || isUploading}
                            className="w-full bg-[#0A1A3F] dark:bg-indigo-600 hover:bg-[#1E3A8A] dark:hover:bg-indigo-700 text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-wait flex items-center justify-center gap-3 shrink-0"
                        >
                            {isGenerating ? "Generating Test..." : <><Play size={20} /> Generate Test</>}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (step === 'TESTING' && activeTest && activeTest.studyPlan) {
        return (
            <div className="h-full flex flex-col max-w-4xl mx-auto animate-fade-in p-6">
                <div className="bg-white dark:bg-slate-900 border-b border-[#E2E8F0] dark:border-slate-800 p-4 flex justify-between items-center sticky top-0 z-10 shadow-sm rounded-t-xl border-x">
                    <div>
                        <h2 className="font-bold text-[#0F172A] dark:text-white text-lg">{activeTest.title}</h2>
                        <span className="text-xs text-[#64748B] dark:text-slate-500 font-mono">Question {Object.keys(userAnswers).length} / {activeTest.studyPlan.practiceQuestions.length} Answered</span>
                    </div>
                    <div className="flex items-center gap-2 bg-[#FEF2F2] dark:bg-red-900/20 text-red-600 dark:text-red-400 px-3 py-1 rounded-full text-sm font-bold border border-red-100 dark:border-red-900/30">
                        <Clock size={16} className="animate-pulse" />
                        <span>{formatTime(timeLeft)}</span>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-8 pb-32 bg-white dark:bg-slate-900 border-x border-[#E2E8F0] dark:border-slate-800">
                    {activeTest.studyPlan.practiceQuestions.map((q, idx) => (
                        <div key={q.id} className="bg-[#F8FAFC] dark:bg-slate-800/50 p-6 rounded-xl border border-[#E2E8F0] dark:border-slate-700">
                            <h4 className="font-bold text-[#0F172A] dark:text-white text-lg mb-4 flex gap-3">
                                <span className="bg-white dark:bg-slate-800 text-[#64748B] dark:text-slate-400 w-8 h-8 rounded-lg flex items-center justify-center text-sm shrink-0 border">{idx + 1}</span>
                                {q.questionText}
                            </h4>
                            <div className="space-y-3 pl-11">
                                {q.options?.map((opt, i) => (
                                    <label key={i} className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${userAnswers[q.id] === opt ? 'bg-[#0A1A3F] dark:bg-indigo-600 border-[#0A1A3F] dark:border-indigo-600 text-white' : 'bg-white dark:bg-slate-800 border-[#E2E8F0] dark:border-slate-700 hover:bg-[#F1F5F9] dark:hover:bg-slate-700 text-[#0F172A] dark:text-slate-200'}`}>
                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${userAnswers[q.id] === opt ? 'border-white bg-white' : 'border-[#CBD5E1] dark:border-slate-500'}`}>
                                            {userAnswers[q.id] === opt && <div className="w-2.5 h-2.5 rounded-full bg-[#0A1A3F] dark:bg-indigo-600" />}
                                        </div>
                                        <input
                                            type="radio"
                                            name={q.id}
                                            value={opt}
                                            checked={userAnswers[q.id] === opt}
                                            onChange={() => setUserAnswers({ ...userAnswers, [q.id]: opt })}
                                            className="hidden"
                                        />
                                        <span className="font-medium">{opt}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="fixed bottom-0 left-0 lg:left-72 right-0 bg-white dark:bg-slate-900 border-t border-[#E2E8F0] dark:border-slate-800 p-4 z-20 flex justify-center">
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="bg-[#0A1A3F] dark:bg-indigo-600 hover:bg-[#1E3A8A] text-white px-12 py-3 rounded-xl font-bold text-lg shadow-lg flex items-center gap-2"
                    >
                        {isSubmitting ? "Grading..." : <><CheckCircle size={20} /> Submit Test</>}
                    </button>
                </div>
            </div>
        );
    }

    if (step === 'RESULTS' && testResult) {
        return (
            <div className="max-w-4xl mx-auto h-full overflow-y-auto p-6 animate-fade-in">
                <div className="text-center mb-10">
                    <h2 className="text-3xl font-bold text-[#0F172A] dark:text-white mb-2">Test Results</h2>
                    <p className="text-[#64748B] dark:text-slate-400">Completed in {testResult.timeTaken}</p>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-[#E2E8F0] dark:border-slate-800 shadow-xl mb-10 flex flex-col items-center gap-12">
                    <div className="relative w-[250px] h-[250px] flex items-center justify-center">
                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 200 200">
                            <circle cx="100" cy="100" r="90" className="stroke-[#F1F5F9] dark:stroke-slate-800" strokeWidth="16" fill="none" />
                            <circle
                                cx="100" cy="100" r="90"
                                className={`stroke-[#0A1A3F] dark:stroke-indigo-500 transition-all duration-1000 ease-out`}
                                strokeWidth="16" fill="none"
                                strokeDasharray={565.48}
                                strokeDashoffset={565.48 - (565.48 * testResult.score) / 100}
                                strokeLinecap="round"
                            />
                        </svg>
                        <div className="absolute flex flex-col items-center">
                            <span className="text-6xl font-black text-[#0F172A] dark:text-white tracking-tighter">{testResult.score}%</span>
                            <span className="text-sm font-bold text-[#64748B] uppercase tracking-wide mt-1">Accuracy</span>
                        </div>
                    </div>

                    <div className="w-full max-w-2xl space-y-6">
                        <h3 className="text-lg font-bold text-[#0F172A] dark:text-white flex items-center gap-2 mb-4 border-b border-[#E2E8F0] dark:border-slate-800 pb-2">
                            <BarChart2 className="text-[#0A1A3F] dark:text-indigo-400" /> Topic Breakdown
                        </h3>
                        <div className="space-y-6">
                            {testResult.topicAccuracy.map((t, i) => (
                                <div key={i} className="w-full">
                                    <div className="flex justify-between text-sm font-bold mb-2">
                                        <span className="text-[#475569] dark:text-slate-300">{t.topic}</span>
                                        <span className="text-[#0F172A] dark:text-white">{t.accuracy}%</span>
                                    </div>
                                    <div className="w-full h-4 bg-[#F1F5F9] dark:bg-slate-800 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-[#0A1A3F] dark:bg-indigo-500 rounded-full transition-all duration-1000"
                                            style={{ width: `${t.accuracy}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="bg-[#F8FAFC] dark:bg-slate-800/50 p-6 rounded-2xl border border-[#E2E8F0] dark:border-slate-800">
                    <h3 className="font-bold text-[#0F172A] dark:text-white mb-4 flex items-center gap-2"><AlertCircle size={20} className="text-amber-500" /> AI Performance Insights</h3>
                    <div className="grid grid-cols-1 gap-4">
                        {testResult.feedback.map((f, i) => (
                            <div key={i} className="bg-white dark:bg-slate-900 p-4 rounded-xl border-l-4 border-amber-500 shadow-sm">
                                <p className="font-bold text-[#0F172A] dark:text-white mb-1">Weakness detected in {f.weakness}</p>
                                <p className="text-sm text-[#64748B] dark:text-slate-300 mb-3">{f.advice}</p>
                                <button className="text-xs font-bold bg-[#F1F5F9] dark:bg-slate-800 text-[#0A1A3F] dark:text-indigo-400 px-3 py-2 rounded-lg hover:bg-[#E2E8F0] flex items-center gap-1 w-fit">
                                    Recommended: {f.recommendedAction}
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="mt-8 flex justify-center pb-20">
                    <button
                        onClick={() => { setStep('CONFIG'); setActiveTest(null); setUserAnswers({}); setTestResult(null); }}
                        className="flex items-center gap-2 text-[#64748B] hover:text-[#0A1A3F] font-bold"
                    >
                        <RefreshCcw size={18} /> Generate Another Test
                    </button>
                </div>
            </div>
        );
    }

    return null;
};

export default TestGenerator;
