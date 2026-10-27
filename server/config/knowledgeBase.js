/**
 * BookLeaf Publishing Knowledge Base & Communication Guidelines
 * Ground truth policy documentation for AI-assisted support responses.
 */

const BOOKLEAF_KNOWLEDGE_BASE = {
  company: {
    name: "BookLeaf Publishing",
    description: "A self-publishing company operating in India and the US, processing 1,200+ books monthly across a catalog of 22,000+ titles.",
    packages: {
      standard: "Standard Free (no upfront cost)",
      premium: "Bestseller Breakthrough (premium, paid package with marketing and distribution add-ons)"
    },
    services: [
      "Cover design",
      "Typesetting & interior layout",
      "ISBN assignment under BookLeaf publisher imprint",
      "Printing (in-house Delhi facility + partners)",
      "Distribution across Amazon India, Flipkart, Amazon US, Amazon UK, and BookLeaf Store",
      "Royalty calculation and quarterly disbursement"
    ],
    facilities: "In-house printing facility and warehouse located in Delhi. Overflow and specialized formats handled by print partners Repro India and Epitome Books."
  },

  categories: [
    "Royalty & Payments",
    "ISBN & Metadata Issues",
    "Printing & Quality",
    "Distribution & Availability",
    "Book Status & Production Updates",
    "General Inquiry"
  ],

  policies: {
    royalty: {
      split: "80/20 split: 80% of net profit goes to author, 20% to BookLeaf.",
      netProfitFormula: "Net Profit = MRP - (Printing Cost + Platform Commission [Amazon/Flipkart] + Shipping Charges).",
      schedule: "Quarterly calculation, paid within 45 days after quarter end.",
      minimumThreshold: 1000,
      thresholdRule: "Minimum payout threshold is ₹1,000. If total pending royalty is below ₹1,000, it safely rolls over to the subsequent quarter.",
      paymentMethod: "Direct bank transfer (NEFT/IMPS) to the author's verified bank account linked in their dashboard.",
      breakdownAvailable: "Authors can view a line-by-line platform-wise breakdown (Amazon India, Flipkart, BookLeaf Store, etc.) directly on their dashboard."
    },

    isbn: {
      rule: "Every book published via BookLeaf receives a unique ISBN registered under BookLeaf's publisher imprint.",
      customImprint: "If an author wants an ISBN under their own independent imprint, they must procure it separately.",
      errorsOrMismatches: "Any ISBN discrepancy (e.g. wrong book linked or mismatched digits on retail platforms) is treated as a CRITICAL/HIGH priority data issue and escalated immediately to the production team with a 48-hour resolution timeline."
    },

    printing: {
      facilities: "In-house Delhi printing facility handles standard orders. Overflow or specific format orders are fulfilled via Repro India or Epitome Books.",
      turnaround: "Standard print turnaround is 5 to 7 business days from order confirmation.",
      qualityDefects: "For misprints, binding defects, defective pages, or color inconsistency, BookLeaf arranges a 100% free reprint after verification. Authors are requested to submit photographic proof of the defective copies."
    },

    distribution: {
      platforms: ["Amazon India", "Flipkart", "Amazon US", "Amazon UK", "BookLeaf Store"],
      liveTurnaround: "New listings typically go live across retail channels within 7 to 10 business days after publication is finalized.",
      outOfStockOrUnavailable: "If a published book shows as 'Currently Unavailable' on Amazon or Flipkart, it typically reflects an inventory stock-sync lag. BookLeaf's operations team triggers a manual re-sync with a 24 to 48-hour restoration window."
    },

    production: {
      workflow: [
        "1. Manuscript Received",
        "2. Editing (if package opted)",
        "3. Cover Design (requires author proof approval)",
        "4. Typesetting & Interior Formatting",
        "5. Proofreading & Author Revision rounds",
        "6. ISBN Assignment & Barcoding",
        "7. Test Print & Quality Check",
        "8. Distribution Setup & Channel Listing",
        "9. Published & Live"
      ],
      bottlenecks: "Most delays occur during Cover Design (awaiting author feedback/approval) or Proofreading revision rounds. Status updates are sent at every milestone."
    }
  },

  communicationGuidelines: {
    tone: "Empathetic, respectful, professional, transparent, and collaborative. Authors are our creative partners, never mere ticket numbers.",
    principles: [
      "Acknowledge the author's specific concern and emotions before offering explanations or solutions.",
      "Be specific: always reference exact book titles, ISBNs, sales numbers, royalty sums, or dates when available.",
      "Own BookLeaf's errors directly without corporate deflection or defensive language (e.g. delayed payouts or ISBN mismatches).",
      "Give concrete timeframes for escalation or resolution (e.g., 'within 24–48 hours' or 'within 5–7 business days').",
      "Always end with clear next steps for both the author and the BookLeaf operations team, signed with warm regards."
    ]
  },

  sampleResponses: [
    {
      category: "Royalty & Payments",
      query: "I published my book 4 months ago and still haven't received any royalty. What's going on?",
      keyPoints: "Acknowledge frustration. Explain quarterly cycle + 45-day window. Check bank details. State next payout date. If overdue, escalate with 48h resolution."
    },
    {
      category: "Royalty & Payments",
      query: "My royalty amount seems too low. I sold 200 copies but only received ₹3,000.",
      keyPoints: "Explain net profit calculation (MRP - printing - commission - shipping). Offer transparent line-by-line breakdown without defensiveness."
    },
    {
      category: "ISBN & Metadata Issues",
      query: "My book is showing a different ISBN on Amazon than what's on the physical copy.",
      keyPoints: "High priority. Acknowledge serious data issue. Escalate to production immediately. 48-hour resolution timeline."
    },
    {
      category: "Printing & Quality",
      query: "I received my author copies and the print quality is terrible. The images are blurry and pages are misaligned.",
      keyPoints: "Apologize sincerely. Request photos of defects. Confirm 100% free reprint upon verification within 5-7 business days."
    },
    {
      category: "Distribution & Availability",
      query: "My book is published but it's showing as 'Currently Unavailable' on Amazon.",
      keyPoints: "Explain stock sync issue. Confirm triggering re-sync. Set 24-48 hours expectation."
    },
    {
      category: "Book Status & Production Updates",
      query: "It's been 3 weeks and my book is still in typesetting. When will it be done?",
      keyPoints: "Check production status. Be honest about stage. Provide specific updated date. Frame collaboratively."
    },
    {
      category: "General Inquiry",
      query: "Can I update the description of my book on Amazon after it's already live?",
      keyPoints: "Confirm metadata updates can be submitted via dashboard. Typically updates within 3-5 business days."
    }
  ]
};

module.exports = BOOKLEAF_KNOWLEDGE_BASE;
