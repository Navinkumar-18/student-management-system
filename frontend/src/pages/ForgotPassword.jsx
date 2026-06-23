import React from 'react';
import { Link } from 'react-router-dom';
import Icon from '../components/common/Icon';

export default function ForgotPassword() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-8">
      <div className="card p-8 max-w-md w-full animate-fade-in">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-primary-container flex items-center justify-center">
            <Icon name="school" size={28} className="text-white" />
          </div>
          <h1 className="text-headline-md text-on-surface">EduTrack Pro</h1>
        </div>
        <h2 className="text-title-lg text-on-surface mb-2">Reset Password</h2>
        <p className="text-body-md text-on-surface-variant mb-6">Enter your email address and we'll send you a link to reset your password.</p>
        <form className="space-y-4">
          <div>
            <label className="block text-body-md text-on-surface font-medium mb-2">Email Address</label>
            <input type="email" placeholder="your@email.com" className="input-field" />
          </div>
          <button type="submit" className="btn-primary w-full justify-center py-3">Send Reset Link</button>
        </form>
        <Link to="/login" className="block text-center text-body-md text-primary-container hover:text-primary mt-4 font-medium">Back to Login</Link>
      </div>
    </div>
  );
}
