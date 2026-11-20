/** Copy for the home page, site navigation, study tips and the Bank PO / Clerk switch. */
const t = (en, bn, hi) => ({ en, bn, hi });

export const FOOTER = Object.freeze({
  tagline: t('Free preparation for SSC, Banking, WBPSC & WB Post Office, plus Learn Basics: Math and English from zero, in English and বাংলা.', 'SSC, ব্যাঙ্কিং, WBPSC ও WB পোস্ট অফিসের বিনামূল্যে প্রস্তুতি, সঙ্গে বেসিক শেখো: একদম গোড়া থেকে গণিত ও ইংরেজি — বাংলা ও English-এ।', 'Free exam preparation, plus Learn Basics in English and বাংলা.'),
  rights: t('All rights reserved.', 'সর্বস্বত্ব সংরক্ষিত।', 'सर्वाधिकार सुरक्षित।'),
});

export const COOKIE = Object.freeze({
  title: t('Your privacy, your choice', 'আপনার গোপনীয়তা, আপনার পছন্দ', 'आपकी गोपनीयता, आपकी पसंद'),
  body: t(
    'We use a login cookie to run the site and, with your permission, save your language, streak and progress on this device. No ads, no tracking, no selling of data.',
    'সাইট চালাতে আমরা একটি লগইন কুকি ব্যবহার করি, আর আপনার অনুমতি পেলে এই ডিভাইসে ভাষা, স্ট্রিক ও অগ্রগতি সংরক্ষণ করি। কোনো বিজ্ঞাপন নেই, ট্র্যাকিং নেই, তথ্য বিক্রিও নেই।',
    'साइट चलाने के लिए हम लॉगिन कुकी का उपयोग करते हैं और आपकी अनुमति से इस डिवाइस पर भाषा, स्ट्रीक व प्रगति सहेजते हैं। कोई विज्ञापन, ट्रैकिंग या डेटा बिक्री नहीं।',
  ),
  learn: t('Read our privacy policy', 'গোপনীয়তা নীতি পড়ুন', 'गोपनीयता नीति पढ़ें'),
  accept: t('Accept all', 'সব গ্রহণ করুন', 'सभी स्वीकार करें'),
  reject: t('Essential only', 'শুধু জরুরি', 'केवल आवश्यक'),
  customize: t('Customize', 'কাস্টমাইজ', 'अनुकूलित करें'),
  save: t('Save my choices', 'আমার পছন্দ সংরক্ষণ করুন', 'मेरी पसंद सहेजें'),
  settings: t('Cookie settings', 'কুকি সেটিংস', 'कुकी सेटिंग'),
  essential: {
    title: t('Essential (always on)', 'জরুরি (সবসময় চালু)', 'आवश्यक (हमेशा चालू)'),
    body: t('Keeps you signed in and protects your mock test in progress.', 'আপনাকে লগইন রাখে এবং চলমান মক টেস্ট সুরক্ষিত রাখে।', 'आपको साइन इन रखती है और चल रहे मॉक टेस्ट को सुरक्षित रखती है।'),
  },
  prefs: {
    title: t('Preferences', 'পছন্দসমূহ', 'पसंद'),
    body: t('Remembers your language, study streak, progress and last topic on this device.', 'এই ডিভাইসে আপনার ভাষা, স্টাডি স্ট্রিক, অগ্রগতি ও শেষ টপিক মনে রাখে।', 'इस डिवाइस पर आपकी भाषा, स्ट्रीक, प्रगति और आखिरी टॉपिक याद रखती है।'),
  },
});

export const NAV = Object.freeze({
  home: t('Home', 'হোম', 'होम'),
  learn: t('Learn Basics', 'বেসিক শেখো', 'Learn Basics'),
  vocabulary: t('Vocabulary Mastery', 'শব্দভান্ডার অনুশীলন', 'Vocabulary Mastery'),
  exams: t('Exams', 'পরীক্ষা', 'परीक्षाएँ'),
  how: t('How it works', 'কীভাবে কাজ করে', 'कैसे काम करता है'),
  tips: t('Study tips', 'পড়ার টিপস', 'अध्ययन टिप्स'),
  progress: t('My progress', 'আমার অগ্রগতি', 'मेरी प्रगति'),
  signup: t('Sign up', 'রেজিস্টার', 'साइन अप'),
  pyq: t('Previous years', 'পূর্ববর্তী বছরের প্রশ্ন', 'पिछले वर्ष'),
  privacy: t('Privacy policy', 'গোপনীয়তা নীতি', 'गोपनीयता नीति'),
  admin: t('Admin', 'অ্যাডমিন', 'एडमिन'),
  menu: t('Menu', 'মেনু', 'मेनू'),
  openMenu: t('Open menu', 'মেনু খুলুন', 'मेनू खोलें'),
  closeMenu: t('Close menu', 'মেনু বন্ধ করুন', 'मेनू बंद करें'),
  language: t('Language', 'ভাষা', 'भाषा'),
});

