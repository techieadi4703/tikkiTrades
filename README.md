# 💹 Tikki Trades - Premium Market Analytics Platform

Tikki Trades is a **production-ready financial terminal** designed for modern traders. It leverages **Next.js 15**, **Framer Motion**, and **TradingView Intelligence** to deliver a high-performance, interactive, and visually stunning market analysis experience.


> **🏆 Premium Trading Terminal - Complete UI/UX Overhaul**  
> Rebranded from legacy systems to a cohesive "Emerald-on-Black" aesthetic with a 100% viewport-optimized layout and AI-powered insights.

## 🏁 Full Platform Walkthrough

Experience the complete user journey from authentication to deep market analytics:

![Full Platform Walkthrough](./public/assets/tikki_trades_full_walkthrough_1774715686243.webp)

---

## 🎯 Platform Overview

Tikki Trades directly addresses the need for professional-grade, interactive market tracking with a focus on visual excellence and performance:

| Feature                              | Implementation                                                                 | Status |
| ------------------------------------ | ------------------------------------------------------------------------------ | ------ |
| **Emerald Rebranding**               | Global design system using `@emerald-500` accents                              | ✅     |
| **Viewport-Locked Layout**           | Non-scrollable dashboard experience for Watchlist & Auth                        | ✅     |
| **Premium Animations**               | Staggered Framer Motion entries (Title → Form → Button)                         | ✅     |
| **AI Watchlist Assistant**           | Context-aware chatbot with auto-scrolling message streams                       | ✅     |
| **Interactive Grid System**          | Global animated background with pulsing high-contrast highlights                | ✅     |
| **TradingView Integration**          | Rich charting, heatmaps, and technical analysis widgets                        | ✅     |
| **Optimistic Multi-Row Tables**     | Immediate UI feedback on asset removal with slide-out animations                | ✅     |
| **Scale & Performance**             | Server-side data fetching with client-side interactivity transitions           | ✅     |

---

## 🚀 Features

✅ **Multi-Agent Branding** - 100% removal of legacy "Signalist" identity in favor of Tikki Trades.
✅ **Interactive Global UI** - Consistent `AnimatedBackground` grid system across all protected and public routes.
✅ **Viewport Excellence** - Dashboards are locked to `h-screen` to prevent broken layouts and provide an "app-like" feel.
✅ **Smart Internal Scrolling** - Independent scrollable regions for the Watchlist table and AI Sidebar.
✅ **Staggered Orchestration** - Premium entrance animations orchestrated via `containerVariants` and `itemVariants`.
✅ **Technical Gauge Indicators** - Real-time technical analysis visualization on stock detail pages.
✅ **Production-Stable** - Resolved all hydration mismatches and server/client boundary issues.

---

## 🛠️ Tech Stack

```
Framework:        Next.js 15 (App Router)
Styling:          Tailwind CSS (Glassmorphism & Custom Tokens)
Animations:       Framer Motion (Orchestrated Staggers & Exits)
Icons:            Lucide React
State Management: React Hooks (useState, useEffect, useRef)
Market Data:      TradingView Embedded Analytics
Deployment:       Vercel Ready
```

---

## 📋 Architecture: How It Works

### 1. Viewport Locking & Layout
The platform uses a strict viewport-locking strategy to provide a native desktop application experience:

```
[ Root Layout ]
      ↓
[ AnimatedBackground (Global Grid) ]
      ↓
[ Main Container (h-[calc(100vh-OFFSET)] overflow-hidden) ]
      ┌─────────────┴─────────────┐
      ↓                           ↓
[ Left: Scrollable Table ]  [ Right: Scrollable Chatbot ]
```

### 2. Framer Motion Orchestration
Authentication and Stock pages use staggered animation variants to guide the user's eye:
- **Title**: `y: -20, opacity: 0` → `y: 0, opacity: 1`
- **Inputs**: Delayed by `0.1s` intervals
- **CTA Button**: Scale effect on hover, delayed by `0.3s`

### 3. AI Sidebar Interaction
The "Watchlist Assistant" uses a `useRef` based auto-scroll hook to ensure the conversation remains current:
```javascript
useEffect(() => {
  if (scrollRef.current) {
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }
}, [messages]);
```

---

## 📸 Visual Gallery

````carousel
![Premium Sign In Experience](./public/assets/signin_page_1774715738679.png)
<!-- slide -->
![Market Dashboard & Heatmaps](./public/assets/dashboard_page_1774715857829.png)
<!-- slide -->
![Viewport-Locked Watchlist](./public/assets/watchlist_page_1774715884186.png)
<!-- slide -->
![Stock Pulse Analytics](./public/assets/stock_details_page_1774716004955.png)
````

---

## 📦 Installation

### 1. Clone & Install
```bash
git clone https://github.com/techieadi4703/tikki-trades.git
cd tikki-trades
npm install
```

### 2. Configure Environment
Create a `.env.local` file and add your necessary API keys (if applicable for data providers).

### 3. Launch Development Server
```bash
npm run dev
```
Platform available at: `http://localhost:3000`

---

## 💡 Business Impact

- 🚀 **First Impression**: Premium staggered animations increase perceived platform quality.
- ⚙️ **Efficiency**: Viewport-locked dashboards allow for faster data scanning without scrolling fatigue.
- 😊 **User Retention**: Interactive AI sidebars provide immediate value-add for asset analysis.

---

**Built with ❤️ for Modern Traders by Tikki Trades Team**
