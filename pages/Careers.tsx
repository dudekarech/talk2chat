import React from 'react';
import { StaticPageLayout } from '../components/StaticPageLayout';
import { Briefcase, MapPin, Clock, Users, Coffee, Sparkles, Heart, Zap } from 'lucide-react';

export const Careers: React.FC = () => {
    const openings = [
        {
            title: "Senior AI Engineer",
            department: "Engineering",
            location: "Remote / Nairobi",
            type: "Full-time",
            icon: Zap
        },
        {
            title: "Product Designer",
            department: "Design",
            location: "Remote",
            type: "Full-time",
            icon: Sparkles
        },
        {
            title: "Customer Success Manager",
            department: "Operations",
            location: "Hybrid",
            type: "Full-time",
            icon: Users
        },
        {
            title: "Full Stack Developer (React/Supabase)",
            department: "Engineering",
            location: "Remote",
            type: "Full-time",
            icon: Coffee
        }
    ];

    const benefits = [
        { icon: Heart, title: "Wellness First", desc: "Comprehensive health insurance and wellness stipends." },
        { icon: Globe, title: "Remote-First", desc: "Work from anywhere in the world, on your own schedule." },
        { icon: Rocket, title: "Equity Options", desc: "Every Studio member is an owner with stock options." },
        { icon: Zap, title: "Latest Tech", desc: "Get the latest MacBook and any tools you need to build." }
    ];

    return (
        <StaticPageLayout
            title="Join the Studio"
            description="Help us build the future of AI-native human communication."
        >
            <div className="space-y-20 py-10">
                {/* Intro Section */}
                <section className="relative">
                    <div className="bg-brand-orange/5 border border-brand-orange/20 rounded-[2.5rem] p-10 md:p-16">
                        <h2 className="text-3xl font-black text-white mb-6">Why TalkChat Studio?</h2>
                        <p className="text-xl text-slate-400 leading-relaxed max-w-3xl">
                            We aren't just building another chat widget. We're rethinking how billions of people interact with businesses. At the Studio, you'll tackle complex AI challenges, design intuitive experiences, and shape the core infrastructure of modern commerce.
                        </p>
                    </div>
                </section>

                {/* Benefits Grid */}
                <section>
                    <h2 className="text-3xl font-black text-white mb-10 text-center">Benefits & Perks</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {benefits.map((benefit, i) => (
                            <div key={i} className="bg-slate-900/50 border border-slate-800 p-8 rounded-3xl hover:border-brand-purple/30 transition-all">
                                <div className="p-3 bg-brand-purple/10 w-fit rounded-2xl mb-4">
                                    <benefit.icon className="w-5 h-5 text-brand-purple" />
                                </div>
                                <h3 className="font-bold text-white mb-2">{benefit.title}</h3>
                                <p className="text-sm text-slate-500">{benefit.desc}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Open Positions */}
                <section>
                    <div className="flex items-center justify-between mb-10">
                        <h2 className="text-3xl font-black text-white">Current Openings</h2>
                        <span className="px-4 py-1 bg-brand-orange/10 border border-brand-orange/20 text-brand-orange text-xs font-bold rounded-full uppercase tracking-widest">
                            {openings.length} Positions
                        </span>
                    </div>

                    <div className="space-y-4">
                        {openings.map((job, i) => (
                            <div key={i} className="group flex flex-col md:flex-row md:items-center justify-between p-8 bg-slate-900/40 hover:bg-slate-900 border border-slate-800 rounded-[2rem] transition-all duration-300">
                                <div className="flex items-center gap-6">
                                    <div className="p-4 bg-slate-800 rounded-2xl group-hover:bg-brand-purple group-hover:text-white transition-colors duration-300">
                                        <job.icon className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-white group-hover:text-brand-orange transition-colors">{job.title}</h3>
                                        <div className="flex flex-wrap gap-4 mt-2 text-sm text-slate-500">
                                            <span className="flex items-center gap-1.5"><Briefcase size={14} /> {job.department}</span>
                                            <span className="flex items-center gap-1.5"><MapPin size={14} /> {job.location}</span>
                                            <span className="flex items-center gap-1.5"><Clock size={14} /> {job.type}</span>
                                        </div>
                                    </div>
                                </div>
                                <button className="mt-6 md:mt-0 px-8 py-3 bg-white text-slate-950 font-bold rounded-xl hover:bg-brand-orange hover:text-white transition-all">
                                    Apply Now
                                </button>
                            </div>
                        ))}
                    </div>
                </section>

                {/* CTA */}
                <section className="text-center py-10">
                    <h2 className="text-2xl font-bold text-white mb-4">Don't see a fit?</h2>
                    <p className="text-slate-400 mb-8 max-w-xl mx-auto">
                        We're always looking for brilliant minds. If you're passionate about AI and communication, send us an open application.
                    </p>
                    <a href="mailto:careers@talkchat.studio" className="text-brand-orange font-bold hover:underline">
                        careers@talkchat.studio
                    </a>
                </section>
            </div>
        </StaticPageLayout>
    );
};

import { Globe, Rocket } from 'lucide-react';
