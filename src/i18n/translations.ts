export type Language = 'en' | 'hi' | 'mr' | 'ta';

export const translations = {
  en: {
    appTitle: 'CareGrid',
    appSubtitle: 'Public Healthcare Care-Coordination Platform',
    missionStatement: 'Connecting patients from their current situation to the next appropriate step across triage, facility selection, referral, diagnostics, treatment, and follow-up.',
    nav: {
      triage: 'Digital Triage',
      routing: 'Facility Routing',
      referrals: 'Referral Handshake',
      journey: 'Care Journey',
      careGaps: 'Care-Gap Radar',
      dashboard: 'Dashboard',
      offline: 'Offline Pack',
      records: 'Health Record',
      medicines: 'Medicine Stock',
      audit: 'Audit Log'
    },
    roles: {
      PATIENT: 'Patient',
      HEALTH_WORKER: 'Health Worker (ASHA/ANM)',
      DOCTOR: 'Medical Specialist',
      FACILITY_ADMIN: 'Facility Admin',
      SYSTEM_ADMIN: 'System Admin (DHO)'
    },
    triage: {
      title: 'AI-Assisted Digital Triage',
      disclaimer: 'AI-assisted triage. Final clinical decision must be confirmed by an authorized healthcare professional.',
      symptomsLabel: 'Patient Symptoms & Chief Complaint',
      symptomsPlaceholder: 'Describe symptoms (e.g., chest heaviness, breathing difficulty, fever for 3 days)...',
      speakButton: 'Speak Symptoms',
      listening: 'Listening... (Speak in English, Hindi, or Marathi)',
      durationLabel: 'Duration of Symptoms',
      vitalsSection: 'Vitals & Clinical Measurements (Optional)',
      bp: 'Blood Pressure (Sys/Dia)',
      heartRate: 'Heart Rate (bpm)',
      spo2: 'Oxygen Saturation SpO2 (%)',
      temp: 'Temperature (°F)',
      evaluateButton: 'Evaluate Triage Urgency',
      redEmergency: 'RED - Emergency',
      orangePriority: 'ORANGE - Priority',
      greenRoutine: 'GREEN - Routine',
      reasonsTitle: 'Clinical Reasons for Classification',
      warningSignsTitle: 'Warning Signs & Risk Alerts',
      nextActionTitle: 'Recommended Next Clinical Action',
      confirmButton: 'Confirm as Health Worker',
      routeButton: 'Find Best Facility & Route Now'
    },
    routing: {
      title: 'Intelligent & Capacity-Aware Facility Routing',
      subtitle: 'Multi-criteria clinical scoring considering emergency capability, specialist availability, bed capacity, wait times, and diagnostics.',
      nearestWarning: 'Notice: The nearest clinic may lack critical specialists or beds. CareGrid routes to the most clinically appropriate facility.',
      scoreLabel: 'CareGrid Match Score',
      distance: 'Distance',
      travelTime: 'Est. Travel Time',
      reasonsWhy: 'Why this facility is recommended:',
      specialists: 'Specialists On-Duty',
      bedsAvailable: 'Beds Free',
      queueLength: 'Current Queue',
      createReferral: 'Initiate Referral Handshake'
    },
    referral: {
      title: 'Referral Handshake Lifecycle',
      subtitle: 'Transparent handoff tracking from community health worker to receiving hospital specialist.',
      inbox: 'Incoming Referral Inbox',
      outbound: 'Community Referrals Tracker',
      code: 'Referral Code',
      patient: 'Patient',
      from: 'Referring Provider',
      target: 'Target Facility',
      status: 'Current Status',
      accept: 'Accept Patient',
      reject: 'Decline / Re-route',
      markArrived: 'Mark Patient Arrived',
      completeConsult: 'Complete Consultation',
      tokenIssued: 'OPD Token Assigned'
    },
    journey: {
      title: 'Continuous Patient Care Journey',
      subtitle: 'From fragmented healthcare to one seamless, tracked care pathway.',
      nextStepHeader: 'What should I do next?',
      completed: 'Completed',
      inProgress: 'Current Step',
      upcoming: 'Upcoming',
      delayed: 'Action Required'
    },
    careGaps: {
      title: 'Care-Gap Radar',
      subtitle: 'Proactive surveillance detecting missed appointments, delayed referrals, overdue diagnostics, and lost-to-follow-up patients.',
      detected: 'Detected Gaps',
      overdue: 'Overdue',
      acknowledge: 'Acknowledge',
      contact: 'Record Patient Contact',
      resolve: 'Mark Gap Resolved'
    },
    offline: {
      title: 'Smart Offline Care Pack',
      subtitle: 'Empowering rural ASHA and ANM health workers with offline-first synchronization.',
      downloadPack: 'Download Smart Care Pack',
      syncNow: 'Synchronize Changes Now',
      lastSynced: 'Last Synchronized',
      syncStatus: 'Sync Status',
      offlineActive: 'Operating in Offline Mode'
    },
    scenarios: {
      scenario1Title: 'Demo Scenario 1: Primary Rural Care Journey',
      scenario1Desc: 'Rural patient with acute symptoms → Triage → Health Worker confirmation → Facility routing → Referral accepted → Appointment token → Care journey updated → Overdue follow-up detected on Care-Gap Radar.',
      scenario2Title: 'Demo Scenario 2: Specialist Capacity Routing',
      scenario2Desc: 'Patient needs Specialist Care: Nearest PHC (5km) has high wait & no specialist vs Sub-District Hospital (18km) with specialist + diagnostics ready → CareGrid selects the best facility.'
    }
  },
  hi: {
    appTitle: 'केयरग्रिड (CareGrid)',
    appSubtitle: 'सार्वजनिक स्वास्थ्य देखभाल समन्वय मंच',
    missionStatement: 'रोगी को उसकी वर्तमान स्वास्थ्य स्थिति से ट्राइएज, अस्पताल चयन, रेफरल, परीक्षण, उपचार और फॉलो-अप तक जोड़ना।',
    nav: {
      triage: 'डिजिटल ट्राइएज',
      routing: 'अस्पताल रूटिंग',
      referrals: 'रेफरल हैंडशेक',
      journey: 'देखभाल यात्रा',
      careGaps: 'केयर-गैप रडार',
      dashboard: 'डैशबोर्ड',
      offline: 'ऑफलाइन पैक',
      records: 'स्वास्थ्य रिकॉर्ड',
      medicines: 'दवा उपलब्धता',
      audit: 'ऑडिट लॉग'
    },
    roles: {
      PATIENT: 'मरीज़ (Patient)',
      HEALTH_WORKER: 'स्वास्थ्य कार्यकर्ता (आशा/एएनएम)',
      DOCTOR: 'चिकित्सा विशेषज्ञ (Doctor)',
      FACILITY_ADMIN: 'अस्पताल प्रबंधक',
      SYSTEM_ADMIN: 'जिला स्वास्थ्य अधिकारी (DHO)'
    },
    triage: {
      title: 'एआई-सहायता प्राप्त डिजिटल ट्राइएज',
      disclaimer: 'एआई-सहायता प्राप्त ट्राइएज। अंतिम नैदानिक निर्णय अधिकृत स्वास्थ्य पेशेवर द्वारा पुष्टि होना आवश्यक है।',
      symptomsLabel: 'मरीज़ के लक्षण एवं मुख्य शिकायत',
      symptomsPlaceholder: 'लक्षण बताएं (जैसे छाती में जकड़न, सांस फूलना, 3 दिन से तेज बुखार)...',
      speakButton: 'बोलकर लक्षण दर्ज करें',
      listening: 'सुन रहे हैं... (हिंदी, मराठी या अंग्रेजी में बोलें)',
      durationLabel: 'लक्षणों की अवधि',
      vitalsSection: 'महत्वपूर्ण लक्षण / वाइटल्स (वैकल्पिक)',
      bp: 'रक्तचाप (सिस्टोलिक/डायस्टोलिक)',
      heartRate: 'हृदय गति (bpm)',
      spo2: 'ऑक्सीजन स्तर SpO2 (%)',
      temp: 'तापमान (°F)',
      evaluateButton: 'ट्राइएज जांचें',
      redEmergency: 'लाल - आपातकालीन (RED Emergency)',
      orangePriority: 'नारंगी - प्राथमिकता (ORANGE Priority)',
      greenRoutine: 'हरा - सामान्य (GREEN Routine)',
      reasonsTitle: 'वर्गीकरण के नैदानिक कारण',
      warningSignsTitle: 'चेतावनी संकेत एवं खतरे के लक्षण',
      nextActionTitle: 'अनुशंसित अगला नैदानिक कदम',
      confirmButton: 'स्वास्थ्य कार्यकर्ता के रूप में पुष्टि करें',
      routeButton: 'उपयुक्त अस्पताल खोजें'
    },
    routing: {
      title: 'बुद्धिमान एवं क्षमता-जागरूक अस्पताल चयन',
      subtitle: 'दूरी, आपातकालीन सुविधा, विशेषज्ञ उपलब्धता, बिस्तर क्षमता और परीक्षणों के आधार पर पारदर्शी चयन।',
      nearestWarning: 'ध्यान दें: निकटतम अस्पताल में विशेषज्ञ या बिस्तर उपलब्ध न होने पर केयरग्रिड उचित बड़े अस्पताल को प्राथमिकता देता है।',
      scoreLabel: 'केयरग्रिड मैच स्कोर',
      distance: 'दूरी',
      travelTime: 'अनुमानित यात्रा समय',
      reasonsWhy: 'यह अस्पताल क्यों अनुशंसित है:',
      specialists: 'उपलब्ध विशेषज्ञ',
      bedsAvailable: 'उपलब्ध बिस्तर',
      queueLength: 'वर्तमान कतार',
      createReferral: 'रेफरल हैंडशेक शुरू करें'
    },
    referral: {
      title: 'रेफरल हैंडशेक जीवनचक्र',
      subtitle: 'ग्रामीण स्वास्थ्य कार्यकर्ता से अस्पताल विशेषज्ञ तक पूर्ण समन्वय।',
      inbox: 'आगमन रेफरल इनबॉक्स',
      outbound: 'भेजे गए रेफरल ट्रैकर',
      code: 'रेफरल कोड',
      patient: 'मरीज़',
      from: 'भेजने वाला कार्यकर्ता',
      target: 'लक्षित अस्पताल',
      status: 'वर्तमान स्थिति',
      accept: 'मरीज़ स्वीकार करें',
      reject: 'अस्वीकार / अन्य विकल्प',
      markArrived: 'मरीज़ उपस्थित दर्ज करें',
      completeConsult: 'परामर्श पूर्ण',
      tokenIssued: 'ओपीडी टोकन जारी'
    },
    journey: {
      title: 'सतत रोगी देखभाल यात्रा',
      subtitle: 'बिखरी हुई स्वास्थ्य सेवाओं से एक निरंतर देखभाल मार्ग तक।',
      nextStepHeader: 'मुझे आगे क्या करना चाहिए?',
      completed: 'पूर्ण',
      inProgress: 'वर्तमान कदम',
      upcoming: 'आगामी',
      delayed: 'कार्रवाई आवश्यक'
    },
    careGaps: {
      title: 'केयर-गैप रडार (Care-Gap Radar)',
      subtitle: 'छूटे हुए अपॉइंटमेंट, विलंबित रेफरल और छूटे हुए फॉलो-अप की निगरानी।',
      detected: 'पहचाने गए अंतराल',
      overdue: 'अतिदेय (Overdue)',
      acknowledge: 'स्वीकार करें',
      contact: 'संपर्क दर्ज करें',
      resolve: 'समस्या का समाधान दर्ज करें'
    },
    offline: {
      title: 'स्मार्ट ऑफलाइन केयर पैक',
      subtitle: 'ग्रामीण आशा/एएनएम कार्यकर्ताओं के लिए बिना इंटरनेट काम करने की सुविधा।',
      downloadPack: 'केयर पैक डाउनलोड करें',
      syncNow: 'अभी सिंक करें',
      lastSynced: 'अंतिम सिंक समय',
      syncStatus: 'सिंक स्थिति',
      offlineActive: 'ऑफलाइन मोड सक्रिय'
    },
    scenarios: {
      scenario1Title: 'डेमो परिदृश्य 1: प्राथमिक ग्रामीण देखभाल यात्रा',
      scenario1Desc: 'ग्रामीण मरीज़ के गंभीर लक्षण → ट्राइएज → आशा कार्यकर्ता की पुष्टि → अस्पताल रूटिंग → रेफरल स्वीकृति → टोकन → देखभाल यात्रा → केयर-गैप रडार अलर्ट।',
      scenario2Title: 'डेमो परिदृश्य 2: विशेषज्ञ क्षमता रूटिंग',
      scenario2Desc: 'मरीज़ को हृदय रोग विशेषज्ञ चाहिए: निकटतम पीएचसी (5 किमी) में डॉक्टर नहीं बनाम जिला अस्पताल (18 किमी) विशेषज्ञ व परीक्षण तैयार → केयरग्रिड सही चयन करता है।'
    }
  },
  mr: {
    appTitle: 'केअरग्रिड (CareGrid)',
    appSubtitle: 'सार्वजनिक आरोग्य सेवा समन्वय प्रणाली',
    missionStatement: 'रुग्णाला त्यांच्या सध्याच्या आरोग्यावस्थेपासून ट्रायज, रुग्णालय निवड, संदर्भ, तपासणी, उपचार आणि पाठपुराव्यापर्यंत योग्य टप्प्याशी जोडणे.',
    nav: {
      triage: 'डिजिटल ट्रायज',
      routing: 'रुग्णालय निवड',
      referrals: 'रेफरल हँडशेक',
      journey: 'आरोग्य प्रवास',
      careGaps: 'केअर-गॅप रडार',
      dashboard: 'डॅशबोर्ड',
      offline: 'ऑफलाईन पॅक',
      records: 'आरोग्य नोंदी',
      medicines: 'औषध साठा',
      audit: 'ऑडिट लॉग'
    },
    roles: {
      PATIENT: 'रुग्ण (Patient)',
      HEALTH_WORKER: 'आरोग्य सेविका (आशा/एएनएम)',
      DOCTOR: 'वैद्यकीय तज्ज्ञ (Doctor)',
      FACILITY_ADMIN: 'रुग्णालय प्रशासक',
      SYSTEM_ADMIN: 'जिल्हा आरोग्य अधिकारी (DHO)'
    },
    triage: {
      title: 'एआय-सहाय्यित डिजिटल ट्रायज',
      disclaimer: 'एआय-सहाय्यित ट्रायज. अंतिम वैद्यकीय निर्णय अधिकृत आरोग्य व्यावसायिकाने निश्चित करणे आवश्यक आहे.',
      symptomsLabel: 'रुग्णाची लक्षणे व मुख्य तक्रार',
      symptomsPlaceholder: 'लक्षणे नोंदवा (उदा. छातीत दुखणे, दम लागणे, गार घाम, चक्कर)...',
      speakButton: 'बोलून लक्षणे सांगा',
      listening: 'ऐकत आहोत... (मराठी, हिंदी किंवा इंग्रजीत बोला)',
      durationLabel: 'लक्षणांचा कालावधी',
      vitalsSection: 'महत्त्वाची लक्षणे / व्हायटल्स (ऐच्छिक)',
      bp: 'रक्तदाब (सिस्टोलिक/डायस्टोलिक)',
      heartRate: 'हृदयाचे ठोके (bpm)',
      spo2: 'ऑक्सिजन पातळी SpO2 (%)',
      temp: 'तापमान (°F)',
      evaluateButton: 'ट्रायज तपासा',
      redEmergency: 'लाल - तात्काळ आणीबाणी (RED Emergency)',
      orangePriority: 'केशरी - प्राधान्य (ORANGE Priority)',
      greenRoutine: 'हिरवा - नेहमीचे (GREEN Routine)',
      reasonsTitle: 'वर्गीकरणाची वैद्यकीय कारणे',
      warningSignsTitle: 'धोक्याचे इशारे व सूचना',
      nextActionTitle: 'पुढील शिफारस केलेले वैद्यकीय पाऊल',
      confirmButton: 'आरोग्य सेविका म्हणून खात्री करा',
      routeButton: 'योग्य रुग्णालय निवडा'
    },
    routing: {
      title: 'कार्यक्षम व क्षमता-आधारित रुग्णालय निवड',
      subtitle: 'अंतर, आणीबाणी क्षमता, तज्ज्ञ उपलब्धता, खाटांची क्षमता आणि चाचण्या विचारात घेऊन पारदर्शक निवड.',
      nearestWarning: 'सूचना: जवळच्या दवाखान्यात तज्ज्ञ किंवा खाटा नसल्यास केअरग्रिड योग्य सुसज्ज रुग्णालयाची शिफारस करते.',
      scoreLabel: 'केअरग्रिड जुळवणी गुण',
      distance: 'अंतर',
      travelTime: 'अंदाजे प्रवासाची वेळ',
      reasonsWhy: 'हे रुग्णालय का शिफारस केले आहे:',
      specialists: 'उपलब्ध तज्ज्ञ डॉक्टर',
      bedsAvailable: 'उपलब्ध खाटा',
      queueLength: 'सध्याची रांग',
      createReferral: 'रेफरल हँडशेक सुरू करा'
    },
    referral: {
      title: 'रेफरल हँडशेक जीवनचक्र',
      subtitle: 'आशा सेविकेपासून ते जिल्हा रुग्णालयातील तज्ज्ञापर्यंत अखंड संदर्भ समन्वय.',
      inbox: 'येणारे रेफरल इनबॉक्स',
      outbound: 'पाठवलेले रेफरल ट्रॅकर',
      code: 'रेफरल क्रमांक',
      patient: 'रुग्ण',
      from: 'संदर्भ देणारी सेविका',
      target: 'लक्षित रुग्णालय',
      status: 'सद्यस्थिती',
      accept: 'रुग्ण स्वीकारा',
      reject: 'नाकारा / दुसरा पर्याय',
      markArrived: 'रुग्ण दाखल झाला',
      completeConsult: 'तपासणी पूर्ण',
      tokenIssued: 'ओपीडी टोकन तयार'
    },
    journey: {
      title: 'अखंड रुग्ण काळजी प्रवास (Care Journey)',
      subtitle: 'तुकड्या-तुकड्यात विभागलेल्या सेवेकडून एका सलग उपचार मार्गाकडे.',
      nextStepHeader: 'मी पुढे काय करावे?',
      completed: 'पूर्ण',
      inProgress: 'सध्याचा टप्पा',
      upcoming: 'पुढील टप्पा',
      delayed: 'कार्रवाई आवश्यक'
    },
    careGaps: {
      title: 'केअर-गॅप रडार (Care-Gap Radar)',
      subtitle: 'चुकलेली तपासणी, प्रलंबित रेफरल आणि पाठपुराव्याकडे दुर्लक्ष झालेल्या रुग्णांची स्वयंचलित सूचना प्रणाली.',
      detected: 'नोंदवलेले खंड',
      overdue: 'मुदत संपलेले (Overdue)',
      acknowledge: 'दखल घ्या',
      contact: 'रुग्णाशी संपर्क नोंदवा',
      resolve: 'समस्या निवारण नोंदवा'
    },
    offline: {
      title: 'स्मार्ट ऑफलाइन केअर पॅक',
      subtitle: 'ग्रामीण भागातील आशा व एएनएम सेविकांसाठी इंटरनेट नसतानाही काम करण्याची सोय.',
      downloadPack: 'केअर पॅक डाऊनलोड करा',
      syncNow: 'माहिती आता सिंक करा',
      lastSynced: 'शेवटचे सिंक',
      syncStatus: 'सिंक स्थिती',
      offlineActive: 'ऑफलाइन मोड सक्रिय'
    },
    scenarios: {
      scenario1Title: 'डेमो प्रसंग १: प्राथमिक ग्रामीण रुग्ण सेवा प्रवास',
      scenario1Desc: 'ग्रामीण रुग्णाला छातीत दुखणे → ट्रायज → आशा सेविकेची खात्री → रुग्णालय निवड → रेफरल स्वीकार → टोकन → आरोग्य प्रवास → पाठपुरावा चुकल्यास रडार अलर्ट.',
      scenario2Title: 'डेमो प्रसंग २: तज्ज्ञ डॉक्टर व क्षमता निवड',
      scenario2Desc: 'रुग्णाला हृदयविकार तज्ज्ञांची गरज: जवळच्या प्राथमिक केंद्रात तज्ज्ञ नाहीत vs जिल्हा रुग्णालयात तज्ज्ञ व चाचण्या उपलब्ध → केअरग्रिड अचूक निवड करते.'
    }
  },
  ta: {
    appTitle: 'கேர்கிரிட் (CareGrid)',
    appSubtitle: 'பொது சுகாதார கவனிப்பு ஒருங்கிணைப்பு தளம்',
    missionStatement: 'பரிசோதனை, மருத்துவமனை தேர்வு, பரிந்துரை ஹேண்ட்ஷேக், பரிசோதனைகள், சிகிச்சை மற்றும் தொடர் கவனிப்பு வரை நோயாளிகளை அடுத்த சரியான படிக்கு வழிநடத்துகிறது.',
    nav: {
      triage: 'டிஜிட்டல் ட்ரையேஜ்',
      routing: 'மருத்துவமனை தேர்வு',
      referrals: 'பரிந்துரை கண்காணிப்பு',
      journey: 'பராமரிப்புப் பாதை',
      careGaps: 'இடைவெளி ரேடார்',
      dashboard: 'முகப்பு பலகை',
      offline: 'ஆஃப்லைன் பேக்',
      records: 'சுகாதார ஆவணம்',
      medicines: 'மருந்து இருப்பு',
      audit: 'தணிக்கை பதிவு'
    },
    roles: {
      PATIENT: 'நோயாளி',
      HEALTH_WORKER: 'கிராம சுகாதார செவிலியர் / ஆஷா',
      DOCTOR: 'மருத்துவ நிபுணர்',
      FACILITY_ADMIN: 'மருத்துவமனை நிர்வாகி',
      SYSTEM_ADMIN: 'மாவட்ட சுகாதார அலுவலர் (DDHS)'
    },
    triage: {
      title: 'AI-உதவி டிஜிட்டல் ட்ரையேஜ்',
      disclaimer: 'AI-உதவி ட்ரையேஜ் மதிப்பீடு. இறுதி மருத்துவ முடிவை அங்கீகரிக்கப்பட்ட சுகாதார நிபுணர் உறுதிப்படுத்த வேண்டும்.',
      symptomsLabel: 'நோயாளியின் அறிகுறிகள் மற்றும் முதன்மை புகார்',
      vitalsLabel: 'உயிர் அறிகுறிகள் (Vitals)',
      evaluateButton: 'ட்ரையேஜ் நிலை மதிப்பீடு செய்க',
      evaluating: 'மருத்துவ வழிகாட்டுதல்கள் ஆய்வு செய்யப்படுகின்றன...',
      urgencyLevels: {
        RED: 'சிவப்பு (உடனடி அவசரம்)',
        ORANGE: 'ஆரஞ்சு (அவசர முன்னுரிமை)',
        GREEN: 'பச்சை (வழக்கமான பராமரிப்பு)'
      },
      confirmWorkerTitle: 'கிராம சுகாதார செவிலியர் / ஆஷா உறுதிப்படுத்தல்',
      confirmWorkerSubtitle: 'மனித மேற்பார்வை கட்டாயம்: மருத்துவர் பரிந்துரைக்கு முன் ட்ரையேஜ் நிலையை அங்கீகரிக்கவும்.',
      confirmButton: 'மருத்துவ ரீதியாக உறுதிப்படுத்தி தொடரவும்',
      confirmedBadge: 'ஆஷா பணியாளரால் அங்கீகரிக்கப்பட்டது',
      proceedToRouting: 'அடுத்த கட்டம்: மருத்துவமனை பரிந்துரை தேர்வு →'
    },
    routing: {
      title: 'புத்திசாலி மருத்துவமனை தேர்வு & ரூட்டிங்',
      subtitle: 'தொலைவு, படுக்கை இருப்பு, நிபுணர் இருப்பு, பரிசோதனை வசதிகள் ஆகியவற்றைக் கணக்கிட்டு பரிந்துரைக்கிறது.',
      sortBy: 'வரிசைப்படுத்து',
      urgencyFilter: 'அவசர நிலை வடிகட்டி',
      specialtyFilter: 'தேவைப்படும் மருத்துவப் பிரிவு',
      recommendedScore: 'பொருத்தம் மதிப்பெண்',
      bedsAvailable: 'படுக்கைகள் கிடைக்கும் நிலை',
      specialistOnDuty: 'பணியில் உள்ள நிபுணர்',
      distance: 'தொலைவு',
      travelTime: 'பயண நேரம்',
      initiateReferral: 'பரிந்துரை ஹேண்ட்ஷேக் தொடங்குக'
    },
    referral: {
      title: 'பரிந்துரை ஹேண்ட்ஷேக் & கண்காணிப்பு',
      subtitle: 'கிராமப்புற கிளினிக்கிலிருந்து மாவட்ட மருத்துவமனைக்கு வெளிப்படையான பரிந்துரை.',
      incomingTab: 'உள்வரும் பரிந்துரைகள் (மருத்துவமனை பார்வை)',
      outboundTab: 'வெளியேறும் பரிந்துரைகள் (ஆஷா பணியாளர் பார்வை)',
      acceptReferral: 'பரிந்துரையை ஏற்கவும் & படுக்கை ஒதுக்கவும்',
      rejectReferral: 'நிராகரித்து மாற்று மருத்துவமனைக்கு அனுப்புக',
      assignToken: 'முன்னுரிமை டோக்கன் வழங்குக',
      patientArrived: 'நோயாளி வருகையைப் பதிவு செய்க',
      completeConsultation: 'ஆலோசனையை முடித்து 7 நாள் பின்தொடர்தல் அமைக்குக'
    },
    journey: {
      title: 'தொடர்ச்சியான நோயாளி பராமரிப்புப் பாதை',
      subtitle: 'அறிகுறி பரிசோதனை முதல் மருத்துவமனை சிகிச்சை மற்றும் வீடு திரும்புதல் வரை முழுமையான பாதை.',
      nextStepHeader: 'நான் அடுத்து என்ன செய்ய வேண்டும்?',
      completed: 'முடிந்தது',
      inProgress: 'தற்போதைய நிலை',
      upcoming: 'அடுத்த நிலை',
      delayed: 'நடவடிக்கை தேவை'
    },
    careGaps: {
      title: 'பராமரிப்பு இடைவெளி ரேடார் (Care-Gap Radar)',
      subtitle: 'தவறவிட்ட சந்திப்புகள், தாமதமான பரிந்துரைகள் மற்றும் பின்தொடர்தல் புறக்கணிக்கப்பட்ட நோயாளிகளுக்கான கண்காணிப்பு.',
      detected: 'கண்டறியப்பட்ட இடைவெளிகள்',
      overdue: 'காலக்கெடு முடிந்தது (Overdue)',
      acknowledge: 'ஏற்றுக்கொள்',
      contact: 'நோயாளியைத் தொடர்பு கொள்க',
      resolve: 'தீர்வு பெற்றதாகப் பதிவு செய்க'
    },
    offline: {
      title: 'ஸ்மார்ட் ஆஃப்லைன் கேர் பேக்',
      subtitle: 'இணைய வசதி இல்லாத கிராமப்புற பகுதிகளில் ஆஷா மற்றும் செவிலியர்கள் தடையின்றி பணியாற்ற உதவுகிறது.',
      downloadPack: 'கேர் பேக் பதிவிறக்குக',
      syncNow: 'இப்போதே தகவலை ஒத்திசைக்குக',
      lastSynced: 'கடைசி ஒத்திசைவு',
      syncStatus: 'ஒத்திசைவு நிலை',
      offlineActive: 'ஆஃப்லைன் பயன்முறை செயலில் உள்ளது'
    },
    scenarios: {
      scenario1Title: 'டெமோ காட்சி 1: ஆரம்ப கிராமப்புற நோயாளி பாதை',
      scenario1Desc: 'கிராமத்து நோயாளி நெஞ்சுவலி → ட்ரையேஜ் சிவப்பு → வி.எச்.என் உறுதிப்படுத்தல் → மாவட்ட அரசு மருத்துவமனை தேர்வு → பரிந்துரை ஏற்பு → டோக்கன் → முழுமையான சிகிச்சை பாதை.',
      scenario2Title: 'டெமோ காட்சி 2: நிபுணர் & திறன் அடிப்படையிலான ரூட்டிங்',
      scenario2Desc: 'இதயவியல் நிபுணர் தேவை: அருகிலுள்ள ஆரம்ப சுகாதார நிலையத்தில் நிபுணர் இல்லை vs மாவட்ட தலைமை மருத்துவமனையில் ECG மற்றும் நிபுணர் தயார் → துல்லிய தேர்வு.'
    }
  }
};
