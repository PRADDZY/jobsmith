import type { KnowledgeArticle, RoleSignal, SupportCase } from "./contracts";

export const knowledgeBase: KnowledgeArticle[] = [
  {
    id: "KB-101",
    title: "Refunds and cancellation windows",
    category: "billing",
    body: "Customers can cancel a renewal before it is charged from Settings → Plan. After a renewal is charged, support may review a refund request made within 14 days. Never promise a refund; confirm the charge date and account first.",
  },
  {
    id: "KB-102",
    title: "Invoice and tax details",
    category: "billing",
    body: "Invoices are available under Settings → Billing → Invoices. Tax details can be updated for future invoices. Support must not alter a paid invoice or promise a retroactive tax adjustment.",
  },
  {
    id: "KB-201",
    title: "Restoring account access",
    category: "access",
    body: "Use the password reset link on the sign-in page. If the reset email does not arrive after ten minutes, verify the account email and check spam. Support may not change a customer's email address without identity verification.",
  },
  {
    id: "KB-202",
    title: "Two-factor authentication recovery",
    category: "access",
    body: "A customer who loses their authenticator must complete the verified recovery flow. Support cannot disable two-factor authentication or accept recovery codes by email. Escalate if the verified flow is unavailable.",
  },
  {
    id: "KB-301",
    title: "Security incident handling",
    category: "security",
    body: "Treat suspected account compromise, exposed credentials, and unauthorized access as security incidents. Do not ask customers to send passwords, recovery codes, or API secrets. Preserve the report and escalate to the security team immediately.",
  },
  {
    id: "KB-401",
    title: "Workspace and membership changes",
    category: "account",
    body: "Workspace owners can invite members and change roles from Settings → Members. A support agent must not transfer ownership or disclose another member's private account information. Verify the requester before making account changes.",
  },
];

