const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

export function getFocusableIn(root) {
  if (!root) return [];
  return Array.from(root.querySelectorAll(FOCUSABLE_SELECTOR)).filter((el) => {
    return !el.hasAttribute('disabled') && el.getAttribute('aria-hidden') !== 'true';
  });
}

export function focusFirstIn(root) {
  const focusables = getFocusableIn(root);
  if (focusables.length > 0) {
    focusables[0].focus();
  } else if (root) {
    root.focus();
  }
}

export function trapFocusKeyDown(e, root) {
  if (e.key !== 'Tab') return;
  const focusables = getFocusableIn(root);
  if (focusables.length === 0) return;
  const first = focusables[0];
  const last = focusables[focusables.length - 1];
  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault();
    first.focus();
  }
}

export function restoreFocusOnClose() {
  const previouslyFocused = document.activeElement;
  return () => {
    if (previouslyFocused && typeof previouslyFocused.focus === 'function') {
      previouslyFocused.focus();
    }
  };
}
