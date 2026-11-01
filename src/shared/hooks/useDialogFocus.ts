import { useEffect, useRef } from 'react';

const stack: HTMLElement[] = [];
let originalBodyOverflow = '';

/** Only the top dialog handles keyboard and focus; closing restores its opener. */
export function useDialogFocus(onClose: () => void, enabled = true) {
  const ref = useRef<HTMLDivElement>(null);
  const close = useRef(onClose);
  close.current = onClose;

  useEffect(() => {
    const node = ref.current;
    if (!enabled || !node) return;
    const previous = document.activeElement as HTMLElement | null;
    if (!stack.length) originalBodyOverflow = document.body.style.overflow;
    stack.push(node);
    document.body.style.overflow = 'hidden';

    const focusable = () => Array.from(node.querySelectorAll<HTMLElement>(
      'button:not(:disabled),input:not(:disabled),select:not(:disabled),textarea:not(:disabled),a[href],[tabindex="0"]',
    )).filter(element => !element.closest('[hidden], [inert]') && element.getAttribute('aria-hidden') !== 'true');
    const focusFirst = () => (focusable()[0] || node).focus();
    focusFirst();

    const handleKey = (event: KeyboardEvent) => {
      if (event.defaultPrevented || stack[stack.length - 1] !== node) return;
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        close.current();
      }
      if (event.key === 'Tab') {
        const items = focusable();
        const first = items[0];
        const last = items[items.length - 1];
        if (!first) {
          event.preventDefault();
          node.focus();
        } else if (event.shiftKey && (document.activeElement === first || !node.contains(document.activeElement))) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && (document.activeElement === last || !node.contains(document.activeElement))) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    const containFocus = (event: FocusEvent) => {
      if (stack[stack.length - 1] === node && !node.contains(event.target as Node)) focusFirst();
    };
    document.addEventListener('focusin', containFocus);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('focusin', containFocus);
      document.removeEventListener('keydown', handleKey);
      const index = stack.indexOf(node);
      if (index >= 0) stack.splice(index, 1);
      if (!stack.length) document.body.style.overflow = originalBodyOverflow;
      if (previous?.isConnected) previous.focus();
    };
  }, [enabled]);
  return ref;
}
