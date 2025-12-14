import React, { useEffect, useRef, useState } from 'react';
import { Mic, MicOff, X, Volume2, Loader2, AlertCircle } from 'lucide-react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';

interface VoiceTutorProps {
    onClose: () => void;
}

const VoiceTutor: React.FC<VoiceTutorProps> = ({ onClose }) => {
    const [isConnected, setIsConnected] = useState(false);
    const [status, setStatus] = useState("Initializing...");
    const [isMuted, setIsMuted] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    
    // Audio Contexts
    const inputAudioContextRef = useRef<AudioContext | null>(null);
    const outputAudioContextRef = useRef<AudioContext | null>(null);
    
    // Stream References
    const inputSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const processorRef = useRef<ScriptProcessorNode | null>(null);
    
    // Audio Queue Management for Gapless Playback
    const nextStartTimeRef = useRef<number>(0);
    const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

    // Clean up flag
    const isMountedRef = useRef(true);

    useEffect(() => {
        isMountedRef.current = true;
        connectToLiveAPI();
        return () => {
            isMountedRef.current = false;
            disconnect();
        };
    }, []);

    const disconnect = () => {
        // Cleanup Audio Nodes
        if (inputSourceRef.current) {
            inputSourceRef.current.disconnect();
            inputSourceRef.current = null;
        }
        if (processorRef.current) {
            processorRef.current.disconnect();
            processorRef.current = null;
        }
        
        // Stop all playing sources
        sourcesRef.current.forEach(source => {
            try { source.stop(); } catch (e) {}
        });
        sourcesRef.current.clear();

        // Close Contexts
        if (inputAudioContextRef.current?.state !== 'closed') {
            inputAudioContextRef.current?.close();
        }
        if (outputAudioContextRef.current?.state !== 'closed') {
            outputAudioContextRef.current?.close();
        }
    };

    const connectToLiveAPI = async () => {
        try {
            // 1. Validate / Request API Key if in AI Studio environment
            if ((window as any).aistudio && (window as any).aistudio.hasSelectedApiKey) {
                const hasKey = await (window as any).aistudio.hasSelectedApiKey();
                if (!hasKey) {
                    setStatus("Waiting for API Key...");
                    await (window as any).aistudio.openSelectKey();
                }
            }

            if (!isMountedRef.current) return;

            const apiKey = process.env.API_KEY;
            if (!apiKey) {
                throw new Error("API Key not found in environment.");
            }

            const ai = new GoogleGenAI({ apiKey });
            
            // Initialize Contexts
            // Input: 16kHz for Speech Recognition optimization
            inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
            // Output: 24kHz for high quality Gemini Voice
            outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            
            const sessionPromise = ai.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                config: {
                    responseModalities: [Modality.AUDIO],
                    speechConfig: {
                        voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
                    },
                    systemInstruction: 'You are Elevate, a professional and helpful AI learning assistant. Keep your responses concise, encouraging, and conversational. Help the student with their academic questions.',
                },
                callbacks: {
                    onopen: async () => {
                        if (!isMountedRef.current) return;
                        setIsConnected(true);
                        setStatus("Listening...");
                        setErrorMsg(null);
                        
                        if (!inputAudioContextRef.current) return;
                        
                        // Ensure context is running
                        if (inputAudioContextRef.current.state === 'suspended') {
                            await inputAudioContextRef.current.resume();
                        }

                        // Setup Input Stream
                        const source = inputAudioContextRef.current.createMediaStreamSource(stream);
                        inputSourceRef.current = source;
                        
                        const processor = inputAudioContextRef.current.createScriptProcessor(4096, 1, 1);
                        processorRef.current = processor;
                        
                        processor.onaudioprocess = (e) => {
                            if (isMuted) return;
                            const inputData = e.inputBuffer.getChannelData(0);
                            
                            // Convert to PCM 16-bit
                            const pcmBlob = createBlob(inputData);
                            
                            // Send to model
                            sessionPromise.then(session => {
                                session.sendRealtimeInput({ media: pcmBlob });
                            });
                        };
                        
                        source.connect(processor);
                        processor.connect(inputAudioContextRef.current.destination);
                    },
                    onmessage: async (msg: LiveServerMessage) => {
                        if (!isMountedRef.current) return;
                        // Handle Audio Output
                        const base64Audio = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
                        if (base64Audio) {
                            await queueAudio(base64Audio);
                        }
                        
                        // Handle Interruption (User spoke while model was speaking)
                        const interrupted = msg.serverContent?.interrupted;
                        if (interrupted) {
                            sourcesRef.current.forEach(source => {
                                try { source.stop(); } catch (e) {}
                            });
                            sourcesRef.current.clear();
                            nextStartTimeRef.current = 0;
                        }
                    },
                    onclose: () => {
                        if (!isMountedRef.current) return;
                        setStatus("Disconnected");
                        setIsConnected(false);
                    },
                    onerror: (e) => {
                        console.error("Live API Error:", e);
                        if (!isMountedRef.current) return;
                        setStatus("Connection Error");
                        setErrorMsg("Network error. Please check API key and permissions.");
                    }
                }
            });

        } catch (e: any) {
            console.error(e);
            if (!isMountedRef.current) return;
            setStatus("Error");
            setErrorMsg(e.message || "Failed to initialize voice session.");
        }
    };
    
    const queueAudio = async (base64: string) => {
        if (!outputAudioContextRef.current) return;
        
        const ctx = outputAudioContextRef.current;
        const arrayBuffer = base64ToArrayBuffer(base64);
        const audioBuffer = await decodeAudioData(arrayBuffer, ctx);
        
        const source = ctx.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(ctx.destination);
        
        // Schedule playback
        // Ensure we don't schedule in the past
        const currentTime = ctx.currentTime;
        if (nextStartTimeRef.current < currentTime) {
            nextStartTimeRef.current = currentTime;
        }
        
        source.start(nextStartTimeRef.current);
        nextStartTimeRef.current += audioBuffer.duration;
        
        sourcesRef.current.add(source);
        source.onended = () => {
            sourcesRef.current.delete(source);
        };
    };

    // --- Helpers ---

    function createBlob(data: Float32Array): { data: string; mimeType: string } {
        const l = data.length;
        const int16 = new Int16Array(l);
        for (let i = 0; i < l; i++) {
            // Scale float32 (-1.0 to 1.0) to int16 (-32768 to 32767)
            int16[i] = data[i] * 32768;
        }
        return {
            data: arrayBufferToBase64(int16.buffer),
            mimeType: 'audio/pcm;rate=16000',
        };
    }

    function arrayBufferToBase64(buffer: ArrayBuffer): string {
        let binary = '';
        const bytes = new Uint8Array(buffer);
        const len = bytes.byteLength;
        for (let i = 0; i < len; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
    }

    function base64ToArrayBuffer(base64: string): Uint8Array {
        const binaryString = atob(base64);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes;
    }

    async function decodeAudioData(data: Uint8Array, ctx: AudioContext): Promise<AudioBuffer> {
        // Live API returns raw PCM 16-bit, 24kHz, 1 channel (little-endian)
        const dataInt16 = new Int16Array(data.buffer);
        const frameCount = dataInt16.length; 
        const buffer = ctx.createBuffer(1, frameCount, 24000);
        const channelData = buffer.getChannelData(0);
        
        for (let i = 0; i < frameCount; i++) {
            channelData[i] = dataInt16[i] / 32768.0;
        }
        return buffer;
    }

    return (
        <div className="fixed inset-0 bg-[#0F172A]/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white border border-[#E2E8F0] w-full max-w-md rounded-2xl p-8 flex flex-col items-center relative shadow-2xl">
                <button 
                    onClick={onClose}
                    className="absolute top-4 right-4 text-[#94A3B8] hover:text-[#0F172A] transition-colors"
                >
                    <X size={24} />
                </button>
                
                <div className={`w-32 h-32 rounded-full flex items-center justify-center mb-8 transition-all duration-500 ${isConnected ? 'bg-[#0A1A3F]/10 shadow-[0_0_50px_rgba(10,26,63,0.3)]' : errorMsg ? 'bg-red-50' : 'bg-[#F1F5F9]'}`}>
                    {isConnected ? (
                        <div className="relative">
                           <Volume2 size={48} className="text-[#0A1A3F] animate-pulse" />
                           <div className="absolute inset-0 border-4 border-[#0A1A3F]/30 rounded-full animate-ping opacity-20"></div>
                           <div className="absolute -inset-4 border border-[#0A1A3F]/10 rounded-full animate-pulse delay-75"></div>
                        </div>
                    ) : errorMsg ? (
                        <AlertCircle size={48} className="text-red-500" />
                    ) : (
                        <Loader2 size={48} className="text-[#94A3B8] animate-spin" />
                    )}
                </div>
                
                <h2 className="text-2xl font-bold text-[#0F172A] mb-2">Voice Tutor Mode</h2>
                <p className={`text-sm mb-4 font-medium text-center ${isConnected ? 'text-[#10B981]' : errorMsg ? 'text-red-500' : 'text-[#64748B]'}`}>
                    {errorMsg || status}
                </p>

                {errorMsg && (
                    <button 
                        onClick={() => { setErrorMsg(null); setStatus("Retrying..."); connectToLiveAPI(); }}
                        className="mb-6 px-4 py-2 text-xs font-bold text-[#0A1A3F] bg-[#F1F5F9] rounded-full hover:bg-[#E2E8F0]"
                    >
                        Retry Connection
                    </button>
                )}
                
                <div className="flex gap-4">
                    <button 
                        onClick={() => setIsMuted(!isMuted)}
                        disabled={!isConnected}
                        className={`p-4 rounded-full transition-colors ${isMuted ? 'bg-[#EF4444]/10 text-[#EF4444] hover:bg-[#EF4444]/20' : 'bg-[#F1F5F9] text-[#0F172A] hover:bg-[#E2E8F0] disabled:opacity-50'}`}
                    >
                        {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
                    </button>
                    <button 
                        onClick={onClose}
                        className="bg-[#0A1A3F] hover:bg-[#1E3A8A] text-white px-8 py-3 rounded-full font-medium shadow-lg shadow-[#0A1A3F]/20 transition-all"
                    >
                        End Session
                    </button>
                </div>
                
                <div className="mt-8 text-xs text-[#94A3B8] text-center max-w-xs">
                    Speak naturally. Elevate is listening and will respond via audio.
                </div>
            </div>
        </div>
    );
};

export default VoiceTutor;