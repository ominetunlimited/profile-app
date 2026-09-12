# PROFILE — Data Model Reference

The persona ("Amara Okafor" and others) appearing across the .dc.html files is **illustrative sample content only**, hardcoded per-file for design review. It is not a schema and should not be read as one. This document is the actual entity reference for implementation.

## Core entities

**User (personal account)**
id, name, headline, location, email, phone, country, language, dateOfBirth, profilePhotoUrl, coverPhotoUrl, accountType (individual|student|professional|freelancer), trustScore, createdAt, visibilitySettings, notificationPreferences, mfaEnabled, linkedDevices[]

**Record / Evidence**
id, ownerId, type (schema-defined — see CredentialSchema), title, description, dateRange, verifierOrgId, verifierPersonId, status (draft|submitted|pending|verified|rejected|revoked|disputed), evidenceFiles[], relatedSkills[], createdAt, verifiedAt

**Verification Request**
id, recordId, requestedBy, targetOrgId, status, submittedAt, respondedAt, reviewerNote, outcome

**Trust Score**
userId, score (0–1000), inputs: {verifiedEvidence (cap 300), verifierStrength (cap 250), credentialStanding (cap 200), consistency (cap 150), identityAssurance (cap 100)}, lastCalculatedAt

**Dispute**
id, recordId, filedBy, note, evidenceFiles[], status (filed|under_review|outcome_issued|resolved), reviewerId, outcome, slaDeadline (20 working days)

**Organisation / Institution / Government Workspace**
id, name, type (organisation|institution|government), officialDomain, domainVerifiedAt, adminUserId, staff[] {userId, role: viewer|reviewer|recruiter|admin}, ssoConfig, apiKeys[]

**Credential Schema** (institution-defined record types)
id, ownerOrgId, name, fields[] {label, type, required}, requiredEvidence[]

**Opportunity**
id, orgId, title, type (jobs|freelance|consulting|mentorship|fellowship), location, requiredSkills[], status

**Match** (Opportunity ↔ User)
opportunityId, userId, matchScore, matchReasons[], gaps[]

**Message / Thread / Community**
standard messaging entities; Community has id, name, description, members[], discussions[]

**Notification**
id, userId, category (verification|messages|opportunities|community|security|marketing), text, read, createdAt

**Creator Template** (Career Engine marketplace)
id, creatorId, name, type (cv|portfolio), price, rating, uses, publishedAt, earnings[]

**AI Decision Log Entry**
id, surface (advisor|copilot|cover_letter|opportunity_match), output, dataAccessed[], userId, reviewStatus, timestamp

## Notes for implementation
- Trust Score is always the sum of five **capped** sub-scores — never a single opaque number with no breakdown.
- A Record's `status` transitions are the single source of truth for every verification-state UI across the product (badges, timelines, dispute eligibility).
- Workspace `officialDomain` must be verified before `adminUserId` can invite staff — enforced server-side, not just hidden in the UI.
