import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import api from '../api';
import Icon from '../components/common/Icon';

export default function Register() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm();

  const onSubmit = async (formData) => {
    setSubmitError('');

    try {
      await api.post('/auth/register', formData);
      navigate('/login', {
        state: { message: 'Registration successful! Please log in to your account.' },
      });
    } catch (err) {
      setSubmitError(err.message || 'Registration failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-8">
      <div className="card p-8 max-w-md w-full animate-fade-in">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-primary-container flex items-center justify-center">
            <Icon name="school" size={28} className="text-white" />
          </div>
          <h1 className="text-headline-md text-on-surface">EduTrack Pro</h1>
        </div>
        <h2 className="text-title-lg text-on-surface mb-2">Registration</h2>
        <p className="text-body-md text-on-surface-variant mb-6">Create an account to join the platform.</p>

        {submitError && (
          <div className="bg-error/10 text-error p-3 rounded-lg mb-6 text-sm">
            {submitError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 mb-6">
          <div>
            <label className="block text-body-md text-on-surface font-medium mb-2">
              Full Name
            </label>
            <div className="relative">
              <Icon name="person" size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant" />
              <input
                type="text"
                {...register('name', {
                  required: 'Name is required',
                  minLength: { value: 2, message: 'Name must be at least 2 characters' },
                })}
                placeholder="John Doe"
                className={`input-field pl-12 ${errors.name ? 'border-error' : ''}`}
              />
            </div>
            {errors.name && (
              <p className="text-error text-sm mt-1">{errors.name.message}</p>
            )}
          </div>

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
                  pattern: { value: /@gmail\.com$/i, message: 'Only @gmail.com emails are allowed' },
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
                  pattern: {
                    value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{6,}$/,
                    message: 'Must include uppercase, lowercase, number, and special character',
                  },
                })}
                placeholder="Create a password"
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

          <button type="submit" disabled={isSubmitting} className="btn-primary w-full justify-center py-3 text-body-lg">
            {isSubmitting ? 'Registering...' : 'Sign Up'}
          </button>
        </form>

        <p className="text-center text-body-md text-on-surface-variant mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-primary-container hover:text-primary font-medium transition-colors">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
