// src/pages/PrivacyPolicy.tsx
import React from 'react';
import { Link } from 'react-router-dom'; // Optional: if you need internal links

const PrivacyPolicy = () => {
  const lastUpdated = "April 9, 2025"; // CHANGE THIS DATE
  const contactEmail = "dev@reprogrammingmind.com"; // Your contact email

  return (
    // Use Tailwind classes for container, background, text, padding
    <div className="min-h-screen bg-background text-foreground p-6 md:p-10 lg:p-16">
      {/* Use Tailwind for max-width, centering, and spacing between sections */}
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Use Tailwind for headings, margins, centering */}
        <h2 className="text-3xl font-bold mb-6 text-center text-primary">Reprogramming Mind Privacy Policy</h2>
        <p className="text-sm text-muted-foreground text-center">Last Updated: {lastUpdated}</p>

        {/* Use standard HTML tags and Tailwind for styling */}
        <section className="space-y-3">
          <h3 className="text-xl font-semibold mb-2 text-accent-foreground">1. Introduction</h3>
          <p>
            Welcome to Reprogramming Mind, the home of Reconsolidator—a web app designed to help you reprocess painful memories using the Reconsolidation of Traumatic Memories (RTM) protocol. This Privacy Policy explains how Reprogramming Mind (“we,” “us,” or “our”) collects, uses, discloses, and safeguards your information when you use the Reconsolidator web app (the “Service”) through our website, reprogrammingmind.com. By using the Service, you consent to the practices described in this policy. If you do not agree with this policy, please do not use the Service.
          </p>
          <p>
            We reserve the right to make changes to this Privacy Policy at any time and for any reason. We will alert you about any changes by updating the "Last Updated" date of this Privacy Policy.
          </p>
        </section>

        <section className="space-y-3">
          <h3 className="text-xl font-semibold mb-2 text-accent-foreground">2. Collection of Your Information</h3>
          <p>
            We may collect information about you in a variety of ways. The information we may collect via the App includes:
          </p>
          {/* Use Tailwind list styles */}
          <ul className="list-disc list-inside ml-4 space-y-1 text-foreground/90">
            <li>
              <strong>Personal Data:</strong> Personally identifiable information, such as your email address, which you voluntarily give to us when registering for the App or choosing to participate in various activities related to the App.
            </li>
            <li>
              <strong>Sensitive Personal Data (Memories & Transcripts):</strong> When using the core features of the App, you will generate content including audio recordings of memories, video recordings of target events, and text transcripts derived from these recordings ("User Content"). This User Content is inherently sensitive.
            </li>
            <li>
              <strong>Derivative Data:</strong> Information our servers automatically collect when you access the App, such as your IP address, browser type, operating system, access times, and the pages you have viewed directly before and after accessing the App. (Note: Specify if you *actually* collect this via Vercel Analytics or similar).
            </li>
             <li>
              <strong>Payment Data:</strong> We use Stripe for payment processing. We do not directly store your full credit card details. When you purchase access, Stripe processes your payment, and we receive information necessary to confirm the transaction (like transaction ID, amount, and payment status), linked to your user identifier (like email). Please refer to Stripe's Privacy Policy for more details on how they handle your payment data.
            </li>
             <li>
              <strong>Application Usage Data:</strong> We may collect data about how you use the App, such as SUDS scores entered, treatments completed, and feature usage patterns, to monitor and improve the service. This data may be anonymized or aggregated.
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h3 className="text-xl font-semibold mb-2 text-accent-foreground">3. Use of Your Information</h3>
          <p>
            Having accurate information permits us to provide you with a smooth, efficient, and customized experience. Specifically, we may use information collected about you via the App to:
          </p>
          <ul className="list-disc list-inside ml-4 space-y-1 text-foreground/90">
            <li>Create and manage your account.</li>
            <li>Provide the core functionality of the memory reconsolidation program.</li>
            <li>Process payments and grant access to paid features.</li>
            <li>Email you regarding your account, treatment progress, or promotional offers (using Resend).</li>
            <li>Monitor and analyze usage and trends to improve your experience with the App.</li>
            <li>Maintain the security and integrity of our systems.</li>
            <li>Respond to user inquiries and offer support.</li>
            <li>Comply with legal requirements.</li>
          </ul>
        </section>

         <section className="space-y-3">
          <h3 className="text-xl font-semibold mb-2 text-accent-foreground">4. Disclosure of Your Information</h3>
          <p>
            We do not sell your personal information. We may share information we have collected about you in certain situations:
          </p>
          <ul className="list-disc list-inside ml-4 space-y-1 text-foreground/90">
            <li>
              <strong>By Law or to Protect Rights:</strong> If we believe the release of information about you is necessary to respond to legal process, to investigate or remedy potential violations of our policies, or to protect the rights, property, and safety of others, we may share your information as permitted or required by any applicable law, rule, or regulation.
            </li>
             <li>
              <strong>Third-Party Service Providers:</strong> We may share your information with third parties that perform services for us or on our behalf, including payment processing (Stripe), data storage (Supabase), email delivery (Resend), and hosting (Vercel). We require these service providers to use appropriate security measures to protect your information.
            </li>
             <li>
               <strong>Aggregated or Anonymized Data:</strong> We may share aggregated or anonymized information, which does not directly identify you, for research or analysis purposes.
             </li>
             <li>
              <strong>With Your Consent:</strong> We may disclose your personal information for any other purpose with your consent.
            </li>
          </ul>
            <p className="mt-2 font-semibold"> {/* Add margin and emphasis */}
                Regarding User Content (Memories/Transcripts): We treat your User Content with the highest level of confidentiality. It is stored securely in our database (Supabase). Access to raw User Content by our personnel is strictly limited and controlled, typically only for essential maintenance, debugging, or if legally required. We do not analyze the content of your memories for purposes other than providing the App's functionality unless specifically stated (e.g., for anonymized research, if you explicitly opt-in).
            </p>
        </section>

         <section className="space-y-3">
          <h3 className="text-xl font-semibold mb-2 text-accent-foreground">5. Security of Your Information</h3>
          <p>
            We use administrative, technical, and physical security measures to help protect your personal information. While we have taken reasonable steps to secure the personal information you provide to us, please be aware that despite our efforts, no security measures are perfect or impenetrable, and no method of data transmission can be guaranteed against any interception or other type of misuse. Information is stored using Supabase's security features, and communication may be encrypted using standard technologies like TLS/SSL. Your User Content is treated as highly sensitive.
          </p>
        </section>

        <section className="space-y-3">
          <h3 className="text-xl font-semibold mb-2 text-accent-foreground">6. Data Retention</h3>
           <p>
            We will retain your personal information and User Content only for as long as is necessary for the purposes set out in this Privacy Policy, or as required by law. You may request deletion of your account and associated data by contacting us.
           </p>
        </section>

        <section className="space-y-3">
          <h3 className="text-xl font-semibold mb-2 text-accent-foreground">7. Your Privacy Rights</h3>
           <p>
            Depending on your location, you may have certain rights regarding your personal information, such as the right to access, correct, update, or request deletion of your personal information. To exercise these rights, please contact us using the contact information provided below.
           </p>
        </section>

        <section className="space-y-3">
          <h3 className="text-xl font-semibold mb-2 text-accent-foreground">8. Policy for Children</h3>
           <p>
            We do not knowingly solicit information from or market to children under the age of 18 (or other age as required by local law). If you become aware of any data we have collected from children under the relevant age, please contact us using the contact information provided below.
           </p>
        </section>

        {/* --- ADD SECTION 9 (Cookies) from your original if needed --- */}

        {/* --- ADD SECTION 10 (Third-Party Links) from your original if needed --- */}

        {/* --- ADD SECTION 11 (International Users) from your original if needed --- */}

        <section className="space-y-3">
          <h3 className="text-xl font-semibold mb-2 text-accent-foreground">Contact Us</h3> {/* Renumbered */}
          <p>
            If you have questions or comments about this Privacy Policy, please contact us at:
          </p>
          <p>
            <a href="mailto:dev@reprogrammingmind.com" className="text-primary hover:underline">{contactEmail}</a>
            {/* [Your Company Name and Address, if applicable] */}
          </p>
        </section>

        {/* Optional Footer Links within the page */}
        <div className="mt-10 pt-6 border-t border-border text-center text-sm text-muted-foreground space-x-4">
            <Link to="/" className="hover:text-primary">Home</Link>
            <Link to="/terms-conditions" className="hover:text-primary">Terms & Conditions</Link>
            <Link to="/faq" className="hover:text-primary">FAQ</Link>
        </div>

      </div> {/* End max-w-3xl */}
    </div> // End container div
  );
};

export default PrivacyPolicy;