// src/pages/FAQ.tsx
import React from 'react';
import { Link } from 'react-router-dom'; // For internal links

const FAQ = () => {
  // Define a helper component for each Q&A pair for better structure
  const FAQItem = ({ question, children }: { question: string; children: React.ReactNode }) => (
    <div className="mb-8"> {/* Add margin bottom between FAQ items */}
      <h3 className="text-xl font-semibold mb-3 text-primary">{question}</h3> {/* Style question */}
      <div className="space-y-3 text-foreground/90"> {/* Style answer area */}
        {children}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background text-foreground p-6 md:p-10 lg:p-16">
      <div className="max-w-3xl mx-auto"> {/* Constrain width for readability */}
        <h2 className="text-3xl font-bold mb-10 text-center">
          FAQ’s on the Reconsolidation Program
        </h2>

        <FAQItem question="What is memory reconsolidation?">
          <p>
            Memory reconsolidation is a fascinating neurobiological process that allows the brain to update and rewrite existing memories, offering a powerful tool for healing emotional distress, such as PTSD or the pain of heartbreak. Unlike the traditional view of memories as fixed, reconsolidation reveals that when a memory is recalled and encounters a mismatch experience (prediction error), it becomes temporarily unstable, entering a malleable state where it can be altered or weakened before being re-stored.
          </p>
          <p>
            This process occurs naturally when we revisit a memory, but it can be harnessed therapeutically through techniques like the Reconsolidation of Traumatic Memories (RTM) protocol, which has shown a 90% success rate in eliminating PTSD symptoms, as evidenced by studies like{' '}
            <a href="https://pubmed.ncbi.nlm.nih.gov/33211519/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">PubMed ID: 33211519</a>.
          </p>
          <p>
            The mechanism behind memory reconsolidation involves “prediction errors”—new, positive outcomes or alternative narratives imagined during memory reactivation, disrupting the original emotional charge. For instance, a traumatic memory of a car accident might be reframed as the individual becoming a hero, reducing its distress, as explored in research from{' '}
            <a href="https://doi.org/10.1038/s41586-019-1433-7" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Nature (DOI: 10.1038/s41586-019-1433-7)</a> and{' '}
            <a href="https://doi.org/10.3389/fnbeh.2011.00024" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Frontiers in Behavioral Neuroscience (DOI: 10.3389/fnbeh.2011.00024)</a>.
          </p>
          <p>
            This process is supported by neural plasticity, where synaptic connections are modified, effectively erasing the emotional pain while preserving the factual memory.
          </p>
          <p>
            In clinical practice, memory reconsolidation is revolutionizing psychotherapy, as highlighted in Coherence Therapy’s work (e.g.,{' '}
            <a href="https://www.coherencetherapy.org/files/CNOTE6_Overview_of_CT_and_Its_Use_Of_MR.pdf" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Coherence Therapy Overview</a>).
          </p>
          <p>
            For the reprogramming mind app, it offers a sci-fi-inspired, user-friendly way to guide individuals through this process, helping them rewrite traumatic or ex-memories with a futuristic interface, making healing accessible and engaging.
          </p>
          <p>
            Memory Reconsolidation in Humans:{' '}
            <a href="https://www.frontiersin.org/journals/behavioral-neuroscience/articles/10.3389/fnbeh.2011.00024/full" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
              https://www.frontiersin.org/journals/behavioral-neuroscience/articles/10.3389/fnbeh.2011.00024/full
            </a>
          </p>
        </FAQItem>

        <FAQItem question="What are prediction errors?">
          <p>
            ‘Prediction errors drive the updating of consolidated memories.’ Prediction errors in the reconsolidation app are mismatch experiences (e.g., ‘Becoming a National Hero’) in the clients narrative to create an unmistakable disconfirmation of the learning schema acquired during the target event.
          </p>
          <p>
            (Prediction errors in memory){' '}
            <a href="https://pubmed.ncbi.nlm.nih.gov/31506189/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
              https://pubmed.ncbi.nlm.nih.gov/31506189/
            </a>
          </p>
          <p>Study Links:</p>
          <ul className="list-disc list-inside ml-4">
            <li><a href="https://pubmed.ncbi.nlm.nih.gov/33211519/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">https://pubmed.ncbi.nlm.nih.gov/33211519/</a> (RTM application)</li>
            <li><a href="https://www.sciencedirect.com/science/article/pii/S0732118X22000150" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">https://www.sciencedirect.com/science/article/pii/S0732118X22000150</a> (Traumatic memory reconsolidation)</li>
          </ul>
        </FAQItem>

        <FAQItem question="How long does the Reconsolidation program take?">
          <p>
            Reconsolidation via the reprogramming mind app typically takes 3-5 sessions, totaling about 5 hours, with rapid results for PTSD, as demonstrated in the 2020 PubMed study and supported by ScienceDirect’s review of PTSD treatment timelines.
          </p>
          <p>
            Study Link:{' '}
            <a href="https://pubmed.ncbi.nlm.nih.gov/33211519/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
              https://pubmed.ncbi.nlm.nih.gov/33211519/
            </a> (duration and efficacy)
          </p>
        </FAQItem>

        <FAQItem question="What is the Reprogramming Mind ‘Reconsolidation Program’ app, and how does it work?">
          <p>
            Reprogramming Mind app is using a memory reconsolidation protocol to rewrite traumatic or ex-memories, with a futuristic interface and guided phases for PTSD and heartbreak recovery, based on PubMed and ScienceDirect’s review of traumatic memory treatments.
          </p>
          <p>(RTM application)</p>
          <p>
             <a href="https://www.sciencedirect.com/science/article/pii/S0732118X22000150" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
              https://www.sciencedirect.com/science/article/pii/S0732118X22000150
            </a> (Traumatic memory reconsolidation)
          </p>
        </FAQItem>

        <FAQItem question="Can the app really help me forget my ex?">
          <p>
            The app helps you forget your emotional response to memories of your ex not the memory itself. In other words, you will remember but will feel different by processing the emotion related to that memory, for good.
          </p>
          <p>Study Links:</p>
          <ul className="list-disc list-inside ml-4">
            <li><a href="https://pubmed.ncbi.nlm.nih.gov/31506189/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">https://pubmed.ncbi.nlm.nih.gov/31506189/</a> Emotional processing</li>
          </ul>
        </FAQItem>

        <FAQItem question="Is my data safe with Reprogramming Mind?">
          <p>
            Yes, we use encryption and aim for GDPR/CCPA compliance—your memories and personal info stay secure in the digital grid, aligned with ethical standards. Please review our{' '}
             {/* Internal link using React Router */}
            <Link to="/privacy-policy" className="text-primary hover:underline">Privacy Policy</Link> for full details.
          </p>
          <p>
            Study Link:{' '}
            <a href="https://www.frontiersin.org/journals/behavioral-neuroscience/articles/10.3389/fnbeh.2011.00024/full" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
              https://www.frontiersin.org/journals/behavioral-neuroscience/articles/10.3389/fnbeh.2011.00024/full
            </a> (Ethical considerations in PTSD treatments)
          </p>
          {/* Removed Website Link to privacy policy as it's now an internal link */}
        </FAQItem>

        <FAQItem question="What if I feel uncomfortable during treatment?">
          <p>
            You will feel uncomfortable during the treatment. Some of protocols in the treatment call for the client to imagine experiences backwards which will likely create discomfort. e.g. skiing up a hill in reverse.
          </p>
          <p>Study Links:</p>
          <ul className="list-disc list-inside ml-4">
            <li><a href="https://pubmed.ncbi.nlm.nih.gov/33211519/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">https://pubmed.ncbi.nlm.nih.gov/33211519/</a> (RTM safety measures)</li>
            <li><a href="https://www.sciencedirect.com/science/article/pii/S0732118X22000150" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">https://www.sciencedirect.com/science/article/pii/S0732118X22000150</a> (Safety in PTSD treatment)</li>
          </ul>
        </FAQItem>

        <FAQItem question="How Effective is the Reconsolidation Program for PTSD?">
          <p>
            Reconsolidating memories in our app mirrors the functionality of the process used with the 90% success rate for eliminating PTSD symptoms, per the 2020 PubMed study and Frontiers in Behavioral Neuroscience’s review of PTSD treatments.
          </p>
          <p>Study Links:</p>
          <ul className="list-disc list-inside ml-4">
            <li><a href="https://pubmed.ncbi.nlm.nih.gov/33211519/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">https://pubmed.ncbi.nlm.nih.gov/33211519/</a> (RTM’s 90% success rate)</li>
            <li><a href="https://www.frontiersin.org/journals/behavioral-neuroscience/articles/10.3389/fnbeh.2011.00024/full" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">https://www.frontiersin.org/journals/behavioral-neuroscience/articles/10.3389/fnbeh.2011.00024/full</a> (Comparative RTM efficacy)</li>
            <li><a href="https://www.nature.com/articles/s41586-019-1433-7" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">https://www.nature.com/articles/s41586-019-1433-7</a> (Neural efficacy of reconsolidation)</li>
          </ul>
        </FAQItem>

        <FAQItem question="What if RTM doesn’t work for me?">
          <p>
            If results are limited, consult a therapist—our app’s success rate is high, but individual responses vary, as noted in PubMed and ScienceDirect’s review of challenges in PTSD treatment.
          </p>
          <p>Study Links:</p>
          <ul className="list-disc list-inside ml-4">
            <li><a href="https://pubmed.ncbi.nlm.nih.gov/33211519/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">https://pubmed.ncbi.nlm.nih.gov/33211519/</a> (RTM limitations)</li>
            <li><a href="https://www.sciencedirect.com/science/article/pii/S0732118X22000150" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">https://www.sciencedirect.com/science/article/pii/S0732118X22000150</a> (Challenges in PTSD treatment)</li>
          </ul>
        </FAQItem>

        {/* Footer Links */}
        <div className="mt-12 pt-6 border-t border-border text-center text-sm text-muted-foreground space-x-4">
          <Link to="/privacy-policy" className="hover:text-primary">Privacy Policy</Link>
          {/* Add Terms link if you create that page */}
          {/* <Link to="/terms-conditions" className="hover:text-primary">Terms and Conditions</Link> */}
          {/* Add Contact link/info if desired */}
          {/* <a href="mailto:support@reprogrammingmind.com" className="hover:text-primary">Contact</a> */}
        </div>

      </div> {/* End max-w-3xl */}
    </div> // End container div
  );
};

export default FAQ;