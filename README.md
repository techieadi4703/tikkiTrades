# 💹 Tikki Trades - Premium Market Analytics Platform

Tikki Trades is a **production-ready financial terminal** designed for modern traders. It leverages **Next.js 16**, **Framer Motion**, and **Multi-LLM Intelligence** (Gemini & Groq) to deliver a high-performance, interactive, and visually stunning market analysis experience.


> **🏆 Premium Trading Terminal - Complete AI-First Overhaul**  
> Rebranded to a cohesive "Emerald-on-Black" aesthetic with a 100% viewport-optimized layout and professional-grade AI coaching.

## 🏁 Full Platform Walkthrough

Experience the complete user journey from authentication to deep market analytics:

![Full Platform Walkthrough](./public/assets/tikki_trades_full_walkthrough_1774715686243.webp)

---

## 🎯 Platform System Architecture

Tikki Trades is built on a modular, multi-layered architecture designed for visual excellence and real-time financial data processing.

```mermaid
graph TD
    %% Node Definitions
    Trader((Trader / User))
    
    subgraph IH [Intelligence Hub]
        Groq["Groq Llama 3.3 (Watchlist)"]
        Gemini["Gemini 2.5 (Trade Coach)"]
    end

    subgraph CL [Communication Layer]
        Nodemailer["Nodemailer"]
        Emails["Email: Welcome / Pulse / Sentinel"]
        Nodemailer --> Emails
    end

    subgraph CI [Client Interface]
        NextJS["Next.js 16 Terminal UI"]
    end

    subgraph DP [Data Providers]
        Finnhub["Finnhub (Live Quotes)"]
        Yahoo["Yahoo Finance (History)"]
    end

    subgraph AS [Authentication & Storage]
        BetterAuth["Better-Auth"]
        MongoDB["MongoDB Store"]
        BetterAuth --> MongoDB
    end

    subgraph WE [Workflow Engine]
        Inngest["Inngest (Event Orchestrator)"]
    end

    %% Interaction Flows
    Trader <--> NextJS
    NextJS --> AS
    NextJS --> DP
    NextJS <--> IH
    
    IH -- "Generate Content" --> Nodemailer
    Emails -. "Direct to User" .-> Trader
    
    AS -- "Trigger Events" --> WE
    WE -- "Execute Schedule" --> IH
    WE -- "Request Analysis" --> IH

    %% Styling
    style IH fill:#064e3b,stroke:#10b981,color:#fff
    style CL fill:#064e3b,stroke:#10b981,color:#fff
    style CI fill:#064e3b,stroke:#10b981,color:#fff
    style DP fill:#064e3b,stroke:#10b981,color:#fff
    style AS fill:#064e3b,stroke:#10b981,color:#fff
    style WE fill:#064e3b,stroke:#10b981,color:#fff
    style Trader fill:#022c22,stroke:#059669,color:#fff
```

### **1. Visual Identity Layer**
- **Modern Web Interface**: Responsive layout grid with the **Geist** font family (Sans/Mono) for high-performance readability.
- **Color Palette**: A curated emerald-on-black system (`#10b981`) for professional financial aesthetics.

### **2. UX Engine Layer**
- **Orchestrated Animations**: State-driven transitions and interactive elements powered by Framer Motion.
- **Viewport Locking**: Strict content locking within the viewport to maintain a native "app-like" feel on desktop.

### **3. Feature Modules Layer**
- **Watchlist Assistant**: Real-time asset queries and market analysis powered by **Groq (Llama 3.3 70B)**.
- **AI Trade Coach**: Intelligent trade journaling and bias detection powered by **Gemini 2.5 Flash**.
- **Portfolio Intelligence**: Real-time holding tracking with unrealized PnL analysis and growth metrics.
- **Intelligent Mail Alerts**: Personalized onboarding, daily summaries, and 15-minute price sentinel alerts.

---

## 🚀 Core Features & Implementation

