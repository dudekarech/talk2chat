import React from 'react';
import { StaticPageLayout } from '../components/StaticPageLayout';
import { Bot, Zap, Users, Globe, Rocket, Shield } from 'lucide-react';

export const About: React.FC = () => {
    return (
        <StaticPageLayout
            title="About TalkChat Studio"
            description="Empowering modern teams with AI-native customer engagement."
        >
            <div className="space-y-16 py-8">
                {/* Mission Section */}
                <section className="relative">
                    <div className="absolute -top-10 -left-10 w-40 h-40 bg-brand-purple/10 rounded-full blur-3xl" />
                    <h2 className="text-3xl font-black text-white mb-6">Our Mission</h2>
                    <p className="text-xl text-slate-400 leading-relaxed mb-8">
                        At TalkChat Studio, we believe that customer communication shouldn't be a burden. Our mission is to bridge the gap between businesses and their customers using powerful, ethical AI that feels human and acts instantly.
                    </p>
                    <p className="text-lg text-slate-400 leading-relaxed">
                        Founded in 2024, we recognized that the "live chat" industry was stuck in the past—either too manual for teams to scale or too robotic for customers to trust. We built TalkChat Studio as an AI-first platform that gives you the best of both worlds: instant automation and deep human connection.
                    </p>
                </section>

                {/* Values Grid */}
                <section>
                    <h2 className="text-3xl font-black text-white mb-10 text-center">The TalkChat Way</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[
                            {
                                icon: Zap,
                                title: "Speed to Response",
                                desc: "In the modern web, speed is the only currency that matters. We strive for sub-second AI responses."
                            },
                            {
                                icon: Bot,
                                title: "AI with Soul",
                                desc: "Our models aren't just cold engines; they are trained to understand context and empathy."
                            },
                            {
                                icon: Shield,
                                title: "Security First",
                                desc: "Your customer data is sacred. We use enterprise-grade encryption and strict privacy silos."
                            },
                            {
                                icon: Globe,
                                title: "Omnichannel",
                                desc: "Be where your customers are. WhatsApp, Instagram, or Web—all in one unified feed."
                            },
                            {
                                icon: Users,
                                title: "Collaborative",
                                desc: "Built for teams, not silos. Seamlessly hand off from AI to humans when it matters most."
                            },
                            {
                                icon: Rocket,
                                title: "Continuous Innovation",
                                desc: "We ship daily. Our platform evolves as fast as the AI landscape itself."
                            }
                        ].map((value, i) => (
                            <div key={i} className="bg-slate-900/40 border border-slate-800 p-8 rounded-[2rem] hover:border-brand-purple/30 transition-all group">
                                <div className="p-3 bg-brand-purple/10 w-fit rounded-2xl mb-6 group-hover:scale-110 transition-transform">
                                    <value.icon className="w-6 h-6 text-brand-purple" />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-3">{value.title}</h3>
                                <p className="text-slate-500 text-sm leading-relaxed">{value.desc}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Team / Story */}
                <section className="bg-gradient-to-br from-brand-purple/10 to-brand-orange/5 border border-white/5 rounded-[3rem] p-10 md:p-16 text-center">
                    <h2 className="text-3xl font-black text-white mb-6">Built for the Future</h2>
                    <p className="text-lg text-slate-300 max-w-3xl mx-auto leading-relaxed">
                        TalkChat Studio is headquartered in the cloud, built by a global team of engineers, designers, and AI researchers who are passionate about the future of communication. We're more than just a software company; we're your partner in growth.
                    </p>
                    <div className="mt-10 flex justify-center gap-6">
                        <button className="px-8 py-3 bg-white text-slate-950 rounded-full font-bold hover:bg-brand-orange hover:text-white transition-all shadow-xl">
                            Join the Studio
                        </button>
                        <button className="px-8 py-3 bg-slate-800 text-white rounded-full font-bold hover:bg-slate-700 transition-all border border-white/5">
                            Read the Blog
                        </button>
                    </div>
                </section>
            </div>
        </StaticPageLayout>
    );
};
