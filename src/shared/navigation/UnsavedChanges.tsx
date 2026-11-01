import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { useBlocker } from "react-router";
import { useWorkspaceOverlay } from "@/shared/hooks/useWorkspaceOverlay";
import "./unsaved-changes.css";

type Draft = { dirty: boolean; onDiscard: () => void };
type Guard = {
  register: (id: symbol, draft: Draft) => () => void;
  run: (action: () => void) => void;
};
const Context = createContext<Guard | null>(null);

/** One router blocker coordinates route exits and destructive local actions. */
export function UnsavedChangesProvider({ children }: { children: ReactNode }) {
  const drafts = useRef(new Map<symbol, Draft>());
  const bypass = useRef(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
  const isDirty = useCallback(
    () => Array.from(drafts.current.values()).some((draft) => draft.dirty),
    [],
  );
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      !bypass.current &&
      isDirty() &&
      currentLocation.pathname !== nextLocation.pathname,
  );
  const open = pendingAction !== null || blocker.state === "blocked";
  const stay = () => {
    setPendingAction(null);
    if (blocker.state === "blocked") blocker.reset();
  };
  const ref = useWorkspaceOverlay(stay, open);
  const register = useCallback((id: symbol, draft: Draft) => {
    drafts.current.set(id, draft);
    return () => {
      drafts.current.delete(id);
    };
  }, []);
  const execute = useCallback((action: () => void) => {
    bypass.current = true;
    try {
      action();
    } finally {
      bypass.current = false;
    }
  }, []);
  const run = useCallback(
    (action: () => void) => {
      if (isDirty()) setPendingAction(() => action);
      else execute(action);
    },
    [isDirty, execute],
  );
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (isDirty()) {
        event.preventDefault();
        event.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [isDirty]);
  const leave = () => {
    const action = pendingAction;
    setPendingAction(null);
    for (const draft of drafts.current.values())
      if (draft.dirty) draft.onDiscard();
    if (action) execute(action);
    else if (blocker.state === "blocked") blocker.proceed();
  };
  return (
    <Context.Provider value={{ register, run }}>
      {children}
      {open &&
        createPortal(
          <div className="unsaved-overlay">
            <div
              className="unsaved-dialog"
              ref={ref}
              role="dialog"
              aria-modal="true"
              aria-labelledby="unsaved-title"
              aria-describedby="unsaved-description"
              tabIndex={-1}
              dir="rtl"
            >
              <h2 id="unsaved-title">ترک کار ناتمام؟</h2>
              <p id="unsaved-description">
                تغییرات ثبت‌نشده کنار گذاشته می‌شوند. برای ادامهٔ کار در این
                صفحه بمانید.
              </p>
              <div>
                <button onClick={stay}>ماندن و ادامه</button>
                <button onClick={leave}>خروج و کنارگذاشتن تغییرات</button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </Context.Provider>
  );
}

export function useUnsavedChanges({ dirty, onDiscard }: Draft) {
  const context = useContext(Context);
  if (!context)
    throw new Error("useUnsavedChanges requires UnsavedChangesProvider");
  const id = useRef(Symbol("draft"));
  const discard = useRef(onDiscard);
  discard.current = onDiscard;
  const register = context.register;
  useEffect(
    () => register(id.current, { dirty, onDiscard: () => discard.current() }),
    [register, dirty],
  );
}

/** Pass the whole mutation/navigation operation; no session or draft changes before consent. */
export function useGuardedAction() {
  const context = useContext(Context);
  if (!context)
    throw new Error("useGuardedAction requires UnsavedChangesProvider");
  return context.run;
}
