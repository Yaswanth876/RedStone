import { useState, useEffect, useId, useCallback } from 'react';
import { X, BookOpen, Clock, MapPin, User } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { WEEKDAY_NAMES } from '../../utils/dateTime.js';

/**
 * ClassForm — modal form for creating or editing a timetable entry.
 *
 * Fields (matching backend TimetableEntry schema):
 *   - subject (required, string, max 200)
 *   - dayOfWeek (required, integer 1–7)
 *   - startTime (required, HH:mm)
 *   - endTime (required, HH:mm, must be > startTime)
 *   - room (optional, string, max 100)
 *   - faculty (optional, string, max 200)
 *
 * @param {object} props
 * @param {boolean} props.isOpen
 * @param {function} props.onClose
 * @param {function} props.onSubmit - async (data) => void
 * @param {object|null} [props.entry] - Entry to edit, or null for create mode
 * @param {number} [props.initialDay=1] - Day of week to pre-select for new entries
 */
export function ClassForm({ isOpen, onClose, onSubmit, entry = null, initialDay = 1 }) {
  const isEditing = Boolean(entry);
  const formTitleId = useId();

  const [formData, setFormData] = useState({
    subject: '',
    dayOfWeek: initialDay || 1,
    startTime: '09:00',
    endTime: '10:00',
    room: '',
    faculty: '',
  });

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Populate form when editing or opening
  useEffect(() => {
    if (isOpen) {
      if (entry) {
        setFormData({
          subject: entry.subject || '',
          dayOfWeek: entry.dayOfWeek || 1,
          startTime: entry.startTime || '09:00',
          endTime: entry.endTime || '10:00',
          room: entry.room || '',
          faculty: entry.faculty || '',
        });
      } else {
        setFormData({
          subject: '',
          dayOfWeek: initialDay || 1,
          startTime: '09:00',
          endTime: '10:00',
          room: '',
          faculty: '',
        });
      }
      setErrors({});
      setSubmitError('');
      setSubmitting(false);
    }
  }, [isOpen, entry, initialDay]);

  const handleChange = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear field error on change
    setErrors(prev => {
      if (prev[field]) {
        const next = { ...prev };
        delete next[field];
        return next;
      }
      return prev;
    });
    setSubmitError('');
  }, []);

  const validate = useCallback(() => {
    const newErrors = {};

    const subject = formData.subject.trim();
    if (!subject) {
      newErrors.subject = 'Subject is required';
    } else if (subject.length > 200) {
      newErrors.subject = 'Subject must be 200 characters or less';
    }

    const day = Number(formData.dayOfWeek);
    if (!Number.isInteger(day) || day < 1 || day > 7) {
      newErrors.dayOfWeek = 'Please select a valid day';
    }

    const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;
    if (!timeRegex.test(formData.startTime)) {
      newErrors.startTime = 'Start time must be in HH:mm format';
    }
    if (!timeRegex.test(formData.endTime)) {
      newErrors.endTime = 'End time must be in HH:mm format';
    }

    if (!newErrors.startTime && !newErrors.endTime) {
      if (formData.endTime <= formData.startTime) {
        newErrors.endTime = 'End time must be later than start time';
      }
    }

    if (formData.room && formData.room.length > 100) {
      newErrors.room = 'Room must be 100 characters or less';
    }

    if (formData.faculty && formData.faculty.length > 200) {
      newErrors.faculty = 'Faculty must be 200 characters or less';
    }

    return newErrors;
  }, [formData]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setSubmitting(true);
    setSubmitError('');

    try {
      const payload = {
        subject: formData.subject.trim(),
        dayOfWeek: Number(formData.dayOfWeek),
        startTime: formData.startTime,
        endTime: formData.endTime,
      };

      // Only include optional fields if they have values
      const room = formData.room.trim();
      if (room) payload.room = room;

      const faculty = formData.faculty.trim();
      if (faculty) payload.faculty = faculty;

      await onSubmit(payload);
      onClose();
    } catch (err) {
      // Map backend validation errors to field-level when possible
      if (err.data?.details && Array.isArray(err.data.details)) {
        const fieldErrors = {};
        for (const detail of err.data.details) {
          const field = detail.path?.[0];
          if (field && !fieldErrors[field]) {
            fieldErrors[field] = detail.message;
          }
        }
        if (Object.keys(fieldErrors).length > 0) {
          setErrors(fieldErrors);
        }
      }
      setSubmitError(err.message || 'Failed to save class. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') {
      onClose();
    }
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={formTitleId}
      onKeyDown={handleKeyDown}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal panel */}
      <div className="relative w-full max-w-md bg-surface rounded-card border border-border shadow-lg max-h-[90vh] overflow-y-auto animate-in">
        {/* Header */}
        <div className="flex items-center justify-between p-5 pb-0">
          <h2
            id={formTitleId}
            className="text-lg font-semibold text-foreground"
          >
            {isEditing ? 'Edit Class' : 'Add New Class'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-control text-foreground-muted hover:text-foreground hover:bg-[#F0EDE8] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="px-5 mt-1 text-xs text-foreground-muted">
          {isEditing
            ? 'Update the details for this class entry.'
            : 'Fill in the details to add a new class to your timetable.'}
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4" noValidate>
          {/* Subject */}
          <Input
            label="Subject / Class Name"
            leftIcon={BookOpen}
            value={formData.subject}
            onChange={(e) => handleChange('subject', e.target.value)}
            error={errors.subject}
            required
            placeholder="e.g. Data Structures & Algorithms"
            autoFocus
          />

          {/* Day of Week */}
          <div className="flex flex-col gap-1.5 w-full">
            <label
              htmlFor="class-day"
              className="text-xs sm:text-sm font-medium text-foreground flex items-center gap-1"
            >
              Day of the Week
              <span className="text-error" aria-hidden="true">*</span>
            </label>
            <select
              id="class-day"
              value={formData.dayOfWeek}
              onChange={(e) => handleChange('dayOfWeek', Number(e.target.value))}
              className={`w-full h-11 px-3.5 text-sm bg-surface rounded-control border transition-colors duration-150 text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary ${
                errors.dayOfWeek
                  ? 'border-error focus-visible:ring-error'
                  : 'border-border hover:border-[#CDC8BF]'
              }`}
              aria-invalid={Boolean(errors.dayOfWeek)}
              required
            >
              {WEEKDAY_NAMES.map((name, i) => (
                <option key={i + 1} value={i + 1}>
                  {name}
                </option>
              ))}
            </select>
            {errors.dayOfWeek && (
              <p className="text-xs text-error font-medium" role="alert">
                {errors.dayOfWeek}
              </p>
            )}
          </div>

          {/* Time row */}
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Start Time"
              leftIcon={Clock}
              type="time"
              value={formData.startTime}
              onChange={(e) => handleChange('startTime', e.target.value)}
              error={errors.startTime}
              required
            />
            <Input
              label="End Time"
              leftIcon={Clock}
              type="time"
              value={formData.endTime}
              onChange={(e) => handleChange('endTime', e.target.value)}
              error={errors.endTime}
              required
            />
          </div>

          {/* Room */}
          <Input
            label="Room / Classroom"
            leftIcon={MapPin}
            value={formData.room}
            onChange={(e) => handleChange('room', e.target.value)}
            error={errors.room}
            placeholder="e.g. Lecture Hall A"
          />

          {/* Faculty */}
          <Input
            label="Faculty / Instructor"
            leftIcon={User}
            value={formData.faculty}
            onChange={(e) => handleChange('faculty', e.target.value)}
            error={errors.faculty}
            placeholder="e.g. Prof. Turing"
          />

          {/* Submit error banner */}
          {submitError && (
            <div
              className="p-3 rounded-control bg-error-soft border border-[#FECDCA] text-xs text-error font-medium"
              role="alert"
            >
              {submitError}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-2">
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={submitting}
            >
              {isEditing ? 'Save Changes' : 'Add Class'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ClassForm;
