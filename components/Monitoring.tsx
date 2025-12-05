import React from 'react';
import { motion } from 'framer-motion';
import { Eye, MousePointer, Activity, Lock, ChevronLeft, ChevronRight, RotateCw } from 'lucide-react';

export const Monitoring: React.FC = () => {
  return (
    <section id="monitoring" className="py-24 px-6 bg-slate-950 relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_50%,rgba(139,92,246,0.08),transparent_50%)]" />
      
      <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-20 items-center relative z-10">
        <motion.div 
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
           <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-semibold mb-8">
              <Eye size={14} /> Visitor Intelligence
           </div>
           <h2 className="text-4xl md:text-5xl font-bold mb-8 leading-tight tracking-tight text-white">
              Read their minds <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-400">before they click.</span>
           </h2>
           <p className="text-slate-400 text-lg mb-10 leading-relaxed font-light border-l-2 border-slate-800 pl-6">
              Watch visitors move through your site in real-time. See their cursor movements, 
              identify rage clicks, and even <span className="text-white font-medium">preview what they are typing</span> in the chat box before they hit send.
           </p>
           
           <ul className="space-y-6">
              {[
                { label: 'Real-time Typing Preview', desc: 'See messages as they are typed' },
                { label: 'Live Cursor Tracking', desc: 'Visualise user attention flow' },
                { label: 'Active Page Duration', desc: 'Measure engagement accurately' },
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-4 text-slate-300">
                   <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-purple-400 mt-0.5">
                     <Activity size={16} />
                   </div>
                   <div>
                       <span className="block text-sm font-bold text-white mb-0.5">{item.label}</span>
                       <span className="block text-xs text-slate-500">{item.desc}</span>
                   </div>
                </li>
              ))}
           </ul>
        </motion.div>

        {/* Monitoring Visual */}
        <motion.div 
           initial={{ opacity: 0, scale: 0.95, y: 20 }}
           whileInView={{ opacity: 1, scale: 1, y: 0 }}
           viewport={{ once: true }}
           transition={{ duration: 0.8 }}
           className="relative"
        >
           {/* Browser Window Frame - High Fidelity */}
           <div className="rounded-xl border border-white/10 bg-slate-900/80 backdrop-blur-xl shadow-2xl overflow-hidden relative z-10 ring-1 ring-black/50">
              
              {/* Browser Header */}
              <div className="h-10 bg-slate-950/50 border-b border-white/5 flex items-center px-4 gap-4 backdrop-blur-md">
                  <div className="flex gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-[#FF5F57] hover:brightness-110 transition-all"></div>
                      <div className="w-2.5 h-2.5 rounded-full bg-[#FEBC2E] hover:brightness-110 transition-all"></div>
                      <div className="w-2.5 h-2.5 rounded-full bg-[#28C840] hover:brightness-110 transition-all"></div>
                  </div>
                  
                  <div className="flex text-slate-600 gap-2 ml-2">
                     <ChevronLeft size={14} />
                     <ChevronRight size={14} />
                     <RotateCw size={12} />
                  </div>

                  {/* Address Bar */}
                  <div className="flex-1 max-w-sm mx-auto">
                    <div className="h-6 bg-slate-900 rounded flex items-center px-3 text-[10px] text-slate-500 gap-2 border border-white/5 text-center justify-center shadow-inner group cursor-default hover:bg-slate-800 transition-colors">
                        <Lock size={8} className="text-green-500/80" />
                        <span className="text-slate-400 group-hover:text-slate-300">talkchat.studio</span>
                        <span className="text-slate-600">/pricing</span>
                    </div>
                  </div>
              </div>

              {/* Viewport Content */}
              <div className="relative h-[380px] bg-[#0F1117] overflow-hidden">
                 {/* Mock Website Grid Background */}
                 <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:64px_64px]" />
                 <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#0F1117]" />

                 {/* Mock Website Content - Skeleton */}
                 <div className="p-10 space-y-10 opacity-60 max-w-lg mx-auto mt-8 filter blur-[0.5px]">
                    <div className="flex justify-between items-center">
                        <div className="h-8 w-24 bg-slate-800 rounded-lg"></div>
                        <div className="flex gap-4">
                            <div className="h-4 w-16 bg-slate-800/50 rounded-md"></div>
                            <div className="h-4 w-16 bg-slate-800/50 rounded-md"></div>
                        </div>
                    </div>
                    
                    <div className="space-y-4">
                        <div className="h-10 w-3/4 bg-slate-800 rounded-lg"></div>
                        <div className="h-4 w-1/2 bg-slate-800/50 rounded-md"></div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-6 pt-4">
                       <div className="h-40 bg-slate-800/30 rounded-xl border border-white/5"></div>
                       <div className="h-40 bg-slate-800/30 rounded-xl border border-white/5"></div>
                    </div>
                 </div>

                 {/* Simulated Cursor */}
                 <motion.div 
                    animate={{ 
                       x: [50, 180, 140, 260, 100], 
                       y: [60, 120, 280, 240, 60] 
                    }}
                    transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute top-0 left-0 z-20 pointer-events-none"
                 >
                    <div className="relative">
                        <MousePointer fill="#A855F7" className="text-slate-950 drop-shadow-xl" size={20} strokeWidth={1} />
                        <div className="absolute top-5 left-4 bg-purple-600/90 backdrop-blur-md text-white text-[10px] font-bold px-2 py-1 rounded shadow-lg whitespace-nowrap border border-white/10">
                           Visitor #4922
                        </div>
                    </div>
                 </motion.div>

                 {/* Typing Preview Modal - Enhanced Glass */}
                 <motion.div 
                    initial={{ y: 20, opacity: 0 }}
                    whileInView={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.8, duration: 0.6 }}
                    className="absolute bottom-6 right-6 left-6 bg-slate-900/60 backdrop-blur-xl p-5 rounded-2xl border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] z-30"
                 >
                    <div className="flex justify-between items-center mb-3">
                       <div className="flex items-center gap-2.5">
                           <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                            </span>
                           <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Live Keystrokes</span>
                       </div>
                       <span className="text-[10px] text-slate-500 font-mono bg-black/20 px-1.5 py-0.5 rounded">Just now</span>
                    </div>
                    <div className="relative">
                        <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-purple-500 rounded-full"></div>
                        <p className="text-white text-sm font-medium pl-4 leading-relaxed font-mono opacity-90">
                           "Does the enterprise plan include custom..." <span className="inline-block w-2 h-4 bg-purple-500 align-middle ml-0.5 animate-pulse rounded-[1px]"></span>
                        </p>
                    </div>
                 </motion.div>
              </div>
           </div>
           
           {/* Decor Glows */}
           <div className="absolute -top-20 -right-20 w-80 h-80 bg-purple-600/10 blur-[120px] rounded-full pointer-events-none" />
           <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-blue-600/10 blur-[120px] rounded-full pointer-events-none" />
        </motion.div>
      </div>
    </section>
  );
};