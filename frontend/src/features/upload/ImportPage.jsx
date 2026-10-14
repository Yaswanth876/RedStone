import { useState, useCallback, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  FileText,
  FileSpreadsheet,
  AlertCircle,
  Calendar,
  CheckCircle2,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { getOrCreateDefaultTimetable } from '../../services/timetable.service.js';
import {
  validateFile,
  uploadAndExtractTimetable,
  saveExtractionSession,
  formatFileSize,
  MAX_FILE_SIZE_BYTES,
} from '../../services/upload.service.js';
import { FileDropzone } from './FileDropzone.jsx';
import { SelectedFile } from './SelectedFile.jsx';
import { UploadProgress } from './UploadProgress.jsx';
import { ExtractionSummary } from './ExtractionSummary.jsx';

export function ImportPage() {
  useDocumentTitle('Import Timetable');
  const navigate = useNavigate();

  // State
  const [selectedFile, setSelectedFile] = useState(null);
  const [validationError, setValidationError] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [extractionResult, setExtractionResult] = useState(null);

  const abortControllerRef = useRef(null);

  // File selection handler with client-side validation
  const handleFileSelected = useCallback((file) => {
    // Reset previous errors and extraction results
    setValidationError('');
    setUploadError(null);
    setExtractionResult(null);

    const validation = validateFile(file);
    if (!validation.valid) {
      setSelectedFile(null);
      setValidationError(validation.error);
      return;
    }

    setSelectedFile(file);
  }, []);

  // Remove selected file
  const handleRemoveFile = useCallback(() => {
    if (isUploading) return;
    setSelectedFile(null);
    setValidationError('');
    setUploadError(null);
    setExtractionResult(null);
  }, [isUploading]);

  // Upload and extract handler
  const handleUpload = useCallback(async () => {
    if (!selectedFile || isUploading) return;

    // Validate once more prior to upload
    const validation = validateFile(selectedFile);
    if (!validation.valid) {
      setValidationError(validation.error);
      return;
    }

    setIsUploading(true);
    setUploadError(null);
    setExtractionResult(null);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      // 1. Resolve default timetable ID for the user
      const defaultTimetable = await getOrCreateDefaultTimetable({
        signal: controller.signal,
      });

      if (!defaultTimetable || !defaultTimetable.id) {
        throw new Error('Unable to resolve user timetable. Please refresh the page and try again.');
      }

      // 2. Perform upload and synchronous extraction
      const result = await uploadAndExtractTimetable(
        defaultTimetable.id,
        selectedFile,
        { signal: controller.signal }
      );

      // 3. Staging and Module 5 handoff preparation
      const sessionPayload = {
        timetableId: defaultTimetable.id,
        filename: selectedFile.name,
        entries: result.entries || [],
        warnings: result.warnings || [],
      };

      // Save to sessionStorage for refresh tolerance and review workflow handoff
      saveExtractionSession(sessionPayload);

      setExtractionResult(sessionPayload);
    } catch (err) {
      if (err.name === 'AbortError' || controller.signal.aborted) {
        return;
      }

      let friendlyMessage = err.message || 'Failed to process document upload. Please try again.';
      if (err.status === 413) {
        friendlyMessage = `File exceeds the maximum upload size limit of ${formatFileSize(
          MAX_FILE_SIZE_BYTES
        )}.`;
      } else if (err.status === 415) {
        friendlyMessage = 'The uploaded file format is unsupported by the server parser.';
      } else if (err.status === 422) {
        friendlyMessage =
          'The document could not be parsed into recognizable timetable tables. Try a CSV/Excel export or enter classes manually.';
      }

      setUploadError(friendlyMessage);
    } finally {
      setIsUploading(false);
    }
  }, [selectedFile, isUploading]);

  // Navigate to review step (Module 5 handoff)
  const handleProceedToReview = useCallback(() => {
    if (!extractionResult) return;
    navigate('/import/review', { state: extractionResult });
  }, [navigate, extractionResult]);

  // Reset to initial idle state
  const handleReset = useCallback(() => {
    setSelectedFile(null);
    setValidationError('');
    setUploadError(null);
    setExtractionResult(null);
  }, []);

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Page Header */}
      <PageHeader
        title="Import Your Timetable"
        description="Upload an existing routine document to automatically extract and populate your weekly classes."
        badge={
          <Badge variant="primary" size="sm">
            Automated Ingestion
          </Badge>
        }
        actions={
          <Link to="/timetable">
            <Button variant="outline" size="md" leftIcon={Calendar}>
              Manual Entry
            </Button>
          </Link>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        {/* Main Upload / Extraction Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card containing the Ingestion Workflow */}
          <Card>
            <CardHeader className="border-b border-border/70 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Document Upload &amp; Extraction</CardTitle>
                  <p className="text-xs text-foreground-muted mt-0.5">
                    Drag your file below or pick from your local storage.
                  </p>
                </div>
                {extractionResult && (
                  <Badge variant="success" size="sm">
                    Extraction Complete
                  </Badge>
                )}
              </div>
            </CardHeader>

            <CardContent className="p-6 space-y-6">
              {/* Validation Error Banner */}
              {validationError && (
                <div
                  role="alert"
                  className="p-4 rounded-control bg-[#FEE4E2] border border-[#FECDCA] text-error flex items-start gap-3 text-xs"
                >
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <p className="font-semibold">Invalid File Selection</p>
                    <p>{validationError}</p>
                  </div>
                </div>
              )}

              {/* Upload / Server Error Banner */}
              {uploadError && (
                <div
                  role="alert"
                  className="p-4 rounded-control bg-[#FEE4E2] border border-[#FECDCA] text-error space-y-3"
                >
                  <div className="flex items-start gap-3 text-xs">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <div className="space-y-0.5">
                      <p className="font-semibold">Extraction Failed</p>
                      <p>{uploadError}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pt-1 border-t border-[#FECDCA]/60">
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      onClick={handleUpload}
                      leftIcon={RefreshCw}
                    >
                      Retry Upload
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleReset}
                    >
                      Choose Different File
                    </Button>
                  </div>
                </div>
              )}

              {/* Workflow State 1: Results displayed after extraction */}
              {extractionResult ? (
                <ExtractionSummary
                  entries={extractionResult.entries}
                  warnings={extractionResult.warnings}
                  filename={extractionResult.filename}
                  onReview={handleProceedToReview}
                  onReset={handleReset}
                />
              ) : (
                /* Workflow State 2: Dropzone or Selected File */
                <div className="space-y-4">
                  {!selectedFile ? (
                    <FileDropzone
                      onFileSelected={handleFileSelected}
                      disabled={isUploading}
                    />
                  ) : (
                    <div className="space-y-4">
                      <SelectedFile
                        file={selectedFile}
                        isUploading={isUploading}
                        onUpload={handleUpload}
                        onRemove={handleRemoveFile}
                        onChange={() => {
                          const input = document.createElement('input');
                          input.type = 'file';
                          input.accept =
                            '.pdf,.csv,.xlsx,application/pdf,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
                          input.onchange = (e) => {
                            if (e.target.files?.[0]) {
                              handleFileSelected(e.target.files[0]);
                            }
                          };
                          input.click();
                        }}
                      />

                      {/* Processing Indicator */}
                      {isUploading && (
                        <UploadProgress fileName={selectedFile.name} />
                      )}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar: Formats, Tips, & Manual Link */}
        <div className="space-y-6">
          {/* Supported Formats Card */}
          <Card className="bg-[#FAF9F6]">
            <CardHeader className="pb-3 border-b border-border/60">
              <CardTitle className="text-sm">Supported Formats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div className="flex items-start gap-3 text-xs text-foreground">
                <div className="w-8 h-8 rounded-control bg-primary-soft text-primary flex items-center justify-center shrink-0">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-semibold">PDF Timetables (.pdf)</span>
                  <p className="text-foreground-muted text-[11px] mt-0.5">
                    Official digital institutional schedules with text tables. Scanned images require OCR.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 text-xs text-foreground">
                <div className="w-8 h-8 rounded-control bg-primary-soft text-primary flex items-center justify-center shrink-0">
                  <FileSpreadsheet className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-semibold">Excel Spreadsheets (.xlsx)</span>
                  <p className="text-foreground-muted text-[11px] mt-0.5">
                    Structured routines with headers for subject, weekday, and class times.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 text-xs text-foreground">
                <div className="w-8 h-8 rounded-control bg-primary-soft text-primary flex items-center justify-center shrink-0">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-semibold">Comma-Separated Values (.csv)</span>
                  <p className="text-foreground-muted text-[11px] mt-0.5">
                    Lightweight tabular export format. Up to {formatFileSize(MAX_FILE_SIZE_BYTES)}.
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-border/70 flex items-center gap-2 text-[11px] text-foreground-muted">
                <CheckCircle2 className="w-3.5 h-3.5 text-success shrink-0" />
                <span>Backend parser validates magic file signatures</span>
              </div>
            </CardContent>
          </Card>

          {/* Privacy & Safe Staging Note */}
          <Card className="bg-[#FAF9F6]">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-primary" />
                <CardTitle className="text-sm">Safe Ingestion</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 pt-0 text-xs text-foreground-muted">
              <p>
                Uploaded documents are processed in memory and never written to permanent disk storage.
              </p>
              <p>
                Extracted classes are kept in temporary staging for your review in Module 5 and are never automatically committed without your confirmation.
              </p>
            </CardContent>
          </Card>

          {/* Prefer Manual Entry Shortcut */}
          <Card className="border-dashed">
            <CardContent className="p-4 flex items-center justify-between gap-3">
              <div className="space-y-0.5">
                <h5 className="text-xs font-semibold text-foreground">
                  Prefer entering classes manually?
                </h5>
                <p className="text-[11px] text-foreground-muted">
                  Add and customize courses directly on your weekly timetable.
                </p>
              </div>
              <Link to="/timetable" className="shrink-0">
                <Button variant="outline" size="sm">
                  Timetable
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default ImportPage;
