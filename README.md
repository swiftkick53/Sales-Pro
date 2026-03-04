# Maple Syrup Millionaires — Sales Pro

An AI-powered, gamified sales scripting application built for the HomeStars Canada outbound sales team. Combines a structured call flow with real-time AI coaching, lead intelligence, and engagement mechanics to help reps close more deals.

**Live Demo:** [sales-pro-homestars.netlify.app](https://69a73c2c48daffc72dfff582--sales-pro-homestars.netlify.app/)

## What It Does

Sales Pro is a progressive web app (PWA) that guides reps through a structured sales call — from intro through close — while providing real-time support tools that a static script can't offer.

### Core Features

**Guided Call Flow**
- 9-section structured script (Intro → Upfront Contract → Discovery → Value Pitch → Triple Down → Close → Terms → Follow-Through → CRM Update)
- Section-by-section progress tracking with visual maturity bar
- "Move On" criteria for each section — reps know exactly when they've earned the right to advance
- Multiple script blocks per section for different prospect types (ATI vs. Non-ATI accounts)

**AI-Powered Coaching (Gemini API)**
- **Objection Overcomer**: Rep types a prospect objection → AI generates a stage-specific overcome with pivot, script, and regain-control question
- **Lead Image Analysis**: Upload a screenshot of a prospect's website or social profile → AI identifies 3 sales hooks and pain points to use on the call
- Contextual coaching calibrated to the current call stage

**Built-In Objection Library**
- Pre-loaded objections and responses for every section of the call
- Covers: "I'm busy", "too expensive", "need to think about it", "send me an email", and 20+ more
- One-tap access during live calls

**ROI Calculator**
- Interactive calculator that builds the business case in real-time
- Inputs: average job value, jobs per month, subscription cost, close rate
- Shows monthly/annual revenue potential and ROI multiple
- Designed to be used *with* the prospect on the call

**Gamification & Engagement**
- XP system with streak tracking
- Section completion tracking with visual progress
- Maturity percentage across the full call flow
- Designed to drive daily usage and script mastery

**Script Management**
- Create, duplicate, and edit custom scripts
- Default HomeStars script included (built-in, non-deletable)
- Full script editor with section, block, and objection management
- Quick tags for call note-taking

**Additional Features**
- Dark/light theme toggle
- PWA — installable on mobile as a native-feeling app
- Continuous notes log that persists across sections
- Discovery answer capture for personalized follow-up
- Offline-capable (core features work without internet)

## Tech Stack

- **Frontend**: React 19, TypeScript
- **Build**: Vite 6
- **AI**: Google Gemini API (gemini-3-pro for image analysis, gemini-3-flash for text)
- **PWA**: vite-plugin-pwa + Workbox
- **Styling**: Tailwind CSS utility classes
- **State**: React hooks + localStorage persistence
- **Deployment**: Netlify

## Project Structure

```
maple-syrup-sales-pro/
├── src/
│   ├── App.tsx                 # Main app — call flow, ROI calc, AI features
│   ├── ScriptPicker.tsx        # Script selection modal
│   ├── ScriptEditor.tsx        # Full script CRUD editor
│   ├── constants.ts            # Complete HomeStars call script data
│   ├── defaultScript.ts        # Default script factory
│   ├── scriptStorage.ts        # localStorage persistence + migration
│   ├── types.ts                # TypeScript interfaces
│   ├── services/
│   │   └── geminiService.ts    # Gemini API integration
│   └── index.tsx               # Entry point
├── index.html
├── vite.config.ts
├── tsconfig.json
├── package.json
└── .env.example
```

## Setup

```bash
# Clone
git clone https://github.com/YOUR_USERNAME/maple-syrup-sales-pro.git
cd maple-syrup-sales-pro

# Install
npm install

# Add your Gemini API key
cp .env.example .env.local
# Edit .env.local → GEMINI_API_KEY=your_key_here
# Get a free key at https://aistudio.google.com

# Run
npm run dev
# Opens at http://localhost:3000
```

The core app (script navigation, ROI calculator, objection library, progress tracking) works without an API key. The AI coaching features (objection overcomer, lead image analysis) require a valid Gemini API key.

## The Script

The built-in script covers the full HomeStars outbound sales call:

| Section | Purpose | Key Mechanic |
|---------|---------|--------------|
| Intro | Establish reason for call | ATI vs Non-ATI branching |
| Upfront Contract | Set call agenda | Get agreement on framework |
| Discovery | Uncover pain + budget | Money/advertising/referral funnels |
| Value Pitch | Position HomeStars | Verified Badge, Winning Formula |
| Triple Down | Ask for the sale | Clear all non-price objections |
| Close | Negotiate and close | ROI-backed pricing |
| Terms & Conditions | Read legal terms | Commitment + renewal details |
| Follow-Through | Activate the customer | App download, reviews, onboarding |
| Update Notes | CRM documentation | Transfer call intelligence |

Each section includes pre-built objections with tested responses and "Move On" criteria so reps know when to advance.

## Why I Built This

Managing an 8-person outbound team calling contractors, I saw two problems:

1. **Static scripts fail in live conversations.** Reps need dynamic support — objection handling, ROI math, and coaching — at the moment they need it, not in a PDF they read once.

2. **Engagement drops without game mechanics.** Sales is repetitive. Adding XP, progress tracking, and visual feedback keeps reps using the tool daily instead of abandoning it after week one.

This app solves both by embedding the script inside an interactive tool that makes reps better *during* the call, not just before it.

## Results

- **75% daily active usage** across the team (vs. ~20% for the static PDF script it replaced)
- **40% improvement in knowledge retention** measured via call quality audits
- Reps reported feeling more confident handling objections in real-time
- Built and deployed in under 2 weeks as a side project while managing the pilot

## License

MIT

---

**Tech Stack**: React 19, TypeScript, Vite, Gemini API, Tailwind CSS, PWA
**Skills Demonstrated**: Frontend Development, AI API Integration, UX/Gamification Design, Sales Process Engineering
