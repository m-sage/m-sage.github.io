# M-SAGE — microbiome research, read by AI

**Website: https://m-sage.github.io**

This repository only holds the published website (generated files). It is rebuilt and pushed from the M-SAGE
team repository; please do not edit it directly — changes here are overwritten by the next release.

**One exception — announcements: edit [`messages.js`](messages.js)** (pencil icon on GitHub → add one entry → Commit).
The message appears on every page under the top bar about a minute later. The file explains the format at the top.
A typo stops the publish and the site keeps its previous version; the Actions tab shows the error.

* `story.html` — the one-page story · `cockpit.html` — the cockpit · `module.html?m=…` — detail views
* 한국어 / English and ELI10 / ELI20 / PRO switches at the top of every page
* Data: a frozen monthly snapshot (`data/msage-data.js`). Results are machine-extracted from abstracts,
  show association and not causation, and are not expert-validated.

Charts: Apache ECharts 6.1.0 (Apache-2.0).
