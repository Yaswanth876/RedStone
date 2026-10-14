import { useMemo } from 'react';
import { Clock, Globe, Palette, Check } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { usePreferences } from './usePreferences.js';
import { getCurrentTimeInTimezone } from '../../utils/dateTime.js';

/**
 * PreferencesSection — allows toggling display preferences (12h vs 24h) and inspects institutional timezone.
 */
export function PreferencesSection() {
  const { timeFormat, setTimeFormat, timezone, formatTime } = usePreferences();

  // Current preview time
  const sampleTime24 = useMemo(() => getCurrentTimeInTimezone(timezone), [timezone]);
  const formattedSample = useMemo(() => formatTime(sampleTime24), [formatTime, sampleTime24]);

  return (
    <Card>
      <CardHeader className="border-b border-border/70 pb-4">
        <CardTitle className="text-base">Display &amp; Schedule Preferences</CardTitle>
        <CardDescription className="text-xs">
          Customize how class timings and schedule information are formatted across your application.
        </CardDescription>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        {/* 1. Time Display Format */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-primary" />
              <span>Time Display Format</span>
            </label>
            <span className="text-[11px] text-foreground-muted">
              Live Preview: <strong className="text-primary font-semibold">{formattedSample}</strong>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" role="radiogroup" aria-label="Time display format">
            {/* 12-Hour Option */}
            <button
              type="button"
              role="radio"
              aria-checked={timeFormat === '12h'}
              onClick={() => setTimeFormat('12h')}
              className={`p-3.5 rounded-control border text-left flex items-start justify-between transition-all ${
                timeFormat === '12h'
                  ? 'border-primary bg-primary-soft/40 ring-1 ring-primary/30 shadow-subtle'
                  : 'border-border bg-surface hover:border-border/80 hover:bg-[#FAF9F6]'
              }`}
            >
              <div className="space-y-0.5">
                <span className="text-xs font-semibold text-foreground">
                  12-Hour Format (AM/PM)
                </span>
                <p className="text-[11px] text-foreground-muted">
                  e.g., 9:30 AM, 2:15 PM, 5:00 PM
                </p>
              </div>
              {timeFormat === '12h' && (
                <div className="w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center shrink-0">
                  <Check className="w-3 h-3 stroke-[3]" />
                </div>
              )}
            </button>

            {/* 24-Hour Option */}
            <button
              type="button"
              role="radio"
              aria-checked={timeFormat === '24h'}
              onClick={() => setTimeFormat('24h')}
              className={`p-3.5 rounded-control border text-left flex items-start justify-between transition-all ${
                timeFormat === '24h'
                  ? 'border-primary bg-primary-soft/40 ring-1 ring-primary/30 shadow-subtle'
                  : 'border-border bg-surface hover:border-border/80 hover:bg-[#FAF9F6]'
              }`}
            >
              <div className="space-y-0.5">
                <span className="text-xs font-semibold text-foreground">
                  24-Hour Format (Military)
                </span>
                <p className="text-[11px] text-foreground-muted">
                  e.g., 09:30, 14:15, 17:00
                </p>
              </div>
              {timeFormat === '24h' && (
                <div className="w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center shrink-0">
                  <Check className="w-3 h-3 stroke-[3]" />
                </div>
              )}
            </button>
          </div>
          <p className="text-[11px] text-foreground-muted">
            Stored locally in your browser. Automatically applied to weekly grid cards, daily agenda schedules, and dashboard lecture indicators.
          </p>
        </div>

        <div className="border-t border-border/70 pt-5 space-y-4">
          {/* 2. Institutional Timezone */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-control bg-[#FAF9F6] border border-border">
            <div className="flex items-center gap-3">
              <Globe className="w-4 h-4 text-primary shrink-0" />
              <div>
                <p className="text-xs font-semibold text-foreground">
                  Academic Timezone
                </p>
                <p className="text-[11px] text-foreground-muted">
                  {timezone} (Indian Standard Time — UTC+5:30)
                </p>
              </div>
            </div>
            <Badge variant="neutral" size="sm">
              Standard
            </Badge>
          </div>

          {/* 3. Theme Specification */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-control bg-[#FAF9F6] border border-border">
            <div className="flex items-center gap-3">
              <Palette className="w-4 h-4 text-primary shrink-0" />
              <div>
                <p className="text-xs font-semibold text-foreground">
                  Application Theme
                </p>
                <p className="text-[11px] text-foreground-muted">
                  Clean Academic Palette (Crimson &amp; Cream)
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-primary" title="Primary Crimson (#B93832)" />
              <span className="w-3 h-3 rounded-full bg-[#F8F7F4] border border-border" title="Cream Canvas (#F8F7F4)" />
              <span className="w-3 h-3 rounded-full bg-[#242424]" title="Text Charcoal (#242424)" />
              <Badge variant="neutral" size="sm" className="ml-1">
                Light Mode
              </Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default PreferencesSection;
