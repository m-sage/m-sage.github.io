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
  const h1 = V({eli10: ["많은 논문이 같은 말을 하는 세균과 병이에요. 줄을 누르면 실제 논문 문장이 보여요.", "Germs and illnesses that many papers agree on. Click a row to read the real sentences."],
    eli20: ["같은 방향(증가 또는 감소)을 보고한 문장이 60% 이상이고 5건 이상인 미생물–질병 쌍 · 행을 누르면 근거 문장", "Microbe–condition pairs where ≥60% of ≥5 sentences report the same direction · click a row for the evidence"],
    pro: ["합의 점수 = (증가−감소)/(증가+감소+무차이), |점수| ≥ 0.6, 근거 ≥ 5, 문 수준 제외 · 그룹 대조 확인 = AI 판정이 비교 그룹을 확인한 문장 수", "Score = (inc−dec)/(inc+dec+null), |score| ≥ 0.6, ≥5 sentences, phylum excluded · group-checked = sentences whose comparison groups the AI judge confirmed"]});
  const h2 = V({eli10: ["어떤 논문은 '많아진다', 어떤 논문은 '줄어든다'고 해요. 아직 답이 없어요.", "Some papers say 'more', others say 'less'. No answer yet."],
    eli20: ["증가와 감소 보고가 함께 30% 이상 섞인 쌍 · 해결이 필요한 질문입니다", "Pairs where increase and decrease each make up ≥30% · open questions"],
    pro: ["논쟁 = 소수 방향 비율 ≥ 0.3 · 하위 집단·방법 차이로 갈리는지는 '미생물 시그니처'와 자동 추가 분석에서 봅니다", "Debate = minority direction share ≥ 0.3 · whether subgroups or methods split it is in signatures and the automatic follow-ups"]});
  pane.innerHTML = `<div class="row2"><div class="box"><h2>${K("논문들이 한목소리로 말하는 관계", "Relations papers agree on")}</h2><p class="hint">${h1}</p>
      <div class="scroll" id="cons">${pairTable(d.consensus.slice(0, 40), mc, true)}</div></div>
    <div class="box"><h2>${K("논문끼리 부딪히는 관계 (논쟁 중)", "Relations papers disagree on")}</h2><p class="hint">${h2}</p>
      <div class="scroll" id="contra">${pairTable(d.contradictions.slice(0, 40), mc, true)}</div></div></div>
    <div class="box" id="ev"><h2>${K("근거 문장", "Evidence sentences")}</h2><p class="hint">${K("왼쪽 표에서 쌍을 고르면 여기에 원문 인용과 요약이 나옵니다.", "Pick a pair in a table to see the quoted source sentences here.")}</p></div>`;
  const pick = (rows, el) => el.onclick = e => { const t = e.target.closest("tr[data-i]"); if (!t) return; const p = rows[+t.dataset.i];
    $("ev").innerHTML = `<h2><i>${esc(p.taxon)}</i> · ${esc(dx(p.disease, p.disease_label))}</h2><p class="hint">${K("증가", "increase")} ${p.inc} · ${K("감소", "decrease")} ${p.dec} · ${K("차이 없음", "no difference")} ${p.null} · ${K("논문", "papers")} ${p.papers}${p.groups != null ? `<br>${K("독립 그룹", "independent groups")} ${fmt(p.groups)}${p.groups_increase != null ? ` (↑${fmt(p.groups_increase)} / ↓${fmt(p.groups_decrease)})` : ""} · ${K("연도", "years")} ${yrs(p)} · ${K("학술지", "journals")} ${fmt(p.journals)}${p.cited_share != null ? " · " + K("인용된 비율", "cited share") + " " + pc(p.cited_share, 0) : ""} ${robustB(p.robust)}` : ""}</p>
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

/* 1. reversal candidates */
function irev(d, pane) {
  const title = K("되돌리기 후보: 질병에서 바뀐 미생물을 되돌리는 개입", "Reversal candidates: interventions that push a disease-shifted microbe back");
  const R = d.reversal || [];
  if (!R.length) { pane.innerHTML = noData(title, d.reversal ? K("조건을 넘은 후보가 아직 없습니다.", "No candidate passes the thresholds yet.") : NODATA()); return; }
  const h = V({eli10: ["어떤 병에서는 몸속 세균이 너무 줄거나 너무 늘어요. 다른 논문들은 어떤 방법(유산균, 식단 등)이 그 세균을 다시 늘리거나 줄인다고 해요. 두 가지를 이어 붙여 '이걸 시험해 보면 어떨까?' 하는 아이디어를 만든 거예요. 치료법이 아니에요.",
      "In some illnesses a germ drops too low or grows too much. Other papers say some treatment (probiotics, diet…) raises or lowers that germ. We join the two into ideas worth testing. These are not treatments."],
    eli20: ["질병 문헌(이 질병에서 미생물이 감소/증가)과 개입 문헌(이 개입이 그 미생물을 증가/감소)을 이어 붙인 가설입니다. 행을 누르면 양쪽 근거 문장을 봅니다. '이미 시험됨'은 이 질병을 언급한 개입 논문 수입니다.",
      "Hypotheses joining two literatures: the condition papers (microbe lower/higher in the condition) and the intervention papers (the intervention raises/lowers that microbe). Click a row for both sides' evidence. 'Already tested' counts intervention papers that also mention the condition."],
    pro: ["점수 = 질병 다수 방향 표·비율과 개입 다수 방향 논문·비율의 결합(논쟁 쌍은 0.5배), 문 수준 제외, 질병당 6·미생물당 5·전체 60개 상한 · 개입 쪽은 사람 숙주 문장만 · 재현 = 질병 쪽 독립 그룹 ≥3·기간 ≥3년이고 개입 쪽 그룹 ≥2",
      "Score combines the condition-side majority votes and ratio with the intervention-side majority papers and ratio (contested pairs ×0.5); phylum excluded; capped at 6 per condition, 5 per microbe, 60 overall · intervention side uses human-host sentences only · replicated = condition side ≥3 independent groups over ≥3 years and intervention side ≥2 groups"]});
  const cnt = {}; R.forEach(r => cnt[r.disease] = (cnt[r.disease] || 0) + 1);
  const dis = Object.keys(cnt).sort((a, b) => cnt[b] - cnt[a] || a.localeCompare(b));
  const dl = id => { const r = R.find(x => x.disease === id); return dx(id, r && r.disease_label); };
  pane.innerHTML = `<div class="box"><h2>${title}</h2><p class="hint">${h}</p>${secCav("reversal")}
      <div class="ctl"><label>${K("질병", "Condition")} <select id="rvdis">${opt("", K("전체", "All"), R.length)}${dis.map(k => opt(k, dl(k), cnt[k])).join("")}</select></label>
      <label class="chk"><input type="checkbox" id="rvrob"> ${K("독립 재현된 것만", "Replicated only")}</label>
      <span class="legend"><i style="background:${C.amber}"></i>${K("질병", "Condition")} <i style="background:${DOWN}"></i>${K("질병에서 감소", "lower in condition")} <i style="background:${UP}"></i>${K("질병에서 증가", "higher in condition")} <i style="background:${C.teal}"></i>${esc(slab("reversal_direction", "restore"))} <i style="background:${C.coral}"></i>${esc(slab("reversal_direction", "suppress"))}</span></div>
      <div class="mid" id="rvsk" style="height:480px"></div></div>
    <div class="row2"><div class="box"><h2>${K("후보 목록", "Candidate list")}</h2><p class="hint">${K("점수 순 · 행을 누르면 오른쪽에 양쪽 근거", "Ranked by score · click a row for both sides' evidence")}</p><div class="scroll" id="rvt"></div></div>
      <div class="box" id="rvev"><h2>${K("근거 문장", "Evidence sentences")}</h2><p class="hint">${K("목록에서 후보를 고르세요.", "Pick a candidate in the list.")}</p></div></div>`;
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
  const apply = () => { const k = $("rvdis").value, rob = $("rvrob").checked; rows = R.filter(r => (!k || r.disease === k) && (!rob || r.robust)); table(); sankey(); };
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
  if (PB) html += `<div class="row2"><div class="box"><h2>${K("출판 편향: '차이 없음' 보고 비율", "Publication bias: share of 'no difference' reports")}</h2><p class="hint">${K("근거 문장 종류별 · 낮을수록 '차이 없음' 결과가 초록에 덜 실림", "By kind of evidence sentence · lower = 'no difference' results appear less in abstracts")}</p>${secCav("publication_bias")}<div class="mid" id="pbt" style="height:260px"></div></div>
      <div class="box"><h2>${K("질병별 '차이 없음' 비율", "'No difference' share by condition")}</h2><p class="hint">${K("미생물–질병 간선이 다음 이상인 질병", "Conditions with at least this many microbe–condition edges")}: ${fmt(PB.min_edges_per_disease)} · ${K("막대 = 비율, 숫자 = 간선 수", "bar = share, label = edges")}</p><div class="mid" id="pbd" style="height:520px"></div></div></div>`;
  if (TG) html += `<div class="row2"><div class="box"><h2>${K("동물 → 사람: 개입 효과가 사람에서도 같은가", "Animal → human: does the intervention effect hold in people?")}</h2>
      <p class="hint">${V({eli10: ["쥐에서 본 효과가 사람에서도 보였는지 세어 봤어요.", "We counted whether effects seen in mice were also seen in people."], eli20: ["동물 문장에서 같은 방향 ≥3편인 개입→미생물 효과를 사람 문장과 비교", "Intervention → microbe effects with ≥3 same-direction animal papers, compared with human sentences"], pro: ["동물 ≥3편·비율 ≥2, 사람 확인 ≥2편 · 사람 = 제목과 문장에 동물·실험 모델이 없는 문장", "Animal ≥3 papers and ratio ≥2; human confirmation ≥2 papers · human = no animal or laboratory model named in the title or sentence"]})}</p>${secCav("translation_gap")}
      <div class="scroll" style="max-height:360px"><table><thead><tr><th>${K("개입", "Intervention")}</th>${["confirmed", "discordant", "gap", "pending"].map(s => `<th class="n">${esc(slab("translation_state", s))}</th>`).join("")}</tr></thead><tbody>
      ${Object.entries(TG.per_intervention || {}).map(([k, v]) => `<tr><td>${esc(iv(k))}</td><td class="n" style="color:${C.teal}">${fmt(v.confirmed)}</td><td class="n" style="color:${C.coral}">${fmt(v.discordant)}</td><td class="n" style="color:${C.amber}">${fmt(v.gap)}</td><td class="n">${fmt(v.pending)}</td></tr>`).join("")}
      ${TG.totals ? `<tr><td><b>${K("합계", "Total")}</b></td><td class="n"><b>${fmt(TG.totals.confirmed)}</b></td><td class="n"><b>${fmt(TG.totals.discordant)}</b></td><td class="n"><b>${fmt(TG.totals.gap)}</b></td><td class="n"><b>${fmt(TG.totals.pending)}</b></td></tr>` : ""}</tbody></table></div>
      ${level === "pro" && TG.animal_edges != null ? `<p class="hint">${K("동물 간선", "Animal edges")} ${fmt(TG.animal_edges)} · ${K("동물 의심 간선", "suspected-animal edges")} ${fmt(TG.animal_suspect_edges)}</p>` : ""}</div>
    <div class="box"><h2>${K("사람에서 반대 또는 동물에서만", "Opposite in humans, or animal only")}</h2><p class="hint">${K("행을 누르면 근거 문장", "Click a row for the evidence")}</p><div class="seg" id="tgs">${["discordant", "gap", "confirmed"].map((s, i) => `<button data-k="${s}" class="${i ? "" : "on"}">${esc(slab("translation_state", s))} (${(TG[s] || []).length})</button>`).join("")}</div>
      <div class="scroll" style="max-height:300px" id="tgt"></div><div id="tge"></div></div></div>`;
  if (RS) html += `<div class="row2"><div class="box"><h2>${K("해상도: 종·균주 이름까지 쓰는 비율", "Resolution: share naming a species or strain")}</h2><p class="hint">${K("연도별 미생물 관계 문장 중 종 이름을 쓴 비율과 균주 표기 비율", "Per year: share of microbe relation sentences naming a species, and naming a strain")}</p>${secCav("resolution")}<div class="mid" id="rsy"></div>${level === "pro" && RS.strain_note ? `<p class="hint">${esc(noteT(RS.strain_note))}</p>` : ""}</div>
      <div class="box"><h2>${K("질병별 종 수준 비율", "Species-level share by condition")}</h2><p class="hint">${K("간선이 많은 질병 순", "Conditions with most edges first")}</p><div class="mid" id="rsd" style="height:520px"></div></div></div>`;
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
    const list = key => { const L = TG[key] || [];
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
    html += `<div class="row2"><div class="box"><h2>${K("근거 × 임상시험 사분면", "Evidence × trial-activity quadrant")}</h2><p class="hint">${K("가로 = 근거, 세로 = 임상시험 활동", "x = evidence, y = trial activity")} · ${K("등록 시험", "registered trials")} ${fmt(TR.studies)}${TR.fetched_at ? " · " + K("수집", "fetched") + " " + esc(typeof TR.fetched_at === "number" ? new Date(TR.fetched_at * 1000).toISOString().slice(0, 10) : String(TR.fetched_at).slice(0, 10)) : ""}</p>${secCav("trials")}
        <div class="legend">${["opportunity", "crowded", "speculative", "early"].map(q => `<i style="background:${QCOL[q]}"></i>${esc(slab("quadrant", q))} (${TR.quadrant.filter(x => x.quadrant === q).length})`).join(" ")}</div><div class="big" id="tq"></div></div>
      <div class="box"><h2>${K("질병별 임상시험 단계", "Trial phases by condition")}</h2><p class="hint">${K("등록 시험 수 상위 질병", "Conditions with the most registered trials")}</p><div class="big" id="tph"></div></div></div>
      <div class="box"><h2>${K("최근 등록된 임상시험", "Latest registered trials")}</h2><div class="ctl"><label>${K("질병", "Condition")} <select id="tdis"></select></label></div><div class="scroll" style="max-height:420px" id="tlist"></div></div>`;
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
      ${prod.length ? `<div class="box"><h2>${K("허가 심사를 거친 제품", "Products through regulatory review")}</h2><div class="cards">${prod.map(card).join("")}</div></div>` : ""}
      <div class="row2">${pipe.length ? `<div class="box"><h2>${K("개발 중인 후보 (단계별)", "Pipeline by phase")}</h2><p class="hint">${K("행을 누르면 설명과 출처", "Click a row for the summary and sources")}</p><div class="scroll" style="max-height:560px"><table><thead><tr><th>${K("후보", "Candidate")}</th><th>${K("단계", "Phase")}</th><th>${K("적응증", "Indication")}</th><th>${K("날짜", "Date")}</th></tr></thead><tbody>
        ${pipe.map((e, i) => `<tr class="click" data-p="${i}"><td class="name"><b>${esc(e.name)}</b><small>${esc(e.company || "")}${e.modality ? " · " + modal(e.modality) : ""}</small></td><td>${istat(e.status)}</td><td>${esc(e.indication || "")}<div class="chips">${evc(e.disease)}</div></td><td style="white-space:nowrap">${esc(e.date || "")}</td></tr>`).join("")}</tbody></table></div><div id="pdet"></div></div>` : ""}
      ${tl.length ? `<div class="box"><h2>${K("타임라인 (최신 순)", "Timeline (newest first)")}</h2><p class="hint">${K("승인 · 결과 발표 · 거래 · 폐업 · 투자", "Approvals · readouts · deals · closures · financings")}</p><div class="scroll tl" style="max-height:640px">
        ${tl.map(e => { const k = EVKIND(e); return `<div class="tli"><i style="background:${k[2]}"></i><div><small>${esc(e.date || "")} · <b style="color:${k[2]}">${K(k[0], k[1])}</b></small><div><b>${esc(e.name)}</b> <span class="isub">${esc(e.company || "")}</span></div><p>${esc(itext(e))}</p>${isrc(e)}</div></div>`; }).join("")}</div></div>` : ""}</div>
      ${comp.length ? `<div class="box"><h2>${K("회사와 폐업이 남긴 교훈", "Companies, and lessons from closures")}</h2><p class="hint">${K("활동 중인 회사와 문을 닫은 회사 · 폐업 카드의 글이 교훈입니다", "Active and closed companies · the text on closed companies is the lesson")}</p>
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
  if (SV) html += `<div class="box"><h2>${K("더 나쁜 하위 집단에서 달라지는 미생물", "Microbes that differ in the worse subgroup")}</h2>${secCav("severity")}
      ${(SV.items || []).length ? SV.items.map(x => it(x, x.in_worse_subgroup === "lower" ? ["↓ " + K("나쁜 쪽에서 감소", "lower when worse"), DOWN] : ["↑ " + K("나쁜 쪽에서 증가", "higher when worse"), UP], esc(slab("subgroup_kind", x.kind)))).join("") : `<p class="hint">—</p>`}
      ${level === "pro" && SV.subgroup_edges != null ? `<p class="hint">${K("하위 집단 간선", "Subgroup edges")} ${fmt(SV.subgroup_edges)} · ${K("어느 쪽이 나쁜지 판정됨", "worse side resolved")} ${fmt(SV.polarity_resolved)}</p>` : ""}</div>`;
  if (RK) html += `<div class="box"><h2>${K("발병 위험과 연관된 미생물", "Microbes associated with disease risk")}</h2>${secCav("risk")}
      ${(RK.items || []).length ? RK.items.map(x => it(x, x.direction === "lower_risk" ? ["↓ " + K("위험 낮음", "lower risk"), C.teal] : ["↑ " + K("위험 높음", "higher risk"), C.coral], x.mendelian_share ? K("멘델 무작위분석", "Mendelian randomization") + " " + pc(x.mendelian_share, 0) : K("관찰 연관", "observational"))).join("") : `<p class="hint">—</p>`}</div>`;
  html += `</div>`;
  if (MT) html += `<div class="box"><h2>${K("기전 삼각형: 미생물 – 대사물질 – 질병 (공동 언급)", "Mechanism triangles: microbe – metabolite – condition (co-mention)")}</h2>
    <p class="hint">${K("향상도 ×2 = 그 질병 논문 전체보다 이 미생물–질병 논문에서 그 대사물질이 두 배 자주 언급됨", "Lift ×2 = the metabolite is mentioned twice as often in papers on this microbe and condition as in all papers on the condition")}</p>${secCav("mechanism_triangles")}
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
