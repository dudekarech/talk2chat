import React from "react";
import { motion } from "framer-motion";
import { Palette, Check, MessageSquare, Paintbrush, Sliders } from "lucide-react";

export const Customization: React.FC = () => {
  return (
    <section id="customization" className="py-32 px-6 relative overflow-hidden bg-slate-950 border-t border-slate-900">
      {/* Background radial highlight */}
      <div className="absolute top-1/2 left-0 -translate-y-1/2 w-[500px] h-[500px] bg-brand-orange/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-20 items-center">

        {/* Left mockup - Enhanced */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="order-2 md:order-1 relative perspective-1000"
        >
          {/* Glass Card Container - High Fidelity */}
          <div className="rounded-[2.5rem] border border-white/5 bg-gradient-to-b from-slate-900/60 to-slate-900/90 backdrop-blur-2xl shadow-2xl p-3 relative z-10 ring-1 ring-white/5 transform transition-transform hover:scale-[1.01] duration-500">
              
              {/* Inner Content Area */}
              <div className="bg-[#0B0F19] rounded-[2rem] aspect-[4/3] relative overflow-hidden border border-slate-800 shadow-inner group">
                {/* Dot Grid Pattern */}
                <div className="absolute inset-0 opacity-20" 
                     style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.1) 1px, transparent 0)', backgroundSize: '32px 32px' }}>
                </div>
                
                {/* Mock UI Interface (Abstract) */}
                <div className="absolute top-8 left-8 right-8 space-y-4 opacity-20">
                    <div className="h-32 rounded-xl bg-slate-800 w-full mb-8 border border-slate-700"></div>
                    <div className="space-y-3">
                        <div className="h-4 w-3/4 bg-slate-800 rounded"></div>
                        <div className="h-4 w-1/2 bg-slate-800 rounded"></div>
                    </div>
                </div>

                {/* Simulated Floating Widget */}
                <div className="absolute bottom-10 right-10 z-20 group/widget">
                  {/* Pulse Effect */}
                  <div className="absolute inset-0 bg-brand-orange/20 rounded-[2rem] animate-ping opacity-75 duration-1000"></div>
                  
                  <div className="relative bg-brand-orange w-[4.5rem] h-[4.5rem] rounded-[1.8rem] flex items-center justify-center shadow-[0_20px_50px_-12px_rgba(249,115,22,0.5)] cursor-pointer hover:scale-110 hover:-rotate-2 transition-all duration-300 border-2 border-white/10 ring-4 ring-slate-950">
                    <MessageSquare size={32} className="text-white fill-current" strokeWidth={2.5} />
                  </div>
                  
                  {/* Tooltip Popup */}
                  <div className="absolute right-full mr-5 top-1/2 -translate-y-1/2 bg-white text-slate-900 text-sm font-bold px-4 py-2 rounded-xl opacity-0 translate-x-4 group-hover/widget:opacity-100 group-hover/widget:translate-x-0 transition-all duration-300 shadow-xl whitespace-nowrap">
                      👋 Chat with us
                      <div className="absolute top-1/2 right-[-6px] -translate-y-1/2 w-3 h-3 bg-white rotate-45 rounded-[1px]"></div>
                  </div>
                </div>

                {/* Floating Palette Controls - Enhanced Glass */}
                <motion.div
                  animate={{ y: [0, 8, 0] }}
                  transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute top-10 left-10 bg-slate-900/70 p-5 rounded-2xl border border-white/10 shadow-2xl backdrop-blur-xl z-20 min-w-[200px]"
                >
                  <div className="flex items-center justify-between mb-5 border-b border-white/5 pb-3">
                     <div className="text-[10px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                        <Paintbrush size={12} className="text-brand-orange" /> Appearance
                     </div>
                     <Sliders size={12} className="text-slate-500" />
                  </div>

                  <div className="grid grid-cols-4 gap-3 mb-5">
                    <div className="w-9 h-9 rounded-full bg-brand-orange cursor-pointer ring-2 ring-white shadow-lg shadow-orange-500/30 scale-110"></div>
                    <div className="w-9 h-9 rounded-full bg-brand-purple cursor-pointer ring-1 ring-white/5 hover:ring-white/30 hover:scale-105 transition-all bg-gradient-to-br from-purple-500 to-purple-700"></div>
                    <div className="w-9 h-9 rounded-full bg-blue-500 cursor-pointer ring-1 ring-white/5 hover:ring-white/30 hover:scale-105 transition-all bg-gradient-to-br from-blue-400 to-blue-600"></div>
                    <div className="w-9 h-9 rounded-full bg-emerald-500 cursor-pointer ring-1 ring-white/5 hover:ring-white/30 hover:scale-105 transition-all bg-gradient-to-br from-emerald-400 to-emerald-600"></div>
                  </div>
                  
                  <div className="space-y-2">
                      <div className="flex justify-between text-[10px] text-slate-500 font-medium">
                          <span>Corner Radius</span>
                          <span>24px</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full w-2/3 bg-slate-500 rounded-full"></div>
                      </div>
                  </div>
                </motion.div>
              </div>
          </div>
        </motion.div>

        {/* Right text section */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="order-1 md:order-2"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-300 text-xs mb-8 font-medium shadow-sm">
            <Palette size={12} className="text-brand-orange" /> Design System
          </div>

          <h2 className="text-4xl md:text-5xl font-bold mb-8 text-white leading-tight tracking-tight">
            Match Your Brand <br />
            <span className="text-brand-orange decoration-brand-orange/30 underline decoration-2 underline-offset-4">Pixel Perfect.</span>
          </h2>

          <p className="text-slate-400 text-lg mb-10 leading-relaxed font-light">
            Don't settle for a generic chat widget. TalkChat Studio gives you
            full control — colors, icons, typography, and behavior, ensuring a seamless experience that feels native to your product.
          </p>

          <ul className="space-y-5">
            {[
              "Custom Launcher Icons & Avatars",
              "Dark & Light Mode Toggle",
              "Positioning (Left/Right)",
              "Custom CSS Injection for Developers",
            ].map((item, i) => (
              <li key={i} className="flex items-center gap-4 text-slate-300 group">
                <div className="p-1.5 rounded-full bg-brand-purple/10 text-brand-purple border border-brand-purple/20 group-hover:bg-brand-purple group-hover:text-white transition-colors duration-300 shadow-sm">
                  <Check size={12} strokeWidth={3} />
                </div>
                <span className="font-medium group-hover:text-white transition-colors">{item}</span>
              </li>
            ))}
          </ul>
        </motion.div>
      </div>
    </section>
  );
};