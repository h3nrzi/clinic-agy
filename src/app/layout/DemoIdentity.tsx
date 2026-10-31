import { ShieldCheck, X } from "lucide-react";
import { useDialogFocus } from "@/shared/hooks/useDialogFocus";
import { IdentityForm } from "@/app/public/IdentityForm";

/** Reusable form preview retained for existing embedding consumers. */
export function DemoIdentity({ onClose }: { onClose: () => void }) {
  const ref = useDialogFocus(onClose);
  return (
    <div
      ref={ref}
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      aria-labelledby="identity-title"
      className="fixed inset-0 bg-slate-950/60 flex items-center justify-center p-4"
    >
      <section className="identity-card">
        <button
          className="float-left p-2"
          aria-label="بستن احراز هویت"
          onClick={onClose}
        >
          <X size={20} />
        </button>
        <ShieldCheck size={36} />
        <h2 id="identity-title">ورود نمایشی</h2>
        <IdentityForm onVerified={onClose} />
      </section>
    </div>
  );
}