export const PRIVACY = Object.freeze({
  linkLabel: t('Privacy policy', 'গোপনীয়তা নীতি', 'गोपनीयता नीति'),
  consent: t('By creating an account you agree to our', 'অ্যাকাউন্ট খুলে আপনি আমাদের', 'अकाउंट बनाकर आप हमारी'),
  title: t('Privacy policy', 'গোপনীয়তা নীতি', 'गोपनीयता नीति'),
  updated: t('Last updated: 2025', 'সর্বশেষ হালনাগাদ: ২০২৫', 'अंतिम अपडेट: 2025'),
  intro: t(
    'We collect only what is needed to run your practice and track your progress. This page explains what, why, and your choices.',
    'আপনার অনুশীলন চালাতে ও অগ্রগতি দেখাতে যতটুকু দরকার, আমরা শুধু ততটুকুই সংগ্রহ করি। কী, কেন এবং আপনার পছন্দ — সবই এখানে।',
    'हम केवल वही जानकारी लेते हैं जो आपके अभ्यास और प्रगति के लिए ज़रूरी है। क्या, क्यों और आपके विकल्प — सब यहाँ है।',
  ),
  note: t(
    'Template notice: have this text reviewed by a legal professional before relying on it.',
    'বিজ্ঞপ্তি: এটি একটি খসড়া; ব্যবহারের আগে আইনজীবীকে দিয়ে দেখিয়ে নিন।',
    'सूचना: यह एक ड्राफ़्ट है; उपयोग से पहले किसी वकील से जँचवाएँ।',
  ),
  sections: [
    {
      id: 'collect',
      title: t('What we collect', 'আমরা কী সংগ্রহ করি', 'हम क्या एकत्र करते हैं'),
      body: t(
        'Account details you give us: name, email, password (stored only as a salted hash) and, optionally, your mobile number. While you study: your answers, time taken, bookmarks, mock-test results and any error reports you send.',
        'আপনার দেওয়া তথ্য: নাম, ইমেইল, পাসওয়ার্ড (শুধু হ্যাশ করা অবস্থায়) ও ঐচ্ছিক মোবাইল নম্বর। পড়ার সময়: আপনার উত্তর, সময়, বুকমার্ক, মক টেস্টের ফলাফল ও পাঠানো ত্রুটির রিপোর্ট।',
        'आपकी दी हुई जानकारी: नाम, ईमेल, पासवर्ड (केवल हैश के रूप में) और वैकल्पिक मोबाइल नंबर। पढ़ाई के दौरान: आपके उत्तर, समय, बुकमार्क, मॉक टेस्ट के नतीजे और भेजी गई त्रुटि रिपोर्ट।',
      ),
    },
    {
      id: 'use',
      title: t('How we use it', 'কীভাবে ব্যবহার করি', 'हम इसका उपयोग कैसे करते हैं'),
      body: t(
        'To sign you in, save your progress and streaks, show weak topics and improve question quality. We do not sell your data and we do not show third-party ads.',
        'লগইন করাতে, অগ্রগতি ও স্ট্রিক সংরক্ষণ করতে, দুর্বল টপিক দেখাতে এবং প্রশ্নের মান উন্নত করতে। আমরা আপনার তথ্য বিক্রি করি না, তৃতীয় পক্ষের বিজ্ঞাপনও দেখাই না।',
        'साइन इन कराने, प्रगति और स्ट्रीक सहेजने, कमज़ोर टॉपिक दिखाने और प्रश्नों की गुणवत्ता सुधारने के लिए। हम आपका डेटा बेचते नहीं और तृतीय-पक्ष विज्ञापन नहीं दिखाते।',
      ),
    },
    {
      id: 'cookies',
      title: t('Cookies and on-device storage', 'কুকি ও ডিভাইসে সংরক্ষণ', 'कुकीज़ और डिवाइस स्टोरेज'),
      body: t(
        'One secure, HTTP-only session cookie keeps you signed in. Your browser also stores small preferences (language, streak, last visited topic, dismissed pop-ups). You can clear these any time from browser settings.',
        'একটি নিরাপদ HTTP-only সেশন কুকি আপনাকে লগইন রাখে। ব্রাউজারে ছোট পছন্দও জমা থাকে (ভাষা, স্ট্রিক, শেষ দেখা টপিক, বন্ধ করা পপ-আপ)। ব্রাউজার সেটিংস থেকে যেকোনো সময় মুছতে পারেন।',
        'एक सुरक्षित HTTP-only सेशन कुकी आपको साइन इन रखती है। ब्राउज़र में छोटी पसंद भी सहेजी जाती है (भाषा, स्ट्रीक, आखिरी टॉपिक, बंद किए पॉप-अप)। इन्हें ब्राउज़र सेटिंग से कभी भी हटा सकते हैं।',
      ),
    },
    {
      id: 'sharing',
      title: t('Sharing', 'তথ্য ভাগাভাগি', 'साझा करना'),
      body: t(
        'We share data only with hosting and database providers that run the service for us, or when the law requires it. Your practice history is never public.',
        'যাঁরা আমাদের হয়ে সার্ভার ও ডাটাবেস চালান শুধু তাঁদের সঙ্গে, অথবা আইনি বাধ্যবাধকতায়। আপনার অনুশীলনের ইতিহাস কখনও প্রকাশ্য নয়।',
        'हम डेटा केवल होस्टिंग/डेटाबेस प्रदाताओं के साथ या कानूनी ज़रूरत पर साझा करते हैं। आपका अभ्यास इतिहास कभी सार्वजनिक नहीं होता।',
      ),
    },
    {
      id: 'rights',
      title: t('Your choices', 'আপনার অধিকার', 'आपके अधिकार'),
      body: t(
        'You can browse and practise without an account. You may ask us to correct or delete your account and its data at any time using the contact below.',
        'অ্যাকাউন্ট ছাড়াও পড়া ও অনুশীলন করা যায়। নিচের যোগাযোগ ঠিকানায় জানালে আপনার অ্যাকাউন্ট ও তথ্য সংশোধন বা মুছে ফেলা হবে।',
        'बिना अकाउंट भी आप पढ़ और अभ्यास कर सकते हैं। नीचे दिए संपर्क पर बताकर आप अकाउंट और डेटा सुधरवा या हटवा सकते हैं।',
      ),
    },
    {
      id: 'children',
      title: t('Children', 'শিশুদের তথ্য', 'बच्चे'),
      body: t(
        'The service is meant for exam aspirants aged 13 and over.',
        'এই পরিষেবা ১৩ বছর বা তার বেশি বয়সী পরীক্ষার্থীদের জন্য।',
        'यह सेवा 13 वर्ष या उससे अधिक उम्र के परीक्षार्थियों के लिए है।',
      ),
    },
    {
      id: 'contact',
      title: t('Contact', 'যোগাযোগ', 'संपर्क'),
      body: t('Write to privacy@examprep.example for any privacy request.', 'গোপনীয়তা সংক্রান্ত যেকোনো অনুরোধে লিখুন: privacy@examprep.example', 'गोपनीयता संबंधी किसी भी अनुरोध के लिए लिखें: privacy@examprep.example'),
    },
  ],
});

