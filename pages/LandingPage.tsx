
import React from 'react';
import { Navbar } from '../components/Navbar';
import { Hero } from '../components/Hero';
import { Features } from '../components/Features';
import { Monitoring } from '../components/Monitoring';
import { Omnichannel } from '../components/Omnichannel';
import { Customization } from '../components/Customization';
import { Footer } from '../components/Footer';
import { GlobalChatWidget } from '../components/GlobalChatWidget';

export const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-white overflow-x-hidden selection:bg-brand-orange selection:text-white font-sans">
      {/* Global Background Elements - Brand Specific Colors */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.03]" />

        {/* Top Left Blob - Purple (Headphones) */}
        <div className="absolute top-[-10%] left-[-10%] w-[800px] h-[800px] bg-brand-purple/20 rounded-full blur-[120px] mix-blend-screen opacity-30 animate-blob" />

        {/* Bottom Right Blob - Orange (Body) */}
        <div className="absolute bottom-[-10%] right-[-10%] w-[800px] h-[800px] bg-brand-orange/10 rounded-full blur-[120px] mix-blend-screen opacity-30 animate-blob animation-delay-2000" />

        {/* Center Accent - Subtle mix */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-900/10 rounded-full blur-[100px] mix-blend-screen opacity-20" />
      </div>

      <div className="relative z-10">
        <Navbar />
        <Hero />
        <Features />
        <Monitoring />
        <Omnichannel />
        <Customization />
        <Footer />
      </div>

      {/* Global Chat Widget - ALWAYS uses global config for landing page */}
      <GlobalChatWidget forceGlobalConfig={true} />
    </div>
  );
};
