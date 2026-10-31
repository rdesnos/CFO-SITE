/* Canadian French UI locale, including late-arriving public feed labels. */
(() => {
  'use strict';
  const locale = window.cfoEdition?.locale;
  if (!locale) return;
  document.documentElement.lang = locale;
  if (locale === 'nl-BE') return;
  if (locale !== 'fr-CA') return;
  const rules = [
    [/\bnewsletters\b/giu, 'infolettres'], [/\bnewsletter\b/giu, 'infolettre'],
    [/\bpodcasts\b/giu, 'balados'], [/\bpodcast\b/giu, 'balado'],
    [/\bstreaming\b/giu, 'écoute en continu'], [/\bStreams Spotify\b/gu, 'Écoutes Spotify'],
    [/\bstreams\b/gu, 'écoutes']
  ];
  const excluded = 'script,style,code,pre,textarea,blockquote,q,cite,[translate="no"],.notranslate';
  function localize(root) {
    const parent = root.nodeType === 3 ? root.parentElement : root;
    if (!parent || parent.closest?.(excluded)) return;
    const nodes = [];
    if (root.nodeType === 3) nodes.push(root);
    else {
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      while (walker.nextNode()) nodes.push(walker.currentNode);
    }
    for (const node of nodes) {
      if (node.parentElement?.closest(excluded)) continue;
      let value = node.nodeValue;
      for (const [pattern, replacement] of rules) value = value.replace(pattern, replacement);
      if (node.nodeValue !== value) node.nodeValue = value;
    }
  }
  function start() {
    localize(document.body);
    new MutationObserver(records => {
      for (const record of records) {
        if (record.type === 'characterData') localize(record.target);
        else record.addedNodes.forEach(localize);
      }
    }).observe(document.body, { childList: true, subtree: true, characterData: true });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
