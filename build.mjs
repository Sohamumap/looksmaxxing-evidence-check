// Builds index.html from the data below.
// Deliberate choice: every card and the FAQ schema are written into the HTML at build time,
// so search engines and AI crawlers (which often don't run JavaScript) can read all of it.
// JavaScript is only used for the filter buttons.
import { writeFileSync, mkdirSync } from "node:fs";

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
  { name: "Peroxide teeth whitening", evidence: "strong", risk: "low",
    verdict: "Works on natural teeth. Follow the instructions.",
    detail: "Peroxide-based strips and trays whiten teeth in controlled trials.",
    watch: "Tooth sensitivity and sore gums are common and usually pass. It does not change the colour of crowns or fillings.",
    q: "tooth whitening hydrogen peroxide randomized trial sensitivity" },
  { name: "Home microneedling for hair loss", evidence: "mixed", risk: "medium",
    verdict: "Promising, not settled. Clinic-grade results do not transfer automatically to a roller at home.",
    detail: "A few small trials found microneedling plus minoxidil beat minoxidil alone. The studies are small and the methods vary.",
    watch: "Infection and scarring if the tool is not sterile or you go too deep or too often.",
    q: "microneedling minoxidil androgenetic alopecia trial" },
  { name: "Mewing (tongue posture)", evidence: "weak", risk: "low",
    verdict: "Harmless, but no good evidence it reshapes an adult face.",
    detail: "There are no controlled trials showing that holding your tongue on the roof of your mouth changes adult jaw or cheekbone structure.",
    watch: "The main cost is time and false hope. Before-and-after photos online mostly show weight loss, age, lighting and camera angle.",
    q: "tongue posture craniofacial adult orthotropics evidence" },
  { name: "Hard chewing and jaw trainers", evidence: "weak", risk: "medium",
    verdict: "Little to gain, and a real chance of jaw pain.",
    detail: "Heavy chewing may slightly thicken the chewing muscles. There is no good evidence it changes jawbone shape.",
    watch: "Jaw joint pain, clicking, headaches and tooth wear. Stop if your jaw hurts.",
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
    q: "facial fracture blunt trauma complications" },
];

// Topic, and what new evidence would change each grade.
const extra = {
  "Daily sunscreen (SPF 30+)": ["skin", "A long trial finding no difference in skin ageing between daily and occasional users."],
  "Topical retinoids (tretinoin, adapalene)": ["skin", "The benefit is settled. The risk grade would drop if a gentler form matched tretinoin in head-to-head trials."],
  "Topical minoxidil": ["hair", "Long trials showing the gains last after you stop. Today they do not."],
  "Finasteride": ["hair", "Better long-term data on how often side effects continue after stopping. That is the real open question."],
  "Lifting weights and eating enough protein": ["fitness", "Nothing realistic. This is as settled as it gets."],
  "Creatine monohydrate": ["fitness", "Long-term safety data in teenagers, who are under-studied."],
  "Peroxide teeth whitening": ["face", "Evidence of lasting enamel damage at normal doses would raise the risk grade."],
  "Home microneedling for hair loss": ["hair", "Larger trials using home rollers, not clinic devices, that also report infection rates."],
  "Mewing (tongue posture)": ["face", "One controlled trial in adults with before-and-after scans. None exists yet."],
  "Hard chewing and jaw trainers": ["face", "A trial that measures jawbone, not just muscle, and tracks jaw joint pain."],
  "Steroids and SARMs for looks": ["fitness", "Nothing on the harm. The open question is only how often it happens, and at what dose."],
  "Bonesmashing": ["face", "Nothing plausible. The claimed mechanism does not match how bone heals."],
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
  "Steroids and SARMs for looks": [28533317, "Baggish et al., Circulation, 2017. Cardiovascular toxicity of illicit anabolic-androgenic steroid use.", "An observational study of long-term users, so it shows a link, not proof of cause."],
};
const studyHtml = (i) => i.study ? `<p class="watch"><strong>Start with this study:</strong> <a href="https://pubmed.ncbi.nlm.nih.gov/${i.study[0]}/" rel="noopener">${esc(i.study[1])}</a> <em>Its limit:</em> ${esc(i.study[2])}</p>` : `<p class="watch"><strong>No single good study to point to.</strong> That absence is part of the grade.</p>`;
for (const i of items) {
  i.study = studies[i.name];
  [i.cat, i.change] = extra[i.name];
  i.id = i.name.toLowerCase().replace(/\(.*?\)/g, "").trim().replace(/[^a-z0-9]+/g, "-");
}

