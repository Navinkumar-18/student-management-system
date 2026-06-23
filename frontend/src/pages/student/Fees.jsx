import React, { useState, useEffect } from 'react';
import api from '../../api';
import Icon from '../../components/common/Icon';
import Modal from '../../components/common/Modal';

export default function StudentFees() {
  const email = localStorage.getItem('edutrack_email') || 'student@edutrack.pro';
  const [fees, setFees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [processing, setProcessing] = useState(false);

  const fetchFees = () => {
    api.get(`/fees?studentEmail=${email}`)
      .then(res => {
        setFees(res.data?.fees || []);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching fees:', err.message || err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchFees();
  }, [email]);

  // Calculations
  const totalFees = fees.reduce((sum, f) => sum + (f.amountVal || 0), 0);
  const totalPaid = fees.reduce((sum, f) => sum + (f.amountPaidVal || 0), 0);
  const balance = totalFees - totalPaid;

  const handlePaymentSubmit = (e) => {
    e.preventDefault();
    // Find the first fee record with outstanding balance
    const outstandingFee = fees.find(f => f.status !== 'Paid');
    if (!outstandingFee) return;

    setProcessing(true);

    api.put(`/fees/${outstandingFee.id}`, {
      status: 'Paid',
      amountPaid: outstandingFee.amountVal,
      paymentMethod: paymentMethod
    })
      .then(() => {
        setProcessing(false);
        setPayModalOpen(false);
        fetchFees();
      })
      .catch(err => {
        console.error('Error paying fee:', err.message || err);
        setProcessing(false);
        setPayModalOpen(false);
      });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-header">My Fees</h1>
          <p className="page-subtitle">View your tuition fee structure, balances, and payment logs.</p>
        </div>
        {balance > 0 && (
          <button className="btn-primary" onClick={() => setPayModalOpen(true)}>
            <Icon name="payment" size={18} />
            Pay Balance (₹{balance.toLocaleString('en-IN')})
          </button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="stat-card">
          <p className="text-label-md text-on-surface-variant mb-1">Total Term Fees</p>
          <p className="text-headline-md text-on-surface">₹{totalFees.toLocaleString('en-IN')}</p>
          <p className="text-body-md text-on-surface-variant mt-2">Annual school fee scheme</p>
        </div>
        <div className="stat-card">
          <p className="text-label-md text-on-surface-variant mb-1">Total Paid</p>
          <p className="text-headline-md text-emerald-600">₹{totalPaid.toLocaleString('en-IN')}</p>
          <p className="text-body-md text-emerald-600 mt-2 flex items-center gap-1">
            <Icon name="check_circle" size={16} />
            Updated today
          </p>
        </div>
        <div className="stat-card">
          <p className="text-label-md text-on-surface-variant mb-1">Outstanding Balance</p>
          <p className={`text-headline-md ${balance > 0 ? 'text-error' : 'text-emerald-600'}`}>
            ₹{balance.toLocaleString('en-IN')}
          </p>
          <p className="text-body-md text-on-surface-variant mt-2">
            {balance > 0 ? 'Payment required' : 'No outstanding dues'}
          </p>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="card p-6">
        <h3 className="text-title-lg text-on-surface mb-4">Transaction History</h3>
        <div className="overflow-x-auto">
          {fees.length === 0 ? (
            <div className="text-center py-6 text-on-surface-variant">No fee records found.</div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Fee Description</th>
                  <th>Amount</th>
                  <th>Amount Paid</th>
                  <th>Date</th>
                  <th>Payment Method</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {fees.map(t => (
                  <tr key={t.id}>
                    <td className="font-medium text-on-surface">{t.feeType} Fees ({t.class})</td>
                    <td className="text-on-surface">{t.amount}</td>
                    <td className="text-on-surface">{t.amountPaid}</td>
                    <td className="text-on-surface-variant">{t.date || t.dueDate}</td>
                    <td className="text-on-surface-variant">{t.method}</td>
                    <td>
                      <span className={`chip ${t.status === 'Paid' ? 'chip-success' : t.status === 'Partial' ? 'chip-warning' : 'chip-danger'}`}>
                        {t.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Payment Modal */}
      <Modal isOpen={payModalOpen} onClose={() => setPayModalOpen(false)} title="Pay Pending Fees">
        <form onSubmit={handlePaymentSubmit} className="space-y-4">
          <div className="bg-surface-container-low p-4 rounded-lg">
            <p className="text-label-md text-on-surface-variant">Amount to Pay</p>
            <p className="text-headline-md text-on-surface font-bold">₹{balance.toLocaleString('en-IN')}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Payment Method</label>
            <select 
              className="input-field" 
              value={paymentMethod} 
              onChange={e => setPaymentMethod(e.target.value)}
            >
              <option value="UPI (GPay/PhonePe)">UPI (GPay/PhonePe/Paytm)</option>
              <option value="Credit/Debit Card">Credit/Debit Card</option>
              <option value="Net Banking">Net Banking</option>
            </select>
          </div>
          {paymentMethod.includes('Card') && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Card Number</label>
                <input required type="text" className="input-field" placeholder="xxxx xxxx xxxx xxxx" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Expiry Date</label>
                  <input required type="text" className="input-field" placeholder="MM/YY" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">CVV</label>
                  <input required type="password" className="input-field" placeholder="***" />
                </div>
              </div>
            </div>
          )}
          <div className="flex justify-end gap-2 pt-4">
            <button type="button" className="btn-secondary" onClick={() => setPayModalOpen(false)} disabled={processing}>Cancel</button>
            <button type="submit" className="btn-primary min-w-[100px] justify-center" disabled={processing}>
              {processing ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Processing...
                </span>
              ) : `Pay ₹${balance.toLocaleString('en-IN')}`}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
