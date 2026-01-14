import React, { useEffect } from 'react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { GlobalChatWidget } from '../components/GlobalChatWidget';
import { motion } from 'framer-motion';

interface StaticPageLayoutProps {
    children: React.ReactNode;
    title: string;
    description?: string;
}

export const StaticPageLayout: React.FC<StaticPageLayoutProps> = ({ children, title, description }) => {
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    return (
        <div className="min-h-screen bg-slate-950 text-white overflow-x-hidden selection:bg-brand-orange selection:text-white font-sans">
            {/* Background Glows */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand-purple/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-brand-orange/5 rounded-full blur-[120px]" />
            </div>

            <div className="relative z-10">
                <Navbar />

                <div className="pt-32 pb-20 px-6">
                    <div className="max-w-4xl mx-auto">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mb-12"
                        >
                            <h1 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tight">
                                {title}
                            </h1>
                            {description && (
                                <p className="text-slate-400 text-lg">
                                    {description}
                                </p>
                            )}
                            <div className="h-1 w-20 bg-gradient-to-r from-brand-orange to-brand-purple rounded-full mt-6" />
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="prose prose-invert prose-slate max-w-none"
                        >
                            {children}
                        </motion.div>
                    </div>
                </div>

                <Footer />
            </div>

            <GlobalChatWidget forceGlobalConfig={true} />
        </div>
    );
};
