# Product Requirements Document (PRD)

## Overview
Build a modern web application for tracking personal finances. The app allows users to record income and expenses, view spending history, upload and scan receipts for automatic data entry, and chat with an AI assistant for financial insights. A simple onboarding flow helps personalize user experience. The platform uses AI for data extraction and insights, and notifies users via email.

---

## Goals
- Let users add and manage income and expenses.
- Use AI to auto-extract data from uploaded receipt images.
- Enable personalized onboarding to collect financial context (monthly income, expenses, savings).
- Provide AI chatbot to analyze user-specific finances.
- Email users with activity summaries and reminders using Resend.
- Offer a smooth writing/editing experience with TipTap for notes and chatbot prompts.
- Deliver responsive, secure, and fast app performance.

---

## Core Pages & Features

### 1. Landing Page
- App introduction and value proposition
- Call-to-action for signup/login
- Screenshots or interactive preview
- Clean UI, SEO optimized

### 2. Onboarding (Post Signup)
- After signing up, users fill a form with:
  - Monthly income
  - Monthly expenses
  - Savings goal
  - Financial priorities (optional tags)
- This data personalizes dashboards and chatbot behavior

### 3. Dashboard (Protected)
- Requires Supabase Auth
- Overview cards: total income, expenses, balance
- Recent transactions list
- Budget vs actual summaries
- Graphs/charts (optional)
- Entry point to AI chatbot

### 4. Transactions Page
- View list of transactions with filters/search
- Add/Edit/Delete transactions
- Upload receipt to extract data via AI
- Manual note entry with TipTap editor
- Categorize transactions (e.g., food, rent)

### 5. AI Chatbot
- Natural chat UI
- Answers user-specific finance questions:
  - “What can I save this month?”
  - “How much did I spend on transport last week?”
  - “How does this month compare to last?”
- Summarize financial activity
- Uses TipTap for formatting prompts (e.g., inline tables, bullet questions)

### 6. Auth (Login/Signup)
- Email/password login via Supabase
- Magic link login (optional)
- Profile management (optional)

---

## Integrations

- **Supabase:** Authentication, user and financial data storage
- **Resend:** Email notifications (weekly summaries, spending alerts)
- **OpenAI:**
  - OCR + parsing for receipt image uploads
  - Chatbot for insights, summaries, questions
- **Vercel:** Hosting, CI/CD, environment setup
- **TipTap:** Rich text editing for chatbot prompts, manual notes on transactions

---

## User Flows

### Adding expenses
1. Login
2. Go to Transactions
3. Upload receipt or manually input data using form (with TipTap notes)
4. Confirm and save

### Chatbot usage
1. Go to chatbot from dashboard
2. Ask questions about spending/saving
3. Review insights or suggestions

### Onboarding
1. Sign up
2. Enter baseline info: monthly income, expenses, savings
3. Get personalized dashboard and chatbot context

### Weekly update via email
1. App aggregates data
2. Sends user a summary (via Resend)

---

## Data Model (Simplified)

### Users
- `id` (UUID)
- `email`
- `name`
- `monthly_income`
- `monthly_expense`
- `savings_goal`
- `created_at`

### Transactions
- `id` (UUID)
- `user_id` (FK to Users)
- `type` (income/expense)
- `amount`
- `category`
- `notes` (rich text JSON from TipTap)
- `date`
- `receipt_url` (optional)
- `source` (manual/AI)
- `created_at`

---

## Non-Functional Requirements

- **Performance:** Fast, with low-latency interactions
- **Security:** Auth-protected dashboard and API
- **Scalability:** Ready for multi-user usage
- **Responsiveness:** Mobile-first design
- **Data privacy:** Secure receipt handling and storage

---

## Milestones

### MVP
- Landing page  
- Auth and onboarding  
- Dashboard with summary widgets  
- Transaction management  
- TipTap integration for notes  
- AI receipt upload and autofill  
- AI-powered chatbot  
- Deploy to Vercel  

### Integrations
- Resend for email summaries  
- OpenAI for OCR + chatbot  
- TipTap for rich text