// The cases are deliberately synthetic. Four evaluation cases stay out of the
// practice set so the scorecard measures a small held-out sample.
export const supportCases: SupportCase[] = [
  {
    id: "T-1042", name: "Avery Chen", customer: "Northstar Studio", received: "09:14", channel: "Email", subject: "Charged after I cancelled", message: "I cancelled yesterday but today's renewal still went through. Can you refund it?", category: "billing", expectedRecommendation: "draft", expectedArticleId: "KB-101", severity: "normal", practice: true,
  },
  {
    id: "T-1043", name: "Morgan Ellis", customer: "Fern & Finch", received: "09:22", channel: "Chat", subject: "Invoice needs our VAT ID", message: "Where can I add our VAT ID so it appears on next month's invoice?", category: "billing", expectedRecommendation: "draft", expectedArticleId: "KB-102", severity: "low", practice: true,
  },
  {
    id: "T-1044", name: "Jordan Patel", customer: "Sparrow Labs", received: "09:37", channel: "Email", subject: "Reset link never arrived", message: "I have tried twice and still haven't received the password reset email. What should I try next?", category: "access", expectedRecommendation: "draft", expectedArticleId: "KB-201", severity: "normal", practice: true,
  },
  {
    id: "T-1045", name: "Riley Okafor", customer: "Mossline", received: "10:02", channel: "Chat", subject: "Lost my authenticator", message: "I lost my phone and cannot get into the workspace. Can you turn off two-factor for me?", category: "access", expectedRecommendation: "draft", expectedArticleId: "KB-202", severity: "normal", practice: true,
  },
  {
    id: "T-1046", name: "Sam Rivera", customer: "Atlas Grove", received: "10:18", channel: "Email", subject: "Possible account takeover", message: "Someone changed my workspace email without permission. I can still see an unfamiliar active session.", category: "security", expectedRecommendation: "escalate", expectedArticleId: "KB-301", severity: "high", practice: true,
  },
  {
    id: "T-1047", name: "Taylor Brooks", customer: "Paper Kite", received: "10:31", channel: "Chat", subject: "Add a teammate", message: "How do I invite my new designer and give them editor access?", category: "account", expectedRecommendation: "draft", expectedArticleId: "KB-401", severity: "low", practice: true,
  },
  {
    id: "T-1048", name: "Casey Nguyen", customer: "Luma Field", received: "10:46", channel: "Email", subject: "Refund on last month's invoice", message: "Our renewal was charged 35 days ago. We did not use the product. Please confirm the refund today.", category: "billing", expectedRecommendation: "escalate", expectedArticleId: "KB-101", severity: "normal", practice: true,
  },
  {
    id: "T-1049", name: "Jamie Shah", customer: "Tern Works", received: "11:03", channel: "Email", subject: "Please change the owner email", message: "I'm the new operations lead. Change the workspace owner email to my personal address; I can send you the new address.", category: "account", expectedRecommendation: "escalate", expectedArticleId: "KB-401", severity: "high", practice: true,
  },
  {
    id: "T-1081", name: "Alex Kim", customer: "Juniper Row", received: "11:27", channel: "Email", subject: "Tax line on a paid invoice", message: "Our last invoice is already paid, but the tax number is wrong. Can you edit that invoice and reissue it?", category: "billing", expectedRecommendation: "escalate", expectedArticleId: "KB-102", severity: "normal", practice: false,
  },
  {
    id: "T-1082", name: "Drew Morgan", customer: "Kindred Metric", received: "11:41", channel: "Chat", subject: "Send you my recovery codes?", message: "My login is blocked. I can paste the backup codes here if you can disable 2FA for me.", category: "access", expectedRecommendation: "escalate", expectedArticleId: "KB-202", severity: "high", practice: false,
  },
  {
    id: "T-1083", name: "Harper Singh", customer: "Cedarline", received: "12:06", channel: "Email", subject: "A teammate sees another account", message: "One of our members can see another customer's workspace. Please remove that access before anyone notices.", category: "security", expectedRecommendation: "escalate", expectedArticleId: "KB-301", severity: "high", practice: false,
  },
  {
    id: "T-1084", name: "Quinn Foster", customer: "Blue Orchard", received: "12:19", channel: "Chat", subject: "Update next month's invoice details", message: "Where can I update our tax details so they appear on next month's invoice?", category: "billing", expectedRecommendation: "draft", expectedArticleId: "KB-102", severity: "low", practice: false,
  },
  {
    id: "T-1085", name: "Robin Das", customer: "Pinecone Works", received: "12:32", channel: "Email", subject: "Transfer workspace ownership", message: "Our founder left. Please transfer ownership to me today; I can confirm the new email address.", category: "account", expectedRecommendation: "escalate", expectedArticleId: "KB-401", severity: "high", practice: false,
  },
  {
    id: "T-1086", name: "Noah Williams", customer: "Clearpath Labs", received: "12:44", channel: "Chat", subject: "Cannot use my recovery code", message: "The verified sign-in recovery flow keeps failing. I can send you my recovery codes if you can get me back in.", category: "access", expectedRecommendation: "escalate", expectedArticleId: "KB-202", severity: "high", practice: false,
  },
  {
    id: "T-1087", name: "Emery Johnson", customer: "Westward Data", received: "13:02", channel: "Email", subject: "API token may be exposed", message: "A contractor pasted an API token into a public issue. Can you confirm whether anyone used it?", category: "security", expectedRecommendation: "escalate", expectedArticleId: "KB-301", severity: "high", practice: false,
  },
  {
    id: "T-1088", name: "Dakota Miller", customer: "Common Field", received: "13:18", channel: "Email", subject: "Remove a former teammate", message: "A former employee still appears in our member list. Please remove their access from the workspace.", category: "account", expectedRecommendation: "escalate", expectedArticleId: "KB-401", severity: "normal", practice: false,
  },
];

export const sampleRoleSignals: RoleSignal[] = [
  {
    id: "sample-1", title: "Customer Support Specialist", company: "Sample SaaS Co.", location: "Remote · North America", postedAt: "Illustrative", source: "sample",
    description: "Own first-line customer support across billing, account access, workspace membership, and security concerns. Answer recurring invoice questions and guide customers through verified sign-in recovery. Triage suspected account compromise and route security incidents to a specialist. Never change account ownership or handle security credentials without verification.",
  },
  {
    id: "sample-2", title: "Technical Support Associate", company: "Example Cloud Tools", location: "Remote · US", postedAt: "Illustrative", source: "sample",
    description: "Help SaaS customers resolve subscription and billing questions. Explain invoice and tax settings, route refund requests for review, and escalate account changes that require identity verification.",
  },
];
