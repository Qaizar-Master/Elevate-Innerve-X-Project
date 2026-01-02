import React, { useState, useEffect, useRef } from 'react';
import { Play, Bug, FileCode, Trash2, Terminal, Code2, AlertTriangle, CheckCircle2, RotateCcw } from 'lucide-react';
import { analyzeCode } from '../services/gemini';

const CodeSandbox: React.FC = () => {
    // Default Code Template
    const defaultCode = `// Write your code here
function calculateSum(numbers) {
  let sum = 0;
  for (let i = 0; i < numbers.length; i++) {
    sum += numbers[i];
  }
  return sum;
}

const scores = [10, 20, 30, 40, 50];
console.log("Total Score:", calculateSum(scores));
console.log("Average Score:", calculateSum(scores) / scores.length);`;

    const [code, setCode] = useState(defaultCode);
    const [output, setOutput] = useState<any>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Auto-resize textarea or handle tab key could go here
    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Tab') {
            e.preventDefault();
            const start = e.currentTarget.selectionStart;
            const end = e.currentTarget.selectionEnd;
            const value = e.currentTarget.value;
            setCode(value.substring(0, start) + "  " + value.substring(end));
            // Need setTimeout to maintain cursor position in React binding, simplified here
        }
    };

    const handleRun = async () => {
        setIsAnalyzing(true);
        setError(null);
        setOutput(null); // Clear previous output to show fresh state

        try {
            console.log("Sending code for analysis...");
            const result = await analyzeCode(code);
            console.log("Received analysis:", result);
            setOutput(result);
        } catch (e: any) {
            console.error("Analysis failed:", e);
            setError(e.message || "An unexpected error occurred during execution.");
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleReset = () => {
        if (window.confirm("Reset to default code? Your changes will be lost.")) {
            setCode(defaultCode);
            setOutput(null);
            setError(null);
        }
    };

    const clearConsole = () => {
        setOutput(null);
        setError(null);
    };

    return (
        <div className="h-full flex flex-col lg:flex-row gap-0 animate-fade-in bg-[#1e1e1e] text-gray-300 overflow-hidden rounded-xl border border-[#333]">

            {/* LEFT PANEL: Editor */}
            <div className="flex-1 flex flex-col border-r border-[#333] min-h-[500px] lg:min-h-0">
                {/* Editor Toolbar */}
                <div className="h-12 bg-[#252526] border-b border-[#333] flex items-center justify-between px-4 shrink-0">
                    <div className="flex items-center gap-2 text-sm font-medium text-blue-400">
                        <FileCode size={16} />
                        <span>script.js</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleReset}
                            className="p-1.5 hover:bg-[#333] rounded text-gray-400 hover:text-white transition-colors"
                            title="Reset Code"
                        >
                            <RotateCcw size={14} />
                        </button>
                    </div>
                </div>

                {/* Editor Area */}
                <div className="flex-1 relative font-mono text-sm group">
                    <div className="absolute left-0 top-0 bottom-0 w-12 bg-[#1e1e1e] border-r border-[#333] text-gray-600 text-right pr-3 pt-4 select-none leading-relaxed">
                        {code.split('\n').map((_, i) => (
                            <div key={i}>{i + 1}</div>
                        ))}
                    </div>
                    <textarea
                        ref={textareaRef}
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="absolute left-12 top-0 right-0 bottom-0 bg-[#1e1e1e] text-gray-200 p-4 outline-none resize-none leading-relaxed selection:bg-[#264f78]"
                        spellCheck={false}
                    />
                </div>
            </div>

            {/* RIGHT PANEL: Output & Analysis */}
            <div className="w-full lg:w-[45%] flex flex-col bg-[#1e1e1e]">

                {/* Actions Toolbar */}
                <div className="h-12 bg-[#252526] border-b border-[#333] flex items-center justify-between px-4 shrink-0">
                    <span className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-2">
                        <Terminal size={14} /> Terminal / Output
                    </span>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={clearConsole}
                            className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
                            disabled={!output && !error}
                        >
                            Clear
                        </button>
                        <button
                            onClick={handleRun}
                            disabled={isAnalyzing}
                            className={`flex items-center gap-2 px-4 py-1.5 rounded text-xs font-bold uppercase tracking-wide transition-all ${isAnalyzing ? 'bg-gray-700 text-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-900/20'}`}
                        >
                            {isAnalyzing ? (
                                <>Running...</>
                            ) : (
                                <><Play size={12} fill="currentColor" /> Run & Debug</>
                            )}
                        </button>
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-6">

                    {/* 1. Execution Output - Most Important */}
                    {output && output.outputSimulation && (
                        <div className="space-y-2">
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Console Output</h3>
                            <div className="bg-[#000] p-4 rounded-lg border border-[#333] font-mono text-sm text-green-400 shadow-inner overflow-x-auto whitespace-pre-wrap">
                                {output.outputSimulation}
                            </div>
                        </div>
                    )}

                    {/* 2. Error State */}
                    {error && (
                        <div className="bg-red-900/20 border border-red-900/50 p-4 rounded-lg flex gap-3 text-red-200 animate-fade-in">
                            <AlertTriangle size={20} className="shrink-0 text-red-500" />
                            <div className="text-sm">
                                <p className="font-bold mb-1">Execution Failed</p>
                                <p className="opacity-80">{error}</p>
                            </div>
                        </div>
                    )}

                    {/* 3. AI Analysis (Only if there's output) */}
                    {output && (
                        <div className="space-y-4 pt-4 border-t border-[#333]">

                            {/* Explanation */}
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 text-blue-400">
                                    <Bug size={16} />
                                    <h3 className="text-sm font-bold">AI Debugger</h3>
                                </div>
                                <p className="text-sm text-gray-400 leading-relaxed bg-[#252526] p-3 rounded-lg border border-[#333]">
                                    {output.explanation}
                                </p>
                            </div>

                            {/* Corrected Code */}
                            {output.correctedCode && (
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-yellow-500">
                                        <CheckCircle2 size={16} />
                                        <h3 className="text-sm font-bold">Recommended Fix</h3>
                                    </div>
                                    <div className="relative group">
                                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => setCode(output.correctedCode)}
                                                className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-2 py-1 rounded"
                                            >
                                                Apply Fix
                                            </button>
                                        </div>
                                        <pre className="bg-[#1e1e1e] p-4 rounded-lg border border-[#333] font-mono text-xs text-blue-300 overflow-x-auto">
                                            {output.correctedCode}
                                        </pre>
                                    </div>
                                </div>
                            )}

                            {/* Mermaid Diagram (Optional) */}
                            {output.flowchartMermaid && (
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-purple-400">
                                        <Code2 size={16} />
                                        <h3 className="text-sm font-bold">Logic Flow</h3>
                                    </div>
                                    <div className="bg-[#252526] p-4 rounded-lg border border-[#333] overflow-hidden text-xs text-gray-500 text-center italic">
                                        (Flowchart visualization would render here)
                                        <pre className="mt-2 text-left text-gray-600">{output.flowchartMermaid}</pre>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Empty State */}
                    {!output && !error && !isAnalyzing && (
                        <div className="h-40 flex flex-col items-center justify-center text-gray-600">
                            <Terminal size={32} className="mb-3 opacity-20" />
                            <p className="text-sm">Output will appear here</p>
                        </div>
                    )}

                    {/* Loading State Overlay (if needed, but button state is usually enough) */}
                </div>
            </div>
        </div>
    );
};

export default CodeSandbox;
