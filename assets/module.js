(function () {
"use strict";
const C = {teal: "#2dd4bf", coral: "#fb7185", amber: "#fbbf24", violet: "#a78bfa", sky: "#38bdf8", lime: "#a3e635", text: "#e6ecff", muted: "#8d9bc4", dim: "#5d6a92", line: "#1b2648"};
const PAL = [C.sky, C.coral, C.teal, C.amber, C.violet, C.lime, "#f472b6", "#60a5fa", "#fb923c", "#94a3b8"];
const $ = id => document.getElementById(id);
const fmt = n => n == null ? "—" : Number(n).toLocaleString("ko-KR");
const pct = v => v == null ? "—" : (v > 0 ? "+" : "") + (v * 100).toFixed(1) + "%";
const esc = t => String(t == null ? "" : t).replace(/[&<>"]/g, c => ({"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;"}[c]));
const MODULES = {insights: "인사이트 랩", people: "연구자", radar: "관심 변화", findings: "최신 발견", world: "세계 흐름", gaps: "빈 곳", backfill: "수집 진행", agents: "에이전트", minerva: "MINERVA"};
const STATIC = window.MSAGE_STATIC || null;            // set only in the packaged, server-free website
if (STATIC && STATIC.public) delete MODULES.agents;      // operations are not published
let mod = new URLSearchParams(location.search).get("m") || "people";
if (!MODULES[mod]) mod = "people";
const charts = [];
function chart(el, opt) { const c = echarts.init(typeof el === "string" ? $(el) : el); c.setOption(Object.assign({backgroundColor: "transparent", textStyle: {fontFamily: "inherit", color: C.text}, animationDuration: 1200}, opt)); charts.push(c); return c; }
window.addEventListener("resize", () => charts.forEach(c => c.resize()));
setInterval(() => { $("clock").textContent = new Date().toLocaleTimeString("ko-KR", {hour12: false}); }, 1000);
$("tabs").innerHTML = Object.entries(MODULES).map(([k, n]) => `<a href="?m=${k}" class="${k === mod ? "on" : ""}">${n}</a>`).join("");
$("mod-title").textContent = MODULES[mod] || "상세";
const INTRO = {
  insights: "AI가 읽은 논문 문장들을 미생물·질병·치료가 이어진 지식 그래프로 묶었습니다. 어떤 관계를 여러 논문이 같은 방향으로 말하는지, 어디서 결론이 엇갈리는지, 무엇이 새로 떠오르는지, 다음에 무엇을 연구해야 하는지 보여 줍니다.",
  people: "논문을 많이 쓰고 많이 인용된 연구자 순위입니다. 행을 누르면 소속, 최근 논문, 함께 연구하는 사람을 볼 수 있습니다.",
  radar: "질병과 연구 주제별로 최근 관심이 늘었는지 줄었는지 보여 줍니다. 오른쪽에 있을수록 최근 논문에서 비중이 커진 주제입니다.",
  findings: "AI가 초록을 읽고 원문 문장과 대조해 통과시킨 최신 발견들입니다. 모두 잠정 결과입니다.",
  world: "나라별 논문 수와 나라 사이의 공동 연구를 보여 줍니다. 저자 소속 기준입니다.",
  gaps: "몸 부위와 연구 주제를 엮어 연구가 많은 곳과 비어 있는 곳을 보여 줍니다.",
  backfill: "2015년부터 지금까지 달마다 논문을 모으는 진행 상황입니다.",
  agents: "뒤에서 쉬지 않고 일하는 프로그램들의 상태입니다. 초록은 정상, 노랑은 주의, 빨강은 멈춤입니다.",
  minerva: "연구실 지식 그래프 MINERVA의 내용을 한 번 전체 복사해 와 비교합니다. 평소에는 MINERVA에 접속하지 않습니다."};
$("intro").textContent = INTRO[mod] || "";
const get = (u, f) => f ? Promise.resolve(f) : fetch(u).then(r => r.ok ? r.json() : Promise.reject(r.status));
const label = (d, id) => { const t = d.topics.concat(d.diseases).find(x => x.id === id); return t ? t.label : id; };
const paperCard = p => `<div class="paper"><div class="find">${esc(p.summary || "요약 없음")}</div><div class="ttl">${esc(p.title)}</div>
  <div class="meta"><span>${esc(p.journal || "")} · ${esc(p.date)}</span><a href="https://europepmc.org/article/MED/${esc(p.pmid)}" target="_blank" rel="noopener">원문 ↗</a></div></div>`;

/* ---------------- people ---------------- */
function people(d) {
  const R = {}; d.researchers.concat(d.researcher_extra || []).forEach(r => R[r.id] = r);
  const ranks = d.rankings || {papers: d.researchers.map(r => r.id)};
  const KEYS = {papers: "논문 수", citations: "인용 합계", h_index: "코퍼스 내 h-지수", recent: "최근 1년 활발"};
  $("view").innerHTML = `<div class="row2"><div class="box"><h2>가장 영향력 있는 연구자</h2>
    <p class="hint">기준을 바꿔 보세요. 행을 누르면 오른쪽에 소속·최근 논문·공동 연구자가 나옵니다.</p>
    <div class="seg" id="seg">${Object.entries(KEYS).filter(([k]) => ranks[k]).map(([k, n], i) => `<button data-k="${k}" class="${i ? "" : "on"}">${n}</button>`).join("")}</div>
    <div class="scroll"><table><thead><tr><th>#</th><th>연구자 · 현재 소속</th><th>국가</th><th class="n">논문</th><th class="n">인용</th><th class="n">h</th><th class="n">최근 1년</th></tr></thead><tbody id="rows"></tbody></table></div></div>
    <div class="box profile" id="prof"></div></div>
    <div class="row2"><div class="box"><h2>공동 연구 별자리</h2><p class="hint">상위 200명 · 별 크기 = 논문 수 · 선 = 함께 쓴 논문 · 색 = 국가</p><div class="big" id="graph"></div></div>
    <div class="box"><h2>연구를 많이 하는 기관</h2><p class="hint">논문에 적힌 소속 문자열 기준 (동일 기관의 표기 차이는 아직 합치지 않음)</p><div class="scroll"><table><thead><tr><th>#</th><th>기관</th><th>국가</th><th class="n">논문</th><th class="n">연구자</th></tr></thead><tbody id="inst"></tbody></table></div></div></div>`;
  let sel = null;
  const draw = key => {
    const ids = ranks[key] || [], max = Math.max(...ids.map(i => (R[i] || {})[key === "citations" ? "citations_observed" : key] || 0), 1);
    $("rows").innerHTML = ids.map((id, i) => { const r = R[id]; if (!r) return "";
      const v = r[key === "citations" ? "citations_observed" : key] || 0;
      return `<tr class="click${id === sel ? " sel" : ""}" data-id="${id}"><td class="rank">${i + 1}</td>
        <td class="name barcell"><i style="width:${(60 * v / max).toFixed(0)}%"></i><span><b>${esc(r.label)}</b><small>${esc(r.institution || "소속 미표기")}</small></span></td>
        <td>${esc(r.country || "—")}</td><td class="n">${fmt(r.papers)}</td><td class="n">${fmt(r.citations_observed)}</td><td class="n">${fmt(r.h_index)}</td><td class="n">${fmt(r.recent)}</td></tr>`; }).join("");
  };
  const profile = id => { const r = R[id]; if (!r) return; sel = id;
    document.querySelectorAll("#rows tr").forEach(t => t.classList.toggle("sel", t.dataset.id === id));
    $("prof").innerHTML = `<h3>${esc(r.label)}</h3><div class="who">${esc(r.institution || "")}${r.country ? " · " + esc(r.country) : ""}<br>
      최근 소속 표기(${esc(r.latest_affiliation_date || "")}): ${esc(r.latest_affiliation || "—")}<br>
      논문 ${fmt(r.papers)}편 · 인용 ${fmt(r.citations_observed)} · 코퍼스 내 h-지수 ${fmt(r.h_index)} · 최근 1년 ${fmt(r.recent)}편${r.orcid ? " · ORCID " + esc(r.orcid) : ""}</div>
      <div class="chips">${(r.topics || []).map(t => `<span class="chip">${esc(label(d, t))}</span>`).join("")}</div>
      ${(r.coauthors || []).length ? `<p class="hint" style="margin-top:10px">자주 함께 쓴 연구자: ${esc(r.coauthors.join(", "))}</p>` : ""}
      <h2 style="margin-top:12px">최근 논문과 발견</h2>${(r.papers_list || []).slice(0, 6).map(paperCard).join("") || '<p class="hint">상위 200명만 논문 목록을 미리 계산합니다.</p>'}`; };
  $("seg").onclick = e => { const b = e.target.closest("button"); if (!b) return; document.querySelectorAll("#seg button").forEach(x => x.classList.toggle("on", x === b)); draw(b.dataset.k); };
  $("rows").onclick = e => { const t = e.target.closest("tr"); if (t) profile(t.dataset.id); };
  draw(Object.keys(KEYS).find(k => ranks[k])); profile((ranks.papers || [])[0]);
  const top = d.researchers.slice(0, 200), cnt = {};
  top.forEach(r => cnt[r.country || "미표기"] = (cnt[r.country || "미표기"] || 0) + 1);
  const cats = Object.entries(cnt).sort((a, b) => b[1] - a[1]).slice(0, 9).map(x => x[0]);
  const ids = new Set(top.map(r => r.id));
  const g = chart("graph", {tooltip: {formatter: p => p.dataType === "edge" ? `공동 논문 ${p.data.value}편` : `<b>${esc(p.data.name)}</b><br>${esc(p.data.raw.institution || "")}<br>논문 ${p.data.value}편`},
    legend: {data: cats.concat(["기타"]), textStyle: {color: C.muted}, type: "scroll", top: 0},
    series: [{type: "graph", layout: "force", roam: true, draggable: true, categories: cats.concat(["기타"]).map((n, i) => ({name: n, itemStyle: {color: PAL[i % PAL.length]}})),
      data: top.map(r => ({id: r.id, name: r.label, value: r.papers, raw: r, category: (i => i < 0 ? cats.length : i)(cats.indexOf(r.country || "미표기")),
        symbolSize: 6 + Math.sqrt(r.papers) * 4, label: {show: r.papers >= 12, color: C.text, fontSize: 11}})),
      links: d.coauthor_edges.filter(e => ids.has(e.source) && ids.has(e.target)).map(e => ({source: e.source, target: e.target, value: e.weight, lineStyle: {width: .6 + e.weight * .6, opacity: .4}})),
      force: {repulsion: 90, gravity: .08, edgeLength: [30, 90]}, lineStyle: {color: "source", curveness: .2}, emphasis: {focus: "adjacency"}}]});
  g.on("click", p => p.dataType === "node" && profile(p.data.id));
  $("inst").innerHTML = (d.institutions || []).slice(0, 80).map((x, i) => `<tr><td class="rank">${i + 1}</td><td class="name"><b>${esc(x.name)}</b><small>${(x.topics || []).map(t => esc(label(d, t))).join(" · ")}</small></td><td>${esc(x.country || "—")}</td><td class="n">${fmt(x.papers)}</td><td class="n">${fmt(x.researchers)}</td></tr>`).join("");
}

/* ---------------- radar ---------------- */
function radar(d) {
  const all = d.topics.map(t => ({...t, k: "기전·주제"})).concat(d.diseases.map(t => ({...t, k: "질병"})));
  $("view").innerHTML = `<div class="box"><h2>연구 관심 레이더</h2><p class="hint">비교 기간 ${d.coverage.momentum_early.join(", ")} → ${d.coverage.momentum_late.join(", ")} · 같은 기간 전체 논문 중 점유율 비교</p><div class="big" id="sc"></div></div>
    <div class="box"><h2>모든 주제</h2><div class="scroll"><table><thead><tr><th>주제</th><th>구분</th><th class="n">전체 논문</th><th class="n">최근 3개월</th><th class="n">관심 변화</th><th class="n">인용 중앙값</th><th>월별 흐름</th></tr></thead><tbody id="tt"></tbody></table></div></div>`;
  const pts = all.filter(t => t.growth != null && t.papers >= 100);
  chart("sc", {grid: {left: 60, right: 30, top: 20, bottom: 40}, tooltip: {formatter: p => `<b>${p.name}</b><br>${p.value[0]}% · ${fmt(p.value[1])}편`},
    xAxis: {name: "관심 변화 %", nameLocation: "middle", nameGap: 26, axisLabel: {color: C.dim}, splitLine: {lineStyle: {color: C.line}}},
    yAxis: {type: "log", min: 30, axisLabel: {color: C.dim}, splitLine: {lineStyle: {color: C.line}}},
    series: ["기전·주제", "질병"].map((k, i) => ({type: "effectScatter", name: k, rippleEffect: {scale: 2.4, brushType: "stroke", period: 4}, showEffectOn: "render",
      data: pts.filter(t => t.k === k).map(t => ({name: t.label, value: [+(t.growth * 100).toFixed(1), t.late, t.papers]})),
      symbolSize: v => 8 + Math.sqrt(v[2]) * .55, itemStyle: {color: i ? C.coral : C.teal, opacity: .8}, label: {show: true, formatter: p => p.name, position: "right", color: C.text, fontSize: 12}, labelLayout: {hideOverlap: true}}))});
  $("tt").innerHTML = all.sort((a, b) => (b.growth ?? -9) - (a.growth ?? -9)).map(t => { const mx = Math.max(...t.by_month, 1);
    const spark = `<svg width="120" height="22">${t.by_month.map((v, i) => `<rect x="${i * 5}" y="${22 - 20 * v / mx}" width="4" height="${20 * v / mx}" fill="${C.sky}" opacity=".7"/>`).join("")}</svg>`;
    return `<tr><td><a href="?m=findings&t=${t.id}" style="color:${C.text}">${esc(t.label)}</a></td><td>${t.k}</td><td class="n">${fmt(t.papers)}</td><td class="n">${fmt(t.late)}</td><td class="n" style="color:${(t.growth || 0) > 0 ? C.teal : C.coral}">${pct(t.growth)}</td><td class="n">${fmt(t.citations_median)}</td><td>${spark}</td></tr>`; }).join("");
}

/* ---------------- findings ---------------- */
function findings(d) {
  const t0 = new URLSearchParams(location.search).get("t");
  const H = d.highlights || {}, themes = Object.keys(H).filter(k => H[k].length);
  $("view").innerHTML = `<div class="box"><h2>주제별 최근 발견</h2><p class="hint">AI가 초록을 읽고 원문 문장과 대조해 통과한 요약 · 주제를 고르세요</p>
    <div class="seg" id="th"><button data-t="" class="${t0 ? "" : "on"}">전체</button>${themes.map(k => `<button data-t="${k}" class="${k === t0 ? "on" : ""}">${esc(label(d, k))}</button>`).join("")}</div><div class="row3" id="cards"></div></div>
    <div class="box"><h2>연구자들이 직접 말한 빈 곳</h2><div class="row3" id="gaps"></div></div>`;
  const show = t => { const items = []; (t ? [t] : themes).forEach(k => H[k].forEach(p => items.push(p)));
    const seen = new Set(); $("cards").innerHTML = items.filter(p => p.summary && !seen.has(p.pmid) && seen.add(p.pmid)).sort((a, b) => String(b.date).localeCompare(a.date)).map(paperCard).join(""); };
  $("th").onclick = e => { const b = e.target.closest("button"); if (!b) return; document.querySelectorAll("#th button").forEach(x => x.classList.toggle("on", x === b)); show(b.dataset.t); };
  show(t0);
  $("gaps").innerHTML = (d.author_gaps || []).map(g => `<div class="paper"><div class="find">${esc(g.summary)}</div><div class="meta"><span>${esc(g.date)} · ${(g.themes || []).map(t => esc(label(d, t))).join(", ")}</span><a href="https://europepmc.org/article/MED/${esc(g.pmid)}" target="_blank" rel="noopener">원문 ↗</a></div></div>`).join("");
}

/* ---------------- world ---------------- */
function world(d) {
  $("view").innerHTML = `<div class="row2"><div class="box"><h2>나라별 논문</h2><div class="big" id="bar"></div></div>
    <div class="box"><h2>가장 많은 국제 공동 연구</h2><div class="scroll"><table><thead><tr><th>나라 ↔ 나라</th><th class="n">공동 논문</th></tr></thead><tbody id="links"></tbody></table></div></div></div>
    <div class="box"><h2>나라별 대표 기관</h2><div class="row3" id="byc"></div></div>`;
  const top = d.places.slice(0, 30).reverse();
  chart("bar", {grid: {left: 110, right: 40, top: 10, bottom: 20}, tooltip: {}, xAxis: {type: "log", axisLabel: {color: C.dim}, splitLine: {lineStyle: {color: C.line}}},
    yAxis: {type: "category", data: top.map(p => p.country), axisLabel: {color: C.muted}},
    series: [{type: "bar", data: top.map(p => p.papers), itemStyle: {color: C.teal, borderRadius: [0, 6, 6, 0]}, label: {show: true, position: "right", color: C.muted, formatter: p => fmt(p.value)}}]});
  $("links").innerHTML = d.country_links.map(l => `<tr><td>${esc(l.a)} ↔ ${esc(l.b)}</td><td class="n">${fmt(l.papers)}</td></tr>`).join("");
  const by = {}; (d.institutions || []).forEach(x => { if (x.country) (by[x.country] = by[x.country] || []).push(x); });
  $("byc").innerHTML = d.places.slice(0, 12).map(p => `<div class="paper"><div class="find">${esc(p.country)} · 논문 ${fmt(p.papers)}편 · 저자 ${fmt(p.researchers)}명</div>${(by[p.country] || []).slice(0, 4).map(x => `<div class="ttl">${esc(x.name)} (${fmt(x.papers)})</div>`).join("")}</div>`).join("");
}

/* ---------------- gaps ---------------- */
function gaps(d) {
  const SITE = {airway: "호흡기", gut: "장", multi_site: "여러 부위", oral: "구강", skin: "피부", urogenital: "비뇨생식기"};
  const MT = {brain: "뇌·신경", cancer: "암", diagnosis: "진단", diet: "식이", immune: "면역", intervention: "개입·치료", metabolites: "대사물질", omics: "오믹스"};
  const cells = d.frontier.cells.filter(c => c.papers != null && SITE[c.site] && MT[c.topic]);
  const sites = Object.keys(SITE), topics = Object.keys(MT);
  $("view").innerHTML = `<div class="box"><h2>부위 × 주제 지도</h2><p class="hint">옅을수록 연구가 적은 곳</p><div class="big" id="hm"></div></div>
    <div class="row2"><div class="box"><h2>아직 확인되지 않은 공통 전제</h2><ul id="pr"></ul></div><div class="box"><h2>M-SAGE가 제안한 다음 행동</h2><ul id="ac"></ul></div></div>`;
  chart("hm", {tooltip: {formatter: p => `${SITE[sites[p.value[1]]]} × ${MT[topics[p.value[0]]]}: ${fmt(p.value[2])}편`}, grid: {left: 90, right: 20, top: 10, bottom: 40},
    xAxis: {type: "category", data: topics.map(t => MT[t]), axisLabel: {color: C.muted}}, yAxis: {type: "category", data: sites.map(s => SITE[s]), axisLabel: {color: C.muted}},
    visualMap: {min: 0, max: Math.max(...cells.map(c => c.papers)), show: false, inRange: {color: ["#140c2a", "#4c1d95", "#a78bfa", "#fb7185", "#fde047"]}},
    series: [{type: "heatmap", data: cells.map(c => [topics.indexOf(c.topic), sites.indexOf(c.site), c.papers]), label: {show: true, color: "#f1f5f9"}, itemStyle: {borderColor: "#04070f", borderWidth: 3, borderRadius: 6}}]});
  $("pr").innerHTML = [...new Set(d.frontier.premises.map(p => p.label))].map(p => `<li>${esc(p)}</li>`).join("");
  $("ac").innerHTML = d.frontier.actions.map(a => `<li><b>${esc(a.label)}</b> — ${esc(a.reason)}</li>`).join("");
}

/* ---------------- MINERVA ---------------- */
function minerva(d) {
  const m = (d.minerva || {}).live;
  if (!m) { $("view").innerHTML = '<div class="box"><h2>MINERVA</h2><p class="hint">MINERVA 에이전트가 아직 첫 수집을 끝내지 않았습니다. 에이전트 탭에서 연결 상태를 확인하세요. 수집이 끝나면 다음 그림 갱신(최대 2시간) 때 여기에 나타납니다.</p></div>'; return; }
  const DL = {ibd: "염증성 장질환", crc: "대장암", obesity: "비만", diabetes: "당뇨", liver: "지방간", cardio: "동맥경화", kidney: "만성 신장질환", parkinson: "파킨슨병", alzheimer: "알츠하이머", mood: "우울", autism: "자폐", allergy: "천식", skin_disease: "건선", periodontal: "치주염", infection: "C. difficile 감염", urogenital: "세균성 질염"};
  const graphs = Object.entries(m.graphs || {});
  $("view").innerHTML = `<div class="row2"><div class="box"><h2>질병 ↔ 미생물 연결망 (MINERVA)</h2><p class="hint">질병(주황)과 많이 연관된 미생물(초록=증가, 빨강=감소 보고가 많음) · 선 굵기 = 근거 행 수</p><div class="big" id="net"></div></div>
    <div class="box"><h2>질병 연관이 가장 많은 미생물 (허브)</h2><div class="big" id="hub"></div></div></div>
    <div class="box"><h2>질병별 대표 미생물</h2><div class="row3" id="dz"></div></div>
    <div class="box"><h2>MINERVA 그래프 구성</h2><div class="row3">${graphs.map(([g, v]) => `<div class="paper"><div class="find">${esc(g)}</div>${(v.node_labels || []).slice(0, 8).map(x => `<div class="ttl">${esc(x.label)} · ${fmt(x.count)}</div>`).join("")}</div>`).join("")}</div>
    <p class="hint">수집 ${m.finished_at ? new Date(m.finished_at * 1000).toLocaleString("ko-KR") : ""} · 전송 ${esc(m.transport)} · 근거 행 수는 고유 생물학적 관계 수와 다를 수 있습니다.</p></div>`;
  const hub = (m.hub_microbes || []).slice(0, 25).reverse();
  chart("hub", {grid: {left: 210, right: 40, top: 10, bottom: 20}, tooltip: {}, xAxis: {axisLabel: {color: C.dim}, splitLine: {lineStyle: {color: C.line}}},
    yAxis: {type: "category", data: hub.map(x => x.microbe), axisLabel: {color: C.muted, fontSize: 11}},
    series: [{type: "bar", data: hub.map(x => x.degree), itemStyle: {color: C.violet, borderRadius: [0, 6, 6, 0]}}]});
  const nodes = [], links = [], seen = {};
  Object.entries(m.diseases || {}).forEach(([k, v]) => { nodes.push({id: "d:" + k, name: DL[k] || v.query, symbolSize: 26, itemStyle: {color: C.amber}, label: {show: true, color: C.text}});
    (v.microbes || []).slice(0, 8).forEach(x => { const id = "m:" + x.microbe, n = x.increase + x.decrease + x.unknown;
      if (!seen[id]) { seen[id] = {id, name: x.microbe, value: 0, inc: 0, dec: 0}; nodes.push(seen[id]); }
      seen[id].value += n; seen[id].inc += x.increase; seen[id].dec += x.decrease;
      links.push({source: "d:" + k, target: id, value: n, lineStyle: {width: Math.min(6, .5 + n / 3), opacity: .45}}); }); });
  Object.values(seen).forEach(x => { x.symbolSize = 6 + Math.sqrt(x.value) * 3; x.itemStyle = {color: x.inc >= x.dec ? C.teal : C.coral}; x.label = {show: x.value >= 6, color: C.muted, fontSize: 10}; });
  chart("net", {tooltip: {formatter: p => p.dataType === "edge" ? `근거 행 ${p.data.value}` : esc(p.data.name)},
    series: [{type: "graph", layout: "force", roam: true, draggable: true, data: nodes, links, force: {repulsion: 120, edgeLength: [40, 120], gravity: .06}, lineStyle: {color: "source", curveness: .15}, emphasis: {focus: "adjacency"}}]});
  $("dz").innerHTML = Object.entries(m.diseases || {}).map(([k, v]) => `<div class="paper"><div class="find">${esc(DL[k] || v.query)} · 근거 ${fmt(v.count)}행</div>${(v.microbes || []).slice(0, 6).map(x =>
    `<div class="ttl">${esc(x.microbe)} <span style="color:${C.teal}">▲${x.increase}</span> <span style="color:${C.coral}">▼${x.decrease}</span> · PMID ${x.pmids}</div>`).join("")}</div>`).join("");
}

/* ---------------- backfill + agents (live) ---------------- */
function backfill(v) {
  const bf = v.backfill; if (!bf) { $("view").innerHTML = '<div class="box">과거 수집 정보가 아직 없습니다.</div>'; return; }
  const m = bf.month_grid, years = [...new Set(Object.keys(m).map(k => k.slice(0, 4)))].sort().reverse(), work = Object.keys(m).sort().reverse().find(k => !m[k]);
  $("view").innerHTML = `<div class="box"><h2>과거 논문 채우기</h2><p class="hint">${bf.months_done} / ${bf.months_total}개월 완료 · 달마다 최대 ${fmt(bf.page_cap * (bf.page_size || 25))}편 · 30초마다 갱신</p>
    <div class="mgrid" style="grid-template-columns:50px repeat(12,1fr);gap:5px;font-size:12px">${years.map(y => `<span>${y}</span>` + Array.from({length: 12}, (_, i) => { const k = y + "-" + String(i + 1).padStart(2, "0");
      return `<i style="height:26px" class="${m[k] === true ? "done" : k === work ? "work" : ""}" data-tip="${k}"></i>`; }).join("")).join("")}</div></div>
    <div class="box"><h2>연도별 대략 확보량</h2><div class="mid" id="yb"></div></div>`;
  const ys = Object.entries(bf.years).sort();
  chart("yb", {grid: {left: 60, right: 20, top: 20, bottom: 30}, tooltip: {}, xAxis: {type: "category", data: ys.map(x => x[0]), axisLabel: {color: C.muted}},
    yAxis: {axisLabel: {color: C.dim}, splitLine: {lineStyle: {color: C.line}}}, series: [{type: "bar", data: ys.map(x => x[1].approx_papers), itemStyle: {color: C.violet, borderRadius: [6, 6, 0, 0]}}]});
}
function agents(v) {
  $("view").innerHTML = `<div class="box"><h2>에이전트 오케스트라</h2><p class="hint">조종석(지휘자)이 보는 백그라운드 에이전트 · 30초마다 갱신</p><div class="row3" id="ag"></div></div>
    <div class="box"><h2>최근 수집 주기</h2><div class="scroll"><table><thead><tr><th>시각</th><th>상태</th><th class="n">쪽</th><th>범위 · 사유</th></tr></thead><tbody id="ev"></tbody></table></div></div>`;
  $("ag").innerHTML = (v.agents || []).map(a => `<div class="acard ${a.state}"><i></i><b>${esc(a.name)}</b><p>${esc(a.role)}</p><p class="doing">${esc(a.doing || "")}</p><p>${esc(a.metric || "")}${a.at ? " · " + new Date(a.at).toLocaleTimeString("ko-KR", {hour12: false}) : ""}</p></div>`).join("");
  $("ev").innerHTML = (v.collection.recent || []).map(e => `<tr><td>${e.at ? new Date(e.at).toLocaleTimeString("ko-KR", {hour12: false}) : ""}</td><td style="color:${e.state === "completed" ? C.teal : C.coral}">${esc(e.state)}</td><td class="n">${e.historical_pages}</td><td>${e.range ? esc(e.range.start + " ~ " + e.range.end) : ""} ${esc(e.reason || "")}</td></tr>`).join("");
}

/* ---------------- insight lab (knowledge graph) ---------------- */
const UP = C.coral, DOWN = C.sky, MIX = C.amber;
const dirWord = s => s > 0.25 ? "질병에서 증가" : s < -0.25 ? "질병에서 감소" : "엇갈림";
const pm = x => x.pmid ? `<a href="https://europepmc.org/article/MED/${esc(x.pmid)}" target="_blank" rel="noopener">PMID ${esc(x.pmid)} ↗</a>` : "";
const quoteCard = x => `<div class="paper"><div class="find">${esc(x.summary || x.quote)}</div>${x.summary ? `<div class="ttl">“${esc(x.quote)}”</div>` : ""}
  <div class="meta"><span>${esc(x.year || "")}${x.direction ? " · " + (x.direction === "increase" ? "증가" : x.direction === "decrease" ? "감소" : "차이 없음") : ""}</span>${pm(x)}</div></div>`;
function insights(d) {
  const T = {map: "지식 지도", consensus: "합의 · 논쟁", signature: "미생물 시그니처", trends: "떠오르는 · 지는 주제", gaps: "연구 공백 · 다음 연구", novel: "MINERVA 대비 새 연결"};
  const k = d.counts || {}, b = d.build || {};
  $("view").innerHTML = `<div class="kpis">
      <div class="kpi"><b>${fmt(b.papers_read)}</b><span>읽은 논문</span></div>
      <div class="kpi"><b>${fmt((k.edges_associated || 0) + (k.edges_modulates || 0))}</b><span>미생물 관계 (근거 문장)</span></div>
      <div class="kpi"><b>${fmt(k.Taxon)}</b><span>미생물 노드</span></div>
      <div class="kpi"><b>${fmt(k.edges_gap)}</b><span>연구 공백 · 한계 진술</span></div>
      <div class="kpi"><b>${k.relations_total ? Math.round(100 * (k.relations_ai_checked || 0) / k.relations_total) + "%" : "—"}</b><span>AI 판정 + 비교 그룹 대조를 통과한 관계 (${fmt(k.relations_ai_checked)}/${fmt(k.relations_total)})</span></div>
      <div class="kpi"><b>${fmt(k.authors)}</b><span>연구자</span></div></div>
    <div class="seg big-seg" id="iseg">${Object.entries(T).map(([key, n], i) => `<button data-k="${key}" class="${i ? "" : "on"}">${n}</button>`).join("")}</div>
    <div id="ipane"></div>
    <p class="hint">${(d.caveats || []).map(esc).join(" · ")}</p>`;
  const pane = $("ipane");
  const show = key => { charts.splice(0).forEach(c => c.dispose()); pane.innerHTML = ""; ({map: imap, consensus: icons, signature: isig, trends: itrend, gaps: igaps, novel: inovel})[key](d, pane); };
  $("iseg").onclick = e => { const x = e.target.closest("button"); if (!x) return; document.querySelectorAll("#iseg button").forEach(y => y.classList.toggle("on", y === x)); show(x.dataset.k); };
  show("map");
}
function imap(d, pane) {
  const N = d.network || {taxa: [], diseases: [], edges: []};
  pane.innerHTML = `<div class="row2"><div class="box"><h2>미생물 ↔ 질병 지식 지도</h2>
    <p class="hint">초록의 근거 문장에서 뽑은 관계 · 주황 원 = 질병, 청록 원 = 미생물(속) · <span style="color:${UP}">빨강 선 = 질병에서 증가</span> · <span style="color:${DOWN}">파랑 선 = 감소</span> · <span style="color:${MIX}">노랑 점선 = 논문끼리 엇갈림</span> · 원을 누르면 오른쪽에 관계가 나옵니다</p>
    <div class="big" id="kg"></div></div><div class="box" id="kgside"><h2>노드를 눌러 보세요</h2><p class="hint">관계마다 증가·감소를 보고한 논문 수를 보여 줍니다.</p></div></div>`;
  const maxT = Math.max(...N.taxa.map(t => t.w), 1), maxD = Math.max(...N.diseases.map(t => t.w), 1);
  const nodes = N.diseases.map(x => ({id: "D:" + x.id, name: x.label, category: 0, symbolSize: 18 + 42 * Math.sqrt(x.w / maxD), value: x.w,
      label: {show: true, color: "#fde68a", fontWeight: 700}}))
    .concat(N.taxa.map(x => ({id: "T:" + x.id, name: x.id, category: 1, symbolSize: 8 + 26 * Math.sqrt(x.w / maxT), value: x.w,
      label: {show: x.w > maxT * 0.18, color: "#99f6e4", fontStyle: "italic"}})));
  const links = N.edges.map(e => ({source: "T:" + e.s, target: "D:" + e.t, value: e.w, raw: e,
    lineStyle: {color: e.contested ? MIX : e.score > 0 ? UP : DOWN, width: 0.6 + Math.sqrt(e.w) * 0.9, type: e.contested ? "dashed" : "solid", opacity: 0.55, curveness: 0.12}}));
  const g = chart("kg", {tooltip: {formatter: p => p.dataType === "edge" ? `${esc(p.data.raw.s)} → ${esc(p.data.raw.t)}<br>근거 ${p.data.value}건 · ${dirWord(p.data.raw.score)}` : `<b>${esc(p.data.name)}</b><br>근거 ${fmt(p.data.value)}건`},
    series: [{type: "graph", layout: "force", roam: true, draggable: true, data: nodes, links,
      categories: [{name: "질병", itemStyle: {color: C.amber, shadowBlur: 18, shadowColor: "#fbbf2466"}}, {name: "미생물", itemStyle: {color: C.teal, shadowBlur: 10, shadowColor: "#2dd4bf55"}}],
      force: {repulsion: 260, edgeLength: [60, 190], gravity: 0.06, friction: 0.12}, emphasis: {focus: "adjacency", lineStyle: {opacity: 1}},
      animationDurationUpdate: 1600}]});
  const side = id => { const isD = id.startsWith("D:"), key = id.slice(2);
    const es = N.edges.filter(e => isD ? e.t === key : e.s === key).sort((a, b) => b.w - a.w);
    const lab = isD ? (N.diseases.find(x => x.id === key) || {}).label : key;
    $("kgside").innerHTML = `<h2>${esc(lab)}</h2><p class="hint">${isD ? "이 질병과 함께 보고된 미생물" : "이 미생물이 보고된 질병"} · 근거 문장 수</p>
      <table><tbody>${es.map(e => `<tr><td>${esc(isD ? e.s : (N.diseases.find(x => x.id === e.t) || {}).label)}</td>
        <td style="width:45%"><div class="bal"><i style="width:${50 + 50 * e.score}%;background:${e.contested ? MIX : e.score > 0 ? UP : DOWN}"></i></div></td>
        <td class="n">${e.w}</td><td style="color:${e.contested ? MIX : e.score > 0 ? UP : DOWN}">${dirWord(e.score)}</td></tr>`).join("")}</tbody></table>`; };
  g.on("click", p => { if (p.dataType === "node") side(p.data.id); });
  if (N.diseases.length) side("D:" + N.diseases.sort((a, b) => b.w - a.w)[0].id);
}
function pairTable(rows, withMinerva) {
  return `<table><thead><tr><th>미생물</th><th>질병</th><th>감소 ◀ ▶ 증가</th><th class="n">논문</th>${withMinerva ? "<th>MINERVA</th>" : ""}</tr></thead><tbody>${rows.map((p, i) => {
    const tot = p.inc + p.dec || 1;
    return `<tr class="click" data-i="${i}"><td><i>${esc(p.taxon)}</i></td><td>${esc(p.disease_label)}</td>
      <td style="width:34%"><div class="div"><span style="width:${50 * p.dec / tot}%;background:${DOWN}"></span><span style="width:${50 * p.inc / tot}%;background:${UP}"></span></div>
      <small>${p.dec} ◀ ▶ ${p.inc}${p.null ? " · 차이 없음 " + p.null : ""}${p.ai_checked ? ` · <span style="color:var(--violet)">그룹 대조 확인 ${p.ai_checked}</span>` : ""}</small></td><td class="n">${p.papers}</td>
      ${withMinerva ? `<td>${p.minerva == null ? "—" : p.minerva.disease_missing ? '<span style="color:var(--dim)">질병 없음</span>' : p.minerva.absent ? '<span style="color:var(--lime)">없음 (새 연결)</span>' : (p.minerva_agrees === false ? '<span style="color:var(--coral)">반대 방향</span>' : '<span style="color:var(--teal)">같은 방향</span>')}</td>` : ""}</tr>`; }).join("")}</tbody></table>`;
}
function icons(d, pane) {
  const mc = d.minerva_compared;
  pane.innerHTML = `<div class="row2"><div class="box"><h2>논문들이 한목소리로 말하는 관계</h2><p class="hint">같은 방향(증가 또는 감소)을 보고한 문장이 60% 이상이고 5건 이상인 미생물–질병 쌍 · 행을 누르면 근거 문장</p>
      <div class="scroll" id="cons">${pairTable(d.consensus.slice(0, 40), mc)}</div></div>
    <div class="box"><h2>논문끼리 부딪히는 관계 (논쟁 중)</h2><p class="hint">증가와 감소 보고가 함께 30% 이상 섞인 쌍 · 해결이 필요한 질문입니다</p>
      <div class="scroll" id="contra">${pairTable(d.contradictions.slice(0, 40), mc)}</div></div></div>
    <div class="box" id="ev"><h2>근거 문장</h2><p class="hint">왼쪽 표에서 쌍을 고르면 여기에 원문 인용과 요약이 나옵니다.</p></div>`;
  const pick = (rows, el) => el.onclick = e => { const t = e.target.closest("tr[data-i]"); if (!t) return; const p = rows[+t.dataset.i];
    $("ev").innerHTML = `<h2><i>${esc(p.taxon)}</i> · ${esc(p.disease_label)}</h2><p class="hint">증가 ${p.inc} · 감소 ${p.dec} · 차이 없음 ${p.null} · 논문 ${p.papers}편</p>
      <div class="row2">${(p.examples || []).map(quoteCard).join("") || '<p class="hint">상위 40개만 예시 문장을 미리 계산합니다.</p>'}</div>`; };
  pick(d.consensus, $("cons")); pick(d.contradictions, $("contra"));
}
function isig(d, pane) {
  const E = (d.network || {}).edges || [], taxa = [...new Set(E.map(e => e.s))], dis = d.network.diseases.sort((a, b) => b.w - a.w).slice(0, 22);
  const tw = {}; E.forEach(e => tw[e.s] = (tw[e.s] || 0) + e.w); const tt = taxa.sort((a, b) => tw[b] - tw[a]).slice(0, 30);
  pane.innerHTML = `<div class="row2"><div class="box"><h2>미생물 × 질병 방향 지도</h2><p class="hint">빨강 = 그 질병에서 많아진다는 보고가 우세 · 파랑 = 줄어든다는 보고가 우세 · 칸 숫자 = 근거 문장 수</p><div class="big" id="hm" style="height:760px"></div></div>
    <div class="box"><h2>여러 질병에 공통으로 나타나는 미생물</h2><p class="hint">3개 이상 질병에서 방향이 일관된 미생물 · 파랑이 많으면 '건강 지표' 후보, 빨강이 많으면 '질환 지표' 후보</p><div class="scroll" style="max-height:760px">
    ${(d.signatures || []).slice(0, 30).map(s => `<div class="sig"><b><i>${esc(s.taxon)}</i></b><small>질병 ${s.diseases}개 · 근거 ${s.evidence}</small>
      <div class="div"><span style="width:${50 * s.down.length / s.diseases}%;background:${DOWN}"></span><span style="width:${50 * s.up.length / s.diseases}%;background:${UP}"></span></div>
      <div class="chips">${s.down.map(x => `<span class="chip" style="color:${DOWN}">↓ ${esc(x)}</span>`).join("")}${s.up.map(x => `<span class="chip" style="color:${UP}">↑ ${esc(x)}</span>`).join("")}</div></div>`).join("")}</div></div></div>`;
  const data = []; E.forEach(e => { const x = dis.findIndex(q => q.id === e.t), y = tt.indexOf(e.s); if (x >= 0 && y >= 0) data.push([x, y, e.score, e.w]); });
  chart("hm", {grid: {left: 150, right: 20, top: 10, bottom: 110}, tooltip: {formatter: p => `${esc(tt[p.data[1]])} · ${esc(dis[p.data[0]].label)}<br>근거 ${p.data[3]} · ${dirWord(p.data[2])}`},
    xAxis: {type: "category", data: dis.map(x => x.label), axisLabel: {color: C.muted, rotate: 50, fontSize: 11}, splitArea: {show: false}},
    yAxis: {type: "category", data: tt, inverse: true, axisLabel: {color: "#99f6e4", fontStyle: "italic", fontSize: 11}},
    visualMap: {min: -1, max: 1, show: false, inRange: {color: [DOWN, "#1e293b", UP]}, dimension: 2},
    series: [{type: "heatmap", data, label: {show: true, formatter: p => p.data[3], color: "#f1f5f9", fontSize: 10}, itemStyle: {borderColor: "#04070f", borderWidth: 2, borderRadius: 4}}]});
}
function itrend(d, pane) {
  const CAT = {Disease: "질병", Taxon: "미생물", Intervention: "개입", Metabolite: "대사물질", Method: "연구 방법", BodySite: "몸 부위"};
  pane.innerHTML = `<div class="seg" id="cseg">${Object.entries(CAT).map(([k, n], i) => `<button data-k="${k}" class="${i ? "" : "on"}">${n}</button>`).join("")}</div>
    <div class="row2"><div class="box"><h2>떠오르는 주제</h2><p class="hint">최근 2년 논문 중 언급 비율 ÷ 3–5년 전 비율 · 연도별 수집량에 상한이 있어 '비율'로 비교합니다</p><div class="mid" id="rise"></div></div>
    <div class="box"><h2>관심이 줄어드는 주제</h2><p class="hint">같은 기준으로 비율이 가장 많이 줄어든 주제</p><div class="mid" id="fade"></div></div></div>
    <div class="row2"><div class="box"><h2>연도별 언급 비율 (상위 떠오르는 주제)</h2><div class="mid" id="lines"></div></div>
    <div class="box"><h2>떠오르는 주제를 이끄는 연구자 (최근 3년)</h2><div id="lead" class="scroll" style="max-height:380px"></div></div></div>`;
  const draw = cat => { charts.splice(0).forEach(c => c.dispose()); const t = d.trends[cat];
    const bar = (el, rows, color, inv) => chart(el, {grid: {left: 150, right: 60, top: 10, bottom: 20}, tooltip: {formatter: p => `${esc(rows[p.dataIndex].name)}<br>최근 ${(rows[p.dataIndex].share_recent * 100).toFixed(2)}% · 이전 ${(rows[p.dataIndex].share_prior * 100).toFixed(2)}% · 논문 ${fmt(rows[p.dataIndex].papers)}`},
      xAxis: {type: "value", axisLabel: {color: C.dim, formatter: v => "×" + v}, splitLine: {lineStyle: {color: C.line}}},
      yAxis: {type: "category", inverse: true, data: rows.map(r => r.name), axisLabel: {color: C.text, fontStyle: cat === "Taxon" ? "italic" : "normal"}},
      series: [{type: "bar", data: rows.map(r => r.growth), itemStyle: {color, borderRadius: [0, 6, 6, 0]}, label: {show: true, position: "right", color: C.muted, formatter: p => "×" + p.value.toFixed(2)}, animationDelay: i => i * 60}]});
    bar("rise", t.rising.slice(0, 12), new echarts.graphic.LinearGradient(0, 0, 1, 0, [{offset: 0, color: "#14532d"}, {offset: 1, color: C.lime}]));
    bar("fade", t.fading.slice(0, 12), new echarts.graphic.LinearGradient(0, 0, 1, 0, [{offset: 0, color: "#3f1d2b"}, {offset: 1, color: C.coral}]));
    const top = t.rising.slice(0, 6);
    chart("lines", {grid: {left: 50, right: 20, top: 30, bottom: 30}, tooltip: {trigger: "axis", valueFormatter: v => (v * 100).toFixed(2) + "%"}, legend: {top: 0, textStyle: {color: C.muted}, type: "scroll"},
      xAxis: {type: "category", data: d.years, axisLabel: {color: C.muted}}, yAxis: {axisLabel: {color: C.dim, formatter: v => (v * 100).toFixed(1) + "%"}, splitLine: {lineStyle: {color: C.line}}},
      series: top.map((r, i) => ({type: "line", name: r.name, data: r.series, smooth: true, symbolSize: 6, lineStyle: {width: 3, color: PAL[i]}, itemStyle: {color: PAL[i]}, areaStyle: {opacity: 0.06}}))});
    $("lead").innerHTML = t.rising.slice(0, 6).map(r => { const L = (d.leaders || {})[cat + ":" + r.id] || [];
      return `<div class="sig"><b>${esc(r.name)}</b> <small>×${r.growth.toFixed(2)}</small><div class="chips">${L.map(a => `<span class="chip">${esc(a.name)} · ${a.papers}</span>`).join("") || '<span class="chip">—</span>'}</div></div>`; }).join(""); };
  $("cseg").onclick = e => { const x = e.target.closest("button"); if (!x) return; document.querySelectorAll("#cseg button").forEach(y => y.classList.toggle("on", y === x)); draw(x.dataset.k); };
  draw("Disease");
}
function igaps(d, pane) {
  const G = d.gaps, th = G.themes.filter(t => t.id !== "other"), M = G.matrix, lab = {}; th.forEach(t => lab[t.id] = t.label);
  pane.innerHTML = `<div class="box"><h2>다음에 해야 할 연구 (자동 우선순위)</h2><p class="hint">관심 증가 · 논문끼리 엇갈림 · 저자들이 직접 쓴 한계 · MINERVA에 없는 새 연결을 합친 점수 · 점수는 방향을 제시할 뿐 판단이 아닙니다</p><div class="cards" id="next"></div></div>
    <div class="row2"><div class="box"><h2>질병별로 저자들이 털어놓은 한계</h2><p class="hint">논문의 limitation · gap 문장을 주제로 분류 · 칸 숫자 = 논문 수</p><div class="big" id="gm" style="height:640px"></div></div>
    <div class="box"><h2>가장 자주 나오는 한계</h2><div class="mid" id="gt"></div><div id="gq" class="scroll" style="max-height:250px"></div></div></div>`;
  $("next").innerHTML = d.next.slice(0, 12).map((c, i) => { const s = c.signals;
    return `<div class="ncard"><div class="nrank">${i + 1}</div><h3>${esc(c.label)}</h3>
      <div class="chips"><span class="chip" style="color:${s.growth >= 1.2 ? C.lime : s.growth < 0.9 ? C.coral : C.muted}">관심 ×${s.growth}</span><span class="chip" style="color:${s.contradictions ? MIX : C.muted}">논쟁 ${s.contradictions}</span>
      <span class="chip">한계 진술 ${s.gap_statements}</span><span class="chip">논문 ${fmt(s.papers)}</span>${s.new_vs_minerva ? `<span class="chip" style="color:var(--lime)">새 연결 ${s.new_vs_minerva}</span>` : ""}</div>
      ${c.top_gaps.length ? `<p><b>채워야 할 것:</b> ${c.top_gaps.map(esc).join(" · ")}</p>` : ""}
      ${c.contested.length ? `<p><b>결론이 갈리는 미생물:</b> <i>${c.contested.map(esc).join(", ")}</i></p>` : ""}
      ${c.emerging.length ? `<p><b>새로 떠오른 연결:</b> <i>${c.emerging.map(esc).join(", ")}</i></p>` : ""}</div>`; }).join("");
  const data = []; M.values.forEach((row, y) => row.forEach((v, x) => v && data.push([x, y, v])));
  chart("gm", {grid: {left: 150, right: 10, top: 10, bottom: 120}, tooltip: {formatter: p => `${esc(M.diseases[p.data[1]].label)} · ${esc(lab[M.themes[p.data[0]]])}<br>논문 ${p.data[2]}`},
    xAxis: {type: "category", data: M.themes.map(t => lab[t] || t), axisLabel: {color: C.muted, rotate: 40, fontSize: 11}},
    yAxis: {type: "category", inverse: true, data: M.diseases.map(x => x.label), axisLabel: {color: C.text, fontSize: 11}},
    visualMap: {min: 0, max: Math.max(...data.map(x => x[2]), 1), show: false, inRange: {color: ["#0d1530", "#5b21b6", C.violet, "#f0abfc"]}},
    series: [{type: "heatmap", data, label: {show: true, color: "#f1f5f9", fontSize: 10}, itemStyle: {borderColor: "#04070f", borderWidth: 2, borderRadius: 4}}]});
  const gt = chart("gt", {grid: {left: 190, right: 40, top: 10, bottom: 20}, tooltip: {}, xAxis: {type: "value", axisLabel: {color: C.dim}, splitLine: {lineStyle: {color: C.line}}},
    yAxis: {type: "category", inverse: true, data: th.map(t => t.label), axisLabel: {color: C.text}},
    series: [{type: "bar", data: th.map(t => t.papers), itemStyle: {color: C.violet, borderRadius: [0, 6, 6, 0]}, label: {show: true, position: "right", color: C.muted}}]});
  const q = i => { $("gq").innerHTML = `<p class="hint">${esc(th[i].label)} — 예시</p>` + th[i].examples.map(quoteCard).join(""); };
  gt.on("click", p => q(p.dataIndex)); q(0);
}
function inovel(d, pane) {
  if (!d.minerva_compared) {
    pane.innerHTML = `<div class="box"><h2>MINERVA 대비 새 연결</h2><p>MINERVA 지식 그래프의 미생물·질병 전체 어휘와 방향 관계를 아직 받지 않았습니다.
      MINERVA 에이전트가 다음 실행 때 자동으로 받아 오고, 그다음 그래프 재생성(3시간마다)부터 이 화면이 채워집니다.</p>
      <p class="hint">비교 방식: 우리 논문에서 3편 이상이 같은 방향으로 보고했지만 MINERVA의 미생물→질병 관계에는 없는 쌍 = '새로 떠오르는 지식'. MINERVA와 방향이 반대인 쌍도 따로 표시합니다.</p></div>`;
    return;
  }
  const opp = d.consensus.filter(p => p.minerva_agrees === false), A = d.minerva_agreement || {};
  pane.innerHTML = `<div class="kpis"><div class="kpi"><b>${fmt(A.minerva_pairs)}</b><span>MINERVA 미생물→질병 관계</span></div>
      <div class="kpi"><b>${A.compared ? Math.round(100 * A.agree / A.compared) + "%" : "—"}</b><span>우리 합의 관계 중 MINERVA와 같은 방향 (${fmt(A.agree)}/${fmt(A.compared)})</span></div>
      <div class="kpi"><b>${fmt((d.novel || []).length)}</b><span>MINERVA에 없는 새 연결</span></div>
      <div class="kpi"><b>${fmt(opp.length)}</b><span>방향이 반대인 연결</span></div>
      <div class="kpi"><b>${fmt((A.diseases_unmapped_in_minerva || []).length)}</b><span>MINERVA에 대응 질병이 없는 분류</span></div></div>
    <div class="row2"><div class="box"><h2>MINERVA에 아직 없는 연결</h2><p class="hint">우리 코퍼스에서 3편 이상 같은 방향 · MINERVA 미생물→질병 관계에는 없음 · 질병 이름 대응은 자동이라 일부는 표기 차이일 수 있어 확인이 필요합니다 · 행을 누르면 근거</p><div class="scroll" id="nv">${pairTable(d.novel || [], true)}</div></div>
    <div class="box"><h2>MINERVA와 방향이 반대인 연결</h2><p class="hint">새 논문들이 기존 지식과 다른 방향을 말하는 경우 · 재검토 후보</p><div class="scroll">${pairTable(opp, true)}</div></div></div>
    <div class="box" id="ev"><h2>근거 문장</h2></div>`;
  $("nv").onclick = e => { const t = e.target.closest("tr[data-i]"); if (!t) return; const p = d.novel[+t.dataset.i];
    $("ev").innerHTML = `<h2><i>${esc(p.taxon)}</i> · ${esc(p.disease_label)}</h2><div class="row2">${(p.examples || []).map(quoteCard).join("")}</div>`; };
}

document.addEventListener("mousemove", e => { const t = e.target.closest && e.target.closest("[data-tip]"), tip = $("tip");
  if (!t) { tip.style.display = "none"; return; } tip.textContent = t.dataset.tip; tip.style.display = "block"; tip.style.left = (e.clientX + 12) + "px"; tip.style.top = (e.clientY + 12) + "px"; });

const LIVE = {backfill, agents}, SNAP = {people, radar, findings, world, gaps, minerva};
if (mod === "insights") {
  get("/api/site/msage/insights", window.MSAGE_INSIGHTS).then(d => { insights(d); $("fresh").textContent = `지식 그래프 기준 ${d.as_of} · 논문 ${fmt((d.build || {}).papers_read)}편${STATIC ? " · 스냅샷 버전 " + STATIC.release : " · 3시간마다 재생성"}`; })
    .catch(e => { $("view").innerHTML = `<div class="box">지식 그래프가 아직 없습니다 (${esc(e)}). 첫 생성은 몇 분 걸립니다.</div>`; });
} else if (LIVE[mod]) {
  const tick = () => get("/api/site/msage/live", window.MSAGE_LIVE).then(v => { charts.splice(0).forEach(c => c.dispose()); LIVE[mod](v);
    $("fresh").textContent = (v.supervisor.state === "running" ? "모든 작업 진행 중" : v.supervisor.state || "") + " · 30초마다 갱신"; }).catch(() => {});
  tick(); if (!window.MSAGE_LIVE) setInterval(tick, 30000);
} else {
  get("/api/site/msage", window.MSAGE_DATA).then(d => { SNAP[mod](d); $("fresh").textContent = `분석 기준 ${d.as_of} · 논문 ${fmt(d.papers)}편`; })
    .catch(e => { $("view").innerHTML = `<div class="box">자료를 불러오지 못했습니다: ${esc(e)}</div>`; });
}
})();
