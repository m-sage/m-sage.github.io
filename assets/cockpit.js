(function () {
"use strict";
const C = {teal: "#2dd4bf", coral: "#fb7185", amber: "#fbbf24", violet: "#a78bfa", sky: "#38bdf8", lime: "#a3e635",
  text: "#e6ecff", muted: "#8d9bc4", dim: "#5d6a92", line: "#1b2648"};
const PAL = [C.sky, C.coral, C.teal, C.amber, C.violet, C.lime, "#f472b6", "#60a5fa", "#fb923c", "#94a3b8"];
/* language (ko/en/it/fr) and reading level (eli10/eli20/pro): shared with /story through localStorage */
const STATIC = window.MSAGE_STATIC || null;            // set only in the packaged, server-free website
const ROUTE = window.MSAGE_ROUTES || {cockpit: "/cockpit", story: "/story", module: "/cockpit/module"};   // page addresses
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
  if (window.MSAGE_I18N_MISS) window.MSAGE_I18N_MISS(en, "cockpit", lang); return en; };
const K = (ko, en, it, fr) => lang === "ko" ? ko : lang === "en" ? en : (lang === "it" ? it : fr) ?? xlate(en);   // pick by language
const V = o => { const x = o[level] || o.eli20; return Array.isArray(x) ? K(x[0], x[1], x[2], x[3]) : x; };   // pick by level, then language
const nm = s => XL() ? xlate(s) : s;                           // English data label -> Italian/French name
const LOC = gb => ({ko: "ko-KR", it: "it-IT", fr: "fr-FR"})[lang] || (gb ? "en-GB" : "en-US");
const SITE = {airway: ["호흡기", "Airway"], gut: ["장", "Gut"], multi_site: ["여러 부위", "Multi-site"], oral: ["구강", "Oral"], skin: ["피부", "Skin"], urogenital: ["비뇨생식기", "Urogenital"]};
const MT = {brain: ["뇌·신경", "Brain"], cancer: ["암", "Cancer"], diagnosis: ["진단", "Diagnosis"], diet: ["식이", "Diet"], immune: ["면역", "Immunity"],
  intervention: ["개입·치료", "Intervention"], metabolites: ["대사물질", "Metabolites"], omics: ["오믹스", "Omics"]};
const SVC = {"system-serve": ["웹", "Web"], "system-watch": ["수집", "Collect"], "evidence-watch": ["근거", "Evidence"], "abstract-bedrock-watch": ["초록 AI", "Abstract AI"], "msage-watch": ["지식", "Knowledge"]};
const TOPIC_EN = {immune: "Immunity & inflammation", metabolism: "Microbial metabolism", diversity: "Diversity & dysbiosis", resistance: "Antibiotics & resistance",
  oral: "Oral", barrier: "Barrier & permeability", probiotics: "Probiotics", scfa: "Short-chain fatty acids", skin: "Skin", prebiotics: "Prebiotics & fibre",
  bile: "Bile acids", fmt: "Microbiota transplant", cancer: "Cancer", infection: "Infection", diabetes: "Diabetes", obesity: "Obesity", cardio: "Cardiovascular",
  ibd: "IBD", liver: "Liver disease", crc: "Colorectal cancer", mood: "Depression & anxiety", allergy: "Asthma & allergy", periodontal: "Periodontal & caries",
  alzheimer: "Alzheimer's & cognition", skin_disease: "Skin disease", kidney: "Kidney disease", parkinson: "Parkinson's", urogenital: "Urogenital disease", autism: "Autism"};
const cap = t => t ? t.charAt(0).toUpperCase() + t.slice(1) : t;
const topicName = t => lang === "ko" ? t.label : nm(TOPIC_EN[t.id] || t.label);
const dxName = (key, ko) => lang === "ko" ? (ko || key) : nm(cap((((ins || {}).labels_en || {}).disease || {})[key] || TOPIC_EN[key] || ko || key));
const CAT_EN = {Disease: "disease", Method: "method", Intervention: "intervention", Metabolite: "metabolite"};
const trendName = (cat, r) => lang === "ko" || cat === "Taxon" ? r.name : nm((((ins || {}).labels_en || {})[CAT_EN[cat]] || {})[r.id] || r.name);
const $ = id => document.getElementById(id);
const fmt = n => n == null ? "—" : Number(n).toLocaleString(LOC());
const pct = v => v == null ? "—" : (v > 0 ? "+" : "") + (v * 100).toFixed(1) + "%";
const esc = t => String(t == null ? "" : t).replace(/[&<>"]/g, c => ({"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;"}[c]));
/* AI paper summaries are written in Korean; the site data carries summary_i18n {korean: {en, it, fr}} (filled in gradually) */
const summaryText = ko => { if (!ko) return null; if (lang === "ko") return ko;
  const m = ((snap && snap.summary_i18n) || (window.MSAGE_DATA || {}).summary_i18n || {})[ko]; return (m && m[lang]) || null; };
const SUMMARK = {orig: ["원문 제목", "original title", "titolo originale", "titre original"],
  pend: ["(한국어 AI 요약 · 번역 준비 중)", "(Korean AI summary — translation pending)", "(riassunto IA in coreano — traduzione in arrivo)", "(résumé IA en coréen — traduction en cours)"]};
// summary in the page language; else the paper's own (English) title, marked; else the Korean, marked as pending. titled = the title is already shown
const sumHTML = (ko, title) => { const t = summaryText(ko); if (t) return {html: esc(t), titled: false};
  if (title) return {html: `${esc(title)}<small class="sx">${K(...SUMMARK.orig)}</small>`, titled: true};
  return {html: `<span class="sx-ko" lang="ko">${esc(ko)}</span><small class="sx sx-pend">${K(...SUMMARK.pend)}</small>`, titled: false}; };

/* -------- static text: panel headers, gauges, dock, at three reading levels -------- */
const LEVEL_NOTE = {
  eli10: ["ELI10 · 10살도 이해할 수 있게: 어려운 말 없이, 무엇이 보이는지만 쉽게 설명합니다.", "ELI10 · explained for a 10-year-old: no jargon, just what you are looking at."],
  eli20: ["ELI20 · 대학생 수준: 무엇을 셌는지, 왜 중요한지, 무엇이 불확실한지 설명합니다.", "ELI20 · university level: what was counted, why it matters and what is uncertain."],
  pro: ["PRO · 연구자용: 정확한 정의, 기준값, 계산 방법과 한계를 그대로 보여 줍니다.", "PRO · for researchers: exact definitions, thresholds, computations and caveats."]};
const P = {
  "kg-cons": {t: ["논문들이 합의한 관계", "Relations papers agree on"],
    s: {eli10: ["어떤 병일 때 어떤 세균이 많아지거나 줄어드는지", "Which germs go up or down in which illness"],
        eli20: ["여러 논문이 같은 방향으로 보고한 미생물–질병 관계", "Microbe–condition links reported in the same direction by many papers"],
        pro: ["방향 표 다수결: 증가/감소/무차이 근거 문장 수 (AI 재판정 포함)", "Direction vote: increase/decrease/no-difference sentences (AI re-judged)"]},
    q: {eli10: ["'많아짐'은 그 병에서 세균이 많아졌다는 뜻, '줄어듦'은 줄었다는 뜻이에요. 막대가 길수록 그렇게 말한 논문 문장이 많아요.", "'Goes up' means the germ is higher in that illness, 'goes down' means lower. A longer bar means more papers said so."],
        eli20: ["빨강 ▲ = 그 질병에서 이 미생물이 많아졌다는 보고가 우세, 파랑 ▼ = 줄었다는 보고가 우세. 숫자는 근거 문장 수. 인과가 아니라 '함께 관찰됨'입니다.", "Red ▲ = most reports say this microbe is higher in the condition, blue ▼ = lower. Counts are evidence sentences. Co-observation, not causation."],
        pro: ["점수 = (증가−감소)/(증가+감소+무차이), 표 ≥ 4, 문 수준 제외. 근거 문장은 Qwen 판정 + 결정적 grounded_direction 검사 통과분. 숫자 = 증가/감소/무차이. 초록 수준, 전문가 미검증.", "Score = (inc−dec)/(inc+dec+null), ≥ 4 votes, phylum excluded. Sentences pass the Qwen judge plus the deterministic grounded_direction check. Numbers = inc/dec/null. Abstract-level, not expert-validated."]}},
  "kg-rise": {t: ["떠오르는 주제", "Rising topics"],
    s: {eli10: ["요즘 과학자들이 점점 더 많이 연구하는 것", "What scientists study more and more lately"],
        eli20: ["최근 2년 비율 ÷ 3–5년 전 비율", "Share in the last 2 years ÷ share 3–5 years ago"],
        pro: ["문서 비율 성장 = share(최근 2년) / share(3–5년 전), 최소 논문 수 적용", "Share growth = share(last 2 y) / share(3–5 y ago), minimum paper count"]},
    q: {eli10: ["×2는 예전보다 두 배 자주 이야기된다는 뜻이에요.", "×2 means it is talked about twice as often as before."],
        eli20: ["연구자들의 관심이 빠르게 늘고 있는 질병·방법·개입입니다. ×2는 논문 속 등장 비율이 두 배가 됐다는 뜻.", "Conditions, methods and interventions drawing fast-growing attention. ×2 = their share of papers doubled."],
        pro: ["연도별 수집량이 달라 개수 대신 비율로 비교합니다. 수집이 최근 쪽으로 치우쳐 있으니 절대 규모로 해석하지 마세요.", "Shares, not counts, because yearly collection differs. Collection is recency-skewed; do not read as absolute volume."]}},
  "kg-next": {t: ["다음에 해야 할 연구", "What to study next"],
    s: {eli10: ["아직 잘 모르는데 중요해 보이는 곳", "Important places we still don't understand"],
        eli20: ["관심 증가 · 논쟁 · 저자들이 밝힌 한계를 합친 자동 순위", "Automatic ranking from rising interest, disagreement and authors' stated limitations"],
        pro: ["점수 = 2·ln(성장) + 1.5·ln(1+논쟁 쌍) + 0.8·ln(1+한계 진술) + ln(1+MINERVA 미수록) − 0.3·ln(1+논문)", "Score = 2·ln(growth) + 1.5·ln(1+contested pairs) + 0.8·ln(1+limitations) + ln(1+not in MINERVA) − 0.3·ln(1+papers)"]},
    q: {eli10: ["사람들이 관심은 많은데 답이 서로 다른 곳일수록 위에 있어요.", "Places with lots of interest but different answers come first."],
        eli20: ["연구가 늘고 있는데 결론이 엇갈리거나 한계가 많이 지적된 분야일수록 위로 올라옵니다. 방향 제시일 뿐 판단은 아닙니다.", "Fields with growing research but conflicting conclusions or many stated limitations rank higher. A pointer, not a verdict."],
        pro: ["한계 진술은 저자 문장에서 정규식 11개 주제로 분류. 가중치는 경험적이며 검증되지 않았습니다.", "Limitation statements are classified into 11 lexical themes. Weights are heuristic and unvalidated."]}},
  radar: {t: ["연구 관심 레이더", "Research-interest radar"],
    s: {eli10: ["오른쪽에 있을수록 요즘 인기가 많아지는 주제", "The further right, the more popular lately"],
        eli20: ["오른쪽일수록 최근 관심이 늘어난 주제 · 원 크기 = 논문 수", "Further right = rising recent interest · circle size = papers"],
        pro: ["x = 최근 3개월 비율 변화(%), y = 최근 3개월 논문 수(로그), 크기 ∝ √전체 논문, 논문 ≥ 200", "x = 3-month share change (%), y = 3-month papers (log), size ∝ √total papers, ≥ 200 papers"]},
    q: {eli10: ["반짝이는 초록 원이 지금 가장 빨리 뜨는 주제예요. 눌러 보면 관련 발견이 나와요.", "The blinking green circles are the fastest-rising topics. Click one to see related findings."],
        eli20: ["가로축은 최근 3개월 동안 논문에서 차지하는 비율이 얼마나 변했는지, 세로축은 최근 논문 수입니다. 깜빡이는 초록 원이 가장 빠르게 뜨는 주제. 원을 누르면 그 주제의 최신 발견이 오른쪽에 나옵니다.", "x: how much a topic's share of papers changed in the last 3 months; y: recent paper count. Blinking green = fastest rising. Click a circle for its latest findings."],
        pro: ["주제 분류는 제목·초록 정규식(멀티 라벨). 3개월 창은 수집 지연에 민감합니다.", "Topics come from title/abstract regex (multi-label). The 3-month window is sensitive to collection lag."]}},
  feed: {t: ["방금 들어온 발견", "Just-read findings"],
    s: {eli10: ["AI가 방금 읽은 논문에서 찾은 한 줄", "One line from a paper the AI just read"],
        eli20: ["AI가 초록을 읽고 원문과 대조한 요약", "AI summaries checked against the abstract text"],
        pro: ["초록 한정 판독, 인용 문장이 원문과 일치해야 통과 (source-validated)", "Abstract-only reading; accepted only if the quoted sentence matches the source"]},
    q: {eli10: ["7초마다 새 발견으로 바뀌어요. '원문'을 누르면 진짜 논문을 볼 수 있어요.", "It changes every 7 seconds. Click 'source' to see the real paper."],
        eli20: ["새로 읽힌 논문의 핵심 결과를 한 문장으로 보여 줍니다. 7초마다 바뀌고, '원문'을 누르면 논문으로 갑니다.", "Shows each new paper's key result in one sentence. Rotates every 7 s; 'source' opens the paper."],
        pro: ["요약은 모델 생성(한국어). 정량값은 원문 확인 필요. 전문가 검증 전.", "Summaries are model-generated (in Korean). Check quantities against the paper. Not expert-validated."]}},
  world: {t: ["세계 연구 흐름", "Research around the world"],
    s: {eli10: ["어느 나라에서 연구를 많이 하고, 누구와 함께 하는지", "Which countries do lots of research, and with whom"],
        eli20: ["진할수록 논문이 많은 나라 · 흐르는 선 = 나라 간 공동 연구", "Darker = more papers · flowing lines = international co-authorship"],
        pro: ["저자 소속 국가 기준 논문 수, 상위 30개 국가 쌍 공동 논문", "Papers by author-affiliation country, top 30 co-authorship pairs"]},
    q: {eli10: ["노란 원이 클수록 그 나라에서 논문이 많이 나와요.", "Bigger yellow circles mean more papers from that country."],
        eli20: ["저자 소속 국가 기준입니다. 노란 원이 클수록 그 나라에서 나온 논문이 많습니다.", "Based on author affiliations. Bigger yellow circles = more papers."],
        pro: ["소속 문자열에서 국가를 추출. 다국적 논문은 각 국가에 한 번씩 계수됩니다.", "Countries parsed from affiliation strings; multinational papers count once per country."]}},
  people: {t: ["연구를 이끄는 사람들", "People leading the research"],
    s: {eli10: ["논문을 많이 쓴 과학자들과 함께 일하는 친구들", "Scientists who wrote many papers and who they work with"],
        eli20: ["논문을 많이 쓴 연구자 · 선 = 함께 쓴 논문", "Most prolific researchers · lines = shared papers"],
        pro: ["상위 120명(논문 수), 노드 ∝ √논문, 간선 = 공저 횟수. 동명이인 병합 가능성 있음", "Top 120 by papers, node ∝ √papers, edges = co-authorships. Homonyms may be merged"]},
    q: {eli10: ["별이 클수록 논문을 많이 썼어요. 별을 누르면 그 사람이 누구인지 나와요.", "Bigger stars wrote more papers. Click a star to see who it is."],
        eli20: ["별 크기는 논문 수, 색은 나라입니다. 별을 누르면 아래에 그 연구자의 최근 발견이 나옵니다.", "Star size = papers, colour = country. Click a star to see that researcher's latest finding below."],
        pro: ["ORCID가 없으면 이름 문자열로 식별합니다. 논문 수는 생산성이지 영향력이 아닙니다.", "Without ORCID, authors are identified by name string. Paper counts measure output, not impact."]}},
  backfill: {t: ["과거 논문 채우기", "Filling in past papers"],
    s: {eli10: ["옛날 논문도 한 달씩 차곡차곡 모으는 중", "Collecting old papers one month at a time"],
        eli20: ["달마다 한 칸", "One cell per month"],
        pro: ["월 단위 창, 월당 쪽 수 상한 × 쪽 크기, Europe PMC 커서 페이지네이션", "Monthly windows, page cap × page size per month, Europe PMC cursor paging"]},
    q: {eli10: ["초록 칸은 다 모은 달, 노란 칸은 지금 모으는 달이에요.", "Green = finished months, yellow = the month being collected now."],
        eli20: ["2015년부터 지금까지 달마다 논문을 정해진 수만큼 모읍니다. 초록 칸 = 다 모은 달, 노란 칸 = 지금 모으는 달.", "From 2015 to now we collect a fixed number of papers per month. Green = done, yellow = in progress."],
        pro: ["달마다 상한이 있어 표본은 완전 수집이 아닙니다. 소진되면 성장 자동조종이 상한을 늘리고 범위를 2005년까지 넓힙니다.", "Monthly caps mean this is a sample, not a census. When exhausted, the growth autopilot raises caps and extends back to 2005."]}},
  gaps: {t: ["빈 곳과 다음 연구", "Gaps and next studies"],
    s: {eli10: ["아직 연구가 별로 없는 곳", "Places that haven't been studied much"],
        eli20: ["몸 부위 × 연구 주제 · 어두운 칸 = 아직 연구가 적은 곳", "Body site × topic · dark cells = little research so far"],
        pro: ["부위 × 주제 교차 논문 수(멀티 라벨 정규식)", "Paper counts per site × topic (multi-label regex)"]},
    q: {eli10: ["칸이 어두울수록 아직 아무도 잘 안 들여다본 곳이에요.", "The darker the cell, the less anyone has looked there."],
        eli20: ["칸의 숫자는 논문 수입니다. 어두운 칸은 앞으로 연구할 여지가 큰 조합일 수 있습니다.", "Numbers are paper counts. Dark cells may be combinations with room for new research."],
        pro: ["적은 논문 수가 곧 공백을 뜻하지는 않습니다(분류 누락·생물학적 비관련 가능).", "Low counts do not always mean a gap (missed classification or biological irrelevance)."]}},
  log: {t: ["에이전트 오케스트라", "Agent orchestra"],
    s: {eli10: ["뒤에서 쉬지 않고 일하는 로봇 친구들", "The little robots working behind the scenes"],
        eli20: ["뒤에서 쉬지 않고 일하는 프로그램들 · 초록 = 정상", "Programs working non-stop in the background · green = healthy"],
        pro: ["launchd 감독자 하위 작업 상태, 최근 수집 이벤트(막대), 회귀 검증 상태", "launchd supervisor child status, recent collection events (bars), regression state"]},
    q: {eli10: ["초록은 잘 일하는 중, 노랑은 조심, 빨강은 멈춤이에요.", "Green = working, yellow = careful, red = stopped."],
        eli20: ["수집·판독·지식 그래프·Neo4j·MINERVA 사본 같은 작업이 각각 정상인지 보여 줍니다. 노랑은 주의, 빨강은 멈춤.", "Shows whether collection, reading, the knowledge graph, Neo4j and the MINERVA copy are healthy. Yellow = caution, red = stopped."],
        pro: ["상태는 각 작업의 최신 상태 파일과 이벤트 나이로 판정합니다.", "State is derived from each job's latest status file and event age."]}}};
const G = {
  papers: {t: ["모은 논문", "Papers collected"], q: {eli10: ["지금까지 모은 마이크로바이옴 논문 수예요.", "How many microbiome papers we've gathered."], eli20: ["Europe PMC에서 모은 인체 마이크로바이옴 논문 수", "Human-microbiome papers collected from Europe PMC"], pro: ["Europe PMC 질의 결과의 고유 publication_id 수(중복 제거)", "Unique publication_ids from Europe PMC queries (deduplicated)"]}},
  read: {t: ["AI가 읽은 논문 / 시간", "Papers read by AI / hour"], q: {eli10: ["AI가 한 시간에 읽은 논문 수예요.", "Papers the AI read in the last hour."], eli20: ["AI가 지난 1시간 동안 처음으로 읽고 원문 문장과 대조해 통과시킨 고유 논문 수 (다시 읽은 논문 제외)", "Unique papers first read and checked against the source in the last hour (re-reads excluded)"], pro: ["지난 1시간에 첫 accepted 판독이 생긴 고유 publication_id 수", "Unique publication_ids whose first accepted reading finished in the last hour"]}},
  collect: {t: ["논문 수집 / 시간", "Collection / hour"], q: {eli10: ["한 시간에 새로 가져온 논문 묶음 수예요.", "Batches of papers fetched in the last hour."], eli20: ["지난 1시간 동안 Europe PMC에서 받아 온 결과 쪽 수", "Result pages fetched from Europe PMC in the last hour"], pro: ["완료된 수집 이벤트의 historical_pages 합 (1시간 창)", "Sum of historical_pages across completed collection events (1 h window)"]}},
  cost: {t: ["AI 비용", "AI cost"], q: {eli10: ["AI를 쓰는 데 든 돈이에요. 정해진 한도를 넘지 않아요.", "Money spent on AI. It never goes over the limit."], eli20: ["AI(Bedrock) 사용 비용. 사용자가 승인한 한도 안에서만 씁니다", "AI (Bedrock) spend, always within the limit you approved"], pro: ["Bedrock 원장 영수증 합계(가격표 스냅샷 기준), 일·누적·주기 한도 강제", "Sum of Bedrock ledger receipts at the pricing snapshot; daily, cumulative and per-cycle caps enforced"]}}};
const UI = {
  views: [["조종석", "Cockpit"], ["한 페이지 이야기", "One-page story"], ["인사이트 랩", "Insight lab"]],
  dock: [["한 페이지로 전체 보기 (Story)", "See it all on one page (Story)"], ["인사이트 랩 (지식 그래프)", "Insight lab (knowledge graph)"], ["연구자 랭킹", "Researcher ranking"],
         ["에이전트 상세", "Agent details"], ["MINERVA 비교", "MINERVA comparison"], ["Neo4j 그래프 DB ↗", "Neo4j graph DB ↗"]],
  more: ["다른 화면", "Other views"],
  disclaimer: {eli10: ["AI가 읽고 정리한 내용이에요. 아직 전문가가 확인하지 않았어요.", "The AI read and organised this. Experts haven't checked it yet."],
               eli20: ["AI가 자동으로 읽은 잠정 결과입니다 · 논문 수와 관심은 효과나 인과의 증거가 아닙니다 · 전문가 검증 전", "Provisional results read automatically by AI · paper counts and attention are not evidence of effect or causation · not expert-validated"],
               pro: ["초록 수준 기계 추출 · scientific_accuracy_validated = false · 수집 표본은 월별 상한·최근 편향", "Abstract-level machine extraction · scientific_accuracy_validated = false · sample has monthly caps and recency bias"]},
  story: ["이야기로 ↓", "Story ↓"], source: ["원문 ↗", "Source ↗"]};
function applyText() {
  document.documentElement.lang = lang;
  document.title = K("M-SAGE 조종석 · 마이크로바이옴 연구 실시간", "M-SAGE cockpit · live microbiome research");
  Object.entries(P).forEach(([cls, d]) => { const ph = document.querySelector("." + cls + " .ph"); if (!ph) return;
    ph.querySelector("b").textContent = K(...d.t); ph.querySelector("span").textContent = V(d.s); ph.querySelector(".q").dataset.tip = V(d.q);
    const a = ph.querySelector(".story"); if (a) a.textContent = K(...UI.story); });
  Object.entries(G).forEach(([id, d]) => { const v = $("v-" + id); if (!v) return; const gl = v.parentNode;
    gl.firstChild.textContent = K(...d.t); gl.parentNode.dataset.tip = V(d.q); });
  document.querySelectorAll(".topbar .views a").forEach((a, i) => a.textContent = K(...UI.views[i]));
  const DOCK = [/story/, /m=insights/, /m=people/, /m=agents/, /m=minerva/, /^http/];   // label by link target, not position
  document.querySelectorAll(".dock > a.pri").forEach(a => { const i = DOCK.findIndex(rx => rx.test(a.getAttribute("href") || ""));
    if (i >= 0) a.textContent = K(...UI.dock[i]); });
  const more = document.querySelector(".dock .more summary"); if (more) more.textContent = K(...UI.more);
  const MORE = {"/msage-report": ["전체 분석 보고서", "Full analysis report", "Rapporto di analisi completo", "Rapport d'analyse complet"],
    "/msage": ["누적 지식과 자율 탐색", "Accumulated knowledge and autonomous exploration", "Conoscenza accumulata ed esplorazione autonoma", "Connaissances cumulées et exploration autonome"],
    "/research-world": ["연구 허브", "Research hub", "Hub della ricerca", "Pôle de recherche"],
    "/observatory": ["연구 동향 관측", "Research trend observatory", "Osservatorio delle tendenze", "Observatoire des tendances"],
    "/researchers": ["연구자 지도", "Researcher map", "Mappa dei ricercatori", "Carte des chercheurs"],
    "/atlas": ["지식 지도", "Knowledge atlas", "Atlante della conoscenza", "Atlas des connaissances"],
    "/platform": ["메타인지 플랫폼", "Metacognition platform", "Piattaforma metacognitiva", "Plateforme métacognitive"],
    "/synthesis": ["근거 종합", "Evidence synthesis", "Sintesi delle evidenze", "Synthèse des preuves"],
    "/workbench": ["작업대", "Workbench", "Banco di lavoro", "Établi"]};
  document.querySelectorAll(".dock .more a").forEach(a => { const m = MORE[a.getAttribute("href")]; if (m) a.textContent = K(...m); });
  const fr0 = $("fresh"); if (fr0 && /[\uac00-\ud7a3]/.test(fr0.textContent) && !fr0.dataset.set) fr0.textContent = K("자료 확인 중", "Checking data", "Verifica dei dati", "Vérification des données");
  const dis = document.querySelector(".dock .disclaimer"); if (dis) dis.textContent = V(UI.disclaimer);
  $("levelnote").textContent = V(LEVEL_NOTE);
  if ($("s-collect")) $("s-collect").textContent = K("1쪽 = 논문 100편", "1 page = 100 papers");
  document.querySelectorAll("#sw-lang button").forEach(b => b.classList.toggle("on", b.dataset.v === lang));
  document.querySelectorAll("#sw-level button").forEach(b => b.classList.toggle("on", b.dataset.v === level));
}
function toggles() {
  const redraw = () => { applyText(); if (snap) renderField(snap); if (ins) renderInsights(ins); if (live) renderLive(live); };
  $("sw-lang").onclick = e => { const b = e.target.closest("button"); if (!b) return; lang = b.dataset.v; store.set("msage.lang", lang); redraw(); };
  $("sw-level").onclick = e => { const b = e.target.closest("button"); if (!b) return; level = b.dataset.v; store.set("msage.level", level); redraw(); };
}
const charts = {};
function chart(id, opt) {
  const el = $(id); if (!el || !window.echarts) return null;
  const c = charts[id] || (charts[id] = echarts.init(el));
  c.setOption(Object.assign({backgroundColor: "transparent", textStyle: {fontFamily: "inherit", color: C.text},
    animationDuration: 1400, animationDurationUpdate: 1200, animationEasingUpdate: "cubicInOut"}, opt), true);
  return c;
}
window.addEventListener("resize", () => Object.values(charts).forEach(c => c.resize()));

/* -------- clock -------- */
setInterval(() => { $("clock").textContent = new Date().toLocaleTimeString(LOC(1), {hour12: false}); }, 1000);

/* -------- counters with tween -------- */
const shown = {};
function tween(id, value, digits) {
  const el = $(id); if (!el) return;
  if (value == null) { el.textContent = "—"; return; }
  const from = shown[id] == null ? 0 : shown[id], t0 = performance.now();
  shown[id] = value;
  const step = t => { const k = Math.min(1, (t - t0) / 1200), v = from + (value - from) * (1 - Math.pow(1 - k, 3));
    el.textContent = digits ? v.toFixed(digits) : fmt(Math.round(v)); if (k < 1) requestAnimationFrame(step); };
  requestAnimationFrame(step);
}
function gauge(id, value, max, color) {
  chart(id, {series: [{type: "gauge", startAngle: 210, endAngle: -30, min: 0, max, radius: "100%", center: ["50%", "58%"],
    progress: {show: true, width: 9, itemStyle: {color}}, axisLine: {lineStyle: {width: 9, color: [[1, "#17213f"]]}},
    pointer: {length: "62%", width: 3, itemStyle: {color}}, anchor: {show: true, size: 7, itemStyle: {color}},
    axisTick: {show: false}, splitLine: {length: 6, distance: 2, lineStyle: {color: C.dim, width: 1}},
    axisLabel: {show: false}, detail: {show: false}, data: [{value: Math.min(value || 0, max)}]}]});
}
const nice = v => { const p = Math.pow(10, Math.floor(Math.log10(Math.max(1, v)))); return Math.ceil(v * 1.25 / p) * p; };

/* -------- data -------- */
let snap = null, live = null, theme = null, vit = null;
function getJSON(url, fallback) {
  if (fallback) return Promise.resolve(fallback);
  return fetch(url).then(r => r.ok ? r.json() : Promise.reject(r.status));
}

/* -------- live instruments -------- */
function renderLive(v) {
  live = v;
  const sup = v.supervisor || {}, svc = sup.services || {};
  const lockFails = (v.collection.recent || []).slice(0, 10).filter(e => (e.reason || "").includes("locked")).length;
  const lights = Object.entries(SVC).map(([k, n]) => [K(...n), svc[k] === "running" ? "ok" : sup.state === "fresh_regression_required" ? "warn" : "bad"]);
  lights.push([K("코드 검증", "Code check"), (v.regression || {}).state === "admitted" ? "ok" : (v.regression || {}).state ? "warn" : "bad"]);
  lights.push(["DB", lockFails ? "warn" : "ok"]);
  const recent = (v.collection.recent || []).slice(0, 6);
  const slow = recent.filter(e => (e.reason || "").includes("provider unavailable")).length;
  lights.push(["Europe PMC", slow >= 3 ? "bad" : slow ? "warn" : "ok"]);
  const b = v.budget || {};
  lights.push([K("예산", "Budget"), b.daily_used_usd != null && b.daily_used_usd >= b.daily_limit_usd ? "warn" : "ok"]);
  if (vit) { const g = (vit.checks || []).find(c => c.id === "guard"); if (g && g.value) lights.push([K("내장 SSD ", "Internal SSD ") + g.value.free_gb + "GB", g.state]);
    const sm = vit.summary || {}; lights.push(["@" + K("운영 점검 ", "Ops check ") + (sm.bad ? K("조치 ", "action ") + sm.bad : sm.warn ? K("주의 ", "warn ") + sm.warn : K("정상", "ok")), sm.bad ? "bad" : sm.warn ? "warn" : "ok"]); }
  $("lights").innerHTML = lights.map(([n, s]) => n.startsWith("@") ? `<a class="light ${s}" href="${ROUTE.story}#s-vitals" style="text-decoration:none"><i></i>${n.slice(1)}</a>` : `<span class="light ${s}"><i></i>${n}</span>`).join("");
  $("fresh").dataset.set = "1";
  if (STATIC) $("fresh").textContent = K("스냅샷 ", "snapshot ") + STATIC.as_of + " · " + K("버전 ", "release ") + STATIC.release; else
  $("fresh").textContent = (sup.state === "running" && slow >= 2 ? K("논문 공급처(Europe PMC) 응답 지연 · 자동 재시도 중", "Europe PMC slow · retrying automatically") : sup.state === "running" ? K("모든 작업 진행 중", "All jobs running") : sup.state === "fresh_regression_required" ? K("새 코드 검증 중 · 곧 재개", "Checking new code · resuming soon") : (sup.state || "")) + K(" · 30초마다 갱신", " · updates every 30 s");
  const r = v.readings || {};
  tween("v-papers", v.papers); gauge("g-papers", v.papers || 0, nice(Math.max(v.papers || 0, 50000)), C.sky);
  $("s-papers").textContent = snap ? K(`분석 그림 기준 ${fmt(snap.papers)}편`, `${fmt(snap.papers)} in the charts`, `${fmt(snap.papers)} nei grafici`, `${fmt(snap.papers)} dans les graphiques`) : "";
  tween("v-read", r.validated_last_hour); gauge("g-read", r.validated_last_hour || 0, 6000, C.teal);
  $("s-read").textContent = K("고유 논문 누적 ", "unique total ") + fmt(r.unique_read) + K(" · 대기 ", " · queued ") + fmt(r.unique_waiting);
  tween("v-collect", v.collection.pages_last_hour); gauge("g-collect", v.collection.pages_last_hour || 0, 150, C.violet);
  if (b.cumulative_used_usd != null) {
    tween("v-cost", b.cumulative_used_usd, 2); gauge("g-cost", b.cumulative_used_usd, b.cumulative_limit_usd || 50, C.amber);
    $("l-cost").firstChild.textContent = K("AI 비용 (누적 / $", "AI cost (total / $") + b.cumulative_limit_usd + ")";
    $("s-cost").textContent = K("오늘 $", "today $") + b.daily_used_usd.toFixed(2) + " / $" + b.daily_limit_usd;
  }
  if (v.backfill && v.backfill.page_size) $("s-collect").textContent = K(`1쪽 = 논문 ${v.backfill.page_size}편`, `1 page = ${v.backfill.page_size} papers`, `1 pagina = ${v.backfill.page_size} articoli`, `1 page = ${v.backfill.page_size} articles`);
  brief();
  renderBackfill(v.backfill);
  renderLog(v);
}

function renderBackfill(bf) {
  if (!bf) { $("mgrid").innerHTML = '<span style="grid-column:1/-1">' + K("과거 수집 정보 없음", "No backfill information") + '</span>'; return; }
  const m = bf.month_grid, years = [...new Set(Object.keys(m).map(k => k.slice(0, 4)))].sort().reverse();
  const order = Object.keys(m).sort().reverse(), working = order.find(k => !m[k]);
  $("mgrid").innerHTML = years.map(y => `<span>${y}</span>` + Array.from({length: 12}, (_, i) => {
    const k = y + "-" + String(i + 1).padStart(2, "0");
    const cls = m[k] === true ? "done" : k === working ? "work" : "";
    return `<i class="${cls}" data-tip="${k} ${m[k] === true ? K("완료", "done") : k === working ? K("수집 중", "collecting") : m[k] === false ? K("대기", "waiting") : K("범위 밖", "out of range")}"></i>`; }).join("")).join("");
  const months = Object.keys(m).sort();
  $("bf-sub").textContent = `${months[0] ? months[0].slice(0, 4) : ""}–${months.length ? months[months.length - 1].slice(0, 4) : ""} · ${bf.months_done}/${bf.months_total}${K("개월 완료 · 달마다 최대 ", " months done · up to ")}${fmt(bf.page_cap * (bf.page_size || 25))}${K("편", " papers/month")}`;
  $("years").innerHTML = Object.entries(bf.years).sort().reverse().map(([y, v]) => `<span>${y} ≈${fmt(v.approx_papers)}${K("편", "")}</span>`).join("");
}

function renderAgents(v) {
  const el = $("agents"); if (!el) return;
  el.innerHTML = (v.agents || []).map(a => window.MSAGE_OPS_AGENT ? window.MSAGE_OPS_AGENT(a, lang) : a).map(a => `<div class="agent ${a.state}" data-tip="${esc(a.role)}"><i></i><b>${esc(a.name)}</b><span>${esc(a.doing || "")}</span><em>${esc(a.metric || "")}</em></div>`).join("");
}
function renderLog(v) {
  renderAgents(v);
  const ev = (v.collection.recent || []).slice().reverse();
  const max = Math.max(1, ...ev.map(e => e.historical_pages));
  $("spark").innerHTML = ev.map(e => `<i class="${e.state === "completed" ? "" : "bad"}" style="height:${e.state === "completed" ? Math.max(5, 100 * e.historical_pages / max) : 100}%" data-tip="${(e.at || "").slice(11, 16)} ${e.state === "completed" ? e.historical_pages + K("쪽 수집", " pages") : (e.reason || e.state)}"></i>`).join("");
  const rows = [];
  (v.collection.recent || []).slice(0, 8).forEach(e => rows.push([e.at, e.state === "completed"
    ? `<b>${K("수집", "collected")}</b> ${e.historical_pages}${K("쪽", "p")}${e.range ? " · " + e.range.start.slice(0, 7) + "~" + e.range.end.slice(0, 7) : ""}`
    : `<b style="color:${C.coral}">${K("재시도", "retry")}</b> ${esc(e.reason || e.state)}`]));
  if (v.knowledge && v.knowledge.updated_at) rows.push([v.knowledge.updated_at, "<b>" + K("지식 릴리스 갱신", "knowledge release") + "</b> " + esc((v.knowledge.release_id || "").slice(6, 18))]);
  if (v.regression && v.regression.at) rows.push([v.regression.at, "<b>" + K("코드 검증", "code check") + "</b> " + esc(v.regression.state)]);
  if (v.site && v.site.last_success) rows.push([new Date(v.site.last_success * 1000).toISOString(), `<b>${K("분석 그림 갱신", "charts rebuilt")}</b> ${fmt(v.site.built_papers)}`]);
  rows.sort((a, b) => String(b[0]).localeCompare(String(a[0])));
  if ($("events")) $("events").innerHTML = rows.slice(0, 9).map(([t, h]) => `<li><span>${t ? new Date(t).toLocaleTimeString(LOC(1), {hour: "2-digit", minute: "2-digit", hour12: false}) : ""}</span><span>${h}</span></li>`).join("");
}

/* -------- field instruments (snapshot) -------- */
function renderRadar(d) {
  const all = d.topics.map(t => ({...t, kind: 0})).concat(d.diseases.map(t => ({...t, kind: 1}))).filter(t => t.growth != null && t.papers >= 200);
  const top = all.slice().sort((a, b) => b.growth - a.growth).slice(0, 3).map(t => t.id);
  const mk = (k, ripple) => all.filter(t => t.kind === k && top.includes(t.id) === ripple).map(t => ({name: topicName(t), id: t.id, value: [+(t.growth * 100).toFixed(1), t.late, t.papers]}));
  const base = {symbolSize: v => 10 + Math.sqrt(v[2]) * .5, label: {show: true, formatter: p => p.name, position: "right", color: C.text, fontSize: 11}, labelLayout: {hideOverlap: true}};
  const c = chart("c-radar", {
    grid: {left: 44, right: 16, top: 14, bottom: 30},
    tooltip: {formatter: p => `<b>${p.name}</b><br>${K("관심 변화", "interest change")} ${p.value[0]}%<br>${K("최근 3개월", "last 3 months")} ${fmt(p.value[1])} · ${K("전체", "total")} ${fmt(p.value[2])}`},
    xAxis: {min: -12, max: 28, axisLabel: {color: C.dim, formatter: "{value}%"}, splitLine: {lineStyle: {color: C.line}}, axisLine: {lineStyle: {color: C.line}}},
    yAxis: {type: "log", min: 50, axisLabel: {color: C.dim}, splitLine: {lineStyle: {color: C.line}}},
    series: [
      {...base, type: "scatter", data: mk(0, false), itemStyle: {color: C.teal, opacity: .8},
       markArea: {silent: true, data: [[{xAxis: 5, itemStyle: {color: "#2dd4bf0d"}}, {xAxis: 28}], [{xAxis: -12, itemStyle: {color: "#fb71850d"}}, {xAxis: -5}]]},
       markLine: {silent: true, symbol: "none", label: {show: false}, lineStyle: {color: C.dim, type: "dashed"}, data: [{xAxis: 0}]}},
      {...base, type: "scatter", data: mk(1, false), itemStyle: {color: C.coral, opacity: .8}},
      {...base, type: "effectScatter", data: mk(0, true).concat(mk(1, true)), rippleEffect: {scale: 3.2, brushType: "stroke", period: 3},
       itemStyle: {color: C.lime}, label: {...base.label, color: C.lime, fontWeight: "bold"}}]
  });
  if (c) c.off("click"), c.on("click", p => p.data && showTheme(p.data.id));
}

let tick = null, cards = [], ci = 0;
function showTheme(id) {
  theme = id;
  const t = snap.topics.concat(snap.diseases).find(x => x.id === id);
  $("feed-theme").textContent = t ? `${topicName(t)} · ${K("관심 변화", "interest")} ${pct(t.growth)}` : V(P.feed.s);
  document.querySelectorAll(".mv").forEach(b => b.classList.toggle("on", b.dataset.id === id));
  buildCards(id);
}
function buildCards(id) {
  const H = snap.highlights || {}, items = [];
  const ids = id ? [id] : Object.keys(H);
  ids.forEach(k => (H[k] || []).forEach(p => items.push({...p, theme: k})));
  const seen = new Set(), uniq = items.filter(p => p.summary && !seen.has(p.pmid) && seen.add(p.pmid));
  uniq.sort((a, b) => String(b.date).localeCompare(String(a.date)));
  const label = k => { const t = snap.topics.concat(snap.diseases).find(x => x.id === k); return t ? topicName(t) : k; };
  cards = uniq.slice(0, 24);
  $("ticker").innerHTML = cards.map((p, i) => { const sm = sumHTML(p.summary, p.title); return `<article class="card${i === 0 ? " on" : ""}"><span class="tag">${esc(label(p.theme))}</span>
    <div class="find">${sm.html}</div>${sm.titled ? "" : `<div class="ttl">${esc(p.title)}</div>`}
    <div class="meta"><span>${esc(p.journal || "")} · ${esc(p.date)}</span><a href="https://europepmc.org/article/MED/${esc(p.pmid)}" target="_blank" rel="noopener">${K(...UI.source)}</a></div></article>`; }).join("");
  ci = 0; clearInterval(tick);
  tick = setInterval(() => { const el = $("ticker").children; if (!el.length) return;
    el[ci].classList.remove("on"); ci = (ci + 1) % el.length; el[ci].classList.add("on"); }, 7000);
}
function renderMovers(d) {
  const all = d.topics.concat(d.diseases).filter(t => t.growth != null && t.papers >= 200).sort((a, b) => b.growth - a.growth);
  const pick = all.slice(0, 6).concat(all.slice(-3));
  $("movers").innerHTML = pick.map(t => `<button class="mv ${t.growth > 0 ? "up" : "down"}" data-id="${t.id}">${t.growth > 0 ? "▲" : "▼"} ${esc(topicName(t))} ${pct(t.growth)}</button>`).join("");
  $("movers").onclick = e => { const b = e.target.closest(".mv"); if (b) showTheme(b.dataset.id === theme ? null : b.dataset.id); };
}

const TILES = {"Ireland":[9,1,"IE"],"United Kingdom":[10,1,"UK"],"Denmark":[11,1,"DK"],"Sweden":[12,0,"SE"],"Norway":[11,0,"NO"],"Finland":[13,0,"FI"],
"Belgium":[9,2,"BE"],"Netherlands":[10,2,"NL"],"Germany":[11,2,"DE"],"Poland":[12,2,"PL"],"France":[9,3,"FR"],"Switzerland":[11,3,"CH"],"Austria":[11,4,"AT"],
"Portugal":[8,4,"PT"],"Spain":[9,4,"ES"],"Italy":[10,4,"IT"],"Greece":[13,6,"GR"],"Turkey":[15,5,"TR"],"Israel":[14,7,"IL"],"Iran":[17,6,"IR"],"Egypt":[13,7,"EG"],
"Saudi Arabia":[15,8,"SA"],"India":[19,8,"IN"],"Pakistan":[18,7,"PK"],"China":[21,5,"CN"],"South Korea":[23,5,"KR"],"Japan":[24,4,"JP"],"Taiwan":[23,6,"TW"],"Hong Kong":[22,6,"HK"],
"Thailand":[21,8,"TH"],"Malaysia":[21,9,"MY"],"Singapore":[21,10,"SG"],"Australia":[23,12,"AU"],"New Zealand":[25,13,"NZ"],"South Africa":[12,12,"ZA"],"Nigeria":[10,9,"NG"],
"Canada":[2,1,"CA"],"United States":[2,2,"US"],"Mexico":[2,3,"MX"],"Brazil":[4,5,"BR"],"Chile":[3,6,"CL"],"Argentina":[4,6,"AR"],"Colombia":[3,4,"CO"],"Russia":[15,1,"RU"],"Czechia":[12,3,"CZ"],"Hungary":[12,4,"HU"],"Romania":[13,4,"RO"]};
function renderWorld(d) {
  const S = 30, OY = 50, W = 27 * S, H = 14 * S + OY, by = {}; d.places.forEach(p => by[p.country] = p);
  const max = Math.max(...d.places.map(p => p.papers));
  const ctr = n => TILES[n] ? [TILES[n][0] * S + S / 2, TILES[n][1] * S + S / 2 + OY] : null;
  const shade = v => { if (!v) return "#111a35"; const k = Math.log1p(v) / Math.log1p(max); return `rgba(45,212,191,${.15 + .8 * k})`; };
  const maxL = Math.max(...d.country_links.map(l => l.papers));
  const arcs = d.country_links.slice(0, 30).map((l, i) => { const a = ctr(l.a), b = ctr(l.b); if (!a || !b) return "";
    const mx = (a[0] + b[0]) / 2, my = Math.min(a[1], b[1]) - Math.abs(a[0] - b[0]) * .3 - 14;
    return `<path class="arc" style="animation-delay:-${(i % 8) * .3}s" d="M${a[0]},${a[1]} Q${mx},${my} ${b[0]},${b[1]}" fill="none" stroke="${C.sky}" stroke-opacity=".55" stroke-width="${(.8 + 4 * l.papers / maxL).toFixed(1)}" data-tip="${l.a} ↔ ${l.b}: ${K("공동 논문", "joint papers")} ${fmt(l.papers)}"/>`; }).join("");
  const tiles = Object.entries(TILES).map(([n, [x, y, c]]) => { const v = by[n] ? by[n].papers : 0;
    return `<g data-tip="${n}: ${fmt(v)} ${K("편", "papers")}"><rect x="${x * S + 1}" y="${y * S + 1 + OY}" width="${S - 2}" height="${S - 2}" rx="5" fill="${shade(v)}" stroke="#ffffff10"/><text x="${x * S + S / 2}" y="${y * S + S / 2 + 4 + OY}" text-anchor="middle" font-size="10" fill="#d8e2ff">${c}</text></g>`; }).join("");
  const bubbles = d.places.filter(p => p.papers >= 500 && TILES[p.country]).map((p, i) => { const [x, y] = ctr(p.country);
    return `<circle class="bub" style="animation-delay:-${i * .4}s" cx="${x}" cy="${y}" r="${(5 + Math.sqrt(p.papers / max) * 46).toFixed(1)}" fill="${C.amber}" fill-opacity=".14" stroke="${C.amber}" stroke-opacity=".7" data-tip="${p.country}: ${fmt(p.papers)} ${K("편", "papers")} · ${fmt(p.researchers)} ${K("명", "authors")}"/>`; }).join("");
  $("tilemap").innerHTML = `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet">${tiles}${arcs}${bubbles}</svg>`;
}

function renderPeople(d) {
  const top = d.researchers.slice(0, 120);
  const cnt = {}; top.forEach(r => cnt[r.country || "미표기"] = (cnt[r.country || "미표기"] || 0) + 1);
  const cats = Object.entries(cnt).sort((a, b) => b[1] - a[1]).slice(0, 7).map(x => x[0]);
  const cat = c => { const i = cats.indexOf(c || "미표기"); return i < 0 ? cats.length : i; };
  const ids = new Set(top.map(r => r.id));
  const c = chart("c-people", {
    tooltip: {formatter: p => p.dataType === "edge" ? `${K("공동 논문", "joint papers")} ${p.data.value}` : `<b>${esc(p.data.name)}</b><br>${esc(p.data.raw.country || "")} · ${p.data.value} ${K("편", "papers")}`},
    series: [{type: "graph", layout: "force", roam: true, zoom: .8, draggable: true,
      categories: cats.concat([K("기타", "other")]).map((n, i) => ({name: n, itemStyle: {color: PAL[i % PAL.length]}})),
      data: top.map(r => ({id: r.id, name: r.label, value: r.papers, category: cat(r.country), raw: r,
        symbolSize: 5 + Math.sqrt(r.papers) * 3.6, label: {show: r.papers >= 15, color: C.text, fontSize: 10}})),
      links: d.coauthor_edges.filter(e => ids.has(e.source) && ids.has(e.target)).map(e => ({source: e.source, target: e.target, value: e.weight, lineStyle: {width: .6 + e.weight * .5, opacity: .35}})),
      force: {repulsion: 60, gravity: .1, edgeLength: [20, 60]}, lineStyle: {color: "source", curveness: .2},
      emphasis: {focus: "adjacency"}}]
  });
  const who = r => { if (!r) return; const p = (r.papers_list || [])[0];
    $("who").innerHTML = `<b>${esc(r.label)}</b> · ${esc((r.countries || [r.country]).filter(Boolean).join(", "))} · ${r.papers} ${K("편", "papers")} · ${K("최근 1년", "last year")} ${r.recent}` +
      (p && p.summary && level !== "eli10" ? `<br>${K("최근 발견", "latest finding")}: ${sumHTML(p.summary, p.title).html}` : ""); };
  who(top[0]);
  if (c) c.off("click"), c.on("click", p => p.dataType === "node" && who(p.data.raw));
}

function renderGaps(d) {
  const cells = d.frontier.cells.filter(c => c.papers != null && SITE[c.site] && MT[c.topic]);
  const sites = Object.keys(SITE).filter(s => cells.some(c => c.site === s)), topics = Object.keys(MT).filter(t => cells.some(c => c.topic === t));
  chart("c-gaps", {
    tooltip: {formatter: p => `${K(...SITE[sites[p.value[1]]])} × ${K(...MT[topics[p.value[0]]])}<br>${fmt(p.value[2])} ${K("편", "papers")}`},
    grid: {left: 66, right: 8, top: 4, bottom: 22},
    xAxis: {type: "category", data: topics.map(t => K(...MT[t])), axisLabel: {color: C.dim, fontSize: 10, interval: 0}, axisLine: {lineStyle: {color: C.line}}},
    yAxis: {type: "category", data: sites.map(s => K(...SITE[s])), axisLabel: {color: C.dim, fontSize: 10}, axisLine: {lineStyle: {color: C.line}}},
    visualMap: {min: 0, max: Math.max(...cells.map(c => c.papers)), show: false, inRange: {color: ["#140c2a", "#4c1d95", "#a78bfa", "#fb7185", "#fde047"]}},
    series: [{type: "heatmap", data: cells.map(c => [topics.indexOf(c.topic), sites.indexOf(c.site), c.papers]),
      label: {show: true, fontSize: 9, color: "#f1f5f9"}, itemStyle: {borderColor: "#04070f", borderWidth: 2, borderRadius: 4}}]
  });
  const rising = d.topics.concat(d.diseases).filter(t => t.growth > .05 && t.papers >= 200).sort((a, b) => b.growth - a.growth).slice(0, 3);
  const empty = cells.slice().sort((a, b) => a.papers - b.papers).slice(0, 2);
  const gaps = (d.author_gaps || []).slice(0, 2);
  $("next").innerHTML = rising.map(t => `<li><span>${K("키울 주제", "growing")}: ${esc(topicName(t))}</span><em>${pct(t.growth)}</em></li>`).join("") +
    empty.map(c => `<li><span>${K("비어 있음", "sparse")}: ${K(...SITE[c.site])} × ${K(...MT[c.topic])}</span><em>${fmt(c.papers)}</em></li>`).join("") +
    gaps.map(g => `<li><span>${K("저자가 밝힌 공백", "Gap named by the authors", "Lacuna indicata dagli autori", "Lacune signalée par les auteurs")}: ${sumHTML(g.summary, g.title).html}</span></li>`).join("");
}

function renderField(d) {
  snap = d;
  renderRadar(d); renderMovers(d); buildCards(theme); renderWorld(d); renderPeople(d); renderGaps(d);
  if (live) renderLive(live);
}

/* -------- tooltips for svg/grid -------- */
document.addEventListener("mousemove", e => { const t = e.target.closest && e.target.closest("[data-tip]"), tip = $("tip");
  if (!t) { tip.style.display = "none"; return; } tip.textContent = t.dataset.tip; tip.style.display = "block";
  tip.style.left = (e.clientX + 12) + "px"; tip.style.top = (e.clientY + 12) + "px"; });

/* -------- knowledge-graph row (insights) -------- */
let ins = null, consTick = null, consAt = 0, riseCat = "Disease";
const RISE = {Disease: ["질병", "Conditions"], Method: ["연구 방법", "Methods"], Intervention: ["개입", "Interventions"], Taxon: ["미생물", "Microbes"], Metabolite: ["대사물질", "Metabolites"]};
function renderInsights(d) {
  ins = d;
  const rows = (d.consensus || []).filter(p => p.rank !== "phylum").slice(0, 28);
  const draw = () => {
    const page = rows.slice(consAt, consAt + 7).concat(consAt + 7 > rows.length ? rows.slice(0, consAt + 7 - rows.length) : []);
    const max = Math.max(...rows.map(p => p.inc + p.dec), 1);
    $("cons").innerHTML = page.map((p, i) => { const up = p.score > 0, n = up ? p.inc : p.dec;
      const dx = dxName(p.disease, p.disease_label);
      const word = `<span class="arrow ${up ? "up" : "down"}">${level === "eli10" ? (up ? K("많아짐", "up") : K("줄어듦", "down")) : up ? "▲" : "▼"}</span>`;
      const counts = level === "pro" ? `<span class="cnt">${p.inc}/${p.dec}/${p.null || 0}</span>` : "";
      return `<div class="crow ${level === "eli10" ? "w" : level === "pro" ? "p" : ""}" style="animation-delay:${i * 70}ms" data-tip="${esc(p.taxon)} — ${esc(dx)}: ${K("증가", "increase")} ${p.inc} · ${K("감소", "decrease")} ${p.dec} · ${p.papers} ${K("편", "papers")}${p.minerva_agrees === true ? K(" · MINERVA와 같은 방향", " · same direction as MINERVA") : p.minerva_agrees === false ? K(" · MINERVA와 반대", " · opposite to MINERVA") : ""}">
        <i>${esc(p.taxon)}</i>${word}<span class="dx">${esc(dx)}</span>${counts}
        <span class="bar"><span style="width:${(100 * n / max).toFixed(0)}%;background:${up ? C.coral : C.sky}"></span></span></div>`; }).join("");
    consAt = (consAt + 7) % Math.max(rows.length, 1);
  };
  draw(); clearInterval(consTick); consTick = setInterval(draw, 9000);
  $("rise-seg").innerHTML = Object.entries(RISE).filter(([k]) => d.trends[k]).map(([k, n]) => `<button data-k="${k}" class="${k === riseCat ? "on" : ""}">${K(...n)}</button>`).join("");
  $("rise-seg").onclick = e => { const b = e.target.closest("button"); if (!b) return; riseCat = b.dataset.k;
    document.querySelectorAll("#rise-seg button").forEach(x => x.classList.toggle("on", x === b)); drawRise(); };
  drawRise();
  $("nexts").innerHTML = (d.next || []).slice(0, 4).map((c, i) => { const s = c.signals;
    return `<div class="ncard" style="animation-delay:${i * 90}ms"><span class="rk">${i + 1}</span><b>${esc(dxName(c.disease, c.label))}</b>
      ${c.top_gaps.length && lang === "ko" && level !== "eli10" ? "채워야 할 것: " + esc(c.top_gaps.slice(0, 2).join(" · ")) : ""}
      <div class="chips"><span class="chip" style="color:${s.growth >= 1.2 ? C.lime : s.growth < .9 ? C.coral : C.muted}">${K("관심", "interest")} ×${s.growth}</span>
      ${s.contradictions ? `<span class="chip" style="color:${C.amber}">${K("엇갈린 결과", "conflicts")} ${s.contradictions}</span>` : ""}<span class="chip">${K("한계 진술", "limitations")} ${s.gap_statements}</span></div></div>`; }).join("");
  brief();
}
function drawRise() {
  const t = ((ins || {}).trends || {})[riseCat]; if (!t) return;
  const rows = t.rising.slice(0, 7).reverse();
  chart("c-rise", {grid: {left: 112, right: 46, top: 4, bottom: 18},
    tooltip: {formatter: p => `${esc(trendName(riseCat, rows[p.dataIndex]))}<br>${K("최근", "recent")} ${(rows[p.dataIndex].share_recent * 100).toFixed(2)}% · ${K("이전", "before")} ${(rows[p.dataIndex].share_prior * 100).toFixed(2)}%`},
    xAxis: {type: "value", axisLabel: {color: C.dim, formatter: v => "×" + v}, splitLine: {lineStyle: {color: C.line}}},
    yAxis: {type: "category", data: rows.map(r => trendName(riseCat, r)), axisLabel: {color: C.text, fontSize: 11, fontStyle: riseCat === "Taxon" ? "italic" : "normal"}},
    series: [{type: "bar", data: rows.map(r => r.growth), barMaxWidth: 16, label: {show: true, position: "right", color: C.muted, fontSize: 11, formatter: p => "×" + p.value.toFixed(1)},
      itemStyle: {borderRadius: [0, 6, 6, 0], color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [{offset: 0, color: "#14532d"}, {offset: 1, color: C.lime}])},
      animationDelay: i => i * 80}]});
}
function brief() {
  const read = live && live.readings ? live.readings.unique_read : null;
  const P0 = (ins && ins.build && ins.build.papers_read) || read;
  if (!P0) return;
  const tr = ins ? ins.trends || {} : {}, r = (tr.Disease || {}).rising || [], m = (tr.Method || {}).rising || [];
  const c = ins ? (ins.consensus || []).filter(x => x.rank !== "phylum")[0] : null, n = ins ? (ins.next || [])[0] : null;
  const rd = r[0] ? esc(trendName("Disease", r[0])) : "", md = m[0] ? esc(trendName("Method", m[0])) : "";
  const cd = c ? esc(dxName(c.disease, c.disease_label)) : "", nd = n ? esc(dxName(n.disease, n.label)) : "";
  const g = x => x ? x.growth.toFixed(1) : "";
  const agree = ins && ins.minerva_agreement ? ins.minerva_agreement.agree + "/" + ins.minerva_agreement.compared : "—";
  let h;
  if (level === "eli10") h = K(
    `AI가 마이크로바이옴 논문 <b>${fmt(P0)}편</b>을 읽었어요. ${rd ? `요즘은 <em>${rd}</em> 연구가 빨리 늘고 있어요.` : ""} ${c ? `<b>${esc(c.taxon)}</b>라는 세균은 <b>${cd}</b>일 때 ${c.score > 0 ? "많아진대요" : "줄어든대요"}.` : ""} ${nd ? `다음엔 <u>${nd}</u>을 더 알아보면 좋겠어요.` : ""}`,
    `The AI has read <b>${fmt(P0)}</b> microbiome papers. ${rd ? `Research on <em>${rd}</em> is growing fast.` : ""} ${c ? `A germ called <b>${esc(c.taxon)}</b> tends to ${c.score > 0 ? "go up" : "go down"} in <b>${cd}</b>.` : ""} ${nd ? `Next, it would help to learn more about <u>${nd}</u>.` : ""}`,
    `L'IA ha letto <b>${fmt(P0)}</b> articoli sul microbioma. ${rd ? `La ricerca su <em>${rd}</em> sta crescendo in fretta.` : ""} ${c ? `Un batterio che si chiama <b>${esc(c.taxon)}</b> di solito ${c.score > 0 ? "aumenta" : "diminuisce"} nelle persone con <b>${cd}</b>.` : ""} ${nd ? `Adesso sarebbe utile scoprire di più su <u>${nd}</u>.` : ""}`,
    `L'IA a lu <b>${fmt(P0)}</b> articles sur le microbiome. ${rd ? `La recherche sur <em>${rd}</em> grandit très vite.` : ""} ${c ? `Un microbe qui s'appelle <b>${esc(c.taxon)}</b> a tendance à ${c.score > 0 ? "augmenter" : "diminuer"} chez les personnes touchées par <b>${cd}</b>.` : ""} ${nd ? `Maintenant, il serait utile d'en savoir plus sur <u>${nd}</u>.` : ""}`);
  else if (level === "pro") h = K(
    `초록 ${fmt(P0)}편 기계 판독. 최대 성장: 질병 <em>${rd} ×${g(r[0])}</em>, 방법 <em>${md} ×${g(m[0])}</em>. 최다 합의: <b>${c ? esc(c.taxon) + " " + (c.score > 0 ? "↑" : "↓") + " " + cd : ""}</b> (${c ? c.inc + "/" + c.dec : ""}). MINERVA 방향 일치 ${agree}. 우선 연구: <u>${nd}</u>.`,
    `${fmt(P0)} abstracts machine-read. Top growth: condition <em>${rd} ×${g(r[0])}</em>, method <em>${md} ×${g(m[0])}</em>. Strongest consensus: <b>${c ? esc(c.taxon) + " " + (c.score > 0 ? "↑" : "↓") + " " + cd : ""}</b> (${c ? c.inc + "/" + c.dec : ""}). MINERVA direction agreement ${agree}. Priority: <u>${nd}</u>.`,
    `${fmt(P0)} abstract letti automaticamente. Crescita massima: patologia <em>${rd} ×${g(r[0])}</em>, metodo <em>${md} ×${g(m[0])}</em>. Consenso più forte: <b>${c ? esc(c.taxon) + " " + (c.score > 0 ? "↑" : "↓") + " " + cd : ""}</b> (${c ? c.inc + "/" + c.dec : ""}). Concordanza di direzione con MINERVA ${agree}. Priorità: <u>${nd}</u>.`,
    `${fmt(P0)} résumés lus automatiquement. Plus forte croissance : pathologie <em>${rd} ×${g(r[0])}</em>, méthode <em>${md} ×${g(m[0])}</em>. Consensus le plus fort : <b>${c ? esc(c.taxon) + " " + (c.score > 0 ? "↑" : "↓") + " " + cd : ""}</b> (${c ? c.inc + "/" + c.dec : ""}). Concordance de direction avec MINERVA ${agree}. Priorité : <u>${nd}</u>.`);
  else h = K(
    `AI가 지금까지 논문 <b>${fmt(P0)}편</b>을 읽었습니다. ${rd ? `가장 빠르게 관심이 늘어난 질병은 <em>${rd} ×${g(r[0])}</em>${md ? `, 연구 방법은 <em>${md} ×${g(m[0])}</em>` : ""}입니다.` : ""} ${c ? `가장 일관되게 보고된 관계는 <b>${esc(c.taxon)} ${c.score > 0 ? "▲" : "▼"} ${cd}</b>(근거 ${c.inc + c.dec}건)이고,` : ""} ${nd ? `다음 연구가 가장 필요한 곳은 <u>${nd}</u>입니다.` : ""}`,
    `The AI has read <b>${fmt(P0)}</b> papers so far. ${rd ? `Fastest-growing condition: <em>${rd} ×${g(r[0])}</em>${md ? `; method: <em>${md} ×${g(m[0])}</em>` : ""}.` : ""} ${c ? `Most consistent relation: <b>${esc(c.taxon)} ${c.score > 0 ? "▲" : "▼"} ${cd}</b> (${c.inc + c.dec} evidence sentences).` : ""} ${nd ? `Most needed next study: <u>${nd}</u>.` : ""}`,
    `Finora l'IA ha letto <b>${fmt(P0)}</b> articoli. ${rd ? `Patologia in più rapida crescita: <em>${rd} ×${g(r[0])}</em>${md ? `; metodo: <em>${md} ×${g(m[0])}</em>` : ""}.` : ""} ${c ? `Relazione più coerente: <b>${esc(c.taxon)} ${c.score > 0 ? "▲" : "▼"} ${cd}</b> (${c.inc + c.dec} frasi di evidenza).` : ""} ${nd ? `Prossimo studio più necessario: <u>${nd}</u>.` : ""}`,
    `Jusqu'ici, l'IA a lu <b>${fmt(P0)}</b> articles. ${rd ? `Pathologie en plus forte croissance : <em>${rd} ×${g(r[0])}</em>${md ? ` ; méthode : <em>${md} ×${g(m[0])}</em>` : ""}.` : ""} ${c ? `Relation la plus constante : <b>${esc(c.taxon)} ${c.score > 0 ? "▲" : "▼"} ${cd}</b> (${c.inc + c.dec} phrases de preuve).` : ""} ${nd ? `Prochaine étude la plus nécessaire : <u>${nd}</u>.` : ""}`);
  $("brief-text").innerHTML = h;
}
function pollInsights() { getJSON("/api/site/msage/insights", window.MSAGE_INSIGHTS).then(renderInsights).catch(() => {
  $("cons").innerHTML = '<p style="color:var(--dim);font-size:12px">' + K("지식 그래프를 아직 불러오지 못했습니다.", "Knowledge graph not loaded yet.") + '</p>'; }); }

function pollLive() { getJSON("/api/site/msage/live", window.MSAGE_LIVE).then(renderLive).catch(() => { $("fresh").textContent = K("실시간 정보에 연결하지 못했습니다 · 다시 시도 중", "Live data unavailable · retrying"); }); }
function pollSnap() { getJSON("/api/site/msage", window.MSAGE_DATA).then(renderField).catch(() => {}); }
function pollVitals() { getJSON("/api/site/msage/vitals", window.MSAGE_VITALS).then(d => { vit = d; if (live) renderLive(live); }).catch(() => {}); }
const STORY = {radar: "radar", feed: "findings", world: "world", people: "people", backfill: "engine", gaps: "gaps", log: "engine",
  "kg-cons": "consensus", "kg-rise": "trends", "kg-next": "gaps"};
function storyLinks() {
  Object.entries(STORY).forEach(([cls, sec]) => { const ph = document.querySelector("." + cls + " .ph"); if (!ph || ph.querySelector(".story")) return;
    const a = document.createElement("a"); a.className = "story"; a.href = ROUTE.story + "#s-" + sec; a.textContent = K(...UI.story);
    a.onclick = e => e.stopPropagation(); ph.insertBefore(a, ph.querySelector(".q")); });
  const b = $("brief"); if (b) { b.style.cursor = "pointer"; b.onclick = () => location.href = ROUTE.story + "#s-news"; }
}
function staticMode() {
  if (!STATIC) return;
  // packaged website: same pages and motion; only links that need the live server are dropped,
  // and public builds leave out operations data (status lights, AI cost, agent orchestra)
  document.querySelectorAll('.dock a[href^="http"], .dock .more').forEach(el => el.remove());
  const clock = $("clock"); if (clock) clock.style.display = "none";      // a snapshot has no live clock
  if (STATIC.public) {
    STORY.backfill = "findings"; STORY.log = "news";
    const lights = $("lights"); if (lights) lights.style.display = "none";
    document.querySelectorAll(".panel.log").forEach(el => el.style.display = "none");
    const g = $("g-cost"); if (g) g.closest(".gauge").style.display = "none";
    document.querySelectorAll('.dock a[href*="m=agents"]').forEach(el => el.remove());
  }
}
function start() {
  staticMode(); storyLinks(); applyText(); toggles();
  pollVitals(); if (!window.MSAGE_DATA) setInterval(pollVitals, 5 * 60000);
  pollLive(); pollSnap(); pollInsights();
  if (!window.MSAGE_DATA) { setInterval(pollLive, 30000); setInterval(pollSnap, 15 * 60000); setInterval(pollInsights, 15 * 60000); }
}
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();
/* ---- Italian words (English text -> Italian), used by K/V/nm when lang is "it"; generated, keep keys identical to the English (and to FR_WORDS) ---- */
function IT_WORDS() { return {
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
  "Web": "Web",
  "Collect": "Raccolta",
  "Evidence": "Evidenze",
  "Abstract AI": "IA abstract",
  "Knowledge": "Conoscenza",
  "ELI10 · explained for a 10-year-old: no jargon, just what you are looking at.": "ELI10 · spiegato a un bambino di 10 anni: niente paroloni, solo quello che stai guardando.",
  "ELI20 · university level: what was counted, why it matters and what is uncertain.": "ELI20 · livello universitario: che cosa è stato contato, perché conta e che cosa è incerto.",
  "PRO · for researchers: exact definitions, thresholds, computations and caveats.": "PRO · per ricercatori: definizioni esatte, soglie, calcoli e limiti.",
  "Relations papers agree on": "Relazioni su cui gli articoli concordano",
  "Which germs go up or down in which illness": "Quali batteri aumentano o diminuiscono in quale malattia",
  "Microbe–condition links reported in the same direction by many papers": "Legami microbo–patologia riportati nella stessa direzione da molti articoli",
  "Direction vote: increase/decrease/no-difference sentences (AI re-judged)": "Voto di direzione: frasi di aumento/diminuzione/nessuna differenza (rivalutate dall'IA)",
  "'Goes up' means the germ is higher in that illness, 'goes down' means lower. A longer bar means more papers said so.": "\"Aumenta\" vuol dire che il batterio è più abbondante in quella malattia, \"diminuisce\" che è meno abbondante. Più la barra è lunga, più articoli lo dicono.",
  "Red ▲ = most reports say this microbe is higher in the condition, blue ▼ = lower. Counts are evidence sentences. Co-observation, not causation.": "Rosso ▲ = la maggior parte dei resoconti indica questo microbo più abbondante nella patologia, blu ▼ = meno abbondante. I numeri sono frasi di evidenza. Co-osservazione, non causalità.",
  "Score = (inc−dec)/(inc+dec+null), ≥ 4 votes, phylum excluded. Sentences pass the Qwen judge plus the deterministic grounded_direction check. Numbers = inc/dec/null. Abstract-level, not expert-validated.": "Punteggio = (aum−dim)/(aum+dim+nulle), ≥ 4 voti, phylum escluso. Le frasi superano il giudizio di Qwen più il controllo deterministico grounded_direction. Numeri = aum/dim/nulle. Livello abstract, non validato da esperti.",
  "Rising topics": "Temi emergenti",
  "What scientists study more and more lately": "Quello che gli scienziati studiano sempre di più",
  "Share in the last 2 years ÷ share 3–5 years ago": "Quota negli ultimi 2 anni ÷ quota 3–5 anni fa",
  "Share growth = share(last 2 y) / share(3–5 y ago), minimum paper count": "Crescita della quota = quota(ultimi 2 anni) / quota(3–5 anni fa), numero minimo di articoli",
  "×2 means it is talked about twice as often as before.": "×2 vuol dire che se ne parla il doppio di prima.",
  "Conditions, methods and interventions drawing fast-growing attention. ×2 = their share of papers doubled.": "Patologie, metodi e interventi che attirano un'attenzione in rapida crescita. ×2 = la loro quota di articoli è raddoppiata.",
  "Shares, not counts, because yearly collection differs. Collection is recency-skewed; do not read as absolute volume.": "Quote, non conteggi, perché la raccolta annuale varia. La raccolta è sbilanciata verso gli anni recenti; non interpretarla come volume assoluto.",
  "What to study next": "Cosa studiare dopo",
  "Important places we still don't understand": "Cose importanti che ancora non capiamo",
  "Automatic ranking from rising interest, disagreement and authors' stated limitations": "Classifica automatica basata su interesse crescente, disaccordo e limiti dichiarati dagli autori",
  "Score = 2·ln(growth) + 1.5·ln(1+contested pairs) + 0.8·ln(1+limitations) + ln(1+not in MINERVA) − 0.3·ln(1+papers)": "Punteggio = 2·ln(crescita) + 1.5·ln(1+coppie contese) + 0.8·ln(1+limiti) + ln(1+assenti in MINERVA) − 0.3·ln(1+articoli)",
  "Places with lots of interest but different answers come first.": "Prima vengono i posti dove c'è tanto interesse ma le risposte sono diverse.",
  "Fields with growing research but conflicting conclusions or many stated limitations rank higher. A pointer, not a verdict.": "Gli ambiti con ricerca in crescita ma conclusioni contrastanti o molti limiti dichiarati salgono in classifica. Un'indicazione, non un verdetto.",
  "Limitation statements are classified into 11 lexical themes. Weights are heuristic and unvalidated.": "Le dichiarazioni di limite sono classificate in 11 temi lessicali. I pesi sono euristici e non validati.",
  "Research-interest radar": "Radar dell'interesse di ricerca",
  "The further right, the more popular lately": "Più è a destra, più è diventato popolare di recente",
  "Further right = rising recent interest · circle size = papers": "Più a destra = interesse recente in crescita · dimensione del cerchio = articoli",
  "x = 3-month share change (%), y = 3-month papers (log), size ∝ √total papers, ≥ 200 papers": "x = variazione della quota a 3 mesi (%), y = articoli in 3 mesi (log), dimensione ∝ √articoli totali, ≥ 200 articoli",
  "The blinking green circles are the fastest-rising topics. Click one to see related findings.": "I cerchi verdi che lampeggiano sono i temi che crescono più in fretta. Cliccane uno per vedere le scoperte collegate.",
  "x: how much a topic's share of papers changed in the last 3 months; y: recent paper count. Blinking green = fastest rising. Click a circle for its latest findings.": "x: quanto è cambiata la quota di articoli di un tema negli ultimi 3 mesi; y: numero di articoli recenti. Verde lampeggiante = crescita più rapida. Clicca un cerchio per le scoperte più recenti.",
  "Topics come from title/abstract regex (multi-label). The 3-month window is sensitive to collection lag.": "I temi derivano da espressioni regolari su titolo/abstract (multi-etichetta). La finestra di 3 mesi risente del ritardo di raccolta.",
  "Just-read findings": "Scoperte appena lette",
  "One line from a paper the AI just read": "Una frase da un articolo che l'IA ha appena letto",
  "AI summaries checked against the abstract text": "Riassunti dell'IA verificati sul testo dell'abstract",
  "Abstract-only reading; accepted only if the quoted sentence matches the source": "Lettura dei soli abstract; accettata solo se la frase citata corrisponde alla fonte",
  "It changes every 7 seconds. Click 'source' to see the real paper.": "Cambia ogni 7 secondi. Clicca \"fonte\" per vedere l'articolo vero.",
  "Shows each new paper's key result in one sentence. Rotates every 7 s; 'source' opens the paper.": "Mostra in una frase il risultato chiave di ogni nuovo articolo. Ruota ogni 7 s; \"fonte\" apre l'articolo.",
  "Summaries are model-generated (in Korean). Check quantities against the paper. Not expert-validated.": "I riassunti sono generati dal modello (in coreano). Verifica le quantità sull'articolo. Non validati da esperti.",
  "Research around the world": "La ricerca nel mondo",
  "Which countries do lots of research, and with whom": "Quali Paesi fanno tanta ricerca, e con chi",
  "Darker = more papers · flowing lines = international co-authorship": "Più scuro = più articoli · linee in movimento = coautorialità internazionale",
  "Papers by author-affiliation country, top 30 co-authorship pairs": "Articoli per Paese di affiliazione degli autori, prime 30 coppie di coautorialità",
  "Bigger yellow circles mean more papers from that country.": "Più grande è il cerchio giallo, più articoli arrivano da quel Paese.",
  "Based on author affiliations. Bigger yellow circles = more papers.": "In base alle affiliazioni degli autori. Cerchi gialli più grandi = più articoli.",
  "Countries parsed from affiliation strings; multinational papers count once per country.": "Paesi estratti dalle stringhe di affiliazione; gli articoli multinazionali contano una volta per Paese.",
  "People leading the research": "Chi guida la ricerca",
  "Scientists who wrote many papers and who they work with": "Scienziati che hanno scritto molti articoli e con chi lavorano",
  "Most prolific researchers · lines = shared papers": "Ricercatori più prolifici · linee = articoli in comune",
  "Top 120 by papers, node ∝ √papers, edges = co-authorships. Homonyms may be merged": "Primi 120 per articoli, nodo ∝ √articoli, archi = coautorialità. Gli omonimi possono essere uniti",
  "Bigger stars wrote more papers. Click a star to see who it is.": "Le stelle più grandi hanno scritto più articoli. Clicca una stella per scoprire chi è.",
  "Star size = papers, colour = country. Click a star to see that researcher's latest finding below.": "Dimensione della stella = articoli, colore = Paese. Clicca una stella per vedere qui sotto l'ultima scoperta di quel ricercatore.",
  "Without ORCID, authors are identified by name string. Paper counts measure output, not impact.": "Senza ORCID, gli autori sono identificati dalla stringa del nome. Il numero di articoli misura la produzione, non l'impatto.",
  "Filling in past papers": "Recupero degli articoli passati",
  "Collecting old papers one month at a time": "Raccogliamo gli articoli vecchi un mese alla volta",
  "One cell per month": "Una cella per mese",
  "Monthly windows, page cap × page size per month, Europe PMC cursor paging": "Finestre mensili, tetto di pagine × dimensione della pagina per mese, paginazione a cursore di Europe PMC",
  "Green = finished months, yellow = the month being collected now.": "Verde = mesi completati, giallo = il mese che stiamo raccogliendo adesso.",
  "From 2015 to now we collect a fixed number of papers per month. Green = done, yellow = in progress.": "Dal 2015 a oggi raccogliamo un numero fisso di articoli al mese. Verde = completato, giallo = in corso.",
  "Monthly caps mean this is a sample, not a census. When exhausted, the growth autopilot raises caps and extends back to 2005.": "I tetti mensili rendono questo un campione, non un censimento. Quando si esauriscono, l'autopilota di crescita alza i tetti e risale fino al 2005.",
  "Gaps and next studies": "Lacune e prossimi studi",
  "Places that haven't been studied much": "Posti che sono stati studiati poco",
  "Body site × topic · dark cells = little research so far": "Sede corporea × tema · celle scure = poca ricerca finora",
  "Paper counts per site × topic (multi-label regex)": "Numero di articoli per sede × tema (espressioni regolari multi-etichetta)",
  "The darker the cell, the less anyone has looked there.": "Più la cella è scura, meno qualcuno ci ha guardato.",
  "Numbers are paper counts. Dark cells may be combinations with room for new research.": "I numeri sono conteggi di articoli. Le celle scure possono essere combinazioni con spazio per nuove ricerche.",
  "Low counts do not always mean a gap (missed classification or biological irrelevance).": "Pochi articoli non significano sempre una lacuna (classificazione mancata o irrilevanza biologica).",
  "Agent orchestra": "Orchestra di agenti",
  "The little robots working behind the scenes": "I piccoli robot che lavorano dietro le quinte",
  "Programs working non-stop in the background · green = healthy": "Programmi che lavorano senza sosta in background · verde = in salute",
  "launchd supervisor child status, recent collection events (bars), regression state": "Stato dei processi figli del supervisore launchd, eventi di raccolta recenti (barre), stato della regressione",
  "Green = working, yellow = careful, red = stopped.": "Verde = al lavoro, giallo = attenzione, rosso = fermo.",
  "Shows whether collection, reading, the knowledge graph, Neo4j and the MINERVA copy are healthy. Yellow = caution, red = stopped.": "Mostra se raccolta, lettura, grafo della conoscenza, Neo4j e copia di MINERVA funzionano bene. Giallo = attenzione, rosso = fermo.",
  "State is derived from each job's latest status file and event age.": "Lo stato deriva dall'ultimo file di stato di ogni processo e dall'età degli eventi.",
  "Papers collected": "Articoli raccolti",
  "How many microbiome papers we've gathered.": "Quanti articoli sul microbioma abbiamo raccolto.",
  "Human-microbiome papers collected from Europe PMC": "Articoli sul microbioma umano raccolti da Europe PMC",
  "Unique publication_ids from Europe PMC queries (deduplicated)": "publication_id univoci dalle query a Europe PMC (deduplicati)",
  "Papers read by AI / hour": "Articoli letti dall'IA / ora",
  "Papers the AI read in the last hour.": "Gli articoli che l'IA ha letto nell'ultima ora.",
  "Unique papers first read and checked against the source in the last hour (re-reads excluded)": "Articoli univoci letti per la prima volta e verificati sulla fonte nell'ultima ora (riletture escluse)",
  "Unique publication_ids whose first accepted reading finished in the last hour": "publication_id univoci la cui prima lettura accettata si è conclusa nell'ultima ora",
  "Collection / hour": "Raccolta / ora",
  "Batches of papers fetched in the last hour.": "Gruppi di articoli scaricati nell'ultima ora.",
  "Result pages fetched from Europe PMC in the last hour": "Pagine di risultati scaricate da Europe PMC nell'ultima ora",
  "Sum of historical_pages across completed collection events (1 h window)": "Somma di historical_pages negli eventi di raccolta completati (finestra di 1 h)",
  "AI cost": "Costo dell'IA",
  "Money spent on AI. It never goes over the limit.": "Soldi spesi per l'IA. Non supera mai il limite.",
  "AI (Bedrock) spend, always within the limit you approved": "Spesa per l'IA (Bedrock), sempre entro il limite che hai approvato",
  "Sum of Bedrock ledger receipts at the pricing snapshot; daily, cumulative and per-cycle caps enforced": "Somma delle ricevute del registro Bedrock al listino prezzi fotografato; limiti giornalieri, cumulativi e per ciclo applicati",
  "Cockpit": "Cruscotto",
  "One-page story": "Storia in una pagina",
  "Insight lab": "Laboratorio di analisi",
  "See it all on one page (Story)": "Vedi tutto in una pagina (Storia)",
  "Insight lab (knowledge graph)": "Laboratorio di analisi (grafo della conoscenza)",
  "Researcher ranking": "Classifica dei ricercatori",
  "Agent details": "Dettagli degli agenti",
  "MINERVA comparison": "Confronto con MINERVA",
  "Neo4j graph DB ↗": "Database a grafo Neo4j ↗",
  "Other views": "Altre viste",
  "The AI read and organised this. Experts haven't checked it yet.": "L'IA ha letto e messo in ordine queste informazioni. Gli esperti non le hanno ancora controllate.",
  "Provisional results read automatically by AI · paper counts and attention are not evidence of effect or causation · not expert-validated": "Risultati provvisori letti automaticamente dall'IA · numero di articoli e attenzione non sono prove di effetto o causalità · non validati da esperti",
  "Abstract-level machine extraction · scientific_accuracy_validated = false · sample has monthly caps and recency bias": "Estrazione automatica a livello di abstract · scientific_accuracy_validated = false · il campione ha tetti mensili e un bias verso gli anni recenti",
  "Story ↓": "Storia ↓",
  "Source ↗": "Fonte ↗",
  "M-SAGE cockpit · live microbiome research": "Cruscotto M-SAGE · ricerca sul microbioma in tempo reale",
  "1 page = 100 papers": "1 pagina = 100 articoli",
  "Code check": "Controllo del codice",
  "Budget": "Budget",
  "Internal SSD ": "SSD interno ",
  "Ops check ": "Controllo operativo ",
  "action ": "interventi ",
  "warn ": "attenzione ",
  "ok": "ok",
  "snapshot ": "istantanea ",
  "release ": "versione ",
  "Europe PMC slow · retrying automatically": "Europe PMC lento · nuovo tentativo automatico",
  "All jobs running": "Tutti i processi attivi",
  "Checking new code · resuming soon": "Verifica del nuovo codice · ripresa a breve",
  " · updates every 30 s": " · aggiornamento ogni 30 s",
  "unique total ": "totale univoci ",
  " · queued ": " · in coda ",
  "AI cost (total / $": "Costo dell'IA (totale / $",
  "today $": "oggi $",
  "No backfill information": "Nessuna informazione sul recupero",
  "done": "completato",
  "collecting": "in raccolta",
  "waiting": "in attesa",
  "out of range": "fuori intervallo",
  " months done · up to ": " mesi completati · fino a ",
  " papers/month": " articoli/mese",
  " pages": " pagine",
  "collected": "raccolta",
  "p": "pag.",
  "retry": "nuovo tentativo",
  "knowledge release": "release della conoscenza",
  "code check": "controllo del codice",
  "charts rebuilt": "grafici ricostruiti",
  "interest change": "variazione d'interesse",
  "last 3 months": "ultimi 3 mesi",
  "total": "totale",
  "interest": "interesse",
  "joint papers": "articoli congiunti",
  "papers": "articoli",
  "authors": "autori",
  "other": "altro",
  "last year": "ultimo anno",
  "latest finding": "ultima scoperta",
  "growing": "in crescita",
  "sparse": "scarso",
  "Conditions": "Patologie",
  "Methods": "Metodi",
  "Interventions": "Interventi",
  "Microbes": "Microbi",
  "up": "aumenta",
  "down": "diminuisce",
  "increase": "aumento",
  "decrease": "diminuzione",
  " · same direction as MINERVA": " · stessa direzione di MINERVA",
  " · opposite to MINERVA": " · opposto a MINERVA",
  "conflicts": "contrasti",
  "limitations": "limiti",
  "recent": "recente",
  "before": "prima",
  "Knowledge graph not loaded yet.": "Grafo della conoscenza non ancora caricato.",
  "Live data unavailable · retrying": "Dati in tempo reale non disponibili · nuovo tentativo",
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
  "Diabetes": "Diabete",
  "Obesity": "Obesità",
  "Cardiovascular": "Cardiovascolare",
  "IBD": "MICI",
  "Liver disease": "Malattie del fegato",
  "Colorectal cancer": "Cancro del colon-retto",
  "Depression & anxiety": "Depressione e ansia",
  "Asthma & allergy": "Asma e allergie",
  "Periodontal & caries": "Parodontite e carie",
  "Alzheimer's & cognition": "Alzheimer e cognizione",
  "Skin disease": "Malattie della pelle",
  "Kidney disease": "Malattie renali",
  "Parkinson's": "Parkinson",
  "Urogenital disease": "Malattie urogenitali",
  "Autism": "Autismo",
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
  "Fatty liver": "Fegato grasso",
  "Cirrhosis": "Cirrosi",
  "Cardiovascular disease": "Malattie cardiovascolari",
  "Hypertension": "Ipertensione",
  "Stroke": "Ictus",
  "Chronic kidney disease": "Malattia renale cronica",
  "Parkinson's disease": "Malattia di Parkinson",
  "Alzheimer's/cognitive decline": "Alzheimer/declino cognitivo",
  "Multiple sclerosis": "Sclerosi multipla",
  "Depression": "Depressione",
  "Anxiety": "Ansia",
  "Schizophrenia": "Schizofrenia",
  "ADHD": "ADHD",
  "Asthma": "Asma",
  "Allergy/atopy": "Allergia/atopia",
  "COPD": "BPCO",
  "Cystic fibrosis": "Fibrosi cistica",
  "COVID-19": "COVID-19",
  "HIV": "HIV",
  "Sepsis/critical illness": "Sepsi/malattia critica",
  "C. difficile infection": "Infezione da C. difficile",
  "H. pylori infection": "Infezione da H. pylori",
  "Urinary tract infection": "Infezione delle vie urinarie",
  "Bacterial vaginosis": "Vaginosi batterica",
  "Preterm birth/neonatal": "Parto pretermine/neonatale",
  "PCOS": "PCOS",
  "Endometriosis/infertility": "Endometriosi/infertilità",
  "Periodontitis": "Parodontite",
  "Dental caries": "Carie dentale",
  "Psoriasis": "Psoriasi",
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
  "Web": "Site web",
  "Collect": "Collecte",
  "Evidence": "Preuves",
  "Abstract AI": "IA des résumés",
  "Knowledge": "Connaissances",
  "ELI10 · explained for a 10-year-old: no jargon, just what you are looking at.": "ELI10 · expliqué à un enfant de 10 ans : pas de mots compliqués, juste ce que tu regardes.",
  "ELI20 · university level: what was counted, why it matters and what is uncertain.": "ELI20 · niveau universitaire : ce qui a été compté, pourquoi c'est important et ce qui reste incertain.",
  "PRO · for researchers: exact definitions, thresholds, computations and caveats.": "PRO · pour les chercheurs : définitions exactes, seuils, calculs et limites.",
  "Relations papers agree on": "Relations sur lesquelles les articles s'accordent",
  "Which germs go up or down in which illness": "Quels microbes augmentent ou diminuent dans quelle maladie",
  "Microbe–condition links reported in the same direction by many papers": "Liens microbe–pathologie rapportés dans le même sens par de nombreux articles",
  "Direction vote: increase/decrease/no-difference sentences (AI re-judged)": "Vote de direction : phrases d'augmentation/diminution/absence de différence (rejugées par l'IA)",
  "'Goes up' means the germ is higher in that illness, 'goes down' means lower. A longer bar means more papers said so.": "« Augmente » veut dire que le microbe est plus abondant dans cette maladie, « diminue » qu'il l'est moins. Plus la barre est longue, plus il y a d'articles qui le disent.",
  "Red ▲ = most reports say this microbe is higher in the condition, blue ▼ = lower. Counts are evidence sentences. Co-observation, not causation.": "Rouge ▲ = la plupart des comptes rendus indiquent ce microbe plus abondant dans la pathologie, bleu ▼ = moins abondant. Les nombres sont des phrases de preuve. Co-observation, pas causalité.",
  "Score = (inc−dec)/(inc+dec+null), ≥ 4 votes, phylum excluded. Sentences pass the Qwen judge plus the deterministic grounded_direction check. Numbers = inc/dec/null. Abstract-level, not expert-validated.": "Score = (aug−dim)/(aug+dim+nul), ≥ 4 votes, phylum exclu. Les phrases passent le juge Qwen plus le contrôle déterministe grounded_direction. Nombres = aug/dim/nul. Niveau résumé, non validé par des experts.",
  "Rising topics": "Thèmes en essor",
  "What scientists study more and more lately": "Ce que les scientifiques étudient de plus en plus",
  "Share in the last 2 years ÷ share 3–5 years ago": "Part des 2 dernières années ÷ part d'il y a 3 à 5 ans",
  "Share growth = share(last 2 y) / share(3–5 y ago), minimum paper count": "Croissance de la part = part(2 dernières années) / part(il y a 3–5 ans), nombre minimal d'articles",
  "×2 means it is talked about twice as often as before.": "×2 veut dire qu'on en parle deux fois plus qu'avant.",
  "Conditions, methods and interventions drawing fast-growing attention. ×2 = their share of papers doubled.": "Pathologies, méthodes et interventions qui attirent une attention en forte hausse. ×2 = leur part d'articles a doublé.",
  "Shares, not counts, because yearly collection differs. Collection is recency-skewed; do not read as absolute volume.": "Des parts, pas des effectifs, car la collecte annuelle varie. La collecte est biaisée vers les années récentes ; ne pas lire comme un volume absolu.",
  "What to study next": "Que faut-il étudier ensuite ?",
  "Important places we still don't understand": "Des choses importantes qu'on ne comprend pas encore",
  "Automatic ranking from rising interest, disagreement and authors' stated limitations": "Classement automatique fondé sur l'intérêt croissant, les désaccords et les limites déclarées par les auteurs",
  "Score = 2·ln(growth) + 1.5·ln(1+contested pairs) + 0.8·ln(1+limitations) + ln(1+not in MINERVA) − 0.3·ln(1+papers)": "Score = 2·ln(croissance) + 1,5·ln(1+paires contestées) + 0,8·ln(1+limites) + ln(1+absent de MINERVA) − 0,3·ln(1+articles)",
  "Places with lots of interest but different answers come first.": "Les sujets qui intéressent beaucoup mais où les réponses ne sont pas d'accord passent en premier.",
  "Fields with growing research but conflicting conclusions or many stated limitations rank higher. A pointer, not a verdict.": "Les domaines où la recherche progresse mais où les conclusions divergent ou les limites déclarées sont nombreuses sont mieux classés. Une piste, pas un verdict.",
  "Limitation statements are classified into 11 lexical themes. Weights are heuristic and unvalidated.": "Les énoncés de limites sont classés en 11 thèmes lexicaux. Les pondérations sont heuristiques et non validées.",
  "Research-interest radar": "Radar de l'intérêt scientifique",
  "The further right, the more popular lately": "Plus c'est à droite, plus c'est à la mode en ce moment",
  "Further right = rising recent interest · circle size = papers": "Plus à droite = intérêt récent en hausse · taille du cercle = articles",
  "x = 3-month share change (%), y = 3-month papers (log), size ∝ √total papers, ≥ 200 papers": "x = variation de la part sur 3 mois (%), y = articles sur 3 mois (log), taille ∝ √articles totaux, ≥ 200 articles",
  "The blinking green circles are the fastest-rising topics. Click one to see related findings.": "Les cercles verts qui clignotent sont les sujets qui montent le plus vite. Clique dessus pour voir les découvertes liées.",
  "x: how much a topic's share of papers changed in the last 3 months; y: recent paper count. Blinking green = fastest rising. Click a circle for its latest findings.": "x : variation de la part d'articles d'un thème au cours des 3 derniers mois ; y : nombre d'articles récents. Vert clignotant = hausse la plus rapide. Cliquez sur un cercle pour voir ses derniers résultats.",
  "Topics come from title/abstract regex (multi-label). The 3-month window is sensitive to collection lag.": "Les thèmes proviennent d'expressions régulières sur titre/résumé (multi-étiquettes). La fenêtre de 3 mois est sensible au retard de collecte.",
  "Just-read findings": "Résultats tout juste lus",
  "One line from a paper the AI just read": "Une phrase tirée d'un article que l'IA vient de lire",
  "AI summaries checked against the abstract text": "Résumés de l'IA vérifiés par rapport au texte du résumé",
  "Abstract-only reading; accepted only if the quoted sentence matches the source": "Lecture des seuls résumés ; acceptée uniquement si la phrase citée correspond à la source",
  "It changes every 7 seconds. Click 'source' to see the real paper.": "Ça change toutes les 7 secondes. Clique sur « source » pour voir le vrai article.",
  "Shows each new paper's key result in one sentence. Rotates every 7 s; 'source' opens the paper.": "Montre le résultat clé de chaque nouvel article en une phrase. Défile toutes les 7 s ; « source » ouvre l'article.",
  "Summaries are model-generated (in Korean). Check quantities against the paper. Not expert-validated.": "Les résumés sont générés par le modèle (en coréen). Vérifiez les valeurs dans l'article. Non validé par des experts.",
  "Research around the world": "La recherche dans le monde",
  "Which countries do lots of research, and with whom": "Quels pays font beaucoup de recherche, et avec qui",
  "Darker = more papers · flowing lines = international co-authorship": "Plus foncé = plus d'articles · lignes animées = co-publications internationales",
  "Papers by author-affiliation country, top 30 co-authorship pairs": "Articles par pays d'affiliation des auteurs, 30 premières paires de co-publication",
  "Bigger yellow circles mean more papers from that country.": "Plus le cercle jaune est gros, plus ce pays a publié d'articles.",
  "Based on author affiliations. Bigger yellow circles = more papers.": "D'après les affiliations des auteurs. Cercles jaunes plus gros = plus d'articles.",
  "Countries parsed from affiliation strings; multinational papers count once per country.": "Pays extraits des chaînes d'affiliation ; un article multinational compte une fois par pays.",
  "People leading the research": "Les personnes qui mènent la recherche",
  "Scientists who wrote many papers and who they work with": "Les scientifiques qui ont écrit beaucoup d'articles et avec qui ils travaillent",
  "Most prolific researchers · lines = shared papers": "Chercheurs les plus prolifiques · lignes = articles en commun",
  "Top 120 by papers, node ∝ √papers, edges = co-authorships. Homonyms may be merged": "120 premiers par nombre d'articles, nœud ∝ √articles, arêtes = co-publications. Des homonymes peuvent être fusionnés",
  "Bigger stars wrote more papers. Click a star to see who it is.": "Les plus grosses étoiles ont écrit le plus d'articles. Clique sur une étoile pour savoir qui c'est.",
  "Star size = papers, colour = country. Click a star to see that researcher's latest finding below.": "Taille de l'étoile = articles, couleur = pays. Cliquez sur une étoile pour voir ci-dessous le dernier résultat de ce chercheur.",
  "Without ORCID, authors are identified by name string. Paper counts measure output, not impact.": "Sans ORCID, les auteurs sont identifiés par la chaîne de leur nom. Le nombre d'articles mesure la production, pas l'impact.",
  "Filling in past papers": "Rattrapage des anciens articles",
  "Collecting old papers one month at a time": "On ramasse les vieux articles un mois à la fois",
  "One cell per month": "Une case par mois",
  "Monthly windows, page cap × page size per month, Europe PMC cursor paging": "Fenêtres mensuelles, plafond de pages × taille de page par mois, pagination par curseur Europe PMC",
  "Green = finished months, yellow = the month being collected now.": "Vert = mois terminés, jaune = le mois qu'on est en train de ramasser.",
  "From 2015 to now we collect a fixed number of papers per month. Green = done, yellow = in progress.": "De 2015 à aujourd'hui, nous collectons un nombre fixe d'articles par mois. Vert = terminé, jaune = en cours.",
  "Monthly caps mean this is a sample, not a census. When exhausted, the growth autopilot raises caps and extends back to 2005.": "Les plafonds mensuels font de ceci un échantillon, pas un recensement. Une fois épuisés, le pilote automatique de croissance relève les plafonds et remonte jusqu'en 2005.",
  "Gaps and next studies": "Lacunes et prochaines études",
  "Places that haven't been studied much": "Des endroits qu'on n'a pas encore beaucoup étudiés",
  "Body site × topic · dark cells = little research so far": "Site corporel × thème · cases sombres = peu de recherche jusqu'ici",
  "Paper counts per site × topic (multi-label regex)": "Nombre d'articles par site × thème (expressions régulières multi-étiquettes)",
  "The darker the cell, the less anyone has looked there.": "Plus la case est sombre, moins on a regardé de ce côté-là.",
  "Numbers are paper counts. Dark cells may be combinations with room for new research.": "Les nombres sont des nombres d'articles. Les cases sombres peuvent être des combinaisons qui laissent de la place à de nouvelles recherches.",
  "Low counts do not always mean a gap (missed classification or biological irrelevance).": "Un faible effectif ne signifie pas toujours une lacune (classification manquée ou absence de pertinence biologique).",
  "Agent orchestra": "Orchestre d'agents",
  "The little robots working behind the scenes": "Les petits robots qui travaillent en coulisses",
  "Programs working non-stop in the background · green = healthy": "Programmes qui tournent sans arrêt en arrière-plan · vert = en bonne santé",
  "launchd supervisor child status, recent collection events (bars), regression state": "État des processus enfants du superviseur launchd, événements de collecte récents (barres), état de régression",
  "Green = working, yellow = careful, red = stopped.": "Vert = ça marche, jaune = attention, rouge = arrêté.",
  "Shows whether collection, reading, the knowledge graph, Neo4j and the MINERVA copy are healthy. Yellow = caution, red = stopped.": "Indique si la collecte, la lecture, le graphe de connaissances, Neo4j et la copie de MINERVA sont en bonne santé. Jaune = attention, rouge = arrêté.",
  "State is derived from each job's latest status file and event age.": "L'état est déduit du dernier fichier d'état de chaque tâche et de l'âge de ses événements.",
  "Papers collected": "Articles collectés",
  "How many microbiome papers we've gathered.": "Combien d'articles sur le microbiome nous avons rassemblés.",
  "Human-microbiome papers collected from Europe PMC": "Articles sur le microbiome humain collectés depuis Europe PMC",
  "Unique publication_ids from Europe PMC queries (deduplicated)": "publication_id uniques issus des requêtes Europe PMC (dédoublonnés)",
  "Papers read by AI / hour": "Articles lus par l'IA / heure",
  "Papers the AI read in the last hour.": "Les articles que l'IA a lus pendant la dernière heure.",
  "Unique papers first read and checked against the source in the last hour (re-reads excluded)": "Articles uniques lus pour la première fois et vérifiés par rapport à la source au cours de la dernière heure (relectures exclues)",
  "Unique publication_ids whose first accepted reading finished in the last hour": "publication_id uniques dont la première lecture acceptée s'est terminée au cours de la dernière heure",
  "Collection / hour": "Collecte / heure",
  "Batches of papers fetched in the last hour.": "Paquets d'articles récupérés pendant la dernière heure.",
  "Result pages fetched from Europe PMC in the last hour": "Pages de résultats récupérées depuis Europe PMC au cours de la dernière heure",
  "Sum of historical_pages across completed collection events (1 h window)": "Somme des historical_pages des événements de collecte terminés (fenêtre de 1 h)",
  "AI cost": "Coût de l'IA",
  "Money spent on AI. It never goes over the limit.": "L'argent dépensé pour l'IA. Il ne dépasse jamais la limite.",
  "AI (Bedrock) spend, always within the limit you approved": "Dépenses d'IA (Bedrock), toujours dans la limite que vous avez approuvée",
  "Sum of Bedrock ledger receipts at the pricing snapshot; daily, cumulative and per-cycle caps enforced": "Somme des reçus du registre Bedrock au tarif de l'instantané de prix ; plafonds quotidien, cumulé et par cycle appliqués",
  "Cockpit": "Tableau de bord",
  "One-page story": "Récit en une page",
  "Insight lab": "Laboratoire d'analyse",
  "See it all on one page (Story)": "Tout voir sur une seule page (Récit)",
  "Insight lab (knowledge graph)": "Laboratoire d'analyse (graphe de connaissances)",
  "Researcher ranking": "Classement des chercheurs",
  "Agent details": "Détails des agents",
  "MINERVA comparison": "Comparaison avec MINERVA",
  "Neo4j graph DB ↗": "Base de données graphe Neo4j ↗",
  "Other views": "Autres vues",
  "The AI read and organised this. Experts haven't checked it yet.": "C'est l'IA qui a lu et rangé tout ça. Des experts ne l'ont pas encore vérifié.",
  "Provisional results read automatically by AI · paper counts and attention are not evidence of effect or causation · not expert-validated": "Résultats provisoires lus automatiquement par l'IA · le nombre d'articles et l'attention ne prouvent ni un effet ni une causalité · non validé par des experts",
  "Abstract-level machine extraction · scientific_accuracy_validated = false · sample has monthly caps and recency bias": "Extraction automatique au niveau des résumés · scientific_accuracy_validated = false · l'échantillon a des plafonds mensuels et un biais vers les publications récentes",
  "Story ↓": "Récit ↓",
  "Source ↗": "Source ↗",
  "M-SAGE cockpit · live microbiome research": "Tableau de bord M-SAGE · la recherche sur le microbiome en direct",
  "1 page = 100 papers": "1 page = 100 articles",
  "Code check": "Contrôle du code",
  "Budget": "Budget",
  "Internal SSD ": "SSD interne ",
  "Ops check ": "Contrôle d'exploitation ",
  "action ": "interventions ",
  "warn ": "alertes ",
  "ok": "OK",
  "snapshot ": "instantané ",
  "release ": "version ",
  "Europe PMC slow · retrying automatically": "Europe PMC lent · nouvel essai automatique",
  "All jobs running": "Toutes les tâches tournent",
  "Checking new code · resuming soon": "Vérification du nouveau code · reprise imminente",
  " · updates every 30 s": " · mise à jour toutes les 30 s",
  "unique total ": "total unique ",
  " · queued ": " · en file d'attente ",
  "AI cost (total / $": "Coût de l'IA (total / $",
  "today $": "aujourd'hui $",
  "No backfill information": "Aucune information de rattrapage",
  "done": "terminé",
  "collecting": "en collecte",
  "waiting": "en attente",
  "out of range": "hors plage",
  " months done · up to ": " mois terminés · jusqu'à ",
  " papers/month": " articles/mois",
  " pages": " pages",
  "collected": "collectés",
  "p": "p.",
  "retry": "nouvel essai",
  "knowledge release": "version des connaissances",
  "code check": "contrôle du code",
  "charts rebuilt": "graphiques reconstruits",
  "interest change": "variation de l'intérêt",
  "last 3 months": "3 derniers mois",
  "total": "total",
  "interest": "intérêt",
  "joint papers": "articles communs",
  "papers": "articles",
  "authors": "auteurs",
  "other": "autre",
  "last year": "dernière année",
  "latest finding": "dernier résultat",
  "growing": "en hausse",
  "sparse": "rare",
  "Conditions": "Pathologies",
  "Methods": "Méthodes",
  "Interventions": "Interventions",
  "Microbes": "Microbes",
  "up": "augmente",
  "down": "diminue",
  "increase": "augmentation",
  "decrease": "diminution",
  " · same direction as MINERVA": " · même sens que MINERVA",
  " · opposite to MINERVA": " · sens opposé à MINERVA",
  "conflicts": "conflits",
  "limitations": "limites",
  "recent": "récent",
  "before": "avant",
  "Knowledge graph not loaded yet.": "Le graphe de connaissances n'est pas encore chargé.",
  "Live data unavailable · retrying": "Données en direct indisponibles · nouvel essai",
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
  "Diabetes": "Diabète",
  "Obesity": "Obésité",
  "Cardiovascular": "Cardiovasculaire",
  "IBD": "MICI",
  "Liver disease": "Maladies du foie",
  "Colorectal cancer": "Cancer colorectal",
  "Depression & anxiety": "Dépression et anxiété",
  "Asthma & allergy": "Asthme et allergie",
  "Periodontal & caries": "Parodontie et caries",
  "Alzheimer's & cognition": "Alzheimer et cognition",
  "Skin disease": "Maladies de la peau",
  "Kidney disease": "Maladies rénales",
  "Parkinson's": "Parkinson",
  "Urogenital disease": "Maladies urogénitales",
  "Autism": "Autisme",
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
  "Fatty liver": "Stéatose hépatique",
  "Cirrhosis": "Cirrhose",
  "Cardiovascular disease": "Maladies cardiovasculaires",
  "Hypertension": "Hypertension artérielle",
  "Stroke": "AVC",
  "Chronic kidney disease": "Maladie rénale chronique",
  "Parkinson's disease": "Maladie de Parkinson",
  "Alzheimer's/cognitive decline": "Alzheimer/déclin cognitif",
  "Multiple sclerosis": "Sclérose en plaques",
  "Depression": "Dépression",
  "Anxiety": "Anxiété",
  "Schizophrenia": "Schizophrénie",
  "ADHD": "TDAH",
  "Asthma": "Asthme",
  "Allergy/atopy": "Allergie/atopie",
  "COPD": "BPCO",
  "Cystic fibrosis": "Mucoviscidose",
  "COVID-19": "COVID-19",
  "HIV": "VIH",
  "Sepsis/critical illness": "Sepsis/réanimation",
  "C. difficile infection": "Infection à C. difficile",
  "H. pylori infection": "Infection à H. pylori",
  "Urinary tract infection": "Infection urinaire",
  "Bacterial vaginosis": "Vaginose bactérienne",
  "Preterm birth/neonatal": "Prématurité/néonatal",
  "PCOS": "SOPK",
  "Endometriosis/infertility": "Endométriose/infertilité",
  "Periodontitis": "Parodontite",
  "Dental caries": "Caries dentaires",
  "Psoriasis": "Psoriasis",
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
