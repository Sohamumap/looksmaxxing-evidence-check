// Builds the home page and one page per practice from the data below.
// Everything is written into the HTML at build time, with no JavaScript on the page,
// so search engines and AI crawlers can read all of it.
import { writeFileSync, mkdirSync, readFileSync, existsSync } from "node:fs";

const items = [
  { name: "Daily sunscreen (SPF 30+)", evidence: "strong", risk: "low",
    verdict: "Do it. The cheapest thing on this list that is proven to slow skin ageing.",
    detail: "A randomised trial in Australian adults found people told to use sunscreen daily showed less skin ageing after 4.5 years than people who used it when they felt like it.",
    watch: "Use enough of it and reapply outdoors. That is where most people fail.",
    q: "sunscreen photoaging randomized trial" },
  { name: "Topical retinoids (tretinoin, adapalene)", evidence: "strong", risk: "medium",
    verdict: "Works for acne and sun-aged skin. Start slowly.",
    detail: "Decades of controlled trials support retinoids for acne and for fine lines and uneven tone caused by sun damage.",
    watch: "Peeling and redness in the first weeks are common. It makes skin more sun-sensitive. Not for use in pregnancy. Tretinoin needs a prescription in most countries.",
    q: "tretinoin photoaging randomized controlled trial" },
  { name: "Topical minoxidil", evidence: "strong", risk: "medium",
    verdict: "Works for male pattern hair loss, but only for as long as you keep using it.",
    detail: "Controlled trials show 5% minoxidil regrows or keeps more hair than placebo in male pattern hair loss.",
    watch: "Early shedding is common. Scalp irritation happens. Stop and you lose the gains within months. Keep it away from cats, for whom it is poisonous.",
    q: "topical minoxidil androgenetic alopecia randomized trial" },
  { name: "Finasteride", evidence: "strong", risk: "medium",
    verdict: "The best-studied pill for male pattern hair loss. A decision to make with a doctor.",
    detail: "Large long-running trials show it slows hair loss and regrows hair in most men who take it.",
    watch: "Prescription only. A minority of men report sexual side effects, and some report low mood. Talk it through with a doctor rather than buying it from a grey-market seller.",
    q: "finasteride male androgenetic alopecia randomized trial adverse effects" },
  { name: "Lifting weights and eating enough protein", evidence: "strong", risk: "low",
    verdict: "Do it. The biggest visible change most men can make.",
    detail: "Resistance training reliably builds muscle and changes body shape, with strong evidence across ages and starting points.",
    watch: "Progress is measured in months, not weeks. Learn the movements before adding weight.",
    q: "resistance training muscle hypertrophy meta-analysis" },
  { name: "Creatine monohydrate", evidence: "strong", risk: "low",
    verdict: "One of the few supplements that does what it says.",
    detail: "Among the most studied supplements. It modestly improves strength and muscle gain when combined with training.",
    watch: "Some early weight gain is water. Ask a doctor first if you have kidney disease.",
    q: "creatine supplementation resistance training meta-analysis" },
  { name: "Peroxide teeth whitening", evidence: "mixed", risk: "low",
    verdict: "It whitens in short trials. The evidence is weaker than the marketing.",
    detail: "A 2018 Cochrane review of 71 trials found home peroxide products whitened teeth more than placebo over 2 weeks to 6 months. It rated the certainty of that evidence low to very low.",
    watch: "Tooth sensitivity and sore gums were the most common side effects, mild and passing. It does not change the colour of crowns or fillings.",
    q: "tooth whitening hydrogen peroxide randomized trial sensitivity" },
  { name: "Home microneedling for hair loss", evidence: "mixed", risk: "medium",
    verdict: "Promising, not settled. Clinic-grade results do not transfer automatically to a roller at home.",
    detail: "A few small trials found microneedling plus minoxidil beat minoxidil alone. The studies are small and the methods vary.",
    watch: "Infection and scarring if the tool is not sterile or you go too deep or too often.",
    q: "microneedling minoxidil androgenetic alopecia trial" },
  { name: "Mewing (tongue posture)", evidence: "weak", risk: "low",
    verdict: "No good evidence it reshapes an adult face, and orthodontists warn it can backfire.",
    detail: "No controlled trial shows that tongue posture changes adult jaw or cheekbone structure. The American Association of Orthodontists says no current research suggests any benefit to the jawline.",
    watch: "The same body warns that pressing hard can push teeth out of line, cause bite problems and strain the jaw joint. Nobody has measured how often that happens. Before-and-after photos are not evidence: weight loss, age, lighting and camera angle all change a jawline.",
    q: "mewing OR orthotropics" },
  { name: "Hard chewing and jaw trainers", evidence: "weak", risk: "medium",
    verdict: "A six-month trial found a stronger bite and no change in jaw shape.",
    detail: "A 2024 randomised trial had adults chew gum three times a day for six months. Bite force went up. Chewing muscle thickness and jaw shape did not change.",
    watch: "Dentists warn of jaw joint pain, clicking, headaches and tooth wear with hard chewing devices. Stop if your jaw hurts.",
    q: "masticatory muscle training masseter hypertrophy temporomandibular" },
  { name: "Steroids and SARMs for looks", evidence: "strong", risk: "high",
    verdict: "They build muscle. The price can be your heart, hormones and fertility.",
    detail: "The muscle-building effect is real. So is the damage, which is why this is graded on risk, not on whether it works.",
    watch: "Heart disease, shutdown of your own testosterone, infertility, mood changes. SARMs are unapproved drugs, and products sold online often contain something other than what is on the label.",
    q: "anabolic androgenic steroids cardiovascular adverse effects" },
  { name: "Bonesmashing", evidence: "none", risk: "high",
    verdict: "Do not do this.",
    detail: "There is no evidence that hitting your face makes bone grow in a better shape. Bone does not remodel that way.",
    watch: "Fractures, nerve damage, lasting swelling and a lopsided face. If you have already done it and have numbness or pain, see a doctor.",
    q: "bonesmashing OR \"bone smashing\"" },
];

