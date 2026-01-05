
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { analyzeResume } from './services/geminiService';
import { AppState, AnalysisResult } from './types';
import Dashboard from './components/Dashboard';
import * as mammoth from 'mammoth';
import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://esm.sh/pdfjs-dist@4.0.379/build/pdf.worker.min.mjs`;

const STEPS = [
  { id: 'ingest', label: "Neural Ingestion", sub: "Acquiring Career Stream", icon: (props: any) => <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg> },
  { id: 'parse', label: "Structural Parsing", sub: "Decoding Semantic Nodes", icon: (props: any) => <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"/></svg> },
  { id: 'align', label: "Semantic Logic", sub: "Mapping Latent Wisdom", icon: (props: any) => <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/></svg> },
  { id: 'benchmark', label: "Market Resonance", sub: "Calibrating Benchmark Fit", icon: (props: any) => <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg> },
  { id: 'synthesize', label: "Intelligence Sync", sub: "Finalizing Insight Matrix", icon: (props: any) => <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-7.714 2.143L11 21l-2.286-6.857L1 12l7.714-2.143L11 3z"/></svg> }
];

const EXTRACTION_STEPS = {
  STARTING: "Acquiring file stream...",
  PDF_LOADING: "Decoding PDF structure...",
  PDF_PAGES: "Parsing page {current} of {total}...",
  DOCX_PARSING: "Unpacking XML schemas...",
  CLEANING: "Sanitizing textual content...",
  SUCCESS: "Stream read successful!"
};

type ErrorCategory = 'fileType' | 'extraction' | 'analysis' | 'validation' | null;

const ResuMasterLogo: React.FC<{ className?: string }> = ({ className = "w-10 h-10" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="logo-hex-grad-v2" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#4f46e5" />
        <stop offset="100%" stopColor="#9333ea" />
      </linearGradient>
      <filter id="logo-glow-soft" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="1.2" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
    </defs>
    <path 
      d="M12 2L21 7.2V16.8L12 22L3 16.8V7.2L12 2Z" 
      stroke="currentColor" 
      strokeWidth="1.5" 
      strokeLinejoin="round" 
    />
    <path 
      d="M12 6L15.5 10.5H12L15.5 15L12 18L8.5 15L12 10.5H8.5L12 6Z" 
      fill="url(#logo-hex-grad-v2)" 
      filter="url(#logo-glow-soft)"
    />
    <motion.circle 
      cx="12" cy="3.5" r="1.2" fill="#4f46e5"
      animate={{ opacity: [0.4, 1, 0.4], scale: [0.9, 1.3, 0.9] }}
      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
    />
    <motion.circle 
      cx="20.5" cy="17" r="1" fill="#9333ea"
      animate={{ opacity: [0.4, 1, 0.4], scale: [0.9, 1.3, 0.9] }}
      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 1 }}
    />
  </svg>
);

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    resumeText: '',
    rawResumeText: '',
    jobDescription: '',
    isAnalyzing: false,
    analysisStep: STEPS[0].label,
    result: null,
    error: null,
  });

  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('resuMasterTheme');
      return saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });

  const [errorCategory, setErrorCategory] = useState<ErrorCategory>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionStep, setExtractionStep] = useState<string>("");
  const [showRefineTools, setShowRefineTools] = useState(false);
  const [showRawPreview, setShowRawPreview] = useState(false);
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [refineOptions, setRefineOptions] = useState({
    normalizeSpacing: true,
    removeSpecialChars: false,
    stripUnwantedFormatting: true,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('resuMasterTheme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('resuMasterTheme', 'light');
    }
  }, [darkMode]);

  useEffect(() => {
    let interval: any;
    if (state.isAnalyzing) {
      setActiveStepIndex(0);
      interval = setInterval(() => {
        setActiveStepIndex(prev => {
          if (prev < STEPS.length - 1) return prev + 1;
          return prev;
        });
      }, 2500); 
    }
    return () => clearInterval(interval);
  }, [state.isAnalyzing]);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    await processFile(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const sanitizeText = (text: string): string => {
    return text
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, '')
      .replace(/\r\n/g, '\n')
      .replace(/[ \t]+/g, ' ')
      .trim();
  };

  const extractTextFromPdf = async (arrayBuffer: ArrayBuffer): Promise<string> => {
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    let fullText = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      setExtractionStep(EXTRACTION_STEPS.PDF_PAGES.replace('{current}', i.toString()).replace('{total}', pdf.numPages.toString()));
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const items = textContent.items as any[];
      if (items.length === 0) continue;
      const lines: { [key: number]: any[] } = {};
      items.forEach(item => {
        const y = Math.round(item.transform[5]);
        if (!lines[y]) lines[y] = [];
        lines[y].push(item);
      });
      const sortedY = Object.keys(lines).map(Number).sort((a, b) => b - a);
      let pageText = '';
      sortedY.forEach(y => {
        const lineItems = lines[y].sort((a, b) => a.transform[4] - b.transform[4]);
        const lineText = lineItems.map(item => item.str).join(' ');
        pageText += lineText + '\n';
      });
      fullText += pageText + '\n';
    }
    return fullText;
  };

  const processFile = async (file: File) => {
    setIsExtracting(true);
    setExtractionStep(EXTRACTION_STEPS.STARTING);
    setUploadedFileName(file.name);
    setState(prev => ({ ...prev, error: null }));
    setErrorCategory(null);
    try {
      let extractedText = '';
      if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        setExtractionStep(EXTRACTION_STEPS.DOCX_PARSING);
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        extractedText = result.value;
      } else if (file.type === 'application/pdf') {
        setExtractionStep(EXTRACTION_STEPS.PDF_LOADING);
        const arrayBuffer = await file.arrayBuffer();
        extractedText = await extractTextFromPdf(arrayBuffer);
      } else if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
        extractedText = await file.text();
      } else {
        setErrorCategory('fileType');
        throw new Error(`Incompatible Media: "${file.name.split('.').pop()}" is not a recognized profile format.`);
      }
      setExtractionStep(EXTRACTION_STEPS.CLEANING);
      const cleanedText = sanitizeText(extractedText);
      if (!cleanedText) {
        setErrorCategory('extraction');
        throw new Error('Data Void: The provided file contains no interpretable text structure.');
      }
      setState(prev => ({ ...prev, resumeText: cleanedText, rawResumeText: cleanedText }));
      setExtractionStep(EXTRACTION_STEPS.SUCCESS);
      setShowRefineTools(true);
    } catch (err: any) {
      console.error("Extraction error:", err);
      if (!errorCategory) setErrorCategory('extraction');
      setState(prev => ({ ...prev, error: err.message || 'Transmission error during extraction.', isAnalyzing: false }));
      setUploadedFileName(null);
    } finally {
      setTimeout(() => { setIsExtracting(false); setExtractionStep(""); }, 800);
    }
  };

  const applyRefinement = () => {
    let text = state.resumeText;
    if (refineOptions.normalizeSpacing) text = text.replace(/\n\s*\n/g, '\n\n').replace(/[ \t]+/g, ' ');
    if (refineOptions.removeSpecialChars) text = text.replace(/[^a-zA-Z0-9\s.,!?;:()'"\-\/&@$€%]/g, '');
    if (refineOptions.stripUnwantedFormatting) {
      text = text.replace(/[\x00-\x09\x0B-\x0C\x0E-\x1F\x7F-\x9F]/g, '');
      text = text.replace(/[•●■▪◦]/g, '-');
    }
    setState(prev => ({ ...prev, resumeText: text.trim() }));
    setShowRefineTools(false);
  };

  const handleAnalyze = async () => {
    if (!state.resumeText || !state.jobDescription) {
      setErrorCategory('validation');
      setState(prev => ({ ...prev, error: 'Requirement Missing: Resume and target definition are both mandatory for intelligence compute.' }));
      return;
    }
    setState(prev => ({ ...prev, isAnalyzing: true, error: null, analysisStep: STEPS[0].label }));
    setErrorCategory(null);
    try {
      const result = await analyzeResume(state.resumeText, state.jobDescription);
      setTimeout(() => { setState(prev => ({ ...prev, result, isAnalyzing: false })); }, 1000);
    } catch (err: any) {
      setErrorCategory('analysis');
      setState(prev => ({ ...prev, error: err.message || 'Compute Error: Intelligence engine failed to reach a conclusion.', isAnalyzing: false }));
    }
  };

  const resetAnalysis = () => {
    setState({
      resumeText: '',
      rawResumeText: '',
      jobDescription: '',
      isAnalyzing: false,
      analysisStep: STEPS[0].label,
      result: null,
      error: null,
    });
    setUploadedFileName(null);
    setShowRefineTools(false);
    setShowRawPreview(false);
    setErrorCategory(null);
    setActiveStepIndex(0);
  };

  const getErrorTitle = () => {
    switch (errorCategory) {
      case 'fileType': return 'MEDIA MISMATCH';
      case 'extraction': return 'DECODE ERROR';
      case 'analysis': return 'COMPUTE FAILURE';
      case 'validation': return 'INPUT DEFICIENCY';
      default: return 'SYSTEM EXCEPTION';
    }
  };

  return (
    <div className="min-h-screen flex flex-col transition-all duration-700 font-sans selection:bg-indigo-500 selection:text-white">
      <nav className="sticky top-0 z-[60] glass border-b px-6 py-4 md:px-10 md:py-6 transition-all" aria-label="Main Navigation">
        <div className="max-w-[1400px] mx-auto flex justify-between items-center">
          <motion.div 
            whileHover={{ scale: 1.02, x: 5 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center space-x-3 md:space-x-5 cursor-pointer" 
            onClick={resetAnalysis}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && resetAnalysis()}
            aria-label="ResuMaster Pro Home"
          >
            <div className="text-indigo-600 shadow-2xl glow-indigo transition-transform hover:rotate-2">
              <ResuMasterLogo className="w-10 h-10 md:w-14 md:h-14" />
            </div>
            <div>
              <span className="text-xl md:text-3xl font-black tracking-tighter text-slate-900 dark:text-white block leading-none">ResuMaster <span className="text-indigo-600">Pro</span></span>
              <span className="text-[8px] md:text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.4em]">Flash Engine Cluster</span>
            </div>
          </motion.div>
          
          <div className="flex items-center space-x-4 md:space-x-8">
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setDarkMode(!darkMode)}
              className="group relative w-12 h-12 md:w-14 md:h-14 flex items-center justify-center rounded-2xl bg-white dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 transition-all border border-slate-200/50 dark:border-slate-700/50 shadow-sm overflow-hidden"
              aria-label={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              <AnimatePresence mode="wait" initial={false}>
                {darkMode ? (
                  <motion.div
                    key="sun"
                    initial={{ y: 20, opacity: 0, rotate: -45 }}
                    animate={{ y: 0, opacity: 1, rotate: 0 }}
                    exit={{ y: -20, opacity: 0, rotate: 45 }}
                    transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
                    className="flex items-center justify-center"
                  >
                    <svg className="w-6 h-6 md:w-7 md:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="5" />
                      <line x1="12" y1="1" x2="12" y2="3" />
                      <line x1="12" y1="21" x2="12" y2="23" />
                      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                      <line x1="1" y1="12" x2="3" y2="12" />
                      <line x1="21" y1="12" x2="23" y2="12" />
                      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                    </svg>
                  </motion.div>
                ) : (
                  <motion.div
                    key="moon"
                    initial={{ y: 20, opacity: 0, rotate: -45 }}
                    animate={{ y: 0, opacity: 1, rotate: 0 }}
                    exit={{ y: -20, opacity: 0, rotate: 45 }}
                    transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
                    className="flex items-center justify-center"
                  >
                    <svg className="w-6 h-6 md:w-7 md:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                    </svg>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
            <motion.button 
              whileHover={{ y: -3, scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="hidden sm:block px-6 md:px-8 py-3.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black text-xs md:text-sm shadow-2xl transition-all tracking-widest uppercase border border-white/10 dark:border-slate-900/10 focus-visible:ring-2 focus-visible:ring-indigo-500"
            >
              Enterprise
            </motion.button>
          </div>
        </div>
      </nav>

      <main className="flex-grow max-w-[1400px] mx-auto w-full p-6 md:p-20 relative">
        <AnimatePresence mode="wait">
          {!state.result ? (
            <motion.div 
              key="input"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, filter: 'blur(12px)' }}
              transition={{ duration: 0.6, ease: [0.19, 1, 0.22, 1] }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 items-start"
            >
              <div className="space-y-8 md:space-y-12 lg:sticky lg:top-40">
                <div>
                  <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="inline-flex items-center px-4 py-1.5 md:px-5 md:py-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-full text-[9px] md:text-[11px] font-black mb-6 md:mb-10 border border-indigo-100/50 dark:border-indigo-800/30 uppercase tracking-[0.2em]"
                  >
                    <span className="relative flex h-2 md:h-3 w-2 md:w-3 mr-3 md:mr-4">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-full w-full bg-indigo-500"></span>
                    </span>
                    Quantum Cluster Secured
                  </motion.div>
                  <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-slate-900 dark:text-white leading-[0.95] tracking-tighter mb-6 md:mb-10">
                    Precision <span className="gradient-text italic">Career Engine.</span>
                  </h1>
                  <p className="text-lg md:text-2xl text-slate-500 dark:text-slate-400 leading-relaxed font-semibold max-w-xl">
                    Beyond matching keywords. We leverage high-order semantic intelligence to align your unique professional narrative with market benchmarks.
                  </p>
                </div>

                <motion.div 
                  whileHover={{ scale: 1.01, y: -4 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => !isExtracting && fileInputRef.current?.click()}
                  className={`group relative overflow-hidden p-8 md:p-14 border-2 border-dashed rounded-[32px] md:rounded-[50px] transition-all flex flex-col items-center justify-center text-center space-y-6 md:space-y-8 ${
                    isExtracting ? 'border-indigo-400 bg-indigo-50/50 dark:bg-indigo-900/10 cursor-wait' :
                    uploadedFileName ? 'border-indigo-500/50 bg-indigo-50/20 dark:bg-indigo-900/10 cursor-pointer shadow-2xl' : 
                    'border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-slate-50 dark:hover:bg-slate-900/40 cursor-pointer'
                  }`}
                >
                  <input type="file" ref={fileInputRef} className="hidden" accept=".pdf,.docx,.txt" onChange={handleFileSelect} />
                  {isExtracting ? (
                    <div className="flex flex-col items-center">
                      <div className="w-12 h-12 md:w-16 md:h-16 border-[5px] border-indigo-600 border-t-transparent rounded-full animate-spin mb-6 md:mb-8 shadow-glow" />
                      <p className="font-black text-xl md:text-2xl text-slate-900 dark:text-white mb-2 md:mb-3">Deconstructing File</p>
                      <p className="text-indigo-600 dark:text-indigo-400 text-xs font-black uppercase tracking-[0.4em] animate-pulse">{extractionStep}</p>
                    </div>
                  ) : uploadedFileName ? (
                    <>
                      <div className="w-16 h-16 md:w-24 md:h-24 bg-indigo-600 text-white rounded-[24px] md:rounded-[32px] flex items-center justify-center shadow-2xl glow-indigo transform transition-transform group-hover:rotate-12">
                        <svg className="w-10 h-10 md:w-12 md:h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg>
                      </div>
                      <div className="max-w-full px-4 md:px-6">
                        <p className="text-slate-900 dark:text-white font-black text-xl md:text-2xl truncate mb-1 md:mb-2">{uploadedFileName}</p>
                        <p className="text-indigo-600 dark:text-indigo-400 text-[10px] font-black uppercase tracking-[0.5em]">DECODED & SECURED</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="w-16 h-16 md:w-24 md:h-24 bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600 rounded-[24px] md:rounded-[32px] flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm">
                        <svg className="w-10 h-10 md:w-12 md:h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                      </div>
                      <div>
                        <p className="text-slate-900 dark:text-white font-black text-xl md:text-2xl mb-1 md:mb-2">Ingest Profile</p>
                        <p className="text-slate-400 dark:text-slate-500 text-[10px] font-black uppercase tracking-[0.5em]">PDF / DOCX / TXT</p>
                      </div>
                    </>
                  )}
                </motion.div>
              </div>

              <div className="glass-card p-8 md:p-14 rounded-[40px] md:rounded-[64px] relative min-h-[600px] md:min-h-[700px] flex flex-col justify-between shadow-2xl transition-colors duration-500 overflow-hidden card-3d">
                <AnimatePresence>
                  {state.isAnalyzing && (
                    <motion.div 
                      initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
                      animate={{ opacity: 1, backdropFilter: 'blur(40px)' }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 z-50 bg-white/70 dark:bg-slate-950/90 rounded-[40px] md:rounded-[64px] flex flex-col items-center justify-center p-8 md:p-12 text-center"
                      style={{ perspective: '1200px' }}
                    >
                      <motion.div 
                        animate={{ rotateY: 360, rotateX: [0, 10, 0] }}
                        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                        className="absolute w-[500px] h-[500px] border border-indigo-500/10 rounded-full flex items-center justify-center"
                        style={{ transformStyle: 'preserve-3d', opacity: 0.3 }}
                      >
                         <div className="absolute w-full h-full border border-indigo-500/5 rounded-full rotate-45" />
                         <div className="absolute w-full h-full border border-indigo-500/5 rounded-full -rotate-45" />
                         <motion.div 
                           animate={{ scale: [1, 1.2, 1] }}
                           transition={{ duration: 4, repeat: Infinity }}
                           className="w-32 h-32 bg-indigo-500/10 blur-[60px] rounded-full" 
                         />
                      </motion.div>

                      <div className="w-full h-full flex flex-col items-center justify-center relative z-10" style={{ transformStyle: 'preserve-3d' }}>
                        <motion.div 
                          initial={{ opacity: 0, scale: 0.8, translateZ: -100 }}
                          animate={{ opacity: 1, scale: 1, translateZ: 0 }}
                          className="mb-16"
                        >
                          <h3 className="text-4xl md:text-6xl font-black text-slate-900 dark:text-white tracking-tighter mb-4 gradient-text">Neural Synthesis</h3>
                          <div className="inline-block px-6 py-2 bg-indigo-600 text-white rounded-full">
                            <p className="text-xs font-black uppercase tracking-[0.5em]">{STEPS[activeStepIndex].label}</p>
                          </div>
                        </motion.div>

                        <div className="relative w-full max-w-4xl" style={{ transformStyle: 'preserve-3d' }}>
                          <div className="absolute top-1/2 left-0 w-full h-[2px] bg-slate-200 dark:bg-slate-800 -translate-y-1/2" />
                          <div className="flex justify-between items-center relative z-10 px-4">
                            {STEPS.map((step, idx) => {
                              const isActive = idx === activeStepIndex;
                              const isCompleted = idx < activeStepIndex;
                              return (
                                <motion.div 
                                  key={step.id} 
                                  className="flex flex-col items-center"
                                  initial={{ translateZ: 0 }}
                                  animate={{ 
                                    translateZ: isActive ? 60 : 0,
                                    scale: isActive ? 1.15 : 1
                                  }}
                                  transition={{ type: 'spring', damping: 15 }}
                                >
                                  <motion.div 
                                    animate={{ 
                                      backgroundColor: isActive || isCompleted ? '#6366f1' : 'transparent',
                                      borderColor: isActive || isCompleted ? '#6366f1' : (darkMode ? '#1e293b' : '#e2e8f0'),
                                      boxShadow: isActive ? '0 20px 50px rgba(99, 102, 241, 0.4)' : 'none'
                                    }}
                                    className={`w-16 h-16 md:w-20 md:h-20 rounded-[28px] md:rounded-[32px] flex items-center justify-center text-white transition-all border-2 relative ${
                                      isActive ? 'z-20' : 'z-10'
                                    } bg-slate-50 dark:bg-slate-900`}
                                  >
                                    <step.icon className={`w-8 h-8 md:w-10 md:h-10 ${isActive || isCompleted ? 'text-white' : 'text-slate-400'}`} />
                                    {isActive && (
                                      <motion.div 
                                        layoutId="step-ring-3d"
                                        className="absolute inset-0 border-[3px] border-indigo-400/30 rounded-[28px] md:rounded-[32px]"
                                        animate={{ scale: [1, 1.4, 1], opacity: [0.5, 0, 0.5] }}
                                        transition={{ repeat: Infinity, duration: 2 }}
                                      />
                                    )}
                                  </motion.div>
                                  <AnimatePresence mode="wait">
                                    {isActive && (
                                      <motion.div 
                                        initial={{ opacity: 0, y: 20, rotateX: -45 }}
                                        animate={{ opacity: 1, y: 0, rotateX: 0 }}
                                        exit={{ opacity: 0, y: -20 }}
                                        className="absolute top-24 md:top-28 w-max text-center"
                                      >
                                        <p className="text-slate-900 dark:text-white font-black text-lg tracking-tight leading-none">{step.label}</p>
                                        <p className="text-indigo-600 dark:text-indigo-400 text-[10px] font-black uppercase tracking-widest mt-2">{step.sub}</p>
                                      </motion.div>
                                    )}
                                  </AnimatePresence>
                                </motion.div>
                              );
                            })}
                          </div>

                          {activeStepIndex < STEPS.length - 1 && (
                            <motion.div 
                              className="absolute top-1/2 h-1.5 bg-indigo-600 rounded-full z-[5] blur-[1px]"
                              initial={{ width: 0, left: `${(activeStepIndex / (STEPS.length - 1)) * 100}%` }}
                              animate={{ 
                                width: '25%',
                                opacity: [0, 0.8, 0],
                                left: [`${(activeStepIndex / (STEPS.length - 1)) * 100}%`, `${((activeStepIndex + 1) / (STEPS.length - 1)) * 100}%`]
                              }}
                              transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                            />
                          )}
                        </div>
                        
                        <div className="mt-64 flex flex-col items-center space-y-4">
                          <div className="flex space-x-2">
                            {[0, 1, 2].map(i => (
                              <motion.div 
                                key={i}
                                animate={{ y: [0, -10, 0], opacity: [0.3, 1, 0.3] }}
                                transition={{ repeat: Infinity, duration: 1, delay: i * 0.2 }}
                                className="w-2 h-2 bg-indigo-500 rounded-full"
                              />
                            ))}
                          </div>
                          <p className="text-[11px] md:text-xs text-slate-400 dark:text-slate-600 font-black uppercase tracking-[0.6em] animate-pulse">
                            CALCULATING SEMANTIC COHERENCE
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
                
                <LayoutGroup>
                <div className="space-y-8 md:space-y-12">
                  <motion.div layout className="relative">
                    <div className="flex justify-between items-center mb-4 md:mb-6">
                      <label htmlFor="resume-input" className="text-[9px] md:text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.4em]">
                        Intelligence Source
                      </label>
                      <div className="flex items-center space-x-3 md:space-x-4">
                        {state.rawResumeText && (
                          <button 
                            onClick={() => setShowRawPreview(true)}
                            className="text-slate-500 dark:text-slate-400 text-[9px] md:text-[10px] bg-slate-100 dark:bg-slate-800/60 px-3 py-1.5 md:px-4 md:py-2 rounded-full font-black hover:bg-slate-900 hover:text-white dark:hover:bg-white dark:hover:text-slate-900 transition-all border border-transparent uppercase tracking-widest outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                          >
                            Source
                          </button>
                        )}
                        {state.resumeText && (
                          <button 
                            onClick={() => setShowRefineTools(!showRefineTools)}
                            className="text-indigo-600 dark:text-indigo-400 text-[9px] md:text-[10px] bg-indigo-50/50 dark:bg-indigo-900/40 px-3 py-1.5 md:px-4 md:py-2 rounded-full font-black hover:bg-indigo-600 hover:text-white transition-all border border-indigo-100/50 dark:border-indigo-800/30 uppercase tracking-widest outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                          >
                            {showRefineTools ? 'Finalize' : 'Filter'}
                          </button>
                        )}
                      </div>
                    </div>

                    <AnimatePresence>
                      {showRefineTools && (
                        <motion.div 
                          initial={{ height: 0, opacity: 0, scale: 0.95 }}
                          animate={{ height: 'auto', opacity: 1, scale: 1 }}
                          exit={{ height: 0, opacity: 0, scale: 0.95 }}
                          className="overflow-hidden mb-6 md:mb-8"
                        >
                          <div className="p-6 md:p-8 bg-slate-50/80 dark:bg-slate-900/40 rounded-[24px] md:rounded-[32px] border border-slate-200 dark:border-slate-800 space-y-5 md:space-y-6 shadow-inner">
                            <h4 className="text-[9px] md:text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-[0.3em]">NLP Sanitization Pipeline</h4>
                            <div className="space-y-4 md:space-y-5">
                              {[
                                { key: 'normalizeSpacing', label: 'Semantic Flattening', desc: 'Eliminate structural noise & orphans' },
                                { key: 'removeSpecialChars', label: 'Byte-Level Stripping', desc: 'Remove non-standard Unicode artifacts' },
                                { key: 'stripUnwantedFormatting', label: 'Logic Reconstruction', desc: 'Convert visual markers to logical hierarchy' }
                              ].map((opt) => (
                                <label key={opt.key} className="flex items-start space-x-4 md:space-x-5 cursor-pointer group">
                                  <div className="mt-1">
                                    <input 
                                      type="checkbox" 
                                      checked={(refineOptions as any)[opt.key]}
                                      onChange={() => setRefineOptions(prev => ({ ...prev, [opt.key]: !(prev as any)[opt.key] }))}
                                      className="w-5 h-5 md:w-6 md:h-6 rounded-lg md:rounded-xl text-indigo-600 dark:text-indigo-400 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-indigo-500 focus:ring-offset-0"
                                    />
                                  </div>
                                  <div>
                                    <p className="text-sm md:text-base font-black text-slate-800 dark:text-white group-hover:text-indigo-600 transition-colors tracking-tight">{opt.label}</p>
                                    <p className="text-[10px] md:text-[11px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest mt-0.5">{opt.desc}</p>
                                  </div>
                                </label>
                              ))}
                            </div>
                            <button 
                              onClick={applyRefinement}
                              className="w-full py-3.5 md:py-4 bg-indigo-600 text-white text-[10px] md:text-xs font-black rounded-xl md:rounded-2xl hover:bg-indigo-700 shadow-2xl glow-indigo transition-all tracking-[0.2em] outline-none focus-visible:ring-2 focus-visible:ring-white"
                            >
                              EXECUTE TRANSFORMATION
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <textarea
                      id="resume-input"
                      placeholder="Input resume content..."
                      className="w-full h-48 md:h-64 p-6 md:p-8 rounded-[24px] md:rounded-[40px] bg-slate-50/30 dark:bg-slate-900/30 border-2 border-transparent focus:border-indigo-500/30 focus:bg-white dark:focus:bg-slate-900 transition-all outline-none text-slate-700 dark:text-slate-300 text-sm md:text-base font-bold resize-none shadow-inner leading-relaxed"
                      value={state.resumeText}
                      onChange={(e) => setState(prev => ({ ...prev, resumeText: e.target.value }))}
                      aria-label="Paste Resume Text Here"
                    />
                  </motion.div>

                  <motion.div layout>
                    <div className="flex justify-between items-center mb-4 md:mb-6">
                      <label htmlFor="jd-input" className="text-[9px] md:text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.4em]">
                        Target Benchmark
                      </label>
                      {state.jobDescription && (
                        <span className="text-indigo-600 dark:text-indigo-400 text-[8px] md:text-[9px] font-black uppercase tracking-[0.2em] bg-indigo-50 dark:bg-indigo-900/40 px-3 py-1 rounded-full">
                          LENS LOADED: {state.jobDescription.length.toLocaleString()} BYTES
                        </span>
                      )}
                    </div>
                    <textarea
                      id="jd-input"
                      placeholder="Define the target role expectations..."
                      className="w-full h-36 md:h-48 p-6 md:p-8 rounded-[24px] md:rounded-[40px] bg-slate-50/30 dark:bg-slate-900/30 border-2 border-transparent focus:border-indigo-500/30 focus:bg-white dark:focus:bg-slate-900 transition-all outline-none text-slate-700 dark:text-slate-300 text-sm md:text-base font-bold resize-none shadow-inner leading-relaxed"
                      value={state.jobDescription}
                      onChange={(e) => setState(prev => ({ ...prev, jobDescription: e.target.value }))}
                      aria-label="Paste Job Description Here"
                    />
                  </motion.div>

                  <AnimatePresence>
                  {state.error && (
                    <motion.div 
                      initial={{ opacity: 0, y: 15, scale: 0.95 }} 
                      animate={{ opacity: 1, y: 0, scale: 1 }} 
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="p-6 md:p-8 bg-rose-50/80 dark:bg-rose-900/10 border border-rose-200/50 dark:border-rose-900/30 rounded-[32px] md:rounded-[40px] flex items-start space-x-5 md:space-x-6 shadow-lg"
                      role="alert"
                    >
                      <div className="w-10 h-10 md:w-14 md:h-14 rounded-[16px] md:rounded-[20px] bg-rose-100 dark:bg-rose-900/30 text-rose-600 flex items-center justify-center flex-shrink-0 shadow-sm">
                        <svg className="w-6 h-6 md:w-8 md:h-8" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
                      </div>
                      <div className="pt-1 md:pt-2">
                        <h5 className="text-rose-900 dark:text-rose-400 font-black text-[10px] md:text-[11px] uppercase tracking-[0.3em] mb-1 md:mb-2">{getErrorTitle()}</h5>
                        <p className="text-rose-700 dark:text-rose-300 text-sm md:text-base font-bold leading-snug">{state.error}</p>
                      </div>
                    </motion.div>
                  )}
                  </AnimatePresence>
                </div>
                </LayoutGroup>

                <motion.button
                  whileHover={{ scale: 1.02, y: -4 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleAnalyze}
                  disabled={state.isAnalyzing || !state.resumeText || !state.jobDescription}
                  className="mt-8 md:mt-12 group relative w-full py-6 md:py-8 bg-indigo-600 text-white rounded-[24px] md:rounded-[40px] font-black text-xl md:text-2xl overflow-hidden transition-all disabled:opacity-30 shadow-[0_25px_50px_-12px_rgba(79,70,229,0.5)] glow-indigo tracking-widest uppercase outline-none focus-visible:ring-4 focus-visible:ring-indigo-400"
                >
                  <div className="absolute inset-0 w-1/3 h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-[300%] transition-transform duration-1000" />
                  GENERATE INTELLIGENCE
                </motion.button>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="results" 
              initial={{ opacity: 0, y: 40, scale: 0.98 }} 
              animate={{ opacity: 1, y: 0, scale: 1 }} 
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            >
              <Dashboard result={state.result} onReset={resetAnalysis} isDarkMode={darkMode} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <AnimatePresence>
        {showRawPreview && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 md:p-20 overflow-hidden" role="dialog" aria-modal="true" aria-labelledby="modal-title">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowRawPreview(false)}
              className="absolute inset-0 bg-slate-950/95 backdrop-blur-3xl"
            />
            <motion.div 
              initial={{ scale: 0.8, opacity: 0, y: 60 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 60 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative w-full max-w-[1200px] h-[85vh] bg-white dark:bg-slate-900 rounded-[32px] md:rounded-[64px] shadow-3xl flex flex-col overflow-hidden transition-colors border border-white/10"
            >
              <div className="p-8 md:p-12 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-950/20">
                <div>
                  <h3 id="modal-title" className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tighter">Bit-Level Extraction</h3>
                  <p className="text-slate-500 dark:text-slate-400 text-[9px] md:text-[10px] font-black uppercase tracking-[0.5em] mt-2 md:mt-3">Raw Parser Stream • Non-Processed Data</p>
                </div>
                <button 
                  onClick={() => setShowRawPreview(false)}
                  className="p-3.5 md:p-5 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-2xl md:rounded-3xl hover:bg-rose-600 hover:text-white transition-all shadow-xl border border-slate-100 dark:border-slate-700 outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
                >
                  <svg className="w-6 h-6 md:w-8 md:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              <div className="flex-grow p-8 md:p-12 overflow-y-auto">
                <div className="bg-slate-50 dark:bg-slate-950/80 p-8 md:p-12 rounded-[24px] md:rounded-[48px] border border-slate-200 dark:border-slate-800 shadow-inner">
                  <pre className="whitespace-pre-wrap text-base md:text-lg text-slate-600 dark:text-slate-400 font-mono leading-relaxed tracking-tighter selection:bg-indigo-500/30">
                    {state.rawResumeText || "SYSTEM: BUFFER EMPTY"}
                  </pre>
                </div>
              </div>
              <div className="p-8 md:p-12 bg-slate-50/50 dark:bg-slate-950/20 border-t border-slate-100 dark:border-slate-800 text-right">
                <button 
                  onClick={() => setShowRawPreview(false)}
                  className="px-10 md:px-16 py-3.5 md:py-5 bg-indigo-600 text-white rounded-xl md:rounded-3xl font-black transition-all hover:bg-indigo-700 shadow-2xl glow-indigo uppercase tracking-[0.3em] text-[10px] md:text-xs outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
                >
                  Terminate Preview
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <footer className="py-12 md:py-20 px-10 border-t border-slate-100/30 dark:border-slate-900/30 text-center">
        <div className="flex flex-col items-center justify-center space-y-6 md:space-y-8">
          <motion.div 
            whileHover={{ scale: 1.1, rotate: 5 }}
            className="text-slate-400 dark:text-slate-600 shadow-inner flex items-center justify-center"
          >
             <ResuMasterLogo className="w-12 h-12 md:w-14 md:h-14 opacity-50 grayscale hover:grayscale-0 hover:opacity-100 transition-all cursor-pointer" />
          </motion.div>
          <div className="space-y-2">
            <p className="text-slate-500 dark:text-slate-400 text-[10px] md:text-[11px] font-black uppercase tracking-[0.8em]">ResuMaster Intelligence • Flash Cluster v3.1</p>
            <p className="text-slate-400 dark:text-slate-600 text-[8px] md:text-[9px] font-bold uppercase tracking-[0.2em]">Secure End-to-End Career Processing • © 2025</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
