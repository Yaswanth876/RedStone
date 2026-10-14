import { Loader2, Sparkles, FileSearch } from 'lucide-react';

/**
 * UploadProgress — displays an indeterminate animated progress state during upload and server extraction.
 *
 * @param {object} props
 * @param {string} [props.fileName]
 * @param {string} [props.statusMessage]
 */
export function UploadProgress({
  fileName,
  statusMessage = 'Uploading and parsing document structure...',
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="p-6 rounded-card border border-primary/20 bg-primary-soft/30 space-y-4"
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
          <Loader2 className="w-5 h-5 animate-spin" />
        </div>
        <div className="space-y-0.5 min-w-0">
          <h4 className="text-sm font-semibold text-foreground">
            Processing {fileName || 'Timetable Document'}
          </h4>
          <p className="text-xs text-foreground-muted">
            {statusMessage}
          </p>
        </div>
      </div>

      {/* Indeterminate Animated Progress Bar */}
      <div className="w-full bg-[#EAE6DE] rounded-full h-1.5 overflow-hidden">
        <div className="bg-primary h-full rounded-full animate-indeterminate-bar w-1/3" />
      </div>

      <div className="flex items-center justify-between text-[11px] text-foreground-muted pt-1">
        <span className="flex items-center gap-1.5">
          <FileSearch className="w-3.5 h-3.5 text-primary" />
          Detecting days, class times, and rooms
        </span>
        <span className="flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-primary" />
          Synchronous extraction
        </span>
      </div>
    </div>
  );
}

export default UploadProgress;