// Topic, and what new evidence would change each grade.
const extra = {
  "Daily sunscreen (SPF 30+)": ["skin", "A long trial finding no difference in skin ageing between daily and occasional users."],
  "Topical retinoids (tretinoin, adapalene)": ["skin", "The benefit is settled. The risk grade would drop if a gentler form matched tretinoin in head-to-head trials."],
  "Topical minoxidil": ["hair", "Long trials showing the gains last after you stop. Today they do not."],
  "Finasteride": ["hair", "Better long-term data on how often side effects continue after stopping. That is the real open question."],
  "Lifting weights and eating enough protein": ["fitness", "Many trials point the same way, so the grade is unlikely to move. What stays open is detail: how much, how often, and for whom."],
  "Creatine monohydrate": ["fitness", "Long-term safety data in teenagers, who are under-studied."],
  "Peroxide teeth whitening": ["face", "Larger, longer trials run to a standard method. The Cochrane authors asked for exactly that."],
  "Home microneedling for hair loss": ["hair", "Larger trials using home rollers, not clinic devices, that also report infection rates."],
  "Mewing (tongue posture)": ["face", "One controlled trial in adults with before-and-after scans. None exists yet."],
  "Hard chewing and jaw trainers": ["face", "A trial of the hard trainers sold online, not ordinary gum, that also tracks jaw joint pain."],
  "Steroids and SARMs for looks": ["fitness", "The harm is well documented. Better data would sharpen how often it happens and at what dose, not whether it does."],
  "Bonesmashing": ["face", "A controlled study showing safe, lasting bone change from repeated impact. None exists, and one could not be run ethically."],
};
// One named study per card where a well-known one exists. Titles and ids were confirmed against PubMed's records.
const studies = {
  "Daily sunscreen (SPF 30+)": [23732711, "Hughes et al., Annals of Internal Medicine, 2013. Sunscreen and prevention of skin aging: a randomized trial.", "Adults under 55 in sunny Queensland, Australia. Results may differ for other skin types and climates."],
  "Topical retinoids (tretinoin, adapalene)": [18046911, "Mukherjee et al., Clinical Interventions in Aging, 2006. Retinoids in the treatment of skin aging: an overview of clinical efficacy and safety.", "A review article from 2006, not a new trial."],
  "Topical minoxidil": [12196747, "Olsen et al., Journal of the American Academy of Dermatology, 2002. A randomized clinical trial of 5% topical minoxidil versus 2% topical minoxidil and placebo.", "It ran for 48 weeks, so it does not show what happens over years."],
  "Finasteride": [9777765, "Kaufman et al., Journal of the American Academy of Dermatology, 1998. Finasteride in the treatment of men with androgenetic alopecia.", "Men aged 18 to 41 with mild to moderate hair loss, in a study funded by the drug's maker."],
  "Lifting weights and eating enough protein": [28698222, "Morton et al., British Journal of Sports Medicine, 2018. A systematic review and meta-analysis of protein supplementation and resistance training gains.", "It pools many trials of different quality, and it is about protein supplements on top of training, not training alone."],
  "Creatine monohydrate": [28615996, "Kreider et al., Journal of the International Society of Sports Nutrition, 2017. Position stand: safety and efficacy of creatine supplementation.", "A position statement by a sports nutrition society, not a single trial."],
  "Home microneedling for hair loss": [23960389, "Dhurat et al., International Journal of Trichology, 2013. A randomized evaluator blinded study of effect of microneedling in androgenetic alopecia: a pilot study.", "A pilot study at one clinic, done by clinicians rather than at home."],
  "Peroxide teeth whitening": [30562408, "Eachempati et al., Cochrane Database of Systematic Reviews, 2018. Home-based chemically-induced whitening (bleaching) of teeth in adults.", "The trials ran from 2 weeks to 6 months, and 67 of the 71 had an unclear risk of bias."],
  "Mewing (tongue posture)": ["https://aaoinfo.org/whats-trending/is-mewing-bad-for-you/", "American Association of Orthodontists. Is mewing bad for you?", "A professional body's statement, not a trial. It gives no figures on how often harm happens."],
  "Hard chewing and jaw trainers": [39215439, "Jung et al., Journal of Oral Rehabilitation, 2024. Effects of gum chewing training on occlusal force, masseter muscle thickness and mandibular shape: a randomised controlled clinical trial.", "58 healthy adults chewing ordinary gum, not the hard rubber trainers sold online."],
  "Bonesmashing": [38278441, "Grillo et al., Journal of Stomatology, Oral and Maxillofacial Surgery, 2024. Urgent concern regarding 'bone smashing', a dangerous trend on TikTok.", "A published warning in a surgery journal, not a study of outcomes."],
  "Steroids and SARMs for looks": [28533317, "Baggish et al., Circulation, 2017. Cardiovascular toxicity of illicit anabolic-androgenic steroid use.", "An observational study of long-term users, so it shows a link, not proof of cause."],
};
const asks = {
  "Topical retinoids (tretinoin, adapalene)": "Do topical retinoids work, and are they safe?",
  "Lifting weights and eating enough protein": "Does lifting weights with enough protein work, and is it safe?",
  "Creatine monohydrate": "Does creatine work, and is it safe?",
  "Hard chewing and jaw trainers": "Do hard chewing and jaw trainers work, and are they safe?",
  "Steroids and SARMs for looks": "Do steroids and SARMs work for looks, and are they safe?",
};
for (const i of items) {
  i.study = studies[i.name];
  const short = i.name.replace(/\s*\(.*?\)/g, "");
  i.ask = asks[i.name] || `Does ${short[0].toLowerCase() + short.slice(1)} work, and is it safe?`;
  [i.cat, i.change] = extra[i.name];
  i.id = i.name.toLowerCase().replace(/\(.*?\)/g, "").trim().replace(/[^a-z0-9]+/g, "-");
}

