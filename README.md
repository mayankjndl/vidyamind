<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=white" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Groq-LLM-orange?style=for-the-badge" alt="Groq" />
  <img src="https://img.shields.io/badge/Framer_Motion-12-FF0080?style=for-the-badge&logo=framer&logoColor=white" alt="Framer Motion" />
  <img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge" alt="License" />
</p>

<h1 align="center">🧠 VidyaMind</h1>
<h3 align="center">The Cognitive Learning Operating System</h3>

<p align="center">
  <strong>AI-powered personalized tutoring with knowledge graph diagnosis, Bayesian mastery tracking, rubric-aware grading, and spaced repetition scheduling — built for every student in India.</strong>
</p>

<p align="center">
  <a href="https://vidyamind.vercel.app/"><img src="https://img.shields.io/badge/🚀_Live_Demo-vidyamind.vercel.app-blueviolet?style=for-the-badge" alt="Live Demo" /></a>
</p>

---

## ✨ What is VidyaMind?

VidyaMind is a **full-stack cognitive learning platform** that goes beyond traditional study apps. It doesn't just show you content — it *understands what you know*, *diagnoses what you don't*, and *builds a personalized learning path* that adapts in real-time using AI and learning science.

Built for Indian competitive exams (NEET, JEE Main, JEE Advanced, CUET, and more), VidyaMind combines:
- 🤖 **AI Tutoring** — One-on-one concept explanations via LLM
- 🧠 **Knowledge Graph Diagnosis** — Maps your understanding across interconnected topics
- 📊 **Bayesian Knowledge Tracing (BKT)** — Probabilistic mastery estimation per concept
- 📝 **Rubric-Aware Grading** — AI evaluates answers with detailed feedback
- 📅 **Algorithmic Study Planner** — Full day-by-day plans with spaced repetition
- 🗺️ **Interactive Roadmaps** — Visual learning paths for each exam

---

## 🚀 Live Demo

