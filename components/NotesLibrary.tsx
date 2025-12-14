
import React, { useState, useEffect, useRef } from 'react';
import { 
    Search, Plus, FileText, Image as ImageIcon, Video, MoreVertical, 
    Upload, Download, Trash2, Edit2, FolderInput,
    ArrowLeft, Brain, Layers, StickyNote, PlayCircle, Loader2, Sparkles, ZoomIn, ZoomOut, ExternalLink, Maximize2, RefreshCw
} from 'lucide-react';
import { LibraryFile, SmartNotes } from '../types';
import { api } from '../services/api.client';
import ReactMarkdown from 'react-markdown';
import * as pdfjsLib from "pdfjs-dist";

// Safe PDF import
const pdfjs = (pdfjsLib as any).default || pdfjsLib;

// --- SUB-COMPONENT: PDF RENDERER ---
const PdfRenderer: React.FC<{ url: string; fileName: string }> = ({ url, fileName }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [pdfDoc, setPdfDoc] = useState<any>(null);
    const [pageNum, setPageNum] = useState(1);
    const [scale, setScale] = useState(1.0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [isRendering, setIsRendering] = useState(false);

    useEffect(() => {
        const loadPdf = async () => {
            try {
                setLoading(true);
                setError(false);
                const loadingTask = pdfjs.getDocument(url);
                const pdf = await loadingTask.promise;
                setPdfDoc(pdf);
                setLoading(false);
                // Initial Fit
                setTimeout(fitToWidth, 100);
            } catch (e) {
                console.error("PDF Load Error:", e);
                setError(true);
                setLoading(false);
            }
        };
        loadPdf();
    }, [url]);

    useEffect(() => {
        if (!pdfDoc) return;
        renderPage(pageNum);
    }, [pdfDoc, pageNum, scale]);

    useEffect(() => {
        const handleResize = () => {
            // Optional: Auto-refit on resize if desired, or just let user click button
            // fitToWidth();
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [pdfDoc]);

    const fitToWidth = async () => {
        if (!pdfDoc || !containerRef.current) return;
        try {
            const page = await pdfDoc.getPage(pageNum);
            const viewport = page.getViewport({ scale: 1.0 });
            const availableWidth = containerRef.current.clientWidth - 40; // padding
            const newScale = availableWidth / viewport.width;
            setScale(Math.min(newScale, 2.0)); // Cap max auto-scale
        } catch (e) {
            console.error(e);
        }
    };

    const renderPage = async (num: number) => {
        if (isRendering || !canvasRef.current || !pdfDoc) return;
        setIsRendering(true);
        try {
            const page = await pdfDoc.getPage(num);
            const viewport = page.getViewport({ scale });
            const canvas = canvasRef.current;
            const context = canvas.getContext('2d');
            
            canvas.height = viewport.height;
            canvas.width = viewport.width;

            const renderContext = {
                canvasContext: context!,
                viewport: viewport,
            };
            await page.render(renderContext).promise;
        } catch (e) {
            console.error("Page Render Error:", e);
        } finally {
            setIsRendering(false);
        }
    };

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center space-y-4">
                <FileText size={48} className="text-slate-300" />
                <div>
                    <p className="text-red-500 font-medium">Preview unavailable</p>
                    <p className="text-sm text-slate-500 mb-4">The PDF could not be rendered inline.</p>
                    <a 
                        href={url} 
                        target="_blank" 
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 bg-[#0A1A3F] dark:bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:opacity-90 transition-opacity"
                    >
                        <ExternalLink size={16} /> Open {fileName} in New Tab
                    </a>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col w-full h-full bg-slate-100 dark:bg-slate-950 overflow-hidden relative">
            {/* Toolbar */}
            <div className="flex items-center justify-center gap-2 bg-white dark:bg-slate-900 p-2 shadow-sm border-b border-slate-200 dark:border-slate-800 z-10 shrink-0">
                <button onClick={() => setPageNum(p => Math.max(1, p - 1))} disabled={pageNum <= 1} className="px-2 py-1 bg-slate-50 dark:bg-slate-800 rounded hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 text-xs font-bold border dark:border-slate-700">Prev</button>
                <span className="text-xs font-mono text-slate-600 dark:text-slate-300 w-20 text-center">Page {pageNum} / {pdfDoc?.numPages || '-'}</span>
                <button onClick={() => setPageNum(p => Math.min(pdfDoc?.numPages || 1, p + 1))} disabled={pageNum >= (pdfDoc?.numPages || 1)} className="px-2 py-1 bg-slate-50 dark:bg-slate-800 rounded hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 text-xs font-bold border dark:border-slate-700">Next</button>
                
                <div className="w-px h-5 bg-slate-300 dark:bg-slate-700 mx-2"></div>
                
                <button onClick={() => setScale(s => Math.max(0.5, s - 0.2))} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded"><ZoomOut size={16}/></button>
                <span className="text-xs w-10 text-center">{Math.round(scale * 100)}%</span>
                <button onClick={() => setScale(s => Math.min(3.0, s + 0.2))} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded"><ZoomIn size={16}/></button>
                <button onClick={fitToWidth} className="px-2 py-1 text-xs bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded ml-2 font-medium flex items-center gap-1"><Maximize2 size={12}/> Fit Width</button>
                <button onClick={() => setScale(1.0)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-500" title="Reset Zoom"><RefreshCw size={14}/></button>
            </div>
            
            {/* Canvas Container */}
            <div 
                ref={containerRef}
                className="flex-1 overflow-auto w-full flex justify-center bg-slate-200/50 dark:bg-black/20 p-4"
            >
                {loading ? <Loader2 className="animate-spin text-slate-500 mt-20" size={40} /> : (
                    <div className="relative h-fit">
                         <canvas 
                            ref={canvasRef} 
                            className="shadow-2xl bg-white rounded-lg transition-transform duration-200 ease-out origin-top"
                         />
                    </div>
                )}
            </div>
        </div>
    );
};

// --- FILE VIEWER ---
const FileViewer: React.FC<{ file: LibraryFile; onClose: () => void }> = ({ file, onClose }) => {
    const [activeTab, setActiveTab] = useState<'overview' | 'notes' | 'flashcards'>('overview');
    const [smartContent, setSmartContent] = useState<SmartNotes | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const loadAIContent = async () => {
            if (file.type === 'PDF' && !smartContent) {
                setLoading(true);
                try {
                    const cached = await (api as any).getFileSmartContent(file.id);
                    if (cached) {
                        setSmartContent(cached);
                    } else {
                        setSmartContent({
                            summary: "Analysis not available for this session.",
                            mindMapMarkdown: "No content available.",
                            flashcards: []
                        });
                    }
                } catch (e) { console.error(e); } finally { setLoading(false); }
            }
        };
        loadAIContent();
    }, [file]);

    return (
        <div className="fixed inset-0 z-50 bg-white dark:bg-slate-950 flex flex-col animate-slide-up">
            <div className="h-16 border-b border-[#E2E8F0] dark:border-slate-800 flex items-center justify-between px-6 bg-white dark:bg-slate-900 shadow-sm shrink-0">
                <div className="flex items-center gap-4">
                    <button onClick={onClose} className="p-2 hover:bg-[#F1F5F9] dark:hover:bg-slate-800 rounded-full transition-colors">
                        <ArrowLeft size={20} className="text-[#64748B] dark:text-slate-400"/>
                    </button>
                    <div>
                        <h2 className="font-bold text-[#0F172A] dark:text-white truncate max-w-md">{file.name}</h2>
                        <p className="text-xs text-[#64748B] dark:text-slate-500 flex items-center gap-2">
                             <span className="uppercase">{file.type}</span> • {file.size}
                        </p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <a href={file.url} download={file.name} className="p-2 text-[#64748B] hover:text-[#0A1A3F] dark:text-slate-400 dark:hover:text-white transition-colors" title="Download">
                        <Download size={20}/>
                    </a>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                <div className="flex-1 bg-[#F1F5F9] dark:bg-black/50 overflow-hidden flex flex-col relative">
                    {file.type === 'IMAGE' ? (
                        <div className="w-full h-full p-4 overflow-auto flex items-center justify-center">
                            <img src={file.url} alt="Preview" className="max-w-full max-h-full object-contain rounded-lg shadow-lg bg-black"/>
                        </div>
                    ) : file.type === 'VIDEO' ? (
                        <div className="w-full h-full flex items-center justify-center bg-black">
                            <video src={file.url} controls className="max-w-full max-h-full"/>
                        </div>
                    ) : (
                        <PdfRenderer url={file.url} fileName={file.name} />
                    )}
                </div>

                <div className="w-96 bg-white dark:bg-slate-900 border-l border-[#E2E8F0] dark:border-slate-800 flex flex-col shadow-xl z-20">
                    <div className="flex border-b border-[#E2E8F0] dark:border-slate-800">
                        {['overview', 'notes', 'flashcards'].map((tab) => (
                            <button 
                                key={tab}
                                onClick={() => setActiveTab(tab as any)}
                                className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors capitalize ${activeTab === tab ? 'border-[#0A1A3F] dark:border-indigo-500 text-[#0A1A3F] dark:text-indigo-400' : 'border-transparent text-[#64748B] dark:text-slate-500'}`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>

                    <div className="flex-1 overflow-y-auto p-6">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center h-full text-[#64748B] gap-3">
                                <Brain size={32} className="animate-pulse text-[#0A1A3F] dark:text-indigo-500"/>
                                <p className="text-sm font-medium">Generating Insights...</p>
                            </div>
                        ) : !smartContent ? (
                            <div className="text-center mt-10 text-[#64748B] space-y-4">
                                <Sparkles size={32} className="mx-auto text-amber-400"/>
                                <p>Content analysis unavailable.</p>
                            </div>
                        ) : (
                            <>
                                {activeTab === 'overview' && (
                                    <div className="space-y-4 animate-fade-in">
                                        <div className="bg-[#F8FAFC] dark:bg-slate-800 p-4 rounded-lg border border-slate-100 dark:border-slate-700">
                                            <h4 className="text-xs font-bold uppercase text-[#64748B] mb-2 flex items-center gap-2"><Layers size={12}/> AI Summary</h4>
                                            <p className="text-sm text-[#0F172A] dark:text-slate-200 leading-relaxed">{smartContent.summary}</p>
                                        </div>
                                    </div>
                                )}
                                {activeTab === 'notes' && (
                                    <div className="prose prose-sm dark:prose-invert animate-fade-in">
                                        <ReactMarkdown>{smartContent.mindMapMarkdown}</ReactMarkdown>
                                    </div>
                                )}
                                {activeTab === 'flashcards' && (
                                    <div className="space-y-4 animate-fade-in">
                                        {smartContent.flashcards.map((card, i) => (
                                            <div key={i} className="border border-[#E2E8F0] dark:border-slate-800 rounded-lg p-4 shadow-sm hover:shadow-md transition-all">
                                                <div className="mb-2 pb-2 border-b border-dashed border-[#E2E8F0] dark:border-slate-800">
                                                    <span className="text-[10px] font-bold text-[#94A3B8] uppercase">Q</span>
                                                    <p className="font-bold text-[#0F172A] dark:text-white text-sm">{card.front}</p>
                                                </div>
                                                <div>
                                                    <span className="text-[10px] font-bold text-[#94A3B8] uppercase">A</span>
                                                    <p className="text-[#475569] dark:text-slate-300 text-sm">{card.back}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- MAIN LIBRARY ---
const NotesLibrary: React.FC = () => {
    const [files, setFiles] = useState<LibraryFile[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedFilter, setSelectedFilter] = useState<'ALL' | 'PDF' | 'IMAGE' | 'VIDEO'>('ALL');
    const [isFabOpen, setIsFabOpen] = useState(false);
    const [selectedFile, setSelectedFile] = useState<LibraryFile | null>(null);

    useEffect(() => {
        loadLibrary();
        const interval = setInterval(() => {
            if (files.some(f => f.status === 'uploading' || f.status === 'processing')) {
                loadLibrary();
            }
        }, 1000);
        return () => clearInterval(interval);
    }, [files.length]);

    const loadLibrary = async () => {
        const f = await api.getLibraryFiles();
        if (JSON.stringify(f) !== JSON.stringify(files)) {
            setFiles(f);
        }
        setLoading(false);
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            for (let i = 0; i < e.target.files.length; i++) {
                await api.uploadLibraryFile(e.target.files[i]);
            }
            loadLibrary();
            setIsFabOpen(false);
        }
    };

    const handleDelete = async (id: string) => {
        if(confirm("Delete this file?")) {
            await api.deleteLibraryFile(id);
            loadLibrary();
        }
    };

    const handleRename = async (id: string, newName: string) => {
        await api.renameLibraryFile(id, newName);
        loadLibrary();
    };

    const filteredFiles = files.filter(f => {
        const matchesSearch = f.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesType = selectedFilter === 'ALL' || f.type === selectedFilter;
        return matchesSearch && matchesType;
    });

    if (selectedFile) {
        return <FileViewer file={selectedFile} onClose={() => setSelectedFile(null)} />;
    }

    return (
        <div className="h-full flex flex-col relative animate-fade-in p-6">
            <div className="mb-6 space-y-4">
                <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
                        <h2 className="text-2xl font-bold text-[#0F172A] dark:text-white flex items-center gap-2">
                            <Layers className="text-[#0A1A3F] dark:text-indigo-400"/> Library
                        </h2>
                    <div className="relative flex-1 max-w-lg w-full">
                        <Search className="absolute left-3 top-3 text-[#94A3B8]" size={18}/>
                        <input 
                            type="text" 
                            placeholder="Search files..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 rounded-xl outline-none focus:border-[#0A1A3F] dark:focus:border-indigo-500 transition-colors shadow-sm"
                        />
                    </div>
                </div>
                
                {files.length > 0 && (
                    <div className="flex gap-2 overflow-x-auto pb-1">
                        {['ALL', 'PDF', 'IMAGE', 'VIDEO'].map(f => (
                            <button
                                key={f}
                                onClick={() => setSelectedFilter(f as any)}
                                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                                    selectedFilter === f 
                                    ? 'bg-[#0A1A3F] dark:bg-indigo-600 text-white shadow-md' 
                                    : 'bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-700 text-[#64748B] hover:bg-[#F1F5F9]'
                                }`}
                            >
                                {f === 'ALL' ? 'All Files' : f + 's'}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            <div className="flex-1 overflow-y-auto pb-20 pr-2">
                {!loading && files.length === 0 && (
                     <div className="h-full flex flex-col items-center justify-center p-8 animate-fade-in">
                         <div className="max-w-md w-full text-center space-y-6">
                             <div className="w-24 h-24 bg-indigo-50 dark:bg-indigo-900/20 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce-slow">
                                 <Upload size={40} className="text-indigo-600 dark:text-indigo-400"/>
                             </div>
                             <div>
                                <h2 className="text-2xl font-bold text-[#0F172A] dark:text-white mb-2">Upload your files</h2>
                                <p className="text-[#64748B] dark:text-slate-400">Upload your files to get notes, summaries, flashcards, and insights.</p>
                             </div>
                             
                             <div className="border-2 border-dashed border-[#CBD5E1] dark:border-slate-700 rounded-2xl p-10 transition-colors hover:border-indigo-500 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10 cursor-pointer relative group">
                                 <input 
                                    type="file" 
                                    multiple 
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    onChange={handleFileUpload}
                                 />
                                 <div className="pointer-events-none group-hover:scale-105 transition-transform">
                                     <p className="font-bold text-[#0F172A] dark:text-white mb-1">Click to upload or drag & drop</p>
                                     <p className="text-xs text-[#94A3B8]">PDF, Docs, Images, Videos</p>
                                 </div>
                             </div>
                         </div>
                     </div>
                )}

                {files.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                        {filteredFiles.map(file => (
                            <FileCard 
                                key={file.id} 
                                file={file} 
                                onOpen={() => file.status === 'ready' && setSelectedFile(file)}
                                onDelete={() => handleDelete(file.id)}
                                onRename={(name) => handleRename(file.id, name)}
                            />
                        ))}
                    </div>
                )}
            </div>

            <div className="absolute bottom-8 right-8 z-30 flex flex-col items-end gap-3 pointer-events-none">
                {isFabOpen && (
                    <div className="flex flex-col items-end gap-3 pointer-events-auto animate-slide-up-fade">
                            <label className="flex items-center gap-3 cursor-pointer group">
                                <span className="bg-[#0A1A3F] dark:bg-slate-800 text-white text-xs px-2 py-1 rounded shadow-md opacity-0 group-hover:opacity-100 transition-opacity">Upload PDF</span>
                                <div className="w-10 h-10 rounded-full bg-red-500 text-white flex items-center justify-center shadow-lg hover:scale-110 transition-transform">
                                    <FileText size={18}/>
                                </div>
                                <input type="file" multiple accept="application/pdf" className="hidden" onChange={handleFileUpload}/>
                            </label>
                            <label className="flex items-center gap-3 cursor-pointer group">
                                <span className="bg-[#0A1A3F] dark:bg-slate-800 text-white text-xs px-2 py-1 rounded shadow-md opacity-0 group-hover:opacity-100 transition-opacity">Upload Image</span>
                                <div className="w-10 h-10 rounded-full bg-purple-500 text-white flex items-center justify-center shadow-lg hover:scale-110 transition-transform">
                                    <ImageIcon size={18}/>
                                </div>
                                <input type="file" multiple accept="image/*" className="hidden" onChange={handleFileUpload}/>
                            </label>
                            <label className="flex items-center gap-3 cursor-pointer group">
                                <span className="bg-[#0A1A3F] dark:bg-slate-800 text-white text-xs px-2 py-1 rounded shadow-md opacity-0 group-hover:opacity-100 transition-opacity">Upload Video</span>
                                <div className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg hover:scale-110 transition-transform">
                                    <Video size={18}/>
                                </div>
                                <input type="file" multiple accept="video/*" className="hidden" onChange={handleFileUpload}/>
                            </label>
                    </div>
                )}
                <button 
                    onClick={() => setIsFabOpen(!isFabOpen)}
                    className={`pointer-events-auto w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 ${isFabOpen ? 'bg-red-500 rotate-45' : 'bg-[#0A1A3F] dark:bg-indigo-600 hover:scale-110'}`}
                >
                    <Plus size={28} className="text-white"/>
                </button>
            </div>
        </div>
    );
};

// Simplified FileCard for brevity, assuming it was mostly styling
const FileCard: React.FC<{ file: LibraryFile; onOpen: () => void; onDelete: () => void; onRename: (name: string) => void }> = ({ file, onOpen, onDelete, onRename }) => {
    const [showMenu, setShowMenu] = useState(false);
    return (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-[#E2E8F0] dark:border-slate-800 shadow-sm hover:shadow-md transition-all group relative flex flex-col overflow-hidden">
            <div onClick={onOpen} className="aspect-[4/3] bg-slate-100 dark:bg-slate-800 cursor-pointer overflow-hidden border-b border-[#E2E8F0] dark:border-slate-800 relative">
                {file.type === 'IMAGE' ? <img src={file.url} className="w-full h-full object-cover"/> : file.type === 'VIDEO' ? (
                     <div className="w-full h-full flex items-center justify-center bg-black">
                        <Video size={32} className="text-white"/>
                     </div>
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400"><FileText size={32}/></div>
                )}
            </div>
            <div className="p-3 flex justify-between items-start">
                <div className="min-w-0">
                    <h4 className="font-bold text-sm truncate dark:text-white" title={file.name}>{file.name}</h4>
                    <p className="text-[10px] text-slate-500">{file.size}</p>
                </div>
                <button onClick={() => setShowMenu(!showMenu)}><MoreVertical size={16} className="text-slate-400"/></button>
                {showMenu && (
                    <div className="absolute right-2 bottom-10 bg-white dark:bg-slate-800 shadow-xl rounded-lg p-1 z-20 border dark:border-slate-700 min-w-[100px]">
                        <button onClick={() => {onDelete(); setShowMenu(false)}} className="flex items-center gap-2 text-red-500 text-xs p-2 hover:bg-slate-100 dark:hover:bg-slate-700 w-full rounded"><Trash2 size={12}/> Delete</button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default NotesLibrary;