const label = { strong: "Strong evidence", mixed: "Mixed evidence", weak: "Weak evidence", none: "No evidence" };
const riskLabel = { low: "Low risk", medium: "Medium risk", high: "High risk" };
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
const pubmed = (q) => "https://pubmed.ncbi.nlm.nih.gov/?term=" + encodeURIComponent(q);

// Paper counts from PubMed's free public API (no key, no paid scraper).
// counts.json keeps the last good number for each search. A failed request never overwrites it,
// and the page then says the refresh was unavailable and shows the date the number is from.
const today = new Date().toISOString().slice(0, 10);
const countsFile = new URL("./counts.json", import.meta.url);
const counts = existsSync(countsFile) ? JSON.parse(readFileSync(countsFile, "utf8")) : {};
let failed = 0;
for (const i of items) {
  try {
    const r = await fetch("https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&retmode=json&rettype=count&term=" + encodeURIComponent(i.q));
    if (!r.ok) throw new Error("HTTP " + r.status);
    const count = Number((await r.json()).esearchresult.count);
    if (!Number.isInteger(count)) throw new Error("no count in response");
    counts[i.id] = { count, date: today };
    i.stale = false;
  } catch (e) {
    console.warn("PubMed refresh failed for", i.id, "-", e.message);
    i.stale = true;
    failed++;
  }
  i.count = counts[i.id];
  await new Promise((ok) => setTimeout(ok, 400));
}
writeFileSync(countsFile, JSON.stringify(counts, null, 2) + "\n");