const label = { strong: "Strong evidence", mixed: "Mixed evidence", weak: "Weak evidence", none: "No evidence" };
const riskLabel = { low: "Low risk", medium: "Medium risk", high: "High risk" };
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
const pubmed = (q) => "https://pubmed.ncbi.nlm.nih.gov/?term=" + encodeURIComponent(q);

// Live data from PubMed free public API (no key, no paid scraper). Runs at build time; a weekly GitHub Action rebuilds.
const checked = new Date().toISOString().slice(0, 10);
for (const i of items) {
  try {
    const r = await fetch("https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&retmode=json&rettype=count&term=" + encodeURIComponent(i.q));
    i.count = Number((await r.json()).esearchresult.count) || 0;
  } catch { i.count = 0; }
  await new Promise((ok) => setTimeout(ok, 400));
}

const cards = items.map((i) => `
    <article class="card" id="${i.id}" data-evidence="${i.evidence}" data-risk="${i.risk}" data-cat="${i.cat}">
      <h2><a href="#${i.id}" title="Link to this card">${esc(i.name)}</a></h2>
      <p class="tags"><span class="tag e-${i.evidence}">${label[i.evidence]}</span><span class="tag r-${i.risk}">${riskLabel[i.risk]}</span></p>
      <p class="verdict">${esc(i.verdict)}</p>
      <p>${esc(i.detail)}</p>
      <p class="watch"><strong>Watch out:</strong> ${esc(i.watch)}</p>
      <p class="watch"><strong>What would change this grade:</strong> ${esc(i.change)}</p>
      ${studyHtml(i)}
      <p class="src"><a href="${i.id}/">Full page</a> · <a href="${pubmed(i.q)}" rel="noopener">Search PubMed yourself</a>${i.count ? ` · ${i.count.toLocaleString("en")} papers match · search refreshed ${checked}` : ""}</p>
    </article>`).join("\n");

const faq = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: items.map((i) => ({
    "@type": "Question",
    name: `Does ${i.name.toLowerCase()} work, and is it safe?`,
    acceptedAnswer: { "@type": "Answer", text: `${label[i.evidence]}, ${riskLabel[i.risk].toLowerCase()}. ${i.verdict} ${i.detail} Watch out: ${i.watch}` },
  })),
};

