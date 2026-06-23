import React, { useState } from 'react';
import Icon from '../../components/common/Icon';

const reports = [
  { id: 1, title: 'Attendance Reports', description: 'Comprehensive summaries of student presence, late arrivals, and unexcused absences.', icon: 'calendar_month', color: 'bg-blue-50 text-blue-600', formats: ['PDF', 'CSV', 'Excel'] },
  { id: 2, title: 'Fee Collection Summaries', description: 'Breakdown of collected fees, outstanding dues, and financial reconciliation.', icon: 'payments', color: 'bg-emerald-50 text-emerald-600', formats: ['PDF', 'Excel'] },
  { id: 3, title: 'Grade Distribution', description: 'Statistical bell curves and grading spread across subjects and classes.', icon: 'grade', color: 'bg-purple-50 text-purple-600', formats: ['PDF', 'CSV'] },
  { id: 4, title: 'Student Performance Index', description: 'An in-depth, AI-assisted analysis of individual student trajectories, combining attendance, homework completion rates, and terminal exam marks to predict academic outcomes.', icon: 'assessment', color: 'bg-amber-50 text-amber-600', formats: ['PDF', 'Interactive'] },
];

export default function Reports() {
  const [previewReport, setPreviewReport] = useState(null);

  const handleDownloadPdf = (reportTitle) => {
    const dummyContent = `Mock PDF Report for ${reportTitle}\n\nThis is a prototype download.`;
    const blob = new Blob([dummyContent], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${reportTitle.replace(/\s+/g, '_')}_Report.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const currentYear = new Date().getFullYear();
  const academicYear1 = `${currentYear}-${(currentYear + 1).toString().slice(2)}`;
  const academicYear2 = `${currentYear - 1}-${currentYear.toString().slice(2)}`;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-header">Academic Reports</h1>
          <p className="page-subtitle">Access, generate, and download institutional data summaries.</p>
        </div>
        <div className="flex items-center gap-3">
          <select className="input-field w-auto"><option>Academic Year {academicYear1}</option><option>Academic Year {academicYear2}</option></select>
          <select className="input-field w-auto"><option>All Classes</option><option>Class 10</option><option>Class 9</option></select>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {reports.map((report, i) => (
          <div key={report.id} className="card p-6 card-hover group" style={{ animationDelay: `${i * 100}ms` }}>
            <div className="flex items-start gap-4">
              <div className={`w-14 h-14 rounded-xl ${report.color.split(' ')[0]} flex items-center justify-center flex-shrink-0 transition-transform duration-300 group-hover:scale-110`}>
                <Icon name={report.icon} size={28} className={report.color.split(' ')[1]} />
              </div>
              <div className="flex-1">
                <h3 className="text-title-lg text-on-surface mb-2">{report.title}</h3>
                <p className="text-body-md text-on-surface-variant mb-4">{report.description}</p>
                <div className="flex flex-wrap items-center justify-between gap-4 mt-auto">
                  <div className="flex flex-wrap gap-2">
                    {report.formats.map(f => (
                      <span key={f} className="chip bg-surface-container text-on-surface-variant">{f}</span>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2 sm:mt-0">
                    <button className="btn-ghost text-label-md" onClick={() => setPreviewReport(report)}><Icon name="visibility" size={16} />Preview</button>
                    <button className="btn-primary text-label-md py-2 px-4" onClick={() => handleDownloadPdf(report.title)}><Icon name="download" size={16} />Generate</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      {/* Preview Modal */}
      {previewReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-fade-in" onClick={() => setPreviewReport(null)}>
          <div className="bg-white rounded-xl shadow-lg w-full max-w-2xl max-h-[90vh] flex flex-col animate-scale-in" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-title-lg text-gray-800 font-semibold">Preview: {previewReport.title}</h3>
              <button onClick={() => setPreviewReport(null)} className="p-1.5 hover:bg-gray-100 rounded-full transition-colors">
                <Icon name="close" size={20} className="text-gray-500" />
              </button>
            </div>
            <div className="p-8 overflow-y-auto bg-gray-50 flex-1 min-h-[300px] flex items-center justify-center">
              <div className="text-center">
                <Icon name="insert_chart" size={48} className="text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 font-medium">Mock visualization for {previewReport.title}</p>
                <p className="text-sm text-gray-400 mt-2 max-w-sm mx-auto">{previewReport.description}</p>
              </div>
            </div>
            <div className="p-4 border-t border-gray-200 flex justify-end gap-3">
              <button className="btn-secondary" onClick={() => setPreviewReport(null)}>Close</button>
              <button className="btn-primary" onClick={() => handleDownloadPdf(previewReport.title)}>
                <Icon name="download" size={18} /> Download PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
