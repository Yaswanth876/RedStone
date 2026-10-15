import { useState, useRef, useId } from 'react';
import { UploadCloud, FileSpreadsheet, FileText, Image as ImageIcon } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import {
  ACCEPTED_FILE_TYPES_STRING,
  MAX_FILE_SIZE_BYTES,
  formatFileSize,
} from '../../services/upload.service.js';

/**
 * FileDropzone — Drag-and-drop file ingestion area with keyboard and screen reader accessibility.
 *
 * @param {object} props
 * @param {function} props.onFileSelected - Called with selected File object
 * @param {boolean} [props.disabled=false] - Whether dropzone is disabled during processing
 */
export function FileDropzone({ onFileSelected, disabled = false }) {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);
  const inputId = useId();

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled) return;
    setIsDragOver(true);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled) return;
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (disabled) return;

    const files = e.dataTransfer?.files;
    if (files && files.length > 0) {
      onFileSelected(files[0]);
    }
  };

  const handleFileInputChange = (e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      onFileSelected(files[0]);
    }
    // Reset input value so re-selecting the exact same file fires onChange again
    e.target.value = '';
  };

  const triggerPicker = () => {
    if (disabled) return;
    fileInputRef.current?.click();
  };

  const handleKeyDown = (e) => {
    if (disabled) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      triggerPicker();
    }
  };

  return (
    <div
      role="region"
      aria-label="Timetable document dropzone"
      tabIndex={disabled ? -1 : 0}
      onKeyDown={handleKeyDown}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`relative flex flex-col items-center justify-center p-8 sm:p-12 rounded-card border-2 border-dashed transition-all duration-200 outline-none ${
        disabled
          ? 'border-border/60 bg-[#FAF9F6] opacity-60 cursor-not-allowed'
          : isDragOver
          ? 'border-primary bg-primary-soft/50 ring-2 ring-primary/20 scale-[0.995]'
          : 'border-border bg-surface hover:border-primary/40 hover:bg-[#FAF9F6]/50 cursor-pointer focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2'
      }`}
      onClick={triggerPicker}
    >
      <input
        ref={fileInputRef}
        id={inputId}
        type="file"
        accept={ACCEPTED_FILE_TYPES_STRING}
        disabled={disabled}
        onChange={handleFileInputChange}
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
      />

      {/* Visual Icon Illustration */}
      <div
        className={`w-14 h-14 rounded-full flex items-center justify-center mb-4 transition-colors ${
          isDragOver
            ? 'bg-primary text-white shadow-subtle'
            : 'bg-primary-soft text-primary'
        }`}
      >
        <UploadCloud className="w-7 h-7" />
      </div>

      {/* Main Instruction */}
      <h3 className="text-base font-semibold text-foreground text-center">
        {isDragOver ? 'Drop your timetable file or image here' : 'Drag & drop your timetable file or image here'}
      </h3>

      <p className="text-xs sm:text-sm text-foreground-muted mt-1 text-center max-w-md">
        Upload your institutional routine document or timetable image to automatically extract and structure your class schedule using OCR.
      </p>

      {/* File-Picker Button */}
      <div className="mt-5" onClick={(e) => e.stopPropagation()}>
        <Button
          type="button"
          variant="outline"
          size="md"
          disabled={disabled}
          onClick={triggerPicker}
        >
          Choose File from Device
        </Button>
      </div>

      {/* Format & Constraints Pill */}
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-[11px] text-foreground-muted">
        <span className="flex items-center gap-1 font-medium">
          <ImageIcon className="w-3.5 h-3.5 text-primary" />
          Images (.png, .jpg, .webp)
        </span>
        <span className="text-border">•</span>
        <span className="flex items-center gap-1 font-medium">
          <FileText className="w-3.5 h-3.5 text-primary" />
          PDF (.pdf)
        </span>
        <span className="text-border">•</span>
        <span className="flex items-center gap-1 font-medium">
          <FileSpreadsheet className="w-3.5 h-3.5 text-primary" />
          Excel (.xlsx)
        </span>
        <span className="text-border">•</span>
        <span className="flex items-center gap-1 font-medium">
          <FileText className="w-3.5 h-3.5 text-primary" />
          CSV (.csv)
        </span>
        <span className="text-border">•</span>
        <span>Max size: {formatFileSize(MAX_FILE_SIZE_BYTES)}</span>
      </div>
    </div>
  );
}

export default FileDropzone;
