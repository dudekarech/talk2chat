import React from 'react';
import { StaticPageLayout } from '../components/StaticPageLayout';

export const Privacy: React.FC = () => {
    return (
        <StaticPageLayout
            title="Privacy Policy"
            description="Last Updated: January 2026"
        >
            <div className="space-y-8 text-slate-300">
                <section>
                    <h2 className="text-2xl font-bold text-white mb-4">1. Introduction</h2>
                    <p>
                        Welcome to TalkChat Studio. We respect your privacy and are committed to protecting your personal data. This privacy policy will inform you as to how we look after your personal data when you visit our website or use our services.
                    </p>
                </section>

                <section>
                    <h2 className="text-2xl font-bold text-white mb-4">2. Data We Collect</h2>
                    <p>
                        We may collect, use, store and transfer different kinds of personal data about you which we have grouped together as follows:
                    </p>
                    <ul className="list-disc pl-6 mt-4 space-y-2">
                        <li><strong>Identity Data:</strong> includes first name, last name, username or similar identifier.</li>
                        <li><strong>Contact Data:</strong> includes email address and telephone numbers.</li>
                        <li><strong>Technical Data:</strong> includes internet protocol (IP) address, your login data, browser type and version, time zone setting and location, etc.</li>
                        <li><strong>Usage Data:</strong> includes information about how you use our website, products and services.</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-2xl font-bold text-white mb-4">3. How We Use Your Data</h2>
                    <p>
                        We will only use your personal data when the law allows us to. Most commonly, we will use your personal data in the following circumstances:
                    </p>
                    <ul className="list-disc pl-6 mt-4 space-y-2">
                        <li>To provide and maintain our Service, including to monitor the usage of our Service.</li>
                        <li>To manage your Account: to manage your registration as a user of the Service.</li>
                        <li>For the performance of a contract: the development, compliance and undertaking of the purchase contract for the products, items or services you have purchased.</li>
                        <li>With your consent: to contact you by email, telephone calls, SMS, or other equivalent forms of electronic communication.</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-2xl font-bold text-white mb-4">4. AI and Data Processing</h2>
                    <p>
                        TalkChat Studio uses artificial intelligence to process chat interactions. By using our service, you acknowledge that conversations may be processed by third-party AI providers (such as Google Gemini, OpenAI, or Anthropic) as configured in your workspace settings. We ensure that these providers adhere to strict data processing standards.
                    </p>
                </section>

                <section>
                    <h2 className="text-2xl font-bold text-white mb-4">5. Contact Us</h2>
                    <p>
                        If you have any questions about this privacy policy or our privacy practices, please contact us at:
                        <br />
                        <span className="text-brand-orange mt-2 block font-bold">privacy@talkchat.studio</span>
                    </p>
                </section>
            </div>
        </StaticPageLayout>
    );
};