export const HOME = Object.freeze({
  badge: t('Free · English · বাংলা', 'বিনামূল্যে · English · বাংলা', 'Free · English · বাংলা'),
  title: t('Crack SSC, Banking, WBPSC & WB Post Office exams', 'SSC, ব্যাঙ্কিং, WBPSC ও WB পোস্ট অফিস পরীক্ষায় সফল হন', 'SSC, बैंकिंग, WBPSC और WB पोस्ट ऑफिस परीक्षाएँ पास करें'),
  titleAccent: t('in your own language', 'নিজের ভাষায়', 'अपनी भाषा में'),
  subtitle: t(
    'Revise the key formulas, practise topic-wise questions with instant answers, then test yourself in a timed mock — and see exactly where to improve.',
    'প্রয়োজনীয় সূত্র ঝালিয়ে নিন, বিষয়ভিত্তিক প্রশ্ন অনুশীলন করে সঙ্গে সঙ্গে উত্তর দেখুন, তারপর সময়-বাঁধা মক টেস্ট দিন — আর জানুন কোথায় উন্নতি দরকার।',
    'मुख्य सूत्र दोहराएँ, विषयवार प्रश्न हल करके तुरंत उत्तर देखें, फिर समयबद्ध मॉक टेस्ट दें — और जानें कहाँ सुधार चाहिए।',
  ),
  ctaStart: t('Start practising', 'অনুশীলন শুরু করুন', 'अभ्यास शुरू करें'),
  ctaRegister: t('Create free account', 'বিনামূল্যে অ্যাকাউন্ট খুলুন', 'मुफ़्त खाता बनाएँ'),
  howTitle: t('How it works', 'কীভাবে কাজ করে', 'यह कैसे काम करता है'),
  howSub: t('Four simple steps from first revision to exam-ready.', 'প্রথম রিভিশন থেকে পরীক্ষার প্রস্তুতি — চারটি সহজ ধাপে।', 'पहली रिवीज़न से परीक्षा की तैयारी तक — चार आसान चरण।'),
  featuresTitle: t('Everything you need to prepare', 'প্রস্তুতির জন্য যা যা দরকার', 'तैयारी के लिए सब कुछ'),
  examsTitle: t('Pick your exam', 'আপনার পরীক্ষা বেছে নিন', 'अपनी परीक्षा चुनें'),
  examsSub: t('Four exam families, each with its own subjects and topics.', 'চারটি পরীক্ষা-গোষ্ঠী, প্রতিটির নিজস্ব বিষয় ও টপিক।', 'चार परीक्षा समूह, हर एक के अपने विषय और टॉपिक।'),
  viewAll: t('View all exams', 'সব পরীক্ষা দেখুন', 'सभी परीक्षाएँ देखें'),
  learnBadge: t('New · Learn Basics', 'নতুন · বেসিক শেখো', 'New · Learn Basics'),
  learnTitle: t('Weak in the basics? Start from zero.', 'বেসিক দুর্বল? একদম গোড়া থেকে শুরু করো।', 'Weak in the basics? Start from zero.'),
  learnBody: t(
    'Learn Basics teaches Math and English the way a good teacher would: simple words, everyday examples, one small step at a time. A 10-year-old can follow it, and it goes all the way up to exam level.',
    'বেসিক শেখো-তে গণিত ও ইংরেজি শেখানো হয় একজন ভালো শিক্ষকের মতো: সহজ কথায়, রোজকার উদাহরণে, ছোট ছোট ধাপে। ১০ বছরের ছাত্রছাত্রীও বুঝতে পারবে, আর শেষে পৌঁছে যাবে পরীক্ষার স্তরে।',
    'Learn Basics teaches Math and English from zero.',
  ),
  learnPoints: [
    { icon: '📖', text: t('Every chapter: Basic → Intermediate → Advanced', 'প্রতিটি অধ্যায়: সহজ → মাঝারি → কঠিন', 'Basic → Intermediate → Advanced') },
    { icon: '✏️', text: t('Worked examples you can open step by step', 'ধাপে ধাপে খুলে দেখার মতো সমাধান করা উদাহরণ', 'Worked examples, step by step') },
    { icon: '🎯', text: t('3 quiz levels; Advanced has a timer', '৩টি কুইজ স্তর; কঠিন স্তরে টাইমার', '3 quiz levels; Advanced is timed') },
    { icon: '🔁', text: t('New questions on every try, with explanations', 'প্রতিবার নতুন প্রশ্ন, সঙ্গে ব্যাখ্যা', 'New questions every try') },
  ],
  learnCta: t('Open Learn Basics', 'বেসিক শেখো খোলো', 'Open Learn Basics'),
  finalTitle: t('Your progress deserves to be tracked', 'আপনার অগ্রগতি ট্র্যাক হওয়া উচিত', 'आपकी प्रगति ट्रैक होनी चाहिए'),
  finalBody: t(
    'Sign up free and we will remember your accuracy, daily streak and weak topics on every device.',
    'বিনামূল্যে রেজিস্টার করুন — সব ডিভাইসে আপনার নির্ভুলতা, টানা দিন ও দুর্বল বিষয় আমরা মনে রাখব।',
    'मुफ़्त साइन अप करें — हम हर डिवाइस पर आपकी सटीकता, स्ट्रीक और कमज़ोर विषय याद रखेंगे।',
  ),
});

