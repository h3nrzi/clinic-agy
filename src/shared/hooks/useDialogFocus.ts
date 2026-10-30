import { useEffect, useRef } from 'react';
const stack: HTMLElement[] = [];
export function useDialogFocus(onClose:()=>void, enabled=true) {
  const ref = useRef<HTMLDivElement>(null);
  const close = useRef(onClose);
  close.current = onClose;
  useEffect(()=>{
    const node=ref.current;
    if(!enabled || !node) return;
    const previous=document.activeElement as HTMLElement|null;
    stack.push(node);
    const focusable=()=>Array.from(node.querySelectorAll<HTMLElement>('button:not(:disabled),input:not(:disabled),select:not(:disabled),textarea:not(:disabled),a[href],[tabindex="0"]')).filter(el=>!el.closest('[hidden]'));
    (focusable()[0] || node).focus();
    const handle=(e:KeyboardEvent)=>{
      if(stack[stack.length-1]!==node) return;
      if(e.key==='Escape'){e.preventDefault();e.stopPropagation();close.current();}
      if(e.key==='Tab'){
        const items=focusable(),first=items[0],last=items[items.length-1];
        if(!first){e.preventDefault();node.focus();return;}
        if(e.shiftKey && (document.activeElement===first || !node.contains(document.activeElement))){e.preventDefault();last.focus();}
        else if(!e.shiftKey && (document.activeElement===last || !node.contains(document.activeElement))){e.preventDefault();first.focus();}
      }
    };
    document.addEventListener('keydown',handle);
    return ()=>{document.removeEventListener('keydown',handle);const i=stack.indexOf(node);if(i>=0)stack.splice(i,1);if(previous?.isConnected)previous.focus();};
  },[enabled]);
  return ref;
}
