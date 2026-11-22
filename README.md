# Atelier Blush — Celebration Event Planner

An end-to-end celebration planning web application featuring automated multi-currency budgeting, real-time cloud guest RSVPs via shareable links, a right-corner AI planning assistant, budget-matched theme inspiration, an interactive venue floor-plan simulator, and print-ready PDF coordination exports.

**Live App:** [https://atelier-blush-celebration-event-planner.ai.studio](https://atelier-blush-celebration-event-planner.ai.studio)

---

## Key Features

- **Right-Corner Smart AI Planning Assistant**
  - Greets visitors and asks what event they are planning with one-tap quick buttons (`Wedding`, `Birthday`, `Corporate Gala`, `Baby / Bridal Shower`).
  - Entering an event type, target budget, currency, and guest count immediately opens and pre-fills the budget workspace with recommended allocations, a matching theme, and tailored cost-saving tips powered server-side by Gemini (`gemini-4-hydrogen`).
- **Automated Multi-Currency Budget Tracker**
  - Supports **9 currencies** (`USD $`, `INR ₹`, `EUR €`, `GBP £`, `AUD A$`, `CAD C$`, `AED`, `SGD S$`, `JPY ¥`) with optional automatic amount conversion.
  - Splits expenses into **Fixed** packages and **Per-Guest** line items (`Catering`, `Beverages`, `Stationery & Favors`) that automatically recalculate as confirmed guest RSVPs arrive.
  - Tracks target allocation vs. actual paid deposits with clear over-budget variance alerts and actionable cost-saving recommendations.
- **Real-Time Cloud Guest RSVPs & Shareable Invitation Links**
  - Syncs live via **Firebase Firestore** and **Google Authentication**.
  - Generates a shareable public RSVP link (`?rsvp=<eventId>`) so guests can submit attendance, party size, meal selections, and dietary notes from any mobile or desktop device.
  - Streams confirmed headcounts and meal tallies directly into the organizer's ledger, budget tracker, and venue capacity planner.
- **Budget-Matched Themes & Event Setup Gallery**
  - Recommends curated aesthetic themes (`Botanical Conservatory Brunch`, `Coral Courtyard Lounge`, `Romantic Garden Terrace`, `Sunlit Modern Loft`, `Grand Candlelight Ballroom`) calibrated to your budget tier, complete with color palettes and setup photography.
- **Real-Time Venue Setup Previewer**
  - Interactive architectural SVG floor plan that updates live as guest counts change or when switching seating layouts (`Round Banquet`, `Long Imperial`, `Cocktail Hi-Tops`, `Ceremony Rows`), floral density, and room zones (stage/arch, dance floor, catering bar, photo lounge).
- **PDF, Print & CSV Coordination Export**
  - One-click **Export / Print** coordination packet formatted for direct printing or saving as a clean vector PDF, plus CSV export covering the full budget ledger, cost-saving checklist, confirmed guest roster, and live venue floor plan.

---

## Tech Stack

- **Frontend:** React 19, TypeScript, Vite 8, Tailwind CSS v4, Lucide React
- **Backend & AI:** Node.js, Express, `@google/genai` (server-side proxy at `/api/assistant`)
- **Database & Auth:** Firebase Firestore (real-time `onSnapshot` sync) & Firebase Auth (Google Sign-In)
- **Security & Linting:** `@firebase/eslint-plugin-security-rules`, ESLint, TypeScript (`tsc --noEmit`)

---

## Project Architecture

```text
Client (React + Tailwind CSS)
 ├── Workspace Views: Budget · Guest RSVPs · Themes · Venue Setup
 ├── Public Guest RSVP Portal (?rsvp=<eventId>)
 ├── Right-Corner Planning Assistant ──▶ POST /api/assistant (Express + Gemini)
 ├── Print / PDF & CSV Coordination Export
 └── Firebase SDK (Google Auth + Real-Time Firestore Listeners)
       ├── /events/{eventId}
       ├── /events/{eventId}/budgetItems/{itemId}
       └── /events/{eventId}/rsvps/{rsvpId}
