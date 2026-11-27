/* M-SAGE suite bar: one header for the cockpit, the one-page story and the insight lab, in MINERVA's family look.
 *
 * Row 1 (host bar) = the MINERVA navigation with M-SAGE as the first item, so M-SAGE reads as part of MINERVA:
 *   MINERVA · M-SAGE · ENTITY ANALYSIS · GRAPH ANALYSIS · GUILDS ANALYSIS · BIOMETRAIL
 *   Hidden when the page is shown inside MINERVA (iframe or ?embed=1): MINERVA's own header is above it then.
 * Row 2 (suite bar) = M-SAGE's own three views: COCKPIT (first) · ONE-PAGE STORY · INSIGHT LAB.
 *
 * Settings (all optional), set before this script:
 *   window.MSAGE_ROUTES = {cockpit, story, module}     page addresses (packaged site: cockpit.html, story.html, module.html)
 *   window.MSAGE_HOST   = {name, home, links:[{label, href}], hidden}   the host navigation; default = MINERVA
 *     (can also be set later, e.g. in assets/custom.js, followed by window.MSAGE_SUITE.render())
 *   window.MSAGE_MESSAGES = [{date, type: info|new|warning, ko, en, it, fr, link, until, pages}]   announcements (messages.js);
 *     `it` (Italian) and `fr` (French) are optional and fall back to `en`, then `ko`
 * Language follows the pages' own 한국어/English/Italiano/Français switch (localStorage msage.lang, <html lang>).
 */
