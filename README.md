# Bail Reckoner: Bail Assessment & Legal Rights Calculator (BNSS 2023)

An enterprise-grade, full-stack decision-support and legal rights portal built for the Indian legal framework under the **Bharatiya Nagarik Suraksha Sanhita, 2023 (BNSS)** and the **Bharatiya Nyaya Sanhita, 2023 (BNS)**, replacing the historic Code of Criminal Procedure, 1973 (CrPC) and Indian Penal Code (IPC).

Bail Reckoner provides three distinct, role-based portals for **Citizens**, **Court Registry Administrators**, and **Judicial Officers**, empowering undertrial prisoners, families, advocates, and judges with automated statutory timelines, legal calculators, bilingual legal rights, automated draft bail petitions, and cryptographic audit accountability.

---

## Architecture Overview

```
                      +---------------------------------------+
                      |       Client (React 18 + Vite)        |
                      |  Tailwind CSS | i18next (EN & TA)     |
                      |  Web Speech API | Recharts Analytics  |
                      +-------------------+-------------------+
                                          |
                                HTTP / REST + Cookie JWT
                                          |
                      +-------------------v-------------------+
                      |      Express.js API Gateway / MVC     |
                      |  RBAC Middleware | Zod Validation     |
                      |  Rate Limiting   | Multer Documents   |
                      +---------+-------------------+---------+
                                |                   |
             +------------------+                   +------------------+
             |                                                         |
+------------v------------+                               +------------v------------+
|  Statutory Rule Engines |                               |     System Services     |
|  - Section 187 BNSS     |                               |  - SHA-256 Audit Trail  |
|  - Section 479 BNSS     |                               |  - PDFKit Auto-Drafter  |
|  - Satender Antil (2022)|                               |  - Nodemailer + Logging |
|  - Section 478 BNSS     |                               |  - Node-Cron Auto-Alert |
+------------+------------+                               +------------+------------+
             |                                                         |
             +--------------------+   +--------------------------------+
                                  |   |
                      +-----------v---v-----------+
                      |    Mongoose / MongoDB     |
                      |   Atlas / MongoMemory     |
                      +---------------------------+
```

---

## Core Statutory Calculators & Legal Grounding

1. **Section 187 BNSS Default Bail Calculator (formerly Sec 167(2) CrPC):**
   - Accurately tracks statutory police custody and judicial remand windows.
   - Computes whether an offence qualifies for **60 days** or **90 days** default bail window based on imprisonment threshold (>= 10 years / life / death vs. others).
   - Counts elapsed days starting from first remand date (per *Sanjay Dutt v. State* & *M. Ravindran v. Intelligence Officer, DRI*).
   - Calculates exact IST cut-off date (`remandDate + windowDays`) and provides visual countdown timers, progress bars, and automated cron alerts at T-7, T-3, T-1, and T-0 days.

2. **Section 479 BNSS Undertrial Detention Limit Calculator (formerly Sec 436A CrPC):**
   - **First-Time Offender Proviso:** Automatically triggers eligibility when custody reaches **one-third (1/3)** of the maximum statutory term.
   - **Regular Undertrials:** Computes eligibility at **one-half (1/2)** of the maximum statutory term.
   - **Exceptions & Safeguards:** Excludes offences punishable by death or life imprisonment per statute.
   - **Multiple Pending Cases Guard:** Enforces judicial discretion flag and prevents automated release approval when an accused has multiple pending criminal proceedings per Section 479(2).

3. **Satender Kumar Antil (2022) Category Classification:**
   - Evaluates offences under Categories A, B, C, and D with tailored guidelines for non-arrest, summons, and anticipatory relief.

4. **Section 478 BNSS Mandatory Bailable Offences Release:**
   - Identifies non-discretionary bail entitlement for bailable offences when surety requirements are met.

---

## The 15-Feature Role-Based Portal Matrix (45 Feature Cells)

