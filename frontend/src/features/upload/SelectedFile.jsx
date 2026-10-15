import { useState, useEffect } from 'react';
import { FileText, FileSpreadsheet, Image as ImageIcon, X, UploadCloud, RefreshCw } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { formatFileSize, getFileTypeLabel, isImageFile } from '../../services/upload.service.js';

/**
 * SelectedFile — displays metadata of the currently selected file with controls to remove, replace, or upload.
 *
 * @param {object} props
 * @param {File} props.file - Selected File object
 * @param {boolean} [props.isUploading=false] - Whether upload is currently processing
 * @param {function} props.onUpload - Called when user clicks "Upload & Extract"
 * @param {function} props.onRemove - Called when user removes the file
 * @param {function} props.onChange - Called when user wants to replace file
 */
export function SelectedFile({
  file,
  isUploading = false,
  onUpload,
  onRemove,
  onChange,
}) {
  const [imagePreviewUrl, setImagePreviewUrl] = useState(null);

  useEffect(() => {
    if (!file) {
      setImagePreviewUrl(null);
      return;
    }

    if (file.type?.startsWith('image/') || isImageFile(file)) {
      const url = URL.createObjectURL(file);
      setImagePreviewUrl(url);
      return () => {
        URL.revokeObjectURL(url);
      };
    } else {
      setImagePreviewUrl(null);
    }
  }, [file]);

  if (!file) return null;

  const isImage = file.type?.startsWith('image/') || isImageFile(file);
  const isSpreadsheet = file.name.endsWith('.xlsx') || file.name.endsWith('.csv');
  const typeLabel = getFileTypeLabel(file);
  const sizeFormatted = formatFileSize(file.size);

  return (
    <div
      className="p-5 rounded-card border border-border bg-surface shadow-subtle space-y-4"
      role="region"
      aria-label="Selected timetable file"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3.5 min-w-0">
          {imagePreviewUrl ? (
            <div className="w-14 h-14 rounded-control overflow-hidden border border-border shrink-0 bg-primary-soft/30 flex items-center justify-center">
              <img
                src={imagePreviewUrl}
                alt="Timetable preview"
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="w-12 h-12 rounded-control bg-primary-soft text-primary flex items-center justify-center shrink-0">
              {isImage ? (
                <ImageIcon className="w-6 h-6" />
              ) : isSpreadsheet ? (
                <FileSpreadsheet className="w-6 h-6" />
              ) : (
                <FileText className="w-6 h-6" />
              )}
            </div>
          )}

          <div className="min-w-0 space-y-1">
            <h4
              className="text-sm font-semibold text-foreground truncate max-w-sm sm:max-w-md"
              title={file.name}
            >
              {file.name}
            </h4>
            <div className="flex items-center gap-2 text-xs text-foreground-muted">
              <span>{typeLabel}</span>
              <span>•</span>
              <span>{sizeFormatted}</span>
            </div>
          </div>
        </div>

        <Badge variant={isImage ? "primary" : "primary"} size="sm">
          {isImage ? "OCR Ready" : "Ready to Extract"}
        </Badge>
      </div>

      {/* Action Controls */}
      <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-t border-border/70">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={isUploading}
            onClick={onChange}
            leftIcon={RefreshCw}
          >
            Replace File
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={isUploading}
            onClick={onRemove}
            leftIcon={X}
          >
            Remove
          </Button>
        </div>

        <Button
          type="button"
          variant="primary"
          size="md"
          disabled={isUploading}
          isLoading={isUploading}
          onClick={onUpload}
          leftIcon={UploadCloud}
        >
          {isUploading ? 'Extracting Routine...' : 'Upload & Extract'}
        </Button>
      </div>
    </div>
  );
}

export default SelectedFile;
