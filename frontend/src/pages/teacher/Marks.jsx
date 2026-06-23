import React, { useState, useEffect, useRef } from 'react';
import api from '../../api';
import Icon from '../../components/common/Icon';

export default function Marks() {
  const [selectedSubject, setSelectedSubject] = useState('Maths');
  const [selectedExam, setSelectedExam] = useState('Midterm');
  const [selectedTerm, setSelectedTerm] = useState('Term 1');

  const [students, setStudents] = useState([]);
  const [marksList, setMarksList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  // Input states for student marks
  const [marksInput, setMarksInput] = useState({});
  const [maxMarksInput, setMaxMarksInput] = useState({});

  const cachedMarks = useRef({});
  const cachedMax = useRef({});

  function getComboKey() {
    return `${selectedSubject}|${selectedExam}|${selectedTerm}`;
  }

  // Save current inputs to cache before switching combo
  function saveCurrentToCache() {
    const key = getComboKey();
    cachedMarks.current[key] = { ...marksInput };
    cachedMax.current[key] = { ...maxMarksInput };
  }

  useEffect(() => {
    fetchData();
  }, [selectedSubject, selectedExam, selectedTerm]);

  const fetchData = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const studentsRes = await api.get('/students');
      const studentsData = studentsRes.data?.students || [];
      const classStudents = studentsData;
      setStudents(classStudents);

      const marksRes = await api.get('/marks');
      const marksData = marksRes.data?.marks || [];
      setMarksList(marksData);

      const key = getComboKey();

      // Restore from cache if available (user already entered values for this combo)
      if (cachedMarks.current[key]) {
        setMarksInput(cachedMarks.current[key]);
        setMaxMarksInput(cachedMax.current[key]);
        setLoading(false);
        return;
      }

      const initialMarks = {};
      const initialMax = {};

      classStudents.forEach(stu => {
        const record = marksData.find(m =>
          m.studentId === stu.id &&
          m.subject === selectedSubject &&
          m.examType === selectedExam &&
          m.term === selectedTerm
        );

        if (record) {
          initialMarks[stu.id] = record.marks;
          initialMax[stu.id] = record.max;
        } else {
          initialMarks[stu.id] = '';
          initialMax[stu.id] = 100;
        }
      });

      setMarksInput(initialMarks);
      setMaxMarksInput(initialMax);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching marks data:', err.message || err);
      setLoading(false);
    }
  };

  const handleMarkChange = (studentId, value) => {
    setMarksInput({
      ...marksInput,
      [studentId]: value
    });
  };

  const handleMaxChange = (studentId, value) => {
    setMaxMarksInput({
      ...maxMarksInput,
      [studentId]: value
    });
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      let successCount = 0;

      for (const student of students) {
        const score = marksInput[student.id];
        const maxScore = maxMarksInput[student.id];

        if (score === '' || score === undefined) continue;

        await api.post('/marks', {
          studentId: student.id,
          subjectName: selectedSubject,
          marksObtained: Number(score),
          maxMarks: Number(maxScore),
          examType: selectedExam,
          term: selectedTerm
        });
        successCount++;
      }

      setSaving(false);
      setMessage({ type: 'success', text: `Saved ${successCount} marks records successfully!` });
      // Clear cached inputs so next switch reloads fresh saved values
      const key = getComboKey();
      delete cachedMarks.current[key];
      delete cachedMax.current[key];
      try {
        const studentsRes = await api.get('/students');
        setStudents(studentsRes.data?.students || []);
        const marksRes = await api.get('/marks');
        setMarksList(marksRes.data?.marks || []);
      } catch (fetchErr) {
        console.error('Error reloading marks:', fetchErr);
      }
    } catch (err) {
      console.error('Error saving marks:', err);
      setSaving(false);
      setMessage({ type: 'error', text: err.message || err.text || 'Error encountered while saving marks records.' });
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="page-header">Marks Entry</h1>
        <p className="page-subtitle">Enter and edit examination grades for students by subject and class.</p>
      </div>

      {/* Selectors Card */}
      <div className="card p-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Subject</label>
            <select
              className="input-field"
              value={selectedSubject}
              onChange={e => { saveCurrentToCache(); setSelectedSubject(e.target.value); }}
            >
              <option>Tamil</option>
              <option>English</option>
              <option>Maths</option>
              <option>Science</option>
              <option>Social Science</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Exam Type</label>
            <select
              className="input-field"
              value={selectedExam}
              onChange={e => { saveCurrentToCache(); setSelectedExam(e.target.value); }}
            >
              <option>Midterm</option>
              <option>UnitTest</option>
              <option>Final</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Term</label>
            <select
              className="input-field"
              value={selectedTerm}
              onChange={e => { saveCurrentToCache(); setSelectedTerm(e.target.value); }}
            >
              <option>Term 1</option>
              <option>Term 2</option>
              <option>Term 3</option>
            </select>
          </div>
        </div>
        <div className="flex justify-end mt-4 pt-3 border-t border-gray-100">
          <button
            onClick={handleSave}
            disabled={loading || saving || students.length === 0}
            className="btn-primary px-6"
          >
            {saving ? 'Saving...' : 'Save Marks'}
          </button>
        </div>
      </div>

      {/* Messages */}
      {message && (
        <div className={`p-4 rounded-lg flex items-center gap-3 ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          <Icon name={message.type === 'success' ? 'check_circle' : 'error'} size={20} />
          <p className="text-body-md font-medium">{message.text}</p>
        </div>
      )}

      {/* Students List */}
      {loading ? (
        <div className="flex justify-center items-center py-12 text-on-surface-variant">
          <p>Loading class grades list...</p>
        </div>
      ) : students.length === 0 ? (
        <div className="card p-12 text-center text-on-surface-variant">
          <Icon name="assignment" size={48} className="mx-auto mb-3 text-outline-variant" />
          <p className="text-title-md">No students found in your class.</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="data-table">
            <thead>
              <tr>
                <th className="w-1/4">Roll No</th>
                <th className="w-1/3">Student Name</th>
                <th className="w-1/4">Marks Obtained</th>
                <th className="w-1/4">Max Marks</th>
              </tr>
            </thead>
            <tbody>
              {students.map(stu => (
                <tr key={stu.id}>
                  <td className="font-semibold text-gray-600">{stu.rollNo}</td>
                  <td className="font-medium text-gray-800">{stu.name}</td>
                  <td>
                    <input
                      type="number"
                      min="0"
                      max={maxMarksInput[stu.id] || 100}
                      placeholder="Enter marks"
                      className="input-field max-w-[150px] py-1.5 px-3"
                      value={marksInput[stu.id] ?? ''}
                      onChange={e => handleMarkChange(stu.id, e.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      min="1"
                      className="input-field max-w-[150px] py-1.5 px-3 bg-gray-50 text-gray-500"
                      value={maxMarksInput[stu.id] ?? 100}
                      onChange={e => handleMaxChange(stu.id, e.target.value)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
