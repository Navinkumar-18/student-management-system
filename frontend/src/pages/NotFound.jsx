import React from 'react';
import { Link } from 'react-router-dom';
import Icon from '../components/common/Icon';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-8">
      <div className="text-center animate-fade-in">
        <div className="w-20 h-20 rounded-2xl bg-primary-container/10 flex items-center justify-center mx-auto mb-6">
          <Icon name="search" size={40} className="text-primary-container" />
        </div>
        <h1 className="text-display-lg text-on-surface mb-2">404</h1>
        <p className="text-body-lg text-on-surface-variant mb-8">Page not found. The page you're looking for doesn't exist.</p>
        <Link to="/admin/dashboard" className="btn-primary">
          <Icon name="dashboard" size={18} />Go to Dashboard
        </Link>
      </div>
    </div>
  );
}
