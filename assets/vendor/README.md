# Local rendering assets

The site uses pre-rendered content and local assets, so the complete technical reading works offline and through `file://`.

- **KaTeX 0.19.1**: `katex/katex.min.css` and `katex/fonts/`. Equations are rendered at build time as HTML plus accessible MathML. [MIT licence](katex/LICENSE); [project](https://katex.org/).
- **Mermaid / Mermaid CLI 12.2.0**: used at build time to render the six source definitions into `assets/figures/reference-*.svg`. No Mermaid JavaScript is loaded by the website. [Mermaid licence](mermaid/LICENSE), [CLI licence](mermaid/CLI-LICENSE); [project](https://mermaid.js.org/).
- **Marked 18.1.2**: build-time Markdown parser ([MIT licence and source](https://github.com/markedjs/marked)). Its JavaScript is not distributed to the browser.

Pinned build dependencies and their transitive versions are recorded in `package.json` and `package-lock.json`. `scripts/build-reference.cjs` copies the necessary local assets and licences while regenerating the full reference.
