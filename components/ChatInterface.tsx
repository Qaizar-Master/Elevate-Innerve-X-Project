import React, { useState, useRef, useEffect } from 'react';
import { Send, Image as ImageIcon, Video, Loader2, Maximize2, Code, Box, Mic, BrainCircuit, Layout, Trash2, Camera, Eye, Zap, Wind, HelpCircle, Activity } from 'lucide-react';
import { Message, Emotion, TutorMode } from '../types';
import { chatWithTutor, generateDiagram, generateEducationalVideo, generateStoryboard, detectMood } from '../services/gemini';
import ReactMarkdown from 'react-markdown';
import mermaid from 'mermaid';
import VoiceTutor from './VoiceTutor';

// Dedicated Mermaid Component for robust rendering
const MermaidDiagram = ({ code }: { code: string }) => {
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (elementRef.current) {
      // Reset content for Mermaid to process
      elementRef.current.innerHTML = code;
      elementRef.current.removeAttribute('data-processed');
      
      mermaid.run({
        nodes: [elementRef.current],
        suppressErrors: true
      }).catch((e) => {
        console.error("Mermaid generation error:", e);
        // Fallback to text if render fails
        if (elementRef.current) {
            elementRef.current.innerText = code;
            elementRef.current.style.color = 'red';
        }
      });
    }
  }, [code]);

  return <div ref={elementRef} className="mermaid flex justify-center overflow-x-auto bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700 my-2" />;
};