(function () {
  "use strict";
  var ROUTE = window.MSAGE_ROUTES || {cockpit: "/cockpit", story: "/story", module: "/cockpit/module"};
  var M = "https://minervabio.org";
  var MINERVA = {name: "MINERVA", home: M + "/", links: [
    {label: "Entity Analysis", href: M + "/analysis"}, {label: "Graph Analysis", href: M + "/graph-analysis"},
    {label: "Guilds Analysis", href: M + "/guilds-analysis"}, {label: "BiomeTrail", href: M + "/biometrail"}],
    side: [{label: "Projection", href: M + "/landscape"}, {label: "Wiki", href: M + "/wiki"},
           {label: "Legacy Web App", href: M + "/legacy/", pill: true}, {label: "Sign in", href: M + "/login", pill: true, strong: true}]};
  var qs = new URLSearchParams(location.search);
  var embedded = qs.get("embed") === "1" || qs.get("embed") === "minerva" || (function () { try { return window.self !== window.top; } catch (e) { return true; } })();
  var T = {
    ko: {cockpit: "조종석", story: "한 페이지 이야기", lab: "인사이트 랩", tag: "AI가 읽은 마이크로바이옴 근거",
         cockpitTip: "실시간 계기판: 지금 무엇이 읽히고 무엇이 떠오르는지", storyTip: "모든 발견을 한 페이지에 쭉", labTip: "지식 그래프 분석: 합의·논쟁·추세·공백"},
    en: {cockpit: "Cockpit", story: "One-page story", lab: "Insight lab", tag: "Microbiome evidence, read by AI",
         cockpitTip: "Live instruments: what is being read and what is rising", storyTip: "Every finding on one long page", labTip: "Knowledge-graph analysis: consensus, debate, trends, gaps"},
    it: {cockpit: "Cruscotto", story: "Storia in una pagina", lab: "Laboratorio di analisi", tag: "Evidenze sul microbioma, lette dall'IA",
         cockpitTip: "Strumenti in tempo reale: cosa si sta leggendo e cosa è in crescita", storyTip: "Tutti i risultati in un'unica lunga pagina", labTip: "Analisi del grafo della conoscenza: consenso, dibattito, tendenze, lacune"},
    fr: {cockpit: "Tableau de bord", story: "Récit en une page", lab: "Laboratoire d'analyse", tag: "Les preuves sur le microbiome, lues par l'IA",
         cockpitTip: "Instruments en direct : ce qui est lu et ce qui monte", storyTip: "Tous les résultats sur une seule longue page", labTip: "Analyse du graphe de connaissances : consensus, débats, tendances, lacunes"}};
  function lang() {
    // the pages set <html lang> from ?lang=, the stored choice or the default, so it wins; the stored choice is only a fallback
    var l = document.documentElement.lang || "";
    if (!/^(ko|en|it|fr)/.test(l)) try { l = localStorage.getItem("msage.lang") || l; } catch (e) {}
    return /^en/.test(l) ? "en" : /^it/.test(l) ? "it" : /^fr/.test(l) ? "fr" : "ko";
  }
  function current() {
    var b = document.body.getAttribute("data-suite");
    if (b) return b;
    var p = location.pathname;
    if (/story/.test(p)) return "story";
    if (/module/.test(p)) return "lab";
    return "cockpit";
  }
  function esc(t) { return String(t).replace(/[&<>"]/g, function (c) { return {"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;"}[c]; }); }
  function render() {
    var t = T[lang()], cur = current(), el = document.getElementById("msage-suite"), HOST = window.MSAGE_HOST || MINERVA;
    if (!el) { el = document.createElement("div"); el.id = "msage-suite"; document.body.insertBefore(el, document.body.firstChild); }
    var host = "";
    if (!embedded && !HOST.hidden) {
      host = '<div class="ms-host"><a class="ms-host-logo" href="' + esc(HOST.home) + '"><span class="ms-dna">🧬</span>' + esc(HOST.name) + '</a>' +
        '<nav class="ms-host-nav" aria-label="' + esc(HOST.name) + '"><a class="on" href="' + esc(ROUTE.cockpit) + '" aria-current="page">M-SAGE</a>' +
        HOST.links.map(function (l) { return '<a href="' + esc(l.href) + '">' + esc(l.label) + "</a>"; }).join("") + "</nav>" +
        '<div class="ms-host-side">' + (HOST.side || []).map(function (l) {
          return '<a class="' + (l.pill ? "pill" : "") + (l.strong ? " strong" : "") + '" href="' + esc(l.href) + '">' + esc(l.label) + "</a>"; }).join("") + "</div></div>";
    }
    var tabs = [["cockpit", ROUTE.cockpit, "◎", t.cockpit, t.cockpitTip], ["story", ROUTE.story, "≡", t.story, t.storyTip],
                ["lab", ROUTE.module + "?m=insights", "✦", t.lab, t.labTip]];
    el.innerHTML = host + '<div class="ms-suite"><a class="ms-brand" href="' + esc(ROUTE.cockpit) + '"><b>M-SAGE</b><span>' + esc(t.tag) + "</span></a>" +
      '<nav class="ms-tabs" aria-label="M-SAGE">' + tabs.map(function (x) {
        return '<a class="ms-tab' + (x[0] === cur ? " on" : "") + '" href="' + esc(x[1]) + '" title="' + esc(x[4]) + '"' + (x[0] === cur ? ' aria-current="page"' : "") +
          '><i aria-hidden="true">' + x[2] + "</i>" + esc(x[3]) + "</a>"; }).join("") + "</nav></div>";
    el.innerHTML += messages(cur);
    document.documentElement.classList.toggle("ms-embedded", !!embedded);
    help();
  }
  /* reading-level help: a "?" next to the ELI10 · ELI20 · PRO switch (#sw-level) on every page, plus tooltips on the level buttons.
     Any element with [data-ms-help] (e.g. the story's "How to read this page") opens the same help. */
  var H = {
    ko: {btn: "읽기 수준 도움말", close: "닫기", h: "ELI10 · ELI20 · PRO가 뭐예요?",
         intro: "ELI는 영어 ‘Explain Like I'm …’(내가 …살이라고 생각하고 설명해 줘)의 줄임말이에요. 같은 내용을 얼마나 쉽게, 또는 얼마나 자세히 설명할지 고르는 버튼입니다.",
         eli10: "10살 어린이에게 설명하듯: 일상적인 말, 짧은 문장, 어려운 용어 없이.",
         eli20: "대학생에게 설명하듯: 무엇을 찾았는지, 왜 중요한지, 무엇이 아직 불확실한지.",
         pro: "연구자용: 정확한 정의, 기준값, 계산식, 숫자와 한계를 그대로.",
         same: "어느 단계를 골라도 데이터와 결과는 똑같아요. 설명하는 말만 달라집니다.",
         how: "사용 방법",
         use: ["단계 버튼을 누르면 바로 바뀌어요. 고른 단계는 이 기기에 기억되어 조종석, 한 페이지 이야기, 인사이트 랩에서 똑같이 쓰입니다.",
               "언어 버튼({langs})도 똑같이 동작해요.",
               "링크에 미리 정해 둘 수도 있어요: ?lang=ko|en|it|fr&level=eli10|eli20|pro — 예:"],
         note: "모든 내용은 AI가 논문 초록에서 자동으로 뽑은 것이에요. ‘함께 나타난다’는 관계이지 원인과 결과가 아닙니다.",
         tips: {eli10: "ELI10 · 10살에게 설명하듯: 쉬운 말, 짧은 문장", eli20: "ELI20 · 대학생에게 설명하듯: 무엇을 찾았고, 왜 중요하고, 무엇이 불확실한지", pro: "PRO · 연구자용: 정확한 정의, 기준값, 계산식, 숫자, 한계"}},
    en: {btn: "Help with reading levels", close: "Close", h: "What do ELI10, ELI20 and PRO mean?",
         intro: "ELI stands for “Explain Like I'm …”. These buttons choose how simply, or how deeply, the same content is explained.",
         eli10: "Explain Like I'm 10: everyday words, short sentences, no jargon.",
         eli20: "Like explaining to a university student: what was found, why it matters and what is still uncertain.",
         pro: "For researchers: exact definitions, thresholds, formulas, counts and caveats.",
         same: "Every level shows the same data and the same results. Only the explanation changes.",
         how: "How to use it",
         use: ["Tap a level button to switch. Your choice is remembered on this device across the cockpit, the one-page story and the insight lab.",
               "The language buttons ({langs}) work the same way.",
               "A link can preset both: ?lang=ko|en|it|fr&level=eli10|eli20|pro — for example:"],
         note: "Everything here is machine-extracted from paper abstracts. It shows associations, not cause and effect.",
         tips: {eli10: "ELI10 · Explain Like I'm 10: everyday words, short sentences", eli20: "ELI20 · Like a university student: what was found, why it matters, what is uncertain", pro: "PRO · For researchers: exact definitions, thresholds, formulas, counts, caveats"}},
    it: {btn: "Aiuto sui livelli di lettura", close: "Chiudi", h: "Cosa significano ELI10, ELI20 e PRO?",
         intro: "ELI sta per “Explain Like I'm …”, cioè “spiegamelo come se avessi … anni”. Questi pulsanti scelgono quanto semplice, o quanto approfondita, sia la spiegazione degli stessi contenuti.",
         eli10: "Come a un bambino di 10 anni: parole di tutti i giorni, frasi brevi, niente gergo.",
         eli20: "Come a uno studente universitario: cosa è stato trovato, perché è importante e cosa resta incerto.",
         pro: "Per chi fa ricerca: definizioni esatte, soglie, formule, conteggi e limiti.",
         same: "A ogni livello vedi gli stessi dati e gli stessi risultati. Cambia solo la spiegazione.",
         how: "Come si usa",
         use: ["Tocca un pulsante di livello per cambiarlo. La scelta resta memorizzata su questo dispositivo nel cruscotto, nella storia in una pagina e nel laboratorio di analisi.",
               "I pulsanti della lingua ({langs}) funzionano allo stesso modo.",
               "Un link può impostarli in anticipo: ?lang=ko|en|it|fr&level=eli10|eli20|pro — per esempio:"],
         note: "Tutto è estratto automaticamente dagli abstract degli articoli: mostra associazioni, non rapporti di causa ed effetto.",
         tips: {eli10: "ELI10 · Come a un bambino di 10 anni: parole semplici, frasi brevi", eli20: "ELI20 · Come a uno studente universitario: cosa è emerso, perché conta, cosa è incerto", pro: "PRO · Per chi fa ricerca: definizioni esatte, soglie, formule, conteggi, limiti"}},
    fr: {btn: "Aide sur les niveaux de lecture", close: "Fermer", h: "Que veulent dire ELI10, ELI20 et PRO ?",
         intro: "ELI vient de l'anglais « Explain Like I'm … », c'est-à-dire « explique-moi comme si j'avais … ans ». Ces boutons choisissent si le même contenu est expliqué simplement ou en détail.",
         eli10: "Comme à un enfant de 10 ans : des mots de tous les jours, des phrases courtes, pas de jargon.",
         eli20: "Comme à un étudiant à l'université : ce qui a été trouvé, pourquoi c'est important et ce qui reste incertain.",
         pro: "Pour les chercheurs : définitions exactes, seuils, formules, effectifs et limites.",
         same: "À chaque niveau, les données et les résultats sont les mêmes. Seule l'explication change.",
         how: "Mode d'emploi",
         use: ["Touchez un bouton de niveau pour changer. Votre choix est mémorisé sur cet appareil, dans le tableau de bord, le récit en une page et le laboratoire d'analyse.",
               "Les boutons de langue ({langs}) fonctionnent de la même façon.",
               "Un lien peut les prérégler : ?lang=ko|en|it|fr&level=eli10|eli20|pro — par exemple :"],
         note: "Tout est extrait automatiquement des résumés d'articles : ce sont des associations, pas des relations de cause à effet.",
         tips: {eli10: "ELI10 · Comme à un enfant de 10 ans : mots simples, phrases courtes", eli20: "ELI20 · Comme à un étudiant : ce qui a été trouvé, pourquoi c'est important, ce qui reste incertain", pro: "PRO · Pour les chercheurs : définitions exactes, seuils, formules, effectifs, limites"}}};
  var helpFrom = null;                                   // the element that opened the help, to give focus back
  function help() {
    var t = H[lang()], sw = document.getElementById("sw-level");
    if (sw) {
      Array.prototype.forEach.call(sw.querySelectorAll("button[data-v]"), function (b) { if (t.tips[b.getAttribute("data-v")]) b.title = t.tips[b.getAttribute("data-v")]; });
      var btn = document.getElementById("ms-help-btn");
      if (!btn) { btn = document.createElement("button"); btn.type = "button"; btn.id = "ms-help-btn"; btn.className = "ms-help-btn"; btn.textContent = "?";
        btn.setAttribute("aria-haspopup", "dialog"); btn.setAttribute("aria-controls", "ms-help"); btn.setAttribute("aria-expanded", "false");
        sw.parentNode.insertBefore(btn, sw.nextSibling); }
      btn.title = t.btn; btn.setAttribute("aria-label", t.btn);
    }
    var box = document.getElementById("ms-help");
    if (!box) { box = document.createElement("div"); box.id = "ms-help"; box.className = "ms-help"; box.hidden = true;
      box.setAttribute("role", "dialog"); box.setAttribute("aria-modal", "false"); box.setAttribute("aria-labelledby", "ms-help-h"); box.tabIndex = -1;
      document.body.appendChild(box); }
    var ex = ROUTE.story + (ROUTE.story.indexOf("?") < 0 ? "?" : "&") + "lang=" + (lang() === "en" ? "it" : "en") + "&level=eli10";
    box.setAttribute("lang", lang());
    box.innerHTML = '<button type="button" class="ms-help-x" aria-label="' + esc(t.close) + '" title="' + esc(t.close) + '">×</button>' +
      '<h2 id="ms-help-h">' + esc(t.h) + "</h2><p>" + esc(t.intro) + "</p>" +
      '<dl class="ms-help-lv">' + ["eli10", "eli20", "pro"].map(function (k) {
        return '<div data-v="' + k + '"><dt>' + k.toUpperCase() + "</dt><dd>" + esc(t[k]) + "</dd></div>"; }).join("") + "</dl>" +
      '<p class="ms-help-same">' + esc(t.same) + "</p><h3>" + esc(t.how) + "</h3><ul>" +
      t.use.map(function (u, i) { return "<li>" + esc(u).replace("{langs}", '<span class="ms-langnames">한국어 · English · Italiano · Français</span>') + (i === 2 ? ' <a href="' + esc(ex) + '"><code>' + esc(ex.replace(/^.*\//, "")) + "</code></a>" : "") + "</li>"; }).join("") +
      '</ul><p class="ms-help-note">' + esc(t.note) + "</p>";
    if (!box.hidden) mark(box);
  }
  function mark(box) {                                   // highlight the level the page shows now
    var on = document.querySelector("#sw-level button.on"), v = on && on.getAttribute("data-v");
    Array.prototype.forEach.call(box.querySelectorAll(".ms-help-lv > div"), function (d) { d.classList.toggle("on", d.getAttribute("data-v") === v); });
  }
  function place(box, from) {
    var r = from && from.getBoundingClientRect ? from.getBoundingClientRect() : null, vw = window.innerWidth || 360;
    var top = r && r.bottom ? Math.max(8, Math.round(r.bottom + 8)) : 64;
    box.style.top = top + "px";
    box.style.maxHeight = "calc(100vh - " + (top + 12) + "px)";
    // under the button, kept inside the window (phones: 16px gutters, full width)
    var w = Math.min(400, vw - 32), right = r && r.right ? Math.round(vw - r.right) : 16;
    box.style.right = Math.max(16, Math.min(right, vw - 16 - w)) + "px";
    box.style.left = "auto";
  }
  function openHelp(from) {
    var box = document.getElementById("ms-help"); if (!box) return;
    helpFrom = from || null; help(); place(box, from && from.id === "ms-help-btn" ? from : document.getElementById("ms-help-btn") || from);
    box.hidden = false; mark(box);
    var b = document.getElementById("ms-help-btn"); if (b) b.setAttribute("aria-expanded", "true");
    try { box.focus(); } catch (e) {}
  }
  function closeHelp(back) {
    var box = document.getElementById("ms-help"); if (!box || box.hidden) return;
    box.hidden = true;
    var b = document.getElementById("ms-help-btn"); if (b) b.setAttribute("aria-expanded", "false");
    if (back && helpFrom && helpFrom.focus) try { helpFrom.focus(); } catch (e) {}
  }
  document.addEventListener("click", function (e) {
    var t = e.target, box = document.getElementById("ms-help");
    var opener = t.closest && t.closest("#ms-help-btn, [data-ms-help]");
    if (opener) { e.preventDefault(); if (box && !box.hidden && opener.id === "ms-help-btn") closeHelp(false); else openHelp(opener); return; }
    if (t.closest && t.closest(".ms-help-x")) { closeHelp(true); return; }
    if (box && !box.hidden && !(t.closest && t.closest("#ms-help"))) closeHelp(false);   // click outside
  });
  document.addEventListener("keydown", function (e) {
    if ((e.key === "Escape" || e.key === "Esc") && document.getElementById("ms-help") && !document.getElementById("ms-help").hidden) { e.preventDefault(); closeHelp(true); }
  });
  window.addEventListener("resize", function () { var box = document.getElementById("ms-help"); if (box && !box.hidden) place(box, document.getElementById("ms-help-btn") || helpFrom); });
  /* announcements: window.MSAGE_MESSAGES from messages.js (edited by the team, kept across updates) */
  var DISMISS = "msage.dismissed";
  function dismissed() { try { return JSON.parse(localStorage.getItem(DISMISS) || "[]"); } catch (e) { return []; } }
  function messages(cur) {
    var list = Array.isArray(window.MSAGE_MESSAGES) ? window.MSAGE_MESSAGES : [], l = lang(), today = new Date().toISOString().slice(0, 10), gone = dismissed();
    var shown = list.filter(function (m) {
      if (!m || !(m.ko || m.en || m.it || m.fr)) return false;
      if (m.until && String(m.until) < today) return false;
      if (Array.isArray(m.pages) && m.pages.length && m.pages.indexOf(cur) < 0) return false;
      return gone.indexOf(key(m)) < 0;
    });
    if (!shown.length) return "";
    var more = {ko: "자세히", en: "More", it: "Dettagli", fr: "En savoir plus"}[l], close = {ko: "닫기", en: "Dismiss", it: "Chiudi", fr: "Fermer"}[l];
    return '<div class="ms-msgs" role="region" aria-label="' + {ko: "공지", en: "Announcements", it: "Avvisi", fr: "Annonces"}[l] + '">' + shown.map(function (m) {
      var type = {"new": "new", warning: "warning"}[m.type] || "info",
        text = l === "it" || l === "fr" ? (m[l] || m.en || m.ko) : l === "en" ? (m.en || m.ko || m.it || m.fr) : (m.ko || m.en || m.it || m.fr);
      return '<div class="ms-msg ' + type + '"><i aria-hidden="true">' + {info: "ℹ", "new": "✦", warning: "!"}[type] + "</i><span>" +
        (m.date ? '<em>' + esc(m.date) + "</em>" : "") + esc(text) + (m.link ? ' <a href="' + esc(m.link) + '">' + more + " →</a>" : "") +
        '</span><button type="button" data-key="' + esc(key(m)) + '" aria-label="' + close + '">×</button></div>'; }).join("") + "</div>";
  }
  function key(m) { return String(m.id || ((m.date || "") + "|" + (m.ko || m.en || m.it || m.fr || "")).slice(0, 120)); }
  document.addEventListener("click", function (e) {
    var b = e.target.closest && e.target.closest(".ms-msg button"); if (!b) return;
    var gone = dismissed(); gone.push(b.getAttribute("data-key"));
    try { localStorage.setItem(DISMISS, JSON.stringify(gone.slice(-50))); } catch (err) {}
    b.parentNode.remove();
  });
  function start() {
    render();
    // follow the page's language switch (the pages set <html lang> when it changes)
    new MutationObserver(render).observe(document.documentElement, {attributes: true, attributeFilter: ["lang"]});
  }

  /* Operations text from the engine (agent cards) is written in Korean; translate its fixed vocabulary.
     MSAGE_OPS(text, lang) -> text in ko|en|it|fr; unknown Korean pieces are left as they are. */
  var OPS_NAMES = {
    collector: [["수집 에이전트", "Collection agent", "Agente di raccolta", "Agent de collecte"], ["Europe PMC에서 최신·과거 논문 수집", "Collects new and past papers from Europe PMC", "Raccoglie articoli nuovi e passati da Europe PMC", "Collecte les articles récents et anciens sur Europe PMC"]],
    reader: [["초록 판독 에이전트", "Abstract reading agent", "Agente di lettura degli abstract", "Agent de lecture des résumés"], ["AI가 초록을 읽고 원문 문장과 대조", "AI reads abstracts and checks them against the source sentences", "L'IA legge gli abstract e li confronta con le frasi originali", "L'IA lit les résumés et les compare aux phrases sources"]],
    knowledge: [["지식 에이전트", "Knowledge agent", "Agente della conoscenza", "Agent de connaissances"], ["근거를 묶어 지식·전제·공백·아이디어 갱신", "Groups evidence to update knowledge, premises, gaps and ideas", "Raggruppa le evidenze per aggiornare conoscenze, premesse, lacune e idee", "Regroupe les preuves pour mettre à jour connaissances, hypothèses, lacunes et idées"]],
    evidence: [["근거 에이전트", "Evidence agent", "Agente delle evidenze", "Agent des preuves"], ["원문 근거 정규화·추출 (제품 우선 모드에서는 대기)", "Normalises and extracts source evidence (waits in product-first mode)", "Normalizza ed estrae le evidenze dalle fonti (in attesa in modalità prodotto)", "Normalise et extrait les preuves des sources (en attente en mode produit)"]],
    graph: [["그래프 감사 에이전트", "Graph audit agent", "Agente di verifica del grafo", "Agent d'audit du graphe"], ["판독 결과를 그래프 입력으로 재검증", "Re-checks readings before they enter the graph", "Riverifica le letture prima che entrino nel grafo", "Revérifie les lectures avant leur entrée dans le graphe"]],
    painter: [["화면 에이전트", "Display agent", "Agente di visualizzazione", "Agent d'affichage"], ["새 자료로 조종석 분석 그림을 다시 그림", "Redraws the cockpit charts with new data", "Ridisegna i grafici del cruscotto con i nuovi dati", "Redessine les graphiques du tableau de bord avec les nouvelles données"]],
    keeper: [["정리 에이전트", "Housekeeping agent", "Agente di riordino", "Agent de rangement"], ["읽지 않는 이력을 외장으로 옮겨 내장을 가볍게", "Moves unused history to the external drive to keep the internal disk light", "Sposta lo storico non usato sul disco esterno per alleggerire quello interno", "Déplace l'historique inutilisé vers le disque externe pour alléger le disque interne"]],
    verifier: [["검증 에이전트", "Verification agent", "Agente di verifica", "Agent de vérification"], ["코드가 바뀌면 전체 검증 후 재가동", "After a code change, runs the full checks and restarts", "Dopo una modifica al codice esegue tutti i controlli e riavvia", "Après un changement de code, lance toutes les vérifications puis redémarre"]],
    steward: [["관리 에이전트", "Steward agent", "Agente custode", "Agent intendant"], ["DB 백업·무결성, 중복 판독 감시, 페이지 점검, 월간 웹사이트 패키지", "Database backups and integrity, duplicate-reading watch, page checks, monthly website package", "Backup e integrità del database, controllo delle letture duplicate, verifica delle pagine, pacchetto mensile del sito", "Sauvegardes et intégrité de la base, surveillance des lectures en double, contrôle des pages, paquet mensuel du site"]],
    graph_builder: [["지식 그래프 에이전트", "Knowledge graph agent", "Agente del grafo di conoscenza", "Agent du graphe de connaissances"], ["판독 결과로 미생물·질병·개입 그래프와 인사이트 생성", "Builds the microbe–condition–intervention graph and insights from the readings", "Costruisce dal materiale letto il grafo microbi–malattie–interventi e le analisi", "Construit à partir des lectures le graphe microbes–maladies–interventions et les analyses"]],
    minerva: [["MINERVA 에이전트", "MINERVA agent", "Agente MINERVA", "Agent MINERVA"], ["MINERVA 4개 그래프 전체를 한 번 복사 (평소에는 접속 안 함)", "Copied all four MINERVA graphs once (no routine connection)", "Ha copiato una volta tutti e quattro i grafi di MINERVA (nessuna connessione abituale)", "A copié une fois les quatre graphes de MINERVA (aucune connexion habituelle)"]]};
  var OPS_RULES = [   // [regex on one " · " piece, en, it, fr] with $1.. placeholders
    [/^멈춤 의심: 마지막 수집 (\d+)분 전$/, "Possibly stalled: last collection $1 min ago", "Possibile blocco: ultima raccolta $1 min fa", "Blocage possible : dernière collecte il y a $1 min"],
    [/^공급처 응답 지연$/, "Source responding slowly", "La fonte risponde lentamente", "La source répond lentement"],
    [/^재시도$/, "retrying", "nuovo tentativo", "nouvel essai"],
    [/^범위 (\S+)~(\S+)$/, "Range $1–$2", "Intervallo $1–$2", "Plage $1–$2"],
    [/^대기$/, "waiting", "in attesa", "en attente"],
    [/^논문 판독(.*)$/, "Reading papers$1", "Lettura degli articoli$1", "Lecture des articles$1"],
    [/^어려운 초록 재판독(.*)$/, "Re-reading difficult abstracts$1", "Rilettura degli abstract difficili$1", "Relecture des résumés difficiles$1"],
    [/^묶음 종합(.*)$/, "Batch synthesis$1", "Sintesi per gruppi$1", "Synthèse par lots$1"],
    [/^대기열 정리(.*)$/, "Tidying the queue$1", "Riordino della coda$1", "Rangement de la file$1"],
    [/^(\S+)쪽\/시간$/, "$1 pages/hour", "$1 pagine/ora", "$1 pages/heure"],
    [/^(\S+)편\/시간$/, "$1 papers/hour", "$1 articoli/ora", "$1 articles/heure"],
    [/^작업자 (\S+)$/, "$1 workers", "$1 processi", "$1 processus"],
    [/^마지막 릴리스 (\d+)분 전$/, "last release $1 min ago", "ultimo rilascio $1 min fa", "dernière version il y a $1 min"],
    [/^마지막 생성 (\d+)분 전$/, "last built $1 min ago", "ultima costruzione $1 min fa", "dernière construction il y a $1 min"],
    [/^마지막 (\d+)분 전$/, "last run $1 min ago", "ultima esecuzione $1 min fa", "dernière exécution il y a $1 min"],
    [/^첫 생성 대기$/, "waiting for the first build", "in attesa della prima costruzione", "en attente de la première construction"],
    [/^첫 점검 대기$/, "waiting for the first check", "in attesa del primo controllo", "en attente du premier contrôle"],
    [/^제품 완성 우선$/, "product first", "priorità al prodotto", "priorité au produit"],
    [/^추가 논문 처리 대기$/, "more papers on hold", "altri articoli in attesa", "autres articles en attente"],
    [/^완료 (\S+)$/, "$1 done", "$1 completati", "$1 terminés"],
    [/^새 판독이 쌓이면 재검증$/, "re-checks when new readings accumulate", "riverifica quando si accumulano nuove letture", "revérifie quand de nouvelles lectures s'accumulent"],
    [/^다시 그리는 중$/, "redrawing", "ridisegno in corso", "redessin en cours"],
    [/^다음 확인 대기$/, "waiting for the next check", "in attesa del prossimo controllo", "en attente du prochain contrôle"],
    [/^기준 (\S+)편$/, "based on $1 papers", "su $1 articoli", "sur $1 articles"],
    [/^6시간마다 정리$/, "tidies every 6 hours", "riordina ogni 6 ore", "range toutes les 6 heures"],
    [/^최근 (\S+)건 이동$/, "$1 items moved recently", "$1 elementi spostati di recente", "$1 éléments déplacés récemment"],
    [/^정상 (\d+)$/, "$1 ok", "$1 ok", "$1 ok"],
    [/^주의 (\d+)$/, "$1 caution", "$1 attenzione", "$1 vigilance"],
    [/^조치 (\d+)$/, "$1 action", "$1 da fare", "$1 à traiter"],
    [/^논문 (\S+)$/, "$1 papers", "$1 articoli", "$1 articles"],
    [/^관계 (\S+)행$/, "$1 relation rows", "$1 righe di relazioni", "$1 lignes de relations"],
    [/^관계 (\S+)$/, "$1 relations", "$1 relazioni", "$1 relations"],
    [/^Neo4j 적재 확인$/, "Neo4j load verified", "caricamento Neo4j verificato", "chargement Neo4j vérifié"],
    [/^Neo4j 개수 불일치$/, "Neo4j counts differ", "conteggi Neo4j diversi", "décomptes Neo4j différents"],
    [/^Neo4j 적재 실패$/, "Neo4j load failed", "caricamento Neo4j non riuscito", "échec du chargement Neo4j"],
    [/^Neo4j 시작 실패$/, "Neo4j failed to start", "avvio di Neo4j non riuscito", "échec du démarrage de Neo4j"],
    [/^전체 사본 보유$/, "full copy kept", "copia completa conservata", "copie complète conservée"],
    [/^평소 접속 안 함$/, "no routine connection", "nessuna connessione abituale", "aucune connexion habituelle"],
    [/^전체 내보내기 중 \(그래프 (\d+)\/4 완료\)$/, "full export running ($1/4 graphs done)", "esportazione completa in corso ($1/4 grafi)", "export complet en cours ($1/4 graphes)"],
    [/^AI 판독 DB 백업 (\d+)시간 전$/, "reading DB backup $1 h ago", "backup del DB di lettura $1 h fa", "sauvegarde de la base de lecture il y a $1 h"],
    [/^고유 논문 (\S+)편$/, "$1 unique papers", "$1 articoli unici", "$1 articles uniques"],
    [/^검증 통과$/, "verified", "verificato", "vérifié"],
    [/^검증 미확인$/, "unverified", "non verificato", "non vérifié"],
    [/^백업 실패: (.*)$/, "backup failed: $1", "backup non riuscito: $1", "échec de la sauvegarde : $1"]];
  function opsText(text, l) {
    l = l || lang();
    if (!text || l === "ko" || !/[가-힣]/.test(text)) return text;
    var i = {en: 1, it: 2, fr: 3}[l] || 1;
    return String(text).split(" · ").map(function (piece) {
      for (var k = 0; k < OPS_RULES.length; k++) { var r = OPS_RULES[k]; if (r[0].test(piece)) return piece.replace(r[0], r[i]); }
      return piece; }).join(" · ");
  }
  function opsAgent(a, l) {
    l = l || lang(); if (l === "ko" || !a) return a;
    var i = {en: 1, it: 2, fr: 3}[l] || 1, n = OPS_NAMES[a.id];
    var out = {}; for (var key in a) out[key] = a[key];
    if (n) { out.name = n[0][i]; out.role = n[1][i]; }
    out.doing = opsText(a.doing, l); out.metric = opsText(a.metric, l);
    return out;
  }
  window.MSAGE_OPS = opsText; window.MSAGE_OPS_AGENT = opsAgent;
  window.MSAGE_SUITE = {render: render, help: openHelp, closeHelp: closeHelp};
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();
})();
