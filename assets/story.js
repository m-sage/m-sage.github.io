(function () {
"use strict";
/* M-SAGE scroll page: every finding on one continuous page, in Korean, English, Italian or French, at three reading levels. */
const C = {teal: "#2dd4bf", coral: "#fb7185", amber: "#fbbf24", violet: "#a78bfa", sky: "#38bdf8", lime: "#a3e635", text: "#e6ecff", muted: "#8d9bc4", dim: "#5d6a92", line: "#1b2648"};
const PAL = [C.sky, C.coral, C.teal, C.amber, C.violet, C.lime, "#f472b6", "#60a5fa", "#fb923c", "#94a3b8"];
const $ = id => document.getElementById(id);
const esc = t => String(t == null ? "" : t).replace(/[&<>"]/g, c => ({"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;"}[c]));
const store = {get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }, set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }};
const qs = new URLSearchParams(location.search);
let lang = qs.get("lang") || store.get("msage.lang") || "ko";
let level = qs.get("level") || store.get("msage.level") || "eli20";
if (!["ko", "en", "it", "fr"].includes(lang)) lang = "ko";
/* Italian and French: K(ko, en, it, fr). Without an explicit translation the English text is looked up in the page's dictionary,
   IT_WORDS() or FR_WORDS() (end of file); if absent, English is shown (and reported to MSAGE_I18N_MISS). */
const WORDS = {it: IT_WORDS, fr: FR_WORDS}, DICT = {};
const XL = () => !!WORDS[lang];                                 // a dictionary language (it, fr): English text is translated through WORDS
const xlate = en => { if (typeof en !== "string" || !en || !WORDS[lang]) return en; const D = DICT[lang] = DICT[lang] || WORDS[lang]();
  const v = D[en] != null ? D[en] : D[cap(en)]; if (v != null) return v;
  if (window.MSAGE_I18N_MISS) window.MSAGE_I18N_MISS(en, "story", lang); return en; };
const K = (ko, en, it, fr) => lang === "ko" ? ko : lang === "en" ? en : (lang === "it" ? it : fr) ?? xlate(en);
const nm = s => XL() ? xlate(s) : s;                           // English data label -> Italian/French name
const LOC = gb => ({ko: "ko-KR", it: "it-IT", fr: "fr-FR"})[lang] || (gb ? "en-GB" : "en-US");
const fmt = n => n == null ? "—" : Number(n).toLocaleString(LOC());

/* ------------------------------------------------------------------ words */
const T = {
  ko: {nav_cockpit: "조종석", nav_story: "한 페이지 이야기", nav_lab: "인사이트 랩", cockpit_link: "조종석에서 실시간으로 ↗",
       kicker: "M-SAGE · 인체 마이크로바이옴 연구 지식 엔진", title: "AI가 읽은 마이크로바이옴 연구, 한 장의 두루마리로",
       scroll: "아래로 내려가면 모든 내용이 순서대로 나옵니다 ↓", papers: "AI가 읽은 논문", relations: "미생물 관계 문장", checked: "AI 문장 재확인 통과",
       stories: "설명 에이전트가 쓴 이야기", cost: "AI 비용 (누적)", authors: "연구자", ai: "AI 작성", tpl: "자동 문장 · AI 설명 준비 중", isnew: "새로움",
       inc: "증가", dec: "감소", none: "차이 없음", papersN: "논문", evidence: "근거", taxon: "미생물", disease: "질병", minerva: "MINERVA",
       same: "같은 방향", opposite: "반대 방향", absent: "없음 (새 연결)", missing: "질병 없음", rising: "떠오르는", fading: "시들해지는",
       foot: "모든 내용은 초록과 근거 문장에서 AI가 자동으로 뽑은 잠정 결과입니다. 함께 관찰된 것이지 원인과 결과가 아니며, 전문가 검증 전입니다.",
       live: "실시간", updated: "기준", source: "원문", cats: {Disease: "질병", Method: "연구 방법", Intervention: "개입", Metabolite: "대사물질", Taxon: "미생물", BodySite: "몸 부위"}},
  en: {nav_cockpit: "Cockpit", nav_story: "One-page story", nav_lab: "Insight lab", cockpit_link: "Live in the cockpit ↗",
       kicker: "M-SAGE · human microbiome research knowledge engine", title: "Microbiome research read by AI, on one scroll",
       scroll: "Keep scrolling — everything appears in order ↓", papers: "Papers read by AI", relations: "Microbe relation sentences", checked: "Passed AI re-check",
       stories: "Stories by the explainer", cost: "AI cost (total)", authors: "Researchers", ai: "AI-written", tpl: "Template · AI story coming", isnew: "New",
       inc: "more", dec: "less", none: "no difference", papersN: "papers", evidence: "evidence", taxon: "Microbe", disease: "Condition", minerva: "MINERVA",
       same: "same direction", opposite: "opposite", absent: "absent (new link)", missing: "condition not in MINERVA", rising: "Rising", fading: "Fading",
       foot: "Everything here is provisional: machine-extracted by AI from abstracts and their evidence sentences. It shows things reported together, not cause and effect, and is not yet expert-validated.",
       live: "live", updated: "as of", source: "paper", cats: {Disease: "Conditions", Method: "Methods", Intervention: "Interventions", Metabolite: "Metabolites", Taxon: "Microbes", BodySite: "Body sites"}}};
const KIND = {ko: {consensus: "합의", debate: "논쟁", rising: "떠오름", fading: "시들해짐", signature: "공통 신호", novel: "MINERVA에 없는 새 연결", opposite: "MINERVA와 반대",
                   next: "다음 연구", hot_unsettled: "뜨겁지만 미결", health_marker: "건강 지표 후보", method_shift: "도구의 변화", deepdive: "자동 추가 분석", new_concept: "새 개념"},
              en: {consensus: "Agreement", debate: "Debate", rising: "Rising", fading: "Fading", signature: "Shared signal", novel: "New vs MINERVA", opposite: "Opposite to MINERVA",
                   next: "Next study", hot_unsettled: "Hot but unsettled", health_marker: "Health-marker candidate", method_shift: "Tool shift", deepdive: "Automatic follow-up", new_concept: "New concept"}};
/* Section titles and leads: [ko, en] x [eli10, eli20, pro] */
const S = {
  news: {t: ["새로 찾은 이야기", "Newly found stories"], l: {
    eli10: ["설명을 좋아하는 AI가 논문 더미에서 눈에 띄는 모양을 찾을 때마다 여기에 이야기를 하나씩 붙여요.", "Every time our explaining robot spots an interesting shape in the pile of papers, it pins a new story here."],
    eli20: ["설명 에이전트가 3시간마다 지식 그래프를 살펴 새 패턴이나 크게 달라진 패턴을 찾고, 그때마다 이야기를 새로 씁니다. 최근에 생기거나 바뀐 것이 위에 옵니다.", "Every three hours the explainer agent scans the knowledge graph for new or materially changed patterns and writes a story for each. Newest changes come first."],
    pro: ["탐지기 11종(합의·논쟁·추세·시그니처·MINERVA 대비·다음 연구·복합 패턴)의 사실 묶음을 합성 모델이 서술하고, 숫자가 사실 묶음에 없으면 거부됩니다. 지문(유효숫자 2자리)이 바뀔 때만 다시 씁니다.", "Eleven detectors (agreement, debate, trends, signatures, MINERVA comparison, next study, composite patterns) emit fact packs; the synthesis model narrates them and any number absent from the pack is rejected. Stories are rewritten only when the 2-significant-figure fingerprint changes."]}},
  vitals: {t: ["지식 그래프 성장 일지 · 계속 돌기 위한 점검표", "Growth log · what it needs to keep running"], l: {
    eli10: ["한 시간마다 지식 지도가 얼마나 자랐는지 적어 둬요. 아래 점검표에 빨간 불이 있으면 사람이 도와줘야 해요.", "Every hour we write down how much the knowledge map grew. A red light in the checklist means a person needs to help."],
    eli20: ["매시간 읽은 논문, 관계, AI 재확인, 그래프 노드, Neo4j, 이야기 수를 기록해 지난 1시간·24시간 동안 얼마나 늘었는지 보여 줍니다. 점검표는 잠자기 설정, 외장 드라이브, 저장 공간, 비용 여유, 가격표, AI 접속, 각 작업이 살아 있는지를 확인합니다.", "Every hour we record papers read, relations, AI checks, graph nodes, Neo4j and stories, and show the growth over the last hour and day. The checklist covers sleep settings, the external drive, disk space, budget runway, price snapshot, AI access and whether each job is alive."],
    pro: ["vitals.py가 system-watch에서 매시간 실행: 원장(읽기 전용)·build.json·insights·explainer 상태를 표본화해 history.jsonl(최대 90일)에 추가, pmset·디스크·영수증 나이로 점검. 지식 그래프는 매시간 재생성되고 Neo4j는 재적재 후 개수 검증.", "vitals.py runs hourly from system-watch: samples the ledger (read-only), build.json, insights and explainer state into history.jsonl (≤ 90 days) and evaluates pmset, disks and receipt ages. The graph rebuilds hourly and Neo4j is reloaded with a count check."]}},
  deep: {t: ["AI가 스스로 더 파고든 분석", "Where the AI dug deeper on its own"], l: {
    eli10: ["새로운 것을 찾으면 AI가 '왜 그럴까?' 하고 스스로 더 조사해요. 예를 들어 논문들이 서로 다른 말을 하면, 어떤 방법으로 연구했는지 나눠 보며 이유를 찾아요.", "When the AI finds something new, it asks 'why?' and keeps digging. If papers disagree, it sorts them by how they were done to find the reason."],
    eli20: ["새로 나타나거나 크게 바뀐 패턴마다 자동 후속 분석이 붙습니다. 엇갈리는 관계는 분석 방법·몸 부위·시기·분류 수준별로 나눠 방향이 뒤집히는 지점을 찾고, 새 관계는 언제부터 얼마나 빨리 근거가 쌓였는지, 떠오르는 주제는 무엇과 함께 뜨는지 봅니다.", "Every new or materially changed pattern triggers an automatic follow-up. Conflicts are split by method, body site, period and taxonomic level to find where the direction flips; new relations get an emergence timeline; rising topics get their co-rising entities and leaders."],
    pro: ["investigator.py: 지식 그래프(graph.sqlite)에 대한 결정적 SQL 분석 → 사실 묶음 → 합성 모델 서술(숫자 검증 동일). 분석 종류: conflict_split(소수 방향 비율 기준 집단 쌍에서 lean 부호 반전, |Δlean| ≥ 0.6, 집단당 표 ≥ 3), emergence, co_rising(최근 2년 vs 3–5년 전 동시 언급 lift), signature_detail, method_adoption. 지문당 1회, 실행당 최대 20건.", "investigator.py: deterministic SQL over graph.sqlite → fact pack → synthesis-model narrative under the same number check. Analyses: conflict_split (sign flip of lean between feature groups, |Δlean| ≥ 0.6, ≥ 3 votes per group), emergence, co_rising (co-mention lift, last 2 y vs 3–5 y ago), signature_detail, method_adoption; once per fingerprint, ≤ 20 per run."]}},
  consensus: {t: ["논문들이 한목소리로 말하는 관계", "What many papers agree on"], l: {
    eli10: ["어떤 병이 있는 사람 몸속에서 특정 세균이 많아지거나 줄어든다고 여러 논문이 똑같이 말한 것들이에요.", "These are germs that many papers say go up or down in people with a certain illness."],
    eli20: ["같은 미생물–질병 쌍에 대해 '증가' 또는 '감소'라고 보고한 문장이 60% 이상 한쪽으로 모인 관계입니다. 많이 모일수록 믿을 만하지만, 함께 관찰된 것이지 원인은 아닙니다.", "Microbe–condition pairs where at least 60% of reporting sentences point the same way. More agreement means more confidence, but it is co-occurrence, not cause."],
    pro: ["ASSOCIATED 간선(질병군 대 대조군, 근거 문장 단위, 논문당 방향별 1표)에서 |점수| ≥ 0.6, 증가+감소 ≥ 5. AI 재판정 + 비교 그룹 대조를 통과한 간선 기준이며 MINERVA 방향 일치 여부를 함께 표시합니다.", "ASSOCIATED edges (disease vs control, sentence-level, one vote per paper per direction) with |score| ≥ 0.6 and ≥ 5 directional votes, after AI re-judgement and group-phrase grounding; MINERVA direction agreement shown."]}},
  debate: {t: ["논문끼리 부딪히는 관계", "Where papers disagree"], l: {
    eli10: ["어떤 논문은 '늘어난다', 어떤 논문은 '줄어든다'고 해서 아직 정답을 모르는 것들이에요.", "Some papers say 'more', others say 'less' — nobody knows the answer yet."],
    eli20: ["증가와 감소 보고가 섞여 있는 관계입니다. 대상자, 몸 부위, 분석 방법이 달라서일 수 있고, 바로 이런 곳이 다음 연구가 필요한 곳입니다.", "Pairs with mixed 'more' and 'less' reports. Differences in cohorts, body sites or methods may explain it — exactly where new studies are needed."],
    pro: ["소수 방향 비율 ≥ 0.3, 방향 표 ≥ 6. 하위 분류(종 vs 속), 표본 부위, 서열 분석(16S vs 샷건), 교란 변수 차이가 흔한 원인입니다.", "Minority-direction share ≥ 0.3 with ≥ 6 directional votes. Taxonomic level (species vs genus), sample site, sequencing (16S vs shotgun) and confounding are typical sources."]}},
  signature: {t: ["여러 질병에 공통으로 나타나는 미생물", "Microbes that show up across many conditions"], l: {
    eli10: ["어떤 세균은 여러 병에서 똑같이 줄어들어요. 몸이 건강할 때 많은 '좋은 세균' 신호일 수 있어요.", "Some germs drop in lots of different illnesses — maybe a sign of a healthy gut."],
    eli20: ["3개 이상 질병에서 방향이 일관된 미생물입니다. 여러 질병에서 줄면 '건강 지표', 늘면 '질환 지표' 후보입니다. 빨강 = 증가, 파랑 = 감소.", "Microbes with a consistent direction in ≥ 3 conditions: consistently lower suggests a health-marker candidate, higher a disease-marker candidate. Red = more, blue = less."],
    pro: ["속 수준 집계, 쌍별 |점수| ≥ 0.5, 방향 표 ≥ 3. 질병 특이성이 낮은 신호(염증·항생제 노출 공통 반응)일 가능성을 함께 고려해야 합니다.", "Genus-level aggregation, per-pair |score| ≥ 0.5 with ≥ 3 votes. Low disease specificity may reflect shared responses (inflammation, antibiotic exposure)."]}},
  trends: {t: ["떠오르는 주제, 시들해지는 주제", "Rising and fading topics"], l: {
    eli10: ["요즘 과학자들이 더 많이 연구하는 것과 덜 연구하는 것을 보여 줘요. 막대가 길수록 인기가 빨리 늘었어요.", "What scientists are studying more — and less — these days. Longer bars mean faster-growing interest."],
    eli20: ["최근 2년 논문에서 차지하는 비율을 3–5년 전과 비교했습니다. 해마다 모은 논문 수가 달라서 '개수'가 아니라 '비율'로 봅니다.", "Share of recent (last 2 years) papers versus 3–5 years ago. We compare shares, not counts, because yearly collection sizes differ."],
    pro: ["성장 = (최근 2년 언급 비율 + 1e-4) / (3–5년 전 비율 + 1e-4), 최근 비율 ≥ 0.2%, 언급 논문 ≥ 25. 월별 수집 상한 때문에 절대량 추세는 해석하지 않습니다.", "Growth = (share in last 2 years + 1e-4)/(share 3–5 years ago + 1e-4); recent share ≥ 0.2%, ≥ 25 papers. Absolute volumes are not interpreted because of monthly collection caps."]}},
  concepts: {t: ["새 개념 레이더", "New-concept radar"], l: {
    eli10: ["요즘 과학자들이 새로 쓰기 시작한 단어를 찾아요. 우리 사전에 없던 말이 자꾸 나오면, 세 번 연속 확인한 뒤 사전에 넣어요.", "We look for words scientists have just started using. If a word we don't know keeps showing up, we add it to our dictionary after seeing it three times in a row."],
    eli20: ["개념 탐색 에이전트가 매 지식 그래프 빌드마다 우리 어휘에 없는 용어(새 세균 이름, 약어, 기술 합성어)를 찾고, 최근 2년과 3–6년 전 논문 비율을 비교합니다. 3번 연속 떠오르면 '채택'되어 그래프의 개념 노드가 되고, 설명 에이전트가 이야기를 씁니다.", "The concept scout scans every graph build for terms our vocabulary lacks (new microbe names, acronyms, technical compounds) and compares their share in the last 2 years with 3–6 years ago. Three builds in a row and the term is adopted: it becomes a Concept node and the explainer writes about it."],
    pro: ["문서 빈도 기준. 최근 창 ≥ 12편, 비율 성장 ≥ 4배((사전 df+0.5)/N 평활), 기존 어휘(분류군·질병·처치·대사체·방법·부위) 비포함, 통계·서식 용어 제외. 점수 = ln(성장)·√최근 df (최근 5년 내 첫 등장 ×1.5). 연속 3회 → 채택(Concept 노드 + MENTIONS), 6회 누락 시 후보 삭제. 수집이 최근 쪽으로 치우쳐 있어 비율로 비교합니다.", "Document frequency. Recent window ≥ 12 papers, share growth ≥ 4× ((prior df+0.5)/N smoothing), not in the existing vocabulary (taxa, conditions, interventions, metabolites, methods, sites), statistics and formatting terms excluded. Score = ln(growth)·√recent df (×1.5 if first seen within 5 years). 3 consecutive builds → adopted (Concept node + MENTIONS); candidates dropped after 6 misses. Collection is recency-skewed, so shares are compared, not counts."]}},
  map: {t: ["미생물과 질병의 지식 지도", "The knowledge map"], l: {
    eli10: ["주황 동그라미는 병, 초록 동그라미는 세균이에요. 선이 이어져 있으면 논문에서 같이 이야기된 거예요.", "Orange circles are illnesses, green circles are germs. A line means papers talk about them together."],
    eli20: ["근거 문장에서 뽑은 미생물–질병 관계망입니다. 빨강 선은 질병에서 증가, 파랑은 감소, 노랑 점선은 논문끼리 엇갈림입니다. 원을 끌거나 확대해 보세요.", "Network of microbe–condition relations from evidence sentences. Red = more in the condition, blue = less, dashed amber = conflicting. Drag or zoom."],
    pro: ["상위 70개 속과 관련 질병, 방향 표 ≥ 4인 간선. 간선 굵기 ∝ √표 수. 같은 그래프는 로컬 Neo4j(Taxon, Disease, ASSOCIATED)에서 Cypher로 질의할 수 있습니다.", "Top 70 genera and linked conditions, edges with ≥ 4 votes; width ∝ √votes. The same graph is queryable in the local Neo4j (Taxon, Disease, ASSOCIATED) with Cypher."]}},
  gaps: {t: ["연구 공백과 다음에 해야 할 연구", "Research gaps and what to study next"], l: {
    eli10: ["논문을 쓴 과학자들이 '이건 아직 부족해요'라고 적은 것을 모았어요. 그리고 다음에 연구하면 좋을 곳에 순위를 매겼어요.", "We collected the 'we still don't know this' notes scientists wrote, and ranked where to look next."],
    eli20: ["저자들이 직접 쓴 한계·공백 문장을 주제별로 나누고, 관심 증가·엇갈린 결과·한계 진술을 합쳐 다음 연구 우선순위를 냈습니다. 판단이 아닌 방향 제시입니다.", "Authors' own limitation and gap statements grouped by theme; interest growth, conflicting results and limitations are combined into a priority list — a pointer, not a verdict."],
    pro: ["점수 = 2·ln(성장) + 1.5·ln(1+논쟁 쌍) + 0.8·ln(1+한계 진술) + ln(1+MINERVA 미수록) − 0.3·ln(1+논문). 주제 분류는 정규식 11종(표본·인과·종단·인구·검증·해상도·교란·임상·기능·표준화·동물).", "Score = 2·ln(growth) + 1.5·ln(1+contested pairs) + 0.8·ln(1+limitation statements) + ln(1+not in MINERVA) − 0.3·ln(1+papers). Themes from 11 lexical classes."]}},
  minerva: {t: ["MINERVA와 비교하면", "Compared with MINERVA"], l: {
    eli10: ["연구실의 큰 지식 지도(MINERVA)와 우리 결과를 비교했어요. 대부분 같은 말을 하고, 몇 개는 새로운 이야기예요.", "We compared our results with the lab's big knowledge map, MINERVA. Mostly they agree, and a few links are brand new."],
    eli20: ["MINERVA 4개 그래프를 한 번 전체 복사해 와서, 우리 합의 관계가 같은 방향인지, MINERVA에 아직 없는 연결은 무엇인지 봅니다. 평소에는 MINERVA에 접속하지 않습니다.", "MINERVA's four graphs were copied once in full. We check whether our agreed relations point the same way and which links MINERVA does not yet have. We do not connect to MINERVA day to day."],
    pro: ["MINERVA main 그래프의 Microbe→Disease 관계(POSITIVE·STRENGTH_POSITIVE*·NEGATIVE·STRENGTH_NEGATIVE)를 질병 정규식으로 우리 분류에 대응. '없음'은 대응된 질병에 해당 속·종 관계가 없다는 뜻이며 표기 차이일 수 있습니다.", "MINERVA main Microbe→Disease relations (POSITIVE, STRENGTH_POSITIVE*, NEGATIVE, STRENGTH_NEGATIVE) mapped to our classes by regex; 'absent' means no genus/species relation for the mapped condition and may reflect naming differences."]}},
  findings: {t: ["방금 읽은 발견", "Latest findings"], l: {
    eli10: ["AI가 방금 읽은 논문에서 가장 중요한 한 문장을 골라 보여 줘요.", "The most important sentence from papers the AI just read."],
    eli20: ["AI가 초록을 읽고 원문 문장과 대조해 통과시킨 최신 결과들입니다. 원문 링크로 직접 확인할 수 있습니다.", "Recent results the AI extracted from abstracts and checked against the source sentence. Follow the link to verify."],
    pro: ["초록 기반 판독(abstract-grounded-7), 인용 구간 대조 통과. 요약 속 숫자는 인용된 구간에 있어야 합니다. 전문(full text) 미확인.", "Abstract-only reading (abstract-grounded-7) with quote-span grounding; any number in a summary must appear in the cited span. Full text not checked."]}},
  radar: {t: ["관심이 움직이는 주제", "Where attention is moving"], l: {
    eli10: ["최근 몇 달 동안 갑자기 많이 연구된 주제는 오른쪽, 줄어든 주제는 왼쪽에 있어요.", "Topics studied a lot more lately are on the right; less, on the left."],
    eli20: ["최근 3개월 동안 논문 속 비중이 얼마나 변했는지 주제와 질병별로 보여 줍니다.", "Change in share of papers over the last three months, by topic and condition."],
    pro: ["제목·초록 정규식 언급 기준 3개월 창 비율 변화(논문 ≥ 200). 지식 그래프의 2년 추세와 창 길이가 다릅니다.", "Three-month window share change from title/abstract lexical mentions (≥ 200 papers); a different window from the 2-year graph trends."]}},
  people: {t: ["연구자 순위와 분야 메타 분석", "Researcher rankings and a meta-analysis of the field"], l: {
    eli10: ["누가 논문을 가장 많이 쓰고, 누구 논문이 가장 많이 읽히는지 순위를 매겼어요. 요즘 새로 떠오르는 과학자와, 병마다 누가 전문가인지도 보여 줘요.", "Who writes the most papers, whose papers are read most, who is new and rising, and who the experts are for each illness."],
    eli20: ["네 가지 순위(논문 수, 피인용, 코퍼스 내 h-지수, 최근 1년 활동)와 함께 분야 자체를 분석합니다: 연구팀 크기 변화, 논문이 소수에게 얼마나 몰려 있는지, 신규 연구자 비율, 주요 학술지와 그 성장, 가장 많이 인용된 논문, 질병별 대표 연구자.", "Four rankings (papers, citations, in-corpus h-index, last-year activity) plus an analysis of the field itself: team size over time, how concentrated authorship is, newcomer share, leading journals and their growth, most-cited papers, and leading researchers per condition."],
    pro: ["저자 식별: ORCID가 없으면 동일 이름 병합(동명이인 합산 가능, 특히 짧은 동아시아 이름). 피인용은 수집 시점 Europe PMC 값, h-지수는 이 코퍼스 안에서만 계산. 집중도: 저자별 저자권 수의 지니계수와 상위 1%·10% 점유율. 신규 비율 = 최근 2년 활동 저자 중 코퍼스 첫 등장이 최근 2년인 비율(수집이 최근에 치우쳐 과대 추정).", "Author identity: same-name merge without ORCID (homonyms may be pooled, especially short East-Asian names). Citations are Europe PMC counts at capture; h-index computed within this corpus. Concentration: Gini of authorships per author and top-1%/10% shares. Newcomer share = authors active in the last 2 years whose first corpus paper is in that window (inflated by recency-weighted collection)."]}},
  world: {t: ["누가, 어디서 연구하나", "Who studies this, and where"], l: {
    eli10: ["어느 나라 과학자들이 논문을 많이 쓰고, 누구랑 같이 쓰는지 보여 줘요.", "Which countries write the most papers, and who works with whom."],
    eli20: ["저자 소속 국가별 논문 수와 나라 사이 공동 연구, 논문을 많이 쓴 연구자와 기관입니다.", "Papers by authors' countries, cross-country collaboration, and the most prolific researchers and institutions."],
    pro: ["소속 문자열 기반(기관 식별자 미검증), ORCID 없으면 동일 이름 병합. 인용 수는 수집 시점 Europe PMC 값.", "Affiliation strings (not resolved to institution IDs); same-name merge without ORCID; citations are Europe PMC counts at capture."]}},
  engine: {t: ["엔진은 지금", "The engine right now"], l: {
    eli10: ["뒤에서 쉬지 않고 논문을 모으고 읽는 프로그램들이에요. 초록 불이면 잘 일하고 있어요.", "The programs that keep collecting and reading papers. Green means working well."],
    eli20: ["수집, AI 판독, 지식 그래프, Neo4j, MINERVA 사본, 설명 에이전트가 각각 지금 무엇을 하는지와 과거 논문 채우기 진행입니다.", "What collection, AI reading, the knowledge graph, Neo4j, the MINERVA copy and the explainer are doing, plus backfill progress."],
    pro: ["감독(launchd)이 코드 변경 시 전체 회귀(237 게이트) 통과 후 재가동. 비용은 Bedrock 원장 예약 기준, 사용자 승인 한도 내.", "The launchd supervisor re-admits services only after the full regression (237 gates) passes on code change; cost from Bedrock ledger reservations within user-approved limits."]}},
};
const TOPIC_EN = {immune: "Immunity & inflammation", metabolism: "Microbial metabolism", diversity: "Diversity & dysbiosis", resistance: "Antibiotics & resistance",
  oral: "Oral", barrier: "Barrier & permeability", probiotics: "Probiotics", scfa: "Short-chain fatty acids", skin: "Skin", prebiotics: "Prebiotics & fibre",
  bile: "Bile acids", fmt: "Microbiota transplant", cancer: "Cancer", infection: "Infection", diabetes: "Diabetes", obesity: "Obesity", cardio: "Cardiovascular",
  ibd: "IBD", liver: "Liver disease", crc: "Colorectal cancer", mood: "Depression & anxiety", allergy: "Asthma & allergy", periodontal: "Periodontal & caries",
  alzheimer: "Alzheimer's & cognition", skin_disease: "Skin disease", kidney: "Kidney disease", parkinson: "Parkinson's", urogenital: "Urogenital disease", autism: "Autism"};
const STATIC = window.MSAGE_STATIC || null;            // set only in the packaged, server-free website
const ROUTE = window.MSAGE_ROUTES || {cockpit: "/cockpit", story: "/story", module: "/cockpit/module"};   // page addresses
const ORDER = ["vitals", "news", "deep", "consensus", "debate", "signature", "trends", "concepts", "map", "gaps", "minerva", "findings", "radar", "people", "world", "engine"].filter(id => !(STATIC && STATIC.public && (id === "vitals" || id === "engine")));
const pick = a => K(a[0], a[1], a[2], a[3]);                   // [ko, en], [ko, en, it] or [ko, en, it, fr]
const tx = k => { const v = T[lang === "ko" ? "ko" : "en"][k];   // Italian/French: the English word through IT_WORDS()/FR_WORDS()
  return !XL() ? v : typeof v === "string" ? xlate(v) : Object.fromEntries(Object.entries(v).map(([a, b]) => [a, xlate(b)])); };
const kind = k => { const v = KIND[lang === "ko" ? "ko" : "en"][k]; return XL() ? xlate(v) : v; };
const stext = s => { const t = (s && s.text) || {}; return t[lang] || (XL() ? t.en : null) || {}; };   // AI story text; Italian and French fall back to English
const lead = id => pick(S[id].l[level]);
/* AI paper summaries are written in Korean; the site data carries summary_i18n {korean: {en, it, fr}} (filled in gradually) */
const summaryText = ko => { if (!ko) return null; if (lang === "ko") return ko;
  const m = ((snap && snap.summary_i18n) || (window.MSAGE_DATA || {}).summary_i18n || {})[ko]; return (m && m[lang]) || null; };
const SUMMARK = {orig: ["원문 제목", "original title", "titolo originale", "titre original"],
  pend: ["(한국어 AI 요약 · 번역 준비 중)", "(Korean AI summary — translation pending)", "(riassunto IA in coreano — traduzione in arrivo)", "(résumé IA en coréen — traduction en cours)"]};
// summary in the page language; else the paper's own (English) title, marked; else the Korean, marked as pending. titled = the title is already shown
const sumHTML = (ko, title) => { const t = summaryText(ko); if (t) return {html: esc(t), titled: false};
  if (title) return {html: `${esc(title)}<small class="sx">${pick(SUMMARK.orig)}</small>`, titled: true};
  return {html: `<span class="sx-ko" lang="ko">${esc(ko)}</span><small class="sx sx-pend">${pick(SUMMARK.pend)}</small>`, titled: false}; };

/* ------------------------------------------------------------------ data */
let snap = null, ins = null, live = null, stories = null, vitals = null, storage = null;
const get = (u, f) => f ? Promise.resolve(f) : fetch(u, {cache: "no-cache"}).then(r => r.ok ? r.json() : Promise.reject(r.status));
const cap = t => t ? t.charAt(0).toUpperCase() + t.slice(1) : t;
const dname = (key, ko) => lang === "ko" ? (ko || key) : nm(cap((((ins || {}).labels_en || {}).disease || {})[key] || TOPIC_EN[key] || ko || key));
const catKey = {Disease: "disease", Method: "method", Intervention: "intervention", Metabolite: "metabolite", BodySite: "site"};
/* Korean entity name -> English, for lists that carry only {label: category, name} (concept co-mentions): built from the ids seen in the insights */
let koIdx = null, koIdxFor = null;
const koToEn = (cat, name) => { if (koIdxFor !== ins) { koIdxFor = ins; koIdx = {}; const L = (ins || {}).labels_en || {};
    const add = (c, id, n) => { const e = (L[catKey[c]] || {})[id]; if (e && n && !koIdx[c + "|" + n]) koIdx[c + "|" + n] = e; };
    const walk = o => { if (Array.isArray(o)) return o.forEach(walk); if (!o || typeof o !== "object") return;
      if (o.id && (o.name || o.label)) Object.keys(catKey).forEach(c => add(c, o.id, o.name || o.label));
      if (o.disease && o.disease_label) add("Disease", o.disease, o.disease_label);
      Object.values(o).forEach(walk); };
    walk(ins || {}); }
  return koIdx[cat + "|" + name] || null; };
const ename = w => lang === "ko" || w.label === "Taxon" ? w.name : (e => e ? nm(cap(e)) : w.name)(koToEn(w.label, w.name));
const tname = (cat, r) => lang === "ko" || cat === "Taxon" ? r.name : nm((((ins || {}).labels_en || {})[catKey[cat]] || {})[r.id] || r.name);

/* ------------------------------------------------------------------ charts */
const charts = {};
function chart(id, opt) {
  const el = $(id); if (!el || !window.echarts) return null;
  if (charts[id]) charts[id].dispose();
  const c = echarts.init(el);
  c.setOption(Object.assign({backgroundColor: "transparent", textStyle: {fontFamily: "inherit", color: C.text}, animationDuration: 1400}, opt));
  charts[id] = c; return c;
}
window.addEventListener("resize", () => Object.values(charts).forEach(c => c.resize()));

/* ------------------------------------------------------------------ pieces */
function storyCard(s) {
  const t = stext(s);
  const fresh = (Date.now() / 1000 - (s.changed_at || 0)) < 86400 * 2;
  const ex = (s.examples || [])[0];
  const pro = level === "pro";
  return `<article class="story k-${s.kind}"><span class="kind">${esc(kind(s.kind) || s.kind)}</span>
    <span class="badge ${s.ai ? "ai" : ""}">${s.ai ? tx("ai") : tx("tpl")}</span>${fresh ? `<span class="badge new">${tx("isnew")}</span>` : ""}
    <h4>${esc(t.title || "")}</h4><p>${esc(t[level] || t.eli20 || "")}</p>
    ${pro && ex ? `<div class="ev"><q>${esc(ex.quote)}</q> ${ex.pmid ? `· <a href="https://europepmc.org/article/MED/${esc(ex.pmid)}" target="_blank" rel="noopener">PMID ${esc(ex.pmid)}</a>` : ""}</div>` : ""}</article>`;
}
function storiesOf(kinds, n) {
  const list = ((stories || {}).stories || []).filter(s => kinds.includes(s.kind)).slice(0, n || 12);
  return list.length ? `<div class="stories">${list.map(storyCard).join("")}</div>` : "";
}
function pairRows(rows, withM) {
  return rows.map(p => { const tot = p.inc + p.dec || 1, m = p.minerva;
    const mtxt = !withM || m == null ? "" : m.disease_missing ? tx("missing") : m.absent ? tx("absent") : p.minerva_agrees === false ? tx("opposite") : tx("same");
    return `<tr><td class="tx">${esc(p.taxon)}</td><td>${esc(dname(p.disease, p.disease_label))}</td>
      <td style="width:28%"><div class="dv"><span style="width:${50 * p.dec / tot}%;background:${C.sky}"></span><span style="width:${50 * p.inc / tot}%;background:${C.coral}"></span></div>
      <small style="color:var(--dim)">${tx("dec")} ${p.dec} · ${tx("inc")} ${p.inc}</small></td><td class="n">${p.papers}</td>${withM ? `<td style="font-size:12px;color:${p.minerva_agrees === false ? C.coral : C.muted}">${mtxt}</td>` : ""}</tr>`; }).join("");
}
const head = cols => `<thead><tr>${cols.map(c => `<th${c[1] ? ' class="n"' : ""}>${c[0]}</th>`).join("")}</tr></thead>`;

/* ------------------------------------------------------------------ sections */
const R = {
  vitals() {
    const V = vitals, g1 = V.growth_1h || {}, g24 = V.growth_24h || {}, x = V.latest || {};
    const KEYS = [["papers_read", K("읽은 논문", "Papers read")], ["relations", K("미생물 관계", "Relations")],
      ["relations_ai_checked", K("AI 재확인 통과", "AI-checked")], ["graph_nodes", K("그래프 노드", "Graph nodes")],
      ["neo4j_nodes", K("Neo4j nodes", "Neo4j nodes", "Nodi Neo4j", "Nœuds Neo4j")], ["stories", K("이야기", "Stories")], ["follow_ups", K("자동 추가 분석", "Follow-ups")]];
    const sign = v => v == null ? "—" : (v > 0 ? "+" : "") + fmt(v);
    const kp = KEYS.map(([k, n]) => `<div class="kpi"><b>${fmt(x[k])}</b><span>${n}<br><span style="color:${(g1[k] || 0) > 0 ? C.lime : C.dim}">1h ${sign(g1[k])}</span> · <span style="color:${(g24[k] || 0) > 0 ? C.lime : C.dim}">24h ${sign(g24[k])}</span></span></div>`).join("");
    const color = {ok: C.teal, warn: C.amber, bad: C.coral}, sum = V.summary || {};
    const vl = (c, p) => c[p + lang] || (XL() ? c[p + "en"] : "");   // checks carry ko/en text; Italian and French show the English
    const list = (V.checks || []).slice().sort((a, b) => ({bad: 0, warn: 1, ok: 2}[a.state] - {bad: 0, warn: 1, ok: 2}[b.state]));
    const rows = list.map(c => `<tr><td style="width:14px"><span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${color[c.state]}"></span></td>
      <td>${esc(vl(c, ""))}${c.state !== "ok" && level !== "eli10" && vl(c, "fix_") ? `<br><small style="color:var(--muted)">→ ${esc(vl(c, "fix_"))}</small>` : ""}</td></tr>`).join("");
    const head2 = K(`점검표 · 정상 ${sum.ok || 0} · 주의 ${sum.warn || 0} · 조치 필요 ${sum.bad || 0}`, `Checklist · ok ${sum.ok || 0} · warning ${sum.warn || 0} · action needed ${sum.bad || 0}`, `Lista di controllo · ok ${sum.ok || 0} · attenzione ${sum.warn || 0} · intervento necessario ${sum.bad || 0}`, `Liste de contrôle · OK ${sum.ok || 0} · attention ${sum.warn || 0} · intervention nécessaire ${sum.bad || 0}`);
    return `<div class="kpis">${kp}</div><div class="grid2"><div class="box"><h3>${K("시간별 성장", "Hourly growth")}</h3><div class="ch" id="c-vit"></div></div>
      ${storage ? `<div class="box" style="grid-column:1/-1"><h3>${K("내장 SSD — 5분마다 측정", "Internal SSD — measured every 5 minutes")}
        <span style="float:right;font-size:13px;color:${({normal: C.teal, moving: C.amber, paused: C.coral})[storage.level]}">${({normal: K("정상", "normal"), moving: K("외장으로 옮기는 중", "moving to external"), paused: K("수집 일시정지 · 공간 확보 중", "collection paused · freeing space")})[storage.level]}
        · ${K("여유", "free")} ${(storage.free_bytes / 1073741824).toFixed(0)}GB · ${K("작업 데이터", "working set")} ${(storage.working_set_bytes / 1073741824).toFixed(0)}/${(storage.budget_bytes / 1073741824).toFixed(0)}GB</span></h3>
        <p class="hint">${K(`여유가 ${storage.thresholds_gb.move}GB 아래면 즉시 외장 이동, ${storage.thresholds_gb.pause}GB 아래면 수집 일시정지 후 ${storage.thresholds_gb.resume}GB 회복 시 자동 재개`, `Below ${storage.thresholds_gb.move} GB free: move to external now; below ${storage.thresholds_gb.pause} GB: pause collection, resume automatically at ${storage.thresholds_gb.resume} GB`, `Sotto ${storage.thresholds_gb.move} GB liberi: spostamento immediato sul disco esterno; sotto ${storage.thresholds_gb.pause} GB: raccolta in pausa, ripresa automatica a ${storage.thresholds_gb.resume} GB`, `Sous ${storage.thresholds_gb.move} Go libres : transfert immédiat vers le disque externe ; sous ${storage.thresholds_gb.pause} Go : collecte en pause, reprise automatique à ${storage.thresholds_gb.resume} Go`)}</p>
        <div class="ch small" id="c-ssd"></div></div>` : ""}
      <div class="box"><h3>${head2}</h3><table><tbody>${rows}</tbody></table><p class="hint" style="margin-top:8px">${K("기록 시각", "Recorded")} ${new Date(V.at * 1000).toLocaleString(LOC())}</p></div></div>`;
  },
  deep() {
    const all = ((stories || {}).stories || []), byKey = {}; all.forEach(s => byKey[s.key] = s);
    const list = all.filter(s => s.kind === "deepdive").slice(0, 16);
    if (!list.length) return `<p class="empty">${K("첫 후속 분석을 준비하고 있습니다.", "Preparing the first follow-ups.")}</p>`;
    return `<div class="stories">${list.map(s => { const p = byKey[s.parent]; const pt = p ? stext(p).title || "" : "";
      return storyCard(s).replace('<h4>', `<p class="hint" style="margin:8px 0 0">↳ ${esc(kind((s.facts || {}).parent_kind) || "")}${pt ? " · " + esc(pt) : ""}</p><h4>`); }).join("")}</div>`;
  },
  news() {
    const list = ((stories || {}).stories || []).filter(s => s.kind !== "deepdive").slice(0, 12);
    return list.length ? `<div class="stories">${list.map(storyCard).join("")}</div>` : `<p class="empty">${K("설명 에이전트가 첫 이야기를 준비하고 있습니다.", "The explainer is preparing its first stories.")}</p>`;
  },
  consensus() {
    const rows = (ins.consensus || []).slice(0, 24);
    return `<div class="box scroll"><table>${head([[tx("taxon")], [tx("disease")], [`${tx("dec")} ◀ ▶ ${tx("inc")}`], [tx("papersN"), 1], [tx("minerva")]])}<tbody>${pairRows(rows, ins.minerva_compared)}</tbody></table></div>${storiesOf(["consensus"], 9)}`;
  },
  debate() {
    return `<div class="box scroll"><table>${head([[tx("taxon")], [tx("disease")], [`${tx("dec")} ◀ ▶ ${tx("inc")}`], [tx("papersN"), 1]])}<tbody>${pairRows((ins.contradictions || []).slice(0, 20), false)}</tbody></table></div>${storiesOf(["debate", "hot_unsettled"], 8)}`;
  },
  signature() { return `<div class="box"><div class="ch tall" id="c-sig"></div></div>${storiesOf(["signature", "health_marker"], 6)}`; },
  trends() {
    const cats = ["Disease", "Method", "Intervention", "Metabolite", "Taxon"].filter(c => ins.trends[c]);
    return `<div class="multi">${cats.map(c => `<div class="box"><h3>${tx("cats")[c]}</h3><div class="ch small" id="c-tr-${c}"></div></div>`).join("")}</div>
      <div class="box" style="margin-top:14px"><h3>${tx("fading")}</h3><div class="ch small" id="c-fade"></div></div>${storiesOf(["rising", "fading", "method_shift"], 12)}`;
  },
  concepts() {
    const C0 = ins.concepts; if (!C0) return `<p class="empty">${K("다음 지식 그래프 빌드 때 첫 탐색 결과가 나옵니다.", "The first scan appears after the next graph build.")}</p>`;
    const CK = C0.counts || {}, W = C0.window || {}, D = C0.adopted_detail || {};
    const KT = {taxon: K("새 미생물 이름", "microbe name"), acronym: K("약어", "acronym"), phrase: K("용어", "term")};
    const cards = (C0.emerging || []).slice(0, 18).map(c => { const d = D[c.term];
      return `<div class="card"><b class="${c.kind === "taxon" ? "tx" : ""}">${esc(c.term)}</b>
        <div class="chips"><span class="chip">${KT[c.kind] || c.kind}</span><span class="chip" style="color:${C.lime}">×${c.growth}</span>
        <span class="chip">${fmt(c.recent_papers)} ${K("편 (최근 2년)", "papers (2 y)")}</span>
        <span class="chip" style="color:${c.status === "adopted" ? C.teal : C.amber}">${c.status === "adopted" ? (K("채택됨", "adopted")) : (K("후보", "candidate")) + " " + "●".repeat(Math.min(c.streak, 3)) + "○".repeat(Math.max(0, 3 - c.streak))}</span></div>
        ${d && d.with.length ? `<p class="hint" style="margin:6px 0 0">${K("함께 등장", "seen with")}: ${d.with.slice(0, 4).map(w => esc(ename(w))).join(", ")}</p>` : ""}
        ${level !== "eli10" && c.example.sentence ? `<p class="hint" style="margin:6px 0 0;font-style:italic">“${esc(c.example.sentence.slice(0, 220))}”</p>` : ""}</div>`; }).join("");
    return `<div class="kpis"><div class="kpi"><b>${fmt(CK.emerging)}</b><span>${K("지금 떠오르는 낯선 용어", "unfamiliar terms rising now")}</span></div>
      <div class="kpi"><b>${fmt(CK.candidates)}</b><span>${K("지켜보는 후보", "candidates being watched")}</span></div>
      <div class="kpi"><b>${fmt(CK.adopted)}</b><span>${K("어휘에 채택된 개념", "concepts adopted")}</span></div>
      <div class="kpi"><b>${fmt(W.papers_recent)} / ${fmt(W.papers_prior)}</b><span>${K(`비교 논문 ${(W.recent || []).join("–")} / ${(W.prior || []).join("–")}`, `papers compared ${(W.recent || []).join("–")} / ${(W.prior || []).join("–")}`, `articoli confrontati ${(W.recent || []).join("–")} / ${(W.prior || []).join("–")}`, `articles comparés ${(W.recent || []).join("–")} / ${(W.prior || []).join("–")}`)}</span></div></div>
      <div class="box"><h3>${K("비율 성장 (최근 2년 ÷ 3–6년 전)", "Share growth (last 2 y ÷ 3–6 y ago)")}</h3><div class="ch mid" id="c-concepts"></div></div>
      <div class="cards" style="margin-top:14px">${cards}</div>${storiesOf(["new_concept"], 8)}`;
  },
  map() { return `<div class="box"><div class="ch tall" id="c-map"></div></div>`; },
  gaps() {
    const cards = (ins.next || []).slice(0, 9).map((c, i) => { const s = c.signals;
      return `<div class="card"><span class="rk">${i + 1}</span><b>${esc(dname(c.disease, c.label))}</b>
        <div class="chips"><span class="chip" style="color:${s.growth >= 1.2 ? C.lime : s.growth < .9 ? C.coral : C.muted}">×${s.growth}</span>
        <span class="chip" style="color:${s.contradictions ? C.amber : C.muted}">${K("엇갈림", "conflicts")} ${s.contradictions}</span>
        <span class="chip">${K("한계 진술", "limitations")} ${s.gap_statements}</span></div></div>`; }).join("");
    return `<div class="cards">${cards}</div><div class="box" style="margin-top:14px"><div class="ch tall" id="c-gap"></div></div>${storiesOf(["next", "hot_unsettled"], 8)}`;
  },
  minerva() {
    const A = ins.minerva_agreement || {}, opp = (ins.consensus || []).filter(p => p.minerva_agrees === false);
    if (!ins.minerva_compared) return `<p class="empty">MINERVA —</p>`;
    return `<div class="kpis"><div class="kpi"><b>${fmt(A.minerva_pairs)}</b><span>${K("MINERVA 미생물→질병 관계", "MINERVA microbe→condition relations")}</span></div>
      <div class="kpi"><b>${A.compared ? Math.round(100 * A.agree / A.compared) + "%" : "—"}</b><span>${K(`합의 관계 중 같은 방향 (${A.agree}/${A.compared})`, `of agreed relations point the same way (${A.agree}/${A.compared})`, `delle relazioni concordi va nella stessa direzione (${A.agree}/${A.compared})`, `des relations consensuelles vont dans le même sens (${A.agree}/${A.compared})`)}</span></div>
      <div class="kpi"><b>${fmt((ins.novel || []).length)}</b><span>${K("MINERVA에 없는 연결", "links MINERVA lacks")}</span></div>
      <div class="kpi"><b>${fmt(opp.length)}</b><span>${K("방향이 반대", "opposite direction")}</span></div></div>
      <div class="grid2"><div class="box scroll"><h3>${kind("novel")}</h3><table>${head([[tx("taxon")], [tx("disease")], [`${tx("dec")} ◀ ▶ ${tx("inc")}`], [tx("papersN"), 1]])}<tbody>${pairRows((ins.novel || []).slice(0, 20), false)}</tbody></table></div>
      <div class="box scroll"><h3>${kind("opposite")}</h3><table>${head([[tx("taxon")], [tx("disease")], [`${tx("dec")} ◀ ▶ ${tx("inc")}`], [tx("papersN"), 1]])}<tbody>${pairRows(opp, false)}</tbody></table></div></div>
      ${storiesOf(["novel", "opposite"], 8)}`;
  },
  findings() {
    const H = snap.highlights || {}, seen = new Set(), items = [];
    Object.entries(H).forEach(([k, arr]) => arr.forEach(p => { if (!seen.has(p.pmid)) { seen.add(p.pmid); items.push({...p, theme: k}); } }));
    items.sort((a, b) => String(b.date).localeCompare(String(a.date)));
    return `<div class="finds">${items.slice(0, 12).map(p => { const sm = lang === "ko" || !p.summary ? null : sumHTML(p.summary, p.title);
      return `<div class="find"><div class="s">${sm ? sm.html : esc(lang === "ko" ? p.summary : p.title)}</div>
      ${lang === "ko" || (sm && !sm.titled && p.title) ? `<div class="t">${esc(p.title)}</div>` : ""}<div class="m"><span>${esc(dname(p.theme, null))} · ${esc(p.journal || "")} · ${esc(p.date)}</span>
      <a href="https://europepmc.org/article/MED/${esc(p.pmid)}" target="_blank" rel="noopener">${tx("source")} ↗</a></div></div>`; }).join("")}</div>`;
  },
  radar() { return `<div class="box"><div class="ch" id="c-radar"></div></div>`; },
  people() {
    const R = {}; (snap.researchers || []).concat(snap.researcher_extra || []).forEach(r => R[r.id] = r);
    const rk = snap.rankings || {}, M = ins.meta || {};
    const KEYS = [["papers", K("논문 수", "Papers"), "papers"], ["citations", K("피인용 합계", "Citations"), "citations_observed"],
                  ["h_index", K("코퍼스 내 h-지수", "In-corpus h-index"), "h_index"], ["recent", K("최근 1년 활발", "Most active last year"), "recent"]];
    const table = ([k, name, field]) => `<div class="box scroll"><h3>${name}</h3><table><tbody>${(rk[k] || []).slice(0, 15).map((id, i) => { const r = R[id]; if (!r) return "";
      return `<tr><td style="color:var(--dim);width:22px">${i + 1}</td><td><b>${esc(r.label)}</b><br><small style="color:var(--dim)">${esc(r.institution || "")}${r.country ? " · " + esc(r.country) : ""}</small></td><td class="n">${fmt(r[field])}</td></tr>`; }).join("")}</tbody></table></div>`;
    const kp = [[fmt(M.authors), K("연구자(이름 기준)", "Researchers (by name)")], [fmt(M.authors_10plus), K("논문 10편 이상", "With 10+ papers")],
      [M.top1_share != null ? Math.round(M.top1_share * 100) + "%" : "—", K("상위 1% 연구자가 쓴 저자권 비율", "Authorships held by the top 1%")],
      [M.gini != null ? M.gini : "—", K("저자권 집중도(지니)", "Concentration (Gini)")],
      [M.newcomer_share_recent != null ? Math.round(M.newcomer_share_recent * 100) + "%" : "—", K("최근 2년 활동자 중 새 얼굴", "Newcomers among recently active")],
      [M.team_size && M.team_size.length ? M.team_size[M.team_size.length - 1].mean_authors : "—", K("최근 논문당 평균 저자 수", "Mean authors per paper (latest year)")]];
    const rising = (M.rising_authors || []).map((a, i) => `<tr><td style="color:var(--dim)">${i + 1}</td><td><b>${esc(a.name)}</b></td><td class="n">${a.recent}</td><td class="n" style="color:var(--dim)">${a.earlier}</td></tr>`).join("");
    const experts = (M.experts || []).map(e => `<div class="card"><b>${esc(dname(e.disease, e.label))}</b>${e.people.map(p => `<div>${esc(p.name)} <span style="color:var(--dim)">· ${p.papers}</span></div>`).join("")}</div>`).join("");
    const journals = (M.journals || []).slice(0, 15).map((j, i) => `<tr><td style="color:var(--dim)">${i + 1}</td><td>${esc(j.journal)}</td><td class="n">${fmt(j.papers)}</td><td class="n" style="color:${j.growth >= 1.1 ? C.lime : j.growth < .9 ? C.coral : C.muted}">×${j.growth}</td></tr>`).join("");
    const cited = (M.top_cited || []).slice(0, 12).map(p => `<div class="find"><div class="s">${esc(p.title)}</div><div class="m"><span>${esc(p.journal || "")} · ${p.year}</span><span>${K("피인용", "cited")} ${fmt(p.citations)} · <a href="https://europepmc.org/article/MED/${esc(p.pmid)}" target="_blank" rel="noopener">${tx("source")} ↗</a></span></div></div>`).join("");
    const H = (lang === "ko" ? ["떠오르는 연구자 (최근 2년 논문 / 그 이전)", "질병별 대표 연구자", "공동 연구 별자리", "연구팀은 커지고 있나", "주요 학술지 (최근 비율 ÷ 3–5년 전)", "가장 많이 인용된 논문", "동명이인이 합산되었을 수 있습니다."]
                            : ["Rising researchers (papers in last 2 years / before)", "Leading researchers by condition", "Collaboration constellation", "Are teams getting larger?", "Leading journals (recent share ÷ 3–5 years ago)", "Most-cited papers", "Homonyms may be pooled."]).map(h => XL() ? xlate(h) : h);
    return `<div class="kpis">${kp.map(([v, l]) => `<div class="kpi"><b>${v}</b><span>${l}</span></div>`).join("")}</div>
      <div class="multi">${KEYS.map(table).join("")}</div>
      <div class="grid2" style="margin-top:14px"><div class="box scroll"><h3>${H[0]}</h3><p class="hint">${H[6]}</p><table><tbody>${rising}</tbody></table></div>
        <div class="box"><h3>${H[3]}</h3><div class="ch small" id="c-team"></div></div></div>
      <div class="box" style="margin-top:14px"><h3>${H[1]}</h3><div class="cards">${experts}</div></div>
      <div class="box" style="margin-top:14px"><h3>${H[2]}</h3><div class="ch tall" id="c-co"></div></div>
      <div class="grid2" style="margin-top:14px"><div class="box scroll"><h3>${H[4]}</h3><table><tbody>${journals}</tbody></table></div>
        <div class="box scroll"><h3>${H[5]}</h3><div class="finds" style="grid-template-columns:1fr">${cited}</div></div></div>`;
  },
  world() {
    const top = (snap.researchers || []).slice(0, 15), inst = (snap.institutions || []).slice(0, 10);
    return `<div class="box tilemap" id="c-world"></div>
      <div class="grid2" style="margin-top:14px"><div class="box scroll"><h3>${K("논문을 가장 많이 쓴 연구자", "Most prolific researchers")}</h3><table>${head([["#"], [K("연구자 · 소속", "Researcher · affiliation")], [tx("papersN"), 1]])}<tbody>
        ${top.map((r, i) => `<tr><td>${i + 1}</td><td><b>${esc(r.label)}</b><br><small style="color:var(--dim)">${esc(r.institution || "")}${r.country ? " · " + esc(r.country) : ""}</small></td><td class="n">${r.papers}</td></tr>`).join("")}</tbody></table></div>
      <div class="box scroll"><h3>${K("연구를 많이 하는 기관", "Most active institutions")}</h3><table>${head([["#"], [K("기관", "Institution")], [tx("papersN"), 1]])}<tbody>
        ${inst.map((r, i) => `<tr><td>${i + 1}</td><td>${esc(r.name || r.label)}<br><small style="color:var(--dim)">${esc(r.country || "")}</small></td><td class="n">${r.papers}</td></tr>`).join("")}</tbody></table></div></div>`;
  },
  engine() {
    const a = (live || {}).agents || [], bf = (live || {}).backfill;
    let grid = "";
    if (bf && bf.month_grid) { const m = bf.month_grid, ys = [...new Set(Object.keys(m).map(k => k.slice(0, 4)))].sort().reverse(), work = Object.keys(m).sort().reverse().find(k => !m[k]);
      grid = `<div class="box" style="margin-top:14px"><h3>${K("과거 논문 채우기", "Backfill")} · ${bf.months_done}/${bf.months_total}</h3><div class="mgrid">${ys.map(y => `<span>${y}</span>` + Array.from({length: 12}, (_, i) => { const k = y + "-" + String(i + 1).padStart(2, "0");
        return `<i class="${m[k] === true ? "done" : k === work ? "work" : ""}" data-tip="${k}"></i>`; }).join("")).join("")}</div></div>`; }
    return `<div class="agents">${a.map(x => `<div class="agent ${x.state}"><i></i><b>${esc(x.name)}</b><span>${esc(x.doing || "")}</span><em>${esc(x.metric || "")}</em></div>`).join("") || `<p class="empty">—</p>`}</div>${grid}`;
  },
};
const DRAW = {
  concepts() {
    const E = ((ins.concepts || {}).emerging || []).slice(0, 20).reverse();
    if (!E.length) return;
    chart("c-concepts", {grid: {left: 150, right: 40, top: 6, bottom: 24}, tooltip: {formatter: p => `${esc(E[p.dataIndex].term)}: ×${E[p.dataIndex].growth} · ${E[p.dataIndex].recent_papers} / ${E[p.dataIndex].prior_papers}`},
      xAxis: {type: "log", axisLabel: {color: C.muted}, splitLine: {lineStyle: {color: "#1b2648"}}},
      yAxis: {type: "category", data: E.map(e => e.term), axisLabel: {color: C.text, fontSize: 11}},
      series: [{type: "bar", data: E.map(e => ({value: e.growth, itemStyle: {color: e.status === "adopted" ? C.teal : C.amber, borderRadius: [0, 4, 4, 0]}})),
        label: {show: true, position: "right", color: C.muted, fontSize: 10, formatter: p => "×" + p.value}}]});
  },
  vitals() {
    if (storage && storage.recent) {
      const R = storage.recent, th = storage.thresholds_gb;
      chart("c-ssd", {grid: {left: 50, right: 20, top: 10, bottom: 26}, tooltip: {trigger: "axis"},
        xAxis: {type: "category", data: R.map(r => new Date(r.at * 1000).toLocaleTimeString(LOC(), {hour: "2-digit", minute: "2-digit"})), axisLabel: {color: C.dim}},
        yAxis: {type: "value", axisLabel: {color: C.dim, formatter: "{value}GB"}, splitLine: {lineStyle: {color: C.line}}},
        series: [{type: "line", name: K("여유 공간", "free"), data: R.map(r => r.free_gb), smooth: true, showSymbol: false, lineStyle: {width: 3, color: C.teal}, areaStyle: {opacity: .1, color: C.teal},
          markLine: {silent: true, symbol: "none", data: [{yAxis: th.move, lineStyle: {color: C.amber, type: "dashed"}}, {yAxis: th.pause, lineStyle: {color: C.coral, type: "dashed"}}], label: {color: C.muted}}},
          {type: "line", name: K("작업 데이터", "working set"), data: R.map(r => r.working_set_gb), smooth: true, showSymbol: false, lineStyle: {width: 2, color: C.violet}}]});
    }
    const H = (vitals.history || []).filter(h => h.papers_read != null);
    const t = H.map(h => new Date(h.at * 1000).toLocaleString(LOC(), {month: "numeric", day: "numeric", hour: "2-digit"}));
    const line = (name, key, color, axis) => ({type: "line", name, yAxisIndex: axis, data: H.map(h => h[key]), smooth: true, showSymbol: H.length < 30, lineStyle: {width: 3, color}, itemStyle: {color}, areaStyle: axis ? undefined : {opacity: .08, color}});
    chart("c-vit", {grid: {left: 64, right: 64, top: 34, bottom: 30}, tooltip: {trigger: "axis"}, legend: {top: 0, textStyle: {color: C.muted}},
      xAxis: {type: "category", data: t, axisLabel: {color: C.dim}},
      yAxis: [{type: "value", axisLabel: {color: C.dim}, splitLine: {lineStyle: {color: C.line}}}, {type: "value", axisLabel: {color: C.dim}, splitLine: {show: false}}],
      series: [line(K("읽은 논문", "Papers read"), "papers_read", C.sky, 0), line(K("미생물 관계", "Relations"), "relations", C.coral, 1),
               line(K("AI 재확인", "AI-checked"), "relations_ai_checked", C.violet, 1), line(K("이야기", "Stories"), "stories", C.lime, 1)]});
  },
  signature() {
    const E = (ins.network || {}).edges || [], dis = (ins.network.diseases || []).slice().sort((a, b) => b.w - a.w).slice(0, 20);
    const tw = {}; E.forEach(e => tw[e.s] = (tw[e.s] || 0) + e.w); const tt = Object.keys(tw).sort((a, b) => tw[b] - tw[a]).slice(0, 28);
    const data = []; E.forEach(e => { const x = dis.findIndex(q => q.id === e.t), y = tt.indexOf(e.s); if (x >= 0 && y >= 0) data.push([x, y, e.score, e.w]); });
    chart("c-sig", {grid: {left: 140, right: 12, top: 8, bottom: 110}, tooltip: {formatter: p => `${esc(tt[p.data[1]])} · ${esc(dname(dis[p.data[0]].id, dis[p.data[0]].label))}<br>${tx("evidence")} ${p.data[3]}`},
      xAxis: {type: "category", data: dis.map(d => dname(d.id, d.label)), axisLabel: {color: C.muted, rotate: 50, fontSize: 11}},
      yAxis: {type: "category", data: tt, inverse: true, axisLabel: {color: "#99f6e4", fontStyle: "italic", fontSize: 11}},
      visualMap: {min: -1, max: 1, show: false, dimension: 2, inRange: {color: [C.sky, "#1e293b", C.coral]}},
      series: [{type: "heatmap", data, label: {show: true, formatter: p => p.data[3], fontSize: 9, color: "#f1f5f9"}, itemStyle: {borderColor: "#04070f", borderWidth: 2, borderRadius: 4}}]});
  },
  trends() {
    const bar = (id, rows, color, cat) => chart(id, {grid: {left: 128, right: 44, top: 4, bottom: 16},
      tooltip: {formatter: p => `${esc(tname(cat, rows[p.dataIndex]))}<br>${(rows[p.dataIndex].share_recent * 100).toFixed(2)}% ← ${(rows[p.dataIndex].share_prior * 100).toFixed(2)}%`},
      xAxis: {type: "value", axisLabel: {color: C.dim, formatter: v => "×" + v}, splitLine: {lineStyle: {color: C.line}}},
      yAxis: {type: "category", inverse: true, data: rows.map(r => tname(cat, r)), axisLabel: {color: C.text, fontSize: 11, fontStyle: cat === "Taxon" ? "italic" : "normal"}},
      series: [{type: "bar", data: rows.map(r => r.growth), barMaxWidth: 14, itemStyle: {color, borderRadius: [0, 6, 6, 0]},
        label: {show: true, position: "right", color: C.muted, fontSize: 11, formatter: p => "×" + p.value.toFixed(1)}, animationDelay: i => i * 70}]});
    ["Disease", "Method", "Intervention", "Metabolite", "Taxon"].forEach(c => ins.trends[c] && bar("c-tr-" + c, ins.trends[c].rising.slice(0, 6), new echarts.graphic.LinearGradient(0, 0, 1, 0, [{offset: 0, color: "#14532d"}, {offset: 1, color: C.lime}]), c));
    const fade = ["Disease", "Method"].flatMap(c => (ins.trends[c] || {fading: []}).fading.slice(0, 4).map(r => ({...r, cat: c})));
    chart("c-fade", {grid: {left: 150, right: 44, top: 4, bottom: 16}, xAxis: {type: "value", max: 1, axisLabel: {color: C.dim, formatter: v => "×" + v}, splitLine: {lineStyle: {color: C.line}}},
      yAxis: {type: "category", inverse: true, data: fade.map(r => tname(r.cat, r)), axisLabel: {color: C.text, fontSize: 11}},
      series: [{type: "bar", data: fade.map(r => r.growth), barMaxWidth: 14, itemStyle: {color: C.sky, borderRadius: [0, 6, 6, 0]}, label: {show: true, position: "right", color: C.muted, formatter: p => "×" + p.value.toFixed(2)}}]});
  },
  map() {
    const N = ins.network || {taxa: [], diseases: [], edges: []};
    const maxT = Math.max(...N.taxa.map(t => t.w), 1), maxD = Math.max(...N.diseases.map(t => t.w), 1);
    chart("c-map", {tooltip: {formatter: p => p.dataType === "edge" ? `${esc(p.data.raw.s)} → ${esc(dname(p.data.raw.t))} · ${p.data.value}` : esc(p.data.name)},
      series: [{type: "graph", layout: "force", roam: true, draggable: true,
        data: N.diseases.map(x => ({id: "D:" + x.id, name: dname(x.id, x.label), symbolSize: 18 + 40 * Math.sqrt(x.w / maxD), itemStyle: {color: C.amber, shadowBlur: 16, shadowColor: "#fbbf2466"}, label: {show: true, color: "#fde68a", fontWeight: 700}}))
          .concat(N.taxa.map(x => ({id: "T:" + x.id, name: x.id, symbolSize: 7 + 24 * Math.sqrt(x.w / maxT), itemStyle: {color: C.teal}, label: {show: x.w > maxT * .2, color: "#99f6e4", fontStyle: "italic"}}))),
        links: N.edges.map(e => ({source: "T:" + e.s, target: "D:" + e.t, value: e.w, raw: e, lineStyle: {color: e.contested ? C.amber : e.score > 0 ? C.coral : C.sky, width: .6 + Math.sqrt(e.w) * .8, type: e.contested ? "dashed" : "solid", opacity: .5, curveness: .12}})),
        force: {repulsion: 240, edgeLength: [60, 180], gravity: .06}, emphasis: {focus: "adjacency"}}]});
  },
  gaps() {
    const G = ins.gaps, th = G.themes.filter(t => t.id !== "other"), M = G.matrix, lab = {};
    th.forEach(t => lab[t.id] = lang === "ko" ? t.label : nm(((ins.labels_en || {}).theme || {})[t.id] || t.label));
    const data = []; M.values.forEach((row, y) => row.forEach((v, x) => v && data.push([x, y, v])));
    chart("c-gap", {grid: {left: 150, right: 10, top: 8, bottom: 130}, tooltip: {formatter: p => `${esc(dname(M.diseases[p.data[1]].id, M.diseases[p.data[1]].label))} · ${esc(lab[M.themes[p.data[0]]])}: ${p.data[2]}`},
      xAxis: {type: "category", data: M.themes.map(t => lab[t] || t), axisLabel: {color: C.muted, rotate: 40, fontSize: 11}},
      yAxis: {type: "category", inverse: true, data: M.diseases.map(d => dname(d.id, d.label)), axisLabel: {color: C.text, fontSize: 11}},
      visualMap: {min: 0, max: Math.max(...data.map(x => x[2]), 1), show: false, inRange: {color: ["#0d1530", "#5b21b6", C.violet, "#f0abfc"]}},
      series: [{type: "heatmap", data, label: {show: true, color: "#f1f5f9", fontSize: 10}, itemStyle: {borderColor: "#04070f", borderWidth: 2, borderRadius: 4}}]});
  },
  people() {
    const M = ins.meta || {}, T = M.team_size || [];
    chart("c-team", {grid: {left: 44, right: 16, top: 10, bottom: 26}, tooltip: {trigger: "axis"}, xAxis: {type: "category", data: T.map(t => t.year), axisLabel: {color: C.dim}},
      yAxis: {type: "value", min: v => Math.floor(v.min - 1), axisLabel: {color: C.dim}, splitLine: {lineStyle: {color: C.line}}},
      series: [{type: "line", data: T.map(t => t.mean_authors), smooth: true, lineStyle: {width: 3, color: C.violet}, itemStyle: {color: C.violet}, areaStyle: {opacity: .1, color: C.violet}}]});
    const top = (snap.researchers || []).slice(0, 150), ids = new Set(top.map(r => r.id)), cnt = {};
    top.forEach(r => cnt[r.country || "—"] = (cnt[r.country || "—"] || 0) + 1);
    const cats = Object.entries(cnt).sort((a, b) => b[1] - a[1]).slice(0, 8).map(x => x[0]);
    chart("c-co", {tooltip: {formatter: p => p.dataType === "edge" ? `${p.data.value}` : `<b>${esc(p.data.name)}</b><br>${esc(p.data.raw.institution || "")}<br>${p.data.value} ${tx("papersN")}`},
      legend: {data: cats.concat(["…"]), textStyle: {color: C.muted}, type: "scroll", top: 0},
      series: [{type: "graph", layout: "force", roam: true, draggable: true, top: 30,
        categories: cats.concat(["…"]).map((n, i) => ({name: n, itemStyle: {color: PAL[i % PAL.length]}})),
        data: top.map(r => ({id: r.id, name: r.label, value: r.papers, raw: r, category: Math.max(0, cats.indexOf(r.country || "—")) === -1 ? cats.length : (cats.indexOf(r.country || "—") < 0 ? cats.length : cats.indexOf(r.country || "—")),
          symbolSize: 5 + Math.sqrt(r.papers) * 3.2, label: {show: r.papers >= 20, color: C.text, fontSize: 10}})),
        links: (snap.coauthor_edges || []).filter(e => ids.has(e.source) && ids.has(e.target)).map(e => ({source: e.source, target: e.target, value: e.weight, lineStyle: {width: .6 + e.weight * .4, opacity: .35}})),
        force: {repulsion: 70, gravity: .1, edgeLength: [20, 70]}, lineStyle: {color: "source", curveness: .2}, emphasis: {focus: "adjacency"}}]});
  },
  radar() {
    const all = snap.topics.concat(snap.diseases).filter(t => t.growth != null && t.papers >= 200).sort((a, b) => a.growth - b.growth);
    chart("c-radar", {grid: {left: 170, right: 50, top: 6, bottom: 20}, tooltip: {formatter: p => `${esc(lang === "ko" ? all[p.dataIndex].label : nm(TOPIC_EN[all[p.dataIndex].id] || all[p.dataIndex].label))}: ${(p.value * 100).toFixed(1)}%`},
      xAxis: {type: "value", axisLabel: {color: C.dim, formatter: v => (v * 100).toFixed(0) + "%"}, splitLine: {lineStyle: {color: C.line}}},
      yAxis: {type: "category", data: all.map(t => lang === "ko" ? t.label : nm(TOPIC_EN[t.id] || t.label)), axisLabel: {color: C.text, fontSize: 11}},
      series: [{type: "bar", data: all.map(t => ({value: t.growth, itemStyle: {color: t.growth > 0 ? C.lime : C.coral, borderRadius: t.growth > 0 ? [0, 6, 6, 0] : [6, 0, 0, 6]}})), barMaxWidth: 14}]});
  },
  world() {
    const TILES = {"Ireland":[9,1,"IE"],"United Kingdom":[10,1,"UK"],"Denmark":[11,1,"DK"],"Sweden":[12,0,"SE"],"Norway":[11,0,"NO"],"Finland":[13,0,"FI"],"Belgium":[9,2,"BE"],"Netherlands":[10,2,"NL"],"Germany":[11,2,"DE"],"Poland":[12,2,"PL"],"France":[9,3,"FR"],"Switzerland":[11,3,"CH"],"Austria":[11,4,"AT"],"Portugal":[8,4,"PT"],"Spain":[9,4,"ES"],"Italy":[10,4,"IT"],"Greece":[13,6,"GR"],"Turkey":[15,5,"TR"],"Israel":[14,7,"IL"],"Iran":[17,6,"IR"],"Egypt":[13,7,"EG"],"Saudi Arabia":[15,8,"SA"],"India":[19,8,"IN"],"Pakistan":[18,7,"PK"],"China":[21,5,"CN"],"South Korea":[23,5,"KR"],"Japan":[24,4,"JP"],"Taiwan":[23,6,"TW"],"Hong Kong":[22,6,"HK"],"Thailand":[21,8,"TH"],"Malaysia":[21,9,"MY"],"Singapore":[21,10,"SG"],"Australia":[23,12,"AU"],"New Zealand":[25,13,"NZ"],"South Africa":[12,12,"ZA"],"Nigeria":[10,9,"NG"],"Canada":[2,1,"CA"],"United States":[2,2,"US"],"Mexico":[2,3,"MX"],"Brazil":[4,5,"BR"],"Chile":[3,6,"CL"],"Argentina":[4,6,"AR"],"Colombia":[3,4,"CO"],"Russia":[15,1,"RU"],"Czechia":[12,3,"CZ"],"Hungary":[12,4,"HU"],"Romania":[13,4,"RO"]};
    const S = 30, OY = 20, by = {}; (snap.places || []).forEach(p => by[p.country] = p);
    const max = Math.max(...snap.places.map(p => p.papers)), maxL = Math.max(...snap.country_links.map(l => l.papers));
    const ctr = n => TILES[n] ? [TILES[n][0] * S + S / 2, TILES[n][1] * S + S / 2 + OY] : null;
    const shade = v => v ? `rgba(45,212,191,${.15 + .8 * Math.log1p(v) / Math.log1p(max)})` : "#111a35";
    const arcs = snap.country_links.slice(0, 30).map((l, i) => { const a = ctr(l.a), b = ctr(l.b); if (!a || !b) return "";
      const mx = (a[0] + b[0]) / 2, my = Math.min(a[1], b[1]) - Math.abs(a[0] - b[0]) * .3 - 12;
      return `<path class="arc" style="animation-delay:-${(i % 8) * .3}s" d="M${a[0]},${a[1]} Q${mx},${my} ${b[0]},${b[1]}" fill="none" stroke="${C.sky}" stroke-opacity=".55" stroke-width="${(.8 + 4 * l.papers / maxL).toFixed(1)}" data-tip="${l.a} ↔ ${l.b}: ${fmt(l.papers)}"/>`; }).join("");
    const tiles = Object.entries(TILES).map(([n, [x, y, c]]) => `<g data-tip="${n}: ${fmt(by[n] ? by[n].papers : 0)}"><rect x="${x * S + 1}" y="${y * S + 1 + OY}" width="${S - 2}" height="${S - 2}" rx="5" fill="${shade(by[n] ? by[n].papers : 0)}"/><text x="${x * S + S / 2}" y="${y * S + S / 2 + 4 + OY}" text-anchor="middle" font-size="10" fill="#d8e2ff">${c}</text></g>`).join("");
    $("c-world").innerHTML = `<svg viewBox="0 0 ${27 * S} ${14 * S + OY}">${tiles}${arcs}</svg>`;
  },
};

/* ------------------------------------------------------------------ page */
const LEVEL_NOTE = {
  eli10: ["<b>ELI10</b> · 10살도 이해할 수 있게: 어려운 말 없이 쉽게 설명합니다. 위의 ELI20·PRO를 누르면 같은 내용을 더 깊게 볼 수 있어요.", "<b>ELI10</b> · for a 10-year-old: plain words, no jargon. Tap ELI20 or PRO above to see the same thing in more depth."],
  eli20: ["<b>ELI20</b> · 대학생 수준: 무엇을 셌는지, 왜 중요한지, 무엇이 불확실한지. ELI10은 더 쉽게, PRO는 계산법과 기준값까지 보여 줍니다.", "<b>ELI20</b> · university level: what was counted, why it matters, what is uncertain. ELI10 is simpler; PRO adds formulas and thresholds."],
  pro: ["<b>PRO</b> · 연구자용: 정의·기준값·계산식·한계를 그대로. ELI10·ELI20으로 바꾸면 같은 결과를 쉬운 말로 볼 수 있습니다.", "<b>PRO</b> · for researchers: definitions, thresholds, formulas and caveats. Switch to ELI10/ELI20 for the same results in plain language."]};
function hero() {
  document.documentElement.lang = lang;
  $("levelnote").innerHTML = pick(LEVEL_NOTE[level]) +   // opens the reading-level help of the suite bar (suite.js)
    ` <button type="button" class="ms-help-link" data-ms-help aria-haspopup="dialog">${pick(["이 페이지 읽는 법", "How to read this page", "Come leggere questa pagina", "Comment lire cette page"])}</button>`;
  document.querySelectorAll("[data-t]").forEach(el => el.textContent = tx(el.dataset.t));
  const b = (ins || {}).build || {}, k = (ins || {}).counts || {}, bud = (live || {}).budget || {};
  const counters = [[b.papers_read, tx("papers")], [k.relations_total, tx("relations")], [k.relations_ai_checked, tx("checked")],
    [(stories || {}).count, tx("stories")], [k.authors, tx("authors")], [bud.cumulative_used_usd != null ? "$" + bud.cumulative_used_usd.toFixed(2) : null, tx("cost")]].slice(0, STATIC && STATIC.public ? 5 : 6);
  $("counters").innerHTML = counters.map(([v, l]) => `<div class="counter"><b>${typeof v === "number" ? fmt(v) : (v || "—")}</b><span>${l}</span></div>`).join("");
  $("brief").innerHTML = briefText() + alive();
  $("foot").textContent = tx("foot") + (ins ? ` · ${tx("updated")} ${ins.as_of}` : "") + (STATIC ? ` · ${K("버전", "release")} ${STATIC.release}` : "");
}
function alive() {
  const r = (live || {}).readings || {}, st = stories || {};
  const deep = (st.stories || []).filter(s => s.kind === "deepdive").length;
  const per = r.validated_last_hour;
  if (STATIC) return K(
    `<br><small style="color:var(--teal)">● ${esc(STATIC.as_of)} 기준 스냅샷 · 이야기 ${fmt(st.count)}개 · 스스로 더 파고든 분석 ${fmt(deep)}개 · 매달 새 버전으로 갱신됩니다.</small>`,
    `<br><small style="color:var(--teal)">● Snapshot of ${esc(STATIC.as_of)} · ${fmt(st.count)} stories · ${fmt(deep)} automatic follow-ups · refreshed with a new release every month.</small>`,
    `<br><small style="color:var(--teal)">● Istantanea del ${esc(STATIC.as_of)} · ${fmt(st.count)} storie · ${fmt(deep)} approfondimenti automatici · aggiornata ogni mese con una nuova versione.</small>`,
    `<br><small style="color:var(--teal)">● Instantané du ${esc(STATIC.as_of)} · ${fmt(st.count)} récits · ${fmt(deep)} approfondissements automatiques · mis à jour chaque mois avec une nouvelle version.</small>`);
  if (per == null && !st.count) return "";
  return K(
    `<br><small style="color:var(--teal)">● 지금도 채집 중 — 지난 1시간 ${fmt(per)}편 판독 · 이야기 ${fmt(st.count)}개 · 스스로 더 파고든 분석 ${fmt(deep)}개 · 3시간마다 지식 그래프와 이야기가 새로 자랍니다.</small>`,
    `<br><small style="color:var(--teal)">● Still harvesting — ${fmt(per)} papers read in the last hour · ${fmt(st.count)} stories · ${fmt(deep)} automatic follow-ups · the graph and stories grow every three hours.</small>`,
    `<br><small style="color:var(--teal)">● La raccolta continua — ${fmt(per)} articoli letti nell'ultima ora · ${fmt(st.count)} storie · ${fmt(deep)} approfondimenti automatici · il grafo e le storie crescono ogni tre ore.</small>`,
    `<br><small style="color:var(--teal)">● La collecte continue — ${fmt(per)} articles lus au cours de la dernière heure · ${fmt(st.count)} récits · ${fmt(deep)} approfondissements automatiques · le graphe et les récits grandissent toutes les trois heures.</small>`);
}
function briefText() {
  if (!ins) return "";
  const r = (ins.trends.Disease || {}).rising || [], m = (ins.trends.Method || {}).rising || [], c = (ins.consensus || [])[0], n = (ins.next || [])[0];
  const P = (ins.build || {}).papers_read;
  if (lang === "ko") {
    if (level === "eli10") return `AI가 마이크로바이옴 논문 <b>${fmt(P)}편</b>을 읽었어요. 요즘은 <em>${esc(r[0] ? r[0].name : "")}</em> 연구가 빨리 늘고 있고, ${c ? `<b>${esc(c.taxon)}</b>라는 세균은 <b>${esc(c.disease_label)}</b>에서 자주 ${c.score > 0 ? "많아진대요" : "줄어든대요"}.` : ""} ${n ? `다음엔 <u>${esc(n.label)}</u>을 더 연구하면 좋겠어요.` : ""}`;
    if (level === "pro") return `초록 ${fmt(P)}편 기계 판독. 최대 성장: 질병 <em>${esc(r[0] ? r[0].name : "")} ×${r[0] ? r[0].growth.toFixed(1) : ""}</em>, 방법 <em>${esc(m[0] ? m[0].name : "")} ×${m[0] ? m[0].growth.toFixed(1) : ""}</em>. 최다 합의: <b>${c ? esc(c.taxon) + " " + (c.score > 0 ? "↑" : "↓") + " " + esc(c.disease_label) : ""}</b> (${c ? c.inc + "/" + c.dec : ""}). MINERVA 방향 일치 ${ins.minerva_agreement ? ins.minerva_agreement.agree + "/" + ins.minerva_agreement.compared : "—"}. 우선 연구: <u>${esc(n ? n.label : "")}</u>.`;
    return `AI가 지금까지 논문 <b>${fmt(P)}편</b>을 읽었습니다. 가장 빠르게 관심이 늘어난 질병은 <em>${esc(r[0] ? r[0].name : "")} ×${r[0] ? r[0].growth.toFixed(1) : ""}</em>, 연구 방법은 <em>${esc(m[0] ? m[0].name : "")} ×${m[0] ? m[0].growth.toFixed(1) : ""}</em>입니다. 가장 일관된 관계는 <b>${c ? esc(c.taxon) + " " + (c.score > 0 ? "▲" : "▼") + " " + esc(c.disease_label) : ""}</b>이고, 다음 연구가 가장 필요한 곳은 <u>${esc(n ? n.label : "")}</u>입니다.`;
  }
  const rn = r[0] ? tname("Disease", r[0]) : "", mn = m[0] ? tname("Method", m[0]) : "", cd = c ? dname(c.disease, c.disease_label) : "", nn = n ? dname(n.disease, n.label) : "";
  if (lang === "it") {
    if (level === "eli10") return `Un'IA ha letto <b>${fmt(P)} articoli sul microbioma</b>. Ultimamente gli scienziati studiano molto di più <em>${esc(rn)}</em>, ${c ? `e un batterio che si chiama <b>${esc(c.taxon)}</b> continua a comparire ${c.score > 0 ? "più spesso" : "meno spesso"} nelle persone con <b>${esc(cd)}</b>.` : ""} ${n ? `Il prossimo passo: serve più ricerca su <u>${esc(nn)}</u>.` : ""}`;
    if (level === "pro") return `${fmt(P)} abstract letti automaticamente. Crescita più rapida: patologia <em>${esc(rn)} ×${r[0] ? r[0].growth.toFixed(1) : ""}</em>, metodo <em>${esc(mn)} ×${m[0] ? m[0].growth.toFixed(1) : ""}</em>. Concordanza più forte: <b>${c ? esc(c.taxon) + " " + (c.score > 0 ? "↑" : "↓") + " " + esc(cd) : ""}</b> (${c ? c.inc + "/" + c.dec : ""}). Concordanza di direzione con MINERVA ${ins.minerva_agreement ? ins.minerva_agreement.agree + "/" + ins.minerva_agreement.compared : "—"}. Priorità: <u>${esc(nn)}</u>.`;
    return `Finora l'IA ha letto <b>${fmt(P)} articoli</b>. L'interesse è cresciuto più rapidamente per <em>${esc(rn)} ×${r[0] ? r[0].growth.toFixed(1) : ""}</em> tra le patologie e per <em>${esc(mn)} ×${m[0] ? m[0].growth.toFixed(1) : ""}</em> tra i metodi. La relazione più coerente è <b>${c ? esc(c.taxon) + " " + (c.score > 0 ? "▲" : "▼") + " " + esc(cd) : ""}</b>, e l'ambito che ha più bisogno di nuovi studi è <u>${esc(nn)}</u>.`;
  }
  if (lang === "fr") {
    if (level === "eli10") return `Une IA a lu <b>${fmt(P)} articles sur le microbiome</b>. Ces derniers temps, les scientifiques étudient beaucoup plus <em>${esc(rn)}</em>, ${c ? `et un microbe qui s'appelle <b>${esc(c.taxon)}</b> apparaît ${c.score > 0 ? "plus souvent" : "moins souvent"} chez les personnes touchées par <b>${esc(cd)}</b>.` : ""} ${n ? `Prochaine étape : il faut plus de recherche sur <u>${esc(nn)}</u>.` : ""}`;
    if (level === "pro") return `${fmt(P)} résumés lus automatiquement. Croissance la plus rapide : pathologie <em>${esc(rn)} ×${r[0] ? r[0].growth.toFixed(1) : ""}</em>, méthode <em>${esc(mn)} ×${m[0] ? m[0].growth.toFixed(1) : ""}</em>. Accord le plus fort : <b>${c ? esc(c.taxon) + " " + (c.score > 0 ? "↑" : "↓") + " " + esc(cd) : ""}</b> (${c ? c.inc + "/" + c.dec : ""}). Concordance de direction avec MINERVA ${ins.minerva_agreement ? ins.minerva_agreement.agree + "/" + ins.minerva_agreement.compared : "—"}. Priorité : <u>${esc(nn)}</u>.`;
    return `Jusqu'ici, l'IA a lu <b>${fmt(P)} articles</b>. L'intérêt a le plus vite augmenté pour <em>${esc(rn)} ×${r[0] ? r[0].growth.toFixed(1) : ""}</em> parmi les pathologies et pour <em>${esc(mn)} ×${m[0] ? m[0].growth.toFixed(1) : ""}</em> parmi les méthodes. La relation la plus constante est <b>${c ? esc(c.taxon) + " " + (c.score > 0 ? "▲" : "▼") + " " + esc(cd) : ""}</b>, et le domaine qui a le plus besoin de nouvelles études est <u>${esc(nn)}</u>.`;
  }
  if (level === "eli10") return `An AI has read <b>${fmt(P)} microbiome papers</b>. Scientists are studying <em>${esc(rn)}</em> much more lately, ${c ? `and a germ called <b>${esc(c.taxon)}</b> keeps showing up ${c.score > 0 ? "more" : "less"} in <b>${esc(cd)}</b>.` : ""} ${n ? `Next, <u>${esc(nn)}</u> needs more research.` : ""}`;
  if (level === "pro") return `${fmt(P)} abstracts machine-read. Fastest growth: condition <em>${esc(rn)} ×${r[0] ? r[0].growth.toFixed(1) : ""}</em>, method <em>${esc(mn)} ×${m[0] ? m[0].growth.toFixed(1) : ""}</em>. Strongest agreement: <b>${c ? esc(c.taxon) + " " + (c.score > 0 ? "↑" : "↓") + " " + esc(cd) : ""}</b> (${c ? c.inc + "/" + c.dec : ""}). MINERVA direction agreement ${ins.minerva_agreement ? ins.minerva_agreement.agree + "/" + ins.minerva_agreement.compared : "—"}. Priority: <u>${esc(nn)}</u>.`;
  return `The AI has read <b>${fmt(P)} papers</b> so far. Interest grew fastest in <em>${esc(rn)} ×${r[0] ? r[0].growth.toFixed(1) : ""}</em> among conditions and <em>${esc(mn)} ×${m[0] ? m[0].growth.toFixed(1) : ""}</em> among methods. The most consistent relation is <b>${c ? esc(c.taxon) + " " + (c.score > 0 ? "▲" : "▼") + " " + esc(cd) : ""}</b>, and the place most in need of new studies is <u>${esc(nn)}</u>.`;
}
const needs = {people: () => snap && ins, vitals: () => vitals, news: () => stories, deep: () => stories, findings: () => snap, radar: () => snap, world: () => snap, engine: () => true};
const rendered = new Set();
function renderSection(id) {
  const el = $("s-" + id); if (!el) return;
  const ready = needs[id] ? needs[id]() : ins;
  const MOD = {concepts: "insights", consensus: "insights", debate: "insights", signature: "insights", trends: "insights", map: "insights", gaps: "insights", minerva: "minerva",
               findings: "findings", radar: "radar", people: "people", world: "world", engine: "agents", vitals: "agents"};
  const jump = `<a class="jump" href="${MOD[id] ? ROUTE.module + "?m=" + MOD[id] : ROUTE.cockpit}">${tx("cockpit_link")}</a>`;
  el.innerHTML = jump + `<p class="num">${String(ORDER.indexOf(id) + 1).padStart(2, "0")}</p><h2>${esc(pick(S[id].t))}</h2><p class="lead">${esc(lead(id))}</p>` +
    (ready ? R[id]() : `<p class="empty">…</p>`);
  if (ready && DRAW[id]) DRAW[id]();
  rendered.add(id);
}
function build() {
  $("sections").innerHTML = ORDER.map(id => `<section class="sec" id="s-${id}"></section>`).join("");
  $("toc").innerHTML = ORDER.map(id => `<a href="#s-${id}" data-id="${id}">${esc(pick(S[id].t))}</a>`).join("");
  const io = new IntersectionObserver(es => es.forEach(e => { if (!e.isIntersecting) return; const id = e.target.id.slice(2);
    e.target.classList.add("in"); if (!rendered.has(id)) renderSection(id);
    document.querySelectorAll("#toc a").forEach(a => a.classList.toggle("on", a.dataset.id === id)); }), {rootMargin: "200px 0px -40% 0px"});
  ORDER.forEach(id => io.observe($("s-" + id)));
}
function rerender() {
  hero(); strip();
  $("toc").innerHTML = ORDER.map(id => `<a href="#s-${id}" data-id="${id}">${esc(pick(S[id].t))}</a>`).join("");
  [...rendered].forEach(renderSection);
}
function toggles() {
  const set = () => { document.querySelectorAll("#sw-lang button").forEach(b => b.classList.toggle("on", b.dataset.v === lang));
    document.querySelectorAll("#sw-level button").forEach(b => b.classList.toggle("on", b.dataset.v === level)); };
  $("sw-lang").onclick = e => { const b = e.target.closest("button"); if (!b) return; lang = b.dataset.v; store.set("msage.lang", lang); set(); rerender(); };
  $("sw-level").onclick = e => { const b = e.target.closest("button"); if (!b) return; level = b.dataset.v; store.set("msage.level", level); set(); rerender(); };
  set();
}
window.addEventListener("scroll", () => { const h = document.documentElement; $("prog").style.width = (100 * h.scrollTop / Math.max(1, h.scrollHeight - h.clientHeight)) + "%"; }, {passive: true});
document.addEventListener("mousemove", e => { const t = e.target.closest && e.target.closest("[data-tip]"), tip = $("tip");
  if (!t) { tip.style.display = "none"; return; } tip.textContent = t.dataset.tip; tip.style.display = "block"; tip.style.left = (e.clientX + 12) + "px"; tip.style.top = (e.clientY + 12) + "px"; });

const SOURCES = {
  live: ["/api/site/msage/live", "MSAGE_LIVE", 60, ["engine"]],
  storage: ["/api/site/msage/storage", "MSAGE_STORAGE", 300, ["vitals"]],
  vitals: ["/api/site/msage/vitals", "MSAGE_VITALS", 300, ["vitals"]],
  stories: ["/api/site/msage/stories", "MSAGE_STORIES", 600, ["news", "deep", "consensus", "debate", "signature", "trends", "gaps", "minerva", "concepts"]],
  ins: ["/api/site/msage/insights", "MSAGE_INSIGHTS", 600, ["consensus", "debate", "signature", "trends", "map", "gaps", "minerva", "people", "concepts"]],
  snap: ["/api/site/msage", "MSAGE_DATA", 1800, ["findings", "radar", "people", "world"]]};
const seen = {};
const setData = {live: d => live = d, storage: d => storage = d, vitals: d => vitals = d, stories: d => stories = d, ins: d => ins = d, snap: d => snap = d};
function pull(name) {
  const [url, preset] = SOURCES[name];
  return get(url, window[preset]).then(d => {
    const sig = d && (d.sha256 || d.at || d.generated_at) ? String(d.sha256 || d.at || d.generated_at) : JSON.stringify(d).length;
    if (seen[name] === sig) return [];                      // unchanged (served as 304 by the server): no redraw
    seen[name] = sig; setData[name](d); return SOURCES[name][3];
  }).catch(() => []);
}
function redraw(ids) {
  hero(); strip();
  const vis = new Set([...document.querySelectorAll(".sec.in")].map(el => el.id.slice(2)));
  [...new Set(ids)].forEach(id => { if (vis.has(id)) renderSection(id); });
}
function strip() {
  const r = (live || {}).readings || {}, st = storage || {};
  const parts = [];
  if (STATIC) { $("livestrip").innerHTML = (K("스냅샷 ", "snapshot ")) + "<b>" + esc(STATIC.as_of) + "</b>"; return; }
  if (r.validated_last_hour != null) parts.push((K("지난 1시간 판독 ", "read last hour ")) + "<b>" + fmt(r.validated_last_hour) + "</b>");
  if (st.free_bytes) parts.push("SSD <b>" + (st.free_bytes / 1073741824).toFixed(0) + "GB</b>");
  if (live && live.supervisor) parts.push(live.supervisor.state === "running" ? (K("● 가동 중", "● running")) : esc(live.supervisor.state));
  $("livestrip").innerHTML = parts.join(" · ");
}
function load() {
  return Promise.all(Object.keys(SOURCES).map(pull)).then(lists => redraw(lists.flat()));
}
function start() {
  toggles(); build(); hero(); load();
  if (!window.MSAGE_DATA) Object.keys(SOURCES).forEach(n => setInterval(() => pull(n).then(ids => ids.length && redraw(ids)), SOURCES[n][2] * 1000));
}
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();
/* ---- Italian words (English text -> Italian), used by K/V/nm when lang is "it"; generated, keep keys identical to the English (and to FR_WORDS) ---- */
function IT_WORDS() { return {
  "Cockpit": "Cruscotto",
  "One-page story": "Storia in una pagina",
  "Insight lab": "Laboratorio di analisi",
  "Live in the cockpit ↗": "In tempo reale nel cruscotto ↗",
  "M-SAGE · human microbiome research knowledge engine": "M-SAGE · motore di conoscenza sulla ricerca sul microbioma umano",
  "Microbiome research read by AI, on one scroll": "La ricerca sul microbioma letta dall'IA, in un unico rotolo",
  "Keep scrolling — everything appears in order ↓": "Continua a scorrere: tutto compare in ordine ↓",
  "Papers read by AI": "Articoli letti dall'IA",
  "Microbe relation sentences": "Frasi su relazioni microbiche",
  "Passed AI re-check": "Superato il ricontrollo dell'IA",
  "Stories by the explainer": "Storie dell'agente esplicativo",
  "AI cost (total)": "Costo dell'IA (totale)",
  "Researchers": "Ricercatori",
  "AI-written": "Scritto dall'IA",
  "Template · AI story coming": "Modello · storia dell'IA in arrivo",
  "New": "Nuovo",
  "more": "più",
  "less": "meno",
  "no difference": "nessuna differenza",
  "papers": "articoli",
  "evidence": "evidenze",
  "Microbe": "Microbo",
  "Condition": "Patologia",
  "MINERVA": "MINERVA",
  "same direction": "stessa direzione",
  "opposite": "opposta",
  "absent (new link)": "assente (nuovo legame)",
  "condition not in MINERVA": "patologia assente in MINERVA",
  "Rising": "In crescita",
  "Fading": "In calo",
  "Everything here is provisional: machine-extracted by AI from abstracts and their evidence sentences. It shows things reported together, not cause and effect, and is not yet expert-validated.": "Tutto ciò che vedi qui è provvisorio: estratto automaticamente dall'IA dagli abstract e dalle loro frasi di evidenza. Mostra cose riportate insieme, non cause ed effetti, e non è ancora validato da esperti.",
  "live": "in tempo reale",
  "as of": "aggiornato al",
  "paper": "articolo",
  "Conditions": "Patologie",
  "Methods": "Metodi",
  "Interventions": "Interventi",
  "Metabolites": "Metaboliti",
  "Microbes": "Microbi",
  "Body sites": "Sedi corporee",
  "Agreement": "Consenso",
  "Debate": "Dibattito",
  "Shared signal": "Segnale condiviso",
  "New vs MINERVA": "Novità rispetto a MINERVA",
  "Opposite to MINERVA": "Opposto a MINERVA",
  "Next study": "Prossimo studio",
  "Hot but unsettled": "Caldo ma irrisolto",
  "Health-marker candidate": "Candidato marcatore di salute",
  "Tool shift": "Cambio di strumenti",
  "Automatic follow-up": "Approfondimento automatico",
  "New concept": "Nuovo concetto",
  "Newly found stories": "Storie appena scoperte",
  "Every time our explaining robot spots an interesting shape in the pile of papers, it pins a new story here.": "Ogni volta che il nostro robot spiegatore nota una forma interessante nella montagna di articoli, appende qui una nuova storia.",
  "Every three hours the explainer agent scans the knowledge graph for new or materially changed patterns and writes a story for each. Newest changes come first.": "Ogni tre ore l'agente esplicativo esamina il grafo della conoscenza alla ricerca di schemi nuovi o cambiati in modo sostanziale e scrive una storia per ciascuno. I cambiamenti più recenti vengono per primi.",
  "Eleven detectors (agreement, debate, trends, signatures, MINERVA comparison, next study, composite patterns) emit fact packs; the synthesis model narrates them and any number absent from the pack is rejected. Stories are rewritten only when the 2-significant-figure fingerprint changes.": "Undici rilevatori (consenso, dibattito, tendenze, firme, confronto con MINERVA, prossimo studio, schemi compositi) producono pacchetti di fatti; il modello di sintesi li racconta e ogni numero assente dal pacchetto viene rifiutato. Le storie vengono riscritte solo quando cambia l'impronta a 2 cifre significative.",
  "Growth log · what it needs to keep running": "Diario di crescita · cosa serve per continuare a funzionare",
  "Every hour we write down how much the knowledge map grew. A red light in the checklist means a person needs to help.": "Ogni ora annotiamo quanto è cresciuta la mappa della conoscenza. Una luce rossa nella lista di controllo vuol dire che serve l'aiuto di una persona.",
  "Every hour we record papers read, relations, AI checks, graph nodes, Neo4j and stories, and show the growth over the last hour and day. The checklist covers sleep settings, the external drive, disk space, budget runway, price snapshot, AI access and whether each job is alive.": "Ogni ora registriamo articoli letti, relazioni, verifiche dell'IA, nodi del grafo, Neo4j e storie, e mostriamo la crescita nell'ultima ora e nell'ultimo giorno. La lista di controllo copre impostazioni di sospensione, disco esterno, spazio su disco, autonomia del budget, listino prezzi, accesso all'IA e se ogni processo è attivo.",
  "vitals.py runs hourly from system-watch: samples the ledger (read-only), build.json, insights and explainer state into history.jsonl (≤ 90 days) and evaluates pmset, disks and receipt ages. The graph rebuilds hourly and Neo4j is reloaded with a count check.": "vitals.py gira ogni ora da system-watch: campiona il registro (sola lettura), build.json, gli insight e lo stato dell'agente esplicativo in history.jsonl (≤ 90 giorni) e valuta pmset, dischi ed età delle ricevute. Il grafo si ricostruisce ogni ora e Neo4j viene ricaricato con un controllo dei conteggi.",
  "Where the AI dug deeper on its own": "Dove l'IA ha scavato più a fondo da sola",
  "When the AI finds something new, it asks 'why?' and keeps digging. If papers disagree, it sorts them by how they were done to find the reason.": "Quando l'IA trova qualcosa di nuovo, si chiede \"perché?\" e continua a scavare. Se gli articoli non sono d'accordo, li divide in base a come sono stati fatti per trovare il motivo.",
  "Every new or materially changed pattern triggers an automatic follow-up. Conflicts are split by method, body site, period and taxonomic level to find where the direction flips; new relations get an emergence timeline; rising topics get their co-rising entities and leaders.": "Ogni schema nuovo o cambiato in modo sostanziale avvia un approfondimento automatico. I contrasti vengono suddivisi per metodo, sede corporea, periodo e livello tassonomico per trovare dove la direzione si inverte; le nuove relazioni ricevono una cronologia di emergenza; i temi in crescita, le entità che crescono con loro e chi li guida.",
  "investigator.py: deterministic SQL over graph.sqlite → fact pack → synthesis-model narrative under the same number check. Analyses: conflict_split (sign flip of lean between feature groups, |Δlean| ≥ 0.6, ≥ 3 votes per group), emergence, co_rising (co-mention lift, last 2 y vs 3–5 y ago), signature_detail, method_adoption; once per fingerprint, ≤ 20 per run.": "investigator.py: SQL deterministico su graph.sqlite → pacchetto di fatti → narrazione del modello di sintesi con lo stesso controllo dei numeri. Analisi: conflict_split (inversione di segno della tendenza tra gruppi di caratteristiche, |Δlean| ≥ 0.6, ≥ 3 voti per gruppo), emergence, co_rising (lift delle co-menzioni, ultimi 2 anni vs 3–5 anni fa), signature_detail, method_adoption; una volta per impronta, ≤ 20 per esecuzione.",
  "What many papers agree on": "Su cosa concordano molti articoli",
  "These are germs that many papers say go up or down in people with a certain illness.": "Sono batteri che, secondo molti articoli, aumentano o diminuiscono nelle persone con una certa malattia.",
  "Microbe–condition pairs where at least 60% of reporting sentences point the same way. More agreement means more confidence, but it is co-occurrence, not cause.": "Coppie microbo–patologia in cui almeno il 60% delle frasi riportate va nella stessa direzione. Più accordo vuol dire più fiducia, ma è co-occorrenza, non causa.",
  "ASSOCIATED edges (disease vs control, sentence-level, one vote per paper per direction) with |score| ≥ 0.6 and ≥ 5 directional votes, after AI re-judgement and group-phrase grounding; MINERVA direction agreement shown.": "Archi ASSOCIATED (malattia vs controllo, a livello di frase, un voto per articolo per direzione) con |punteggio| ≥ 0.6 e ≥ 5 voti direzionali, dopo la rivalutazione dell'IA e l'ancoraggio delle frasi di gruppo; indicata la concordanza di direzione con MINERVA.",
  "Where papers disagree": "Dove gli articoli non sono d'accordo",
  "Some papers say 'more', others say 'less' — nobody knows the answer yet.": "Alcuni articoli dicono \"di più\", altri \"di meno\": nessuno conosce ancora la risposta.",
  "Pairs with mixed 'more' and 'less' reports. Differences in cohorts, body sites or methods may explain it — exactly where new studies are needed.": "Coppie con resoconti misti di \"più\" e \"meno\". Differenze di coorti, sedi corporee o metodi possono spiegarlo: è proprio dove servono nuovi studi.",
  "Minority-direction share ≥ 0.3 with ≥ 6 directional votes. Taxonomic level (species vs genus), sample site, sequencing (16S vs shotgun) and confounding are typical sources.": "Quota della direzione minoritaria ≥ 0.3 con ≥ 6 voti direzionali. Livello tassonomico (specie vs genere), sede del campione, sequenziamento (16S vs shotgun) e fattori confondenti sono le cause tipiche.",
  "Microbes that show up across many conditions": "Microbi che compaiono in molte patologie",
  "Some germs drop in lots of different illnesses — maybe a sign of a healthy gut.": "Alcuni batteri calano in tante malattie diverse: forse sono un segno di un intestino sano.",
  "Microbes with a consistent direction in ≥ 3 conditions: consistently lower suggests a health-marker candidate, higher a disease-marker candidate. Red = more, blue = less.": "Microbi con direzione coerente in ≥ 3 patologie: costantemente più bassi suggeriscono un candidato marcatore di salute, più alti un candidato marcatore di malattia. Rosso = di più, blu = di meno.",
  "Genus-level aggregation, per-pair |score| ≥ 0.5 with ≥ 3 votes. Low disease specificity may reflect shared responses (inflammation, antibiotic exposure).": "Aggregazione a livello di genere, |punteggio| per coppia ≥ 0.5 con ≥ 3 voti. Una bassa specificità di malattia può riflettere risposte condivise (infiammazione, esposizione ad antibiotici).",
  "Rising and fading topics": "Temi in crescita e in calo",
  "What scientists are studying more — and less — these days. Longer bars mean faster-growing interest.": "Cosa gli scienziati studiano di più, e di meno, in questo periodo. Barre più lunghe vogliono dire interesse che cresce più in fretta.",
  "Share of recent (last 2 years) papers versus 3–5 years ago. We compare shares, not counts, because yearly collection sizes differ.": "Quota degli articoli recenti (ultimi 2 anni) rispetto a 3–5 anni fa. Confrontiamo quote, non conteggi, perché la quantità raccolta ogni anno varia.",
  "Growth = (share in last 2 years + 1e-4)/(share 3–5 years ago + 1e-4); recent share ≥ 0.2%, ≥ 25 papers. Absolute volumes are not interpreted because of monthly collection caps.": "Crescita = (quota negli ultimi 2 anni + 1e-4)/(quota 3–5 anni fa + 1e-4); quota recente ≥ 0.2%, ≥ 25 articoli. I volumi assoluti non vengono interpretati a causa dei tetti mensili di raccolta.",
  "New-concept radar": "Radar dei nuovi concetti",
  "We look for words scientists have just started using. If a word we don't know keeps showing up, we add it to our dictionary after seeing it three times in a row.": "Cerchiamo le parole che gli scienziati hanno appena cominciato a usare. Se una parola che non conosciamo continua a comparire, dopo averla vista tre volte di fila la aggiungiamo al nostro dizionario.",
  "The concept scout scans every graph build for terms our vocabulary lacks (new microbe names, acronyms, technical compounds) and compares their share in the last 2 years with 3–6 years ago. Three builds in a row and the term is adopted: it becomes a Concept node and the explainer writes about it.": "L'esploratore di concetti esamina ogni costruzione del grafo alla ricerca di termini assenti dal nostro vocabolario (nuovi nomi di microbi, acronimi, composti tecnici) e confronta la loro quota negli ultimi 2 anni con quella di 3–6 anni fa. Dopo tre costruzioni di fila il termine viene adottato: diventa un nodo Concept e l'agente esplicativo ne scrive.",
  "Document frequency. Recent window ≥ 12 papers, share growth ≥ 4× ((prior df+0.5)/N smoothing), not in the existing vocabulary (taxa, conditions, interventions, metabolites, methods, sites), statistics and formatting terms excluded. Score = ln(growth)·√recent df (×1.5 if first seen within 5 years). 3 consecutive builds → adopted (Concept node + MENTIONS); candidates dropped after 6 misses. Collection is recency-skewed, so shares are compared, not counts.": "Frequenza nei documenti. Finestra recente ≥ 12 articoli, crescita della quota ≥ 4× (smoothing (df precedente+0.5)/N), assente dal vocabolario esistente (taxa, patologie, interventi, metaboliti, metodi, sedi), esclusi i termini statistici e di formattazione. Punteggio = ln(crescita)·√df recente (×1.5 se visto per la prima volta negli ultimi 5 anni). 3 costruzioni consecutive → adottato (nodo Concept + MENTIONS); i candidati vengono scartati dopo 6 assenze. La raccolta è sbilanciata verso gli anni recenti, quindi si confrontano quote, non conteggi.",
  "The knowledge map": "La mappa della conoscenza",
  "Orange circles are illnesses, green circles are germs. A line means papers talk about them together.": "I cerchi arancioni sono malattie, quelli verdi sono batteri. Una linea vuol dire che gli articoli ne parlano insieme.",
  "Network of microbe–condition relations from evidence sentences. Red = more in the condition, blue = less, dashed amber = conflicting. Drag or zoom.": "Rete delle relazioni microbo–patologia tratte dalle frasi di evidenza. Rosso = di più nella patologia, blu = di meno, tratteggio ambra = in contrasto. Trascina o ingrandisci.",
  "Top 70 genera and linked conditions, edges with ≥ 4 votes; width ∝ √votes. The same graph is queryable in the local Neo4j (Taxon, Disease, ASSOCIATED) with Cypher.": "Primi 70 generi e patologie collegate, archi con ≥ 4 voti; spessore ∝ √voti. Lo stesso grafo si può interrogare con Cypher nel Neo4j locale (Taxon, Disease, ASSOCIATED).",
  "Research gaps and what to study next": "Lacune della ricerca e cosa studiare dopo",
  "We collected the 'we still don't know this' notes scientists wrote, and ranked where to look next.": "Abbiamo raccolto le note \"questo ancora non lo sappiamo\" scritte dagli scienziati e abbiamo messo in classifica dove guardare dopo.",
  "Authors' own limitation and gap statements grouped by theme; interest growth, conflicting results and limitations are combined into a priority list — a pointer, not a verdict.": "Le dichiarazioni di limite e di lacuna degli autori sono raggruppate per tema; crescita dell'interesse, risultati in contrasto e limiti sono combinati in una lista di priorità: un'indicazione, non un verdetto.",
  "Score = 2·ln(growth) + 1.5·ln(1+contested pairs) + 0.8·ln(1+limitation statements) + ln(1+not in MINERVA) − 0.3·ln(1+papers). Themes from 11 lexical classes.": "Punteggio = 2·ln(crescita) + 1.5·ln(1+coppie contese) + 0.8·ln(1+dichiarazioni di limite) + ln(1+assenti in MINERVA) − 0.3·ln(1+articoli). Temi da 11 classi lessicali.",
  "Compared with MINERVA": "Il confronto con MINERVA",
  "We compared our results with the lab's big knowledge map, MINERVA. Mostly they agree, and a few links are brand new.": "Abbiamo confrontato i nostri risultati con la grande mappa della conoscenza del laboratorio, MINERVA. Per lo più sono d'accordo, e alcuni legami sono del tutto nuovi.",
  "MINERVA's four graphs were copied once in full. We check whether our agreed relations point the same way and which links MINERVA does not yet have. We do not connect to MINERVA day to day.": "I quattro grafi di MINERVA sono stati copiati una volta per intero. Verifichiamo se le nostre relazioni di consenso vanno nella stessa direzione e quali legami MINERVA non ha ancora. Non ci colleghiamo a MINERVA giorno per giorno.",
  "MINERVA main Microbe→Disease relations (POSITIVE, STRENGTH_POSITIVE*, NEGATIVE, STRENGTH_NEGATIVE) mapped to our classes by regex; 'absent' means no genus/species relation for the mapped condition and may reflect naming differences.": "Relazioni Microbe→Disease del grafo principale di MINERVA (POSITIVE, STRENGTH_POSITIVE*, NEGATIVE, STRENGTH_NEGATIVE) associate alle nostre classi tramite espressioni regolari; \"assente\" significa nessuna relazione di genere/specie per la patologia associata e può riflettere differenze di denominazione.",
  "Latest findings": "Ultime scoperte",
  "The most important sentence from papers the AI just read.": "La frase più importante degli articoli che l'IA ha appena letto.",
  "Recent results the AI extracted from abstracts and checked against the source sentence. Follow the link to verify.": "Risultati recenti che l'IA ha estratto dagli abstract e verificato sulla frase della fonte. Segui il link per controllare.",
  "Abstract-only reading (abstract-grounded-7) with quote-span grounding; any number in a summary must appear in the cited span. Full text not checked.": "Lettura dei soli abstract (abstract-grounded-7) con ancoraggio al passo citato; ogni numero in un riassunto deve comparire nel passo citato. Testo integrale non verificato.",
  "Where attention is moving": "Dove si sposta l'attenzione",
  "Topics studied a lot more lately are on the right; less, on the left.": "I temi studiati molto di più ultimamente sono a destra; quelli studiati di meno, a sinistra.",
  "Change in share of papers over the last three months, by topic and condition.": "Variazione della quota di articoli negli ultimi tre mesi, per tema e patologia.",
  "Three-month window share change from title/abstract lexical mentions (≥ 200 papers); a different window from the 2-year graph trends.": "Variazione della quota in una finestra di tre mesi, dalle menzioni lessicali in titolo/abstract (≥ 200 articoli); una finestra diversa dalle tendenze a 2 anni del grafo.",
  "Researcher rankings and a meta-analysis of the field": "Classifiche dei ricercatori e una meta-analisi del settore",
  "Who writes the most papers, whose papers are read most, who is new and rising, and who the experts are for each illness.": "Chi scrive più articoli, quali articoli sono più letti, chi è nuovo e in ascesa, e chi sono gli esperti per ogni malattia.",
  "Four rankings (papers, citations, in-corpus h-index, last-year activity) plus an analysis of the field itself: team size over time, how concentrated authorship is, newcomer share, leading journals and their growth, most-cited papers, and leading researchers per condition.": "Quattro classifiche (articoli, citazioni, indice h nel corpus, attività dell'ultimo anno) più un'analisi del settore stesso: dimensione dei gruppi nel tempo, quanto è concentrata la paternità degli articoli, quota di nuovi autori, riviste principali e la loro crescita, articoli più citati e ricercatori di riferimento per ogni patologia.",
  "Author identity: same-name merge without ORCID (homonyms may be pooled, especially short East-Asian names). Citations are Europe PMC counts at capture; h-index computed within this corpus. Concentration: Gini of authorships per author and top-1%/10% shares. Newcomer share = authors active in the last 2 years whose first corpus paper is in that window (inflated by recency-weighted collection).": "Identità degli autori: nomi uguali uniti in assenza di ORCID (gli omonimi possono essere sommati, soprattutto i nomi brevi dell'Asia orientale). Le citazioni sono i conteggi di Europe PMC al momento della raccolta; indice h calcolato all'interno di questo corpus. Concentrazione: Gini delle firme per autore e quote dell'1%/10% superiore. Quota di nuovi autori = autori attivi negli ultimi 2 anni il cui primo articolo nel corpus cade in quella finestra (gonfiata dalla raccolta sbilanciata verso gli anni recenti).",
  "Who studies this, and where": "Chi studia questi temi, e dove",
  "Which countries write the most papers, and who works with whom.": "Quali Paesi scrivono più articoli, e chi lavora con chi.",
  "Papers by authors' countries, cross-country collaboration, and the most prolific researchers and institutions.": "Articoli per Paese degli autori, collaborazioni tra Paesi, e i ricercatori e le istituzioni più prolifici.",
  "Affiliation strings (not resolved to institution IDs); same-name merge without ORCID; citations are Europe PMC counts at capture.": "Stringhe di affiliazione (non ricondotte a identificativi istituzionali); nomi uguali uniti in assenza di ORCID; le citazioni sono i conteggi di Europe PMC al momento della raccolta.",
  "The engine right now": "Il motore in questo momento",
  "The programs that keep collecting and reading papers. Green means working well.": "I programmi che continuano a raccogliere e leggere articoli. Verde vuol dire che funzionano bene.",
  "What collection, AI reading, the knowledge graph, Neo4j, the MINERVA copy and the explainer are doing, plus backfill progress.": "Cosa stanno facendo raccolta, lettura dell'IA, grafo della conoscenza, Neo4j, copia di MINERVA e agente esplicativo, più l'avanzamento del recupero degli articoli passati.",
  "The launchd supervisor re-admits services only after the full regression (237 gates) passes on code change; cost from Bedrock ledger reservations within user-approved limits.": "Il supervisore launchd riammette i servizi solo dopo che, a ogni modifica del codice, passa l'intera regressione (237 controlli); costo dalle prenotazioni del registro Bedrock entro i limiti approvati dall'utente.",
  "Papers read": "Articoli letti",
  "Relations": "Relazioni",
  "AI-checked": "Verificate dall'IA",
  "Graph nodes": "Nodi del grafo",
  "Stories": "Storie",
  "Follow-ups": "Approfondimenti",
  "Hourly growth": "Crescita oraria",
  "Internal SSD — measured every 5 minutes": "SSD interno — misurato ogni 5 minuti",
  "normal": "normale",
  "moving to external": "spostamento sul disco esterno",
  "collection paused · freeing space": "raccolta in pausa · liberazione dello spazio",
  "free": "libero",
  "working set": "dati di lavoro",
  "Recorded": "Registrato",
  "Preparing the first follow-ups.": "Preparazione dei primi approfondimenti.",
  "The explainer is preparing its first stories.": "L'agente esplicativo sta preparando le sue prime storie.",
  "The first scan appears after the next graph build.": "La prima scansione compare dopo la prossima costruzione del grafo.",
  "microbe name": "nome di microbo",
  "acronym": "acronimo",
  "term": "termine",
  "papers (2 y)": "articoli (2 anni)",
  "adopted": "adottato",
  "candidate": "candidato",
  "seen with": "visto con",
  "unfamiliar terms rising now": "termini sconosciuti in crescita ora",
  "candidates being watched": "candidati sotto osservazione",
  "concepts adopted": "concetti adottati",
  "Share growth (last 2 y ÷ 3–6 y ago)": "Crescita della quota (ultimi 2 anni ÷ 3–6 anni fa)",
  "conflicts": "contrasti",
  "limitations": "limiti",
  "MINERVA microbe→condition relations": "Relazioni microbo→patologia di MINERVA",
  "links MINERVA lacks": "legami che mancano a MINERVA",
  "opposite direction": "direzione opposta",
  "Papers": "Articoli",
  "Citations": "Citazioni",
  "In-corpus h-index": "Indice h nel corpus",
  "Most active last year": "Più attivi nell'ultimo anno",
  "Researchers (by name)": "Ricercatori (per nome)",
  "With 10+ papers": "Con 10+ articoli",
  "Authorships held by the top 1%": "Firme detenute dall'1% superiore",
  "Concentration (Gini)": "Concentrazione (Gini)",
  "Newcomers among recently active": "Nuovi autori tra gli attivi di recente",
  "Mean authors per paper (latest year)": "Media di autori per articolo (ultimo anno)",
  "cited": "citato",
  "Most prolific researchers": "Ricercatori più prolifici",
  "Researcher · affiliation": "Ricercatore · affiliazione",
  "Most active institutions": "Istituzioni più attive",
  "Institution": "Istituzione",
  "Backfill": "Recupero arretrati",
  "<b>ELI10</b> · for a 10-year-old: plain words, no jargon. Tap ELI20 or PRO above to see the same thing in more depth.": "<b>ELI10</b> · per un bambino di 10 anni: parole semplici, niente paroloni. Tocca ELI20 o PRO qui sopra per vedere la stessa cosa più in profondità.",
  "<b>ELI20</b> · university level: what was counted, why it matters, what is uncertain. ELI10 is simpler; PRO adds formulas and thresholds.": "<b>ELI20</b> · livello universitario: che cosa è stato contato, perché conta, che cosa è incerto. ELI10 è più semplice; PRO aggiunge formule e soglie.",
  "<b>PRO</b> · for researchers: definitions, thresholds, formulas and caveats. Switch to ELI10/ELI20 for the same results in plain language.": "<b>PRO</b> · per ricercatori: definizioni, soglie, formule e limiti. Passa a ELI10/ELI20 per vedere gli stessi risultati in parole semplici.",
  "release": "versione",
  "snapshot ": "istantanea ",
  "read last hour ": "letti nell'ultima ora ",
  "● running": "● in funzione",
  "Immunity & inflammation": "Immunità e infiammazione",
  "Microbial metabolism": "Metabolismo microbico",
  "Diversity & dysbiosis": "Diversità e disbiosi",
  "Antibiotics & resistance": "Antibiotici e resistenza",
  "Oral": "Cavo orale",
  "Barrier & permeability": "Barriera e permeabilità",
  "Probiotics": "Probiotici",
  "Short-chain fatty acids": "Acidi grassi a catena corta",
  "Skin": "Pelle",
  "Prebiotics & fibre": "Prebiotici e fibre",
  "Bile acids": "Acidi biliari",
  "Microbiota transplant": "Trapianto di microbiota",
  "Cancer": "Cancro",
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
  "Rising researchers (papers in last 2 years / before)": "Ricercatori emergenti (articoli negli ultimi 2 anni / prima)",
  "Leading researchers by condition": "Ricercatori di riferimento per patologia",
  "Collaboration constellation": "Costellazione delle collaborazioni",
  "Are teams getting larger?": "I gruppi di ricerca stanno diventando più grandi?",
  "Leading journals (recent share ÷ 3–5 years ago)": "Riviste principali (quota recente ÷ 3–5 anni fa)",
  "Most-cited papers": "Articoli più citati",
  "Homonyms may be pooled.": "Gli omonimi potrebbero essere sommati.",
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
  "Gut": "Intestino",
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
  "Cockpit": "Tableau de bord",
  "One-page story": "Récit en une page",
  "Insight lab": "Laboratoire d'analyse",
  "Live in the cockpit ↗": "En direct dans le tableau de bord ↗",
  "M-SAGE · human microbiome research knowledge engine": "M-SAGE · moteur de connaissances sur la recherche sur le microbiome humain",
  "Microbiome research read by AI, on one scroll": "La recherche sur le microbiome lue par l'IA, sur un seul défilement",
  "Keep scrolling — everything appears in order ↓": "Continuez à faire défiler — tout apparaît dans l'ordre ↓",
  "Papers read by AI": "Articles lus par l'IA",
  "Microbe relation sentences": "Phrases de relations microbiennes",
  "Passed AI re-check": "Validées par la seconde vérification de l'IA",
  "Stories by the explainer": "Récits de l'agent explicateur",
  "AI cost (total)": "Coût de l'IA (total)",
  "Researchers": "Chercheurs",
  "AI-written": "Rédigé par l'IA",
  "Template · AI story coming": "Modèle · récit de l'IA à venir",
  "New": "Nouveau",
  "more": "plus",
  "less": "moins",
  "no difference": "aucune différence",
  "papers": "articles",
  "evidence": "preuves",
  "Microbe": "Microbe",
  "Condition": "Pathologie",
  "MINERVA": "MINERVA",
  "same direction": "même sens",
  "opposite": "opposé",
  "absent (new link)": "absent (nouveau lien)",
  "condition not in MINERVA": "pathologie absente de MINERVA",
  "Rising": "En hausse",
  "Fading": "En baisse",
  "Everything here is provisional: machine-extracted by AI from abstracts and their evidence sentences. It shows things reported together, not cause and effect, and is not yet expert-validated.": "Tout ce qui figure ici est provisoire : extrait automatiquement par l'IA à partir des résumés et de leurs phrases de preuve. Cela montre des choses rapportées ensemble, pas des causes et des effets, et ce n'est pas encore validé par des experts.",
  "live": "en direct",
  "as of": "au",
  "paper": "article",
  "Conditions": "Pathologies",
  "Methods": "Méthodes",
  "Interventions": "Interventions",
  "Metabolites": "Métabolites",
  "Microbes": "Microbes",
  "Body sites": "Sites corporels",
  "Agreement": "Accord",
  "Debate": "Débat",
  "Shared signal": "Signal partagé",
  "New vs MINERVA": "Nouveau par rapport à MINERVA",
  "Opposite to MINERVA": "Opposé à MINERVA",
  "Next study": "Prochaine étude",
  "Hot but unsettled": "En vogue mais non tranché",
  "Health-marker candidate": "Candidat marqueur de santé",
  "Tool shift": "Changement d'outils",
  "Automatic follow-up": "Approfondissement automatique",
  "New concept": "Nouveau concept",
  "Newly found stories": "Récits nouvellement découverts",
  "Every time our explaining robot spots an interesting shape in the pile of papers, it pins a new story here.": "Chaque fois que notre robot explicateur repère une forme intéressante dans la pile d'articles, il épingle ici un nouveau récit.",
  "Every three hours the explainer agent scans the knowledge graph for new or materially changed patterns and writes a story for each. Newest changes come first.": "Toutes les trois heures, l'agent explicateur parcourt le graphe de connaissances à la recherche de motifs nouveaux ou sensiblement modifiés et rédige un récit pour chacun. Les changements les plus récents viennent en premier.",
  "Eleven detectors (agreement, debate, trends, signatures, MINERVA comparison, next study, composite patterns) emit fact packs; the synthesis model narrates them and any number absent from the pack is rejected. Stories are rewritten only when the 2-significant-figure fingerprint changes.": "Onze détecteurs (accord, débat, tendances, signatures, comparaison avec MINERVA, prochaine étude, motifs composites) produisent des paquets de faits ; le modèle de synthèse les met en récit et tout nombre absent du paquet est rejeté. Les récits ne sont réécrits que si l'empreinte à 2 chiffres significatifs change.",
  "Growth log · what it needs to keep running": "Journal de croissance · ce qu'il faut pour que ça continue à tourner",
  "Every hour we write down how much the knowledge map grew. A red light in the checklist means a person needs to help.": "Toutes les heures, on note de combien la carte des connaissances a grandi. Un voyant rouge dans la liste veut dire qu'une personne doit venir aider.",
  "Every hour we record papers read, relations, AI checks, graph nodes, Neo4j and stories, and show the growth over the last hour and day. The checklist covers sleep settings, the external drive, disk space, budget runway, price snapshot, AI access and whether each job is alive.": "Toutes les heures, nous enregistrons les articles lus, les relations, les vérifications de l'IA, les nœuds du graphe, Neo4j et les récits, et montrons la croissance sur la dernière heure et le dernier jour. La liste de contrôle couvre les réglages de veille, le disque externe, l'espace disque, l'autonomie du budget, l'instantané de prix, l'accès à l'IA et l'état de chaque tâche.",
  "vitals.py runs hourly from system-watch: samples the ledger (read-only), build.json, insights and explainer state into history.jsonl (≤ 90 days) and evaluates pmset, disks and receipt ages. The graph rebuilds hourly and Neo4j is reloaded with a count check.": "vitals.py s'exécute toutes les heures depuis system-watch : échantillonne le registre (lecture seule), build.json, insights et l'état de l'explicateur dans history.jsonl (≤ 90 jours) et évalue pmset, les disques et l'âge des reçus. Le graphe est reconstruit toutes les heures et Neo4j est rechargé avec un contrôle des effectifs.",
  "Where the AI dug deeper on its own": "Là où l'IA a creusé plus loin d'elle-même",
  "When the AI finds something new, it asks 'why?' and keeps digging. If papers disagree, it sorts them by how they were done to find the reason.": "Quand l'IA trouve quelque chose de nouveau, elle se demande « pourquoi ? » et continue de creuser. Si les articles ne sont pas d'accord, elle les trie selon la façon dont ils ont été faits pour trouver la raison.",
  "Every new or materially changed pattern triggers an automatic follow-up. Conflicts are split by method, body site, period and taxonomic level to find where the direction flips; new relations get an emergence timeline; rising topics get their co-rising entities and leaders.": "Chaque motif nouveau ou sensiblement modifié déclenche un approfondissement automatique. Les conflits sont décomposés par méthode, site corporel, période et niveau taxonomique pour trouver où le sens s'inverse ; les nouvelles relations reçoivent une chronologie d'apparition ; les thèmes en hausse reçoivent leurs entités co-montantes et leurs chefs de file.",
  "investigator.py: deterministic SQL over graph.sqlite → fact pack → synthesis-model narrative under the same number check. Analyses: conflict_split (sign flip of lean between feature groups, |Δlean| ≥ 0.6, ≥ 3 votes per group), emergence, co_rising (co-mention lift, last 2 y vs 3–5 y ago), signature_detail, method_adoption; once per fingerprint, ≤ 20 per run.": "investigator.py : SQL déterministe sur graph.sqlite → paquet de faits → récit du modèle de synthèse sous le même contrôle des nombres. Analyses : conflict_split (inversion de signe de la tendance entre groupes de caractéristiques, |Δtendance| ≥ 0,6, ≥ 3 votes par groupe), emergence, co_rising (lift de co-mention, 2 dernières années vs il y a 3–5 ans), signature_detail, method_adoption ; une fois par empreinte, ≤ 20 par exécution.",
  "What many papers agree on": "Ce sur quoi beaucoup d'articles s'accordent",
  "These are germs that many papers say go up or down in people with a certain illness.": "Ce sont des microbes dont beaucoup d'articles disent qu'ils augmentent ou diminuent chez les personnes atteintes d'une certaine maladie.",
  "Microbe–condition pairs where at least 60% of reporting sentences point the same way. More agreement means more confidence, but it is co-occurrence, not cause.": "Paires microbe–pathologie où au moins 60 % des phrases rapportées vont dans le même sens. Plus d'accord veut dire plus de confiance, mais il s'agit de co-occurrence, pas de cause.",
  "ASSOCIATED edges (disease vs control, sentence-level, one vote per paper per direction) with |score| ≥ 0.6 and ≥ 5 directional votes, after AI re-judgement and group-phrase grounding; MINERVA direction agreement shown.": "Arêtes ASSOCIATED (maladie vs témoins, au niveau de la phrase, un vote par article et par sens) avec |score| ≥ 0,6 et ≥ 5 votes directionnels, après nouveau jugement par l'IA et ancrage des expressions de groupe ; concordance de direction avec MINERVA affichée.",
  "Where papers disagree": "Là où les articles divergent",
  "Some papers say 'more', others say 'less' — nobody knows the answer yet.": "Certains articles disent « plus », d'autres « moins » — personne ne connaît encore la réponse.",
  "Pairs with mixed 'more' and 'less' reports. Differences in cohorts, body sites or methods may explain it — exactly where new studies are needed.": "Paires avec des comptes rendus mélangés « plus » et « moins ». Des différences de cohortes, de sites corporels ou de méthodes peuvent l'expliquer — c'est précisément là qu'il faut de nouvelles études.",
  "Minority-direction share ≥ 0.3 with ≥ 6 directional votes. Taxonomic level (species vs genus), sample site, sequencing (16S vs shotgun) and confounding are typical sources.": "Part du sens minoritaire ≥ 0,3 avec ≥ 6 votes directionnels. Le niveau taxonomique (espèce vs genre), le site de prélèvement, le séquençage (16S vs shotgun) et les facteurs de confusion en sont les sources typiques.",
  "Microbes that show up across many conditions": "Des microbes présents dans de nombreuses pathologies",
  "Some germs drop in lots of different illnesses — maybe a sign of a healthy gut.": "Certains microbes baissent dans plein de maladies différentes — peut-être le signe d'un intestin en bonne santé.",
  "Microbes with a consistent direction in ≥ 3 conditions: consistently lower suggests a health-marker candidate, higher a disease-marker candidate. Red = more, blue = less.": "Microbes de sens constant dans ≥ 3 pathologies : constamment plus bas évoque un candidat marqueur de santé, plus élevé un candidat marqueur de maladie. Rouge = plus, bleu = moins.",
  "Genus-level aggregation, per-pair |score| ≥ 0.5 with ≥ 3 votes. Low disease specificity may reflect shared responses (inflammation, antibiotic exposure).": "Agrégation au niveau du genre, |score| par paire ≥ 0,5 avec ≥ 3 votes. Une faible spécificité pour la maladie peut refléter des réponses communes (inflammation, exposition aux antibiotiques).",
  "Rising and fading topics": "Thèmes en hausse et en baisse",
  "What scientists are studying more — and less — these days. Longer bars mean faster-growing interest.": "Ce que les scientifiques étudient plus — et moins — en ce moment. Plus la barre est longue, plus l'intérêt grandit vite.",
  "Share of recent (last 2 years) papers versus 3–5 years ago. We compare shares, not counts, because yearly collection sizes differ.": "Part des articles récents (2 dernières années) par rapport à il y a 3 à 5 ans. Nous comparons des parts, pas des effectifs, car la taille de la collecte annuelle varie.",
  "Growth = (share in last 2 years + 1e-4)/(share 3–5 years ago + 1e-4); recent share ≥ 0.2%, ≥ 25 papers. Absolute volumes are not interpreted because of monthly collection caps.": "Croissance = (part des 2 dernières années + 1e-4)/(part d'il y a 3–5 ans + 1e-4) ; part récente ≥ 0,2 %, ≥ 25 articles. Les volumes absolus ne sont pas interprétés en raison des plafonds de collecte mensuels.",
  "New-concept radar": "Radar des nouveaux concepts",
  "We look for words scientists have just started using. If a word we don't know keeps showing up, we add it to our dictionary after seeing it three times in a row.": "On cherche les mots que les scientifiques viennent de commencer à utiliser. Si un mot qu'on ne connaît pas revient sans cesse, on l'ajoute à notre dictionnaire après l'avoir vu trois fois de suite.",
  "The concept scout scans every graph build for terms our vocabulary lacks (new microbe names, acronyms, technical compounds) and compares their share in the last 2 years with 3–6 years ago. Three builds in a row and the term is adopted: it becomes a Concept node and the explainer writes about it.": "L'éclaireur de concepts examine chaque construction du graphe à la recherche de termes absents de notre vocabulaire (nouveaux noms de microbes, acronymes, composés techniques) et compare leur part des 2 dernières années à celle d'il y a 3 à 6 ans. Après trois constructions consécutives, le terme est adopté : il devient un nœud Concept et l'explicateur en parle.",
  "Document frequency. Recent window ≥ 12 papers, share growth ≥ 4× ((prior df+0.5)/N smoothing), not in the existing vocabulary (taxa, conditions, interventions, metabolites, methods, sites), statistics and formatting terms excluded. Score = ln(growth)·√recent df (×1.5 if first seen within 5 years). 3 consecutive builds → adopted (Concept node + MENTIONS); candidates dropped after 6 misses. Collection is recency-skewed, so shares are compared, not counts.": "Fréquence documentaire. Fenêtre récente ≥ 12 articles, croissance de la part ≥ 4× (lissage (df antérieure+0,5)/N), absent du vocabulaire existant (taxons, pathologies, interventions, métabolites, méthodes, sites), termes statistiques et de mise en forme exclus. Score = ln(croissance)·√df récente (×1,5 si vu pour la première fois il y a moins de 5 ans). 3 constructions consécutives → adopté (nœud Concept + MENTIONS) ; candidats abandonnés après 6 absences. La collecte étant biaisée vers les années récentes, on compare des parts, pas des effectifs.",
  "The knowledge map": "La carte des connaissances",
  "Orange circles are illnesses, green circles are germs. A line means papers talk about them together.": "Les cercles orange sont des maladies, les cercles verts des microbes. Un trait veut dire que des articles parlent des deux ensemble.",
  "Network of microbe–condition relations from evidence sentences. Red = more in the condition, blue = less, dashed amber = conflicting. Drag or zoom.": "Réseau des relations microbe–pathologie issues des phrases de preuve. Rouge = plus dans la pathologie, bleu = moins, pointillés ambre = contradictoire. Faites glisser ou zoomez.",
  "Top 70 genera and linked conditions, edges with ≥ 4 votes; width ∝ √votes. The same graph is queryable in the local Neo4j (Taxon, Disease, ASSOCIATED) with Cypher.": "70 premiers genres et pathologies liées, arêtes avec ≥ 4 votes ; épaisseur ∝ √votes. Le même graphe est interrogeable en Cypher dans le Neo4j local (Taxon, Disease, ASSOCIATED).",
  "Research gaps and what to study next": "Lacunes de la recherche et prochaines études",
  "We collected the 'we still don't know this' notes scientists wrote, and ranked where to look next.": "Nous avons rassemblé les notes « on ne sait pas encore ça » écrites par les scientifiques, et classé les endroits où chercher ensuite.",
  "Authors' own limitation and gap statements grouped by theme; interest growth, conflicting results and limitations are combined into a priority list — a pointer, not a verdict.": "Les énoncés de limites et de lacunes des auteurs eux-mêmes, regroupés par thème ; croissance de l'intérêt, résultats contradictoires et limites sont combinés en une liste de priorités — une piste, pas un verdict.",
  "Score = 2·ln(growth) + 1.5·ln(1+contested pairs) + 0.8·ln(1+limitation statements) + ln(1+not in MINERVA) − 0.3·ln(1+papers). Themes from 11 lexical classes.": "Score = 2·ln(croissance) + 1,5·ln(1+paires contestées) + 0,8·ln(1+énoncés de limites) + ln(1+absent de MINERVA) − 0,3·ln(1+articles). Thèmes issus de 11 classes lexicales.",
  "Compared with MINERVA": "Comparaison avec MINERVA",
  "We compared our results with the lab's big knowledge map, MINERVA. Mostly they agree, and a few links are brand new.": "Nous avons comparé nos résultats avec la grande carte des connaissances du laboratoire, MINERVA. La plupart du temps, ils sont d'accord, et quelques liens sont tout nouveaux.",
  "MINERVA's four graphs were copied once in full. We check whether our agreed relations point the same way and which links MINERVA does not yet have. We do not connect to MINERVA day to day.": "Les quatre graphes de MINERVA ont été copiés une fois en entier. Nous vérifions si nos relations de consensus vont dans le même sens et quels liens MINERVA n'a pas encore. Nous ne nous connectons pas à MINERVA au quotidien.",
  "MINERVA main Microbe→Disease relations (POSITIVE, STRENGTH_POSITIVE*, NEGATIVE, STRENGTH_NEGATIVE) mapped to our classes by regex; 'absent' means no genus/species relation for the mapped condition and may reflect naming differences.": "Relations Microbe→Maladie principales de MINERVA (POSITIVE, STRENGTH_POSITIVE*, NEGATIVE, STRENGTH_NEGATIVE) rattachées à nos classes par expressions régulières ; « absent » signifie aucune relation de genre/espèce pour la pathologie rattachée et peut refléter des différences de nom.",
  "Latest findings": "Derniers résultats",
  "The most important sentence from papers the AI just read.": "La phrase la plus importante des articles que l'IA vient de lire.",
  "Recent results the AI extracted from abstracts and checked against the source sentence. Follow the link to verify.": "Résultats récents que l'IA a extraits des résumés et vérifiés par rapport à la phrase source. Suivez le lien pour vérifier.",
  "Abstract-only reading (abstract-grounded-7) with quote-span grounding; any number in a summary must appear in the cited span. Full text not checked.": "Lecture des seuls résumés (abstract-grounded-7) avec ancrage sur l'extrait cité ; tout nombre d'un résumé doit figurer dans l'extrait cité. Texte intégral non vérifié.",
  "Where attention is moving": "Où se déplace l'attention",
  "Topics studied a lot more lately are on the right; less, on the left.": "Les sujets beaucoup plus étudiés ces derniers temps sont à droite ; ceux qui le sont moins, à gauche.",
  "Change in share of papers over the last three months, by topic and condition.": "Variation de la part d'articles au cours des trois derniers mois, par thème et par pathologie.",
  "Three-month window share change from title/abstract lexical mentions (≥ 200 papers); a different window from the 2-year graph trends.": "Variation de la part sur une fenêtre de trois mois à partir des mentions lexicales dans le titre/résumé (≥ 200 articles) ; une fenêtre différente des tendances du graphe sur 2 ans.",
  "Researcher rankings and a meta-analysis of the field": "Classements des chercheurs et méta-analyse du domaine",
  "Who writes the most papers, whose papers are read most, who is new and rising, and who the experts are for each illness.": "Qui écrit le plus d'articles, quels articles sont les plus lus, qui est nouveau et monte, et qui sont les experts de chaque maladie.",
  "Four rankings (papers, citations, in-corpus h-index, last-year activity) plus an analysis of the field itself: team size over time, how concentrated authorship is, newcomer share, leading journals and their growth, most-cited papers, and leading researchers per condition.": "Quatre classements (articles, citations, indice h dans le corpus, activité de la dernière année) plus une analyse du domaine lui-même : taille des équipes au fil du temps, concentration de la signature, part des nouveaux venus, principales revues et leur croissance, articles les plus cités et chercheurs de référence par pathologie.",
  "Author identity: same-name merge without ORCID (homonyms may be pooled, especially short East-Asian names). Citations are Europe PMC counts at capture; h-index computed within this corpus. Concentration: Gini of authorships per author and top-1%/10% shares. Newcomer share = authors active in the last 2 years whose first corpus paper is in that window (inflated by recency-weighted collection).": "Identité des auteurs : fusion par nom identique sans ORCID (des homonymes peuvent être regroupés, en particulier les noms courts d'Asie de l'Est). Les citations sont les comptes Europe PMC au moment de la capture ; indice h calculé dans ce corpus. Concentration : Gini des signatures par auteur et parts du top 1 %/10 %. Part des nouveaux venus = auteurs actifs au cours des 2 dernières années dont le premier article du corpus se situe dans cette fenêtre (gonflée par la collecte pondérée vers les années récentes).",
  "Who studies this, and where": "Qui étudie cela, et où",
  "Which countries write the most papers, and who works with whom.": "Quels pays écrivent le plus d'articles, et qui travaille avec qui.",
  "Papers by authors' countries, cross-country collaboration, and the most prolific researchers and institutions.": "Articles par pays des auteurs, collaborations entre pays, et chercheurs et établissements les plus prolifiques.",
  "Affiliation strings (not resolved to institution IDs); same-name merge without ORCID; citations are Europe PMC counts at capture.": "Chaînes d'affiliation (non résolues en identifiants d'établissement) ; fusion par nom identique sans ORCID ; les citations sont les comptes Europe PMC au moment de la capture.",
  "The engine right now": "Le moteur en ce moment",
  "The programs that keep collecting and reading papers. Green means working well.": "Les programmes qui continuent de ramasser et de lire des articles. Vert veut dire que tout marche bien.",
  "What collection, AI reading, the knowledge graph, Neo4j, the MINERVA copy and the explainer are doing, plus backfill progress.": "Ce que font la collecte, la lecture par l'IA, le graphe de connaissances, Neo4j, la copie de MINERVA et l'explicateur, ainsi que l'avancement du rattrapage.",
  "The launchd supervisor re-admits services only after the full regression (237 gates) passes on code change; cost from Bedrock ledger reservations within user-approved limits.": "Le superviseur launchd ne réadmet les services qu'une fois la régression complète (237 contrôles) réussie après un changement de code ; coût issu des réservations du registre Bedrock dans les limites approuvées par l'utilisateur.",
  "Papers read": "Articles lus",
  "Relations": "Relations",
  "AI-checked": "Vérifiées par l'IA",
  "Graph nodes": "Nœuds du graphe",
  "Stories": "Récits",
  "Follow-ups": "Approfondissements",
  "Hourly growth": "Croissance horaire",
  "Internal SSD — measured every 5 minutes": "SSD interne — mesuré toutes les 5 minutes",
  "normal": "normal",
  "moving to external": "transfert vers le disque externe",
  "collection paused · freeing space": "collecte en pause · libération d'espace",
  "free": "libre",
  "working set": "données de travail",
  "Recorded": "Enregistré",
  "Preparing the first follow-ups.": "Préparation des premiers approfondissements.",
  "The explainer is preparing its first stories.": "L'explicateur prépare ses premiers récits.",
  "The first scan appears after the next graph build.": "Le premier balayage apparaîtra après la prochaine construction du graphe.",
  "microbe name": "nom de microbe",
  "acronym": "acronyme",
  "term": "terme",
  "papers (2 y)": "articles (2 ans)",
  "adopted": "adopté",
  "candidate": "candidat",
  "seen with": "vu avec",
  "unfamiliar terms rising now": "termes inconnus en hausse en ce moment",
  "candidates being watched": "candidats sous surveillance",
  "concepts adopted": "concepts adoptés",
  "Share growth (last 2 y ÷ 3–6 y ago)": "Croissance de la part (2 dernières années ÷ il y a 3–6 ans)",
  "conflicts": "conflits",
  "limitations": "limites",
  "MINERVA microbe→condition relations": "Relations microbe→pathologie de MINERVA",
  "links MINERVA lacks": "liens absents de MINERVA",
  "opposite direction": "sens opposé",
  "Papers": "Articles",
  "Citations": "Citations",
  "In-corpus h-index": "Indice h dans le corpus",
  "Most active last year": "Les plus actifs l'an dernier",
  "Researchers (by name)": "Chercheurs (par nom)",
  "With 10+ papers": "Avec 10 articles ou plus",
  "Authorships held by the top 1%": "Part des signatures détenue par le top 1 %",
  "Concentration (Gini)": "Concentration (Gini)",
  "Newcomers among recently active": "Nouveaux venus parmi les actifs récents",
  "Mean authors per paper (latest year)": "Nombre moyen d'auteurs par article (dernière année)",
  "cited": "cité",
  "Most prolific researchers": "Chercheurs les plus prolifiques",
  "Researcher · affiliation": "Chercheur · affiliation",
  "Most active institutions": "Établissements les plus actifs",
  "Institution": "Établissement",
  "Backfill": "Rattrapage",
  "<b>ELI10</b> · for a 10-year-old: plain words, no jargon. Tap ELI20 or PRO above to see the same thing in more depth.": "<b>ELI10</b> · pour un enfant de 10 ans : des mots simples, sans jargon. Touche ELI20 ou PRO en haut pour voir la même chose plus en détail.",
  "<b>ELI20</b> · university level: what was counted, why it matters, what is uncertain. ELI10 is simpler; PRO adds formulas and thresholds.": "<b>ELI20</b> · niveau universitaire : ce qui a été compté, pourquoi c'est important, ce qui reste incertain. ELI10 est plus simple ; PRO ajoute formules et seuils.",
  "<b>PRO</b> · for researchers: definitions, thresholds, formulas and caveats. Switch to ELI10/ELI20 for the same results in plain language.": "<b>PRO</b> · pour les chercheurs : définitions, seuils, formules et limites. Passez à ELI10/ELI20 pour les mêmes résultats en langage courant.",
  "release": "version",
  "snapshot ": "instantané ",
  "read last hour ": "lu dans la dernière heure ",
  "● running": "● en marche",
  "Immunity & inflammation": "Immunité et inflammation",
  "Microbial metabolism": "Métabolisme microbien",
  "Diversity & dysbiosis": "Diversité et dysbiose",
  "Antibiotics & resistance": "Antibiotiques et résistance",
  "Oral": "Cavité buccale",
  "Barrier & permeability": "Barrière et perméabilité",
  "Probiotics": "Probiotiques",
  "Short-chain fatty acids": "Acides gras à chaîne courte",
  "Skin": "Peau",
  "Prebiotics & fibre": "Prébiotiques et fibres",
  "Bile acids": "Acides biliaires",
  "Microbiota transplant": "Transplantation de microbiote",
  "Cancer": "Cancer",
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
  "Rising researchers (papers in last 2 years / before)": "Chercheurs en ascension (articles des 2 dernières années / avant)",
  "Leading researchers by condition": "Chercheurs de référence par pathologie",
  "Collaboration constellation": "Constellation des collaborations",
  "Are teams getting larger?": "Les équipes s'agrandissent-elles ?",
  "Leading journals (recent share ÷ 3–5 years ago)": "Principales revues (part récente ÷ il y a 3–5 ans)",
  "Most-cited papers": "Articles les plus cités",
  "Homonyms may be pooled.": "Des homonymes peuvent être regroupés.",
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
  "Gut": "Intestin",
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
