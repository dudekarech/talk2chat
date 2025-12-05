
import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Play, Activity, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { BrandLogo } from './Navbar';

export const Hero: React.FC = () => {
  const navigate = useNavigate();

  return (
    <section className="relative z-10 pt-40 pb-20 px-6 overflow-hidden min-h-[90vh] flex items-center">
      <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
        
        {/* Left Content */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-left relative z-20"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900/80 border border-brand-orange/20 text-brand-orange text-xs font-bold tracking-wide uppercase mb-8 shadow-lg shadow-orange-900/10 backdrop-blur-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
            </span>
            Enterprise-Grade AI Support
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 leading-[1.1] text-white">
            Transform Your <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-orange via-orange-400 to-purple-500 animate-gradient-x">
              Customer Chat.
            </span>
          </h1>
          
          <p className="text-lg text-slate-400 max-w-xl mb-10 leading-relaxed font-medium">
            The multi-tenant, omnichannel chat widget designed for modern SaaS. 
            Embed AI agents, track visitor intent, and support customers 24/7.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 mb-10">
            <button 
              onClick={() => navigate('/signup')} 
              className="px-8 py-4 bg-gradient-to-r from-brand-orange to-orange-600 rounded-full text-white font-bold shadow-xl shadow-orange-500/20 hover:shadow-orange-500/40 hover:scale-105 transition-all flex items-center justify-center gap-2 group"
            >
              Start Free Trial <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </button>
            <button 
              onClick={() => navigate('/login')} 
              className="px-8 py-4 bg-slate-800/40 border border-white/10 rounded-full text-white font-semibold hover:bg-slate-800/60 transition-all flex items-center justify-center gap-2 backdrop-blur-md hover:border-white/20"
            >
              <Play size={18} fill="currentColor" className="text-brand-orange" /> View Demo
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-sm text-slate-500 font-medium">
            <div className="flex items-center gap-2">
                <ShieldCheck size={18} className="text-green-500" /> 
                <span>SOC2 Compliant</span>
            </div>
            <div className="flex items-center gap-2">
                <Activity size={18} className="text-brand-orange" /> 
                <span>99.99% Uptime</span>
            </div>
            <div className="flex items-center gap-2">
                <CheckCircle2 size={18} className="text-purple-500" /> 
                <span>No Credit Card</span>
            </div>
          </div>
        </motion.div>

        {/* Right Content - 3D Mockup */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="relative hidden lg:block perspective-1000"
        >
          {/* Ambient Glows aligned with Brand Colors */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-brand-purple/30 to-brand-orange/20 blur-[100px] rounded-full -z-10" />

          {/* Floating Widget Card */}
          <motion.div 
            animate={{ y: [0, -15, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="w-[400px] mx-auto bg-slate-950/80 border border-slate-800/60 rounded-[2rem] p-5 shadow-2xl backdrop-blur-xl relative z-10"
          >
            {/* Header */}
            <div className="flex items-center gap-4 mb-8 p-4 bg-slate-900/90 rounded-2xl border border-white/5 shadow-inner">
              <div className="relative">
                 {/* Replaced Generic Icon with Brand Logo */}
                 <div className="bg-white/5 rounded-full p-1 border border-white/10 shadow-lg">
                    <BrandLogo size={48} />
                 </div>
                 <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-[3px] border-slate-900 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
              </div>
              <div>
                <h3 className="font-bold text-white text-lg tracking-tight">TalkChat Support</h3>
                <p className="text-xs text-brand-orange font-medium flex items-center gap-1.5 uppercase tracking-wide">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-orange opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-orange"></span>
                    </span>
                    Online now
                </p>
              </div>
            </div>

            {/* Chat Area */}
            <div className="space-y-5 mb-6 px-1">
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-slate-900/80 p-4 rounded-2xl rounded-tl-none text-sm text-slate-200 border border-white/5 shadow-sm max-w-[90%] leading-relaxed"
              >
                Hi there! 👋 Welcome to TalkChat. I can help you set up your widget or answer pricing questions.
              </motion.div>
              
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.5 }}
                className="bg-gradient-to-br from-brand-orange to-orange-600 p-4 rounded-2xl rounded-tr-none text-sm text-white ml-auto max-w-[85%] shadow-lg shadow-orange-500/10 font-medium leading-relaxed"
              >
                Can I customize the colors to match my brand?
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 2.5 }}
                className="bg-slate-900/80 p-4 rounded-2xl rounded-tl-none text-sm text-slate-200 border border-white/5 shadow-sm max-w-[90%] leading-relaxed"
              >
                Absolutely! You can change the colors, icons, and even the shape.
              </motion.div>
            </div>

             {/* Input Area Mock */}
            <div className="mt-4 p-2.5 bg-slate-900 rounded-2xl border border-slate-800 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center text-slate-500 hover:text-white transition-colors cursor-pointer">
                    <span className="text-xl leading-none">+</span>
                </div>
                <div className="h-2 w-32 bg-slate-800/50 rounded-full"></div>
                <div className="ml-auto w-9 h-9 rounded-xl bg-brand-orange text-white flex items-center justify-center shadow-lg shadow-orange-500/20">
                    <ArrowRight size={16} />
                </div>
            </div>
            
            {/* Floating Stats Badge */}
            <motion.div 
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 4, repeat: Infinity, delay: 1 }}
              className="absolute -right-10 top-32 bg-white/95 backdrop-blur p-4 rounded-2xl border border-white/20 shadow-2xl z-20 max-w-[160px]"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-purple-100 rounded-xl text-brand-purple">
                  <Activity size={20} />
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Satisfaction</div>
                  <div className="text-lg font-bold text-slate-900">98% <span className="text-green-500 text-sm">▲</span></div>
                </div>
              </div>
            </motion.div>

          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};