| # | Feature | Citizen Portal | Judge Portal | Admin Portal |
| :- | :--- | :--- | :--- | :--- |
| **1** | **Default-bail deadline tracker** | Own case countdown & alert settings | Countdown on every assigned case, "matured" badge | All-cases deadline table, alert rules & sent-alert log |
| **2** | **Section 479 detention calculator** | Run on own case, explanation & PDF download | Read-only computation breakdown per case | Rule thresholds, offence data, recalculate-all tool |
| **3** | **Bail application auto-drafter** | Generate & download own draft with DRAFT watermark | View submitted draft beside case file | Edit templates, view all generated drafts |
| **4** | **Bilingual rights card & read-aloud** | Full rights module with read-aloud (EN/TA) & PDF | Same module & language toggle for courtroom use | Edit rights content in both languages |
| **5** | **Decision-support panel** | Plain-language "why this result" view | Full advisory panel plus decision form with conditions | Configure Antil categories per offence, view panel on any case |
| **6** | **Tamper-evident audit trail** | Own case history (read-only, downloadable) | Audit history of assigned cases | Full audit log with cryptographic SHA-256 integrity verification |
| **7** | **Surety readiness checker** | Add sureties, upload proofs, see readiness checklist | View verified-surety status when deciding | Verify or reject surety documents |
| **8** | **Hearing calendar and reminders** | Own hearings list, .ics iCalendar export | Own calendar, clash detection, daily agenda | Schedule/reschedule hearings for all judges, see all calendars |
| **9** | **Family & representative access** | Invite, manage, and revoke delegates | See delegate access on the case (read-only) | View and force-revoke any delegation, audit it |
| **10**| **Plain-language timeline** | Own timeline with "what happens next" guidance | Case timeline with dates and statuses | Timeline on any case plus stage-duration analytics |
| **11**| **Document vault with OCR** | Upload, intelligent heuristic OCR suggestion, confirm fields | Inline document viewer with confirmed extracted data | Review documents, request missing ones, re-run OCR |
| **12**| **Bail conditions compliance tracker** | Log check-ins & see compliance score | Set conditions in decision, see compliance & violations | Monitor all cases, escalation settings, violation list |
| **13**| **Eligibility Radar** | Own case "your right has matured" banner | Full radar board of matured & undecided cases | Radar board for all courts, export CSV |
| **14**| **Quick Check (public)** | Same tool inside dashboard, saved to case | Quick calculator for on-bench checks | Usage statistics & rate-limit settings |
| **15**| **Legal-aid request and tracking** | Request free legal aid from DLSA & track status | See whether legal aid is assigned on a case | Route requests, assign panel advocate, directory CRUD |

### Common Portal Features Across All 3 Roles:
- **Notification Bell**: Live unread count, popover dropdown, and comprehensive `/notifications` history page.
- **Profile & Password**: `/profile` page with language preference, user info, bench details, and `/change-password`.
- **English / Tamil Toggle**: Full bilingual localization with toggle in sticky navbar.
- **Disclaimer Footer**: Persistent legal disclaimer across all pages.
- **In-App Help**: `/help` interactive guides, statutory explanations, and helpline links.
- **Transactional Emails**: Real email delivery via SMTP/Nodemailer with fallback audit logging.

---

## Seed Accounts & Default Credentials

Run `npm run seed` (or `npm --prefix server run seed`) to load verified offences, DLSA contacts, rights templates, and the following initial accounts:

| Portal | Email | Default Password | Role / Access |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@bailreckoner.gov.in` | `Admin@Initial123` | Registry Admin, User Management, Audit Chain, Offence Rules |
| **Citizen** | `citizen@bailreckoner.gov.in` | `Citizen@12345` | Accused / Representative, Case Assessment, Draft Petitions |
| **Judge (Madras)** | `judge.sharma@madrascourt.gov.in` | `Judge@12345` | Metropolitan Sessions Judge, Bench Queue, Order Pronouncement |
| **Judge (Madurai)** | `judge.raman@madrascourt.gov.in` | `Judge@12345` | Principal District Judge, Bench Queue, Order Pronouncement |

*Note: On initial login with the default Admin password, the application prompts a secure forced password change per Indian cybersecurity standards.*

---

## Quick Start & Installation

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **MongoDB**: Optional! If no MongoDB instance is provided in `MONGODB_URI`, the server boots an embedded, in-memory MongoDB engine (`mongodb-memory-server`) automatically.

### 1. Clone & Install Dependencies
```bash
# Clone the repository
git clone <repo-url>
cd "bail final"

# Install all dependencies (root, server, and client)
npm run install:all
```

### 2. Environment Configuration
Create `server/.env` (a starter template is available in `.env.example`):
```ini
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173

# Optional: Leave blank to use automated in-memory MongoDB
MONGODB_URI=

