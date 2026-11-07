# BookLeaf Publishing — Technical Assessment 2: Loom Recording Script
**Target Duration:** 3 to 4 Minutes  
**Screens to Record:** Browser window (with Bubble App Preview tab, Bubble Editor tab, and n8n Cloud tab)

---

## 🎬 Pre-Recording Checklist
1. Open **Tab 1:** Live Bubble Preview `https://chaitanydharpale.bubbleapps.io/version-test/index`
2. Open **Tab 2:** Bubble Editor (showing Database or Workflow)
3. Open **Tab 3:** n8n Cloud Editor (`https://bookleaf0209.app.n8n.cloud`) showing the workflow executions
4. Ensure mic and screen sharing are tested.

---

## ⏱ Timeline & Talking Points

### 0:00 – 0:35 | Introduction & Overview
* *"Hi Saloni and the BookLeaf Team! I’m Chaitanya Dharpale, and this is my walkthrough for Technical Assignment 2: The Author Royalty Dashboard & Automated Notification System."*
* *"The objective was to create a production-grade system bridging Bubble.io for the front-end and database layer, with n8n Cloud as an automation backend, combined with an AI agent calibrated specifically on BookLeaf’s publishing policies."*

### 0:35 – 1:30 | Part 1: Bubble.io Database & Admin Portal
* *(Show Tab 1: Bubble App on Admin Portal)*
* *"Starting here on the Admin Portal, we have global KPIs summarizing our entire catalog: 10 authors, ₹3,02,836 in total royalties earned, and ₹42,508 in pending payouts."*
* *"The table lists our authors with dynamic filters for City and Payout Status. Notice authors like Priya Sharma and Rohit Kapoor with their lifetime stats."*
* *(Scroll down to show the Live Notification & AI Email Log)*
* *"At the bottom, we have a real-time Notification Log table that captures all triggered automated communications."*

### 1:30 – 2:30 | Part 2: Triggering the AI Automation (End-to-End Demo)
* *(Click 'Generate Summary' next to an author, e.g. Rohit Kapoor or Priya Sharma)*
* *"Now let's trigger an AI Royalty Summary for Priya Sharma. When I click 'Generate Summary', Bubble sends an authenticated webhook payload to n8n Cloud."*
* *(Switch to Tab 3: n8n Cloud)*
* *"Here in n8n Cloud, we see the execution trigger. The workflow first validates the `x-api-key` header for security. It extracts the author's books and royalty balance, loads the BookLeaf Knowledge Base—including our 80/20 royalty split, the quarterly 45-day payout cycle, and the ₹1,000 threshold—and passes this into our AI LLM agent."*
* *"n8n responds synchronously with the generated email and logs."*
* *(Switch back to Tab 1: Bubble App)*
* *"Returning to Bubble, we see the Notification Log update instantly on the screen: Status Success, timestamp, and a personalized, empathetic email addressing Priya with exact figures and next steps."*

### 2:30 – 3:20 | Part 3: Author Portal & Visual Status Badges
* *(Click the 'Author Portal' button in the top navigation)*
* *"Next, let's switch to the Author Portal. This gives the author a transparent view into their catalog."*
* *"Using the author selector, we can view Priya Sharma’s personal earnings: ₹19,908 earned, ₹16,338 paid, and ₹3,570 pending."*
* *"Below in 'My Books', each title displays copies sold, MRP, and its royalty health status badge: Yellow for pending within the 45-day window, Green for fully paid, and Red if an issue needs attention."*
* *(Switch author to Rohit Kapoor in the dropdown)*
* *"Switching to Rohit Kapoor updates the cards and book catalog dynamically."*

### 3:20 – 3:50 | Part 4: Technical Highlights & Wrap-up
* *"Two quick engineering decisions worth highlighting:*
  1. *Architecture Optimization: We utilized Bubble's outbound API Connector to communicate with n8n and returned the AI output synchronously. This completely eliminates Bubble Free Tier API limitations while giving sub-second UI updates.*
  2. *Resilience & Security: The n8n webhook requires a secure shared secret header and includes an automated fallback mechanism if the external LLM encounters rate limits."*
* *"The repository contains the complete n8n workflow JSON, the Bubble database schema, and detailed technical documentation."*
* *"Thank you for reviewing, and I look forward to speaking with the team in the final interview!"*

