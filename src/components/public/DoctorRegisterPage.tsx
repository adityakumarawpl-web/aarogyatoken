import React, { useState, useEffect } from 'react';
import { useClinic } from '../../context/ClinicContext';
import { getAutoTagSuggestions } from '../../utils/tagEngine';
import { Building, Stethoscope, ArrowLeft, CheckCircle2, Sparkles, X } from 'lucide-react';

export const DoctorRegisterPage: React.FC = () => {
  const { doctors, addNewDoctor } = useClinic();
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');
  
  // Type: Clinic ya Hospital
  const [establishmentType, setEstablishmentType] = useState<'CLINIC' | 'HOSPITAL'>('CLINIC');
  
  // Custom Tag Input State
  const [customTagInput, setCustomTagInput] = useState('');

  // New Doctor Form State
  const [newDoctorForm, setNewDoctorForm] = useState({
    name: '',
    degree: '',
    specialty: '',
    clinicName: '',
    cabinNumber: '',
    address: '',
    city: '',
    phone: '',
    profilePic: '',
    clinicImages: ['', ''],
    tags: [] as string[],
    timings: '10:00 AM - 02:00 PM & 05:00 PM - 08:00 PM',
    morningShift: '10:00 AM - 02:00 PM',
    eveningShift: '05:00 PM - 08:00 PM',
    consultationFee: 20,
    staffUsername: '',
    staffPassword: '',
    avgTimePerPatientMinutes: 10,
  });

  // Hospital ke liye multiple doctors ki list
  const [hospitalDoctors, setHospitalDoctors] = useState<Array<{
    name: string;
    degree: string;
    specialty: string;
    cabinNumber: string;
    profilePic: string;
    morningShift: string;
    eveningShift: string;
  }>>([
    {
      name: '',
      degree: '',
      specialty: '',
      cabinNumber: 'Cabin 1',
      profilePic: '',
      morningShift: '10:00 AM - 02:00 PM',
      eveningShift: '05:00 PM - 08:00 PM',
    },
  ]);

  // SMART USERNAME AUTO-GENERATOR
  useEffect(() => {
    const cleanCity = newDoctorForm.city
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]/g, '');

    const cleanClinic = newDoctorForm.clinicName
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');

    if (establishmentType === 'CLINIC') {
      const cleanDoc = newDoctorForm.name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_|_$/g, '');

      const parts = [cleanDoc, cleanClinic, cleanCity].filter(Boolean);
      const generated = parts.join('_');
      if (generated) {
        setNewDoctorForm((prev) => ({ ...prev, staffUsername: generated }));
      }
    } else {
      const parts = [cleanClinic, cleanCity].filter(Boolean);
      const generated = parts.join('_');
      if (generated) {
        setNewDoctorForm((prev) => ({ ...prev, staffUsername: generated }));
      }
    }
  }, [
    establishmentType,
    newDoctorForm.name,
    newDoctorForm.clinicName,
    newDoctorForm.city,
  ]);

  const isUsernameTaken = (username: string): boolean => {
    if (!username.trim()) return false;
    const clean = username.trim().toLowerCase();
    return doctors.some((doc) => doc.staffUsername?.trim().toLowerCase() === clean);
  };

  const isCurrentUsernameTaken = isUsernameTaken(newDoctorForm.staffUsername);

  const handleCreateDoctor = (e: React.FormEvent) => {
    e.preventDefault();

    if (!newDoctorForm.clinicName.trim()) {
      alert('Kripya Clinic / Hospital ka Naam bharein!');
      return;
    }
    if (!newDoctorForm.city.trim()) {
      alert('Kripya City (Shahar) bharein!');
      return;
    }
    if (!newDoctorForm.staffUsername.trim()) {
      alert('Kripya Reception / Staff ID bharein!');
      return;
    }

    const cleanStaffUser = newDoctorForm.staffUsername.trim().toLowerCase();
    const duplicateExists = doctors.some(
      (doc) => doc.staffUsername?.trim().toLowerCase() === cleanStaffUser
    );

    if (duplicateExists) {
      alert(`Staff ID "${newDoctorForm.staffUsername}" pehle se li ja chuki hai! Kripya alag username chunein.`);
      return;
    }

    const defaultPic = 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=300';
    
    const autoRazorpayData = {
      razorpayEnabled: true,
      razorpayKeyId: (import.meta as any).env?.VITE_RAZORPAY_KEY_ID || '',
      razorpayAccountType: 'PLATFORM_SPLIT' as 'DIRECT' | 'PLATFORM_SPLIT',
    };

    const formattedPublicAddress = newDoctorForm.address.trim()
      ? `${newDoctorForm.address.trim()}, ${newDoctorForm.city.trim()}`
      : newDoctorForm.city.trim();

    if (establishmentType === 'CLINIC') {
      if (!newDoctorForm.name.trim()) {
        alert('Kripya Doctor ka Naam bharein!');
        return;
      }

      const picToSave = newDoctorForm.profilePic?.trim() ? newDoctorForm.profilePic.trim() : defaultPic;
      const clinicBaseId = newDoctorForm.staffUsername.trim();

      addNewDoctor({
        ...newDoctorForm,
        ...autoRazorpayData,
        establishmentType: 'CLINIC',
        hospitalId: clinicBaseId,
        address: formattedPublicAddress,
        city: newDoctorForm.city.trim(),
        cabinNumber: 'Chamber',
        tags: newDoctorForm.tags || [],
        profilePic: picToSave,
        clinicImages: newDoctorForm.clinicImages || ['', ''],
        morningShift: newDoctorForm.morningShift || '10:00 AM - 02:00 PM',
        eveningShift: newDoctorForm.eveningShift || '05:00 PM - 08:00 PM',
      });
      setSaveSuccessMsg(`Clinic "${newDoctorForm.clinicName}" created successfully!`);
    } else {
      const validDoctors = hospitalDoctors.filter((doc) => doc.name.trim());
      if (validDoctors.length === 0) {
        alert('Kripya kam se kam ek Doctor ka naam add karein!');
        return;
      }

      const hospitalBaseId = newDoctorForm.staffUsername.trim();

      validDoctors.forEach((doc, idx) => {
        addNewDoctor({
          ...newDoctorForm,
          ...autoRazorpayData,
          establishmentType: 'HOSPITAL',
          hospitalId: hospitalBaseId,
          address: formattedPublicAddress,
          city: newDoctorForm.city.trim(),
          name: doc.name.trim(),
          degree: doc.degree.trim(),
          specialty: doc.specialty.trim(),
          cabinNumber: doc.cabinNumber.trim() || `Cabin ${idx + 1}`,
          tags: newDoctorForm.tags || [],
          morningShift: doc.morningShift || newDoctorForm.morningShift || '10:00 AM - 02:00 PM',
          eveningShift: doc.eveningShift || newDoctorForm.eveningShift || '05:00 PM - 08:00 PM',
          staffUsername: hospitalBaseId,
          staffPassword: newDoctorForm.staffPassword.trim() || 'hospital123',
          profilePic: doc.profilePic?.trim() ? doc.profilePic.trim() : defaultPic,
          clinicImages: newDoctorForm.clinicImages || ['', ''],
        });
      });
      setSaveSuccessMsg(`Hospital "${newDoctorForm.clinicName}" with ${validDoctors.length} doctors onboarded!`);
    }

    setTimeout(() => {
      window.location.href = '/staff';
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-slate-950 py-10 px-4 flex items-center justify-center">
      <div className="w-full max-w-2xl rounded-3xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
        
        <div className="bg-slate-900 text-white px-6 py-5 flex items-center justify-between">
          <div>
            <span className="rounded bg-amber-400 text-slate-950 px-2 py-0.5 text-[10px] font-bold uppercase">
              Direct Onboarding Link (No Admin Login)
            </span>
            <h3 className="text-lg font-black mt-1">Add New Doctor / Hospital</h3>
          </div>
          <a
            href="/"
            className="rounded-xl bg-white/10 hover:bg-white/20 px-3.5 py-2 text-xs font-bold text-white transition flex items-center gap-1.5"
          >
            <ArrowLeft className="h-4 w-4" /> Home
          </a>
        </div>

        {saveSuccessMsg && (
          <div className="m-6 rounded-2xl bg-emerald-50 border border-emerald-300 p-4 text-xs text-emerald-800 font-bold flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
            <span>{saveSuccessMsg} Redirecting to Staff Portal...</span>
          </div>
        )}

        <form onSubmit={handleCreateDoctor} className="p-6 sm:p-8 space-y-5 max-h-[75vh] overflow-y-auto">
          
          {/* Establishment Type Selector */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <span className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
              Select Establishment Type *
            </span>
            <div className="grid grid-cols-2 gap-3">
              <label
                className={`flex items-center gap-2.5 p-3.5 rounded-xl border cursor-pointer transition ${
                  establishmentType === 'CLINIC'
                    ? 'bg-blue-50 border-blue-600 text-blue-900 font-bold'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <input
                  type="radio"
                  name="establishmentType"
                  value="CLINIC"
                  checked={establishmentType === 'CLINIC'}
                  onChange={() => setEstablishmentType('CLINIC')}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <span className="text-sm block leading-none">Private Clinic</span>
                  <span className="text-[10px] text-slate-500 font-normal">Single doctor practice</span>
                </div>
              </label>

              <label
                className={`flex items-center gap-2.5 p-3.5 rounded-xl border cursor-pointer transition ${
                  establishmentType === 'HOSPITAL'
                    ? 'bg-blue-50 border-blue-600 text-blue-900 font-bold'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <input
                  type="radio"
                  name="establishmentType"
                  value="HOSPITAL"
                  checked={establishmentType === 'HOSPITAL'}
                  onChange={() => setEstablishmentType('HOSPITAL')}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <span className="text-sm block leading-none">Hospital</span>
                  <span className="text-[10px] text-slate-500 font-normal">Multi-doctor & 1 Common Reception ID</span>
                </div>
              </label>
            </div>
          </div>

          {/* Common Establishment Info */}
          <div className="space-y-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {establishmentType === 'CLINIC' ? 'Clinic Name *' : 'Hospital Name *'}
              </label>
              <input
                type="text"
                required
                value={newDoctorForm.clinicName}
                onChange={(e) => setNewDoctorForm({ ...newDoctorForm, clinicName: e.target.value })}
                placeholder={establishmentType === 'CLINIC' ? 'e.g. Rai Clinic' : 'e.g. Aditya Hospital'}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:border-blue-600 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Address (Gali / Mohalla / Landmark) *</label>
                <input
                  type="text"
                  required
                  value={newDoctorForm.address}
                  onChange={(e) => setNewDoctorForm({ ...newDoctorForm, address: e.target.value })}
                  placeholder="e.g. Rewa Road, Near Old Bus Stand"
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">City (Shahar) *</label>
                <input
                  type="text"
                  required
                  value={newDoctorForm.city}
                  onChange={(e) => setNewDoctorForm({ ...newDoctorForm, city: e.target.value })}
                  placeholder="e.g. Shahdol"
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:border-blue-600 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Phone / Helpline *</label>
              <input
                type="tel"
                required
                value={newDoctorForm.phone}
                onChange={(e) => setNewDoctorForm({ ...newDoctorForm, phone: e.target.value })}
                placeholder="+91 98765 43210"
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:border-blue-600 focus:outline-none"
              />
            </div>

            {/* Common Staff Credentials */}
            <div className="rounded-2xl bg-amber-50 border border-amber-200 p-4 space-y-2.5">
              <span className="text-xs font-bold text-amber-900 uppercase tracking-wider block">
                {establishmentType === 'CLINIC' ? 'Staff Login Credentials' : 'Hospital Reception Common Login'}
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[10px] font-bold text-slate-700">
                      Staff ID * (Auto Generated)
                    </label>
                    {newDoctorForm.staffUsername.trim() && (
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                        isCurrentUsernameTaken ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {isCurrentUsernameTaken ? '❌ Taken' : '✓ Available'}
                      </span>
                    )}
                  </div>
                  <input
                    type="text"
                    required
                    value={newDoctorForm.staffUsername}
                    onChange={(e) => {
                      const cleanVal = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '');
                      setNewDoctorForm({ ...newDoctorForm, staffUsername: cleanVal });
                    }}
                    placeholder="e.g. dr_ramesh_rai"
                    className="w-full rounded-xl border border-amber-300 bg-white px-3 py-2 font-mono text-xs font-bold text-slate-800 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-700 mb-1">Password *</label>
                  <input
                    type="text"
                    required
                    value={newDoctorForm.staffPassword}
                    onChange={(e) => setNewDoctorForm({ ...newDoctorForm, staffPassword: e.target.value })}
                    placeholder="e.g. amrita123"
                    className="w-full rounded-xl border border-amber-300 bg-white px-3 py-2 font-mono text-xs font-bold text-slate-800 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Single Clinic Doctor Details */}
          {establishmentType === 'CLINIC' && (
            <div className="space-y-3.5 p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <span className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                Doctor Profile Details
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Doctor Full Name *</label>
                  <input
                    type="text"
                    required
                    value={newDoctorForm.name}
                    onChange={(e) => setNewDoctorForm({ ...newDoctorForm, name: e.target.value })}
                    placeholder="e.g. Dr. Ramesh Rai"
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Degree / Qualification *</label>
                  <input
                    type="text"
                    required
                    value={newDoctorForm.degree}
                    onChange={(e) => setNewDoctorForm({ ...newDoctorForm, degree: e.target.value })}
                    placeholder="e.g. MBBS, MD (Medicine)"
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Specialty / Department *</label>
                <input
                  type="text"
                  required
                  value={newDoctorForm.specialty}
                  onChange={(e) => setNewDoctorForm({ ...newDoctorForm, specialty: e.target.value })}
                  placeholder="e.g. Cardiologist & Heart Specialist"
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Doctor DP / Profile Picture URL</label>
                <input
                  type="text"
                  value={newDoctorForm.profilePic}
                  onChange={(e) => setNewDoctorForm({ ...newDoctorForm, profilePic: e.target.value })}
                  placeholder="https://images.unsplash.com/photo-..."
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs bg-white focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* Multi-Doctor Hospital Section */}
          {establishmentType === 'HOSPITAL' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Hospital Doctors & Cabins ({hospitalDoctors.length})
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setHospitalDoctors((prev) => [
                      ...prev,
                      {
                        name: '',
                        degree: '',
                        specialty: '',
                        cabinNumber: `Cabin ${prev.length + 1}`,
                        profilePic: '',
                        morningShift: '10:00 AM - 02:00 PM',
                        eveningShift: '05:00 PM - 08:00 PM',
                      },
                    ])
                  }
                  className="rounded-xl bg-blue-600 text-white px-3 py-1.5 text-xs font-bold hover:bg-blue-700 transition cursor-pointer"
                >
                  + Add Another Doctor
                </button>
              </div>

              {hospitalDoctors.map((doc, idx) => (
                <div key={idx} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                    <span className="text-xs font-black text-blue-900">Doctor #{idx + 1}</span>
                    {hospitalDoctors.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setHospitalDoctors(hospitalDoctors.filter((_, i) => i !== idx))}
                        className="text-xs text-rose-600 font-bold cursor-pointer"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <div className="sm:col-span-2">
                      <input
                        type="text"
                        required
                        value={doc.name}
                        onChange={(e) => {
                          const updated = [...hospitalDoctors];
                          updated[idx].name = e.target.value;
                          setHospitalDoctors(updated);
                        }}
                        placeholder="Doctor Full Name (e.g. Dr. Vinamra Jain)"
                        className="w-full rounded-xl border border-slate-300 px-3 py-1.5 text-xs bg-white focus:outline-none"
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        required
                        value={doc.cabinNumber}
                        onChange={(e) => {
                          const updated = [...hospitalDoctors];
                          updated[idx].cabinNumber = e.target.value;
                          setHospitalDoctors(updated);
                        }}
                        placeholder="Cabin No."
                        className="w-full rounded-xl border border-slate-300 px-3 py-1.5 text-xs bg-white focus:outline-none"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <input
                      type="text"
                      required
                      value={doc.degree}
                      onChange={(e) => {
                        const updated = [...hospitalDoctors];
                        updated[idx].degree = e.target.value;
                        setHospitalDoctors(updated);
                      }}
                      placeholder="Degree (e.g. MBBS, MS)"
                      className="w-full rounded-xl border border-slate-300 px-3 py-1.5 text-xs bg-white focus:outline-none"
                    />
                    <input
                      type="text"
                      required
                      value={doc.specialty}
                      onChange={(e) => {
                        const updated = [...hospitalDoctors];
                        updated[idx].specialty = e.target.value;
                        setHospitalDoctors(updated);
                      }}
                      placeholder="Specialty (e.g. Surgeon)"
                      className="w-full rounded-xl border border-slate-300 px-3 py-1.5 text-xs bg-white focus:outline-none"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Smart Auto Tags */}
          <div className="rounded-2xl bg-indigo-50/70 border border-indigo-200 p-3.5 space-y-2">
            <span className="text-xs font-bold text-indigo-900 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-indigo-600" />
              <span>Search Keywords & Tags</span>
            </span>
            <div className="flex flex-wrap gap-1.5 min-h-[28px]">
              {(newDoctorForm.tags || []).map((tag) => (
                <span key={tag} className="inline-flex items-center gap-1 bg-indigo-600 text-white text-[11px] font-bold px-2 py-0.5 rounded-lg">
                  <span>{tag}</span>
                  <button
                    type="button"
                    onClick={() => setNewDoctorForm({ ...newDoctorForm, tags: newDoctorForm.tags.filter((t) => t !== tag) })}
                    className="cursor-pointer"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={customTagInput}
                onChange={(e) => setCustomTagInput(e.target.value)}
                placeholder="Koi keyword likhein aur Add dabayein..."
                className="flex-1 rounded-xl border border-indigo-200 bg-white px-3 py-1.5 text-xs focus:outline-none"
              />
              <button
                type="button"
                onClick={() => {
                  const val = customTagInput.trim();
                  if (val && !(newDoctorForm.tags || []).includes(val)) {
                    setNewDoctorForm({ ...newDoctorForm, tags: [...newDoctorForm.tags, val] });
                    setCustomTagInput('');
                  }
                }}
                className="rounded-xl bg-indigo-600 text-white px-3.5 py-1.5 text-xs font-bold cursor-pointer"
              >
                Add
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isCurrentUsernameTaken}
            className={`w-full rounded-xl py-3.5 text-xs font-bold text-white shadow-lg transition cursor-pointer ${
              isCurrentUsernameTaken ? 'bg-slate-400 cursor-not-allowed opacity-60' : 'bg-blue-600 hover:bg-blue-500'
            }`}
          >
            {establishmentType === 'CLINIC' ? 'Create & Launch Clinic' : 'Create & Launch Hospital'}
          </button>
        </form>

      </div>
    </div>
  );
};
