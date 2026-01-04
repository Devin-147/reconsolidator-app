# The Reconsolidator App

The Reconsolidator App is a web-based well-being tool designed to help users reprocess and reduce the emotional impact of targeted memories. It leverages the clinically-backed Reconsolidation of Traumatic Memories (RTM) protocol in a self-guided, multi-day treatment program.

The core of the application guides users through a structured, narrative-driven process to update and reconsolidate the "emotional wiring" of a target memory. This is supplemented by a premium, AI-powered visual experience that generates personalized, cinematic videos to enhance the therapeutic effect.

---

## Core Features

*   **Multi-Day Treatment Program:** A structured 5-treatment course with integrated rest days to allow for memory reconsolidation.
*   **Clinically-Aligned Calibration:** A comprehensive, multi-step onboarding process to define the target event, establish SUDS (Subjective Units of Distress) ratings, and gather "bookend" and neutral memories.
*   **Audio-Based Treatment:** The foundational experience uses a hypnotic animated logo ("The Reconsolidator") with synchronized AI-generated audio for the 11 prediction error narratives.
*   **Progress Tracking:** Users rate their SUDS score at multiple points to track their progress and see the reduction in distress.

### Premium Visual Experience

*   **AI-Powered Personalization:** Users can upload a selfie, which is analyzed by a Vision AI (Google Gemini) to create a "visual ID."
*   **Cinematic Video Generation:** The application's "Video Factory" uses the user's visual ID and their 11 chosen narratives to generate 11 unique, 45-second, cinematic-quality videos.
*   **Visual Integration:** Premium users can experience the treatment through these powerful, personalized videos instead of the standard audio-only format.
*   **Thumbnail Grid Selection:** A visual grid of thumbnails allows users to intuitively select 8 of the 11 narratives for the reversal phase.
*   **Reversal Clips:** The system generates new, short, structurally reversed video clips to complete the reconsolidation process.

---

## Technology Stack

*   **Frontend:** React, Vite, TypeScript, Tailwind CSS
*   **Routing:** React Router DOM
*   **Backend:** Vercel Serverless Functions
*   **Database & Storage:** Supabase (PostgreSQL database and S3-compatible storage)
*   **AI Models:**
    *   **Vision:** Google Gemini Pro Vision (for selfie analysis)
    *   **Video:** Google AI Video Generation Models (e.g., Veo, via API)
    *   **Audio:** Google Cloud Text-to-Speech
*   **Video Processing:** FFmpeg
*   **Payments:** Stripe
*   **Transactional Email:** Resend

---

## Local Development Setup

To run this project on your local machine, follow these steps:

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/Devin-147/reconsolidator-app.git
    cd reconsolidator-app
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Set up environment variables:**
    *   Create a new file in the root directory named `.env`.
    *   Add the following required keys to this file, filling in your own secret values. **Do not commit this file to GitHub.**
    ```env
    VITE_SUPABASE_URL=...
    VITE_SUPABASE_ANON_KEY=...
    GOOGLE_API_KEY=...
    STRIPE_SECRET_KEY=...
    RESEND_API_KEY=...
    ```

4.  **Run the development server:**
    ```bash
    npm run dev
    ```
    The application will be available at `http://localhost:5173` (or a similar address).

---

## Deployment

This project is configured for continuous deployment on **Vercel**. Any push or merge to the `main` branch on GitHub will automatically trigger a new production build and deployment.
