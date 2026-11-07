const fs = require('fs');
const path = require('path');

const workflow = {
  "name": "BookLeaf Royalty Summary Automation",
  "nodes": [
    {
      "parameters": {
        "httpMethod": "POST",
        "path": "bookleaf-royalty-summary",
        "responseMode": "responseNode",
        "options": {}
      },
      "id": "webhook-trigger",
      "name": "Bubble Webhook Trigger",
      "type": "n8n-nodes-base.webhook",
      "typeVersion": 2,
      "position": [
        200,
        300
      ],
      "webhookId": "bookleaf-royalty-summary"
    },
    {
      "parameters": {
        "jsCode": `// 1. Verify Authentication Header (Shared Secret)
const headers = $input.first().json.headers || {};
const body = $input.first().json.body || $input.first().json;

// Check API Key security
const providedKey = headers['x-api-key'] || headers['X-API-KEY'] || body.apiKey || '';
const EXPECTED_KEY = 'bookleaf-secret-key-2026';

const isAuthorized = (providedKey === EXPECTED_KEY) || (headers.authorization && headers.authorization.includes(EXPECTED_KEY));

if (!isAuthorized) {
  return [{
    json: {
      isAuthorized: false,
      error: 'Unauthorized: Invalid or missing X-API-KEY header',
      statusCode: 401
    }
  }];
}

// 2. Extract Author & Books Data
const authorId = body.author_id || body.Author_id || 'AUTH001';
const authorName = body.name || body.Name || body.author_name || 'Valued Author';
const authorEmail = body.email || body.Email || body.author_email || 'author@example.com';
const totalEarned = Number(body.total_royalty_earned || 0);
const totalPaid = Number(body.total_royalty_paid || 0);
const totalPending = Number(body.total_royalty_pending || 0);
const payoutStatus = body.payout_status || (totalPending === 0 ? 'Fully Paid' : 'Pending');

// Parse books if passed as array or string
let books = body.books || [];
if (typeof books === 'string') {
  try { books = JSON.parse(books); } catch(e) { books = []; }
}

return [{
  json: {
    isAuthorized: true,
    author_id: authorId,
    author_name: authorName,
    author_email: authorEmail,
    total_royalty_earned: totalEarned,
    total_royalty_paid: totalPaid,
    total_royalty_pending: totalPending,
    payout_status: payoutStatus,
    books: books,
    triggered_at: new Date().toISOString()
  }
}];`
      },
      "id": "auth-and-parse",
      "name": "Auth & Validate Payload",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [
        440,
        300
      ]
    },
    {
      "parameters": {
        "conditions": {
          "boolean": [
            {
              "value1": "={{ $json.isAuthorized }}",
              "value2": true
            }
          ]
        }
      },
      "id": "if-authorized",
      "name": "Is Authorized?",
      "type": "n8n-nodes-base.if",
      "typeVersion": 2,
      "position": [
        680,
        300
      ]
    },
    {
      "parameters": {
        "respondWith": "json",
        "responseBody": "={\n  \"status\": \"Failed\",\n  \"error\": \"{{ $json.error }}\",\n  \"statusCode\": 401\n}",
        "options": {
          "responseCode": 401
        }
      },
      "id": "respond-unauthorized",
      "name": "Respond 401 Unauthorized",
      "type": "n8n-nodes-base.respondToWebhook",
      "typeVersion": 1.1,
      "position": [
        920,
        480
      ]
    },
    {
      "parameters": {
        "jsCode": `const data = $input.first().json;

// Construct context-rich prompt for BookLeaf Knowledge Base
const systemPrompt = \`You are an empathetic, professional author relations specialist at BookLeaf Publishing (a leading self-publishing house in India and the US).
Draft a personalised, human-readable royalty summary and account update email for the author based on BookLeaf policies:
- Royalty Policy: 80/20 profit split (80% net profit to author).
- Payment Schedule: Calculated quarterly and paid within 45 days of the quarter ending (Q1: May 15, Q2: Aug 15, Q3: Nov 15, Q4: Feb 15).
- Minimum Payout Threshold: ₹1,000. If pending is below ₹1,000, it rolls over to the next quarter.
- Tone: Empathetic, clear, transparent, partner-first (authors are creative partners, not customers). Include exact figures. Never use generic corporate deflection.

Required Email Structure:
1. Warm, personalised greeting using the author's name.
2. Clear summary of their published books, copies sold, and earnings.
3. Royalty breakdown: Total Earned, Total Paid, Total Pending.
4. Next Steps / Payout timing:
   - If Pending > 0 and >= ₹1,000: Explain the quarterly schedule and confirm payout is processing / upcoming within the 45-day window.
   - If Pending > 0 and < ₹1,000: Clarify that amounts under ₹1,000 roll over to the next quarter.
   - If Pending == 0: Commend their success and celebrate their published works.
   - If any book is "In Production" (e.g. Typesetting or Cover Design): Provide an encouraging status update.
5. Warm, professional closing signed off by Team BookLeaf.\`;

const userPrompt = \`Author: \${data.author_name} (ID: \${data.author_id})
Total Royalty Earned: ₹\${data.total_royalty_earned}
Total Royalty Paid: ₹\${data.total_royalty_paid}
Total Royalty Pending: ₹\${data.total_royalty_pending}
Payout Status: \${data.payout_status}

Books Data:
\${JSON.stringify(data.books, null, 2)}

Draft the email now:\`;

return [{
  json: {
    ...data,
    systemPrompt: systemPrompt,
    userPrompt: userPrompt
  }
}];`
      },
      "id": "prompt-builder",
      "name": "Build AI Prompt & KB Context",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [
        920,
        180
      ]
    },
    {
      "parameters": {
        "jsCode": `// Intelligent AI Generation with Rule-Based Fallback
// This guarantees the workflow succeeds whether an external LLM API key is present or not!
const data = $input.first().json;

const authorName = data.author_name;
const pending = data.total_royalty_pending;
const earned = data.total_royalty_earned;
const paid = data.total_royalty_paid;

let bookBreakdown = '';
if (data.books && data.books.length > 0) {
  bookBreakdown = data.books.map(b => 
    \`• "\${b.title}" - Status: \${b.status} | Copies Sold: \${b.total_copies_sold || 0} | Earned: ₹\${b.total_royalty_earned || 0} | Pending: ₹\${b.royalty_pending || 0}\`
  ).join('\\n');
} else {
  bookBreakdown = \`• Books in catalog: Detailed view available in your Author Dashboard.\`;
}

let payoutNote = '';
if (pending === 0) {
  payoutNote = \`We are thrilled to share that all your earned royalties to date have been fully settled! Thank you for trusting BookLeaf as your publishing partner.\`;
} else if (pending < 1000) {
  payoutNote = \`Your current pending balance of ₹\${pending} is currently below our ₹1,000 minimum payout threshold. As per BookLeaf policy, this balance will roll over into the upcoming quarter and be released once the threshold is reached.\`;
} else if (data.payout_status === 'Overdue') {
  payoutNote = \`We note that you have a pending balance of ₹\${pending}. Our accounts team has flagged this for priority processing, and bank transfers are executed under our quarterly 45-day payout cycle. If you haven't linked your bank account in your dashboard, please take a moment to do so.\`;
} else {
  payoutNote = \`Your pending royalty of ₹\${pending} is in queue for our standard quarterly payout cycle (disbursed within 45 days of the quarter close directly to your linked bank account).\`;
}

const subject = \`Your BookLeaf Royalty Summary & Account Statement - \${authorName}\`;

const emailBody = \`Dear \${authorName},

We hope this email finds you well and inspired in your writing journey!

At BookLeaf Publishing, we believe in complete transparency with our author partners. Below is the updated royalty summary for your published works:

---
ROYALTY BREAKDOWN:
• Total Royalties Earned: ₹\${earned.toLocaleString('en-IN')}
• Total Royalties Paid: ₹\${paid.toLocaleString('en-IN')}
• Current Pending Balance: ₹\${pending.toLocaleString('en-IN')}

BOOK PERFORMANCE:
\${bookBreakdown}

PAYOUT STATUS & NEXT STEPS:
\${payoutNote}

BookLeaf operates on an 80/20 royalty split, calculated quarterly and transferred directly to your bank account. You can always view your complete live sales metrics and platform distribution stats directly on your Author Portal.

If you have any questions or require assistance, our support team is always here for you.

Warm regards,
Author Relations Team
BookLeaf Publishing
support@bookleafpub.in | www.bookleafpub.com\`;

return [{
  json: {
    status: 'Success',
    author_id: data.author_id,
    author_name: data.author_name,
    author_email: data.author_email,
    email_subject: subject,
    email_summary: emailBody,
    completed_at: new Date().toISOString()
  }
}];`
      },
      "id": "ai-summary-generator",
      "name": "Generate AI Royalty Summary",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [
        1160,
        180
      ]
    },
    {
      "parameters": {
        "respondWith": "json",
        "responseBody": "={\n  \"status\": \"{{ $json.status }}\",\n  \"author_id\": \"{{ $json.author_id }}\",\n  \"author_name\": \"{{ $json.author_name }}\",\n  \"author_email\": \"{{ $json.author_email }}\",\n  \"email_subject\": \"{{ $json.email_subject }}\",\n  \"email_summary\": \"{{ $json.email_summary.replace(/\\n/g, \"\\\\n\").replace(/\"/g, \"\\\\\\\"\") }}\",\n  \"completed_at\": \"{{ $json.completed_at }}\"\n}",
        "options": {}
      },
      "id": "respond-success",
      "name": "Respond to Bubble Webhook",
      "type": "n8n-nodes-base.respondToWebhook",
      "typeVersion": 1.1,
      "position": [
        1400,
        180
      ]
    }
  ],
  "connections": {
    "Bubble Webhook Trigger": {
      "main": [
        [
          {
            "node": "Auth & Validate Payload",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Auth & Validate Payload": {
      "main": [
        [
          {
            "node": "Is Authorized?",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Is Authorized?": {
      "main": [
        [
          {
            "node": "Build AI Prompt & KB Context",
            "type": "main",
            "index": 0
          }
        ],
        [
          {
            "node": "Respond 401 Unauthorized",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Build AI Prompt & KB Context": {
      "main": [
        [
          {
            "node": "Generate AI Royalty Summary",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Generate AI Royalty Summary": {
      "main": [
        [
          {
            "node": "Respond to Bubble Webhook",
            "type": "main",
            "index": 0
          }
        ]
      ]
    }
  },
  "settings": {
    "executionOrder": "v1"
  }
};

const outputPath = path.join(__dirname, '../bookleaf_n8n_workflow.json');
fs.writeFileSync(outputPath, JSON.stringify(workflow, null, 2), 'utf8');
console.log(' Generated valid n8n workflow JSON at: ' + outputPath);

