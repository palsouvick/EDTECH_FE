/**
 * Offline practice bank for Profit & Loss (VITE_USE_FIXTURES=true).
 *
 * English + Bengali only: Hindi readers see the English text with the "EN"
 * fallback badge, which is how untranslated questions behave in production.
 *
 * PYQ tags here are illustrative, for the badge UI. They are not real exam
 * provenance; never import this file into the question bank.
 */

const same = (t) => ({ en: t, bn: t });

function build(n, { difficulty, pyq = [], stem, options, correct, steps, shortcut, traps = {}, stats }) {
  const id = (i) => `opt_q${String(n).padStart(2, '0')}${'abcd'[i]}`;
  return {
    questionId: `66f20000000000000000${String(n).padStart(4, '0')}`,
    topic: 'profit_loss',
    difficulty,
    pyq,
    stem,
    options: options.map((text, i) => ({ optionId: id(i), text: typeof text === 'string' ? same(text) : text })),
    correctOptionId: id(correct),
    steps,
    shortcut,
    traps: Object.fromEntries(Object.entries(traps).map(([i, note]) => [id(Number(i)), note])),
    stats,
  };
}

export const practiceBank = [
  build(1, {
    difficulty: 2,
    pyq: [{ examName: 'SSC CGL', year: 2023, tier: 'TIER_1', shift: 'Shift 2' }],
    stem: {
      en: 'A shopkeeper marks his goods 40% above the cost price and allows a discount of 20% on the marked price. What is his profit percentage?',
      bn: 'একজন দোকানদার তাঁর পণ্যের ধার্যমূল্য ক্রয়মূল্যের চেয়ে 40% বেশি রাখেন এবং ধার্যমূল্যের উপর 20% ছাড় দেন। তাঁর শতকরা লাভ কত?',
    },
    options: ['10%', '12%', '15%', '20%'],
    correct: 1,
    steps: [
      { en: 'Let the cost price (CP) be ₹100.', bn: 'ধরি, ক্রয়মূল্য (CP) = ₹100।' },
      { en: 'Marked price $MP = 100 \\times \\frac{140}{100} = ₹140$.', bn: 'ধার্যমূল্য $MP = 100 \\times \\frac{140}{100} = ₹140$।' },
      { en: 'After a 20% discount: $SP = 140 \\times \\frac{80}{100} = ₹112$.', bn: '20% ছাড়ের পর: $SP = 140 \\times \\frac{80}{100} = ₹112$।' },
      { en: 'Profit = ₹12 on ₹100, so **12%**.', bn: '₹100-এ লাভ ₹12, অর্থাৎ **12%**।' },
    ],
    shortcut: {
      en: 'Successive change: $$40 - 20 - \\frac{40 \\times 20}{100} = 12\\%$$',
      bn: 'ক্রমিক পরিবর্তন: $$40 - 20 - \\frac{40 \\times 20}{100} = 12\\%$$',
    },
    traps: {
      3: {
        en: 'Subtracting directly (40 − 20 = 20%) ignores that the discount is taken on the **marked price**, which is larger than the cost price.',
        bn: 'সরাসরি বিয়োগ (40 − 20 = 20%) করলে ভুল হয়, কারণ ছাড় দেওয়া হয় **ধার্যমূল্যের** উপর, যা ক্রয়মূল্যের চেয়ে বেশি।',
      },
    },
    stats: { attempts: 1840, correct: 1104 },
  }),

  build(2, {
    difficulty: 2,
    pyq: [{ examName: 'SSC CHSL', year: 2022, tier: 'TIER_1' }],
    stem: {
      en: 'The cost price of 20 articles is equal to the selling price of 16 articles. Find the profit percentage.',
      bn: '20টি জিনিসের ক্রয়মূল্য 16টি জিনিসের বিক্রয়মূল্যের সমান। শতকরা লাভ কত?',
    },
    options: ['20%', '25%', '$16\\frac{2}{3}\\%$', '30%'],
    correct: 1,
    steps: [
      { en: 'Let the CP of 1 article be ₹1, so the CP of 16 articles is ₹16.', bn: 'ধরি, 1টি জিনিসের ক্রয়মূল্য ₹1, তাহলে 16টির ক্রয়মূল্য ₹16।' },
      { en: 'SP of 16 articles = CP of 20 articles = ₹20.', bn: '16টির বিক্রয়মূল্য = 20টির ক্রয়মূল্য = ₹20।' },
      { en: 'Profit % $= \\frac{20 - 16}{16} \\times 100 = 25\\%$.', bn: 'শতকরা লাভ $= \\frac{20 - 16}{16} \\times 100 = 25\\%$।' },
    ],
    shortcut: {
      en: '$$\\frac{x - y}{y} \\times 100 = \\frac{20 - 16}{16} \\times 100 = 25\\%$$',
      bn: '$$\\frac{x - y}{y} \\times 100 = \\frac{20 - 16}{16} \\times 100 = 25\\%$$',
    },
    traps: {
      0: {
        en: 'You divided the gain (4 articles) by 20. Profit is measured on what was **sold**: 4 out of 16.',
        bn: 'লাভের 4টি জিনিসকে 20 দিয়ে ভাগ করেছেন। লাভ হিসাব হয় যা **বিক্রি** হয়েছে তার উপর: 16-এর মধ্যে 4।',
      },
    },
    stats: { attempts: 2210, correct: 1370 },
  }),

  build(3, {
    difficulty: 1,
    stem: {
      en: 'An article is sold for ₹540 at a loss of 10%. What is its cost price?',
      bn: 'একটি জিনিস 10% ক্ষতিতে ₹540-এ বিক্রি করা হল। এর ক্রয়মূল্য কত?',
    },
    options: ['₹486', '₹594', '₹600', '₹550'],
    correct: 2,
    steps: [
      { en: 'A 10% loss means SP is 90% of CP.', bn: '10% ক্ষতি মানে বিক্রয়মূল্য ক্রয়মূল্যের 90%।' },
      { en: '$CP = \\frac{540}{90} \\times 100 = ₹600$.', bn: '$CP = \\frac{540}{90} \\times 100 = ₹600$।' },
    ],
    traps: {
      1: {
        en: 'You added 10% of the **selling price** (540 + 54). The loss is 10% of the **cost price**, which is unknown, so divide by 0.9 instead.',
        bn: 'আপনি **বিক্রয়মূল্যের** 10% যোগ করেছেন (540 + 54)। ক্ষতি হয় **ক্রয়মূল্যের** 10%, যা অজানা, তাই 0.9 দিয়ে ভাগ করুন।',
      },
      0: {
        en: 'You subtracted the loss again. After a loss, the cost price must be **higher** than the selling price.',
        bn: 'আপনি আবার ক্ষতি বিয়োগ করেছেন। ক্ষতি হলে ক্রয়মূল্য বিক্রয়মূল্যের চেয়ে **বেশি** হয়।',
      },
    },
    stats: { attempts: 3105, correct: 2420 },
  }),

  build(4, {
    difficulty: 2,
    pyq: [{ examName: 'IBPS PO', year: 2022, tier: 'PRELIMS' }],
    stem: {
      en: 'A trader offers two successive discounts of 20% and 10%. What single discount is equivalent to them?',
      bn: 'একজন ব্যবসায়ী পরপর 20% ও 10% ছাড় দেন। এর সমতুল্য একক ছাড় কত?',
    },
    options: ['30%', '28%', '25%', '32%'],
    correct: 1,
    steps: [
      { en: 'Take the marked price as ₹100.', bn: 'ধরি, ধার্যমূল্য ₹100।' },
      { en: 'After 20% off: ₹80. After a further 10% off: $80 \\times 0.9 = ₹72$.', bn: '20% ছাড়ের পর ₹80। আরও 10% ছাড়ের পর: $80 \\times 0.9 = ₹72$।' },
      { en: 'Total discount = 100 − 72 = **28%**.', bn: 'মোট ছাড় = 100 − 72 = **28%**।' },
    ],
    shortcut: {
      en: '$$d_1 + d_2 - \\frac{d_1 d_2}{100} = 20 + 10 - 2 = 28\\%$$',
      bn: '$$d_1 + d_2 - \\frac{d_1 d_2}{100} = 20 + 10 - 2 = 28\\%$$',
    },
    traps: {
      0: {
        en: "Discounts don't add: the second 10% is taken on ₹80, not on ₹100.",
        bn: 'ছাড় যোগ হয় না: দ্বিতীয় 10% নেওয়া হয় ₹80-এর উপর, ₹100-এর উপর নয়।',
      },
    },
    stats: { attempts: 1650, correct: 990 },
  }),

  build(5, {
    difficulty: 3,
    pyq: [{ examName: 'WBCS', year: 2019, tier: 'PRELIMS' }],
    stem: {
      en: 'A dishonest dealer sells goods at cost price but uses a weight of 900 g instead of 1 kg. What is his gain percentage?',
      bn: 'একজন অসৎ ব্যবসায়ী ক্রয়মূল্যেই জিনিস বিক্রি করেন, কিন্তু 1 kg-এর বদলে 900 g ওজন ব্যবহার করেন। তাঁর শতকরা লাভ কত?',
    },
    options: ['10%', '$11\\frac{1}{9}\\%$', '$9\\frac{1}{11}\\%$', '9%'],
    correct: 1,
    steps: [
      { en: 'He charges for 1000 g but gives only 900 g, so he gains 100 g on every 900 g he actually gives.', bn: 'তিনি 1000 g-এর দাম নেন কিন্তু দেন মাত্র 900 g, অর্থাৎ প্রতি 900 g-এ 100 g লাভ।' },
      { en: 'Gain % $= \\frac{100}{900} \\times 100 = 11\\frac{1}{9}\\%$.', bn: 'শতকরা লাভ $= \\frac{100}{900} \\times 100 = 11\\frac{1}{9}\\%$।' },
    ],
    traps: {
      0: {
        en: 'You divided by the true weight (1000 g). The gain is measured against the goods actually given: 900 g.',
        bn: 'আপনি আসল ওজন (1000 g) দিয়ে ভাগ করেছেন। লাভ হিসাব হয় প্রকৃতপক্ষে দেওয়া জিনিসের উপর: 900 g।',
      },
      2: {
        en: 'You divided by 1100 g. The dealer gives **less** than 1 kg, so the base is 900 g.',
        bn: 'আপনি 1100 g দিয়ে ভাগ করেছেন। ব্যবসায়ী 1 kg-এর **কম** দেন, তাই ভিত্তি 900 g।',
      },
    },
    stats: { attempts: 1320, correct: 610 },
  }),

  build(6, {
    difficulty: 3,
    pyq: [{ examName: 'SSC CGL', year: 2022, tier: 'TIER_1' }],
    stem: {
      en: 'Two watches are each sold for ₹990. One is sold at a 10% profit and the other at a 10% loss. What is the overall result?',
      bn: 'দুটি ঘড়ির প্রতিটি ₹990-এ বিক্রি হল। একটিতে 10% লাভ ও অন্যটিতে 10% ক্ষতি হল। মোট ফল কী?',
    },
    options: [
      { en: 'No profit, no loss', bn: 'লাভও নেই, ক্ষতিও নেই' },
      { en: '1% loss', bn: '1% ক্ষতি' },
      { en: '1% profit', bn: '1% লাভ' },
    ],
    correct: 1,
    steps: [
      {
        en: 'When two items are sold at the **same price**, one at $x\\%$ profit and one at $x\\%$ loss, there is always a net loss.',
        bn: '**একই দামে** দুটি জিনিস বিক্রি করে একটিতে $x\\%$ লাভ ও অন্যটিতে $x\\%$ ক্ষতি হলে সর্বদা মোট ক্ষতি হয়।',
      },
      { en: 'Loss % $= \\frac{x^2}{100} = \\frac{10^2}{100} = 1\\%$.', bn: 'শতকরা ক্ষতি $= \\frac{x^2}{100} = \\frac{10^2}{100} = 1\\%$।' },
    ],
    traps: {
      0: {
        en: "The 10% gain and 10% loss are on **different** cost prices (₹900 and ₹1,100), so they don't cancel.",
        bn: '10% লাভ ও 10% ক্ষতি **আলাদা** ক্রয়মূল্যের উপর (₹900 ও ₹1,100), তাই এরা কাটাকাটি হয় না।',
      },
    },
    stats: { attempts: 2480, correct: 1190 },
  }),

  build(7, {
    difficulty: 2,
    stem: {
      en: 'By selling an article for ₹720, a man gains 20%. At what price should he sell it to gain 30%?',
      bn: 'একটি জিনিস ₹720-এ বিক্রি করে একজন ব্যক্তির 20% লাভ হয়। 30% লাভ করতে হলে জিনিসটি কত দামে বিক্রি করতে হবে?',
    },
    options: ['₹750', '₹780', '₹800', '₹936'],
    correct: 1,
    steps: [
      { en: '$CP = \\frac{720}{120} \\times 100 = ₹600$.', bn: '$CP = \\frac{720}{120} \\times 100 = ₹600$।' },
      { en: 'For a 30% gain: $SP = 600 \\times \\frac{130}{100} = ₹780$.', bn: '30% লাভের জন্য: $SP = 600 \\times \\frac{130}{100} = ₹780$।' },
    ],
    shortcut: {
      en: 'Skip the CP: $$SP_2 = 720 \\times \\frac{130}{120} = ₹780$$',
      bn: 'ক্রয়মূল্য বের না করেই: $$SP_2 = 720 \\times \\frac{130}{120} = ₹780$$',
    },
    traps: {
      3: {
        en: 'You applied 30% to the old selling price (720 × 1.3). Both percentages are on the **cost price**.',
        bn: 'আপনি পুরনো বিক্রয়মূল্যের উপর 30% ধরেছেন (720 × 1.3)। দুটি শতকরা হারই **ক্রয়মূল্যের** উপর।',
      },
    },
    stats: { attempts: 2950, correct: 2010 },
  }),

  build(8, {
    difficulty: 3,
    pyq: [{ examName: 'SBI Clerk', year: 2023, tier: 'PRELIMS' }],
    stem: {
      en: 'The marked price of a fan is ₹1,200. After a 15% discount, the shopkeeper still gains 2%. What is the cost price?',
      bn: 'একটি পাখার ধার্যমূল্য ₹1,200। 15% ছাড় দেওয়ার পরও দোকানদারের 2% লাভ হয়। ক্রয়মূল্য কত?',
    },
    options: ['₹1,000', '₹1,020', '₹999.60', '₹1,040'],
    correct: 0,
    steps: [
      { en: '$SP = 1200 \\times 0.85 = ₹1020$.', bn: '$SP = 1200 \\times 0.85 = ₹1020$।' },
      { en: 'SP is 102% of CP: $CP = \\frac{1020}{102} \\times 100 = ₹1000$.', bn: 'বিক্রয়মূল্য ক্রয়মূল্যের 102%: $CP = \\frac{1020}{102} \\times 100 = ₹1000$।' },
    ],
    traps: {
      1: { en: 'That is the selling price. You still need to remove the 2% profit.', bn: 'এটি বিক্রয়মূল্য। এখনও 2% লাভ বাদ দিতে হবে।' },
      2: {
        en: 'You took 2% of the **selling price** (1020 − 20.40). Profit is 2% of the cost price, so divide by 1.02.',
        bn: 'আপনি **বিক্রয়মূল্যের** 2% বাদ দিয়েছেন (1020 − 20.40)। লাভ ক্রয়মূল্যের 2%, তাই 1.02 দিয়ে ভাগ করুন।',
      },
    },
    stats: { attempts: 1410, correct: 720 },
  }),

  build(9, {
    difficulty: 3,
    pyq: [{ examName: 'WBCS', year: 2021, tier: 'PRELIMS' }],
    stem: {
      en: 'A shopkeeper earns a profit of 20% on the selling price. What is his profit percentage on the cost price?',
      bn: 'একজন দোকানদার বিক্রয়মূল্যের উপর 20% লাভ করেন। ক্রয়মূল্যের উপর তাঁর শতকরা লাভ কত?',
    },
    options: ['20%', '25%', '$16\\frac{2}{3}\\%$', '24%'],
    correct: 1,
    steps: [
      { en: 'Let SP = ₹100. Profit = 20% of SP = ₹20.', bn: 'ধরি, বিক্রয়মূল্য = ₹100। লাভ = বিক্রয়মূল্যের 20% = ₹20।' },
      { en: 'CP = 100 − 20 = ₹80.', bn: 'ক্রয়মূল্য = 100 − 20 = ₹80।' },
      { en: 'Profit % on CP $= \\frac{20}{80} \\times 100 = 25\\%$.', bn: 'ক্রয়মূল্যের উপর শতকরা লাভ $= \\frac{20}{80} \\times 100 = 25\\%$।' },
    ],
    traps: {
      0: {
        en: '20% is the profit on the **selling price**. Convert it to the cost-price base.',
        bn: '20% হল **বিক্রয়মূল্যের** উপর লাভ। একে ক্রয়মূল্যের ভিত্তিতে রূপান্তর করুন।',
      },
      2: {
        en: 'You went the wrong way: $\\frac{20}{120}$ treats SP as 120% of CP. Here SP is the base (100), so CP = 80.',
        bn: 'আপনি উল্টো দিকে হিসাব করেছেন: $\\frac{20}{120}$ মানে বিক্রয়মূল্যকে ক্রয়মূল্যের 120% ধরা। এখানে বিক্রয়মূল্যই ভিত্তি (100), তাই ক্রয়মূল্য = 80।',
      },
    },
    stats: { attempts: 1780, correct: 900 },
  }),

  build(10, {
    difficulty: 2,
    pyq: [{ examName: 'SSC CGL', year: 2024, tier: 'TIER_1' }],
    stem: {
      en: 'A vendor buys pens at 3 for ₹10 and sells them at 2 for ₹10. What is his profit percentage?',
      bn: 'একজন বিক্রেতা ₹10-এ 3টি করে কলম কেনেন এবং ₹10-এ 2টি করে বিক্রি করেন। তাঁর শতকরা লাভ কত?',
    },
    options: ['$33\\frac{1}{3}\\%$', '50%', '25%', '$66\\frac{2}{3}\\%$'],
    correct: 1,
    steps: [
      { en: 'Take 6 pens (the LCM of 3 and 2).', bn: '3 ও 2-এর ল.সা.গু. অনুযায়ী 6টি কলম ধরি।' },
      { en: 'CP of 6 pens = ₹20; SP of 6 pens = ₹30.', bn: '6টির ক্রয়মূল্য = ₹20; বিক্রয়মূল্য = ₹30।' },
      { en: 'Profit % $= \\frac{30 - 20}{20} \\times 100 = 50\\%$.', bn: 'শতকরা লাভ $= \\frac{30 - 20}{20} \\times 100 = 50\\%$।' },
    ],
    traps: {
      0: {
        en: 'You divided the profit by the selling price (10 ÷ 30). Profit % is always on the cost price (10 ÷ 20).',
        bn: 'আপনি লাভকে বিক্রয়মূল্য দিয়ে ভাগ করেছেন (10 ÷ 30)। শতকরা লাভ সর্বদা ক্রয়মূল্যের উপর (10 ÷ 20)।',
      },
    },
    stats: { attempts: 2020, correct: 1350 },
  }),

  build(11, {
    difficulty: 4,
    pyq: [{ examName: 'WBCS', year: 2023, tier: 'PRELIMS' }],
    stem: {
      en: 'By selling 20 articles, a man loses an amount equal to the selling price of 4 articles. What is his loss percentage?',
      bn: '20টি জিনিস বিক্রি করে একজন ব্যক্তির যে ক্ষতি হয়, তা 4টি জিনিসের বিক্রয়মূল্যের সমান। শতকরা ক্ষতি কত?',
    },
    options: ['20%', '$16\\frac{2}{3}\\%$', '25%', '$12\\frac{1}{2}\\%$'],
    correct: 1,
    steps: [
      { en: 'Let the SP of 1 article be ₹1. SP of 20 = ₹20, and the loss = ₹4.', bn: 'ধরি, 1টির বিক্রয়মূল্য ₹1। 20টির বিক্রয়মূল্য = ₹20, ক্ষতি = ₹4।' },
      { en: 'CP = SP + loss = 20 + 4 = ₹24.', bn: 'ক্রয়মূল্য = বিক্রয়মূল্য + ক্ষতি = 20 + 4 = ₹24।' },
      { en: 'Loss % $= \\frac{4}{24} \\times 100 = 16\\frac{2}{3}\\%$.', bn: 'শতকরা ক্ষতি $= \\frac{4}{24} \\times 100 = 16\\frac{2}{3}\\%$।' },
    ],
    traps: {
      0: {
        en: 'You divided by the selling price of 20 articles. Loss % uses the cost price, which is 24, not 20.',
        bn: 'আপনি 20টির বিক্রয়মূল্য দিয়ে ভাগ করেছেন। শতকরা ক্ষতি হিসাব হয় ক্রয়মূল্যে, যা 24, 20 নয়।',
      },
      2: {
        en: '$\\frac{4}{16}$ would be right for a **gain** (CP = 20 − 4). For a loss, CP is larger: 20 + 4.',
        bn: '$\\frac{4}{16}$ **লাভের** ক্ষেত্রে ঠিক হত (ক্রয়মূল্য = 20 − 4)। ক্ষতির ক্ষেত্রে ক্রয়মূল্য বেশি: 20 + 4।',
      },
    },
    stats: { attempts: 980, correct: 400 },
  }),

  build(12, {
    difficulty: 2,
    pyq: [{ examName: 'IBPS Clerk', year: 2021, tier: 'PRELIMS' }],
    stem: {
      en: 'A trader marks an item 25% above cost and then gives a 12% discount. What is his profit percentage?',
      bn: 'একজন ব্যবসায়ী একটি জিনিসের দাম ক্রয়মূল্যের চেয়ে 25% বেশি ধার্য করেন এবং তারপর 12% ছাড় দেন। তাঁর শতকরা লাভ কত?',
    },
    options: ['13%', '10%', '8%', '12%'],
    correct: 1,
    steps: [
      { en: 'Take CP = ₹100, so MP = ₹125.', bn: 'ধরি, ক্রয়মূল্য = ₹100, তাহলে ধার্যমূল্য = ₹125।' },
      { en: '$SP = 125 \\times 0.88 = ₹110$.', bn: '$SP = 125 \\times 0.88 = ₹110$।' },
      { en: 'Profit = **10%**.', bn: 'লাভ = **10%**।' },
    ],
    shortcut: {
      en: '$$25 - 12 - \\frac{25 \\times 12}{100} = 25 - 12 - 3 = 10\\%$$',
      bn: 'ক্রমিক পরিবর্তন: $$25 - 12 - \\frac{25 \\times 12}{100} = 10\\%$$',
    },
    traps: {
      0: {
        en: 'Subtracting the discount from the markup (25 − 12) ignores that the discount is taken on the larger marked price.',
        bn: 'মার্কআপ থেকে ছাড় বিয়োগ (25 − 12) করলে ভুল হয়, কারণ ছাড় নেওয়া হয় বড় ধার্যমূল্যের উপর।',
      },
    },
    stats: { attempts: 1890, correct: 1250 },
  }),
];
