// Boss & Friends: 14-day launch calendar (Mon Sep 28 to Sun Oct 11, 2026, America/Vancouver).
// Single source of truth: render.mjs builds the slides, calendar.csv/md and the
// posting packs from this file. Edit copy here, then re-run `npm run render`.
//
// Photo slides use `slot` names. After the audit (see pull-media.mjs), the chosen
// photo for each slot is saved as raw/selected/<slot>.jpg and the slide fills itself.
// "site-A" is the hero site: the Cranbrook childcare centre (Unitech Construction
// Management, CM). Its photo slots are named cranbrook-NN.
//
// Rules: no phone, email or street address anywhere. City-level location only.

const POUR_CTA = `Want the full 30-point Before The Pour checklist? Comment POUR and we'll DM it to you. Free, no email, no sign-up.`;
const HIRE_CTA = `Want all 10 questions plus the quote comparison sheet? Comment HIRE and we'll DM it to you. Free, no email, no sign-up.`;
const SAFE_CTA = `Want all 5 toolbox talks plus a crew sign-in sheet? Comment SAFE and we'll DM them to you. Free, no email, no sign-up.`;

const tagsIG = {
  core: "#constructionlife #concrete #foundation #bcconstruction #vancouverconstruction #fraservalley",
  trades: "#bluecollar #tradeslife #formwork #rebar",
  home: "#homeowner #newbuild #renovation #buildingahome",
  safety: "#constructionsafety #worksafebc #toolboxtalk",
};
const tagsTT = "#constructiontok #concrete #bluecollar #tradesman";

