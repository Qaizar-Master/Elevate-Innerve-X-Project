
import React, { useState, useEffect } from 'react';
import { Play, Bug, FileCode, CheckCircle, ArrowRight } from 'lucide-react';
import { analyzeCode } from '../services/gemini';

const CodeSandbox: React.FC = () => {
    const [code, setCode] = useState(`function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

// Buggy recursive call - let's see if Elevate fixes it for large N or suggests optimization!
console.log(fibonacci(10));`);
    
    const [output, setOutput] = useState<any>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    const handleRun = async () => {
        setIsAnalyzing(true);
        try {
            const result = await analyzeCode(code);
            setOutput(result);
        } catch (e) {
            console.error(e);
        } finally {
            setIsAnalyzing(false);
        }
    };

    return (
        <div className="h-full flex flex-col md:flex-row gap-4 animate-fade-in pb-4">
            {/* Editor Side */}
            <div className="flex-1 flex flex-col gap-4">
                <div className="bg-white p-4 rounded-xl border border-[#E2E8F0] flex justify-between items-center shadow-sm">
                    <h2 className="text-[#0F172A] font-bold flex items-center gap-2"><FileCode className="text-[#0A1A3F]"/> Live Coding Sandbox</h2>
                    <button 
                        onClick={handleRun}
                        disabled={isAnalyzing}
                        className="bg-[#0A1A3F] hover:bg-[#1E3A8A] text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2 transition-colors disabled:opacity-50 shadow-md"
                    >
                        {isAnalyzing ? "Analyzing..." : <><Play size={18} fill="currentColor"/> Run & Debug</>}
                    </button>
                </div>
                
                <div className="flex-1 bg-[#0F172A] rounded-xl border border-[#334155] p-4 font-mono text-sm relative overflow-hidden shadow-inner">
                    <textarea 
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        className="w-full h-full bg-transparent text-[#E2E8F0] outline-none resize-none z-10 relative"
                        spellCheck={false}
                    />
                </div>
            </div>

            {/* Output Side */}
            <div className="w-full md:w-1/2 flex flex-col gap-4 overflow-y-auto">
                {output ? (
                    <>
                        <div className="bg-[#0A0F1C] p-6 rounded-xl border border-[#334155] font-mono text-sm text-[#4ADE80] shadow-md">
                            <span className="text-[#64748B] select-none">$ execution output</span><br/>
                            {output.outputSimulation}
                        </div>
                        
                        <div className="bg-white p-6 rounded-xl border border-[#E2E8F0] shadow-sm">
                            <h3 className="text-[#0F172A] font-bold mb-2 flex items-center gap-2"><Bug size={18} className="text-[#1E3A8A]"/> AI Explanation & Fixes</h3>
                            <p className="text-[#475569] text-sm mb-4 leading-relaxed">{output.explanation}</p>
                            
                            <div className="bg-[#F8FAFC] p-4 rounded-lg border border-[#E2E8F0]">
                                <span className="text-xs text-[#64748B] uppercase font-bold mb-2 block">Optimized Code</span>
                                <pre className="text-xs text-[#0A1A3F] overflow-x-auto whitespace-pre-wrap font-bold">{output.correctedCode}</pre>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-[#94A3B8] border border-dashed border-[#CBD5E1] rounded-xl bg-[#F8FAFC]">
                        <Play size={40} className="mb-4 opacity-50 text-[#0A1A3F]"/>
                        <p>Write code and hit Run to see execution and fixes.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CodeSandbox;
