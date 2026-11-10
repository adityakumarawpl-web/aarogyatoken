import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  ArrowUp,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

export const PublicOPDView: React.FC = () => {
  const { doctors, patients } = useClinic();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('ALL');
  const [activeDoctorForBooking, setActiveDoctorForBooking] = useState<Doctor | null>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const chipsScrollRef = useRef<HTMLDivElement>(null);

  // Dynamic Unique Specialty Chips
  const specialtyList = useMemo(() => {
    const list: string[] = [];
    doctors.forEach((doc) => {
      if (doc.specialty && typeof doc.specialty === 'string') {
        const clean = doc.specialty.trim();
        if (clean && !clean.startsWith('http') && !list.includes(clean)) {
          list.push(clean);
        }
      }
    });
    return list;
  }, [doctors]);

  // Scroll buttons handler for chips
  const scrollChips = (direction: 'left' | 'right') => {
    if (chipsScrollRef.current) {
      const scrollAmount = direction === 'left' ? -200 : 200;
      chipsScrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 250) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  const filteredDoctors = doctors.filter((doc) => {
    const query = searchQuery.toLowerCase().trim();

    if (selectedSpecialty !== 'ALL') {
      const specMatch = doc.specialty?.toLowerCase().trim() === selectedSpecialty.toLowerCase().trim();
      if (!specMatch) return false;
    }

    if (!query) return true;

    return (
      doc.name.toLowerCase().includes(query) ||
      doc.specialty?.toLowerCase().includes(query) ||
      doc.clinicName?.toLowerCase().includes(query) ||
      doc.city?.toLowerCase().includes(query)
    );
  });

  return (
    <div
      className="min-h-[calc(100vh-4rem)] bg-slate-50 pb-20 w-full relative"
      onTouchStart={(e) => {
        const target = e.target as HTMLElement;
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
          if (document.activeElement instanceof HTMLElement) {
            document.activeElement.blur();
          }
        }
      }}
    >
      {/* COMPACT HERO TITLE SECTION */}
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

      {/* SEARCH & FILTER BAR */}
      <div className="bg-blue-900/95 px-3 sm:px-6 py-2.5 border-b border-blue-700/60 shadow-md">
        <div className="max-w-2xl mx-auto">
          {/* Search Box */}
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
              placeholder="Doctor ka naam, Specialty ya Clinic dhoondhein..."
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
        </div>

        {/* 🔹 FULL-WIDTH SMOOTH SLIDER WITH CONTROLS */}
        <div className="max-w-4xl mx-auto mt-2.5 relative flex items-center group">
          {/* Left Arrow Button (Desktop View) */}
          <button
            type="button"
            onClick={() => scrollChips('left')}
            className="hidden sm:flex absolute -left-3 z-10 h-7 w-7 rounded-full bg-blue-800/90 text-white border border-blue-600 shadow-md items-center justify-center hover:bg-blue-700 cursor-pointer"
            aria-label="Scroll left"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          {/* Chips Scrollable Area */}
          <div
            ref={chipsScrollRef}
            className="flex items-center gap-2 overflow-x-auto py-1 scroll-smooth scrollbar-none w-full px-2 touch-pan-x"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            <button
              type="button"
              onClick={() => {
                setSelectedSpecialty('ALL');
                if (document.activeElement instanceof HTMLElement) {
                  document.activeElement.blur();
                }
              }}
              className={`px-3.5 py-1 rounded-full text-xs font-bold transition cursor-pointer shrink-0 whitespace-nowrap ${
                selectedSpecialty === 'ALL'
                  ? 'bg-blue-500 text-white shadow-sm'
                  : 'bg-white/15 text-blue-100 hover:bg-white/25 border border-white/20'
              }`}
            >
              Sabhi Doctors (All)
            </button>

            {specialtyList.map((spec) => (
              <button
                key={spec}
                type="button"
                onClick={() => {
                  setSelectedSpecialty(spec);
                  if (document.activeElement instanceof HTMLElement) {
                    document.activeElement.blur();
                  }
                }}
                className={`px-3.5 py-1 rounded-full text-xs font-bold transition cursor-pointer shrink-0 whitespace-nowrap ${
                  selectedSpecialty === spec
                    ? 'bg-blue-500 text-white shadow-sm'
                    : 'bg-white/15 text-blue-100 hover:bg-white/25 border border-white/20'
                }`}
              >
                {spec}
              </button>
            ))}
          </div>

          {/* Right Arrow Button (Desktop View) */}
          <button
            type="button"
            onClick={() => scrollChips('right')}
            className="hidden sm:flex absolute -right-3 z-10 h-7 w-7 rounded-full bg-blue-800/90 text-white border border-blue-600 shadow-md items-center justify-center hover:bg-blue-700 cursor-pointer"
            aria-label="Scroll right"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* MAIN DOCTOR CARDS AREA */}
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
            <p className="text-xs text-slate-500 mt-0.5">Kripya doosra naam ya specialty filter chunein</p>
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

      {/* Floating Scroll To Top Button */}
      {showScrollTop && (
        <button
          type="button"
          onClick={scrollToTop}
          aria-label="Scroll to top"
          className="fixed bottom-6 right-5 z-40 h-11 w-11 rounded-full bg-blue-600 text-white shadow-xl shadow-blue-600/40 border border-blue-400/30 flex items-center justify-center hover:bg-blue-700 active:scale-90 transition-all duration-200 cursor-pointer animate-in fade-in zoom-in-75"
        >
          <ArrowUp className="h-5 w-5 stroke-[2.5]" />
        </button>
      )}

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