export const STEPS = [
  {
    icon: '🎯',
    title: t('1. Choose your exam', '১. পরীক্ষা বেছে নিন', '1. परीक्षा चुनें'),
    body: t(
      'Pick SSC, Banking (PO or Clerk), WBPSC or WB Post Office.',
      'SSC, ব্যাঙ্কিং (PO বা Clerk), WBPSC অথবা WB পোস্ট অফিস বেছে নিন।',
      'SSC, बैंकिंग (PO या Clerk), WBPSC या WB पोस्ट ऑफिस चुनें।',
    ),
  },
  {
    icon: '📘',
    title: t('2. Revise the concept', '২. ধারণা ঝালিয়ে নিন', '2. कॉन्सेप्ट दोहराएँ'),
    body: t(
      'Every topic opens with core formulas, shortcuts and common traps.',
      'প্রতিটি টপিকের শুরুতে মূল সূত্র, শর্টকাট ও সাধারণ ভুলের ফাঁদ।',
      'हर टॉपिक की शुरुआत मुख्य सूत्र, शॉर्टकट और आम गलतियों से होती है।',
    ),
  },
  {
    icon: '✍️',
    title: t('3. Practise with instant feedback', '৩. অনুশীলন করুন, সঙ্গে সঙ্গে ফল', '3. अभ्यास करें, तुरंत फ़ीडबैक'),
    body: t(
      'Solve questions one by one and see the answer with a step-by-step solution.',
      'একটি একটি করে প্রশ্ন সমাধান করুন, ধাপে ধাপে সমাধানসহ উত্তর দেখুন।',
      'एक-एक करके प्रश्न हल करें और चरणबद्ध समाधान के साथ उत्तर देखें।',
    ),
  },
  {
    icon: '⏱️',
    title: t('4. Take a mock & track growth', '৪. মক টেস্ট দিন ও উন্নতি দেখুন', '4. मॉक दें और प्रगति देखें'),
    body: t(
      'Timed tests with negative marking, then a report of weak topics to retry.',
      'নেগেটিভ মার্কিংসহ সময়-বাঁধা টেস্ট, তারপর দুর্বল টপিকের রিপোর্ট ও রিট্রাই।',
      'नेगेटिव मार्किंग वाले टाइम्ड टेस्ट, फिर कमज़ोर टॉपिक की रिपोर्ट।',
    ),
  },
];

