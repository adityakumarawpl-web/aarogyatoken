import React, { useState } from 'react';
import { useClinic } from '../../context/ClinicContext';
import { DoctorCard } from './DoctorCard';
import { BookingModal } from './BookingModal';
import { Doctor } from '../../types';
import {
  Search,
  Activity,
  Radio,
  Clock,
  PhoneCall,
  Lock,
  X,
} from 'lucide-react';

export const PublicOPDView: React.FC = () => {
  const { doctors, patients } = useClinic();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('ALL');
  const [activeDoctorForBooking, setActiveDoctorForBooking] = useState<Doctor | null>(null);

  const filteredDoctors = doctors.filter((doc) => {
    const query = searchQuery.toLowerCase().trim();

    if (selectedSpecialty !== 'ALL') {
      const specMatch = doc.specialty?.toLowerCase().includes(selectedSpecialty.toLowerCase());
      if (!specMatch) return false;
    }

    if (!query) return true;

    const matchesVisible =
      doc.name.toLowerCase().includes(query) ||
      doc.specialty.toLowerCase().includes(query) ||
      doc.clinicName.toLowerCase().includes(query) ||
      doc.city.toLowerCase().includes(query);

    const matchesTags = doc.tags?.some((t) => t.toLowerCase().includes(query));

    return matchesVisible || matchesTags;
  });

  return (
    <div
      className="min-h-[calc(100vh-4rem)] bg-slate-50 pb-16 w-full"
      onTouchStart={(e) => {
        const target = e.target as HTMLElement;
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
          if (document.activeElement instanceof HTMLElement) {
            document.activeElement.blur();
          }
        }
      }}
    >
      {/* 🔹 COMPACT HERO TITLE SECTION */}
      <div className="bg-gradient-to-b from-blue-900 to-blue-800 text-white pt-4 pb-3 px-3 sm:px-6 w-full shadow-xs">
        <div className="max-w-4xl mx-auto text-center space-y-1.5">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/25 px-2.5 py-0.5 text-[10px] sm:text-xs font-semibold text-blue-100 border border-blue-400/30">
            <Radio className="h-3 w-3 text-emerald-400 animate-pulse" />
            <span>Live OPD Token & Doctor Availability</span>
          </div>

          <h1 className="text-xl sm:text-3xl font-black tracking-tight text-white leading-tight">
            Live Doctor Status &{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-200 to-emerald-300">
              Token Tracker
            </span>
          </h1>
        </div>
      </div>

      {/* 🔹 FIXED STICKY SEARCH & FILTER BAR (Navbar ke theek neeche chipkega) */}
      <div className="sticky top-[56px] sm:top-[64px] z-30 bg-blue-900/95 backdrop-blur-md px-3 sm:px-6 py-2 border-b border-blue-700/60 shadow-md">
        <div className="max-w-xl mx-auto">
          <div className="relative flex items-center">
            <Search className="absolute left-3.5 h-4 w-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  (e.target as HTMLInputElement).blur();
                }
              }}
              placeholder="Doctor, bimari ya clinic search karein..."
              className="w-full rounded-xl bg-white text-slate-900 pl-10 pr-9 py-2 text-xs sm:text-sm font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 p-1 rounded-full text-[10px] font-bold text-slate-400 hover:text-slate-600 bg-slate-100 cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Specialty Filter Chips */}
          <div className="flex items-center gap-1.5 mt-2 overflow-x-auto py-0.5 scrollbar-none justify-start sm:justify-center px-0.5 touch-pan-x w-full">
            {['ALL', 'Physician', 'Gynecologist', 'Orthopedics'].map((spec) => (
              <button
                key={spec}
                type="button"
                onClick={() => {
                  setSelectedSpecialty(spec);
                  if (document.activeElement instanceof HTMLElement) {
                    document.activeElement.blur();
                  }
                }}
                className={`px-3 py-1 rounded-full text-[11px] font-bold transition cursor-pointer shrink-0 whitespace-nowrap active:scale-95 ${
                  selectedSpecialty === spec
                    ? 'bg-blue-500 text-white shadow-xs'
                    : 'bg-white/15 text-blue-100 hover:bg-white/25 border border-white/15'
                }`}
              >
                {spec === 'ALL' ? 'Sabhi Doctors (All)' : spec}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 🔹 MAIN DOCTOR CARDS AREA */}
      <div className="max-w-6xl mx-auto px-3 sm:px-6 lg:px-8 pt-4">
        <div className="flex items-center justify-between mb-3 px-1">
          <div>
            <h2 className="text-base sm:text-lg font-black text-slate-900">
              Live OPD Clinics ({filteredDoctors.length})
            </h2>
            <p className="text-[11px] text-slate-500">
              Live status, currently serving token, and instant ₹20 online booking
            </p>
          </div>
        </div>

        {filteredDoctors.length === 0 ? (
          <div className="rounded-3xl bg-white p-8 text-center border border-slate-200 shadow-sm">
            <Activity className="mx-auto h-10 w-10 text-slate-400" />
            <h3 className="text-sm font-bold text-slate-800 mt-2">Koi doctor nahi mila</h3>
            <p className="text-xs text-slate-500 mt-0.5">Kripya doosra naam ya specialty search karein</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {filteredDoctors.map((doc) => (
              <DoctorCard
                key={doc.id}
                doctor={doc}
                patients={patients}
                onBookOnline={(d) => setActiveDoctorForBooking(d)}
              />
            ))}
          </div>
        )}

        {/* Feature Highlights Banner */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="rounded-2xl bg-white p-4 border border-slate-200 shadow-xs flex items-start gap-3">
            <div className="h-9 w-9 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
              <Clock className="h-4 w-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                1. Real-Time Token Number
              </h4>
              <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                Cabin ke andar chal raha token number ghar baithe live dekhein.
              </p>
            </div>
          </div>

          <div className="rounded-2xl bg-white p-4 border border-slate-200 shadow-xs flex items-start gap-3">
            <div className="h-9 w-9 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
              <PhoneCall className="h-4 w-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                2. Automated Bot Call Alert
              </h4>
              <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                Aapka number aane se theek pehle system se call alert aayega.
              </p>
            </div>
          </div>

          <div className="rounded-2xl bg-white p-4 border border-slate-200 shadow-xs flex items-start gap-3">
            <div className="h-9 w-9 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
              <Lock className="h-4 w-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                3. Complete Patient Privacy
              </h4>
              <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                Public page par poori mareez list ya mobile number expose nahi hote.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Online Booking Modal */}
      {activeDoctorForBooking && (
        <BookingModal
          doctor={activeDoctorForBooking}
          onClose={() => setActiveDoctorForBooking(null)}
        />
      )}
    </div>
  );
};
