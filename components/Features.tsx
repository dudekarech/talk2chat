import React from 'react';
import { motion, Variants } from 'framer-motion';
import { Layers, Code, MessageSquare, Bot, Palette, Eye, Sparkles, ArrowUpRight } from 'lucide-react';

const cardVariants: Variants = {
  offscreen: { opacity: 0, y: 30 },
  onscreen: (delay: number) => ({
    opacity: 1, 
    y: 0,
    transition: { 
      delay, 
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1] // Custom ease curve for premium feel
    }
  }),
  hover: {
    y: -5,
    transition: { duration: 0.3, ease: "easeOut" }
  }
};

const FeatureCard: React.FC<{ icon: any, title: string, desc: string, isNew?: boolean, delay: number }> = ({ icon: Icon, title, desc, isNew, delay }) => (
  <motion.div 
    custom={delay}
    initial="offscreen"
    whileInView="onscreen"
    whileHover="hover"
    viewport={{ once: true, margin: "-50px" }}
    variants={cardVariants}
    className="group relative p-8 rounded-3xl border border-white/5 bg-slate-900/40 backdrop-blur-sm hover:bg-slate-800/60 transition-all duration-300 overflow-hidden shadow-xl"
  >
    {/* Inner Highlight Glow */}
    <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-brand-purple/10 rounded-full blur-[80px] -mr-20 -mt-20 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
    
    {/* Border Gradient on Hover */}
    <div className="absolute inset-0 rounded-3xl ring-1 ring-inset ring-transparent group-hover:ring-white/10 transition-all duration-300 pointer-events-none" />

    {isNew && (
      <div className="absolute top-6 right-6 z-20">
          <span className="text-[10px] font-bold bg-brand-orange/10 text-brand-orange border border-brand-orange/20 px-3 py-1 rounded-full flex items-center gap-1.5 shadow-sm">
            <Sparkles size={10} /> NEW
          </span>
      </div>
    )}
    
    <div className="relative z-10 flex flex-col h-full">
      <div className="w-12 h-12 rounded-xl bg-slate-800/50 border border-white/10 flex items-center justify-center mb-6 text-slate-300 group-hover:text-white group-hover:bg-brand-purple/20 group-hover:border-brand-purple/30 transition-all duration-300 shadow-inner">
        <Icon size={24} strokeWidth={1.5} />
      </div>
      
      <div className="flex items-start justify-between mb-3">
        <h3 className="text-xl font-bold text-slate-100 tracking-tight group-hover:text-white transition-colors">
            {title}
        </h3>
        <ArrowUpRight size={18} className="text-slate-600 opacity-0 -translate-x-2 translate-y-2 group-hover:opacity-100 group-hover:translate-x-0 group-hover:translate-y-0 transition-all duration-300" />
      </div>

      <p className="text-slate-400 text-sm leading-relaxed group-hover:text-slate-300 transition-colors">
        {desc}
      </p>
    </div>
  </motion.div>
);

export const Features: React.FC = () => {
  return (
    <section id="features" className="py-32 px-6 relative z-10">
        {/* Subtle Background Mesh */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900/50 via-slate-950 to-slate-950 pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center justify-center px-3 py-1 rounded-full border border-slate-800 bg-slate-900/50 backdrop-blur-md mb-6">
                <span className="text-xs font-semibold text-slate-300 tracking-wide uppercase">Power & Performance</span>
            </div>
            <h2 className="text-4xl md:text-6xl font-bold mb-6 text-white tracking-tight leading-tight">
              Engineered for <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-orange to-red-500">Scale</span>
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto text-lg md:text-xl font-light leading-relaxed">
              Everything you need to manage customer conversations professionally, wrapped in an interface your team will love.
            </p>
          </motion.div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <FeatureCard 
            icon={Layers} 
            title="Multi-Tenant Architecture" 
            desc="Built for agencies. Manage unlimited workspaces and clients from one single, powerful dashboard." 
            delay={0.1}
          />
          <FeatureCard 
            icon={Code} 
            title="Smart Embed Generator" 
            desc="Get a lightweight, non-blocking JS snippet that works on any website, CMS, or custom app." 
            delay={0.2}
          />
          <FeatureCard 
            icon={MessageSquare} 
            title="Unified Inbox" 
            desc="Streamline support. Manage Web, WhatsApp, and Instagram chats in one seamless view." 
            delay={0.3}
          />
          <FeatureCard 
            icon={Bot} 
            title="AI Auto-Responder" 
            desc="Train AI agents on your own knowledge base documents to handle L1 support automatically 24/7." 
            delay={0.4}
          />
          <FeatureCard 
            icon={Palette} 
            title="Deep Customization" 
            desc="Style the widget to match your brand identity exactly. Custom colors, icons, shapes, and positions." 
            delay={0.5}
          />
          <FeatureCard 
            icon={Eye} 
            title="Live Page Monitoring" 
            desc="See exactly what visitors are browsing and what they are typing in real-time before they hit send." 
            isNew={true}
            delay={0.6}
          />
        </div>
      </div>
    </section>
  );
};