| Feature                              | Implementation Details                                                                 | Status |
| ------------------------------------ | -------------------------------------------------------------------------------------- | ------ |
| **🎨 Emerald Rebranding**             | 100% theme unification with custom CSS variables and Tailwind 4 tokens                | ✅      |
| **🧠 AI Trade Coach**                | Direct-to-Gemini integration for unbiased trade journal reviews and thesis scoring     | ✅      |
| **💬 Watchlist Assistant**           | Context-aware asset queries powered by Groq (Llama 3.3 70B) for instant market news    | ✅      |
| **📬 Smart Alerts**                  | AI-personalized emails, price triggers, and daily market pulses via Inngest           | ✅      |
| **💼 Portfolio Tracker**             | Live PnL analysis with real-time price updates via Finnhub/Yahoo Finance               | ✅      |
| **📈 Technical Analytics**           | Real-time gauge indicators and technical analysis summaries on stock pages             | ✅      |
| **🛠️ Framework Excellence**          | Next.js 16 (App Router) + React 19 for maximum performance and hydration stability    | ✅      |

---

## 🛠️ Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
- **Runtime**: [React 19](https://react.dev/) (Server Components & Actions)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/) (Modern JIT Engine)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **AI Engines**: [Gemini 2.5 Flash](https://deepmind.google/technologies/gemini/), [Groq (Llama 3.3 70B)](https://groq.com/)
- **Market Data**: [Finnhub API](https://finnhub.io/), [Yahoo Finance](https://github.com/gadicc/node-yahoo-finance2)
- **Database**: [MongoDB](https://www.mongodb.com/) with [Mongoose](https://mongoosejs.com/)
- **Auth**: [Better-Auth](https://www.better-auth.com/) (Secure DB Sessions)
- **Orchestration**: [Inngest](https://www.inngest.com/) (Serverless Queues & Crons)

---

## 📋 Architecture: How It Works

### 1. Viewport Locking & Layout
The platform uses a strict viewport-locking strategy to provide a native desktop application experience:

```mermaid
graph LR
    A[Root Layout] --> B[Animated Background]
    B --> C[Main Container]
    C --> D[Left: Scrollable Table]
    C --> E[Right: Scrollable Chatbot]
    style C fill:#064e3b,stroke:#10b981,color:#fff
```

### 2. Intelligent Mail Alerts (Inngest & Nodemailer)
The "Heartbeat" of the platform is an event-driven automation engine:
- **Personalized Onboarding**: Automatically triggers a welcome email where Gemini introduces the user to the terminal based on their specific goals.
- **Daily Market Pulse**: Scheduled every day at 12:00 PM UTC to send AI-summarized news for all symbols in a user's watchlist.
- **Price Sentinel**: A 15-minute cron job that monitors market prices against user-defined targets, triggering immediate email and in-app notifications.

---

## 📸 Visual Gallery

### **Premium Sign In Experience**
![Sign In Experience](./public/assets/signin_page_1774715738679.png)

### **Market Dashboard & Heatmaps**
![Dashboard Overview](./public/assets/dashboard_page_1774715857829.png)

### **Viewport-Locked Watchlist**
![Watchlist Layout](./public/assets/watchlist_page_1774715884186.png)

### **Stock Pulse Analytics**
![Stock Details](./public/assets/stock_details_page_1774716004955.png)

---

## 📦 Installation

1. **Clone & Install**
   ```bash
   git clone https://github.com/techieadi4703/tikki-trades.git
   cd tikki-trades
   npm install
   ```

2. **Configure Environment**
   Create a `.env.local` file and add the following keys:
   ```bash
   NEXT_PUBLIC_FINNHUB_API_KEY=your_key
   GEMINI_API_KEY=your_key
   GROQ_API_KEY=your_key
   MONGODB_URI=your_uri
   BETTER_AUTH_SECRET=your_secret
   BETTER_AUTH_URL=http://localhost:3000
   NODEMAILER_EMAIL=your_email
   NODEMAILER_PASSWORD=your_password
   ```

3. **Launch**
   ```bash
   npm run dev
   ```

---

**Built with ❤️ for Modern Traders by techieadi4703**
