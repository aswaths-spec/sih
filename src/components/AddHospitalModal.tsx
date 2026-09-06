import React, { useState } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Facility, FacilityType } from '../types';
import {
  Building2,
  X,
  Plus,
  CheckCircle2,
  AlertCircle,
  Stethoscope,
  Activity,
  Bed,
  Phone,
  MapPin,
  ShieldAlert
} from 'lucide-react';

interface AddHospitalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFacilityAdded: (facility: Facility) => void;
}

const TN_DISTRICTS = [
  'Coimbatore',
  'Chennai',
  'Madurai',
  'Salem',
  'Tiruchirappalli',
  'Thanjavur',
  'Tirunelveli',
  'Vellore',
  'Tiruppur',
  'Erode',
  'Dindigul',
  'Nilgiris',
  'Kanyakumari',
  'Chengalpattu',
  'Kanchipuram'
];

const SPECIALTY_OPTIONS = [
  'Cardiology',
  'General Medicine',
  'Obstetrics/Gynecology',
  'Pediatrics',
  'Orthopedics',
  'General Surgery',
  'Neurology',
  'Nephrology',
  'Pulmonology',
  'Emergency & Trauma'
];

const DIAGNOSTIC_OPTIONS = [
  'ECG 12-Lead',
  'Troponin-I Biomarker',
  'Digital X-Ray',
  'Ultrasound (USG)',
  '2D Echocardiography',
  '128-Slice CT Scan',
  '1.5T MRI',
  'Comprehensive Blood Bank',
  'Complete Blood Count (CBC)',
  'Biochemistry Panel'
];

