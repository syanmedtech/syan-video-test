
import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { PREPARING_FOR_OPTIONS, STATUS_OPTIONS, ICONS } from '../../constants';

export default function PublicFormGate() {
  const { shareId } = useParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    university: '',
    whatsapp: '',
    cnic: '',
    preparingFor: 'MBBS',
    preparingForOtherText: '',
    status: 'Student',
    classEnrolled: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Mock session registration
    setTimeout(() => {
      localStorage.setItem(`session_${shareId}`, JSON.stringify({ 
        userId: 'u_' + Math.random().toString(36).substr(2, 9),
        videoId: 'v1',
        createdAt: Date.now(),
        ...formData
      }));
      setIsLoading(false);
      navigate(`/watch/${shareId}/instructions`);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center p-3 bg-sky-500 text-white rounded-2xl mb-4 shadow-xl">
            <ICONS.Shield className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900">Syan Secure Access</h1>
          <p className="text-slate-500 mt-2">Please complete the registration to watch the video content.</p>
        </div>

        <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
          <div className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Full Name</label>
                  <input
                    required
                    type="text"
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    placeholder="John Doe"
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-sky-500 outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Email Address</label>
                  <input
                    required
                    type="email"
                    value={formData.email}
                    onChange={e => setFormData({...formData, email: e.target.value})}
                    placeholder="john@example.com"
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-sky-500 outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">University</label>
                  <input
                    required
                    type="text"
                    value={formData.university}
                    onChange={e => setFormData({...formData, university: e.target.value})}
                    placeholder="KEMU, AMC, etc."
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-sky-500 outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">WhatsApp Number</label>
                  <input
                    required
                    type="tel"
                    value={formData.whatsapp}
                    onChange={e => setFormData({...formData, whatsapp: e.target.value})}
                    placeholder="03XXXXXXXXX"
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-sky-500 outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">CNIC Number</label>
                  <input
                    required
                    type="text"
                    maxLength={15}
                    value={formData.cnic}
                    onChange={e => setFormData({...formData, cnic: e.target.value})}
                    placeholder="XXXXX-XXXXXXX-X"
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-sky-500 outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Preparing For</label>
                  <select
                    value={formData.preparingFor}
                    onChange={e => setFormData({...formData, preparingFor: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-sky-500 outline-none"
                  >
                    {PREPARING_FOR_OPTIONS.map(opt => <option key={opt}>{opt}</option>)}
                  </select>
                </div>
                {formData.preparingFor === 'OTHER' && (
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-bold text-slate-700">Specify Target Exam</label>
                    <input
                      required
                      type="text"
                      value={formData.preparingForOtherText}
                      onChange={e => setFormData({...formData, preparingForOtherText: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-sky-500 outline-none"
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Professional Status</label>
                  <select
                    value={formData.status}
                    onChange={e => setFormData({...formData, status: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-sky-500 outline-none"
                  >
                    {STATUS_OPTIONS.map(opt => <option key={opt}>{opt}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Class Enrolled</label>
                  <input
                    required
                    type="text"
                    value={formData.classEnrolled}
                    onChange={e => setFormData({...formData, classEnrolled: e.target.value})}
                    placeholder="e.g. Session 2024"
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-sky-500 outline-none"
                  />
                </div>
              </div>

              <div className="pt-6 border-t border-slate-100">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold text-lg hover:bg-slate-800 transition-all shadow-xl disabled:opacity-50 flex items-center justify-center gap-3"
                >
                  {isLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Registering Session...
                    </>
                  ) : 'Proceed to Instructions'}
                </button>
                <p className="text-xs text-slate-400 mt-4 text-center">
                  By proceeding, you agree to our anti-piracy policies and tracking terms.
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