# JWT Secrets (replace with long cryptographic keys in production)
JWT_ACCESS_SECRET=access_secret_bail_reckoner_bnss_2023_secure_key_12345
JWT_REFRESH_SECRET=refresh_secret_bail_reckoner_bnss_2023_secure_key_67890

# Initial Admin Credentials
ADMIN_EMAIL=admin@bailreckoner.gov.in
ADMIN_PASSWORD=Admin@Initial123

# Real Email Delivery Configuration (Gmail SMTP or any standard SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_16_char_app_password
EMAIL_FROM="Bail Reckoner TN" <support@bailreckoner.gov.in>

STORAGE_TYPE=local
```

### 3. Seed Database
```bash
npm run seed
```
This initializes 28 BNS/BNSS offences, 8 bilingual rights, 8 Tamil Nadu DLSA directory records, draft petition templates, and standard user accounts.

### 4. Run Development Servers
```bash
# Launch both backend (port 5000) and frontend (port 5173) concurrently:
npm run dev
```
Open your browser at `http://localhost:5173`.

---

## Configuring Real Email Delivery (Gmail App Password)

Bail Reckoner sends real transactional emails for **User Registration OTP verification**, **Password Reset**, **Judge Account Invites**, and **Default Bail Statutory Reminders**.

To enable outbound emails through Google Gmail:
1. Go to your **Google Account** -> **Security** ([https://myaccount.google.com/security](https://myaccount.google.com/security)).
2. Ensure **2-Step Verification** is turned ON.
3. In the search bar at the top of Google Account, search for **App passwords**.
4. Create a new App Password named **"Bail Reckoner"**.
5. Copy the generated 16-character password (e.g., `abcd efgh ijkl mnop`).
6. Update `server/.env`:
   ```ini
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=your_real_gmail_address@gmail.com
   SMTP_PASS=abcdefghijklmnop
   EMAIL_FROM="Bail Reckoner TN" <your_real_gmail_address@gmail.com>
   ```
7. Restart the server. Real emails will now be sent to any verified email address.
*Note: If `SMTP_USER` is left blank, the application automatically logs all outgoing emails to the `EmailLog` database collection viewable in the Admin Portal, with OTP tokens printed to the console for instant testing.*

---

## Step-by-Step Portal Walkthroughs

### 1. Citizen Portal
1. **Public Rights & Directory:**
   - Navigate to `/rights` to review arrested persons' statutory rights under BNSS. Toggle between English and Tamil (தமிழ்).
   - Click **"Listen (Tamil)"** or **"Listen (English)"** to trigger browser text-to-speech.
   - Click **"Download Rights Card PDF"** to receive an official bilingual document.
   - Navigate to `/legal-aid` to view Tamil Nadu DLSA contacts (Chennai, Madurai, Coimbatore, etc.) with clickable helpline numbers.
2. **Registration & OTP:**
   - Go to `/register`, enter your details. Check your email (or terminal/Email Logs) for the 6-digit OTP and complete verification.
   - Log in at `/login`.
3. **Case Assessment Wizard (`/cases/new`):**
   - **Step 1 (Accused Details):** Full name, age, gender, occupation, district in Tamil Nadu, first-time offender checkbox.
   - **Step 2 (FIR & Arrest Details):** Police station, FIR number, date of arrest, date of first judicial remand, chargesheet filed status.
   - **Step 3 (Offence Selection):** Search from 28 BNS offences (e.g., *Section 303(2) BNS - Theft*, *Section 316 BNS - Criminal Breach of Trust*, etc.).
   - **Step 4 (Review & Calculate):** The engine computes instant statutory eligibility under BNSS 187 & 479.
4. **Case Details & Auto-Drafting (`/cases/:id`):**
   - View real-time countdown timer for Section 187 default bail.
   - Inspect Section 479 Undertrial Detention progress bar and custody ratio.
   - Click **"Download Auto-Draft Petition"** to download the court-ready petition PDF containing the `"DRAFT: for review by a licensed advocate"` watermark.
   - Click **"Submit Application to Court Queue"** to transmit the case to Registry.

---

### 2. Registry Admin Portal
1. **Login:** Log in with `admin@bailreckoner.gov.in` / `Admin@Initial123`.
2. **Analytics Dashboard (`/admin/dashboard`):**
   - View live KPI metrics: Total cases, active undertrials, default bail eligible cases, and applications pending registry review.
   - Interactive Recharts bar charts displaying cases by Tamil Nadu district and offences breakdown.
3. **Application Review & Judge Assignment (`/admin/applications`):**
   - Inspect newly submitted bail applications.
   - Click **"Assign Judge & Schedule"**: Select an active Judge (e.g., *Hon. Justice S. Sharma*), specify a hearing date and bench courtroom.
   - The application status shifts to `Assigned` / `Scheduled`.
4. **User & Judge Management (`/admin/users`):**
   - Invite a new Judge by entering their name, email, court, and jurisdiction. An invite email with a secure token is dispatched.
5. **Offence Rule Editor (`/admin/offences`):**
   - Browse the 28 seeded BNS offences.
   - Edit punishment terms or bailability classifications with automatic version incrementing (`v1` -> `v2`) and audit logging.
6. **Cryptographic Audit Trail (`/admin/audit`):**
   - View all system events in sequential order.
   - Click **"Verify Cryptographic Integrity"** to run the SHA-256 blockchain verification across all records and confirm zero tampering.
7. **Email Logs (`/admin/emails`):**
   - Review every outbound email, recipient address, delivery status, and timestamps.

---

### 3. Judicial Officer Portal
1. **Login:** Log in with `judge.sharma@madrascourt.gov.in` / `Judge@12345`.
2. **Bench Queue (`/judge/queue`):**
   - Access cases assigned specifically to your bench.
   - Filter by `Under Review`, `Hearing Scheduled`, or statutory eligibility flags (Default Bail Due, Section 479 Eligible).
3. **Decision Support & Case Review (`/judge/cases/:id`):**
   - Inspect the **Statutory Decision Support Panel**:
     - Pre-computed Custody vs. Maximum Statutory Term ratio.
     - Section 187 Default Bail Countdown (e.g., Elapsed days vs. 60/90 cut-off).
     - Section 479 Custody Ratio (1/3 vs 1/2 eligibility).
     - Automated Risk & Prior Conviction flag analysis.
     - Linked Case Documents and FIR particulars.
4. **Pronounce Order:**
   - Enter decision: **Bail Granted**, **Bail Rejected**, or **Case Disposed**.
   - For granted bail, specify bail bond amount (in INR) and number of local sureties.
   - Enter judicial reasoning and release conditions (e.g., weekly reporting at police station, passport surrender).
   - Submit the order. A cryptographically chained audit entry is logged and the citizen's application status updates instantly.

---

## Testing & Quality Assurance

### Run Automated Backend Unit & Integration Tests
```bash
npm --prefix server test
```
The test suite includes 36 comprehensive tests across 4 key suites:
- **`bnss187.test.js`**: 8 unit tests verifying 60 vs 90-day calculation, leap years, chargesheet cutoff edge cases, and IST timezone normalization.
- **`bnss479.test.js`**: 17 edge-case tests validating 1/3 term calculation for first-time offenders, 1/2 term calculation, exclusion of death/life sentences, multiple pending proceedings judicial review flags, and boundary days.
- **`auditChain.test.js`**: 4 cryptographic tests verifying initial genesis hash, sequential SHA-256 linking, detection of payload tampering, and detection of broken hash links.
- **`rbac.test.js`**: 7 API security tests verifying 401 unauthenticated requests, 403 cross-role violations (Citizen accessing Admin/Judge endpoints), and 403 unassigned Judge boundary enforcement.

### Build Client Production Bundle
```bash
npm --prefix client run build
```
Vite executes TypeScript/JavaScript tree-shaking, CSS minification, and outputs clean static assets to `client/dist`.

---

## Statutory Disclaimers & Compliance

> **LEGAL NOTICE & STATUTORY DISCLAIMER:**
> Bail Reckoner is a decision-support and legal information system designed in alignment with the *Bharatiya Nagarik Suraksha Sanhita, 2023 (BNSS)* and *Bharatiya Nyaya Sanhita, 2023 (BNS)*. The calculations and auto-drafted petitions generated by this platform are for informational, administrative, and legal aid assistance only.
>
> All generated petitions are watermarked as **"DRAFT: for review by a licensed advocate"** and must be reviewed, verified, and signed by an advocate enrolled with the Bar Council before presentation before any Court of Law. Judicial discretion remains supreme under Indian criminal jurisprudence.