export const posts = [
  // ───────────────────────────── WEEK 1: POUR ─────────────────────────────
  {
    id: "p01-meet-the-crew", week: 1, date: "2026-09-28", time: "19:30",
    pillar: "Crew / Friends", type: "carousel", keyword: null,
    platforms: ["Instagram", "Facebook", "LinkedIn", "TikTok"],
    hook: "We're Boss & Friends. What trade are you in?",
    slides: [
      { layout: "photo", slot: "crew-group", kicker: "Lower Mainland, BC", title: "We're Boss<br>&amp; <em>Friends</em>", sub: "Built right from the ground up." },
      { layout: "cover", kicker: "What this page is", title: "Real jobs.<br>Real crew.<br><em>No fluff.</em>", sub: "Every week: what actually happens on site. The prep, the pour, the mistakes to avoid, and the free checklists we use ourselves." },
      { layout: "photo", slot: "site-wide", kicker: "Where you'll find us", title: "On site before <em>sunrise</em>" },
      { layout: "photo", slot: "work-action", kicker: "What we do", title: "From dig<br>to <em>done</em>" },
      { layout: "question", title: "What trade<br>are <em>you</em> in?", sub: "Builder, homeowner, apprentice, plumber, sparky, framer: drop it in the comments. This page is for all of us." },
    ],
    captions: {
      Instagram: `We're Boss & Friends Construction, a Lower Mainland crew that builds right from the ground up.

This page is going to be real jobs and real crew, with no fluff:
→ what actually happens on site, start to finish
→ the checks that save a pour (and the mistakes that cost one)
→ free checklists we use ourselves, yours for a comment

It's for everyone who builds: builders, homeowners, apprentices and every trade on site.

So tell us: what trade are you in? 👇

${tagsIG.core} ${tagsIG.trades}`,
      Facebook: `Hi, we're Boss & Friends Construction. 👋

We're a Lower Mainland crew, and this page is where we'll show real jobs from start to finish: what happens before the concrete, on pour day, and after. We'll also share the free checklists we use ourselves.

Whether you're building a home, renovating, or working in the trades, you're in the right place.

What trade are you in? Or are you planning a build? Tell us below 👇`,
      LinkedIn: `Boss & Friends Construction is now on LinkedIn.

We're a Lower Mainland crew, and we'll use this page to show how we run our sites: prep, inspections, pour day and the trade coordination that keeps a schedule on track.

We'll also share the working checklists we use, free for any builder, GC or trade partner who wants them.

If you build in the Fraser Valley or Metro Vancouver, we'd like to connect. What trade are you in?

#construction #BCconstruction #concrete`,
      TikTok: `We're Boss & Friends 🏗️ Real jobs, real crew, no fluff. What trade are you in? 👇 ${tagsTT}`,
    },
    firstComment: `We'll go first: we're the crew that's on site before sunrise. Now you 👇`,
    alt: "Boss & Friends Construction crew and job sites in BC's Lower Mainland, introducing the page and asking viewers what trade they work in.",
    story: "Re-share the post to Stories with a poll: 'Builder / Homeowner / Trades / Just curious'.",
  },
  {
    id: "p02-7-checks-before-the-pour", week: 1, date: "2026-09-29", time: "12:10",
    pillar: "Pour Day Explained", type: "carousel", keyword: "POUR",
    platforms: ["Instagram", "Facebook", "LinkedIn", "TikTok"],
    hook: "7 checks before the pour. Once it's in, it's permanent.",
    slides: [
      { layout: "cover", kicker: "Save this for pour day", title: "7 checks<br>before the<br><em>pour</em>", size: "xl", sub: "Once it's in, it's permanent. Run these the day before.", chips: ["Builders", "Crews", "Every trade", "Homeowners"] },
      { layout: "point", num: "01", title: "Inspection signed off", body: "The municipal footing or foundation inspection has passed, plus the engineer's field review if the design calls for one. <b>No sign-off, no pour.</b>" },
      { layout: "point", num: "02", title: "Forms braced &amp; square", body: "Check the diagonals. Walk the full run and push on it. <b>Blowouts start where nobody checked.</b>" },
      { layout: "point", num: "03", title: "Rebar cover right", body: "Chairs and dobies hold the steel off the dirt and off the forms. That's typically 75&nbsp;mm where it's cast against earth; confirm on your drawings." },
      { layout: "point", num: "04", title: "Every trade's sleeves in", body: "Plumbing, electrical, gas, HVAC. Anchor bolts and hold-downs set with templates. <b>Get each trade's OK before the truck.</b>", chips: ["Plumber", "Electrician", "Framer", "HVAC"] },
      { layout: "point", num: "05", title: "Bottom clean", body: "No mud, standing water, debris, frost or ice in the forms or the footing trench." },
      { layout: "point", num: "06", title: "Weather plan", body: "Heading under 5&nbsp;°C? Have blankets and heat ready. Hot or windy? Have a curing plan so it doesn't dry out too fast." },
      { layout: "point", num: "07", title: "Photograph everything", body: "Rebar, sleeves, embeds, all before they're buried. <b>Those photos are your only record.</b>" },
      { layout: "cta", title: "Want all<br><em>30 checks?</em>", keyword: "POUR", bullets: ["The full 2-page checklist", "A sign-off sheet for every trade", "Free. No email. Sent to your DMs"] },
    ],
    captions: {
      Instagram: `Once concrete's in, every mistake is permanent. 🧱

These are the 7 things we check before a single truck shows up:
1. Inspection signed off
2. Forms braced & square
3. Rebar cover right
4. Every trade's sleeves in
5. Bottom clean, with no water, mud or frost
6. A weather plan
7. Photos of everything before it's buried

Builders, crews, plumbers, sparkies, framers: this one's for all of you. Homeowners, now you know what to ask about.

${POUR_CTA}

Save this for your next pour 📌

${tagsIG.core} ${tagsIG.trades}`,
      Facebook: `Planning a build or working in the trades? Once the concrete is in, you can't take it back.

Here are the 7 checks we run before every pour (swipe through). Homeowners: you don't need to check the rebar yourself, but you can ask your contractor "did the inspection pass?" and "can I see the photos before the pour?"

${POUR_CTA}`,
      LinkedIn: `Most expensive foundation problems are decided the day before the pour.

Our pre-pour check covers 7 things: inspection sign-off, form bracing, rebar cover, every trade's sleeves and embeds, a clean bottom, a weather plan, and a photo record of everything before it's buried.

Item 4 is where schedules slip. A missed plumbing sleeve or a misplaced hold-down becomes core drilling, an engineer's letter, or a re-pour. We get every trade's sign-off before the first truck.

We've put the full 30-point version (with a trade sign-off sheet) into a free 2-page checklist. Comment POUR and I'll send it over, or share it with your site super.

#construction #concrete #BCconstruction`,
      TikTok: `7 checks before the pour 🧱 #4 is where most jobs go wrong. Comment POUR for the full 30-point checklist (free) ${tagsTT}`,
    },
    firstComment: POUR_CTA,
    alt: "Carousel: seven checks before a concrete pour. Inspection sign-off, braced forms, rebar cover, trade sleeves, a clean bottom, a weather plan and photos, with an offer to comment POUR for the full checklist.",
    story: "Share slide 1 to Stories with a question sticker: 'What's on YOUR pre-pour list?'",
  },
  {
    id: "p03-site-story-part-1", week: 1, date: "2026-10-01", time: "19:30",
    pillar: "Job Proof / Site Story", type: "carousel", keyword: null,
    platforms: ["Instagram", "Facebook", "LinkedIn"],
    hook: "Site series Part 1: from dirt to footings.",
    slides: [
      { layout: "photo", slot: "site-A-01-before", kicker: "Site series · Part 1 of 3", title: "From dirt<br>to <em>footings</em>", sub: "Follow this one from dig to done." },
      { layout: "photo", slot: "site-A-02-dig", kicker: "Step 1", title: "Dig &amp; <em>layout</em>", sub: "Gridlines, elevations and setbacks checked before a single form goes up." },
      { layout: "photo", slot: "site-A-03-footings", kicker: "Step 2", title: "<em>Footings</em>", sub: "Bearing on undisturbed soil. Everything above depends on this." },
      { layout: "question", title: "What's the first thing you check on a <em>new site</em>?", sub: "Part 2 drops Saturday: the stuff that gets buried forever." },
    ],
    captions: {
      Instagram: `Site series, Part 1 of 3: from dirt to footings. 📍 [CITY], BC

Everyone sees the finished building. Nobody sees this part, and it's the part everything else stands on.

Swipe → dig & layout → footings.

Question for the trades: what's the first thing YOU check when you walk onto a new site? 👇

Part 2 drops Saturday.

${tagsIG.core}`,
      Facebook: `We're following one of our sites from start to finish. Part 1: from dirt to footings. 📍 [CITY], BC

This is the part nobody sees once the house is up, and it's the part everything stands on. Part 2 is on Saturday.

What would you want to see on a job site? Ask us anything below 👇`,
      LinkedIn: `Site series, Part 1 of 3 (📍 [CITY], BC): from dirt to footings.

Layout and footings set the tolerance for every trade that follows. We verify gridlines, elevations and setbacks against the site plan before forming, and confirm bearing before we pour.

Part 2: forms, steel and the trade coordination before the pour.

#construction #foundations #BCconstruction`,
    },
    firstComment: `Ours: walk the whole site, then check the layout against the plan. Then coffee. What's yours? ☕`,
    alt: "Photo carousel of a Boss & Friends job site going from bare ground to excavation and footings.",
    story: "Behind-the-scenes clip or photo from the same site with a 'Part 2 Saturday' countdown sticker.",
  },
  {
    // First real-job post. Manpreet's personal LinkedIn; plain site photos, logo card on the cover's sky.
    id: "li01-cranbrook-rebar-inspection", week: 1, date: "2026-10-02", time: "07:30",
    pillar: "Job Proof / Site Story", type: "multi-image", keyword: null,
    platforms: ["LinkedIn"],
    hook: "Rebar inspection: passed. Footings on Cranbrook's new childcare centre are ready for concrete.",
    slides: [
      { layout: "logoCover", cardTop: true, slot: "cranbrook-01", title: "Rebar inspection", badge: "PASSED", sub: "Boss and Friends Construction Ltd. · Cranbrook, BC" },
      { layout: "clean", slot: "cranbrook-02" },
      { layout: "clean", slot: "cranbrook-03" },
      { layout: "clean", slot: "cranbrook-04" },
      { layout: "clean", slot: "cranbrook-05" },
    ],
    captions: {
      LinkedIn: `Rebar inspection: passed. ✅
Footings on Cranbrook's new childcare centre are tied, inspected and ready for concrete.

This one means something to our crew. When it opens, this building will hold 123 childcare spaces for local families. Every bar in these footings is carrying that.

What we check before we call the inspector:
→ Bar size and spacing to the drawings
→ Laps tied, dowels set and secured
→ Cover: chairs holding the steel off the dirt and off the forms
→ Forms clean, braced and on line

Proud of the BAF crew for getting it right the first time, and thank you to @Unitech Construction Management Ltd. for running a well-organized, safe site.

Next up: the pour. Follow along.

👷 Supers and PMs: what's the one thing you always check before calling for rebar inspection? Tell me below.

🏗️ Building in BC? Boss and Friends Construction (BAF) does forming, rebar, concrete finishing and damp proofing. DM me your project and timeline and we'll get you a price.

#Construction #Rebar #Concrete #Cranbrook #BAFConstruction`,
    },
    firstComment: `Pour-day photos coming soon. Big thanks to the Unitech team on site 🙌`,
    // LinkedIn takes alt text per image (Edit → Alt text on each photo).
    alt: `1) Boss and Friends crew on the formed and reinforced footings of Cranbrook's new childcare centre, beside Western Financial Place.
2) A long footing form full of tied rebar, with two people walking the rebar inspection.
3) A BAF worker in a hard hat and hi-vis tying rebar inside the footing forms.
4) The full footing layout, formed and reinforced, ready for concrete.
5) The crew talking through the next steps at the edge of the excavation.`,
    story: "Not for LinkedIn. The BAF TikTok clip (tt01) covers the same milestone.",
  },
  {
    // Raw clip posted from the iPhone in the TikTok app; no slides. On-screen text is added in TikTok.
    id: "tt01-cranbrook-rebar-clip", week: 1, date: "2026-10-02", time: "12:15",
    pillar: "Job Proof / Raw", type: "video", keyword: null,
    platforms: ["TikTok"],
    hook: "Rebar inspection day 👷 → PASSED ✅ Follow for pour day.",
    slides: [],
    captions: {
      TikTok: `Rebar inspection ✅ PASSED on Cranbrook's new childcare centre. Pour day is next. Follow so you don't miss it 👀 #BAFConstruction #rebar #concrete #construction #cranbrook`,
    },
    firstComment: null,
    alt: "Raw site clip of the footing rebar on the Cranbrook childcare centre.",
    story: "On-screen text (TikTok Text tool): 0–2s \"Rebar inspection day 👷\"; last 3s \"PASSED ✅ Follow for pour day 👀\". Backup CTAs: \"Rate this rebar 1–10 👇\" or \"Tag your rebar crew 👇\". Use the best of the 0:17 / 0:20 / 0:24 clips from Sep 30 – Oct 1; export with Location off (Share → Options).",
  },
  {
    id: "p04-concrete-myths", week: 1, date: "2026-10-02", time: "12:10",
    pillar: "Myth vs Fact", type: "carousel", keyword: null,
    platforms: ["Instagram", "Facebook", "TikTok"],
    hook: "4 concrete myths builders, homeowners and crew all fall for.",
    slides: [
      { layout: "cover", kicker: "Heard on site", title: "4 concrete<br><em>myths</em>", size: "xl", sub: "Builders, homeowners and crew all fall for these." },
      { layout: "mythfact", myth: "More water makes it easier to place. No harm done.", fact: "Extra water on site weakens concrete and adds shrinkage cracks. Fix workability in the mix design, not with the hose." },
      { layout: "mythfact", myth: "Concrete dries out to get hard.", fact: "It <b>cures</b>: a chemical reaction that needs moisture. Let it dry out too early and you lose strength." },
      { layout: "mythfact", myth: "Rebar makes concrete crack-proof.", fact: "Concrete still cracks. Rebar carries the tension and holds the cracks tight, which is why cover and placement matter." },
      { layout: "mythfact", myth: "If it looks fine on top, the foundation's fine.", fact: "What matters is buried: rebar, sleeves, bearing soil. That's why you inspect and photograph <b>before</b> the pour." },
      { layout: "question", title: "Which one did <em>you</em> hear on site?", sub: "Drop the worst concrete myth you've heard in the comments." },
    ],
    captions: {
      Instagram: `4 concrete myths we hear on site all the time 👀

❌ More water = no harm
❌ Concrete "dries" to get hard
❌ Rebar = crack-proof
❌ Looks fine on top = foundation's fine

Swipe for the facts →

Which one have you heard? Worst myth wins 👇

${tagsIG.core} ${tagsIG.trades}`,
      Facebook: `Homeowners and builders hear these all the time. Swipe through: which one did you believe? 👀

Our favourite: "concrete dries to get hard." It actually cures, a chemical reaction that needs moisture. Tell us the worst one you've heard below 👇`,
      TikTok: `4 concrete myths 👀 Which one did you hear on site? #3 fools everyone ${tagsTT} #concretemyths`,
    },
    firstComment: `Worst one we've heard: "just add water, it'll be fine." It won't. Yours? 👇`,
    alt: "Carousel of four concrete myths and facts, about adding water, curing versus drying, rebar and cracking, and inspecting buried work before the pour.",
    story: "Quiz sticker: 'Concrete gets hard by... A) drying B) curing'. Answer: curing.",
  },
  {
    id: "p05-site-story-part-2", week: 1, date: "2026-10-03", time: "09:00",
    pillar: "Job Proof / Site Story", type: "carousel", keyword: "POUR",
    platforms: ["Instagram", "Facebook", "LinkedIn"],
    hook: "Everything in this photo disappears on pour day.",
    slides: [
      { layout: "photo", slot: "site-A-04-rebar", kicker: "Site series · Part 2 of 3", title: "Gone <em>tomorrow</em>", sub: "Everything in this photo gets buried on pour day." },
      { layout: "photo", slot: "site-A-05-forms", kicker: "Forms", title: "Square, plumb, <em>braced</em>" },
      { layout: "photo", slot: "site-A-06-sleeves", kicker: "Steel &amp; sleeves", title: "Every trade <em>signs off</em>" },
      { layout: "cta", title: "Our pre-pour<br><em>checklist</em>", keyword: "POUR", bullets: ["30 checks, 2 pages", "Trade sign-off sheet", "Free. No email. Sent to your DMs"] },
    ],
    captions: {
      Instagram: `Site series, Part 2 of 3. Everything in this photo disappears on pour day. 📍 [CITY], BC

Forms, rebar, sleeves, anchors: once the concrete's in, it's permanent. So before the truck shows up, every trade signs off and we photograph everything.

${POUR_CTA}

Part 3 (pour day) drops next Saturday.

${tagsIG.core} ${tagsIG.trades}`,
      Facebook: `Part 2 of our site series: everything you see here gets buried on pour day. 📍 [CITY], BC

That's why we check it all, and photograph it all, before the concrete arrives.

${POUR_CTA}`,
      LinkedIn: `Site series, Part 2 of 3: the day before the pour.

Forms, reinforcing, sleeves and embeds, with every trade signing off before the first truck. We photograph everything so the owner, GC and inspector have a record of what's buried.

Our 30-point pre-pour checklist is free for any builder or trade partner. Comment POUR.

#construction #concrete #qualitycontrol`,
    },
    firstComment: POUR_CTA,
    alt: "Photo carousel of formwork, rebar and plumbing sleeves on a job site the day before a concrete pour, with an offer to comment POUR for a free checklist.",
    story: "Poll: 'Would you have caught every missing sleeve?' Yes / Honestly no",
  },

  // ─────────────────────── WEEK 2: HIRE + SAFE go live ───────────────────────
  {
    id: "p06-before-after", week: 2, date: "2026-10-05", time: "19:30",
    pillar: "Job Proof", type: "carousel", keyword: null,
    platforms: ["Instagram", "Facebook", "TikTok", "LinkedIn"],
    hook: "Day 1 vs day ?. Guess how many days.",
    slides: [
      { layout: "photo", slot: "ba-A-before", kicker: "Before", title: "Day <em>1</em>" },
      { layout: "photo", slot: "ba-A-after", kicker: "After", title: "Day <em>?</em>" },
      { layout: "question", title: "Guess how many <em>days</em>", sub: "Closest guess in the comments gets a shout-out. We'll post the answer tonight." },
    ],
    captions: {
      Instagram: `Day 1 → Day ? 👀

Guess how many working days this one took. Closest guess gets a shout-out in our Stories 👇

${tagsIG.core}`,
      Facebook: `Before and after 👀 How many working days do you think this took? Closest guess gets a shout-out!`,
      TikTok: `Day 1 vs day ?? Guess in the comments 👇 ${tagsTT} #beforeandafter`,
      LinkedIn: `Before and after on one of our recent sites. The number of working days is in the comments. Planning, inspections and trade coordination drive that number more than crew size does.

#construction #BCconstruction`,
    },
    firstComment: `Answer goes up tonight. Guess first 😉`,
    alt: "Before and after photos of the same Boss & Friends job site, asking viewers to guess how many days the work took.",
    story: "Reply to the closest guess in Stories that night, with the real number.",
  },
  {
    id: "p07-before-you-hire", week: 2, date: "2026-10-06", time: "12:10",
    pillar: "Homeowner Guide", type: "carousel", keyword: "HIRE",
    platforms: ["Facebook", "Instagram"],
    hook: "5 questions to ask before you hire any contractor.",
    slides: [
      { layout: "cover", kicker: "Homeowners, save this", title: "Before you<br>hire <em>any</em><br>contractor", sub: "5 of the 10 questions a good contractor answers without blinking.", chips: ["Homeowners", "Renos", "New builds"] },
      { layout: "point", num: "01", title: "Are you registered with WorkSafeBC?", body: "Ask for a clearance letter; they're free. If they're not registered, <b>you can end up on the hook for their unpaid premiums.</b>" },
      { layout: "point", num: "02", title: "Can I see your insurance certificate?", body: "The name matches the company and the dates are current. If something gets damaged, this pays, not you." },
      { layout: "point", num: "03", title: "Who's pulling the permit?", body: "The contractor should. <b>Red flag:</b> \"we don't need one\", or asking you to pull it in your name." },
      { layout: "point", num: "04", title: "What's the payment schedule?", body: "Pay for work that's done, tied to milestones, not dates. Ask how they handle the <b>10% holdback</b> under BC's Builders Lien Act." },
      { layout: "point", num: "05", title: "How do changes work?", body: "A written change order, with the price, <b>before</b> the work. No surprise bills at the end." },
      { layout: "cta", title: "Get all <em>10</em><br>+ the quote<br>comparison sheet", keyword: "HIRE", bullets: ["All 10 questions, explained", "Red flags to walk away from", "Free. No email. Sent to your DMs"] },
    ],
    captions: {
      Facebook: `Hiring a contractor this year? Save this. 📌

A good contractor answers every one of these without blinking:
1️⃣ Are you registered with WorkSafeBC? (Ask for a clearance letter.)
2️⃣ Can I see your insurance certificate?
3️⃣ Who's pulling the permit?
4️⃣ What's the payment schedule, and how do you handle the 10% holdback?
5️⃣ How do changes work?

That's 5 of the 10. ${HIRE_CTA}

Know someone planning a build or reno? Tag them 👇`,
      Instagram: `Hiring a contractor? Save this before you sign anything 📌

5 of the 10 questions a good contractor answers without blinking. Swipe →

${HIRE_CTA}

Tag someone who's planning a build 👇

${tagsIG.home} #bchomes #vancouverhomes`,
    },
    firstComment: HIRE_CTA,
    alt: "Carousel for homeowners: five questions to ask before hiring a contractor, covering WorkSafeBC registration, insurance, permits, payment schedule and change orders, with an offer to comment HIRE for all ten.",
    story: "Question sticker: 'What's the one thing you wish you'd asked your contractor?'",
  },
  {
    id: "p08-pour-day-mistakes", week: 2, date: "2026-10-07", time: "06:45",
    pillar: "Costly Mistakes", type: "carousel", keyword: null,
    platforms: ["Instagram", "Facebook", "LinkedIn", "TikTok"],
    hook: "5 pour-day mistakes that turn into expensive fixes.",
    slides: [
      { layout: "cover", kicker: "Pour day", title: "5 mistakes<br>that turn into<br><em>expensive fixes</em>", size: "md" },
      { layout: "point", num: "01", title: "Pouring before sign-off", body: "Skipping or rushing the inspection. Worst case, you break out what you just poured." },
      { layout: "point", num: "02", title: "Not enough bracing", body: "A form blowout mid-pour means concrete on the ground, a crew scrambling, and a wall that's not where it should be." },
      { layout: "point", num: "03", title: "Missing sleeves", body: "Forgot the plumbing sleeve? Now it's core drilling through a finished footing or wall, if the engineer allows it at all." },
      { layout: "point", num: "04", title: "Adding water on site", body: "Easier to place, weaker when it cures. Fix workability in the mix, not with the hose." },
      { layout: "point", num: "05", title: "No weather plan", body: "A cold night on fresh concrete with no blankets or heat can cost you the strength you paid for." },
      { layout: "question", title: "What's the worst you've <em>seen</em>?", sub: "Tell us in the comments. No names, no sites. Let's all learn from it." },
    ],
    captions: {
      Instagram: `5 pour-day mistakes that turn into expensive fixes 💸

1. Pouring before sign-off
2. Not enough bracing
3. Missing sleeves
4. Adding water on site
5. No weather plan

We've seen every one of these on other people's jobs. What's the worst YOU'VE seen? No names, no sites 👇

${tagsIG.core} ${tagsIG.trades}`,
      Facebook: `5 pour-day mistakes that turn into expensive fixes. Swipe through 💸

Homeowners: #3 is why you want every trade to sign off before the concrete truck arrives.

Trades: what's the worst one you've seen? No names 👇`,
      LinkedIn: `Five pour-day failures we see across the industry, and what each one costs:

1. Pouring before sign-off: potential break-out
2. Inadequate bracing: blowouts, rework, out-of-tolerance walls
3. Missing sleeves: core drilling and engineering review
4. Water added on site: reduced strength, more shrinkage cracking
5. No cold-weather plan: lost strength on fresh concrete

All five are prevented the day before, not on the day. What would you add?

#construction #concrete #riskmanagement`,
      TikTok: `5 pour-day mistakes that cost 💸 #3 hurts the most. What's the worst you've seen? ${tagsTT}`,
    },
    firstComment: `Honourable mention: nobody booked the pump. 🙃 What else belongs on this list?`,
    alt: "Carousel of five pour-day mistakes: pouring before sign-off, weak bracing, missing sleeves, adding water on site, and no cold-weather plan.",
    story: "Slider sticker: 'How many of these have you seen on site?'",
  },
  {
    id: "p09-concrete-burns-safe", week: 2, date: "2026-10-08", time: "12:10",
    pillar: "Crew Safety", type: "carousel", keyword: "SAFE",
    platforms: ["Instagram", "TikTok", "Facebook"],
    hook: "Wet concrete burns, and it won't hurt until hours later.",
    slides: [
      { layout: "cover", kicker: "For every crew", title: "Wet concrete<br><em>burns.</em>", size: "xl", sub: "It won't hurt until hours later. Here's what we talk about before every pour.", chips: ["Workers", "Foremen", "Apprentices"] },
      { layout: "point", num: "01", title: "Gloves &amp; boots, done right", body: "Waterproof gloves. Pants <b>over</b> your boots, not tucked in. Concrete in your boot sits on your skin all day." },
      { layout: "point", num: "02", title: "Eyes covered", body: "On the hose, the screed and finishing. One splash is all it takes." },
      { layout: "point", num: "03", title: "Wash it off fast", body: "On your skin? Clean water, right away. Soaked clothes? Change them." },
      { layout: "cta", title: "5 five-minute<br><em>toolbox talks</em>", keyword: "SAFE", bullets: ["Burns, trenches, rebar, pump trucks, silica", "Crew sign-in sheet included", "Free. No email. Sent to your DMs"] },
    ],
    captions: {
      Instagram: `Wet concrete burns, and you won't feel it until hours later. ⚠️

What we cover before every pour:
→ waterproof gloves, pants OVER boots
→ eye protection on the hose and screed
→ wash it off fast, change soaked clothes

${SAFE_CTA}

Tag an apprentice who needs to see this 👇

${tagsIG.safety} ${tagsIG.trades}`,
      TikTok: `Wet concrete burns 🔥 and you won't feel it till later. Comment SAFE for 5 free toolbox talks ${tagsTT} #constructionsafety`,
      Facebook: `Anyone working around concrete, or with someone who does: wet concrete causes chemical burns that often don't hurt until hours later.

Gloves, pants over boots, eye protection, and wash it off fast.

${SAFE_CTA}`,
    },
    firstComment: SAFE_CTA,
    alt: "Carousel on wet concrete burns: wear waterproof gloves with pants over boots, cover your eyes, and wash concrete off skin quickly, with an offer to comment SAFE for five free toolbox talks.",
    story: "Tag-an-apprentice sticker plus a 'Comment SAFE on the post' link sticker.",
  },
  {
    id: "p10-pour-day-thanksgiving", week: 2, date: "2026-10-10", time: "09:00",
    pillar: "Job Proof / Crew", type: "carousel", keyword: null,
    platforms: ["Instagram", "Facebook", "LinkedIn", "TikTok"],
    hook: "Site series Part 3: pour day. Thankful for the crew.",
    slides: [
      { layout: "photo", slot: "site-A-07-pour", kicker: "Site series · Part 3 of 3", title: "Pour <em>day</em>" },
      { layout: "photo", slot: "site-A-08-crew", kicker: "Early starts", title: "The crew that <em>shows up</em>" },
      { layout: "photo", slot: "site-A-09-done", kicker: "Done", title: "Built <em>right</em>.", sub: "From the ground up." },
      { layout: "question", kicker: "Happy Thanksgiving", title: "Thankful for<br>the <em>crew</em>", sub: "Tag someone who's been on an early pour with you." },
    ],
    captions: {
      Instagram: `Site series, Part 3 of 3: pour day. 📍 [CITY], BC

Weeks of prep, then everything happens in a few hours. None of it happens without this crew.

Happy Thanksgiving weekend from all of us at Boss & Friends 🍂 Tag someone who's been on an early pour with you 👇

${tagsIG.core} ${tagsIG.trades}`,
      Facebook: `The finale of our site series: pour day! 📍 [CITY], BC

Weeks of prep come down to a few hours, and a crew that shows up before sunrise to get it right. Happy Thanksgiving weekend from all of us at Boss & Friends 🍂

Tag someone you're thankful to work with 👇`,
      LinkedIn: `Site series, Part 3 of 3: pour day.

Weeks of layout, forming, reinforcing and trade coordination come down to a few hours. The execution is the crew's, and this Thanksgiving weekend we're grateful for ours.

Thank you to the trade partners, inspectors and suppliers who make every pour on schedule possible.

#construction #concrete #BCconstruction`,
      TikTok: `Pour day 🧱 weeks of prep, a few hours to get it right. Happy Thanksgiving to the crew 🍂 ${tagsTT} #pourday`,
    },
    firstComment: `Who's got the best early-pour story? Keep it clean 😅👇`,
    alt: "Photo carousel of pour day on a Boss & Friends site, the crew at work and the finished foundation, with a Thanksgiving thank-you to the crew.",
    story: "Crew thank-you story: one photo per crew member (only those who OK'd it), with 'Thankful for' text.",
  },
];
