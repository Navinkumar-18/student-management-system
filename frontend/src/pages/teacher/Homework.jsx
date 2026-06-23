import React, { useState, useEffect } from 'react';
import api from '../../api';
import Icon from '../../components/common/Icon';
import Modal from '../../components/common/Modal';

export default function Homework() {
  const [homeworkList, setHomeworkList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedHomework, setSelectedHomework] = useState(null);

  // Form states
  const [newHomework, setNewHomework] = useState({
    title: '',
    subject: 'Maths',
    description: '',
    dueDate: ''
  });

  useEffect(() => {
    fetchHomework();
  }, []);

  const fetchHomework = () => {
    setLoading(true);
    api.get('/homework')
      .then(res => {
        setHomeworkList(res.data?.homework || []);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching homework:', err.message || err);
        setLoading(false);
      });
  };

  const handleCreate = (e) => {
    e.preventDefault();
    api.post('/homework', newHomework)
      .then(() => {
        setIsAddOpen(false);
        fetchHomework();
        setNewHomework({
          title: '',
          subject: 'Maths',
          description: '',
          dueDate: ''
        });
      })
      .catch(err => console.error('Error creating homework:', err.message || err));
  };

  const handleUpdateStatus = (id, newStatus) => {
    api.put(`/homework/${id}`, { status: newStatus })
      .then(res => {
        setHomeworkList(homeworkList.map(h => h.id === id ? { ...h, status: res.data.status } : h));
        if (selectedHomework && selectedHomework.id === id) {
          setSelectedHomework({ ...selectedHomework, status: res.data.status });
        }
      })
      .catch(err => console.error('Error updating homework status:', err.message || err));
  };

  const handleVerifySubmission = (homeworkId, studentId, status) => {
    api.put(`/homework/${homeworkId}/verify`, { studentId, status })
      .then(() => {
        const updatedList = homeworkList.map(hw => {
          if (hw.id === homeworkId) {
            const updatedSubs = hw.submissionsList.map(sub => {
              if (sub.studentId === studentId) {
                return { ...sub, status };
              }
              return sub;
            });
            return { ...hw, submissionsList: updatedSubs };
          }
          return hw;
        });
        setHomeworkList(updatedList);
        
        if (selectedHomework && selectedHomework.id === homeworkId) {
          const updatedSubs = selectedHomework.submissionsList.map(sub => {
            if (sub.studentId === studentId) {
              return { ...sub, status };
            }
            return sub;
          });
          setSelectedHomework({ ...selectedHomework, submissionsList: updatedSubs });
        }
      })
      .catch(err => console.error('Error verifying submission:', err.message || err));
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-header">Homework Verify</h1>
          <p className="page-subtitle">Assign homework tasks and verify student submissions.</p>
        </div>
        <button className="btn-primary animate-pulse" onClick={() => setIsAddOpen(true)}>
          <Icon name="add" size={18} />Assign Homework
        </button>
      </div>

      {/* Homework List */}
      {loading ? (
        <div className="flex justify-center items-center py-12 text-on-surface-variant">
          <p>Loading homework assignments...</p>
        </div>
      ) : homeworkList.length === 0 ? (
        <div className="card p-12 text-center text-on-surface-variant">
          <Icon name="assignment" size={48} className="mx-auto mb-3 text-outline-variant" />
          <p className="text-title-md">No homework assignments for your class.</p>
          <p className="text-body-md mt-1">Click "Assign Homework" to create one.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {homeworkList.map(hw => (
            <div key={hw.id} className="card p-5 card-hover flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="chip bg-primary-container/10 text-primary-container font-semibold">
                    {hw.subject}
                  </span>
                  <span className={`chip ${
                    hw.status === 'Active' ? 'chip-success' :
                    hw.status === 'Grading' ? 'bg-amber-100 text-amber-800' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {hw.status}
                  </span>
                </div>
                <h3 className="text-title-md font-semibold text-gray-800 mb-2">{hw.title}</h3>
                <p className="text-body-md text-gray-600 line-clamp-3 mb-4">{hw.description}</p>
              </div>

              <div className="border-t border-gray-100 pt-3 space-y-3">
                <div className="flex justify-between text-body-md text-gray-500">
                  <span>Due Date:</span>
                  <span className="font-semibold text-gray-700">{hw.dueDate}</span>
                </div>
                <div className="flex justify-between text-body-md text-gray-500">
                  <span>Submissions:</span>
                  <span className="font-semibold text-primary-container">{hw.submissions} / {hw.total}</span>
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => setSelectedHomework(hw)}
                    className="btn-secondary flex-1 py-1.5 text-label-md"
                  >
                    <Icon name="visibility" size={16} /> Submissions
                  </button>
                  <select
                    className="input-field py-1 px-2 text-label-md w-auto"
                    value={hw.status}
                    onChange={e => handleUpdateStatus(hw.id, e.target.value)}
                  >
                    <option value="Active">Active</option>
                    <option value="Grading">Grading</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Homework Modal */}
      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Assign New Homework">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Homework Title</label>
            <input
              required
              type="text"
              className="input-field"
              value={newHomework.title}
              onChange={e => setNewHomework({ ...newHomework, title: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
              <select
                className="input-field"
                value={newHomework.subject}
                onChange={e => setNewHomework({ ...newHomework, subject: e.target.value })}
              >
                <option>Tamil</option>
                <option>English</option>
                <option>Maths</option>
                <option>Science</option>
                <option>Social Science</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
              <input
                required
                type="date"
                className="input-field"
                value={newHomework.dueDate}
                onChange={e => setNewHomework({ ...newHomework, dueDate: e.target.value })}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description / Instructions</label>
            <textarea
              required
              rows={3}
              className="input-field"
              value={newHomework.description}
              onChange={e => setNewHomework({ ...newHomework, description: e.target.value })}
            />
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
            <button type="button" className="btn-secondary" onClick={() => setIsAddOpen(false)}>Cancel</button>
            <button type="submit" className="btn-primary">Assign Homework</button>
          </div>
        </form>
      </Modal>

      {/* Submissions Modal */}
      <Modal
        isOpen={!!selectedHomework}
        onClose={() => setSelectedHomework(null)}
        title={selectedHomework ? `Submissions: ${selectedHomework.title}` : 'Submissions'}
        size="lg"
      >
        {selectedHomework && (
          <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
            {selectedHomework.submissionsList.length === 0 ? (
              <div className="text-center py-8 text-on-surface-variant">
                <Icon name="assignment_late" size={40} className="mx-auto text-outline-variant mb-2" />
                <p className="text-body-md">No student submissions received yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {selectedHomework.submissionsList.map((sub, idx) => (
                  <div key={idx} className="p-4 border border-outline-variant/20 rounded-xl space-y-4 bg-surface-container/20">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-outline-variant/10 pb-2">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-gray-800 text-body-lg">{sub.studentName}</h4>
                        <span className={`chip text-xs py-0.5 px-2 font-medium ${
                          sub.status === 'Verified' ? 'chip-success' :
                          sub.status === 'Rejected' ? 'chip-danger' :
                          'chip-warning'
                        }`}>
                          {sub.status || 'Pending'}
                        </span>
                      </div>
                      <span className="text-label-md text-gray-400">
                        {new Date(sub.submittedAt).toLocaleDateString()} {new Date(sub.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    {sub.text && (
                      <div className="bg-white/80 p-3 rounded-lg text-body-md text-gray-600 border border-outline-variant/10">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Student Comments</p>
                        <span className="italic">"{sub.text}"</span>
                      </div>
                    )}

                    {sub.fileUrl && (
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-3.5 rounded-lg border border-outline-variant/30">
                        <div className="flex items-center gap-3 text-primary-container min-w-0 flex-1">
                          <Icon name="picture_as_pdf" size={24} className="text-red-500 shrink-0" />
                          <div className="min-w-0">
                            <p className="text-body-md font-semibold text-gray-700 truncate" title={sub.fileName}>
                              {sub.fileName}
                            </p>
                            <p className="text-label-sm text-gray-400">PDF Document</p>
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 shrink-0">
                          <a
                            href={`${import.meta.env.VITE_API_URL || ''}${sub.fileUrl}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-secondary py-1.5 px-3 text-label-md text-primary-container hover:bg-primary-container/10 flex items-center gap-1.5 border border-primary-container/20 rounded-md"
                          >
                            <Icon name="visibility" size={16} /> View PDF
                          </a>
                          {sub.status !== 'Verified' && (
                            <button
                              onClick={() => handleVerifySubmission(selectedHomework.id, sub.studentId, 'Verified')}
                              className="btn-primary py-1.5 px-3.5 text-label-sm bg-emerald-600 hover:bg-emerald-700 border-none rounded-md flex items-center gap-1.5 shadow-sm"
                            >
                              <Icon name="check" size={16} /> Verify
                            </button>
                          )}
                          {sub.status !== 'Rejected' && (
                            <button
                              onClick={() => handleVerifySubmission(selectedHomework.id, sub.studentId, 'Rejected')}
                              className="btn-secondary py-1.5 px-3.5 text-label-sm text-red-600 hover:bg-red-50 border-red-200 rounded-md flex items-center gap-1.5 shadow-sm"
                            >
                              <Icon name="close" size={16} /> Reject
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            <div className="flex justify-end pt-4 border-t border-gray-100">
              <button type="button" className="btn-secondary" onClick={() => setSelectedHomework(null)}>Close</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
