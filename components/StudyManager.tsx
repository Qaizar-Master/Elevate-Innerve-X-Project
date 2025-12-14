import React, { useState, useEffect } from 'react';
import { Upload, FileText, CheckCircle, Clock, Brain, AlertCircle, ChevronRight, PlayCircle, Award, BarChart2, StickyNote, Layers } from 'lucide-react';
import { StudyPlan, Question, MistakeAnalysis, SmartNotes } from '../types';
import { generateStudyPlanFromPDF, analyzeMistakes, generateSmartNotes } from '../services/gemini';
import ReactMarkdown from 'react-markdown';

interface StudyManagerProps {
    initialTab?: 'plan' | 'quiz' | 'notes';
}

const StudyManager: React.FC<StudyManagerProps> = ({ initialTab = 'plan' }) => {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [plan, setPlan] = useState<StudyPlan | null>(null);
  const [notes, setNotes] = useState<SmartNotes | null>(null);
  const [activeTab, setActiveTab] = useState<'plan' | 'quiz' | 'notes'>(initialTab);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string>>({});
  const [showResults, setShowResults] = useState(false);
  const [analysis, setAnalysis] = useState<MistakeAnalysis | null>(null);
  const [analyzingMistakes, setAnalyzingMistakes] = useState(false);
  const [flippedCard, setFlippedCard] = useState<number | null>(null);

  // Deep linking effect
  useEffect(() => {
    if (initialTab && plan) {
        setActiveTab(initialTab);
    }
  }, [initialTab, plan]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleGenerate = async () => {
    if (!file) return;
    setIsProcessing(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = (reader.result as string).split(',')[1];
        
        // Parallel generation
        const [generatedPlan, generatedNotes] = await Promise.all([
             generateStudyPlanFromPDF(base64, file.name),
             generateSmartNotes(base64, file.name)
        ]);
        
        setPlan(generatedPlan);
        setNotes(generatedNotes);
        // If we were waiting to go to a specific tab, go there now, else default to plan
        setActiveTab(initialTab === 'quiz' ? 'quiz' : 'plan');
        setQuizAnswers({});
        setShowResults(false);
        setAnalysis(null);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Failed to generate content", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSubmitQuiz = async () => {
      if(!plan) return;
      setShowResults(true);
      const updatedQuestions = plan.practiceQuestions.map(q => ({
          ...q,
          userAnswer: quizAnswers[q.id] || "No Answer"
      }));

      setAnalyzingMistakes(true);
      try {
          const result = await analyzeMistakes(updatedQuestions);
          setAnalysis(result);
      } catch (e) {
          console.error("Analysis failed", e);
      } finally {
          setAnalyzingMistakes(false);
      }
  };

  const calculateScore = () => {
    if (!plan) return 0;
    let correct = 0;
    plan.practiceQuestions.forEach(q => {
        const uAns = quizAnswers[q.id]?.toLowerCase().trim();
        const cAns = q.correctAnswer?.toLowerCase().trim();
        if (uAns === cAns) correct++;
    });
    return Math.round((correct / plan.practiceQuestions.length) * 100);
  };

  if (!plan) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center space-y-8 animate-fade-in">
        <div className="bg-white dark:bg-slate-900 p-12 rounded-xl border border-[#E2E8F0] dark:border-slate-800 hover:border-[#0A1A3F] dark:hover:border-slate-600 transition-colors max-w-2xl w-full shadow-sm">
            <div className="w-20 h-20 bg-[#F1F5F9] dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6 text-[#0A1A3F] dark:text-indigo-400">
                 <Upload size={40} />
            </div>
          <h2 className="text-2xl font-bold text-[#0F172A] dark:text-white mb-2">Upload Chapter PDF</h2>
          <p className="text-[#64748B] dark:text-slate-400 mb-8">
            Upload your textbook chapter or notes. Elevate will generate:
            <br/><span className="text-[#0A1A3F] dark:text-indigo-400 font-semibold">Study Plan • Smart Notes • Flashcards • Practice Test</span>
          </p>
          
          <input 
            type="file" 
            accept="application/pdf"
            onChange={handleFileChange}
            className="hidden" 
            id="pdf-upload" 
          />
          <label 
            htmlFor="pdf-upload"
            className="cursor-pointer bg-[#F8FAFC] dark:bg-slate-800 hover:bg-[#F1F5F9] dark:hover:bg-slate-700 text-[#0F172A] dark:text-slate-200 border border-[#E2E8F0] dark:border-slate-700 px-6 py-3 rounded-lg font-medium transition-colors inline-flex items-center gap-2"
          >
            {file ? <><FileText size={18}/> {file.name}</> : "Choose PDF File"}
          </label>

          {file && (
            <div className="mt-8">
                <button
                    onClick={handleGenerate}
                    disabled={isProcessing}
                    className="w-full bg-[#0A1A3F] dark:bg-indigo-600 hover:bg-[#1E3A8A] dark:hover:bg-indigo-700 text-white px-8 py-4 rounded-lg font-bold text-lg shadow-lg shadow-[#0A1A3F]/20 dark:shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-wait transition-all flex items-center justify-center gap-3"
                >
                    {isProcessing ? "Processing..." : "Generate Full Study Suite"}
                </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col animate-fade-in">
        <header className="flex items-center justify-between mb-6 px-2">
            <div>
                <h2 className="text-2xl font-bold text-[#0F172A] dark:text-white">{plan.topic}</h2>
                <p className="text-[#64748B] dark:text-slate-400 text-sm flex items-center gap-2 mt-1">
                    <Clock size={14}/> {plan.estimatedTime} estimated study time
                </p>
            </div>
            <div className="flex bg-white dark:bg-slate-900 p-1 rounded-lg border border-[#E2E8F0] dark:border-slate-800 shadow-sm">
                <button 
                    onClick={() => setActiveTab('plan')}
                    className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${activeTab === 'plan' ? 'bg-[#0A1A3F] dark:bg-indigo-600 text-white shadow-sm' : 'text-[#64748B] dark:text-slate-400 hover:bg-[#F1F5F9] dark:hover:bg-slate-800'}`}
                >
                    Overview
                </button>
                <button 
                    onClick={() => setActiveTab('notes')}
                    className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${activeTab === 'notes' ? 'bg-[#0A1A3F] dark:bg-indigo-600 text-white shadow-sm' : 'text-[#64748B] dark:text-slate-400 hover:bg-[#F1F5F9] dark:hover:bg-slate-800'}`}
                >
                    Notes & Cards
                </button>
                <button 
                    onClick={() => setActiveTab('quiz')}
                    className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${activeTab === 'quiz' ? 'bg-[#0A1A3F] dark:bg-indigo-600 text-white shadow-sm' : 'text-[#64748B] dark:text-slate-400 hover:bg-[#F1F5F9] dark:hover:bg-slate-800'}`}
                >
                    Test
                </button>
            </div>
        </header>

        <div className="flex-1 overflow-y-auto pr-2">
            {activeTab === 'plan' && (
                <div className="space-y-6">
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-[#E2E8F0] dark:border-slate-800 shadow-sm">
                        <h3 className="text-lg font-bold text-[#0F172A] dark:text-white mb-4 flex items-center gap-2">
                            <Brain size={20} className="text-[#0A1A3F] dark:text-indigo-400"/> Executive Summary
                        </h3>
                        <p className="text-[#475569] dark:text-slate-300 leading-relaxed">{plan.summary}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {plan.keyConcepts.map((concept, idx) => (
                            <div key={idx} className="bg-white dark:bg-slate-900 p-4 rounded-lg border border-[#E2E8F0] dark:border-slate-800 hover:border-[#0A1A3F] dark:hover:border-indigo-500 transition-colors shadow-sm cursor-default">
                                <div className="flex items-start gap-3">
                                    <div className="w-6 h-6 rounded-full bg-[#F1F5F9] dark:bg-slate-800 text-[#0A1A3F] dark:text-indigo-400 flex items-center justify-center text-xs font-bold mt-0.5 shrink-0 border border-[#E2E8F0] dark:border-slate-700">
                                        {idx + 1}
                                    </div>
                                    <p className="text-[#0F172A] dark:text-slate-200 font-medium">{concept}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {activeTab === 'notes' && notes && (
                <div className="space-y-8 pb-10">
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-[#E2E8F0] dark:border-slate-800 shadow-sm">
                        <h3 className="text-lg font-bold text-[#0F172A] dark:text-white mb-4 flex items-center gap-2">
                            <Layers size={20} className="text-[#1E3A8A] dark:text-indigo-400"/> Smart Mind Map Structure
                        </h3>
                        <div className="prose prose-sm dark:prose-invert max-w-none text-[#475569] dark:text-slate-300">
                            <ReactMarkdown>{notes.mindMapMarkdown}</ReactMarkdown>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-lg font-bold text-[#0F172A] dark:text-white mb-4 flex items-center gap-2">
                            <StickyNote size={20} className="text-[#0A1A3F] dark:text-indigo-400"/> Flashcards
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {notes.flashcards.map((card, idx) => (
                                <div 
                                    key={idx}
                                    onClick={() => setFlippedCard(flippedCard === idx ? null : idx)}
                                    className="aspect-video perspective cursor-pointer group"
                                >
                                    <div className={`relative preserve-3d w-full h-full transition-all duration-500 ${flippedCard === idx ? 'rotate-y-180' : ''}`}>
                                        {/* Front */}
                                        <div className="absolute backface-hidden w-full h-full bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-700 rounded-xl p-6 flex flex-col items-center justify-center text-center shadow-md group-hover:border-[#0A1A3F] dark:group-hover:border-indigo-500 transition-colors">
                                            <span className="text-xs uppercase font-bold text-[#94A3B8] dark:text-slate-500 mb-2">Concept</span>
                                            <p className="text-[#0F172A] dark:text-white font-bold">{card.front}</p>
                                            <span className="text-xs text-[#64748B] dark:text-slate-400 mt-4 font-medium">Click to flip</span>
                                        </div>
                                        {/* Back */}
                                        <div className="absolute backface-hidden rotate-y-180 w-full h-full bg-[#F8FAFC] dark:bg-slate-800 border border-[#CBD5E1] dark:border-slate-700 rounded-xl p-6 flex flex-col items-center justify-center text-center shadow-md">
                                            <span className="text-xs uppercase font-bold text-[#0A1A3F] dark:text-indigo-400 mb-2">Answer</span>
                                            <p className="text-[#0F172A] dark:text-slate-200 text-sm font-medium">{card.back}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'quiz' && (
                <div className="space-y-8 pb-10">
                     {!showResults ? (
                         <div className="space-y-6">
                            {plan.practiceQuestions.map((q, idx) => (
                                <div key={q.id} className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-[#E2E8F0] dark:border-slate-800 shadow-sm">
                                    <div className="flex justify-between mb-4">
                                        <h4 className="text-[#0F172A] dark:text-white font-bold flex gap-3">
                                            <span className="text-[#94A3B8]">Q{idx + 1}.</span>
                                            {q.questionText}
                                        </h4>
                                        <span className="text-xs bg-[#F1F5F9] dark:bg-slate-800 px-2 py-1 rounded text-[#475569] dark:text-slate-300 font-bold h-fit border border-[#E2E8F0] dark:border-slate-700">{q.type.replace('_', ' ')}</span>
                                    </div>
                                    
                                    <div className="pl-8">
                                        {q.type === 'MCQ' && q.options ? (
                                            <div className="space-y-3">
                                                {q.options.map((opt, optIdx) => (
                                                    <label 
                                                        key={optIdx} 
                                                        className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                                                            quizAnswers[q.id] === opt 
                                                            ? 'bg-[#F1F5F9] dark:bg-slate-800 border-[#0A1A3F] dark:border-indigo-500' 
                                                            : 'bg-white dark:bg-slate-900 border-[#E2E8F0] dark:border-slate-700 hover:bg-[#F8FAFC] dark:hover:bg-slate-800'
                                                        }`}
                                                    >
                                                        <input 
                                                            type="radio" 
                                                            name={q.id} 
                                                            value={opt}
                                                            checked={quizAnswers[q.id] === opt}
                                                            onChange={(e) => setQuizAnswers({...quizAnswers, [q.id]: e.target.value})}
                                                            className="w-4 h-4 accent-[#0A1A3F] dark:accent-indigo-500"
                                                        />
                                                        <span className="text-[#475569] dark:text-slate-300 text-sm font-medium">{opt}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        ) : (
                                            <textarea 
                                                className="w-full bg-[#F8FAFC] dark:bg-slate-800 border border-[#E2E8F0] dark:border-slate-700 rounded-lg p-3 text-[#0F172A] dark:text-slate-200 focus:border-[#0A1A3F] dark:focus:border-indigo-500 outline-none transition-colors"
                                                rows={3}
                                                placeholder="Type your answer here..."
                                                value={quizAnswers[q.id] || ''}
                                                onChange={(e) => setQuizAnswers({...quizAnswers, [q.id]: e.target.value})}
                                            />
                                        )}
                                    </div>
                                </div>
                            ))}
                            <button 
                                onClick={handleSubmitQuiz}
                                className="w-full bg-[#0A1A3F] dark:bg-indigo-600 hover:bg-[#1E3A8A] dark:hover:bg-indigo-700 text-white py-4 rounded-xl font-bold shadow-lg shadow-[#0A1A3F]/20 dark:shadow-indigo-500/20 transition-all mt-4"
                            >
                                Submit & Analyze Performance
                            </button>
                         </div>
                     ) : (
                         <div className="space-y-6 animate-fade-in">
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="p-6 bg-white dark:bg-slate-900 rounded-xl border border-[#E2E8F0] dark:border-slate-800 flex flex-col items-center justify-center text-center shadow-sm">
                                    <h3 className="text-[#64748B] dark:text-slate-400 uppercase text-sm tracking-wider mb-2 font-bold">Your Score</h3>
                                    <div className="text-6xl font-black text-[#0A1A3F] dark:text-white mb-2">
                                        {calculateScore()}%
                                    </div>
                                </div>
                                
                                <div className="p-6 bg-white dark:bg-slate-900 rounded-xl border border-[#E2E8F0] dark:border-slate-800 shadow-sm">
                                    <h3 className="text-[#0F172A] dark:text-white font-bold mb-4 flex items-center gap-2">
                                        <BarChart2 className="text-[#0A1A3F] dark:text-indigo-400"/> AI Mistake Pattern Detector
                                    </h3>
                                    {analyzingMistakes ? (
                                        <div className="flex items-center gap-2 text-[#64748B] dark:text-slate-400 animate-pulse">
                                            <div className="w-2 h-2 bg-[#64748B] dark:bg-slate-400 rounded-full animate-bounce"/>
                                            Analyzing your error patterns...
                                        </div>
                                    ) : analysis ? (
                                        <div>
                                            <p className="text-[#475569] dark:text-slate-300 text-sm mb-4 italic">"{analysis.summary}"</p>
                                            <div className="space-y-3">
                                                {analysis.patterns.map((pat, i) => (
                                                    <div key={i} className="bg-[#FEF2F2] dark:bg-red-900/20 p-3 rounded-lg border-l-4 border-[#EF4444]">
                                                        <div className="flex justify-between">
                                                            <span className="text-xs font-bold text-[#EF4444] uppercase">{pat.category.replace('_', ' ')}</span>
                                                        </div>
                                                        <p className="text-sm text-[#0F172A] dark:text-slate-200 mt-1">{pat.description}</p>
                                                        <p className="text-xs text-[#10B981] dark:text-emerald-400 mt-2 font-bold">💡 Fix: {pat.suggestion}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="text-[#64748B] dark:text-slate-400">No mistakes found!</p>
                                    )}
                                </div>
                             </div>

                             {plan.practiceQuestions.map((q, idx) => {
                                 // Basic logic for right/wrong for now
                                 const isCorrect = q.type === 'MCQ' ? quizAnswers[q.id] === q.correctAnswer : true; 
                                 
                                 return (
                                     <div key={q.id} className={`p-6 rounded-xl border shadow-sm ${isCorrect ? 'bg-[#F0FDF4] dark:bg-green-900/10 border-[#BBF7D0] dark:border-green-800' : 'bg-[#FEF2F2] dark:bg-red-900/10 border-[#FECACA] dark:border-red-800'}`}>
                                         <div className="flex justify-between items-start mb-2">
                                            <h4 className="text-[#0F172A] dark:text-white font-bold pr-4">
                                                <span className="opacity-50 mr-2">Q{idx + 1}.</span> {q.questionText}
                                            </h4>
                                            {q.type === 'MCQ' && (isCorrect ? <CheckCircle className="text-[#10B981] shrink-0" size={20}/> : <AlertCircle className="text-[#EF4444] shrink-0" size={20}/>)}
                                         </div>
                                         <div className="pl-6 space-y-2 mt-4 text-sm">
                                             <p className="text-[#64748B] dark:text-slate-400">Your Answer: <span className={isCorrect ? 'text-[#10B981] font-bold' : 'text-[#EF4444] font-bold'}>{quizAnswers[q.id] || "Skipped"}</span></p>
                                             <p className="text-[#10B981] font-medium">Correct Answer/Model Solution: {q.correctAnswer}</p>
                                             <div className="bg-white dark:bg-slate-900 p-3 rounded-lg mt-3 border border-[#E2E8F0] dark:border-slate-800">
                                                 <p className="text-[#475569] dark:text-slate-300 text-xs leading-relaxed"><span className="font-bold text-[#0A1A3F] dark:text-indigo-400 uppercase text-[10px] tracking-wide mr-2">Explanation</span> {q.explanation}</p>
                                             </div>
                                         </div>
                                     </div>
                                 );
                             })}

                             <button 
                                onClick={() => {setShowResults(false); setQuizAnswers({}); setAnalysis(null);}}
                                className="w-full bg-[#0F172A] dark:bg-slate-800 hover:bg-[#334155] dark:hover:bg-slate-700 text-white py-3 rounded-xl font-bold transition-all shadow-md"
                             >
                                 Generate New Test
                             </button>
                         </div>
                     )}
                </div>
            )}
        </div>
    </div>
  );
};

export default StudyManager;