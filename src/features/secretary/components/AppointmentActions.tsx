import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Eye, FileEdit, MoreHorizontal, Unlock } from 'lucide-react';
import type { Appointment } from '@/shared/types';

interface AppointmentActionsProps {
  appointment: Appointment;
  onOpenDrawer: (appointment: Appointment) => void;
  onOpenInsuranceModal: (appointment: Appointment) => void;
  onOpenEmergencyUnlock: (appointment: Appointment) => void;
}

export function AppointmentActions({ appointment, onOpenDrawer, onOpenInsuranceModal, onOpenEmergencyUnlock }: AppointmentActionsProps) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const panelId = useId();
  const close = () => {
    triggerRef.current?.focus();
    setOpen(false);
  };

  useLayoutEffect(() => {
    if (!open || !triggerRef.current || !panelRef.current) return;
    const trigger = triggerRef.current.getBoundingClientRect();
    const panel = panelRef.current.getBoundingClientRect();
    const viewportWidth = document.documentElement.clientWidth;
    const viewportHeight = document.documentElement.clientHeight;
    setPosition({
      left: Math.max(8, Math.min(trigger.left, viewportWidth - panel.width - 8)),
      top: Math.max(8, trigger.bottom + panel.height + 8 <= viewportHeight ? trigger.bottom + 4 : trigger.top - panel.height - 4),
    });
    panelRef.current.querySelector('button')?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const dismissOutside = (event: PointerEvent) => {
      if (event.target instanceof Node && !panelRef.current?.contains(event.target) && !triggerRef.current?.contains(event.target)) setOpen(false);
    };
    const dismissOnScroll = (event: Event) => {
      if (event.target instanceof Node && panelRef.current?.contains(event.target)) return;
      setOpen(false);
    };
    const dismiss = () => setOpen(false);
    document.addEventListener('pointerdown', dismissOutside);
    window.addEventListener('scroll', dismissOnScroll, true);
    window.addEventListener('resize', dismiss);
    return () => {
      document.removeEventListener('pointerdown', dismissOutside);
      window.removeEventListener('scroll', dismissOnScroll, true);
      window.removeEventListener('resize', dismiss);
    };
  }, [open]);

  const runAction = (action: (appointment: Appointment) => void) => {
    close();
    action(appointment);
  };

  return <>
    <button ref={triggerRef} type="button" className="appointment-actions-trigger" aria-label={`عملیات نوبت ${appointment.trackingCode}`} aria-expanded={open} aria-controls={open ? panelId : undefined} onPointerDown={event => { if (open) event.preventDefault(); }} onClick={() => setOpen(!open)}>
      <MoreHorizontal size={20} aria-hidden="true" />
    </button>
    {open && createPortal(<div ref={panelRef} id={panelId} role="group" aria-label={`عملیات نوبت ${appointment.trackingCode}`} className="appointment-actions-panel" dir="rtl" style={position}
      onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false); }}
      onKeyDown={event => {
        if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); close(); }
      }}>
      <button type="button" title="مشاهده پرونده و مدارک" onClick={() => runAction(onOpenDrawer)}><Eye size={18} aria-hidden="true" />مشاهده پرونده و مدارک</button>
      <button type="button" title="اصلاح سهم بیمه" onClick={() => runAction(onOpenInsuranceModal)}><FileEdit size={18} aria-hidden="true" />اصلاح سهم بیمه</button>
      {appointment.isSoftLocked && <button type="button" className="appointment-actions-unlock" onClick={() => runAction(onOpenEmergencyUnlock)}><Unlock size={18} aria-hidden="true" />بازگشایی اضطراری</button>}
    </div>, document.body)}
  </>;
}
