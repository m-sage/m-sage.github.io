(function () {
"use strict";
/* M-SAGE detail views (Insight lab and friends). Korean/English/Italian/French and ELI10/ELI20/PRO, shared with the cockpit and the story
   through localStorage (msage.lang, msage.level) or ?lang=en|it|fr&level=eli10. */
const C = {teal: "#2dd4bf", coral: "#fb7185", amber: "#fbbf24", violet: "#a78bfa", sky: "#38bdf8", lime: "#a3e635", text: "#e6ecff", muted: "#8d9bc4", dim: "#5d6a92", line: "#1b2648"};
const PAL = [C.sky, C.coral, C.teal, C.amber, C.violet, C.lime, "#f472b6", "#60a5fa", "#fb923c", "#94a3b8"];
const $ = id => document.getElementById(id);
const store = {get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }, set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }};
const qs = new URLSearchParams(location.search);
let lang = qs.get("lang") || store.get("msage.lang") || "ko";
let level = qs.get("level") || store.get("msage.level") || "eli20";
if (!["ko", "en", "it", "fr"].includes(lang)) lang = "ko";
if (!["eli10", "eli20", "pro"].includes(level)) level = "eli20";
/* Italian and French: K(ko, en, it, fr). Without an explicit translation the English text is looked up in the page's dictionary,
   IT_WORDS() or FR_WORDS() (end of file); if absent, English is shown (and reported to MSAGE_I18N_MISS). */
const WORDS = {it: IT_WORDS, fr: FR_WORDS}, DICT = {};
const XL = () => !!WORDS[lang];                                 // a dictionary language (it, fr): English text is translated through WORDS
const xlate = en => { if (typeof en !== "string" || !en || !WORDS[lang]) return en; const D = DICT[lang] = DICT[lang] || WORDS[lang]();
  const v = D[en] != null ? D[en] : D[cap(en)]; if (v != null) return v;
  if (window.MSAGE_I18N_MISS) window.MSAGE_I18N_MISS(en, "module", lang); return en; };
const K = (ko, en, it, fr) => lang === "ko" ? ko : lang === "en" ? en : (lang === "it" ? it : fr) ?? xlate(en);
const V = o => { const x = o[level] || o.eli20; return Array.isArray(x) ? K(x[0], x[1], x[2], x[3]) : x; };
const nm = s => XL() ? xlate(s) : s;                           // English data label -> Italian/French name
const LOC = gb => ({ko: "ko-KR", it: "it-IT", fr: "fr-FR"})[lang] || (gb ? "en-GB" : "en-US");
const fmt = n => n == null ? "—" : Number(n).toLocaleString(LOC());
const pct = v => v == null ? "—" : (v > 0 ? "+" : "") + (v * 100).toFixed(1) + "%";
const esc = t => String(t == null ? "" : t).replace(/[&<>"]/g, c => ({"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;"}[c]));
const TOPIC_EN = {immune: "Immunity & inflammation", metabolism: "Microbial metabolism", diversity: "Diversity & dysbiosis", resistance: "Antibiotics & resistance",
  oral: "Oral", barrier: "Barrier & permeability", probiotics: "Probiotics", scfa: "Short-chain fatty acids", skin: "Skin", prebiotics: "Prebiotics & fibre",
  bile: "Bile acids", fmt: "Microbiota transplant", cancer: "Cancer", infection: "Infection", diabetes: "Diabetes", obesity: "Obesity", cardio: "Cardiovascular",
  ibd: "IBD", liver: "Liver disease", crc: "Colorectal cancer", mood: "Depression & anxiety", allergy: "Asthma & allergy", periodontal: "Periodontal & caries",
  alzheimer: "Alzheimer's & cognition", skin_disease: "Skin disease", kidney: "Kidney disease", parkinson: "Parkinson's", urogenital: "Urogenital disease", autism: "Autism"};
const cap = t => t ? t.charAt(0).toUpperCase() + t.slice(1) : t;
let INS = null;                                                  // insights, for English labels
const EN = cat => ((INS || {}).labels_en || {})[cat] || {};
const dx = (id, ko) => lang === "ko" ? (ko || id) : nm(cap(EN("disease")[id] || TOPIC_EN[id] || ko || id));
const topicName = (d, id) => { const t = d.topics.concat(d.diseases).find(x => x.id === id); return lang === "ko" ? (t ? t.label : id) : nm(TOPIC_EN[id] || (t ? t.label : id)); };
const CATK = {Disease: "disease", Method: "method", Intervention: "intervention", Metabolite: "metabolite", BodySite: "site"};
const trendName = (cat, r) => lang === "ko" || cat === "Taxon" ? r.name : nm(EN(CATK[cat])[r.id] || r.name);
const theme = (id, ko) => lang === "ko" ? ko : nm(EN("theme")[id] || ko);

const MODULES = {insights: ["인사이트 랩", "Insight lab"], people: ["연구자", "Researchers"], radar: ["관심 변화", "Interest shifts"], findings: ["최신 발견", "Latest findings"],
  world: ["세계 흐름", "World"], gaps: ["빈 곳", "Gaps"], backfill: ["수집 진행", "Collection"], agents: ["에이전트", "Agents"], minerva: ["MINERVA", "MINERVA"]};
const STATIC = window.MSAGE_STATIC || null;            // set only in the packaged, server-free website
if (STATIC && STATIC.public) delete MODULES.agents;      // operations are not published
let mod = qs.get("m") || "people";
if (!MODULES[mod]) mod = "people";
const charts = [];
function chart(el, opt) { const c = echarts.init(typeof el === "string" ? $(el) : el); c.setOption(Object.assign({backgroundColor: "transparent", textStyle: {fontFamily: "inherit", color: C.text}, animationDuration: 1200}, opt)); charts.push(c); return c; }
window.addEventListener("resize", () => charts.forEach(c => c.resize()));
setInterval(() => { $("clock").textContent = new Date().toLocaleTimeString(LOC(1), {hour12: false}); }, 1000);

const INTRO = {
  insights: {eli10: ["AI가 읽은 논문에서 '어떤 세균이 어떤 병과 함께 나오는지'를 모아 지도로 만들었어요. 많은 논문이 같은 말을 하는 곳, 서로 다른 말을 하는 곳, 요즘 뜨는 주제를 볼 수 있어요.", "We turned what the AI read into a map of which germs show up with which illnesses. See where many papers agree, where they disagree, and what is becoming popular."],
             eli20: ["AI가 읽은 논문 문장들을 미생물·질병·치료가 이어진 지식 그래프로 묶었습니다. 어떤 관계를 여러 논문이 같은 방향으로 말하는지, 어디서 결론이 엇갈리는지, 무엇이 새로 떠오르는지, 다음에 무엇을 연구해야 하는지 보여 줍니다.", "Sentences the AI read are linked into a knowledge graph of microbes, conditions and treatments: which relations many papers report in the same direction, where conclusions conflict, what is rising and what to study next."],
             pro: ["초록 근거 문장에서 추출한 미생물–질병 방향 관계(증가/감소/무차이)의 지식 그래프. 관계 판정은 Qwen 판정 + 결정적 grounded_direction 검사, 합의 = 같은 방향 ≥60%·≥5건, 논쟁 = 반대 방향 ≥30%. 초록 수준·전문가 미검증.", "Knowledge graph of directional microbe–condition relations (increase/decrease/no difference) from abstract evidence sentences. Qwen judge plus the deterministic grounded_direction check; consensus = ≥60% same direction and ≥5 sentences, debate = ≥30% opposite. Abstract-level, not expert-validated."]},
  people: {eli10: ["논문을 많이 쓴 과학자들이에요. 이름을 누르면 어디서 일하고 무엇을 연구하는지 보여요.", "Scientists who wrote many papers. Click a name to see where they work and what they study."],
           eli20: ["논문을 많이 쓰고 많이 인용된 연구자 순위입니다. 행을 누르면 소속, 최근 논문, 함께 연구하는 사람을 볼 수 있습니다.", "Researchers ranked by papers and citations. Click a row for affiliation, recent papers and co-authors."],
           pro: ["코퍼스 내 논문 수·관측 인용·h-지수·최근 1년 순위. ORCID가 없으면 이름 문자열로 식별(동명이인 병합 가능). 생산성 지표이며 영향력의 증거가 아닙니다.", "Rankings by corpus papers, observed citations, h-index and last-year output. Without ORCID authors are matched by name string (homonyms may merge). Output measures, not impact."]},
  radar: {eli10: ["요즘 과학자들이 더 많이 이야기하는 주제와 덜 이야기하는 주제예요.", "Topics scientists talk about more, or less, lately."],
          eli20: ["질병과 연구 주제별로 최근 관심이 늘었는지 줄었는지 보여 줍니다. 오른쪽에 있을수록 최근 논문에서 비중이 커진 주제입니다.", "Whether recent interest in each condition and topic grew or shrank. Further right = a larger share of recent papers."],
          pro: ["최근 3개월 대 이전 기간의 문서 점유율 변화(%), 논문 ≥100. 수집량이 기간마다 달라 개수 대신 점유율을 비교합니다.", "Change in share of papers, last 3 months vs the earlier window (≥100 papers). Shares, not counts, because collection volume differs by period."]},
  findings: {eli10: ["AI가 방금 읽은 논문에서 가장 중요한 한 줄이에요.", "The key line from papers the AI just read."],
             eli20: ["AI가 초록을 읽고 원문 문장과 대조해 통과시킨 최신 발견들입니다. 모두 잠정 결과입니다.", "Recent findings the AI read from abstracts and checked against the source sentence. All provisional."],
             pro: ["초록 한정 판독, 인용 문장이 원문과 일치해야 통과(source-validated). 요약은 모델 생성이며 수치는 원문 확인이 필요합니다.", "Abstract-only reading, accepted only when the quoted sentence matches the source. Summaries are model-generated; check numbers against the paper."]},
  world: {eli10: ["어느 나라에서 연구를 많이 하는지, 어느 나라끼리 함께 하는지 보여요.", "Which countries do the most research, and which work together."],
          eli20: ["나라별 논문 수와 나라 사이의 공동 연구를 보여 줍니다. 저자 소속 기준입니다.", "Papers by country and international co-authorship, by author affiliation."],
          pro: ["소속 문자열에서 국가 추출, 다국적 논문은 국가마다 1회 계수. 공동 연구 = 같은 논문의 국가 쌍.", "Countries parsed from affiliation strings; multinational papers count once per country. Collaboration = country pairs on the same paper."]},
  gaps: {eli10: ["아직 연구가 별로 없는 곳을 찾아요.", "Where research is still thin."],
         eli20: ["몸 부위와 연구 주제를 엮어 연구가 많은 곳과 비어 있는 곳을 보여 줍니다.", "Body site × topic: where research is dense and where it is missing."],
         pro: ["부위 × 주제 교차 논문 수(멀티 라벨 정규식). 적은 수가 곧 공백은 아닙니다(분류 누락·생물학적 비관련 가능).", "Paper counts per site × topic (multi-label regex). Low counts are not always gaps (missed classification or no biological link)."]},
  backfill: {eli10: ["옛날 논문도 한 달씩 모으는 중이에요.", "Collecting older papers one month at a time."],
             eli20: ["달마다 정해진 수만큼 논문을 모으는 진행 상황입니다.", "Progress of collecting a fixed number of papers per month."],
             pro: ["월 단위 창, 월당 쪽 수 상한 × 쪽 크기, Europe PMC 커서 페이지네이션. 표본이지 전수 수집이 아닙니다.", "Monthly windows, page cap × page size per month, Europe PMC cursor paging. A sample, not a census."]},
  agents: {eli10: ["뒤에서 일하는 프로그램들이에요. 초록은 잘 되는 중, 노랑은 조심, 빨강은 멈춤.", "The programs working behind the scenes. Green = fine, yellow = careful, red = stopped."],
           eli20: ["뒤에서 쉬지 않고 일하는 프로그램들의 상태입니다. 초록은 정상, 노랑은 주의, 빨강은 멈춤입니다.", "Status of the background programs. Green = healthy, yellow = caution, red = stopped."],
           pro: ["각 작업의 최신 상태 파일과 이벤트 나이로 판정. 30초마다 갱신.", "Derived from each job's latest status file and event age; refreshed every 30 s."]},
  minerva: {eli10: ["연구실의 큰 지식 지도(MINERVA)와 우리 결과를 비교해요.", "Comparing our results with the lab's big knowledge map, MINERVA."],
            eli20: ["연구실 지식 그래프 MINERVA의 내용을 한 번 전체 복사해 와 비교합니다. 평소에는 MINERVA에 접속하지 않습니다.", "MINERVA, the lab's knowledge graph, was copied once in full for comparison; we do not connect to it day to day."],
            pro: ["MINERVA main 그래프의 Microbe→Disease 관계를 질병 정규식으로 우리 분류에 대응. 근거 행 수는 고유 생물학적 관계 수와 다를 수 있습니다.", "MINERVA main-graph Microbe→Disease relations mapped to our classes by regex. Evidence-row counts can differ from unique biological relations."]}};
const DISCLAIMER = ["논문 수·인용·관심은 영향의 단서일 뿐 효과·인과·연구 질의 증거가 아닙니다. 소속은 논문에 적힌 문자열이며 기관 식별자로 확인하지 않았습니다. ORCID가 없으면 같은 이름을 한 사람으로 봅니다.",
  "Paper counts, citations and attention are hints of influence, not evidence of effect, causation or research quality. Affiliations are strings as printed in papers, not verified institution identifiers. Without ORCID, identical names are treated as one person."];

const get = (u, f) => f ? Promise.resolve(f) : fetch(u, {cache: "no-cache"}).then(r => r.ok ? r.json() : Promise.reject(r.status));
const source = K("원문 ↗", "Source ↗");
/* AI paper summaries are written in Korean; the site data (/api/site/msage, MSAGE_DATA) carries summary_i18n {korean: {en, it, fr}}, filled in gradually */
let I18N = null;
const summaryText = ko => { if (!ko) return null; if (lang === "ko") return ko;
  const m = (I18N || (window.MSAGE_DATA || {}).summary_i18n || {})[ko]; return (m && m[lang]) || null; };
const SUMMARK = {orig: ["원문 제목", "original title", "titolo originale", "titre original"],
  pend: ["(한국어 AI 요약 · 번역 준비 중)", "(Korean AI summary — translation pending)", "(riassunto IA in coreano — traduzione in arrivo)", "(résumé IA en coréen — traduction en cours)"]};
// summary in the page language; else the paper's own (English) title, marked; else the Korean, marked as pending. titled = the title is already shown
const sumHTML = (ko, title) => { const t = summaryText(ko); if (t) return {html: esc(t), titled: false};
  if (title) return {html: `${esc(title)}<small class="sx">${K(...SUMMARK.orig)}</small>`, titled: true};
  return {html: `<span class="sx-ko" lang="ko">${esc(ko)}</span><small class="sx sx-pend">${K(...SUMMARK.pend)}</small>`, titled: false}; };
const paperCard = p => `<div class="paper">${lang === "ko" || !p.title ? `<div class="find">${lang === "ko" || !p.summary ? esc(p.summary || K("요약 없음", "No summary")) : sumHTML(p.summary, p.title).html}</div><div class="ttl">${esc(p.title)}</div>`
    : !p.summary ? `<div class="find">${esc(p.title)}</div>` : (sm => `<div class="find">${sm.html}</div>${sm.titled ? "" : `<div class="ttl">${esc(p.title)}</div>`}`)(sumHTML(p.summary, p.title))}
  <div class="meta"><span>${esc(p.journal || "")} · ${esc(p.date)}</span><a href="https://europepmc.org/article/MED/${esc(p.pmid)}" target="_blank" rel="noopener">${K("원문 ↗", "Source ↗")}</a></div></div>`;

/* ---------------- people ---------------- */
function people(d) {
  const R = {}; d.researchers.concat(d.researcher_extra || []).forEach(r => R[r.id] = r);
  const ranks = d.rankings || {papers: d.researchers.map(r => r.id)};
  const KEYS = {papers: K("논문 수", "Papers"), citations: K("인용 합계", "Citations"), h_index: K("코퍼스 내 h-지수", "Corpus h-index"), recent: K("최근 1년 활발", "Active last year")};
  const gctx = (() => { const top = d.researchers.slice(0, 200), cnt = {}, L = {}; top.forEach(r => { L[r.id] = r.label; if (r.country) cnt[r.country] = (cnt[r.country] || 0) + 1; });
    const c = Object.entries(cnt).sort((a, b) => b[1] - a[1])[0]; if (!c) return {};
    const e = (d.coauthor_edges || []).filter(x => L[x.source] && L[x.target]).sort((a, b) => b.weight - a.weight)[0];
    return {c: c[0], n: c[1], a: e && L[e.source], b: e && L[e.target], w: e && e.weight}; })();
  $("view").innerHTML = `<div class="row2"><div class="box"><h2>${K("가장 영향력 있는 연구자", "Most prolific researchers")}</h2>
    ${readBox("p_rank", null, "rb-prank")}
    <div class="seg" id="seg">${Object.entries(KEYS).filter(([k]) => ranks[k]).map(([k, n], i) => `<button data-k="${k}" class="${i ? "" : "on"}">${n}</button>`).join("")}</div>
    <div class="scroll"><table><thead><tr><th>#</th><th>${K("연구자 · 현재 소속", "Researcher · affiliation")}</th><th>${K("국가", "Country")}</th><th class="n">${K("논문", "Papers")}</th><th class="n">${K("인용", "Cites")}</th><th class="n">h</th><th class="n">${K("최근 1년", "Last yr")}</th></tr></thead><tbody id="rows"></tbody></table></div></div>
    <div class="box profile detail" id="prof"></div></div>
    <div class="row2"><div class="box"><h2>${K("공동 연구 별자리", "Co-authorship constellation")}</h2>${readBox("p_graph", gctx)}<div class="big" id="graph"></div></div>
    <div class="box"><h2>${K("연구를 많이 하는 기관", "Most active institutions")}</h2>${readBox("p_inst", {x: (d.institutions || [])[0]})}<div class="scroll"><table><thead><tr><th>#</th><th>${K("기관", "Institution")}</th><th>${K("국가", "Country")}</th><th class="n">${K("논문", "Papers")}</th><th class="n">${K("연구자", "Researchers")}</th></tr></thead><tbody id="inst"></tbody></table></div></div></div>`;
  let sel = null;
  const draw = key => {
    const ids = ranks[key] || [], max = Math.max(...ids.map(i => (R[i] || {})[key === "citations" ? "citations_observed" : key] || 0), 1);
    $("rows").innerHTML = ids.map((id, i) => { const r = R[id]; if (!r) return "";
      const v = r[key === "citations" ? "citations_observed" : key] || 0;
      return `<tr class="click${id === sel ? " sel" : ""}" data-id="${id}"><td class="rank">${i + 1}</td>
        <td class="name barcell"><i style="width:${(60 * v / max).toFixed(0)}%"></i><span><b>${esc(r.label)}</b><small>${esc(r.institution || K("소속 미표기", "affiliation not given"))}</small></span></td>
        <td>${esc(r.country || "—")}</td><td class="n">${fmt(r.papers)}</td><td class="n">${fmt(r.citations_observed)}</td><td class="n">${fmt(r.h_index)}</td><td class="n">${fmt(r.recent)}</td></tr>`; }).join("");
    const r0 = R[ids[0]]; rbKey("rb-prank", "p_rank", r0 ? {r: r0, m: KEYS[key], v: fmt(r0[key === "citations" ? "citations_observed" : key])} : {});
  };
  const profile = id => { const r = R[id]; if (!r) return; sel = id;
    document.querySelectorAll("#rows tr").forEach(t => t.classList.toggle("sel", t.dataset.id === id));
    $("prof").innerHTML = `<h3>${esc(r.label)}</h3><div class="who">${esc(r.institution || "")}${r.country ? " · " + esc(r.country) : ""}<br>
      ${K("최근 소속 표기", "Latest affiliation")} (${esc(r.latest_affiliation_date || "")}): ${esc(r.latest_affiliation || "—")}<br>
      ${K("논문", "Papers")} ${fmt(r.papers)} · ${K("인용", "citations")} ${fmt(r.citations_observed)} · ${K("코퍼스 내 h-지수", "corpus h-index")} ${fmt(r.h_index)} · ${K("최근 1년", "last year")} ${fmt(r.recent)}${r.orcid ? " · ORCID " + esc(r.orcid) : ""}</div>
      <div class="chips">${(r.topics || []).map(t => `<span class="chip">${esc(topicName(d, t))}</span>`).join("")}</div>
      ${(r.coauthors || []).length ? `<p class="hint" style="margin-top:10px">${K("자주 함께 쓴 연구자", "Frequent co-authors")}: ${esc(r.coauthors.join(", "))}</p>` : ""}
      <h2 style="margin-top:12px">${K("최근 논문과 발견", "Recent papers and findings")}</h2>${(r.papers_list || []).slice(0, 6).map(paperCard).join("") || `<p class="hint">${K("상위 200명만 논문 목록을 미리 계산합니다.", "Paper lists are precomputed for the top 200 only.")}</p>`}`; };
  $("seg").onclick = e => { const b = e.target.closest("button"); if (!b) return; document.querySelectorAll("#seg button").forEach(x => x.classList.toggle("on", x === b)); draw(b.dataset.k); };
  $("rows").onclick = e => { const t = e.target.closest("tr"); if (t) profile(t.dataset.id); };
  draw(Object.keys(KEYS).find(k => ranks[k])); profile((ranks.papers || [])[0]);
  const top = d.researchers.slice(0, 200), cnt = {}, none = K("미표기", "not given"), other = K("기타", "other");
  top.forEach(r => cnt[r.country || none] = (cnt[r.country || none] || 0) + 1);
  const cats = Object.entries(cnt).sort((a, b) => b[1] - a[1]).slice(0, 9).map(x => x[0]);
  const ids = new Set(top.map(r => r.id));
  const g = chart("graph", {tooltip: {formatter: p => p.dataType === "edge" ? `${K("공동 논문", "Shared papers")} ${p.data.value}` : `<b>${esc(p.data.name)}</b><br>${esc(p.data.raw.institution || "")}<br>${K("논문", "Papers")} ${p.data.value}`},
    legend: {data: cats.concat([other]), textStyle: {color: C.muted}, type: "scroll", top: 0},
    series: [{type: "graph", layout: "force", roam: true, draggable: true, categories: cats.concat([other]).map((n, i) => ({name: n, itemStyle: {color: PAL[i % PAL.length]}})),
      data: top.map(r => ({id: r.id, name: r.label, value: r.papers, raw: r, category: (i => i < 0 ? cats.length : i)(cats.indexOf(r.country || none)),
        symbolSize: 6 + Math.sqrt(r.papers) * 4, label: {show: r.papers >= 12, color: C.text, fontSize: 11}})),
      links: d.coauthor_edges.filter(e => ids.has(e.source) && ids.has(e.target)).map(e => ({source: e.source, target: e.target, value: e.weight, lineStyle: {width: .6 + e.weight * .6, opacity: .4}})),
      force: {repulsion: 90, gravity: .08, edgeLength: [30, 90]}, lineStyle: {color: "source", curveness: .2}, emphasis: {focus: "adjacency"}}]});
  g.on("click", p => p.dataType === "node" && profile(p.data.id));
  $("inst").innerHTML = (d.institutions || []).slice(0, 80).map((x, i) => `<tr><td class="rank">${i + 1}</td><td class="name"><b>${esc(x.name)}</b><small>${(x.topics || []).map(t => esc(topicName(d, t))).join(" · ")}</small></td><td>${esc(x.country || "—")}</td><td class="n">${fmt(x.papers)}</td><td class="n">${fmt(x.researchers)}</td></tr>`).join("");
}

/* ---------------- radar ---------------- */
function radar(d) {
  const KT = K("기전·주제", "Mechanism · topic"), KD = K("질병", "Condition");
  const all = d.topics.map(t => ({...t, k: KT})).concat(d.diseases.map(t => ({...t, k: KD})));
  const gp = all.filter(t => t.growth != null && t.papers >= 100).sort((a, b) => b.growth - a.growth), gv = all.filter(t => t.growth != null);
  $("view").innerHTML = `<div class="box"><h2>${K("연구 관심 레이더", "Research-interest radar")}</h2>${readBox("r_sc", gp.length ? {hi: {name: topicName(d, gp[0].id), growth: gp[0].growth}, lo: {name: topicName(d, gp[gp.length - 1].id), growth: gp[gp.length - 1].growth}} : {})}<p class="hint">${K("비교 기간", "Comparing")} ${d.coverage.momentum_early.join(", ")} → ${d.coverage.momentum_late.join(", ")} · ${K("같은 기간 전체 논문 중 점유율 비교", "share of all papers in each window")}</p><div class="big" id="sc"></div></div>
    <div class="box"><h2>${K("모든 주제", "All topics")}</h2>${readBox("r_tt", {n: gv.length, u: gv.filter(t => t.growth > 0).length, d: gv.filter(t => t.growth < 0).length})}<div class="scroll"><table><thead><tr><th>${K("주제", "Topic")}</th><th>${K("구분", "Kind")}</th><th class="n">${K("전체 논문", "Papers")}</th><th class="n">${K("최근 3개월", "Last 3 mo")}</th><th class="n">${K("관심 변화", "Interest")}</th><th class="n">${K("인용 중앙값", "Median cites")}</th><th>${K("월별 흐름", "By month")}</th></tr></thead><tbody id="tt"></tbody></table></div></div>`;
  const pts = all.filter(t => t.growth != null && t.papers >= 100);
  chart("sc", {grid: {left: 60, right: 30, top: 20, bottom: 40}, tooltip: {formatter: p => `<b>${p.name}</b><br>${p.value[0]}% · ${fmt(p.value[1])}`},
    xAxis: {name: K("관심 변화 %", "Interest change %"), nameLocation: "middle", nameGap: 26, axisLabel: {color: C.dim}, splitLine: {lineStyle: {color: C.line}}},
    yAxis: {type: "log", min: 30, axisLabel: {color: C.dim}, splitLine: {lineStyle: {color: C.line}}},
    series: [KT, KD].map((k, i) => ({type: "effectScatter", name: k, rippleEffect: {scale: 2.4, brushType: "stroke", period: 4}, showEffectOn: "render",
      data: pts.filter(t => t.k === k).map(t => ({name: topicName(d, t.id), value: [+(t.growth * 100).toFixed(1), t.late, t.papers]})),
      symbolSize: v => 8 + Math.sqrt(v[2]) * .55, itemStyle: {color: i ? C.coral : C.teal, opacity: .8}, label: {show: true, formatter: p => p.name, position: "right", color: C.text, fontSize: 12}, labelLayout: {hideOverlap: true}}))});
  $("tt").innerHTML = all.sort((a, b) => (b.growth ?? -9) - (a.growth ?? -9)).map(t => { const mx = Math.max(...t.by_month, 1);
    const spark = `<svg width="120" height="22">${t.by_month.map((v, i) => `<rect x="${i * 5}" y="${22 - 20 * v / mx}" width="4" height="${20 * v / mx}" fill="${C.sky}" opacity=".7"/>`).join("")}</svg>`;
    return `<tr><td><a href="?m=findings&t=${t.id}" style="color:${C.text}">${esc(topicName(d, t.id))}</a></td><td>${t.k}</td><td class="n">${fmt(t.papers)}</td><td class="n">${fmt(t.late)}</td><td class="n" style="color:${(t.growth || 0) > 0 ? C.teal : C.coral}">${pct(t.growth)}</td><td class="n">${fmt(t.citations_median)}</td><td>${spark}</td></tr>`; }).join("");
}

/* ---------------- findings ---------------- */
function findings(d) {
  const t0 = qs.get("t");
  const H = d.highlights || {}, themes = Object.keys(H).filter(k => H[k].length);
  $("view").innerHTML = `<div class="box"><h2>${K("주제별 최근 발견", "Recent findings by topic")}</h2>${readBox("f_cards", null, "rb-fcards")}
    <div class="seg" id="th"><button data-t="" class="${t0 ? "" : "on"}">${K("전체", "All")}</button>${themes.map(k => `<button data-t="${k}" class="${k === t0 ? "on" : ""}">${esc(topicName(d, k))}</button>`).join("")}</div><div class="row3" id="cards"></div></div>
    <div class="box"><h2>${K("연구자들이 직접 말한 빈 곳", "Gaps the authors name themselves")}</h2>${readBox("f_gaps", (() => { const G = d.author_gaps || [], c = {}; G.forEach(g => (g.themes || []).forEach(t => c[t] = (c[t] || 0) + 1));
      const top = Object.entries(c).sort((a, b) => b[1] - a[1])[0]; return top ? {n: G.length, T: topicName(d, top[0]), c: top[1]} : {}; })())}<div class="row3" id="gaps"></div></div>`;
  const show = t => { const items = []; (t ? [t] : themes).forEach(k => H[k].forEach(p => items.push(p)));
    const seen = new Set(), L = items.filter(p => p.summary && !seen.has(p.pmid) && seen.add(p.pmid)).sort((a, b) => String(b.date).localeCompare(a.date));
    $("cards").innerHTML = L.map(paperCard).join(""); rbKey("rb-fcards", "f_cards", {n: L.length, date: L.length ? fd(L[0].date) : ""}); };
  $("th").onclick = e => { const b = e.target.closest("button"); if (!b) return; document.querySelectorAll("#th button").forEach(x => x.classList.toggle("on", x === b)); show(b.dataset.t); };
  show(t0);
  $("gaps").innerHTML = (d.author_gaps || []).map(g => `<div class="paper"><div class="find">${lang === "ko" ? esc(g.summary) : sumHTML(g.summary, g.title).html}</div><div class="meta"><span>${esc(g.date)} · ${(g.themes || []).map(t => esc(topicName(d, t))).join(", ")}</span><a href="https://europepmc.org/article/MED/${esc(g.pmid)}" target="_blank" rel="noopener">${source}</a></div></div>`).join("");
}

/* ---------------- world ---------------- */
function world(d) {
  const P30 = d.places.slice(0, 30), s30 = P30.reduce((a, p) => a + (p.papers || 0), 0), CL = d.country_links || [], cc = {};
  CL.slice(0, 10).forEach(l => { cc[l.a] = (cc[l.a] || 0) + 1; cc[l.b] = (cc[l.b] || 0) + 1; }); const ctop = Object.entries(cc).sort((a, b) => b[1] - a[1])[0];
  const c0 = (d.places[0] || {}).country, i0 = (d.institutions || []).find(x => x.country === c0);
  $("view").innerHTML = `<div class="row2"><div class="box"><h2>${K("나라별 논문", "Papers by country")}</h2>${readBox("w_bar", P30.length > 1 ? {a: P30[0], b: P30[1], p: pf((P30[0].papers + P30[1].papers) / s30, 0)} : {})}<div class="big" id="bar"></div></div>
    <div class="box"><h2>${K("가장 많은 국제 공동 연구", "Top international collaborations")}</h2>${readBox("w_links", CL.length ? {l: CL[0], top: ctop[0], m: ctop[1]} : {})}<div class="scroll"><table><thead><tr><th>${K("나라 ↔ 나라", "Country ↔ country")}</th><th class="n">${K("공동 논문", "Shared papers")}</th></tr></thead><tbody id="links"></tbody></table></div></div></div>
    <div class="box"><h2>${K("나라별 대표 기관", "Leading institutions by country")}</h2>${readBox("w_byc", {c: c0, x: i0})}<div class="row3" id="byc"></div></div>`;
  const top = d.places.slice(0, 30).reverse();
  chart("bar", {grid: {left: 110, right: 40, top: 10, bottom: 20}, tooltip: {}, xAxis: {type: "log", axisLabel: {color: C.dim}, splitLine: {lineStyle: {color: C.line}}},
    yAxis: {type: "category", data: top.map(p => p.country), axisLabel: {color: C.muted}},
    series: [{type: "bar", data: top.map(p => p.papers), itemStyle: {color: C.teal, borderRadius: [0, 6, 6, 0]}, label: {show: true, position: "right", color: C.muted, formatter: p => fmt(p.value)}}]});
  $("links").innerHTML = d.country_links.map(l => `<tr><td>${esc(l.a)} ↔ ${esc(l.b)}</td><td class="n">${fmt(l.papers)}</td></tr>`).join("");
  const by = {}; (d.institutions || []).forEach(x => { if (x.country) (by[x.country] = by[x.country] || []).push(x); });
  $("byc").innerHTML = d.places.slice(0, 12).map(p => `<div class="paper"><div class="find">${esc(p.country)} · ${K("논문", "papers")} ${fmt(p.papers)} · ${K("저자", "authors")} ${fmt(p.researchers)}</div>${(by[p.country] || []).slice(0, 4).map(x => `<div class="ttl">${esc(x.name)} (${fmt(x.papers)})</div>`).join("")}</div>`).join("");
}

/* ---------------- gaps ---------------- */
/* the frontier analysis writes its notes in Korean from a fixed vocabulary: premises by their Korean label, actions by operator.
   Unknown ones are shown as written. [en, it, fr] */
const PREMISES = {
  "같은 결과·조건의 연구로 비교할 수 있는가": ["Can the studies be compared on the same outcome and conditions?",
    "Gli studi sono confrontabili sullo stesso esito e nelle stesse condizioni?", "Les études sont-elles comparables sur le même critère et dans les mêmes conditions ?"],
  "같은 연구·코호트를 중복 집계하지 않았는가": ["Has any study or cohort been counted twice?",
    "Lo stesso studio o la stessa coorte sono stati contati due volte?", "Une même étude ou une même cohorte a-t-elle été comptée deux fois ?"]};
const ACTIONS = {
  audit: {label: ["Re-check the source", "Ricontrollare la fonte", "Revérifier la source"],
    reason: ["confirm conditions, species, formulation and exposure in the original papers", "verificare negli articoli originali condizioni, specie, formulazione ed esposizione", "vérifier dans les articles d'origine les conditions, les espèces, la formulation et l'exposition"]},
  fuse: {label: ["Combine the two pathways", "Unire i due percorsi", "Réunir les deux voies"],
    reason: ["check when the two pathways co-occur, the exposure and the inhibiting conditions", "verificare quando i due percorsi coesistono, l'esposizione e le condizioni di inibizione", "vérifier quand les deux voies coexistent, l'exposition et les conditions d'inhibition"]},
  repair: {label: ["Find alternative evidence", "Cercare prove alternative", "Chercher d'autres preuves"],
    reason: ["look up alternative evidence routes that match why the first one failed", "cercare percorsi di prova alternativi adatti al motivo del fallimento", "chercher d'autres pistes de preuve adaptées à la cause de l'échec"]},
  discriminate: {label: ["Set the comparison", "Definire il confronto", "Définir la comparaison"],
    reason: ["define the endpoint, the control group and the direction of effect to compare", "definire l'endpoint, il gruppo di controllo e la direzione dell'effetto da confrontare", "définir le critère d'évaluation, le groupe témoin et le sens de l'effet à comparer"]},
  context_split: {label: ["Split by condition", "Separare per condizione", "Séparer par condition"],
    reason: ["separate claims that differ in host, strain, formulation or body site", "separare le affermazioni che differiscono per ospite, ceppo, formulazione o sede corporea", "séparer les affirmations qui diffèrent par l'hôte, la souche, la formulation ou le site corporel"]},
  counterfactual_stress: {label: ["Test the opposite assumption", "Mettere alla prova l'ipotesi opposta", "Tester l'hypothèse inverse"],
    reason: ["re-check the candidates that depend on a shared premise if that premise changes", "ricontrollare i candidati che dipendono da una premessa comune se questa cambia", "revérifier les candidats qui dépendent d'une hypothèse commune si celle-ci change"]}};
const premiseText = ko => lang === "ko" || !PREMISES[ko] ? ko : K(ko, ...PREMISES[ko]);
const actionText = a => { const x = ACTIONS[a.operator]; return lang === "ko" || !x ? {label: a.label, reason: a.reason} : {label: K(a.label, ...x.label), reason: K(a.reason, ...x.reason)}; };
function gaps(d) {
  const SITE = {airway: K("호흡기", "Airway"), gut: K("장", "Gut"), multi_site: K("여러 부위", "Multi-site"), oral: K("구강", "Oral"), skin: K("피부", "Skin"), urogenital: K("비뇨생식기", "Urogenital")};
  const MT = {brain: K("뇌·신경", "Brain"), cancer: K("암", "Cancer"), diagnosis: K("진단", "Diagnosis"), diet: K("식이", "Diet"), immune: K("면역", "Immunity"), intervention: K("개입·치료", "Intervention"), metabolites: K("대사물질", "Metabolites"), omics: K("오믹스", "Omics")};
  const cells = d.frontier.cells.filter(c => c.papers != null && SITE[c.site] && MT[c.topic]);
  const sites = Object.keys(SITE), topics = Object.keys(MT);
  $("view").innerHTML = `<div class="box"><h2>${K("부위 × 주제 지도", "Body site × topic map")}</h2>${readBox("g_hm", (() => { if (!cells.length) return {}; const o = cells.slice().sort((a, b) => b.papers - a.papers), f = c => ({s: SITE[c.site], t: MT[c.topic], n: c.papers}); return {hi: f(o[0]), lo: f(o[o.length - 1])}; })())}<div class="big" id="hm"></div></div>
    <div class="row2"><div class="box"><h2>${K("아직 확인되지 않은 공통 전제", "Shared premises not yet confirmed")}</h2>${readBox("g_pr", {n: new Set(d.frontier.premises.map(p => p.label)).size, N: d.frontier.premises.length})}<ul id="pr"></ul></div><div class="box"><h2>${K("M-SAGE가 제안한 다음 행동", "Next actions M-SAGE suggests")}</h2>${readBox("g_ac", (() => { const c = {}; d.frontier.actions.forEach(a => { const l = actionText(a).label; c[l] = (c[l] || 0) + 1; }); const t = Object.entries(c).sort((a, b) => b[1] - a[1])[0];
      return t ? (t[1] > 1 ? {n: d.frontier.actions.length, t: t[0], c: t[1]} : {n: d.frontier.actions.length, t: actionText(d.frontier.actions[0]).label, c: 1}) : {}; })())}<ul id="ac"></ul></div></div>`;
  chart("hm", {tooltip: {formatter: p => `${SITE[sites[p.value[1]]]} × ${MT[topics[p.value[0]]]}: ${fmt(p.value[2])}`}, grid: {left: 90, right: 20, top: 10, bottom: 40},
    xAxis: {type: "category", data: topics.map(t => MT[t]), axisLabel: {color: C.muted}}, yAxis: {type: "category", data: sites.map(s => SITE[s]), axisLabel: {color: C.muted}},
    visualMap: {min: 0, max: Math.max(...cells.map(c => c.papers)), show: false, inRange: {color: ["#140c2a", "#4c1d95", "#a78bfa", "#fb7185", "#fde047"]}},
    series: [{type: "heatmap", data: cells.map(c => [topics.indexOf(c.topic), sites.indexOf(c.site), c.papers]), label: {show: true, color: "#f1f5f9"}, itemStyle: {borderColor: "#04070f", borderWidth: 3, borderRadius: 6}}]});
  $("pr").innerHTML = [...new Set(d.frontier.premises.map(p => p.label))].map(p => `<li>${esc(premiseText(p))}</li>`).join("");
  $("ac").innerHTML = d.frontier.actions.map(a => { const x = actionText(a); return `<li><b>${esc(x.label)}</b> — ${esc(x.reason)}</li>`; }).join("");
}

/* ---------------- MINERVA ---------------- */
function minerva(d) {
  const m = (d.minerva || {}).live;
  if (!m) { $("view").innerHTML = `<div class="box"><h2>MINERVA</h2><p class="hint">${K("MINERVA 비교 자료가 아직 없습니다.", "No MINERVA comparison yet.")}</p></div>`; return; }
  const DL = {ibd: ["염증성 장질환", "IBD"], crc: ["대장암", "Colorectal cancer"], obesity: ["비만", "Obesity"], diabetes: ["당뇨", "Diabetes"], liver: ["지방간", "Fatty liver"], cardio: ["동맥경화", "Atherosclerosis"],
    kidney: ["만성 신장질환", "Chronic kidney disease"], parkinson: ["파킨슨병", "Parkinson's"], alzheimer: ["알츠하이머", "Alzheimer's"], mood: ["우울", "Depression"], autism: ["자폐", "Autism"], allergy: ["천식", "Asthma"],
    skin_disease: ["건선", "Psoriasis"], periodontal: ["치주염", "Periodontitis"], infection: ["C. difficile 감염", "C. difficile infection"], urogenital: ["세균성 질염", "Bacterial vaginosis"]};
  const dl = (k, q) => DL[k] ? K(...DL[k]) : q;
  const graphs = Object.entries(m.graphs || {});
  $("view").innerHTML = `<div class="row2"><div class="box"><h2>${K("질병 ↔ 미생물 연결망 (MINERVA)", "Condition ↔ microbe network (MINERVA)")}</h2>${readBox("m_net", null, "rb-mnet")}<div class="big" id="net"></div></div>
    <div class="box"><h2>${K("질병 연관이 가장 많은 미생물 (허브)", "Hub microbes (most condition links)")}</h2>${readBox("m_hub", (() => { const H = (m.hub_microbes || []).slice().sort((a, b) => b.degree - a.degree); return {a: H[0], b: H[1]}; })())}<div class="big" id="hub"></div></div></div>
    <div class="box"><h2>${K("질병별 대표 미생물", "Top microbes by condition")}</h2>${readBox("m_dz", (() => { const e = Object.entries(m.diseases || {}).sort((a, b) => (b[1].count || 0) - (a[1].count || 0))[0]; return e ? {D: dl(e[0], e[1].query), c: e[1].count, x: (e[1].microbes || [])[0]} : {}; })())}<div class="row3" id="dz"></div></div>
    <div class="box"><h2>${K("MINERVA 그래프 구성", "MINERVA graph contents")}</h2>${readBox("m_graphs", (() => { let best = null, g = ""; graphs.forEach(([k, v]) => (v.node_labels || []).forEach(x => { if (!best || x.count > best.count) { best = x; g = k; } })); return {n: graphs.length, g, x: best}; })())}<div class="row3">${graphs.map(([g, v]) => `<div class="paper"><div class="find">${esc(g)}</div>${(v.node_labels || []).slice(0, 8).map(x => `<div class="ttl">${esc(x.label)} · ${fmt(x.count)}</div>`).join("")}</div>`).join("")}</div>
    <p class="hint">${K("수집", "Captured")} ${m.finished_at ? new Date(m.finished_at * 1000).toLocaleString(LOC()) : ""} · ${esc(m.transport)} · ${K("근거 행 수는 고유 생물학적 관계 수와 다를 수 있습니다.", "Evidence rows can differ from unique biological relations.")}</p></div>`;
  const hub = (m.hub_microbes || []).slice(0, 25).reverse();
  chart("hub", {grid: {left: 210, right: 40, top: 10, bottom: 20}, tooltip: {}, xAxis: {axisLabel: {color: C.dim}, splitLine: {lineStyle: {color: C.line}}},
    yAxis: {type: "category", data: hub.map(x => x.microbe), axisLabel: {color: C.muted, fontSize: 11}},
    series: [{type: "bar", data: hub.map(x => x.degree), itemStyle: {color: C.violet, borderRadius: [0, 6, 6, 0]}}]});
  const nodes = [], links = [], seen = {};
  Object.entries(m.diseases || {}).forEach(([k, v]) => { nodes.push({id: "d:" + k, name: dl(k, v.query), symbolSize: 26, itemStyle: {color: C.amber}, label: {show: true, color: C.text}});
    (v.microbes || []).slice(0, 8).forEach(x => { const id = "m:" + x.microbe, n = x.increase + x.decrease + x.unknown;
      if (!seen[id]) { seen[id] = {id, name: x.microbe, value: 0, inc: 0, dec: 0}; nodes.push(seen[id]); }
      seen[id].value += n; seen[id].inc += x.increase; seen[id].dec += x.decrease;
      links.push({source: "d:" + k, target: id, value: n, lineStyle: {width: Math.min(6, .5 + n / 3), opacity: .45}}); }); });
  { const S = Object.values(seen), top = Object.entries(m.diseases || {}).sort((a, b) => (b[1].count || 0) - (a[1].count || 0))[0];
    rbKey("rb-mnet", "m_net", S.length ? {n: S.length, g: S.filter(x => x.inc > x.dec).length, r: S.filter(x => x.inc < x.dec).length, D: top ? dl(top[0], top[1].query) : "", c: top ? top[1].count : 0} : {}); }
  Object.values(seen).forEach(x => { x.symbolSize = 6 + Math.sqrt(x.value) * 3; x.itemStyle = {color: x.inc >= x.dec ? C.teal : C.coral}; x.label = {show: x.value >= 6, color: C.muted, fontSize: 10}; });
  chart("net", {tooltip: {formatter: p => p.dataType === "edge" ? `${K("근거 행", "Evidence rows")} ${p.data.value}` : esc(p.data.name)},
    series: [{type: "graph", layout: "force", roam: true, draggable: true, data: nodes, links, force: {repulsion: 120, edgeLength: [40, 120], gravity: .06}, lineStyle: {color: "source", curveness: .15}, emphasis: {focus: "adjacency"}}]});
  $("dz").innerHTML = Object.entries(m.diseases || {}).map(([k, v]) => `<div class="paper"><div class="find">${esc(dl(k, v.query))} · ${K("근거", "evidence")} ${fmt(v.count)}</div>${(v.microbes || []).slice(0, 6).map(x =>
    `<div class="ttl">${esc(x.microbe)} <span style="color:${C.teal}">▲${x.increase}</span> <span style="color:${C.coral}">▼${x.decrease}</span> · PMID ${x.pmids}</div>`).join("")}</div>`).join("");
}

/* ---------------- backfill + agents (live) ---------------- */
function backfill(v) {
  const bf = v.backfill; if (!bf) { $("view").innerHTML = `<div class="box">${K("과거 수집 정보가 아직 없습니다.", "No collection progress yet.")}</div>`; return; }
  const m = bf.month_grid, years = [...new Set(Object.keys(m).map(k => k.slice(0, 4)))].sort().reverse(), work = Object.keys(m).sort().reverse().find(k => !m[k]);
  $("view").innerHTML = `<div class="box"><h2>${K("과거 논문 채우기", "Filling in past papers")}</h2>${readBox("b_grid", {d: bf.months_done, t: bf.months_total, w: work})}<p class="hint">${bf.months_done} / ${bf.months_total} ${K("개월 완료 · 달마다 최대", "months done · up to")} ${fmt(bf.page_cap * (bf.page_size || 25))} ${K("편", "papers a month")}</p>
    <div class="mgrid" style="grid-template-columns:50px repeat(12,1fr);gap:5px;font-size:12px">${years.map(y => `<span>${y}</span>` + Array.from({length: 12}, (_, i) => { const k = y + "-" + String(i + 1).padStart(2, "0");
      return `<i style="height:26px" class="${m[k] === true ? "done" : k === work ? "work" : ""}" data-tip="${k}"></i>`; }).join("")).join("")}</div></div>
    <div class="box"><h2>${K("연도별 대략 확보량", "Approximate papers by year")}</h2>${readBox("b_yb", (() => { const y = Object.entries(bf.years || {}).map(([k, v]) => [k, v.approx_papers]).filter(x => x[1] > 0).sort((a, b) => b[1] - a[1]); return y.length ? {hi: y[0], lo: y[y.length - 1]} : {}; })())}<div class="mid" id="yb"></div></div>`;
  const ys = Object.entries(bf.years).sort();
  chart("yb", {grid: {left: 60, right: 20, top: 20, bottom: 30}, tooltip: {}, xAxis: {type: "category", data: ys.map(x => x[0]), axisLabel: {color: C.muted}},
    yAxis: {axisLabel: {color: C.dim}, splitLine: {lineStyle: {color: C.line}}}, series: [{type: "bar", data: ys.map(x => x[1].approx_papers), itemStyle: {color: C.violet, borderRadius: [6, 6, 0, 0]}}]});
}
function agents(v) {
  $("view").innerHTML = `<div class="box"><h2>${K("에이전트 오케스트라", "Agent orchestra")}</h2><div class="row3" id="ag"></div></div>
    <div class="box"><h2>${K("최근 수집 주기", "Recent collection cycles")}</h2><div class="scroll"><table><thead><tr><th>${K("시각", "Time")}</th><th>${K("상태", "State")}</th><th class="n">${K("쪽", "Pages")}</th><th>${K("범위 · 사유", "Range · reason")}</th></tr></thead><tbody id="ev"></tbody></table></div></div>`;
  const tf = t => new Date(t).toLocaleTimeString(LOC(1), {hour12: false});
  $("ag").innerHTML = (v.agents || []).map(a => window.MSAGE_OPS_AGENT ? window.MSAGE_OPS_AGENT(a, lang) : a).map(a => `<div class="acard ${a.state}"><i></i><b>${esc(a.name)}</b><p>${esc(a.role)}</p><p class="doing">${esc(a.doing || "")}</p><p>${esc(a.metric || "")}${a.at ? " · " + tf(a.at) : ""}</p></div>`).join("");
  $("ev").innerHTML = (v.collection.recent || []).map(e => `<tr><td>${e.at ? tf(e.at) : ""}</td><td style="color:${e.state === "completed" ? C.teal : C.coral}">${esc(e.state)}</td><td class="n">${e.historical_pages}</td><td>${e.range ? esc(e.range.start + " ~ " + e.range.end) : ""} ${esc(e.reason || "")}</td></tr>`).join("");
}

/* ---------------- insight lab (knowledge graph) ---------------- */
const UP = C.coral, DOWN = C.sky, MIX = C.amber;
const dirWord = s => s > 0.25 ? K("질병에서 증가", "higher in condition") : s < -0.25 ? K("질병에서 감소", "lower in condition") : K("엇갈림", "mixed");
const pm = x => x.pmid ? `<a href="https://europepmc.org/article/MED/${esc(x.pmid)}" target="_blank" rel="noopener">PMID ${esc(x.pmid)} ↗</a>` : "";
// examples: Korean AI summary + the English evidence quote; other languages show the translated summary + quote, or the quote alone until it is translated
const quoteCard = x => { const sm = lang === "ko" ? x.summary : summaryText(x.summary);
  return `<div class="paper"><div class="find">${esc(sm || x.quote)}</div>${sm ? `<div class="ttl">“${esc(x.quote)}”</div>` : ""}
  <div class="meta"><span>${esc(x.year || "")}${x.direction ? " · " + (x.direction === "increase" ? K("증가", "increase") : x.direction === "decrease" ? K("감소", "decrease") : K("차이 없음", "no difference")) : ""}</span>${pm(x)}</div></div>`; };
let ipaneKey = "map";
/* the knowledge graph's caveats are Korean sentences; the known ones have [en, it, fr], anything else falls back to one general sentence */
const CAVEATS = {
  "초록과 근거 인용문에서 기계로 추출한 관계입니다. 사람이 검증하지 않았습니다.": ["Relations are machine-extracted from abstracts and their evidence quotes. They have not been checked by people.",
    "Relazioni estratte automaticamente dagli abstract e dalle citazioni di evidenza. Non sono state verificate da persone.",
    "Relations extraites automatiquement des résumés et de leurs citations de preuve. Elles n'ont pas été vérifiées par des personnes."],
  "증가·감소는 대개 '질병군 대 대조군'의 상대 풍부도이며 인과가 아닙니다.": ["Increase/decrease usually means relative abundance in the condition group versus controls, not causation.",
    "Aumento/diminuzione indica di solito l'abbondanza relativa nel gruppo con la patologia rispetto ai controlli, non un rapporto di causa.",
    "Hausse/baisse désigne en général l'abondance relative dans le groupe malade par rapport aux témoins, pas une causalité."],
  "연도별 수집량이 달마다 상한이 있어, 추세는 논문 수가 아니라 '비율' 기준입니다.": ["Collection is capped every month, so trends are based on shares, not on paper counts.",
    "La raccolta ha un tetto mensile, quindi le tendenze si basano sulle quote, non sul numero di articoli.",
    "La collecte est plafonnée chaque mois : les tendances reposent donc sur des proportions, pas sur le nombre d'articles."]};
const caveats = list => { const out = []; let other = false;
  (list || []).forEach(c => { if (CAVEATS[c]) out.push(K(c, ...CAVEATS[c])); else other = true; });
  if (other || !out.length) out.push(K("", "Machine-extracted from abstracts and evidence quotes, not checked by people · increase/decrease is mostly condition vs control relative abundance, not causation."));
  return out; };
function insights(d) {
  INS = d;
  const T = {map: K("지식 지도", "Knowledge map"), consensus: K("합의 · 논쟁", "Consensus · debate"), signature: K("미생물 시그니처", "Microbe signatures"),
    trends: K("떠오르는 · 지는 주제", "Rising · fading"), gaps: K("연구 공백 · 다음 연구", "Gaps · next studies"), novel: K("MINERVA 대비 새 연결", "New vs MINERVA")};
  // newer sections: a tab only when the data carries the key (older releases simply do not show them)
  const hk = (...a) => a.some(x => d[x] !== undefined);
  if (hk("reversal")) T.reversal = K("되돌리기 후보", "Reversal candidates");
  if (hk("evidence_quality", "translation_gap", "resolution")) T.quality = K("근거 품질", "Evidence quality");
  if (hk("trials", "industry")) T.clinic = K("임상 → 제품", "From evidence to clinic");
  if (hk("severity", "risk", "mechanism_triangles")) T.severity = K("중증도·위험·기전", "Severity, risk, mechanisms");
  if (!T[ipaneKey]) ipaneKey = "map";
  const k = d.counts || {}, b = d.build || {};
  $("view").innerHTML = `<div class="kpis">
      <div class="kpi"><b>${fmt(b.papers_read)}</b><span>${K("읽은 논문", "Papers read")}</span></div>
      <div class="kpi"><b>${fmt((k.edges_associated || 0) + (k.edges_modulates || 0))}</b><span>${K("미생물 관계 (근거 문장)", "Microbe relations (evidence sentences)")}</span></div>
      <div class="kpi"><b>${fmt(k.Taxon)}</b><span>${K("미생물 노드", "Microbe nodes")}</span></div>
      <div class="kpi"><b>${fmt(k.edges_gap)}</b><span>${K("연구 공백 · 한계 진술", "Gap and limitation statements")}</span></div>
      <div class="kpi"><b>${k.relations_total ? Math.round(100 * (k.relations_ai_checked || 0) / k.relations_total) + "%" : "—"}</b><span>${K("AI 판정 + 비교 그룹 대조를 통과한 관계", "Relations passing the AI judge and group check")} (${fmt(k.relations_ai_checked)}/${fmt(k.relations_total)})</span></div>
      <div class="kpi"><b>${fmt(k.authors)}</b><span>${K("연구자", "Researchers")}</span></div></div>
    <div class="seg big-seg" id="iseg">${Object.entries(T).map(([key, n]) => `<button data-k="${key}" class="${key === ipaneKey ? "on" : ""}">${n}</button>`).join("")}</div>
    <div id="ipane"></div>
    ${lang === "ko" ? `<p class="hint">${(d.caveats || []).map(esc).join(" · ")}</p>` : `<p class="hint">${caveats(d.caveats).map(esc).join(" · ")}</p>`}`;
  const pane = $("ipane");
  const show = key => { ipaneKey = key; charts.splice(0).forEach(c => c.dispose()); pane.innerHTML = ""; ({map: imap, consensus: icons, signature: isig, trends: itrend, gaps: igaps, novel: inovel, reversal: irev, quality: iqual, clinic: iclinic, severity: isrm})[key](d, pane); };
  $("iseg").onclick = e => { const x = e.target.closest("button"); if (!x) return; document.querySelectorAll("#iseg button").forEach(y => y.classList.toggle("on", y === x)); show(x.dataset.k); };
  show(ipaneKey);
}
function imap(d, pane) {
  const N = d.network || {taxa: [], diseases: [], edges: []};
  pane.innerHTML = `<div class="row2"><div class="box"><h2>${K("미생물 ↔ 질병 지식 지도", "Microbe ↔ condition knowledge map")}</h2>
    ${readBox("i_map", (() => { const e = N.edges.slice().sort((a, b) => b.w - a.w)[0]; if (!e) return {}; const x = N.diseases.find(q => q.id === e.t);
      return {e, D: dx(e.t, x ? x.label : e.t), n: N.edges.length, c: N.edges.filter(q => q.contested).length}; })())}
    <div class="big" id="kg"></div></div><div class="box" id="kgside"><h2>${K("노드를 눌러 보세요", "Click a node")}</h2><p class="hint">${K("관계마다 증가·감소를 보고한 논문 수를 보여 줍니다.", "Shows how many sentences report each direction.")}</p></div></div>`;
  const maxT = Math.max(...N.taxa.map(t => t.w), 1), maxD = Math.max(...N.diseases.map(t => t.w), 1);
  const nodes = N.diseases.map(x => ({id: "D:" + x.id, name: dx(x.id, x.label), category: 0, symbolSize: 18 + 42 * Math.sqrt(x.w / maxD), value: x.w,
      label: {show: true, color: "#fde68a", fontWeight: 700}}))
    .concat(N.taxa.map(x => ({id: "T:" + x.id, name: x.id, category: 1, symbolSize: 8 + 26 * Math.sqrt(x.w / maxT), value: x.w,
      label: {show: x.w > maxT * 0.18, color: "#99f6e4", fontStyle: "italic"}})));
  const links = N.edges.map(e => ({source: "T:" + e.s, target: "D:" + e.t, value: e.w, raw: e,
    lineStyle: {color: e.contested ? MIX : e.score > 0 ? UP : DOWN, width: 0.6 + Math.sqrt(e.w) * 0.9, type: e.contested ? "dashed" : "solid", opacity: 0.55, curveness: 0.12}}));
  const dlab = id => { const x = N.diseases.find(q => q.id === id); return dx(id, x ? x.label : id); };
  const g = chart("kg", {tooltip: {formatter: p => p.dataType === "edge" ? `${esc(p.data.raw.s)} → ${esc(dlab(p.data.raw.t))}<br>${K("근거", "Evidence")} ${p.data.value} · ${dirWord(p.data.raw.score)}` : `<b>${esc(p.data.name)}</b><br>${K("근거", "Evidence")} ${fmt(p.data.value)}`},
    series: [{type: "graph", layout: "force", roam: true, draggable: true, data: nodes, links,
      categories: [{name: K("질병", "Condition"), itemStyle: {color: C.amber, shadowBlur: 18, shadowColor: "#fbbf2466"}}, {name: K("미생물", "Microbe"), itemStyle: {color: C.teal, shadowBlur: 10, shadowColor: "#2dd4bf55"}}],
      force: {repulsion: 260, edgeLength: [60, 190], gravity: 0.06, friction: 0.12}, emphasis: {focus: "adjacency", lineStyle: {opacity: 1}},
      animationDurationUpdate: 1600}]});
  const side = id => { const isD = id.startsWith("D:"), key = id.slice(2);
    const es = N.edges.filter(e => isD ? e.t === key : e.s === key).sort((a, b) => b.w - a.w);
    $("kgside").innerHTML = `<h2>${esc(isD ? dlab(key) : key)}</h2>${readBox("i_side", es.length ? {X: isD ? es[0].s : dlab(es[0].t), isT: isD, e: es[0], n: es.length} : {})}
      <table><tbody>${es.map(e => `<tr><td>${esc(isD ? e.s : dlab(e.t))}</td>
        <td style="width:45%"><div class="bal"><i style="width:${50 + 50 * e.score}%;background:${e.contested ? MIX : e.score > 0 ? UP : DOWN}"></i></div></td>
        <td class="n">${e.w}</td><td style="color:${e.contested ? MIX : e.score > 0 ? UP : DOWN}">${dirWord(e.score)}</td></tr>`).join("")}</tbody></table>`; };
  g.on("click", p => { if (p.dataType === "node") side(p.data.id); });
  if (N.diseases.length) side("D:" + N.diseases.slice().sort((a, b) => b.w - a.w)[0].id);
}
// replication (newer data): independent author groups and years; contradictions show the groups behind each direction
const repCell = p => p.groups_increase != null || p.groups_decrease != null
  ? `<span style="color:${DOWN}">↓${fmt(p.groups_decrease)}</span> / <span style="color:${UP}">↑${fmt(p.groups_increase)}</span><small>${K("그룹", "groups")} · ${yrs(p)}</small>`
  : `${fmt(p.groups)} <small>${K("그룹", "groups")} · ${yrs(p)}</small>${p.robust ? `<br>${robustB(true)}` : ""}`;
function pairTable(rows, withMinerva, withRep) {
  withRep = withRep && rows.some(p => p.groups != null);
  return `<table><thead><tr><th>${K("미생물", "Microbe")}</th><th>${K("질병", "Condition")}</th><th>${K("감소 ◀ ▶ 증가", "Lower ◀ ▶ higher")}</th><th class="n">${K("논문", "Papers")}</th>${withRep ? `<th data-tip="${esc(K("공저자를 공유하지 않는 독립 연구 그룹 수와 보고 연도", "Independent author groups (no shared author) and years reported"))}">${K("재현", "Replication")}</th>` : ""}${withMinerva ? "<th>MINERVA</th>" : ""}</tr></thead><tbody>${rows.map((p, i) => {
    const tot = p.inc + p.dec || 1;
    return `<tr class="click" data-i="${i}"><td><i>${esc(p.taxon)}</i></td><td>${esc(dx(p.disease, p.disease_label))}</td>
      <td style="width:34%"><div class="div"><span style="width:${50 * p.dec / tot}%;background:${DOWN}"></span><span style="width:${50 * p.inc / tot}%;background:${UP}"></span></div>
      <small>${p.dec} ◀ ▶ ${p.inc}${p.null ? " · " + K("차이 없음", "no difference") + " " + p.null : ""}${p.ai_checked && level !== "eli10" ? ` · <span style="color:var(--violet)">${K("그룹 대조 확인", "group-checked")} ${p.ai_checked}</span>` : ""}</small></td><td class="n">${p.papers}</td>${withRep ? `<td class="rep">${p.groups != null ? repCell(p) : "—"}</td>` : ""}
      ${withMinerva ? `<td>${p.minerva == null ? "—" : p.minerva.disease_missing ? `<span style="color:var(--dim)">${K("질병 없음", "no condition")}</span>` : p.minerva.absent ? `<span style="color:var(--lime)">${K("없음 (새 연결)", "absent (new link)")}</span>` : (p.minerva_agrees === false ? `<span style="color:var(--coral)">${K("반대 방향", "opposite")}</span>` : `<span style="color:var(--teal)">${K("같은 방향", "same direction")}</span>`)}</td>` : ""}</tr>`; }).join("")}</tbody></table>`;
}
function icons(d, pane) {
  const mc = d.minerva_compared;
  const top = rows => rows.slice().sort((a, b) => b.papers - a.papers)[0], C40 = d.consensus.slice(0, 40), X40 = d.contradictions.slice(0, 40), hasRep = rows => rows.some(p => p.groups != null);
  const nsA = ((((d.evidence_quality || {}).publication_bias || {}).by_type || {}).ASSOCIATED || {}).null_share;
  const c1 = top(C40), c2 = top(X40);
  pane.innerHTML = `<div class="row2"><div class="box"><h2>${K("논문들이 한목소리로 말하는 관계", "Relations papers agree on")}</h2>${readBox("i_cons", c1 ? {p: c1, D: dx(c1.disease, c1.disease_label), N: C40.length, r: hasRep(C40) ? C40.filter(p => p.robust).length : null, ns: nsA} : {})}
      <div class="scroll" id="cons">${pairTable(d.consensus.slice(0, 40), mc, true)}</div></div>
    <div class="box"><h2>${K("논문끼리 부딪히는 관계 (논쟁 중)", "Relations papers disagree on")}</h2>${readBox("i_contra", c2 ? {p: c2, D: dx(c2.disease, c2.disease_label), N: X40.length, b: X40.some(p => p.groups_increase != null) ? X40.filter(p => p.groups_increase >= 2 && p.groups_decrease >= 2).length : null} : {})}
      <div class="scroll" id="contra">${pairTable(d.contradictions.slice(0, 40), mc, true)}</div></div></div>
    <div class="box detail" id="ev"><h2>${K("근거 문장", "Evidence sentences")}</h2><p class="hint">${K("왼쪽 표에서 쌍을 고르면 여기에 원문 인용과 요약이 나옵니다.", "Pick a pair in a table to see the quoted source sentences here.")}</p></div>`;
  const pick = (rows, el) => el.onclick = e => { const t = e.target.closest("tr[data-i]"); if (!t) return; const p = rows[+t.dataset.i];
    $("ev").innerHTML = `<h2><i>${esc(p.taxon)}</i> · ${esc(dx(p.disease, p.disease_label))}</h2><p class="hint">${K("증가", "increase")} ${p.inc} · ${K("감소", "decrease")} ${p.dec} · ${K("차이 없음", "no difference")} ${p.null} · ${K("논문", "papers")} ${p.papers}${p.groups != null ? `<br>${K("독립 그룹", "independent groups")} ${fmt(p.groups)}${p.groups_increase != null ? ` (↑${fmt(p.groups_increase)} / ↓${fmt(p.groups_decrease)})` : ""} · ${K("연도", "years")} ${yrs(p)} · ${K("학술지", "journals")} ${fmt(p.journals)}${p.cited_share != null ? " · " + K("인용된 비율", "cited share") + " " + pc(p.cited_share, 0) : ""} ${robustB(p.robust)}` : ""}</p>
      <div class="row2">${(p.examples || []).map(quoteCard).join("") || `<p class="hint">${K("상위 40개만 예시 문장을 미리 계산합니다.", "Example sentences are precomputed for the top 40 only.")}</p>`}</div>`; };
  pick(d.consensus, $("cons")); pick(d.contradictions, $("contra"));
}
function isig(d, pane) {
  const E = (d.network || {}).edges || [], taxa = [...new Set(E.map(e => e.s))], dis = d.network.diseases.slice().sort((a, b) => b.w - a.w).slice(0, 22);
  const tw = {}; E.forEach(e => tw[e.s] = (tw[e.s] || 0) + e.w); const tt = taxa.sort((a, b) => tw[b] - tw[a]).slice(0, 30);
  const dlab = id => { const x = d.network.diseases.find(q => q.id === id); return dx(id, x ? x.label : id); };
  const data = []; E.forEach(e => { const x = dis.findIndex(q => q.id === e.t), y = tt.indexOf(e.s); if (x >= 0 && y >= 0) data.push([x, y, e.score, e.w]); });
  const hmTop = data.slice().sort((a, b) => b[3] - a[3])[0], SG = (d.signatures || []).slice(0, 30);
  pane.innerHTML = `<div class="row2"><div class="box"><h2>${K("미생물 × 질병 방향 지도", "Microbe × condition direction map")}</h2>${readBox("i_hm", hmTop ? {n: data.length, r: data.filter(x => x[2] > .25).length, b: data.filter(x => x[2] < -.25).length, m: data.filter(x => Math.abs(x[2]) <= .25).length, top: {s: tt[hmTop[1]], w: hmTop[3]}, D: dlab(dis[hmTop[0]].id)} : {})}<div class="big" id="hm" style="height:760px"></div></div>
    <div class="box"><h2>${K("여러 질병에 공통으로 나타나는 미생물", "Microbes shared across conditions")}</h2>${readBox("i_sigs", SG.length ? {s: SG[0], hb: SG.filter(x => x.down.length > x.up.length).length} : {})}<div class="scroll" style="max-height:760px">
    ${(d.signatures || []).slice(0, 30).map(s => `<div class="sig"><b><i>${esc(s.taxon)}</i></b><small>${K("질병", "conditions")} ${s.diseases} · ${K("근거", "evidence")} ${s.evidence}</small>
      <div class="div"><span style="width:${50 * s.down.length / s.diseases}%;background:${DOWN}"></span><span style="width:${50 * s.up.length / s.diseases}%;background:${UP}"></span></div>
      <div class="chips">${s.down.map(x => `<span class="chip" style="color:${DOWN}">↓ ${esc(dlab(x))}</span>`).join("")}${s.up.map(x => `<span class="chip" style="color:${UP}">↑ ${esc(dlab(x))}</span>`).join("")}</div></div>`).join("")}</div></div></div>`;
  chart("hm", {grid: {left: 150, right: 20, top: 10, bottom: 110}, tooltip: {formatter: p => `${esc(tt[p.data[1]])} · ${esc(dlab(dis[p.data[0]].id))}<br>${K("근거", "Evidence")} ${p.data[3]} · ${dirWord(p.data[2])}`},
    xAxis: {type: "category", data: dis.map(x => dlab(x.id)), axisLabel: {color: C.muted, rotate: 50, fontSize: 11}, splitArea: {show: false}},
    yAxis: {type: "category", data: tt, inverse: true, axisLabel: {color: "#99f6e4", fontStyle: "italic", fontSize: 11}},
    visualMap: {min: -1, max: 1, show: false, inRange: {color: [DOWN, "#1e293b", UP]}, dimension: 2},
    series: [{type: "heatmap", data, label: {show: true, formatter: p => p.data[3], color: "#f1f5f9", fontSize: 10}, itemStyle: {borderColor: "#04070f", borderWidth: 2, borderRadius: 4}}]});
}
function itrend(d, pane) {
  const CAT = {Disease: K("질병", "Conditions"), Taxon: K("미생물", "Microbes"), Intervention: K("개입", "Interventions"), Metabolite: K("대사물질", "Metabolites"), Method: K("연구 방법", "Methods"), BodySite: K("몸 부위", "Body sites")};
  pane.innerHTML = `<div class="seg" id="cseg">${Object.entries(CAT).map(([k, n], i) => `<button data-k="${k}" class="${i ? "" : "on"}">${n}</button>`).join("")}</div>
    <div class="row2"><div class="box"><h2>${K("떠오르는 주제", "Rising")}</h2>${readBox("i_rise", null, "rb-rise")}<div class="mid" id="rise"></div></div>
    <div class="box"><h2>${K("관심이 줄어드는 주제", "Fading")}</h2>${readBox("i_fade", null, "rb-fade")}<div class="mid" id="fade"></div></div></div>
    <div class="row2"><div class="box"><h2>${K("연도별 언급 비율 (상위 떠오르는 주제)", "Share by year (top rising)")}</h2>${readBox("i_lines", null, "rb-lines")}<div class="mid" id="lines"></div></div>
    <div class="box"><h2>${K("떠오르는 주제를 이끄는 연구자 (최근 3년)", "Researchers leading rising topics (last 3 years)")}</h2>${readBox("i_lead", null, "rb-lead")}<div id="lead" class="scroll" style="max-height:380px"></div></div></div>`;
  const draw = cat => { charts.splice(0).forEach(c => c.dispose()); const t = d.trends[cat];
    { const isT = cat === "Taxon", r = (t.rising || [])[0], f = (t.fading || [])[0];
      rbKey("rb-rise", "i_rise", r ? {r, N: trendName(cat, r), isT} : {}); rbKey("rb-fade", "i_fade", f ? {r: f, N: trendName(cat, f), isT} : {});
      const S = r ? r.series || [] : [], i0 = S.findIndex(v => v > 0), i1 = S.length - 1;
      rbKey("rb-lines", "i_lines", r && i0 >= 0 && i0 < i1 ? {N: trendName(cat, r), isT, y0: d.years[i0], y1: d.years[i1], a: S[i0], b: S[i1]} : {});
      const L = r ? ((d.leaders || {})[cat + ":" + r.id] || []) : []; rbKey("rb-lead", "i_lead", L.length ? {N: trendName(cat, r), isT, a: L[0]} : {}); }
    const bar = (el, rows, color) => chart(el, {grid: {left: 150, right: 60, top: 10, bottom: 20}, tooltip: {formatter: p => `${esc(trendName(cat, rows[p.dataIndex]))}<br>${K("최근", "recent")} ${(rows[p.dataIndex].share_recent * 100).toFixed(2)}% · ${K("이전", "before")} ${(rows[p.dataIndex].share_prior * 100).toFixed(2)}% · ${K("논문", "papers")} ${fmt(rows[p.dataIndex].papers)}`},
      xAxis: {type: "value", axisLabel: {color: C.dim, formatter: v => "×" + v}, splitLine: {lineStyle: {color: C.line}}},
      yAxis: {type: "category", inverse: true, data: rows.map(r => trendName(cat, r)), axisLabel: {color: C.text, fontStyle: cat === "Taxon" ? "italic" : "normal"}},
      series: [{type: "bar", data: rows.map(r => r.growth), itemStyle: {color, borderRadius: [0, 6, 6, 0]}, label: {show: true, position: "right", color: C.muted, formatter: p => "×" + p.value.toFixed(2)}, animationDelay: i => i * 60}]});
    bar("rise", t.rising.slice(0, 12), new echarts.graphic.LinearGradient(0, 0, 1, 0, [{offset: 0, color: "#14532d"}, {offset: 1, color: C.lime}]));
    bar("fade", t.fading.slice(0, 12), new echarts.graphic.LinearGradient(0, 0, 1, 0, [{offset: 0, color: "#3f1d2b"}, {offset: 1, color: C.coral}]));
    const top = t.rising.slice(0, 6);
    chart("lines", {grid: {left: 50, right: 20, top: 30, bottom: 30}, tooltip: {trigger: "axis", valueFormatter: v => (v * 100).toFixed(2) + "%"}, legend: {top: 0, textStyle: {color: C.muted}, type: "scroll"},
      xAxis: {type: "category", data: d.years, axisLabel: {color: C.muted}}, yAxis: {axisLabel: {color: C.dim, formatter: v => (v * 100).toFixed(1) + "%"}, splitLine: {lineStyle: {color: C.line}}},
      series: top.map((r, i) => ({type: "line", name: trendName(cat, r), data: r.series, smooth: true, symbolSize: 6, lineStyle: {width: 3, color: PAL[i]}, itemStyle: {color: PAL[i]}, areaStyle: {opacity: 0.06}}))});
    $("lead").innerHTML = t.rising.slice(0, 6).map(r => { const L = (d.leaders || {})[cat + ":" + r.id] || [];
      return `<div class="sig"><b>${esc(trendName(cat, r))}</b> <small>×${r.growth.toFixed(2)}</small><div class="chips">${L.map(a => `<span class="chip">${esc(a.name)} · ${a.papers}</span>`).join("") || '<span class="chip">—</span>'}</div></div>`; }).join(""); };
  $("cseg").onclick = e => { const x = e.target.closest("button"); if (!x) return; document.querySelectorAll("#cseg button").forEach(y => y.classList.toggle("on", y === x)); draw(x.dataset.k); };
  draw("Disease");
}
function igaps(d, pane) {
  const G = d.gaps, th = G.themes.filter(t => t.id !== "other"), M = G.matrix, lab = {}, byKo = {};
  G.themes.forEach(t => { lab[t.id] = theme(t.id, t.label); byKo[t.label] = theme(t.id, t.label); });
  pane.innerHTML = `<div class="box"><h2>${K("다음에 해야 할 연구 (자동 우선순위)", "What to study next (automatic priority)")}</h2>${readBox("i_next", d.next.length ? {c: d.next[0], D: dx(d.next[0].disease, d.next[0].label)} : {})}<div class="cards" id="next"></div></div>
    <div class="row2"><div class="box"><h2>${K("질병별로 저자들이 털어놓은 한계", "Limitations authors state, by condition")}</h2>${readBox("i_gm", (() => { let b = null; M.values.forEach((row, y) => row.forEach((v, x) => { if (v && (!b || v > b[2])) b = [x, y, v]; }));
      return b ? {D: dx(M.diseases[b[1]].id, M.diseases[b[1]].label), T: lab[M.themes[b[0]]] || M.themes[b[0]], n: b[2]} : {}; })())}<div class="big" id="gm" style="height:640px"></div></div>
    <div class="box"><h2>${K("가장 자주 나오는 한계", "Most frequent limitations")}</h2>${readBox("i_gt", (() => { const o = th.slice().sort((a, b) => b.papers - a.papers).map(t => ({T: lab[t.id], n: t.papers})); return {a: o[0], b: o[1]}; })())}<div class="mid" id="gt"></div><div id="gq" class="scroll" style="max-height:250px"></div></div></div>`;
  $("next").innerHTML = d.next.slice(0, 12).map((c, i) => { const s = c.signals;
    return `<div class="ncard"><div class="nrank">${i + 1}</div><h3>${esc(dx(c.disease, c.label))}</h3>
      <div class="chips"><span class="chip" style="color:${s.growth >= 1.2 ? C.lime : s.growth < 0.9 ? C.coral : C.muted}">${K("관심", "interest")} ×${s.growth}</span><span class="chip" style="color:${s.contradictions ? MIX : C.muted}">${K("논쟁", "conflicts")} ${s.contradictions}</span>
      <span class="chip">${K("한계 진술", "limitations")} ${s.gap_statements}</span><span class="chip">${K("논문", "papers")} ${fmt(s.papers)}</span>${s.new_vs_minerva ? `<span class="chip" style="color:var(--lime)">${K("새 연결", "new links")} ${s.new_vs_minerva}</span>` : ""}</div>
      ${c.top_gaps.length && level !== "eli10" ? `<p><b>${K("채워야 할 것", "To fill")}:</b> ${c.top_gaps.map(x => esc(byKo[x] || x)).join(" · ")}</p>` : ""}
      ${c.contested.length ? `<p><b>${K("결론이 갈리는 미생물", "Microbes with split results")}:</b> <i>${c.contested.map(esc).join(", ")}</i></p>` : ""}
      ${c.emerging.length && level !== "eli10" ? `<p><b>${K("새로 떠오른 연결", "Newly emerging links")}:</b> <i>${c.emerging.map(esc).join(", ")}</i></p>` : ""}</div>`; }).join("");
  const data = []; M.values.forEach((row, y) => row.forEach((v, x) => v && data.push([x, y, v])));
  chart("gm", {grid: {left: 150, right: 10, top: 10, bottom: 120}, tooltip: {formatter: p => `${esc(dx(M.diseases[p.data[1]].id, M.diseases[p.data[1]].label))} · ${esc(lab[M.themes[p.data[0]]])}<br>${K("논문", "papers")} ${p.data[2]}`},
    xAxis: {type: "category", data: M.themes.map(t => lab[t] || t), axisLabel: {color: C.muted, rotate: 40, fontSize: 11}},
    yAxis: {type: "category", inverse: true, data: M.diseases.map(x => dx(x.id, x.label)), axisLabel: {color: C.text, fontSize: 11}},
    visualMap: {min: 0, max: Math.max(...data.map(x => x[2]), 1), show: false, inRange: {color: ["#0d1530", "#5b21b6", C.violet, "#f0abfc"]}},
    series: [{type: "heatmap", data, label: {show: true, color: "#f1f5f9", fontSize: 10}, itemStyle: {borderColor: "#04070f", borderWidth: 2, borderRadius: 4}}]});
  const gt = chart("gt", {grid: {left: 190, right: 40, top: 10, bottom: 20}, tooltip: {}, xAxis: {type: "value", axisLabel: {color: C.dim}, splitLine: {lineStyle: {color: C.line}}},
    yAxis: {type: "category", inverse: true, data: th.map(t => lab[t.id]), axisLabel: {color: C.text}},
    series: [{type: "bar", data: th.map(t => t.papers), itemStyle: {color: C.violet, borderRadius: [0, 6, 6, 0]}, label: {show: true, position: "right", color: C.muted}}]});
  const q = i => { $("gq").innerHTML = `<p class="hint">${esc(lab[th[i].id])} — ${K("예시", "examples")}</p>` + th[i].examples.map(quoteCard).join(""); };
  gt.on("click", p => q(p.dataIndex)); q(0);
}
function inovel(d, pane) {
  if (!d.minerva_compared) {
    pane.innerHTML = `<div class="box"><h2>${K("MINERVA 대비 새 연결", "New vs MINERVA")}</h2><p class="hint">${K("MINERVA 비교 자료가 아직 없습니다.", "No MINERVA comparison yet.")}</p></div>`;
    return;
  }
  const opp = d.consensus.filter(p => p.minerva_agrees === false), A = d.minerva_agreement || {};
  pane.innerHTML = `<div class="kpis"><div class="kpi"><b>${fmt(A.minerva_pairs)}</b><span>${K("MINERVA 미생물→질병 관계", "MINERVA microbe→condition relations")}</span></div>
      <div class="kpi"><b>${A.compared ? Math.round(100 * A.agree / A.compared) + "%" : "—"}</b><span>${K("우리 합의 관계 중 MINERVA와 같은 방향", "Our consensus relations pointing the same way as MINERVA")} (${fmt(A.agree)}/${fmt(A.compared)})</span></div>
      <div class="kpi"><b>${fmt((d.novel || []).length)}</b><span>${K("MINERVA에 없는 새 연결", "Links not in MINERVA")}</span></div>
      <div class="kpi"><b>${fmt(opp.length)}</b><span>${K("방향이 반대인 연결", "Opposite-direction links")}</span></div>
      <div class="kpi"><b>${fmt((A.diseases_unmapped_in_minerva || []).length)}</b><span>${K("MINERVA에 대응 질병이 없는 분류", "Our classes with no MINERVA condition")}</span></div></div>
    <div class="row2"><div class="box"><h2>${K("MINERVA에 아직 없는 연결", "Links MINERVA does not have yet")}</h2>${readBox("i_nv", (() => { const p = (d.novel || []).slice().sort((a, b) => b.papers - a.papers)[0]; return p ? {n: d.novel.length, p, D: dx(p.disease, p.disease_label)} : {}; })())}<div class="scroll" id="nv">${pairTable(d.novel || [], true)}</div></div>
    <div class="box"><h2>${K("MINERVA와 방향이 반대인 연결", "Links opposite to MINERVA")}</h2>${readBox("i_opp", {o: opp.length, A})}<div class="scroll">${pairTable(opp, true)}</div></div></div>
    <div class="box detail" id="ev"><h2>${K("근거 문장", "Evidence sentences")}</h2></div>`;
  $("nv").onclick = e => { const t = e.target.closest("tr[data-i]"); if (!t) return; const p = d.novel[+t.dataset.i];
    $("ev").innerHTML = `<h2><i>${esc(p.taxon)}</i> · ${esc(dx(p.disease, p.disease_label))}</h2><div class="row2">${(p.examples || []).map(quoteCard).join("")}</div>`; };
}

/* ---------------- insight lab: evidence sections (reversal, quality, clinic, severity) ----------------
   Every key (reversal, evidence_quality, translation_gap, severity, risk, mechanism_triangles, resolution, trials, industry,
   caveats_sections, labels_ko_sections) may be missing or null in older data: each block then shows a short note or is left out. */
// labels for the new categorical values: data first (labels_ko_sections / labels_en), else these defaults [ko, en]
const SECDEF = {
  reversal_direction: {restore: ["회복 (줄어든 미생물 올리기)", "Restore (raise a depleted taxon)"], suppress: ["억제 (늘어난 미생물 낮추기)", "Suppress (lower an enriched taxon)"]},
  quadrant: {opportunity: ["기회", "Opportunity"], crowded: ["경쟁 과열", "Crowded"], speculative: ["근거 약함", "Speculative"], early: ["초기", "Early"]},
  subgroup_kind: {response: ["치료 반응", "Treatment response"], recurrence: ["재발·관해", "Relapse / remission"], survival: ["생존·예후", "Survival / prognosis"], severity: ["중증도·병기", "Severity / stage"], other: ["기타", "Other"]},
  translation_state: {gap: ["동물만", "Animal only"], confirmed: ["사람에서 확인", "Confirmed in humans"], discordant: ["사람에서 반대", "Opposite in humans"], pending: ["사람 자료 부족", "Too little human data"]}};
const slab = (cat, id) => { const def = (SECDEF[cat] || {})[id];
  if (lang === "ko") return (((INS || {}).labels_ko_sections || {})[cat] || {})[id] || (def ? def[0] : id);
  return nm(EN(cat)[id] || (def ? def[1] : id)); };
const iv = (id, ko) => lang === "ko" ? (ko || EN("intervention")[id] || id) : nm(cap(EN("intervention")[id] || id));
const mt = (id, ko) => lang === "ko" ? (ko || EN("metabolite")[id] || id) : nm(cap(EN("metabolite")[id] || id));
// section caveat from the data (ko/en; Italian and French through the dictionaries)
const secCav = key => { const c = ((INS || {}).caveats_sections || {})[key]; if (!c) return "";
  const t = lang === "ko" ? (c.ko || c.en) : lang === "en" ? (c.en || "") : (c[lang] || xlate(c.en || ""));
  return t ? `<p class="cav"><b>!</b> ${esc(t)}</p>` : ""; };
// short English notes written by the engine; Korean here, Italian and French through the dictionaries
const NOTE_KO = {"strain designation = culture-collection number (DSM, ATCC, ...) or 'strain X' in the sentence": "균주 표기 = 문장에 배양 기관 번호(DSM, ATCC 등)나 'strain X'가 있음"};
const noteT = en => !en ? "" : lang === "ko" ? (NOTE_KO[en] || en) : lang === "en" ? en : xlate(en);
const bdg = (t, cls, tip) => `<span class="bdg ${cls || ""}"${tip ? ` data-tip="${esc(tip)}"` : ""}>${t}</span>`;
const pc = (v, dg) => v == null ? "—" : (v * 100).toFixed(dg == null ? 1 : dg) + "%";
const yrs = q => q && q.first_year ? (q.first_year === q.last_year ? String(q.first_year) : q.first_year + "–" + q.last_year) : "—";
const qline = q => q ? `${K("논문", "papers")} ${fmt(q.papers)} · ${K("독립 그룹", "independent groups")} ${fmt(q.groups)} · ${K("연도", "years")} ${yrs(q)} · ${K("학술지", "journals")} ${fmt(q.journals)}${q.cited_share != null ? " · " + K("인용된 비율", "cited share") + " " + pc(q.cited_share, 0) : ""}` : "";
const robustB = r => r ? bdg(K("독립 재현", "replicated"), "ok", K("독립 그룹 3개 이상, 3년 이상에 걸쳐 보고", "Reported by ≥3 independent author groups over ≥3 years")) : "";
const qcard = (x, extra) => `<div class="paper"><div class="find">“${esc(x.quote)}”</div><div class="meta"><span>${esc(x.year || "")}${extra ? " · " + extra : ""}</span>${pm(x)}</div></div>`;
const noData = (title, msg) => `<div class="box"><h2>${title}</h2><p class="hint">${msg}</p></div>`;
const NODATA = () => K("이 자료에는 아직 이 분석이 없습니다. 다음 지식 그래프 재생성 후에 나타납니다.", "This analysis is not in the current data yet. It appears after the next knowledge-graph rebuild.");
const opt = (v, t, n) => `<option value="${esc(v)}">${esc(t)}${n != null ? " (" + n + ")" : ""}</option>`;
const arrow = s => s === "lower" || s === "decrease" ? "↓" : "↑";
const narrow = () => (window.innerWidth || 1200) < 640;      // phone width: smaller chart margins

/* ---------------- "how to read" blocks: what it shows · how to read it · key point ----------------
   Every chart and table box opens with one (readBox, right under the box title). RB[name] holds the fixed texts per level,
   {eli10, eli20, pro}: [ko, en, it, fr] (pro falls back to eli20); RB[name].key(ctx) computes the key point from the data on screen
   and returns the same shape, or null to leave the line out. rbKey() refreshes the key point when a filter changes. */
const RBL = {what: ["무엇", "What", "Cosa", "Quoi"], how: ["읽는 법", "How to read", "Come leggerlo", "Comment lire"], key: ["핵심", "Key point", "Punto chiave", "À retenir"]};
const lv = o => { if (o == null || o === "") return ""; if (typeof o === "string") return o; if (Array.isArray(o)) return K(o[0], o[1], o[2], o[3]) || "";
  return lv(o[level] || o.eli20 || o.eli10); };
const rbKeyText = (name, ctx) => { const f = (RB[name] || {}).key; if (!f) return ""; try { return lv(f(ctx || {})); } catch (e) { return ""; } };
const rbRow = (k, t) => `<p class="rb-${k}"${t ? "" : " hidden"}><b>${K(...RBL[k])}</b><span>${t || ""}</span></p>`;
function readBox(name, ctx, id) { const s = RB[name] || {}, how = typeof s.how === "function" ? s.how(ctx || {}) : s.how;
  return `<div class="rb rb-${level}" data-rb="${name}"${id ? ` id="${id}"` : ""}>${rbRow("what", lv(s.what))}${rbRow("how", lv(how))}${rbRow("key", rbKeyText(name, ctx))}</div>`; }
function rbKey(id, name, ctx) { const p = document.querySelector(`#${id} .rb-key`); if (!p) return; const t = rbKeyText(name, ctx);
  p.hidden = !t; p.querySelector("span").innerHTML = t; }
// number and wording helpers for the key points (page locale)
const pf = (v, dg) => v == null || isNaN(v) ? "—" : new Intl.NumberFormat(LOC(), {style: "percent", maximumFractionDigits: dg == null ? 1 : dg}).format(v);
const spf = (v, dg) => v == null || isNaN(v) ? "—" : new Intl.NumberFormat(LOC(), {style: "percent", maximumFractionDigits: dg == null ? 1 : dg, signDisplay: "exceptZero"}).format(v);
const n1 = v => Number(v).toLocaleString(LOC(), {maximumFractionDigits: 1});
const xf = v => "×" + n1(v);
const fd = s => { if (!s) return ""; const t = String(s);
  if (/^\d{4}-\d{2}$/.test(t)) { const x = new Date(t + "-15T12:00:00Z"); return isNaN(x) ? t : x.toLocaleDateString(LOC(), {year: "numeric", month: "short", timeZone: "UTC"}); }
  if (!/^\d{4}-\d{2}-\d{2}/.test(t)) return t;
  const x = new Date(t.slice(0, 10) + "T12:00:00Z"); return isNaN(x) ? t : x.toLocaleDateString(LOC(), {year: "numeric", month: "short", day: "numeric", timeZone: "UTC"}); };
const ti = t => `<i>${esc(t)}</i>`;                           // a taxon, always in italics and never translated
// a label in the middle of an English, Italian or French sentence: lower-case first letter unless it is an acronym or a proper name
const PROPER = /^(Alzheimer|Parkinson|Crohn|Hashimoto|Graves|Helicobacter|Clostridi|COVID|Down|Sjögren|Behçet|Kawasaki|Lyme|HIV|HPV|ADHD|IBD|IBS|MASLD|NAFLD|SLE|COPD|ME\/CFS|C\. |H\. |E\. )/;
const lc = s => { s = String(s == null ? "" : s); return lang === "ko" || !s || PROPER.test(s) || /^.[A-Z0-9]/.test(s) ? s : s.charAt(0).toLowerCase() + s.slice(1); };
const en_ = s => esc(lc(s));
const fde = s => /^[aeiouyhéèêàâîôûœ]/i.test(s) ? "d'" + s : "de " + s;     // French "de" with elision
const itP = p => { const s = String(p); return (/^0/.test(s) ? "lo " : /^(1[^0-9]|11[^0-9]|8)/.test(s) ? "l'" : "il ") + s; };   // Italian article before a percentage
// Korean particles after a word: hasJong = the last syllable ends in a consonant ("l" for ㄹ); Latin names and digits by their Korean reading
const jong = w => { const s = String(w == null ? "" : w).replace(/<[^>]+>/g, "").replace(/[\s)\]'"’”»%]+$/, ""), c = s.slice(-1); if (!c) return false;
  const k = c.charCodeAt(0); if (k >= 0xAC00 && k <= 0xD7A3) { const j = (k - 0xAC00) % 28; return j ? (j === 8 ? "l" : true) : false; }
  if (/[0-9]/.test(c)) return "1278".includes(c) ? (c === "2" ? false : "l") : "036".includes(c);
  if (/ng$/i.test(s)) return true; if (/[A-Z]/.test(c) && /[A-Z]{2}$/.test(s)) return c === "L" || c === "R" ? "l" : "MN".includes(c);
  return /[mn]/i.test(c) ? true : /l/i.test(c) ? "l" : false; };
const jp = (w, a, b) => { const j = jong(w); return j && !(a === "으로" && j === "l") ? a : b; };
const jo = (w, a, b) => w + jp(w, a, b);
const pl = (n, one, many) => Number(n) === 1 ? one : many;
const itPrep = (pre, p) => { const a = itP(p); return a.startsWith("lo ") ? pre + "llo " + a.slice(3) : a.startsWith("l'") ? pre + "ll'" + a.slice(2) : pre + "l " + a.slice(3); };   // dal/dall'/dallo, al/all'/allo
const andJ = xs => { xs = xs.filter(Boolean); if (xs.length < 2) return xs[0] || ""; const h = xs.slice(0, -1).join(", "), t = xs[xs.length - 1];
  return K(xs.join(", "), h + " and " + t, h + " e " + t, h + " et " + t); };
const thr = (path, def) => { let o = (INS || {}).thresholds; for (const k of path.split(".")) o = o == null ? undefined : o[k]; return o == null ? def : o; };
const RB = {
/* --- researchers --- */
p_rank: {
  what: {eli10: ["과학 보고서(논문)를 많이 쓴 과학자 순위예요.", "A ranking of scientists who wrote many science reports (papers).", "Una classifica degli scienziati che hanno scritto molti resoconti scientifici (articoli).", "Un classement des scientifiques qui ont écrit beaucoup de comptes rendus scientifiques (articles)."],
    eli20: ["이 코퍼스 안의 연구자를 논문 수·인용·h-지수·최근 1년 활동으로 줄 세운 표입니다.", "Researchers in this corpus ranked by papers, citations, h-index or last-year output.", "Ricercatori di questo corpus in classifica per articoli, citazioni, indice h o produzione dell'ultimo anno.", "Chercheurs de ce corpus classés par articles, citations, indice h ou production de la dernière année."]},
  how: {eli10: ["위 버튼으로 줄 세우는 기준을 바꿔요. 이름을 누르면 오른쪽에 그 사람 이야기가 나와요.", "Use the buttons to change how the list is sorted. Click a name to see that person on the right.", "Usa i pulsanti per cambiare l'ordine. Clicca un nome per vedere quella persona a destra.", "Utilise les boutons pour changer l'ordre. Clique sur un nom pour voir cette personne à droite."],
    eli20: ["버튼 = 순위 기준 · 이름 뒤 옅은 막대 = 그 기준 값의 상대 크기 · 행을 누르면 소속·최근 논문·공동 연구자가 나옵니다.", "Buttons = ranking measure · faint bar behind the name = relative size on that measure · click a row for affiliation, recent papers and co-authors.", "Pulsanti = criterio di classifica · barra chiara dietro il nome = valore relativo su quel criterio · clicca una riga per affiliazione, articoli recenti e coautori.", "Boutons = critère de classement · barre pâle derrière le nom = valeur relative sur ce critère · cliquez sur une ligne pour l'affiliation, les articles récents et les coauteurs."],
    pro: ["h-지수와 인용은 이 코퍼스 안의 논문과 관측된 인용만으로 계산합니다(전체 경력 아님). ORCID가 없으면 이름 문자열로 묶어 동명이인이 합쳐질 수 있습니다.", "h-index and citations use only papers and observed citations in this corpus, not whole careers. Without ORCID, authors are grouped by name string, so homonyms may merge.", "Indice h e citazioni usano solo gli articoli e le citazioni osservate in questo corpus, non l'intera carriera. Senza ORCID gli autori sono raggruppati per nome, quindi gli omonimi possono fondersi.", "L'indice h et les citations ne portent que sur les articles et citations observées de ce corpus, pas sur toute la carrière. Sans ORCID, les auteurs sont regroupés par nom : des homonymes peuvent fusionner."]},
  key: ({r, m, v}) => { if (!r) return null; const n = esc(r.label);
    return {eli10: [`지금 1등은 ${n} 과학자예요 (${m} ${v}).`, `Right now the top scientist is ${n} (${m}: ${v}).`, `Ora al primo posto c'è ${n} (${m}: ${v}).`, `En ce moment, la première place revient à ${n} (${m} : ${v}).`],
      eli20: [`현재 기준(${m}) 1위는 ${n}입니다(${v}). 순위는 생산량의 단서일 뿐 연구의 질을 뜻하지 않습니다.`, `On this measure (${m}) ${n} ranks first (${v}). Rankings reflect output, not research quality.`, `Con questo criterio (${m}) è primo ${n} (${v}). La classifica riflette la produzione, non la qualità della ricerca.`, `Selon ce critère (${m}), ${n} est en tête (${v}). Le classement reflète la production, pas la qualité de la recherche.`]}; }},
p_graph: {
  what: {eli10: ["누가 누구와 함께 과학 보고서를 썼는지 보여 주는 별자리예요.", "A star map of who wrote science reports together.", "Una mappa di stelle che mostra chi ha scritto resoconti scientifici insieme.", "Une carte d'étoiles qui montre qui a écrit des comptes rendus scientifiques ensemble."],
    eli20: ["논문 수 상위 200명 연구자의 공동 저자 연결망입니다.", "Co-authorship network of the 200 researchers with the most papers.", "Rete di coautorialità dei 200 ricercatori con più articoli.", "Réseau de co-signatures des 200 chercheurs ayant le plus d'articles."]},
  how: {eli10: ["별이 클수록 보고서를 많이 썼어요. 선은 함께 쓴 보고서, 색은 나라예요. 별을 누르면 그 사람이 나와요.", "Bigger stars wrote more reports. Lines join people who wrote together, colours are countries. Click a star to see the person.", "Le stelle più grandi hanno scritto più resoconti. Le linee uniscono chi ha scritto insieme, i colori sono i Paesi. Clicca una stella per vedere la persona.", "Plus l'étoile est grosse, plus la personne a écrit. Les traits relient ceux qui ont écrit ensemble, les couleurs sont les pays. Clique sur une étoile pour voir la personne."],
    eli20: ["점 크기 ∝ 논문 수 · 선 굵기 = 함께 쓴 논문 수 · 색 = 국가(상위 9개국, 나머지는 기타) · 확대·끌기 가능, 점을 누르면 위쪽 프로필이 바뀝니다.", "Dot size ∝ papers · line width = shared papers · colour = country (top 9, the rest 'other') · zoom and drag; click a dot to update the profile above.", "Dimensione del punto ∝ articoli · spessore della linea = articoli in comune · colore = Paese (primi 9, gli altri “altro”) · zoom e trascinamento; clicca un punto per aggiornare il profilo sopra.", "Taille du point ∝ articles · épaisseur du trait = articles communs · couleur = pays (9 premiers, les autres « autre ») · zoom et glisser ; cliquez sur un point pour mettre à jour le profil ci-dessus."],
    pro: ["노드 크기 = 6 + 4·√논문, 간선 = 상위 200명 안의 공동 저자 쌍. 힘 기반 배치라 위치와 거리에는 의미가 없습니다. 국가는 최근 소속 문자열 기준입니다.", "Node size = 6 + 4·√papers; edges = co-author pairs within the top 200. Force layout, so position and distance carry no meaning. Country from the latest affiliation string.", "Dimensione del nodo = 6 + 4·√articoli; archi = coppie di coautori entro i primi 200. Disposizione a forze: posizione e distanza non hanno significato. Paese dall'ultima stringa di affiliazione.", "Taille du nœud = 6 + 4·√articles ; arêtes = paires de coauteurs parmi les 200 premiers. Disposition par forces : position et distance n'ont pas de sens. Pays d'après la dernière chaîne d'affiliation."]},
  key: ({c, n, a, b, w}) => { if (!c) return null; c = esc(c); const pair = a ? [` 가장 굵은 선은 ${esc(a)}–${esc(b)}(공동 논문 ${w}편)입니다.`, ` The thickest line joins ${esc(a)} and ${esc(b)} (${w} shared papers).`, ` La linea più spessa unisce ${esc(a)} e ${esc(b)} (${w} articoli in comune).`, ` Le trait le plus épais relie ${esc(a)} et ${esc(b)} (${w} articles communs).`] : ["", "", "", ""];
    return {eli10: [`별이 가장 많은 나라는 ${jo(c, "이에요", "예요")} (${n}명).`, `Most of the stars are scientists from ${c} (${n}).`, `Il Paese con più stelle: ${c} (${n} scienziati).`, `Le pays qui a le plus d'étoiles : ${c} (${n} scientifiques).`],
      eli20: [`상위 200명 중 ${c} 소속이 ${n}명으로 가장 많습니다.${pair[0]}`, `${c} has the most researchers in the top 200 (${n}).${pair[1]}`, `${c} ha più ricercatori tra i primi 200 (${n}).${pair[2]}`, `${c} compte le plus de chercheurs parmi les 200 premiers (${n}).${pair[3]}`]}; }},
p_inst: {
  what: {eli10: ["과학 보고서를 가장 많이 낸 대학과 연구소예요.", "The universities and institutes that published the most science reports.", "Le università e gli istituti che hanno pubblicato più resoconti scientifici.", "Les universités et instituts qui ont publié le plus de comptes rendus scientifiques."],
    eli20: ["논문에 적힌 소속 기관별 논문 수와 연구자 수(상위 80곳)입니다.", "Top 80 institutions by papers, with their number of researchers, from the affiliations printed in papers.", "Le prime 80 istituzioni per numero di articoli, con il numero di ricercatori, dalle affiliazioni stampate negli articoli.", "Les 80 premières institutions par nombre d'articles, avec leur nombre de chercheurs, d'après les affiliations imprimées dans les articles."]},
  how: {eli10: ["위에 있을수록 보고서가 많아요. 이름 아래 작은 글씨는 주로 연구하는 주제예요.", "Higher up = more reports. The small text under each name shows its main topics.", "Più in alto = più resoconti. Il testo piccolo sotto il nome mostra i temi principali.", "Plus haut = plus de comptes rendus. Le petit texte sous chaque nom indique ses sujets principaux."],
    eli20: ["논문 수 순 · 작은 글씨 = 주요 주제 · 연구자 = 그 기관을 적은 저자 수", "Sorted by papers · small text = main topics · researchers = authors listing that institution", "Ordinate per articoli · testo piccolo = temi principali · ricercatori = autori che indicano quell'istituzione", "Triées par articles · petit texte = sujets principaux · chercheurs = auteurs qui citent cette institution"],
    pro: ["소속 문자열 기준이며 같은 기관의 표기 차이는 아직 합치지 않았습니다. 큰 대학 체계(예: University of California)는 여러 캠퍼스가 한 줄로 묶일 수 있습니다.", "Based on affiliation strings; spelling variants of one institution are not merged yet. Large systems (e.g. University of California) may combine several campuses in one row.", "Basato sulle stringhe di affiliazione; le varianti di grafia della stessa istituzione non sono ancora unite. I grandi sistemi (es. University of California) possono riunire più campus in una riga.", "Fondé sur les chaînes d'affiliation ; les variantes d'une même institution ne sont pas encore fusionnées. Les grands systèmes (p. ex. University of California) peuvent réunir plusieurs campus sur une ligne."]},
  key: ({x}) => { if (!x) return null; const n = esc(x.name), c = esc(x.country || "—"), p = fmt(x.papers), r = fmt(x.researchers);
    return {eli10: [`1등은 ${jo(n, "이에요", "예요")} (보고서 ${p}편).`, `Number one is ${n}, with ${p} reports.`, `Al primo posto c'è ${n}, con ${p} resoconti.`, `En tête : ${n}, avec ${p} comptes rendus.`],
      eli20: [`1위는 ${n}(${c})입니다. 논문 ${p}편, 연구자 ${r}명입니다.`, `${n} (${c}) ranks first with ${p} papers and ${r} researchers.`, `Prima è ${n} (${c}), con ${p} articoli e ${r} ricercatori.`, `${n} (${c}) arrive en tête avec ${p} articles et ${r} chercheurs.`]}; }},
/* --- interest shifts --- */
r_sc: {
  what: {eli10: ["요즘 과학자들이 더 많이, 또는 덜 이야기하는 주제를 점으로 보여 줘요.", "Dots for topics scientists talk about more, or less, lately.", "Punti per gli argomenti di cui gli scienziati parlano di più, o di meno, ultimamente.", "Des points pour les sujets dont les scientifiques parlent plus, ou moins, ces derniers temps."],
    eli20: ["주제·질병별로 최근 기간의 논문 점유율이 이전 기간보다 얼마나 변했는지 보여 줍니다.", "How much each topic's and condition's share of papers changed between the earlier and the recent window.", "Quanto è cambiata la quota di articoli di ogni tema e patologia tra la finestra precedente e quella recente.", "Combien la part d'articles de chaque sujet et pathologie a changé entre la période précédente et la période récente."]},
  how: {eli10: ["오른쪽에 있을수록 요즘 더 인기 있어요. 위에 있을수록 최근 보고서가 많아요. 초록 점은 연구 주제, 빨간 점은 병이에요.", "Further right = more popular lately. Higher up = more recent reports. Green dots are research topics, red dots are illnesses.", "Più a destra = più popolare di recente. Più in alto = più resoconti recenti. I punti verdi sono temi di ricerca, quelli rossi malattie.", "Plus à droite = plus populaire récemment. Plus haut = plus de comptes rendus récents. Les points verts sont des sujets de recherche, les rouges des maladies."],
    eli20: ["가로 = 점유율 변화(%) · 세로 = 최근 3개월 논문 수(로그 눈금) · 점 크기 = 전체 논문 수 · 청록 = 기전·주제, 산호색 = 질병", "x = change in share (%) · y = papers in the last 3 months (log scale) · dot size = all papers · teal = mechanism/topic, coral = condition", "x = variazione della quota (%) · y = articoli negli ultimi 3 mesi (scala log) · dimensione = tutti gli articoli · verde acqua = meccanismo/tema, corallo = patologia", "x = variation de la part (%) · y = articles des 3 derniers mois (échelle log) · taille = tous les articles · bleu-vert = mécanisme/sujet, corail = pathologie"],
    pro: ["변화 = 최근 기간 점유율 ÷ 이전 기간 점유율 − 1, 논문 ≥100인 항목만. 수집량이 기간마다 달라 개수 대신 점유율을 비교합니다. 다중 라벨 정규식 분류라 항목끼리 겹칩니다.", "Change = share(recent) ÷ share(earlier) − 1, items with ≥100 papers only. Shares, not counts, because collection volume differs by period. Multi-label regex classes overlap.", "Variazione = quota(recente) ÷ quota(precedente) − 1, solo voci con ≥100 articoli. Quote e non conteggi perché il volume raccolto varia. Le classi regex multi-etichetta si sovrappongono.", "Variation = part(récente) ÷ part(antérieure) − 1, éléments avec ≥100 articles seulement. Des parts et non des nombres, car le volume collecté varie. Les classes regex multi-étiquettes se chevauchent."]},
  key: ({hi, lo}) => { if (!hi) return null; const A = esc(hi.name), B = esc(lo.name), a = spf(hi.growth), b = spf(lo.growth);
    return {eli10: [`요즘 가장 크게 늘어난 주제는 ${jo(A, "이에요", "예요")}.`, `The topic that grew the most lately is ${en_(hi.name)}.`, `L'argomento cresciuto di più di recente è: ${en_(hi.name)}.`, `Le sujet qui a le plus progressé récemment : ${en_(hi.name)}.`],
      eli20: [`가장 크게 늘어난 것은 ${A}(${a}), 가장 크게 줄어든 것은 ${B}(${b})입니다.`, `${A} gained the most share (${a}); ${B} lost the most (${b}).`, `Più quota guadagnata: ${A} (${a}); più quota persa: ${B} (${b}).`, `Plus forte hausse de part : ${A} (${a}) ; plus forte baisse : ${B} (${b}).`]}; }},
r_tt: {
  what: {eli10: ["모든 주제를 한 줄씩 보여 주는 표예요.", "A table with one row for every topic.", "Una tabella con una riga per ogni argomento.", "Un tableau avec une ligne par sujet."],
    eli20: ["모든 기전·주제와 질병의 논문 수, 최근 3개월 수, 점유율 변화, 인용 중앙값, 월별 흐름입니다.", "Every mechanism/topic and condition: papers, last 3 months, change in share, median citations and the monthly trend.", "Ogni meccanismo/tema e patologia: articoli, ultimi 3 mesi, variazione della quota, citazioni mediane e andamento mensile.", "Chaque mécanisme/sujet et pathologie : articles, 3 derniers mois, variation de part, citations médianes et évolution mensuelle."]},
  how: {eli10: ["초록 숫자는 늘었다는 뜻, 빨간 숫자는 줄었다는 뜻이에요. 작은 막대는 달마다 나온 보고서 수예요. 이름을 누르면 관련 발견으로 가요.", "Green numbers went up, red numbers went down. The small bars show reports per month. Click a name to see related findings.", "I numeri verdi sono saliti, quelli rossi scesi. Le barrette mostrano i resoconti al mese. Clicca un nome per vedere le scoperte collegate.", "Les nombres verts ont monté, les rouges ont baissé. Les petites barres montrent les comptes rendus par mois. Clique sur un nom pour voir les découvertes liées."],
    eli20: ["관심 변화 순 · 초록 = 점유율 증가, 빨강 = 감소 · 막대 = 월별 논문 수(마지막 달은 수집 중이라 낮을 수 있음) · 이름을 누르면 그 주제의 최신 발견", "Sorted by change · green = share up, red = down · bars = papers per month (the last month is still being collected and may be low) · click a name for that topic's findings", "Ordinata per variazione · verde = quota in aumento, rosso = in calo · barre = articoli al mese (l'ultimo mese è ancora in raccolta e può essere basso) · clicca un nome per le scoperte del tema", "Trié par variation · vert = part en hausse, rouge = en baisse · barres = articles par mois (le dernier mois est encore en collecte et peut être bas) · cliquez sur un nom pour les découvertes du sujet"],
    pro: ["인용 중앙값은 관측된 인용만 반영하며 최근 논문일수록 낮습니다. 변화 값이 없는 항목(논문 부족)은 맨 아래에 둡니다.", "Median citations count observed citations only and are lower for recent papers. Items without a change value (too few papers) are listed last.", "Le citazioni mediane contano solo le citazioni osservate e sono più basse per gli articoli recenti. Le voci senza variazione (troppi pochi articoli) sono in fondo.", "Les citations médianes ne comptent que les citations observées et sont plus basses pour les articles récents. Les éléments sans variation (trop peu d'articles) sont en bas."]},
  key: ({n, u, d}) => !n ? null : ({eli10: [`${n}개 주제 중 ${u}개가 요즘 더 많이 이야기돼요.`, `${u} of ${n} topics are talked about more lately.`, `${u} argomenti su ${n} sono più discussi ultimamente.`, `${u} sujets sur ${n} sont plus discutés ces derniers temps.`],
    eli20: [`변화 값이 있는 ${n}개 항목 중 ${u}개는 점유율이 늘고 ${d}개는 줄었습니다.`, `Of ${n} items with a change value, ${u} gained share and ${d} lost share.`, `Delle ${n} voci con una variazione, ${u} hanno guadagnato quota e ${d} l'hanno persa.`, `Sur ${n} éléments avec une variation, ${u} ont gagné en part et ${d} en ont perdu.`]})},
/* --- latest findings --- */
f_cards: {
  what: {eli10: ["AI가 방금 읽은 과학 보고서에서 뽑은 가장 중요한 한 줄이에요.", "The most important line from science reports the AI just read.", "La frase più importante dei resoconti scientifici che l'IA ha appena letto.", "La phrase la plus importante des comptes rendus scientifiques que l'IA vient de lire."],
    eli20: ["주제별 최신 논문의 AI 요약입니다. 인용 문장이 원문과 맞는지 확인을 통과한 것만 보여 줍니다.", "AI summaries of recent papers by topic, shown only when the quoted sentence matched the source.", "Riassunti IA degli articoli recenti per tema, mostrati solo se la frase citata corrisponde alla fonte.", "Résumés IA d'articles récents par sujet, affichés seulement si la phrase citée correspond à la source."]},
  how: {eli10: ["위 버튼으로 주제를 골라요. 카드 아래 '원문'을 누르면 진짜 보고서를 볼 수 있어요.", "Pick a topic with the buttons. Click 'Source' under a card to open the real report.", "Scegli un tema con i pulsanti. Clicca “Fonte” sotto una scheda per aprire il resoconto vero.", "Choisis un sujet avec les boutons. Clique sur « Source » sous une carte pour ouvrir le vrai compte rendu."],
    eli20: ["버튼 = 주제 필터 · 카드 = 요약, 원 논문 제목, 학술지·날짜 · 최신 순 · '원문'은 Europe PMC로 연결됩니다.", "Buttons = topic filter · card = summary, original title, journal and date · newest first · 'Source' opens Europe PMC.", "Pulsanti = filtro per tema · scheda = riassunto, titolo originale, rivista e data · dal più recente · “Fonte” apre Europe PMC.", "Boutons = filtre par sujet · carte = résumé, titre original, revue et date · du plus récent · « Source » ouvre Europe PMC."],
    pro: ["초록만 읽은 모델 요약입니다. 인용 문장 일치(source-validated)만 확인했으므로 수치와 효과 크기는 원문으로 확인하세요. 주제는 다중 라벨이며 같은 논문은 한 번만 보여 줍니다.", "Model summaries from abstracts only; only the quoted sentence was checked against the source (source-validated), so verify numbers and effect sizes in the paper. Topics are multi-label; each paper appears once.", "Riassunti del modello dai soli abstract; è stata verificata solo la frase citata (source-validated), quindi controlla numeri ed effetti nell'articolo. I temi sono multi-etichetta; ogni articolo compare una volta.", "Résumés du modèle à partir des seuls résumés ; seule la phrase citée a été vérifiée (source-validated) : vérifiez chiffres et tailles d'effet dans l'article. Sujets multi-étiquettes ; chaque article n'apparaît qu'une fois."]},
  key: ({n, date}) => !n ? null : ({eli10: [`지금 카드 ${n}장이 있고, 가장 새것은 ${date}에 나왔어요.`, `There are ${n} cards now; the newest came out on ${date}.`, `Ora ci sono ${n} schede; la più recente è uscita il ${date}.`, `Il y a ${n} cartes ; la plus récente est sortie le ${date}.`],
    eli20: [`현재 필터에서 발견 ${n}건, 가장 최근은 ${date}입니다. 모두 잠정 결과입니다.`, `${n} findings in this filter, newest ${date}. All are provisional.`, `${n} scoperte con questo filtro, la più recente del ${date}. Tutte provvisorie.`, `${n} découvertes pour ce filtre, la plus récente du ${date}. Toutes provisoires.`]})},
f_gaps: {
  what: {eli10: ["과학자들이 스스로 '이건 아직 잘 몰라요'라고 쓴 부분이에요.", "Places where scientists wrote 'we don't know this yet'.", "I punti in cui gli scienziati hanno scritto “questo non lo sappiamo ancora”.", "Les endroits où les scientifiques ont écrit « ça, on ne le sait pas encore »."],
    eli20: ["최근 논문 초록에서 저자가 직접 밝힌 한계와 미해결 질문의 요약입니다.", "Summaries of limitations and open questions the authors themselves state in recent abstracts.", "Riassunti dei limiti e delle domande aperte dichiarati dagli autori negli abstract recenti.", "Résumés des limites et questions ouvertes que les auteurs eux-mêmes énoncent dans les résumés récents."]},
  how: {eli10: ["카드 하나가 보고서 하나예요. 아래에 날짜와 주제가 있어요.", "Each card is one report. The date and topics are at the bottom.", "Ogni scheda è un resoconto. Data e temi sono in basso.", "Chaque carte est un compte rendu. La date et les sujets sont en bas."],
    eli20: ["카드 = 논문 1편 · 아래 = 날짜와 주제 · '원문'으로 근거 확인", "Card = one paper · bottom = date and topics · 'Source' to check the evidence", "Scheda = un articolo · in basso = data e temi · “Fonte” per verificare", "Carte = un article · en bas = date et sujets · « Source » pour vérifier"],
    pro: ["limitation·gap으로 분류된 문장의 모델 요약입니다. 저자가 쓴 한계는 실제 공백의 일부일 뿐이며 쓰지 않은 한계는 잡히지 않습니다.", "Model summaries of sentences classified as limitation or gap. Stated limitations are only part of the real gaps; unstated ones are not captured.", "Riassunti del modello delle frasi classificate come limite o lacuna. I limiti dichiarati sono solo una parte delle lacune reali; quelli non dichiarati non vengono colti.", "Résumés du modèle des phrases classées comme limite ou lacune. Les limites déclarées ne sont qu'une partie des vraies lacunes ; les autres ne sont pas captées."]},
  key: ({n, T, c}) => !n || !T ? null : ({eli10: [`카드 ${n}장 중 가장 많이 나온 주제는 ${jo(esc(T), "이에요", "예요")}.`, `Of ${n} cards, the most common topic is ${en_(T)}.`, `Su ${n} schede, il tema più frequente è: ${en_(T)}.`, `Sur ${n} cartes, le sujet le plus fréquent est : ${en_(T)}.`],
    eli20: [`${n}건 중 ${esc(T)} 주제가 ${c}건으로 가장 많습니다.`, `${esc(T)} is the most frequent theme (${c} of ${n}).`, `${esc(T)} è il tema più frequente (${c} su ${n}).`, `${esc(T)} est le thème le plus fréquent (${c} sur ${n}).`]})},
/* --- world --- */
w_bar: {
  what: {eli10: ["어느 나라에서 과학 보고서를 많이 쓰는지 보여 주는 막대예요.", "Bars showing which countries write the most science reports.", "Barre che mostrano quali Paesi scrivono più resoconti scientifici.", "Des barres qui montrent quels pays écrivent le plus de comptes rendus scientifiques."],
    eli20: ["저자 소속 기준 국가별 논문 수(상위 30개국)입니다.", "Papers per country for the top 30 countries, by author affiliation.", "Articoli per Paese per i primi 30 Paesi, in base all'affiliazione degli autori.", "Articles par pays pour les 30 premiers pays, selon l'affiliation des auteurs."]},
  how: {eli10: ["막대가 길수록 보고서가 많아요. 막대 끝 숫자가 보고서 수예요.", "Longer bar = more reports. The number at the end is the count.", "Barra più lunga = più resoconti. Il numero in fondo è il conteggio.", "Barre plus longue = plus de comptes rendus. Le nombre au bout est le total."],
    eli20: ["막대 길이 = 논문 수(로그 눈금이라 차이가 실제보다 작아 보입니다) · 숫자 = 논문 수", "Bar length = papers (log scale, so differences look smaller than they are) · label = papers", "Lunghezza = articoli (scala log, quindi le differenze sembrano più piccole) · etichetta = articoli", "Longueur = articles (échelle log : les écarts paraissent plus petits) · étiquette = articles"],
    pro: ["국가는 소속 문자열에서 추출하며 다국적 논문은 국가마다 1회 셉니다. 따라서 합계가 전체 논문 수보다 큽니다. 수집 표본의 언어·색인 편향이 반영됩니다.", "Countries are parsed from affiliation strings; multinational papers count once per country, so totals exceed the paper count. Language and indexing bias of the sample apply.", "I Paesi sono estratti dalle stringhe di affiliazione; gli articoli multinazionali contano una volta per Paese, quindi i totali superano il numero di articoli. Valgono i bias di lingua e di indicizzazione del campione.", "Les pays sont extraits des chaînes d'affiliation ; un article multinational compte une fois par pays, d'où des totaux supérieurs au nombre d'articles. Les biais de langue et d'indexation de l'échantillon s'appliquent."]},
  key: ({a, b, p}) => !a || !b ? null : ({eli10: [`1등 ${esc(a.country)} ${fmt(a.papers)}편, 2등 ${esc(b.country)} ${fmt(b.papers)}편이에요.`, `${esc(a.country)} writes the most reports (${fmt(a.papers)}), then ${esc(b.country)} (${fmt(b.papers)}).`, `Il Paese con più resoconti è ${esc(a.country)} (${fmt(a.papers)}), poi ${esc(b.country)} (${fmt(b.papers)}).`, `Le pays qui écrit le plus est ${esc(a.country)} (${fmt(a.papers)}), puis ${esc(b.country)} (${fmt(b.papers)}).`],
    eli20: [`상위 두 나라(${esc(a.country)}, ${esc(b.country)})의 논문이 상위 30개국 합계의 ${p}입니다.`, `The top two, ${esc(a.country)} and ${esc(b.country)}, account for ${p} of the top-30 total.`, `I primi due, ${esc(a.country)} e ${esc(b.country)}, valgono ${itP(p)} del totale dei primi 30.`, `Les deux premiers, ${esc(a.country)} et ${esc(b.country)}, représentent ${p} du total des 30 premiers.`]})},
w_links: {
  what: {eli10: ["다른 나라 과학자끼리 함께 쓴 보고서가 많은 나라 짝이에요.", "Pairs of countries whose scientists write many reports together.", "Coppie di Paesi i cui scienziati scrivono molti resoconti insieme.", "Les paires de pays dont les scientifiques écrivent beaucoup ensemble."],
    eli20: ["같은 논문에 함께 등장한 국가 쌍을 공동 논문 수 순으로 보여 줍니다.", "Country pairs appearing on the same paper, ranked by shared papers.", "Coppie di Paesi presenti nello stesso articolo, in ordine di articoli in comune.", "Paires de pays présentes sur un même article, classées par articles communs."]},
  how: {eli10: ["위에 있을수록 함께 쓴 보고서가 많아요.", "Higher up = more reports written together.", "Più in alto = più resoconti scritti insieme.", "Plus haut = plus de comptes rendus écrits ensemble."],
    eli20: ["행 = 국가 쌍 · 숫자 = 두 나라 저자가 모두 있는 논문 수", "Row = country pair · number = papers with authors from both countries", "Riga = coppia di Paesi · numero = articoli con autori di entrambi i Paesi", "Ligne = paire de pays · nombre = articles avec des auteurs des deux pays"],
    pro: ["3개국 이상 논문은 모든 쌍에 1회씩 셉니다. 큰 나라일수록 쌍의 수가 커지므로 규모로 나눈 협력 강도가 아닙니다.", "Papers with 3+ countries count once for every pair. Large countries get large pair counts, so this is not size-adjusted collaboration strength.", "Gli articoli con 3+ Paesi contano una volta per ogni coppia. I Paesi grandi ottengono conteggi alti: non è un'intensità di collaborazione corretta per dimensione.", "Les articles à 3 pays ou plus comptent une fois par paire. Les grands pays ont des totaux élevés : ce n'est pas une intensité de collaboration ajustée à la taille."]},
  key: ({l, top, m}) => { if (!l) return null; const a = esc(l.a), b = esc(l.b), n = fmt(l.papers), t = esc(top);
    return {eli10: [`가장 자주 함께 쓰는 짝은 ${a} ↔ ${b}, ${n}편이에요.`, `The pair that writes together most is ${a} and ${b} (${n} reports).`, `La coppia che scrive di più insieme è ${a} e ${b} (${n} resoconti).`, `La paire qui écrit le plus ensemble : ${a} et ${b} (${n} comptes rendus).`],
      eli20: [`가장 많은 공동 연구는 ${a}–${b} 쌍으로 공동 논문 ${n}편입니다. 상위 10쌍 중 ${m}쌍에 ${t} 저자가 있습니다.`, `The largest collaboration is ${a}–${b} (${n} shared papers). ${t} appears in ${m} of the top 10 pairs.`, `La collaborazione più ampia è ${a}–${b} (${n} articoli in comune). ${t} compare in ${m} delle prime 10 coppie.`, `La plus grande collaboration est ${a}–${b} (${n} articles communs). ${t} figure dans ${m} des 10 premières paires.`]}; }},
w_byc: {
  what: {eli10: ["나라마다 보고서를 많이 쓰는 기관을 모은 카드예요.", "Cards showing the busiest institutions in each country.", "Schede con le istituzioni più attive di ogni Paese.", "Des cartes avec les institutions les plus actives de chaque pays."],
    eli20: ["논문 수 상위 12개국과 각 나라의 대표 기관(최대 4곳)입니다.", "The 12 countries with the most papers and up to 4 leading institutions each.", "I 12 Paesi con più articoli e fino a 4 istituzioni di punta ciascuno.", "Les 12 pays avec le plus d'articles et jusqu'à 4 institutions phares chacun."]},
  how: {eli10: ["카드 맨 위는 나라, 그 아래는 기관 이름과 보고서 수예요.", "Top of each card: the country. Below: institutions and their report counts.", "In alto: il Paese. Sotto: le istituzioni e il numero di resoconti.", "En haut : le pays. En dessous : les institutions et leur nombre de comptes rendus."],
    eli20: ["카드 = 국가 · 첫 줄 = 논문·저자 수 · 아래 = 기관(괄호 = 논문 수)", "Card = country · first line = papers and authors · below = institutions (papers in brackets)", "Scheda = Paese · prima riga = articoli e autori · sotto = istituzioni (articoli tra parentesi)", "Carte = pays · première ligne = articles et auteurs · dessous = institutions (articles entre parenthèses)"],
    pro: ["기관은 소속 문자열 기준 상위 80곳 목록에서만 고릅니다. 표기 차이를 합치지 않아 한 기관이 나뉘어 나올 수 있습니다.", "Institutions come only from the top-80 list, by affiliation string; spelling variants are not merged, so one institution can be split.", "Le istituzioni provengono solo dall'elenco dei primi 80, per stringa di affiliazione; le varianti non sono unite, quindi un'istituzione può essere divisa.", "Les institutions viennent seulement de la liste des 80 premières, par chaîne d'affiliation ; les variantes ne sont pas fusionnées, une institution peut donc être scindée."]},
  key: ({c, x}) => { if (!c || !x) return null; c = esc(c); const i = esc(x.name), n = fmt(x.papers);
    return {eli10: [`${c}에서는 ${i}에서 보고서를 가장 많이 써요.`, `In ${c}, ${i} writes the most reports.`, `Per ${c}, è ${i} a scrivere più resoconti.`, `Pour ${c}, c'est ${i} qui écrit le plus.`],
      eli20: [`${c}의 1위 기관은 ${i}(논문 ${n}편)입니다. 기관 목록은 상위 80곳으로 한정됩니다.`, `${c}'s leading institution is ${i} (${n} papers). Institutions are limited to the top-80 list.`, `L'istituzione di punta per ${c} è ${i} (${n} articoli). Le istituzioni sono limitate all'elenco dei primi 80.`, `Institution phare pour ${c} : ${i} (${n} articles). Les institutions se limitent à la liste des 80 premières.`]}; }},
/* --- gaps (body site × topic) --- */
g_hm: {
  what: {eli10: ["몸의 어느 곳(장, 입, 피부…)을 어떤 주제로 많이 연구했는지 보여 주는 칸 지도예요.", "A grid showing which body parts (gut, mouth, skin…) are studied for which topics.", "Una griglia che mostra quali parti del corpo (intestino, bocca, pelle…) sono studiate per quali temi.", "Une grille qui montre quelles parties du corps (intestin, bouche, peau…) sont étudiées pour quels sujets."],
    eli20: ["몸 부위 × 연구 주제 칸마다 논문 수를 센 지도입니다.", "Paper counts for every body site × research topic cell.", "Numero di articoli per ogni cella sede corporea × tema.", "Nombre d'articles pour chaque case site corporel × sujet."]},
  how: {eli10: ["밝은 칸은 연구가 많고, 어두운 칸은 아직 연구가 적은 곳이에요. 칸 안 숫자가 보고서 수예요.", "Bright cells have lots of research, dark cells have little so far. The number is how many reports.", "Le celle chiare hanno molta ricerca, quelle scure ancora poca. Il numero è quanti resoconti.", "Les cases claires ont beaucoup de recherche, les sombres encore peu. Le nombre indique combien de comptes rendus."],
    eli20: ["가로 = 주제, 세로 = 몸 부위 · 색이 밝을수록 논문이 많음 · 칸 숫자 = 논문 수", "x = topic, y = body site · brighter = more papers · number = papers", "x = tema, y = sede corporea · più chiaro = più articoli · numero = articoli", "x = sujet, y = site corporel · plus clair = plus d'articles · nombre = articles"],
    pro: ["다중 라벨 정규식 분류의 교차 계수입니다. 적은 수가 곧 공백은 아닙니다(분류 누락이거나 생물학적 관련이 적을 수 있음).", "Cross-counts of multi-label regex classes. A low count is not always a gap (missed classification or little biological relevance).", "Conteggi incrociati di classi regex multi-etichetta. Un conteggio basso non è sempre una lacuna (classificazione mancata o poca rilevanza biologica).", "Comptages croisés de classes regex multi-étiquettes. Un faible nombre n'est pas toujours une lacune (classification manquée ou faible pertinence biologique)."]},
  key: ({hi, lo}) => !hi ? null : ({eli10: [`가장 밝은 칸은 ${hi.s} × ${hi.t}, 가장 어두운 칸은 ${lo.s} × ${lo.t} 칸이에요.`, `The brightest cell is ${hi.s} × ${hi.t}; the darkest is ${lo.s} × ${lo.t}.`, `La cella più chiara è ${hi.s} × ${hi.t}; la più scura è ${lo.s} × ${lo.t}.`, `La case la plus claire est ${hi.s} × ${hi.t} ; la plus sombre est ${lo.s} × ${lo.t}.`],
    eli20: [`가장 많은 칸은 ${hi.s} × ${hi.t}(${fmt(hi.n)}편), 가장 적은 칸은 ${lo.s} × ${lo.t}(${fmt(lo.n)}편)입니다.`, `Densest: ${hi.s} × ${hi.t} (${fmt(hi.n)} papers); thinnest: ${lo.s} × ${lo.t} (${fmt(lo.n)}).`, `Più fitta: ${hi.s} × ${hi.t} (${fmt(hi.n)} articoli); più scarsa: ${lo.s} × ${lo.t} (${fmt(lo.n)}).`, `Plus dense : ${hi.s} × ${hi.t} (${fmt(hi.n)} articles) ; plus rare : ${lo.s} × ${lo.t} (${fmt(lo.n)}).`]})},
g_pr: {
  what: {eli10: ["결론을 믿기 전에 먼저 확인해야 할 질문들이에요.", "Questions to check before trusting a conclusion.", "Domande da verificare prima di fidarsi di una conclusione.", "Des questions à vérifier avant de croire une conclusion."],
    eli20: ["M-SAGE 탐색이 여러 후보에 공통으로 깔려 있다고 본, 아직 확인되지 않은 전제입니다.", "Premises that M-SAGE's exploration found underneath several candidates and that are not yet confirmed.", "Premesse che l'esplorazione di M-SAGE ha trovato alla base di più candidati e non ancora confermate.", "Hypothèses que l'exploration de M-SAGE a trouvées sous plusieurs candidats et qui ne sont pas encore confirmées."]},
  how: {eli10: ["한 줄이 질문 하나예요.", "Each line is one question.", "Ogni riga è una domanda.", "Chaque ligne est une question."],
    eli20: ["줄 = 전제 하나(중복 제거) · 답이 '아니요'이면 그 전제에 기대는 결론이 약해집니다.", "Line = one premise (duplicates removed) · if the answer is 'no', conclusions that rely on it weaken.", "Riga = una premessa (senza duplicati) · se la risposta è “no”, le conclusioni che vi si appoggiano si indeboliscono.", "Ligne = une hypothèse (sans doublons) · si la réponse est « non », les conclusions qui en dépendent s'affaiblissent."],
    pro: ["frontier 분석의 premises 라벨을 중복 없이 나열합니다. 각 전제에 기대는 후보 수는 원 데이터에 있습니다.", "Unique premise labels from the frontier analysis; the number of candidates depending on each is in the source data.", "Etichette di premessa uniche dall'analisi frontier; il numero di candidati che dipendono da ciascuna è nei dati di origine.", "Libellés d'hypothèses uniques issus de l'analyse frontier ; le nombre de candidats qui en dépendent figure dans les données sources."]},
  key: ({n, N}) => !n ? null : ({eli10: [`확인할 질문이 ${n}개 있어요.`, `There are ${n} questions to check.`, `Ci sono ${n} domande da verificare.`, `Il y a ${n} questions à vérifier.`],
    eli20: [`서로 다른 전제 ${n}개가 후보 기록 ${N}건에 걸쳐 있습니다.`, `${n} distinct premises appear across ${N} candidate entries.`, `${n} premesse distinte compaiono in ${N} voci candidate.`, `${n} hypothèses distinctes apparaissent dans ${N} entrées candidates.`]})},
g_ac: {
  what: {eli10: ["M-SAGE가 다음에 해 보자고 하는 일들이에요.", "Things M-SAGE suggests doing next.", "Cose che M-SAGE suggerisce di fare dopo.", "Ce que M-SAGE propose de faire ensuite."],
    eli20: ["공백 분석이 제안한 다음 행동과 그 이유입니다.", "Next actions the gap analysis proposes, with the reason for each.", "Prossime azioni proposte dall'analisi delle lacune, con il motivo di ciascuna.", "Actions suivantes proposées par l'analyse des lacunes, avec la raison de chacune."]},
  how: {eli10: ["굵은 글씨가 할 일, 뒤의 글이 이유예요.", "Bold text is the action; the text after it is the reason.", "Il grassetto è l'azione; il testo dopo è il motivo.", "Le texte en gras est l'action ; la suite est la raison."],
    eli20: ["굵은 글씨 = 행동 유형 · 뒤 = 이유 · 제안이며 실행 결과가 아닙니다.", "Bold = kind of action · after = reason · proposals, not results.", "Grassetto = tipo di azione · dopo = motivo · proposte, non risultati.", "Gras = type d'action · ensuite = raison · des propositions, pas des résultats."],
    pro: ["frontier actions의 operator(audit, fuse, repair, discriminate, context_split, counterfactual_stress)별 고정 문구입니다. 우선순위 점수는 표시하지 않습니다.", "Fixed wording per frontier action operator (audit, fuse, repair, discriminate, context_split, counterfactual_stress); priority scores are not shown.", "Testo fisso per operatore d'azione frontier (audit, fuse, repair, discriminate, context_split, counterfactual_stress); i punteggi di priorità non sono mostrati.", "Formulation fixe par opérateur d'action frontier (audit, fuse, repair, discriminate, context_split, counterfactual_stress) ; les scores de priorité ne sont pas affichés."]},
  key: ({n, t, c}) => !n ? null : c <= 1 ? {eli10: [`할 일 ${n}개 중 첫 번째는 '${esc(t)}'${jp(t, "이에요", "예요")}.`, `There are ${n} suggested actions; the first is “${esc(t)}”.`, `Ci sono ${n} azioni suggerite; la prima è «${esc(t)}».`, `Il y a ${n} actions proposées ; la première est « ${esc(t)} ».`],
      eli20: [`제안된 행동 ${n}개는 모두 종류가 다르며, 첫 번째는 '${esc(t)}'입니다.`, `${n} actions proposed, each of a different kind; the first is “${esc(t)}”.`, `${n} azioni proposte, tutte di tipo diverso; la prima è «${esc(t)}».`, `${n} actions proposées, toutes de type différent ; la première est « ${esc(t)} ».`]} : ({eli10: [`할 일이 ${n}개 있고, 가장 많은 것은 '${esc(t)}'${jp(t, "이에요", "예요")}.`, `There are ${n} suggested actions; the most common is “${esc(t)}”.`, `Ci sono ${n} azioni suggerite; la più frequente è «${esc(t)}».`, `Il y a ${n} actions proposées ; la plus fréquente est « ${esc(t)} ».`],
    eli20: [`제안된 행동 ${n}개 중 가장 많은 유형은 '${esc(t)}'(${c}개)입니다.`, `${n} actions proposed; the most common kind is “${esc(t)}” (${c}).`, `${n} azioni proposte; il tipo più comune è «${esc(t)}» (${c}).`, `${n} actions proposées ; le type le plus fréquent est « ${esc(t)} » (${c}).`]})},
/* --- MINERVA --- */
m_net: {
  what: {eli10: ["연구실의 큰 지식 지도(MINERVA)에서 병과 세균이 어떻게 이어지는지 보여 줘요.", "How illnesses and germs are linked in the lab's big knowledge map, MINERVA.", "Come malattie e germi sono collegati nella grande mappa della conoscenza del laboratorio, MINERVA.", "Comment maladies et microbes sont reliés dans la grande carte des connaissances du laboratoire, MINERVA."],
    eli20: ["MINERVA 그래프에서 질병마다 근거가 가장 많은 미생물 8개를 이은 연결망입니다.", "Network of the 8 microbes with the most evidence for each condition in the MINERVA graph.", "Rete degli 8 microbi con più evidenze per ogni patologia nel grafo MINERVA.", "Réseau des 8 microbes ayant le plus de preuves pour chaque pathologie dans le graphe MINERVA."]},
  how: {eli10: ["주황 동그라미는 병이에요. 초록 세균은 '많아진다'는 보고가, 빨간 세균은 '줄어든다'는 보고가 더 많아요. 선이 굵을수록 보고가 많아요.", "Orange dots are illnesses. Green germs are mostly reported as 'more', red ones as 'less'. Thicker lines mean more reports.", "I pallini arancioni sono malattie. I germi verdi sono riportati soprattutto “di più”, quelli rossi “di meno”. Linee più spesse = più resoconti.", "Les points orange sont des maladies. Les microbes verts sont surtout signalés « plus nombreux », les rouges « moins nombreux ». Trait plus épais = plus de comptes rendus."],
    eli20: ["주황 = 질병 · 초록 = 증가 보고가 많은 미생물, 빨강 = 감소 보고가 많은 미생물 · 선 굵기 = 근거 행 수 · 점 크기 = 미생물의 근거 합계 · 확대·끌기 가능", "Orange = condition · green = microbe mostly reported increased, red = mostly decreased · line width = evidence rows · dot size = the microbe's total evidence · zoom and drag", "Arancione = patologia · verde = microbo riportato soprattutto in aumento, rosso = in diminuzione · spessore = righe di evidenza · dimensione = evidenze totali del microbo · zoom e trascinamento", "Orange = pathologie · vert = microbe surtout signalé en hausse, rouge = en baisse · épaisseur = lignes de preuve · taille = preuves totales du microbe · zoom et glisser"],
    pro: ["근거 행은 MINERVA main 그래프의 Microbe→Disease 관계 행이며 고유 생물학적 관계 수와 다를 수 있습니다. 질병은 정규식으로 우리 분류에 대응했습니다. 초록/빨강은 증가 ≥ 감소 여부만 봅니다.", "Evidence rows are Microbe→Disease relation rows in MINERVA's main graph and can differ from unique biological relations. Conditions are mapped to our classes by regex. Green/red only tests increase ≥ decrease.", "Le righe di evidenza sono righe di relazione Microbe→Disease del grafo principale di MINERVA e possono differire dalle relazioni biologiche univoche. Le patologie sono associate alle nostre classi via regex. Verde/rosso verifica solo aumento ≥ diminuzione.", "Les lignes de preuve sont des lignes de relation Microbe→Disease du graphe principal de MINERVA et peuvent différer des relations biologiques uniques. Les pathologies sont associées à nos classes par regex. Vert/rouge teste seulement hausse ≥ baisse."]},
  key: ({n, g, r, D, c}) => !n ? null : ({eli10: [`세균 ${n}개 중 ${g}개는 병에서 '많아진다'는 보고가 더 많고, ${r}개는 '줄어든다'가 더 많아요.`, `Of ${n} germs, ${g} are mostly reported as 'more' in illness and ${r} as 'less'.`, `Su ${n} germi, ${g} sono riportati soprattutto “di più” nelle malattie e ${r} “di meno”.`, `Sur ${n} microbes, ${g} sont surtout signalés « plus nombreux » dans la maladie et ${r} « moins nombreux ».`],
    eli20: [`미생물 ${n}개 중 ${g}개는 증가, ${r}개는 감소 보고가 우세하고 ${n - g - r}개는 같거나 방향 정보가 없습니다(초록으로 표시). 근거가 가장 많은 질병은 ${esc(D)}(${fmt(c)}행)입니다.`, `Of ${n} microbes, ${g} lean to increase, ${r} to decrease and ${n - g - r} ${pl(n - g - r, "is", "are")} tied or ${pl(n - g - r, "lacks", "lack")} a direction (shown green). The condition with most evidence is ${en_(D)} (${fmt(c)} rows).`, `Su ${n} microbi, ${g} tendono all'aumento, ${r} alla diminuzione e ${n - g - r} ${pl(n - g - r, "è", "sono")} in parità o senza direzione (in verde). La patologia con più evidenze: ${en_(D)} (${fmt(c)} righe).`, `Sur ${n} microbes, ${g} penchent vers la hausse, ${r} vers la baisse et ${n - g - r} ${pl(n - g - r, "est", "sont")} à égalité ou sans sens (en vert). La pathologie la plus documentée : ${en_(D)} (${fmt(c)} lignes).`]})},
m_hub: {
  what: {eli10: ["MINERVA에서 가장 많은 병과 이어진 세균이에요.", "The germs linked to the most illnesses in MINERVA.", "I germi collegati a più malattie in MINERVA.", "Les microbes reliés au plus grand nombre de maladies dans MINERVA."],
    eli20: ["MINERVA에서 질병 관계 수(차수)가 가장 많은 미생물 25개입니다.", "The 25 microbes with the most condition relations (degree) in MINERVA.", "I 25 microbi con più relazioni con patologie (grado) in MINERVA.", "Les 25 microbes ayant le plus de relations avec des pathologies (degré) dans MINERVA."]},
  how: {eli10: ["막대가 길수록 더 많은 병과 이어져 있어요.", "Longer bar = linked to more illnesses.", "Barra più lunga = collegato a più malattie.", "Barre plus longue = relié à plus de maladies."],
    eli20: ["막대 길이 = 질병과의 관계 수 · 많이 연구된 미생물일수록 길어지는 경향이 있습니다.", "Bar length = number of condition relations · well-studied microbes tend to have longer bars.", "Lunghezza = numero di relazioni con patologie · i microbi più studiati tendono ad avere barre più lunghe.", "Longueur = nombre de relations avec des pathologies · les microbes très étudiés ont tendance à avoir des barres plus longues."],
    pro: ["차수 = MINERVA Microbe→Disease 관계 행 수(중복 근거 포함). 연구량에 비례해 커지므로 생물학적 중요도로 읽으면 안 됩니다.", "Degree = MINERVA Microbe→Disease relation rows (duplicated evidence included). It scales with research volume; do not read it as biological importance.", "Grado = righe di relazione Microbe→Disease in MINERVA (evidenze duplicate incluse). Cresce con il volume di ricerca; non va letto come importanza biologica.", "Degré = lignes de relation Microbe→Disease dans MINERVA (preuves dupliquées incluses). Il croît avec le volume de recherche ; ne pas le lire comme une importance biologique."]},
  key: ({a, b}) => !a ? null : ({eli10: [`1등은 세균 ${ti(a.microbe)}${jp(a.microbe, "이에요", "예요")}.`, `Number one is the germ ${ti(a.microbe)}.`, `Al primo posto c'è il germe ${ti(a.microbe)}.`, `En tête : le microbe ${ti(a.microbe)}.`],
    eli20: b ? [`${ti(a.microbe)}의 관계가 ${fmt(a.degree)}행으로 가장 많고, 2위는 ${ti(b.microbe)}(${fmt(b.degree)}행)입니다.`, `${ti(a.microbe)} has the most relations (${fmt(a.degree)} rows), followed by ${ti(b.microbe)} (${fmt(b.degree)}).`, `${ti(a.microbe)} ha più relazioni (${fmt(a.degree)} righe), seguito da ${ti(b.microbe)} (${fmt(b.degree)}).`, `${ti(a.microbe)} a le plus de relations (${fmt(a.degree)} lignes), suivi de ${ti(b.microbe)} (${fmt(b.degree)}).`] : null})},
m_dz: {
  what: {eli10: ["병마다 MINERVA에서 가장 많이 이야기되는 세균이에요.", "For each illness, the germs MINERVA mentions most.", "Per ogni malattia, i germi che MINERVA cita di più.", "Pour chaque maladie, les microbes que MINERVA cite le plus."],
    eli20: ["질병별로 MINERVA 근거가 많은 미생물 상위 6개와 증가·감소 보고 수입니다.", "For each condition, the 6 microbes with most MINERVA evidence and their increase/decrease counts.", "Per ogni patologia, i 6 microbi con più evidenze in MINERVA e i conteggi di aumento/diminuzione.", "Pour chaque pathologie, les 6 microbes les plus documentés dans MINERVA et leurs nombres de hausses/baisses."]},
  how: {eli10: ["▲는 '많아진다', ▼는 '줄어든다'고 한 보고 수예요.", "▲ counts reports of 'more', ▼ counts reports of 'less'.", "▲ conta i resoconti “di più”, ▼ quelli “di meno”.", "▲ compte les comptes rendus « plus », ▼ ceux « moins »."],
    eli20: ["카드 = 질병 · ▲ 증가, ▼ 감소 보고 행 수 · PMID = 근거 논문 수", "Card = condition · ▲ increase, ▼ decrease rows · PMID = supporting papers", "Scheda = patologia · ▲ aumento, ▼ diminuzione · PMID = articoli di supporto", "Carte = pathologie · ▲ hausse, ▼ baisse · PMID = articles à l'appui"],
    pro: ["▲·▼는 MINERVA 관계 행의 방향 속성 기준이며 방향 미상 행은 빠져 있습니다. PMID 수는 고유 논문 수입니다.", "▲/▼ use the direction property of MINERVA relation rows; rows of unknown direction are left out. PMID = unique papers.", "▲/▼ usano la proprietà di direzione delle righe di MINERVA; le righe senza direzione sono escluse. PMID = articoli unici.", "▲/▼ utilisent la propriété de direction des lignes MINERVA ; les lignes sans direction sont exclues. PMID = articles uniques."]},
  key: ({D, c, x}) => !D || !x ? null : ({eli10: [`근거가 가장 많은 병은 ${esc(D)}, 그 병의 대표 세균은 ${ti(x.microbe)}${jp(x.microbe, "이에요", "예요")}.`, `The illness with the most reports is ${en_(D)}; its main germ is ${ti(x.microbe)}.`, `La malattia con più resoconti: ${en_(D)}; il suo germe principale è ${ti(x.microbe)}.`, `La maladie la plus documentée : ${en_(D)} ; son microbe principal : ${ti(x.microbe)}.`],
    eli20: [`근거가 가장 많은 질병: ${esc(D)}(${fmt(c)}행). 대표 미생물은 ${ti(x.microbe)}(▲${x.increase} ▼${x.decrease})입니다.`, `Most evidence: ${en_(D)} (${fmt(c)} rows); its top microbe is ${ti(x.microbe)} (▲${x.increase} ▼${x.decrease}).`, `Più evidenze: ${en_(D)} (${fmt(c)} righe); il microbo principale è ${ti(x.microbe)} (▲${x.increase} ▼${x.decrease}).`, `Le plus de preuves : ${en_(D)} (${fmt(c)} lignes) ; microbe principal : ${ti(x.microbe)} (▲${x.increase} ▼${x.decrease}).`]})},
m_graphs: {
  what: {eli10: ["MINERVA 지식 지도에 어떤 것들이 몇 개씩 들어 있는지예요.", "What kinds of things are in the MINERVA map, and how many.", "Che tipo di cose ci sono nella mappa MINERVA, e quante.", "Quels types de choses il y a dans la carte MINERVA, et combien."],
    eli20: ["MINERVA의 그래프별 노드 종류와 개수(상위 8개)입니다.", "Node types and counts per MINERVA graph (top 8).", "Tipi di nodo e conteggi per grafo MINERVA (primi 8).", "Types de nœuds et nombres par graphe MINERVA (8 premiers)."]},
  how: {eli10: ["카드 하나가 지도 하나예요. 숫자는 그 종류가 몇 개인지예요.", "Each card is one map. The number says how many of that kind.", "Ogni scheda è una mappa. Il numero dice quanti di quel tipo.", "Chaque carte correspond à un graphe. Le nombre dit combien il y en a de ce type."],
    eli20: ["카드 = 그래프 · 줄 = 노드 라벨과 개수", "Card = graph · line = node label and count", "Scheda = grafo · riga = etichetta del nodo e conteggio", "Carte = graphe · ligne = étiquette de nœud et nombre"],
    pro: ["한 번 전체 내보내기(export_once)한 시점의 개수이며, MINERVA 자체 개수와 일치할 때만 완료로 기록합니다.", "Counts at the one-time full export (export_once), recorded as complete only when they match MINERVA's own counts.", "Conteggi al momento dell'esportazione completa unica (export_once), registrata come completa solo se coincide con i conteggi di MINERVA.", "Nombres lors de l'export complet unique (export_once), enregistré comme complet seulement s'il correspond aux nombres de MINERVA."]},
  key: ({n, g, x}) => !n || !x ? null : ({eli10: [`지도 ${n}개가 있고, 가장 많은 것은 ${esc(x.label)}(${fmt(x.count)}개)예요.`, `There are ${n} maps; the biggest group is ${esc(x.label)} (${fmt(x.count)}).`, `Ci sono ${n} mappe; il gruppo più grande è ${esc(x.label)} (${fmt(x.count)}).`, `Il y a ${n} graphes ; le groupe le plus grand est ${esc(x.label)} (${fmt(x.count)}).`],
    eli20: [`그래프 ${n}개 중 가장 많은 노드 종류는 ${esc(g)}의 ${esc(x.label)}(${fmt(x.count)}개)입니다.`, `${n} graphs; the largest node type is ${esc(x.label)} in ${esc(g)} (${fmt(x.count)}).`, `${n} grafi; il tipo di nodo più numeroso è ${esc(x.label)} in ${esc(g)} (${fmt(x.count)}).`, `${n} graphes ; le type de nœud le plus nombreux est ${esc(x.label)} dans ${esc(g)} (${fmt(x.count)}).`]})},
/* --- collection --- */
b_grid: {
  what: {eli10: ["옛날 과학 보고서를 한 달씩 모으는 달력이에요.", "A calendar of collecting older science reports, one month at a time.", "Un calendario della raccolta dei resoconti più vecchi, un mese alla volta.", "Un calendrier de la collecte des anciens comptes rendus, un mois à la fois."],
    eli20: ["월별 과거 논문 수집 진행 상황입니다.", "Progress of collecting past papers, month by month.", "Avanzamento della raccolta degli articoli passati, mese per mese.", "Avancement de la collecte des articles passés, mois par mois."]},
  how: {eli10: ["줄 하나가 한 해, 칸 하나가 한 달이에요. 초록 칸은 끝난 달, 깜빡이는 노란 칸은 지금 하는 달이에요.", "Each row is a year, each box a month. Green boxes are done; the blinking yellow one is being worked on.", "Ogni riga è un anno, ogni casella un mese. Le caselle verdi sono finite; quella gialla che lampeggia è in corso.", "Chaque ligne est une année, chaque case un mois. Les cases vertes sont finies ; la jaune qui clignote est en cours."],
    eli20: ["행 = 연도, 칸 = 월 · 청록 = 완료, 노랑 = 진행 중 · 칸에 마우스를 올리면 연-월", "Row = year, cell = month · teal = done, amber = in progress · hover for year-month", "Riga = anno, cella = mese · verde acqua = completato, ambra = in corso · passa sopra per anno-mese", "Ligne = année, case = mois · bleu-vert = terminé, ambre = en cours · survolez pour l'année-mois"],
    pro: ["월 단위 창, 월당 쪽 수 상한 × 쪽 크기, Europe PMC 커서 페이지네이션입니다. 표본이지 전수 수집이 아니므로 월별 개수를 비교하지 마세요.", "Monthly windows, page cap × page size per month, Europe PMC cursor paging. A sample, not a census, so do not compare monthly counts.", "Finestre mensili, tetto di pagine × dimensione della pagina, paginazione a cursore di Europe PMC. Un campione, non un censimento: non confrontare i conteggi mensili.", "Fenêtres mensuelles, plafond de pages × taille de page, pagination par curseur Europe PMC. Un échantillon, pas un recensement : ne comparez pas les nombres mensuels."]},
  key: ({d, t, w}) => !t ? null : ({eli10: [`${t}달 중 ${d}달을 끝냈어요 (${pf(d / t, 0)}).`, `${d} of ${t} months are done (${pf(d / t, 0)}).`, `${d} mesi su ${t} sono finiti (${pf(d / t, 0)}).`, `${d} mois sur ${t} sont terminés (${pf(d / t, 0)}).`],
    eli20: [`${t}개월 중 ${d}개월(${pf(d / t, 0)})을 마쳤습니다.${w ? ` 지금 수집 중인 달은 ${w}입니다.` : ""}`, `${d} of ${t} months done (${pf(d / t, 0)}).${w ? ` Now collecting ${w}.` : ""}`, `${d} mesi su ${t} completati (${pf(d / t, 0)}).${w ? ` Ora in raccolta: ${w}.` : ""}`, `${d} mois sur ${t} terminés (${pf(d / t, 0)}).${w ? ` Collecte en cours : ${w}.` : ""}`]})},
b_yb: {
  what: {eli10: ["해마다 모은 보고서가 대략 몇 개인지 보여 주는 막대예요.", "Bars showing roughly how many reports were collected for each year.", "Barre che mostrano circa quanti resoconti sono stati raccolti per ogni anno.", "Des barres qui montrent à peu près combien de comptes rendus ont été collectés pour chaque année."],
    eli20: ["연도별로 확보한 논문의 대략적인 수입니다.", "Approximate number of papers collected per publication year.", "Numero approssimativo di articoli raccolti per anno di pubblicazione.", "Nombre approximatif d'articles collectés par année de publication."]},
  how: {eli10: ["막대가 높을수록 그해 보고서를 많이 모았어요.", "Taller bar = more reports collected for that year.", "Barra più alta = più resoconti raccolti per quell'anno.", "Barre plus haute = plus de comptes rendus collectés pour cette année."],
    eli20: ["가로 = 연도, 세로 = 대략적 논문 수 · 수집 상한이 있어 실제 출판량이 아닙니다.", "x = year, y = approximate papers · collection is capped, so this is not the real publication volume.", "x = anno, y = articoli approssimativi · la raccolta ha un tetto, quindi non è il volume reale di pubblicazione.", "x = année, y = articles approximatifs · la collecte est plafonnée : ce n'est pas le vrai volume publié."],
    pro: ["approx_papers는 수집 기록에서 추정한 값입니다. 연도 간 차이는 주로 수집 진행도를 반영하며 연구량 추세가 아닙니다.", "approx_papers is estimated from the collection log; differences between years mostly reflect collection progress, not research volume.", "approx_papers è stimato dal registro di raccolta; le differenze tra anni riflettono soprattutto l'avanzamento della raccolta, non il volume di ricerca.", "approx_papers est estimé à partir du journal de collecte ; les écarts entre années reflètent surtout l'avancement de la collecte, pas le volume de recherche."]},
  key: ({hi, lo}) => !hi ? null : ({eli10: [`가장 많이 모은 해는 ${hi[0]}년이에요 (약 ${fmt(hi[1])}편).`, `The year with the most reports is ${hi[0]} (about ${fmt(hi[1])}).`, `L'anno con più resoconti è il ${hi[0]} (circa ${fmt(hi[1])}).`, `L'année avec le plus de comptes rendus est ${hi[0]} (environ ${fmt(hi[1])}).`],
    eli20: [`가장 많은 해는 ${hi[0]}년(약 ${fmt(hi[1])}편), 가장 적은 해는 ${lo[0]}년(약 ${fmt(lo[1])}편)입니다.`, `Most: ${hi[0]} (about ${fmt(hi[1])}); least: ${lo[0]} (about ${fmt(lo[1])}).`, `Massimo: ${hi[0]} (circa ${fmt(hi[1])}); minimo: ${lo[0]} (circa ${fmt(lo[1])}).`, `Maximum : ${hi[0]} (environ ${fmt(hi[1])}) ; minimum : ${lo[0]} (environ ${fmt(lo[1])}).`]})},
/* --- insight lab: knowledge map, consensus, signatures, trends, gaps, MINERVA comparison --- */
i_map: {
  what: {eli10: ["몸속 작은 생물(세균)과 병이 어떻게 이어져 있는지 보여 주는 지도예요.", "A map of how germs (tiny living things in the body) and illnesses are linked.", "Una mappa di come i germi (piccoli esseri viventi nel corpo) e le malattie sono collegati.", "Une carte qui montre comment les microbes (de tout petits êtres vivants dans le corps) et les maladies sont reliés."],
    eli20: ["논문 초록의 근거 문장에서 뽑은 미생물(속)–질병 관계를 한 장의 연결망으로 그린 것입니다.", "A network of microbe (genus)–condition relations drawn from evidence sentences in abstracts.", "Una rete delle relazioni microbo (genere)–patologia tratte dalle frasi di evidenza degli abstract.", "Un réseau des relations microbe (genre)–pathologie tirées des phrases de preuve des résumés."],
    pro: ["상위 속과 질병 사이의 ASSOCIATED 간선 중 방향 표가 4개 이상인 것만 그린 그래프입니다.", "ASSOCIATED edges between the top genera and conditions, drawn only with ≥4 direction votes.", "Archi ASSOCIATED tra i generi e le patologie principali, disegnati solo con ≥4 voti di direzione.", "Arêtes ASSOCIATED entre les principaux genres et pathologies, tracées seulement avec ≥4 votes de direction."]},
  how: {eli10: ["지하철 노선도처럼 읽어요. 노란 동그라미는 병, 초록 동그라미는 세균이에요. 빨간 선은 '그 병에서 많아져요', 파란 선은 '줄어들어요', 노란 점선은 '보고서끼리 의견이 달라요'. 동그라미를 눌러 보세요.", "Read it like a subway map. Yellow dots are illnesses, green dots are germs. A red line means 'more in that illness', blue means 'less', a dashed yellow line means 'reports disagree'. Click a dot.", "Leggila come la mappa della metropolitana. I pallini gialli sono malattie, quelli verdi germi. Una linea rossa vuol dire “di più in quella malattia”, blu “di meno”, una linea gialla tratteggiata “i resoconti non sono d'accordo”. Clicca un pallino.", "Lis-la comme un plan de métro. Les points jaunes sont des maladies, les points verts des microbes. Un trait rouge veut dire « plus nombreux dans cette maladie », bleu « moins nombreux », un pointillé jaune « les comptes rendus ne sont pas d'accord ». Clique sur un point."],
    eli20: [`주황 원 = 질병, 청록 원 = 미생물(속) · <span style="color:${UP}">빨강 선 = 질병에서 증가</span>, <span style="color:${DOWN}">파랑 = 감소</span>, <span style="color:${MIX}">노랑 점선 = 논문끼리 엇갈림</span> · 원과 선이 굵을수록 근거 문장이 많음 · 원을 누르면 오른쪽 표에 관계가 나옵니다.`,
      `Orange = condition, teal = microbe (genus) · <span style="color:${UP}">red line = higher in the condition</span>, <span style="color:${DOWN}">blue = lower</span>, <span style="color:${MIX}">dashed amber = papers disagree</span> · bigger circles and thicker lines = more evidence sentences · click a circle for its relations in the table on the right.`,
      `Arancione = patologia, verde acqua = microbo (genere) · <span style="color:${UP}">linea rossa = più alto nella patologia</span>, <span style="color:${DOWN}">blu = più basso</span>, <span style="color:${MIX}">tratteggio ambra = gli articoli non concordano</span> · cerchi più grandi e linee più spesse = più frasi di evidenza · clicca un cerchio per vederne le relazioni nella tabella a destra.`,
      `Orange = pathologie, bleu-vert = microbe (genre) · <span style="color:${UP}">trait rouge = plus élevé dans la pathologie</span>, <span style="color:${DOWN}">bleu = plus bas</span>, <span style="color:${MIX}">pointillés ambre = les articles ne concordent pas</span> · cercles plus grands et traits plus épais = plus de phrases de preuve · cliquez sur un cercle pour voir ses relations dans le tableau de droite.`],
    pro: ["간선 굵기 ∝ √근거 문장 수, 노드 크기 ∝ √가중치 · 색 = 방향 점수의 부호, 엇갈림 = 반대 방향 ≥30% · 힘 기반 배치라 거리에는 의미가 없습니다 · 같은 그래프를 로컬 Neo4j(Taxon, Disease, ASSOCIATED)에서 질의할 수 있습니다.", "Edge width ∝ √evidence sentences, node size ∝ √weight · colour = sign of the direction score, contested = ≥30% opposite · force layout, so distances mean nothing · the same graph is queryable in the local Neo4j (Taxon, Disease, ASSOCIATED).", "Spessore ∝ √frasi di evidenza, dimensione del nodo ∝ √peso · colore = segno del punteggio di direzione, conteso = ≥30% opposte · disposizione a forze, le distanze non significano nulla · lo stesso grafo si interroga nel Neo4j locale (Taxon, Disease, ASSOCIATED).", "Épaisseur ∝ √phrases de preuve, taille du nœud ∝ √poids · couleur = signe du score de direction, contesté = ≥30 % opposées · disposition par forces, les distances ne veulent rien dire · le même graphe s'interroge dans le Neo4j local (Taxon, Disease, ASSOCIATED)."]},
  key: ({e, D, n, c}) => { if (!e) return null; const up = e.score > 0, t = ti(e.s), dw = dirWord(e.score);
    return {eli10: [`가장 굵은 선을 보면 ${esc(D)}에 걸린 사람에게서 세균 ${t}${jp(e.s, "이", "가")} 더 ${up ? "많이" : "적게"} 보여요.`, `The thickest line says the germ ${t} is found ${up ? "more" : "less"} in people with ${en_(D)}.`, `La linea più spessa dice che il germe ${t} si trova ${up ? "di più" : "di meno"} nelle persone con ${en_(D)}.`, `Le trait le plus épais dit que le microbe ${t} est ${up ? "plus" : "moins"} présent chez les personnes atteintes ${fde(en_(D))}.`],
      eli20: [`근거가 가장 많은 연결은 ${t}–${esc(D)}입니다(근거 문장 ${fmt(e.w)}개, ${dw}). 그려진 관계 ${fmt(n)}개 중 ${fmt(c)}개는 논문끼리 방향이 엇갈립니다.`, `The best-evidenced link is ${t}–${en_(D)} (${fmt(e.w)} evidence sentences, ${dw}). ${fmt(c)} of the ${fmt(n)} relations drawn are contested.`, `Il legame con più evidenze è ${t}–${en_(D)} (${fmt(e.w)} frasi di evidenza, ${dw}). ${fmt(c)} delle ${fmt(n)} relazioni disegnate sono contese.`, `Le lien le mieux documenté est ${t}–${en_(D)} (${fmt(e.w)} phrases de preuve, ${dw}). ${fmt(c)} des ${fmt(n)} relations tracées sont contestées.`]}; }},
i_side: {
  what: {eli10: ["누른 동그라미와 이어진 것들의 목록이에요.", "A list of what the circle you clicked is linked to.", "L'elenco di ciò a cui è collegato il cerchio che hai cliccato.", "La liste de ce qui est relié au cercle sur lequel tu as cliqué."],
    eli20: ["선택한 질병(또는 미생물)과 연결된 관계와 근거 문장 수입니다.", "Relations of the selected condition (or microbe), with evidence sentence counts.", "Relazioni della patologia (o del microbo) selezionata, con il numero di frasi di evidenza.", "Relations de la pathologie (ou du microbe) sélectionnée, avec le nombre de phrases de preuve."]},
  how: {eli10: ["막대가 오른쪽으로 길면 '많아져요', 짧으면 '줄어들어요'. 숫자는 보고 수예요.", "A bar reaching far right means 'more', a short one means 'less'. The number counts reports.", "Una barra lunga verso destra vuol dire “di più”, una corta “di meno”. Il numero conta i resoconti.", "Une barre longue vers la droite veut dire « plus », une courte « moins ». Le nombre compte les comptes rendus."],
    eli20: ["막대 = 방향 점수(가운데 = 0, 끝까지 = 모두 증가) · 숫자 = 근거 문장 수 · 색 = 증가/감소/엇갈림", "Bar = direction score (middle = 0, full = all increase) · number = evidence sentences · colour = higher/lower/mixed", "Barra = punteggio di direzione (metà = 0, piena = tutti in aumento) · numero = frasi di evidenza · colore = più alto/più basso/discordante", "Barre = score de direction (milieu = 0, pleine = toutes en hausse) · nombre = phrases de preuve · couleur = plus haut/plus bas/discordant"],
    pro: ["점수 = (증가−감소)/(증가+감소+무차이), |점수| ≤ 0.25는 엇갈림으로 씁니다. 지도에 그려진 간선(표 ≥4)만 나옵니다.", "Score = (inc−dec)/(inc+dec+null); |score| ≤ 0.25 is labelled mixed. Only edges drawn on the map (≥4 votes) appear.", "Punteggio = (aum−dim)/(aum+dim+nulle); |punteggio| ≤ 0,25 è indicato come discordante. Compaiono solo gli archi della mappa (≥4 voti).", "Score = (hausse−baisse)/(hausse+baisse+nulles) ; |score| ≤ 0,25 est noté discordant. Seules les arêtes de la carte (≥4 votes) apparaissent."]},
  key: ({X, isT, e, n}) => { if (!e) return null; const x = isT ? ti(X) : esc(X), xe = isT ? ti(X) : en_(X), dw = dirWord(e.score);
    return {eli10: [`여기서 가장 많이 보고된 것은 ${x}${jp(X, "이에요", "예요")} (${fmt(e.w)}번).`, `The most reported link here is ${xe} (${fmt(e.w)} reports).`, `Il legame più riportato qui è ${xe} (${fmt(e.w)} resoconti).`, `Le lien le plus signalé ici est ${xe} (${fmt(e.w)} comptes rendus).`],
      eli20: [`연결 ${fmt(n)}개 중 근거가 가장 많은 것은 ${x}입니다(${fmt(e.w)}문장, ${dw}).`, `Of ${fmt(n)} links, ${xe} has the most evidence (${fmt(e.w)} sentences, ${dw}).`, `Su ${fmt(n)} legami, ${xe} ha più evidenze (${fmt(e.w)} frasi, ${dw}).`, `Sur ${fmt(n)} liens, ${xe} a le plus de preuves (${fmt(e.w)} phrases, ${dw}).`]}; }},
i_cons: {
  what: {eli10: ["많은 과학 보고서가 같은 말을 하는 세균과 병의 짝이에요.", "Germ–illness pairs that many science reports agree on.", "Coppie germe–malattia su cui molti resoconti scientifici sono d'accordo.", "Des paires microbe–maladie sur lesquelles beaucoup de comptes rendus scientifiques sont d'accord."],
    eli20: ["여러 논문이 같은 방향(질병에서 증가 또는 감소)을 보고한 미생물–질병 쌍입니다.", "Microbe–condition pairs that many papers report in the same direction (higher or lower in the condition).", "Coppie microbo–patologia che molti articoli riportano nella stessa direzione (più alto o più basso nella patologia).", "Paires microbe–pathologie que de nombreux articles rapportent dans le même sens (plus haut ou plus bas dans la pathologie)."],
    pro: ["합의 = |점수| ≥ 0.6이고 근거 문장 ≥ 5, 문(phylum) 수준 제외. 점수 = (증가−감소)/(증가+감소+무차이).", "Consensus = |score| ≥ 0.6 with ≥5 evidence sentences, phylum level excluded. Score = (inc−dec)/(inc+dec+null).", "Consenso = |punteggio| ≥ 0,6 con ≥5 frasi di evidenza, livello phylum escluso. Punteggio = (aum−dim)/(aum+dim+nulle).", "Consensus = |score| ≥ 0,6 avec ≥5 phrases de preuve, niveau phylum exclu. Score = (hausse−baisse)/(hausse+baisse+nulles)."]},
  how: {eli10: ["가운데 막대에서 빨강은 '많아져요', 파랑은 '줄어들어요' 보고예요. 줄을 누르면 아래에 진짜 보고서 문장이 나와요.", "In the middle bar, red is reports of 'more' and blue is 'less'. Click a row to read the real sentences below.", "Nella barra centrale il rosso sono i resoconti “di più”, il blu “di meno”. Clicca una riga per leggere sotto le frasi vere.", "Dans la barre du milieu, le rouge compte les « plus », le bleu les « moins ». Clique sur une ligne pour lire les vraies phrases en dessous."],
    eli20: ["막대 = 감소(파랑) 대 증가(빨강) 문장 · 논문 = 근거 논문 수 · 재현 = 공저자를 공유하지 않는 독립 그룹 수와 보고 연도 · MINERVA = 기존 지식과 같은 방향인지 · 행을 누르면 근거 문장", "Bar = decrease (blue) vs increase (red) sentences · papers = supporting papers · replication = independent author groups and years · MINERVA = same direction as existing knowledge? · click a row for evidence", "Barra = frasi in diminuzione (blu) contro in aumento (rosso) · articoli = articoli di supporto · replicazione = gruppi di autori indipendenti e anni · MINERVA = stessa direzione delle conoscenze esistenti? · clicca una riga per le evidenze", "Barre = phrases en baisse (bleu) contre en hausse (rouge) · articles = articles à l'appui · réplication = groupes d'auteurs indépendants et années · MINERVA = même sens que les connaissances existantes ? · cliquez sur une ligne pour les preuves"],
    pro: ["그룹 대조 확인 = AI 판정이 비교 그룹(질병군 대 대조군)을 확인한 문장 수 · 독립 그룹 = 저자를 공유하는 논문의 연결 요소 · 재현 배지 = 그룹 ≥3, 기간 ≥3년 · 상위 40쌍만 표시 · 주 편향: '차이 없음' 결과가 초록에 덜 실려 합의가 과대평가될 수 있습니다.", "Group-checked = sentences whose comparison groups (condition vs control) the AI judge confirmed · independent groups = connected components of papers sharing an author · replicated badge = ≥3 groups over ≥3 years · top 40 pairs shown · main bias: 'no difference' results are under-reported in abstracts, so agreement may be overstated.", "Gruppi verificati = frasi in cui il giudizio dell'IA ha confermato i gruppi di confronto (patologia contro controllo) · gruppi indipendenti = componenti connesse di articoli con un autore in comune · badge replicato = ≥3 gruppi in ≥3 anni · mostrate le prime 40 coppie · bias principale: i risultati “nessuna differenza” sono sottoriportati negli abstract, quindi il consenso può essere sovrastimato.", "Groupes vérifiés = phrases dont le juge IA a confirmé les groupes de comparaison (malades contre témoins) · groupes indépendants = composantes connexes d'articles partageant un auteur · badge répliqué = ≥3 groupes sur ≥3 ans · 40 premières paires affichées · biais principal : les résultats « aucune différence » sont sous-déclarés dans les résumés, le consensus peut donc être surestimé."]},
  key: ({p, D, N, r, ns}) => { if (!p) return null; const up = p.inc >= p.dec, t = ti(p.taxon), g = p.groups != null ? fmt(p.groups) : null;
    const gk = g ? `, 독립 그룹 ${g}개` : "", ge = g ? `, ${g} independent groups` : "", gi = g ? `, ${g} gruppi indipendenti` : "", gf = g ? `, ${g} groupes indépendants` : "";
    const rr = r != null ? [` 표의 ${fmt(N)}쌍 중 ${fmt(r)}쌍이 독립 재현 기준을 넘습니다.`, ` ${fmt(r)} of ${fmt(N)} pairs meet the replication bar.`, ` ${fmt(r)} coppie su ${fmt(N)} superano la soglia di replicazione.`, ` ${fmt(r)} paires sur ${fmt(N)} franchissent le seuil de réplication.`] : ["", "", "", ""];
    const nn = ns != null ? [` 그런데 미생물–질병 문장 중 '차이 없음'은 ${pf(ns)}뿐이라 합의가 과대평가될 수 있습니다.`, ` Only ${pf(ns)} of microbe–condition sentences say 'no difference', so agreement may be overstated.`, ` Solo ${itP(pf(ns))} delle frasi microbo–patologia dice “nessuna differenza”: il consenso può essere sovrastimato.`, ` Seules ${pf(ns)} des phrases microbe–pathologie disent « aucune différence » : le consensus peut être surestimé.`] : ["", "", "", ""];
    const e2 = [`가장 강한 합의: ${t}${jp(p.taxon, "은", "는")} ${esc(D)}에서 ${up ? "증가" : "감소"}합니다(논문 ${fmt(p.papers)}편${gk}).`, `Strongest agreement: ${t} is ${up ? "higher" : "lower"} in ${en_(D)} (${fmt(p.papers)} papers${ge}).`, `Accordo più forte: ${t} è ${up ? "più abbondante" : "meno abbondante"} nelle persone con ${en_(D)} (${fmt(p.papers)} articoli${gi}).`, `Accord le plus fort : ${t} est ${up ? "plus abondant" : "moins abondant"} en cas ${fde(en_(D))} (${fmt(p.papers)} articles${gf}).`];
    return {eli10: [`가장 많은 보고서가 동의하는 것: 세균 ${t}${jp(p.taxon, "은", "는")} ${esc(D)}에 걸린 사람에게서 더 ${up ? "많아요" : "적어요"}.`, `Most reports agree that the germ ${t} is found ${up ? "more" : "less"} in people with ${en_(D)}.`, `La maggior parte dei resoconti concorda: il germe ${t} si trova ${up ? "di più" : "di meno"} nelle persone con ${en_(D)}.`, `La plupart des comptes rendus sont d'accord : le microbe ${t} est ${up ? "plus" : "moins"} présent chez les personnes atteintes ${fde(en_(D))}.`],
      eli20: e2.map((s, i) => s + rr[i]), pro: e2.map((s, i) => s + rr[i] + nn[i])}; }},
i_contra: {
  what: {eli10: ["어떤 보고서는 '많아져요', 어떤 보고서는 '줄어들어요'라고 해서 아직 답이 없는 짝이에요.", "Pairs where some reports say 'more' and others say 'less', so there is no answer yet.", "Coppie in cui alcuni resoconti dicono “di più” e altri “di meno”: ancora nessuna risposta.", "Des paires où certains comptes rendus disent « plus » et d'autres « moins » : pas encore de réponse."],
    eli20: ["증가와 감소 보고가 함께 많이 섞여 결론이 갈리는 미생물–질병 쌍입니다.", "Microbe–condition pairs where increase and decrease reports are both common, so conclusions split.", "Coppie microbo–patologia in cui i resoconti di aumento e diminuzione sono entrambi frequenti: le conclusioni divergono.", "Paires microbe–pathologie où les hausses et les baisses sont toutes deux fréquentes : les conclusions divergent."],
    pro: ["논쟁 = 소수 방향 비율 ≥ 0.3. 재현 열은 방향마다의 독립 그룹 수(↓/↑)입니다.", "Debate = minority-direction share ≥ 0.3. The replication column gives independent groups per direction (↓/↑).", "Dibattito = quota della direzione minoritaria ≥ 0,3. La colonna replicazione indica i gruppi indipendenti per direzione (↓/↑).", "Débat = part de la direction minoritaire ≥ 0,3. La colonne réplication donne les groupes indépendants par sens (↓/↑)."]},
  how: {eli10: ["막대에 빨강과 파랑이 비슷하게 있으면 의견이 반반이에요. 줄을 누르면 양쪽 문장이 나와요.", "If a bar is half red and half blue, opinions are split in two. Click a row to read both sides.", "Se una barra è metà rossa e metà blu, le opinioni sono divise a metà. Clicca una riga per leggere le due parti.", "Si une barre est moitié rouge, moitié bleue, les avis sont partagés. Clique sur une ligne pour lire les deux côtés."],
    eli20: ["막대 = 감소 대 증가 문장 · 재현 = 각 방향을 보고한 독립 그룹 수(↓/↑) · 양쪽 모두 여러 그룹이면 실제 하위 집단·방법 차이일 가능성이 큽니다.", "Bar = decrease vs increase sentences · replication = independent groups per direction (↓/↑) · if both sides have several groups, a real subgroup or method difference is likely.", "Barra = frasi in diminuzione contro in aumento · replicazione = gruppi indipendenti per direzione (↓/↑) · se entrambe le parti hanno più gruppi, è probabile una vera differenza di sottogruppo o di metodo.", "Barre = phrases en baisse contre en hausse · réplication = groupes indépendants par sens (↓/↑) · si les deux côtés ont plusieurs groupes, une vraie différence de sous-groupe ou de méthode est probable."],
    pro: ["문 수준(예: Firmicutes)은 그 안의 속들이 반대로 움직여 논쟁이 많이 생깁니다. 하위 집단·방법 분리는 '미생물 시그니처'와 자동 후속 분석에서 봅니다.", "Phylum-level entries (e.g. Firmicutes) generate many debates because their genera move in opposite directions. Subgroup and method splits are in signatures and the automatic follow-ups.", "Le voci a livello di phylum (es. Firmicutes) generano molti dibattiti perché i loro generi si muovono in direzioni opposte. Le divisioni per sottogruppo e metodo sono nelle firme e negli approfondimenti automatici.", "Les entrées au niveau du phylum (p. ex. Firmicutes) créent beaucoup de débats, car leurs genres évoluent en sens opposés. Les séparations par sous-groupe et méthode sont dans les signatures et les analyses automatiques."]},
  key: ({p, D, N, b}) => { if (!p) return null; const t = ti(p.taxon), i = fmt(p.inc), d = fmt(p.dec);
    const bb = b != null ? [` 표의 ${fmt(N)}쌍 중 ${fmt(b)}쌍은 양쪽 방향이 모두 2개 이상의 독립 그룹에서 나왔습니다.`, ` In ${fmt(b)} of ${fmt(N)} pairs both directions come from ≥2 independent groups.`, ` In ${fmt(b)} coppie su ${fmt(N)} entrambe le direzioni vengono da ≥2 gruppi indipendenti.`, ` Dans ${fmt(b)} paires sur ${fmt(N)}, les deux sens viennent de ≥2 groupes indépendants.`] : ["", "", "", ""];
    return {eli10: [`가장 크게 다투는 짝: ${esc(D)}에서 세균 ${t}${jp(p.taxon, "이", "가")} 많아진다는 보고 ${i}개, 줄어든다는 보고 ${d}개예요.`, `The biggest disagreement: for ${t} and ${en_(D)}, ${i} reports say 'more' and ${d} say 'less'.`, `Il disaccordo più grande: per ${t} e ${en_(D)}, ${i} resoconti dicono “di più” e ${d} “di meno”.`, `Le plus grand désaccord : pour ${t} et ${en_(D)}, ${i} comptes rendus disent « plus » et ${d} « moins ».`],
      eli20: [`논문이 가장 많은 논쟁은 ${t}–${esc(D)}입니다: 증가 ${i}문장 대 감소 ${d}문장.${bb[0]}`, `The most-studied debate is ${t}–${en_(D)}: ${i} increase vs ${d} decrease sentences.${bb[1]}`, `Il dibattito più studiato è ${t}–${en_(D)}: ${i} frasi in aumento contro ${d} in diminuzione.${bb[2]}`, `Le débat le plus étudié est ${t}–${en_(D)} : ${i} phrases en hausse contre ${d} en baisse.${bb[3]}`]}; }},
i_hm: {
  what: {eli10: ["세균(가로줄)과 병(세로줄)이 만나는 칸에, 그 병에서 세균이 많아지는지 줄어드는지 색으로 칠했어요.", "Germs (rows) meet illnesses (columns); the colour shows if the germ goes up or down in that illness.", "Germi (righe) e malattie (colonne) si incontrano; il colore mostra se il germe sale o scende in quella malattia.", "Microbes (lignes) et maladies (colonnes) se croisent ; la couleur montre si le microbe monte ou baisse dans cette maladie."],
    eli20: ["근거가 많은 미생물 30개 × 질병 22개에서 보고 방향을 색으로 칠한 지도입니다.", "Direction of reports for the 30 best-evidenced microbes × 22 conditions, as colours.", "Direzione dei resoconti per i 30 microbi con più evidenze × 22 patologie, a colori.", "Sens des comptes rendus pour les 30 microbes les mieux documentés × 22 pathologies, en couleurs."]},
  how: {eli10: ["빨간 칸은 '많아져요', 파란 칸은 '줄어들어요', 어두운 칸은 반반이에요. 칸 숫자는 보고 수예요. 빈 칸은 아직 보고가 적은 곳이에요.", "Red cell = 'more', blue = 'less', dark = mixed. The number counts reports. Empty means too few reports so far.", "Cella rossa = “di più”, blu = “di meno”, scura = misto. Il numero conta i resoconti. Vuota = ancora pochi resoconti.", "Case rouge = « plus », bleue = « moins », sombre = partagé. Le nombre compte les comptes rendus. Vide = encore trop peu de comptes rendus."],
    eli20: ["색 = 방향 점수(파랑 −1 감소 … 빨강 +1 증가) · 숫자 = 근거 문장 수 · 빈 칸 = 지도 기준(표 ≥4) 미달", "Colour = direction score (blue −1 lower … red +1 higher) · number = evidence sentences · blank = below the map threshold (≥4 votes)", "Colore = punteggio di direzione (blu −1 più basso … rosso +1 più alto) · numero = frasi di evidenza · vuoto = sotto la soglia della mappa (≥4 voti)", "Couleur = score de direction (bleu −1 plus bas … rouge +1 plus haut) · nombre = phrases de preuve · vide = sous le seuil de la carte (≥4 votes)"],
    pro: ["점수 = (증가−감소)/(증가+감소+무차이). 속은 근거 합계 상위 30, 질병은 가중치 상위 22. 상대 풍부도 연구가 대부분이라 조성 효과(한 속이 늘면 다른 속이 줄어 보임)를 배제할 수 없습니다.", "Score = (inc−dec)/(inc+dec+null). Genera = top 30 by total evidence, conditions = top 22 by weight. Most studies report relative abundance, so compositional effects (one genus rising makes others look lower) cannot be ruled out.", "Punteggio = (aum−dim)/(aum+dim+nulle). Generi = primi 30 per evidenze totali, patologie = prime 22 per peso. La maggior parte degli studi riporta abbondanze relative: non si possono escludere effetti composizionali (se un genere sale gli altri sembrano scendere).", "Score = (hausse−baisse)/(hausse+baisse+nulles). Genres = 30 premiers par preuves totales, pathologies = 22 premières par poids. La plupart des études rapportent des abondances relatives : on ne peut exclure des effets de composition (un genre qui monte fait paraître les autres plus bas)."]},
  key: ({n, r, b, m, top, D}) => !n ? null : ({eli10: [`칠해진 칸 ${fmt(n)}개 중 빨간 칸이 ${fmt(r)}개, 파란 칸이 ${fmt(b)}개예요.`, `Of ${fmt(n)} coloured cells, ${fmt(r)} are red and ${fmt(b)} are blue.`, `Su ${fmt(n)} celle colorate, ${fmt(r)} sono rosse e ${fmt(b)} blu.`, `Sur ${fmt(n)} cases colorées, ${fmt(r)} sont rouges et ${fmt(b)} bleues.`],
    eli20: [`칸 ${fmt(n)}개 중 증가 우세 ${fmt(r)}개, 감소 우세 ${fmt(b)}개, 엇갈림 ${fmt(m)}개입니다. 근거가 가장 많은 칸은 ${ti(top.s)} × ${esc(D)}(${fmt(top.w)}문장)입니다.`, `Of ${fmt(n)} cells, ${fmt(r)} lean higher, ${fmt(b)} lean lower and ${fmt(m)} are mixed. The best-evidenced cell is ${ti(top.s)} × ${en_(D)} (${fmt(top.w)} sentences).`, `Su ${fmt(n)} celle, ${fmt(r)} tendono al più alto, ${fmt(b)} al più basso e ${fmt(m)} sono discordanti. La cella con più evidenze è ${ti(top.s)} × ${en_(D)} (${fmt(top.w)} frasi).`, `Sur ${fmt(n)} cases, ${fmt(r)} penchent vers le haut, ${fmt(b)} vers le bas et ${fmt(m)} sont discordantes. La case la mieux documentée est ${ti(top.s)} × ${en_(D)} (${fmt(top.w)} phrases).`]})},
i_sigs: {
  what: {eli10: ["여러 병에서 똑같이 움직이는 세균이에요.", "Germs that behave the same way in several illnesses.", "Germi che si comportano allo stesso modo in più malattie.", "Des microbes qui se comportent de la même façon dans plusieurs maladies."],
    eli20: ["3개 이상 질병에서 방향이 일관되게 보고된 미생물입니다.", "Microbes reported with a consistent direction in 3 or more conditions.", "Microbi riportati con una direzione coerente in 3 o più patologie.", "Microbes rapportés avec un sens cohérent dans 3 pathologies ou plus."]},
  how: {eli10: ["파란 이름표는 그 세균이 줄어드는 병, 빨간 이름표는 늘어나는 병이에요. 파랑이 많으면 '건강할 때 많은 세균'일 수 있어요.", "Blue tags are illnesses where the germ goes down, red tags where it goes up. Mostly blue may mean a germ found more in healthy people.", "Le etichette blu sono malattie in cui il germe scende, quelle rosse in cui sale. Tanto blu può voler dire un germe più presente nelle persone sane.", "Les étiquettes bleues sont les maladies où le microbe baisse, les rouges celles où il monte. Beaucoup de bleu peut indiquer un microbe plus présent chez les personnes en bonne santé."],
    eli20: ["막대 = 감소(파랑) 대 증가(빨강) 질병 수 · 칩 = 해당 질병 · 파랑 우세 = '건강 지표' 후보, 빨강 우세 = '질환 지표' 후보", "Bar = conditions where it is lower (blue) vs higher (red) · chips = those conditions · mostly blue = health-marker candidate, mostly red = disease-marker candidate", "Barra = patologie in cui è più basso (blu) contro più alto (rosso) · etichette = quelle patologie · soprattutto blu = candidato marcatore di salute, soprattutto rosso = candidato marcatore di malattia", "Barre = pathologies où il est plus bas (bleu) contre plus haut (rouge) · étiquettes = ces pathologies · surtout bleu = candidat marqueur de santé, surtout rouge = candidat marqueur de maladie"],
    pro: ["질병마다 방향이 정해진 간선(지도 기준)만 셉니다. 여러 질병에서 같은 방향이면 질병 특이성보다 비특이적 교란(염증, 항생제, 식이)의 신호일 수 있습니다.", "Counts only edges with a set direction (map threshold). The same direction across many conditions may signal non-specific confounders (inflammation, antibiotics, diet) rather than disease specificity.", "Conta solo gli archi con una direzione definita (soglia della mappa). La stessa direzione in molte patologie può indicare confondenti aspecifici (infiammazione, antibiotici, dieta) più che specificità di malattia.", "Ne compte que les arêtes de sens défini (seuil de la carte). Le même sens dans de nombreuses pathologies peut signaler des facteurs de confusion non spécifiques (inflammation, antibiotiques, alimentation) plutôt qu'une spécificité."]},
  key: ({s, hb}) => { if (!s) return null; const t = ti(s.taxon), u = s.up.length, d = s.down.length;
    return {eli10: [`세균 ${t}${jp(s.taxon, "은", "는")} ${u}개 병에서 늘고 ${d}개 병에서 줄어요.`, `The germ ${t} goes up in ${u} illnesses and down in ${d}.`, `Il germe ${t} sale in ${u} malattie e scende in ${d}.`, `Le microbe ${t} monte dans ${u} maladies et baisse dans ${d}.`],
      eli20: [`가장 넓게 나타나는 ${t}${jp(s.taxon, "은", "는")} 질병 ${s.diseases}개 중 ${u}개에서 증가, ${d}개에서 감소합니다(근거 ${fmt(s.evidence)}). 파랑이 우세한 미생물은 ${hb}개입니다.`, `The most widespread, ${t}, is higher in ${u} and lower in ${d} of ${s.diseases} conditions (${fmt(s.evidence)} evidence). ${hb} microbes lean mostly blue.`, `Il più diffuso, ${t}, è più alto in ${u} e più basso in ${d} di ${s.diseases} patologie (${fmt(s.evidence)} evidenze). ${hb} microbi tendono soprattutto al blu.`, `Le plus répandu, ${t}, est plus haut dans ${u} et plus bas dans ${d} des ${s.diseases} pathologies (${fmt(s.evidence)} preuves). ${hb} microbes penchent surtout vers le bleu.`]}; }},
i_rise: {
  what: {eli10: ["예전보다 요즘 더 많이 나오는 것들이에요.", "Things mentioned more now than before.", "Cose citate più ora che prima.", "Ce qui est cité plus souvent maintenant qu'avant."],
    eli20: ["최근 2년 논문에서의 언급 비율이 3–5년 전보다 가장 많이 늘어난 항목입니다.", "Items whose share of mentions grew most in the last 2 years compared with 3–5 years ago.", "Voci la cui quota di menzioni è cresciuta di più negli ultimi 2 anni rispetto a 3–5 anni fa.", "Éléments dont la part de mentions a le plus augmenté sur les 2 dernières années par rapport à il y a 3 à 5 ans."]},
  how: {eli10: ["위 버튼으로 병, 세균, 치료 같은 종류를 골라요. 막대 끝 ×2는 두 배라는 뜻이에요.", "Pick a kind (illnesses, germs, treatments…) with the buttons above. ×2 at the end of a bar means twice as often.", "Scegli un tipo (malattie, germi, cure…) con i pulsanti sopra. ×2 in fondo alla barra vuol dire il doppio.", "Choisis un type (maladies, microbes, traitements…) avec les boutons au-dessus. ×2 au bout d'une barre veut dire deux fois plus souvent."],
    eli20: ["막대 = 성장 배수(최근 비율 ÷ 이전 비율) · ×1 = 변화 없음 · 버튼 = 항목 종류 · 마우스를 올리면 두 기간의 비율과 논문 수", "Bar = growth factor (recent share ÷ earlier share) · ×1 = no change · buttons = kind of item · hover for both shares and papers", "Barra = fattore di crescita (quota recente ÷ quota precedente) · ×1 = nessun cambiamento · pulsanti = tipo di voce · passa sopra per le due quote e gli articoli", "Barre = facteur de croissance (part récente ÷ part antérieure) · ×1 = pas de changement · boutons = type d'élément · survolez pour les deux parts et les articles"],
    pro: ["성장 = share(최근 2년) ÷ share(3–5년 전), 최소 논문 수 적용. 연도별 수집량에 상한이 있어 비율로 비교하며, 분모가 작은 항목은 배수가 크게 흔들립니다.", "Growth = share(last 2 y) ÷ share(3–5 y ago) with a minimum paper count. Yearly collection is capped, so shares are compared; items with small denominators swing widely.", "Crescita = quota(ultimi 2 anni) ÷ quota(3–5 anni fa) con un numero minimo di articoli. La raccolta annuale ha un tetto, quindi si confrontano le quote; le voci con denominatori piccoli oscillano molto.", "Croissance = part(2 dernières années) ÷ part(il y a 3 à 5 ans) avec un minimum d'articles. La collecte annuelle est plafonnée, on compare donc des parts ; les éléments à petit dénominateur varient fortement."]},
  key: ({r, N, isT}) => { if (!r) return null; const x = isT ? ti(N) : esc(N), xe = isT ? ti(N) : en_(N), g = n1(r.growth);
    return {eli10: [`가장 빨리 늘어난 ${x}${jp(N, "은", "는")} 예전보다 ${g}배 자주 나와요.`, `${isT ? "The germ " + xe : cap(xe)} grew fastest: it is mentioned ${g} times as often as before.`, `Ciò che è cresciuto di più: ${isT ? "il germe " + xe : xe}, ora citato ${g} volte più di prima.`, `Ce qui a le plus progressé : ${isT ? "le microbe " + xe : xe}, cité ${g} fois plus qu'avant.`],
      eli20: [`가장 크게 늘어난 것은 ${x}입니다: 논문 중 언급 비율 ${pf(r.share_prior, 2)} → ${pf(r.share_recent, 2)} (${xf(r.growth)}, 논문 ${fmt(r.papers)}편).`, `Fastest riser: ${xe}, from ${pf(r.share_prior, 2)} to ${pf(r.share_recent, 2)} of papers (${xf(r.growth)}, ${fmt(r.papers)} papers).`, `Crescita più rapida: ${xe}, ${itPrep("da", pf(r.share_prior, 2))} ${itPrep("a", pf(r.share_recent, 2))} degli articoli (${xf(r.growth)}, ${fmt(r.papers)} articoli).`, `Plus forte hausse : ${xe}, de ${pf(r.share_prior, 2)} à ${pf(r.share_recent, 2)} des articles (${xf(r.growth)}, ${fmt(r.papers)} articles).`]}; }},
i_fade: {
  what: {eli10: ["예전보다 요즘 덜 나오는 것들이에요.", "Things mentioned less now than before.", "Cose citate meno ora che prima.", "Ce qui est cité moins souvent maintenant qu'avant."],
    eli20: ["같은 기준으로 언급 비율이 가장 많이 줄어든 항목입니다.", "Items whose share of mentions fell the most, same measure.", "Voci la cui quota di menzioni è calata di più, stessa misura.", "Éléments dont la part de mentions a le plus baissé, même mesure."]},
  how: {eli10: ["숫자가 1보다 작을수록 많이 줄었어요. ×0.5는 절반이라는 뜻이에요.", "The further the number is below 1, the bigger the drop. ×0.5 means half as often.", "Più il numero è sotto 1, più è calato. ×0,5 vuol dire la metà.", "Plus le nombre est sous 1, plus la baisse est forte. ×0,5 veut dire moitié moins souvent."],
    eli20: ["막대 = 성장 배수(1 미만 = 감소) · 짧을수록 많이 줄어든 항목 · 일시적 유행(예: 팬데믹) 뒤의 감소는 관심이 평소로 돌아온 것일 수 있습니다.", "Bar = growth factor (below 1 = decline) · shorter = bigger fall · a fall after a burst (e.g. a pandemic) may just be a return to normal.", "Barra = fattore di crescita (sotto 1 = calo) · più corta = calo maggiore · un calo dopo un picco (es. una pandemia) può essere solo un ritorno alla normalità.", "Barre = facteur de croissance (sous 1 = baisse) · plus courte = baisse plus forte · une baisse après un pic (p. ex. une pandémie) peut n'être qu'un retour à la normale."],
    pro: ["같은 share 비율입니다. 분류 정규식이 새 용어(예: 분류학적 개명)를 놓치면 인위적인 감소가 생길 수 있습니다.", "Same share ratio. If the class regex misses new terms (e.g. taxonomic renaming), artificial declines can appear.", "Stesso rapporto di quote. Se la regex della classe non coglie termini nuovi (es. riclassificazioni tassonomiche), possono comparire cali artificiali.", "Même rapport de parts. Si la regex de classe rate de nouveaux termes (p. ex. un renommage taxonomique), des baisses artificielles peuvent apparaître."]},
  key: ({r, N, isT}) => { if (!r) return null; const x = isT ? ti(N) : esc(N), xe = isT ? ti(N) : en_(N), p = pf(r.growth, 0);
    return {eli10: [`가장 많이 줄어든 ${x}${jp(N, "은", "는")} 이제 예전의 약 ${p}만큼만 나와요.`, `${isT ? "The germ " + xe : cap(xe)} dropped the most: its share is now about ${p} of what it was.`, `Ciò che è calato di più: ${isT ? "il germe " + xe : xe}, la cui quota è ora circa ${itP(p)} di prima.`, `Ce qui a le plus baissé : ${isT ? "le microbe " + xe : xe}, dont la part n'est plus qu'environ ${p} de celle d'avant.`],
      eli20: [`가장 크게 줄어든 것은 ${x}입니다: ${pf(r.share_prior, 2)} → ${pf(r.share_recent, 2)} (${xf(r.growth)}).`, `Largest fall: ${xe}, from ${pf(r.share_prior, 2)} to ${pf(r.share_recent, 2)} of papers (${xf(r.growth)}).`, `Calo maggiore: ${xe}, ${itPrep("da", pf(r.share_prior, 2))} ${itPrep("a", pf(r.share_recent, 2))} degli articoli (${xf(r.growth)}).`, `Plus forte baisse : ${xe}, de ${pf(r.share_prior, 2)} à ${pf(r.share_recent, 2)} des articles (${xf(r.growth)}).`]}; }},
i_lines: {
  what: {eli10: ["가장 빨리 늘어나는 것들이 해마다 어떻게 변했는지 그린 선이에요.", "Lines showing how the fastest-rising things changed year by year.", "Linee che mostrano come sono cambiate anno per anno le cose in più rapida crescita.", "Des courbes qui montrent comment les éléments en plus forte hausse ont évolué d'année en année."],
    eli20: ["떠오르는 상위 6개 항목의 연도별 언급 비율입니다.", "Yearly share of mentions for the top 6 rising items.", "Quota annuale di menzioni per le prime 6 voci in crescita.", "Part annuelle des mentions pour les 6 premiers éléments en hausse."]},
  how: {eli10: ["선이 위로 올라가면 그해 더 많이 이야기됐다는 뜻이에요. 색마다 다른 주제예요.", "A line going up means it was talked about more that year. Each colour is a different item.", "Una linea che sale vuol dire che se ne è parlato di più quell'anno. Ogni colore è una voce diversa.", "Une courbe qui monte veut dire qu'on en a plus parlé cette année-là. Chaque couleur est un élément différent."],
    eli20: ["가로 = 연도, 세로 = 그해 논문 중 언급 비율 · 범례를 눌러 선을 끄고 켤 수 있습니다.", "x = year, y = share of that year's papers mentioning it · click the legend to hide or show a line.", "x = anno, y = quota degli articoli di quell'anno che lo citano · clicca la legenda per nascondere o mostrare una linea.", "x = année, y = part des articles de l'année qui le citent · cliquez sur la légende pour masquer ou afficher une courbe."],
    pro: ["초기 연도는 수집 논문이 적어 비율이 불안정합니다. 마지막 해는 아직 수집 중인 부분 연도입니다.", "Early years have few collected papers, so shares are unstable; the last year is partial and still being collected.", "I primi anni hanno pochi articoli raccolti, quindi le quote sono instabili; l'ultimo anno è parziale e ancora in raccolta.", "Les premières années comptent peu d'articles collectés, leurs parts sont donc instables ; la dernière année est partielle et encore en collecte."]},
  key: ({N, isT, y0, y1, a, b}) => { if (!N || y0 == null) return null; const x = isT ? ti(N) : esc(N), xe = isT ? ti(N) : en_(N);
    return {eli10: [`${x}${jp(N, "은", "는")} ${y0}년보다 ${y1}년에 ${b > a ? "훨씬 많이" : "덜"} 나와요.`, `${isT ? xe : cap(xe)} shows up ${b > a ? "much more" : "less"} in ${y1} than in ${y0}.`, `Nel ${y1} si parla di ${xe} ${b > a ? "molto più" : "meno"} che nel ${y0}.`, `En ${y1}, on parle ${b > a ? "bien plus" : "moins"} ${fde(xe)} qu'en ${y0}.`],
      eli20: [`${x}의 언급 비율은 ${y0}년 ${pf(a, 2)}에서 ${y1}년 ${pf(b, 2)}로 바뀌었습니다.`, `${isT ? xe : cap(xe)}: ${pf(a, 2)} of papers in ${y0}, ${pf(b, 2)} in ${y1}.`, `${isT ? xe : cap(xe)}: ${pf(a, 2)} degli articoli nel ${y0}, ${pf(b, 2)} nel ${y1}.`, `${isT ? xe : cap(xe)} : ${pf(a, 2)} des articles en ${y0}, ${pf(b, 2)} en ${y1}.`]}; }},
i_lead: {
  what: {eli10: ["요즘 늘어나는 주제를 가장 많이 연구한 과학자들이에요.", "Scientists who wrote the most about the rising topics.", "Gli scienziati che hanno scritto di più sui temi in crescita.", "Les scientifiques qui ont le plus écrit sur les sujets en hausse."],
    eli20: ["떠오르는 상위 6개 항목마다 최근 3년 논문이 가장 많은 연구자입니다.", "For each of the top 6 rising items, the researchers with the most papers in the last 3 years.", "Per ognuna delle prime 6 voci in crescita, i ricercatori con più articoli negli ultimi 3 anni.", "Pour chacun des 6 premiers éléments en hausse, les chercheurs ayant le plus d'articles sur les 3 dernières années."]},
  how: {eli10: ["굵은 글씨가 주제, 아래 이름표가 과학자와 보고서 수예요.", "Bold text is the topic; the tags below are scientists and their report counts.", "Il grassetto è il tema; le etichette sotto sono gli scienziati e il numero di resoconti.", "Le gras est le sujet ; les étiquettes dessous sont les scientifiques et leur nombre de comptes rendus."],
    eli20: ["굵은 글씨 = 항목과 성장 배수 · 칩 = 연구자와 최근 3년 논문 수", "Bold = item and growth factor · chips = researcher and papers in the last 3 years", "Grassetto = voce e fattore di crescita · etichette = ricercatore e articoli negli ultimi 3 anni", "Gras = élément et facteur de croissance · étiquettes = chercheur et articles des 3 dernières années"],
    pro: ["ORCID가 없으면 저자 이름 문자열로 묶어 동명이인이 합쳐질 수 있습니다. 논문 수는 이 코퍼스 안의 수입니다.", "Without ORCID, authors are grouped by name string, so homonyms may merge. Paper counts are within this corpus.", "Senza ORCID gli autori sono raggruppati per nome, quindi gli omonimi possono fondersi. I conteggi sono interni a questo corpus.", "Sans ORCID, les auteurs sont regroupés par nom : des homonymes peuvent fusionner. Les nombres d'articles portent sur ce corpus."]},
  key: ({N, isT, a}) => { if (!N || !a) return null; const x = isT ? ti(N) : esc(N), xe = isT ? ti(N) : en_(N), nm_ = esc(a.name), p = fmt(a.papers);
    return {eli10: [`${x} 주제에서는 ${nm_} 과학자가 가장 많이 썼어요 (${p}편).`, `On ${xe}, ${nm_} wrote the most (${p} reports).`, `Sul tema «${xe}» ha scritto di più ${nm_} (${p} resoconti).`, `Sur le thème « ${xe} », c'est ${nm_} qui a le plus écrit (${p} comptes rendus).`],
      eli20: [`${x}에서 가장 활발한 연구자: ${nm_}, 최근 3년 ${p}편.`, `Most active on ${xe}: ${nm_}, ${p} papers in the last 3 years.`, `Più attivo sul tema «${xe}»: ${nm_}, ${p} articoli negli ultimi 3 anni.`, `Le plus actif sur le thème « ${xe} » : ${nm_}, ${p} articles sur les 3 dernières années.`]}; }},
i_next: {
  what: {eli10: ["다음에 연구하면 좋을 병을 컴퓨터가 순서대로 골랐어요.", "Illnesses the computer suggests studying next, in order.", "Le malattie che il computer suggerisce di studiare dopo, in ordine.", "Les maladies que l'ordinateur propose d'étudier ensuite, dans l'ordre."],
    eli20: ["관심 증가, 논문끼리의 엇갈림, 저자가 쓴 한계, MINERVA에 없는 새 연결을 합쳐 매긴 질병별 연구 우선순위입니다.", "Research priority by condition, combining rising interest, conflicting papers, limitations authors state and links new to MINERVA.", "Priorità di ricerca per patologia, che combina interesse in crescita, articoli in conflitto, limiti dichiarati dagli autori e legami nuovi rispetto a MINERVA.", "Priorité de recherche par pathologie, combinant intérêt croissant, articles en conflit, limites déclarées par les auteurs et liens nouveaux par rapport à MINERVA."]},
  how: {eli10: ["1번이 가장 먼저예요. 작은 이름표는 이유예요: 관심, 다툼, 아직 모르는 것.", "Number 1 comes first. The small tags are the reasons: interest, disagreements, unknowns.", "Il numero 1 viene per primo. Le etichette sono i motivi: interesse, disaccordi, cose che non si sanno.", "Le numéro 1 passe en premier. Les petites étiquettes sont les raisons : intérêt, désaccords, inconnues."],
    eli20: ["번호 = 순위 · 칩 = 관심 배수(초록 ≥1.2, 빨강 <0.9), 논쟁 쌍, 한계 진술, 논문 수, 새 연결 · 아래 = 채워야 할 한계와 결론이 갈리는 미생물", "Number = rank · chips = interest factor (green ≥1.2, red <0.9), contested pairs, limitation statements, papers, new links · below = limitations to fill and microbes with split results", "Numero = posizione · etichette = fattore d'interesse (verde ≥1,2, rosso <0,9), coppie contese, dichiarazioni di limiti, articoli, nuovi legami · sotto = limiti da colmare e microbi con risultati divisi", "Numéro = rang · étiquettes = facteur d'intérêt (vert ≥1,2, rouge <0,9), paires contestées, limites déclarées, articles, nouveaux liens · dessous = limites à combler et microbes aux résultats partagés"],
    pro: ["점수 = 2·ln(성장) + 1.5·ln(1+논쟁 쌍) + 0.8·ln(1+한계 진술) + ln(1+MINERVA 미수록) − 0.3·ln(1+논문). 가중치는 경험적이며 검증되지 않았습니다. 논문이 많은 질병일수록 한계 진술도 많아지는 편향이 있습니다.", "Score = 2·ln(growth) + 1.5·ln(1+contested pairs) + 0.8·ln(1+limitations) + ln(1+not in MINERVA) − 0.3·ln(1+papers). Heuristic, unvalidated weights. Well-studied conditions also accumulate more limitation statements.", "Punteggio = 2·ln(crescita) + 1,5·ln(1+coppie contese) + 0,8·ln(1+limiti) + ln(1+assenti in MINERVA) − 0,3·ln(1+articoli). Pesi euristici, non validati. Le patologie molto studiate accumulano anche più dichiarazioni di limiti.", "Score = 2·ln(croissance) + 1,5·ln(1+paires contestées) + 0,8·ln(1+limites) + ln(1+absents de MINERVA) − 0,3·ln(1+articles). Poids heuristiques, non validés. Les pathologies très étudiées accumulent aussi plus de limites déclarées."]},
  key: ({c, D}) => { if (!c) return null; const s = c.signals || {};
    return {eli10: [`1번인 ${esc(D)}에는 보고서끼리 의견이 갈리는 세균이 ${fmt(s.contradictions)}개 있어요.`, `Number 1 is ${en_(D)}, where reports disagree about ${fmt(s.contradictions)} germs.`, `Al numero 1: ${en_(D)}, dove i resoconti non concordano su ${fmt(s.contradictions)} germi.`, `En numéro 1 : ${en_(D)}, où les comptes rendus ne s'accordent pas sur ${fmt(s.contradictions)} microbes.`],
      eli20: [`1순위 ${esc(D)}: 관심 ${xf(s.growth)}, 논쟁 쌍 ${fmt(s.contradictions)}개, 한계 진술 ${fmt(s.gap_statements)}건, MINERVA에 없는 연결 ${fmt(s.new_vs_minerva || 0)}개입니다.`, `Top priority ${en_(D)}: interest ${xf(s.growth)}, ${fmt(s.contradictions)} contested pairs, ${fmt(s.gap_statements)} limitation statements, ${fmt(s.new_vs_minerva || 0)} links new to MINERVA.`, `Priorità 1, ${en_(D)}: interesse ${xf(s.growth)}, ${fmt(s.contradictions)} coppie contese, ${fmt(s.gap_statements)} dichiarazioni di limiti, ${fmt(s.new_vs_minerva || 0)} legami nuovi rispetto a MINERVA.`, `Priorité 1, ${en_(D)} : intérêt ${xf(s.growth)}, ${fmt(s.contradictions)} paires contestées, ${fmt(s.gap_statements)} limites déclarées, ${fmt(s.new_vs_minerva || 0)} liens absents de MINERVA.`]}; }},
i_gm: {
  what: {eli10: ["병마다 과학자들이 '이건 아직 부족해요'라고 쓴 이유를 칸으로 모았어요.", "For each illness, the kinds of 'this is still missing' notes scientists wrote, in a grid.", "Per ogni malattia, i tipi di note “qui manca ancora qualcosa” scritte dagli scienziati, in una griglia.", "Pour chaque maladie, les types de remarques « il manque encore ceci » écrites par les scientifiques, en grille."],
    eli20: ["논문의 한계·공백 문장을 주제로 분류해 질병별로 센 지도입니다.", "Limitation and gap sentences, grouped by theme and counted per condition.", "Frasi di limite e lacuna, raggruppate per tema e contate per patologia.", "Phrases de limite et de lacune, regroupées par thème et comptées par pathologie."]},
  how: {eli10: ["밝은 칸일수록 그 이유를 쓴 보고서가 많아요. 칸 숫자가 보고서 수예요.", "Brighter cell = more reports gave that reason. The number counts reports.", "Cella più chiara = più resoconti hanno dato quel motivo. Il numero conta i resoconti.", "Case plus claire = plus de comptes rendus ont donné cette raison. Le nombre compte les comptes rendus."],
    eli20: ["가로 = 한계 주제, 세로 = 질병 · 밝을수록 논문 많음 · 숫자 = 논문 수", "x = limitation theme, y = condition · brighter = more papers · number = papers", "x = tema del limite, y = patologia · più chiaro = più articoli · numero = articoli", "x = thème de limite, y = pathologie · plus clair = plus d'articles · nombre = articles"],
    pro: ["한계 문장 → 주제는 규칙 기반 분류입니다. 논문이 많은 질병일수록 칸 값이 커지므로 행 안에서 비율로 비교하세요.", "Limitation sentence → theme is a rule-based classification. Counts scale with a condition's paper volume, so compare proportions within a row.", "Frase di limite → tema è una classificazione a regole. I conteggi crescono con il volume di articoli della patologia: confronta le proporzioni nella riga.", "Phrase de limite → thème est une classification par règles. Les nombres croissent avec le volume d'articles : comparez les proportions dans une ligne."]},
  key: ({D, T, n}) => !D ? null : ({eli10: [`가장 밝은 칸: ${esc(D)} 보고서들이 가장 많이 말한 부족한 점은 '${esc(T)}'${jp(T, "이에요", "예요")}.`, `The brightest cell: reports on ${en_(D)} most often mention “${esc(lc(T))}”.`, `La cella più chiara: i resoconti sulla malattia «${en_(D)}» citano più spesso «${esc(lc(T))}».`, `La case la plus claire : les comptes rendus sur la maladie « ${en_(D)} » citent le plus souvent « ${esc(lc(T))} ».`],
    eli20: [`가장 큰 칸은 ${esc(D)} × ${esc(T)}(${fmt(n)}편)입니다.`, `Largest cell: ${esc(D)} × ${esc(T)} (${fmt(n)} papers).`, `Cella più grande: ${esc(D)} × ${esc(T)} (${fmt(n)} articoli).`, `Case la plus grande : ${esc(D)} × ${esc(T)} (${fmt(n)} articles).`]})},
i_gt: {
  what: {eli10: ["과학자들이 가장 자주 쓰는 '아직 부족한 점'의 순위예요.", "A ranking of the 'still missing' reasons scientists write most often.", "Una classifica dei motivi “manca ancora” che gli scienziati scrivono più spesso.", "Un classement des raisons « il manque encore » que les scientifiques écrivent le plus souvent."],
    eli20: ["전체 논문에서 한계 주제별 논문 수와, 고른 주제의 예시 문장입니다.", "Papers per limitation theme across the corpus, with example sentences for the chosen theme.", "Articoli per tema di limite in tutto il corpus, con frasi d'esempio per il tema scelto.", "Articles par thème de limite dans tout le corpus, avec des phrases d'exemple pour le thème choisi."]},
  how: {eli10: ["막대가 길수록 자주 나와요. 막대를 누르면 아래에 진짜 문장이 나와요.", "Longer bar = more often. Click a bar to read real sentences below.", "Barra più lunga = più spesso. Clicca una barra per leggere sotto frasi vere.", "Barre plus longue = plus souvent. Clique sur une barre pour lire de vraies phrases en dessous."],
    eli20: ["막대 = 논문 수 · 막대를 누르면 그 주제의 예시 문장(요약 + 원문 인용)", "Bar = papers · click a bar for example sentences of that theme (summary + quote)", "Barra = articoli · clicca una barra per le frasi d'esempio del tema (riassunto + citazione)", "Barre = articles · cliquez sur une barre pour des phrases d'exemple du thème (résumé + citation)"],
    pro: ["한 논문이 여러 주제에 들어갈 수 있습니다. 저자가 쓴 한계만 잡히므로 실제 방법론적 약점의 빈도와는 다릅니다.", "A paper can fall under several themes. Only limitations authors state are captured, which differs from the true frequency of methodological weaknesses.", "Un articolo può rientrare in più temi. Si colgono solo i limiti dichiarati dagli autori, diversi dalla vera frequenza delle debolezze metodologiche.", "Un article peut relever de plusieurs thèmes. Seules les limites déclarées par les auteurs sont captées, ce qui diffère de la vraie fréquence des faiblesses méthodologiques."]},
  key: ({a, b}) => !a ? null : ({eli10: [`가장 자주 나오는 부족한 점은 '${esc(a.T)}'${jp(a.T, "이에요", "예요")}.`, `The most common missing piece is “${esc(lc(a.T))}”.`, `Il pezzo mancante più comune è «${esc(lc(a.T))}».`, `Le manque le plus fréquent : « ${esc(lc(a.T))} ».`],
    eli20: b ? [`가장 흔한 한계는 ${esc(a.T)}(${fmt(a.n)}편)이고, 두 번째는 ${esc(b.T)}(${fmt(b.n)}편)입니다.`, `Most frequent: ${esc(a.T)} (${fmt(a.n)} papers), then ${esc(lc(b.T))} (${fmt(b.n)}).`, `Il più frequente: ${esc(a.T)} (${fmt(a.n)} articoli), poi ${esc(lc(b.T))} (${fmt(b.n)}).`, `Le plus fréquent : ${esc(a.T)} (${fmt(a.n)} articles), puis ${esc(lc(b.T))} (${fmt(b.n)}).`] : null})},
i_nv: {
  what: {eli10: ["우리 보고서들에는 나오는데 MINERVA 지도에는 아직 없는 세균–병 연결이에요.", "Germ–illness links our reports show that the MINERVA map does not have yet.", "Legami germe–malattia che i nostri resoconti mostrano e che la mappa MINERVA non ha ancora.", "Des liens microbe–maladie que nos comptes rendus montrent et que la carte MINERVA n'a pas encore."],
    eli20: ["우리 코퍼스에서 3편 이상이 같은 방향을 보고했지만 MINERVA 미생물→질병 관계에는 없는 쌍입니다.", "Pairs with ≥3 papers agreeing in our corpus that are absent from MINERVA's microbe→condition relations.", "Coppie con ≥3 articoli concordi nel nostro corpus, assenti dalle relazioni microbo→patologia di MINERVA.", "Paires avec ≥3 articles concordants dans notre corpus, absentes des relations microbe→pathologie de MINERVA."]},
  how: {eli10: ["막대와 숫자는 합의 표와 같아요. 줄을 누르면 아래에 진짜 문장이 나와요.", "Bars and numbers work like the agreement table. Click a row to read real sentences below.", "Barre e numeri funzionano come nella tabella del consenso. Clicca una riga per leggere sotto frasi vere.", "Barres et nombres fonctionnent comme dans le tableau des accords. Clique sur une ligne pour lire de vraies phrases en dessous."],
    eli20: ["막대 = 감소 대 증가 문장 · 논문 수 · MINERVA 열: '없음(새 연결)' 또는 '질병 없음'(MINERVA에 대응 질병이 없음) · 행을 누르면 근거", "Bar = decrease vs increase sentences · papers · MINERVA column: 'absent (new link)' or 'no condition' (no matching condition in MINERVA) · click a row for evidence", "Barra = frasi in diminuzione contro in aumento · articoli · colonna MINERVA: “assente (nuovo legame)” o “patologia assente” (nessuna patologia corrispondente) · clicca una riga per le evidenze", "Barre = phrases en baisse contre en hausse · articles · colonne MINERVA : « absent (nouveau lien) » ou « pas de pathologie » (aucune pathologie correspondante) · cliquez sur une ligne pour les preuves"],
    pro: ["질병 이름은 정규식으로 자동 대응하므로 일부는 표기 차이(동의어, 분류학적 개명)일 수 있습니다. '새 연결'은 MINERVA에 없다는 뜻이지 새 발견이라는 뜻이 아닙니다.", "Condition names are mapped by regex, so some may be naming differences (synonyms, taxonomic renaming). 'New link' means absent from MINERVA, not a new discovery.", "I nomi delle patologie sono associati via regex, quindi alcuni possono essere differenze di nome (sinonimi, riclassificazioni). “Nuovo legame” vuol dire assente in MINERVA, non scoperta nuova.", "Les noms de pathologies sont associés par regex : certains peuvent être des différences de nom (synonymes, renommage taxonomique). « Nouveau lien » signifie absent de MINERVA, pas découverte nouvelle."]},
  key: ({n, p, D}) => !p ? null : ({eli10: [`새 연결이 ${fmt(n)}개 있고, 보고가 가장 많은 것은 세균 ${ti(p.taxon)}${jp(p.taxon, "과", "와")} ${esc(D)}의 연결이에요.`, `There are ${fmt(n)} new links; the best-reported is the germ ${ti(p.taxon)} with ${en_(D)}.`, `Ci sono ${fmt(n)} nuovi legami; il più riportato è il germe ${ti(p.taxon)} con ${en_(D)}.`, `Il y a ${fmt(n)} nouveaux liens ; le plus signalé : le microbe ${ti(p.taxon)} et ${en_(D)}.`],
    eli20: [`MINERVA에 없는 연결 ${fmt(n)}개 중 논문이 가장 많은 것은 ${ti(p.taxon)}–${esc(D)}입니다(${fmt(p.papers)}편, ${dirWord(p.score)}).`, `${fmt(n)} links are absent from MINERVA; the best-supported is ${ti(p.taxon)}–${en_(D)} (${fmt(p.papers)} papers, ${dirWord(p.score)}).`, `${fmt(n)} legami sono assenti da MINERVA; il più sostenuto è ${ti(p.taxon)}–${en_(D)} (${fmt(p.papers)} articoli, ${dirWord(p.score)}).`, `${fmt(n)} liens sont absents de MINERVA ; le mieux étayé est ${ti(p.taxon)}–${en_(D)} (${fmt(p.papers)} articles, ${dirWord(p.score)}).`]})},
i_opp: {
  what: {eli10: ["우리 보고서들과 MINERVA가 반대로 말하는 연결이에요.", "Links where our reports and MINERVA say opposite things.", "Legami su cui i nostri resoconti e MINERVA dicono cose opposte.", "Des liens où nos comptes rendus et MINERVA disent le contraire."],
    eli20: ["우리 합의 관계 중 MINERVA의 다수 방향과 반대인 쌍입니다.", "Our consensus pairs whose direction is opposite to MINERVA's majority direction.", "Le nostre coppie di consenso con direzione opposta a quella maggioritaria di MINERVA.", "Nos paires de consensus dont le sens est opposé au sens majoritaire de MINERVA."]},
  how: {eli10: ["줄마다 우리 쪽 결과를 보여 줘요. 이런 줄은 다시 확인해 볼 후보예요.", "Each row shows our side of the result. These rows are candidates to double-check.", "Ogni riga mostra il nostro risultato. Queste righe sono da ricontrollare.", "Chaque ligne montre notre résultat. Ces lignes sont à revérifier."],
    eli20: ["막대 = 우리 코퍼스의 감소 대 증가 문장 · MINERVA 열 = '반대 방향' · 새 논문이 기존 지식과 다르게 말하는 재검토 후보", "Bar = decrease vs increase sentences in our corpus · MINERVA column = 'opposite' · candidates for review where newer papers disagree with existing knowledge", "Barra = frasi in diminuzione contro in aumento nel nostro corpus · colonna MINERVA = “opposta” · candidati alla revisione in cui articoli recenti contraddicono le conoscenze esistenti", "Barre = phrases en baisse contre en hausse dans notre corpus · colonne MINERVA = « opposé » · candidats à revoir où des articles récents contredisent les connaissances existantes"],
    pro: ["MINERVA 방향 = 증가 행 대 감소 행의 다수. 근거량 차이가 커서(MINERVA는 수백 행) 반대가 곧 오류라는 뜻은 아닙니다. 하위 집단과 검체 종류 차이를 먼저 확인하세요.", "MINERVA direction = majority of increase vs decrease rows. Evidence volumes differ greatly (MINERVA has hundreds of rows), so opposite does not mean wrong; check subgroup and sample-type differences first.", "Direzione MINERVA = maggioranza tra righe in aumento e in diminuzione. I volumi di evidenza differiscono molto (MINERVA ha centinaia di righe): opposto non vuol dire sbagliato; verifica prima sottogruppi e tipo di campione.", "Sens MINERVA = majorité des lignes en hausse contre en baisse. Les volumes de preuves diffèrent beaucoup (MINERVA a des centaines de lignes) : opposé ne veut pas dire faux ; vérifiez d'abord sous-groupes et types d'échantillons."]},
  key: ({o, A}) => !A || !A.compared ? null : ({eli10: [`비교한 ${fmt(A.compared)}개 중 ${fmt(A.agree)}개는 MINERVA와 같은 방향이고, 반대는 ${fmt(o)}개예요.`, `Of ${fmt(A.compared)} compared links, ${fmt(A.agree)} agree with MINERVA and ${fmt(o)} ${pl(o, "points", "point")} the other way.`, `Su ${fmt(A.compared)} legami confrontati, ${fmt(A.agree)} concordano con MINERVA e ${fmt(o)} ${pl(o, "va", "vanno")} nell'altra direzione.`, `Sur ${fmt(A.compared)} liens comparés, ${fmt(A.agree)} vont dans le même sens que MINERVA et ${fmt(o)} dans l'autre.`],
    eli20: [`비교 가능한 합의 관계 중 ${pf(A.agree / A.compared, 0)}(${fmt(A.agree)}/${fmt(A.compared)})가 MINERVA와 같은 방향이고 ${fmt(o)}개가 반대입니다.`, `${pf(A.agree / A.compared, 0)} of comparable consensus relations (${fmt(A.agree)}/${fmt(A.compared)}) match MINERVA's direction; ${fmt(o)} ${pl(o, "is", "are")} opposite.`, `${cap(itP(pf(A.agree / A.compared, 0)))} delle relazioni di consenso confrontabili (${fmt(A.agree)}/${fmt(A.compared)}) concorda con MINERVA; ${fmt(o)} ${pl(o, "è opposta", "sono opposte")}.`, `${pf(A.agree / A.compared, 0)} des relations de consensus comparables (${fmt(A.agree)}/${fmt(A.compared)}) vont dans le sens de MINERVA ; ${fmt(o)} ${pl(o, "est opposée", "sont opposées")}.`]})},
/* --- insight lab: reversal, evidence quality --- */
i_rvsk: {
  what: {eli10: ["어떤 병에서 줄어든(또는 늘어난) 세균을 유산균이나 음식 같은 방법으로 되돌릴 수 있을지 이어 본 그림이에요. 치료법이 아니라 시험해 볼 아이디어예요.", "A picture joining germs that drop (or grow) in an illness to treatments, like probiotics or food, that might push them back. Ideas to test, not cures.", "Un'immagine che collega i germi che calano (o crescono) in una malattia a rimedi, come probiotici o cibo, che potrebbero riportarli indietro. Idee da provare, non cure.", "Une image qui relie les microbes qui baissent (ou augmentent) dans une maladie à des moyens, comme les probiotiques ou l'alimentation, qui pourraient les ramener. Des idées à tester, pas des traitements."],
    eli20: ["질병 문헌(이 질병에서 미생물이 감소/증가)과 개입 문헌(이 개입이 그 미생물을 증가/감소)을 이어 붙인 가설입니다. 개입이 이 질병에 효과가 있다는 근거는 아닙니다.", "Hypotheses joining two literatures: condition papers (a microbe is lower/higher in the condition) and intervention papers (an intervention raises/lowers that microbe). Not evidence that the intervention works in the condition.", "Ipotesi che uniscono due letterature: articoli sulla patologia (un microbo è più basso/alto) e articoli sull'intervento (un intervento lo aumenta/diminuisce). Non è una prova che l'intervento funzioni nella patologia.", "Hypothèses reliant deux littératures : les articles sur la pathologie (un microbe y est plus bas/haut) et ceux sur l'intervention (une intervention l'augmente/le diminue). Ce n'est pas une preuve que l'intervention marche dans la pathologie."],
    pro: ["두 문헌의 방향 근거를 결합한 되돌리기 가설 그래프(점수 상위 30개 후보)입니다.", "Reversal-hypothesis graph combining directional evidence from both literatures (top 30 candidates by score).", "Grafo delle ipotesi di inversione che combina le evidenze direzionali delle due letterature (primi 30 candidati per punteggio).", "Graphe d'hypothèses d'inversion combinant les preuves directionnelles des deux littératures (30 premiers candidats par score)."]},
  how: () => ({eli10: ["왼쪽에서 오른쪽으로 읽어요: 병 → 세균 → 방법. 파란 세균은 병에서 줄어든 것, 빨간 세균은 늘어난 것이에요. 초록 띠는 '다시 늘리기', 분홍 띠는 '줄이기'예요. 띠가 두꺼울수록 근거가 많아요.", "Read left to right: illness → germ → treatment. Blue germs drop in the illness, red ones grow. A green band means 'bring it back up', a pink band 'bring it down'. Thicker bands have more evidence.", "Leggi da sinistra a destra: malattia → germe → rimedio. I germi blu calano nella malattia, quelli rossi crescono. Una fascia verde vuol dire “farlo risalire”, una rosa “farlo scendere”. Fasce più spesse = più prove.", "Lis de gauche à droite : maladie → microbe → moyen. Les microbes bleus baissent dans la maladie, les rouges augmentent. Une bande verte veut dire « le faire remonter », une rose « le faire baisser ». Plus la bande est épaisse, plus il y a de preuves."],
    eli20: ["왼쪽 → 오른쪽: 질병 → 미생물 → 개입 · 미생물 색 = 질병에서 감소(파랑)/증가(빨강) · 띠 색 = 회복(청록)/억제(산호) · 띠 굵기 = 후보 점수 합 · 위 필터로 질병과 독립 재현 여부를 고릅니다.", "Left → right: condition → microbe → intervention · microbe colour = lower (blue) / higher (red) in the condition · band colour = restore (teal) / suppress (coral) · band width = summed candidate score · filter by condition and replication above.", "Da sinistra a destra: patologia → microbo → intervento · colore del microbo = più basso (blu) / più alto (rosso) nella patologia · colore della fascia = ripristino (verde acqua) / soppressione (corallo) · spessore = somma dei punteggi · filtra sopra per patologia e replicazione.", "De gauche à droite : pathologie → microbe → intervention · couleur du microbe = plus bas (bleu) / plus haut (rouge) dans la pathologie · couleur de la bande = restauration (bleu-vert) / suppression (corail) · épaisseur = somme des scores · filtrez ci-dessus par pathologie et réplication."],
    pro: (t => [`질병 쪽: 다수 방향 표 ≥${t.disease_majority_votes}, 비율 ≥${t.disease_ratio}, 논문 ≥${t.disease_papers} · 개입 쪽: 다수 방향 논문 ≥${t.intervention_majority_papers}, 비율 ≥${t.intervention_ratio}, 사람 숙주 문장만 · 논쟁 쌍 ×${t.contested_penalty}, 문 수준 제외 · 질병당 ${t.per_disease}, 미생물당 ${t.per_taxon}, 전체 ${t.cap}개 상한 · 띠 굵기 = 점수 합 · 주 편향: 개입이 그 미생물 자체를 넣는 경우(⚠) '증가'는 투여량을 잰 것일 수 있습니다.`,
      `Condition side: majority votes ≥${t.disease_majority_votes}, ratio ≥${t.disease_ratio}, papers ≥${t.disease_papers} · intervention side: majority papers ≥${t.intervention_majority_papers}, ratio ≥${t.intervention_ratio}, human-host sentences only · contested pairs ×${t.contested_penalty}, phylum excluded · caps: ${t.per_disease} per condition, ${t.per_taxon} per microbe, ${t.cap} overall · band width = summed score · main bias: when the intervention contains the microbe itself (⚠), an 'increase' may measure the dose.`,
      `Lato patologia: voti maggioritari ≥${t.disease_majority_votes}, rapporto ≥${t.disease_ratio}, articoli ≥${t.disease_papers} · lato intervento: articoli maggioritari ≥${t.intervention_majority_papers}, rapporto ≥${t.intervention_ratio}, solo frasi con ospite umano · coppie contese ×${t.contested_penalty}, phylum escluso · tetti: ${t.per_disease} per patologia, ${t.per_taxon} per microbo, ${t.cap} in totale · spessore = somma dei punteggi · bias principale: se l'intervento contiene il microbo stesso (⚠), un “aumento” può misurare la dose.`,
      `Côté pathologie : votes majoritaires ≥${t.disease_majority_votes}, rapport ≥${t.disease_ratio}, articles ≥${t.disease_papers} · côté intervention : articles majoritaires ≥${t.intervention_majority_papers}, rapport ≥${t.intervention_ratio}, phrases à hôte humain seulement · paires contestées ×${t.contested_penalty}, phylum exclu · plafonds : ${t.per_disease} par pathologie, ${t.per_taxon} par microbe, ${t.cap} au total · épaisseur = somme des scores · biais principal : si l'intervention contient le microbe lui-même (⚠), une « hausse » peut mesurer la dose.`])(Object.assign({disease_majority_votes: 5, disease_ratio: 2, disease_papers: 3, intervention_majority_papers: 3, intervention_ratio: 2, contested_penalty: 0.5, per_disease: 6, per_taxon: 5, cap: 60}, thr("reversal", {})))}),
  key: ({r, D, I}) => { if (!r) return null; const a = r.disease_leg || {}, b = r.intervention_leg || {}, low = a.taxon_in_disease === "lower", raise = b.effect !== "decrease", t = ti(r.taxon);
    const A = (a.increase || 0) + (a.decrease || 0) + (a.null || 0), am = low ? a.decrease : a.increase, bm = raise ? b.increase_papers : b.decrease_papers;
    return {eli10: low ? [`가장 유력한 아이디어는 ${esc(D)}에서 줄어드는 세균 ${t}${jp(r.taxon, "을", "를")} ${jo(esc(I), "으로", "로")} 다시 늘리는 거예요.`, `The top idea: ${en_(I)} might raise the germ ${t}, which drops in ${en_(D)}.`, `L'idea migliore: usare «${en_(I)}» per far risalire il germe ${t}, che cala nelle persone con ${en_(D)}.`, `L'idée la plus forte : utiliser « ${en_(I)} » pour faire remonter le microbe ${t}, qui baisse en cas ${fde(en_(D))}.`]
        : [`가장 유력한 아이디어는 ${esc(D)}에서 늘어나는 세균 ${t}${jp(r.taxon, "을", "를")} ${jo(esc(I), "으로", "로")} 줄이는 거예요.`, `The top idea: ${en_(I)} might lower the germ ${t}, which grows in ${en_(D)}.`, `L'idea migliore: usare «${en_(I)}» per far scendere il germe ${t}, che cresce nelle persone con ${en_(D)}.`, `L'idée la plus forte : utiliser « ${en_(I)} » pour faire baisser le microbe ${t}, qui augmente en cas ${fde(en_(D))}.`],
      eli20: [`최고 점수 후보는 ${esc(D)} · ${t} · ${esc(I)}입니다(점수 ${n1(r.score)}). 질병 쪽 ${fmt(am)}/${fmt(A)}문장이 ${low ? "감소" : "증가"}를, 개입 쪽 ${fmt(bm)}/${fmt(b.papers)}편이 ${raise ? "증가" : "감소"}를 보고합니다.`,
        `Top candidate: ${en_(D)} · ${t} · ${en_(I)} (score ${n1(r.score)}). Condition side: ${fmt(am)}/${fmt(A)} sentences report it ${low ? "lower" : "higher"}; intervention side: ${fmt(bm)}/${fmt(b.papers)} papers report that it ${raise ? "raises" : "lowers"} it.`,
        `Candidato migliore: ${en_(D)} · ${t} · ${en_(I)} (punteggio ${n1(r.score)}). Lato patologia: ${fmt(am)}/${fmt(A)} frasi lo indicano ${low ? "più basso" : "più alto"}; lato intervento: ${fmt(bm)}/${fmt(b.papers)} articoli indicano che lo ${raise ? "aumenta" : "riduce"}.`,
        `Meilleur candidat : ${en_(D)} · ${t} · ${en_(I)} (score ${n1(r.score)}). Côté pathologie : ${fmt(am)}/${fmt(A)} phrases le disent ${low ? "plus bas" : "plus haut"} ; côté intervention : ${fmt(bm)}/${fmt(b.papers)} articles disent qu'elle ${raise ? "l'augmente" : "le diminue"}.`]}; }},
i_rvt: {
  what: {eli10: ["시험해 볼 만한 아이디어 목록이에요. 점수가 높을수록 근거가 더 많아요.", "The list of ideas worth testing. Higher score = more evidence.", "L'elenco delle idee da provare. Punteggio più alto = più prove.", "La liste des idées à tester. Score plus élevé = plus de preuves."],
    eli20: ["되돌리기 후보를 점수 순으로 나열한 표입니다.", "Reversal candidates ranked by score.", "Candidati all'inversione in ordine di punteggio.", "Candidats d'inversion classés par score."]},
  how: {eli10: ["↓는 병에서 줄어든 세균, ↑는 늘어난 세균이에요. 줄을 누르면 오른쪽에 두 가지 근거가 나와요.", "↓ means the germ drops in the illness, ↑ means it grows. Click a row to see both kinds of evidence on the right.", "↓ vuol dire che il germe cala nella malattia, ↑ che cresce. Clicca una riga per vedere a destra i due tipi di prove.", "↓ veut dire que le microbe baisse dans la maladie, ↑ qu'il augmente. Clique sur une ligne pour voir à droite les deux types de preuves."],
    eli20: ["질병에서 = 방향과 다수 문장/전체 · 개입·효과 = 미생물을 올리는지(↑) 내리는지(↓)와 다수 논문/전체 · 배지: 독립 재현, 이미 시험됨(이 질병을 언급한 개입 논문), 투여 균?, 논쟁 · 행을 누르면 양쪽 근거", "In condition = direction and majority/all sentences · intervention · effect = raises (↑) or lowers (↓) the microbe, majority/all papers · badges: replicated, already tested (intervention papers mentioning this condition), administered?, contested · click a row for both sides", "Nella patologia = direzione e frasi maggioritarie/totali · intervento · effetto = aumenta (↑) o riduce (↓) il microbo, articoli maggioritari/totali · badge: replicato, già testato (articoli sull'intervento che citano la patologia), somministrato?, conteso · clicca una riga per le due parti", "Dans la pathologie = sens et phrases majoritaires/total · intervention · effet = augmente (↑) ou diminue (↓) le microbe, articles majoritaires/total · badges : répliqué, déjà testé (articles d'intervention citant la pathologie), administré ?, contesté · cliquez sur une ligne pour les deux côtés"],
    pro: ["'투여 균?'은 개입이 그 미생물을 포함할 수 있을 때 붙습니다(예: Lactobacillus 제제). 이 경우 '증가'는 투여량을 잰 것일 수 있어 되돌림의 증거로 보기 어렵습니다. 재현 = 질병 쪽 독립 그룹 ≥3·기간 ≥3년이고 개입 쪽 그룹 ≥2.", "'Administered?' flags interventions that may contain the microbe itself (e.g. a Lactobacillus product); an 'increase' may then measure the dose, not a reversal. Replicated = condition side ≥3 independent groups over ≥3 years and intervention side ≥2 groups.", "“Somministrato?” segnala interventi che possono contenere il microbo stesso (es. un prodotto a base di Lactobacillus); un “aumento” può allora misurare la dose, non un'inversione. Replicato = lato patologia ≥3 gruppi indipendenti in ≥3 anni e lato intervento ≥2 gruppi.", "« Administré ? » signale les interventions qui peuvent contenir le microbe lui-même (p. ex. un produit à base de Lactobacillus) ; une « hausse » peut alors mesurer la dose, pas une inversion. Répliqué = côté pathologie ≥3 groupes indépendants sur ≥3 ans et côté intervention ≥2 groupes."]},
  key: ({n, r, t, pa}) => !n ? null : ({eli10: [`아이디어 ${fmt(n)}개 중 ${fmt(r)}개는 서로 다른 여러 연구팀이 따로 보고했어요.`, `Of ${fmt(n)} ideas, ${fmt(r)} were reported separately by several different research teams.`, `Su ${fmt(n)} idee, ${fmt(r)} sono state riportate separatamente da più gruppi di ricerca diversi.`, `Sur ${fmt(n)} idées, ${fmt(r)} ont été rapportées séparément par plusieurs équipes de recherche différentes.`],
    eli20: [`표시된 후보 ${fmt(n)}개 중 독립 재현 ${fmt(r)}개, 이미 시험된 것 ${fmt(t)}개, 투여 균일 수 있는 것 ${fmt(pa)}개입니다.`, `${fmt(n)} candidates shown: ${fmt(r)} replicated, ${fmt(t)} already tested, ${fmt(pa)} possibly the administered microbe.`, `${fmt(n)} candidati mostrati: ${fmt(r)} replicati, ${fmt(t)} già testati, ${fmt(pa)} forse il microbo somministrato.`, `${fmt(n)} candidats affichés : ${fmt(r)} répliqués, ${fmt(t)} déjà testés, ${fmt(pa)} peut-être le microbe administré.`]})},
i_pbt: {
  what: {eli10: ["'차이 없음'이라는 결과가 얼마나 자주 보고되는지 보여 줘요. 너무 적으면 그런 결과가 숨겨졌을 수 있어요.", "How often reports say 'no difference'. If that is very rare, such results may be going missing.", "Quanto spesso i resoconti dicono “nessuna differenza”. Se è molto raro, quei risultati potrebbero sparire.", "À quelle fréquence les comptes rendus disent « aucune différence ». Si c'est très rare, ces résultats disparaissent peut-être."],
    eli20: ["근거 문장 종류별로 '차이 없음'(무효) 결과가 차지하는 비율입니다.", "Share of 'no difference' (null) results by kind of evidence sentence.", "Quota di risultati “nessuna differenza” (nulli) per tipo di frase di evidenza.", "Part des résultats « aucune différence » (nuls) par type de phrase de preuve."]},
  how: {eli10: ["막대가 짧을수록 '차이 없음' 보고가 드물어요.", "Shorter bar = 'no difference' reports are rarer.", "Barra più corta = i resoconti “nessuna differenza” sono più rari.", "Barre plus courte = les « aucune différence » sont plus rares."],
    eli20: ["막대 = 무효 비율 · 마우스를 올리면 간선 수와 무효 수 · 실제 연구에서는 무효 결과가 흔하므로 아주 낮은 비율은 초록이 양성 결과 위주라는 신호입니다.", "Bar = null share · hover for edge and null counts · null results are common in real studies, so a very low share signals that abstracts favour positive findings.", "Barra = quota nulla · passa sopra per archi e nulli · nei veri studi i risultati nulli sono comuni, quindi una quota molto bassa indica abstract sbilanciati verso risultati positivi.", "Barre = part nulle · survolez pour les arêtes et les nuls · les résultats nuls sont fréquents dans les vraies études : une part très basse indique des résumés orientés vers les résultats positifs."],
    pro: ["무효 비율 = null 방향 문장 ÷ 그 종류의 전체 간선. 초록 기반이라 본문에만 있는 무효 결과는 빠지므로 측정 편향과 출판 편향이 섞여 있습니다.", "Null share = null-direction sentences ÷ all edges of that kind. Abstract-based, so nulls reported only in full texts are missed; measurement and publication bias are mixed.", "Quota nulla = frasi a direzione nulla ÷ tutti gli archi di quel tipo. Basata sugli abstract, quindi i nulli riportati solo nel testo completo sfuggono; bias di misura e di pubblicazione si mescolano.", "Part nulle = phrases de sens nul ÷ toutes les arêtes de ce type. Fondée sur les résumés : les nuls rapportés seulement dans le texte intégral manquent ; biais de mesure et de publication se mêlent."]},
  key: ({x}) => !x ? null : ({eli10: [`세균–병 보고 중 '차이 없음'은 ${pf(x.null_share)}뿐이라, 실제보다 의견이 더 잘 맞아 보일 수 있어요.`, `Only ${pf(x.null_share)} of germ–illness reports say 'no difference', so agreement may look bigger than it really is.`, `Solo ${itP(pf(x.null_share))} dei resoconti germe–malattia dice “nessuna differenza”: l'accordo può sembrare più grande di quanto sia.`, `Seuls ${pf(x.null_share)} des comptes rendus microbe–maladie disent « aucune différence » : l'accord peut sembler plus grand qu'il ne l'est.`],
    eli20: [`미생물–질병 연관 문장 중 '차이 없음'은 ${pf(x.null_share)}(${fmt(x.null)}/${fmt(x.edges)})뿐입니다. 합의가 과대평가될 수 있습니다.`, `Only ${pf(x.null_share)} of microbe–condition association sentences report 'no difference' (${fmt(x.null)}/${fmt(x.edges)}), so agreement may be overstated.`, `Solo ${itP(pf(x.null_share))} delle frasi di associazione microbo–patologia riporta “nessuna differenza” (${fmt(x.null)}/${fmt(x.edges)}): il consenso può essere sovrastimato.`, `Seules ${pf(x.null_share)} des phrases d'association microbe–pathologie rapportent « aucune différence » (${fmt(x.null)}/${fmt(x.edges)}) : le consensus peut être surestimé.`]})},
i_pbd: {
  what: {eli10: ["병마다 '차이 없음' 보고가 얼마나 되는지 비교해요.", "Compares how often each illness gets 'no difference' reports.", "Confronta quanto spesso ogni malattia riceve resoconti “nessuna differenza”.", "Compare la fréquence des « aucune différence » pour chaque maladie."],
    eli20: ["간선이 충분한 질병별 무효 결과 비율입니다.", "Null-result share per condition, for conditions with enough edges.", "Quota di risultati nulli per patologia, per le patologie con abbastanza archi.", "Part de résultats nuls par pathologie, pour les pathologies avec assez d'arêtes."]},
  how: ({min}) => ({eli10: ["막대가 짧거나 없으면 '차이 없음' 보고가 거의 없는 병이에요. 숫자는 전체 보고 수예요.", "A short or missing bar means almost no 'no difference' reports. The number counts all reports.", "Una barra corta o assente vuol dire quasi nessun resoconto “nessuna differenza”. Il numero conta tutti i resoconti.", "Une barre courte ou absente veut dire presque aucun « aucune différence ». Le nombre compte tous les comptes rendus."],
    eli20: ["막대 = 무효 비율 · 숫자 = 미생물–질병 간선 수 · 간선이 많은 질병 순", "Bar = null share · label = microbe–condition edges · conditions with most edges first", "Barra = quota nulla · etichetta = archi microbo–patologia · prima le patologie con più archi", "Barre = part nulle · étiquette = arêtes microbe–pathologie · d'abord les pathologies avec le plus d'arêtes"],
    pro: [`간선 ≥${min}인 질병만, 상위 30개. 간선이 많은 질병에서도 무효가 0건이면 표본 크기보다 초록 보고 관행의 영향일 가능성이 큽니다.`, `Conditions with ≥${min} edges only, top 30. Zero nulls in conditions with many edges point to abstract reporting habits rather than small samples.`, `Solo patologie con ≥${min} archi, prime 30. Zero nulli in patologie con molti archi indicano abitudini di scrittura degli abstract più che campioni piccoli.`, `Pathologies avec ≥${min} arêtes seulement, 30 premières. Zéro nul dans des pathologies riches en arêtes indique des habitudes de rédaction des résumés plutôt que de petits échantillons.`]}),
  key: ({n, z, D, p}) => !n ? null : ({eli10: [`${n}개 병 중 ${z}개는 '차이 없음' 보고가 하나도 없어요.`, `${z} of ${n} illnesses have no 'no difference' reports at all.`, `${z} malattie su ${n} non hanno nessun resoconto “nessuna differenza”.`, `${z} maladies sur ${n} n'ont aucun compte rendu « aucune différence ».`],
    eli20: [`${n}개 질병 중 ${z}개는 무효 보고가 0건이고, 가장 높은 ${esc(D)}도 ${pf(p)}입니다.`, `${z} of ${n} conditions have zero null reports; even the highest, ${en_(D)}, is ${pf(p)}.`, `${z} patologie su ${n} non hanno risultati nulli; anche la più alta, ${en_(D)}, arriva solo ${itPrep("a", pf(p))}.`, `${z} pathologies sur ${n} n'ont aucun résultat nul ; même la plus haute, ${en_(D)}, n'atteint que ${pf(p)}.`]})},
i_tgtab: {
  what: {eli10: ["쥐 같은 동물에서 본 결과가 사람에게서도 똑같이 나왔는지 세어 본 표예요.", "A table counting whether results seen in animals like mice also showed up in people.", "Una tabella che conta se i risultati visti negli animali, come i topi, si sono visti anche nelle persone.", "Un tableau qui compte si les résultats vus chez des animaux comme la souris se retrouvent aussi chez l'humain."],
    eli20: ["동물 연구에서 본 개입→미생물 효과가 사람 연구에서도 같은 방향인지 개입별로 센 표입니다.", "Per intervention: whether intervention → microbe effects seen in animal studies point the same way in human studies.", "Per intervento: se gli effetti intervento → microbo visti negli studi animali vanno nella stessa direzione negli studi umani.", "Par intervention : si les effets intervention → microbe vus chez l'animal vont dans le même sens chez l'humain."]},
  how: () => { const t = Object.assign({animal_papers: 3, animal_ratio: 2, human_confirm_papers: 2}, thr("translation_gap", {}));
    return {eli10: ["초록 숫자는 사람에서도 같았어요, 빨간 숫자는 사람에서 반대였어요, 노란 숫자는 동물에서만 봤어요.", "Green numbers: same in people. Red: opposite in people. Yellow: seen only in animals.", "Numeri verdi: uguale nelle persone. Rossi: opposto nelle persone. Gialli: visto solo negli animali.", "Nombres verts : pareil chez l'humain. Rouges : contraire chez l'humain. Jaunes : vu seulement chez l'animal."],
      eli20: ["열 = 사람에서 확인(청록) · 사람에서 반대(산호) · 동물만(노랑) · 사람 자료 부족 · 마지막 행 = 합계", "Columns = confirmed in humans (teal) · opposite in humans (coral) · animal only (amber) · too little human data · last row = total", "Colonne = confermato nell'uomo (verde acqua) · opposto nell'uomo (corallo) · solo animale (ambra) · dati umani insufficienti · ultima riga = totale", "Colonnes = confirmé chez l'humain (bleu-vert) · contraire chez l'humain (corail) · animal seulement (ambre) · trop peu de données humaines · dernière ligne = total"],
      pro: [`동물 ≥${t.animal_papers}편·비율 ≥${t.animal_ratio}, 사람 확인 ≥${t.human_confirm_papers}편 · 사람 = 제목과 문장에 동물·실험 모델이 없는 문장 · 주 편향: 사람/동물 판별이 단어 기반이라 일부 동물 연구가 사람 쪽에 섞일 수 있습니다.`, `Animal ≥${t.animal_papers} papers and ratio ≥${t.animal_ratio}; human confirmation ≥${t.human_confirm_papers} papers · human = no animal or laboratory model named in the title or sentence · main bias: host detection is word-based, so some animal studies may count as human.`, `Animali ≥${t.animal_papers} articoli e rapporto ≥${t.animal_ratio}; conferma umana ≥${t.human_confirm_papers} articoli · umano = nessun animale o modello di laboratorio nel titolo o nella frase · bias principale: l'ospite è riconosciuto da parole, quindi alcuni studi animali possono contare come umani.`, `Animal ≥${t.animal_papers} articles et rapport ≥${t.animal_ratio} ; confirmation humaine ≥${t.human_confirm_papers} articles · humain = aucun animal ni modèle de laboratoire dans le titre ou la phrase · biais principal : l'hôte est repéré par mots, certaines études animales peuvent donc compter comme humaines.`]}; },
  key: ({T}) => { if (!T) return null; const N = (T.confirmed || 0) + (T.discordant || 0) + (T.gap || 0) + (T.pending || 0); if (!N) return null; const c = fmt(T.confirmed), x = fmt(T.discordant);
    return {eli10: [`동물 결과 ${fmt(N)}개 중 ${c}개는 사람에서도 같았고, ${x}개는 반대였어요.`, `Of ${fmt(N)} animal results, ${c} held in people and ${x} went the other way.`, `Su ${fmt(N)} risultati negli animali, ${c} valevano anche nelle persone e ${x} andavano al contrario.`, `Sur ${fmt(N)} résultats chez l'animal, ${c} se retrouvent chez l'humain et ${x} vont dans l'autre sens.`],
      eli20: [`판정된 효과 ${fmt(N)}개 중 사람에서 확인 ${c}개(${pf(T.confirmed / N, 0)}), 반대 ${x}개, 동물만 ${fmt(T.gap)}개, 사람 자료 부족 ${fmt(T.pending)}개입니다.`, `Of ${fmt(N)} effects, ${c} are confirmed in humans (${pf(T.confirmed / N, 0)}), ${x} opposite, ${fmt(T.gap)} animal only, ${fmt(T.pending)} with too little human data.`, `Su ${fmt(N)} effetti, ${c} confermati nell'uomo (${pf(T.confirmed / N, 0)}), ${x} opposti, ${fmt(T.gap)} solo animali, ${fmt(T.pending)} con dati umani insufficienti.`, `Sur ${fmt(N)} effets, ${c} confirmés chez l'humain (${pf(T.confirmed / N, 0)}), ${x} contraires, ${fmt(T.gap)} animal seulement, ${fmt(T.pending)} avec trop peu de données humaines.`]}; }},
i_tglist: {
  what: {eli10: ["동물과 사람에서 결과가 다르거나, 동물에서만 본 경우의 목록이에요.", "A list of cases where animals and people disagree, or that were seen only in animals.", "Un elenco dei casi in cui animali e persone non concordano, o visti solo negli animali.", "Une liste des cas où animaux et humains ne concordent pas, ou vus seulement chez l'animal."],
    eli20: ["개입→미생물 효과별로 동물 논문 수와 사람 논문의 같은 방향/반대 방향 수입니다.", "For each intervention → microbe effect: animal papers and human papers in the same or opposite direction.", "Per ogni effetto intervento → microbo: articoli sugli animali e articoli sull'uomo nella stessa direzione o opposta.", "Pour chaque effet intervention → microbe : articles chez l'animal et articles chez l'humain dans le même sens ou le sens opposé."]},
  how: {eli10: ["버튼으로 종류를 골라요. 줄을 누르면 진짜 문장이 나와요.", "Pick a kind with the buttons. Click a row to read the real sentences.", "Scegli un tipo con i pulsanti. Clicca una riga per leggere le frasi vere.", "Choisis un type avec les boutons. Clique sur une ligne pour lire les vraies phrases."],
    eli20: ["버튼 = 판정(사람에서 반대 · 동물만 · 사람에서 확인) · 동물 = 방향과 논문 수(괄호 = 반대) · 사람 = 같은 방향/반대 · 행을 누르면 근거 문장(동물·사람 표시)", "Buttons = verdict (opposite in humans · animal only · confirmed) · animal = direction and papers (opposite in brackets) · human = same/opposite · click a row for sentences tagged animal or human", "Pulsanti = esito (opposto nell'uomo · solo animale · confermato) · animale = direzione e articoli (opposti tra parentesi) · uomo = stessa/opposta · clicca una riga per le frasi marcate animale o uomo", "Boutons = verdict (contraire chez l'humain · animal seulement · confirmé) · animal = sens et articles (contraires entre parenthèses) · humain = même sens/contraire · cliquez sur une ligne pour les phrases marquées animal ou humain"],
    pro: ["사람 쪽 '반대'에는 투여 경로·용량·기간 차이가 섞여 있습니다. 항생제처럼 사람에서 여러 맥락으로 쓰이는 개입은 상황이 달라 반대가 곧 번역 실패는 아닙니다.", "Human 'opposite' mixes differences in route, dose and duration. Interventions used in many human settings (e.g. antibiotics) differ in context, so opposite does not equal translational failure.", "L'“opposto” umano mescola differenze di via, dose e durata. Interventi usati in molti contesti umani (es. antibiotici) differiscono per contesto: opposto non significa fallimento traslazionale.", "Le « contraire » humain mêle des différences de voie, de dose et de durée. Les interventions utilisées dans de nombreux contextes humains (p. ex. antibiotiques) diffèrent par le contexte : contraire n'égale pas échec translationnel."]},
  key: ({n, x}) => { if (!x) return null; const I = iv(x.intervention, x.intervention_label), t = ti(x.taxon), ar = arrow(x.animal_direction), a = fmt(x.animal_papers), s = fmt(x.human_same), o = fmt(x.human_opposite);
    return {eli10: [`예: ${esc(I)} → 세균 ${t}. 동물 보고서 ${a}개, 사람 보고서는 같은 쪽 ${s}개, 반대쪽 ${o}개예요.`, `Example: ${en_(I)} → the germ ${t}: ${a} animal reports; in people, ${s} the same way and ${o} the other way.`, `Esempio: ${en_(I)} → il germe ${t}: ${a} resoconti sugli animali; nelle persone ${s} nello stesso senso e ${o} al contrario.`, `Exemple : ${en_(I)} → le microbe ${t} : ${a} comptes rendus chez l'animal ; chez l'humain, ${s} dans le même sens et ${o} dans l'autre.`],
      eli20: [`이 목록 ${fmt(n)}건 중 사람 논문이 가장 많은 것은 ${esc(I)} ${ar} ${t}입니다: 동물 ${a}편, 사람 같은 방향 ${s} / 반대 ${o}.`, `${fmt(n)} entries; the one with most human papers is ${en_(I)} ${ar} ${t}: animal ${a}, human same ${s} / opposite ${o}.`, `${fmt(n)} voci; quella con più articoli sull'uomo è ${en_(I)} ${ar} ${t}: animali ${a}, uomo stessa ${s} / opposta ${o}.`, `${fmt(n)} entrées ; celle qui a le plus d'articles humains est ${en_(I)} ${ar} ${t} : animal ${a}, humain même sens ${s} / contraire ${o}.`]}; }},
i_rsy: {
  what: {eli10: ["과학자들이 세균 이름을 얼마나 자세히(종 이름까지) 쓰는지 해마다 보여 줘요.", "Year by year, how often scientists name germs in detail (down to the species).", "Anno per anno, quanto spesso gli scienziati nominano i germi in dettaglio (fino alla specie).", "Année après année, à quelle fréquence les scientifiques nomment les microbes en détail (jusqu'à l'espèce)."],
    eli20: ["연도별 미생물 관계 문장 중 종 이름을 쓴 비율과 균주 표기 비율입니다.", "Per year: share of microbe relation sentences naming a species, and naming a strain.", "Per anno: quota di frasi di relazione microbica che nominano una specie, e un ceppo.", "Par année : part des phrases de relation microbienne qui nomment une espèce, et une souche."]},
  how: {eli10: ["초록 선이 올라가면 더 자세히 이름을 쓴다는 뜻이에요. 점선은 가장 자세한 '균주' 이름이에요.", "A rising green line means more detailed names. The dashed line is the most detailed kind, the 'strain'.", "Una linea verde che sale vuol dire nomi più dettagliati. La linea tratteggiata è il tipo più dettagliato, il “ceppo”.", "Une courbe verte qui monte veut dire des noms plus précis. Le pointillé est le plus précis, la « souche »."],
    eli20: ["실선 = 종 이름 비율, 점선 = 균주 표기 비율 · 마우스를 올리면 그해 간선 수 · 속 수준 관계는 같은 속 안의 반대 효과를 가릴 수 있어 해상도가 중요합니다.", "Solid = species share, dashed = strain share · hover for that year's edges · genus-level relations can hide opposite effects within a genus, so resolution matters.", "Continua = quota specie, tratteggiata = quota ceppo · passa sopra per gli archi dell'anno · le relazioni a livello di genere possono nascondere effetti opposti nello stesso genere: la risoluzione conta.", "Plein = part espèce, pointillé = part souche · survolez pour les arêtes de l'année · les relations au niveau du genre peuvent masquer des effets opposés au sein d'un genre : la résolution compte."],
    pro: ["종 비율 = 종 순위 미생물 간선 ÷ 전체 미생물 간선. 균주 = 문장에 배양 기관 번호(DSM, ATCC 등)나 'strain X'가 있음. 간선이 적은 초기 연도는 비율이 흔들립니다.", "Species share = species-rank microbe edges ÷ all microbe edges. Strain = a culture-collection number (DSM, ATCC, …) or 'strain X' in the sentence. Early years with few edges are noisy.", "Quota specie = archi microbici di rango specie ÷ tutti gli archi microbici. Ceppo = numero di collezione (DSM, ATCC, …) o “strain X” nella frase. I primi anni con pochi archi sono instabili.", "Part espèce = arêtes microbiennes de rang espèce ÷ toutes les arêtes microbiennes. Souche = numéro de collection (DSM, ATCC, …) ou « strain X » dans la phrase. Les premières années, avec peu d'arêtes, sont bruitées."]},
  key: ({f, l}) => !f || !l ? null : ({eli10: [`종 이름까지 쓰는 비율이 ${f.year}년 ${pf(f.species_share, 0)}에서 ${l.year}년 ${pf(l.species_share, 0)}로 바뀌었어요.`, `Naming down to the species went from ${pf(f.species_share, 0)} in ${f.year} to ${pf(l.species_share, 0)} in ${l.year}.`, `I nomi fino alla specie sono passati ${itPrep("da", pf(f.species_share, 0))} nel ${f.year} ${itPrep("a", pf(l.species_share, 0))} nel ${l.year}.`, `Les noms jusqu'à l'espèce sont passés de ${pf(f.species_share, 0)} en ${f.year} à ${pf(l.species_share, 0)} en ${l.year}.`],
    eli20: [`종 수준 비율은 ${f.year}년 ${pf(f.species_share)} → ${l.year}년 ${pf(l.species_share)}입니다(${l.year}년 간선 ${fmt(l.edges)}개).${l.species_share < .5 ? " 대부분의 관계는 여전히 속 수준입니다." : ""}`, `Species share: ${pf(f.species_share)} in ${f.year} → ${pf(l.species_share)} in ${l.year} (${fmt(l.edges)} edges in ${l.year}).${l.species_share < .5 ? " Most relations are still at genus level." : ""}`, `Quota di specie: ${pf(f.species_share)} nel ${f.year} → ${pf(l.species_share)} nel ${l.year} (${fmt(l.edges)} archi nel ${l.year}).${l.species_share < .5 ? " La maggior parte delle relazioni è ancora a livello di genere." : ""}`, `Part d'espèce : ${pf(f.species_share)} en ${f.year} → ${pf(l.species_share)} en ${l.year} (${fmt(l.edges)} arêtes en ${l.year}).${l.species_share < .5 ? " La plupart des relations restent au niveau du genre." : ""}`]})},
i_rsd: {
  what: {eli10: ["병마다 세균 이름을 종까지 자세히 쓰는 비율이에요.", "For each illness, how often germs are named down to the species.", "Per ogni malattia, quanto spesso i germi sono nominati fino alla specie.", "Pour chaque maladie, à quelle fréquence les microbes sont nommés jusqu'à l'espèce."],
    eli20: ["질병별 미생물 간선 중 종 수준 비율(간선이 많은 질병 순)입니다.", "Species-level share of microbe edges per condition (conditions with most edges first).", "Quota a livello di specie degli archi microbici per patologia (prima quelle con più archi).", "Part au niveau de l'espèce des arêtes microbiennes par pathologie (d'abord celles avec le plus d'arêtes)."]},
  how: {eli10: ["막대가 길수록 더 자세히 이름을 써요.", "Longer bar = more detailed names.", "Barra più lunga = nomi più dettagliati.", "Barre plus longue = noms plus précis."],
    eli20: ["막대 = 종 수준 비율 · 마우스를 올리면 간선 수 · 감염 질환은 원인균을 종으로 쓰는 경향이 있어 높게 나옵니다.", "Bar = species-level share · hover for edges · infectious conditions tend to name the pathogen species and score high.", "Barra = quota a livello di specie · passa sopra per gli archi · le patologie infettive tendono a nominare la specie del patogeno e risultano alte.", "Barre = part au niveau de l'espèce · survolez pour les arêtes · les pathologies infectieuses nomment souvent l'espèce du pathogène et ressortent hautes."],
    pro: ["상위 25개 질병. 16S 앰플리콘 연구가 많은 분야는 기술적으로 속 수준에 머무르므로 낮은 비율이 곧 부주의를 뜻하지 않습니다.", "Top 25 conditions. Fields dominated by 16S amplicon studies are technically limited to genus level, so a low share is not carelessness.", "Prime 25 patologie. I campi dominati dagli studi ad ampliconi 16S sono tecnicamente limitati al genere: una quota bassa non è trascuratezza.", "25 premières pathologies. Les domaines dominés par les études d'amplicons 16S sont techniquement limités au genre : une part basse n'est pas de la négligence."]},
  key: ({hi, lo}) => !hi ? null : ({eli10: [`이름을 가장 자세히 쓰는 병은 ${esc(hi.D)} 쪽이에요 (${pf(hi.v, 0)}).`, `The illness with the most detailed names is ${en_(hi.D)} (${pf(hi.v, 0)}).`, `La malattia con i nomi più dettagliati: ${en_(hi.D)} (${pf(hi.v, 0)}).`, `La maladie aux noms les plus précis : ${en_(hi.D)} (${pf(hi.v, 0)}).`],
    eli20: [`가장 높은 질병은 ${esc(hi.D)}(${pf(hi.v, 0)}), 가장 낮은 질병은 ${esc(lo.D)}(${pf(lo.v, 0)})입니다.`, `Highest: ${en_(hi.D)} (${pf(hi.v, 0)}); lowest: ${en_(lo.D)} (${pf(lo.v, 0)}).`, `Più alta: ${en_(hi.D)} (${pf(hi.v, 0)}); più bassa: ${en_(lo.D)} (${pf(lo.v, 0)}).`, `La plus haute : ${en_(hi.D)} (${pf(hi.v, 0)}) ; la plus basse : ${en_(lo.D)} (${pf(lo.v, 0)}).`]})},
/* --- insight lab: evidence to clinic --- */
i_tq: {
  what: {eli10: ["병마다 '과학 보고서의 근거'와 '병원에서 하는 시험'이 얼마나 많은지 한 장에 놓았어요.", "Each illness placed by how much science evidence it has and how many hospital trials are running.", "Ogni malattia messa in base a quante prove scientifiche ha e a quante sperimentazioni in ospedale sono in corso.", "Chaque maladie placée selon ses preuves scientifiques et le nombre d'essais à l'hôpital."],
    eli20: ["질병마다 문헌 근거의 강도(가로)와 등록된 임상시험 활동(세로)을 비교한 사분면입니다.", "A quadrant comparing, per condition, the strength of literature evidence (x) with registered clinical-trial activity (y).", "Un quadrante che confronta, per patologia, la forza delle evidenze in letteratura (x) con l'attività di sperimentazione clinica registrata (y).", "Un quadrant qui compare, par pathologie, la force des preuves de la littérature (x) et l'activité d'essais cliniques enregistrés (y)."]},
  how: ({cx, cy}) => { const mn = Object.assign({min_evidence_high: 2, min_activity_high: 3}, thr("trials", {}));
    return {eli10: ["오른쪽일수록 근거가 많고, 위쪽일수록 시험이 많아요. 오른쪽 아래(연두색)는 '근거는 많은데 시험은 적은' 곳이라 새로 시험해 볼 기회일 수 있어요.", "Further right = more evidence; higher = more trials. Bottom right (lime) means 'lots of evidence, few trials', which could be a chance to test something new.", "Più a destra = più prove; più in alto = più sperimentazioni. In basso a destra (verde lime) vuol dire “tante prove, poche sperimentazioni”: potrebbe essere l'occasione di provare qualcosa di nuovo.", "Plus à droite = plus de preuves ; plus haut = plus d'essais. En bas à droite (vert citron) : « beaucoup de preuves, peu d'essais », peut-être une occasion de tester du nouveau."],
      eli20: ["가로 = 근거 점수, 세로 = 시험 활동 · 점선 = 기준선 · 오른쪽 아래 기회, 오른쪽 위 경쟁 과열, 왼쪽 위 근거 약함, 왼쪽 아래 초기 · 점 크기 ∝ 둘의 합 · 마우스를 올리면 구성 수치", "x = evidence score, y = trial activity · dashed lines = cut-offs · bottom right opportunity, top right crowded, top left speculative, bottom left early · dot size ∝ their sum · hover for the components", "x = punteggio di evidenza, y = attività di sperimentazione · linee tratteggiate = soglie · in basso a destra opportunità, in alto a destra affollato, in alto a sinistra speculativo, in basso a sinistra iniziale · dimensione ∝ somma · passa sopra per i componenti", "x = score de preuve, y = activité d'essais · pointillés = seuils · en bas à droite opportunité, en haut à droite encombré, en haut à gauche spéculatif, en bas à gauche précoce · taille ∝ somme · survolez pour le détail"],
      pro: [`근거 = 독립 재현 합의 쌍 + 되돌리기 후보(논쟁 쌍이 그보다 많으면 '강함'에서 제외) · 시험 활동 = 진행·완료 시험 가중합(1상·해당 없음 1, 2상 2, 3·4상 3) · 기준선 = max(최소값, 0이 아닌 값의 중앙값): 근거 ${cx ?? "—"}, 활동 ${cy ?? "—"} (최소 ${mn.min_evidence_high}, ${mn.min_activity_high}) · 주 편향: ClinicalTrials.gov 등록 시험만 보며 질병 대응은 키워드 기반입니다.`,
        `Evidence = replicated consensus pairs + reversal candidates (more contested pairs than that excludes 'strong') · trial activity = active + completed trials weighted (phase 1/NA 1, phase 2 = 2, phase 3/4 = 3) · cut-offs = max(minimum, median of non-zero values): evidence ${cx ?? "—"}, activity ${cy ?? "—"} (minimum ${mn.min_evidence_high}, ${mn.min_activity_high}) · main bias: only ClinicalTrials.gov registrations, condition mapping by keyword.`,
        `Evidenza = coppie di consenso replicate + candidati all'inversione (se le coppie contese sono di più, esclusa da “forte”) · attività = sperimentazioni in corso e completate pesate (fase 1/NA 1, fase 2 = 2, fase 3/4 = 3) · soglie = max(minimo, mediana dei valori non nulli): evidenza ${cx ?? "—"}, attività ${cy ?? "—"} (minimo ${mn.min_evidence_high}, ${mn.min_activity_high}) · bias principale: solo registrazioni ClinicalTrials.gov, patologie associate per parole chiave.`,
        `Preuve = paires de consensus répliquées + candidats d'inversion (exclue de « fort » si les paires contestées sont plus nombreuses) · activité = essais en cours et terminés pondérés (phase 1/NA 1, phase 2 = 2, phase 3/4 = 3) · seuils = max(minimum, médiane des valeurs non nulles) : preuve ${cx ?? "—"}, activité ${cy ?? "—"} (minimum ${mn.min_evidence_high}, ${mn.min_activity_high}) · biais principal : seulement les enregistrements ClinicalTrials.gov, pathologies associées par mots-clés.`]}; },
  key: ({opp, c, s}) => { if (!opp) return null;
    if (!opp.length) return {eli10: ["지금은 '근거는 많은데 시험은 적은' 병이 없어요.", "Right now no illness has lots of evidence but few trials.", "Per ora nessuna malattia ha tante prove ma poche sperimentazioni.", "Pour l'instant, aucune maladie n'a beaucoup de preuves et peu d'essais."],
      eli20: [`'기회' 사분면에 든 질병은 없습니다. 경쟁 과열 ${c}개, 근거 약함 ${s}개입니다.`, `No condition is in the opportunity quadrant. ${c} are crowded and ${s} speculative.`, `Nessuna patologia è nel quadrante opportunità. ${c} sono affollate e ${s} speculative.`, `Aucune pathologie dans le quadrant opportunité. ${c} sont encombrées et ${s} spéculatives.`]};
    const ko = opp.map(esc), last = opp[opp.length - 1], L = opp.map(en_);
    return {eli10: [`${ko.join(", ")}${jp(last, "은", "는")} 근거는 많은데 시험이 적어서, 새로 시험해 볼 기회일 수 있어요.`, `${cap(andJ(L))} ${opp.length > 1 ? "have" : "has"} lots of evidence but few trials, so ${opp.length > 1 ? "they" : "it"} may be a chance to test something new.`, `${cap(andJ(L))} ${opp.length > 1 ? "hanno" : "ha"} molte prove ma poche sperimentazioni: ${opp.length > 1 ? "potrebbero essere occasioni" : "potrebbe essere un'occasione"} per provare qualcosa di nuovo.`, `${cap(andJ(L))} ${opp.length > 1 ? "ont" : "a"} beaucoup de preuves mais peu d'essais : c'est peut-être une occasion de tester du nouveau.`],
      eli20: [`기회 사분면(근거는 기준 이상, 시험 활동은 기준 미만): ${ko.join(", ")}. 경쟁 과열 ${c}개, 근거 약함 ${s}개입니다.`, `Opportunity quadrant (evidence above the cut-off, trial activity below): ${andJ(L)}. ${c} conditions are crowded and ${s} speculative.`, `Quadrante opportunità (evidenza sopra la soglia, attività sotto): ${andJ(L)}. ${c} patologie sono affollate e ${s} speculative.`, `Quadrant opportunité (preuves au-dessus du seuil, activité en dessous) : ${andJ(L)}. ${c} pathologies sont encombrées et ${s} spéculatives.`]}; }},
i_tph: {
  what: {eli10: ["병마다 병원 시험이 몇 개이고, 얼마나 진행됐는지 보여 주는 막대예요.", "Bars showing how many hospital trials each illness has and how far along they are.", "Barre che mostrano quante sperimentazioni ha ogni malattia e a che punto sono.", "Des barres qui montrent combien d'essais a chaque maladie et où ils en sont."],
    eli20: ["등록 시험 수 상위 질병의 시험을 임상 단계별로 쌓은 막대입니다.", "Registered trials for the conditions with most trials, stacked by phase.", "Sperimentazioni registrate per le patologie con più studi, impilate per fase.", "Essais enregistrés pour les pathologies qui en comptent le plus, empilés par phase."]},
  how: {eli10: ["막대가 길수록 시험이 많아요. 초록 부분은 마지막 단계(3·4상)라 실제로 쓰이기에 가장 가까운 시험이에요.", "Longer bar = more trials. The green part is the last stage (phase 3–4), the closest to real use.", "Barra più lunga = più sperimentazioni. La parte verde è l'ultima fase (3–4), la più vicina all'uso reale.", "Barre plus longue = plus d'essais. La partie verte est la dernière étape (phase 3–4), la plus proche d'un vrai usage."],
    eli20: ["색 = 단계(청록 3·4상, 노랑 2상, 하늘 1상, 회색 해당 없음) · '해당 없음'에는 식이·보충제처럼 단계 구분이 없는 시험이 많습니다.", "Colour = phase (teal 3–4, amber 2, sky 1, grey not applicable) · 'not applicable' is mostly diet or supplement studies without phases.", "Colore = fase (verde acqua 3–4, ambra 2, azzurro 1, grigio non applicabile) · “non applicabile” sono per lo più studi su dieta o integratori senza fasi.", "Couleur = phase (bleu-vert 3–4, ambre 2, bleu ciel 1, gris sans objet) · « sans objet » regroupe surtout des études d'alimentation ou de compléments sans phase."],
    pro: ["상위 18개 질병, 모든 상태(진행·완료·기타) 포함. 질병 대응은 조건·제목 키워드 기반이며 한 시험이 여러 질병에 들어갈 수 있습니다.", "Top 18 conditions, all statuses (active, completed, other). Condition mapping uses condition and title keywords; one trial can count for several conditions.", "Prime 18 patologie, tutti gli stati (in corso, completati, altri). L'associazione usa parole chiave di condizione e titolo; una sperimentazione può contare per più patologie.", "18 premières pathologies, tous statuts (en cours, terminés, autres). L'association utilise des mots-clés de condition et de titre ; un essai peut compter pour plusieurs pathologies."]},
  key: ({D, n, l, na}) => !D ? null : ({eli10: [`시험이 가장 많은 병은 ${esc(D)}, ${fmt(n)}개예요.`, `The illness with the most trials is ${en_(D)} (${fmt(n)}).`, `La malattia con più sperimentazioni: ${en_(D)} (${fmt(n)}).`, `La maladie avec le plus d'essais : ${en_(D)} (${fmt(n)}).`],
    eli20: [`${esc(D)}의 시험이 ${fmt(n)}건으로 가장 많고, 그중 3·4상은 ${fmt(l)}건입니다. 표시된 시험의 ${pf(na, 0)}는 단계가 '해당 없음'입니다.`, `${cap(en_(D))} has the most trials (${fmt(n)}), ${fmt(l)} of them phase 3–4. ${pf(na, 0)} of the trials shown have no phase.`, `Più sperimentazioni: ${en_(D)} (${fmt(n)}), di cui ${fmt(l)} di fase 3–4. ${cap(itP(pf(na, 0)))} delle sperimentazioni mostrate non ha fase.`, `Le plus d'essais : ${en_(D)} (${fmt(n)}), dont ${fmt(l)} en phase 3–4. ${pf(na, 0)} des essais affichés n'ont pas de phase.`]})},
i_tlist: {
  what: {eli10: ["가장 최근에 등록된 병원 시험 목록이에요.", "The newest hospital trials that were registered.", "Le sperimentazioni registrate più di recente.", "Les essais enregistrés le plus récemment."],
    eli20: ["ClinicalTrials.gov에 등록된 마이크로바이옴 임상시험 중 시작일이 가장 최근인 25개입니다.", "The 25 most recently started microbiome trials registered on ClinicalTrials.gov.", "Le 25 sperimentazioni sul microbioma registrate su ClinicalTrials.gov iniziate più di recente.", "Les 25 essais sur le microbiome enregistrés sur ClinicalTrials.gov ayant commencé le plus récemment."]},
  how: {eli10: ["병을 골라 볼 수 있어요. NCT 번호를 누르면 시험 페이지가 열려요.", "You can pick an illness. Click an NCT number to open the trial page.", "Puoi scegliere una malattia. Clicca un numero NCT per aprire la pagina della sperimentazione.", "Tu peux choisir une maladie. Clique sur un numéro NCT pour ouvrir la page de l'essai."],
    eli20: ["선택 상자 = 질병 필터(괄호 = 시험 수) · NCT = 등록 번호 링크 · 칩 = 질병과 개입 종류 · 질병을 고르면 진행·완료 수와 주요 의뢰자도 나옵니다.", "Select = condition filter (trials in brackets) · NCT = registry link · chips = condition and intervention type · picking a condition also shows active/completed counts and top sponsors.", "Selezione = filtro per patologia (sperimentazioni tra parentesi) · NCT = link al registro · etichette = patologia e tipo di intervento · scegliendo una patologia compaiono anche in corso/completati e promotori principali.", "Liste = filtre par pathologie (essais entre parenthèses) · NCT = lien vers le registre · étiquettes = pathologie et type d'intervention · choisir une pathologie affiche aussi en cours/terminés et principaux promoteurs."],
    pro: ["질병별 최신 시험 목록을 합쳐 NCT 중복을 없애고 시작일 순으로 정렬합니다. 등록 정보는 의뢰자가 쓴 것이며 결과나 효과를 뜻하지 않습니다.", "Per-condition latest lists merged, NCT duplicates removed, sorted by start date. Registry entries are sponsor-written and say nothing about results or efficacy.", "Elenchi recenti per patologia uniti, duplicati NCT rimossi, ordinati per data di inizio. Le voci del registro sono scritte dal promotore e non dicono nulla su risultati o efficacia.", "Listes récentes par pathologie fusionnées, doublons NCT retirés, tri par date de début. Les fiches du registre sont rédigées par le promoteur et ne disent rien des résultats ou de l'efficacité."]},
  key: ({n, r, date}) => !n ? null : ({eli10: [`여기 시험 ${n}개 중 ${r}개는 지금 참가자를 모으고 있어요.`, `${r} of the ${n} trials here are looking for volunteers right now.`, `${r} delle ${n} sperimentazioni qui cercano volontari adesso.`, `${r} des ${n} essais ici cherchent des volontaires en ce moment.`],
    eli20: [`표시된 ${n}건 중 모집 중 ${r}건이며, 가장 늦은 시작일은 ${date}입니다(예정일 포함).`, `${n} trials shown, ${r} recruiting; the latest start date is ${date} (planned dates included).`, `${n} sperimentazioni mostrate, ${r} in reclutamento; la data di inizio più tarda è ${date} (date previste incluse).`, `${n} essais affichés, ${r} en recrutement ; la date de début la plus tardive est ${date} (dates prévues comprises).`]})},
i_prod: {
  what: {eli10: ["나라의 허가 심사를 거친 세균 치료 제품이에요.", "Germ-based products that went through a government approval review.", "Prodotti a base di germi che sono passati per la valutazione delle autorità.", "Des produits à base de microbes qui sont passés par l'examen des autorités."],
    eli20: ["규제 심사(승인 또는 거부)를 거친 마이크로바이옴 제품입니다. 사람이 출처를 확인한 항목만 싣습니다.", "Microbiome products that went through regulatory review (approved or refused); only entries whose sources a person checked.", "Prodotti per il microbioma passati per una valutazione regolatoria (approvati o respinti); solo voci con fonti verificate da una persona.", "Produits microbiome passés par un examen réglementaire (approuvés ou refusés) ; seulement les entrées dont une personne a vérifié les sources."]},
  how: {eli10: ["초록 표시는 허가됨, 빨간 표시는 거절됨이에요. 아래 링크로 출처를 볼 수 있어요.", "A green tag means approved, red means refused. The links at the bottom show the sources.", "Un'etichetta verde vuol dire approvato, rossa respinto. I link in basso mostrano le fonti.", "Une étiquette verte veut dire approuvé, rouge refusé. Les liens en bas montrent les sources."],
    eli20: ["배지 = 규제 상태 · 칩 = 대상 질병(합의 관계 수, 괄호 = 독립 재현)과 적응증 · 아래 = 날짜와 출처 링크", "Badge = regulatory status · chips = target condition (consensus relations, replicated in brackets) and indication · bottom = date and source links", "Badge = stato regolatorio · etichette = patologia bersaglio (relazioni di consenso, replicate tra parentesi) e indicazione · in basso = data e link alle fonti", "Badge = statut réglementaire · étiquettes = pathologie cible (relations de consensus, répliquées entre parenthèses) et indication · en bas = date et liens vers les sources"],
    pro: ["산업 기록은 config/msage-industry.json에 손으로 정리한 항목이며 verified가 false인 항목은 뺍니다. 완전한 목록이 아닙니다.", "Industry entries are hand-curated (config/msage-industry.json); entries with verified = false are dropped. Not exhaustive.", "Le voci industriali sono curate a mano (config/msage-industry.json); quelle con verified = false sono escluse. Non esaustivo.", "Les entrées industrielles sont saisies à la main (config/msage-industry.json) ; celles avec verified = false sont retirées. Non exhaustif."]},
  key: ({a, r, x}) => !x ? null : ({eli10: [`허가된 제품 ${a}개, 거절된 제품 ${r}개예요.`, `${a} ${pl(a, "product was", "products were")} approved and ${r} refused.`, `${a} ${pl(a, "prodotto approvato", "prodotti approvati")} e ${r} ${pl(r, "respinto", "respinti")}.`, `${a} ${pl(a, "produit approuvé", "produits approuvés")} et ${r} ${pl(r, "refusé", "refusés")}.`],
    eli20: [`승인 ${a}건, 거부 ${r}건입니다. 가장 최근 항목은 ${esc(x.name)}, ${fd(x.date)}입니다.`, `${a} approved, ${r} refused; the latest is ${esc(x.name)}, ${fd(x.date)}.`, `${a} ${pl(a, "approvato", "approvati")}, ${r} ${pl(r, "respinto", "respinti")}; il più recente è ${esc(x.name)}, ${fd(x.date)}.`, `${a} ${pl(a, "approuvé", "approuvés")}, ${r} ${pl(r, "refusé", "refusés")} ; le plus récent est ${esc(x.name)}, ${fd(x.date)}.`]})},
i_pipe: {
  what: {eli10: ["아직 개발 중인 세균 치료 후보들이에요.", "Germ-based treatments still being developed.", "Cure a base di germi ancora in sviluppo.", "Des traitements à base de microbes encore en développement."],
    eli20: ["개발 중이거나 중단된 후보를 임상 단계 순으로 나열했습니다.", "Candidates in development or discontinued, ordered by clinical phase.", "Candidati in sviluppo o interrotti, in ordine di fase clinica.", "Candidats en développement ou arrêtés, classés par phase clinique."]},
  how: {eli10: ["위에 있을수록 개발이 많이 진행됐어요. 줄을 누르면 설명이 나와요.", "Higher up = further along. Click a row for the story.", "Più in alto = più avanti nello sviluppo. Clicca una riga per la descrizione.", "Plus haut = plus avancé. Clique sur une ligne pour la description."],
    eli20: ["정렬 = 3상 → 2상 → 1상 → 중단, 같은 단계는 최신 순 · 적응증 아래 칩 = 근거 쪽 합의 관계 수 · 행을 누르면 요약과 출처", "Order = phase 3 → 2 → 1 → discontinued, newest first within a phase · chip under the indication = consensus relations on the evidence side · click a row for summary and sources", "Ordine = fase 3 → 2 → 1 → interrotti, i più recenti prima · etichetta sotto l'indicazione = relazioni di consenso lato evidenze · clicca una riga per riassunto e fonti", "Ordre = phase 3 → 2 → 1 → arrêtés, du plus récent dans une phase · étiquette sous l'indication = relations de consensus côté preuves · cliquez sur une ligne pour le résumé et les sources"],
    pro: ["단계는 공개 발표 기준이며 날짜는 마지막으로 확인한 이정표입니다. 중단 사유는 대개 회사 발표뿐이라 과학적 실패와 사업적 결정을 구분하기 어렵습니다.", "Phase follows public announcements; the date is the last verified milestone. Discontinuation reasons usually come from company statements, so scientific and business failure are hard to separate.", "La fase segue gli annunci pubblici; la data è l'ultima tappa verificata. I motivi di interruzione vengono di solito da comunicati aziendali: è difficile separare fallimento scientifico e decisione commerciale.", "La phase suit les annonces publiques ; la date est le dernier jalon vérifié. Les raisons d'arrêt viennent surtout des communiqués : échec scientifique et décision commerciale sont difficiles à distinguer."]},
  key: ({n, p3, p2, p1, d}) => !n ? null : ({eli10: [`후보 ${n}개 중 ${p3}개가 마지막 큰 시험 단계(3상)까지 왔어요.`, `Of ${n} candidates, ${p3} ${pl(p3, "has", "have")} reached the last big trial stage (phase 3).`, `Su ${n} candidati, ${p3} ${pl(p3, "è arrivato", "sono arrivati")} all'ultima grande fase di sperimentazione (fase 3).`, `Sur ${n} candidats, ${p3} ${pl(p3, "a", "ont")} atteint la dernière grande étape d'essai (phase 3).`],
    eli20: [`3상 ${p3}, 2상 ${p2}, 1상 ${p1}, 중단 ${d}건입니다.`, `Phase 3: ${p3}, phase 2: ${p2}, phase 1: ${p1}, discontinued: ${d}.`, `Fase 3: ${p3}, fase 2: ${p2}, fase 1: ${p1}, interrotti: ${d}.`, `Phase 3 : ${p3}, phase 2 : ${p2}, phase 1 : ${p1}, arrêtés : ${d}.`]})},
i_tl: {
  what: {eli10: ["세균 치료 분야에서 일어난 일들을 최신 순으로 늘어놓았어요.", "Things that happened in germ-based medicine, newest first.", "Cose successe nella medicina a base di germi, dalla più recente.", "Ce qui s'est passé dans la médecine à base de microbes, du plus récent au plus ancien."],
    eli20: ["승인, 임상 결과 발표, 거래, 폐업, 투자 유치를 날짜순으로 모은 타임라인입니다.", "A dated timeline of approvals, readouts, deals, closures and financings.", "Una cronologia datata di approvazioni, risultati, accordi, chiusure e finanziamenti.", "Une chronologie datée des approbations, résultats, accords, fermetures et financements."]},
  how: {eli10: ["점 색이 일의 종류예요: 초록은 허가, 빨강은 멈춤이나 문 닫음.", "The dot colour is the kind of event: green for approvals, red for stops or closures.", "Il colore del punto è il tipo di evento: verde per le approvazioni, rosso per stop o chiusure.", "La couleur du point indique le type : vert pour les approbations, rouge pour les arrêts ou fermetures."],
    eli20: ["점 색 = 종류(청록 승인, 보라 결과 발표, 노랑 거래, 연두 투자, 하늘 회사·개발 단계, 산호 거부·중단·폐업) · 각 항목 아래 출처 링크", "Dot colour = kind (teal approval, violet readout, amber deal, lime financing, sky company or milestone, coral refusal, discontinuation or closure) · source links under each item", "Colore del punto = tipo (verde acqua approvazione, viola risultati, ambra accordo, lime finanziamento, azzurro azienda o tappa, corallo rifiuto, interruzione o chiusura) · link alle fonti sotto ogni voce", "Couleur du point = type (bleu-vert approbation, violet résultats, ambre accord, citron financement, bleu ciel entreprise ou jalon, corail refus, arrêt ou fermeture) · liens vers les sources sous chaque élément"],
    pro: ["출처는 회사 발표, 규제 기관 문서, 언론 기사입니다. 금액과 결과 수치는 발표 그대로이며 독립 검증하지 않았습니다.", "Sources are company releases, regulator documents and press. Amounts and results are as announced, not independently verified.", "Le fonti sono comunicati aziendali, documenti delle autorità e stampa. Importi e risultati sono come annunciati, non verificati in modo indipendente.", "Les sources sont des communiqués, des documents d'autorités et la presse. Montants et résultats sont tels qu'annoncés, sans vérification indépendante."]},
  key: ({n, e, kind}) => !e ? null : ({eli10: [`가장 최근 소식은 ${fd(e.date)}의 ${esc(e.name)} 이야기예요.`, `The newest event is about ${esc(e.name)} (${fd(e.date)}).`, `L'evento più recente riguarda ${esc(e.name)} (${fd(e.date)}).`, `L'événement le plus récent concerne ${esc(e.name)} (${fd(e.date)}).`],
    eli20: [`항목 ${n}개 중 가장 최근은 ${fd(e.date)} ${esc(e.name)}(${esc(kind)})입니다.`, `${n} events; the latest is ${esc(e.name)} (${esc(lc(kind))}, ${fd(e.date)}).`, `${n} eventi; il più recente è ${esc(e.name)} (${esc(lc(kind))}, ${fd(e.date)}).`, `${n} événements ; le plus récent est ${esc(e.name)} (${esc(lc(kind))}, ${fd(e.date)}).`]})},
i_comp: {
  what: {eli10: ["세균 치료를 만드는 회사들이에요. 문을 닫은 회사에서는 배울 점이 있어요.", "Companies making germ-based treatments. The ones that closed leave lessons.", "Aziende che creano cure a base di germi. Quelle che hanno chiuso lasciano delle lezioni.", "Des entreprises qui font des traitements à base de microbes. Celles qui ont fermé laissent des leçons."],
    eli20: ["활동 중인 회사와 폐업한 회사의 기록입니다. 폐업 카드의 글은 교훈 요약입니다.", "Records of active and closed companies; the text on closed companies summarises the lesson.", "Schede di aziende attive e chiuse; il testo sulle aziende chiuse riassume la lezione.", "Fiches d'entreprises actives et fermées ; le texte des entreprises fermées résume la leçon."]},
  how: {eli10: ["붉은빛 카드는 문을 닫은 회사예요. 거기 적힌 '교훈'을 읽어 보세요.", "Reddish cards are companies that closed. Read their 'Lesson'.", "Le schede rossastre sono aziende che hanno chiuso. Leggi la loro “Lezione”.", "Les cartes rougeâtres sont des entreprises qui ont fermé. Lis leur « Leçon »."],
    eli20: ["활동 중인 회사가 먼저, 폐업 회사(붉은 배경)가 뒤에 · 배지 = 상태 · 칩 = 주력 질병", "Active companies first, closed ones (reddish background) after · badge = status · chips = main condition", "Prima le aziende attive, poi quelle chiuse (sfondo rossastro) · badge = stato · etichette = patologia principale", "D'abord les entreprises actives, puis les fermées (fond rougeâtre) · badge = statut · étiquettes = pathologie principale"],
    pro: ["교훈은 공개 자료에 근거한 정리자의 해석입니다. 폐업 원인은 대개 여러 요인(자금, 임상 결과, 제조)이 겹칩니다.", "Lessons are the curator's reading of public sources; closures usually have several overlapping causes (funding, trial results, manufacturing).", "Le lezioni sono la lettura del curatore delle fonti pubbliche; le chiusure hanno di solito più cause sovrapposte (finanziamento, risultati clinici, produzione).", "Les leçons sont la lecture des sources publiques par la personne qui tient le registre ; les fermetures ont souvent plusieurs causes mêlées (financement, résultats cliniques, fabrication)."]},
  key: ({n, a, c, q}) => !n ? null : ({eli10: [`회사 ${n}곳 중 ${c}곳이 문을 닫았어요.`, `Of ${n} companies, ${c} have closed.`, `Su ${n} aziende, ${c} hanno chiuso.`, `Sur ${n} entreprises, ${c} ont fermé.`],
    eli20: [`회사 ${n}곳: 활동 중 ${a}, 폐업 ${c}, 인수·라이선스 ${q}입니다.`, `${n} companies: ${a} active, ${c} closed, ${q} acquired or licensed.`, `${n} aziende: ${a} attive, ${c} chiuse, ${q} acquisite o in licenza.`, `${n} entreprises : ${a} actives, ${c} fermées, ${q} rachetées ou sous licence.`]})},
/* --- insight lab: severity, risk, mechanisms --- */
i_sv: {
  what: {eli10: ["같은 병이라도 더 심한 사람에게서 많거나 적은 세균이에요.", "Germs that are more or less common in people who are sicker.", "Germi più o meno presenti nelle persone che stanno peggio.", "Des microbes plus ou moins présents chez les personnes plus malades."],
    eli20: ["더 나쁜 하위 집단(중증·무반응·재발·짧은 생존)에서 많거나 적다고 보고된 미생물입니다.", "Microbes reported higher or lower in the worse subgroup (severe, non-responder, relapse, shorter survival).", "Microbi riportati più alti o più bassi nel sottogruppo peggiore (grave, non responsivo, recidiva, sopravvivenza più breve).", "Microbes rapportés plus hauts ou plus bas dans le sous-groupe le plus défavorable (sévère, non-répondeur, rechute, survie plus courte)."]},
  how: () => { const t = Object.assign({papers: 3, ratio: 2}, thr("severity", {}));
    return {eli10: ["↑는 더 아플 때 많아지는 세균, ↓는 줄어드는 세균이에요. '근거 문장'을 펼치면 진짜 문장이 보여요.", "↑ means the germ is higher when people are sicker, ↓ lower. Open 'Evidence sentences' to read the real ones.", "↑ vuol dire che il germe è più alto quando si sta peggio, ↓ più basso. Apri “Frasi di evidenza” per leggere quelle vere.", "↑ veut dire que le microbe est plus haut quand on est plus malade, ↓ plus bas. Ouvre « Phrases de preuve » pour lire les vraies."],
      eli20: ["화살표 = 나쁜 쪽에서의 방향 · 회색 글씨 = 하위 집단 종류와 논문 수(반대 = 반대 방향 논문) · 펼치면 근거 문장", "Arrow = direction in the worse subgroup · grey text = subgroup kind and papers (opposite = papers pointing the other way) · expand for evidence", "Freccia = direzione nel sottogruppo peggiore · testo grigio = tipo di sottogruppo e articoli (opposti = nell'altra direzione) · espandi per le evidenze", "Flèche = sens dans le sous-groupe défavorable · texte gris = type de sous-groupe et articles (contraires = sens opposé) · dépliez pour les preuves"],
      pro: [`같은 방향 ≥${t.papers}편, 비율 ≥${t.ratio} · SUBGROUP 간선 중 어느 쪽이 나쁜지 판정된 것만 씁니다. 예후 연관이지 원인이 아니며, 중증 환자는 약물·입원 노출이 많아 교란될 수 있습니다.`, `≥${t.papers} papers in one direction, ratio ≥${t.ratio} · only SUBGROUP edges whose worse side was resolved. Prognostic association, not cause; sicker patients get more drugs and hospital exposure, a likely confounder.`, `≥${t.papers} articoli in una direzione, rapporto ≥${t.ratio} · solo archi SUBGROUP con il lato peggiore risolto. Associazione prognostica, non causa; i pazienti più gravi ricevono più farmaci e ricoveri, un probabile confondente.`, `≥${t.papers} articles dans un sens, rapport ≥${t.ratio} · seulement les arêtes SUBGROUP dont le côté défavorable a été déterminé. Association pronostique, pas cause ; les patients plus graves reçoivent plus de médicaments et d'hospitalisations, un facteur de confusion probable.`]}; },
  key: ({x, D, N}) => { if (!x) return null; const up = x.in_worse_subgroup !== "lower", t = ti(x.taxon);
    return {eli10: [`예: ${esc(D)}에서 더 심한 사람에게 세균 ${t}${jp(x.taxon, "이", "가")} 더 ${up ? "많아요" : "적어요"}.`, `Example: in ${en_(D)}, people who are sicker have ${up ? "more" : "less"} of the germ ${t}.`, `Esempio: con ${en_(D)}, nelle persone che stanno peggio il germe ${t} è ${up ? "più" : "meno"} presente.`, `Exemple : en cas ${fde(en_(D))}, chez les personnes plus malades, le microbe ${t} est ${up ? "plus" : "moins"} présent.`],
      eli20: [`근거가 가장 많은 항목: ${esc(D)}에서 ${t}${jp(x.taxon, "은", "는")} 나쁜 쪽에서 ${up ? "증가" : "감소"}합니다(논문 ${fmt(x.papers)}편, 반대 ${fmt(x.opposite || 0)}편). 전체 ${fmt(N)}개 항목입니다.`, `Best-supported: in ${en_(D)}, ${t} is ${up ? "higher" : "lower"} in the worse subgroup (${fmt(x.papers)} papers, ${fmt(x.opposite || 0)} opposite). ${fmt(N)} items in total.`, `Il più sostenuto: con ${en_(D)}, ${t} è ${up ? "più alto" : "più basso"} nel sottogruppo peggiore (${fmt(x.papers)} articoli, ${fmt(x.opposite || 0)} opposti). ${fmt(N)} voci in totale.`, `Le mieux étayé : en cas ${fde(en_(D))}, ${t} est ${up ? "plus haut" : "plus bas"} dans le sous-groupe défavorable (${fmt(x.papers)} articles, ${fmt(x.opposite || 0)} contraires). ${fmt(N)} éléments au total.`]}; }},
i_rk: {
  what: {eli10: ["병에 걸릴 위험이 높거나 낮은 것과 함께 나오는 세균이에요.", "Germs that go with a higher or lower chance of getting ill.", "Germi associati a una probabilità più alta o più bassa di ammalarsi.", "Des microbes associés à un risque plus ou moins grand de tomber malade."],
    eli20: ["발병 위험과의 연관(관찰 연구와 멘델 무작위분석)이 보고된 미생물입니다.", "Microbes with reported associations with disease risk (observational studies and Mendelian randomization).", "Microbi con associazioni riportate al rischio di malattia (studi osservazionali e randomizzazione mendeliana).", "Microbes avec des associations rapportées au risque de maladie (études observationnelles et randomisation mendélienne)."]},
  how: () => { const t = Object.assign({papers: 3, ratio: 2}, thr("risk", {}));
    return {eli10: ["초록 ↓는 위험이 낮아지는 쪽, 빨강 ↑는 높아지는 쪽이에요. '함께 나온다'는 뜻이지 원인이라는 뜻은 아니에요.", "Green ↓ goes with lower risk, red ↑ with higher risk. It means 'found together', not 'causes'.", "Il verde ↓ va con un rischio più basso, il rosso ↑ con uno più alto. Vuol dire “si trovano insieme”, non “causa”.", "Le vert ↓ va avec un risque plus bas, le rouge ↑ avec un risque plus haut. Ça veut dire « trouvés ensemble », pas « cause »."],
      eli20: ["화살표 = 위험 방향 · 회색 글씨 = 멘델 무작위분석 비율 또는 관찰 연관, 논문 수 · 펼치면 근거 문장", "Arrow = risk direction · grey text = Mendelian-randomization share or observational, and papers · expand for evidence", "Freccia = direzione del rischio · testo grigio = quota di randomizzazione mendeliana od osservazionale, e articoli · espandi per le evidenze", "Flèche = sens du risque · texte gris = part de randomisation mendélienne ou observationnel, et articles · dépliez pour les preuves"],
      pro: [`같은 방향 ≥${t.papers}편, 비율 ≥${t.ratio}, 문 수준 제외 · 멘델 무작위분석 비율은 문장의 단어로 판별합니다. 관찰 연관은 역인과와 교란에 취약합니다.`, `≥${t.papers} papers in one direction, ratio ≥${t.ratio}, phylum excluded · the Mendelian-randomization share is detected from sentence wording. Observational associations are prone to reverse causation and confounding.`, `≥${t.papers} articoli in una direzione, rapporto ≥${t.ratio}, phylum escluso · la quota di randomizzazione mendeliana è rilevata dalle parole della frase. Le associazioni osservazionali sono esposte a causalità inversa e confondimento.`, `≥${t.papers} articles dans un sens, rapport ≥${t.ratio}, phylum exclu · la part de randomisation mendélienne est repérée d'après la formulation. Les associations observationnelles sont exposées à la causalité inverse et à la confusion.`]}; },
  key: ({x, D, m}) => { if (!x) return null; const low = x.direction === "lower_risk", t = ti(x.taxon);
    return {eli10: [`예: 세균 ${t}${jp(x.taxon, "이", "가")} 많으면 ${esc(D)} 위험이 ${low ? "낮은" : "높은"} 편이에요.`, `Example: having more of the germ ${t} goes with a ${low ? "lower" : "higher"} risk of ${en_(D)}.`, `Esempio: avere più ${t} va insieme a un rischio ${low ? "più basso" : "più alto"} di ${en_(D)}.`, `Exemple : avoir plus de ${t} va de pair avec un risque ${low ? "plus faible" : "plus élevé"} ${fde(en_(D))}.`],
      eli20: [`근거가 가장 많은 항목: ${t} – ${esc(D)} 위험 ${low ? "낮음" : "높음"}(논문 ${fmt(x.papers)}편, 반대 ${fmt(x.opposite || 0)}편). 멘델 무작위분석 근거가 있는 항목은 ${fmt(m)}개입니다.`, `Best-supported: ${t} – ${low ? "lower" : "higher"} risk of ${en_(D)} (${fmt(x.papers)} papers, ${fmt(x.opposite || 0)} opposite). ${fmt(m)} items include Mendelian-randomization evidence.`, `Il più sostenuto: ${t} – rischio ${low ? "più basso" : "più alto"} di ${en_(D)} (${fmt(x.papers)} articoli, ${fmt(x.opposite || 0)} opposti). ${fmt(m)} voci includono evidenze da randomizzazione mendeliana.`, `Le mieux étayé : ${t} – risque ${low ? "plus faible" : "plus élevé"} ${fde(en_(D))} (${fmt(x.papers)} articles, ${fmt(x.opposite || 0)} contraires). ${fmt(m)} éléments comportent des preuves de randomisation mendélienne.`]}; }},
i_mt: {
  what: {eli10: ["세균, 병, 그리고 몸속 물질(예: 부티레이트)이 같은 보고서에 자주 함께 나오는 세 짝이에요.", "Threes of a germ, an illness and a body substance (like butyrate) that often appear in the same reports.", "Terne di germe, malattia e sostanza del corpo (come il butirrato) che compaiono spesso negli stessi resoconti.", "Des trios microbe, maladie et substance du corps (comme le butyrate) qui apparaissent souvent dans les mêmes comptes rendus."],
    eli20: ["합의 쌍마다, 그 질병 논문 전체보다 이 쌍의 논문에서 유난히 자주 언급되는 대사물질입니다.", "For each consensus pair, metabolites mentioned unusually often in that pair's papers compared with all papers on the condition.", "Per ogni coppia di consenso, i metaboliti citati insolitamente spesso negli articoli della coppia rispetto a tutti gli articoli sulla patologia.", "Pour chaque paire de consensus, les métabolites cités inhabituellement souvent dans ses articles par rapport à tous les articles sur la pathologie."]},
  how: () => { const t = Object.assign({pairs: 30, co_papers: 10, metabolite_papers: 5, lift: 1.5, per_pair: 3}, thr("mechanism", {}));
    return {eli10: ["보라 막대가 길수록 더 자주 함께 나와요. ×2는 보통보다 두 배라는 뜻이에요. 함께 나온다고 원인은 아니에요.", "A longer purple bar means they appear together more often. ×2 means twice as often as usual. Together does not mean cause.", "Una barra viola più lunga vuol dire che compaiono insieme più spesso. ×2 vuol dire il doppio del solito. Insieme non vuol dire causa.", "Une barre violette plus longue veut dire qu'ils apparaissent ensemble plus souvent. ×2 veut dire deux fois plus que d'habitude. Ensemble ne veut pas dire cause."],
      eli20: ["카드 = 미생물(화살표 = 질병에서 방향)과 질병 · 줄 = 대사물질, 막대·숫자 = 향상도 · 회색 = 논문 수와 쌍 안 비율 대 기준 비율 · 같은 초록에 함께 나왔을 뿐 측정된 경로가 아닙니다.", "Card = microbe (arrow = direction in the condition) and condition · row = metabolite, bar and number = lift · grey = papers and share within the pair vs baseline · co-mention only, not a measured pathway.", "Scheda = microbo (freccia = direzione nella patologia) e patologia · riga = metabolita, barra e numero = lift · grigio = articoli e quota nella coppia contro riferimento · solo co-menzione, non un percorso misurato.", "Carte = microbe (flèche = sens dans la pathologie) et pathologie · ligne = métabolite, barre et nombre = lift · gris = articles et part dans la paire contre référence · simple co-mention, pas une voie mesurée."],
      pro: [`향상도 = 쌍 안 비율 ÷ 같은 질병 논문 전체 비율 ≥${t.lift} · 합의 쌍 상위 ${t.pairs}개 중 공동 언급 ≥${t.co_papers}편, 대사물질 ≥${t.metabolite_papers}편, 쌍당 최대 ${t.per_pair}개 · 주 편향: 초록에서 함께 언급된 것이며 대사물질 측정이나 방향(생산/소비)을 뜻하지 않습니다.`, `Lift = share within the pair ÷ share among all papers on the condition, ≥${t.lift} · top ${t.pairs} consensus pairs with ≥${t.co_papers} co-mentioning papers, metabolite ≥${t.metabolite_papers} papers, at most ${t.per_pair} per pair · main bias: co-mention in abstracts, not a metabolite measurement or direction (production/consumption).`, `Lift = quota nella coppia ÷ quota in tutti gli articoli sulla patologia, ≥${t.lift} · prime ${t.pairs} coppie di consenso con ≥${t.co_papers} articoli di co-menzione, metabolita ≥${t.metabolite_papers} articoli, al massimo ${t.per_pair} per coppia · bias principale: co-menzione negli abstract, non una misura del metabolita né una direzione (produzione/consumo).`, `Lift = part dans la paire ÷ part parmi tous les articles sur la pathologie, ≥${t.lift} · ${t.pairs} premières paires de consensus avec ≥${t.co_papers} articles de co-mention, métabolite ≥${t.metabolite_papers} articles, au plus ${t.per_pair} par paire · biais principal : co-mention dans les résumés, pas une mesure du métabolite ni un sens (production/consommation).`]}; },
  key: ({x, m, D, M, N}) => { if (!x || !m) return null; const t = ti(x.taxon), g = n1(m.lift);
    return {eli10: [`가장 강한 짝: 세균 ${t}${jp(x.taxon, "과", "와")} ${esc(D)}에 대한 보고서에서 ${jo(esc(M), "이", "가")} 보통보다 ${g}배 자주 나와요.`, `Strongest: reports on the germ ${t} and ${en_(D)} mention ${en_(M)} ${g} times as often as usual.`, `Il legame più forte: nei resoconti sul germe ${t} e su ${en_(D)} si parla di ${en_(M)} ${g} volte più del solito.`, `Le lien le plus fort : dans les comptes rendus sur le microbe ${t} et ${en_(D)}, on parle ${fde(en_(M))} ${g} fois plus que d'habitude.`],
      eli20: [`가장 큰 향상도: ${t}–${esc(D)}의 ${esc(M)} ${xf(m.lift)}(${fmt(m.papers)}편, ${pf(m.share)} 대 ${pf(m.baseline_share)}). 기준을 넘은 삼각형은 ${fmt(N)}개입니다.`, `Highest lift: ${en_(M)} for ${t}–${en_(D)}, ${xf(m.lift)} (${fmt(m.papers)} papers, ${pf(m.share)} vs ${pf(m.baseline_share)}). ${fmt(N)} triangles pass the thresholds.`, `Lift più alto: ${en_(M)} per ${t}–${en_(D)}, ${xf(m.lift)} (${fmt(m.papers)} articoli, ${pf(m.share)} contro ${pf(m.baseline_share)}). ${fmt(N)} triangoli superano le soglie.`, `Lift le plus élevé : ${en_(M)} pour ${t}–${en_(D)}, ${xf(m.lift)} (${fmt(m.papers)} articles, ${pf(m.share)} contre ${pf(m.baseline_share)}). ${fmt(N)} triangles franchissent les seuils.`]}; }}
};

/* 1. reversal candidates */
function irev(d, pane) {
  const title = K("되돌리기 후보: 질병에서 바뀐 미생물을 되돌리는 개입", "Reversal candidates: interventions that push a disease-shifted microbe back");
  const R = d.reversal || [];
  if (!R.length) { pane.innerHTML = noData(title, d.reversal ? K("조건을 넘은 후보가 아직 없습니다.", "No candidate passes the thresholds yet.") : NODATA()); return; }
  const cnt = {}; R.forEach(r => cnt[r.disease] = (cnt[r.disease] || 0) + 1);
  const dis = Object.keys(cnt).sort((a, b) => cnt[b] - cnt[a] || a.localeCompare(b));
  const dl = id => { const r = R.find(x => x.disease === id); return dx(id, r && r.disease_label); };
  pane.innerHTML = `<div class="box"><h2>${title}</h2>${readBox("i_rvsk", null, "rb-rvsk")}${secCav("reversal")}
      <div class="ctl"><label>${K("질병", "Condition")} <select id="rvdis">${opt("", K("전체", "All"), R.length)}${dis.map(k => opt(k, dl(k), cnt[k])).join("")}</select></label>
      <label class="chk"><input type="checkbox" id="rvrob"> ${K("독립 재현된 것만", "Replicated only")}</label>
      <span class="legend"><i style="background:${C.amber}"></i>${K("질병", "Condition")} <i style="background:${DOWN}"></i>${K("질병에서 감소", "lower in condition")} <i style="background:${UP}"></i>${K("질병에서 증가", "higher in condition")} <i style="background:${C.teal}"></i>${esc(slab("reversal_direction", "restore"))} <i style="background:${C.coral}"></i>${esc(slab("reversal_direction", "suppress"))}</span></div>
      <div class="mid" id="rvsk" style="height:480px"></div></div>
    <div class="row2"><div class="box"><h2>${K("후보 목록", "Candidate list")}</h2>${readBox("i_rvt", null, "rb-rvt")}<div class="scroll" id="rvt"></div></div>
      <div class="box detail" id="rvev"><h2>${K("근거 문장", "Evidence sentences")}</h2><p class="hint">${K("목록에서 후보를 고르세요.", "Pick a candidate in the list.")}</p></div></div>`;
  let rows = R;
  const detail = r => { const a = r.disease_leg || {}, b = r.intervention_leg || {};
    $("rvev").innerHTML = `<h2>${esc(dl(r.disease))} · <i>${esc(r.taxon)}</i> · ${esc(iv(r.intervention, r.intervention_label))}</h2>
      <p class="hint">${esc(slab("reversal_direction", r.direction))} · ${K("점수", "score")} ${fmt(r.score)} ${robustB(r.robust)}${r.possibly_administered ? " " + bdg("⚠ " + K("투여한 균 자체일 수 있음", "may be the administered microbe"), "warn") : ""}${r.contested ? " " + bdg(K("논쟁 중", "contested"), "warn") : ""}</p>
      <h3 class="leg">1 · ${K("질병 쪽", "Condition side")}: <i>${esc(r.taxon)}</i> ${arrow(a.taxon_in_disease)} ${a.taxon_in_disease === "lower" ? K("이 질병에서 감소", "lower in the condition") : K("이 질병에서 증가", "higher in the condition")}</h3>
      <p class="hint">${K("감소", "decrease")} ${fmt(a.decrease)} · ${K("증가", "increase")} ${fmt(a.increase)} · ${K("차이 없음", "no difference")} ${fmt(a.null)}<br>${qline(a.quality)}</p>
      ${(a.examples || []).map(x => qcard(x)).join("") || `<p class="hint">—</p>`}
      <h3 class="leg">2 · ${K("개입 쪽", "Intervention side")}: ${esc(iv(r.intervention, r.intervention_label))} ${arrow(b.effect)} <i>${esc(r.taxon)}</i></h3>
      <p class="hint">${K("증가", "increase")} ${fmt(b.increase_papers)} · ${K("감소", "decrease")} ${fmt(b.decrease_papers)} · ${K("논문", "papers")} ${fmt(b.papers)}<br>${qline(b.quality)}</p>
      ${(b.examples || []).map(x => qcard(x)).join("") || `<p class="hint">—</p>`}
      ${r.already_tested ? `<p class="hint">${K("이 질병을 함께 언급한 개입 논문", "Intervention papers that also mention this condition")}: ${fmt(r.already_tested)} (${K("같은 방향", "same direction")} ${fmt(r.already_tested_same_direction)})</p>` : ""}
      <p class="cav"><b>!</b> ${K("가설입니다. 두 문헌을 이어 붙였을 뿐 이 개입이 이 질병에서 효과가 있다는 근거가 아닙니다.", "A hypothesis: two literatures joined, not evidence that this intervention works in this condition.")}</p>`; };
  const table = () => { $("rvt").innerHTML = `<table><thead><tr><th>#</th><th>${K("질병", "Condition")}</th><th>${K("미생물", "Microbe")}</th><th>${K("질병에서", "In condition")}</th><th>${K("개입 · 효과", "Intervention · effect")}</th><th>${K("표시", "Flags")}</th><th class="n">${K("점수", "Score")}</th></tr></thead><tbody>${rows.map((r, i) => { const a = r.disease_leg || {}, b = r.intervention_leg || {};
      return `<tr class="click" data-r="${i}"><td class="rank">${i + 1}</td><td>${esc(dl(r.disease))}</td><td><i>${esc(r.taxon)}</i></td>
        <td style="color:${a.taxon_in_disease === "lower" ? DOWN : UP}">${arrow(a.taxon_in_disease)} <small>${fmt(a.taxon_in_disease === "lower" ? a.decrease : a.increase)}/${fmt((a.increase || 0) + (a.decrease || 0) + (a.null || 0))}</small></td>
        <td><span style="color:${r.direction === "restore" ? C.teal : C.coral}">${esc(iv(r.intervention, r.intervention_label))} ${arrow(b.effect)}</span> <small>${fmt(b.effect === "decrease" ? b.decrease_papers : b.increase_papers)}/${fmt(b.papers)}</small></td>
        <td class="flags">${robustB(r.robust)}${r.already_tested ? bdg(K("이미 시험됨", "already tested") + " " + fmt(r.already_tested), "info", K("이 질병을 함께 언급한 개입 논문 수", "Intervention papers that also mention this condition")) : ""}${r.possibly_administered ? bdg("⚠ " + K("투여 균?", "administered?"), "warn", K("개입 자체가 이 미생물을 넣는 것일 수 있습니다(예: 유산균 제제). 되돌림의 증거가 아닐 수 있습니다.", "The intervention may itself contain this microbe (e.g. a Lactobacillus product); not necessarily evidence of reversal.")) : ""}${r.contested ? bdg(K("논쟁", "contested"), "warn") : ""}</td>
        <td class="n">${fmt(r.score)}</td></tr>`; }).join("")}</tbody></table>`;
    if (rows.length) detail(rows[0]); else $("rvev").innerHTML = `<h2>${K("근거 문장", "Evidence sentences")}</h2><p class="hint">${K("조건에 맞는 후보가 없습니다.", "No candidate matches the filter.")}</p>`; };
  const sankey = () => { charts.splice(0).forEach(c => c.dispose());
    const top = rows.slice(0, 30), L = {}, N = {}, nodes = [];
    const node = (id, name, color) => { if (!N[id]) { N[id] = name; nodes.push({name: id, itemStyle: {color}}); } };
    top.forEach(r => { const D = "D:" + r.disease, T = "T:" + r.taxon, I = "I:" + r.intervention;
      node(D, dl(r.disease), C.amber); node(T, r.taxon, r.disease_leg && r.disease_leg.taxon_in_disease === "lower" ? DOWN : UP); node(I, iv(r.intervention, r.intervention_label), C.violet);
      const k1 = D + ">" + T, k2 = T + ">" + I;
      L[k1] = L[k1] || {source: D, target: T, value: 0, lineStyle: {color: "gradient", opacity: .35}}; L[k1].value += +r.score || 0;
      L[k2] = L[k2] || {source: T, target: I, value: 0, lineStyle: {color: r.direction === "restore" ? C.teal : C.coral, opacity: .45}}; L[k2].value += +r.score || 0; });
    if (!nodes.length) return;
    chart("rvsk", {tooltip: {formatter: p => p.dataType === "edge" ? `${esc(N[p.data.source])} → ${esc(N[p.data.target])}<br>${K("점수 합", "score sum")} ${(+p.data.value).toFixed(1)}` : esc(N[p.name] || p.name)},
      series: [{type: "sankey", left: 6, right: narrow() ? 96 : 150, top: 10, bottom: 10, nodeGap: 6, nodeWidth: 12, draggable: false, emphasis: {focus: "adjacency"}, data: nodes, links: Object.values(L),
        label: {color: C.text, fontSize: 11, formatter: p => N[p.name] || p.name}, lineStyle: {curveness: .5}}]}); };
  const apply = () => { const k = $("rvdis").value, rob = $("rvrob").checked; rows = R.filter(r => (!k || r.disease === k) && (!rob || r.robust)); table(); sankey();
    const r0 = rows[0]; rbKey("rb-rvsk", "i_rvsk", r0 ? {r: r0, D: dl(r0.disease), I: iv(r0.intervention, r0.intervention_label)} : {});
    rbKey("rb-rvt", "i_rvt", {n: rows.length, r: rows.filter(r => r.robust).length, t: rows.filter(r => r.already_tested).length, pa: rows.filter(r => r.possibly_administered).length}); };
  $("rvdis").onchange = apply; $("rvrob").onchange = apply;
  $("rvt").onclick = e => { const t = e.target.closest("tr[data-r]"); if (!t) return; document.querySelectorAll("#rvt tr").forEach(x => x.classList.toggle("sel", x === t)); detail(rows[+t.dataset.r]); };
  apply();
}

/* 2. evidence quality: replication, publication bias, animal -> human, taxonomic resolution */
const ETYPE = {ASSOCIATED: ["미생물–질병 연관", "Microbe–condition association"], MODULATES: ["개입이 미생물을 바꿈", "Intervention changes a microbe"],
  RISK: ["위험·유전 연관", "Risk or genetic association"], SUBGROUP: ["하위 집단 (중증도·반응)", "Subgroup (severity, response)"], BACKGROUND: ["배경 진술", "Background statement"]};
function iqual(d, pane) {
  const EQ = d.evidence_quality, TG = d.translation_gap, RS = d.resolution;
  if (!EQ && !TG && !RS) { pane.innerHTML = noData(K("근거 품질", "Evidence quality"), NODATA()); return; }
  const S = (EQ || {}).summary || {}, PB = (EQ || {}).publication_bias;
  const h = V({eli10: ["좋은 근거는 서로 모르는 여러 연구팀이 여러 해에 걸쳐 같은 결과를 낸 거예요. 여기서는 그런 근거가 얼마나 되는지, '차이 없음' 결과가 숨겨지지는 않았는지, 동물 실험 결과가 사람에게도 맞는지 봐요.",
      "Good evidence means several unrelated teams found the same thing over several years. Here we check how much evidence is like that, whether 'no difference' results go missing, and whether animal results hold in people."],
    eli20: ["재현 = 공저자를 공유하지 않는 독립 그룹 수와 보고 기간 · 출판 편향 = '차이 없음' 보고 비율 · 동물→사람 = 동물에서 본 개입 효과가 사람 문장에서 같은 방향인지 · 해상도 = 종 이름까지 쓴 관계의 비율",
      "Replication = independent author groups (no shared author) and the span of years · publication bias = share of 'no difference' reports · animal → human = whether an intervention effect seen in animals points the same way in human sentences · resolution = share of relations naming a species"],
    pro: ["독립 그룹 = 저자(ORCID 또는 이름) 공유 논문의 연결 요소, 이름만으로 50편 넘게 잇는 허브 이름은 2편 이상 공유할 때만 연결 · 재현 기준: 그룹 ≥3, 기간 ≥3년 · 무효 비율 = null 방향 문장/전체 · 질병별은 간선 ≥50만",
      "Independent groups = connected components of papers sharing an author (ORCID or name); name-only hubs linking >50 papers connect only with ≥2 shared names · replicated: ≥3 groups over ≥3 years · null share = null-direction sentences / all · per condition only with ≥50 edges"]});
  const kpi = (v, t) => `<div class="kpi"><b>${v}</b><span>${t}</span></div>`;
  let html = `<div class="box"><h2>${K("근거 품질: 이 결과를 얼마나 믿을 수 있나", "Evidence quality: how far can these results be trusted?")}</h2><p class="hint">${h}</p>${secCav("evidence_quality")}</div>`;
  if (EQ) html += `<div class="kpis">${kpi(`${fmt(S.consensus_robust)}<small>/${fmt(S.consensus)}</small>`, K("독립 재현된 합의 관계", "Consensus relations independently replicated"))}
      ${kpi(`${fmt(S.contradictions_both_sides_replicated)}<small>/${fmt(S.contradictions)}</small>`, K("양쪽 방향 모두 2개 이상 그룹이 보고한 논쟁", "Debates where both directions come from ≥2 groups"))}
      ${kpi(`${fmt(S.reversal_robust)}<small>/${fmt(S.reversal)}</small>`, K("독립 재현된 되돌리기 후보", "Reversal candidates independently replicated"))}</div>`;
  if (PB) html += `<div class="row2"><div class="box"><h2>${K("출판 편향: '차이 없음' 보고 비율", "Publication bias: share of 'no difference' reports")}</h2>${readBox("i_pbt", {x: (PB.by_type || {}).ASSOCIATED})}${secCav("publication_bias")}<div class="mid" id="pbt" style="height:260px"></div></div>
      <div class="box"><h2>${K("질병별 '차이 없음' 비율", "'No difference' share by condition")}</h2>${readBox("i_pbd", (() => { const P = (PB.per_disease || []).slice(0, 30), mx = P.slice().sort((a, b) => b.null_share - a.null_share)[0];
      return Object.assign({min: fmt(PB.min_edges_per_disease ?? thr("publication_bias.disease_edges", 50))}, P.length ? {n: P.length, z: P.filter(x => !x.null).length, D: dx(mx.disease, mx.label), p: mx.null_share} : {}); })())}<div class="mid" id="pbd" style="height:520px"></div></div></div>`;
  if (TG) html += `<div class="row2"><div class="box"><h2>${K("동물 → 사람: 개입 효과가 사람에서도 같은가", "Animal → human: does the intervention effect hold in people?")}</h2>
      ${readBox("i_tgtab", {T: TG.totals})}${secCav("translation_gap")}
      <div class="scroll" style="max-height:360px"><table><thead><tr><th>${K("개입", "Intervention")}</th>${["confirmed", "discordant", "gap", "pending"].map(s => `<th class="n">${esc(slab("translation_state", s))}</th>`).join("")}</tr></thead><tbody>
      ${Object.entries(TG.per_intervention || {}).map(([k, v]) => `<tr><td>${esc(iv(k))}</td><td class="n" style="color:${C.teal}">${fmt(v.confirmed)}</td><td class="n" style="color:${C.coral}">${fmt(v.discordant)}</td><td class="n" style="color:${C.amber}">${fmt(v.gap)}</td><td class="n">${fmt(v.pending)}</td></tr>`).join("")}
      ${TG.totals ? `<tr><td><b>${K("합계", "Total")}</b></td><td class="n"><b>${fmt(TG.totals.confirmed)}</b></td><td class="n"><b>${fmt(TG.totals.discordant)}</b></td><td class="n"><b>${fmt(TG.totals.gap)}</b></td><td class="n"><b>${fmt(TG.totals.pending)}</b></td></tr>` : ""}</tbody></table></div>
      ${level === "pro" && TG.animal_edges != null ? `<p class="hint">${K("동물 간선", "Animal edges")} ${fmt(TG.animal_edges)} · ${K("동물 의심 간선", "suspected-animal edges")} ${fmt(TG.animal_suspect_edges)}</p>` : ""}</div>
    <div class="box"><h2>${K("사람에서 반대 또는 동물에서만", "Opposite in humans, or animal only")}</h2>${readBox("i_tglist", null, "rb-tgl")}<div class="seg" id="tgs">${["discordant", "gap", "confirmed"].map((s, i) => `<button data-k="${s}" class="${i ? "" : "on"}">${esc(slab("translation_state", s))} (${(TG[s] || []).length})</button>`).join("")}</div>
      <div class="scroll" style="max-height:300px" id="tgt"></div><div id="tge"></div></div></div>`;
  if (RS) html += `<div class="row2"><div class="box"><h2>${K("해상도: 종·균주 이름까지 쓰는 비율", "Resolution: share naming a species or strain")}</h2>${readBox("i_rsy", (() => { const Y = RS.species_share_by_year || []; return Y.length > 1 ? {f: Y[0], l: Y[Y.length - 1]} : {}; })())}${secCav("resolution")}<div class="mid" id="rsy"></div>${level === "pro" && RS.strain_note ? `<p class="hint">${esc(noteT(RS.strain_note))}</p>` : ""}</div>
      <div class="box"><h2>${K("질병별 종 수준 비율", "Species-level share by condition")}</h2>${readBox("i_rsd", (() => { const P = (RS.per_disease || []).slice(0, 25).slice().sort((a, b) => b.species_share - a.species_share), f = x => ({D: dx(x.disease, x.label), v: x.species_share});
      return P.length ? {hi: f(P[0]), lo: f(P[P.length - 1])} : {}; })())}<div class="mid" id="rsd" style="height:520px"></div></div></div>`;
  pane.innerHTML = html;
  const hbar = (el, names, vals, color, label) => chart(el, {grid: {left: narrow() ? 100 : 150, right: 56, top: 6, bottom: 20}, tooltip: {formatter: p => `${esc(names[p.dataIndex])}<br>${label(p.dataIndex)}`},
    xAxis: {type: "value", axisLabel: {color: C.dim, formatter: v => (v * 100).toFixed(1) + "%"}, splitLine: {lineStyle: {color: C.line}}},
    yAxis: {type: "category", inverse: true, data: names, axisLabel: {color: C.text, fontSize: 11, width: narrow() ? 92 : 140, overflow: "truncate"}},
    series: [{type: "bar", data: vals, itemStyle: {color, borderRadius: [0, 6, 6, 0]}, label: {show: true, position: "right", color: C.muted, fontSize: 10, formatter: p => label(p.dataIndex, true)}}]});
  if (PB) {
    const T = Object.entries(PB.by_type || {}).sort((a, b) => b[1].edges - a[1].edges);
    if (T.length) hbar("pbt", T.map(([k]) => ETYPE[k] ? K(...ETYPE[k]) : k), T.map(([, v]) => v.null_share), C.amber, (i, s) => s ? pc(T[i][1].null_share) : `${K("간선", "edges")} ${fmt(T[i][1].edges)} · ${K("차이 없음", "no difference")} ${fmt(T[i][1].null)} (${pc(T[i][1].null_share, 2)})`);
    const P = (PB.per_disease || []).slice(0, 30);
    if (P.length) hbar("pbd", P.map(x => dx(x.disease, x.label)), P.map(x => x.null_share), C.sky, (i, s) => s ? fmt(P[i].edges) : `${K("간선", "edges")} ${fmt(P[i].edges)} · ${K("차이 없음", "no difference")} ${fmt(P[i].null)} (${pc(P[i].null_share, 2)})`);
  }
  if (TG) {
    const tgt = $("tgt"), tge = $("tge");                      // kept, so a click on a stale control never reaches another pane
    const list = key => { const L = TG[key] || []; rbKey("rb-tgl", "i_tglist", L.length ? {n: L.length, x: L.slice().sort((a, b) => (b.human_papers || 0) - (a.human_papers || 0))[0]} : {});
      tgt.innerHTML = L.length ? `<table><thead><tr><th>${K("개입", "Intervention")}</th><th>${K("미생물", "Microbe")}</th><th>${K("동물", "Animal")}</th><th>${K("사람: 같은 방향 / 반대", "Human: same / opposite")}</th></tr></thead><tbody>${L.map((x, i) => `<tr class="click" data-g="${i}"><td>${esc(iv(x.intervention, x.intervention_label))}</td><td><i>${esc(x.taxon)}</i></td><td>${arrow(x.animal_direction)} ${fmt(x.animal_papers)}${x.animal_opposite ? ` <small>(${K("반대", "opposite")} ${fmt(x.animal_opposite)})</small>` : ""}</td><td><span style="color:${C.teal}">${fmt(x.human_same)}</span> / <span style="color:${C.coral}">${fmt(x.human_opposite)}</span> <small>${K("사람 논문", "human papers")} ${fmt(x.human_papers)}</small></td></tr>`).join("")}</tbody></table>` : `<p class="hint">—</p>`;
      tge.innerHTML = "";
      tgt.onclick = e => { const t = e.target.closest("tr[data-g]"); if (!t) return; const x = L[+t.dataset.g];
        tgt.querySelectorAll("tr").forEach(y => y.classList.toggle("sel", y === t));
        tge.innerHTML = `<p class="hint"><b>${esc(iv(x.intervention, x.intervention_label))} ${arrow(x.animal_direction)} <i>${esc(x.taxon)}</i></b></p>` + (x.examples || []).map(q => qcard(q, q.host === "animal" ? K("동물", "animal") : q.host === "human" ? K("사람", "human") : "")).join(""); }; };
    $("tgs").onclick = e => { const b = e.target.closest("button"); if (!b) return; document.querySelectorAll("#tgs button").forEach(y => y.classList.toggle("on", y === b)); list(b.dataset.k); };
    list("discordant");
  }
  if (RS) {
    const Y = RS.species_share_by_year || [], ST = {}; (RS.strain || []).forEach(x => ST[x.year] = x.share);
    if (Y.length) chart("rsy", {grid: {left: 50, right: 20, top: 30, bottom: 30}, legend: {top: 0, textStyle: {color: C.muted}},
      tooltip: {trigger: "axis", formatter: ps => `${ps[0].axisValue}<br>` + ps.map(p => `${p.marker}${esc(p.seriesName)} ${pc(p.value)}`).join("<br>") + `<br>${K("간선", "edges")} ${fmt((Y[ps[0].dataIndex] || {}).edges)}`},
      xAxis: {type: "category", data: Y.map(x => x.year), axisLabel: {color: C.muted}}, yAxis: {axisLabel: {color: C.dim, formatter: v => (v * 100).toFixed(0) + "%"}, splitLine: {lineStyle: {color: C.line}}},
      series: [{type: "line", name: K("종 이름", "Species named"), data: Y.map(x => x.species_share), smooth: true, symbolSize: 6, lineStyle: {width: 3, color: C.teal}, itemStyle: {color: C.teal}, areaStyle: {opacity: .08}},
        {type: "line", name: K("균주 표기", "Strain designated"), data: Y.map(x => ST[x.year] ?? null), smooth: true, symbolSize: 5, lineStyle: {width: 2, color: C.violet, type: "dashed"}, itemStyle: {color: C.violet}}]});
    const P = (RS.per_disease || []).slice(0, 25);
    if (P.length) hbar("rsd", P.map(x => dx(x.disease, x.label)), P.map(x => x.species_share), C.teal, (i, s) => s ? pc(P[i].species_share, 0) : `${K("간선", "edges")} ${fmt(P[i].edges)} · ${K("종 수준", "species level")} ${pc(P[i].species_share)}`);
  }
}

/* 3. from evidence to clinic: registered trials (ClinicalTrials.gov) and the curated industry record */
const PHASE = {early: ["초기 (1상)", "Early (phase 1)"], mid: ["2상", "Phase 2"], late: ["3·4상", "Phase 3–4"], na: ["해당 없음", "Not applicable"]};
const PHCOL = {early: C.sky, mid: C.amber, late: C.teal, na: C.dim};
const QCOL = {opportunity: C.lime, crowded: C.amber, speculative: C.coral, early: C.dim};
const CTSTAT = {RECRUITING: ["모집 중", "Recruiting"], NOT_YET_RECRUITING: ["모집 전", "Not yet recruiting"], ACTIVE_NOT_RECRUITING: ["진행 중 (모집 종료)", "Active, not recruiting"],
  ENROLLING_BY_INVITATION: ["초청 모집", "Enrolling by invitation"], COMPLETED: ["완료", "Completed"], TERMINATED: ["중단", "Terminated"], WITHDRAWN: ["철회", "Withdrawn"],
  SUSPENDED: ["일시 중지", "Suspended"], UNKNOWN: ["상태 미상", "Unknown status"], AVAILABLE: ["사용 가능", "Available"]};
const ctStat = s => { const k = String(s || "").toUpperCase().replace(/[\s,-]+/g, "_"); return CTSTAT[k] ? K(...CTSTAT[k]) : esc(s || "—"); };
const ctPhase = ph => (ph || []).map(p => { const s = String(p).toUpperCase().replace(/[\s_]/g, "");
  return s === "NA" ? K("해당 없음", "N/A") : s === "EARLYPHASE1" ? K("초기 1상", "Early phase 1") : /^PHASE\d$/.test(s) ? K(s.slice(5) + "상", "Phase " + s.slice(5)) : esc(p); }).join(" / ") || "—";
const MODAL = {fmt: ["분변 미생물", "Fecal microbiota"], lbp: ["생균 치료제", "Live biotherapeutic"], probiotic: ["프로바이오틱스", "Probiotics"], prebiotic: ["프리바이오틱스·글리칸", "Prebiotic / glycan"],
  synbiotic: ["신바이오틱스", "Synbiotics"], postbiotic: ["포스트바이오틱스", "Postbiotics"], phage: ["파지", "Phage"], diagnostics: ["진단", "Diagnostics"], consumer: ["소비자 제품", "Consumer product"]};
const modal = m => MODAL[m] ? K(...MODAL[m]) : esc(m || "—");
const ISTAT = {approved: ["승인", "Approved", "ok"], rejected: ["승인 거부", "Refused", "bad"], phase1: ["1상", "Phase 1", "info"], phase2: ["2상", "Phase 2", "info"], phase3: ["3상", "Phase 3", "info"],
  discontinued: ["중단", "Discontinued", "bad"], active: ["활동 중", "Active", "ok"], closed: ["폐업", "Closed", "bad"], acquired: ["인수·라이선스", "Acquired / licensed", "warn"]};
const istat = s => ISTAT[s] ? bdg(K(ISTAT[s][0], ISTAT[s][1]), ISTAT[s][2]) : bdg(esc(s || "—"), "");
const EVKIND = e => e.kind === "product" ? (e.status === "rejected" ? ["승인 거부", "Refusal", C.coral] : ["승인", "Approval", C.teal])
  : e.kind === "company" ? (e.status === "closed" ? ["폐업", "Closure", C.coral] : ["회사", "Company", C.sky])
  : e.kind === "pipeline" ? (e.status === "discontinued" ? ["개발 중단", "Discontinued", C.coral] : ["개발 단계", "Milestone", C.sky])
  : e.status === "acquired" ? ["거래", "Deal", C.amber] : e.status === "approved" ? ["승인", "Approval", C.teal] : /^phase/.test(e.status || "") ? ["결과 발표", "Readout", C.violet] : ["투자 유치", "Financing", C.lime];
const itext = e => { const t = e.text || {}; return t[lang] || t.en || ""; };
const isrc = e => `<div class="srcs">${esc(e.date || "")}${(e.sources || []).filter(s => s && /^https?:/.test(s.url || "")).map(s => ` · <a href="${esc(s.url)}" target="_blank" rel="noopener" title="${esc(s.title || s.url)}">${esc(s.title && s.title.length > 70 ? s.title.slice(0, 68) + "…" : s.title || s.url)} ↗</a>`).join("")}</div>`;
function iclinic(d, pane) {
  const TR = d.trials, IN = d.industry, ent = ((IN || {}).entries || []).filter(e => e && e.verified !== false);
  const cons = {}, rob = {}; (d.consensus || []).forEach(p => { cons[p.disease] = (cons[p.disease] || 0) + 1; if (p.robust) rob[p.disease] = (rob[p.disease] || 0) + 1; });
  const evc = id => !id ? "" : cons[id] ? `<span class="chip" data-tip="${esc(K("이 질병의 합의 관계 수 (괄호: 독립 재현)", "Consensus relations for this condition (in brackets: independently replicated)"))}">${esc(dx(id))} · ${K("합의", "consensus")} ${cons[id]}${rob[id] ? ` (${rob[id]})` : ""}</span>` : `<span class="chip">${esc(dx(id))}</span>`;
  const h = V({eli10: ["논문에서 찾은 것이 실제 치료로 이어지고 있는지 봐요. 병원에서 시험 중인 연구, 이미 허가받은 약, 그리고 문을 닫은 회사들이 남긴 교훈이에요.",
      "Is what papers found turning into real treatments? Trials running in hospitals, products already approved, and lessons from companies that closed."],
    eli20: ["근거가 강한데 임상시험이 적은 질병은 '기회', 둘 다 많으면 '경쟁 과열', 시험은 많은데 근거가 약하면 '근거 약함'입니다. 아래는 사람이 출처를 확인한 산업 기록입니다.",
      "Conditions with strong evidence but few trials are 'opportunities', both high is 'crowded', many trials on weak evidence is 'speculative'. Below: industry records whose sources a person checked."],
    pro: ["근거 = 독립 재현 합의 쌍 + 되돌리기 후보, 논쟁 쌍이 더 많으면 강함에서 제외 · 시험 활동 = 진행·완료 시험 가중합(1상·해당 없음 1, 2상 2, 3·4상 3) · 기준선은 0이 아닌 값의 중앙값과 최소값 중 큰 값",
      "Evidence = replicated consensus pairs + reversal candidates; more contested pairs than that excludes 'strong' · trial activity = active + completed trials weighted (phase 1/NA 1, phase 2 = 2, phase 3/4 = 3) · cut-offs = max(minimum, median of non-zero values)"]});
  let html = `<div class="box"><h2>${K("근거에서 임상·제품으로", "From evidence to clinic")}</h2><p class="hint">${h}</p></div>`;
  const hasTR = TR && (TR.quadrant || []).length;
  if (hasTR) {
    html += `<div class="row2"><div class="box"><h2>${K("근거 × 임상시험 사분면", "Evidence × trial-activity quadrant")}</h2>${readBox("i_tq", (() => { const Q = TR.quadrant, n = q => Q.filter(x => x.quadrant === q).length;
          return {cx: (TR.cutoffs || {}).evidence_high, cy: (TR.cutoffs || {}).activity_high, opp: Q.filter(x => x.quadrant === "opportunity").sort((a, b) => b.evidence - a.evidence).slice(0, 3).map(x => dx(x.disease, x.label)), c: n("crowded"), s: n("speculative")}; })())}<p class="hint">${cap(K("등록 시험", "registered trials"))} ${fmt(TR.studies)}${TR.fetched_at ? " · " + K("수집", "fetched") + " " + esc(typeof TR.fetched_at === "number" ? new Date(TR.fetched_at * 1000).toISOString().slice(0, 10) : String(TR.fetched_at).slice(0, 10)) : ""}</p>${secCav("trials")}
        <div class="legend">${["opportunity", "crowded", "speculative", "early"].map(q => `<i style="background:${QCOL[q]}"></i>${esc(slab("quadrant", q))} (${TR.quadrant.filter(x => x.quadrant === q).length})`).join(" ")}</div><div class="big" id="tq"></div></div>
      <div class="box"><h2>${K("질병별 임상시험 단계", "Trial phases by condition")}</h2>${readBox("i_tph", (() => { const PD = Object.entries(TR.per_disease || {}).sort((a, b) => b[1].trials - a[1].trials).slice(0, 18); if (!PD.length) return {};
          const ph = v => v.phase || {}, tot = PD.reduce((a, [, v]) => a + ["early", "mid", "late", "na"].reduce((s, k) => s + (ph(v)[k] || 0), 0), 0), na = PD.reduce((a, [, v]) => a + (ph(v).na || 0), 0);
          return {D: dx(PD[0][0], PD[0][1].label), n: PD[0][1].trials, l: ph(PD[0][1]).late || 0, na: tot ? na / tot : 0}; })())}<div class="big" id="tph"></div></div></div>
      <div class="box"><h2>${K("최근 등록된 임상시험", "Latest registered trials")}</h2>${readBox("i_tlist", null, "rb-tlist")}<div class="ctl"><label>${K("질병", "Condition")} <select id="tdis"></select></label></div><div class="scroll" style="max-height:420px" id="tlist"></div></div>`;
  } else {
    html += `<div class="box"><h2>${K("임상시험 (ClinicalTrials.gov)", "Clinical trials (ClinicalTrials.gov)")}</h2><p class="note">${K("ClinicalTrials.gov에서 마이크로바이옴 임상시험을 모으는 중입니다. 다음 주간 수집 뒤에 첫 결과가 여기에 나타납니다.", "Collecting microbiome trials from ClinicalTrials.gov. The first results appear here after the next weekly fetch.")}</p></div>`;
  }
  let pipe = [];
  if (ent.length) {
    const by = k => ent.filter(e => e.kind === k), byDate = (a, b) => String(b.date || "").localeCompare(String(a.date || ""));
    const prod = by("product").sort(byDate), comp = by("company"), PO = {phase3: 0, phase2: 1, phase1: 2, discontinued: 3};
    pipe = by("pipeline").sort((a, b) => (PO[a.status] ?? 9) - (PO[b.status] ?? 9) || byDate(a, b));
    const tl = ent.filter(e => e.kind === "event" || e.kind === "product" || (e.kind === "company" && e.status === "closed") || (e.kind === "pipeline" && e.status === "discontinued")).sort(byDate);
    const card = e => `<div class="icard${e.status === "closed" ? " closed" : ""}"><div class="ih"><b>${esc(e.name)}</b>${istat(e.status)}</div><div class="isub">${esc(e.company || "")}${e.modality ? " · " + modal(e.modality) : ""}</div>
      ${e.disease || e.indication ? `<div class="chips">${evc(e.disease)}${e.indication && level !== "eli10" ? `<span class="chip ind">${esc(e.indication)}</span>` : ""}</div>` : ""}<p>${e.status === "closed" ? `<b class="lesson">${K("교훈", "Lesson")}:</b> ` : ""}${esc(itext(e))}</p>${e.note && level === "pro" ? `<p class="inote">${K("정리자 메모", "Curator note")}: ${esc(e.note)}</p>` : ""}${isrc(e)}</div>`;
    html += `<div class="box"><h2>${K("산업 기록: 사람이 출처를 확인한 항목", "Industry record: entries with checked sources")}</h2><p class="hint">${K("기준일", "As of")} ${esc(IN.as_of || "—")} · ${K("항목", "entries")} ${ent.length}${IN.dropped_unverified ? " · " + K("미확인 제외", "unverified left out") + " " + IN.dropped_unverified : ""}</p>${secCav("industry")}</div>
      ${prod.length ? `<div class="box"><h2>${K("허가 심사를 거친 제품", "Products through regulatory review")}</h2>${readBox("i_prod", {a: prod.filter(e => e.status === "approved").length, r: prod.filter(e => e.status === "rejected").length, x: prod[0]})}<div class="cards">${prod.map(card).join("")}</div></div>` : ""}
      <div class="row2">${pipe.length ? `<div class="box"><h2>${K("개발 중인 후보 (단계별)", "Pipeline by phase")}</h2>${readBox("i_pipe", (() => { const c = s => pipe.filter(e => e.status === s).length; return {n: pipe.length, p3: c("phase3"), p2: c("phase2"), p1: c("phase1"), d: c("discontinued")}; })())}<div class="scroll" style="max-height:560px"><table><thead><tr><th>${K("후보", "Candidate")}</th><th>${K("단계", "Phase")}</th><th>${K("적응증", "Indication")}</th><th>${K("날짜", "Date")}</th></tr></thead><tbody>
        ${pipe.map((e, i) => `<tr class="click" data-p="${i}"><td class="name"><b>${esc(e.name)}</b><small>${esc(e.company || "")}${e.modality ? " · " + modal(e.modality) : ""}</small></td><td>${istat(e.status)}</td><td>${esc(e.indication || "")}<div class="chips">${evc(e.disease)}</div></td><td style="white-space:nowrap">${esc(e.date || "")}</td></tr>`).join("")}</tbody></table></div><div id="pdet"></div></div>` : ""}
      ${tl.length ? `<div class="box"><h2>${K("타임라인 (최신 순)", "Timeline (newest first)")}</h2>${readBox("i_tl", tl.length ? {n: tl.length, e: tl[0], kind: K(EVKIND(tl[0])[0], EVKIND(tl[0])[1])} : {})}<div class="scroll tl" style="max-height:640px">
        ${tl.map(e => { const k = EVKIND(e); return `<div class="tli"><i style="background:${k[2]}"></i><div><small>${esc(e.date || "")} · <b style="color:${k[2]}">${K(k[0], k[1])}</b></small><div><b>${esc(e.name)}</b> <span class="isub">${esc(e.company || "")}</span></div><p>${esc(itext(e))}</p>${isrc(e)}</div></div>`; }).join("")}</div></div>` : ""}</div>
      ${comp.length ? `<div class="box"><h2>${K("회사와 폐업이 남긴 교훈", "Companies, and lessons from closures")}</h2>${readBox("i_comp", {n: comp.length, a: comp.filter(e => e.status === "active").length, c: comp.filter(e => e.status === "closed").length, q: comp.filter(e => e.status === "acquired").length})}
        <div class="cards">${comp.sort((a, b) => (a.status === "closed") - (b.status === "closed") || byDate(a, b)).map(card).join("")}</div></div>` : ""}`;
  } else {
    html += `<div class="box"><h2>${K("산업 기록", "Industry record")}</h2><p class="note">${K("확인된 산업 기록이 아직 없습니다.", "No verified industry entries yet.")}</p></div>`;
  }
  pane.innerHTML = html;
  pane.querySelectorAll("tr[data-p]").forEach(t => t.onclick = () => { const e = pipe[+t.dataset.p]; if (!e) return;
    pane.querySelectorAll("tr[data-p]").forEach(x => x.classList.toggle("sel", x === t));
    $("pdet").innerHTML = `<div class="icard"><div class="ih"><b>${esc(e.name)}</b>${istat(e.status)}</div><p>${esc(itext(e))}</p>${e.note && level === "pro" ? `<p class="inote">${K("정리자 메모", "Curator note")}: ${esc(e.note)}</p>` : ""}${isrc(e)}</div>`; });
  if (hasTR) {
    const Q = TR.quadrant, cx = (TR.cutoffs || {}).evidence_high, cy = (TR.cutoffs || {}).activity_high;
    const mx = Math.ceil(Math.max(...Q.map(x => x.evidence), (cx || 0) * 2, 1) * 1.1), my = Math.ceil(Math.max(...Q.map(x => x.trial_activity), (cy || 0) * 2, 1) * 1.1);
    const area = (x0, x1, y0, y1, q) => [{xAxis: x0, yAxis: y0, itemStyle: {color: QCOL[q], opacity: .07}, label: {show: true, position: "insideTop", color: QCOL[q], fontSize: 12, fontWeight: 700, formatter: slab("quadrant", q)}}, {xAxis: x1, yAxis: y1}];
    const cut = cx != null && cy != null;
    chart("tq", {grid: {left: 56, right: 20, top: 16, bottom: 46}, tooltip: {formatter: p => { const x = Q[p.dataIndex]; return x && p.seriesType === "scatter" ? `<b>${esc(dx(x.disease, x.label))}</b> · ${esc(slab("quadrant", x.quadrant))}<br>${K("근거", "evidence")} ${x.evidence} (${K("재현 합의", "replicated consensus")} ${x.robust_pairs}, ${K("되돌리기", "reversal")} ${x.reversal_candidates}, ${K("논쟁", "contested")} ${x.contested_pairs})<br>${K("시험 활동", "trial activity")} ${x.trial_activity} · ${K("시험", "trials")} ${x.trials}` : ""; }},
      xAxis: {name: K("근거", "Evidence"), nameLocation: "middle", nameGap: 26, min: 0, max: mx, axisLabel: {color: C.dim}, splitLine: {lineStyle: {color: C.line}}},
      yAxis: {name: K("임상시험 활동", "Trial activity"), nameLocation: "middle", nameGap: 36, min: 0, max: my, axisLabel: {color: C.dim}, splitLine: {lineStyle: {color: C.line}}},
      series: [{type: "scatter", data: Q.map(x => ({value: [x.evidence, x.trial_activity], name: dx(x.disease, x.label), itemStyle: {color: QCOL[x.quadrant] || C.muted}})),
        symbolSize: v => 8 + Math.sqrt(Math.max(0, v[0] + v[1])) * 2, label: {show: true, position: "right", color: C.text, fontSize: 11, formatter: p => p.name}, labelLayout: {hideOverlap: true},
        markArea: cut ? {silent: true, data: [area(cx, mx, 0, cy, "opportunity"), area(cx, mx, cy, my, "crowded"), area(0, cx, cy, my, "speculative"), area(0, cx, 0, cy, "early")]} : undefined,
        markLine: cut ? {silent: true, symbol: "none", lineStyle: {color: C.muted, type: "dashed"}, label: {show: false}, data: [{xAxis: cx}, {yAxis: cy}]} : undefined}]});
    const PD = Object.entries(TR.per_disease || {}).sort((a, b) => b[1].trials - a[1].trials).slice(0, 18);
    if (PD.length) chart("tph", {grid: {left: narrow() ? 100 : 150, right: 30, top: 30, bottom: 20}, legend: {top: 0, textStyle: {color: C.muted}}, tooltip: {trigger: "axis", axisPointer: {type: "shadow"}},
      xAxis: {type: "value", axisLabel: {color: C.dim}, splitLine: {lineStyle: {color: C.line}}}, yAxis: {type: "category", inverse: true, data: PD.map(([k, v]) => dx(k, v.label)), axisLabel: {color: C.text, fontSize: 11, width: 140, overflow: "truncate"}},
      series: ["late", "mid", "early", "na"].map(p => ({type: "bar", stack: "ph", name: K(...PHASE[p]), data: PD.map(([, v]) => (v.phase || {})[p] || 0), itemStyle: {color: PHCOL[p]}}))});
    const all = [];
    Object.entries(TR.per_disease || {}).forEach(([k, v]) => (v.latest || []).forEach(s => all.push({...s, _d: k})));
    const dkeys = Object.keys(TR.per_disease || {}).sort((a, b) => TR.per_disease[b].trials - TR.per_disease[a].trials);
    $("tdis").innerHTML = opt("", K("전체", "All")) + dkeys.map(k => opt(k, dx(k, TR.per_disease[k].label), TR.per_disease[k].trials)).join("");
    const tlist = k => { const seen = new Set(), L = all.filter(s => !k || s._d === k).sort((a, b) => String(b.start || "").localeCompare(String(a.start || ""))).filter(s => !seen.has(s.nct) && seen.add(s.nct)).slice(0, 25);
      const P = k ? TR.per_disease[k] : null;
      rbKey("rb-tlist", "i_tlist", L.length ? {n: L.length, r: L.filter(s => /^RECRUITING$/i.test(String(s.status || "").replace(/[\s,-]+/g, "_"))).length, date: fd(L[0].start)} : {});
      $("tlist").innerHTML = (P ? `<p class="hint">${K("시험", "trials")} ${fmt(P.trials)} · ${K("진행 중", "active")} ${fmt((P.status || {}).active)} · ${K("완료", "completed")} ${fmt((P.status || {}).completed)}${(P.top_sponsors || []).length ? " · " + K("주요 의뢰자", "top sponsors") + ": " + P.top_sponsors.slice(0, 3).map(s => esc(s.name) + " (" + s.trials + ")").join(", ") : ""}</p>` : "") +
        (L.length ? `<table><thead><tr><th>NCT</th><th>${K("제목", "Title")}</th><th>${K("단계", "Phase")}</th><th>${K("상태", "Status")}</th><th>${K("시작", "Start")}</th><th>${K("의뢰자", "Sponsor")}</th></tr></thead><tbody>${L.map(s => `<tr><td><a href="https://clinicaltrials.gov/study/${encodeURIComponent(s.nct || "")}" target="_blank" rel="noopener">${esc(s.nct)} ↗</a></td><td>${esc(s.title)}<div class="chips">${evc(s._d)}${(s.modalities || []).map(m => `<span class="chip">${modal(m)}</span>`).join("")}</div></td><td>${ctPhase(s.phase)}</td><td>${ctStat(s.status)}</td><td style="white-space:nowrap">${esc(s.start || "—")}</td><td>${esc(s.sponsor || "—")}</td></tr>`).join("")}</tbody></table>` : `<p class="hint">—</p>`); };
    $("tdis").onchange = () => tlist($("tdis").value); tlist("");
  }
}

/* 4. severity, risk, mechanisms */
function isrm(d, pane) {
  const SV = d.severity, RK = d.risk, MT = d.mechanism_triangles;
  if (!SV && !RK && !MT) { pane.innerHTML = noData(K("중증도·위험·기전", "Severity, risk, mechanisms"), NODATA()); return; }
  const h = V({eli10: ["같은 병이라도 더 심한 사람에게 많은 세균, 병에 걸릴 위험과 함께 나오는 세균, 그리고 세균과 함께 자주 이야기되는 물질을 모았어요. 모두 '함께 나온다'는 뜻이지 원인이라는 뜻은 아니에요.",
      "Germs that are more common in people who are sicker, germs that go with a higher or lower risk of getting ill, and substances often mentioned with them. All of this means 'found together', not 'causes'."],
    eli20: ["중증도 = 더 나쁜 하위 집단(중증·무반응·재발·짧은 생존)에서 많거나 적은 미생물 · 위험 = 발병 위험과의 연관(멘델 무작위분석 포함) · 기전 = 같은 초록에 함께 언급된 대사물질(측정된 경로가 아님)",
      "Severity = microbes higher or lower in the worse subgroup (severe, non-responder, relapse, shorter survival) · risk = association with the risk of disease (including Mendelian randomization) · mechanisms = metabolites co-mentioned in the same abstracts (not a measured pathway)"],
    pro: ["중증도·위험: 같은 방향 ≥3편·비율 ≥2 · 기전 삼각형: 합의 쌍 상위 30개 중 공동 언급 ≥10편, 대사물질 ≥5편, 향상도(lift) = 쌍 안 비율 ÷ 같은 질병 논문 전체 비율 ≥1.5, 쌍당 최대 3개",
      "Severity and risk: ≥3 papers in one direction, ratio ≥2 · mechanism triangles: top 30 consensus pairs with ≥10 co-mentioning papers, metabolite ≥5 papers, lift = share within the pair ÷ share among all papers on the condition ≥1.5, at most 3 per pair"]});
  const it = (x, dir, sub) => `<div class="sig"><b><i>${esc(x.taxon)}</i></b> · ${esc(dx(x.disease, x.disease_label))} <span style="color:${dir[1]}">${dir[0]}</span>
    <small>${sub} · ${K("논문", "papers")} ${fmt(x.papers)}${x.opposite ? ` · ${K("반대", "opposite")} ${fmt(x.opposite)}` : ""}</small>
    <details><summary>${K("근거 문장", "Evidence sentences")} (${(x.examples || []).length})</summary>${(x.examples || []).map(q => qcard(q)).join("")}</details></div>`;
  let html = `<div class="box"><h2>${K("중증도·위험·기전: 연관을 넘어선 단서", "Severity, risk and mechanisms: clues beyond association")}</h2><p class="hint">${h}</p></div><div class="row2">`;
  if (SV) html += `<div class="box"><h2>${K("더 나쁜 하위 집단에서 달라지는 미생물", "Microbes that differ in the worse subgroup")}</h2>${readBox("i_sv", (() => { const I = SV.items || [], x = I.slice().sort((a, b) => b.papers - a.papers)[0]; return x ? {x, D: dx(x.disease, x.disease_label), N: I.length} : {}; })())}${secCav("severity")}
      ${(SV.items || []).length ? SV.items.map(x => it(x, x.in_worse_subgroup === "lower" ? ["↓ " + K("나쁜 쪽에서 감소", "lower when worse"), DOWN] : ["↑ " + K("나쁜 쪽에서 증가", "higher when worse"), UP], esc(slab("subgroup_kind", x.kind)))).join("") : `<p class="hint">—</p>`}
      ${level === "pro" && SV.subgroup_edges != null ? `<p class="hint">${K("하위 집단 간선", "Subgroup edges")} ${fmt(SV.subgroup_edges)} · ${K("어느 쪽이 나쁜지 판정됨", "worse side resolved")} ${fmt(SV.polarity_resolved)}</p>` : ""}</div>`;
  if (RK) html += `<div class="box"><h2>${K("발병 위험과 연관된 미생물", "Microbes associated with disease risk")}</h2>${readBox("i_rk", (() => { const I = RK.items || [], x = I.slice().sort((a, b) => b.papers - a.papers)[0]; return x ? {x, D: dx(x.disease, x.disease_label), m: I.filter(y => y.mendelian_share > 0).length} : {}; })())}${secCav("risk")}
      ${(RK.items || []).length ? RK.items.map(x => it(x, x.direction === "lower_risk" ? ["↓ " + K("위험 낮음", "lower risk"), C.teal] : ["↑ " + K("위험 높음", "higher risk"), C.coral], x.mendelian_share ? K("멘델 무작위분석", "Mendelian randomization") + " " + pc(x.mendelian_share, 0) : K("관찰 연관", "observational"))).join("") : `<p class="hint">—</p>`}</div>`;
  html += `</div>`;
  if (MT) html += `<div class="box"><h2>${K("기전 삼각형: 미생물 – 대사물질 – 질병 (공동 언급)", "Mechanism triangles: microbe – metabolite – condition (co-mention)")}</h2>
    ${readBox("i_mt", (() => { let x = null, m = null; (MT.items || []).forEach(i => (i.metabolites || []).forEach(q => { if (!m || (+q.lift || 0) > (+m.lift || 0)) { m = q; x = i; } }));
      return x ? {x, m, D: dx(x.disease, x.disease_label), M: mt(m.metabolite, m.label), N: (MT.items || []).length} : {}; })())}${secCav("mechanism_triangles")}
    <div class="cards">${(MT.items || []).map(x => `<div class="mcard"><div class="mh"><b><i>${esc(x.taxon)}</i></b> <span style="color:${x.taxon_direction === "lower" ? DOWN : UP}">${arrow(x.taxon_direction)}</span> ${esc(dx(x.disease, x.disease_label))}<small>${K("공동 언급 논문", "co-mentioning papers")} ${fmt(x.co_papers)}</small></div>
      ${(x.metabolites || []).map(m => `<div class="mrow"><span>${esc(mt(m.metabolite, m.label))}</span><div class="bal"><i style="width:${Math.min(100, 20 * (+m.lift || 0))}%;background:${C.violet}"></i></div><b>×${(+m.lift || 0).toFixed(2)}</b><small>${K("논문", "papers")} ${fmt(m.papers)} · ${pc(m.share)} ${K("대", "vs")} ${pc(m.baseline_share)}</small></div>`).join("")}</div>`).join("") || `<p class="hint">—</p>`}</div></div>`;
  pane.innerHTML = html;
}

document.addEventListener("mousemove", e => { const t = e.target.closest && e.target.closest("[data-tip]"), tip = $("tip");
  if (!t) { tip.style.display = "none"; return; } tip.textContent = t.dataset.tip; tip.style.display = "block"; tip.style.left = (e.clientX + 12) + "px"; tip.style.top = (e.clientY + 12) + "px"; });

/* ---------------- frame: tabs, toggles, intro; re-render on a language or level change ---------------- */
const LIVE = {backfill, agents}, SNAP = {people, radar, findings, world, gaps, minerva};
let lastData = null;
const VIEWS_KO = [];
function frame() {
  document.documentElement.lang = lang;
  document.title = "M-SAGE · " + K(...MODULES[mod]);
  $("tabs").innerHTML = Object.entries(MODULES).map(([k, n]) => `<a href="?m=${k}" class="${k === mod ? "on" : ""}">${K(...n)}</a>`).join("");
  $("mod-title").textContent = K(...MODULES[mod]);
  $("intro").textContent = INTRO[mod] ? V(INTRO[mod]) : "";
  const back = document.querySelector(".brand .back"); if (back) back.textContent = K("← 조종석", "← Cockpit");
  // the page's own view links are written in Korean in module.html (kept as they are for ko/en); Italian and French get them translated
  document.querySelectorAll(".brand .views a").forEach((a, i) => { VIEWS_KO[i] = VIEWS_KO[i] || a.textContent;
    const en = ["Cockpit", "One-page story", "Insight lab"][i];
    a.textContent = lang === "ko" ? VIEWS_KO[i] : lang === "en" ? (en || VIEWS_KO[i]) : xlate(en) || VIEWS_KO[i]; });
  const dis = document.querySelector(".disclaimer2"); if (dis) dis.textContent = K(...DISCLAIMER);
  document.querySelectorAll("#sw-lang button").forEach(b => b.classList.toggle("on", b.dataset.v === lang));
  document.querySelectorAll("#sw-level button").forEach(b => b.classList.toggle("on", b.dataset.v === level));
}
function toggles() {
  const host = document.querySelector(".topbar .brand");
  if (host && !$("sw-lang")) host.insertAdjacentHTML("beforeend", `<div class="toggles"><div class="sw" id="sw-lang" role="group" aria-label="language"><button data-v="ko">한국어</button><button data-v="en">English</button><button data-v="it">Italiano</button><button data-v="fr">Français</button></div>
    <div class="sw lvl" id="sw-level" role="group" aria-label="reading level"><button data-v="eli10">ELI10</button><button data-v="eli20">ELI20</button><button data-v="pro">PRO</button></div></div>`);
  const redraw = () => { frame(); if (lastData) { charts.splice(0).forEach(c => c.dispose()); draw(lastData); } };
  $("sw-lang").onclick = e => { const b = e.target.closest("button"); if (!b) return; lang = b.dataset.v; store.set("msage.lang", lang); redraw(); };
  $("sw-level").onclick = e => { const b = e.target.closest("button"); if (!b) return; level = b.dataset.v; store.set("msage.level", level); redraw(); };
}
function fresh(d) {
  if (mod === "insights") return `${K("지식 그래프 기준", "Knowledge graph as of")} ${d.as_of} · ${K("논문", "papers")} ${fmt((d.build || {}).papers_read)}${STATIC ? " · " + K("스냅샷 버전", "release") + " " + STATIC.release : " · " + K("3시간마다 재생성", "rebuilt every 3 hours")}`;
  if (LIVE[mod]) return ((d.supervisor || {}).state === "running" ? K("모든 작업 진행 중", "All jobs running") : (d.supervisor || {}).state || "") + K(" · 30초마다 갱신", " · updates every 30 s");
  return `${K("분석 기준", "Analysis as of")} ${d.as_of} · ${K("논문", "papers")} ${fmt(d.papers)}`;
}
function draw(d) { lastData = d; if (d && d.summary_i18n) I18N = d.summary_i18n; (mod === "insights" ? insights : LIVE[mod] || SNAP[mod])(d); $("fresh").textContent = fresh(d); }
toggles(); frame();
if (mod === "insights") {
  get("/api/site/msage/insights", window.MSAGE_INSIGHTS).then(draw)
    .catch(e => { $("view").innerHTML = `<div class="box">${K("지식 그래프가 아직 없습니다", "No knowledge graph yet")} (${esc(e)}).</div>`; })
    // translations of the Korean AI summaries live in the site data: load it quietly, redraw if they are needed now
    .then(() => get("/api/site/msage", window.MSAGE_DATA)).then(x => { if (!x || !x.summary_i18n || x.summary_i18n === (I18N || (window.MSAGE_DATA || {}).summary_i18n)) return; I18N = x.summary_i18n;
      if (lang !== "ko" && lastData) { charts.splice(0).forEach(c => c.dispose()); draw(lastData); } }).catch(() => {});
} else if (LIVE[mod]) {
  const tick = () => get("/api/site/msage/live", window.MSAGE_LIVE).then(v => { charts.splice(0).forEach(c => c.dispose()); draw(v); }).catch(() => {});
  tick(); if (!window.MSAGE_LIVE) setInterval(tick, 30000);
} else {
  // English labels for conditions come from the knowledge-graph insights; load them quietly alongside
  get("/api/site/msage/insights", window.MSAGE_INSIGHTS).then(x => { INS = x; }).catch(() => {}).then(() => get("/api/site/msage", window.MSAGE_DATA)).then(draw)
    .catch(e => { $("view").innerHTML = `<div class="box">${K("자료를 불러오지 못했습니다", "Could not load the data")}: ${esc(e)}</div>`; });
}
/* ---- Italian words (English text -> Italian), used by K/V/nm when lang is "it"; generated, keep keys identical to the English (and to FR_WORDS) ---- */
function IT_WORDS() { return {
  "Insight lab": "Laboratorio di analisi",
  "Researchers": "Ricercatori",
  "Interest shifts": "Spostamenti d'interesse",
  "Latest findings": "Ultime scoperte",
  "World": "Mondo",
  "Gaps": "Lacune",
  "Collection": "Raccolta",
  "Agents": "Agenti",
  "We turned what the AI read into a map of which germs show up with which illnesses. See where many papers agree, where they disagree, and what is becoming popular.": "Abbiamo trasformato quello che l'IA ha letto in una mappa che mostra quali batteri compaiono insieme a quali malattie. Puoi vedere dove molti articoli sono d'accordo, dove non lo sono e cosa sta diventando popolare.",
  "Sentences the AI read are linked into a knowledge graph of microbes, conditions and treatments: which relations many papers report in the same direction, where conclusions conflict, what is rising and what to study next.": "Le frasi lette dall'IA sono collegate in un grafo della conoscenza di microbi, patologie e trattamenti: quali relazioni molti articoli riportano nella stessa direzione, dove le conclusioni divergono, cosa è in crescita e cosa studiare dopo.",
  "Knowledge graph of directional microbe–condition relations (increase/decrease/no difference) from abstract evidence sentences. Qwen judge plus the deterministic grounded_direction check; consensus = ≥60% same direction and ≥5 sentences, debate = ≥30% opposite. Abstract-level, not expert-validated.": "Grafo della conoscenza delle relazioni direzionali microbo–patologia (aumento/diminuzione/nessuna differenza) tratte dalle frasi di evidenza degli abstract. Giudizio di Qwen più il controllo deterministico grounded_direction; consenso = ≥60% stessa direzione e ≥5 frasi, dibattito = ≥30% opposte. Livello abstract, non validato da esperti.",
  "Scientists who wrote many papers. Click a name to see where they work and what they study.": "Scienziati che hanno scritto molti articoli. Clicca un nome per vedere dove lavorano e cosa studiano.",
  "Researchers ranked by papers and citations. Click a row for affiliation, recent papers and co-authors.": "Ricercatori in classifica per articoli e citazioni. Clicca una riga per affiliazione, articoli recenti e coautori.",
  "Rankings by corpus papers, observed citations, h-index and last-year output. Without ORCID authors are matched by name string (homonyms may merge). Output measures, not impact.": "Classifiche per articoli nel corpus, citazioni osservate, indice h e produzione dell'ultimo anno. Senza ORCID gli autori sono abbinati per stringa del nome (gli omonimi possono fondersi). Misure di produzione, non di impatto.",
  "Topics scientists talk about more, or less, lately.": "Gli argomenti di cui gli scienziati parlano di più, o di meno, ultimamente.",
  "Whether recent interest in each condition and topic grew or shrank. Further right = a larger share of recent papers.": "Se l'interesse recente per ogni patologia e tema è cresciuto o calato. Più a destra = quota maggiore degli articoli recenti.",
  "Change in share of papers, last 3 months vs the earlier window (≥100 papers). Shares, not counts, because collection volume differs by period.": "Variazione della quota di articoli, ultimi 3 mesi rispetto alla finestra precedente (≥100 articoli). Quote, non conteggi, perché il volume raccolto varia da un periodo all'altro.",
  "The key line from papers the AI just read.": "La frase chiave degli articoli che l'IA ha appena letto.",
  "Recent findings the AI read from abstracts and checked against the source sentence. All provisional.": "Scoperte recenti che l'IA ha letto negli abstract e verificato sulla frase della fonte. Tutte provvisorie.",
  "Abstract-only reading, accepted only when the quoted sentence matches the source. Summaries are model-generated; check numbers against the paper.": "Lettura dei soli abstract, accettata solo quando la frase citata corrisponde alla fonte. I riassunti sono generati dal modello; verifica i numeri sull'articolo.",
  "Which countries do the most research, and which work together.": "Quali Paesi fanno più ricerca e quali lavorano insieme.",
  "Papers by country and international co-authorship, by author affiliation.": "Articoli per Paese e coautorialità internazionale, in base all'affiliazione degli autori.",
  "Countries parsed from affiliation strings; multinational papers count once per country. Collaboration = country pairs on the same paper.": "Paesi estratti dalle stringhe di affiliazione; gli articoli multinazionali contano una volta per Paese. Collaborazione = coppie di Paesi nello stesso articolo.",
  "Where research is still thin.": "Dove la ricerca è ancora scarsa.",
  "Body site × topic: where research is dense and where it is missing.": "Sede corporea × tema: dove la ricerca è fitta e dove manca.",
  "Paper counts per site × topic (multi-label regex). Low counts are not always gaps (missed classification or no biological link).": "Numero di articoli per sede × tema (espressioni regolari multi-etichetta). Pochi articoli non sono sempre lacune (classificazione mancata o nessun legame biologico).",
  "Collecting older papers one month at a time.": "Raccogliamo gli articoli più vecchi un mese alla volta.",
  "Progress of collecting a fixed number of papers per month.": "Avanzamento della raccolta di un numero fisso di articoli al mese.",
  "Monthly windows, page cap × page size per month, Europe PMC cursor paging. A sample, not a census.": "Finestre mensili, tetto di pagine × dimensione della pagina per mese, paginazione a cursore di Europe PMC. Un campione, non un censimento.",
  "The programs working behind the scenes. Green = fine, yellow = careful, red = stopped.": "I programmi che lavorano dietro le quinte. Verde = tutto bene, giallo = attenzione, rosso = fermo.",
  "Status of the background programs. Green = healthy, yellow = caution, red = stopped.": "Stato dei programmi in background. Verde = in salute, giallo = attenzione, rosso = fermo.",
  "Derived from each job's latest status file and event age; refreshed every 30 s.": "Derivato dall'ultimo file di stato di ogni processo e dall'età degli eventi; aggiornato ogni 30 s.",
  "Comparing our results with the lab's big knowledge map, MINERVA.": "Confrontiamo i nostri risultati con la grande mappa della conoscenza del laboratorio, MINERVA.",
  "MINERVA, the lab's knowledge graph, was copied once in full for comparison; we do not connect to it day to day.": "MINERVA, il grafo della conoscenza del laboratorio, è stato copiato una volta per intero per il confronto; non ci colleghiamo a esso giorno per giorno.",
  "MINERVA main-graph Microbe→Disease relations mapped to our classes by regex. Evidence-row counts can differ from unique biological relations.": "Relazioni Microbe→Disease del grafo principale di MINERVA associate alle nostre classi tramite espressioni regolari. Il numero di righe di evidenza può differire dal numero di relazioni biologiche univoche.",
  "Paper counts, citations and attention are hints of influence, not evidence of effect, causation or research quality. Affiliations are strings as printed in papers, not verified institution identifiers. Without ORCID, identical names are treated as one person.": "Numero di articoli, citazioni e attenzione sono indizi di influenza, non prove di effetto, causalità o qualità della ricerca. Le affiliazioni sono stringhe così come stampate negli articoli, non identificativi istituzionali verificati. Senza ORCID, nomi identici sono trattati come una sola persona.",
  "Source ↗": "Fonte ↗",
  "No summary": "Nessun riassunto",
  "Papers": "Articoli",
  "Citations": "Citazioni",
  "Corpus h-index": "Indice h nel corpus",
  "Active last year": "Attivi nell'ultimo anno",
  "Most prolific researchers": "Ricercatori più prolifici",
  "Switch the order with the buttons and click a name.": "Cambia l'ordine con i pulsanti e clicca un nome.",
  "Change the ranking; click a row for affiliation, recent papers and co-authors.": "Cambia la classifica; clicca una riga per affiliazione, articoli recenti e coautori.",
  "The h-index uses only papers and citations in this corpus, not whole careers.": "L'indice h usa solo articoli e citazioni di questo corpus, non l'intera carriera.",
  "Researcher · affiliation": "Ricercatore · affiliazione",
  "Country": "Paese",
  "Cites": "Citaz.",
  "Last yr": "Ult. anno",
  "Co-authorship constellation": "Costellazione delle coautorialità",
  "Top 200 · star size = papers · lines = shared papers · colour = country": "Primi 200 · dimensione della stella = articoli · linee = articoli in comune · colore = Paese",
  "Most active institutions": "Istituzioni più attive",
  "By affiliation strings as printed (spelling variants of one institution are not merged yet)": "In base alle stringhe di affiliazione così come stampate (le varianti di grafia della stessa istituzione non sono ancora unite)",
  "Institution": "Istituzione",
  "affiliation not given": "affiliazione non indicata",
  "Latest affiliation": "Affiliazione più recente",
  "citations": "citazioni",
  "corpus h-index": "indice h nel corpus",
  "last year": "ultimo anno",
  "Frequent co-authors": "Coautori frequenti",
  "Recent papers and findings": "Articoli e scoperte recenti",
  "Paper lists are precomputed for the top 200 only.": "Gli elenchi di articoli sono precalcolati solo per i primi 200.",
  "not given": "non indicato",
  "other": "altro",
  "Shared papers": "Articoli in comune",
  "Mechanism · topic": "Meccanismo · tema",
  "Condition": "Patologia",
  "Research-interest radar": "Radar dell'interesse di ricerca",
  "Comparing": "Confronto",
  "share of all papers in each window": "quota di tutti gli articoli in ogni finestra",
  "All topics": "Tutti i temi",
  "Topic": "Tema",
  "Kind": "Tipo",
  "Last 3 mo": "Ult. 3 mesi",
  "Interest": "Interesse",
  "Median cites": "Citaz. mediane",
  "By month": "Per mese",
  "Interest change %": "Variazione d'interesse %",
  "Recent findings by topic": "Scoperte recenti per tema",
  "AI summaries checked against the source sentence · pick a topic": "Riassunti dell'IA verificati sulla frase della fonte · scegli un tema",
  "All": "Tutti",
  "Gaps the authors name themselves": "Lacune indicate dagli stessi autori",
  "Papers by country": "Articoli per Paese",
  "Top international collaborations": "Principali collaborazioni internazionali",
  "Country ↔ country": "Paese ↔ Paese",
  "Leading institutions by country": "Istituzioni di punta per Paese",
  "papers": "articoli",
  "authors": "autori",
  "Airway": "Vie respiratorie",
  "Gut": "Intestino",
  "Multi-site": "Più sedi",
  "Oral": "Cavo orale",
  "Skin": "Pelle",
  "Urogenital": "Apparato urogenitale",
  "Brain": "Cervello",
  "Cancer": "Cancro",
  "Diagnosis": "Diagnosi",
  "Diet": "Dieta",
  "Immunity": "Immunità",
  "Intervention": "Intervento",
  "Metabolites": "Metaboliti",
  "Omics": "Omiche",
  "Body site × topic map": "Mappa sede corporea × tema",
  "Paler = less research": "Più chiaro = meno ricerca",
  "Shared premises not yet confirmed": "Premesse condivise non ancora confermate",
  "Next actions M-SAGE suggests": "Prossime azioni suggerite da M-SAGE",
  "No MINERVA comparison yet.": "Nessun confronto con MINERVA per ora.",
  "IBD": "MICI",
  "Colorectal cancer": "Cancro del colon-retto",
  "Obesity": "Obesità",
  "Diabetes": "Diabete",
  "Fatty liver": "Fegato grasso",
  "Atherosclerosis": "Aterosclerosi",
  "Chronic kidney disease": "Malattia renale cronica",
  "Parkinson's": "Parkinson",
  "Alzheimer's": "Alzheimer",
  "Depression": "Depressione",
  "Autism": "Autismo",
  "Asthma": "Asma",
  "Psoriasis": "Psoriasi",
  "Periodontitis": "Parodontite",
  "C. difficile infection": "Infezione da C. difficile",
  "Bacterial vaginosis": "Vaginosi batterica",
  "Condition ↔ microbe network (MINERVA)": "Rete patologie ↔ microbi (MINERVA)",
  "Conditions (orange) and their most linked microbes (green = mostly increase, red = mostly decrease) · line width = evidence rows": "Patologie (arancione) e i microbi più collegati (verde = soprattutto aumento, rosso = soprattutto diminuzione) · spessore della linea = righe di evidenza",
  "Hub microbes (most condition links)": "Microbi hub (più legami con patologie)",
  "Top microbes by condition": "Microbi principali per patologia",
  "MINERVA graph contents": "Contenuto dei grafi di MINERVA",
  "Captured": "Acquisito",
  "Evidence rows can differ from unique biological relations.": "Le righe di evidenza possono differire dalle relazioni biologiche univoche.",
  "Evidence rows": "Righe di evidenza",
  "evidence": "evidenze",
  "No collection progress yet.": "Nessun avanzamento della raccolta per ora.",
  "Filling in past papers": "Recupero degli articoli passati",
  "months done · up to": "mesi completati · fino a",
  "papers a month": "articoli al mese",
  "Approximate papers by year": "Articoli approssimativi per anno",
  "Agent orchestra": "Orchestra di agenti",
  "Recent collection cycles": "Cicli di raccolta recenti",
  "Time": "Ora",
  "State": "Stato",
  "Pages": "Pagine",
  "Range · reason": "Intervallo · motivo",
  "higher in condition": "più alto nella patologia",
  "lower in condition": "più basso nella patologia",
  "mixed": "discordante",
  "increase": "aumento",
  "decrease": "diminuzione",
  "no difference": "nessuna differenza",
  "Knowledge map": "Mappa della conoscenza",
  "Consensus · debate": "Consenso · dibattito",
  "Microbe signatures": "Firme microbiche",
  "Rising · fading": "In crescita · in calo",
  "Gaps · next studies": "Lacune · prossimi studi",
  "New vs MINERVA": "Novità rispetto a MINERVA",
  "Papers read": "Articoli letti",
  "Microbe relations (evidence sentences)": "Relazioni microbiche (frasi di evidenza)",
  "Microbe nodes": "Nodi microbici",
  "Gap and limitation statements": "Dichiarazioni di lacune e limiti",
  "Relations passing the AI judge and group check": "Relazioni che superano il giudizio dell'IA e il controllo dei gruppi",
  "Machine-extracted from abstracts and evidence quotes, not checked by people · increase/decrease is mostly condition vs control relative abundance, not causation.": "Estratto automaticamente da abstract e citazioni di evidenza, non controllato da persone · aumento/diminuzione è per lo più l'abbondanza relativa nella patologia rispetto ai controlli, non causalità.",
  "Yellow circles are illnesses, green circles are germs. Red lines mean 'more in that illness', blue lines 'less'. Click a circle.": "I cerchi gialli sono malattie, quelli verdi sono batteri. Le linee rosse vogliono dire \"di più in quella malattia\", quelle blu \"di meno\". Clicca un cerchio.",
  "Top genera and conditions, edges with ≥4 votes · width ∝ √evidence sentences · contested = ≥30% opposite · the same graph is queryable in the local Neo4j (Taxon, Disease, ASSOCIATED)": "Generi e patologie principali, archi con ≥4 voti · spessore ∝ √frasi di evidenza · conteso = ≥30% opposte · lo stesso grafo si può interrogare nel Neo4j locale (Taxon, Disease, ASSOCIATED)",
  "Microbe ↔ condition knowledge map": "Mappa della conoscenza microbi ↔ patologie",
  "Click a node": "Clicca un nodo",
  "Shows how many sentences report each direction.": "Mostra quante frasi riportano ciascuna direzione.",
  "Evidence": "Evidenze",
  "Microbe": "Microbo",
  "Microbes reported with this condition": "Microbi riportati con questa patologia",
  "Conditions this microbe is reported in": "Patologie in cui è riportato questo microbo",
  "evidence sentences": "frasi di evidenza",
  "Lower ◀ ▶ higher": "Più basso ◀ ▶ più alto",
  "group-checked": "gruppi verificati",
  "no condition": "patologia assente",
  "absent (new link)": "assente (nuovo legame)",
  "opposite": "opposta",
  "same direction": "stessa direzione",
  "Germs and illnesses that many papers agree on. Click a row to read the real sentences.": "Batteri e malattie su cui molti articoli sono d'accordo. Clicca una riga per leggere le frasi vere.",
  "Microbe–condition pairs where ≥60% of ≥5 sentences report the same direction · click a row for the evidence": "Coppie microbo–patologia in cui ≥60% di ≥5 frasi riporta la stessa direzione · clicca una riga per le evidenze",
  "Score = (inc−dec)/(inc+dec+null), |score| ≥ 0.6, ≥5 sentences, phylum excluded · group-checked = sentences whose comparison groups the AI judge confirmed": "Punteggio = (aum−dim)/(aum+dim+nulle), |punteggio| ≥ 0.6, ≥5 frasi, phylum escluso · gruppi verificati = frasi in cui il giudizio dell'IA ha confermato i gruppi di confronto",
  "Some papers say 'more', others say 'less'. No answer yet.": "Alcuni articoli dicono \"di più\", altri \"di meno\". Ancora non c'è una risposta.",
  "Pairs where increase and decrease each make up ≥30% · open questions": "Coppie in cui aumento e diminuzione valgono ciascuno ≥30% · domande aperte",
  "Debate = minority direction share ≥ 0.3 · whether subgroups or methods split it is in signatures and the automatic follow-ups": "Dibattito = quota della direzione minoritaria ≥ 0.3 · se a dividerlo siano sottogruppi o metodi lo si vede nelle firme e negli approfondimenti automatici",
  "Relations papers agree on": "Relazioni su cui gli articoli concordano",
  "Relations papers disagree on": "Relazioni su cui gli articoli non concordano",
  "Evidence sentences": "Frasi di evidenza",
  "Pick a pair in a table to see the quoted source sentences here.": "Scegli una coppia in una tabella per vedere qui le frasi citate della fonte.",
  "Example sentences are precomputed for the top 40 only.": "Le frasi di esempio sono precalcolate solo per le prime 40.",
  "Red cells: the germ goes up in that illness. Blue cells: it goes down.": "Celle rosse: il batterio aumenta in quella malattia. Celle blu: diminuisce.",
  "Red = mostly reported higher in the condition · blue = mostly lower · number = evidence sentences": "Rosso = per lo più riportato più alto nella patologia · blu = per lo più più basso · numero = frasi di evidenza",
  "Colour = direction score (−1 lower … +1 higher), number = evidence sentences · top 30 genera × top 22 conditions": "Colore = punteggio di direzione (−1 più basso … +1 più alto), numero = frasi di evidenza · primi 30 generi × prime 22 patologie",
  "Microbe × condition direction map": "Mappa delle direzioni microbo × patologia",
  "Microbes shared across conditions": "Microbi comuni a più patologie",
  "Microbes with a consistent direction in 3+ conditions · mostly blue = health-marker candidate, mostly red = disease-marker candidate": "Microbi con direzione coerente in 3+ patologie · per lo più blu = candidato marcatore di salute, per lo più rosso = candidato marcatore di malattia",
  "conditions": "patologie",
  "Conditions": "Patologie",
  "Microbes": "Microbi",
  "Interventions": "Interventi",
  "Methods": "Metodi",
  "Body sites": "Sedi corporee",
  "Topics mentioned more now than before. ×2 means twice as often.": "Argomenti citati più adesso che in passato. ×2 vuol dire il doppio delle volte.",
  "Share of mentions in the last 2 years ÷ 3–5 years ago · yearly collection is capped, so shares are compared": "Quota di menzioni negli ultimi 2 anni ÷ 3–5 anni fa · la raccolta annuale ha un tetto, quindi si confrontano le quote",
  "Growth = share(last 2 y) / share(3–5 y ago) with a minimum paper count · collection is recency-skewed; not absolute volume": "Crescita = quota(ultimi 2 anni) / quota(3–5 anni fa) con un numero minimo di articoli · la raccolta è sbilanciata verso gli anni recenti; non è un volume assoluto",
  "Rising": "In crescita",
  "Fading": "In calo",
  "Largest falls in share, same measure": "Cali di quota più forti, stessa misura",
  "Share by year (top rising)": "Quota per anno (principali temi in crescita)",
  "Researchers leading rising topics (last 3 years)": "Ricercatori alla guida dei temi in crescita (ultimi 3 anni)",
  "recent": "recente",
  "before": "prima",
  "Illnesses with lots of interest but mixed answers and many unknowns come first.": "Prima vengono le malattie con tanto interesse ma risposte discordanti e molte cose ancora sconosciute.",
  "Score combining rising interest, conflicting papers, limitations the authors state and links new to MINERVA · a pointer, not a verdict": "Punteggio che combina interesse crescente, articoli in contrasto, limiti dichiarati dagli autori e legami nuovi rispetto a MINERVA · un'indicazione, non un verdetto",
  "Score = 2·ln(growth) + 1.5·ln(1+contested pairs) + 0.8·ln(1+limitations) + ln(1+not in MINERVA) − 0.3·ln(1+papers) · heuristic, unvalidated weights": "Punteggio = 2·ln(crescita) + 1.5·ln(1+coppie contese) + 0.8·ln(1+limiti) + ln(1+assenti in MINERVA) − 0.3·ln(1+articoli) · pesi euristici, non validati",
  "What to study next (automatic priority)": "Cosa studiare dopo (priorità automatica)",
  "Limitations authors state, by condition": "Limiti dichiarati dagli autori, per patologia",
  "Limitation and gap sentences grouped by theme · number = papers": "Frasi di limite e di lacuna raggruppate per tema · numero = articoli",
  "Most frequent limitations": "Limiti più frequenti",
  "interest": "interesse",
  "conflicts": "contrasti",
  "limitations": "limiti",
  "new links": "nuovi legami",
  "To fill": "Da colmare",
  "Microbes with split results": "Microbi con risultati divergenti",
  "Newly emerging links": "Legami emergenti",
  "examples": "esempi",
  "MINERVA microbe→condition relations": "Relazioni microbo→patologia di MINERVA",
  "Our consensus relations pointing the same way as MINERVA": "Nostre relazioni di consenso nella stessa direzione di MINERVA",
  "Links not in MINERVA": "Legami assenti in MINERVA",
  "Opposite-direction links": "Legami di direzione opposta",
  "Our classes with no MINERVA condition": "Nostre classi senza patologia corrispondente in MINERVA",
  "Links MINERVA does not have yet": "Legami che MINERVA non ha ancora",
  "Links our papers show that MINERVA does not have yet.": "Legami che i nostri articoli mostrano e che MINERVA non ha ancora.",
  "≥3 papers in our corpus agree · absent from MINERVA's microbe→condition relations · click a row for evidence": "≥3 articoli del nostro corpus concordano · assenti dalle relazioni microbo→patologia di MINERVA · clicca una riga per le evidenze",
  "Condition names are mapped automatically by regex; some may be naming differences and need review.": "I nomi delle patologie sono associati automaticamente tramite espressioni regolari; alcuni casi possono essere differenze di denominazione e vanno verificati.",
  "Links opposite to MINERVA": "Legami opposti a MINERVA",
  "New papers point the other way from existing knowledge · candidates for review": "I nuovi articoli vanno nella direzione opposta rispetto alle conoscenze esistenti · candidati alla revisione",
  "← Cockpit": "← Cruscotto",
  "Knowledge graph as of": "Grafo della conoscenza aggiornato al",
  "release": "versione",
  "rebuilt every 3 hours": "ricostruito ogni 3 ore",
  "All jobs running": "Tutti i processi attivi",
  " · updates every 30 s": " · aggiornamento ogni 30 s",
  "Analysis as of": "Analisi aggiornata al",
  "No knowledge graph yet": "Grafo della conoscenza non ancora disponibile",
  "Could not load the data": "Impossibile caricare i dati",
  "Immunity & inflammation": "Immunità e infiammazione",
  "Microbial metabolism": "Metabolismo microbico",
  "Diversity & dysbiosis": "Diversità e disbiosi",
  "Antibiotics & resistance": "Antibiotici e resistenza",
  "Barrier & permeability": "Barriera e permeabilità",
  "Probiotics": "Probiotici",
  "Short-chain fatty acids": "Acidi grassi a catena corta",
  "Prebiotics & fibre": "Prebiotici e fibre",
  "Bile acids": "Acidi biliari",
  "Microbiota transplant": "Trapianto di microbiota",
  "Infection": "Infezione",
  "Cardiovascular": "Cardiovascolare",
  "Liver disease": "Malattie del fegato",
  "Depression & anxiety": "Depressione e ansia",
  "Asthma & allergy": "Asma e allergie",
  "Periodontal & caries": "Parodontite e carie",
  "Alzheimer's & cognition": "Alzheimer e cognizione",
  "Skin disease": "Malattie della pelle",
  "Kidney disease": "Malattie renali",
  "Urogenital disease": "Malattie urogenitali",
  "MINERVA": "MINERVA",
  "Cockpit": "Cruscotto",
  "One-page story": "Storia in una pagina",
  "IBS": "IBS",
  "Celiac disease": "Celiachia",
  "Gastric cancer": "Cancro gastrico",
  "Liver cancer": "Cancro del fegato",
  "Pancreatic cancer": "Cancro del pancreas",
  "Breast cancer": "Cancro della mammella",
  "Lung cancer": "Cancro del polmone",
  "Oral/head-neck cancer": "Cancro orale/testa-collo",
  "Prostate cancer": "Cancro della prostata",
  "Cervical lesions/HPV": "Lesioni cervicali/HPV",
  "Cancer immunotherapy": "Immunoterapia oncologica",
  "Type 2 diabetes": "Diabete di tipo 2",
  "Type 1 diabetes": "Diabete di tipo 1",
  "Gestational diabetes": "Diabete gestazionale",
  "Metabolic syndrome": "Sindrome metabolica",
  "Cirrhosis": "Cirrosi",
  "Cardiovascular disease": "Malattie cardiovascolari",
  "Hypertension": "Ipertensione",
  "Stroke": "Ictus",
  "Parkinson's disease": "Malattia di Parkinson",
  "Alzheimer's/cognitive decline": "Alzheimer/declino cognitivo",
  "Multiple sclerosis": "Sclerosi multipla",
  "Anxiety": "Ansia",
  "Schizophrenia": "Schizofrenia",
  "ADHD": "ADHD",
  "Allergy/atopy": "Allergia/atopia",
  "COPD": "BPCO",
  "Cystic fibrosis": "Fibrosi cistica",
  "COVID-19": "COVID-19",
  "HIV": "HIV",
  "Sepsis/critical illness": "Sepsi/malattia critica",
  "H. pylori infection": "Infezione da H. pylori",
  "Urinary tract infection": "Infezione delle vie urinarie",
  "Preterm birth/neonatal": "Parto pretermine/neonatale",
  "PCOS": "PCOS",
  "Endometriosis/infertility": "Endometriosi/infertilità",
  "Dental caries": "Carie dentale",
  "Atopic dermatitis/acne": "Dermatite atopica/acne",
  "Rheumatoid arthritis": "Artrite reumatoide",
  "Lupus": "Lupus",
  "Spondyloarthritis": "Spondiloartrite",
  "Osteoporosis": "Osteoporosi",
  "Gout": "Gotta",
  "Aging/frailty": "Invecchiamento/fragilità",
  "Malnutrition/stunting": "Malnutrizione/arresto della crescita",
  "Airway & lung": "Vie aeree e polmoni",
  "Vaginal & reproductive": "Vagina e apparato riproduttivo",
  "Urinary": "Vie urinarie",
  "Breast milk": "Latte materno",
  "Blood & tumour": "Sangue e tumore",
  "Small samples": "Campioni piccoli",
  "Causality / mechanism unproven": "Causalità / meccanismo non dimostrati",
  "Cross-sectional only": "Solo studi trasversali",
  "Limited population diversity": "Diversità della popolazione limitata",
  "Needs external validation": "Serve una validazione esterna",
  "Low taxonomic resolution": "Bassa risoluzione tassonomica",
  "Diet & drug confounding": "Confondimento da dieta e farmaci",
  "Needs clinical trials": "Servono studi clinici",
  "Needs functional / multi-omics": "Servono analisi funzionali / multi-omiche",
  "Methods not standardized": "Metodi non standardizzati",
  "Animal results need human confirmation": "Risultati sugli animali da confermare nell'uomo",
  "Other": "Altro",
  "Synbiotics": "Simbiotici",
  "Postbiotics": "Postbiotici",
  "Fecal microbiota transplant": "Trapianto di microbiota fecale",
  "Antibiotics": "Antibiotici",
  "Diet interventions": "Interventi dietetici",
  "Exercise": "Esercizio fisico",
  "Phage therapy": "Terapia fagica",
  "Metformin": "Metformina",
  "Proton pump inhibitors": "Inibitori di pompa protonica",
  "Bariatric surgery": "Chirurgia bariatrica",
  "Breastfeeding": "Allattamento al seno",
  "Caesarean birth": "Parto cesareo",
  "Other treatments": "Altri trattamenti",
  "16S amplicon": "Amplicone 16S",
  "Shotgun metagenomics": "Metagenomica shotgun",
  "Metatranscriptomics": "Metatrascrittomica",
  "Metabolomics": "Metabolomica",
  "Multi-omics": "Multi-omica",
  "Culturomics & isolation": "Culturomica e isolamento",
  "Mendelian randomization": "Randomizzazione mendeliana",
  "Randomized trials": "Studi randomizzati",
  "Machine learning & AI": "Apprendimento automatico e IA",
  "Longitudinal cohorts": "Coorti longitudinali",
  "Single-cell & spatial": "Single-cell e spaziale",
  "Strain-level analysis": "Analisi a livello di ceppo",
  "Virome & mycobiome": "Viroma e micobioma",
  "Butyrate": "Butirrato",
  "Propionate": "Propionato",
  "TMAO": "TMAO",
  "Tryptophan & indoles": "Triptofano e indoli",
  "LPS / endotoxin": "LPS / endotossina",
  "Polyphenols": "Polifenoli",
  "Vitamins": "Vitamine",
  "GABA & neurotransmitters": "GABA e neurotrasmettitori",
  "Branched-chain amino acids": "Aminoacidi a catena ramificata",
  "Cytokines": "Citochine",
  /* insight lab: evidence sections (reversal, quality, clinic, severity) */
  "'No difference' share by condition": "Quota di 'nessuna differenza' per patologia",
  "A hypothesis: two literatures joined, not evidence that this intervention works in this condition.": "Un'ipotesi: due letterature messe insieme, non una prova che questo intervento funzioni in questa patologia.",
  "Abstracts rarely report 'no difference'. A low null share signals publication and reporting bias.": "Gli abstract riportano raramente 'nessuna differenza'. Una quota bassa di risultati nulli segnala un bias di pubblicazione e di segnalazione.",
  "Acquired / licensed": "Acquisito / in licenza",
  "Active": "Attiva",
  "Active and closed companies · the text on closed companies is the lesson": "Aziende attive e chiuse · il testo sulle aziende chiuse è la lezione",
  "Active, not recruiting": "Attivo, reclutamento chiuso",
  "Animal": "Animale",
  "Animal edges": "Archi da studi animali",
  "Animal only": "Solo negli animali",
  "Animal → human: does the intervention effect hold in people?": "Dall'animale all'uomo: l'effetto dell'intervento si conferma nelle persone?",
  "Animal ≥3 papers and ratio ≥2; human confirmation ≥2 papers · human = no animal or laboratory model named in the title or sentence": "Animali ≥3 articoli e rapporto ≥2; conferma nell'uomo ≥2 articoli · uomo = nessun modello animale o di laboratorio citato nel titolo o nella frase",
  "Approval": "Approvazione",
  "Approvals · readouts · deals · closures · financings": "Approvazioni · risultati · accordi · chiusure · finanziamenti",
  "Approved": "Approvato",
  "As of": "Aggiornato al",
  "Available": "Disponibile",
  "Background statement": "Affermazione di contesto",
  "Based on trial registrations, not results or efficacy. Quadrant cut-offs are relative.": "Basato sulle registrazioni degli studi, non sui risultati né sull'efficacia. Le soglie dei quadranti sono relative.",
  "By kind of evidence sentence · lower = 'no difference' results appear less in abstracts": "Per tipo di frase di evidenza · più basso = i risultati 'nessuna differenza' compaiono meno negli abstract",
  "Candidate": "Candidato",
  "Candidate list": "Elenco dei candidati",
  "Click a row for the evidence": "Clicca una riga per vedere le evidenze",
  "Click a row for the summary and sources": "Clicca una riga per il riassunto e le fonti",
  "Clinical trials (ClinicalTrials.gov)": "Studi clinici (ClinicalTrials.gov)",
  "Closed": "Chiusa",
  "Closure": "Chiusura",
  "Collecting microbiome trials from ClinicalTrials.gov. The first results appear here after the next weekly fetch.": "Stiamo raccogliendo gli studi sul microbioma da ClinicalTrials.gov. I primi risultati compariranno qui dopo il prossimo aggiornamento settimanale.",
  "Companies, and lessons from closures": "Aziende e lezioni dalle chiusure",
  "Company": "Azienda",
  "Completed": "Completato",
  "Condition side": "Lato patologia",
  "Conditions with at least this many microbe–condition edges": "Patologie con almeno questo numero di archi microbo–patologia",
  "Conditions with most edges first": "Prima le patologie con più archi",
  "Conditions with strong evidence but few trials are 'opportunities', both high is 'crowded', many trials on weak evidence is 'speculative'. Below: industry records whose sources a person checked.": "Le patologie con evidenze solide ma pochi studi sono 'opportunità', entrambi alti è 'affollato', molti studi su evidenze deboli è 'speculativo'. Sotto: voci del settore industriale le cui fonti sono state verificate da una persona.",
  "Conditions with the most registered trials": "Patologie con più studi registrati",
  "Confirmed in humans": "Confermato nell'uomo",
  "Consensus relations for this condition (in brackets: independently replicated)": "Relazioni di consenso per questa patologia (tra parentesi: replicate in modo indipendente)",
  "Consensus relations independently replicated": "Relazioni di consenso replicate in modo indipendente",
  "Consumer product": "Prodotto di consumo",
  "Counts whether abstract sentences name a species or strain. Actual analysis resolution may differ.": "Conta se le frasi degli abstract nominano una specie o un ceppo. La risoluzione effettiva dell'analisi può essere diversa.",
  "Crowded": "Affollato",
  "Curated industry entries marked verified only. Not investment or product advice.": "Solo voci del settore curate e contrassegnate come verificate. Non è un consiglio di investimento né sui prodotti.",
  "Curator note": "Nota del curatore",
  "Date": "Data",
  "Deal": "Accordo",
  "Debates where both directions come from ≥2 groups": "Dibattiti in cui entrambe le direzioni provengono da ≥2 gruppi",
  "Diagnostics": "Diagnostica",
  "Discontinued": "Interrotto",
  "Early": "Iniziale",
  "Early (phase 1)": "Iniziale (fase 1)",
  "Early phase 1": "Fase 1 iniziale",
  "Enrolling by invitation": "Arruolamento su invito",
  "Evidence = replicated consensus pairs + reversal candidates; more contested pairs than that excludes 'strong' · trial activity = active + completed trials weighted (phase 1/NA 1, phase 2 = 2, phase 3/4 = 3) · cut-offs = max(minimum, median of non-zero values)": "Evidenza = coppie di consenso replicate + candidati di inversione; se le coppie contestate sono di più, l'evidenza non è 'solida' · attività degli studi = studi attivi + completati, ponderati (fase 1/NA 1, fase 2 = 2, fase 3/4 = 3) · soglie = max(minimo, mediana dei valori non nulli)",
  "Evidence quality": "Qualità delle evidenze",
  "Evidence quality: how far can these results be trusted?": "Qualità delle evidenze: quanto ci si può fidare di questi risultati?",
  "Evidence × trial-activity quadrant": "Quadrante evidenze × attività degli studi",
  "Fecal microbiota": "Microbiota fecale",
  "Financing": "Finanziamento",
  "Flags": "Segnalazioni",
  "From evidence to clinic": "Dalle evidenze alla clinica",
  "Germs that are more common in people who are sicker, germs that go with a higher or lower risk of getting ill, and substances often mentioned with them. All of this means 'found together', not 'causes'.": "Batteri più comuni nelle persone più malate, batteri legati a un rischio più alto o più basso di ammalarsi, e sostanze spesso citate insieme a loro. Tutto questo significa 'trovati insieme', non 'causano'.",
  "Good evidence means several unrelated teams found the same thing over several years. Here we check how much evidence is like that, whether 'no difference' results go missing, and whether animal results hold in people.": "Una buona evidenza significa che diversi gruppi indipendenti hanno trovato la stessa cosa nel corso di più anni. Qui controlliamo quante evidenze sono così, se i risultati 'nessuna differenza' vanno persi e se i risultati sugli animali valgono anche per le persone.",
  "Herbal medicine / TCM": "Fitoterapia / medicina tradizionale cinese",
  "Human: same / opposite": "Uomo: stessa direzione / opposta",
  "Hypotheses joining two literatures: the condition papers (microbe lower/higher in the condition) and the intervention papers (the intervention raises/lowers that microbe). Click a row for both sides' evidence. 'Already tested' counts intervention papers that also mention the condition.": "Ipotesi che uniscono due letterature: gli articoli sulla patologia (microbo più basso/più alto nella patologia) e quelli sull'intervento (l'intervento aumenta/riduce quel microbo). Clicca una riga per le evidenze di entrambi i lati. 'Già testato' conta gli articoli sull'intervento che citano anche la patologia.",
  "Hypothesis generator only. Two separate literatures are joined; this is not a treatment recommendation.": "Solo un generatore di ipotesi. Vengono unite due letterature distinte; non è una raccomandazione terapeutica.",
  "In condition": "Nella patologia",
  "In some illnesses a germ drops too low or grows too much. Other papers say some treatment (probiotics, diet…) raises or lowers that germ. We join the two into ideas worth testing. These are not treatments.": "In alcune malattie un batterio scende troppo o cresce troppo. Altri articoli dicono che un trattamento (probiotici, dieta…) fa salire o scendere quel batterio. Mettiamo insieme le due cose per avere idee da provare. Non sono cure.",
  "Independent author groups (no shared author) and years reported": "Gruppi di autori indipendenti (nessun autore in comune) e anni di pubblicazione",
  "Independent groups = connected components of papers sharing an author (ORCID or name); name-only hubs linking >50 papers connect only with ≥2 shared names · replicated: ≥3 groups over ≥3 years · null share = null-direction sentences / all · per condition only with ≥50 edges": "Gruppi indipendenti = componenti connesse di articoli che condividono un autore (ORCID o nome); i nomi-hub senza ORCID che collegano >50 articoli uniscono solo con ≥2 nomi in comune · replicato: ≥3 gruppi in ≥3 anni · quota nulla = frasi di direzione nulla / totale · per patologia solo con ≥50 archi",
  "Independent groups are clusters of papers sharing no author. Name matching is imperfect, so counts are approximate.": "I gruppi indipendenti sono insiemi di articoli che non condividono alcun autore. L'abbinamento dei nomi è imperfetto, quindi i conteggi sono approssimativi.",
  "Indication": "Indicazione",
  "Industry record": "Registro industriale",
  "Industry record: entries with checked sources": "Registro industriale: voci con fonti verificate",
  "Intervention changes a microbe": "Un intervento modifica un microbo",
  "Intervention papers that also mention this condition": "Articoli sull'intervento che citano anche questa patologia",
  "Intervention side": "Lato intervento",
  "Intervention · effect": "Intervento · effetto",
  "Intervention → microbe effects with ≥3 same-direction animal papers, compared with human sentences": "Effetti intervento → microbo con ≥3 articoli su animali nella stessa direzione, confrontati con le frasi sull'uomo",
  "Is what papers found turning into real treatments? Trials running in hospitals, products already approved, and lessons from companies that closed.": "Quello che gli articoli hanno trovato sta diventando una cura vera? Studi in corso negli ospedali, prodotti già approvati e lezioni dalle aziende che hanno chiuso.",
  "Latest registered trials": "Ultimi studi registrati",
  "Lesson": "Lezione",
  "Lift ×2 = the metabolite is mentioned twice as often in papers on this microbe and condition as in all papers on the condition": "Lift ×2 = il metabolita è citato due volte più spesso negli articoli su questo microbo e questa patologia che in tutti gli articoli sulla patologia",
  "Live biotherapeutic": "Bioterapeutico vivo",
  "Mechanism triangles: microbe – metabolite – condition (co-mention)": "Triangoli di meccanismo: microbo – metabolita – patologia (co-menzione)",
  "Metabolites co-mentioned in the same abstracts. Not a measured pathway.": "Metaboliti citati insieme negli stessi abstract. Non è una via metabolica misurata.",
  "Microbes associated with disease risk": "Microbi associati al rischio di malattia",
  "Microbes that differ in the worse subgroup": "Microbi che differiscono nel sottogruppo più grave",
  "Microbe–condition association": "Associazione microbo–patologia",
  "Milestone": "Tappa",
  "Most animal sentences are filtered out upstream, so animal evidence is undercounted. Human confirmation is abstract-level.": "La maggior parte delle frasi su animali viene filtrata a monte, quindi le evidenze sugli animali sono sottostimate. La conferma nell'uomo è a livello di abstract.",
  "N/A": "N/D",
  "Next-generation probiotics": "Probiotici di nuova generazione",
  "No candidate matches the filter.": "Nessun candidato corrisponde al filtro.",
  "No candidate passes the thresholds yet.": "Nessun candidato supera ancora le soglie.",
  "No verified industry entries yet.": "Ancora nessuna voce industriale verificata.",
  "Not applicable": "Non applicabile",
  "Not yet recruiting": "Non ancora in reclutamento",
  "Opportunity": "Opportunità",
  "Opposite in humans": "Opposto nell'uomo",
  "Opposite in humans, or animal only": "Opposto nell'uomo, o solo negli animali",
  "Oral hygiene & periodontal care": "Igiene orale e cure parodontali",
  "Per year: share of microbe relation sentences naming a species, and naming a strain": "Per anno: quota delle frasi di relazione microbica che nominano una specie e che nominano un ceppo",
  "Phage": "Fagi",
  "Phase": "Fase",
  "Phase 1": "Fase 1",
  "Phase 2": "Fase 2",
  "Phase 3": "Fase 3",
  "Phase 4": "Fase 4",
  "Phase 3–4": "Fase 3–4",
  "Pick a candidate in the list.": "Scegli un candidato dall'elenco.",
  "Pipeline by phase": "Pipeline per fase",
  "Plant extracts & polysaccharides": "Estratti vegetali e polisaccaridi",
  "Prebiotic / glycan": "Prebiotico / glicano",
  "Products through regulatory review": "Prodotti passati per la valutazione regolatoria",
  "Publication bias: share of 'no difference' reports": "Bias di pubblicazione: quota di risultati 'nessuna differenza'",
  "Ranked by score · click a row for both sides' evidence": "Ordinati per punteggio · clicca una riga per le evidenze dei due lati",
  "Readout": "Risultati",
  "Recruiting": "In reclutamento",
  "Refusal": "Rifiuto",
  "Refused": "Rifiutato",
  "Relapse / remission": "Recidiva / remissione",
  "Replicated only": "Solo replicati",
  "Replication": "Replicazione",
  "Replication = independent author groups (no shared author) and the span of years · publication bias = share of 'no difference' reports · animal → human = whether an intervention effect seen in animals points the same way in human sentences · resolution = share of relations naming a species": "Replicazione = gruppi di autori indipendenti (nessun autore in comune) e arco di anni · bias di pubblicazione = quota di risultati 'nessuna differenza' · animale → uomo = se un effetto di un intervento visto negli animali va nella stessa direzione nelle frasi sull'uomo · risoluzione = quota di relazioni che nominano una specie",
  "Reported by ≥3 independent author groups over ≥3 years": "Riportato da ≥3 gruppi di autori indipendenti in ≥3 anni",
  "Resolution: share naming a species or strain": "Risoluzione: quota che nomina una specie o un ceppo",
  "Restore (raise a depleted taxon)": "Ripristinare (aumentare un taxon impoverito)",
  "Reversal candidates": "Candidati di inversione",
  "Reversal candidates independently replicated": "Candidati di inversione replicati in modo indipendente",
  "Reversal candidates: interventions that push a disease-shifted microbe back": "Candidati di inversione: interventi che riportano indietro un microbo alterato dalla malattia",
  "Risk and genetic-association sentences (including Mendelian randomization). Few studies each; not established causes.": "Frasi su rischio e associazione genetica (inclusa la randomizzazione mendeliana). Pochi studi per ciascuna; non sono cause accertate.",
  "Risk or genetic association": "Rischio o associazione genetica",
  "Score": "Punteggio",
  "Score combines the condition-side majority votes and ratio with the intervention-side majority papers and ratio (contested pairs ×0.5); phylum excluded; capped at 6 per condition, 5 per microbe, 60 overall · intervention side uses human-host sentences only · replicated = condition side ≥3 independent groups over ≥3 years and intervention side ≥2 groups": "Il punteggio combina voti e rapporto di maggioranza del lato patologia con articoli e rapporto di maggioranza del lato intervento (coppie contestate ×0,5); phylum escluso; massimo 6 per patologia, 5 per microbo, 60 in totale · il lato intervento usa solo frasi con ospite umano · replicato = lato patologia ≥3 gruppi indipendenti in ≥3 anni e lato intervento ≥2 gruppi",
  "Severity / stage": "Gravità / stadio",
  "Severity = microbes higher or lower in the worse subgroup (severe, non-responder, relapse, shorter survival) · risk = association with the risk of disease (including Mendelian randomization) · mechanisms = metabolites co-mentioned in the same abstracts (not a measured pathway)": "Gravità = microbi più alti o più bassi nel sottogruppo peggiore (grave, non responsivo, recidiva, sopravvivenza più breve) · rischio = associazione con il rischio di malattia (inclusa la randomizzazione mendeliana) · meccanismi = metaboliti citati insieme negli stessi abstract (non una via misurata)",
  "Severity and risk: ≥3 papers in one direction, ratio ≥2 · mechanism triangles: top 30 consensus pairs with ≥10 co-mentioning papers, metabolite ≥5 papers, lift = share within the pair ÷ share among all papers on the condition ≥1.5, at most 3 per pair": "Gravità e rischio: ≥3 articoli in una direzione, rapporto ≥2 · triangoli di meccanismo: prime 30 coppie di consenso con ≥10 articoli di co-menzione, metabolita ≥5 articoli, lift = quota nella coppia ÷ quota in tutti gli articoli sulla patologia ≥1,5, al massimo 3 per coppia",
  "Severity, risk and mechanisms: clues beyond association": "Gravità, rischio e meccanismi: indizi oltre l'associazione",
  "Severity, risk, mechanisms": "Gravità, rischio, meccanismi",
  "Species named": "Specie nominata",
  "Species-level share by condition": "Quota a livello di specie per patologia",
  "Speculative": "Speculativo",
  "Sponsor": "Promotore",
  "Start": "Inizio",
  "Status": "Stato",
  "Strain designated": "Ceppo indicato",
  "Subgroup (severity, response)": "Sottogruppo (gravità, risposta)",
  "Subgroup edges": "Archi di sottogruppo",
  "Suppress (lower an enriched taxon)": "Sopprimere (ridurre un taxon arricchito)",
  "Survival / prognosis": "Sopravvivenza / prognosi",
  "Suspended": "Sospeso",
  "Terminated": "Interrotto",
  "The intervention may itself contain this microbe (e.g. a Lactobacillus product); not necessarily evidence of reversal.": "L'intervento potrebbe contenere esso stesso questo microbo (ad es. un prodotto a base di Lactobacillus); non è necessariamente una prova di inversione.",
  "This analysis is not in the current data yet. It appears after the next knowledge-graph rebuild.": "Questa analisi non è ancora nei dati attuali. Comparirà dopo la prossima ricostruzione del grafo della conoscenza.",
  "Timeline (newest first)": "Cronologia (dal più recente)",
  "Title": "Titolo",
  "Too little human data": "Dati sull'uomo insufficienti",
  "Total": "Totale",
  "Treatment response": "Risposta al trattamento",
  "Trial activity": "Attività degli studi",
  "Trial phases by condition": "Fasi degli studi per patologia",
  "Unknown status": "Stato sconosciuto",
  "We counted whether effects seen in mice were also seen in people.": "Abbiamo contato se gli effetti visti nei topi si vedevano anche nelle persone.",
  "Which side is 'worse' (severe, non-responder, relapse) is inferred from sentence cues. Associations, not a prognostic tool.": "Quale lato sia 'peggiore' (grave, non responsivo, recidiva) è dedotto da indizi nella frase. Associazioni, non uno strumento prognostico.",
  "Withdrawn": "Ritirato",
  "active": "attivi",
  "administered?": "somministrato?",
  "already tested": "già testato",
  "animal": "animale",
  "bar = share, label = edges": "barra = quota, etichetta = archi",
  "cited share": "quota citata",
  "co-mentioning papers": "articoli di co-menzione",
  "completed": "completati",
  "consensus": "consenso",
  "contested": "contestato",
  "edges": "archi",
  "entries": "voci",
  "fetched": "raccolti",
  "groups": "gruppi",
  "higher in the condition": "più alto nella patologia",
  "higher risk": "rischio più alto",
  "higher when worse": "più alto quando più grave",
  "human": "uomo",
  "human papers": "articoli sull'uomo",
  "independent groups": "gruppi indipendenti",
  "journals": "riviste",
  "lower in the condition": "più basso nella patologia",
  "lower risk": "rischio più basso",
  "lower when worse": "più basso quando più grave",
  "may be the administered microbe": "potrebbe essere il microbo somministrato",
  "observational": "osservazionale",
  "registered trials": "studi registrati",
  "replicated": "replicato",
  "replicated consensus": "consenso replicato",
  "reversal": "inversione",
  "score": "punteggio",
  "score sum": "somma dei punteggi",
  "species level": "livello di specie",
  "strain designation = culture-collection number (DSM, ATCC, ...) or 'strain X' in the sentence": "indicazione del ceppo = numero di collezione di colture (DSM, ATCC, ...) o 'strain X' nella frase",
  "suspected-animal edges": "archi sospetti da animali",
  "top sponsors": "principali promotori",
  "trial activity": "attività degli studi",
  "trials": "studi",
  "unverified left out": "non verificate escluse",
  "vs": "contro",
  "worse side resolved": "lato peggiore determinato",
  "x = evidence, y = trial activity": "x = evidenze, y = attività degli studi",
  "years": "anni",
  "Fermented foods": "Alimenti fermentati",
  "Omega-3 fatty acids": "Acidi grassi omega-3",
  "Vitamin supplements": "Integratori vitaminici",
  "Mineral supplements / deficiency": "Integratori minerali / carenza",
  "Statins": "Statine",
  "GLP-1 agonists": "Agonisti del GLP-1",
  "Other glucose-lowering drugs": "Altri ipoglicemizzanti",
  "Bile-acid drugs (UDCA etc.)": "Farmaci a base di acidi biliari (UDCA ecc.)",
  "NSAIDs & aspirin": "FANS e aspirina",
  "Immune checkpoint inhibitors": "Inibitori dei checkpoint immunitari",
  "Chemotherapy": "Chemioterapia",
  "Radiation": "Radioterapia",
  "Immunomodulators & biologics": "Immunomodulatori e farmaci biologici",
  "Antivirals & antifungals": "Antivirali e antimicotici",
  "Psychotropic drugs": "Psicofarmaci",
  "Alcohol & smoking (exposure)": "Alcol e fumo (esposizione)"
}; }
/* ---- French words (English text -> French), used by K/V/nm when lang is "fr"; same English keys as IT_WORDS ---- */
function FR_WORDS() { return {
  "Insight lab": "Laboratoire d'analyse",
  "Researchers": "Chercheurs",
  "Interest shifts": "Évolution de l'intérêt",
  "Latest findings": "Derniers résultats",
  "World": "Monde",
  "Gaps": "Lacunes",
  "Collection": "Collecte",
  "Agents": "Agents",
  "We turned what the AI read into a map of which germs show up with which illnesses. See where many papers agree, where they disagree, and what is becoming popular.": "Nous avons transformé ce que l'IA a lu en une carte : quels microbes apparaissent avec quelles maladies. Regarde où beaucoup d'articles sont d'accord, où ils ne le sont pas, et ce qui devient à la mode.",
  "Sentences the AI read are linked into a knowledge graph of microbes, conditions and treatments: which relations many papers report in the same direction, where conclusions conflict, what is rising and what to study next.": "Les phrases lues par l'IA sont reliées dans un graphe de connaissances des microbes, des pathologies et des traitements : quelles relations de nombreux articles rapportent dans le même sens, où les conclusions divergent, ce qui monte et ce qu'il faut étudier ensuite.",
  "Knowledge graph of directional microbe–condition relations (increase/decrease/no difference) from abstract evidence sentences. Qwen judge plus the deterministic grounded_direction check; consensus = ≥60% same direction and ≥5 sentences, debate = ≥30% opposite. Abstract-level, not expert-validated.": "Graphe de connaissances des relations microbe–pathologie orientées (augmentation/diminution/absence de différence) issues des phrases de preuve des résumés. Juge Qwen plus contrôle déterministe grounded_direction ; consensus = ≥ 60 % même sens et ≥ 5 phrases, débat = ≥ 30 % sens opposé. Niveau résumé, non validé par des experts.",
  "Scientists who wrote many papers. Click a name to see where they work and what they study.": "Des scientifiques qui ont écrit beaucoup d'articles. Clique sur un nom pour voir où ils travaillent et ce qu'ils étudient.",
  "Researchers ranked by papers and citations. Click a row for affiliation, recent papers and co-authors.": "Chercheurs classés par articles et citations. Cliquez sur une ligne pour voir l'affiliation, les articles récents et les co-auteurs.",
  "Rankings by corpus papers, observed citations, h-index and last-year output. Without ORCID authors are matched by name string (homonyms may merge). Output measures, not impact.": "Classements selon les articles du corpus, les citations observées, l'indice h et la production de la dernière année. Sans ORCID, les auteurs sont appariés par chaîne de nom (des homonymes peuvent fusionner). Mesures de production, pas d'impact.",
  "Topics scientists talk about more, or less, lately.": "Les sujets dont les scientifiques parlent plus, ou moins, ces derniers temps.",
  "Whether recent interest in each condition and topic grew or shrank. Further right = a larger share of recent papers.": "Si l'intérêt récent pour chaque pathologie et chaque thème a augmenté ou diminué. Plus à droite = une plus grande part des articles récents.",
  "Change in share of papers, last 3 months vs the earlier window (≥100 papers). Shares, not counts, because collection volume differs by period.": "Variation de la part d'articles, 3 derniers mois par rapport à la fenêtre précédente (≥ 100 articles). Des parts, pas des effectifs, car le volume collecté varie selon la période.",
  "The key line from papers the AI just read.": "La phrase clé des articles que l'IA vient de lire.",
  "Recent findings the AI read from abstracts and checked against the source sentence. All provisional.": "Résultats récents que l'IA a lus dans les résumés et vérifiés par rapport à la phrase source. Tous provisoires.",
  "Abstract-only reading, accepted only when the quoted sentence matches the source. Summaries are model-generated; check numbers against the paper.": "Lecture des seuls résumés, acceptée uniquement si la phrase citée correspond à la source. Les résumés sont générés par le modèle ; vérifiez les chiffres dans l'article.",
  "Which countries do the most research, and which work together.": "Quels pays font le plus de recherche, et lesquels travaillent ensemble.",
  "Papers by country and international co-authorship, by author affiliation.": "Articles par pays et co-publications internationales, d'après l'affiliation des auteurs.",
  "Countries parsed from affiliation strings; multinational papers count once per country. Collaboration = country pairs on the same paper.": "Pays extraits des chaînes d'affiliation ; un article multinational compte une fois par pays. Collaboration = paires de pays sur un même article.",
  "Where research is still thin.": "Là où la recherche est encore maigre.",
  "Body site × topic: where research is dense and where it is missing.": "Site corporel × thème : où la recherche est dense et où elle manque.",
  "Paper counts per site × topic (multi-label regex). Low counts are not always gaps (missed classification or no biological link).": "Nombre d'articles par site × thème (expressions régulières multi-étiquettes). Un faible effectif n'est pas toujours une lacune (classification manquée ou absence de lien biologique).",
  "Collecting older papers one month at a time.": "On ramasse les articles plus anciens un mois à la fois.",
  "Progress of collecting a fixed number of papers per month.": "Avancement de la collecte d'un nombre fixe d'articles par mois.",
  "Monthly windows, page cap × page size per month, Europe PMC cursor paging. A sample, not a census.": "Fenêtres mensuelles, plafond de pages × taille de page par mois, pagination par curseur Europe PMC. Un échantillon, pas un recensement.",
  "The programs working behind the scenes. Green = fine, yellow = careful, red = stopped.": "Les programmes qui travaillent en coulisses. Vert = tout va bien, jaune = attention, rouge = arrêté.",
  "Status of the background programs. Green = healthy, yellow = caution, red = stopped.": "État des programmes en arrière-plan. Vert = en bonne santé, jaune = attention, rouge = arrêté.",
  "Derived from each job's latest status file and event age; refreshed every 30 s.": "Déduit du dernier fichier d'état de chaque tâche et de l'âge de ses événements ; actualisé toutes les 30 s.",
  "Comparing our results with the lab's big knowledge map, MINERVA.": "On compare nos résultats avec la grande carte des connaissances du laboratoire, MINERVA.",
  "MINERVA, the lab's knowledge graph, was copied once in full for comparison; we do not connect to it day to day.": "MINERVA, le graphe de connaissances du laboratoire, a été copié une fois en entier pour la comparaison ; nous ne nous y connectons pas au quotidien.",
  "MINERVA main-graph Microbe→Disease relations mapped to our classes by regex. Evidence-row counts can differ from unique biological relations.": "Relations Microbe→Maladie du graphe principal de MINERVA, rattachées à nos classes par expressions régulières. Le nombre de lignes de preuve peut différer du nombre de relations biologiques uniques.",
  "Paper counts, citations and attention are hints of influence, not evidence of effect, causation or research quality. Affiliations are strings as printed in papers, not verified institution identifiers. Without ORCID, identical names are treated as one person.": "Le nombre d'articles, les citations et l'attention sont des indices d'influence, pas des preuves d'effet, de causalité ou de qualité de la recherche. Les affiliations sont des chaînes telles qu'imprimées dans les articles, pas des identifiants d'établissement vérifiés. Sans ORCID, des noms identiques sont traités comme une seule personne.",
  "Source ↗": "Source ↗",
  "No summary": "Pas de résumé",
  "Papers": "Articles",
  "Citations": "Citations",
  "Corpus h-index": "Indice h du corpus",
  "Active last year": "Actifs l'an dernier",
  "Most prolific researchers": "Chercheurs les plus prolifiques",
  "Switch the order with the buttons and click a name.": "Change l'ordre avec les boutons et clique sur un nom.",
  "Change the ranking; click a row for affiliation, recent papers and co-authors.": "Changez le classement ; cliquez sur une ligne pour voir l'affiliation, les articles récents et les co-auteurs.",
  "The h-index uses only papers and citations in this corpus, not whole careers.": "L'indice h n'utilise que les articles et les citations de ce corpus, pas des carrières entières.",
  "Researcher · affiliation": "Chercheur · affiliation",
  "Country": "Pays",
  "Cites": "Cit.",
  "Last yr": "Dern. année",
  "Co-authorship constellation": "Constellation des co-publications",
  "Top 200 · star size = papers · lines = shared papers · colour = country": "200 premiers · taille de l'étoile = articles · lignes = articles en commun · couleur = pays",
  "Most active institutions": "Établissements les plus actifs",
  "By affiliation strings as printed (spelling variants of one institution are not merged yet)": "D'après les chaînes d'affiliation telles qu'imprimées (les variantes d'orthographe d'un même établissement ne sont pas encore fusionnées)",
  "Institution": "Établissement",
  "affiliation not given": "affiliation non indiquée",
  "Latest affiliation": "Dernière affiliation",
  "citations": "citations",
  "corpus h-index": "indice h du corpus",
  "last year": "dernière année",
  "Frequent co-authors": "Co-auteurs fréquents",
  "Recent papers and findings": "Articles et résultats récents",
  "Paper lists are precomputed for the top 200 only.": "Les listes d'articles ne sont précalculées que pour les 200 premiers.",
  "not given": "non indiqué",
  "other": "autre",
  "Shared papers": "Articles en commun",
  "Mechanism · topic": "Mécanisme · thème",
  "Condition": "Pathologie",
  "Research-interest radar": "Radar de l'intérêt scientifique",
  "Comparing": "Comparaison",
  "share of all papers in each window": "part de tous les articles dans chaque fenêtre",
  "All topics": "Tous les thèmes",
  "Topic": "Thème",
  "Kind": "Type",
  "Last 3 mo": "3 dern. mois",
  "Interest": "Intérêt",
  "Median cites": "Cit. médianes",
  "By month": "Par mois",
  "Interest change %": "Variation de l'intérêt %",
  "Recent findings by topic": "Résultats récents par thème",
  "AI summaries checked against the source sentence · pick a topic": "Résumés de l'IA vérifiés par rapport à la phrase source · choisissez un thème",
  "All": "Tous",
  "Gaps the authors name themselves": "Les lacunes que les auteurs signalent eux-mêmes",
  "Papers by country": "Articles par pays",
  "Top international collaborations": "Principales collaborations internationales",
  "Country ↔ country": "Pays ↔ pays",
  "Leading institutions by country": "Principaux établissements par pays",
  "papers": "articles",
  "authors": "auteurs",
  "Airway": "Voies respiratoires",
  "Gut": "Intestin",
  "Multi-site": "Plusieurs sites",
  "Oral": "Cavité buccale",
  "Skin": "Peau",
  "Urogenital": "Appareil urogénital",
  "Brain": "Cerveau",
  "Cancer": "Cancer",
  "Diagnosis": "Diagnostic",
  "Diet": "Alimentation",
  "Immunity": "Immunité",
  "Intervention": "Intervention",
  "Metabolites": "Métabolites",
  "Omics": "Omiques",
  "Body site × topic map": "Carte site corporel × thème",
  "Paler = less research": "Plus pâle = moins de recherche",
  "Shared premises not yet confirmed": "Hypothèses partagées encore non confirmées",
  "Next actions M-SAGE suggests": "Prochaines actions suggérées par M-SAGE",
  "No MINERVA comparison yet.": "Pas encore de comparaison avec MINERVA.",
  "IBD": "MICI",
  "Colorectal cancer": "Cancer colorectal",
  "Obesity": "Obésité",
  "Diabetes": "Diabète",
  "Fatty liver": "Stéatose hépatique",
  "Atherosclerosis": "Athérosclérose",
  "Chronic kidney disease": "Maladie rénale chronique",
  "Parkinson's": "Parkinson",
  "Alzheimer's": "Alzheimer",
  "Depression": "Dépression",
  "Autism": "Autisme",
  "Asthma": "Asthme",
  "Psoriasis": "Psoriasis",
  "Periodontitis": "Parodontite",
  "C. difficile infection": "Infection à C. difficile",
  "Bacterial vaginosis": "Vaginose bactérienne",
  "Condition ↔ microbe network (MINERVA)": "Réseau pathologie ↔ microbe (MINERVA)",
  "Conditions (orange) and their most linked microbes (green = mostly increase, red = mostly decrease) · line width = evidence rows": "Pathologies (orange) et leurs microbes les plus liés (vert = surtout augmentation, rouge = surtout diminution) · épaisseur du trait = lignes de preuve",
  "Hub microbes (most condition links)": "Microbes carrefours (le plus de liens avec des pathologies)",
  "Top microbes by condition": "Principaux microbes par pathologie",
  "MINERVA graph contents": "Contenu du graphe MINERVA",
  "Captured": "Capturé",
  "Evidence rows can differ from unique biological relations.": "Le nombre de lignes de preuve peut différer du nombre de relations biologiques uniques.",
  "Evidence rows": "Lignes de preuve",
  "evidence": "preuves",
  "No collection progress yet.": "Pas encore d'avancement de la collecte.",
  "Filling in past papers": "Rattrapage des anciens articles",
  "months done · up to": "mois terminés · jusqu'à",
  "papers a month": "articles par mois",
  "Approximate papers by year": "Articles par année (approximatif)",
  "Agent orchestra": "Orchestre d'agents",
  "Recent collection cycles": "Cycles de collecte récents",
  "Time": "Heure",
  "State": "État",
  "Pages": "Pages",
  "Range · reason": "Plage · motif",
  "higher in condition": "plus élevé dans la pathologie",
  "lower in condition": "plus bas dans la pathologie",
  "mixed": "discordant",
  "increase": "augmentation",
  "decrease": "diminution",
  "no difference": "aucune différence",
  "Knowledge map": "Carte des connaissances",
  "Consensus · debate": "Consensus · débat",
  "Microbe signatures": "Signatures microbiennes",
  "Rising · fading": "En hausse · en baisse",
  "Gaps · next studies": "Lacunes · prochaines études",
  "New vs MINERVA": "Nouveau par rapport à MINERVA",
  "Papers read": "Articles lus",
  "Microbe relations (evidence sentences)": "Relations microbiennes (phrases de preuve)",
  "Microbe nodes": "Nœuds microbiens",
  "Gap and limitation statements": "Énoncés de lacunes et de limites",
  "Relations passing the AI judge and group check": "Relations validées par le juge IA et le contrôle des groupes",
  "Machine-extracted from abstracts and evidence quotes, not checked by people · increase/decrease is mostly condition vs control relative abundance, not causation.": "Extrait automatiquement des résumés et des citations de preuve, non vérifié par des humains · augmentation/diminution correspond surtout à l'abondance relative pathologie vs témoins, pas à une causalité.",
  "Yellow circles are illnesses, green circles are germs. Red lines mean 'more in that illness', blue lines 'less'. Click a circle.": "Les cercles jaunes sont des maladies, les cercles verts des microbes. Un trait rouge veut dire « plus nombreux dans cette maladie », un trait bleu « moins nombreux ». Clique sur un cercle.",
  "Top genera and conditions, edges with ≥4 votes · width ∝ √evidence sentences · contested = ≥30% opposite · the same graph is queryable in the local Neo4j (Taxon, Disease, ASSOCIATED)": "Principaux genres et pathologies, arêtes avec ≥ 4 votes · épaisseur ∝ √phrases de preuve · contesté = ≥ 30 % de sens opposé · le même graphe est interrogeable dans le Neo4j local (Taxon, Disease, ASSOCIATED)",
  "Microbe ↔ condition knowledge map": "Carte des connaissances microbe ↔ pathologie",
  "Click a node": "Cliquez sur un nœud",
  "Shows how many sentences report each direction.": "Montre combien de phrases rapportent chaque sens.",
  "Evidence": "Preuves",
  "Microbe": "Microbe",
  "Microbes reported with this condition": "Microbes rapportés avec cette pathologie",
  "Conditions this microbe is reported in": "Pathologies dans lesquelles ce microbe est rapporté",
  "evidence sentences": "phrases de preuve",
  "Lower ◀ ▶ higher": "Plus bas ◀ ▶ plus élevé",
  "group-checked": "groupes vérifiés",
  "no condition": "aucune pathologie",
  "absent (new link)": "absent (nouveau lien)",
  "opposite": "opposé",
  "same direction": "même sens",
  "Germs and illnesses that many papers agree on. Click a row to read the real sentences.": "Des microbes et des maladies sur lesquels beaucoup d'articles sont d'accord. Clique sur une ligne pour lire les vraies phrases.",
  "Microbe–condition pairs where ≥60% of ≥5 sentences report the same direction · click a row for the evidence": "Paires microbe–pathologie où ≥ 60 % de ≥ 5 phrases rapportent le même sens · cliquez sur une ligne pour voir les preuves",
  "Score = (inc−dec)/(inc+dec+null), |score| ≥ 0.6, ≥5 sentences, phylum excluded · group-checked = sentences whose comparison groups the AI judge confirmed": "Score = (aug−dim)/(aug+dim+nul), |score| ≥ 0,6, ≥ 5 phrases, phylum exclu · groupes vérifiés = phrases dont le juge IA a confirmé les groupes comparés",
  "Some papers say 'more', others say 'less'. No answer yet.": "Certains articles disent « plus », d'autres « moins ». Pas encore de réponse.",
  "Pairs where increase and decrease each make up ≥30% · open questions": "Paires où l'augmentation et la diminution représentent chacune ≥ 30 % · questions ouvertes",
  "Debate = minority direction share ≥ 0.3 · whether subgroups or methods split it is in signatures and the automatic follow-ups": "Débat = part du sens minoritaire ≥ 0,3 · si des sous-groupes ou des méthodes l'expliquent, c'est dans les signatures et les approfondissements automatiques",
  "Relations papers agree on": "Relations sur lesquelles les articles s'accordent",
  "Relations papers disagree on": "Relations sur lesquelles les articles divergent",
  "Evidence sentences": "Phrases de preuve",
  "Pick a pair in a table to see the quoted source sentences here.": "Choisissez une paire dans un tableau pour voir ici les phrases sources citées.",
  "Example sentences are precomputed for the top 40 only.": "Les phrases d'exemple ne sont précalculées que pour les 40 premières paires.",
  "Red cells: the germ goes up in that illness. Blue cells: it goes down.": "Cases rouges : le microbe augmente dans cette maladie. Cases bleues : il diminue.",
  "Red = mostly reported higher in the condition · blue = mostly lower · number = evidence sentences": "Rouge = surtout rapporté plus élevé dans la pathologie · bleu = surtout plus bas · nombre = phrases de preuve",
  "Colour = direction score (−1 lower … +1 higher), number = evidence sentences · top 30 genera × top 22 conditions": "Couleur = score de direction (−1 plus bas … +1 plus élevé), nombre = phrases de preuve · 30 premiers genres × 22 premières pathologies",
  "Microbe × condition direction map": "Carte de direction microbe × pathologie",
  "Microbes shared across conditions": "Microbes communs à plusieurs pathologies",
  "Microbes with a consistent direction in 3+ conditions · mostly blue = health-marker candidate, mostly red = disease-marker candidate": "Microbes de sens constant dans 3 pathologies ou plus · surtout bleu = candidat marqueur de santé, surtout rouge = candidat marqueur de maladie",
  "conditions": "pathologies",
  "Conditions": "Pathologies",
  "Microbes": "Microbes",
  "Interventions": "Interventions",
  "Methods": "Méthodes",
  "Body sites": "Sites corporels",
  "Topics mentioned more now than before. ×2 means twice as often.": "Des sujets dont on parle plus qu'avant. ×2 veut dire deux fois plus souvent.",
  "Share of mentions in the last 2 years ÷ 3–5 years ago · yearly collection is capped, so shares are compared": "Part des mentions des 2 dernières années ÷ il y a 3 à 5 ans · la collecte annuelle est plafonnée, on compare donc des parts",
  "Growth = share(last 2 y) / share(3–5 y ago) with a minimum paper count · collection is recency-skewed; not absolute volume": "Croissance = part(2 dernières années) / part(il y a 3–5 ans) avec un nombre minimal d'articles · collecte biaisée vers les années récentes ; pas un volume absolu",
  "Rising": "En hausse",
  "Fading": "En baisse",
  "Largest falls in share, same measure": "Plus fortes baisses de part, même mesure",
  "Share by year (top rising)": "Part par année (plus fortes hausses)",
  "Researchers leading rising topics (last 3 years)": "Chercheurs en tête des thèmes en hausse (3 dernières années)",
  "recent": "récent",
  "before": "avant",
  "Illnesses with lots of interest but mixed answers and many unknowns come first.": "Les maladies qui intéressent beaucoup mais où les réponses sont mélangées et les inconnues nombreuses passent en premier.",
  "Score combining rising interest, conflicting papers, limitations the authors state and links new to MINERVA · a pointer, not a verdict": "Score combinant l'intérêt croissant, les articles contradictoires, les limites déclarées par les auteurs et les liens absents de MINERVA · une piste, pas un verdict",
  "Score = 2·ln(growth) + 1.5·ln(1+contested pairs) + 0.8·ln(1+limitations) + ln(1+not in MINERVA) − 0.3·ln(1+papers) · heuristic, unvalidated weights": "Score = 2·ln(croissance) + 1,5·ln(1+paires contestées) + 0,8·ln(1+limites) + ln(1+absent de MINERVA) − 0,3·ln(1+articles) · pondérations heuristiques, non validées",
  "What to study next (automatic priority)": "Que faut-il étudier ensuite ? (priorité automatique)",
  "Limitations authors state, by condition": "Limites déclarées par les auteurs, par pathologie",
  "Limitation and gap sentences grouped by theme · number = papers": "Phrases de limites et de lacunes regroupées par thème · nombre = articles",
  "Most frequent limitations": "Limites les plus fréquentes",
  "interest": "intérêt",
  "conflicts": "conflits",
  "limitations": "limites",
  "new links": "nouveaux liens",
  "To fill": "À combler",
  "Microbes with split results": "Microbes aux résultats partagés",
  "Newly emerging links": "Liens qui viennent d'apparaître",
  "examples": "exemples",
  "MINERVA microbe→condition relations": "Relations microbe→pathologie de MINERVA",
  "Our consensus relations pointing the same way as MINERVA": "Nos relations de consensus qui vont dans le même sens que MINERVA",
  "Links not in MINERVA": "Liens absents de MINERVA",
  "Opposite-direction links": "Liens de sens opposé",
  "Our classes with no MINERVA condition": "Nos classes sans pathologie MINERVA",
  "Links MINERVA does not have yet": "Liens que MINERVA n'a pas encore",
  "Links our papers show that MINERVA does not have yet.": "Des liens que montrent nos articles et que MINERVA n'a pas encore.",
  "≥3 papers in our corpus agree · absent from MINERVA's microbe→condition relations · click a row for evidence": "≥ 3 articles de notre corpus concordent · absent des relations microbe→pathologie de MINERVA · cliquez sur une ligne pour voir les preuves",
  "Condition names are mapped automatically by regex; some may be naming differences and need review.": "Les noms de pathologies sont rattachés automatiquement par expressions régulières ; certains écarts peuvent n'être que des différences de nom et demandent une vérification.",
  "Links opposite to MINERVA": "Liens opposés à MINERVA",
  "New papers point the other way from existing knowledge · candidates for review": "De nouveaux articles vont dans le sens contraire des connaissances existantes · à examiner",
  "← Cockpit": "← Tableau de bord",
  "Knowledge graph as of": "Graphe de connaissances au",
  "release": "version",
  "rebuilt every 3 hours": "reconstruit toutes les 3 heures",
  "All jobs running": "Toutes les tâches tournent",
  " · updates every 30 s": " · mise à jour toutes les 30 s",
  "Analysis as of": "Analyse au",
  "No knowledge graph yet": "Pas encore de graphe de connaissances",
  "Could not load the data": "Impossible de charger les données",
  "Immunity & inflammation": "Immunité et inflammation",
  "Microbial metabolism": "Métabolisme microbien",
  "Diversity & dysbiosis": "Diversité et dysbiose",
  "Antibiotics & resistance": "Antibiotiques et résistance",
  "Barrier & permeability": "Barrière et perméabilité",
  "Probiotics": "Probiotiques",
  "Short-chain fatty acids": "Acides gras à chaîne courte",
  "Prebiotics & fibre": "Prébiotiques et fibres",
  "Bile acids": "Acides biliaires",
  "Microbiota transplant": "Transplantation de microbiote",
  "Infection": "Infection",
  "Cardiovascular": "Cardiovasculaire",
  "Liver disease": "Maladies du foie",
  "Depression & anxiety": "Dépression et anxiété",
  "Asthma & allergy": "Asthme et allergie",
  "Periodontal & caries": "Parodontie et caries",
  "Alzheimer's & cognition": "Alzheimer et cognition",
  "Skin disease": "Maladies de la peau",
  "Kidney disease": "Maladies rénales",
  "Urogenital disease": "Maladies urogénitales",
  "MINERVA": "MINERVA",
  "Cockpit": "Tableau de bord",
  "One-page story": "Récit en une page",
  "IBS": "SII",
  "Celiac disease": "Maladie cœliaque",
  "Gastric cancer": "Cancer de l'estomac",
  "Liver cancer": "Cancer du foie",
  "Pancreatic cancer": "Cancer du pancréas",
  "Breast cancer": "Cancer du sein",
  "Lung cancer": "Cancer du poumon",
  "Oral/head-neck cancer": "Cancer de la bouche/tête et cou",
  "Prostate cancer": "Cancer de la prostate",
  "Cervical lesions/HPV": "Lésions du col de l'utérus/HPV",
  "Cancer immunotherapy": "Immunothérapie du cancer",
  "Type 2 diabetes": "Diabète de type 2",
  "Type 1 diabetes": "Diabète de type 1",
  "Gestational diabetes": "Diabète gestationnel",
  "Metabolic syndrome": "Syndrome métabolique",
  "Cirrhosis": "Cirrhose",
  "Cardiovascular disease": "Maladies cardiovasculaires",
  "Hypertension": "Hypertension artérielle",
  "Stroke": "AVC",
  "Parkinson's disease": "Maladie de Parkinson",
  "Alzheimer's/cognitive decline": "Alzheimer/déclin cognitif",
  "Multiple sclerosis": "Sclérose en plaques",
  "Anxiety": "Anxiété",
  "Schizophrenia": "Schizophrénie",
  "ADHD": "TDAH",
  "Allergy/atopy": "Allergie/atopie",
  "COPD": "BPCO",
  "Cystic fibrosis": "Mucoviscidose",
  "COVID-19": "COVID-19",
  "HIV": "VIH",
  "Sepsis/critical illness": "Sepsis/réanimation",
  "H. pylori infection": "Infection à H. pylori",
  "Urinary tract infection": "Infection urinaire",
  "Preterm birth/neonatal": "Prématurité/néonatal",
  "PCOS": "SOPK",
  "Endometriosis/infertility": "Endométriose/infertilité",
  "Dental caries": "Caries dentaires",
  "Atopic dermatitis/acne": "Dermatite atopique/acné",
  "Rheumatoid arthritis": "Polyarthrite rhumatoïde",
  "Lupus": "Lupus",
  "Spondyloarthritis": "Spondyloarthrite",
  "Osteoporosis": "Ostéoporose",
  "Gout": "Goutte",
  "Aging/frailty": "Vieillissement/fragilité",
  "Malnutrition/stunting": "Dénutrition/retard de croissance",
  "Airway & lung": "Voies aériennes et poumon",
  "Vaginal & reproductive": "Vagin et appareil reproducteur",
  "Urinary": "Voies urinaires",
  "Breast milk": "Lait maternel",
  "Blood & tumour": "Sang et tumeur",
  "Small samples": "Petits échantillons",
  "Causality / mechanism unproven": "Causalité / mécanisme non démontré",
  "Cross-sectional only": "Uniquement transversal",
  "Limited population diversity": "Diversité de population limitée",
  "Needs external validation": "Validation externe nécessaire",
  "Low taxonomic resolution": "Faible résolution taxonomique",
  "Diet & drug confounding": "Confusion par l'alimentation et les médicaments",
  "Needs clinical trials": "Essais cliniques nécessaires",
  "Needs functional / multi-omics": "Études fonctionnelles / multi-omiques nécessaires",
  "Methods not standardized": "Méthodes non standardisées",
  "Animal results need human confirmation": "Résultats chez l'animal à confirmer chez l'humain",
  "Other": "Autre",
  "Synbiotics": "Symbiotiques",
  "Postbiotics": "Postbiotiques",
  "Fecal microbiota transplant": "Transplantation de microbiote fécal",
  "Antibiotics": "Antibiotiques",
  "Diet interventions": "Interventions alimentaires",
  "Exercise": "Activité physique",
  "Phage therapy": "Phagothérapie",
  "Metformin": "Metformine",
  "Proton pump inhibitors": "Inhibiteurs de la pompe à protons",
  "Bariatric surgery": "Chirurgie bariatrique",
  "Breastfeeding": "Allaitement maternel",
  "Caesarean birth": "Naissance par césarienne",
  "Other treatments": "Autres traitements",
  "16S amplicon": "Amplicons 16S",
  "Shotgun metagenomics": "Métagénomique shotgun",
  "Metatranscriptomics": "Métatranscriptomique",
  "Metabolomics": "Métabolomique",
  "Multi-omics": "Multi-omique",
  "Culturomics & isolation": "Culturomique et isolement",
  "Mendelian randomization": "Randomisation mendélienne",
  "Randomized trials": "Essais randomisés",
  "Machine learning & AI": "Apprentissage automatique et IA",
  "Longitudinal cohorts": "Cohortes longitudinales",
  "Single-cell & spatial": "Cellule unique et spatial",
  "Strain-level analysis": "Analyse au niveau de la souche",
  "Virome & mycobiome": "Virome et mycobiome",
  "Butyrate": "Butyrate",
  "Propionate": "Propionate",
  "TMAO": "TMAO",
  "Tryptophan & indoles": "Tryptophane et indoles",
  "LPS / endotoxin": "LPS / endotoxine",
  "Polyphenols": "Polyphénols",
  "Vitamins": "Vitamines",
  "GABA & neurotransmitters": "GABA et neurotransmetteurs",
  "Branched-chain amino acids": "Acides aminés à chaîne ramifiée",
  "Cytokines": "Cytokines",
  /* insight lab: evidence sections (reversal, quality, clinic, severity) */
  "'No difference' share by condition": "Part de « aucune différence » par pathologie",
  "A hypothesis: two literatures joined, not evidence that this intervention works in this condition.": "Une hypothèse : deux littératures réunies, pas une preuve que cette intervention est efficace dans cette pathologie.",
  "Abstracts rarely report 'no difference'. A low null share signals publication and reporting bias.": "Les résumés rapportent rarement « aucune différence ». Une faible part de résultats nuls signale un biais de publication et de déclaration.",
  "Acquired / licensed": "Acquis / sous licence",
  "Active": "Active",
  "Active and closed companies · the text on closed companies is the lesson": "Entreprises actives et fermées · le texte des entreprises fermées constitue la leçon",
  "Active, not recruiting": "Actif, recrutement terminé",
  "Animal": "Animal",
  "Animal edges": "Arêtes issues d'études animales",
  "Animal only": "Chez l'animal uniquement",
  "Animal → human: does the intervention effect hold in people?": "De l'animal à l'humain : l'effet de l'intervention se confirme-t-il chez l'humain ?",
  "Animal ≥3 papers and ratio ≥2; human confirmation ≥2 papers · human = no animal or laboratory model named in the title or sentence": "Animal ≥3 articles et rapport ≥2 ; confirmation humaine ≥2 articles · humain = aucun modèle animal ou de laboratoire cité dans le titre ou la phrase",
  "Approval": "Autorisation",
  "Approvals · readouts · deals · closures · financings": "Autorisations · résultats · accords · fermetures · financements",
  "Approved": "Autorisé",
  "As of": "À jour au",
  "Available": "Disponible",
  "Background statement": "Énoncé de contexte",
  "Based on trial registrations, not results or efficacy. Quadrant cut-offs are relative.": "Fondé sur les enregistrements d'essais, pas sur les résultats ni l'efficacité. Les seuils des quadrants sont relatifs.",
  "By kind of evidence sentence · lower = 'no difference' results appear less in abstracts": "Par type de phrase de preuve · plus bas = les résultats « aucune différence » apparaissent moins dans les résumés",
  "Candidate": "Candidat",
  "Candidate list": "Liste des candidats",
  "Click a row for the evidence": "Cliquez sur une ligne pour voir les preuves",
  "Click a row for the summary and sources": "Cliquez sur une ligne pour le résumé et les sources",
  "Clinical trials (ClinicalTrials.gov)": "Essais cliniques (ClinicalTrials.gov)",
  "Closed": "Fermée",
  "Closure": "Fermeture",
  "Collecting microbiome trials from ClinicalTrials.gov. The first results appear here after the next weekly fetch.": "Collecte en cours des essais sur le microbiome depuis ClinicalTrials.gov. Les premiers résultats apparaîtront ici après la prochaine collecte hebdomadaire.",
  "Companies, and lessons from closures": "Entreprises et leçons des fermetures",
  "Company": "Entreprise",
  "Completed": "Terminé",
  "Condition side": "Côté pathologie",
  "Conditions with at least this many microbe–condition edges": "Pathologies comptant au moins ce nombre d'arêtes microbe–pathologie",
  "Conditions with most edges first": "Pathologies ayant le plus d'arêtes en premier",
  "Conditions with strong evidence but few trials are 'opportunities', both high is 'crowded', many trials on weak evidence is 'speculative'. Below: industry records whose sources a person checked.": "Les pathologies aux preuves solides mais avec peu d'essais sont des « opportunités », les deux élevés donnent « encombré », beaucoup d'essais sur des preuves faibles donnent « spéculatif ». Ci-dessous : fiches industrielles dont une personne a vérifié les sources.",
  "Conditions with the most registered trials": "Pathologies comptant le plus d'essais enregistrés",
  "Confirmed in humans": "Confirmé chez l'humain",
  "Consensus relations for this condition (in brackets: independently replicated)": "Relations consensuelles pour cette pathologie (entre parenthèses : répliquées de façon indépendante)",
  "Consensus relations independently replicated": "Relations consensuelles répliquées de façon indépendante",
  "Consumer product": "Produit grand public",
  "Counts whether abstract sentences name a species or strain. Actual analysis resolution may differ.": "Compte si les phrases des résumés nomment une espèce ou une souche. La résolution réelle de l'analyse peut différer.",
  "Crowded": "Encombré",
  "Curated industry entries marked verified only. Not investment or product advice.": "Uniquement les fiches industrielles vérifiées par un curateur. Ni conseil en investissement ni recommandation de produit.",
  "Curator note": "Note du curateur",
  "Date": "Date",
  "Deal": "Accord",
  "Debates where both directions come from ≥2 groups": "Débats où les deux directions proviennent de ≥2 groupes",
  "Diagnostics": "Diagnostic",
  "Discontinued": "Arrêté",
  "Early": "Précoce",
  "Early (phase 1)": "Précoce (phase 1)",
  "Early phase 1": "Phase 1 précoce",
  "Enrolling by invitation": "Inclusion sur invitation",
  "Evidence = replicated consensus pairs + reversal candidates; more contested pairs than that excludes 'strong' · trial activity = active + completed trials weighted (phase 1/NA 1, phase 2 = 2, phase 3/4 = 3) · cut-offs = max(minimum, median of non-zero values)": "Preuves = paires consensuelles répliquées + candidats d'inversion ; davantage de paires contestées exclut « solide » · activité d'essais = essais actifs + terminés pondérés (phase 1/NA 1, phase 2 = 2, phase 3/4 = 3) · seuils = max(minimum, médiane des valeurs non nulles)",
  "Evidence quality": "Qualité des preuves",
  "Evidence quality: how far can these results be trusted?": "Qualité des preuves : quelle confiance accorder à ces résultats ?",
  "Evidence × trial-activity quadrant": "Quadrant preuves × activité d'essais",
  "Fecal microbiota": "Microbiote fécal",
  "Financing": "Financement",
  "Flags": "Signalements",
  "From evidence to clinic": "Des preuves à la clinique",
  "Germs that are more common in people who are sicker, germs that go with a higher or lower risk of getting ill, and substances often mentioned with them. All of this means 'found together', not 'causes'.": "Des microbes plus fréquents chez les personnes plus malades, des microbes liés à un risque plus ou moins élevé de tomber malade, et des substances souvent citées avec eux. Tout cela veut dire « trouvés ensemble », pas « causent ».",
  "Good evidence means several unrelated teams found the same thing over several years. Here we check how much evidence is like that, whether 'no difference' results go missing, and whether animal results hold in people.": "Une bonne preuve, c'est quand plusieurs équipes sans lien trouvent la même chose sur plusieurs années. Ici, on regarde combien de preuves sont ainsi, si les résultats « aucune différence » disparaissent, et si les résultats chez l'animal se vérifient chez l'humain.",
  "Herbal medicine / TCM": "Phytothérapie / médecine traditionnelle chinoise",
  "Human: same / opposite": "Humain : même sens / sens opposé",
  "Hypotheses joining two literatures: the condition papers (microbe lower/higher in the condition) and the intervention papers (the intervention raises/lowers that microbe). Click a row for both sides' evidence. 'Already tested' counts intervention papers that also mention the condition.": "Hypothèses réunissant deux littératures : les articles sur la pathologie (microbe plus bas/plus élevé dans la pathologie) et les articles sur l'intervention (l'intervention augmente/diminue ce microbe). Cliquez sur une ligne pour les preuves des deux côtés. « Déjà testé » compte les articles sur l'intervention qui mentionnent aussi la pathologie.",
  "Hypothesis generator only. Two separate literatures are joined; this is not a treatment recommendation.": "Générateur d'hypothèses uniquement. Deux littératures distinctes sont réunies ; ce n'est pas une recommandation thérapeutique.",
  "In condition": "Dans la pathologie",
  "In some illnesses a germ drops too low or grows too much. Other papers say some treatment (probiotics, diet…) raises or lowers that germ. We join the two into ideas worth testing. These are not treatments.": "Dans certaines maladies, un microbe baisse trop ou augmente trop. D'autres articles disent qu'un traitement (probiotiques, alimentation…) fait monter ou baisser ce microbe. On assemble les deux pour obtenir des idées à tester. Ce ne sont pas des traitements.",
  "Independent author groups (no shared author) and years reported": "Groupes d'auteurs indépendants (aucun auteur commun) et années de publication",
  "Independent groups = connected components of papers sharing an author (ORCID or name); name-only hubs linking >50 papers connect only with ≥2 shared names · replicated: ≥3 groups over ≥3 years · null share = null-direction sentences / all · per condition only with ≥50 edges": "Groupes indépendants = composantes connexes d'articles partageant un auteur (ORCID ou nom) ; les noms pivots sans ORCID reliant >50 articles ne relient qu'avec ≥2 noms communs · répliqué : ≥3 groupes sur ≥3 ans · part nulle = phrases de direction nulle / total · par pathologie seulement avec ≥50 arêtes",
  "Independent groups are clusters of papers sharing no author. Name matching is imperfect, so counts are approximate.": "Les groupes indépendants sont des ensembles d'articles sans auteur commun. L'appariement des noms est imparfait : les comptes sont approximatifs.",
  "Indication": "Indication",
  "Industry record": "Registre industriel",
  "Industry record: entries with checked sources": "Registre industriel : fiches aux sources vérifiées",
  "Intervention changes a microbe": "Une intervention modifie un microbe",
  "Intervention papers that also mention this condition": "Articles sur l'intervention qui mentionnent aussi cette pathologie",
  "Intervention side": "Côté intervention",
  "Intervention · effect": "Intervention · effet",
  "Intervention → microbe effects with ≥3 same-direction animal papers, compared with human sentences": "Effets intervention → microbe avec ≥3 articles chez l'animal de même sens, comparés aux phrases chez l'humain",
  "Is what papers found turning into real treatments? Trials running in hospitals, products already approved, and lessons from companies that closed.": "Ce que les articles ont trouvé devient-il de vrais traitements ? Des essais en cours à l'hôpital, des produits déjà autorisés et les leçons des entreprises qui ont fermé.",
  "Latest registered trials": "Derniers essais enregistrés",
  "Lesson": "Leçon",
  "Lift ×2 = the metabolite is mentioned twice as often in papers on this microbe and condition as in all papers on the condition": "Lift ×2 = le métabolite est cité deux fois plus souvent dans les articles sur ce microbe et cette pathologie que dans l'ensemble des articles sur la pathologie",
  "Live biotherapeutic": "Biothérapeutique vivant",
  "Mechanism triangles: microbe – metabolite – condition (co-mention)": "Triangles de mécanisme : microbe – métabolite – pathologie (co-mention)",
  "Metabolites co-mentioned in the same abstracts. Not a measured pathway.": "Métabolites cités ensemble dans les mêmes résumés. Ce n'est pas une voie mesurée.",
  "Microbes associated with disease risk": "Microbes associés au risque de maladie",
  "Microbes that differ in the worse subgroup": "Microbes qui diffèrent dans le sous-groupe le plus atteint",
  "Microbe–condition association": "Association microbe–pathologie",
  "Milestone": "Étape",
  "Most animal sentences are filtered out upstream, so animal evidence is undercounted. Human confirmation is abstract-level.": "La plupart des phrases sur l'animal sont filtrées en amont : les preuves animales sont donc sous-comptées. La confirmation chez l'humain est au niveau du résumé.",
  "N/A": "N/A",
  "Next-generation probiotics": "Probiotiques de nouvelle génération",
  "No candidate matches the filter.": "Aucun candidat ne correspond au filtre.",
  "No candidate passes the thresholds yet.": "Aucun candidat ne franchit encore les seuils.",
  "No verified industry entries yet.": "Aucune fiche industrielle vérifiée pour l'instant.",
  "Not applicable": "Sans objet",
  "Not yet recruiting": "Recrutement pas encore ouvert",
  "Opportunity": "Opportunité",
  "Opposite in humans": "Inverse chez l'humain",
  "Opposite in humans, or animal only": "Inverse chez l'humain, ou chez l'animal uniquement",
  "Oral hygiene & periodontal care": "Hygiène bucco-dentaire et soins parodontaux",
  "Per year: share of microbe relation sentences naming a species, and naming a strain": "Par année : part des phrases de relation microbienne qui nomment une espèce, et qui nomment une souche",
  "Phage": "Phages",
  "Phase": "Phase",
  "Phase 1": "Phase 1",
  "Phase 2": "Phase 2",
  "Phase 3": "Phase 3",
  "Phase 4": "Phase 4",
  "Phase 3–4": "Phase 3–4",
  "Pick a candidate in the list.": "Choisissez un candidat dans la liste.",
  "Pipeline by phase": "Pipeline par phase",
  "Plant extracts & polysaccharides": "Extraits végétaux et polysaccharides",
  "Prebiotic / glycan": "Prébiotique / glycane",
  "Products through regulatory review": "Produits passés par l'évaluation réglementaire",
  "Publication bias: share of 'no difference' reports": "Biais de publication : part des résultats « aucune différence »",
  "Ranked by score · click a row for both sides' evidence": "Classés par score · cliquez sur une ligne pour les preuves des deux côtés",
  "Readout": "Résultats",
  "Recruiting": "Recrutement en cours",
  "Refusal": "Refus",
  "Refused": "Refusé",
  "Relapse / remission": "Rechute / rémission",
  "Replicated only": "Répliqués uniquement",
  "Replication": "Réplication",
  "Replication = independent author groups (no shared author) and the span of years · publication bias = share of 'no difference' reports · animal → human = whether an intervention effect seen in animals points the same way in human sentences · resolution = share of relations naming a species": "Réplication = groupes d'auteurs indépendants (aucun auteur commun) et étendue des années · biais de publication = part des résultats « aucune différence » · animal → humain = l'effet d'une intervention vu chez l'animal va-t-il dans le même sens dans les phrases chez l'humain · résolution = part des relations qui nomment une espèce",
  "Reported by ≥3 independent author groups over ≥3 years": "Rapporté par ≥3 groupes d'auteurs indépendants sur ≥3 ans",
  "Resolution: share naming a species or strain": "Résolution : part nommant une espèce ou une souche",
  "Restore (raise a depleted taxon)": "Restaurer (augmenter un taxon appauvri)",
  "Reversal candidates": "Candidats d'inversion",
  "Reversal candidates independently replicated": "Candidats d'inversion répliqués de façon indépendante",
  "Reversal candidates: interventions that push a disease-shifted microbe back": "Candidats d'inversion : interventions qui ramènent un microbe déplacé par la maladie",
  "Risk and genetic-association sentences (including Mendelian randomization). Few studies each; not established causes.": "Phrases de risque et d'association génétique (y compris la randomisation mendélienne). Peu d'études chacune ; pas des causes établies.",
  "Risk or genetic association": "Risque ou association génétique",
  "Score": "Score",
  "Score combines the condition-side majority votes and ratio with the intervention-side majority papers and ratio (contested pairs ×0.5); phylum excluded; capped at 6 per condition, 5 per microbe, 60 overall · intervention side uses human-host sentences only · replicated = condition side ≥3 independent groups over ≥3 years and intervention side ≥2 groups": "Le score combine les votes et le rapport majoritaires côté pathologie avec les articles et le rapport majoritaires côté intervention (paires contestées ×0,5) ; phylum exclu ; plafonné à 6 par pathologie, 5 par microbe, 60 au total · le côté intervention n'utilise que des phrases à hôte humain · répliqué = côté pathologie ≥3 groupes indépendants sur ≥3 ans et côté intervention ≥2 groupes",
  "Severity / stage": "Sévérité / stade",
  "Severity = microbes higher or lower in the worse subgroup (severe, non-responder, relapse, shorter survival) · risk = association with the risk of disease (including Mendelian randomization) · mechanisms = metabolites co-mentioned in the same abstracts (not a measured pathway)": "Sévérité = microbes plus élevés ou plus bas dans le sous-groupe le plus atteint (sévère, non-répondeur, rechute, survie plus courte) · risque = association avec le risque de maladie (y compris la randomisation mendélienne) · mécanismes = métabolites cités ensemble dans les mêmes résumés (pas une voie mesurée)",
  "Severity and risk: ≥3 papers in one direction, ratio ≥2 · mechanism triangles: top 30 consensus pairs with ≥10 co-mentioning papers, metabolite ≥5 papers, lift = share within the pair ÷ share among all papers on the condition ≥1.5, at most 3 per pair": "Sévérité et risque : ≥3 articles dans un sens, rapport ≥2 · triangles de mécanisme : 30 premières paires consensuelles avec ≥10 articles de co-mention, métabolite ≥5 articles, lift = part dans la paire ÷ part dans tous les articles sur la pathologie ≥1,5, au plus 3 par paire",
  "Severity, risk and mechanisms: clues beyond association": "Sévérité, risque et mécanismes : des indices au-delà de l'association",
  "Severity, risk, mechanisms": "Sévérité, risque, mécanismes",
  "Species named": "Espèce nommée",
  "Species-level share by condition": "Part au niveau de l'espèce par pathologie",
  "Speculative": "Spéculatif",
  "Sponsor": "Promoteur",
  "Start": "Début",
  "Status": "Statut",
  "Strain designated": "Souche désignée",
  "Subgroup (severity, response)": "Sous-groupe (sévérité, réponse)",
  "Subgroup edges": "Arêtes de sous-groupe",
  "Suppress (lower an enriched taxon)": "Supprimer (réduire un taxon enrichi)",
  "Survival / prognosis": "Survie / pronostic",
  "Suspended": "Suspendu",
  "Terminated": "Arrêté prématurément",
  "The intervention may itself contain this microbe (e.g. a Lactobacillus product); not necessarily evidence of reversal.": "L'intervention peut contenir elle-même ce microbe (p. ex. un produit à base de Lactobacillus) ; ce n'est pas forcément une preuve d'inversion.",
  "This analysis is not in the current data yet. It appears after the next knowledge-graph rebuild.": "Cette analyse ne figure pas encore dans les données actuelles. Elle apparaîtra après la prochaine reconstruction du graphe de connaissances.",
  "Timeline (newest first)": "Chronologie (du plus récent)",
  "Title": "Titre",
  "Too little human data": "Trop peu de données humaines",
  "Total": "Total",
  "Treatment response": "Réponse au traitement",
  "Trial activity": "Activité d'essais",
  "Trial phases by condition": "Phases des essais par pathologie",
  "Unknown status": "Statut inconnu",
  "We counted whether effects seen in mice were also seen in people.": "Nous avons compté si les effets vus chez la souris se retrouvaient chez l'humain.",
  "Which side is 'worse' (severe, non-responder, relapse) is inferred from sentence cues. Associations, not a prognostic tool.": "Le côté « le plus atteint » (sévère, non-répondeur, rechute) est déduit d'indices dans la phrase. Des associations, pas un outil pronostique.",
  "Withdrawn": "Retiré",
  "active": "actifs",
  "administered?": "administré ?",
  "already tested": "déjà testé",
  "animal": "animal",
  "bar = share, label = edges": "barre = part, étiquette = arêtes",
  "cited share": "part citée",
  "co-mentioning papers": "articles de co-mention",
  "completed": "terminés",
  "consensus": "consensus",
  "contested": "contesté",
  "edges": "arêtes",
  "entries": "fiches",
  "fetched": "collectés",
  "groups": "groupes",
  "higher in the condition": "plus élevé dans la pathologie",
  "higher risk": "risque plus élevé",
  "higher when worse": "plus élevé quand plus atteint",
  "human": "humain",
  "human papers": "articles chez l'humain",
  "independent groups": "groupes indépendants",
  "journals": "revues",
  "lower in the condition": "plus bas dans la pathologie",
  "lower risk": "risque plus faible",
  "lower when worse": "plus bas quand plus atteint",
  "may be the administered microbe": "peut être le microbe administré",
  "observational": "observationnel",
  "registered trials": "essais enregistrés",
  "replicated": "répliqué",
  "replicated consensus": "consensus répliqué",
  "reversal": "inversion",
  "score": "score",
  "score sum": "somme des scores",
  "species level": "niveau de l'espèce",
  "strain designation = culture-collection number (DSM, ATCC, ...) or 'strain X' in the sentence": "désignation de souche = numéro de collection de cultures (DSM, ATCC, ...) ou « strain X » dans la phrase",
  "suspected-animal edges": "arêtes suspectées animales",
  "top sponsors": "principaux promoteurs",
  "trial activity": "activité d'essais",
  "trials": "essais",
  "unverified left out": "non vérifiées exclues",
  "vs": "contre",
  "worse side resolved": "côté le plus atteint déterminé",
  "x = evidence, y = trial activity": "x = preuves, y = activité d'essais",
  "years": "années",
  "Fermented foods": "Aliments fermentés",
  "Omega-3 fatty acids": "Acides gras oméga-3",
  "Vitamin supplements": "Suppléments vitaminiques",
  "Mineral supplements / deficiency": "Suppléments minéraux / carence",
  "Statins": "Statines",
  "GLP-1 agonists": "Agonistes du GLP-1",
  "Other glucose-lowering drugs": "Autres hypoglycémiants",
  "Bile-acid drugs (UDCA etc.)": "Médicaments à base d'acides biliaires (UDCA, etc.)",
  "NSAIDs & aspirin": "AINS et aspirine",
  "Immune checkpoint inhibitors": "Inhibiteurs de points de contrôle immunitaire",
  "Chemotherapy": "Chimiothérapie",
  "Radiation": "Radiothérapie",
  "Immunomodulators & biologics": "Immunomodulateurs et biothérapies",
  "Antivirals & antifungals": "Antiviraux et antifongiques",
  "Psychotropic drugs": "Psychotropes",
  "Alcohol & smoking (exposure)": "Alcool et tabac (exposition)"
}; }
})();
