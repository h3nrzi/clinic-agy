import React, { useState } from 'react';
import { PatientDocument } from '@/shared/types';
import { formatDateTime } from '@/shared/utils/formatters';
import { X, ZoomIn, ZoomOut, RotateCw, RefreshCw, FileText, Download } from 'lucide-react';

interface DocumentZoomModalProps {
  document: PatientDocument | null;
  isOpen: boolean;
  onClose: () => void;
}

export const DocumentZoomModal: React.FC<DocumentZoomModalProps> = ({
  document: doc,
  isOpen,
  onClose,
}) => {
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);

  if (!isOpen || !doc) return null;

  const handleZoomIn = () => setScale((s) => Math.min(s + 0.25, 3));
  const handleZoomOut = () => setScale((s) => Math.max(s - 0.25, 0.5));
  const handleRotate = () => setRotation((r) => (r + 90) % 360);
  const handleReset = () => {
    setScale(1);
    setRotation(0);
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'نامشخص';
    if (bytes >= 1024 * 1024) {
      return `${(bytes / (1024 * 1024)).toFixed(1)} مگابایت`;
    }
    return `${Math.round(bytes / 1024)} کیلوبایت`;
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="مشاهده و زوم مدارک پزشکی"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">{doc.title}</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                زمان بارگذاری: {formatDateTime(doc.uploadedAt)} • حجم فایل: {formatFileSize(doc.sizeBytes)}
              </p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-slate-200/80 rounded-lg p-1 text-slate-700">
              <button
                type="button"
                onClick={handleZoomIn}
                title="بزرگ‌نمایی"
                className="p-1.5 hover:bg-white rounded-md transition"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleZoomOut}
                title="کوچک‌نمایی"
                className="p-1.5 hover:bg-white rounded-md transition"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleRotate}
                title="چرخش ۹۰ درجه"
                className="p-1.5 hover:bg-white rounded-md transition"
              >
                <RotateCw className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleReset}
                title="بازنشانی اندازه"
                className="p-1.5 hover:bg-white rounded-md transition text-xs font-medium px-2"
              >
                <RefreshCw className="w-3.5 h-3.5 inline mr-1" />
                {Math.round(scale * 100)}%
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
              aria-label="بستن"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Image Display Area */}
        <div className="flex-1 overflow-auto bg-slate-900/5 p-6 flex items-center justify-center min-h-[400px]">
          <div
            className="transition-transform duration-200 ease-out origin-center"
            style={{
              transform: `scale(${scale}) rotate(${rotation}deg)`,
            }}
          >
            <img
              src={doc.url}
              alt={doc.title}
              className="max-h-[60vh] max-w-full rounded-lg shadow-lg object-contain bg-white border border-slate-200"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-600">
          <span className="font-mono text-slate-500">شناسه مدرک: {doc.id}</span>
          <a
            href={doc.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-teal-700 hover:text-teal-800 font-semibold transition"
          >
            <Download className="w-4 h-4" />
            <span>مشاهده در تب جدید</span>
          </a>
        </div>
      </div>
    </div>
  );
};