const base = "https://sohamumap.github.io/looksmaxxing-evidence-check/";

// The home page is a short, scannable list grouped by verdict. The detail lives on one page per practice.
const groups = [
  { key: "worth", title: "Worth doing", intro: "Good evidence, and little that can go wrong." },
  { key: "tradeoff", title: "Works, with trade-offs", intro: "Good evidence, but side effects or a prescription are involved. Read the page before you start." },
  { key: "unproven", title: "Unproven", intro: "The evidence is thin, mixed or missing." },
  { key: "danger", title: "Dangerous", intro: "The harm is real and can be permanent." },
];
const groupOf = (i) => i.risk === "high" ? "danger" : i.evidence !== "strong" ? "unproven" : i.risk === "low" ? "worth" : "tradeoff";
const tags = (i) => `<p class="tags"><span class="tag e-${i.evidence}">${label[i.evidence]}</span><span class="tag r-${i.risk}">${riskLabel[i.risk]}</span></p>`;

const sections = groups.map((g) => `
  <section class="group g-${g.key}">
    <h2>${g.title}</h2>
    <p class="intro">${g.intro}</p>
    <ul class="rows">${items.filter((i) => groupOf(i) === g.key).map((i) => `
      <li id="${i.id}">
        <a class="name" href="${i.id}/">${esc(i.name)}</a>
        ${tags(i)}
        <p class="verdict">${esc(i.verdict)}</p>
      </li>`).join("")}
    </ul>
  </section>`).join("\n");

const css = `
:root{--bg:#f6f4ef;--ink:#16181c;--mute:#5c6470;--card:#fff;--line:#dedad0;--good:#1f6f4a;--mid:#8a6100;--bad:#a3261d;--none:#55595f}
@media (prefers-color-scheme:dark){:root{--bg:#111316;--ink:#eceae4;--mute:#a0a6b0;--card:#1a1d21;--line:#2c3036;--good:#6fcf9b;--mid:#e3b34d;--bad:#ff8a7d;--none:#b0b5bc}}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--ink);font:18px/1.6 Georgia,"Times New Roman",serif}
main{max-width:720px;margin:0 auto;padding:48px 20px 72px}
a{color:inherit}
h1{font-size:clamp(30px,5.5vw,44px);line-height:1.12;margin:0 0 16px;letter-spacing:-.01em}
.lede{font-size:20px;color:var(--mute);margin:0 0 32px}
.doodle{width:88px;height:52px;display:block;margin:0 0 12px}
.ui,.tags,.intro,.legend,.crumb,.meta,summary,.next{font-family:system-ui,-apple-system,"Segoe UI",sans-serif}
.legend{display:grid;grid-template-columns:1fr 1fr;gap:24px;margin:0 0 8px;padding:20px 0;border-top:1px solid var(--line);border-bottom:1px solid var(--line);font-size:15px;line-height:1.5;color:var(--mute)}
.legend strong{display:block;color:var(--ink);font-size:13px;text-transform:uppercase;letter-spacing:.06em;margin-bottom:4px}
.group{margin-top:48px}
.group h2{font-size:26px;line-height:1.2;margin:0 0 4px}
.intro{font-size:15px;color:var(--mute);margin:0 0 12px}
.rows{list-style:none;margin:0;padding:0 0 0 18px;border-left:3px solid var(--none)}
.g-worth .rows{border-color:var(--good)}.g-tradeoff .rows{border-color:var(--mid)}.g-danger .rows{border-color:var(--bad)}
.rows li{display:grid;grid-template-columns:1fr auto;gap:2px 16px;padding:16px 0;border-top:1px solid var(--line)}
.rows li:first-child{border-top:0}
.name{font-size:20px;font-weight:700;text-decoration:none;line-height:1.3}
.name:hover{text-decoration:underline}
.rows .verdict{grid-column:1;margin:0;font-size:16px;line-height:1.5;color:var(--mute)}
.rows .tags{grid-column:2;grid-row:1 / span 2;flex-direction:column;align-items:flex-end;margin:4px 0 0}
.tags{display:flex;flex-wrap:wrap;gap:6px;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.05em;margin:0 0 24px}
.tag{padding:3px 8px;border:1px solid currentColor;border-radius:4px;white-space:nowrap}
.e-strong,.r-low{color:var(--good)}.e-mixed,.r-medium{color:var(--mid)}.e-weak,.e-none{color:var(--none)}.r-high{color:var(--bad)}
footer{margin-top:64px;font-size:16px;color:var(--mute)}
details{border-top:1px solid var(--line)}
details:last-of-type{border-bottom:1px solid var(--line)}
summary{cursor:pointer;padding:14px 0;font-size:15px;font-weight:600;color:var(--ink)}
details p{margin:0 0 16px}
.meta{font-size:13px;margin-top:20px}
.crumb{font-size:14px;margin:0 0 24px;color:var(--mute)}
article h2{font:600 13px/1.4 system-ui,-apple-system,"Segoe UI",sans-serif;text-transform:uppercase;letter-spacing:.06em;color:var(--mute);margin:36px 0 6px}
article p{margin:0 0 12px}
.answer{font-size:21px;line-height:1.45;font-weight:700;margin:0 0 8px;padding:16px 20px;background:var(--card);border:1px solid var(--line);border-left:4px solid var(--ink);border-radius:6px}
.limit{color:var(--mute);font-size:16px}
.next{display:flex;justify-content:space-between;gap:16px;margin-top:48px;padding-top:20px;border-top:1px solid var(--line);font-size:15px}
@media (max-width:560px){.legend{grid-template-columns:1fr;gap:14px}.rows li{grid-template-columns:1fr}.rows .tags{grid-column:1;grid-row:auto;flex-direction:row;align-items:center;margin:4px 0}}
`;

