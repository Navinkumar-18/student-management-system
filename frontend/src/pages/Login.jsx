import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import Icon from '../components/common/Icon';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated, role } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [submitError, setSubmitError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm();

  useEffect(() => {
    if (location.state?.message) {
      setSuccessMessage(location.state.message);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);

  useEffect(() => {
    if (isAuthenticated) {
      const redirectMap = { admin: '/admin/dashboard', teacher: '/teacher/dashboard', student: '/student/dashboard' };
      navigate(redirectMap[role] || '/login', { replace: true });
    }
  }, [isAuthenticated, role, navigate]);

  const onSubmit = async (formData) => {
    setSubmitError('');

    try {
      const res = await api.post('/auth/login', formData);
      login(res.data);
      const redirectMap = { admin: '/admin/dashboard', teacher: '/teacher/dashboard', student: '/student/dashboard' };
      navigate(redirectMap[res.data.role] || '/student/dashboard');
    } catch (err) {
      setSubmitError(err.message || 'An error occurred. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex">
      <div className="w-full flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md animate-fade-in">
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-primary-container flex items-center justify-center">
              <Icon name="school" size={28} className="text-white" />
            </div>
            <h1 className="text-headline-md text-on-surface">EduTrack Pro</h1>
          </div>

          <h2 className="text-headline-lg text-on-surface mb-2">Welcome back</h2>
          <p className="text-body-lg text-on-surface-variant mb-8">
            Please enter your details to sign in.
          </p>

          {successMessage && (
            <div className="bg-emerald-50 text-emerald-700 p-3 rounded-lg mb-6 text-sm flex items-center gap-2">
              <Icon name="check_circle" size={20} className="text-emerald-700" />
              <span>{successMessage}</span>
            </div>
          )}

          {submitError && (
            <div className="bg-error/10 text-error p-3 rounded-lg mb-6 text-sm">
              {submitError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="block text-body-md text-on-surface font-medium mb-2">
                Email Address
              </label>
              <div className="relative">
                <Icon name="mail" size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant" />
                <input
                  type="email"
                  {...register('email', {
                    required: 'Email is required',
                    pattern: { value: /@gmail\.com$/i, message: 'Please enter a valid @gmail.com email' },
                  })}
                  placeholder="Enter email id"
                  className={`input-field pl-12 ${errors.email ? 'border-error' : ''}`}
                />
              </div>
              {errors.email && (
                <p className="text-error text-sm mt-1">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="block text-body-md text-on-surface font-medium mb-2">
                Password
              </label>
              <div className="relative">
                <Icon name="settings" size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  {...register('password', {
                    required: 'Password is required',
                    minLength: { value: 6, message: 'Password must be at least 6 characters' },
                  })}
                  placeholder="Enter your password"
                  className={`input-field pl-12 pr-12 ${errors.password ? 'border-error' : ''}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface transition-colors"
                >
                  <Icon name={showPassword ? 'visibility_off' : 'visibility'} size={20} />
                </button>
              </div>
              {errors.password && (
                <p className="text-error text-sm mt-1">{errors.password.message}</p>
              )}
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 rounded border-outline-variant text-primary-container focus:ring-primary-container/20" />
                <span className="text-body-md text-on-surface-variant">Remember me</span>
              </label>
              <Link to="/forgot-password" className="text-body-md text-primary-container hover:text-primary transition-colors font-medium">
                Forgot Password?
              </Link>
            </div>

            <button type="submit" disabled={isSubmitting} className="btn-primary w-full justify-center py-3 text-body-lg">
              {isSubmitting ? 'Signing In...' : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-body-md text-on-surface-variant mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary-container hover:text-primary font-medium transition-colors">
              Sign Up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