const title = "Does it work? 12 looksmaxxing practices graded by evidence and risk";
const desc = "Sunscreen, minoxidil, mewing, bonesmashing and 8 more looksmaxxing practices, each graded on how good the evidence is and how risky it is. No hype.";

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<meta name="description" content="${desc}">
<meta property="og:type" content="article">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${desc}">
<meta name="twitter:card" content="summary">
<script type="application/ld+json">${JSON.stringify(faq)}</script>
<style>
:root{--bg:#f6f4ef;--ink:#16181c;--mute:#5c6470;--card:#fff;--line:#dedad0;--good:#1f6f4a;--mid:#8a6100;--bad:#a3261d;--none:#55595f}
@media (prefers-color-scheme:dark){:root{--bg:#111316;--ink:#eceae4;--mute:#a0a6b0;--card:#1a1d21;--line:#2c3036;--good:#6fcf9b;--mid:#e3b34d;--bad:#ff8a7d;--none:#b0b5bc}}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--ink);font:17px/1.55 Georgia,"Times New Roman",serif}
main{max-width:980px;margin:0 auto;padding:32px 16px 64px}
h1{font-size:clamp(28px,5vw,44px);line-height:1.1;margin:0 0 12px;letter-spacing:-.01em}
.lede{color:var(--mute);max-width:62ch;margin:0 0 24px}
.filters{display:flex;flex-wrap:wrap;gap:8px;margin:0 0 8px;font-family:system-ui,sans-serif}
.filters button{font:inherit;font-size:14px;padding:8px 14px;border:1px solid var(--line);background:var(--card);color:var(--ink);border-radius:999px;cursor:pointer}
.filters button[aria-pressed=true]{background:var(--ink);color:var(--bg);border-color:var(--ink)}
.count{font:14px system-ui,sans-serif;color:var(--mute);margin:0 0 20px}
.grid{display:grid;gap:16px;grid-template-columns:repeat(auto-fill,minmax(290px,1fr))}
.card{background:var(--card);border:1px solid var(--line);border-radius:10px;padding:20px}
.card[hidden]{display:none}
.card h2{font-size:21px;line-height:1.2;margin:0 0 10px}
.card h2 a{text-decoration:none}
.doodle{width:96px;height:56px;color:var(--ink);display:block;margin:0 0 8px}
.card:target{outline:2px solid var(--ink)}
.card p{margin:0 0 10px}
.tags{display:flex;flex-wrap:wrap;gap:6px;font:600 12px system-ui,sans-serif;text-transform:uppercase;letter-spacing:.04em}
.tag{padding:3px 8px;border:1px solid currentColor;border-radius:4px}
.e-strong,.r-low{color:var(--good)}.e-mixed,.r-medium{color:var(--mid)}.e-weak,.e-none{color:var(--none)}.r-high{color:var(--bad)}
.verdict{font-weight:700}
.watch{font-size:15px;color:var(--mute)}
.src{font:14px system-ui,sans-serif;margin:0}
a{color:inherit}
footer{margin-top:40px;padding-top:20px;border-top:1px solid var(--line);font-size:15px;color:var(--mute);max-width:70ch}
</style>
</head>
<body>
<main>
  <svg class="doodle" viewBox="0 0 120 70" role="img" aria-label="Hand-drawn balance scale weighing evidence against risk"><g fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M60 8c.6 16-.4 34 .3 50M44 60c11-2.4 22-2 33 .2M19 21c27-5.5 55-3.4 83 3.6"/><path d="M19 21c-3.4 7-6.6 13.6-9 21 6.4 5.6 14 5 19.600-.5-2.800-7.300-6.400-14-10.600-20.500M102 24.600c-3 7.400-5.800 14-8 21.400 6 5 13.400 4.600 18.600-1-2.600-7-6-13.600-10.600-20.400"/><circle cx="60" cy="7" r="2.600"/></g></svg>
  <h1>Does it work? And what could it cost you?</h1>
  <p class="lede">Twelve things men try in order to look better, each given two separate grades: how good the evidence is, and how risky it is. They are separate on purpose. Steroids work and are dangerous. Mewing is safe and does very little.</p>
  <div class="filters" role="group" aria-label="Filter the list">
    <button data-f="all" aria-pressed="true">All</button>
    <button data-f="worth" aria-pressed="false">Worth doing</button>
    <button data-f="doctor" aria-pressed="false">Works, with trade-offs</button>
    <button data-f="unproven" aria-pressed="false">Unproven</button>
    <button data-f="danger" aria-pressed="false">Dangerous</button>
  </div>
  <div class="filters" role="group" aria-label="Filter by topic">
    <button data-c="all" aria-pressed="true">Any topic</button>
    <button data-c="skin" aria-pressed="false">Skin</button>
    <button data-c="hair" aria-pressed="false">Hair</button>
    <button data-c="fitness" aria-pressed="false">Fitness</button>
    <button data-c="face" aria-pressed="false">Face and teeth</button>
  </div>
  <p class="count" id="count" aria-live="polite">Showing all ${items.length}.</p>
  <div class="grid">${cards}
  </div>
  <footer>
    <p><strong>How the grades work.</strong> "Strong" means repeated controlled trials in people. "Mixed" means a few small or inconsistent trials. "Weak" and "none" mean the claim rests on theory, anecdotes or before-and-after photos. Risk is graded on how badly it can go wrong and whether the damage can be undone.</p>
    <p><strong>Refreshed is not the same as reviewed.</strong> A script re-runs each PubMed search every week and updates the paper count. That number shows how much research exists, not how good it is. The grades themselves were written once, on 11 October 2026, and are not re-checked automatically. No doctor has reviewed them.</p>
    <p><strong>How this was built.</strong> Made by Soham Umap with Claude Code in a 45-minute window, as a demo for looksmaxxing.guide. The AI wrote the code and the first draft of every card. My calls: keep evidence and risk as two separate grades, pull live numbers from a free public source instead of a paid scraper, and name a study only where its PubMed record was confirmed. The eight named studies were checked to exist and match their titles. They were not all read in full for this build.</p>
    <p>This page is general information, not medical advice.</p>
  </footer>
</main>
<script>
const rules={all:()=>true,
  worth:c=>c.dataset.evidence==="strong"&&c.dataset.risk==="low",
  doctor:c=>c.dataset.evidence==="strong"&&c.dataset.risk==="medium",
  unproven:c=>["mixed","weak","none"].includes(c.dataset.evidence)&&c.dataset.risk!=="high",
  danger:c=>c.dataset.risk==="high"};
const cards=[...document.querySelectorAll(".card")],btns=[...document.querySelectorAll(".filters button")],count=document.getElementById("count");
const state={f:"all",c:"all"};
btns.forEach(b=>b.addEventListener("click",()=>{
  const k=b.dataset.f?"f":"c";state[k]=b.dataset[k];
  [...b.parentNode.children].forEach(x=>x.setAttribute("aria-pressed",x===b));
  let n=0;cards.forEach(c=>{const on=rules[state.f](c)&&(state.c==="all"||c.dataset.cat===state.c);c.hidden=!on;if(on)n++});
  count.textContent=n===cards.length?"Showing all "+n+".":"Showing "+n+" of "+cards.length+".";
}));
</script>
</body>
</html>
`;
writeFileSync(new URL("./index.html", import.meta.url), html);

// One page per practice, so each question has its own address for search.
const css = html.split("<style>")[1].split("</style>")[0];
for (const i of items) {
  const q = `Does ${i.name.replace(/\s*\(.*?\)/g, "").toLowerCase()} work, and is it safe?`;
  const answer = `${label[i.evidence]}, ${riskLabel[i.risk].toLowerCase()}. ${i.verdict}`;
  const ld = { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: [{ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: `${answer} ${i.detail} Watch out: ${i.watch}` } }] };
  const page = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(q)}</title>
<meta name="description" content="${esc(answer)}">
<script type="application/ld+json">${JSON.stringify(ld)}</script>
<style>${css}main{max-width:680px}</style>
</head>
<body>
<main>
  <p class="src"><a href="../">All 12 practices</a></p>
  <h1>${esc(q)}</h1>
  <p class="tags"><span class="tag e-${i.evidence}">${label[i.evidence]}</span><span class="tag r-${i.risk}">${riskLabel[i.risk]}</span></p>
  <h2>Short answer</h2>
  <p class="verdict">${esc(i.verdict)}</p>
  <h2>What the evidence says</h2>
  <p>${esc(i.detail)}</p>
  <h2>What can go wrong</h2>
  <p>${esc(i.watch)}</p>
  <h2>What would change this grade</h2>
  <p>${esc(i.change)}</p>
  <h2>Sources</h2>
  ${studyHtml(i)}
  <p><a href="${pubmed(i.q)}" rel="noopener">Search PubMed yourself</a>${i.count ? ` (${i.count.toLocaleString("en")} papers match)` : ""}</p>
  <footer>
    <p>Grade written 11 October 2026. Search refreshed ${checked}. Not reviewed by a doctor. General information, not medical advice.</p>
  </footer>
</main>
</body>
</html>
`;
  mkdirSync(new URL(`./${i.id}/`, import.meta.url), { recursive: true });
  writeFileSync(new URL(`./${i.id}/index.html`, import.meta.url), page);
}
console.log("built index.html with", items.length, "items");
