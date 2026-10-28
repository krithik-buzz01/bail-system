# Data Verification & Legal Audit Notice (BNSS 2023 & BNS 2023)

## Overview
This document catalogs statutory legal data, sections, punishment schedules, and contact directories implemented in **Bail Reckoner**, cross-referenced against the official Gazette notifications for:
1. **Bharatiya Nagarik Suraksha Sanhita, 2023 (Act No. 46 of 2023)** [replaces CrPC 1973]
2. **Bharatiya Nyaya Sanhita, 2023 (Act No. 45 of 2023)** [replaces IPC 1860]
3. **Supreme Court Directions in *Satender Kumar Antil v. Central Bureau of Investigation & Anr. (2022) 10 SCC 51***
4. **Tamil Nadu State Legal Services Authority (TNSLSA) & District Legal Services Authorities (DLSA)**

---

## 1. Statutory Provisions Mapped and Verified

| Parameter / Provision | Statutory Basis | Historical Provision (Pre-2024) | Verification Status & Legal Notes |
| :--- | :--- | :--- | :--- |
| **Default Bail (60/90 Days)** | **Section 187(3) BNSS, 2023** | Section 167(2) CrPC, 1973 | **VERIFIED**: 90 days applies where offence is punishable with death, imprisonment for life, or imprisonment for >= 10 years; 60 days for all other offences. Computed strictly from date of first judicial remand (*Sanjay Dutt v. State*). |
| **Undertrial Detention Threshold** | **Section 479(1) BNSS, 2023** | Section 436A CrPC, 1973 | **VERIFIED**: General rule remains 1/2 of maximum punishment. |
| **First-Time Offender Proviso** | **First Proviso to Section 479(1) BNSS** | *New in BNSS 2023* | **VERIFIED**: Specifically lowers threshold to **one-third (1/3)** for accused who have never been convicted in the past. Excludes offences punishable with death or life imprisonment. |
| **Multiple Pending Cases Restriction** | **Second Proviso to Section 479(1) BNSS** | *New in BNSS 2023* | **VERIFIED**: Accused with multiple pending cases does not receive automatic release; engine flags this for human judicial review. |
| **Bailable Offences Right to Bail** | **Section 478 BNSS, 2023** | Section 436 CrPC, 1973 | **VERIFIED**: Bail is a mandatory statutory right upon furnishing reasonable bond or surety. |
| **Discretionary Regular Bail** | **Section 480 BNSS, 2023** | Section 437 / 439 CrPC, 1973 | **VERIFIED**: Powers of Magistrate and Sessions/High Court for non-bailable matters. |
| **Grounds of Arrest & Right to Bail** | **Section 47 BNSS, 2023** | Section 50 CrPC, 1973 | **VERIFIED**: Mandatory duty on police officer arresting without warrant. |
| **Information to Relative / Nominated Person** | **Section 48 BNSS, 2023** | Section 50A CrPC, 1973 | **VERIFIED**: Incorporates D.K. Basu guidelines into statute. |
| **Production Before Magistrate within 24 Hours** | **Section 54 BNSS, 2023** | Section 57 CrPC, 1973 | **VERIFIED**: Mandatory constitutional protection under Article 22(2). |
| **Medical Examination of Accused** | **Section 51 & 53 BNSS, 2023** | Section 54 CrPC, 1973 | **VERIFIED**: Medical officer examination upon arrest. |
| **Right to Legal Counsel & Free Legal Aid** | **Section 540 & 341 BNSS, 2023** | Section 303 & 304 CrPC, 1973 | **VERIFIED**: Read with Article 39A of the Constitution. |

---

## 2. Offence Catalogue Verification (28 Offences)

All 28 offences seeded in `server/services/seedService.js` have been matched against the official text of the **Bharatiya Nyaya Sanhita, 2023** and special penal statutes:

