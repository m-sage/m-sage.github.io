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
  $("view").innerHTML = `<div class="row2"><div class="box"><h2>${K("가장 영향력 있는 연구자", "Most prolific researchers")}</h2>
    <p class="hint">${V({eli10: ["버튼으로 순서를 바꿔 보고, 이름을 눌러 보세요.", "Switch the order with the buttons and click a name."], eli20: ["기준을 바꿔 보세요. 행을 누르면 오른쪽에 소속·최근 논문·공동 연구자가 나옵니다.", "Change the ranking; click a row for affiliation, recent papers and co-authors."], pro: ["h-지수는 이 코퍼스 안의 논문·인용만으로 계산합니다(전체 경력 아님).", "The h-index uses only papers and citations in this corpus, not whole careers."]})}</p>
    <div class="seg" id="seg">${Object.entries(KEYS).filter(([k]) => ranks[k]).map(([k, n], i) => `<button data-k="${k}" class="${i ? "" : "on"}">${n}</button>`).join("")}</div>
    <div class="scroll"><table><thead><tr><th>#</th><th>${K("연구자 · 현재 소속", "Researcher · affiliation")}</th><th>${K("국가", "Country")}</th><th class="n">${K("논문", "Papers")}</th><th class="n">${K("인용", "Cites")}</th><th class="n">h</th><th class="n">${K("최근 1년", "Last yr")}</th></tr></thead><tbody id="rows"></tbody></table></div></div>
    <div class="box profile" id="prof"></div></div>
    <div class="row2"><div class="box"><h2>${K("공동 연구 별자리", "Co-authorship constellation")}</h2><p class="hint">${K("상위 200명 · 별 크기 = 논문 수 · 선 = 함께 쓴 논문 · 색 = 국가", "Top 200 · star size = papers · lines = shared papers · colour = country")}</p><div class="big" id="graph"></div></div>
    <div class="box"><h2>${K("연구를 많이 하는 기관", "Most active institutions")}</h2><p class="hint">${K("논문에 적힌 소속 문자열 기준 (동일 기관의 표기 차이는 아직 합치지 않음)", "By affiliation strings as printed (spelling variants of one institution are not merged yet)")}</p><div class="scroll"><table><thead><tr><th>#</th><th>${K("기관", "Institution")}</th><th>${K("국가", "Country")}</th><th class="n">${K("논문", "Papers")}</th><th class="n">${K("연구자", "Researchers")}</th></tr></thead><tbody id="inst"></tbody></table></div></div></div>`;
  let sel = null;
  const draw = key => {
    const ids = ranks[key] || [], max = Math.max(...ids.map(i => (R[i] || {})[key === "citations" ? "citations_observed" : key] || 0), 1);
    $("rows").innerHTML = ids.map((id, i) => { const r = R[id]; if (!r) return "";
      const v = r[key === "citations" ? "citations_observed" : key] || 0;
      return `<tr class="click${id === sel ? " sel" : ""}" data-id="${id}"><td class="rank">${i + 1}</td>
        <td class="name barcell"><i style="width:${(60 * v / max).toFixed(0)}%"></i><span><b>${esc(r.label)}</b><small>${esc(r.institution || K("소속 미표기", "affiliation not given"))}</small></span></td>
        <td>${esc(r.country || "—")}</td><td class="n">${fmt(r.papers)}</td><td class="n">${fmt(r.citations_observed)}</td><td class="n">${fmt(r.h_index)}</td><td class="n">${fmt(r.recent)}</td></tr>`; }).join("");
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
  $("view").innerHTML = `<div class="box"><h2>${K("연구 관심 레이더", "Research-interest radar")}</h2><p class="hint">${K("비교 기간", "Comparing")} ${d.coverage.momentum_early.join(", ")} → ${d.coverage.momentum_late.join(", ")} · ${K("같은 기간 전체 논문 중 점유율 비교", "share of all papers in each window")}</p><div class="big" id="sc"></div></div>
    <div class="box"><h2>${K("모든 주제", "All topics")}</h2><div class="scroll"><table><thead><tr><th>${K("주제", "Topic")}</th><th>${K("구분", "Kind")}</th><th class="n">${K("전체 논문", "Papers")}</th><th class="n">${K("최근 3개월", "Last 3 mo")}</th><th class="n">${K("관심 변화", "Interest")}</th><th class="n">${K("인용 중앙값", "Median cites")}</th><th>${K("월별 흐름", "By month")}</th></tr></thead><tbody id="tt"></tbody></table></div></div>`;
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
  $("view").innerHTML = `<div class="box"><h2>${K("주제별 최근 발견", "Recent findings by topic")}</h2><p class="hint">${K("AI가 초록을 읽고 원문 문장과 대조해 통과한 요약 · 주제를 고르세요", "AI summaries checked against the source sentence · pick a topic")}</p>
    <div class="seg" id="th"><button data-t="" class="${t0 ? "" : "on"}">${K("전체", "All")}</button>${themes.map(k => `<button data-t="${k}" class="${k === t0 ? "on" : ""}">${esc(topicName(d, k))}</button>`).join("")}</div><div class="row3" id="cards"></div></div>
    <div class="box"><h2>${K("연구자들이 직접 말한 빈 곳", "Gaps the authors name themselves")}</h2><div class="row3" id="gaps"></div></div>`;
  const show = t => { const items = []; (t ? [t] : themes).forEach(k => H[k].forEach(p => items.push(p)));
    const seen = new Set(); $("cards").innerHTML = items.filter(p => p.summary && !seen.has(p.pmid) && seen.add(p.pmid)).sort((a, b) => String(b.date).localeCompare(a.date)).map(paperCard).join(""); };
  $("th").onclick = e => { const b = e.target.closest("button"); if (!b) return; document.querySelectorAll("#th button").forEach(x => x.classList.toggle("on", x === b)); show(b.dataset.t); };
  show(t0);
  $("gaps").innerHTML = (d.author_gaps || []).map(g => `<div class="paper"><div class="find">${lang === "ko" ? esc(g.summary) : sumHTML(g.summary, g.title).html}</div><div class="meta"><span>${esc(g.date)} · ${(g.themes || []).map(t => esc(topicName(d, t))).join(", ")}</span><a href="https://europepmc.org/article/MED/${esc(g.pmid)}" target="_blank" rel="noopener">${source}</a></div></div>`).join("");
}

