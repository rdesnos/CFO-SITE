/* Exact interface labels from Supabase; editorial bodies are translated on the server. */
(() => {
  'use strict';
  if (window.cfoEdition?.locale !== 'nl-BE') return;
  const normalize = value => value.trim().replace(/’/g, "'").replace(/\s+/g, ' ');
  const labels = new Map(Object.entries(window.cfoNlBeLabels || {}).map(([a,b]) => [normalize(a),b]));
  const excluded = 'script,style,code,pre,textarea,blockquote,q,cite,[translate="no"],.notranslate,#wpvibe-preview-banner';
  const translateText = node => {
    if (node.parentElement?.closest(excluded)) return;
    const original = node.nodeValue;
    const target = labels.get(normalize(original));
    if (target !== undefined && target !== original.trim()) node.nodeValue = original.replace(original.trim(), target);
  };
  const localizeElement = element => {
    if (element.closest(excluded)) return;
    for (const attribute of ['alt','title','aria-label','placeholder']) {
      const original = element.getAttribute(attribute);
      if (original === null) continue;
      const target = labels.get(normalize(original));
      if (target !== undefined && target !== original) element.setAttribute(attribute,target);
    }
    if (element.matches('input[type="submit"],input[type="button"]')) {
      const target = labels.get(normalize(element.value));
      if (target !== undefined && element.value !== target) element.value = target;
    }
    if (element.matches('a[href]') && !element.hasAttribute('hreflang') && !element.hasAttribute('data-rde-keep-language')) {
      const href = element.getAttribute('href');
      if (!href || href.startsWith('#')) return;
      const url = new URL(href, location.href);
      if (url.origin !== location.origin || !/^https?:$/.test(url.protocol)) return;
      if (/\/(wp-admin|wp-json|wp-content|wp-includes|feed)(\/|$)|\.[a-z0-9]{2,6}$/i.test(url.pathname)) return;
      if (['action','_wpnonce','rest_route'].some(key=>url.searchParams.has(key))) return;
      url.searchParams.set('cfo_lang','nl-BE');
      const preview = new URL(location.href).searchParams.get('wpvibe_preview');
      if (preview) url.searchParams.set('wpvibe_preview',preview);
      if (element.href !== url.href) element.href = url.href;
    }
  };
  const localize = root => {
    if (root.nodeType === Node.TEXT_NODE) { translateText(root); return; }
    if (!(root instanceof Element) || root.closest(excluded)) return;
    localizeElement(root);
    root.querySelectorAll('*').forEach(localizeElement);
    const walker = document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
    const nodes=[];
    while(walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(translateText);
  };
  const start = () => {
    localize(document.body);
    new MutationObserver(records=>{
      for (const record of records) {
        if (record.type==='characterData') translateText(record.target);
        else if (record.type==='attributes') localizeElement(record.target);
        else record.addedNodes.forEach(localize);
      }
    }).observe(document.body,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['alt','title','aria-label','placeholder','href']});
  };
  if (document.readyState==='loading') document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
})();
