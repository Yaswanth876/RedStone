import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, ArrowRight, Eye, EyeOff, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { SidebarLogo } from '../../components/layout/Sidebar';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { useAuth } from './useAuth.js';
import { ApiError } from '../../services/api.js';

// ─── Validation helpers ───────────────────────────────────────────────────────
// Rules match the backend zod schema exactly:
//   name:     string, trimmed, min 1, max 100
//   email:    valid email
//   password: string, min 8, max 72

function validateName(value) {
  if (!value.trim()) return 'Full name is required';
  if (value.trim().length > 100) return 'Name must be 100 characters or fewer';
  return null;
}

function validateEmail(value) {
  if (!value.trim()) return 'Email is required';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) return 'Enter a valid email address';
  return null;
}

function validatePassword(value) {
  if (!value) return 'Password is required';
  if (value.length < 8) return 'Password must be at least 8 characters';
  if (value.length > 72) return 'Password must be 72 characters or fewer';
  return null;
}

function validateConfirmPassword(password, confirm) {
  if (!confirm) return 'Please confirm your password';
  if (password !== confirm) return 'Passwords do not match';
  return null;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function RegisterPage() {
  useDocumentTitle('Create Account');

  const { register } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function validate() {
    const newErrors = {};
    const nameErr = validateName(name);
    const emailErr = validateEmail(email);
    const passwordErr = validatePassword(password);
    const confirmErr = validateConfirmPassword(password, confirmPassword);
    if (nameErr) newErrors.name = nameErr;
    if (emailErr) newErrors.email = emailErr;
    if (passwordErr) newErrors.password = passwordErr;
    if (confirmErr) newErrors.confirmPassword = confirmErr;
    return newErrors;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setServerError(null);

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setErrors({});

    setIsSubmitting(true);
    try {
      // Backend registers and returns a token in one step
      await register(name.trim(), email.trim(), password);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 409) {
          setErrors((prev) => ({
            ...prev,
            email: 'An account with this email already exists.',
          }));
        } else if (err.status === 400) {
          setServerError(err.message || 'Please check your details and try again.');
        } else if (err.status === 0) {
          setServerError('Unable to reach the server. Check your connection.');
        } else {
          setServerError(err.message || 'Something went wrong. Please try again.');
        }
      } else {
        setServerError('An unexpected error occurred.');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  function clearFieldError(field) {
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: null }));
  }

  // Password strength indicator
  const passwordStrength = (() => {
    if (!password) return null;
    if (password.length < 8) return { label: 'Too short', color: 'bg-error', width: 'w-1/4' };
    if (password.length < 12) return { label: 'Fair', color: 'bg-warning', width: 'w-1/2' };
    if (password.length < 16) return { label: 'Good', color: 'bg-info', width: 'w-3/4' };
    return { label: 'Strong', color: 'bg-success', width: 'w-full' };
  })();

  return (
    <div className="min-h-screen bg-page flex flex-col justify-center items-center p-4 sm:p-6">
      <div className="w-full max-w-md space-y-6">
        {/* Brand */}
        <div className="flex flex-col items-center text-center gap-1">
          <SidebarLogo className="mb-1" />
          <p className="text-xs text-foreground-muted mt-1">
            Academic Timetable &amp; Routine Manager
          </p>
        </div>

        <Card className="shadow-subtle">
          <CardHeader>
            <CardTitle>Create your account</CardTitle>
            <CardDescription>
              Start organizing your semester timetable with RedStone
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit} noValidate>
            <CardContent className="space-y-4">
              {/* Server-level error */}
              {serverError && (
                <div
                  role="alert"
                  className="flex items-start gap-2.5 p-3 rounded-control bg-[#FEE4E2] border border-[#FECDCA] text-error text-xs font-medium"
                >
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>{serverError}</span>
                </div>
              )}

              <Input
                id="register-name"
                label="Full Name"
                type="text"
                placeholder="Alex Morgan"
                required
                leftIcon={User}
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  clearFieldError('name');
                }}
                error={errors.name}
                autoComplete="name"
                disabled={isSubmitting}
              />

              <Input
                id="register-email"
                label="College Email"
                type="email"
                placeholder="student@college.edu"
                required
                leftIcon={Mail}
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  clearFieldError('email');
                }}
                error={errors.email}
                autoComplete="email"
                disabled={isSubmitting}
              />

              {/* Password with show/hide */}
              <div className="space-y-1.5">
                <div className="relative">
                  <Input
                    id="register-password"
                    label="Password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="At least 8 characters"
                    required
                    leftIcon={Lock}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      clearFieldError('password');
                      clearFieldError('confirmPassword');
                    }}
                    error={errors.password}
                    autoComplete="new-password"
                    disabled={isSubmitting}
                  />
                  <button
                    type="button"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3.5 top-8 text-foreground-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded transition-colors"
                    disabled={isSubmitting}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Password strength bar */}
                {passwordStrength && !errors.password && (
                  <div className="space-y-1">
                    <div className="h-1 w-full bg-border rounded-full overflow-hidden">
                      <div
                        className={`h-full ${passwordStrength.color} ${passwordStrength.width} transition-all duration-300 rounded-full`}
                      />
                    </div>
                    <p className="text-[11px] text-foreground-muted">
                      Password strength:{' '}
                      <span className="font-medium">{passwordStrength.label}</span>
                    </p>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div className="relative">
                <Input
                  id="register-confirm-password"
                  label="Confirm Password"
                  type={showConfirm ? 'text' : 'password'}
                  placeholder="Repeat your password"
                  required
                  leftIcon={
                    !errors.confirmPassword && confirmPassword && confirmPassword === password
                      ? CheckCircle2
                      : Lock
                  }
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    clearFieldError('confirmPassword');
                  }}
                  error={errors.confirmPassword}
                  autoComplete="new-password"
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  aria-label={showConfirm ? 'Hide password confirmation' : 'Show password confirmation'}
                  onClick={() => setShowConfirm((v) => !v)}
                  className="absolute right-3.5 top-8 text-foreground-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded transition-colors"
                  disabled={isSubmitting}
                >
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </CardContent>

            <CardFooter className="flex-col gap-3">
              <Button
                id="register-submit"
                type="submit"
                className="w-full"
                rightIcon={isSubmitting ? undefined : ArrowRight}
                isLoading={isSubmitting}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Creating account…' : 'Create RedStone Account'}
              </Button>

              <div className="text-center text-xs text-foreground-muted">
                Already have an account?{' '}
                <Link
                  to="/login"
                  className="font-medium text-primary hover:underline"
                >
                  Sign in
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}

export default RegisterPage;
