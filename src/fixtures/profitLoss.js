/**
 * Same shape as GET /api/v1/practice/topic-summary -> data.
 * Used when VITE_USE_FIXTURES=true. The last pitfall deliberately has no Hindi,
 * to show the English fallback badge.
 */
export const profitLossTopic = {
  breadcrumb: {
    category: { code: 'SSC', name: { en: 'SSC', bn: 'SSC', hi: 'SSC' } },
    subject: {
      code: 'quant',
      name: { en: 'Quantitative Aptitude', bn: 'পরিমাণগত দক্ষতা', hi: 'मात्रात्मक योग्यता' },
    },
    topic: {
      code: 'profit_loss',
      name: { en: 'Profit, Loss & Discount', bn: 'লাভ, ক্ষতি ও ছাড়', hi: 'लाभ, हानि और छूट' },
    },
  },
  summary: {
    slug: 'quant.profit_loss',
    title: { en: 'Profit, Loss & Discount', bn: 'লাভ, ক্ষতি ও ছাড়', hi: 'लाभ, हानि और छूट' },
    overview: {
      en: 'Every profit or loss percentage is measured on the **cost price (CP)**; every discount is measured on the **marked price (MP)**. Most errors come from mixing up these two bases.',
      bn: 'সব লাভ বা ক্ষতির শতকরা হার **ক্রয়মূল্যের (CP)** উপর হিসাব হয়; সব ছাড় হিসাব হয় **ধার্যমূল্যের (MP)** উপর। বেশিরভাগ ভুল হয় এই দুটি ভিত্তি গুলিয়ে ফেলার জন্য।',
      hi: 'हर लाभ या हानि प्रतिशत **क्रय मूल्य (CP)** पर मापा जाता है; हर छूट **अंकित मूल्य (MP)** पर। ज़्यादातर गलतियाँ इन दोनों आधारों को मिलाने से होती हैं।',
    },
    formulas: [
      {
        key: 'profit_percent',
        label: { en: 'Profit %', bn: 'শতকরা লাভ', hi: 'लाभ प्रतिशत' },
        latex: '\\text{Profit\\%} = \\dfrac{SP - CP}{CP} \\times 100',
        variables: [
          { symbol: 'SP', meaning: { en: 'Selling price', bn: 'বিক্রয়মূল্য', hi: 'विक्रय मूल्य' } },
          { symbol: 'CP', meaning: { en: 'Cost price', bn: 'ক্রয়মূল্য', hi: 'क्रय मूल्य' } },
        ],
      },
      {
        key: 'sp_from_profit',
        label: { en: 'Selling price from profit %', bn: 'লাভের হার থেকে বিক্রয়মূল্য', hi: 'लाभ प्रतिशत से विक्रय मूल्य' },
        latex: 'SP = CP \\times \\dfrac{100 + P\\%}{100}',
        explanation: {
          en: 'For a loss, use $100 - L\\%$.',
          bn: 'ক্ষতি হলে $100 - L\\%$ ব্যবহার করুন।',
          hi: 'हानि होने पर $100 - L\\%$ का प्रयोग करें।',
        },
      },
      {
        key: 'mp_cp_ratio',
        label: { en: 'Marked price vs cost price', bn: 'ধার্যমূল্য ও ক্রয়মূল্যের সম্পর্ক', hi: 'अंकित मूल्य और क्रय मूल्य का संबंध' },
        latex: '\\dfrac{MP}{CP} = \\dfrac{100 + P\\%}{100 - D\\%}',
        variables: [
          { symbol: 'MP', meaning: { en: 'Marked price', bn: 'ধার্যমূল্য', hi: 'अंकित मूल्य' } },
          { symbol: 'D\\%', meaning: { en: 'Discount %', bn: 'শতকরা ছাড়', hi: 'छूट प्रतिशत' } },
        ],
        explanation: {
          en: 'Links markup, discount and profit in one step.',
          bn: 'মার্কআপ, ছাড় ও লাভকে এক ধাপে যুক্ত করে।',
          hi: 'मार्कअप, छूट और लाभ को एक ही चरण में जोड़ता है।',
        },
      },
      {
        key: 'successive_discount',
        label: { en: 'Two successive discounts', bn: 'পরপর দুটি ছাড়', hi: 'लगातार दो छूट' },
        latex: 'D_{\\text{net}} = d_1 + d_2 - \\dfrac{d_1 d_2}{100}',
        explanation: {
          en: 'Two discounts never simply add up: 20% then 10% is 28%, not 30%.',
          bn: 'দুটি ছাড় কখনও সরাসরি যোগ হয় না: 20% তারপর 10% মানে 28%, 30% নয়।',
          hi: 'दो छूट कभी सीधे नहीं जुड़तीं: 20% फिर 10% का मतलब 28% है, 30% नहीं।',
        },
      },
      {
        key: 'false_weight',
        label: { en: 'Dishonest dealer (false weight)', bn: 'অসৎ ব্যবসায়ী (ভুল ওজন)', hi: 'बेईमान दुकानदार (गलत तौल)' },
        latex: '\\text{Gain\\%} = \\dfrac{\\text{True wt.} - \\text{False wt.}}{\\text{False wt.}} \\times 100',
        explanation: {
          en: 'Selling at cost price but giving 900 g for 1 kg: $\\frac{100}{900} \\times 100 = 11\\frac{1}{9}\\%$ gain.',
          bn: 'ক্রয়মূল্যে বিক্রি করে 1 kg-এর বদলে 900 g দিলে লাভ $\\frac{100}{900} \\times 100 = 11\\frac{1}{9}\\%$।',
          hi: 'क्रय मूल्य पर बेचकर 1 kg की जगह 900 g देने पर लाभ $\\frac{100}{900} \\times 100 = 11\\frac{1}{9}\\%$।',
        },
      },
    ],
    derivationRules: [
      {
        title: { en: 'Assume CP = 100', bn: 'ক্রয়মূল্য = 100 ধরুন', hi: 'क्रय मूल्य = 100 मानें' },
        body: {
          en: 'When only percentages are given, set $CP = 100$. Every percentage then becomes a rupee amount and the answer can be read off directly.',
          bn: 'শুধু শতকরা হার দেওয়া থাকলে $CP = 100$ ধরুন। তখন প্রতিটি শতকরা হার সরাসরি টাকার অঙ্কে পরিণত হয় এবং উত্তর সোজাসুজি পাওয়া যায়।',
          hi: 'जब केवल प्रतिशत दिए हों, तो $CP = 100$ मान लें। तब हर प्रतिशत सीधे रुपये की राशि बन जाता है और उत्तर सीधे मिल जाता है।',
        },
      },
      {
        title: {
          en: 'Same SP, $x\\%$ gain and $x\\%$ loss',
          bn: 'একই বিক্রয়মূল্যে $x\\%$ লাভ ও $x\\%$ ক্ষতি',
          hi: 'समान विक्रय मूल्य पर $x\\%$ लाभ और $x\\%$ हानि',
        },
        body: {
          en: 'Two items sold at the same price, one at $x\\%$ profit and one at $x\\%$ loss, always give an overall **loss** of $\\frac{x^2}{100}\\%$.',
          bn: 'একই দামে দুটি জিনিস বিক্রি করে একটিতে $x\\%$ লাভ ও অন্যটিতে $x\\%$ ক্ষতি হলে মোট ফল সর্বদা $\\frac{x^2}{100}\\%$ **ক্ষতি**।',
          hi: 'दो वस्तुएँ समान मूल्य पर बेचने पर, एक पर $x\\%$ लाभ और दूसरी पर $x\\%$ हानि हो, तो कुल मिलाकर हमेशा $\\frac{x^2}{100}\\%$ की **हानि** होती है।',
        },
      },
    ],
    speedTricks: [
      {
        title: {
          en: 'Successive % change in one line',
          bn: 'এক লাইনে ক্রমিক শতকরা পরিবর্তন',
          hi: 'एक पंक्ति में क्रमिक प्रतिशत परिवर्तन',
        },
        body: {
          en: 'Markup $a\\%$ followed by discount $b\\%$: net effect $= a - b - \\frac{ab}{100}$.\n\nExample: $40\\%$ markup, $20\\%$ discount → $40 - 20 - 8 = 12\\%$ profit.',
          bn: '$a\\%$ মার্কআপ ও তারপর $b\\%$ ছাড়: মোট ফল $= a - b - \\frac{ab}{100}$।\n\nউদাহরণ: $40\\%$ মার্কআপ, $20\\%$ ছাড় → $40 - 20 - 8 = 12\\%$ লাভ।',
          hi: '$a\\%$ मार्कअप के बाद $b\\%$ छूट: कुल प्रभाव $= a - b - \\frac{ab}{100}$।\n\nउदाहरण: $40\\%$ मार्कअप, $20\\%$ छूट → $40 - 20 - 8 = 12\\%$ लाभ।',
        },
        approxTimeSavedSec: 25,
      },
      {
        title: { en: 'Swap percentages for fractions', bn: 'শতকরাকে ভগ্নাংশে বদলান', hi: 'प्रतिशत को भिन्न में बदलें' },
        body: {
          en: 'Know the common ones: $12\\tfrac{1}{2}\\% = \\tfrac{1}{8}$, $16\\tfrac{2}{3}\\% = \\tfrac{1}{6}$, $20\\% = \\tfrac{1}{5}$, $25\\% = \\tfrac{1}{4}$. A $25\\%$ profit means $CP : SP = 4 : 5$, no multiplication needed.',
          bn: 'সাধারণ ভগ্নাংশগুলি মনে রাখুন: $12\\tfrac{1}{2}\\% = \\tfrac{1}{8}$, $16\\tfrac{2}{3}\\% = \\tfrac{1}{6}$, $20\\% = \\tfrac{1}{5}$, $25\\% = \\tfrac{1}{4}$। $25\\%$ লাভ মানে $CP : SP = 4 : 5$, গুণ করার দরকার নেই।',
          hi: 'आम भिन्न याद रखें: $12\\tfrac{1}{2}\\% = \\tfrac{1}{8}$, $16\\tfrac{2}{3}\\% = \\tfrac{1}{6}$, $20\\% = \\tfrac{1}{5}$, $25\\% = \\tfrac{1}{4}$। $25\\%$ लाभ का मतलब $CP : SP = 4 : 5$, गुणा करने की ज़रूरत नहीं।',
        },
        approxTimeSavedSec: 15,
      },
      {
        title: {
          en: 'CP of $x$ articles = SP of $y$ articles',
          bn: '$x$টির ক্রয়মূল্য = $y$টির বিক্রয়মূল্য',
          hi: '$x$ वस्तुओं का क्रय मूल्य = $y$ वस्तुओं का विक्रय मूल्य',
        },
        body: {
          en: 'Profit $\\% = \\frac{x - y}{y} \\times 100$; a negative result is a loss.',
          bn: 'লাভ $\\% = \\frac{x - y}{y} \\times 100$; ফল ঋণাত্মক হলে তা ক্ষতি।',
          hi: 'लाभ $\\% = \\frac{x - y}{y} \\times 100$; परिणाम ऋणात्मक हो तो हानि।',
        },
        approxTimeSavedSec: 20,
      },
    ],
    commonTraps: [
      {
        en: '**Discount is on MP, profit is on CP.** Subtracting a 20% discount from a 40% markup to get 20% is a classic wrong option.',
        bn: '**ছাড় ধার্যমূল্যের উপর, লাভ ক্রয়মূল্যের উপর।** 40% মার্কআপ থেকে 20% ছাড় বিয়োগ করে 20% পাওয়া একটি প্রচলিত ভুল বিকল্প।',
        hi: '**छूट अंकित मूल्य पर, लाभ क्रय मूल्य पर।** 40% मार्कअप से 20% छूट घटाकर 20% पाना एक आम गलत विकल्प है।',
      },
      {
        en: '**Profit % on SP is not profit % on CP.** If a question says "20% profit on the selling price", convert first: $\\frac{20}{80} \\times 100 = 25\\%$ on CP.',
        bn: '**বিক্রয়মূল্যের উপর লাভ আর ক্রয়মূল্যের উপর লাভ এক নয়।** প্রশ্নে "বিক্রয়মূল্যের উপর 20% লাভ" বললে আগে রূপান্তর করুন: $\\frac{20}{80} \\times 100 = 25\\%$ (ক্রয়মূল্যের উপর)।',
        hi: '**विक्रय मूल्य पर लाभ और क्रय मूल्य पर लाभ एक नहीं हैं।** प्रश्न में "विक्रय मूल्य पर 20% लाभ" कहा हो, तो पहले बदलें: $\\frac{20}{80} \\times 100 = 25\\%$ (क्रय मूल्य पर)।',
      },
      {
        en: '**Overheads belong in CP.** Transport, repair or tax paid by the seller is added to the cost price before computing profit.',
        bn: '**অতিরিক্ত খরচ ক্রয়মূল্যের অংশ।** বিক্রেতার পরিবহন, মেরামত বা কর খরচ লাভ হিসাবের আগে ক্রয়মূল্যে যোগ করুন।',
      },
    ],
    syllabus: [{ tier: 'TIER_1', examCodes: ['SSC_CGL', 'SSC_CHSL'] }],
  },
};