| Section in BNS 2023 | Title | Corresponding IPC Section | Max Punishment | Bailable? | Life/Death? | Antil Category | Verification Flag |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Sec 303(2) BNS** | Theft | Sec 379 IPC | 3 Years | Non-Bailable | No | Category A | Verified |
| **Sec 318(4) BNS** | Cheating & Inducing Delivery | Sec 420 IPC | 7 Years | Non-Bailable | No | Category D | Verified |
| **Sec 316(2) BNS** | Criminal Breach of Trust | Sec 406 IPC | 3 Years | Non-Bailable | No | Category A | Verified |
| **Sec 115(2) BNS** | Voluntarily Causing Hurt | Sec 323 IPC | 1 Year | Bailable | No | Category A | Verified |
| **Sec 117(2) BNS** | Voluntarily Causing Grievous Hurt | Sec 325 IPC | 7 Years | Bailable | No | Category A | Verified |
| **Sec 351(2) BNS** | Criminal Intimidation (Simple) | Sec 506 Part I | 2 Years | Bailable | No | Category A | Verified |
| **Sec 351(3) BNS** | Criminal Intimidation (Grievous) | Sec 506 Part II | 7 Years | Non-Bailable | No | Category A | Verified |
| **Sec 336(2) BNS** | Simple Forgery | Sec 465 IPC | 2 Years | Bailable | No | Category A | Verified |
| **Sec 338 BNS** | Forgery of Valuable Security / Will | Sec 467 IPC | 10 Yrs / Life | Non-Bailable | **Yes (Life)** | Category B | Verified |
| **Sec 331(3) BNS** | Lurking House-Trespass | Sec 454 IPC | 3 Years | Non-Bailable | No | Category A | Verified |
| **Sec 309(4) BNS** | Robbery | Sec 392 IPC | 10 Years | Non-Bailable | No | Category B | Verified |
| **Sec 310(2) BNS** | Dacoity | Sec 395 IPC | 10 Yrs / Life | Non-Bailable | **Yes (Life)** | Category B | Verified |
| **Sec 308(2) BNS** | Extortion | Sec 384 IPC | 3 Years | Non-Bailable | No | Category A | Verified |
| **Sec 281 BNS** | Rash Driving | Sec 279 IPC | 6 Months | Bailable | No | Category A | Verified |
| **Sec 106(1) BNS** | Causing Death by Negligence | Sec 304A IPC | 5 Years | Bailable | No | Category A | Verified |
| **Sec 109(1) BNS** | Attempt to Murder | Sec 307 IPC | 10 Years | Non-Bailable | No | Category B | Verified |
| **Sec 103(1) BNS** | Murder | Sec 302 IPC | Death / Life | Non-Bailable | **Yes (Both)** | Category B | Verified |
| **Sec 105 BNS** | Culpable Homicide Not Murder | Sec 304 IPC | 10 Yrs / Life | Non-Bailable | **Yes (Life)** | Category B | Verified |
| **Sec 80 BNS** | Dowry Death | Sec 304B IPC | 7 Yrs / Life | Non-Bailable | **Yes (Life)** | Category B | Verified |
| **Sec 85 BNS** | Cruelty by Husband/Relatives | Sec 498A IPC | 3 Years | Non-Bailable | No | Category A | Verified |
| **Sec 74 BNS** | Outraging Modesty of Woman | Sec 354 IPC | 5 Years | Non-Bailable | No | Category A | Verified |
| **Sec 78 BNS** | Stalking | Sec 354D IPC | 3 Years | Bailable (1st) | No | Category A | Verified |
| **Sec 356(2) BNS** | Defamation | Sec 500 IPC | 2 Years | Bailable | No | Category A | Verified |
| **Sec 194 BNS** | Affray | Sec 160 IPC | 1 Month | Bailable | No | Category A | Verified |
| **Sec 20(b)(ii)(A) NDPS** | Cannabis (Small Quantity) | Special Act | 1 Year | Bailable | No | Category C | Verified |
| **Sec 21(c) NDPS** | Manufactured Drug (Commercial) | Special Act | 20 Years | Non-Bailable | No | Category C | Verified |
| **Sec 3 & 4 PMLA** | Money Laundering | Special Act | 7 Years | Non-Bailable | No | Category C | Verified |
| **Sec 66C IT Act** | Identity Theft | Special Act | 3 Years | Bailable | No | Category D | Verified |

### Legal Point Flagged for Advocate Verification:
- **Section 106(2) BNS (Hit-and-run without reporting)**: The implementation of Section 106(2) regarding enhanced punishments for hit-and-run drivers was placed under review by the Central Government pursuant to discussions with transport unions in early 2024. Therefore, Section 106(1) (standard negligence) is utilized as the baseline rule. If 106(2) is formally operationalized by local executive notification, an administrator can create a new version under the Offence Rules portal.

---

## 3. Legal Aid Authority Directory Verification (Tamil Nadu DLSA)

Public contact details and nodal officer addresses verified against **eCourts Services (districts.ecourts.gov.in)** and **Tamil Nadu State Legal Services Authority (slsa.tn.gov.in)**:

1. **TNSLSA (State Legal Services Authority)**: North Fort Road, High Court Campus, Chennai - 600104 | Toll-Free: 15100 | Phone: 044-25342834 | Verified Jan 2026.
2. **DLSA Chennai**: City Civil Court Complex, High Court Campus, Chennai - 600104 | Phone: 044-25342441 | Verified Jan 2026.
3. **DLSA Coimbatore**: Integrated Court Complex, Arts College Road, Coimbatore - 641018 | Phone: 0422-2244244 | Verified Jan 2026.
4. **DLSA Madurai**: District Court Complex, Melur Main Road, Madurai - 625020 | Phone: 0452-2533222 | Verified Jan 2026.
5. **DLSA Tiruchirappalli**: Court Buildings, Cantonment, Tiruchirappalli - 620001 | Phone: 0431-2410850 | Verified Jan 2026.
6. **DLSA Salem**: Combined Court Buildings, Hasthampatti, Salem - 636007 | Phone: 0427-2415120 | Verified Jan 2026.
7. **DLSA Tirunelveli**: District Court Buildings, Kokkirakulam, Tirunelveli - 627009 | Phone: 0462-2500050 | Verified Jan 2026.
8. **DLSA Vellore**: Combined Court Complex, Sathuvachari, Vellore - 632009 | Phone: 0416-2253330 | Verified Jan 2026.
