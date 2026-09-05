/**
 * Dedicated landing pages for high-volume currency corridors.
 *
 * Search demand for "dollar to rupee" dwarfs "currency converter", and a single
 * generic page cannot rank for every pair. Each of these gets its own URL and
 * its own genuinely different copy.
 *
 * The copy matters: sixteen near-identical pages differing only in a currency
 * code is the doorway-page pattern Google demotes. Every entry below describes
 * a real corridor — who sends money along it and why — so the pages earn their
 * place instead of padding the sitemap.
 */
export interface CurrencyPair {
  /** URL slug, e.g. "usd-to-inr". */
  slug: string;
  from: string;
  to: string;
  /** Colloquial name people actually search: "Dollar to Rupee". */
  common: string;
  metaTitle: string;
  metaDescription: string;
  keywords: string[];
  /** Two paragraphs of corridor-specific context. */
  body: string[];
  /**
   * Questions that are true of THIS corridor only.
   *
   * The four FAQs rendered by the page are generated from a shared template, so
   * every corridor carried roughly 250 words of byte-identical answers against
   * about 77 words of unique body — leaving sibling pages 72-79% word-identical.
   * That is the near-duplicate pattern search engines demote, and a plausible
   * cause of "crawled, currently not indexed".
   *
   * These are additive: nothing was removed. They lean on facts that genuinely
   * differ between corridors — the currency's exchange-rate regime and the real
   * reason people use the route — rather than reworded filler, which would not
   * have helped.
   */
  extraFaqs: { question: string; answer: string }[];
}

