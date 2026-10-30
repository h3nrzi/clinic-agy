import { useState } from 'react';
import { ShieldCheck, X } from 'lucide-react';
import { useDialogFocus } from '@/shared/hooks/useDialogFocus';
const digits=(value:string)=>value.replace(/[۰-۹]/g,c=>String('۰۱۲۳۴۵۶۷۸۹'.indexOf(c))).replace(/[٠-٩]/g,c=>String('٠١٢٣٤٥٦٧٨٩'.indexOf(c)));
function validNationalCode(value:string) {
  if(!/^\d{10}$/.test(value) || /^(\d)\1{9}$/.test(value))return false;
  const sum=[...value.slice(0,9)].reduce((n,c,i)=>n+Number(c)*(10-i),0)%11;
  return Number(value[9])===(sum<2?sum:11-sum);
}
export function DemoIdentity({onClose}:{onClose:()=>void}) {
  const ref=useDialogFocus(onClose);
  const [mobile,setMobile]=useState('');const [national,setNational]=useState('');
  const [consent,setConsent]=useState(false);const [step,setStep]=useState<'identity'|'otp'|'done'>('identity');
  const [otp,setOtp]=useState('');const [error,setError]=useState('');
  return <div ref={ref} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="identity-title" className="fixed inset-0 bg-slate-950/60 flex items-center justify-center p-4"><section className="identity-card"><button className="float-left p-2" aria-label="بستن احراز هویت" onClick={onClose}><X size={20}/></button><ShieldCheck size={36} className="text-teal-700"/><h2 id="identity-title">ورود امن به پورتال سلامت</h2><p>آزمایش جریان ورود • هیچ پیامکی ارسال نمی‌شود و نقش فعلی تغییر نمی‌کند.</p>
  {step==='done'?<div role="status" className="space-y-4"><h3>تأیید هویت نمایشی انجام شد</h3><p>رضایت شما برای این جلسهٔ نمایشی ثبت شد. اطلاعات این فرم ذخیره نمی‌شود.</p><button onClick={onClose} className="identity-submit">بازگشت به فضای کار</button></div>:<form onSubmit={e=>{e.preventDefault();setError('');if(step==='identity'){if(!/^09\d{9}$/.test(digits(mobile)) || !validNationalCode(digits(national))){setError('شماره موبایل ۱۱ رقمی و کد ملی معتبر وارد کنید.');return;}if(!consent){setError('برای ادامه، رضایت‌نامه را مطالعه و تأیید کنید.');return;}setStep('otp');}else if(digits(otp)==='123456')setStep('done');else setError('کد واردشده صحیح نیست. کد نمایشی: ۱۲۳۴۵۶');}} className="space-y-4">
  {step==='identity'?<><label>شماره موبایل<input value={mobile} onChange={e=>setMobile(e.target.value)} inputMode="tel" autoComplete="tel" dir="ltr" placeholder="09123456789" required/></label><label>کد ملی<input value={national} onChange={e=>setNational(e.target.value)} inputMode="numeric" dir="ltr" required/></label><div className="identity-consent"><strong>رضایت آگاهانه خدمات سلامت</strong><p>این محیط صرفاً برای نمایش عملکرد سامانه است و خدمات درمانی واقعی ارائه نمی‌دهد. اطلاعات ساختگی وارد کنید. در ویزیت آنلاین، کیفیت ارتباط به اینترنت وابسته است و جلسه ضبط نمی‌شود.</p><label><input type="checkbox" checked={consent} onChange={e=>setConsent(e.target.checked)}/>متن را خواندم و با ادامهٔ جلسه نمایشی موافقم.</label></div></>:<><p role="status">کد نمایشی شما: <bdi>۱۲۳۴۵۶</bdi></p><label>کد تأیید<input value={otp} onChange={e=>setOtp(e.target.value)} autoComplete="one-time-code" inputMode="numeric" dir="ltr" required/></label><button type="button" onClick={()=>{setStep('identity');setError('');}}>ویرایش اطلاعات</button></>}
  {error&&<p role="alert" className="text-rose-700">{error}</p>}<button className="identity-submit" type="submit">{step==='identity'?'دریافت کد نمایشی':'تأیید و ادامه'}</button></form>}</section></div>;
}
