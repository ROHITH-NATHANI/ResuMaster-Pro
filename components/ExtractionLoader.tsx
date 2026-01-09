import React from 'react';
import { motion } from 'framer-motion';

interface ExtractionLoaderProps {
    step: string;
}

const ExtractionLoader: React.FC<ExtractionLoaderProps> = ({ step }) => {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.95, filter: "blur(10px)" }}
            transition={{ duration: 0.4 }}
            className="absolute inset-0 z-50 rounded-[inherit] bg-white/60 dark:bg-slate-950/60 backdrop-blur-xl flex flex-col items-center justify-center p-6 border border-white/20 dark:border-slate-800/50"
        >
            <div className="relative w-32 h-32 mb-8 flex items-center justify-center">
                {/* Outer Rotating Ring */}
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-full"
                />

                {/* Counter-Rotating Inner Ring */}
                <motion.div
                    animate={{ rotate: -360 }}
                    transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-2 border-2 border-dashed border-indigo-200 dark:border-indigo-900/40 rounded-full"
                />

                {/* Pulsing Core */}
                <motion.div
                    animate={{ scale: [1, 1.1, 1], opacity: [0.8, 1, 0.8] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute inset-8 bg-indigo-500/10 dark:bg-indigo-500/20 rounded-full blur-xl"
                />

                {/* Center Hexagon Logic */}
                <div className="relative z-10 text-indigo-600 dark:text-indigo-400">
                    <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24">
                        <motion.path
                            d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            initial={{ pathLength: 0, opacity: 0 }}
                            animate={{ pathLength: 1, opacity: 1 }}
                            transition={{ duration: 1.5, repeat: Infinity, repeatType: "loop" }}
                        />
                    </svg>
                </div>

                {/* Orbiting Particles */}
                {[0, 1, 2].map((i) => (
                    <motion.div
                        key={i}
                        className="absolute w-1.5 h-1.5 bg-indigo-500 rounded-full shadow-[0_0_10px_rgba(99,102,241,0.8)]"
                        animate={{ rotate: 360 }}
                        transition={{
                            duration: 3,
                            repeat: Infinity,
                            ease: "linear",
                            delay: i * 0.5,
                        }}
                        style={{
                            translateX: 50, // Orbit radius
                            originX: "-50px" // Center of rotation relative to particle start
                            // Note: framer motion originX handles the pivot point
                        }}
                    />
                ))}
            </div>

            <div className="text-center space-y-3">
                <motion.div
                    key={step}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="relative overflow-hidden"
                >
                    <span className="text-sm md:text-base font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-[0.2em] relative z-10 bg-clip-text">
                        {step}
                    </span>
                    <motion.div
                        className="absolute bottom-0 left-0 h-[2px] bg-indigo-500/30 w-full"
                        initial={{ x: "-100%" }}
                        animate={{ x: "100%" }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                    />
                </motion.div>

                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest animate-pulse">
                    Neural Handshake Active
                </p>
            </div>
        </motion.div>
    );
};

export default ExtractionLoader;
