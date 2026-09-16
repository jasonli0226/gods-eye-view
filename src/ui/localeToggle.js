import { EN_TO_ZH_TW, ZH_TW_TO_EN } from '../i18n/zhTW.js';

/**
 * Runtime UI-chrome language toggle (EN <-> Traditional Chinese).
 *
 * Scope: static chrome text only (panel titles, buttons, tooltips) — not
 * live telemetry/data values, which never match a dictionary key so they
 * pass through untouched. Translation is a pure lookup against the current
 * trimmed text/attribute value in both directions, so re-running it is
 * always idempotent and needs no "restore original" bookkeeping.
 *
 * Caveat: a text node whose value is overwritten via `node.data =` (a
 * characterData mutation, not a new node) after the observer attaches will
 * not be retranslated. Everything set via `.textContent =`/`.innerHTML =`
 * replaces child nodes and is caught.
 */

const STORAGE_KEY = 'gev:locale';
const TRANSLATED_ATTRS = ['title', 'aria-label', 'placeholder'];
const ICON_CLASS = 'material-symbols-outlined';

function tableFor(lang) {
  return lang === 'zh-TW' ? EN_TO_ZH_TW : ZH_TW_TO_EN;
}

function translateTextNode(node, lang) {
  const parent = node.parentElement;
  if (!parent || parent.classList.contains(ICON_CLASS)) return;
  const full = node.nodeValue;
  const trimmed = full.trim();
  if (!trimmed) return;
  const replacement = tableFor(lang)[trimmed];
  if (replacement) node.nodeValue = full.replace(trimmed, replacement);
}

function translateAttributes(el, lang) {
  const table = tableFor(lang);
  for (const attr of TRANSLATED_ATTRS) {
    const value = el.getAttribute(attr);
    if (!value) continue;
    const replacement = table[value.trim()];
    if (replacement) el.setAttribute(attr, replacement);
  }
}

function translateSubtree(root, lang) {
  if (root.nodeType === Node.TEXT_NODE) {
    translateTextNode(root, lang);
    return;
  }
  if (root.nodeType !== Node.ELEMENT_NODE) return;

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let node;
  while ((node = walker.nextNode())) translateTextNode(node, lang);

  if (root.matches('[title],[aria-label],[placeholder]')) translateAttributes(root, lang);
  root.querySelectorAll('[title],[aria-label],[placeholder]').forEach((el) => translateAttributes(el, lang));
}

function updateToggleButton(button, lang) {
  const label = button.querySelector('#locale-toggle-label');
  if (lang === 'zh-TW') {
    if (label) label.textContent = 'EN';
    button.setAttribute('aria-label', '切換為英文');
    button.setAttribute('title', '切換為英文');
  } else {
    if (label) label.textContent = '繁';
    button.setAttribute('aria-label', 'Switch to Traditional Chinese');
    button.setAttribute('title', 'Switch to Traditional Chinese');
  }
}

export function initLocaleToggle() {
  const button = document.getElementById('locale-toggle');
  let currentLang = localStorage.getItem(STORAGE_KEY) === 'zh-TW' ? 'zh-TW' : 'en';

  function applyLanguage(lang) {
    currentLang = lang;
    translateSubtree(document.body, lang);
    if (button) updateToggleButton(button, lang);
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      /* localStorage unavailable (private mode, quota) — language still applies for this session */
    }
  }

  applyLanguage(currentLang);

  button?.addEventListener('click', () => {
    applyLanguage(currentLang === 'zh-TW' ? 'en' : 'zh-TW');
  });

  const observer = new MutationObserver((mutations) => {
    if (currentLang !== 'zh-TW') return;
    for (const mutation of mutations) {
      mutation.addedNodes.forEach((node) => translateSubtree(node, currentLang));
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });

  return { setLanguage: applyLanguage, getLanguage: () => currentLang };
}
