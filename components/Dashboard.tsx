
import React from 'react';
import { 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell 
} from 'recharts';
import { motion, Variants } from 'framer-motion';
import { AnalysisResult } from '../types';

interface DashboardProps {
  result: AnalysisResult;
  onReset: () => void;
  isDarkMode?: boolean;
}

const Dashboard: React.FC<DashboardProps> = ({ result, onReset, isDarkMode = false }) => {
  // Use Variants type and 'as const' to fix TS inference issues with 'ease' property
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { 
        staggerChildren: 0.15, 
        ease: "easeOut" as const 
      }
    }
  };

  // Explicitly typing variants ensures compatibility with motion components
  const itemVariants: Variants = {
    hidden: { y: 30, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.5 } }
  };

  const chartColors = {
    grid: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : '#e2e8f0',
    axis: isDarkMode ? '#64748b' : '#64748b',
    primary: '#6366f1',
    secondary: '#a855f7',
    bg: isDarkMode ? '#0f172a' : '#ffffff',
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-10 max-w-7xl mx-auto pb-20"
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12">
        <div>
          <motion.div 
             initial={{ scale: 0.8, opacity: 0 }}
             animate={{ scale: 1, opacity: 1 }}
             className="inline-block px-4 py-1.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-full text-[10px] font-black tracking-[0.2em] mb-4 uppercase border border-indigo-100 dark:border-indigo-800/50"
          >
            Match Report Generated
          </motion.div>
          <h2 className="text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">Career Insight <span className="text-indigo-600 dark:text-indigo-400">Analysis.</span></h2>
          <p className="text-lg text-slate-500 dark:text-slate-400 font-medium max-w-2xl mt-2">A multi-layered evaluation of your professional profile against target market requirements.</p>
        </div>
        <motion.button 
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
          onClick={onReset}
          className="px-8 py-4 bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800 rounded-[24px] font-black text-sm shadow-xl hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-all flex items-center glow-indigo"
        >
          <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4"></path></svg>
          RESET ENGINE
        </motion.button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Score & Radar */}
        <motion.div variants={itemVariants} className="lg:col-span-4 glass-card p-10 rounded-[48px] flex flex-col items-center justify-between text-center min-h-[500px]">
          <div className="w-full">
            <h3 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em] mb-10">Consolidated Ranking</h3>
            <div className="relative mb-12 inline-block">
              <svg className="w-56 h-56 transform -rotate-90">
                <circle cx="112" cy="112" r="102" stroke={isDarkMode ? "rgba(255,255,255,0.05)" : "#f1f5f9"} strokeWidth="14" fill="transparent" />
                <motion.circle 
                  initial={{ strokeDashoffset: 640 }}
                  animate={{ strokeDashoffset: 640 * (1 - result.atsScore / 100) }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                  cx="112" cy="112" r="102" stroke="url(#scoreGradient)" strokeWidth="14" fill="transparent"
                  strokeDasharray={640}
                  strokeLinecap="round"
                />
                <defs>
                  <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#6366f1" />
                    <stop offset="100%" stopColor="#a855f7" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-7xl font-black text-slate-900 dark:text-white leading-none">{result.atsScore}</span>
                <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 tracking-[0.4em] uppercase mt-2">ATS Index</span>
              </div>
            </div>
          </div>

          <div className="w-full h-64 mt-auto">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="75%" data={result.radarMetrics}>
                <PolarGrid stroke={chartColors.grid} />
                <PolarAngleAxis dataKey="subject" tick={{ fill: chartColors.axis, fontSize: 10, fontWeight: 800 }} />
                <Radar 
                  name="Candidate" 
                  dataKey="A" 
                  stroke={chartColors.primary} 
                  fill={chartColors.primary} 
                  fillOpacity={0.3} 
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Detailed Breakdown */}
        <motion.div variants={itemVariants} className="lg:col-span-8 space-y-8">
          <div className="glass-card p-12 rounded-[48px]">
            <div className="flex justify-between items-center mb-10">
              <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Weighted Components</h3>
              <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/40 px-3 py-1 rounded-full uppercase tracking-widest">Statistical View</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
              {[
                { label: 'Core Skills', val: result.breakdown.skills, color: 'bg-indigo-500', weight: '40%' },
                { label: 'Keywords', val: result.breakdown.keywords, color: 'bg-violet-500', weight: '25%' },
                { label: 'Relevance', val: result.breakdown.experience, color: 'bg-blue-500', weight: '20%' },
                { label: 'Format', val: result.breakdown.format, color: 'bg-emerald-500', weight: '10%' },
                { label: 'Grammar', val: result.breakdown.grammar, color: 'bg-rose-500', weight: '5%' }
              ].map((item, i) => (
                <div key={i} className="flex flex-col items-center p-6 rounded-[32px] bg-slate-50/50 dark:bg-slate-900/50 border border-transparent hover:border-indigo-500/20 transition-all group">
                  <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3 text-center leading-none h-4 group-hover:text-indigo-600 transition-colors">{item.label}</span>
                  <span className="text-3xl font-black text-slate-900 dark:text-white mb-4">{item.val}%</span>
                  <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden shadow-inner">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${item.val}%` }}
                      transition={{ duration: 1, delay: i * 0.1 }}
                      className={`h-full ${item.color} shadow-lg`}
                    />
                  </div>
                  <span className="text-[9px] font-black text-slate-400 dark:text-slate-600 mt-3 uppercase tracking-widest">WEIGHT: {item.weight}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="glass-card p-10 rounded-[48px]">
              <div className="flex items-center space-x-3 mb-8">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Strength Profile</h4>
              </div>
              <div className="flex flex-wrap gap-3">
                {result.matchingSkills.map((s, i) => (
                  <motion.span 
                    key={i} 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: i * 0.05 }}
                    className="px-4 py-2 bg-emerald-50/50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 text-xs font-black rounded-2xl border border-emerald-100/50 dark:border-emerald-800/50 shadow-sm"
                  >
                    {s}
                  </motion.span>
                ))}
              </div>
            </div>
            <div className="glass-card p-10 rounded-[48px]">
              <div className="flex items-center space-x-3 mb-8">
                <div className="w-10 h-10 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                </div>
                <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Identified Gaps</h4>
              </div>
              <div className="flex flex-wrap gap-3">
                {result.missingSkills.map((s, i) => (
                  <motion.span 
                    key={i} 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: i * 0.05 }}
                    className="px-4 py-2 bg-rose-50/50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400 text-xs font-black rounded-2xl border border-rose-100/50 dark:border-rose-800/50 shadow-sm"
                  >
                    {s}
                  </motion.span>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recommendations */}
        <motion.div variants={itemVariants} className="lg:col-span-2 glass-card p-12 rounded-[50px]">
          <h3 className="text-3xl font-black text-slate-900 dark:text-white mb-10 tracking-tight">Strategic Optimization <span className="text-indigo-600 dark:text-indigo-400">Path.</span></h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {result.recommendations.map((rec, i) => (
              <motion.div 
                key={i} 
                whileHover={{ x: 5 }}
                className="flex items-start p-6 rounded-[32px] bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/50 group"
              >
                <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black text-lg mr-6 shadow-xl glow-indigo group-hover:rotate-12 transition-all">
                  {i + 1}
                </div>
                <p className="text-slate-600 dark:text-slate-400 text-sm font-bold leading-relaxed pt-1">{rec}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Career Matching */}
        <motion.div variants={itemVariants} className="bg-slate-900 dark:bg-black p-12 rounded-[50px] text-white relative overflow-hidden shadow-3xl">
          <div className="absolute top-0 right-0 -mr-10 -mt-10 opacity-10 animate-pulse">
            <svg className="w-56 h-56" fill="currentColor" viewBox="0 0 24 24"><path d="M21 16.5c0 .38-.21.71-.53.88l-7.97 4.44c-.31.17-.66.17-.97 0l-7.97-4.44c-.31-.17-.53-.5-.53-.88v-9c0-.38.21-.71.53-.88l7.97-4.44c.31-.17.66-.17.97 0l7.97 4.44c.31.17.53.5.53.88v9z"/></svg>
          </div>
          <div className="relative z-10">
            <h3 className="text-2xl font-black mb-1 tracking-tight">Market Fit</h3>
            <p className="text-slate-500 text-xs font-black uppercase tracking-widest mb-10 italic">NLP Predicted Roles</p>
            <div className="space-y-4">
              {result.suggestedJobRoles.map((role, i) => (
                <motion.div 
                  key={i} 
                  whileHover={{ scale: 1.05, x: 5 }}
                  className="p-6 bg-white/5 border border-white/10 rounded-[32px] hover:bg-white/10 hover:border-indigo-500/50 transition-all cursor-default group"
                >
                  <span className="text-indigo-400 font-black block text-[10px] uppercase tracking-[0.3em] mb-2 group-hover:text-white transition-colors">RANKED MATCH #{i+1}</span>
                  <span className="font-extrabold text-lg block">{role}</span>
                </motion.div>
              ))}
            </div>
            
            <div className="mt-12 pt-8 border-t border-white/5 text-center">
               <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest leading-loose">Analysis completed using <br/> Gemini Neural Engine Cluster</p>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default Dashboard;
