import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  User,
  ShieldAlert,
  Calendar,
  Upload,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Search,
  Scale,
  FileText,
  AlertCircle
} from 'lucide-react';
import api from '../../api/client';
import { useToast } from '../../context/ToastContext';

export const CaseWizard = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Catalogue of Offences
  const [offencesList, setOffencesList] = useState([]);
  const [offenceSearch, setOffenceSearch] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    // Step 1: Person Details
    personDetails: {
      fullName: '',
      age: 25,
      gender: 'Male',
      relationship: 'Self',
      contactPhone: '',
      address: '',
      idProofType: 'Aadhaar',
      idProofNumber: ''
    },
    // Step 2: Offence Selection
    offenceIds: [],
    // Step 3: Custody & Antecedents
    firNumber: '',
    policeStation: '',
    district: 'Chennai',
    court: 'Metropolitan Magistrate Court, Egmore',
    arrestDate: new Date().toISOString().split('T')[0],
    remandDate: new Date().toISOString().split('T')[0],
    priorConviction: false,
    priorConvictionDetails: '',
    otherPendingCases: false,
    pendingCaseDetails: ''
  });

  // Step 4: Files to upload
  const [firFile, setFirFile] = useState(null);
  const [remandFile, setRemandFile] = useState(null);
  const [idFile, setIdFile] = useState(null);

  useEffect(() => {
    const fetchOffences = async () => {
      try {
        setLoading(true);
        const { data } = await api.get('/offences');
        if (data?.success) {
          setOffencesList(data.offences || []);
        }
      } catch (err) {
        console.error('Failed to load offences:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchOffences();
  }, []);

  const handlePersonChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      personDetails: {
        ...prev.personDetails,
        [name]: name === 'age' ? parseInt(value, 10) || 18 : value
      }
    }));
  };

  const handleFieldChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const toggleOffence = (id) => {
    setFormData((prev) => {
      const exists = prev.offenceIds.includes(id);
      return {
        ...prev,
        offenceIds: exists ? prev.offenceIds.filter((item) => item !== id) : [...prev.offenceIds, id]
      };
    });
  };

  const filteredOffences = offencesList.filter(
    (off) =>
      off.section.toLowerCase().includes(offenceSearch.toLowerCase()) ||
      off.title.toLowerCase().includes(offenceSearch.toLowerCase()) ||
      (off.correspondingSection && off.correspondingSection.toLowerCase().includes(offenceSearch.toLowerCase()))
  );

  const selectedOffences = offencesList.filter((o) => formData.offenceIds.includes(o._id));

  // Submission handler
  const handleCompleteWizard = async () => {
    if (formData.offenceIds.length === 0) {
      addToast({ type: 'warning', title: 'Offence Required', message: 'Please select at least one offence.' });
      setStep(2);
      return;
    }

    setSubmitting(true);
    try {
      // 1. Create Case
      const { data: caseRes } = await api.post('/citizen/cases', formData);
      if (!caseRes?.success) {
        throw new Error(caseRes?.message || 'Failed to create case record');
      }

      const createdCaseId = caseRes.case._id;

      // 2. Upload Documents if provided
      const uploadPromises = [];
      if (firFile) {
        const firData = new FormData();
        firData.append('file', firFile);
        firData.append('fileType', 'FIR_COPY');
        uploadPromises.push(api.post(`/citizen/cases/${createdCaseId}/documents`, firData));
      }
      if (remandFile) {
        const remandData = new FormData();
        remandData.append('file', remandFile);
        remandData.append('fileType', 'REMAND_ORDER');
        uploadPromises.push(api.post(`/citizen/cases/${createdCaseId}/documents`, remandData));
      }
      if (idFile) {
        const idData = new FormData();
        idData.append('file', idFile);
        idData.append('fileType', 'ID_PROOF');
        uploadPromises.push(api.post(`/citizen/cases/${createdCaseId}/documents`, idData));
      }

      await Promise.all(uploadPromises);

      // 3. Run Initial Assessment
      await api.post(`/citizen/cases/${createdCaseId}/assessment`);

      addToast({
        type: 'success',
        title: 'Assessment Complete',
        message: 'Case created and statutory eligibility evaluated successfully!'
      });

      navigate(`/citizen/cases/${createdCaseId}`);
    } catch (err) {
      console.error('Wizard submission error:', err);
      addToast({
        type: 'error',
        title: 'Submission Failed',
        message: err.response?.data?.message || err.message || 'Error creating case.'
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Wizard Header & Stepper */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Add Undertrial Case & Assess Bail</h1>
        <p className="text-xs text-slate-500 mt-1">
          Complete the 4 steps to evaluate statutory rights under BNSS 187, 479, and Supreme Court guidelines.
        </p>

        {/* Stepper Progress */}
        <div className="grid grid-cols-4 gap-2 mt-6">
          {[
            { num: 1, label: '1. Accused Details' },
            { num: 2, label: '2. Offences & Sections' },
            { num: 3, label: '3. Custody Dates' },
            { num: 4, label: '4. Documents & Review' }
          ].map((s) => (
            <div key={s.num} className="text-center">
              <div
                className={`h-1.5 rounded-full mb-2 transition-all ${
                  step >= s.num ? 'bg-teal-500' : 'bg-slate-200'
                }`}
              ></div>
              <span
                className={`text-[11px] font-semibold ${
                  step === s.num ? 'text-teal-600 font-bold' : step > s.num ? 'text-slate-800' : 'text-slate-400'
                }`}
              >
                {s.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Step 1: Person Details */}
      {step === 1 && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center space-x-2 pb-3 border-b border-slate-100">
            <User className="w-5 h-5 text-teal-600" />
            <h3 className="font-bold text-sm text-slate-900">Step 1: Person in Custody Details</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Full Legal Name *</label>
              <input
                type="text"
                name="fullName"
                value={formData.personDetails.fullName}
                onChange={handlePersonChange}
                placeholder="e.g. Anandha Kumar"
                required
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Age *</label>
              <input
                type="number"
                name="age"
                min={18}
                max={120}
                value={formData.personDetails.age}
                onChange={handlePersonChange}
                required
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Gender *</label>
              <select
                name="gender"
                value={formData.personDetails.gender}
                onChange={handlePersonChange}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Transgender">Transgender</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Your Relationship to Accused *</label>
              <select
                name="relationship"
                value={formData.personDetails.relationship}
                onChange={handlePersonChange}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
              >
                <option value="Self">Self (Accused)</option>
                <option value="Father">Father</option>
                <option value="Mother">Mother</option>
                <option value="Spouse">Spouse</option>
                <option value="Brother">Brother</option>
                <option value="Sister">Sister</option>
                <option value="Authorised Representative">Authorised Representative / Advocate</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Contact Phone *</label>
              <input
                type="tel"
                name="contactPhone"
                value={formData.personDetails.contactPhone}
                onChange={handlePersonChange}
                placeholder="9876543210"
                required
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Identity Proof Type</label>
              <select
                name="idProofType"
                value={formData.personDetails.idProofType}
                onChange={handlePersonChange}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
              >
                <option value="Aadhaar">Aadhaar Card</option>
                <option value="Voter ID">Voter ID</option>
                <option value="PAN Card">PAN Card</option>
                <option value="Driving License">Driving License</option>
                <option value="Passport">Passport</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Permanent Residential Address *</label>
              <textarea
                name="address"
                rows={2}
                value={formData.personDetails.address}
                onChange={handlePersonChange}
                placeholder="Door No, Street, Village/Town, District, Pincode"
                required
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
              />
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button
              type="button"
              onClick={() => {
                if (!formData.personDetails.fullName || !formData.personDetails.contactPhone || !formData.personDetails.address) {
                  addToast({ type: 'warning', title: 'Incomplete Details', message: 'Please fill all required person details.' });
                  return;
                }
                setStep(2);
              }}
              className="px-5 py-2 rounded-lg bg-teal-500 hover:bg-teal-600 text-white font-semibold text-xs flex items-center space-x-1.5 shadow"
            >
              <span>Next: Offence Selection</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Offence Selection */}
      {step === 2 && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center space-x-2">
              <ShieldAlert className="w-5 h-5 text-teal-600" />
              <h3 className="font-bold text-sm text-slate-900">Step 2: Select Applicable Offences & Sections</h3>
            </div>
            <span className="text-xs font-semibold text-teal-600 bg-teal-50 px-2.5 py-1 rounded-full border border-teal-200">
              {formData.offenceIds.length} Selected
            </span>
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
            <input
              type="text"
              value={offenceSearch}
              onChange={(e) => setOffenceSearch(e.target.value)}
              placeholder="Search by section (e.g. 303, 318, 379), act, or offence name (Theft, Cheating)..."
              className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:bg-white"
            />
          </div>

          {/* Offence List */}
          <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-xl">
            {filteredOffences.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-500">No matching offences found.</div>
            ) : (
              filteredOffences.map((off) => {
                const isSelected = formData.offenceIds.includes(off._id);
                return (
                  <div
                    key={off._id}
                    onClick={() => toggleOffence(off._id)}
                    className={`p-3 text-xs flex items-center justify-between cursor-pointer transition-colors ${
                      isSelected ? 'bg-teal-50/80 border-l-4 border-teal-500' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-slate-900">{off.section}</span>
                        {off.correspondingSection && (
                          <span className="text-[10px] text-slate-500">({off.correspondingSection})</span>
                        )}
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                            off.bailable
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border-rose-200'
                          }`}
                        >
                          {off.bailable ? 'Bailable' : 'Non-Bailable'}
                        </span>
                        <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-600">
                          {off.antilCategory}
                        </span>
                      </div>
                      <p className="font-medium text-slate-800">{off.title}</p>
                      <p className="text-[11px] text-slate-500">
                        Max Sentence: <strong>{off.maxSentenceYears} years</strong> &bull; {off.act}
                      </p>
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}} // Handled by div click
                        className="w-4 h-4 text-teal-600 rounded border-slate-300 pointer-events-none"
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="flex justify-between pt-4">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center space-x-1"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <button
              type="button"
              onClick={() => {
                if (formData.offenceIds.length === 0) {
                  addToast({ type: 'warning', title: 'Selection Missing', message: 'Please select at least one offence.' });
                  return;
                }
                setStep(3);
              }}
              className="px-5 py-2 rounded-lg bg-teal-500 hover:bg-teal-600 text-white font-semibold text-xs flex items-center space-x-1.5 shadow"
            >
              <span>Next: Custody Dates</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Custody & Court Details */}
      {step === 3 && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center space-x-2 pb-3 border-b border-slate-100">
            <Calendar className="w-5 h-5 text-teal-600" />
            <h3 className="font-bold text-sm text-slate-900">Step 3: Custody Timeline, Court & Antecedents</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">FIR / Crime Number *</label>
              <input
                type="text"
                name="firNumber"
                value={formData.firNumber}
                onChange={handleFieldChange}
                placeholder="e.g. 142/2026"
                required
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Police Station *</label>
              <input
                type="text"
                name="policeStation"
                value={formData.policeStation}
                onChange={handleFieldChange}
                placeholder="e.g. Egmore Police Station"
                required
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">District *</label>
              <input
                type="text"
                name="district"
                value={formData.district}
                onChange={handleFieldChange}
                placeholder="e.g. Chennai"
                required
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Jurisdictional Court *</label>
              <input
                type="text"
                name="court"
                value={formData.court}
                onChange={handleFieldChange}
                placeholder="e.g. Metropolitan Magistrate Court, Egmore"
                required
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Date of Arrest *</label>
              <input
                type="date"
                name="arrestDate"
                value={formData.arrestDate}
                onChange={handleFieldChange}
                required
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Date of First Judicial Remand *
              </label>
              <input
                type="date"
                name="remandDate"
                value={formData.remandDate}
                onChange={handleFieldChange}
                required
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
              />
              <p className="text-[10px] text-slate-500 mt-1">
                Crucial for Section 187 (60/90 days default bail countdown)
              </p>
            </div>

            {/* Antecedents: Prior Convictions */}
            <div className="sm:col-span-2 p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-slate-800">Has the accused been convicted previously?</span>
                  <p className="text-[11px] text-slate-500">
                    Under BNSS Section 479, first-time offenders qualify at 1/3 custody; others require 1/2.
                  </p>
                </div>
                <input
                  type="checkbox"
                  name="priorConviction"
                  checked={formData.priorConviction}
                  onChange={handleFieldChange}
                  className="w-5 h-5 text-teal-600 rounded"
                />
              </div>

              {formData.priorConviction && (
                <input
                  type="text"
                  name="priorConvictionDetails"
                  value={formData.priorConvictionDetails}
                  onChange={handleFieldChange}
                  placeholder="Specify details of prior conviction (year, court, sentence)"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
                />
              )}
            </div>

            {/* Other Pending Cases */}
            <div className="sm:col-span-2 p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-slate-800">Are there any other criminal cases pending?</span>
                  <p className="text-[11px] text-slate-500">
                    Section 479 Second Proviso requires judicial review for multiple pending matters.
                  </p>
                </div>
                <input
                  type="checkbox"
                  name="otherPendingCases"
                  checked={formData.otherPendingCases}
                  onChange={handleFieldChange}
                  className="w-5 h-5 text-teal-600 rounded"
                />
              </div>

              {formData.otherPendingCases && (
                <input
                  type="text"
                  name="pendingCaseDetails"
                  value={formData.pendingCaseDetails}
                  onChange={handleFieldChange}
                  placeholder="Specify details of pending cases (FIR numbers, police stations)"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
                />
              )}
            </div>
          </div>

          <div className="flex justify-between pt-4">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center space-x-1"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <button
              type="button"
              onClick={() => {
                if (!formData.firNumber || !formData.policeStation || !formData.court) {
                  addToast({ type: 'warning', title: 'Fields Missing', message: 'Please enter FIR number, police station, and court.' });
                  return;
                }
                setStep(4);
              }}
              className="px-5 py-2 rounded-lg bg-teal-500 hover:bg-teal-600 text-white font-semibold text-xs flex items-center space-x-1.5 shadow"
            >
              <span>Next: Documents & Review</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Documents Upload & Final Review */}
      {step === 4 && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
          <div className="flex items-center space-x-2 pb-3 border-b border-slate-100">
            <Upload className="w-5 h-5 text-teal-600" />
            <h3 className="font-bold text-sm text-slate-900">Step 4: Upload Documents & Verify Case Summary</h3>
          </div>

          {/* Document Upload Blocks */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl border-2 border-dashed border-slate-200 hover:border-teal-400 bg-slate-50 transition-colors text-center space-y-2">
              <FileText className="w-6 h-6 text-slate-400 mx-auto" />
              <div className="text-xs font-semibold text-slate-800">FIR Copy</div>
              <p className="text-[10px] text-slate-400">PDF, JPG, PNG &bull; Max 5MB</p>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => setFirFile(e.target.files[0] || null)}
                className="text-[11px] text-slate-500 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-[10px] file:bg-teal-50 file:text-teal-700"
              />
              {firFile && <p className="text-[10px] text-teal-600 font-semibold truncate">{firFile.name}</p>}
            </div>

            <div className="p-4 rounded-xl border-2 border-dashed border-slate-200 hover:border-teal-400 bg-slate-50 transition-colors text-center space-y-2">
              <FileText className="w-6 h-6 text-slate-400 mx-auto" />
              <div className="text-xs font-semibold text-slate-800">Remand Order</div>
              <p className="text-[10px] text-slate-400">PDF, JPG, PNG &bull; Max 5MB</p>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => setRemandFile(e.target.files[0] || null)}
                className="text-[11px] text-slate-500 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-[10px] file:bg-teal-50 file:text-teal-700"
              />
              {remandFile && <p className="text-[10px] text-teal-600 font-semibold truncate">{remandFile.name}</p>}
            </div>

            <div className="p-4 rounded-xl border-2 border-dashed border-slate-200 hover:border-teal-400 bg-slate-50 transition-colors text-center space-y-2">
              <FileText className="w-6 h-6 text-slate-400 mx-auto" />
              <div className="text-xs font-semibold text-slate-800">ID / Identity Proof</div>
              <p className="text-[10px] text-slate-400">PDF, JPG, PNG &bull; Max 5MB</p>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => setIdFile(e.target.files[0] || null)}
                className="text-[11px] text-slate-500 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-[10px] file:bg-teal-50 file:text-teal-700"
              />
              {idFile && <p className="text-[10px] text-teal-600 font-semibold truncate">{idFile.name}</p>}
            </div>
          </div>

          {/* Summary Preview Card */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 text-xs space-y-2">
            <h4 className="font-bold text-slate-900 uppercase text-[11px] tracking-wider">Case Summary Review:</h4>
            <div className="grid grid-cols-2 gap-2 text-slate-700">
              <div>Accused: <strong>{formData.personDetails.fullName}</strong> ({formData.personDetails.age} yrs, {formData.personDetails.gender})</div>
              <div>FIR: <strong>{formData.firNumber}</strong> ({formData.policeStation} PS)</div>
              <div>Remand Date: <strong>{formData.remandDate}</strong></div>
              <div>Court: <strong>{formData.court}</strong></div>
              <div>Prior Convictions: <strong>{formData.priorConviction ? 'Yes' : 'None (First-time offender)'}</strong></div>
              <div>Other Cases Pending: <strong>{formData.otherPendingCases ? 'Yes' : 'No'}</strong></div>
            </div>
            <div className="pt-2 border-t border-slate-200 text-slate-600">
              Selected Offences: <strong>{selectedOffences.map((o) => `${o.section} (${o.title})`).join(', ')}</strong>
            </div>
          </div>

          <div className="flex justify-between pt-4">
            <button
              type="button"
              onClick={() => setStep(3)}
              className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center space-x-1"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <button
              type="button"
              disabled={submitting}
              onClick={handleCompleteWizard}
              className="px-6 py-2.5 rounded-lg bg-teal-500 hover:bg-teal-600 text-white font-bold text-xs flex items-center space-x-2 shadow-lg disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  <span>Executing Rule Engine...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Execute Bail Assessment</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CaseWizard;