export const FEATURES = [
  { icon: '🌐', title: t('English and বাংলা', 'বাংলা ও English', 'English and বাংলা'), body: t('Switch between English and বাংলা any time, on every page.', 'যেকোনো পাতায়, যেকোনো সময় বাংলা ও English বদলান।', 'Switch between English and বাংলা any time.') },
  { icon: '🧮', title: t('Formulas & shortcuts', 'সূত্র ও শর্টকাট', 'सूत्र और शॉर्टकट'), body: t('Clean revision notes before every practice set.', 'প্রতিটি অনুশীলনের আগে পরিষ্কার রিভিশন নোট।', 'हर अभ्यास से पहले साफ़ रिवीज़न नोट्स।') },
  { icon: '📝', title: t('Timed mock tests', 'সময়-বাঁধা মক টেস্ট', 'टाइम्ड मॉक टेस्ट'), body: t('Real CBT feel with a timer and negative marking.', 'টাইমার ও নেগেটিভ মার্কিংসহ আসল CBT অভিজ্ঞতা।', 'टाइमर और नेगेटिव मार्किंग के साथ असली CBT अनुभव।') },
  { icon: '📈', title: t('Progress tracking', 'অগ্রগতি ট্র্যাকিং', 'प्रगति ट्रैकिंग'), body: t('Accuracy, streaks and weak topics once you log in.', 'লগ ইন করলে নির্ভুলতা, টানা দিন ও দুর্বল বিষয়।', 'लॉग इन करने पर सटीकता, स्ट्रीक और कमज़ोर विषय।') },
  { icon: '🔁', title: t('Retry mistakes', 'ভুলগুলো আবার করুন', 'गलतियाँ दोबारा करें'), body: t('A quick 5-question retry built from your wrong answers.', 'আপনার ভুল উত্তর থেকে তৈরি ৫টি প্রশ্নের দ্রুত রিট্রাই।', 'आपके गलत उत्तरों से बने 5 प्रश्नों का त्वरित रीट्राई।') },
  { icon: '📱', title: t('Works on any device', 'যেকোনো ডিভাইসে চলে', 'किसी भी डिवाइस पर चलता है'), body: t('Phone, tablet or laptop — pick up where you left off.', 'ফোন, ট্যাবলেট বা ল্যাপটপ — যেখানে থেমেছিলেন সেখান থেকে শুরু।', 'फ़ोन, टैबलेट या लैपटॉप — जहाँ छोड़ा वहीं से शुरू।') },
];

export const BANK_TRACK = Object.freeze({
  title: t('Which Banking exam?', 'কোন ব্যাঙ্কিং পরীক্ষা?', 'कौन सी बैंकिंग परीक्षा?'),
  hint: t('Choose PO or Clerk to see the matching exam details.', 'সংশ্লিষ্ট পরীক্ষার তথ্য দেখতে PO বা Clerk বেছে নিন।', 'संबंधित परीक्षा की जानकारी देखने के लिए PO या Clerk चुनें।'),
  all: t('All', 'সব', 'सभी'),
  po: t('PO (Officer)', 'PO (অফিসার)', 'PO (ऑफिसर)'),
  clerk: t('Clerk', 'ক্লার্ক', 'क्लर्क'),
});

export const TIPS_PAGE = Object.freeze({
  title: t('Study tips that work', 'কার্যকর পড়ার টিপস', 'काम आने वाली अध्ययन टिप्स'),
  subtitle: t('Small habits that add up to a higher score.', 'ছোট ছোট অভ্যাস, বড় স্কোর।', 'छोटी आदतें, बड़ा स्कोर।'),
});

