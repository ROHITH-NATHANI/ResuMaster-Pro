import React, { useState } from 'react';
import { 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, 
  ResponsiveContainer, RadarProps
} from 'recharts';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { AnalysisResult } from '../types';
import { refineContent, getMarketIntel } from '../services/geminiService';

interface DashboardProps {
  result: AnalysisResult;
  onReset: () => void;
  isDarkMode?: boolean;
}

const Dashboard: React.FC<DashboardProps> = ({ result, onReset, isDarkMode = false }) => {
  const [activeTab, setActiveTab] = useState<'analysis' | 'letter' | 'interview' | 'intel'>('analysis');
  const [showRefinedSummary, setShowRefinedSummary] = useState(false);
  
  // Refinement states
  const [localResult, setLocalResult] = useState<AnalysisResult>(result);
  const [isRefining, setIsRefining] = useState(false);
  const [refinementPrompt, setRefinementPrompt] = useState("");
  const [showRefinementInput, setShowRefinementInput] = useState<null | 'summary' | 'letter'>(null);

  // Market Intel states
  const [intelData, setIntelData] = useState<{ text: string, links: { uri: string, title: string }[] } | null>(null);
  const [isFetchingIntel, setIsFetchingIntel] = useState(false);

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, ease: [0.19, 1, 0.22, 1] }
    }
  };

  const itemVariants: Variants = {
    hidden: { y: 30, opacity: 0, scale: 0.98 },
    visible: { y: 0, opacity: 1, scale: 1, transition: { duration: 0.8, ease: [0.19, 1, 0.22, 1] } }
  };

  const chartColors = {
    grid: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : '#e2e8f0',
    axis: isDarkMode ? '#94a3b8' : '#64748b',
    primary: '#6366f1',
  };

  const handleRefine = async (target: 'summary' | 'letter') => {
    if (!refinementPrompt.trim()) return;
    setIsRefining(true);
    try {
      const original = target === 'summary' ? localResult.refinedSummary : localResult.coverLetter;
      const refined = await refineContent(original, refinementPrompt, "Refining based on user request.");
      
      setLocalResult(prev => ({
        ...prev,
        [target === 'summary' ? 'refinedSummary' : 'coverLetter']: refined
      }));
      setRefinementPrompt("");
      setShowRefinementInput(null);
    } catch (err) {
      console.error(err);
    } finally {
      setIsRefining(false);
    }
  };

  const handleFetchIntel = async () => {
    setIsFetchingIntel(true);
    try {
      const intel = await getMarketIntel("Generic Context"); // In real app, pass JD
      setIntelData(intel);
    } catch (err) {
      console.error(err);
    } finally {
      setIsFetchingIntel(false);
    }
  };

  const TABS = [
    { id: 'analysis', label: 'Match Analysis', icon: (p:any) => <svg {...p} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg> },
    { id: 'letter', label: 'Cover Letter', icon: (p:any) => <svg {...p} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg> },
    { id: 'interview', label: 'Interview Prep', icon: (p:any) => <svg {...p} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"/></svg> },
    { id: 'intel', label: 'Market Intel', icon: (p:any) => <svg {...p} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg> }
  ];

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-8 max-w-7xl mx-auto pb-20 relative">
      
      {/* Header & Reset */}
      <motion.div variants={itemVariants} className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 px-4">
        <div>
          <h2 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tighter leading-none">Career Intelligence <span className="text-indigo-600">Sync.</span></h2>
          <p className="text-slate-500 dark:text-slate-400 font-medium mt-3">High-fidelity career synthesis completed. Neural assets mapped.</p>
        </div>
        <button onClick={onReset} className="px-8 py-4 bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800 rounded-[20px] font-black text-xs shadow-xl hover:scale-105 transition-all uppercase tracking-widest glow-indigo">
          Restart Pipeline
        </button>
      </motion.div>

      {/* Tabs Control - Glassy and Dimensional */}
      <motion.div variants={itemVariants} className="sticky top-24 z-50 flex p-2 bg-white/40 dark:bg-slate-950/40 backdrop-blur-3xl rounded-[32px] border border-white/40 dark:border-slate-800/40 w-full md:w-max mx-4 overflow-x-auto no-scrollbar shadow-2xl">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center space-x-2 px-8 py-4 rounded-[26px] text-[10px] font-black uppercase tracking-wider transition-all flex-shrink-0 ${
              activeTab === tab.id 
                ? 'bg-indigo-600 text-white shadow-2xl scale-105' 
                : 'text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 hover:bg-white/50 dark:hover:bg-slate-800/50'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span>{tab.label}</span>
          </button>
        ))}
      </motion.div>

      <AnimatePresence mode="wait">
        {activeTab === 'analysis' && (
          <motion.div 
            key="analysis" 
            initial={{ opacity: 0, y: 30 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, scale: 0.95 }} 
            className="grid grid-cols-1 lg:grid-cols-12 gap-8 px-4"
          >
            
            {/* Score & Radar - High Dimensionality Card */}
            <div className="lg:col-span-4 lg:sticky lg:top-48 h-fit glass-card p-10 rounded-[48px] flex flex-col items-center text-center card-3d">
              <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.4em] mb-8">Intelligence Percentile</span>
              <div className="relative mb-8 group">
                <div className="absolute inset-0 bg-indigo-500/20 blur-[50px] rounded-full group-hover:bg-indigo-500/30 transition-all duration-500" />
                <svg className="w-56 h-56 transform -rotate-90 relative z-10">
                  <circle cx="50%" cy="50%" r="42%" stroke={isDarkMode ? "#1e293b" : "#f1f5f9"} strokeWidth="14" fill="transparent" />
                  <motion.circle 
                    initial={{ strokeDashoffset: 527 }}
                    animate={{ strokeDashoffset: 527 * (1 - localResult.atsScore / 100) }}
                    transition={{ duration: 2, ease: "circOut" }}
                    cx="50%" cy="50%" r="42%" stroke="url(#scoreGradDeep)" strokeWidth="14" fill="transparent" strokeDasharray={527} strokeLinecap="round"
                  />
                  <defs>
                    <linearGradient id="scoreGradDeep" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#6366f1" />
                      <stop offset="50%" stopColor="#a855f7" />
                      <stop offset="100%" stopColor="#ec4899" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
                  <motion.span 
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-7xl font-black text-slate-900 dark:text-white leading-none tracking-tighter"
                  >
                    {localResult.atsScore}
                  </motion.span>
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-2">ATS QUOTIENT</span>
                </div>
              </div>
              <div className="w-full h-72 mt-4 relative">
                <div className="absolute inset-0 bg-indigo-500/5 blur-3xl rounded-full" />
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="75%" data={localResult.radarMetrics}>
                    <PolarGrid stroke={chartColors.grid} />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: chartColors.axis, fontSize: 9, fontWeight: 900 }} />
                    <Radar name="A" dataKey="A" stroke={chartColors.primary} fill={chartColors.primary} fillOpacity={0.2} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Content & Roadmap - Multi-layer Scrolling Content */}
            <div className="lg:col-span-8 space-y-8">
              <div className="glass-card p-10 md:p-14 rounded-[56px] relative overflow-hidden card-3d">
                <div className="flex justify-between items-center mb-8">
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Market Resonance Profile</h3>
                  <div className="flex items-center space-x-3">
                    <button 
                      onClick={() => setShowRefinementInput(showRefinementInput === 'summary' ? null : 'summary')}
                      className="px-5 py-2 bg-slate-100 dark:bg-slate-800 text-slate-500 text-[10px] font-black rounded-full uppercase tracking-[0.2em] border border-slate-200 dark:border-slate-700 hover:scale-105 transition-all"
                    >
                      Refine
                    </button>
                    <button 
                      onClick={() => setShowRefinedSummary(!showRefinedSummary)}
                      className="px-5 py-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 text-[10px] font-black rounded-full uppercase tracking-[0.2em] border border-indigo-100 dark:border-indigo-800 hover:scale-105 transition-all"
                    >
                      {showRefinedSummary ? 'Original' : 'AI Polished'}
                    </button>
                  </div>
                </div>

                <AnimatePresence>
                  {showRefinementInput === 'summary' && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }} 
                      animate={{ height: 'auto', opacity: 1 }} 
                      exit={{ height: 0, opacity: 0 }} 
                      className="mb-8 overflow-hidden"
                    >
                      <div className="p-8 bg-slate-50 dark:bg-slate-900/50 rounded-[32px] border border-slate-200 dark:border-slate-800 space-y-4 shadow-inner">
                        <textarea 
                          value={refinementPrompt}
                          onChange={(e) => setRefinementPrompt(e.target.value)}
                          placeholder="Example: 'Make it more persuasive' or 'Highlight my senior leadership impact'..."
                          className="w-full h-28 p-5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold outline-none focus:border-indigo-500 transition-all shadow-sm"
                        />
                        <button 
                          disabled={isRefining}
                          onClick={() => handleRefine('summary')}
                          className="w-full py-4 bg-indigo-600 text-white rounded-xl font-black text-[11px] uppercase tracking-[0.3em] disabled:opacity-50 shadow-xl glow-indigo"
                        >
                          {isRefining ? 'DECODING INSTRUCTIONS...' : 'EXECUTE RE-SYNTHESIS'}
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="relative group">
                   <div className="absolute -left-6 top-0 bottom-0 w-1 bg-indigo-600 rounded-full opacity-50 group-hover:opacity-100 transition-opacity" />
                   <p className="text-slate-600 dark:text-slate-400 font-medium leading-loose italic text-lg md:text-xl pl-4 py-2">
                    {showRefinedSummary ? localResult.refinedSummary : localResult.summary}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="glass-card p-10 rounded-[48px] card-3d">
                  <h4 className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.4em] mb-8 flex items-center">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full mr-3 animate-pulse" />
                    Asset Inventory
                  </h4>
                  <div className="flex flex-wrap gap-3">
                    {localResult.matchingSkills.map((s,i) => (
                      <motion.span 
                        key={i} 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.05 }}
                        className="px-4 py-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 text-[10px] font-black rounded-xl border border-emerald-100 dark:border-emerald-800/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors"
                      >
                        {s}
                      </motion.span>
                    ))}
                  </div>
                </div>
                <div className="glass-card p-10 rounded-[48px] card-3d">
                  <h4 className="text-[10px] font-black text-rose-500 uppercase tracking-[0.4em] mb-8 flex items-center">
                    <span className="w-2 h-2 bg-rose-500 rounded-full mr-3 animate-pulse" />
                    Structural Gaps
                  </h4>
                  <div className="flex flex-wrap gap-3">
                    {localResult.missingSkills.map((s,i) => (
                      <motion.span 
                        key={i} 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.05 }}
                        className="px-4 py-2 bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400 text-[10px] font-black rounded-xl border border-rose-100 dark:border-rose-800/50 hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-colors"
                      >
                        {s}
                      </motion.span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="glass-card p-12 rounded-[56px] bg-slate-900 text-white shadow-2xl overflow-hidden relative group card-3d">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-950 to-slate-900 opacity-50 group-hover:scale-110 transition-transform duration-1000" />
                <h3 className="text-2xl font-black mb-10 relative z-10 tracking-tighter uppercase">90-Day Trajectory Map</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative z-10">
                  {localResult.careerRoadmap.map((step, i) => (
                    <div key={i} className="relative group/step">
                      <div className="absolute -top-6 left-0 text-5xl font-black text-white/5 group-hover/step:text-indigo-500/10 transition-colors">{i+1}</div>
                      <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.5em]">{step.phase}</span>
                      <h5 className="font-bold text-lg mt-2 mb-3 leading-tight">{step.action}</h5>
                      <p className="text-xs text-slate-400 leading-relaxed font-medium">{step.impact}</p>
                      {i < 2 && <div className="hidden md:block absolute top-1/2 -right-6 w-12 h-[2px] bg-gradient-to-r from-slate-700 to-transparent" />}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'letter' && (
          <motion.div key="letter" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.98 }} className="px-4 max-w-5xl mx-auto">
            <div className="glass-card p-12 md:p-20 rounded-[64px] shadow-3xl relative overflow-hidden card-3d">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
                <div>
                  <h3 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-none">Cover Architect</h3>
                  <p className="text-slate-500 text-xs font-black uppercase tracking-[0.4em] mt-3">Synthesizing Narrative Alignment</p>
                </div>
                <button 
                  onClick={() => setShowRefinementInput(showRefinementInput === 'letter' ? null : 'letter')}
                  className="px-8 py-3 bg-indigo-600 text-white text-[10px] font-black rounded-full uppercase tracking-[0.3em] shadow-xl hover:scale-105 transition-all glow-indigo"
                >
                  Adjust Tone
                </button>
              </div>

              <AnimatePresence>
                {showRefinementInput === 'letter' && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }} 
                    animate={{ height: 'auto', opacity: 1 }} 
                    exit={{ height: 0, opacity: 0 }} 
                    className="mb-12 overflow-hidden"
                  >
                    <div className="p-10 bg-slate-50 dark:bg-slate-900/50 rounded-[40px] border border-slate-200 dark:border-slate-800 space-y-6 shadow-inner">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Adjustment Directives</p>
                      <textarea 
                        value={refinementPrompt}
                        onChange={(e) => setRefinementPrompt(e.target.value)}
                        placeholder="e.g. 'Make it more professional', 'Be more aggressive about my achievements', 'Focus on local proximity'..."
                        className="w-full h-28 p-6 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl text-sm font-bold outline-none focus:border-indigo-500 transition-all shadow-sm"
                      />
                      <div className="flex justify-end space-x-4">
                        <button onClick={() => setShowRefinementInput(null)} className="px-8 py-3 text-slate-400 text-[10px] font-black uppercase tracking-widest">Dismiss</button>
                        <button 
                          disabled={isRefining}
                          onClick={() => handleRefine('letter')}
                          className="px-12 py-3 bg-indigo-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg"
                        >
                          {isRefining ? 'SYNTHESIZING...' : 'COMMIT CHANGES'}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="prose prose-slate dark:prose-invert max-w-none relative">
                <div className="absolute -left-10 top-0 text-indigo-500 opacity-20">
                  <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 24 24"><path d="M14.017 21L14.017 18C14.017 16.8954 14.9124 16 16.017 16H19.017C19.5693 16 20.017 15.5523 20.017 15V9C20.017 8.44772 19.5693 8 19.017 8H16.017C14.9124 8 14.017 7.10457 14.017 6V3H21.017C22.1216 3 23.017 3.89543 23.017 5V15C23.017 18.3137 20.3307 21 17.017 21H14.017ZM1 21L1 18C1 16.8954 1.89543 16 3 16H6C6.55228 16 7 15.5523 7 15V9C7 8.44772 6.55228 8 6 8H3C1.89543 8 1 7.10457 1 6V3H8C9.10457 3 10 3.89543 10 5V15C10 18.3137 7.31371 21 4 21H1Z"/></svg>
                </div>
                <div className="whitespace-pre-wrap text-slate-600 dark:text-slate-400 font-medium leading-[2.2] text-base md:text-lg px-8 py-10 bg-slate-50/50 dark:bg-slate-900/30 rounded-[40px] border border-slate-100 dark:border-slate-800/50 shadow-inner min-h-[500px]">
                  {localResult.coverLetter}
                </div>
              </div>
              <div className="mt-16 flex justify-end">
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(localResult.coverLetter);
                    alert("Draft copied to neural buffer.");
                  }}
                  className="px-16 py-5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-[28px] font-black text-xs uppercase tracking-[0.3em] shadow-2xl hover:scale-105 transition-all"
                >
                  Export Draft
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'interview' && (
          <motion.div key="interview" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="grid grid-cols-1 md:grid-cols-3 gap-8 px-4">
            {localResult.interviewPrep.map((item, i) => (
              <div key={i} className="glass-card p-12 rounded-[56px] flex flex-col justify-between hover:border-indigo-500/50 transition-all cursor-default group card-3d relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-3xl -translate-y-1/2 translate-x-1/2" />
                <div>
                  <div className="w-16 h-16 bg-slate-900 dark:bg-indigo-600 text-white rounded-[24px] flex items-center justify-center font-black text-xl mb-10 shadow-2xl group-hover:rotate-12 transition-transform duration-500">
                    {i + 1}
                  </div>
                  <h4 className="text-xl font-black text-slate-900 dark:text-white mb-8 leading-tight group-hover:text-indigo-600 transition-colors tracking-tighter">"{item.question}"</h4>
                  <div className="space-y-6">
                    <div className="p-4 bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-slate-100 dark:border-slate-800">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] block mb-2">CRITICAL FOCUS</span>
                      <p className="text-xs text-slate-700 dark:text-slate-300 font-bold leading-relaxed">{item.focus}</p>
                    </div>
                    <div className="p-4 bg-indigo-50/30 dark:bg-indigo-900/10 rounded-2xl border border-indigo-100/50 dark:border-indigo-800/30">
                      <span className="text-[9px] font-black text-indigo-400 uppercase tracking-[0.3em] block mb-2">STRATEGIC ANGLE</span>
                      <p className="text-xs text-indigo-900 dark:text-indigo-200 font-bold leading-relaxed italic">{item.suggestedAngle}</p>
                    </div>
                  </div>
                </div>
                <div className="mt-12 pt-8 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Flash Engine v3.1</span>
                  <div className="flex space-x-1">
                    {[1,2,3].map(dot => <div key={dot} className="w-1 h-1 bg-indigo-500 rounded-full animate-pulse" style={{ animationDelay: `${dot*0.2}s` }} />)}
                  </div>
                </div>
              </div>
            ))}
          </motion.div>
        )}

        {activeTab === 'intel' && (
          <motion.div key="intel" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -30 }} className="px-4">
            <div className="glass-card p-14 md:p-24 rounded-[72px] max-w-5xl mx-auto flex flex-col items-center text-center relative overflow-hidden card-3d">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-600 to-transparent" />
              
              {!intelData ? (
                <div className="py-20 space-y-12">
                  <div className="relative">
                    <div className="absolute inset-0 bg-indigo-500/20 blur-[60px] rounded-full" />
                    <div className="w-24 h-24 bg-white dark:bg-slate-800 rounded-[32px] flex items-center justify-center mx-auto text-indigo-600 shadow-3xl relative z-10 animate-float">
                      <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter mb-4">Neural Market Grounding</h3>
                    <p className="text-slate-500 max-w-lg mx-auto text-lg font-medium leading-relaxed">Synthesizing real-time company intelligence through the Google search corpus for ultimate interview preparedness.</p>
                  </div>
                  <button 
                    disabled={isFetchingIntel}
                    onClick={handleFetchIntel}
                    className="group relative px-16 py-6 bg-slate-900 dark:bg-indigo-600 text-white rounded-[32px] font-black text-sm uppercase tracking-[0.4em] shadow-3xl transition-all hover:scale-105 active:scale-95 disabled:opacity-50 overflow-hidden"
                  >
                    <div className="absolute inset-0 w-1/4 h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-[400%] transition-transform duration-1000" />
                    {isFetchingIntel ? 'SYNCHRONIZING GROUNDING CHUNKS...' : 'INITIATE MARKET SCAN'}
                  </button>
                </div>
              ) : (
                <div className="text-left w-full space-y-12">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter leading-none">Intelligence Synthesis</h3>
                      <p className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.5em] mt-4 flex items-center">
                        <span className="w-2 h-2 bg-emerald-500 rounded-full mr-2 animate-ping" />
                        GROUNDING VERIFIED • LIVE STREAM
                      </p>
                    </div>
                    <button 
                      onClick={() => setIntelData(null)}
                      className="px-6 py-2 bg-slate-100 dark:bg-slate-800 text-slate-500 text-[10px] font-black rounded-full uppercase tracking-widest hover:text-indigo-600"
                    >
                      New Search
                    </button>
                  </div>
                  
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-10 md:p-14 bg-slate-50 dark:bg-slate-900/40 rounded-[56px] border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-medium leading-loose text-lg shadow-inner relative"
                  >
                    <div className="absolute -left-2 top-10 w-1 h-20 bg-emerald-500 rounded-full" />
                    <p className="whitespace-pre-wrap">{intelData.text}</p>
                  </motion.div>

                  {intelData.links.length > 0 && (
                    <div className="space-y-6">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.5em]">Source Attribution Matrix</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {intelData.links.map((link, i) => (
                          <motion.a 
                            key={i} 
                            href={link.uri} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="p-6 bg-white dark:bg-slate-800 rounded-[28px] border border-slate-100 dark:border-slate-700 hover:border-indigo-500 hover:shadow-2xl transition-all flex items-center justify-between group overflow-hidden"
                          >
                            <div className="flex flex-col">
                              <span className="text-[9px] font-black text-indigo-500 uppercase tracking-widest mb-1">NODE {i+1}</span>
                              <span className="text-sm font-black text-slate-700 dark:text-slate-200 truncate max-w-[280px]">{link.title || link.uri}</span>
                            </div>
                            <div className="w-10 h-10 bg-slate-50 dark:bg-slate-700 rounded-2xl flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all">
                              <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
                            </div>
                          </motion.a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default Dashboard;