export const CURRENCY_PAIRS: CurrencyPair[] = [
  {
    slug: "usd-to-inr",
    from: "USD", to: "INR",
    common: "Dollar to Rupee",
    metaTitle: "Dollar to Rupee - USD to INR Live Rate Today",
    metaDescription:
      "Convert US dollars to Indian rupees at today's live mid-market rate. See the reverse rate instantly and what banks actually charge.",
    keywords: ["dollar to rupee", "usd to inr", "1 usd to inr", "dollar rate today", "usd inr rate", "convert dollar to rupee"],
    body: [
      "The dollar-rupee rate is the most watched exchange rate in India, and for good reason: it prices everything from IT services exports and freelance invoices to the remittances sent home by the Indian diaspora, which is the largest in the world. When people say 'the rupee is falling', they almost always mean against the dollar.",
      "The figure here is the mid-market rate — the midpoint of the interbank market. It is the honest benchmark, but nobody sells dollars to you at it. A bank wire typically lands 1.5–3% below, and airport counters far worse, so treat this as the ceiling on what you should expect rather than the amount you will receive.",
    ],
    extraFaqs: [
      {
        question: "Does the dollar-rupee rate move much day to day?",
        answer:
          "Both currencies float, though the Reserve Bank of India intervenes to smooth sharp swings rather than to hold a level. Day-to-day movement is usually small; the meaningful changes show up over weeks, which is why watching the rate for a few days before a large transfer tells you more than watching it for a few hours.",
      },
      {
        question: "Is there a limit on sending dollars to India?",
        answer:
          "Money coming into India from abroad is not capped. Limits apply in the other direction, under India's Liberalised Remittance Scheme, so inbound transfers are constrained by your sending provider's own rules rather than by Indian regulation.",
      },
    ],
  },
  {
    slug: "inr-to-usd",
    from: "INR", to: "USD",
    common: "Rupee to Dollar",
    metaTitle: "Rupee to Dollar - INR to USD Live Rate Today",
    metaDescription:
      "Convert Indian rupees to US dollars at today's live mid-market rate. Useful for travel budgets, foreign fees, and outward remittances.",
    keywords: ["rupee to dollar", "inr to usd", "1 inr to usd", "convert rupee to dollar", "rupee dollar rate"],
    body: [
      "Converting rupees to dollars comes up for outward remittances — students paying overseas tuition, families supporting relatives abroad, and residents investing internationally under the Liberalised Remittance Scheme. It is also the calculation behind any dollar-denominated subscription or cloud bill you settle from an Indian account.",
      "Outward conversion carries costs inward transfers do not. Alongside the exchange margin, Indian outward remittances attract Tax Collected at Source above annual thresholds, and banks levy their own charges. Budget for the total landed cost, not just the rate shown here.",
    ],
    extraFaqs: [
      {
        question: "Is there a limit on sending rupees out of India?",
        answer:
          "Yes. India's Liberalised Remittance Scheme caps how much a resident individual may remit abroad per financial year, covering travel, education, investment and gifts together. Your bank applies this limit and will ask what the transfer is for, so the purpose you declare matters.",
      },
      {
        question: "Why is the outbound rate worse than the inbound one?",
        answer:
          "Sending rupees out involves more paperwork and fewer competing providers than the heavily contested inbound remittance market. Less competition and higher compliance cost both show up in the spread you are quoted.",
      },
    ],
  },
  {
    slug: "aed-to-inr",
    from: "AED", to: "INR",
    common: "Dirham to Rupee",
    metaTitle: "Dirham to Rupee - AED to INR Live Rate Today",
    metaDescription:
      "Convert UAE dirhams to Indian rupees at today's live rate. The busiest remittance corridor in the world, updated daily.",
    keywords: ["dirham to rupee", "aed to inr", "1 aed to inr", "uae dirham to indian rupee", "dubai to india money"],
    body: [
      "The UAE-to-India corridor is the largest remittance route on earth by volume, carrying tens of billions of dollars a year from a workforce of several million Indians in the Gulf. For most of them the dirham-rupee rate is not an abstraction — it directly determines how much reaches family at home each month.",
      "Because the dirham is pegged to the US dollar at a fixed rate, AED-INR moves almost entirely with the dollar-rupee rate rather than independently. That makes it unusually predictable: if you know where USD-INR is heading, you know where AED-INR is heading too.",
    ],
    extraFaqs: [
      {
        question: "Does timing a dirham transfer help?",
        answer:
          "Barely, in the way people expect. The dirham is pegged to the US dollar, so AED-INR moves almost entirely with USD-INR rather than on its own. Watching dirham-rupee is really watching dollar-rupee.",
      },
      {
        question: "Why are exchange houses often better than banks here?",
        answer:
          "This corridor carries enormous volume, and UAE exchange houses compete directly for it. That competition compresses margins in a way a general-purpose bank transfer usually cannot match.",
      },
    ],
  },
  {
    slug: "eur-to-inr",
    from: "EUR", to: "INR",
    common: "Euro to Rupee",
    metaTitle: "Euro to Rupee - EUR to INR Live Rate Today",
    metaDescription:
      "Convert euros to Indian rupees at today's live mid-market rate, with the reverse rate and typical bank margins explained.",
    keywords: ["euro to rupee", "eur to inr", "1 euro to inr", "euro rate today india", "convert euro to rupee"],
    body: [
      "Euro-rupee matters for trade with the European Union — India's largest trading bloc partner — and for the growing number of Indian students and professionals in Germany, France, and the Netherlands. It is also the rate behind European software and travel costs billed in euros.",
      "Unlike the dirham, the euro floats freely against the dollar, so EUR-INR moves on two independent forces at once: euro-dollar sentiment and dollar-rupee sentiment. That makes it noticeably more volatile than the pegged Gulf currencies, and worth checking close to the date you actually transact.",
    ],
    extraFaqs: [
      {
        question: "Does the euro rate differ between eurozone countries?",
        answer:
          "The underlying rate does not — the euro is one currency across the bloc. What differs is the sending bank's margin and fees, so the same transfer can cost noticeably different amounts from two different eurozone countries.",
      },
      {
        question: "Why does the euro move against the rupee even when nothing changes in India?",
        answer:
          "Because a rate is a ratio of two currencies. European Central Bank decisions move the euro side on their own, which shows up as a change in EUR-INR even on a quiet day for the rupee.",
      },
    ],
  },
  {
    slug: "gbp-to-inr",
    from: "GBP", to: "INR",
    common: "Pound to Rupee",
    metaTitle: "Pound to Rupee - GBP to INR Live Rate Today",
    metaDescription:
      "Convert British pounds to Indian rupees at today's live rate. Updated daily, with the reverse rate shown alongside.",
    keywords: ["pound to rupee", "gbp to inr", "1 pound to inr", "uk pound to indian rupee", "pound rate today"],
    body: [
      "The pound-rupee rate underpins one of the oldest migration and trade corridors between the two countries, covering a large British-Indian population, a steady flow of students to UK universities, and long-standing commercial ties.",
      "Sterling is among the more volatile major currencies, historically reacting sharply to domestic political and monetary news. For tuition fees or property transactions where the amount is large and the date is known in advance, that volatility is worth planning around rather than ignoring.",
    ],
    extraFaqs: [
      {
        question: "Why did the pound-rupee rate change so much over the last decade?",
        answer:
          "Both currencies float, and the pound has had several sharp repricings driven by domestic politics and interest-rate decisions. Long-run charts on this pair reflect events in Britain at least as much as events in India.",
      },
      {
        question: "Is a UK bank transfer or a specialist provider better?",
        answer:
          "Specialist remittance providers usually quote closer to the mid-market rate on this corridor. High-street banks tend to bundle their margin into the rate rather than charging an obvious fee.",
      },
    ],
  },
  {
    slug: "sar-to-inr",
    from: "SAR", to: "INR",
    common: "Riyal to Rupee",
    metaTitle: "Riyal to Rupee - SAR to INR Live Rate Today",
    metaDescription:
      "Convert Saudi riyals to Indian rupees at today's live rate — one of the largest remittance corridors to India.",
    keywords: ["riyal to rupee", "sar to inr", "1 sar to inr", "saudi riyal to indian rupee", "saudi to india money"],
    body: [
      "Saudi Arabia hosts one of the largest Indian expatriate populations anywhere, and the riyal-rupee rate is a monthly calculation for a very large number of households across Kerala, Uttar Pradesh, and Bihar.",
      "Like the dirham, the riyal is pegged to the US dollar, so this rate tracks dollar-rupee almost exactly. Day-to-day movement in SAR-INR is really dollar-rupee movement wearing a different label.",
    ],
    extraFaqs: [
      {
        question: "Does the riyal rate move independently?",
        answer:
          "No. The Saudi riyal has been pegged to the US dollar for decades, so riyal-rupee tracks dollar-rupee. Any movement you see is the rupee side moving, not the riyal.",
      },
      {
        question: "Does the day of the week affect a riyal transfer?",
        answer:
          "The rate itself does not change over the weekend because currency markets are closed, but settlement does. A transfer initiated Thursday evening in Saudi Arabia may not be processed until the following working week.",
      },
    ],
  },
  {
    slug: "cad-to-inr",
    from: "CAD", to: "INR",
    common: "Canadian Dollar to Rupee",
    metaTitle: "Canadian Dollar to Rupee - CAD to INR Rate",
    metaDescription:
      "Convert Canadian dollars to Indian rupees at today's live mid-market rate, updated daily and free to use.",
    keywords: ["cad to inr", "canadian dollar to rupee", "1 cad to inr", "canada to india money transfer"],
    body: [
      "Canada has become one of the largest destinations for Indian students and skilled migrants, which has made CAD-INR a rate a great many families now watch — for tuition payments going out and remittances coming back.",
      "The Canadian dollar is a commodity currency, moving with oil prices and global growth expectations. That gives CAD-INR a different rhythm from the Gulf pegs: it can drift meaningfully over a few months on energy markets alone.",
    ],
    extraFaqs: [
      {
        question: "Why does this corridor peak around certain months?",
        answer:
          "It carries a large share of student money. Volumes rise around Canadian university intake periods, when tuition and living costs are sent in larger single transfers than the typical monthly remittance.",
      },
      {
        question: "Does the Canadian dollar follow the US dollar?",
        answer:
          "Partly. Both are floating and Canada's economy is closely tied to the United States, so the two often move in the same direction — but the Canadian dollar is also sensitive to oil prices in a way the US dollar is not.",
      },
    ],
  },
  {
    slug: "aud-to-inr",
    from: "AUD", to: "INR",
    common: "Australian Dollar to Rupee",
    metaTitle: "Australian Dollar to Rupee - AUD to INR Rate",
    metaDescription:
      "Convert Australian dollars to Indian rupees at today's live rate. Free, updated daily, with reverse rate shown.",
    keywords: ["aud to inr", "australian dollar to rupee", "1 aud to inr", "australia to india money"],
    body: [
      "Australia's large Indian student and professional community makes AUD-INR a regularly checked rate, particularly around university fee deadlines at the start of each semester.",
      "The Australian dollar is closely tied to commodity exports and to Chinese demand in particular, so AUD-INR often moves on news that has nothing to do with either Australia or India directly.",
    ],
    extraFaqs: [
      {
        question: "Why does the Australian dollar swing more than most?",
        answer:
          "It is heavily influenced by commodity prices and by demand from Asia, which makes it one of the more volatile major currencies. For a large transfer, that volatility is worth a few days of watching.",
      },
      {
        question: "Does the time difference affect transfers?",
        answer:
          "It affects when a transfer is processed rather than the rate. Australian business hours fall largely outside Indian ones, so a transfer sent late in the Australian day often lands the following Indian working day.",
      },
    ],
  },
  {
    slug: "sgd-to-inr",
    from: "SGD", to: "INR",
    common: "Singapore Dollar to Rupee",
    metaTitle: "Singapore Dollar to Rupee - SGD to INR Rate",
    metaDescription:
      "Convert Singapore dollars to Indian rupees at today's live mid-market rate. Free and updated daily.",
    keywords: ["sgd to inr", "singapore dollar to rupee", "1 sgd to inr", "singapore to india money"],
    body: [
      "Singapore is a major hub for Indian professionals in finance and technology, and a significant source of both remittances and investment into India.",
      "The Singapore dollar is managed against a basket of currencies rather than left to float freely, which historically makes it steadier than most. That relative stability is useful if you are converting regularly rather than once.",
    ],
    extraFaqs: [
      {
        question: "Is the Singapore dollar pegged?",
        answer:
          "No, but it is not fully floating either. The Monetary Authority of Singapore manages it against a basket of currencies within an undisclosed band, which makes it steadier than a free-floating currency without being fixed.",
      },
      {
        question: "Are transfers from Singapore usually fast?",
        answer:
          "Singapore's payment infrastructure is among the quickest, and many providers on this route settle same-day. The delay, when there is one, is normally on the receiving side rather than the sending one.",
      },
    ],
  },
  {
    slug: "kwd-to-inr",
    from: "KWD", to: "INR",
    common: "Kuwaiti Dinar to Rupee",
    metaTitle: "Kuwaiti Dinar to Rupee - KWD to INR Rate",
    metaDescription:
      "Convert Kuwaiti dinars to Indian rupees at today's live rate. The world's highest-valued currency, updated daily.",
    keywords: ["kwd to inr", "kuwaiti dinar to rupee", "1 kwd to inr", "kuwait to india money"],
    body: [
      "The Kuwaiti dinar is the highest-valued currency in the world, so a single dinar converts to a large number of rupees. That makes small rate movements matter more per unit than in almost any other pair.",
      "Kuwait hosts a substantial Indian workforce, and the dinar is managed against a currency basket weighted heavily toward the US dollar — so this rate, too, largely follows dollar-rupee.",
    ],
    extraFaqs: [
      {
        question: "Why is one dinar worth so many rupees?",
        answer:
          "The Kuwaiti dinar is the highest-valued currency unit in the world. That is a matter of how the unit was originally denominated, not a measure of economic strength — it simply means small dinar amounts convert to large rupee ones, so rounding errors matter more here than in most corridors.",
      },
      {
        question: "Is the dinar pegged to the dollar?",
        answer:
          "Not directly. Kuwait pegs the dinar to an undisclosed basket of currencies rather than to the dollar alone, so KWD-INR does not track USD-INR as tightly as the dirham or riyal do.",
      },
    ],
  },
  {
    slug: "usd-to-eur",
    from: "USD", to: "EUR",
    common: "Dollar to Euro",
    metaTitle: "Dollar to Euro - USD to EUR Live Rate Today",
    metaDescription:
      "Convert US dollars to euros at today's live mid-market rate — the most traded currency pair in the world.",
    keywords: ["dollar to euro", "usd to eur", "1 usd to eur", "dollar euro rate", "convert usd to euro"],
    body: [
      "EUR-USD is the most heavily traded currency pair on the planet, accounting for roughly a fifth of all foreign exchange turnover. Its liquidity means spreads are the tightest available anywhere, and the mid-market rate is unusually close to what large players actually transact at.",
      "The pair moves mainly on the interest-rate gap between the US Federal Reserve and the European Central Bank. When one is expected to cut or raise before the other, this rate is where that expectation shows up first.",
    ],
    extraFaqs: [
      {
        question: "Why is this the most traded currency pair?",
        answer:
          "It links the world's two largest reserve currencies, so it carries the deepest liquidity of any pair. That depth is why the spread between buying and selling is normally the tightest you will find anywhere.",
      },
      {
        question: "What moves this rate most?",
        answer:
          "The interest-rate gap between the US Federal Reserve and the European Central Bank. When one is expected to move rates before the other, this pair usually reprices well ahead of the actual decision.",
      },
    ],
  },
  {
    slug: "gbp-to-usd",
    from: "GBP", to: "USD",
    common: "Pound to Dollar",
    metaTitle: "Pound to Dollar - GBP to USD Live Rate Today",
    metaDescription:
      "Convert British pounds to US dollars at today's live mid-market rate, with the reverse rate shown alongside.",
    keywords: ["pound to dollar", "gbp to usd", "1 gbp to usd", "cable rate", "convert pound to dollar"],
    body: [
      "Known in trading rooms as 'cable' — after the transatlantic telegraph cable that once carried its quotes — GBP-USD is among the oldest continuously quoted exchange rates in existence.",
      "It remains one of the more volatile major pairs, responding sharply to Bank of England decisions and UK political news. For anything large, checking close to the transaction date is worth more here than in steadier pairs.",
    ],
    extraFaqs: [
      {
        question: "Why is this pair nicknamed cable?",
        answer:
          "The name dates to the transatlantic telegraph cable that carried the sterling-dollar rate between London and New York in the nineteenth century. The nickname stuck long after the cable did.",
      },
      {
        question: "Is sterling more volatile than the dollar?",
        answer:
          "Generally yes. The dollar is the world's reserve currency and tends to be bought during uncertainty, while sterling reacts more sharply to domestic political and economic news, so most of this pair's movement usually comes from the sterling side.",
      },
    ],
  },
];

export function getPairBySlug(slug: string): CurrencyPair | undefined {
  return CURRENCY_PAIRS.find((p) => p.slug === slug);
}
