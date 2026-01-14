import React from 'react';
import { StaticPageLayout } from '../components/StaticPageLayout';

export const Terms: React.FC = () => {
    return (
        <StaticPageLayout
            title="Terms of Service"
            description="Effective Date: January 1, 2026"
        >
            <div className="space-y-8 text-slate-300">
                <section>
                    <h2 className="text-2xl font-bold text-white mb-4">1. Acceptance of Terms</h2>
                    <p>
                        By accessing and using TalkChat Studio, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.
                    </p>
                </section>

                <section>
                    <h2 className="text-2xl font-bold text-white mb-4">2. Description of Service</h2>
                    <p>
                        TalkChat Studio provides an AI-powered customer engagement platform, including live chat widgets, AI response automation, and visitor tracking tools. We reserve the right to modify or discontinue any part of the service at any time.
                    </p>
                </section>

                <section>
                    <h2 className="text-2xl font-bold text-white mb-4">3. User Accounts</h2>
                    <p>
                        When you create an account with us, you must provide information that is accurate, complete, and current at all times. Failure to do so constitutes a breach of the Terms, which may result in immediate termination of your account on our Service.
                    </p>
                </section>

                <section>
                    <h2 className="text-2xl font-bold text-white mb-4">4. Acceptable Use</h2>
                    <p>
                        You agree not to use TalkChat Studio for any unlawful purpose or in any way that could damage, disable, overburden, or impair the service. Prohibited activities include:
                    </p>
                    <ul className="list-disc pl-6 mt-4 space-y-2">
                        <li>Impersonating any person or entity.</li>
                        <li>Interfering with the security of the service.</li>
                        <li>Using the AI features to generate harmful, illegal, or deceptive content.</li>
                        <li>Scraping or harvesting data from the service without authorization.</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-2xl font-bold text-white mb-4">5. Intellectual Property</h2>
                    <p>
                        The Service and its original content, features and functionality are and will remain the exclusive property of TalkChat Studio and its licensors.
                    </p>
                </section>

                <section>
                    <h2 className="text-2xl font-bold text-white mb-4">6. Limitation of Liability</h2>
                    <p>
                        In no event shall TalkChat Studio be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your access to or use of or inability to access or use the Service.
                    </p>
                </section>

                <section>
                    <h2 className="text-2xl font-bold text-white mb-4">7. Governing Law</h2>
                    <p>
                        These Terms shall be governed and construed in accordance with the laws of the jurisdiction in which TalkChat Studio operates, without regard to its conflict of law provisions.
                    </p>
                </section>
            </div>
        </StaticPageLayout>
    );
};
