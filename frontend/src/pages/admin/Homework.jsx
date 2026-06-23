import React, { useState, useEffect } from 'react';
import Icon from '../../components/common/Icon';
import StatCard from '../../components/common/StatCard';
import Modal from '../../components/common/Modal';
import api from '../../api';

const subjectColors = { 
  Maths: 'bg-blue-50 text-blue-700', 
  Science: 'bg-emerald-50 text-emerald-700', 
  English: 'bg-purple-50 text-purple-700',
  Tamil: 'bg-orange-50 text-orange-700',
  'Social Science': 'bg-pink-50 text-pink-700'
};

export default function Homework() {
  const [filter, setFilter] = useState('All');
  const [hwList, setHwList] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modals state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [viewHw, setViewHw] = useState(null);

  // New HW Form
  const [newHw, setNewHw] = useState({ title: '', subject: 'Maths', description: '', dueDate: '', className: '10-A' });

  const fetchHomework = () => {
    setLoading(true);
    api.get('/homework')
      .then(res => {
        setHwList(res.data?.homework || []);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching homework:', err.message || err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchHomework();
  }, []);

  const handleAddHw = (e) => {
    e.preventDefault();
    api.post('/homework', newHw)
      .then(res => {
        setHwList([...hwList, res.data]);
        setIsAddOpen(false);
        setNewHw({ title: '', subject: 'Maths', description: '', dueDate: '', className: '10-A' });
      })
      .catch(err => console.error('Error adding homework:', err.message || err));
  };

  const handleStatusUpdate = (id, status) => {
    api.put(`/homework/${id}`, { status })
      .then(res => {
        setHwList(hwList.map(h => h.id === id ? res.data : h));
        if (viewHw && viewHw.id === id) {
          setViewHw(res.data);
        }
      })
      .catch(err => console.error('Error updating status:', err.message || err));
  };

  const filtered = filter === 'All' ? hwList : hwList.filter(h => h.status === filter);

  const totalActive = hwList.filter(h => h.status === 'Active').length;
  const submittedToday = hwList.filter(h => h.status === 'Active').reduce((sum, h) => sum + h.submissions, 0);
  const pendingGrading = hwList.filter(h => h.status === 'Grading').reduce((sum, h) => sum + h.submissions, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-header">Homework Management</h1>
          <p className="page-subtitle">Track assignments, manage submissions, and provide feedback.</p>
        </div>
        <button className="btn-primary" onClick={() => setIsAddOpen(true)}>
          <Icon name="add" size={18} />New Assignment
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard title="Total Active" value={String(totalActive)} icon="assignment" color="primary" />
        <StatCard title="Submitted Today" value={String(submittedToday)} icon="check_circle" color="secondary" />
        <StatCard title="Pending Grading" value={String(pendingGrading)} icon="schedule" color="tertiary" />
      </div>

      <div className="flex items-center gap-2 border-b border-outline-variant/30 pb-1">
        {['All', 'Active', 'Grading', 'Completed'].map((tab) => (
          <button 
            key={tab} 
            onClick={() => setFilter(tab)} 
            className={`px-4 py-2 text-body-md font-medium rounded-t-lg transition-colors ${filter === tab ? 'text-primary-container border-b-2 border-primary-container bg-primary-container/5' : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'}`}
          >
            {tab}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[200px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.length === 0 ? (
            <div className="card p-12 text-center text-on-surface-variant">
              No assignments found for the selected filter.
            </div>
          ) : (
            filtered.map((hw, i) => (
              <div key={hw.id} className="card p-6 card-hover" style={{ animationDelay: `${i * 100}ms` }}>
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-title-lg text-on-surface">{hw.title}</h3>
                      <span className={`chip ${hw.status === 'Active' ? 'chip-success' : hw.status === 'Grading' ? 'chip-warning' : 'chip-info'}`}>{hw.status}</span>
                    </div>
                    <div className="flex items-center gap-2 mb-3">
                      <span className={`chip ${subjectColors[hw.subject] || 'bg-gray-50 text-gray-700'}`}>{hw.subject}</span>
                      <span className="text-body-md text-on-surface-variant">• Assigned by {hw.teacher}</span>
                    </div>
                    <p className="text-body-md text-on-surface-variant line-clamp-2">{hw.description}</p>
                  </div>
                  <div className="flex flex-col sm:flex-row lg:flex-col items-end gap-3 min-w-[200px] justify-between">
                    <div className="text-right">
                      <p className="text-label-md text-on-surface-variant">Due Date</p>
                      <p className="text-body-md text-on-surface font-medium">
                        {new Date(hw.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>
                    <div className="w-full flex gap-2">
                      <button className="btn-secondary flex-1 justify-center py-1.5" onClick={() => setViewHw(hw)}>Details</button>
                      {hw.status === 'Active' && (
                        <button className="btn-primary flex-1 justify-center py-1.5" onClick={() => handleStatusUpdate(hw.id, 'Grading')}>Grade</button>
                      )}
                      {hw.status === 'Grading' && (
                        <button className="btn-primary flex-1 justify-center py-1.5 bg-emerald-600 hover:bg-emerald-700" onClick={() => handleStatusUpdate(hw.id, 'Completed')}>Complete</button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Add Assignment Modal */}
      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="New Assignment">
        <form onSubmit={handleAddHw} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Assignment Title</label>
            <input required type="text" className="input-field" value={newHw.title} onChange={e => setNewHw({...newHw, title: e.target.value})} placeholder="e.g. Chapter 3 Calculus Quiz" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
              <select className="input-field" value={newHw.subject} onChange={e => setNewHw({...newHw, subject: e.target.value})}>
                <option value="Tamil">Tamil</option>
                <option value="English">English</option>
                <option value="Maths">Maths</option>
                <option value="Science">Science</option>
                <option value="Social Science">Social Science</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
              <select className="input-field" value={newHw.className} onChange={e => setNewHw({...newHw, className: e.target.value})}>
                <option value="10-A">10-A</option>
                <option value="10-B">10-B</option>
                <option value="9-A">9-A</option>
                <option value="9-B">9-B</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description / Instructions</label>
            <textarea required className="input-field h-24 resize-none" value={newHw.description} onChange={e => setNewHw({...newHw, description: e.target.value})} placeholder="Provide detailed steps, links, or textbook references..." />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
            <input required type="date" className="input-field" value={newHw.dueDate} onChange={e => setNewHw({...newHw, dueDate: e.target.value})} />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <button type="button" className="btn-secondary" onClick={() => setIsAddOpen(false)}>Cancel</button>
            <button type="submit" className="btn-primary">Create Assignment</button>
          </div>
        </form>
      </Modal>

      {/* View Details Modal */}
      <Modal isOpen={!!viewHw} onClose={() => setViewHw(null)} title="Assignment Details">
        {viewHw && (
          <div className="space-y-4 text-on-surface">
            <div>
              <h3 className="text-headline-sm font-semibold">{viewHw.title}</h3>
              <p className="text-body-md text-on-surface-variant mt-1">{viewHw.subject} • Class {viewHw.className || '10-A'}</p>
            </div>
            <div className="bg-surface-container-low p-4 rounded-lg">
              <p className="text-label-md text-on-surface-variant">Description</p>
              <p className="text-body-md text-on-surface mt-1">{viewHw.description}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-label-md text-on-surface-variant">Due Date</p>
                <p className="text-body-md font-medium text-on-surface">{new Date(viewHw.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
              </div>
              <div>
                <p className="text-label-md text-on-surface-variant">Status</p>
                <span className={`chip mt-1 ${viewHw.status === 'Active' ? 'chip-success' : 'chip-warning'}`}>{viewHw.status}</span>
              </div>
            </div>
            
            {/* Submissions Section */}
            <div className="mt-6 pt-4 border-t border-outline-variant/20">
              <h4 className="text-title-md font-medium mb-3">Student Submissions ({viewHw.submissionsList?.length || 0})</h4>
              {viewHw.submissionsList?.length > 0 ? (
                <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                  {viewHw.submissionsList.map((sub, idx) => (
                    <div key={idx} className="p-3 bg-surface-container rounded-lg border border-outline-variant/30 flex justify-between items-start">
                      <div>
                        <p className="font-medium text-on-surface text-sm">{sub.studentName}</p>
                        <p className="text-xs text-on-surface-variant mt-0.5">Submitted: {new Date(sub.submittedAt).toLocaleDateString()}</p>
                        {sub.text && <p className="text-sm mt-2 text-on-surface-variant">"{sub.text}"</p>}
                      </div>
                      {sub.fileUrl && (
                        <a 
                          href={`${import.meta.env.VITE_API_URL || ''}${sub.fileUrl}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="btn-secondary text-xs px-3 py-1 flex items-center gap-1 shrink-0"
                        >
                          <Icon name="download" size={16} />
                          View File
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-body-md text-on-surface-variant">No submissions yet.</p>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-outline-variant/20 mt-4">
              <button className="btn-secondary" onClick={() => setViewHw(null)}>Close</button>
              {viewHw.status === 'Active' && (
                <button className="btn-primary" onClick={() => handleStatusUpdate(viewHw.id, 'Grading')}>Begin Grading</button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
