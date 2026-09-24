document.addEventListener('DOMContentLoaded', () => {
  if (!document.body.classList.contains('page-id-582')) return;
  const nodes = Array.from(document.querySelectorAll('.mgp-formula'));
  if (!nodes.length) return;
  const tex = [
    String.raw`S_i(t)=\bigl(M_i(t),\,P_i(t),\,X_i(t)\bigr)`,
    String.raw`P_i(t)\in[-1,1]`,
    String.raw`D_{ij}(t)=d\!\left(X_i(t),X_j(t)\right)`,
    String.raw`D_{ij}(t)=\sqrt{\sum_k w_k\left(x_{i,k}(t)-x_{j,k}(t)\right)^2}`,
    String.raw`w_k\ge 0\qquad\text{et}\qquad\sum_k w_k=1`,
    String.raw`C_{ij}(t)=C\!\left(P_i(t),P_j(t)\right)`,
    String.raw`C_{ij}(t)=P_i(t)P_j(t)`,
    String.raw`F_{ij}(t)=G^{R}\,\frac{M_i(t)M_j(t)}{\left(D_{ij}(t)+\varepsilon\right)^2}\,C_{ij}(t)`,
    String.raw`\vec{F}_i(t)=\sum_{j\ne i}\vec{F}_{ij}(t)`,
    String.raw`X_i(t_0),\;X_i(t_1),\;\ldots,\;X_i(t_n)`,
    String.raw`\text{état observé à }t\;\longrightarrow\;\text{prévision du modèle}\;\longrightarrow\;\text{état observé à }t+\Delta t`
  ];
  nodes.forEach((node, i) => {
    if (tex[i]) node.innerHTML = '\\[' + tex[i] + '\\]';
  });
  window.MathJax = {
    tex: {
      inlineMath: [['\\(', '\\)']],
      displayMath: [['\\[', '\\]']],
      processEscapes: true
    },
    chtml: { scale: 1 },
    startup: {
      typeset: false,
      ready: () => {
        MathJax.startup.defaultReady();
        MathJax.typesetPromise(nodes).then(() => {
          document.documentElement.dataset.mgpMath = 'mathjax';
        });
      }
    }
  };
  const script = document.createElement('script');
  script.src = 'https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js';
  script.async = true;
  script.onerror = () => { document.documentElement.dataset.mgpMath = 'fallback'; };
  document.head.appendChild(script);
});