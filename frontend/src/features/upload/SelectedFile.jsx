import { FileText, FileSpreadsheet, X, UploadCloud, RefreshCw } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { formatFileSize, getFileTypeLabel } from '../../services/upload.service.js';

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
  if (!file) return null;

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
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-12 h-12 rounded-control bg-primary-soft text-primary flex items-center justify-center shrink-0">
            {isSpreadsheet ? (
              <FileSpreadsheet className="w-6 h-6" />
            ) : (
              <FileText className="w-6 h-6" />
            )}
          </div>

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

        <Badge variant="primary" size="sm">
          Ready to Extract
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
