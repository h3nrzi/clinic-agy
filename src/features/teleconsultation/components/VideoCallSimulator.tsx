import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Video as VideoIcon,
  VideoOff,
  PhoneOff,
  RefreshCw,
  ShieldCheck,
  Clock,
  Sparkles,
  Volume2,
} from 'lucide-react';
import { toPersianDigits } from '@/shared/utils/formatters';

interface VideoCallSimulatorProps {
  doctorName: string;
  patientName: string;
  isDoctorView?: boolean;
  onEndCall?: () => void;
  initialMinutes?: number;
}

export const VideoCallSimulator: React.FC<VideoCallSimulatorProps> = ({
  doctorName,
  patientName,
  isDoctorView = true,
  onEndCall,
  initialMinutes = 15,
}) => {
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [useRealWebcam, setUseRealWebcam] = useState(false);
  const [webcamError, setWebcamError] = useState<string | null>(null);

  // Countdown timer in seconds (15 minutes default = 900s)
  const [secondsRemaining, setSecondsRemaining] = useState(initialMinutes * 60);
  const [isTimerPaused, setIsTimerPaused] = useState(false);

  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  // Timer countdown effect
  useEffect(() => {
    if (isTimerPaused || secondsRemaining <= 0) return;
    const interval = setInterval(() => {
      setSecondsRemaining((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [isTimerPaused, secondsRemaining]);

  // Webcam stream management (DEC-FE-02 Local Loopback)
  useEffect(() => {
    let active = true;

    if (useRealWebcam) {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices
          .getUserMedia({ video: true, audio: false })
          .then((stream) => {
            if (!active) {
              stream.getTracks().forEach((t) => t.stop());
              return;
            }
            mediaStreamRef.current = stream;
            if (localVideoRef.current) {
              localVideoRef.current.srcObject = stream;
              localVideoRef.current.play().catch(() => {});
            }
            setWebcamError(null);
          })
          .catch((err) => {
            console.warn('Webcam permission or access failed, fallback to simulated stream:', err);
            setWebcamError('دسترسی به وب‌کم مقدور نبود؛ حالت شبیه‌ساز متحرک فعال شد.');
            setUseRealWebcam(false);
          });
      } else {
        setWebcamError('مرورگر از وب‌کم پشتیبانی نمی‌کند؛ شبیه‌ساز متحرک فعال شد.');
        setUseRealWebcam(false);
      }
    } else {
      // Stop webcam stream when switching to mock animation
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((t) => t.stop());
        mediaStreamRef.current = null;
      }
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = null;
      }
    }

    return () => {
      active = false;
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((t) => t.stop());
        mediaStreamRef.current = null;
      }
    };
  }, [useRealWebcam]);

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
    return `${toPersianDigits(pad(mins))}:${toPersianDigits(pad(secs))}`;
  };

  const isLowTime = secondsRemaining < 120; // less than 2 mins

  const remoteParticipantLabel = isDoctorView ? `بیمار: ${patientName}` : `پزشک: ${doctorName}`;
  const localParticipantLabel = isDoctorView ? `تصویر شما (${doctorName})` : `تصویر شما (${patientName})`;

  return (
    <div
      data-testid="video-call-simulator"
      className="bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl flex flex-col relative aspect-[4/3] sm:aspect-[16/10] select-none"
    >
      {/* Top Overlay Header */}
      <div className="absolute top-0 inset-x-0 z-20 p-3 sm:p-4 bg-gradient-to-b from-slate-950/90 via-slate-950/40 to-transparent flex items-center justify-between text-white">
        <div className="flex items-center gap-2">
          <span className="flex h-2.5 w-2.5 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
          </span>
          <span className="text-xs font-bold text-white tracking-wide">ارتباط ویدیویی زنده (نمایشی)</span>
          <span className="hidden sm:inline-flex items-center gap-1 text-[11px] bg-slate-800/80 border border-slate-700/80 px-2 py-0.5 rounded-full text-emerald-300">
            <ShieldCheck className="w-3 h-3 text-emerald-400" />
            بدون ضبط
          </span>
        </div>

        {/* Countdown Timer */}
        <div
          data-testid="consultation-timer"
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold font-mono transition shadow-sm ${
            isLowTime
              ? 'bg-rose-600/90 text-white animate-pulse'
              : 'bg-slate-900/80 border border-slate-700 text-teal-300'
          }`}
          title="زمان باقی‌مانده از جلسه استاندارد ۱۵ دقیقه‌ای"
        >
          <Clock className="w-3.5 h-3.5" />
          <span>{formatTimer(secondsRemaining)}</span>
          <span className="text-[10px] opacity-80">باقی‌مانده</span>
        </div>
      </div>

      {/* Main Remote Video Area */}
      <div className="flex-1 relative bg-slate-900 flex items-center justify-center overflow-hidden">
        {/* Animated Simulated Video Stream (DEC-FE-02) */}
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-tr from-slate-950 via-slate-900 to-teal-950/40">
          {/* Subtle animated radar waves */}
          <div className="absolute w-72 h-72 rounded-full border border-teal-500/10 animate-ping opacity-25" />
          <div className="absolute w-96 h-96 rounded-full border border-teal-500/10 animate-pulse opacity-20" />

          {/* Central Participant Avatar & Active Voice Wave */}
          <div className="relative flex flex-col items-center gap-3 z-10">
            <div className="relative">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-gradient-to-br from-teal-500 to-indigo-600 p-1 shadow-2xl flex items-center justify-center text-white font-bold text-2xl">
                <span className="w-full h-full rounded-full bg-slate-800 flex items-center justify-center text-white">
                  {isDoctorView ? '🧑‍💼' : '👩‍⚕️'}
                </span>
              </div>
              <div className="absolute -bottom-1 -right-1 bg-emerald-500 border-2 border-slate-900 rounded-full p-1 text-white">
                <Volume2 className="w-3 h-3 animate-bounce" />
              </div>
            </div>

            <div className="text-center">
              <h4 className="font-bold text-white text-sm tracking-wide">
                {remoteParticipantLabel}
              </h4>
              <p className="text-[11px] text-teal-300/80 mt-0.5 flex items-center justify-center gap-1">
                <Sparkles className="w-3 h-3 text-teal-400" />
                محیط آزمایشی ویزیت تصویری
              </p>
            </div>
          </div>
        </div>

        {/* Local Participant PIP (Picture-In-Picture) */}
        <div
          data-testid="local-pip-container"
          className="absolute bottom-16 left-3 sm:bottom-18 sm:left-4 z-20 w-28 sm:w-36 aspect-[4/3] rounded-xl overflow-hidden border-2 border-slate-700/80 shadow-2xl bg-slate-900/90 backdrop-blur-sm"
        >
          {useRealWebcam && !isVideoOff ? (
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover transform -scale-x-100"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-slate-800 text-slate-300 p-1 text-center">
              {isVideoOff ? (
                <>
                  <VideoOff className="w-5 h-5 text-rose-400 mb-1" />
                  <span className="text-[9px]">دوربین خاموش</span>
                </>
              ) : (
                <>
                  <div className="w-7 h-7 rounded-full bg-teal-600 flex items-center justify-center text-white text-xs font-bold mb-1">
                    {isDoctorView ? '👩‍⚕️' : '🧑‍💼'}
                  </div>
                  <span className="text-[9px] truncate max-w-[100px]">{localParticipantLabel}</span>
                </>
              )}
            </div>
          )}

          {/* Local PIP Label */}
          <div className="absolute bottom-0 inset-x-0 bg-slate-950/80 text-[9px] text-slate-300 px-1.5 py-0.5 text-center truncate">
            {isDoctorView ? 'تصویر شما' : 'تصویر بیمار'}
          </div>
        </div>

        {/* Webcam toggle error alert if any */}
        {webcamError && (
          <div className="absolute top-14 inset-x-4 z-20 bg-amber-500/90 text-slate-950 text-xs px-3 py-1.5 rounded-lg text-center font-medium shadow-md">
            {webcamError}
          </div>
        )}
      </div>

      {/* Bottom Floating Control Bar */}
      <div className="bg-slate-900/95 border-t border-slate-800/80 p-3 sm:p-4 flex items-center justify-between gap-2 z-20">
        {/* Stream Source Toggle (DEC-FE-02: Loopback or Mock animation) */}
        <button
          type="button"
          aria-pressed={useRealWebcam}
          aria-label="تغییر منبع تصویر"
          onClick={() => setUseRealWebcam(!useRealWebcam)}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition border ${
            useRealWebcam
              ? 'bg-teal-500/20 text-teal-300 border-teal-500/40'
              : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
          }`}
          title="سوییچ بین دوربین وب‌کم واقعی یا شبیه‌ساز متحرک"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">منبع:</span>
          <span>{useRealWebcam ? 'وب‌کم محلی' : 'شبیه‌ساز'}</span>
        </button>

        {/* Media Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Mute Button */}
          <button
            type="button"
            aria-pressed={isMuted}
            onClick={() => setIsMuted(!isMuted)}
            className={`p-2.5 sm:p-3 rounded-full transition shadow-md ${
              isMuted
                ? 'bg-rose-600 text-white hover:bg-rose-700'
                : 'bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-700'
            }`}
            aria-label={isMuted ? 'وصل کردن میکروفون' : 'قطع میکروفون'}
            title={isMuted ? 'وصل کردن میکروفون' : 'قطع میکروفون'}
          >
            {isMuted ? <MicOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Mic className="w-4 h-4 sm:w-5 sm:h-5" />}
          </button>

          {/* Video Toggle Button */}
          <button
            type="button"
            aria-pressed={isVideoOff}
            onClick={() => setIsVideoOff(!isVideoOff)}
            className={`p-2.5 sm:p-3 rounded-full transition shadow-md ${
              isVideoOff
                ? 'bg-rose-600 text-white hover:bg-rose-700'
                : 'bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-700'
            }`}
            aria-label={isVideoOff ? 'روشن کردن دوربین' : 'خاموش کردن دوربین'}
            title={isVideoOff ? 'روشن کردن دوربین' : 'خاموش کردن دوربین'}
          >
            {isVideoOff ? <VideoOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <VideoIcon className="w-4 h-4 sm:w-5 sm:h-5" />}
          </button>

          {/* End Call Button */}
          {onEndCall && (
            <button
              type="button"
              onClick={onEndCall}
              className="flex items-center gap-1.5 bg-rose-600 hover:bg-rose-700 text-white px-3 sm:px-4 py-2 sm:py-2.5 rounded-full text-xs font-bold transition shadow-lg"
              title="خاتمه جلسه ویزیت آنلاین"
            >
              <PhoneOff className="w-4 h-4" />
              <span>خاتمه تماس</span>
            </button>
          )}
        </div>

        {/* Timer Pause/Play toggle for demo convenience */}
        <button
          type="button"
          aria-pressed={isTimerPaused}
          onClick={() => setIsTimerPaused(!isTimerPaused)}
          className="text-slate-400 hover:text-slate-200 text-xs px-2 py-1 rounded transition"
          title="توقف موقت تایمر جهت دمو"
        >
          {isTimerPaused ? 'ادامه تایمر' : 'مکث تایمر'}
        </button>
      </div>
    </div>
  );
};