**👉 [vidyamind.vercel.app](https://vidyamind.vercel.app/)**

---

## 🎯 Key Features

### 🤖 AI Tutor
Conversational AI tutor powered by Groq LLMs. Ask questions about any topic, get step-by-step explanations with LaTeX math rendering, code examples, and contextual follow-ups. Supports multiple Indian languages.

### 🧠 Knowledge Graph
Automatically generates a visual knowledge graph from your exam syllabus. See how topics connect, identify knowledge gaps, and understand prerequisite chains.

### 📊 Bayesian Mastery Tracking
Uses **Bayesian Knowledge Tracing (BKT)** — the same algorithm used by Carnegie Learning and Khan Academy — to probabilistically estimate your mastery of each concept based on your response history.

### 📝 Smart Evaluation
AI-powered answer evaluation with rubric-aware grading. Get detailed feedback on what you got right, what's missing, and suggestions for improvement. Includes academic integrity checks.

### 📅 Spaced Repetition Study Planner
Generates **full day-by-day study plans** (up to 180 days) using a deterministic spaced repetition algorithm:
- Topics scheduled with increasing review intervals (Day 0 → 1 → 3 → 7 → 14 → 30 → 60)
- Weak areas prioritized first
- Each day fills your exact hours/day setting with 45-min sessions
- Collapsible **Month > Week > Day** hierarchy with progress tracking
- Click-to-mark sessions: ✅ Completed, 📝 Revision, ❌ Missed
- Status auto-propagates from sessions → days → weeks → months

### 🗺️ Interactive Roadmap
Visual learning roadmap organized by subjects and topics. Track progress through the entire exam syllabus with mastery-based color coding.

### 📚 Concept Learning
Study any topic with AI-generated explanations. Organized by subject and roadmap sequence. Search functionality to find any topic instantly.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    VidyaMind Frontend                     │
│               Next.js 16 + React 19 + TypeScript         │
├──────────┬──────────┬──────────┬──────────┬──────────────┤
│  AI      │ Knowledge│  Study   │  Mastery │  Evaluation  │
│  Tutor   │  Graph   │  Planner │  Engine  │  Engine      │
├──────────┴──────────┴──────────┴──────────┴──────────────┤
│                    Zustand State Management               │
│              (Persistent + Knowledge Graph)               │
├─────────────────────────────────────────────────────────┤
│                    Groq LLM API (Free Tier)              │
│                 llama-3.3-70b-versatile                   │
└─────────────────────────────────────────────────────────┘
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 16 (App Router, Turbopack) |
| **UI Library** | React 19 |
| **Language** | TypeScript 5 |
| **Styling** | Vanilla CSS + CSS Variables (Dark theme) |
| **State Management** | Zustand (with localStorage persistence) |
| **LLM Provider** | Groq (llama-3.3-70b-versatile) |
| **Animations** | Framer Motion 12 |
| **Math Rendering** | KaTeX |
| **Markdown** | react-markdown + react-syntax-highlighter |
| **UI Components** | Radix UI primitives |
| **Icons** | Lucide React |
| **Graph Visualization** | react-force-graph-2d |
| **Deployment** | Vercel |

---

## 📦 Getting Started

### Prerequisites

- Node.js 18+ installed
- A free [Groq API key](https://console.groq.com/)

### Installation

```bash
# Clone the repository
git clone https://github.com/mayankjndl/vidyamind.git
cd vidyamind

# Install dependencies
npm install

# Create environment file
echo "GROQ_API_KEY=your_groq_api_key_here" > .env.local

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for Production

```bash
npm run build
npm start
```

---

## 📖 How It Works

### 1. Register & Select Your Exam
Choose from NEET, JEE Main, JEE Advanced, CUET, or other Indian competitive exams.

### 2. Explore Your Roadmap
VidyaMind generates a complete topic roadmap for your exam, organized by subjects.

### 3. Learn with AI
Click any topic to get AI-generated explanations. Ask follow-up questions, switch languages, and dive deeper.

### 4. Get Evaluated
Write answers and get rubric-aware AI evaluation with detailed feedback and scoring.

### 5. Track Mastery
Your mastery of each concept is tracked using Bayesian Knowledge Tracing. Watch your understanding grow.

### 6. Plan Your Study
Set your exam date and hours/day. Get a full day-by-day study plan with spaced repetition scheduling. Track daily progress with visual status markers.

---

## 🧪 Algorithms

### Bayesian Knowledge Tracing (BKT)
```
P(Lₙ) = P(Lₙ₋₁|obs) + (1 - P(Lₙ₋₁|obs)) × P(T)
```
Where P(L) is mastery probability, P(T) is transition probability, updated after each student response.

### Spaced Repetition
Review intervals follow expanding gaps: **0 → 1 → 3 → 7 → 14 → 30 → 60 days**, adjusted based on mastery level and exam proximity.

### Readiness Calculation
```
readiness = startReadiness + roomToGrow × (1 - e^(-k × coverage))
```
Deterministic formula using total study hours, topic count, and current mastery. No LLM guessing.

---

## 🌐 Supported Exams

| Exam | Subjects |
|---|---|
| 🩺 NEET UG 2026 | Physics, Chemistry, Biology |
| ⚙️ JEE Main 2026 | Physics, Chemistry, Mathematics |
| 🔬 JEE Advanced 2026 | Physics, Chemistry, Mathematics |
| 🎓 CUET 2026 | English, General Test, Domain Subjects |

---

## 📁 Project Structure

```
vidyamind/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── api/ai/             # API routes (tutor, evaluate, study-plan, KG)
│   │   ├── auth/               # Login & registration
│   │   ├── dashboard/          # Main dashboard pages
│   │   │   ├── evaluate/       # Answer evaluation
│   │   │   ├── learn/          # Concept learning
│   │   │   ├── planner/        # Study planner
│   │   │   └── roadmap/        # Visual roadmap
│   │   └── page.tsx            # Landing page
│   ├── components/             # Reusable UI components
│   ├── lib/
│   │   ├── ai/                 # Groq client & prompts
│   │   ├── data/               # Exam syllabi data
│   │   ├── knowledge-graph/    # KG types & builder
│   │   ├── mastery/            # BKT & spaced repetition
│   │   └── planner/            # Algorithmic plan generator
│   └── store/                  # Zustand stores
├── backend/                    # Python FastAPI backend (optional)
└── public/                     # Static assets
```

---

## 🤝 Contributing

Contributions are welcome! Whether it's:
- 🐛 Bug fixes
- ✨ New features
- 📚 Adding new exam syllabi
- 🌐 Adding language support
- 📖 Documentation improvements

Feel free to open an issue or submit a pull request.

---

## 📝 License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.

---

## 👨‍💻 Author

**Mayank Jindal**
- GitHub: [@mayankjndl](https://github.com/mayankjndl)

---

<p align="center">
  <strong>⭐ If VidyaMind helps you learn, give it a star! ⭐</strong>
</p>

---

### Keywords

`ai-education` `edtech` `study-planner` `knowledge-graph` `bayesian-knowledge-tracing` `spaced-repetition` `ai-tutor` `neet-preparation` `jee-preparation` `competitive-exams` `india` `personalized-learning` `next.js` `react` `typescript` `groq` `llm` `cognitive-learning` `mastery-tracking` `exam-readiness`