/* ---------------- world ---------------- */
function world(d) {
  $("view").innerHTML = `<div class="row2"><div class="box"><h2>${K("나라별 논문", "Papers by country")}</h2><div class="big" id="bar"></div></div>
    <div class="box"><h2>${K("가장 많은 국제 공동 연구", "Top international collaborations")}</h2><div class="scroll"><table><thead><tr><th>${K("나라 ↔ 나라", "Country ↔ country")}</th><th class="n">${K("공동 논문", "Shared papers")}</th></tr></thead><tbody id="links"></tbody></table></div></div></div>
    <div class="box"><h2>${K("나라별 대표 기관", "Leading institutions by country")}</h2><div class="row3" id="byc"></div></div>`;
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
  $("view").innerHTML = `<div class="box"><h2>${K("부위 × 주제 지도", "Body site × topic map")}</h2><p class="hint">${K("옅을수록 연구가 적은 곳", "Paler = less research")}</p><div class="big" id="hm"></div></div>
    <div class="row2"><div class="box"><h2>${K("아직 확인되지 않은 공통 전제", "Shared premises not yet confirmed")}</h2><ul id="pr"></ul></div><div class="box"><h2>${K("M-SAGE가 제안한 다음 행동", "Next actions M-SAGE suggests")}</h2><ul id="ac"></ul></div></div>`;
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
  $("view").innerHTML = `<div class="row2"><div class="box"><h2>${K("질병 ↔ 미생물 연결망 (MINERVA)", "Condition ↔ microbe network (MINERVA)")}</h2><p class="hint">${K("질병(주황)과 많이 연관된 미생물(초록=증가, 빨강=감소 보고가 많음) · 선 굵기 = 근거 행 수", "Conditions (orange) and their most linked microbes (green = mostly increase, red = mostly decrease) · line width = evidence rows")}</p><div class="big" id="net"></div></div>
    <div class="box"><h2>${K("질병 연관이 가장 많은 미생물 (허브)", "Hub microbes (most condition links)")}</h2><div class="big" id="hub"></div></div></div>
    <div class="box"><h2>${K("질병별 대표 미생물", "Top microbes by condition")}</h2><div class="row3" id="dz"></div></div>
    <div class="box"><h2>${K("MINERVA 그래프 구성", "MINERVA graph contents")}</h2><div class="row3">${graphs.map(([g, v]) => `<div class="paper"><div class="find">${esc(g)}</div>${(v.node_labels || []).slice(0, 8).map(x => `<div class="ttl">${esc(x.label)} · ${fmt(x.count)}</div>`).join("")}</div>`).join("")}</div>
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
  $("view").innerHTML = `<div class="box"><h2>${K("과거 논문 채우기", "Filling in past papers")}</h2><p class="hint">${bf.months_done} / ${bf.months_total} ${K("개월 완료 · 달마다 최대", "months done · up to")} ${fmt(bf.page_cap * (bf.page_size || 25))} ${K("편", "papers a month")}</p>
    <div class="mgrid" style="grid-template-columns:50px repeat(12,1fr);gap:5px;font-size:12px">${years.map(y => `<span>${y}</span>` + Array.from({length: 12}, (_, i) => { const k = y + "-" + String(i + 1).padStart(2, "0");
      return `<i style="height:26px" class="${m[k] === true ? "done" : k === work ? "work" : ""}" data-tip="${k}"></i>`; }).join("")).join("")}</div></div>
    <div class="box"><h2>${K("연도별 대략 확보량", "Approximate papers by year")}</h2><div class="mid" id="yb"></div></div>`;
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
  const show = key => { ipaneKey = key; charts.splice(0).forEach(c => c.dispose()); pane.innerHTML = ""; ({map: imap, consensus: icons, signature: isig, trends: itrend, gaps: igaps, novel: inovel})[key](d, pane); };
  $("iseg").onclick = e => { const x = e.target.closest("button"); if (!x) return; document.querySelectorAll("#iseg button").forEach(y => y.classList.toggle("on", y === x)); show(x.dataset.k); };
  show(ipaneKey);
}
function imap(d, pane) {
  const N = d.network || {taxa: [], diseases: [], edges: []};
  const hint = V({eli10: ["노란 동그라미는 병, 초록 동그라미는 세균이에요. 빨간 선은 '그 병에서 많아져요', 파란 선은 '줄어들어요'. 동그라미를 눌러 보세요.", "Yellow circles are illnesses, green circles are germs. Red lines mean 'more in that illness', blue lines 'less'. Click a circle."],
    eli20: [`초록의 근거 문장에서 뽑은 관계 · 주황 원 = 질병, 청록 원 = 미생물(속) · <span style="color:${UP}">빨강 선 = 질병에서 증가</span> · <span style="color:${DOWN}">파랑 선 = 감소</span> · <span style="color:${MIX}">노랑 점선 = 논문끼리 엇갈림</span> · 원을 누르면 오른쪽에 관계가 나옵니다`,
            `Relations from evidence sentences · orange = condition, teal = microbe (genus) · <span style="color:${UP}">red = higher in the condition</span> · <span style="color:${DOWN}">blue = lower</span> · <span style="color:${MIX}">dashed amber = papers disagree</span> · click a circle for its relations`,
            `Relazioni tratte dalle frasi di evidenza · arancione = patologia, verde acqua = microbo (genere) · <span style="color:${UP}">rosso = più alto nella patologia</span> · <span style="color:${DOWN}">blu = più basso</span> · <span style="color:${MIX}">tratteggio ambra = gli articoli non concordano</span> · clicca un cerchio per vederne le relazioni`,
            `Relations tirées des phrases de preuve · orange = pathologie, bleu-vert = microbe (genre) · <span style="color:${UP}">rouge = plus élevé dans la pathologie</span> · <span style="color:${DOWN}">bleu = plus bas</span> · <span style="color:${MIX}">pointillés ambre = les articles ne concordent pas</span> · cliquez sur un cercle pour voir ses relations`],
    pro: ["상위 속과 질병, 방향 표 ≥ 4인 간선 · 간선 굵기 ∝ √근거 문장 · 엇갈림 = 반대 방향 ≥30% · 같은 그래프를 로컬 Neo4j(Taxon, Disease, ASSOCIATED)에서 질의할 수 있습니다", "Top genera and conditions, edges with ≥4 votes · width ∝ √evidence sentences · contested = ≥30% opposite · the same graph is queryable in the local Neo4j (Taxon, Disease, ASSOCIATED)"]});
  pane.innerHTML = `<div class="row2"><div class="box"><h2>${K("미생물 ↔ 질병 지식 지도", "Microbe ↔ condition knowledge map")}</h2>
    <p class="hint">${hint}</p>
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
    $("kgside").innerHTML = `<h2>${esc(isD ? dlab(key) : key)}</h2><p class="hint">${isD ? K("이 질병과 함께 보고된 미생물", "Microbes reported with this condition") : K("이 미생물이 보고된 질병", "Conditions this microbe is reported in")} · ${K("근거 문장 수", "evidence sentences")}</p>
      <table><tbody>${es.map(e => `<tr><td>${esc(isD ? e.s : dlab(e.t))}</td>
        <td style="width:45%"><div class="bal"><i style="width:${50 + 50 * e.score}%;background:${e.contested ? MIX : e.score > 0 ? UP : DOWN}"></i></div></td>
        <td class="n">${e.w}</td><td style="color:${e.contested ? MIX : e.score > 0 ? UP : DOWN}">${dirWord(e.score)}</td></tr>`).join("")}</tbody></table>`; };
  g.on("click", p => { if (p.dataType === "node") side(p.data.id); });
  if (N.diseases.length) side("D:" + N.diseases.slice().sort((a, b) => b.w - a.w)[0].id);
}
function pairTable(rows, withMinerva) {
  return `<table><thead><tr><th>${K("미생물", "Microbe")}</th><th>${K("질병", "Condition")}</th><th>${K("감소 ◀ ▶ 증가", "Lower ◀ ▶ higher")}</th><th class="n">${K("논문", "Papers")}</th>${withMinerva ? "<th>MINERVA</th>" : ""}</tr></thead><tbody>${rows.map((p, i) => {
    const tot = p.inc + p.dec || 1;
    return `<tr class="click" data-i="${i}"><td><i>${esc(p.taxon)}</i></td><td>${esc(dx(p.disease, p.disease_label))}</td>
      <td style="width:34%"><div class="div"><span style="width:${50 * p.dec / tot}%;background:${DOWN}"></span><span style="width:${50 * p.inc / tot}%;background:${UP}"></span></div>
      <small>${p.dec} ◀ ▶ ${p.inc}${p.null ? " · " + K("차이 없음", "no difference") + " " + p.null : ""}${p.ai_checked && level !== "eli10" ? ` · <span style="color:var(--violet)">${K("그룹 대조 확인", "group-checked")} ${p.ai_checked}</span>` : ""}</small></td><td class="n">${p.papers}</td>
      ${withMinerva ? `<td>${p.minerva == null ? "—" : p.minerva.disease_missing ? `<span style="color:var(--dim)">${K("질병 없음", "no condition")}</span>` : p.minerva.absent ? `<span style="color:var(--lime)">${K("없음 (새 연결)", "absent (new link)")}</span>` : (p.minerva_agrees === false ? `<span style="color:var(--coral)">${K("반대 방향", "opposite")}</span>` : `<span style="color:var(--teal)">${K("같은 방향", "same direction")}</span>`)}</td>` : ""}</tr>`; }).join("")}</tbody></table>`;
}
function icons(d, pane) {
  const mc = d.minerva_compared;
  const h1 = V({eli10: ["많은 논문이 같은 말을 하는 세균과 병이에요. 줄을 누르면 실제 논문 문장이 보여요.", "Germs and illnesses that many papers agree on. Click a row to read the real sentences."],
    eli20: ["같은 방향(증가 또는 감소)을 보고한 문장이 60% 이상이고 5건 이상인 미생물–질병 쌍 · 행을 누르면 근거 문장", "Microbe–condition pairs where ≥60% of ≥5 sentences report the same direction · click a row for the evidence"],
    pro: ["합의 점수 = (증가−감소)/(증가+감소+무차이), |점수| ≥ 0.6, 근거 ≥ 5, 문 수준 제외 · 그룹 대조 확인 = AI 판정이 비교 그룹을 확인한 문장 수", "Score = (inc−dec)/(inc+dec+null), |score| ≥ 0.6, ≥5 sentences, phylum excluded · group-checked = sentences whose comparison groups the AI judge confirmed"]});
  const h2 = V({eli10: ["어떤 논문은 '많아진다', 어떤 논문은 '줄어든다'고 해요. 아직 답이 없어요.", "Some papers say 'more', others say 'less'. No answer yet."],
    eli20: ["증가와 감소 보고가 함께 30% 이상 섞인 쌍 · 해결이 필요한 질문입니다", "Pairs where increase and decrease each make up ≥30% · open questions"],
    pro: ["논쟁 = 소수 방향 비율 ≥ 0.3 · 하위 집단·방법 차이로 갈리는지는 '미생물 시그니처'와 자동 추가 분석에서 봅니다", "Debate = minority direction share ≥ 0.3 · whether subgroups or methods split it is in signatures and the automatic follow-ups"]});
  pane.innerHTML = `<div class="row2"><div class="box"><h2>${K("논문들이 한목소리로 말하는 관계", "Relations papers agree on")}</h2><p class="hint">${h1}</p>
      <div class="scroll" id="cons">${pairTable(d.consensus.slice(0, 40), mc)}</div></div>
    <div class="box"><h2>${K("논문끼리 부딪히는 관계 (논쟁 중)", "Relations papers disagree on")}</h2><p class="hint">${h2}</p>
      <div class="scroll" id="contra">${pairTable(d.contradictions.slice(0, 40), mc)}</div></div></div>
    <div class="box" id="ev"><h2>${K("근거 문장", "Evidence sentences")}</h2><p class="hint">${K("왼쪽 표에서 쌍을 고르면 여기에 원문 인용과 요약이 나옵니다.", "Pick a pair in a table to see the quoted source sentences here.")}</p></div>`;
  const pick = (rows, el) => el.onclick = e => { const t = e.target.closest("tr[data-i]"); if (!t) return; const p = rows[+t.dataset.i];
    $("ev").innerHTML = `<h2><i>${esc(p.taxon)}</i> · ${esc(dx(p.disease, p.disease_label))}</h2><p class="hint">${K("증가", "increase")} ${p.inc} · ${K("감소", "decrease")} ${p.dec} · ${K("차이 없음", "no difference")} ${p.null} · ${K("논문", "papers")} ${p.papers}</p>
      <div class="row2">${(p.examples || []).map(quoteCard).join("") || `<p class="hint">${K("상위 40개만 예시 문장을 미리 계산합니다.", "Example sentences are precomputed for the top 40 only.")}</p>`}</div>`; };
  pick(d.consensus, $("cons")); pick(d.contradictions, $("contra"));
}
function isig(d, pane) {
  const E = (d.network || {}).edges || [], taxa = [...new Set(E.map(e => e.s))], dis = d.network.diseases.slice().sort((a, b) => b.w - a.w).slice(0, 22);
  const tw = {}; E.forEach(e => tw[e.s] = (tw[e.s] || 0) + e.w); const tt = taxa.sort((a, b) => tw[b] - tw[a]).slice(0, 30);
  const dlab = id => { const x = d.network.diseases.find(q => q.id === id); return dx(id, x ? x.label : id); };
  const h = V({eli10: ["빨간 칸은 그 병에서 세균이 많아진다는 뜻, 파란 칸은 줄어든다는 뜻이에요.", "Red cells: the germ goes up in that illness. Blue cells: it goes down."],
    eli20: ["빨강 = 그 질병에서 많아진다는 보고가 우세 · 파랑 = 줄어든다는 보고가 우세 · 칸 숫자 = 근거 문장 수", "Red = mostly reported higher in the condition · blue = mostly lower · number = evidence sentences"],
    pro: ["색 = 방향 점수(−1 감소 … +1 증가), 숫자 = 근거 문장 수 · 상위 30속 × 상위 22질병", "Colour = direction score (−1 lower … +1 higher), number = evidence sentences · top 30 genera × top 22 conditions"]});
  pane.innerHTML = `<div class="row2"><div class="box"><h2>${K("미생물 × 질병 방향 지도", "Microbe × condition direction map")}</h2><p class="hint">${h}</p><div class="big" id="hm" style="height:760px"></div></div>
    <div class="box"><h2>${K("여러 질병에 공통으로 나타나는 미생물", "Microbes shared across conditions")}</h2><p class="hint">${K("3개 이상 질병에서 방향이 일관된 미생물 · 파랑이 많으면 '건강 지표' 후보, 빨강이 많으면 '질환 지표' 후보", "Microbes with a consistent direction in 3+ conditions · mostly blue = health-marker candidate, mostly red = disease-marker candidate")}</p><div class="scroll" style="max-height:760px">
    ${(d.signatures || []).slice(0, 30).map(s => `<div class="sig"><b><i>${esc(s.taxon)}</i></b><small>${K("질병", "conditions")} ${s.diseases} · ${K("근거", "evidence")} ${s.evidence}</small>
      <div class="div"><span style="width:${50 * s.down.length / s.diseases}%;background:${DOWN}"></span><span style="width:${50 * s.up.length / s.diseases}%;background:${UP}"></span></div>
      <div class="chips">${s.down.map(x => `<span class="chip" style="color:${DOWN}">↓ ${esc(dlab(x))}</span>`).join("")}${s.up.map(x => `<span class="chip" style="color:${UP}">↑ ${esc(dlab(x))}</span>`).join("")}</div></div>`).join("")}</div></div></div>`;
  const data = []; E.forEach(e => { const x = dis.findIndex(q => q.id === e.t), y = tt.indexOf(e.s); if (x >= 0 && y >= 0) data.push([x, y, e.score, e.w]); });
  chart("hm", {grid: {left: 150, right: 20, top: 10, bottom: 110}, tooltip: {formatter: p => `${esc(tt[p.data[1]])} · ${esc(dlab(dis[p.data[0]].id))}<br>${K("근거", "Evidence")} ${p.data[3]} · ${dirWord(p.data[2])}`},
    xAxis: {type: "category", data: dis.map(x => dlab(x.id)), axisLabel: {color: C.muted, rotate: 50, fontSize: 11}, splitArea: {show: false}},
    yAxis: {type: "category", data: tt, inverse: true, axisLabel: {color: "#99f6e4", fontStyle: "italic", fontSize: 11}},
    visualMap: {min: -1, max: 1, show: false, inRange: {color: [DOWN, "#1e293b", UP]}, dimension: 2},
    series: [{type: "heatmap", data, label: {show: true, formatter: p => p.data[3], color: "#f1f5f9", fontSize: 10}, itemStyle: {borderColor: "#04070f", borderWidth: 2, borderRadius: 4}}]});
}
function itrend(d, pane) {
  const CAT = {Disease: K("질병", "Conditions"), Taxon: K("미생물", "Microbes"), Intervention: K("개입", "Interventions"), Metabolite: K("대사물질", "Metabolites"), Method: K("연구 방법", "Methods"), BodySite: K("몸 부위", "Body sites")};
  const h = V({eli10: ["예전보다 요즘 더 많이 나오는 주제예요. ×2는 두 배라는 뜻이에요.", "Topics mentioned more now than before. ×2 means twice as often."],
    eli20: ["최근 2년 논문 중 언급 비율 ÷ 3–5년 전 비율 · 연도별 수집량에 상한이 있어 '비율'로 비교합니다", "Share of mentions in the last 2 years ÷ 3–5 years ago · yearly collection is capped, so shares are compared"],
    pro: ["성장 = share(최근 2년) / share(3–5년 전), 최소 논문 수 적용 · 수집은 최근 쪽으로 치우쳐 있어 절대 규모로 해석하지 마세요", "Growth = share(last 2 y) / share(3–5 y ago) with a minimum paper count · collection is recency-skewed; not absolute volume"]});
  pane.innerHTML = `<div class="seg" id="cseg">${Object.entries(CAT).map(([k, n], i) => `<button data-k="${k}" class="${i ? "" : "on"}">${n}</button>`).join("")}</div>
    <div class="row2"><div class="box"><h2>${K("떠오르는 주제", "Rising")}</h2><p class="hint">${h}</p><div class="mid" id="rise"></div></div>
    <div class="box"><h2>${K("관심이 줄어드는 주제", "Fading")}</h2><p class="hint">${K("같은 기준으로 비율이 가장 많이 줄어든 주제", "Largest falls in share, same measure")}</p><div class="mid" id="fade"></div></div></div>
    <div class="row2"><div class="box"><h2>${K("연도별 언급 비율 (상위 떠오르는 주제)", "Share by year (top rising)")}</h2><div class="mid" id="lines"></div></div>
    <div class="box"><h2>${K("떠오르는 주제를 이끄는 연구자 (최근 3년)", "Researchers leading rising topics (last 3 years)")}</h2><div id="lead" class="scroll" style="max-height:380px"></div></div></div>`;
  const draw = cat => { charts.splice(0).forEach(c => c.dispose()); const t = d.trends[cat];
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
  const h = V({eli10: ["관심은 많은데 답이 엇갈리고 아직 모르는 게 많은 병이 위에 있어요.", "Illnesses with lots of interest but mixed answers and many unknowns come first."],
    eli20: ["관심 증가 · 논문끼리 엇갈림 · 저자들이 직접 쓴 한계 · MINERVA에 없는 새 연결을 합친 점수 · 점수는 방향을 제시할 뿐 판단이 아닙니다", "Score combining rising interest, conflicting papers, limitations the authors state and links new to MINERVA · a pointer, not a verdict"],
    pro: ["점수 = 2·ln(성장) + 1.5·ln(1+논쟁 쌍) + 0.8·ln(1+한계 진술) + ln(1+MINERVA 미수록) − 0.3·ln(1+논문) · 가중치는 경험적이며 검증되지 않았습니다", "Score = 2·ln(growth) + 1.5·ln(1+contested pairs) + 0.8·ln(1+limitations) + ln(1+not in MINERVA) − 0.3·ln(1+papers) · heuristic, unvalidated weights"]});
  pane.innerHTML = `<div class="box"><h2>${K("다음에 해야 할 연구 (자동 우선순위)", "What to study next (automatic priority)")}</h2><p class="hint">${h}</p><div class="cards" id="next"></div></div>
    <div class="row2"><div class="box"><h2>${K("질병별로 저자들이 털어놓은 한계", "Limitations authors state, by condition")}</h2><p class="hint">${K("논문의 limitation · gap 문장을 주제로 분류 · 칸 숫자 = 논문 수", "Limitation and gap sentences grouped by theme · number = papers")}</p><div class="big" id="gm" style="height:640px"></div></div>
    <div class="box"><h2>${K("가장 자주 나오는 한계", "Most frequent limitations")}</h2><div class="mid" id="gt"></div><div id="gq" class="scroll" style="max-height:250px"></div></div></div>`;
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
    <div class="row2"><div class="box"><h2>${K("MINERVA에 아직 없는 연결", "Links MINERVA does not have yet")}</h2><p class="hint">${V({eli10: ["우리 논문에서는 보이는데 MINERVA에는 아직 없는 연결이에요.", "Links our papers show that MINERVA does not have yet."], eli20: ["우리 코퍼스에서 3편 이상 같은 방향 · MINERVA 미생물→질병 관계에는 없음 · 행을 누르면 근거", "≥3 papers in our corpus agree · absent from MINERVA's microbe→condition relations · click a row for evidence"], pro: ["질병 이름 대응은 정규식 자동 대응이라 일부는 표기 차이일 수 있어 확인이 필요합니다.", "Condition names are mapped automatically by regex; some may be naming differences and need review."]})}</p><div class="scroll" id="nv">${pairTable(d.novel || [], true)}</div></div>
    <div class="box"><h2>${K("MINERVA와 방향이 반대인 연결", "Links opposite to MINERVA")}</h2><p class="hint">${K("새 논문들이 기존 지식과 다른 방향을 말하는 경우 · 재검토 후보", "New papers point the other way from existing knowledge · candidates for review")}</p><div class="scroll">${pairTable(opp, true)}</div></div></div>
    <div class="box" id="ev"><h2>${K("근거 문장", "Evidence sentences")}</h2></div>`;
  $("nv").onclick = e => { const t = e.target.closest("tr[data-i]"); if (!t) return; const p = d.novel[+t.dataset.i];
    $("ev").innerHTML = `<h2><i>${esc(p.taxon)}</i> · ${esc(dx(p.disease, p.disease_label))}</h2><div class="row2">${(p.examples || []).map(quoteCard).join("")}</div>`; };
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
  "Cytokines": "Citochine"
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
  "Cytokines": "Cytokines"
}; }
})();