export const AddHospitalModal: React.FC<AddHospitalModalProps> = ({
  isOpen,
  onClose,
  onFacilityAdded
}) => {
  const { language } = useAuth();
  const isTamil = language === 'ta';

  const [name, setName] = useState('');
  const [type, setType] = useState<FacilityType>('District Hospital');
  const [category, setCategory] = useState<'Public' | 'Private'>('Public');
  const [district, setDistrict] = useState('Coimbatore');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [emergencyCapability, setEmergencyCapability] = useState(true);
  const [totalBeds, setTotalBeds] = useState(300);
  const [occupiedBeds, setOccupiedBeds] = useState(190);
  const [icuBeds, setIcuBeds] = useState(25);
  const [occupiedIcuBeds, setOccupiedIcuBeds] = useState(16);
  const [currentQueueLength, setCurrentQueueLength] = useState(14);
  const [averageWaitTimeMin, setAverageWaitTimeMin] = useState(20);
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([
    'Cardiology',
    'General Medicine'
  ]);
  const [selectedDiagnostics, setSelectedDiagnostics] = useState<string[]>([
    'ECG 12-Lead',
    'Troponin-I Biomarker',
    'Digital X-Ray'
  ]);
  const [medicineStockRatio, setMedicineStockRatio] = useState(0.92);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const toggleSpecialty = (sp: string) => {
    if (selectedSpecialties.includes(sp)) {
      setSelectedSpecialties(selectedSpecialties.filter(s => s !== sp));
    } else {
      setSelectedSpecialties([...selectedSpecialties, sp]);
    }
  };

  const toggleDiagnostic = (dg: string) => {
    if (selectedDiagnostics.includes(dg)) {
      setSelectedDiagnostics(selectedDiagnostics.filter(d => d !== dg));
    } else {
      setSelectedDiagnostics([...selectedDiagnostics, dg]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!name.trim()) {
      setError(isTamil ? 'மருத்துவமனை பெயரை உள்ளிடவும்' : 'Hospital name is required');
      return;
    }

    setSubmitting(true);
    try {
      const specialistsPayload = selectedSpecialties.map(spec => ({
        specialty: spec,
        available: true,
        doctorName: `Dr. Specialist (${spec})`
      }));

      const payload: Partial<Facility> = {
        name: name.trim(),
        type,
        category,
        district,
        address: address.trim() || `${name.trim()}, ${district}, Tamil Nadu`,
        phone: phone.trim() || '0422-230' + Math.floor(1000 + Math.random() * 9000),
        emergencyCapability,
        totalBeds: Number(totalBeds),
        occupiedBeds: Number(occupiedBeds),
        icuBeds: Number(icuBeds),
        occupiedIcuBeds: Number(occupiedIcuBeds),
        currentQueueLength: Number(currentQueueLength),
        averageWaitTimeMin: Number(averageWaitTimeMin),
        specialists: specialistsPayload,
        services: [
          emergencyCapability ? '24x7 Emergency Trauma Unit' : 'General Outpatient (OPD)',
          'Inpatient Admission',
          'Pharmacy Counter',
          'Diagnostics & Labs'
        ],
        availableDiagnostics: selectedDiagnostics,
        medicineStockRatio: Number(medicineStockRatio)
      };

      const created = await api.createFacility(payload);
      setSuccessMsg(
        isTamil
          ? `மருத்துவமனை வெற்றிகரமாக சேர்க்கப்பட்டது: ${created.name}`
          : `Hospital successfully added: ${created.name}`
      );
      onFacilityAdded(created);
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err: any) {
      setError(err.message || 'Failed to save hospital data');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-3xl w-full my-8 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-700 via-teal-800 to-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-xl">
              <Building2 className="w-6 h-6 text-teal-300" />
            </div>
            <div>
              <h2 className="text-lg font-bold">
                {isTamil
                  ? 'தமிழ்நாடு மருத்துவமனை தரவு உள்ளீடு'
                  : 'Feed Hospital Data — Tamil Nadu Healthcare Network'}
              </h2>
              <p className="text-xs text-teal-200">
                {isTamil
                  ? 'தமிழ்நாட்டின் முக்கிய நகரங்களில் புதிய மருத்துவமனைகளை சேர்த்து திறன் வழிநடத்தலை இயக்கவும்'
                  : 'Manually feed new hospital capacity and specialist capabilities across Tamil Nadu cities'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 text-xs text-slate-700">
          {error && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Section 1: Basic Identity */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-900 mb-1">
                {isTamil ? 'மருத்துவமனை பெயர் *' : 'Hospital Name *'}
              </label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder={
                  isTamil
                    ? 'எ.கா: கோவை அரசு மருத்துவக் கல்லூரி மருத்துவமனை / மதுரை அப்பல்லோ'
                    : 'e.g. Tiruppur Government Headquarters Hospital or Apollo Speciality Hospital'
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-900 mb-1">
                {isTamil ? 'மருத்துவமனை வகை *' : 'Facility Type *'}
              </label>
              <select
                value={type}
                onChange={e => setType(e.target.value as FacilityType)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none bg-white"
              >
                <option value="District Hospital">District Hospital (மாவட்ட மருத்துவமனை)</option>
                <option value="Specialist Medical College">Specialist Medical College (மருத்துவக் கல்லூரி)</option>
                <option value="CHC">CHC / Sub-District Hospital (சமூக சுகாதார மையம்)</option>
                <option value="PHC">Primary Health Centre (ஆரம்ப சுகாதார நிலையம்)</option>
                <option value="Private Empanelled">Private Empanelled (அங்கீகரிக்கப்பட்ட தனியார்)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-900 mb-1">
                {isTamil ? 'நிர்வாக வகை *' : 'Category *'}
              </label>
              <div className="flex gap-4 items-center mt-1.5">
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="category"
                    checked={category === 'Public'}
                    onChange={() => setCategory('Public')}
                    className="text-teal-600 focus:ring-teal-500"
                  />
                  <span>{isTamil ? 'அரசு (Public)' : 'Public (Govt)'}</span>
                </label>
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="category"
                    checked={category === 'Private'}
                    onChange={() => setCategory('Private')}
                    className="text-teal-600 focus:ring-teal-500"
                  />
                  <span>{isTamil ? 'தனியார் (Private)' : 'Private Empanelled'}</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-900 mb-1">
                {isTamil ? 'மாவட்டம் (தமிழ்நாடு) *' : 'Tamil Nadu District *'}
              </label>
              <select
                value={district}
                onChange={e => setDistrict(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none bg-white"
              >
                {TN_DISTRICTS.map(d => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-900 mb-1">
                {isTamil ? 'தொலைபேசி எண்' : 'Hospital Phone Contact'}
              </label>
              <input
                type="text"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="0422-2301393"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-900 mb-1">
                {isTamil ? 'முழு முகவரி' : 'Address in Tamil Nadu'}
              </label>
              <input
                type="text"
                value={address}
                onChange={e => setAddress(e.target.value)}
                placeholder="Trichy Road, Coimbatore, Tamil Nadu"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Section 2: Beds & Emergency Capacity */}
          <div className="border-t border-slate-200 pt-4">
            <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
              <Bed className="w-4 h-4 text-teal-600" />
              {isTamil ? 'படுக்கைகள் மற்றும் தீவிர சிகிச்சை திறன்' : 'Bed & Resuscitation Capacity'}
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-slate-600 mb-1">
                  {isTamil ? 'மொத்த படுக்கைகள்' : 'Total Beds'}
                </label>
                <input
                  type="number"
                  min="5"
                  max="5000"
                  value={totalBeds}
                  onChange={e => setTotalBeds(Number(e.target.value))}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1">
                  {isTamil ? 'நிரம்பிய படுக்கைகள்' : 'Occupied Beds'}
                </label>
                <input
                  type="number"
                  min="0"
                  max={totalBeds}
                  value={occupiedBeds}
                  onChange={e => setOccupiedBeds(Number(e.target.value))}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1">
                  {isTamil ? 'ICU படுக்கைகள்' : 'ICU Beds'}
                </label>
                <input
                  type="number"
                  min="0"
                  max="500"
                  value={icuBeds}
                  onChange={e => setIcuBeds(Number(e.target.value))}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1">
                  {isTamil ? 'நிரம்பிய ICU படுக்கைகள்' : 'Occupied ICU'}
                </label>
                <input
                  type="number"
                  min="0"
                  max={icuBeds}
                  value={occupiedIcuBeds}
                  onChange={e => setOccupiedIcuBeds(Number(e.target.value))}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
              <div>
                <label className="block text-slate-600 mb-1">
                  {isTamil ? 'தற்போதைய வரிசை (OPD)' : 'Current OPD Queue'}
                </label>
                <input
                  type="number"
                  min="0"
                  value={currentQueueLength}
                  onChange={e => setCurrentQueueLength(Number(e.target.value))}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1">
                  {isTamil ? 'சராசரி காத்திருப்பு (நிமிடம்)' : 'Est. Wait Time (min)'}
                </label>
                <input
                  type="number"
                  min="0"
                  value={averageWaitTimeMin}
                  onChange={e => setAverageWaitTimeMin(Number(e.target.value))}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="flex items-center gap-3 pt-5">
                <input
                  type="checkbox"
                  id="chk-emergency"
                  checked={emergencyCapability}
                  onChange={e => setEmergencyCapability(e.target.checked)}
                  className="w-4 h-4 text-teal-600 rounded-sm focus:ring-teal-500"
                />
                <label htmlFor="chk-emergency" className="font-semibold text-slate-900 cursor-pointer">
                  {isTamil ? '24x7 அவசர சிகிச்சை வசதி (Emergency Bay)' : '24x7 Emergency Trauma Unit'}
                </label>
              </div>
            </div>
          </div>

          {/* Section 3: Available Specialists */}
          <div className="border-t border-slate-200 pt-4">
            <label className="block font-bold text-slate-900 mb-2 flex items-center gap-2">
              <Stethoscope className="w-4 h-4 text-teal-600" />
              {isTamil ? 'கிடைக்கும் சிறப்பு மருத்துவர்கள்' : 'Available Specialists'}
            </label>
            <div className="flex flex-wrap gap-2">
              {SPECIALTY_OPTIONS.map(sp => {
                const isSelected = selectedSpecialties.includes(sp);
                return (
                  <button
                    key={sp}
                    type="button"
                    onClick={() => toggleSpecialty(sp)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition ${
                      isSelected
                        ? 'bg-teal-600 text-white shadow-2xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {isSelected ? '✓ ' : '+ '}
                    {sp}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 4: Diagnostics Available */}
          <div className="border-t border-slate-200 pt-4">
            <label className="block font-bold text-slate-900 mb-2 flex items-center gap-2">
              <Activity className="w-4 h-4 text-teal-600" />
              {isTamil ? 'பரிசோதனை மற்றும் கண்டறியும் வசதிகள்' : 'Available Diagnostic Equipment'}
            </label>
            <div className="flex flex-wrap gap-2">
              {DIAGNOSTIC_OPTIONS.map(dg => {
                const isSelected = selectedDiagnostics.includes(dg);
                return (
                  <button
                    key={dg}
                    type="button"
                    onClick={() => toggleDiagnostic(dg)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition ${
                      isSelected
                        ? 'bg-indigo-600 text-white shadow-2xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {isSelected ? '✓ ' : '+ '}
                    {dg}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="border-t border-slate-200 pt-4 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition"
            >
              {isTamil ? 'ரத்து செய்' : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-sm transition flex items-center gap-2 disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              {submitting
                ? isTamil
                  ? 'சேமிக்கப்படுகிறது...'
                  : 'Saving Hospital...'
                : isTamil
                ? 'மருத்துவமனையை பதிவு செய்'
                : 'Save Hospital to Tamil Nadu Network'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