const doodle = `<svg class="doodle" viewBox="0 0 120 70" role="img" aria-label="Hand-drawn balance scale"><g fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M60 8c.6 16-.4 34 .3 50M44 60c11-2.4 22-2 33 .2M19 21c27-5.5 55-3.4 83 3.6"/><path d="M19 21c-3.4 7-6.6 13.6-9 21 6.4 5.6 14 5 19.6-.5-2.800-7.300-6.400-14-10.600-20.500M102 24.600c-3 7.400-5.800 14-8 21.400 6 5 13.400 4.600 18.600-1-2.600-7-6-13.600-10.600-20.400"/><circle cx="60" cy="7" r="2.600"/></g></svg>`;

const title = "Does it work? 12 looksmaxxing practices graded by evidence and risk";
const desc = "Sunscreen, minoxidil, mewing, bonesmashing and 8 more looksmaxxing practices, each graded on how good the evidence is and how risky it is. No hype.";
const list = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  name: title,
  itemListElement: items.map((i, n) => ({ "@type": "ListItem", position: n + 1, name: i.name, url: base + i.id + "/" })),
};

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<meta name="description" content="${desc}">
<link rel="canonical" href="${base}">
<meta property="og:type" content="article">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${desc}">
<meta name="twitter:card" content="summary">
<script type="application/ld+json">${JSON.stringify(list)}</script>
<style>${css}</style>
</head>
<body>
<main>
  ${doodle}
  <h1>Does it work? And what could it cost you?</h1>
  <p class="lede">Twelve things men try in order to look better, sorted from worth doing to dangerous.</p>
  <div class="legend">
    <p><strong>Evidence</strong>How good the research is. Strong means repeated controlled trials in people.</p>
    <p><strong>Risk</strong>How badly it can go wrong, and whether the damage can be undone.</p>
  </div>
