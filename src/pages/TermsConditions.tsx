// src/pages/TermsConditions.tsx
import React from 'react';
import { Link } from 'react-router-dom'; // For internal links

const TermsConditions = () => {
  const lastUpdated = "April 27, 2025"; // <<< UPDATE THIS DATE
  const contactEmail = "reprogrammingmind@gmail.com"; // Your contact email

  return (
    // Outermost container with padding
    <div className="min-h-screen bg-background text-foreground p-6 md:p-10 lg:p-16">
      {/* Centering Container */}
      <div className="max-w-3xl mx-auto space-y-6"> {/* <<< CENTERING APPLIED HERE */}

        <h2 className="text-3xl font-bold mb-6 text-center text-primary"> {/* Adjusted margin/color */}
          Reconsolidation Program Terms and Conditions
        </h2>
        <p className="text-sm text-muted-foreground text-center">Last Updated: {lastUpdated}</p>

        <section className="space-y-3">
           <p>
             Welcome to the Reconsolidation program, a web app designed to help you reprocess painful memories using the Reconsolidation of Traumatic Memories (RTM) protocol. By accessing or using Reconsolidator (the “Service”), you agree to be bound by these Terms and Conditions (“Terms”). If you do not agree to these Terms, please do not use the Service.
           </p>
        </section>

        <section className="space-y-3">
          <h3 className="text-xl font-semibold mb-2 text-accent-foreground">1. Acceptance of Terms</h3>
          <p>
            By using the Reconsolidation program, you confirm that you are at least 18 years old and have the legal capacity to enter into this agreement. These Terms constitute a legally binding agreement between you (“User” or “you”) and Reconsolidator (“we,” “us,” or “our”). We reserve the right to update these Terms at any time, and any changes will be effective upon posting on this page with an updated “Last Updated” date. Your continued use of the Service after such changes constitutes your acceptance of the revised Terms.
          </p>
        </section>

        <section className="space-y-3">
          <h3 className="text-xl font-semibold mb-2 text-accent-foreground">2. Description of Service</h3>
          <p>
            Reconsolidation program is a web-based application that guides users through a narrative-driven process to reprocess painful memories using RTM techniques. The Service includes:
          </p>
          <ul className="list-disc list-inside ml-4 space-y-1 text-foreground/90"> {/* Added text style */}
            <li>A free first treatment (Treatment 1) to experience the process.</li>
            <li>Lifetime access to all 5 treatments for a one-time fee of $47.</li>
            <li>Optional additional treatment packs for purchase.</li>
            <li>Features to track your progress using the Subjective Units of Distress Scale (SUDs).</li>
          </ul>
           <p className="font-semibold text-destructive mt-2"> {/* Highlight disclaimer */}
             The Service is not a substitute for professional medical or psychological advice, diagnosis, or treatment. If you are experiencing a mental health crisis, please contact a licensed professional or emergency services immediately.
           </p>
        </section>

        <section className="space-y-3">
          <h3 className="text-xl font-semibold mb-2 text-accent-foreground">3. Payment and No-Refund Policy</h3>
          <h4 className="text-lg font-medium text-muted-foreground">3.1 Pricing</h4>
          <ul className="list-disc list-inside ml-4 space-y-1 text-foreground/90">
            <li>
              <strong>Free Treatment 1:</strong> Treatment 1 is provided at no cost to allow you to experience the Service before purchasing.
            </li>
            <li>
              <strong>Lifetime Access:</strong> Access to all 5 treatments is available for a one-time fee of $47, granting you lifetime access to the core features of the Service.
            </li>
            <li>
               <strong>Optional Purchases:</strong> Additional treatment packs may be available for purchase at the prices listed on the Service.
            </li>
          </ul>
          <h4 className="text-lg font-medium text-muted-foreground">3.2 Payment</h4>
          <p>
            All payments are processed through a secure third-party payment processor (Stripe). By making a purchase, you agree to provide accurate payment information and authorize us (via Stripe) to charge the specified amount to your chosen payment method.
          </p>
          <h4 className="text-lg font-medium text-muted-foreground">3.3 No-Refund Policy</h4>
          <p>
             <strong>All purchases, including the $47 lifetime access fee and any optional treatment packs, are final and non-refundable.</strong> We offer Treatment 1 for free to allow you to evaluate the Service before committing to a purchase. By purchasing, you acknowledge and agree to this no-refund policy.
          </p>
        </section>

        <section className="space-y-3">
          <h3 className="text-xl font-semibold mb-2 text-accent-foreground">4. User Responsibilities</h3>
          <h4 className="text-lg font-medium text-muted-foreground">4.1 Account and Security</h4>
          <p>
            To access the Service, you must provide a valid email address. You are responsible for maintaining the confidentiality of your account information and for all activities that occur under your account. You agree to notify us immediately of any unauthorized use of your account.
          </p>
          <h4 className="text-lg font-medium text-muted-foreground">4.2 Use of the Service</h4>
          <p>
            You agree to use the Service only for its intended purpose and in accordance with these Terms. You will not:
          </p>
          <ul className="list-disc list-inside ml-4 space-y-1 text-foreground/90">
            <li>Use the Service for any illegal or unauthorized purpose.</li>
            <li>Attempt to reverse-engineer, decompile, or otherwise interfere with the Service’s functionality.</li>
            <li>Share, distribute, or reproduce any content from the Service (other than your own recordings for personal use) without our prior written consent.</li>
          </ul>
          <h4 className="text-lg font-medium text-muted-foreground">4.3 User-Generated Content</h4>
          <p>
            The Service allows you to record and play back narratives as part of the reprocessing process ("User Content"). You retain ownership of your User Content but grant us a non-exclusive, royalty-free license solely to store and process it as necessary to provide the Service functionality to you. You are solely responsible for the content you create and must ensure it does not violate any laws or third-party rights.
          </p>
        </section>

        <section className="space-y-3">
          <h3 className="text-xl font-semibold mb-2 text-accent-foreground">5. Intellectual Property</h3>
          <p>
            All content, features, and functionality of the Service, including but not limited to text, scripts, designs, algorithms, and the Reconsolidator name and logo, are the exclusive property of Reconsolidation program, Reprogramming Mind and its licensors, protected by copyright and other intellectual property laws. You may not copy, modify, distribute, or create derivative works from any part of the Service without our prior written consent. The Service is provided for your personal, non-commercial use only.
          </p>
        </section>

        <section className="space-y-3">
          <h3 className="text-xl font-semibold mb-2 text-accent-foreground">6. Limitation of Liability & Disclaimer of Warranties</h3>
          <p>
            To the fullest extent permitted by law, Reprogramming Mind, The Reconsolidation program, its affiliates, and its respective officers, directors, employees, and agents shall not be liable for any direct, indirect, incidental, special, consequential, or punitive damages arising out of or in connection with your use of the Service, including but not limited to: emotional distress, psychological harm, inability to achieve desired results, loss of data, or any errors or inaccuracies in the Service.
          </p>
          <p>
            <strong>The Service is provided on an “as-is” and “as-available” basis, without warranties of any kind, express or implied, including but not limited to warranties of merchantability, fitness for a particular purpose, or non-infringement. We do not guarantee that the Service will meet your expectations or achieve any specific results, including reductions in distress as measured by SUDs.</strong> Your use of the Service is solely at your own risk.
          </p>
        </section>

        <section className="space-y-3">
          <h3 className="text-xl font-semibold mb-2 text-destructive">7. No Lawsuit Clause / Agreement Not to Sue</h3>
           <p className="font-semibold">
             As a strict condition of using the Reconsolidation program, you explicitly agree that you will not sue or initiate any form of legal action, claim, or proceeding against the Reconsolidation program, Reprogramming Mind, or its owners, affiliates, officers, directors, employees, or agents for any reason whatsoever. This includes, but is not limited to, claims arising from your use of the Service, the results (or lack thereof) obtained from the Service, any emotional, psychological, physical, or other effects experienced during or after using the Service, data breaches, service interruptions, or dissatisfaction with the Service.
           </p>
           <p>
             You acknowledge that the Reconsolidation program is a self-guided digital tool based on certain protocols but is not a substitute for professional medical or mental health therapy or advice, and results are not guaranteed. You assume all risks associated with using the Service. Your sole remedy for any dissatisfaction is to stop using the Service. This agreement not to sue is fundamental to the provision of the Service under these terms. If this clause is found unenforceable, your right to use the Service is immediately revoked.
           </p>
        </section>

        <section className="space-y-3">
          <h3 className="text-xl font-semibold mb-2 text-accent-foreground">8. Indemnification</h3>
          <p>
            You agree to indemnify, defend, and hold harmless Reprogramming Mind, Reconsolidation program, its affiliates, and its respective officers, directors, employees, and agents from any claims, liabilities, damages, losses, or expenses (including reasonable attorneys’ fees) arising out of or related to your use of the Service, your violation of these Terms, or your violation of any law or third-party rights.
          </p>
        </section>

        <section className="space-y-3">
          <h3 className="text-xl font-semibold mb-2 text-accent-foreground">9. Dispute Resolution and Governing Law</h3>
          <h4 className="text-lg font-medium text-muted-foreground">9.1 Informal Negotiation</h4>
          <p>
            Should a dispute arise related to these Terms or the Service (notwithstanding Section 7), you agree to first attempt to resolve it informally by contacting us via email at {contactEmail}. We will attempt to respond and negotiate within 30 days.
          </p>
          <h4 className="text-lg font-medium text-muted-foreground">9.2 Binding Arbitration</h4>
          <p>
            If informal negotiation fails, you agree that any remaining dispute (excluding enforcement of Section 7 or intellectual property rights) shall be resolved exclusively through final and binding arbitration administered by a mutually agreed-upon arbitrator or service in Toronto, Ontario, Canada. The arbitration shall be conducted under the prevailing rules for commercial disputes. The arbitrator's award shall be final and may be entered as a judgment in any court of competent jurisdiction. **You hereby waive any right to participate in a class action lawsuit or class-wide arbitration.**
          </p>
          <h4 className="text-lg font-medium text-muted-foreground">9.3 Governing Law</h4>
          <p>
            These Terms shall be governed by and construed in accordance with the laws of the Province of Ontario and the federal laws of Canada applicable therein, without regard to its conflict of law principles.
          </p>
        </section>

        <section className="space-y-3">
          <h3 className="text-xl font-semibold mb-2 text-accent-foreground">10. Termination</h3>
          <p>
            We reserve the right to terminate or suspend your access to the Service immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach these Terms. Upon termination, your right to use the Service will cease immediately. Data associated with your account may be deleted according to our data retention practices outlined in the Privacy Policy.
          </p>
        </section>

        <section className="space-y-3">
          <h3 className="text-xl font-semibold mb-2 text-accent-foreground">11. Privacy</h3>
          <p>
            Your use of the Service is also governed by our{' '}
            <Link to="/privacy-policy" className="text-primary hover:underline">Privacy Policy</Link>, which explains how we collect, use, and protect your personal information. By using the Service, you consent to the data practices described in the Privacy Policy.
          </p>
        </section>

        <section className="space-y-3">
          <h3 className="text-xl font-semibold mb-2 text-accent-foreground">12. Miscellaneous</h3>
          <p>
             <strong>Entire Agreement:</strong> These Terms, together with the Privacy Policy, constitute the entire agreement between you and Reconsolidator regarding your use of the Service.
          </p>
           <p>
             <strong>Severability:</strong> If any provision of these Terms is held to be invalid or unenforceable, that provision will be limited or eliminated to the minimum extent necessary, and the remaining provisions will remain in full force and effect.
           </p>
           <p>
             <strong>No Waiver:</strong> Our failure to enforce any right or provision of these Terms will not be considered a waiver of those rights.
           </p>
        </section>

        <section className="space-y-3">
          <h3 className="text-xl font-semibold mb-2 text-accent-foreground">13. Contact Us</h3>
          <p>
            If you have any questions about these Terms, please contact us at: <a href={`mailto:${contactEmail}`} className="text-primary hover:underline">{contactEmail}</a>
          </p>
        </section>

         {/* Footer Links */}
        <div className="mt-12 pt-6 border-t border-border text-center text-sm text-muted-foreground space-x-4">
            <Link to="/" className="hover:text-primary">Home</Link>
            <Link to="/privacy-policy" className="hover:text-primary">Privacy Policy</Link>
            <Link to="/faq" className="hover:text-primary">FAQ</Link>
        </div>

      </div> {/* End Centering Container */}
    </div> // End Outermost Container
  );
};

export default TermsConditions;