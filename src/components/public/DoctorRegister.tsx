import React, { useState } from 'react';
import { useClinic } from '../../context/ClinicContext';
import { Stethoscope, UserPlus, CheckCircle2, Lock, ArrowLeft } from 'lucide-react';

export const DoctorRegister: React.FC = () => {
  const { addDoctor } = useClinic(); // Assuming addDoctor is available in your context
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    degree: '',
    specialty: '',
    clinicName: '',
    cabinNumber: 'Cabin 1',
    city: 'Umaria',
    username: '',
    password: '',
    profilePic: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Yahan direct naya doctor add ho jayega bina admin panel login kiye
    if (typeof addDoctor === 'function') {
      addDoctor({
        ...formData,
        id: 'doc_' + Date.now(),
        status: 'AVAILABLE',
        isSessionActive: true,
      });
    }
    setSuccess(true);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl p-6 sm:p-8 border border-slate-800">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md">
              <UserPlus className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900">Direct Doctor Onboarding</h2>
              <p className="text-[11px] text-slate-500">Alag link se naya doctor register karein</p>
            </div>
          </div>
          <a
            href="/"
            className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Home
          </a>
        </div>

        {success ? (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center space-y-3">
            <CheckCircle2 className="h-12 w-12 text-emerald-600 mx-auto" />
            <h3 className="text-base font-bold text-emerald-900">Doctor Successfully Registered!</h3>
            <p className="text-xs text-emerald-700">Naye doctor ki profile live OPD list mein add ho chuki hai.</p>
            <button
              onClick={() => { setSuccess(false); window.location.href = '/staff'; }}
              className="mt-2 bg-slate-900 text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow hover:bg-slate-800 cursor-pointer"
            >
              Go to Staff Portal →
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Doctor Name *</label>
              <input
                type="text"
                placeholder="Dr. Rajesh Sharma"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Degree *</label>
                <input
                  type="text"
                  placeholder="MBBS, MD"
                  required
                  value={formData.degree}
                  onChange={(e) => setFormData({ ...formData, degree: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Specialty *</label>
                <input
                  type="text"
                  placeholder="Physician & Diabetologist"
                  required
                  value={formData.specialty}
                  onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Clinic Name *</label>
              <input
                type="text"
                placeholder="Aarogya Clinic & Heart Care"
                required
                value={formData.clinicName}
                onChange={(e) => setFormData({ ...formData, clinicName: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Staff Username *</label>
                <input
                  type="text"
                  placeholder="dr_rajesh_staff"
                  required
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Staff Password *</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl text-xs font-bold transition shadow-lg shadow-blue-500/25 mt-2 cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Stethoscope className="h-4 w-4" />
              <span>Register Doctor Directly</span>
            </button>
          </form>
        )}

      </div>
    </div>
  );
};
