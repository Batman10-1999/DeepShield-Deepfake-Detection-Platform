# TrustLens AI Verification

Build a complete web application:

"TrustLens AI – Deepfake Detection & Verification System"

⚠️ IMPORTANT:

- The web client runs standalone; analysis is served by the DeepShield FastAPI backend

- Use React (Vite) frontend only

- All features must work without server

- No broken UI, no console errors

=====================================================

🧠 CORE FEATURES (WORKING LOGIC)

=====================================================

1) FILE UPLOAD

- Accept:

  • Images (.jpg, .png)

  • Videos (.mp4)

- Show file name after selection

- Button: "Analyze"

-----------------------------------------------------

2) AI ANALYSIS (SIMULATED BUT REALISTIC)

IMAGE ANALYSIS:

- Use Canvas API to process image

- Extract:

   • Brightness

   • Edge intensity (approx)

   • Pixel variation (noise)

- Based on values:

   • Decide:

       Real / Fake / Fake / Uncertain

- Confidence:

   random within controlled range (60–90%)

VIDEO ANALYSIS:

- Extract frames using HTMLVideoElement

- Analyze first 5–8 frames

- Apply majority voting

- Return final result

IMPORTANT:

- Must feel real (not random output)

- Keep results consistent for same input

-----------------------------------------------------

3) RESULT DISPLAY

Card titled "AI Analysis":

- Result:

   • Green → Real

   • Red → Fake

   • Orange → Fake / Uncertain

- Confidence:

   • Show percentage

   • Animated progress bar

- Explanation:

   • 2–3 bullet points

   • Example:

       "Natural texture detected"

       "Consistent edge patterns"

       "No major anomalies found"

-----------------------------------------------------

4) CERTIFICATE SYSTEM (WORKING)

- Generate PDF using jsPDF

- Include:

   • Title: TrustLens AI Verification Certificate

   • Result

   • Confidence

   • Uploaded image preview

   • Footer (bold):

       "Verified using AI-based detection system"

- Show preview

- Provide download button

-----------------------------------------------------

🎨 UI DESIGN (HIGH-END DASHBOARD)

Layout:

- Left sidebar (dark blue)

- Main content centered

Sidebar:

- Dashboard (active)

- Rounded highlight

- Hover effects

Main:

- Light blue gradient background

- Title: TrustLens AI

- Subtitle: AI-Powered Deepfake Detection System

Cards:

- White

- Rounded corners

- Soft shadow

- Clean spacing

Icons:

- Upload → cloud icon

- Analysis → brain icon

- Certificate → document icon

Buttons:

- Blue gradient

- Hover effect

Animations:

- Smooth fade-in

- Progress bar animation

-----------------------------------------------------

⚙️ TECH STACK

- React (Vite)

- HTML + CSS

- Canvas API

- jsPDF

-----------------------------------------------------

🧠 ERROR HANDLING

- No file → show message

- Invalid format → show message

- No crashes

- Always show explanation as bullet points

-----------------------------------------------------

🎯 GOAL

- Must feel like real AI system

- Clean, professional UI

- Fully working web client

- No need to download or run locally

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
