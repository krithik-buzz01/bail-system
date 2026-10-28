import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import JudgeProfile from '../models/JudgeProfile.js';
import Offence from '../models/Offence.js';
import RightsContent from '../models/RightsContent.js';
import LegalAidContact from '../models/LegalAidContact.js';
import DraftTemplate from '../models/DraftTemplate.js';
import SystemSetting from '../models/SystemSetting.js';
import { ROLES, ANTIL_CATEGORIES } from '../config/constants.js';
import { recordAuditEvent } from './auditService.js';

export const seedDatabase = async () => {
  console.log('[SEED] Starting Bail Reckoner database seeding...');

  // 1. Seed System Settings (Default Bail 60/90 days configuration)
  const existingSetting = await SystemSetting.findOne({ key: 'DEFAULT_BAIL_CONFIG' });
  if (!existingSetting) {
    await SystemSetting.create({
      key: 'DEFAULT_BAIL_CONFIG',
      value: {
        generalDays: 60,
        heinousDays: 90,
        sectionCitation: 'Section 187(3) Bharatiya Nagarik Suraksha Sanhita, 2023 (formerly Section 167(2) CrPC)'
      },
      description: 'Statutory investigation thresholds for default bail under BNSS 2023'
    });
    console.log('[SEED] System settings seeded.');
  }

  // 2. Seed Admin User
  const adminEmail = (process.env.ADMIN_EMAIL || 'admin@bailreckoner.gov.in').toLowerCase().trim();
  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@Initial123';

  let adminUser = await User.findOne({ email: adminEmail });
  if (!adminUser) {
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(adminPassword, salt);
    adminUser = await User.create({
      fullName: 'System Administrator',
      email: adminEmail,
      passwordHash,
      role: ROLES.ADMIN,
      isVerified: true,
      isActive: true,
      mustChangePassword: true // Requirement: forced password change on first login
    });
    console.log(`[SEED] Admin created: ${adminEmail} (Forced password change enabled)`);
  }

  // 3. Seed Verified Demo Citizen
  const citizenEmail = 'citizen@bailreckoner.gov.in';
  let demoCitizen = await User.findOne({ email: citizenEmail });
  if (!demoCitizen) {
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('Citizen@12345', salt);
    demoCitizen = await User.create({
      fullName: 'Murugan Selvam',
      email: citizenEmail,
      phone: '9840123456',
      passwordHash,
      role: ROLES.CITIZEN,
      isVerified: true,
      isActive: true,
      language: 'en'
    });
    console.log(`[SEED] Demo citizen created: ${citizenEmail}`);
  }

  // 4. Seed Demo Active Judge and Demo Invited Judge
  const judgeEmail = 'judge.sharma@madrascourt.gov.in';
  let demoJudge = await User.findOne({ email: judgeEmail });
  if (!demoJudge) {
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('Judge@12345', salt);
    demoJudge = await User.create({
      fullName: 'Hon. Justice K. Sharma',
      email: judgeEmail,
      phone: '9444123456',
      passwordHash,
      role: ROLES.JUDGE,
      isVerified: true,
      isActive: true,
      language: 'en'
    });

    await JudgeProfile.create({
      userId: demoJudge._id,
      court: 'Principal District and Sessions Court, Chennai',
      bench: 'Criminal Bench II',
      isInviteAccepted: true
    });
    console.log(`[SEED] Active demo judge created: ${judgeEmail}`);
  }

  // Demo Invited Judge (Invite flow testable)
  const invitedJudgeEmail = 'judge.invited@madrascourt.gov.in';
  let invitedJudge = await User.findOne({ email: invitedJudgeEmail });
  if (!invitedJudge) {
    const salt = await bcrypt.genSalt(10);
    const dummyHash = await bcrypt.hash('InvitedJudge@Temp123', salt);
    invitedJudge = await User.create({
      fullName: 'Hon. Magistrate S. Venkatesh',
      email: invitedJudgeEmail,
      phone: '9444987654',
      passwordHash: dummyHash,
      role: ROLES.JUDGE,
      isVerified: false,
      isActive: true
    });

    await JudgeProfile.create({
      userId: invitedJudge._id,
      court: 'Metropolitan Magistrate Court, Egmore, Chennai',
      bench: 'Court Room 3',
      invitedBy: adminUser._id,
      inviteTokenHash: 'demo_invite_token_hash_egmore_2026',
      inviteExpiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
      isInviteAccepted: false
    });
    console.log(`[SEED] Demo invited judge created: ${invitedJudgeEmail}`);
  }

  // 5. Seed 28 Real Offences (BNSS/BNS/IPC verified)
  const offencesCount = await Offence.countDocuments();
  if (offencesCount < 25) {
    await Offence.deleteMany({}); // Refresh catalogue
    const offencesData = [
      {
        section: 'Section 303(2) BNS',
        act: 'Bharatiya Nyaya Sanhita, 2023',
        correspondingSection: 'Section 379 IPC',
        title: 'Theft',
        description: 'Dishonest taking of movable property out of possession without consent',
        maxSentenceYears: 3,
        bailable: false,
        punishableDeathOrLife: false,
        antilCategory: ANTIL_CATEGORIES.A,
        trialCourt: 'Magistrate Court'
      },
      {
        section: 'Section 318(4) BNS',
        act: 'Bharatiya Nyaya Sanhita, 2023',
        correspondingSection: 'Section 420 IPC',
        title: 'Cheating and Dishonestly Inducing Delivery of Property',
        description: 'Deception leading to delivery of property or alteration of valuable security',
        maxSentenceYears: 7,
        bailable: false,
        punishableDeathOrLife: false,
        antilCategory: ANTIL_CATEGORIES.D,
        trialCourt: 'Magistrate of First Class'
      },
      {
        section: 'Section 316(2) BNS',
        act: 'Bharatiya Nyaya Sanhita, 2023',
        correspondingSection: 'Section 406 IPC',
        title: 'Criminal Breach of Trust',
        description: 'Dishonest misappropriation of entrusted property',
        maxSentenceYears: 3,
        bailable: false,
        punishableDeathOrLife: false,
        antilCategory: ANTIL_CATEGORIES.A,
        trialCourt: 'Magistrate Court'
      },
      {
        section: 'Section 115(2) BNS',
        act: 'Bharatiya Nyaya Sanhita, 2023',
        correspondingSection: 'Section 323 IPC',
        title: 'Voluntarily Causing Hurt',
        description: 'Causing bodily pain, disease or infirmity intentionally',
        maxSentenceYears: 1,
        bailable: true,
        punishableDeathOrLife: false,
        antilCategory: ANTIL_CATEGORIES.A,
        trialCourt: 'Any Magistrate'
      },
      {
        section: 'Section 117(2) BNS',
        act: 'Bharatiya Nyaya Sanhita, 2023',
        correspondingSection: 'Section 325 IPC',
        title: 'Voluntarily Causing Grievous Hurt',
        description: 'Causing severe hurt like fracture, privation of sight/hearing, or severe body ache',
        maxSentenceYears: 7,
        bailable: true,
        punishableDeathOrLife: false,
        antilCategory: ANTIL_CATEGORIES.A,
        trialCourt: 'Magistrate of First Class'
      },
      {
        section: 'Section 351(2) BNS',
        act: 'Bharatiya Nyaya Sanhita, 2023',
        correspondingSection: 'Section 506 Part I IPC',
        title: 'Criminal Intimidation (Simple)',
        description: 'Threatening another with injury to person, reputation or property',
        maxSentenceYears: 2,
        bailable: true,
        punishableDeathOrLife: false,
        antilCategory: ANTIL_CATEGORIES.A,
        trialCourt: 'Any Magistrate'
      },
      {
        section: 'Section 351(3) BNS',
        act: 'Bharatiya Nyaya Sanhita, 2023',
        correspondingSection: 'Section 506 Part II IPC',
        title: 'Criminal Intimidation (Threat to Cause Death or Grievous Hurt)',
        description: 'Threat of death, grievous hurt, or destruction of property by fire',
        maxSentenceYears: 7,
        bailable: false,
        punishableDeathOrLife: false,
        antilCategory: ANTIL_CATEGORIES.A,
        trialCourt: 'Magistrate of First Class'
      },
      {
        section: 'Section 336(2) BNS',
        act: 'Bharatiya Nyaya Sanhita, 2023',
        correspondingSection: 'Section 465 IPC',
        title: 'Simple Forgery',
        description: 'Making a false document or electronic record with intent to cause damage',
        maxSentenceYears: 2,
        bailable: true,
        punishableDeathOrLife: false,
        antilCategory: ANTIL_CATEGORIES.A,
        trialCourt: 'Magistrate of First Class'
      },
      {
        section: 'Section 338 BNS',
        act: 'Bharatiya Nyaya Sanhita, 2023',
        correspondingSection: 'Section 467 IPC',
        title: 'Forgery of Valuable Security, Will, etc.',
        description: 'Forging documents of title, will, authority to adopt, or valuable securities',
        maxSentenceYears: 10,
        bailable: false,
        punishableDeathOrLife: true, // Punishable with imprisonment for life or up to 10 years
        antilCategory: ANTIL_CATEGORIES.B,
        trialCourt: 'Magistrate of First Class'
      },
      {
        section: 'Section 331(3) BNS',
        act: 'Bharatiya Nyaya Sanhita, 2023',
        correspondingSection: 'Section 454 IPC',
        title: 'Lurking House-Trespass or House-Breaking',
        description: 'Trespass by night or breaking into building to commit an offence punishable with imprisonment',
        maxSentenceYears: 3,
        bailable: false,
        punishableDeathOrLife: false,
        antilCategory: ANTIL_CATEGORIES.A,
        trialCourt: 'Magistrate of First Class'
      },
      {
        section: 'Section 309(4) BNS',
        act: 'Bharatiya Nyaya Sanhita, 2023',
        correspondingSection: 'Section 392 IPC',
        title: 'Robbery',
        description: 'Theft or extortion accomplished with death, hurt, or wrongful restraint',
        maxSentenceYears: 10,
        bailable: false,
        punishableDeathOrLife: false,
        antilCategory: ANTIL_CATEGORIES.B,
        trialCourt: 'Magistrate of First Class'
      },
      {
        section: 'Section 310(2) BNS',
        act: 'Bharatiya Nyaya Sanhita, 2023',
        correspondingSection: 'Section 395 IPC',
        title: 'Dacoity',
        description: 'Robbery committed conjointly by five or more persons',
        maxSentenceYears: 10,
        bailable: false,
        punishableDeathOrLife: true, // Life or rigorous imprisonment up to 10 years
        antilCategory: ANTIL_CATEGORIES.B,
        trialCourt: 'Court of Session'
      },
      {
        section: 'Section 308(2) BNS',
        act: 'Bharatiya Nyaya Sanhita, 2023',
        correspondingSection: 'Section 384 IPC',
        title: 'Extortion',
        description: 'Intentionally putting any person in fear of injury and dishonestly inducing delivery of property',
        maxSentenceYears: 3,
        bailable: false,
        punishableDeathOrLife: false,
        antilCategory: ANTIL_CATEGORIES.A,
        trialCourt: 'Magistrate of First Class'
      },
      {
        section: 'Section 281 BNS',
        act: 'Bharatiya Nyaya Sanhita, 2023',
        correspondingSection: 'Section 279 IPC',
        title: 'Rash Driving on Public Way',
        description: 'Driving vehicle rashly or negligently endangering human life',
        maxSentenceYears: 0.5,
        bailable: true,
        punishableDeathOrLife: false,
        antilCategory: ANTIL_CATEGORIES.A,
        trialCourt: 'Any Magistrate'
      },
      {
        section: 'Section 106(1) BNS',
        act: 'Bharatiya Nyaya Sanhita, 2023',
        correspondingSection: 'Section 304A IPC',
        title: 'Causing Death by Negligence',
        description: 'Causing death by rash or negligent act not amounting to culpable homicide',
        maxSentenceYears: 5,
        bailable: true,
        punishableDeathOrLife: false,
        antilCategory: ANTIL_CATEGORIES.A,
        trialCourt: 'Magistrate of First Class'
      },
      {
        section: 'Section 109(1) BNS',
        act: 'Bharatiya Nyaya Sanhita, 2023',
        correspondingSection: 'Section 307 IPC',
        title: 'Attempt to Murder',
        description: 'Doing any act with intention or knowledge that it could cause death',
        maxSentenceYears: 10,
        bailable: false,
        punishableDeathOrLife: false,
        antilCategory: ANTIL_CATEGORIES.B,
        trialCourt: 'Court of Session'
      },
      {
        section: 'Section 103(1) BNS',
        act: 'Bharatiya Nyaya Sanhita, 2023',
        correspondingSection: 'Section 302 IPC',
        title: 'Murder',
        description: 'Intentional causing of death with premeditation or knowledge of fatal consequence',
        maxSentenceYears: 99,
        bailable: false,
        punishableDeathOrLife: true, // Death or Life imprisonment
        antilCategory: ANTIL_CATEGORIES.B,
        trialCourt: 'Court of Session'
      },
      {
        section: 'Section 105 BNS',
        act: 'Bharatiya Nyaya Sanhita, 2023',
        correspondingSection: 'Section 304 Part I & II IPC',
        title: 'Culpable Homicide not Amounting to Murder',
        description: 'Causing death with intent to cause bodily injury likely to cause death',
        maxSentenceYears: 10,
        bailable: false,
        punishableDeathOrLife: true, // Imprisonment for life, or up to 10 years
        antilCategory: ANTIL_CATEGORIES.B,
        trialCourt: 'Court of Session'
      },
      {
        section: 'Section 80 BNS',
        act: 'Bharatiya Nyaya Sanhita, 2023',
        correspondingSection: 'Section 304B IPC',
        title: 'Dowry Death',
        description: 'Death of woman within seven years of marriage under suspicious circumstances linked to dowry harassment',
        maxSentenceYears: 10,
        bailable: false,
        punishableDeathOrLife: true, // Minimum 7 years, up to imprisonment for life
        antilCategory: ANTIL_CATEGORIES.B,
        trialCourt: 'Court of Session'
      },
      {
        section: 'Section 85 BNS',
        act: 'Bharatiya Nyaya Sanhita, 2023',
        correspondingSection: 'Section 498A IPC',
        title: 'Cruelty by Husband or Relatives of Husband',
        description: 'Harassment or wilful conduct driving a woman to suicide or bodily injury',
        maxSentenceYears: 3,
        bailable: false,
        punishableDeathOrLife: false,
        antilCategory: ANTIL_CATEGORIES.A,
        trialCourt: 'Magistrate of First Class'
      },
      {
        section: 'Section 74 BNS',
        act: 'Bharatiya Nyaya Sanhita, 2023',
        correspondingSection: 'Section 354 IPC',
        title: 'Assault or Criminal Force to Woman with Intent to Outrage Modesty',
        description: 'Assaulting or using criminal force knowing it is likely to outrage her modesty',
        maxSentenceYears: 5,
        bailable: false,
        punishableDeathOrLife: false,
        antilCategory: ANTIL_CATEGORIES.A,
        trialCourt: 'Any Magistrate'
      },
      {
        section: 'Section 78 BNS',
        act: 'Bharatiya Nyaya Sanhita, 2023',
        correspondingSection: 'Section 354D IPC',
        title: 'Stalking',
        description: 'Following a woman and contacting or attempting to contact her repeatedly despite disinterest',
        maxSentenceYears: 3,
        bailable: true, // Bailable on first conviction
        punishableDeathOrLife: false,
        antilCategory: ANTIL_CATEGORIES.A,
        trialCourt: 'Any Magistrate'
      },
      {
        section: 'Section 356(2) BNS',
        act: 'Bharatiya Nyaya Sanhita, 2023',
        correspondingSection: 'Section 500 IPC',
        title: 'Defamation',
        description: 'Making or publishing any imputation intending to harm reputation',
        maxSentenceYears: 2,
        bailable: true,
        punishableDeathOrLife: false,
        antilCategory: ANTIL_CATEGORIES.A,
        trialCourt: 'Magistrate of First Class'
      },
      {
        section: 'Section 194 BNS',
        act: 'Bharatiya Nyaya Sanhita, 2023',
        correspondingSection: 'Section 160 IPC',
        title: 'Affray',
        description: 'Two or more persons fighting in a public place disturbing public peace',
        maxSentenceYears: 0.08, // 1 month
        bailable: true,
        punishableDeathOrLife: false,
        antilCategory: ANTIL_CATEGORIES.A,
        trialCourt: 'Any Magistrate'
      },
      {
        section: 'Section 20(b)(ii)(A) NDPS Act',
        act: 'Narcotic Drugs and Psychotropic Substances Act, 1985',
        correspondingSection: 'NDPS Small Quantity',
        title: 'Possession of Small Quantity of Cannabis',
        description: 'Contravention in relation to cannabis plant and cannabis in small quantities',
        maxSentenceYears: 1,
        bailable: true,
        punishableDeathOrLife: false,
        antilCategory: ANTIL_CATEGORIES.C,
        trialCourt: 'Magistrate / Special Court'
      },
      {
        section: 'Section 21(c) NDPS Act',
        act: 'Narcotic Drugs and Psychotropic Substances Act, 1985',
        correspondingSection: 'NDPS Commercial Quantity',
        title: 'Possession of Commercial Quantity of Manufactured Drugs',
        description: 'Involvement with commercial quantities of narcotics subject to Section 37 NDPS embargo',
        maxSentenceYears: 20,
        bailable: false,
        punishableDeathOrLife: false,
        antilCategory: ANTIL_CATEGORIES.C,
        trialCourt: 'Special NDPS Court'
      },
      {
        section: 'Section 3 & 4 PMLA',
        act: 'Prevention of Money Laundering Act, 2002',
        correspondingSection: 'Money Laundering',
        title: 'Offence of Money Laundering',
        description: 'Directly or indirectly attempting to indulge in activity connected with proceeds of crime',
        maxSentenceYears: 7,
        bailable: false,
        punishableDeathOrLife: false,
        antilCategory: ANTIL_CATEGORIES.C,
        trialCourt: 'Special PMLA Court'
      },
      {
        section: 'Section 66C IT Act',
        act: 'Information Technology Act, 2000',
        correspondingSection: 'Identity Theft',
        title: 'Identity Theft and Impersonation Online',
        description: 'Fraudulently making use of electronic signature, password or unique identification feature',
        maxSentenceYears: 3,
        bailable: true,
        punishableDeathOrLife: false,
        antilCategory: ANTIL_CATEGORIES.D,
        trialCourt: 'Magistrate Court'
      }
    ];

    for (const item of offencesData) {
      const created = await Offence.create({
        ...item,
        currentVersion: 1,
        versions: [
          {
            versionNumber: 1,
            section: item.section,
            act: item.act,
            title: item.title,
            maxSentenceYears: item.maxSentenceYears,
            bailable: item.bailable,
            punishableDeathOrLife: item.punishableDeathOrLife,
            antilCategory: item.antilCategory,
            changedBy: adminUser._id,
            reason: 'Official statutory seeding of BNSS 2023 & Special Acts catalogue',
            effectiveFrom: new Date()
          }
        ]
      });
    }
    console.log(`[SEED] ${offencesData.length} legal offences seeded with version 1.`);
  }

  // 6. Seed Bilingual Rights Content
  const rightsCount = await RightsContent.countDocuments();
  if (rightsCount < 8) {
    await RightsContent.deleteMany({});
    const rightsData = [
      {
        key: 'GROUNDS_OF_ARREST',
        titleEn: 'Right to Know Grounds of Arrest',
        titleTa: 'கைதுக்கான காரணங்களை அறியும் உரிமை',
        descriptionEn: 'Every arrested person has a fundamental right to be informed immediately of the exact grounds and particulars of arrest in a language they understand.',
        descriptionTa: 'கைது செய்யப்படும் ஒவ்வொரு நபருக்கும் தான் எதற்காக கைது செய்யப்படுகிறோம் என்ற முழுமையான காரணங்களை உடனே புரிந்துகொள்ளும் மொழியில் அறிந்து கொள்ள உரிமை உண்டு.',
        legalBasis: 'Article 22(1) of Constitution; Section 47 BNSS, 2023 (formerly Sec 50 CrPC)',
        category: 'Arrest & Custody',
        order: 1
      },
      {
        key: 'INFORM_RELATIVE',
        titleEn: 'Right to Inform a Relative or Nominated Person',
        titleTa: 'உறவினர் அல்லது நண்பருக்கு தகவல் தெரிவிக்கும் உரிமை',
        descriptionEn: 'The police officer making an arrest must immediately inform a friend, relative, or person nominated by the arrested person about the arrest and place of custody.',
        descriptionTa: 'கைது செய்த காவல்துறை அதிகாரி, கைது செய்யப்பட்ட நபரால் குறிப்பிடப்படும் நண்பர், உறவினர் அல்லது குடும்பத்தினருக்கு கைது விபரம் மற்றும் தடுத்து வைக்கப்பட்டுள்ள இடத்தை உடனே தெரிவிக்க வேண்டும்.',
        legalBasis: 'Section 48 BNSS, 2023 (formerly Sec 50A CrPC); D.K. Basu Guidelines',
        category: 'Arrest & Custody',
        order: 2
      },
      {
        key: 'CONSULT_LAWYER',
        titleEn: 'Right to Consult and be Defended by a Lawyer',
        titleTa: 'வழக்கறிஞரை அணுகி ஆலோசனை பெறும் உரிமை',
        descriptionEn: 'An arrested person has the constitutional guarantee to meet and consult an advocate of their choice throughout interrogation and court proceedings.',
        descriptionTa: 'காவல் விசாரணை மற்றும் நீதிமன்ற நடவடிக்கைகளின் போது தனக்கு விருப்பமான வழக்கறிஞரை சந்தித்துப் பேசவும், ஆலோசிக்கவும் சட்டப்பூர்வ உரிமை உண்டு.',
        legalBasis: 'Article 22(1) of Constitution; Section 540 BNSS, 2023 (formerly Sec 303 CrPC)',
        category: 'Legal Defense',
        order: 3
      },
      {
        key: 'FREE_LEGAL_AID',
        titleEn: 'Right to Free Legal Aid (DLSA / SLSA)',
        titleTa: 'இலவச சட்ட உதவி பெறும் உரிமை (DLSA)',
        descriptionEn: 'Indigent persons, undertrial prisoners, and anyone unable to engage counsel due to financial constraints are entitled to competent free legal aid at state expense.',
        descriptionTa: 'பொருளாதார வசதி இல்லாதவர்கள் அல்லது வழக்கறிஞர் நியமிக்க முடியாத கைதிகளுக்கு, மாவட்ட சட்டப் பணிகள் ஆணைக்குழு (DLSA) மூலம் இலவச வழக்கறிஞர் உதவி வழங்கப்பட வேண்டும்.',
        legalBasis: 'Article 39A of Constitution; Section 341 BNSS, 2023 (formerly Sec 304 CrPC)',
        category: 'Legal Defense',
        order: 4
      },
      {
        key: 'MAGISTRATE_24_HOURS',
        titleEn: 'Right to be Produced Before Magistrate within 24 Hours',
        titleTa: '24 மணி நேரத்திற்குள் நடுவர் முன் ஆஜர்படுத்தப்படும் உரிமை',
        descriptionEn: 'No police officer shall detain an arrested person in custody for more than 24 hours without producing them before the nearest Judicial Magistrate.',
        descriptionTa: 'கைது செய்யப்பட்ட எந்தவொரு நபரும், பயண நேரத்தைத் தவிர்த்து, 24 மணி நேரத்திற்கு மேல் நீதிமன்ற நடுவரின் அனுமதியின்றி போலீஸ் காவலில் வைக்கப்படக் கூடாது.',
        legalBasis: 'Article 22(2) of Constitution; Section 54 BNSS, 2023 (formerly Sec 57 CrPC)',
        category: 'Judicial Scrutiny',
        order: 5
      },
      {
        key: 'MEDICAL_EXAMINATION',
        titleEn: 'Right to Medical Examination by Registered Medical Officer',
        titleTa: 'மருத்துவப் பரிசோதனை செய்து கொள்ளும் உரிமை',
        descriptionEn: 'The arrested person must be examined by a medical officer soon after arrest and before remand to record any injuries or pre-existing physical conditions.',
        descriptionTa: 'கைது செய்யப்பட்ட உடனேயும், நீதிமன்றக் காவலுக்கு அனுப்பும் முன்பும் அரசு மருத்துவரால் உடல் பரிசோதனை செய்யப்பட்டு காயங்கள் மற்றும் உடற்தகுதி ஆவணப்படுத்தப்பட வேண்டும்.',
        legalBasis: 'Section 51 & 53 BNSS, 2023 (formerly Sec 54 CrPC)',
        category: 'Health & Dignity',
        order: 6
      },
      {
        key: 'RIGHT_TO_SILENCE',
        titleEn: 'Right to Silence & Protection against Self-Incrimination',
        titleTa: 'மௌனம் காக்கும் உரிமை மற்றும் கட்டாய வாக்குமூலப் பாதுகாப்பு',
        descriptionEn: 'No accused person can be compelled to be a witness against themselves or forced to give incriminating confessions or statements under custodial duress.',
        descriptionTa: 'காவலில் இருக்கும் போது தனக்கு எதிராகவே வாக்குமூலம் அளிக்கவோ அல்லது குற்றத்தை ஒப்புக்கொள்ளவோ எந்தவொரு நபரும் வற்புறுத்தப்படக் கூடாது.',
        legalBasis: 'Article 20(3) of Constitution; Nandini Satpathy v. P.L. Dani (1978)',
        category: 'Fundamental Freedoms',
        order: 7
      },
      {
        key: 'BAILABLE_OFFENCE_BAIL',
        titleEn: 'Right to Immediate Bail in Bailable Offences',
        titleTa: 'பிணை பெறத்தக்க குற்றங்களில் உடனடி பிணை பெறும் உரிமை',
        descriptionEn: 'If accused of a bailable offence, bail is an absolute right. The police or court must release the person immediately upon furnishing of reasonable bail bond.',
        descriptionTa: 'பிணை பெறக்கூடிய குற்றங்களில் குற்றம் சாட்டப்பட்டவர் தகுந்த பிணைப்பத்திரம் சமர்ப்பித்தால் அவரைப் பிணையில் விடுவிப்பது நீதிமன்றம் மற்றும் காவல்துறையின் கட்டாயக் கடமையாகும்.',
        legalBasis: 'Section 478 BNSS, 2023 (formerly Sec 436 CrPC)',
        category: 'Bail Protections',
        order: 8
      }
    ];

    await RightsContent.insertMany(rightsData);
    console.log(`[SEED] ${rightsData.length} bilingual rights content entries seeded.`);
  }

  // 7. Seed Tamil Nadu DLSA Contacts
  const contactsCount = await LegalAidContact.countDocuments();
  if (contactsCount < 7) {
    await LegalAidContact.deleteMany({});
    const dlsaContacts = [
      {
        district: 'Chennai',
        officeName: 'District Legal Services Authority, Chennai',
        address: 'City Civil Court Complex, High Court Campus, Chennai - 600104',
        phone: '044-25342441',
        email: 'dlsachennai@gmail.com',
        secretaryName: 'Sub Judge / Secretary, DLSA Chennai',
        sourceUrl: 'https://districts.ecourts.gov.in/chennai',
        verificationDate: new Date('2026-01-15')
      },
      {
        district: 'Coimbatore',
        officeName: 'District Legal Services Authority, Coimbatore',
        address: 'Integrated Court Complex, Arts College Road, Coimbatore - 641018',
        phone: '0422-2244244',
        email: 'dlsacbe@gmail.com',
        secretaryName: 'Sub Judge / Secretary, DLSA Coimbatore',
        sourceUrl: 'https://districts.ecourts.gov.in/coimbatore',
        verificationDate: new Date('2026-01-15')
      },
      {
        district: 'Madurai',
        officeName: 'District Legal Services Authority, Madurai',
        address: 'District Court Complex, Melur Main Road, Madurai - 625020',
        phone: '0452-2533222',
        email: 'dlsamadurai@gmail.com',
        secretaryName: 'Sub Judge / Secretary, DLSA Madurai',
        sourceUrl: 'https://districts.ecourts.gov.in/madurai',
        verificationDate: new Date('2026-01-15')
      },
      {
        district: 'Tiruchirappalli',
        officeName: 'District Legal Services Authority, Tiruchirappalli',
        address: 'Court Buildings, Cantonment, Tiruchirappalli - 620001',
        phone: '0431-2410850',
        email: 'dlsatrichy@gmail.com',
        secretaryName: 'Sub Judge / Secretary, DLSA Trichy',
        sourceUrl: 'https://districts.ecourts.gov.in/tiruchirappalli',
        verificationDate: new Date('2026-01-15')
      },
      {
        district: 'Salem',
        officeName: 'District Legal Services Authority, Salem',
        address: 'Combined Court Buildings, Hasthampatti, Salem - 636007',
        phone: '0427-2415120',
        email: 'dlsasalem@gmail.com',
        secretaryName: 'Sub Judge / Secretary, DLSA Salem',
        sourceUrl: 'https://districts.ecourts.gov.in/salem',
        verificationDate: new Date('2026-01-15')
      },
      {
        district: 'Tirunelveli',
        officeName: 'District Legal Services Authority, Tirunelveli',
        address: 'District Court Buildings, Kokkirakulam, Tirunelveli - 627009',
        phone: '0462-2500050',
        email: 'dlsatin@gmail.com',
        secretaryName: 'Sub Judge / Secretary, DLSA Tirunelveli',
        sourceUrl: 'https://districts.ecourts.gov.in/tirunelveli',
        verificationDate: new Date('2026-01-15')
      },
      {
        district: 'Vellore',
        officeName: 'District Legal Services Authority, Vellore',
        address: 'Combined Court Complex, Sathuvachari, Vellore - 632009',
        phone: '0416-2253330',
        email: 'dlsavellore@gmail.com',
        secretaryName: 'Sub Judge / Secretary, DLSA Vellore',
        sourceUrl: 'https://districts.ecourts.gov.in/vellore',
        verificationDate: new Date('2026-01-15')
      },
      {
        district: 'State Authority (TNSLSA)',
        officeName: 'Tamil Nadu State Legal Services Authority',
        address: 'North Fort Road, High Court Campus, Chennai - 600104',
        phone: '044-25342834 / Toll Free: 15100',
        email: 'tnslsachennai@gmail.com',
        secretaryName: 'Member Secretary, TNSLSA',
        sourceUrl: 'https://slsa.tn.gov.in',
        verificationDate: new Date('2026-01-15')
      }
    ];

    await LegalAidContact.insertMany(dlsaContacts);
    console.log(`[SEED] ${dlsaContacts.length} Tamil Nadu DLSA contact entries seeded.`);
  }

  // 8. Seed Default Bail Draft Templates
  const templateCount = await DraftTemplate.countDocuments();
  if (templateCount === 0) {
    const templates = [
      {
        templateType: 'REGULAR_BAIL',
        title: 'Regular Bail Petition Template (Section 480 BNSS)',
        courtHeadingTemplate: 'IN THE COURT OF {{COURT_NAME}} AT {{DISTRICT}}',
        partyDetailsTemplate: '{{PETITIONER_NAME}}, Age {{AGE}} years, residing at {{ADDRESS}} ... PETITIONER / ACCUSED\nVERSUS\nSTATE REP BY INSPECTOR OF POLICE, {{POLICE_STATION}} PS ... RESPONDENT',
        factsTemplate: '1. The Petitioner has been implicated in Crime No. {{FIR_NUMBER}} of {{POLICE_STATION}} PS for alleged offences under {{OFFENCE_SECTIONS}}.\n2. The Petitioner was remanded on {{REMAND_DATE}} and has served {{DAYS_IN_CUSTODY}} days in judicial custody.',
        groundsTemplate: '{{STATUTORY_GROUNDS}}\n• The Petitioner is an innocent citizen with permanent residence and no criminal antecedents.\n• The Petitioner undertakes to cooperate with trial and furnish solvent sureties.',
        prayerTemplate: 'Wherefore, it is prayed that this Hon\'ble Court may be pleased to enlarge the Petitioner on bail in Crime No. {{FIR_NUMBER}}.',
        verificationTemplate: 'I, {{PETITIONER_NAME}}, do hereby verify that the facts stated above are true to my knowledge. Verified at {{DISTRICT}} on {{DATE}}.',
        placeholders: [
          '{{COURT_NAME}}',
          '{{DISTRICT}}',
          '{{PETITIONER_NAME}}',
          '{{AGE}}',
          '{{ADDRESS}}',
          '{{POLICE_STATION}}',
          '{{FIR_NUMBER}}',
          '{{OFFENCE_SECTIONS}}',
          '{{REMAND_DATE}}',
          '{{DAYS_IN_CUSTODY}}',
          '{{STATUTORY_GROUNDS}}',
          '{{DATE}}'
        ]
      },
      {
        templateType: 'DEFAULT_BAIL',
        title: 'Default Bail Petition Template (Section 187(3) BNSS)',
        courtHeadingTemplate: 'IN THE COURT OF THE JUDICIAL MAGISTRATE AT {{DISTRICT}}',
        partyDetailsTemplate: '{{PETITIONER_NAME}} ... PETITIONER\nVERSUS\nSTATE ... RESPONDENT',
        factsTemplate: '1. The Petitioner was remanded to judicial custody on {{REMAND_DATE}}.\n2. The statutory investigation timeframe of {{STATUTORY_DAYS}} days expired on {{DEADLINE_DATE}}.\n3. The investigating police agency failed to file a chargesheet under Section 193 BNSS within the statutory limit.',
        groundsTemplate: '• Under Section 187(3) BNSS, 2023, an indefeasible right to default bail has accrued.\n• The Petitioner is ready and willing to furnish solvent sureties.',
        prayerTemplate: 'It is prayed that the Petitioner be released on mandatory default bail under Section 187(3) BNSS.',
        verificationTemplate: 'Verified on {{DATE}} at {{DISTRICT}}.',
        placeholders: ['{{PETITIONER_NAME}}', '{{REMAND_DATE}}', '{{STATUTORY_DAYS}}', '{{DEADLINE_DATE}}', '{{DATE}}', '{{DISTRICT}}']
      }
    ];

    await DraftTemplate.insertMany(templates);
    console.log('[SEED] Draft templates seeded.');
  }

  console.log('[SEED] Database seeding completed successfully!');
};
