import React from 'react';
import { Twitter, Github, Linkedin, Youtube, Heart, ArrowRight } from 'lucide-react';
import { BrandLogo } from './Navbar';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-950 border-t border-white/5 pt-20 pb-10 relative overflow-hidden z-10">
      {/* Top Gradient Border */}
      <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-brand-purple/50 to-transparent opacity-70" />
      
      {/* Background Glow */}
      <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] bg-brand-purple/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-12 mb-16">
          
          {/* Brand Column */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center gap-3">
               <BrandLogo size={36} />
               <span className="text-xl font-bold text-white tracking-tight">talkchat studio</span>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed max-w-xs">
              The next-generation customer engagement platform tailored for modern SaaS teams. Connect, automate, and grow with AI-powered conversations.
            </p>
            
            {/* Social Icons */}
            <div className="flex gap-3">
              {[
                { icon: Twitter, href: "#" }, 
                { icon: Github, href: "#" }, 
                { icon: Linkedin, href: "#" }, 
                { icon: Youtube, href: "#" }
              ].map((social, i) => (
                <a 
                  key={i} 
                  href={social.href} 
                  className="w-10 h-10 flex items-center justify-center bg-slate-900 border border-slate-800 rounded-lg text-slate-400 hover:text-white hover:border-brand-purple/30 hover:bg-brand-purple/10 transition-all duration-300 group"
                >
                  <social.icon size={18} className="group-hover:scale-110 transition-transform" />
                </a>
              ))}
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h4 className="font-bold text-white mb-6">Product</h4>
            <ul className="space-y-3 text-sm text-slate-400">
              <li><a href="#features" className="hover:text-brand-orange transition-colors">Features</a></li>
              <li><a href="#omnichannel" className="hover:text-brand-orange transition-colors">Omnichannel</a></li>
              <li><a href="#monitoring" className="hover:text-brand-orange transition-colors">Live Monitoring</a></li>
              <li><a href="#" className="hover:text-brand-orange transition-colors">Pricing</a></li>
              <li><a href="#" className="hover:text-brand-orange transition-colors">Changelog</a></li>
            </ul>
          </div>

          {/* Resources Links */}
          <div>
            <h4 className="font-bold text-white mb-6">Resources</h4>
            <ul className="space-y-3 text-sm text-slate-400">
              <li><a href="#" className="hover:text-brand-orange transition-colors">Documentation</a></li>
              <li><a href="#" className="hover:text-brand-orange transition-colors">API Reference</a></li>
              <li><a href="#" className="hover:text-brand-orange transition-colors">Community</a></li>
              <li><a href="#" className="hover:text-brand-orange transition-colors">Blog</a></li>
              <li><a href="#" className="hover:text-brand-orange transition-colors">Help Center</a></li>
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h4 className="font-bold text-white mb-6">Company</h4>
            <ul className="space-y-3 text-sm text-slate-400">
              <li><a href="#" className="hover:text-brand-orange transition-colors">About</a></li>
              <li><a href="#" className="hover:text-brand-orange transition-colors">Careers</a></li>
              <li><a href="#" className="hover:text-brand-orange transition-colors">Legal</a></li>
              <li><a href="#" className="hover:text-brand-orange transition-colors">Contact</a></li>
              <li><a href="#" className="hover:text-brand-orange transition-colors">Partners</a></li>
            </ul>
          </div>

           {/* Newsletter / CTA */}
           <div className="lg:col-span-1">
             <h4 className="font-bold text-white mb-6">Stay Updated</h4>
             <p className="text-xs text-slate-500 mb-4">Subscribe to our newsletter for the latest AI updates and feature releases.</p>
             <div className="space-y-3">
               <div className="relative">
                 <input 
                   type="email" 
                   placeholder="Enter your email" 
                   className="w-full bg-slate-900 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand-purple/50 focus:ring-1 focus:ring-brand-purple/50 transition-all placeholder:text-slate-600"
                 />
               </div>
               <button className="w-full bg-white text-slate-950 hover:bg-brand-orange hover:text-white text-sm font-bold py-2.5 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 group">
                 Subscribe <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
               </button>
             </div>
           </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-sm text-slate-500">
            © {new Date().getFullYear()} TalkChat Studio Inc. All rights reserved.
          </p>
          <div className="flex flex-wrap justify-center items-center gap-6 text-sm text-slate-500">
             <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
             <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
             <a href="#" className="hover:text-white transition-colors">Cookie Settings</a>
             <div className="flex items-center gap-1.5 text-slate-600 pl-4 border-l border-white/5 hidden md:flex">
               <span>Made with</span>
               <Heart size={12} className="text-red-500 fill-red-500 animate-pulse" />
               <span>for builders</span>
             </div>
          </div>
        </div>
      </div>
    </footer>
  );
};