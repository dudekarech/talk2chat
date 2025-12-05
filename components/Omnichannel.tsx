import React from 'react';
import { motion } from 'framer-motion';
import { Smartphone, Instagram, Facebook, Globe } from 'lucide-react';

export const Omnichannel: React.FC = () => {
  return (
    <section id="omnichannel" className="py-32 px-6 bg-slate-950 relative">
      <div className="max-w-7xl mx-auto flex flex-col items-center text-center relative z-10">
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-3xl md:text-5xl font-bold mb-8 leading-tight"
        >
          All conversations. <br className="md:hidden" /> <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 via-blue-500 to-purple-500">One unified inbox.</span>
        </motion.h2>
        
        <p className="text-slate-400 text-lg mb-16 max-w-2xl">
          Connect your customers' favorite channels. Whether they are on WhatsApp, Instagram, or your website, reply from one place.
        </p>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 w-full max-w-4xl">
           {[
             { icon: Smartphone, label: "WhatsApp", color: "text-green-500", bg: "bg-green-500/10", border: "border-green-500/20" },
             { icon: Instagram, label: "Instagram", color: "text-pink-500", bg: "bg-pink-500/10", border: "border-pink-500/20" },
             { icon: Facebook, label: "Messenger", color: "text-blue-500", bg: "bg-blue-500/10", border: "border-blue-500/20" },
             { icon: Globe, label: "Web Chat", color: "text-cyan-500", bg: "bg-cyan-500/10", border: "border-cyan-500/20" },
           ].map((item, i) => (
             <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ scale: 1.05 }}
                className={`p-6 rounded-2xl border ${item.border} ${item.bg} backdrop-blur-sm flex flex-col items-center gap-4 cursor-pointer`}
             >
                <item.icon size={40} className={item.color} />
                <span className="font-semibold text-white">{item.label}</span>
             </motion.div>
           ))}
        </div>

        <motion.div 
           initial={{ width: 0 }}
           whileInView={{ width: '80%' }}
           transition={{ duration: 1, delay: 0.5 }}
           className="h-px bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent mt-16"
        />
      </div>
    </section>
  );
};