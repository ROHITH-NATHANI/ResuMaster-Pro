
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
  "Awakening Neural Correlates...",
  "Synthesizing Career Trajectories...",
  "Evaluating Semantic Alignment...",
  "Quantifying Market Relevance...",
  "Generating Strategic Intelligence..."
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

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    resumeText: '',
    rawResumeText: '',
    jobDescription: '',
    isAnalyzing: false,
    analysisStep: STEPS[0],
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
      let stepIndex = 0;
      interval = setInterval(() => {
        if (stepIndex < STEPS.length - 1) {
          stepIndex++;
          setState(prev => ({ ...prev, analysisStep: STEPS[stepIndex] }));
        }
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [state.isAnalyzing]);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    await processFile(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
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
        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        const pdf = await loadingTask.promise;
        let fullText = '';
        for (let i = 1; i <= pdf.numPages; i++) {
          setExtractionStep(EXTRACTION_STEPS.PDF_PAGES.replace('{current}', i.toString()).replace('{total}', pdf.numPages.toString()));
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const pageText = textContent.items.map((item: any) => 'str' in item ? item.str : '').join(' ');
          fullText += pageText + '\n';
        }
        extractedText = fullText;
      } else if (file.type === 'text/plain') {
        extractedText = await file.text();
      } else {
        setErrorCategory('fileType');
        throw new Error(`Incompatible Media: "${file.name.split('.').pop()}" is not a recognized profile format.`);
      }

      setExtractionStep(EXTRACTION_STEPS.CLEANING);
      const cleanedText = extractedText.trim();
      if (!cleanedText) {
        setErrorCategory('extraction');
        throw new Error('Data Void: The provided file contains no interpretable text structure.');
      }

      setState(prev => ({ 
        ...prev, 
        resumeText: cleanedText,
        rawResumeText: cleanedText 
      }));
      setExtractionStep(EXTRACTION_STEPS.SUCCESS);
      setShowRefineTools(true);
    } catch (err: any) {
      if (!errorCategory) setErrorCategory('extraction');
      setState(prev => ({ ...prev, error: err.message || 'Transmission error during extraction.', isAnalyzing: false }));
      setUploadedFileName(null);
    } finally {
      setTimeout(() => {
        setIsExtracting(false);
        setExtractionStep("");
      }, 800);
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

    setState(prev => ({ ...prev, isAnalyzing: true, error: null, analysisStep: STEPS[0] }));
    setErrorCategory(null);
    
    try {
      const result = await analyzeResume(state.resumeText, state.jobDescription);
      setState(prev => ({ ...prev, result, isAnalyzing: false }));
    } catch (err: any) {
      setErrorCategory('analysis');
      setState(prev => ({ 
        ...prev, 
        error: err.message || 'Compute Error: Intelligence engine failed to reach a conclusion.', 
        isAnalyzing: false 
      }));
    }
  };

  const resetAnalysis = () => {
    setState({
      resumeText: '',
      rawResumeText: '',
      jobDescription: '',
      isAnalyzing: false,
      analysisStep: STEPS[0],
      result: null,
      error: null,
    });
    setUploadedFileName(null);
    setShowRefineTools(false);
    setShowRawPreview(false);
    setErrorCategory(null);
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
    <div className="min-h-screen flex flex-col transition-all duration-700">
      <nav className="sticky top-0 z-[60] glass border-b px-10 py-6 transition-all">
        <div className="max-w-[1400px] mx-auto flex justify-between items-center">
          <motion.div 
            whileHover={{ scale: 1.02, x: 5 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center space-x-5 cursor-pointer" 
            onClick={resetAnalysis}
          >
            <div className="w-14 h-14 bg-indigo-600 rounded-[20px] flex items-center justify-center text-white shadow-2xl glow-indigo rotate-3">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <span className="text-3xl font-black tracking-tighter text-slate-900 dark:text-white block leading-none">ResuMaster <span className="text-indigo-600">Pro</span></span>
              <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.4em]">Elite Intelligence Tier</span>
            </div>
          </motion.div>
          <div className="flex items-center space-x-8">
            <button 
              onClick={() => setDarkMode(!darkMode)}
              className="p-3.5 rounded-2xl bg-slate-100/50 dark:bg-slate-800/30 text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all border border-slate-200/50 dark:border-slate-700/50 shadow-sm"
            >
              {darkMode ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 18v1m9-9h1m-18 0h1m3.34-6.66l.7.7m11.32 11.32l.7.7m0-12.72l-.7.7m-11.32 11.32l-.7.7M12 7a5 5 0 100 10 5 5 0 000-10z"/></svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/></svg>
              )}
            </button>
            <motion.button 
              whileHover={{ y: -3, scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-3.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black text-sm shadow-2xl transition-all tracking-widest uppercase border border-white/10 dark:border-slate-900/10"
            >
              Enterprise
            </motion.button>
          </div>
        </div>
      </nav>

      <main className="flex-grow max-w-[1400px] mx-auto w-full p-10 md:p-20">
        <AnimatePresence mode="wait">
          {!state.result ? (
            <motion.div 
              key="input"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, filter: 'blur(10px)' }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-start"
            >
              <div className="space-y-12 lg:sticky lg:top-40">
                <div>
                  <motion.div 
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="inline-flex items-center px-5 py-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-full text-[11px] font-black mb-10 border border-indigo-100/50 dark:border-indigo-800/30 uppercase tracking-[0.2em]"
                  >
                    <span className="relative flex h-3 w-3 mr-4">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500"></span>
                    </span>
                    Quantum NLP Node Secured
                  </motion.div>
                  <h1 className="text-8xl font-black text-slate-900 dark:text-white leading-[0.95] tracking-tighter mb-10">
                    Precision <span className="gradient-text italic">Career Engine.</span>
                  </h1>
                  <p className="text-2xl text-slate-500 dark:text-slate-400 leading-relaxed font-semibold max-w-xl">
                    Beyond keywords. We utilize high-order semantic reasoning to align your professional profile with the world's most competitive roles.
                  </p>
                </div>

                <motion.div 
                  whileHover={{ scale: 1.02, y: -5 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => !isExtracting && fileInputRef.current?.click()}
                  className={`group relative overflow-hidden p-14 border-2 border-dashed rounded-[50px] transition-all flex flex-col items-center justify-center text-center space-y-8 ${
                    isExtracting ? 'border-indigo-400 bg-indigo-50/50 dark:bg-indigo-900/10 cursor-wait' :
                    uploadedFileName ? 'border-indigo-500/50 bg-indigo-50/20 dark:bg-indigo-900/10 cursor-pointer shadow-2xl' : 
                    'border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-slate-50 dark:hover:bg-slate-900/40 cursor-pointer'
                  }`}
                >
                  <input type="file" ref={fileInputRef} className="hidden" accept=".pdf,.docx,.txt" onChange={handleFileSelect} />
                  {isExtracting ? (
                    <div className="flex flex-col items-center">
                      <div className="w-16 h-16 border-[5px] border-indigo-600 border-t-transparent rounded-full animate-spin mb-8 shadow-glow" />
                      <p className="font-black text-2xl text-slate-900 dark:text-white mb-3">Analyzing Structure</p>
                      <p className="text-indigo-600 dark:text-indigo-400 text-sm font-black uppercase tracking-[0.4em] animate-pulse">{extractionStep}</p>
                    </div>
                  ) : uploadedFileName ? (
                    <>
                      <div className="w-24 h-24 bg-indigo-600 text-white rounded-[32px] flex items-center justify-center shadow-2xl glow-indigo transform transition-transform group-hover:rotate-12">
                        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg>
                      </div>
                      <div className="max-w-full px-6">
                        <p className="text-slate-900 dark:text-white font-black text-2xl truncate mb-2">{uploadedFileName}</p>
                        <p className="text-indigo-600 dark:text-indigo-400 text-xs font-black uppercase tracking-[0.5em]">DECODED & SECURED</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="w-24 h-24 bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600 rounded-[32px] flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm">
                        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                      </div>
                      <div>
                        <p className="text-slate-900 dark:text-white font-black text-2xl mb-2">Ingest Profile</p>
                        <p className="text-slate-400 dark:text-slate-500 text-xs font-black uppercase tracking-[0.5em]">PDF / DOCX / TXT</p>
                      </div>
                    </>
                  )}
                </motion.div>
              </div>

              <div className="glass-card p-14 rounded-[64px] relative min-h-[700px] flex flex-col justify-between shadow-[0_50px_100px_-20px_rgba(0,0,0,0.15)]">
                <AnimatePresence>
                  {state.isAnalyzing && (
                    <motion.div 
                      initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
                      animate={{ opacity: 1, backdropFilter: 'blur(20px)' }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 z-50 bg-white/40 dark:bg-slate-950/40 rounded-[64px] flex flex-col items-center justify-center p-16 text-center"
                    >
                      <div className="w-24 h-24 border-[6px] border-indigo-600 border-t-transparent rounded-full animate-spin mb-10 glow-indigo" />
                      <h3 className="text-4xl font-black text-slate-900 dark:text-white mb-4 tracking-tighter">Synthesizing Report</h3>
                      <p className="text-indigo-600 dark:text-indigo-400 font-black text-sm uppercase tracking-[0.5em] animate-pulse">{state.analysisStep}</p>
                      <p className="mt-12 text-[10px] text-slate-400 dark:text-slate-500 uppercase font-black tracking-widest max-w-xs leading-loose">Secure compute in progress • Neural layers iterating</p>
                    </motion.div>
                  )}
                </AnimatePresence>
                
                <LayoutGroup>
                <div className="space-y-12">
                  <motion.div layout className="relative">
                    <div className="flex justify-between items-center mb-6">
                      <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.4em]">
                        Intelligence Source
                      </label>
                      <div className="flex items-center space-x-4">
                        {state.rawResumeText && (
                          <button 
                            onClick={() => setShowRawPreview(true)}
                            className="text-slate-500 dark:text-slate-400 text-[10px] bg-slate-100 dark:bg-slate-800/60 px-4 py-1.5 rounded-full font-black hover:bg-slate-900 hover:text-white dark:hover:bg-white dark:hover:text-slate-900 transition-all border border-transparent uppercase tracking-widest"
                          >
                            Source
                          </button>
                        )}
                        {state.resumeText && (
                          <button 
                            onClick={() => setShowRefineTools(!showRefineTools)}
                            className="text-indigo-600 dark:text-indigo-400 text-[10px] bg-indigo-50/50 dark:bg-indigo-900/40 px-4 py-1.5 rounded-full font-black hover:bg-indigo-600 hover:text-white transition-all border border-indigo-100/50 dark:border-indigo-800/30 uppercase tracking-widest"
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
                          className="overflow-hidden mb-8"
                        >
                          <div className="p-8 bg-slate-50/80 dark:bg-slate-900/40 rounded-[32px] border border-slate-200 dark:border-slate-800 space-y-6 shadow-inner">
                            <h4 className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-[0.3em]">NLP Sanitization Pipeline</h4>
                            <div className="space-y-5">
                              {[
                                { key: 'normalizeSpacing', label: 'Semantic Flattening', desc: 'Eliminate structural noise & orphans' },
                                { key: 'removeSpecialChars', label: 'Byte-Level Stripping', desc: 'Remove non-standard Unicode artifacts' },
                                { key: 'stripUnwantedFormatting', label: 'Logic Reconstruction', desc: 'Convert visual markers to logical hierarchy' }
                              ].map((opt) => (
                                <label key={opt.key} className="flex items-start space-x-5 cursor-pointer group">
                                  <div className="mt-1">
                                    <input 
                                      type="checkbox" 
                                      checked={(refineOptions as any)[opt.key]}
                                      onChange={() => setRefineOptions(prev => ({ ...prev, [opt.key]: !(prev as any)[opt.key] }))}
                                      className="w-6 h-6 rounded-xl text-indigo-600 dark:text-indigo-400 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-indigo-500 focus:ring-offset-0"
                                    />
                                  </div>
                                  <div>
                                    <p className="text-base font-black text-slate-800 dark:text-white group-hover:text-indigo-600 transition-colors tracking-tight">{opt.label}</p>
                                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest mt-0.5">{opt.desc}</p>
                                  </div>
                                </label>
                              ))}
                            </div>
                            <button 
                              onClick={applyRefinement}
                              className="w-full py-4 bg-indigo-600 text-white text-xs font-black rounded-2xl hover:bg-indigo-700 shadow-2xl glow-indigo transition-all tracking-[0.2em]"
                            >
                              EXECUTE TRANSFORMATION
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <textarea
                      placeholder="Input resume content..."
                      className="w-full h-64 p-8 rounded-[40px] bg-slate-50/30 dark:bg-slate-900/30 border-2 border-transparent focus:border-indigo-500/30 focus:bg-white dark:focus:bg-slate-900 transition-all outline-none text-slate-700 dark:text-slate-300 text-base font-bold resize-none shadow-inner leading-relaxed"
                      value={state.resumeText}
                      onChange={(e) => setState(prev => ({ ...prev, resumeText: e.target.value }))}
                    />
                  </motion.div>

                  <motion.div layout>
                    <div className="flex justify-between items-center mb-6">
                      <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.4em]">
                        Target Benchmark
                      </label>
                      {state.jobDescription && (
                        <span className="text-indigo-600 dark:text-indigo-400 text-[9px] font-black uppercase tracking-[0.2em] bg-indigo-50 dark:bg-indigo-900/40 px-3 py-1 rounded-full">
                          LENS LOADED: {state.jobDescription.length.toLocaleString()} BYTES
                        </span>
                      )}
                    </div>
                    <textarea
                      placeholder="Define the target role expectations..."
                      className="w-full h-48 p-8 rounded-[40px] bg-slate-50/30 dark:bg-slate-900/30 border-2 border-transparent focus:border-indigo-500/30 focus:bg-white dark:focus:bg-slate-900 transition-all outline-none text-slate-700 dark:text-slate-300 text-base font-bold resize-none shadow-inner leading-relaxed"
                      value={state.jobDescription}
                      onChange={(e) => setState(prev => ({ ...prev, jobDescription: e.target.value }))}
                    />
                  </motion.div>

                  <AnimatePresence>
                  {state.error && (
                    <motion.div 
                      initial={{ opacity: 0, y: 20, scale: 0.9 }} 
                      animate={{ opacity: 1, y: 0, scale: 1 }} 
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="p-8 bg-rose-50/80 dark:bg-rose-900/10 border border-rose-200/50 dark:border-rose-900/30 rounded-[40px] flex items-start space-x-6 shadow-lg"
                    >
                      <div className="w-14 h-14 rounded-[20px] bg-rose-100 dark:bg-rose-900/30 text-rose-600 flex items-center justify-center flex-shrink-0 shadow-sm">
                        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
                      </div>
                      <div className="pt-2">
                        <h5 className="text-rose-900 dark:text-rose-400 font-black text-[11px] uppercase tracking-[0.3em] mb-2">{getErrorTitle()}</h5>
                        <p className="text-rose-700 dark:text-rose-300 text-base font-bold leading-snug">{state.error}</p>
                      </div>
                    </motion.div>
                  )}
                  </AnimatePresence>
                </div>
                </LayoutGroup>

                <motion.button
                  whileHover={{ scale: 1.03, y: -4 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handleAnalyze}
                  disabled={state.isAnalyzing || !state.resumeText || !state.jobDescription}
                  className="mt-12 group relative w-full py-8 bg-indigo-600 text-white rounded-[40px] font-black text-2xl overflow-hidden transition-all disabled:opacity-20 shadow-[0_25px_50px_-12px_rgba(79,70,229,0.5)] glow-indigo tracking-widest uppercase"
                >
                  <div className="absolute inset-0 w-1/3 h-full bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-[300%] transition-transform duration-1000" />
                  GENERATE INTELLIGENCE
                </motion.button>
              </div>
            </motion.div>
          ) : (
            <motion.div key="results" initial={{ opacity: 0, scale: 1.05 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8, ease: "easeOut" }}>
              <Dashboard result={state.result} onReset={resetAnalysis} isDarkMode={darkMode} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Raw Preview Modal */}
      <AnimatePresence>
        {showRawPreview && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-8 md:p-20 overflow-hidden">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowRawPreview(false)}
              className="absolute inset-0 bg-slate-950/95 backdrop-blur-3xl"
            />
            <motion.div 
              initial={{ scale: 0.8, opacity: 0, y: 100 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 100 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-full max-w-[1200px] h-[85vh] bg-white dark:bg-slate-900 rounded-[64px] shadow-3xl flex flex-col overflow-hidden transition-colors border border-white/10"
            >
              <div className="p-12 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-950/20">
                <div>
                  <h3 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">Bit-Level Extraction</h3>
                  <p className="text-slate-500 dark:text-slate-400 text-[10px] font-black uppercase tracking-[0.5em] mt-3">Raw Parser Stream • Decoded JSON-Equivalent</p>
                </div>
                <button 
                  onClick={() => setShowRawPreview(false)}
                  className="p-5 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-3xl hover:bg-rose-600 hover:text-white transition-all shadow-xl border border-slate-100 dark:border-slate-700"
                >
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              <div className="flex-grow p-12 overflow-y-auto">
                <div className="bg-slate-50 dark:bg-slate-950/80 p-12 rounded-[48px] border border-slate-200 dark:border-slate-800 shadow-inner">
                  <pre className="whitespace-pre-wrap text-lg text-slate-600 dark:text-slate-400 font-mono leading-relaxed tracking-tighter">
                    {state.rawResumeText || "SYSTEM: BUFFER EMPTY"}
                  </pre>
                </div>
              </div>
              <div className="p-12 bg-slate-50/50 dark:bg-slate-950/20 border-t border-slate-100 dark:border-slate-800 text-right">
                <button 
                  onClick={() => setShowRawPreview(false)}
                  className="px-16 py-5 bg-indigo-600 text-white rounded-3xl font-black transition-all hover:bg-indigo-700 shadow-2xl glow-indigo uppercase tracking-[0.3em] text-xs"
                >
                  Terminate Preview
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <footer className="py-20 px-10 border-t border-slate-100/30 dark:border-slate-900/30 text-center">
        <div className="flex flex-col items-center justify-center space-y-8">
          <div className="w-14 h-14 bg-slate-100 dark:bg-slate-900 rounded-[20px] flex items-center justify-center text-slate-400 dark:text-slate-600 shadow-inner">
             <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
          </div>
          <div className="space-y-2">
            <p className="text-slate-500 dark:text-slate-400 text-[11px] font-black uppercase tracking-[0.8em]">ResuMaster Intelligence Engine • v3.0 Pro</p>
            <p className="text-slate-400 dark:text-slate-600 text-[9px] font-bold uppercase tracking-[0.2em]">Secure End-to-End Career Processing • © 2025</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
