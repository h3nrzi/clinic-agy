import { useState } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, RotateCcw, ShieldCheck, X } from 'lucide-react';
import { useScenarioStore } from '@/shared/stores/useScenarioStore';
import { useAuthStore } from '@/shared/stores/useAuthStore';
import { useWorkspaceOverlay } from '@/shared/hooks/useWorkspaceOverlay';

export function DemoTools() {
  const [open, setOpen] = useState(false);
  const { injectScenario, resetDatabase } = useScenarioStore();
  const { currentRole, currentUser } = useAuthStore();
  const ref = useWorkspaceOverlay(() => setOpen(false), open);
  return <>
    <button className="demo-tools-trigger" aria-label="ابزارهای ارزیابی دمو" aria-expanded={open} aria-haspopup="dialog" aria-controls={open ? 'demo-tools-panel' : undefined} onClick={() => setOpen(true)}><ShieldCheck size={20} aria-hidden="true" /><span>ابزارهای دمو</span></button>
    {open && createPortal(<div className="workspace-overlay demo-tools-overlay" onClick={() => setOpen(false)}><div id="demo-tools-panel" role="dialog" aria-modal="true" aria-labelledby="demo-tools-title" tabIndex={-1} ref={ref} className="demo-tools-panel" onClick={event => event.stopPropagation()}>
      <div className="demo-tools-heading"><h2 id="demo-tools-title">ابزارهای ارزیابی دمو</h2><button aria-label="بستن ابزارهای دمو" onClick={() => setOpen(false)}><X size={20} /></button></div>
      <p>داده‌های ساختگی برای ارزیابی جریان‌های موجود.</p>
      <button disabled={currentRole !== 'PATIENT'} aria-describedby={currentRole !== 'PATIENT' ? 'patient-scenario-help' : undefined} onClick={() => { injectScenario(currentUser.id === 'pat-3' ? 'NORMAL' : 'INDEBTED_PATIENT'); setOpen(false); }}><AlertTriangle size={18} aria-hidden="true" />{currentUser.id === 'pat-3' ? 'غیرفعال‌سازی بیمار بدهکار' : 'تزریق بیمار بدهکار (قفل نرم)'}</button>
      {currentRole !== 'PATIENT' && <p id="patient-scenario-help">برای سناریوی بیمار بدهکار از صفحهٔ ورود با حساب بیمار وارد شوید.</p>}
      <button onClick={() => { if (window.confirm('آیا از بازنشانی کامل پایگاه داده به وضعیت اولیه (Factory Reset) اطمینان دارید؟')) { resetDatabase(); setOpen(false); } }}><RotateCcw size={18} aria-hidden="true" />ریست کارخانه‌ای داده‌ها</button>
    </div></div>, document.body)}
  </>;
}
