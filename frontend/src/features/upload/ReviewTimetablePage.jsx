import { useState, useMemo, useCallback } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import {
  ClipboardCheck,
  Plus,
  ArrowLeft,
  UploadCloud,
  RotateCcw,
  AlertCircle,
  CheckCircle2,
  Calendar,
  AlertTriangle,
} from 'lucide-react';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import {
  getExtractionSession,
  clearExtractionSession,
  importEntries,
} from '../../services/upload.service.js';
import {
  analyzeReviewEntries,
  sanitizeEntryForImport,
} from './review.validation.js';
import { ReviewSummaryBar } from './ReviewSummaryBar.jsx';
import { ReviewEntryRow } from './ReviewEntryRow.jsx';
import { ReviewEntryCard } from './ReviewEntryCard.jsx';
import { ConfirmImportDialog } from './ConfirmImportDialog.jsx';

/**
 * ReviewTimetablePage — interactive review screen for candidate timetable entries.
 * Mounted at /import/review.
 *
 * Ensures candidate entries are never saved automatically. The user must explicitly
 * review, edit, validate, and confirm import before permanent records are written.
 */
export function ReviewTimetablePage() {
  useDocumentTitle('Review Timetable');
  const location = useLocation();
  const navigate = useNavigate();

  // Load initial extraction payload from Router location.state or sessionStorage fallback
  const initialPayload = useMemo(() => {
    if (location.state && location.state.entries) {
      return location.state;
    }
    return getExtractionSession();
  }, [location.state]);

  const timetableId = initialPayload?.timetableId || null;
  const filename = initialPayload?.filename || 'Uploaded Document';

  // State: Candidate rows with stable client-side _rowId
  const [rows, setRows] = useState(() => {
    if (!initialPayload || !Array.isArray(initialPayload.entries)) {
      return [];
    }
    return initialPayload.entries.map((entry, index) => ({
      ...entry,
      _rowId: `candidate-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 7)}`,
      room: entry.room ?? '',
      faculty: entry.faculty ?? '',
    }));
  });

  // State: Undo accidental row deletion
  const [deletedRowInfo, setDeletedRowInfo] = useState(null);

  // State: Confirm Import Dialog
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  // State: Discard Import Confirmation
  const [isDiscardConfirmOpen, setIsDiscardConfirmOpen] = useState(false);

  // State: Successful import confirmation
  const [importSuccess, setImportSuccess] = useState(null);

  // Dynamic analysis & validation across all rows
  const analysis = useMemo(() => {
    return analyzeReviewEntries(rows);
  }, [rows]);

  // Handler: Edit specific field on a row
  const handleRowChange = useCallback((rowId, field, value) => {
    setRows((prev) =>
      prev.map((row) => (row._rowId === rowId ? { ...row, [field]: value } : row))
    );
    setSubmitError(null);
  }, []);

  // Handler: Add a new class row
  const handleAddRow = useCallback(() => {
    const newRow = {
      _rowId: `manual-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      subject: '',
      dayOfWeek: 1,
      startTime: '09:00',
      endTime: '10:00',
      room: '',
      faculty: '',
    };
    setRows((prev) => [...prev, newRow]);
    setSubmitError(null);
  }, []);

  // Handler: Remove a candidate row (with undo)
  const handleRemoveRow = useCallback(
    (rowId) => {
      const index = rows.findIndex((r) => r._rowId === rowId);
      if (index === -1) return;
      const targetRow = rows[index];

      setDeletedRowInfo({ row: targetRow, index });
      setRows((prev) => prev.filter((r) => r._rowId !== rowId));
      setSubmitError(null);
    },
    [rows]
  );

  // Handler: Undo row removal
  const handleUndoRemove = useCallback(() => {
    if (!deletedRowInfo) return;
    setRows((prev) => {
      const copy = [...prev];
      copy.splice(deletedRowInfo.index, 0, deletedRowInfo.row);
      return copy;
    });
    setDeletedRowInfo(null);
  }, [deletedRowInfo]);

  // Handler: Discard import
  const handleDiscard = useCallback(() => {
    clearExtractionSession();
    navigate('/import');
  }, [navigate]);

  // Handler: Submit to backend
  const handleConfirmSave = useCallback(async () => {
    if (!timetableId) {
      setSubmitError('Timetable ID is missing. Please return to the upload page and try again.');
      return;
    }

    if (analysis.hasBlockingErrors || rows.length === 0) {
      setSubmitError('Please resolve all validation errors before saving.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const sanitizedEntries = rows.map(sanitizeEntryForImport);
      const response = await importEntries(timetableId, sanitizedEntries);

      // Clear the temporary staging session
      clearExtractionSession();

      setImportSuccess({
        count: response.count,
        message: response.message,
      });
      setIsConfirmOpen(false);
    } catch (err) {
      setSubmitError(
        err.message || 'Failed to save entries to your timetable. Please review errors and retry.'
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [timetableId, rows, analysis.hasBlockingErrors]);

  // 1. Missing / Empty Staging State
  if (!initialPayload || rows.length === 0 && !deletedRowInfo && !importSuccess) {
    return (
      <div className="space-y-6 sm:space-y-8">
        <PageHeader
          title="Review Your Timetable"
          description="Verify and refine extracted classes before committing them to your timetable."
        />

        <Card>
          <CardContent className="py-12">
            <EmptyState
              icon={UploadCloud}
              title="No Candidates in Staging"
              description="No timetable extraction results are currently loaded. Upload a timetable document to begin the review workflow, or add classes manually."
              action={
                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <Link to="/import">
                    <Button variant="primary" size="md" leftIcon={UploadCloud}>
                      Upload Timetable File
                    </Button>
                  </Link>
                  <Link to="/timetable">
                    <Button variant="outline" size="md" leftIcon={Calendar}>
                      Go to My Timetable
                    </Button>
                  </Link>
                </div>
              }
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  // 2. Success State after permanent save
  if (importSuccess) {
    return (
      <div className="space-y-6 sm:space-y-8">
        <PageHeader
          title="Import Complete"
          description="Your timetable entries have been successfully saved."
        />

        <Card className="border-[#CDEED5] bg-[#EBF7EE]/40">
          <CardContent className="p-8 sm:p-12 text-center space-y-5">
            <div className="w-16 h-16 rounded-full bg-[#EBF7EE] text-[#1E7B34] flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-1 max-w-md mx-auto">
              <h3 className="text-xl font-bold text-foreground">
                {importSuccess.count} {importSuccess.count === 1 ? 'Class' : 'Classes'} Saved!
              </h3>
              <p className="text-xs sm:text-sm text-foreground-muted">
                Your classes have been permanently added to your timetable. You can now view your weekly routine or inspect today&apos;s schedule on your dashboard.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Link to="/timetable">
                <Button variant="primary" size="md" leftIcon={Calendar}>
                  View Weekly Timetable
                </Button>
              </Link>
              <Link to="/dashboard">
                <Button variant="outline" size="md">
                  Go to Dashboard
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Page Header */}
      <PageHeader
        title="Review Your Timetable"
        description={`Inspect and correct extracted classes from "${filename}" before committing them to your timetable.`}
        badge={
          <Badge variant="primary" size="sm">
            {rows.length} {rows.length === 1 ? 'Candidate' : 'Candidates'}
          </Badge>
        }
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="md"
              leftIcon={ArrowLeft}
              onClick={() => setIsDiscardConfirmOpen(true)}
            >
              Discard Import
            </Button>
            <Button
              variant="primary"
              size="md"
              leftIcon={ClipboardCheck}
              disabled={analysis.hasBlockingErrors || rows.length === 0}
              onClick={() => {
                setSubmitError(null);
                setIsConfirmOpen(true);
              }}
            >
              Save Timetable
            </Button>
          </div>
        }
      />

      {/* Dynamic Summary Bar */}
      <ReviewSummaryBar
        totalCount={analysis.totalCount}
        validCount={analysis.validCount}
        invalidCount={analysis.invalidCount}
        conflictCount={analysis.conflictCount}
        duplicateCount={analysis.duplicateCount}
        hasBlockingErrors={analysis.hasBlockingErrors}
      />

      {/* Undo Banner if a row was removed */}
      {deletedRowInfo && (
        <div
          role="status"
          className="flex items-center justify-between p-3.5 rounded-control bg-[#FAF9F6] border border-border text-xs text-foreground font-medium"
        >
          <span>
            Removed class <strong>&quot;{deletedRowInfo.row.subject || 'Untitled'}&quot;</strong>.
          </span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleUndoRemove}
            leftIcon={RotateCcw}
          >
            Undo
          </Button>
        </div>
      )}

      {/* Server Error Alert Banner */}
      {submitError && (
        <div
          role="alert"
          className="p-4 rounded-control bg-[#FEE4E2] border border-[#FECDCA] text-error flex items-start gap-3 text-xs"
        >
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold">Unable to Save Timetable</p>
            <p>{submitError}</p>
          </div>
        </div>
      )}

      {/* Editable Table Container */}
      <Card>
        <CardHeader className="border-b border-border/70 pb-3 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base">Candidate Entries</CardTitle>
            <CardDescription className="text-xs">
              Edit any field inline. All entries must be valid before saving.
            </CardDescription>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddRow}
            leftIcon={Plus}
          >
            Add Class Row
          </Button>
        </CardHeader>

        <CardContent className="p-0">
          {/* Desktop Table Layout (hidden on mobile) */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF9F6] border-b border-border text-foreground-muted font-semibold">
                <tr>
                  <th className="py-2.5 px-3">Day of Week *</th>
                  <th className="py-2.5 px-3">Subject Name *</th>
                  <th className="py-2.5 px-2">Start Time *</th>
                  <th className="py-2.5 px-2">End Time *</th>
                  <th className="py-2.5 px-2">Room</th>
                  <th className="py-2.5 px-2">Faculty</th>
                  <th className="py-2.5 px-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <ReviewEntryRow
                    key={row._rowId}
                    entry={row}
                    status={analysis.rowStatuses.get(row._rowId)}
                    onChange={(field, value) => handleRowChange(row._rowId, field, value)}
                    onRemove={() => handleRemoveRow(row._rowId)}
                    disabled={isSubmitting}
                  />
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card Layout (visible on mobile screens) */}
          <div className="md:hidden p-4 space-y-3">
            {rows.map((row) => (
              <ReviewEntryCard
                key={row._rowId}
                entry={row}
                status={analysis.rowStatuses.get(row._rowId)}
                onChange={(field, value) => handleRowChange(row._rowId, field, value)}
                onRemove={() => handleRemoveRow(row._rowId)}
                disabled={isSubmitting}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Discard Confirmation Modal */}
      {isDiscardConfirmOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-sm rounded-card bg-surface border border-border p-6 space-y-4 shadow-popover">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-[#FEF6E7] text-warning flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h4 className="text-base font-semibold text-foreground">
                  Discard Unsaved Import?
                </h4>
                <p className="text-xs text-foreground-muted">
                  Are you sure you want to discard these candidate classes? All edits made during review will be lost.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsDiscardConfirmOpen(false)}
              >
                Keep Reviewing
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleDiscard}
              >
                Discard &amp; Return
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Explicit Save Confirmation Dialog */}
      <ConfirmImportDialog
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirmSave}
        count={analysis.validCount}
        warningCount={analysis.duplicateCount}
        isSaving={isSubmitting}
        error={submitError}
      />
    </div>
  );
}

export default ReviewTimetablePage;
