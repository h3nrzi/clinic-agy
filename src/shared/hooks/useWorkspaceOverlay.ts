import { useEffect } from 'react';
import { useDialogFocus } from './useDialogFocus';

/** Portal overlays make the workspace inert; cleanup precedes trigger focus restoration. */
export function useWorkspaceOverlay(onClose: () => void, enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;
    const shell = document.querySelector<HTMLElement>('.workspace-shell');
    if (!shell) return;
    const wasInert = shell.inert;
    const previousHidden = shell.getAttribute('aria-hidden');
    shell.inert = true;
    shell.setAttribute('aria-hidden', 'true');
    return () => {
      shell.inert = wasInert;
      if (previousHidden === null) shell.removeAttribute('aria-hidden');
      else shell.setAttribute('aria-hidden', previousHidden);
    };
  }, [enabled]);
  return useDialogFocus(onClose, enabled);
}
