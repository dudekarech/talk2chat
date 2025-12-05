
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useScroll } from 'framer-motion';

// Custom SVG to replicate the provided TalkChat Studio Logo (Orange Bubble + Robot)
export const BrandLogo = ({ size = 40 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Orange Chat Bubble Body */}
    <path d="M50 5C25.147 5 5 23.5 5 46C5 60.5 14 73 28 80V95L45 86.5C46.6 86.8 48.3 87 50 87C74.853 87 95 68.5 95 46C95 23.5 74.853 5 50 5Z" fill="#F97316"/>
    
    {/* Purple Headphones */}
    <path d="M25 45V55C25 57.7614 27.2386 60 30 60H32V40H30C27.2386 40 25 42.2386 25 45Z" fill="#4C1D95"/>
    <path d="M70 45V55C70 57.7614 67.7614 60 65 60H63V40H65C67.7614 40 70 42.2386 70 45Z" fill="#4C1D95"/>
    <path d="M30 45C30 33.9543 38.9543 25 50 25C61.0457 25 70 33.9543 70 45" stroke="#4C1D95" strokeWidth="6" strokeLinecap="round"/>
    
    {/* Robot Face (White) */}
    <rect x="32" y="38" width="31" height="22" rx="6" fill="#FFF7ED"/>
    
    {/* Eyes */}
    <circle cx="40" cy="46" r="3" fill="#4C1D95"/>
    <circle cx="55" cy="46" r="3" fill="#4C1D95"/>
    
    {/* Smile */}
    <path d="M42 53C42 53 44 55 47.5 55C51 55 53 53 53 53" stroke="#4C1D95" strokeWidth="2" strokeLinecap="round"/>
    
    {/* Mic */}
    <path d="M30 60L40 65" stroke="#4C1D95" strokeWidth="3" strokeLinecap="round"/>
    <circle cx="42" cy="66" r="3" fill="#4C1D95"/>
  </svg>
);

export const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <motion.nav 
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className={`fixed top-0 left-0 right-0 z-50 px-6 py-4 transition-all duration-300 ${scrolled ? 'bg-slate-950/90 backdrop-blur-md border-b border-white/5 py-3 shadow-lg' : 'bg-transparent border-transparent'}`}
    >
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <div 
          className="flex items-center gap-3 cursor-pointer group" 
          onClick={() => navigate('/')}
        >
          <div className="group-hover:scale-105 transition-transform duration-300 drop-shadow-[0_0_15px_rgba(249,115,22,0.3)]">
            <BrandLogo size={44} />
          </div>
          <div className="flex flex-col justify-center">
            <span className="text-xl font-bold tracking-tight text-white leading-none">
              talkchat
            </span>
            <span className="text-[10px] font-bold tracking-[0.2em] text-brand-orange uppercase leading-none mt-1 group-hover:text-white transition-colors">
              studio
            </span>
          </div>
        </div>
        
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
          {['Features', 'Monitoring', 'Channels', 'Pricing'].map((item) => (
             <a 
               key={item} 
               href={`#${item.toLowerCase()}`} 
               className="hover:text-white relative group overflow-hidden"
             >
               {item}
               <span className="absolute bottom-0 left-0 w-full h-0.5 bg-brand-orange transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></span>
             </a>
          ))}
        </div>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/login')} 
            className="text-sm font-medium text-slate-300 hover:text-white transition-colors"
          >
            Login
          </button>
          <button 
            onClick={() => navigate('/signup')} 
            className="px-6 py-2.5 bg-white text-slate-950 rounded-full text-sm font-bold hover:bg-brand-orange hover:text-white transition-all duration-300 shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_20px_rgba(249,115,22,0.4)]"
          >
            Get Started
          </button>
        </div>
      </div>
    </motion.nav>
  );
};
