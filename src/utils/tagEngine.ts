export const getAutoTagSuggestions = (
  specialty: string,
  city: string = '',
  doctorName: string = ''
): string[] => {
  const s = specialty.toLowerCase().trim();
  const tags: string[] = [];

  // 1. Specialty aur bimariyon ke anusaar smart keywords
  if (s.includes('cardio') || s.includes('heart') || s.includes('dil')) {
    tags.push('Heart Specialist', 'Dil Ka Doctor', 'Chest Pain', 'BP Checkup', 'Cardiologist', 'ECG');
  } else if (s.includes('pediat') || s.includes('child') || s.includes('shishu') || s.includes('bach')) {
    tags.push('Child Specialist', 'Shishu Rog Visheshagya', 'Baccho Ka Doctor', 'Vaccination', 'Baby Fever');
  } else if (
    s.includes('gynae') ||
    s.includes('obste') ||
    s.includes('mahila') ||
    s.includes('female') ||
    s.includes('lady')
  ) {
    tags.push('Lady Doctor', 'Mahila Rog Visheshagya', 'Pregnancy Care', 'Normal Delivery', 'PCOS / PCOD');
  } else if (s.includes('ortho') || s.includes('bone') || s.includes('haddi') || s.includes('joint')) {
    tags.push('Haddi Rog Visheshagya', 'Bone Specialist', 'Joint Pain', 'Fracture & Plaster', 'Arthritis');
  } else if (s.includes('surg') || s.includes('laparo') || s.includes('doorbeen')) {
    tags.push('General Surgeon', 'Doorbeen Operation', 'Appendix Surgery', 'Gallbladder Stone', 'Hernia Specialist', 'Piles');
  } else if (s.includes('dent') || s.includes('daant')) {
    tags.push('Dentist', 'Daant Ka Doctor', 'Root Canal (RCT)', 'Teeth Cleaning', 'Dental Clinic');
  } else if (s.includes('eye') || s.includes('ophthal') || s.includes('aankh')) {
    tags.push('Eye Specialist', 'Aankh Ka Doctor', 'Cataract (Motiyabind)', 'Chashma Number');
  } else if (s.includes('derma') || s.includes('skin') || s.includes('twacha')) {
    tags.push('Skin Specialist', 'Twacha Rog', 'Allergy Doctor', 'Acne & Pimples');
  } else {
    tags.push('General Physician', 'Family Doctor', 'Fever & Infection', 'Sugar / Diabetes', 'OPD Clinic');
  }

  // 2. City tags
  if (city.trim()) {
    tags.push(`Best Doctor in ${city.trim()}`, `${city.trim()} OPD Clinic`);
  }

  // 3. Doctor name tag
  if (doctorName.trim()) {
    tags.push(doctorName.trim());
  }

  return tags;
};
