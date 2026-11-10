import React, { useState } from 'react';
import { useClinic } from '../../context/ClinicContext';
import { DoctorCard } from './DoctorCard';
import { BookingModal } from './BookingModal';
import { Doctor } from '../../types';
import {
  Search,
  Activity,
  ShieldCheck,
  Radio,
  Clock,
  Sparkles,
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

    // Specialty Chip Filter
    if (selectedSpecialty !== 'ALL') {
      const specMatch = doc.specialty?.toLowerCase().includes(selectedSpecialty.toLowerCase());
      if (!specMatch) return false;
    }

    if (!query) return true;

    // 1. Direct visible details
    const matchesVisible =
      doc.name.toLowerCase().includes(query) ||
      doc.specialty.toLowerCase().includes(query) ||
      doc.clinicName.toLowerCase().includes(query) ||
      doc.city.toLowerCase().includes(query);

    // 2. Invisible background tags (Public card par show nahi honge, sirf match honge)
    const matchesTags = doc.tags?.some((t) => t.toLowerCase().includes(query));

    return matchesVisible || matchesTags;
  });

  return (
    <div
      className="min-h-[calc(100vh-4rem)] bg-slate-50 pb-20 w-full max-w-[100vw] overflow-x-hidden"
      onTouchStart={(e) => {
        // Agar user input ke alawa screen par kahin bhi tap ya scroll kare toh mobile keyboard band ho jaye
        const target = e.target as HTMLElement;
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
          if (document.activeElement instanceof HTMLElement) {
            document.activeElement.blur();
          }
        }
      }}
    >
      {/* Hero Search Section */}
      <div className="relative bg-gradient-to-b from-blue-900 via-blue-800 to-slate-900 text-white pt-8 pb-14 sm:pt-10 sm:pb-16 px-4 sm:px-6 lg:px-8 overflow-hidden w-full max-w-[100vw]">
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none"></div>

        <div className="relative max-w-5xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full bg-blue-500/20 px-3.5 py-1 text-xs font-semibold text-blue-200 border border-blue-400/30 backdrop-blur-md">
            <Radio className="h-3.5 w-3.5 text-emerald-400 animate-pulse" />
            <span>Live OPD Token & Doctor Status Portal</span>
          </div>

          <h1 className="text-2xl sm:text-5xl font-black tracking-tight text-white leading-tight">
            Live Doctor Status &{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 via-teal-200 to-emerald-300">
              Running Token Tracker
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-xs sm:text-base text-blue-100 font-normal leading-relaxed">
            Check live doctor availability, view currently serving token numbers in real-time, or book your token online from home for just <strong className="text-emerald-300 font-bold">₹20</strong> with automated bot voice call alerts before your turn!
          </p>

          {/* Privacy Guarantee Badge */}
          <div className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[11px] sm:text-xs text-blue-100 backdrop-blur-sm border border-white/15 max-w-full">
            <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
            <span className="truncate sm:whitespace-normal">100% Patient Privacy: No public patient queue list published</span>
          </div>

          {/* Search bar & Filter Chips */}
          <div className="max-w-2xl mx-auto pt-3 sm:pt-4">
            <div className="relative flex items-center">
              <Search className="absolute left-4 h-5 w-5 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  // Mobile keyboard par 'Enter' / 'Done' / 'Search' dabate hi keyboard band ho jaye
                  if (e.key === 'Enter') {
                    (e.target as HTMLInputElement).blur();
                  }
                }}
                placeholder="Doctor ka naam, Bimari/Specialty, ya Clinic dhoondhein..."
                className="w-full rounded-2xl bg-white text-slate-900 pl-11 pr-10 py-3 text-sm sm:text-base font-medium shadow-xl shadow-black/20 focus:outline-none focus:ring-4 focus:ring-blue-400/40"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3.5 p-1 rounded-full text-xs font-bold text-slate-400 hover:text-slate-600 bg-slate-100 cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Specialty Chips: FIXED - justify-start on mobile, smooth touch scrolling */}
            <div className="flex items-center gap-2 mt-3 overflow-x-auto py-1 scrollbar-none justify-start sm:justify-center px-1 touch-pan-x w-full">
              {['ALL', 'Physician', 'Gynecologist', 'Orthopedics'].map((spec) => (
                <button
                  key={spec}
                  type="button"
                  onClick={() => {
                    setSelectedSpecialty(spec);
                    // Filter chip select hote hi screen se keyboard blur ho jaye
                    if (document.activeElement instanceof HTMLElement) {
                      document.activeElement.blur();
                    }
                  }}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition cursor-pointer shrink-0 whitespace-nowrap active:scale-95 ${
                    selectedSpecialty === spec
                      ? 'bg-blue-500 text-white shadow-md'
                      : 'bg-white/15 text-blue-100 hover:bg-white/25 border border-white/20'
                  }`}
                >
                  {spec === 'ALL' ? 'Sabhi Doctors (All)' : spec}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area: STRICTLY DOCTOR CARDS WITH LIVE STATUS & RUNNING TOKEN */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-lg sm:text-xl font-black text-slate-900">
              Live OPD Clinics ({filteredDoctors.length})
            </h2>
            <p className="text-xs text-slate-500">
              Live status, currently serving token, and instant ₹20 online booking
            </p>
          </div>
        </div>

        {filteredDoctors.length === 0 ? (
          <div className="rounded-3xl bg-white p-12 text-center border border-slate-200 shadow-sm">
            <Activity className="mx-auto h-12 w-12 text-slate-400" />
            <h3 className="text-base font-bold text-slate-800 mt-3">Koi doctor nahi mila</h3>
            <p className="text-xs text-slate-500 mt-1">Kripya doosra naam ya specialty search karein</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-2xl bg-white p-5 border border-slate-200 shadow-xs flex items-start gap-3">
            <div className="h-10 w-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                1. Real-Time Token Number
              </h4>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Check exactly which token is inside the doctor's cabin before leaving home.
              </p>
            </div>
          </div>

          <div className="rounded-2xl bg-white p-5 border border-slate-200 shadow-xs flex items-start gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
              <PhoneCall className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                2. Automated Bot Call Alert
              </h4>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                When your turn is near (3-4 patients ahead), our automated voice bot calls your phone!
              </p>
            </div>
          </div>

          <div className="rounded-2xl bg-white p-5 border border-slate-200 shadow-xs flex items-start gap-3">
            <div className="h-10 w-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
              <Lock className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                3. Complete Patient Privacy
              </h4>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                No patient names, histories, or queue rosters are publicly exposed.
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