/** Exam-hall techniques, by section. Kept to methods that hold in every exam (no marking schemes or timings). */
export const EXAM_TRICKS_PAGE = Object.freeze({
  title: t('Exam-hall tricks', 'পরীক্ষার হলের কৌশল', 'परीक्षा हॉल की तरकीबें'),
  subtitle: t('Techniques that save time and marks on the day.', 'পরীক্ষার দিনে সময় আর নম্বর বাঁচানোর কৌশল।', 'परीक्षा के दिन समय और अंक बचाने की तरकीबें।'),
});

export const EXAM_TRICKS = [
  {
    icon: '🧭',
    title: t('Whole paper', 'পুরো প্রশ্নপত্র', 'पूरा प्रश्नपत्र'),
    items: [
      t('Go through the paper twice: answer what you are sure of first, mark the doubtful ones, then come back.', 'দুবার ঘুরে উত্তর দাও: প্রথমে নিশ্চিত প্রশ্নগুলো করো, সন্দেহেরগুলো চিহ্ন দিয়ে রাখো, পরে ফিরে এসো।', 'प्रश्नपत्र को दो बार में हल करें: पहले पक्के प्रश्न, संदिग्ध पर निशान लगाकर बाद में लौटें।'),
      t('Underline NOT, EXCEPT, INCORRECT and "which is false" before you read the options.', 'অপশন পড়ার আগে NOT, EXCEPT, INCORRECT, "কোনটি ভুল" — এই শব্দগুলোর নিচে দাগ দাও।', 'विकल्प पढ़ने से पहले NOT, EXCEPT, INCORRECT, "कौन-सा गलत है" को रेखांकित करें।'),
      t('Do not spend long on one question: if it takes more than twice your usual time, move on.', 'একটি প্রশ্নে আটকে থেকো না: স্বাভাবিকের দ্বিগুণ সময় লাগলে পরের প্রশ্নে চলে যাও।', 'एक प्रश्न पर अटकें नहीं: सामान्य से दोगुना समय लगे तो आगे बढ़ें।'),
      t('Change an answer only when you find a concrete reason, not on a vague feeling.', 'উত্তর বদলাও কেবল তখনই, যখন নির্দিষ্ট কারণ খুঁজে পাও — শুধু মনে হওয়ায় নয়।', 'उत्तर तभी बदलें जब ठोस कारण मिले, केवल अंदाज़े पर नहीं।'),
      t('On an answer sheet, check every few questions that the question number matches the row you are marking.', 'উত্তরপত্রে কয়েকটি প্রশ্ন পরপর মিলিয়ে নাও — প্রশ্ন নম্বর আর যে ঘরে দাগ দিচ্ছ তা এক কিনা।', 'उत्तर-पत्रक पर हर कुछ प्रश्नों में मिलाएँ कि प्रश्न संख्या और भरी जा रही पंक्ति एक ही है।'),
    ],
  },
  {
    icon: '🔢',
    title: t('Maths', 'গণিত', 'गणित'),
    items: [
      t('Work backwards from the options: put each option into the question (ages, numbers, word problems).', 'অপশন থেকে উল্টো দিকে কাজ করো: প্রতিটি অপশন প্রশ্নে বসিয়ে দেখো (বয়স, সংখ্যা, শব্দ-সমস্যা)।', 'विकल्पों से उल्टा हल करें: हर विकल्प को प्रश्न में रखकर जाँचें (आयु, संख्या, शब्द-समस्याएँ)।'),
      t('In percentage and profit questions, take the starting value as 100.', 'শতকরা ও লাভ-ক্ষতির প্রশ্নে শুরুর মান ১০০ ধরে নাও।', 'प्रतिशत और लाभ-हानि के प्रश्नों में आरंभिक मान 100 मानें।'),
      t('When the options are far apart, round the numbers and estimate.', 'অপশনগুলো দূরে দূরে হলে সংখ্যা গোল করে আন্দাজ করো।', 'जब विकल्प दूर-दूर हों, संख्याएँ पूर्णांकित कर अनुमान लगाएँ।'),
      t('Use the last digit and divisibility (by 2, 3, 5, 9, 11) to strike out wrong options fast.', 'শেষ অঙ্ক আর বিভাজ্যতা (২, ৩, ৫, ৯, ১১) দিয়ে ভুল অপশন দ্রুত বাদ দাও।', 'अंतिम अंक और विभाज्यता (2, 3, 5, 9, 11) से गलत विकल्प जल्दी हटाएँ।'),
      t('Write units next to numbers (km/h vs m/s, minutes vs hours) — most slips are unit slips.', 'সংখ্যার পাশে একক লিখে রাখো (কিমি/ঘণ্টা বনাম মি/সেকেন্ড, মিনিট বনাম ঘণ্টা) — বেশিরভাগ ভুল এককের ভুল।', 'संख्याओं के साथ इकाई लिखें (किमी/घंटा बनाम मी/से, मिनट बनाम घंटे) — ज़्यादातर गलतियाँ इकाई की होती हैं।'),
    ],
  },
  {
    icon: '🔤',
    title: t('English', 'ইংরেজি', 'अंग्रेज़ी'),
    items: [
      t('Read the whole sentence before filling a blank: the words after the blank often decide the answer.', 'শূন্যস্থান পূরণের আগে পুরো বাক্য পড়ো: শূন্যস্থানের পরের শব্দই প্রায়ই উত্তর ঠিক করে দেয়।', 'रिक्त स्थान भरने से पहले पूरा वाक्य पढ़ें: रिक्त के बाद के शब्द अक्सर उत्तर तय करते हैं।'),
      t('Learn verbs with their fixed prepositions (accede to, account for, preference for) — past papers ask them often.', 'ক্রিয়াপদকে তার নির্দিষ্ট preposition সহ শেখো (accede to, account for, preference for) — আগের প্রশ্নপত্রে এগুলো প্রায়ই আসে।', 'क्रियाओं को उनके निश्चित prepositions के साथ सीखें (accede to, account for, preference for) — पिछले प्रश्नपत्रों में ये अक्सर आते हैं।'),
      t('In synonym and antonym questions, check twice which one is asked before you choose.', 'Synonym আর antonym প্রশ্নে বেছে নেওয়ার আগে আরেকবার দেখে নাও কোনটা চাওয়া হয়েছে।', 'Synonym और antonym प्रश्नों में चुनने से पहले दोबारा देखें कि क्या पूछा गया है।'),
      t('Look-alike words (later/latter, extant/extent): say the meaning of each option in your head before choosing.', 'দেখতে একরকম শব্দ (later/latter, extant/extent): বাছার আগে প্রতিটি অপশনের অর্থ মনে মনে বলো।', 'मिलते-जुलते शब्द (later/latter, extant/extent): चुनने से पहले हर विकल्प का अर्थ मन में बोलें।'),
    ],
  },
  {
    icon: '🌏',
    title: t('General Studies', 'সাধারণ জ্ঞান', 'सामान्य अध्ययन'),
    items: [
      t('Statement questions: judge each statement on its own; one statement you know is wrong removes every option that contains it.', 'বিবৃতি-প্রশ্নে প্রতিটি বিবৃতি আলাদা করে যাচাই করো; একটি বিবৃতি ভুল জানলেই যে সব অপশনে সেটি আছে, সেগুলো বাদ।', 'कथन-प्रश्नों में हर कथन अलग से जाँचें; एक कथन गलत पता हो तो जिन विकल्पों में वह है, सब हट जाते हैं।'),
      t('Be careful with absolute words like "only", "always" and "never" in a statement — check them closely.', 'বিবৃতিতে "কেবল", "সবসময়", "কখনো নয়"-এর মতো চরম শব্দ থাকলে বিশেষ খেয়াল করে যাচাই করো।', 'कथन में "केवल", "हमेशा", "कभी नहीं" जैसे निरपेक्ष शब्दों को ध्यान से जाँचें।'),
      t('Match-the-following: fill in the pair you are surest of first; it usually leaves one or two options.', 'মিলকরণে আগে যে জোড়াটি সবচেয়ে নিশ্চিত সেটি বসাও; তাতেই সাধারণত এক-দুটি অপশন বাকি থাকে।', 'सुमेलन में पहले सबसे पक्की जोड़ी भरें; अक्सर इससे एक-दो विकल्प ही बचते हैं।'),
      t('Solve old papers: exams repeat questions — WBCS 2022 asked nine questions almost word for word from the 2015 and 2016 papers.', 'পুরনো প্রশ্নপত্র সমাধান করো: প্রশ্ন ফিরে আসে — WBCS ২০২২-এ ২০১৫ ও ২০১৬-র প্রশ্নপত্র থেকে নয়টি প্রশ্ন প্রায় হুবহু এসেছিল।', 'पुराने प्रश्नपत्र हल करें: प्रश्न दोहराए जाते हैं — WBCS 2022 में 2015 और 2016 के प्रश्नपत्रों से नौ प्रश्न लगभग हूबहू आए थे।'),
    ],
  },
  {
    icon: '🧩',
    title: t('Reasoning', 'রিজনিং', 'रीज़निंग'),
    items: [
      t('Number series: check differences first, then ratios, then the odd and even positions separately.', 'সংখ্যা শ্রেণিতে আগে পার্থক্য দেখো, তারপর অনুপাত, তারপর বিজোড় ও জোড় স্থান আলাদা করে।', 'संख्या श्रेणी में पहले अंतर देखें, फिर अनुपात, फिर विषम और सम स्थान अलग से।'),
      t('Letter series and coding: write the alphabet with positions (A=1 … Z=26) at the top of your rough sheet.', 'অক্ষর শ্রেণি ও কোডিং-এ রাফ কাগজের মাথায় বর্ণমালা ও তার ক্রম (A=1 … Z=26) লিখে নাও।', 'अक्षर श्रेणी और कोडिंग में रफ़ शीट के ऊपर वर्णमाला और स्थान (A=1 … Z=26) लिख लें।'),
      t('Blood relations and directions: always draw — a family tree or a small compass sketch.', 'রক্তের সম্পর্ক আর দিক নির্ণয়ে সবসময় এঁকে নাও — পারিবারিক বৃক্ষ বা ছোট দিক-নকশা।', 'रक्त संबंध और दिशा में हमेशा चित्र बनाएँ — परिवार-वृक्ष या छोटा दिशा-चित्र।'),
    ],
  },
];

