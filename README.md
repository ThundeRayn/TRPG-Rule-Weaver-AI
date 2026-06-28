### TRPG-Rule-Weaver - your beginner AI tutor

TRPG Rule Weaver is a beginner-friendly TRPG AI Tutor specifically designed for players and game masters. 

![hippo](https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExcXg4am4yZ2llOGpzeHloZXloOHZsOHVjNnJ0cDlnaThwczQzczQweiZlcD12MV9naWZzX3NlYXJjaCZjdD1n/Bw4e7THBSRnR56mwX0/giphy.gif)

#### This project is for people who are
- totally new to TRPG COC rules, and wanna be a player for the first time
- have played several games, but wanna be a game master for the first time
- have basic understanding for the game, but wanna enhance their understanding without reading the plain rule book

**OR**
- You just have trouble reading long text rules


![hippo](https://media.giphy.com/media/v1.Y2lkPWVjZjA1ZTQ3anJ0ZnA1d2h4aXhqZ3k5aWIxcHN5YjE0eG5oZWpyMnZsaXRwdnAxbyZlcD12MV9naWZzX3NlYXJjaCZjdD1n/xT5LMUModJiHeAaAz6/giphy.gif)
<br>

### This project is for you!

TRPG Rule Weaver is designed to tutor new players learn the basics of the Call of Cthulhu tabletop RPG quickly with fun interactive.
The goal is to make onboarding smoother for first-time players by providing:

- Step-by-step guidance through rules and character creation
- Sample scenarios and prompts for practice
- A lightweight, interactive interface for quick learning

#### Features

- Launch flow: walk you through the game intro, character build, basic rule, dice rule, without you reading each module in handbook

- RAG-grounded answers: every rule the AI tells you is cited from the actual CoC 7th Edition rulebook with [Source, p.XX] — no hallucinated rules

- Bilingual EN + CN: ask in English or Chinese, get answers in the same language, sourced from the matching language rulebook

- Scenario Simulator: AI simulates scenarios for you to help you understand the rules, no more "questions" during a real play

- AI tutor: Feel free to ask anything during the launching process, just like interacting with a real game master

- Session persistence: your conversation history is saved per session so you can pick up where you left off

- User accounts: sign up / log in to keep your sessions private and carry your progress across devices

#### Tech Stack

    Frontend: React 19 / TypeScript / Tailwind CSS v4 / ShadcnUI / React Router / React Markdown / Vite

    Backend: Node.js / Express 5 / DeepSeek API (LLM)

    RAG Pipeline: @huggingface/transformers (multilingual-e5-small) / pdf-parse / MongoDB Atlas Vector Search

    Storage: MongoDB Atlas (vector store + session persistence)

    Auth: JWT (jsonwebtoken / bcryptjs)

    vibe coding: DeepSeek

#### Installation
##### Host with your own API key
```
git clone https://github.com/ThundeRayn/TRPG-Rule-Weaver-AI.git
cd TRPG-Rule-Weaver-AI
```

**Backend**
```
cd Rule-Weaver-backend
npm install
```

Open `.env` and fill in your keys:
```
DEEPSEEK_API_KEY=your_deepseek_key
MONGODB_URI=your_mongodb_atlas_uri
JWT_SECRET=your_jwt_secret
```

Ingest the rulebook PDFs (first time only):
```
node ingest.js
```

Start the backend:
```
npm run dev
```

**Frontend**
```
cd Rule-Weaver-AI
npm install
npm run dev
```

Open http://localhost:5173
*or other localhost path on your pc*

#### Live Demo

👉 [waiting to be deployed...]

🏆 Built at

This project was built during AI THINKERER & GOOGLE CLOUD HACKATHON, TORONTO, 2025 under the studying topic - AI agents.

#### Developer

Shirong T.

Feel free to explore my portforlio here
https://shirong.site
