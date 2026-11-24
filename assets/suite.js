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
 * Language follows the pages' own 한국어/English switch (localStorage msage.lang, <html lang>).
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
         cockpitTip: "Live instruments: what is being read and what is rising", storyTip: "Every finding on one long page", labTip: "Knowledge-graph analysis: consensus, debate, trends, gaps"}};
  function lang() {
    var l = document.documentElement.lang || "";
    try { l = localStorage.getItem("msage.lang") || l; } catch (e) {}
    return /^en/.test(l) ? "en" : "ko";
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
    document.documentElement.classList.toggle("ms-embedded", !!embedded);
  }
  function start() {
    render();
    // follow the page's language switch (the pages set <html lang> when it changes)
    new MutationObserver(render).observe(document.documentElement, {attributes: true, attributeFilter: ["lang"]});
  }
  window.MSAGE_SUITE = {render: render};
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();
})();