export const TIPS = [
  { icon: '⏳', title: t('Practise daily, even 15 minutes', 'প্রতিদিন অনুশীলন করুন, ১৫ মিনিটও যথেষ্ট', 'रोज़ अभ्यास करें, 15 मिनट भी काफ़ी'), body: t('A daily streak beats a weekend marathon. Hit your daily goal to keep it alive.', 'সপ্তাহান্তের ম্যারাথনের চেয়ে প্রতিদিনের অভ্যাস ভালো। দৈনিক লক্ষ্য পূরণ করে স্ট্রিক ধরে রাখুন।', 'सप्ताहांत की मैराथन से रोज़ की आदत बेहतर है। स्ट्रीक बनाए रखने के लिए दैनिक लक्ष्य पूरा करें।') },
  { icon: '🧠', title: t('Learn formulas before questions', 'প্রশ্নের আগে সূত্র শিখুন', 'प्रश्नों से पहले सूत्र सीखें'), body: t('Read the revision notes first; then every question becomes pattern recognition.', 'আগে রিভিশন নোট পড়ুন; তারপর প্রতিটি প্রশ্নই হবে প্যাটার্ন চেনা।', 'पहले रिवीज़न नोट्स पढ़ें; फिर हर प्रश्न पैटर्न पहचानना बन जाता है।') },
  { icon: '⚡', title: t('Use shortcuts, but verify', 'শর্টকাট ব্যবহার করুন, কিন্তু যাচাই করুন', 'शॉर्टकट अपनाएँ, पर जाँचें'), body: t('Speed matters in CBT. Learn the shortcut, then check it against the full solution.', 'CBT-তে গতি জরুরি। শর্টকাট শিখে পূর্ণ সমাধানের সঙ্গে মিলিয়ে নিন।', 'CBT में गति ज़रूरी है। शॉर्टकट सीखें और पूर्ण हल से मिलाएँ।') },
  { icon: '🎯', title: t('Mind negative marking', 'নেগেটিভ মার্কিং মাথায় রাখুন', 'नेगेटिव मार्किंग का ध्यान रखें'), body: t('Skip a question when you can not eliminate at least two options.', 'অন্তত দুটি অপশন বাদ দিতে না পারলে প্রশ্নটি ছেড়ে দিন।', 'यदि कम से कम दो विकल्प हटा न सकें तो प्रश्न छोड़ दें।') },
  { icon: '🔁', title: t('Retry your mistakes', 'ভুলগুলো আবার করুন', 'गलतियाँ दोबारा हल करें'), body: t('After each mock, redo the wrong questions within 24 hours.', 'প্রতিটি মকের পর ২৪ ঘণ্টার মধ্যে ভুল প্রশ্নগুলো আবার করুন।', 'हर मॉक के बाद 24 घंटे में गलत प्रश्न दोबारा हल करें।') },
  { icon: '📅', title: t('Mix subjects every week', 'প্রতি সপ্তাহে বিষয় মিশিয়ে পড়ুন', 'हर हफ़्ते विषय मिलाकर पढ़ें'), body: t('Rotate Maths, English and Reasoning so no section gets rusty.', 'গণিত, ইংরেজি ও রিজনিং পালা করে পড়ুন যাতে কোনোটাই পিছিয়ে না পড়ে।', 'गणित, अंग्रेज़ी और रीज़निंग बारी-बारी से पढ़ें ताकि कोई विषय कमज़ोर न पड़े।') },
];