${sections}
  <footer>
    <details>
      <summary>Why two grades instead of one score</summary>
      <p>Because they come apart. Steroids build muscle and can wreck your heart. Sunscreen is about as safe as anything here and has a long trial behind it. One score would blur the two questions together.</p>
    </details>
    <details>
      <summary>How the grades were decided</summary>
      <p>"Strong" means repeated controlled trials in people. "Mixed" means a few small or inconsistent trials. "Weak" and "none" mean the claim rests on theory, anecdotes or before-and-after photos. Each practice has its own page with a named source, that source's limit, and what new evidence would change the grade.</p>
    </details>
    <details>
      <summary>Refreshed is not the same as reviewed</summary>
      <p>A script re-runs each PubMed search every week and updates the paper count on each page. That number shows how much research exists, not how good it is. If a search fails, the page keeps the last good number and says so. The grades were written once, on 11 October 2026, and are not re-checked automatically. No doctor has reviewed them.</p>
    </details>
    <details>
      <summary>How this was built</summary>
      <p>Made by Soham Umap with Claude Code as a demo for looksmaxxing.guide, in a 45-minute test window. The AI wrote the code and the first draft of every entry. My calls: keep evidence and risk as two separate grades, pull live numbers from a free public source instead of a paid scraper, and name a source only where its record was confirmed. Code: <a href="https://github.com/Sohamumap/looksmaxxing-evidence-check">github.com/Sohamumap/looksmaxxing-evidence-check</a>.</p>
    </details>
    <details>
      <summary>What changed after the test, and what was wrong</summary>
      <p><strong>In the 45-minute window:</strong> the 12 entries and grades, the two-grade idea, paper counts from PubMed, and eight named studies confirmed to exist and match their titles. They were not all read in full.</p>
      <p><strong>Later the same day:</strong> the layout was simplified because the first version was cluttered.</p>
      <p><strong>After an outside review, three AI-drafted claims were checked against their sources and corrected:</strong></p>
      <p>Teeth whitening was graded "strong evidence". The 2018 Cochrane review rates the certainty low to very low, so it is now "mixed" and has moved out of "Worth doing".</p>
      <p>Mewing was called "harmless". The American Association of Orthodontists names possible harms, so that word is gone.</p>
      <p>Hard chewing was said to thicken the chewing muscles. The one randomised trial found no change in muscle thickness or jaw shape, so the entry now says that.</p>
      <p>The other nine entries have not had the same check yet.</p>
    </details>
    <p class="meta">General information, not medical advice.</p>
  </footer>
</main>
</body>
</html>
`;
writeFileSync(new URL("./index.html", import.meta.url), html);

// One page per practice, so each question has its own address for search.
items.forEach((i, n) => {
  const q = i.ask;
  const answer = `${label[i.evidence]}, ${riskLabel[i.risk].toLowerCase()}. ${i.verdict}`;
  const ld = { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: [{ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: `${answer} ${i.detail} What can go wrong: ${i.watch}` } }] };
  const next = items[(n + 1) % items.length];
  const source = i.study
    ? `<p><a href="${typeof i.study[0] === "number" ? "https://pubmed.ncbi.nlm.nih.gov/" + i.study[0] + "/" : i.study[0]}" rel="noopener">${esc(i.study[1])}</a></p>
    <p class="limit">Its limit: ${esc(i.study[2])}</p>`
    : `<p>There is no single good study to point to. That absence is part of the grade.</p>`;
  const page = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(q)}</title>
<meta name="description" content="${esc(answer)}">
<link rel="canonical" href="${base}${i.id}/">
<script type="application/ld+json">${JSON.stringify(ld)}</script>
<style>${css}</style>
</head>
<body>
<main>
  <p class="crumb"><a href="../">All 12 practices</a></p>
  <article>
    <h1>${esc(q)}</h1>
    ${tags(i)}
    <p class="answer">${esc(i.verdict)}</p>
    <h2>What the evidence says</h2>
    <p>${esc(i.detail)}</p>
    <h2>What can go wrong</h2>
    <p>${esc(i.watch)}</p>
    <h2>What would change this grade</h2>
    <p>${esc(i.change)}</p>
    <h2>Where to start reading</h2>
    ${source}
    <p class="limit"><a href="${pubmed(i.q)}" rel="noopener">Search PubMed yourself</a>${i.count ? `. ${i.count.count.toLocaleString("en")} papers matched this search on ${i.count.date}. That shows how much research exists, not how good it is.${i.stale ? " The latest refresh was unavailable, so this is the last number we have." : ""}` : ". The paper count is unavailable right now."}</p>
  </article>
  <p class="next"><a href="../">All 12 practices</a><a href="../${next.id}/">Next: ${esc(next.name)}</a></p>
  <footer>
    <p class="meta">Grade written 11 October 2026. Not reviewed by a doctor. General information, not medical advice.</p>
  </footer>
</main>
</body>
</html>
`;
  mkdirSync(new URL(`./${i.id}/`, import.meta.url), { recursive: true });
  writeFileSync(new URL(`./${i.id}/index.html`, import.meta.url), page);
});
console.log("built home page and", items.length, "practice pages;", failed, "PubMed refreshes failed");
