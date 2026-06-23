import React, { useState, useEffect } from 'react';
import api from '../../api';
import Icon from '../../components/common/Icon';
import Modal from '../../components/common/Modal';

const subjectColors = { 
  Maths: 'bg-blue-50 text-blue-700 border-blue-100', 
  Science: 'bg-emerald-50 text-emerald-700 border-emerald-100', 
  English: 'bg-purple-50 text-purple-700 border-purple-100',
  Tamil: 'bg-orange-50 text-orange-700 border-orange-100',
  'Social Science': 'bg-pink-50 text-pink-700 border-pink-100'
};

export default function StudentHomework() {
  const email = localStorage.getItem('edutrack_email') || 'student@edutrack.pro';
  const [filter, setFilter] = useState('Pending');
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal States
  const [submitHw, setSubmitHw] = useState(null);
  const [submissionText, setSubmissionText] = useState('');
  const [fileAttached, setFileAttached] = useState(null);

  useEffect(() => {
    api.get(`/homework?studentEmail=${email}`)
      .then(res => {
        const data = res.data?.homework || [];
        const safeData = Array.isArray(data) ? data : [];
        const mapped = safeData.map(hw => ({
          ...hw,
          status: hw.status === 'Active' ? 'Pending' : 'Submitted',
          submissionDate: hw.status !== 'Active' ? hw.dueDate : undefined
        }));
        setAssignments(mapped);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching student homework:', err);
        setLoading(false);
      });
  }, [email]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!submitHw) return;

    const formData = new FormData();
    formData.append('studentEmail', email);
    formData.append('text', submissionText);
    if (fileAttached && fileAttached instanceof File) {
      formData.append('file', fileAttached);
    }

    api.post(`/homework/${submitHw.id}/submit`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
      .then(() => {
        setAssignments(assignments.map(a => a.id === submitHw.id ? { 
          ...a, 
          status: 'Submitted', 
          submissionDate: new Date().toISOString().split('T')[0] 
        } : a));
        setSubmitHw(null);
        setSubmissionText('');
        setFileAttached(null);
      })
      .catch(err => {
        console.error('Error submitting homework:', err);
      });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const filtered = filter === 'All' ? assignments : assignments.filter(a => a.status === filter);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-header">My Homework</h1>
          <p className="page-subtitle">Track your assignments, submit solutions, and view feedback.</p>
        </div>
        <div className="flex border border-outline-variant/40 rounded-lg overflow-hidden bg-white">
          {['Pending', 'Submitted', 'All'].map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-4 py-2 text-body-md font-medium transition-colors ${filter === tab ? 'bg-primary-container text-white' : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'}`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {filtered.length === 0 ? (
          <div className="card p-12 text-center">
            <Icon name="assignment_turned_in" size={48} className="text-emerald-500/50 mb-4" />
            <h3 className="text-title-lg text-on-surface mb-1">All Caught Up!</h3>
            <p className="text-body-md text-on-surface-variant">No homework assignments found for the selected filter.</p>
          </div>
        ) : (
          filtered.map((hw, i) => (
            <div key={hw.id} className="card p-6 card-hover" style={{ animationDelay: `${i * 80}ms` }}>
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-title-lg text-on-surface">{hw.title}</h3>
                    <span className={`chip ${hw.status === 'Submitted' ? 'chip-success' : 'chip-warning'}`}>{hw.status}</span>
                  </div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`chip border ${subjectColors[hw.subject] || 'bg-gray-50 text-gray-700'}`}>{hw.subject}</span>
                    <span className="text-body-md text-on-surface-variant">• Assigned by {hw.teacher}</span>
                  </div>
                  <p className="text-body-md text-on-surface-variant">{hw.description}</p>
                </div>
                <div className="flex flex-col items-end gap-3 min-w-[180px]">
                  <div className="text-right">
                    <p className="text-label-md text-on-surface-variant">{hw.status === 'Submitted' ? 'Submitted On' : 'Due Date'}</p>
                    <p className="text-body-md text-on-surface font-medium">
                      {new Date(hw.status === 'Submitted' ? (hw.submissionDate || hw.dueDate) : hw.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                  {hw.status === 'Pending' ? (
                    <button className="btn-primary w-full justify-center" onClick={() => setSubmitHw(hw)}>
                      <Icon name="upload" size={18} />
                      Submit Work
                    </button>
                  ) : (
                    <div className="text-emerald-600 flex items-center gap-1.5 text-body-md font-medium">
                      <Icon name="check_circle" size={18} />
                      Work Uploaded
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Submit Homework Modal */}
      <Modal isOpen={!!submitHw} onClose={() => setSubmitHw(null)} title="Submit Assignment">
        {submitHw && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <p className="text-sm text-gray-500 mb-1">Assignment</p>
              <p className="font-semibold text-gray-800">{submitHw.title} ({submitHw.subject})</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Answer / Notes (Optional)</label>
              <textarea 
                className="input-field h-24 resize-none" 
                placeholder="Write any comments or online text response here..."
                value={submissionText}
                onChange={e => setSubmissionText(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Upload Homework Document (PDF Required)</label>
              <div className="relative">
                <input 
                  type="file" 
                  accept="application/pdf"
                  required
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      if (file.type !== 'application/pdf') {
                        alert('Only PDF files are allowed!');
                        e.target.value = null;
                        setFileAttached(null);
                        return;
                      }
                      setFileAttached(file);
                    }
                  }}
                />
                <div className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${fileAttached ? 'border-emerald-500 bg-emerald-50/20' : 'border-outline-variant/40 hover:border-primary-container/50'}`}>
                  <Icon name={fileAttached ? 'check_circle' : 'cloud_upload'} size={32} className={`mx-auto mb-2 ${fileAttached ? 'text-emerald-600' : 'text-on-surface-variant'}`} />
                  <p className="text-body-md text-on-surface font-medium">
                    {fileAttached ? fileAttached.name + ' attached' : 'Click or drag to upload your PDF file'}
                  </p>
                  <p className="text-label-md text-on-surface-variant mt-1">PDF format is required (Max 15MB)</p>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <button type="button" className="btn-secondary" onClick={() => setSubmitHw(null)}>Cancel</button>
              <button type="submit" className="btn-primary" disabled={!fileAttached}>Submit Assignment</button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
