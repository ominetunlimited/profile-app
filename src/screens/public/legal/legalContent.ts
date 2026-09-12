export interface LegalDoc {
  path: string
  title: string
  plainSummary: string
  body: string[]
  /** True for docs §37.15 requires but the Master Prompt never drafted canonical text for. */
  pendingDraft?: boolean
}

/**
 * §46 Legal & Policy Document Library — canonical drafts, verbatim, plus §37.15's
 * remaining required pages with no canonical text (flagged, not fabricated).
 * §46.0: "These require review by qualified legal counsel in each operating
 * jurisdiction before publication" — shown as a banner on every page here.
 */
export const LEGAL_DOCS: LegalDoc[] = [
  {
    path: '/terms',
    title: 'Terms of Service',
    plainSummary: "Use PROFILE honestly, don't misrepresent your work or credentials, and we'll keep the platform running fairly for everyone.",
    body: [
      'Eligibility: minimum age 15 to hold an account, 18 to transact on the Marketplace.',
      'Account responsibilities: keep credentials confidential, report suspected compromise immediately, and maintain accurate profile information.',
      'Platform conduct: impersonation, fraud, harassment, review manipulation, and related conduct are prohibited.',
      'Fees and subscriptions: free-tier access continues indefinitely; paid tiers are billed as disclosed at purchase and may be cancelled at any time, with access continuing through the paid period.',
      'Termination: PROFILE may suspend or terminate accounts for confirmed violations, with appeal rights except where child-safety violations are involved.',
      "Changes to these terms: material changes require 30 days' notice and re-acceptance.",
    ],
  },
  {
    path: '/privacy',
    title: 'Privacy & Data Policy',
    plainSummary: 'Your documents are encrypted, you control who sees what, and we never sell your data.',
    body: [
      'What we collect: account details you provide, credentials and documents you upload for verification, activity you record, and usage data needed to operate the platform securely.',
      'How it’s protected: AES-256 encryption at rest, TLS 1.3 in transit, role-based access controls, and full audit logging on every access to sensitive records.',
      "How it's shared: only with the specific institution or employer you're requesting verification from, or with parties you explicitly grant access to via visibility controls. We do not sell personal data to advertisers.",
      'Your rights: access, export, correction, deletion, and consent withdrawal, consistent with GDPR, NDPR, and CCPA.',
      'Retention: verification and audit records are retained per regulatory requirement even after account deletion where legally required; all other data is deleted upon request.',
    ],
  },
  {
    path: '/cookies',
    title: 'Cookie Policy',
    plainSummary: 'We use cookies to keep you signed in, remember your preferences, and understand how PROFILE is used — never to sell your data.',
    body: [
      'Essential cookies: session, authentication, and security — required for the platform to function.',
      'Preference cookies: theme, language, and accessibility settings.',
      'Analytics cookies: aggregated, non-identifying usage patterns used to improve the platform.',
      'You can manage cookie preferences from Settings → Privacy at any time.',
    ],
  },
  {
    path: '/identity-agreement',
    title: 'Identity & Authenticity Agreement',
    plainSummary: 'The name, documents, and history you give us have to be genuinely yours.',
    body: [
      'By creating a PROFILE account, you agree that: (a) all information you submit is accurate and belongs to you; (b) you will not create multiple accounts to misrepresent separate identities; (c) any credential submitted for verification is one you are legitimately entitled to hold; (d) PROFILE may suspend or revoke access if impersonation, identity fraud, or credential forgery is confirmed; (e) your Profile Identity ID (PID) is permanent, non-transferable, and never reused, even after account closure.',
      "This agreement is versioned and re-presented for acceptance whenever materially changed (30 days' notice).",
    ],
  },
  {
    path: '/verification-consent',
    title: 'Verification Routing Consent',
    plainSummary: "When you request verification, we send your details to the specific institution you named — not anyone else.",
    body: [
      'By submitting a verification request, you consent to PROFILE transmitting the identifiers and documents you provide to the named institution, employer, or authority solely for the purpose of confirming that specific credential.',
      'You may withdraw a pending request at any time before a decision is issued.',
      'Approved verifications are recorded permanently in your Credential Vault as part of your auditable trust history; withdrawal after approval requires a formal revocation request reviewed by a Compliance Officer.',
    ],
  },
  {
    path: '/conduct',
    title: 'Professional Conduct Standards',
    plainSummary: "Treat other users, institutions, and organisations the way you'd want to be treated in a professional setting.",
    body: [
      'Users must not: impersonate individuals or organisations; falsify work history, credentials, or affiliations; participate in verification rings or review-exchange networks; harass, threaten, or discriminate against other users; use bot-generated engagement or synthetic identities; upload others’ work to the Copyright system as their own.',
      'Verified badges and trust scores may be revoked for confirmed violations, following the standard enforcement escalation.',
    ],
  },
  {
    path: '/dpa',
    title: 'Data Processing Agreement',
    plainSummary: 'This is the formal agreement institutional and enterprise customers sign when PROFILE processes personal data on their behalf.',
    body: [
      'Applies to institution, government, and enterprise accounts using bulk verification, API access, or white-label infrastructure.',
      'Defines PROFILE as data processor and the institution as data controller for records the institution submits for verification purposes.',
      'Covers: processing scope limited to verification and credential-management purposes only; sub-processor disclosure (hosting, encryption, backup providers); breach notification within 72 hours of confirmed incident; data return or deletion on contract termination; audit rights for the controller.',
      'Executed as a standalone signed agreement alongside the institution’s subscription contract — this document defines its required contents, not a substitute for legal execution.',
    ],
  },
  {
    path: '/acceptable-use',
    title: 'Acceptable Use Policy',
    plainSummary: 'Rules for what you may and may not do with PROFILE’s systems, separate from how you conduct yourself professionally.',
    body: [
      'No attempt to circumvent verification, rate limits, or access controls.',
      'No scraping, automated data extraction, or reverse engineering of the platform.',
      'No use of the platform to distribute malware, spam, or unsolicited bulk communication.',
    ],
    pendingDraft: true,
  },
  {
    path: '/copyright',
    title: 'Copyright & Intellectual Property',
    plainSummary: 'Portfolio items and work you upload remain yours; PROFILE’s brand, code, and design remain ours.',
    body: [
      'You retain ownership of original work you post as evidence or portfolio content.',
      'PROFILE’s trademarks, logos, and platform source code are not licensed for external use without written permission.',
      'A takedown process is available for confirmed copyright infringement claims.',
    ],
    pendingDraft: true,
  },
  {
    path: '/community-guidelines',
    title: 'Community Guidelines',
    plainSummary: 'Professional credibility grows through verified contribution and responsible participation — governance here is fair, transparent, institutional, and human; never authoritarian, arbitrary, algorithmically abusive, or opaque.',
    body: [
      'Communities exist for professional discussion, mentorship, and peer support — not promotional spam.',
      'Identity conduct: users and organisations must not impersonate individuals or organisations; create false verification claims or fake credentials; manipulate trust scores or verification systems; falsify work history, certifications, or institutional affiliations; form verification rings or review exchange networks; use bot-generated engagement or synthetic identities; or upload others’ work to the copyright system as their own.',
      'General conduct: harassment, threats, hate speech, doxxing, extortion, blackmail, sexual exploitation, scam activity, predatory recruitment, stalking, coercion, malicious misinformation, abusive negotiations, fake reviews, review manipulation, and paid trust manipulation are all prohibited, for every account type.',
      'Enforcement is escalating and always documented, explainable, and appealable within 14 days: (1) warning with documented explanation, (2) temporary feature restriction, (3) visibility reduction, (4) verification revocation, (5) account suspension, (6) permanent removal, (7) legal escalation where required by law.',
      'Child safety: minimum account age is 15, and 18 to transact on the Marketplace. Exploitation, pornography, grooming, trafficking, and predatory behaviour toward minors receive zero tolerance, immediate law-enforcement escalation for confirmed violations, and carry no appeal right.',
    ],
  },
  {
    path: '/security-practices',
    title: 'Security Practices',
    plainSummary: 'A summary of the technical and organisational measures protecting your account and data.',
    body: [
      'Encryption at rest (AES-256) and in transit (TLS 1.3).',
      'Multi-factor authentication, breach-checked passwords, and device trust management.',
      'Row-level security on every database table and full audit logging of sensitive-record access.',
      'Full detail lives in the Master Prompt’s Security Architecture and Hardening sections — this page is the public-facing summary.',
    ],
    pendingDraft: true,
  },
]

export function findLegalDoc(path: string): LegalDoc | undefined {
  return LEGAL_DOCS.find((d) => d.path === path)
}