const ChatInterface: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('elevate_chat_history');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.error("Error parsing chat history:", e);
        }
      }
    }
    return [{
      id: '1',
      role: 'model',
      text: "Hi! I'm Elevate. I can solve coding problems with flowcharts, explain math step-by-step, or generate study videos. What are we learning today?",
      type: 'text',
      timestamp: Date.now()
    }];
  });
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingAction, setLoadingAction] = useState<string>('');
  const [showVoiceMode, setShowVoiceMode] = useState(false);
  const [useDeepReasoning, setUseDeepReasoning] = useState(false);
  
  // Emotion & Adaptive Learning State
  const [showEmotionCam, setShowEmotionCam] = useState(false);
  const [currentEmotion, setCurrentEmotion] = useState<Emotion>('NEUTRAL');
  const [tutorMode, setTutorMode] = useState<TutorMode>('STANDARD');
  const [isDetectingMood, setIsDetectingMood] = useState(false);
  // Use a ref to track detection state inside the interval closure to avoid staleness
  const isDetectingRef = useRef(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    mermaid.initialize({ 
        startOnLoad: false, 
        theme: 'base',
        themeVariables: {
          primaryColor: '#F1F5F9',
          primaryTextColor: '#0F172A',
          primaryBorderColor: '#0A1A3F',
          lineColor: '#0A1A3F',
          secondaryColor: '#E2E8F0',
          tertiaryColor: '#fff',
          darkMode: true // Allow mermaid to adapt if needed
        },
        securityLevel: 'loose',
        fontFamily: 'Inter'
    });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    localStorage.setItem('elevate_chat_history', JSON.stringify(messages));
  }, [messages]);

  // Start/Stop Camera for Emotion Detection
  useEffect(() => {
      let interval: any;
      
      const startCamera = async () => {
          try {
              const stream = await navigator.mediaDevices.getUserMedia({ video: true });
              if (videoRef.current) {
                  videoRef.current.srcObject = stream;
              }
              // Start periodic detection
              // Increased to 60s to prevent RESOURCE_EXHAUSTED errors on free tier
              interval = setInterval(captureAndAnalyze, 60000); 
          } catch (e) {
              console.error("Camera access denied or error", e);
              setShowEmotionCam(false);
          }
      };

      const stopCamera = () => {
          if (videoRef.current && videoRef.current.srcObject) {
              const stream = videoRef.current.srcObject as MediaStream;
              stream.getTracks().forEach(track => track.stop());
              videoRef.current.srcObject = null;
          }
          if (interval) clearInterval(interval);
      };

      if (showEmotionCam) {
          startCamera();
      } else {
          stopCamera();
          setTutorMode('STANDARD');
          setCurrentEmotion('NEUTRAL');
      }

      return () => {
          stopCamera();
      };
  }, [showEmotionCam]);

  const captureAndAnalyze = async () => {
      // Prevent overlapping requests or calling when component is unmounted
      if (isDetectingRef.current) return;
      if (!videoRef.current || !canvasRef.current) return;
      
      try {
        isDetectingRef.current = true;
        setIsDetectingMood(true);
        
        const context = canvasRef.current.getContext('2d');
        if (context) {
            context.drawImage(videoRef.current, 0, 0, 320, 240);
            const base64 = canvasRef.current.toDataURL('image/jpeg').split(',')[1];
            const emotion = await detectMood(base64);
            
            setCurrentEmotion(emotion);
            
            // Adaptive Logic
            switch (emotion) {
                case 'CONFUSED':
                    setTutorMode('SIMPLIFIER');
                    break;
                case 'BORED':
                    setTutorMode('CHALLENGER');
                    break;
                case 'STRESSED':
                    setTutorMode('ZEN');
                    break;
                default:
                    setTutorMode('STANDARD');
            }
        }
      } catch (e) {
        console.error("Analysis loop error:", e);
      } finally {
        setIsDetectingMood(false);
        isDetectingRef.current = false;
      }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const clearHistory = () => {
    const defaultMsg: Message = {
        id: Date.now().toString(),
        role: 'model',
        text: "History cleared. What are we learning today?",
        type: 'text',
        timestamp: Date.now()
    };
    setMessages([defaultMsg]);
    localStorage.removeItem('elevate_chat_history');
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      type: 'text',
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);
    setLoadingAction(useDeepReasoning ? 'Deep Thinking (this takes a moment)...' : 'Thinking...');

    try {
      // 1. Get Text Response with Adaptive Instructions
      const history = messages.map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      }));
      
      // Inject adaptive system instructions
      let adaptiveInstruction = "";
      if (tutorMode === 'SIMPLIFIER') {
          adaptiveInstruction = "USER STATUS: CONFUSED. STRATEGY: Explain extremely simply. Use analogies. Break down into tiny steps. Be patient.";
      } else if (tutorMode === 'CHALLENGER') {
          adaptiveInstruction = "USER STATUS: BORED. STRATEGY: Gamify the response. Challenge the user. Use a high-energy, exciting tone. Ask a tough follow-up question.";
      } else if (tutorMode === 'ZEN') {
          adaptiveInstruction = "USER STATUS: STRESSED. STRATEGY: Be calming and supportive. 'Let's take this slow'. Focus on one small thing at a time. Reassure the user.";
      }

      const responseText = await chatWithTutor(history, userMsg.text, undefined, useDeepReasoning, adaptiveInstruction);
      
      const lowerInput = userMsg.text.toLowerCase();
      let imageUrl: string | undefined;
      let videoUrl: string | undefined;
      let msgType: 'text' | 'image' | 'video' | 'mixed' = 'text';

      // 2. Auto-generate diagram if requested (Maps, Schematics)
      if (lowerInput.includes('map') || lowerInput.includes('schematic') || lowerInput.includes('visualize') || lowerInput.includes('3d')) {
        setLoadingAction('Generating visual model...');
        const generatedImage = await generateDiagram(userMsg.text);
        if (generatedImage) {
          imageUrl = generatedImage;
          msgType = 'mixed';
        }
      }

      // 3. Auto-generate video if requested
      if (lowerInput.includes('video') || lowerInput.includes('animation')) {
        setLoadingAction('Generating video lesson (this takes a moment)...');
        const generatedVideo = await generateEducationalVideo(userMsg.text);
        if (generatedVideo) {
          videoUrl = generatedVideo;
          msgType = 'mixed';
        }
      }

      const modelMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: responseText,
        type: msgType,
        imageUrl,
        videoUrl,
        timestamp: Date.now()
      };

      setMessages(prev => [...prev, modelMsg]);

    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'model',
        text: "Sorry, I encountered an error processing your request.",
        type: 'text',
        timestamp: Date.now()
      }]);
    } finally {
      setIsLoading(false);
      setLoadingAction('');
    }
  };

  const handleGenerateVideoForMessage = async (msgId: string, prompt: string) => {
    setIsLoading(true);
    setLoadingAction('Generating specific video (Veo)...');
    try {
       const videoUrl = await generateEducationalVideo(prompt);
       if (videoUrl) {
           setMessages(prev => prev.map(m => {
               if (m.id === msgId) {
                   return { ...m, videoUrl, type: 'mixed' };
               }
               return m;
           }));
       }
    } finally {
        setIsLoading(false);
        setLoadingAction('');
    }
  };

  const handleGenerateStoryboardForMessage = async (msgId: string, prompt: string) => {
    setIsLoading(true);
    setLoadingAction('Generating visual storyboard (Nano)...');
    try {
       const storyboardUrl = await generateStoryboard(prompt);
       if (storyboardUrl) {
           setMessages(prev => prev.map(m => {
               if (m.id === msgId) {
                   return { ...m, storyboardUrl, type: 'mixed' };
               }
               return m;
           }));
       }
    } finally {
        setIsLoading(false);
        setLoadingAction('');
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 rounded-xl overflow-hidden border border-[#E2E8F0] dark:border-slate-800 shadow-sm relative transition-colors">
      {showVoiceMode && <VoiceTutor onClose={() => setShowVoiceMode(false)} />}
      
      {/* Emotion Cam Widget (Absolute Position) */}
      <div className={`absolute top-4 right-4 z-20 flex flex-col items-end pointer-events-none transition-all duration-300 ${showEmotionCam ? 'translate-x-0 opacity-100' : 'translate-x-10 opacity-0'}`}>
         <div className="bg-black/90 p-2 rounded-xl shadow-2xl border border-slate-700 pointer-events-auto backdrop-blur-md">
             <div className="relative w-32 h-24 bg-slate-800 rounded-lg overflow-hidden mb-2">
                 <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover transform scale-x-[-1]" />
                 <canvas ref={canvasRef} width="320" height="240" className="hidden" />
                 {isDetectingMood && (
                     <div className="absolute top-1 right-1">
                         <Loader2 size={12} className="text-white animate-spin"/>
                     </div>
                 )}
             </div>
             <div className="flex flex-col gap-1">
                 <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono uppercase tracking-wider">
                     <span>Mood</span>
                     <span className={`${
                         currentEmotion === 'CONFUSED' ? 'text-blue-400' : 
                         currentEmotion === 'BORED' ? 'text-red-400' : 
                         currentEmotion === 'STRESSED' ? 'text-amber-400' : 
                         currentEmotion === 'HAPPY' ? 'text-green-400' : 'text-slate-200'
                     } font-bold`}>{currentEmotion}</span>
                 </div>
                 <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono uppercase tracking-wider">
                     <span>Mode</span>
                     <span className={`font-bold flex items-center gap-1 ${
                         tutorMode === 'SIMPLIFIER' ? 'text-blue-400' : 
                         tutorMode === 'CHALLENGER' ? 'text-red-400' : 
                         tutorMode === 'ZEN' ? 'text-green-400' : 'text-slate-200'
                     }`}>
                         {tutorMode === 'SIMPLIFIER' && <HelpCircle size={10}/>}
                         {tutorMode === 'CHALLENGER' && <Zap size={10}/>}
                         {tutorMode === 'ZEN' && <Wind size={10}/>}
                         {tutorMode}
                     </span>
                 </div>
             </div>
         </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#F8FAFC] dark:bg-slate-950">
        
        {/* Adaptive Mode Banner (if active) */}
        {showEmotionCam && tutorMode !== 'STANDARD' && (
            <div className={`sticky top-0 z-10 w-full p-2 rounded-lg text-xs font-bold text-center mb-4 flex items-center justify-center gap-2 shadow-lg backdrop-blur-md animate-slide-down border ${
                tutorMode === 'SIMPLIFIER' ? 'bg-blue-500/10 text-blue-600 dark:text-blue-300 border-blue-500/20' :
                tutorMode === 'CHALLENGER' ? 'bg-red-500/10 text-red-600 dark:text-red-300 border-red-500/20' :
                'bg-green-500/10 text-green-600 dark:text-green-300 border-green-500/20'
            }`}>
                {tutorMode === 'SIMPLIFIER' && <><HelpCircle size={14}/> I see you might be confused. I'll explain things simply.</>}
                {tutorMode === 'CHALLENGER' && <><Zap size={14}/> Looking bored? Let's spice this up with a challenge!</>}
                {tutorMode === 'ZEN' && <><Wind size={14}/> I sense stress. We'll take this slow and steady.</>}
            </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] p-4 rounded-xl shadow-sm ${
                msg.role === 'user'
                  ? 'bg-[#0A1A3F] dark:bg-indigo-600 text-white rounded-br-none'
                  : 'bg-white dark:bg-slate-900 text-[#0F172A] dark:text-slate-100 rounded-bl-none border border-[#E2E8F0] dark:border-slate-800'
              }`}
            >
              {/* Text Content */}
              <div className={`prose prose-sm max-w-none leading-relaxed ${msg.role === 'user' ? 'prose-invert' : 'dark:prose-invert'}`}>
                <ReactMarkdown
                    components={{
                        code({node, className, children, ...props}) {
                            const match = /language-(\w+)/.exec(className || '');
                            if (match && match[1] === 'mermaid') {
                                return <MermaidDiagram code={String(children).replace(/\n$/, '')} />;
                            }
                            return (
                                <code className={className} {...props}>
                                    {children}
                                </code>
                            );
                        }
                    }}
                >
                    {msg.text}
                </ReactMarkdown>
              </div>

              {/* Media Content */}
              {msg.imageUrl && (
                <div className="mt-4 rounded-lg overflow-hidden border border-[#E2E8F0] dark:border-slate-700 shadow-md">
                  <img src={msg.imageUrl} alt="Generated Visual" className="w-full h-auto" />
                  <div className="bg-white dark:bg-slate-800 p-2 text-xs text-center text-[#64748B] dark:text-slate-400 border-t border-[#E2E8F0] dark:border-slate-700">AI Generated Visual</div>
                </div>
              )}

              {msg.storyboardUrl && (
                <div className="mt-4 rounded-lg overflow-hidden border border-[#E2E8F0] dark:border-slate-700 shadow-md">
                  <img src={msg.storyboardUrl} alt="Visual Storyboard" className="w-full h-auto" />
                  <div className="bg-white dark:bg-slate-800 p-2 text-xs text-center text-[#64748B] dark:text-slate-400 border-t border-[#E2E8F0] dark:border-slate-700">AI Generated Storyboard (Nano)</div>
                </div>
              )}

              {msg.videoUrl && (
                <div className="mt-4 rounded-lg overflow-hidden border border-[#E2E8F0] dark:border-slate-700 shadow-md relative group">
                  <video controls className="w-full h-auto" src={msg.videoUrl} />
                   <div className="bg-white dark:bg-slate-800 p-2 text-xs text-center text-[#64748B] dark:text-slate-400 border-t border-[#E2E8F0] dark:border-slate-700">AI Generated Lesson (Veo)</div>
                </div>
              )}

              {/* Actions for Model Messages */}
              {msg.role === 'model' && !isLoading && (
                 <div className="mt-3 flex gap-2 flex-wrap">
                     {!msg.videoUrl && (
                         <button 
                            onClick={() => handleGenerateVideoForMessage(msg.id, msg.text.substring(0, 100))}
                            className="flex items-center gap-1 text-xs bg-[#F1F5F9] dark:bg-slate-800 hover:bg-[#E2E8F0] dark:hover:bg-slate-700 px-3 py-1.5 rounded-full transition-colors text-[#0A1A3F] dark:text-slate-200 font-bold border border-[#E2E8F0] dark:border-slate-700"
                         >
                             <Video size={12} /> Watch Video (Veo)
                         </button>
                     )}
                     {!msg.storyboardUrl && (
                         <button 
                            onClick={() => handleGenerateStoryboardForMessage(msg.id, msg.text.substring(0, 100))}
                            className="flex items-center gap-1 text-xs bg-[#F1F5F9] dark:bg-slate-800 hover:bg-[#E2E8F0] dark:hover:bg-slate-700 px-3 py-1.5 rounded-full transition-colors text-[#0A1A3F] dark:text-slate-200 font-bold border border-[#E2E8F0] dark:border-slate-700"
                         >
                             <Layout size={12} /> Visual Storyboard (Nano)
                         </button>
                     )}
                 </div>
              )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white dark:bg-slate-900 px-4 py-3 rounded-xl rounded-bl-none flex items-center space-x-3 border border-[#E2E8F0] dark:border-slate-800 shadow-sm">
              {useDeepReasoning ? <BrainCircuit className="animate-pulse text-indigo-600 dark:text-indigo-400" size={18} /> : <Loader2 className="animate-spin text-[#0A1A3F] dark:text-slate-200" size={18} />}
              <span className="text-sm text-[#475569] dark:text-slate-400">{loadingAction}</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white dark:bg-slate-900 border-t border-[#E2E8F0] dark:border-slate-800 transition-colors">
        <div className={`flex items-center space-x-2 bg-[#F8FAFC] dark:bg-slate-800 p-2 rounded-xl border transition-colors shadow-inner ${useDeepReasoning ? 'border-indigo-300 ring-1 ring-indigo-100 dark:border-indigo-700 dark:ring-indigo-900' : 'border-[#E2E8F0] dark:border-slate-700 focus-within:border-[#0A1A3F] dark:focus-within:border-slate-500'}`}>
          <button
             onClick={clearHistory}
             className="p-2 text-[#64748B] dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
             title="Clear Chat History"
          >
              <Trash2 size={20} />
          </button>
          
          <button
            onClick={() => setShowEmotionCam(!showEmotionCam)}
             className={`p-2 transition-all rounded-lg ${showEmotionCam ? 'text-indigo-600 bg-indigo-50 dark:text-indigo-300 dark:bg-indigo-900/50' : 'text-[#64748B] dark:text-slate-400 hover:text-[#0A1A3F] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700'}`}
             title={showEmotionCam ? "Emotion Adaptive Mode: ON" : "Turn on Emotion Adaptive Mode"}
          >
              <Eye size={20} />
          </button>

          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder={useDeepReasoning ? "Ask a complex question for deep reasoning..." : "Ask Elevate anything..."}
            className="flex-1 bg-transparent border-none outline-none text-[#0F172A] dark:text-white px-4 py-2 placeholder-[#94A3B8] dark:placeholder-slate-500"
            disabled={isLoading}
          />
          <button
             onClick={() => setUseDeepReasoning(!useDeepReasoning)}
             className={`p-2 transition-all rounded-lg ${useDeepReasoning ? 'text-indigo-600 bg-indigo-50 dark:text-indigo-300 dark:bg-indigo-900/50' : 'text-[#64748B] dark:text-slate-400 hover:text-[#0A1A3F] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700'}`}
             title={useDeepReasoning ? "Deep Thinking Mode: ON" : "Turn on Deep Thinking Mode"}
          >
              <BrainCircuit size={20} />
          </button>
          <button
             onClick={() => setShowVoiceMode(true)}
             className="p-2 text-[#64748B] dark:text-slate-400 hover:text-[#0A1A3F] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
             title="Start Voice Tutor"
          >
              <Mic size={20} />
          </button>
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className={`p-3 rounded-lg text-white transition-all shadow-md ${useDeepReasoning ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-[#0A1A3F] dark:bg-indigo-600 hover:bg-[#1E3A8A] dark:hover:bg-indigo-700 disabled:bg-[#CBD5E1] dark:disabled:bg-slate-700'}`}
          >
            <Send size={18} />
          </button>
        </div>
         <div className="text-xs text-[#64748B] dark:text-slate-500 mt-2 text-center flex justify-center gap-4">
            <span className="flex items-center gap-1"><Eye size={10} className={showEmotionCam ? "text-indigo-500" : ""}/> {showEmotionCam ? "Adaptive Mode Active" : "Adaptive Mode Off"}</span>
            <span className="flex items-center gap-1"><BrainCircuit size={10} className={useDeepReasoning ? "text-indigo-500 dark:text-indigo-400" : ""}/> {useDeepReasoning ? "Reasoning Mode Enabled" : "Reasoning Mode Off"}</span>
            <span className="flex items-center gap-1"><Box size={10}/> 3D Concepts</span>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;