import React, { useState, useEffect } from 'react';
import Icon from '../../components/common/Icon';
import DataTable from '../../components/common/DataTable';
import api from '../../api';

const statusColors = { Paid: 'chip-success', Overdue: 'chip-danger', Partial: 'chip-warning', Pending: 'chip-info' };

export default function Fees() {
  const [transactionsData, setTransactionsData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/fees')
      .then(res => {
        setTransactionsData(res.data?.fees || []);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching fees:', err.message || err);
        setLoading(false);
      });
  }, []);

  const columns = [
    { key: 'student', label: 'Student' },
    { key: 'class', label: 'Class' },
    { key: 'feeType', label: 'Fee Type' },
    { key: 'amount', label: 'Amount' },
    { key: 'amountPaid', label: 'Paid' },
    { key: 'status', label: 'Status', render: (val) => <span className={`chip ${statusColors[val] || 'bg-gray-50'}`}>{val}</span> },
    { key: 'date', label: 'Date' },
    { key: 'method', label: 'Method' },
  ];

  const handleDownloadPdf = () => {
    const dummyContent = `PDF Report for Fees Management\n\nTotal Revenue: ₹${totalRevenue.toLocaleString('en-IN')}\nCollected: ₹${totalCollected.toLocaleString('en-IN')}\nOutstanding: ₹${outstanding.toLocaleString('en-IN')}\n\nGenerated from active database.`;
    const blob = new Blob([dummyContent], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Fees_Report_${new Date().getFullYear()}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Calculations
  const totalRevenue = transactionsData.reduce((sum, f) => sum + (f.amountVal || 0), 0);
  const totalCollected = transactionsData.reduce((sum, f) => sum + (f.amountPaidVal || 0), 0);
  const outstanding = totalRevenue - totalCollected;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-header">Fees Management</h1>
          <p className="page-subtitle">Overview and transaction history for current academic year.</p>
        </div>
        <button className="btn-primary" onClick={handleDownloadPdf}><Icon name="download" size={18} />Download Report</button>
      </div>

      {outstanding > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
          <Icon name="priority_high" size={22} className="text-amber-600 mt-0.5" />
          <div>
            <p className="text-body-md text-amber-800 font-medium">Outstanding Dues Alert</p>
            <p className="text-body-md text-amber-700">There are active accounts with outstanding fees. Total dues: ₹{outstanding.toLocaleString('en-IN')}. Please follow up on pending balances.</p>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="stat-card">
          <p className="text-label-md text-on-surface-variant mb-1">Total Revenue</p>
          <p className="text-headline-md text-on-surface">₹{totalRevenue.toLocaleString('en-IN')}</p>
          <div className="flex items-center gap-1 mt-2 text-emerald-600">
            <Icon name="trending_up" size={16} />
            <span className="text-label-md">Active DB billing</span>
          </div>
        </div>
        <div className="stat-card">
          <p className="text-label-md text-on-surface-variant mb-1">Collected</p>
          <p className="text-headline-md text-on-surface">₹{totalCollected.toLocaleString('en-IN')}</p>
          <p className="text-body-md text-on-surface-variant mt-2">
            {totalRevenue > 0 ? `${Math.round((totalCollected / totalRevenue) * 100)}% collection rate` : '100% collection rate'}
          </p>
        </div>
        <div className="stat-card">
          <p className="text-label-md text-on-surface-variant mb-1">Outstanding</p>
          <p className="text-headline-md text-error">₹{outstanding.toLocaleString('en-IN')}</p>
          <div className="flex items-center gap-1 mt-2 text-error">
            <Icon name="priority_high" size={16} />
            <span className="text-label-md">Pending collection</span>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div>
        <h3 className="text-title-lg text-on-surface mb-4">Recent Transactions</h3>
        {loading ? (
          <div className="flex items-center justify-center min-h-[200px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <DataTable columns={columns} data={transactionsData} />
        )}
      </div>
    </div>
  );
}
