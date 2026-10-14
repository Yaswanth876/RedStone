import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, ArrowRight, Eye, EyeOff, AlertCircle } from 'lucide-react';
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

function validateEmail(value) {
  if (!value.trim()) return 'Email is required';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) return 'Enter a valid email address';
  return null;
}

function validatePassword(value) {
  if (!value) return 'Password is required';
  return null;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function LoginPage() {
  useDocumentTitle('Sign In');

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Where to redirect after successful login
  const from = location.state?.from?.pathname || '/dashboard';

  function validate() {
    const newErrors = {};
    const emailErr = validateEmail(email);
    const passwordErr = validatePassword(password);
    if (emailErr) newErrors.email = emailErr;
    if (passwordErr) newErrors.password = passwordErr;
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
      await login(email.trim(), password);
      navigate(from, { replace: true });
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 401) {
          setServerError('Incorrect email or password. Please try again.');
        } else if (err.status === 400) {
          setServerError('Please check your input and try again.');
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

  function handleEmailChange(e) {
    setEmail(e.target.value);
    if (errors.email) setErrors((prev) => ({ ...prev, email: null }));
  }

  function handlePasswordChange(e) {
    setPassword(e.target.value);
    if (errors.password) setErrors((prev) => ({ ...prev, password: null }));
  }

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
            <CardTitle>Welcome back</CardTitle>
            <CardDescription>
              Sign in to manage your timetable and academic routine
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
                id="login-email"
                label="Student Email"
                type="email"
                placeholder="student@college.edu"
                required
                leftIcon={Mail}
                value={email}
                onChange={handleEmailChange}
                error={errors.email}
                autoComplete="email"
                disabled={isSubmitting}
              />

              <div className="relative">
                <Input
                  id="login-password"
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  required
                  leftIcon={Lock}
                  value={password}
                  onChange={handlePasswordChange}
                  error={errors.password}
                  autoComplete="current-password"
                  disabled={isSubmitting}
                />
                {/* Show/hide toggle sits outside Input to avoid rightIcon padding issues */}
                <button
                  type="button"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  onClick={() => setShowPassword((v) => !v)}
                  tabIndex={0}
                  className="absolute right-3.5 top-8 text-foreground-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded transition-colors"
                  disabled={isSubmitting}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </CardContent>

            <CardFooter className="flex-col gap-3">
              <Button
                id="login-submit"
                type="submit"
                className="w-full"
                rightIcon={isSubmitting ? undefined : ArrowRight}
                isLoading={isSubmitting}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Signing in…' : 'Sign in to RedStone'}
              </Button>

              <div className="text-center text-xs text-foreground-muted">
                Don&apos;t have an account?{' '}
                <Link
                  to="/register"
                  className="font-medium text-primary hover:underline"
                >
                  Create one
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}

export default LoginPage;
