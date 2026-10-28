import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Plus,
  Search,
  History,
  Edit2,
  CheckCircle2,
  AlertTriangle,
  Scale
} from 'lucide-react';
import api from '../../api/client';
import { useToast } from '../../context/ToastContext';
import { ANTIL_CATEGORIES } from '../../config/constants';

export const OffenceRules = () => {
  const { addToast } = useToast();
  const [offences, setOffences] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [loading, setLoading] = useState(true);

  // Modals
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showVersionsModal, setShowVersionsModal] = useState(false);

  const [selectedOffence, setSelectedOffence] = useState(null);
  const [ruleForm, setRuleForm] = useState({
    section: '',
    act: 'Bharatiya Nyaya Sanhita, 2023',
    correspondingSection: '',
    title: '',
    description: '',
    maxSentenceYears: 3,
    bailable: false,
    punishableDeathOrLife: false,
    antilCategory: ANTIL_CATEGORIES.A,
    trialCourt: 'Magistrate Court',
    reason: ''
  });
  const [saving, setSaving] = useState(false);

  const fetchOffences = async () => {
    try {
      setLoading(true);
      const params = {};
      if (searchTerm) params.search = searchTerm;
      if (categoryFilter) params.antilCategory = categoryFilter;

      const { data } = await api.get('/admin/offences', { params });
      if (data?.success) {
        setOffences(data.offences || []);
      }
    } catch (err) {
      console.error('Failed to load offences:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOffences();
  }, [categoryFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchOffences();
  };

  const openEditModal = (off) => {
    setSelectedOffence(off);
    setRuleForm({
      section: off.section,
      act: off.act,
      correspondingSection: off.correspondingSection || '',
      title: off.title,
      description: off.description || '',
      maxSentenceYears: off.maxSentenceYears,
      bailable: off.bailable,
      punishableDeathOrLife: off.punishableDeathOrLife,
      antilCategory: off.antilCategory,
      trialCourt: off.trialCourt || 'Magistrate Court',
      reason: ''
    });
    setShowEditModal(true);
  };

  const openVersionsModal = (off) => {
    setSelectedOffence(off);
    setShowVersionsModal(true);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!ruleForm.reason || ruleForm.reason.trim().length < 3) {
      addToast({ type: 'warning', title: 'Reason Required', message: 'You must state why this rule version is being created.' });
      return;
    }

    setSaving(true);
    try {
      const { data } = await api.put(`/admin/offences/${selectedOffence._id}`, ruleForm);
      if (data?.success) {
        addToast({
          type: 'success',
          title: 'Rule Version Updated',
          message: data.message
        });
        setShowEditModal(false);
        fetchOffences();
      }
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Update Failed',
        message: err.response?.data?.message || 'Error updating offence rule.'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCreateRule = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const { data } = await api.post('/admin/offences', ruleForm);
      if (data?.success) {
        addToast({
          type: 'success',
          title: 'Offence Rule Created',
          message: 'Rule added with Version 1.'
        });
        setShowCreateModal(false);
        fetchOffences();
      }
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Creation Failed',
        message: err.response?.data?.message || 'Error creating offence rule.'
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Offence Database & Version Management</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Administer statutory penalties, bailable classifications, and Satender Kumar Antil (2022) guidelines with cryptographic version auditing.
          </p>
        </div>

        <button
          onClick={() => {
            setRuleForm({
              section: '',
              act: 'Bharatiya Nyaya Sanhita, 2023',
              correspondingSection: '',
              title: '',
              description: '',
              maxSentenceYears: 3,
              bailable: false,
              punishableDeathOrLife: false,
              antilCategory: ANTIL_CATEGORIES.A,
              trialCourt: 'Magistrate Court',
              reason: 'Initial creation'
            });
            setShowCreateModal(true);
          }}
          className="px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white rounded-xl text-xs font-semibold flex items-center space-x-1.5 shadow"
        >
          <Plus className="w-4 h-4" />
          <span>Add Offence Rule</span>
        </button>
      </div>

      {/* Search & Filter */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center gap-3">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by section (303, 318, 379), title, or act..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
          />
        </form>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="w-full sm:w-56 py-2 px-3 bg-slate-50 border border-slate-300 rounded-lg text-xs"
        >
          <option value="">All Antil Categories</option>
          {Object.values(ANTIL_CATEGORIES).map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      {/* Rules Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-xs text-slate-500">Loading offence rules catalogue...</p>
          </div>
        ) : offences.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500">
            No offence rules found matching criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Section & Act</th>
                  <th className="py-3 px-4">Offence Title</th>
                  <th className="py-3 px-4">Max Punishment</th>
                  <th className="py-3 px-4">Bail Classification</th>
                  <th className="py-3 px-4">Antil Category</th>
                  <th className="py-3 px-4">Version</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {offences.map((off) => (
                  <tr key={off._id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{off.section}</div>
                      <div className="text-[10px] text-slate-500">{off.act}</div>
                      {off.correspondingSection && (
                        <div className="text-[10px] text-slate-400">IPC Eq: {off.correspondingSection}</div>
                      )}
                    </td>

                    <td className="py-3.5 px-4 font-medium text-slate-900 max-w-xs">{off.title}</td>

                    <td className="py-3.5 px-4">
                      {off.punishableDeathOrLife ? (
                        <span className="font-bold text-rose-600">Death / Life</span>
                      ) : (
                        <span>{off.maxSentenceYears} Years</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          off.bailable
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}
                      >
                        {off.bailable ? 'Bailable' : 'Non-Bailable'}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="text-[10px] font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                        {off.antilCategory}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <button
                        onClick={() => openVersionsModal(off)}
                        className="inline-flex items-center space-x-1 font-bold text-teal-600 hover:text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200"
                        title="View Version History"
                      >
                        <History className="w-3 h-3" />
                        <span>v{off.currentVersion || 1}</span>
                      </button>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => openEditModal(off)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded text-xs inline-flex items-center space-x-1"
                      >
                        <Edit2 className="w-3 h-3" />
                        <span>Edit Rule</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Rule Modal */}
      {showEditModal && selectedOffence && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white max-w-lg w-full rounded-2xl shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-900">
                Update Rule: {selectedOffence.section} (v{selectedOffence.currentVersion} &rarr; v
                {(selectedOffence.currentVersion || 1) + 1})
              </h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Section Citation</label>
                <input
                  type="text"
                  value={ruleForm.section}
                  onChange={(e) => setRuleForm({ ...ruleForm, section: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Offence Title</label>
                <input
                  type="text"
                  value={ruleForm.title}
                  onChange={(e) => setRuleForm({ ...ruleForm, title: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Max Sentence (Years)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={ruleForm.maxSentenceYears}
                    onChange={(e) =>
                      setRuleForm({ ...ruleForm, maxSentenceYears: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Antil Category</label>
                  <select
                    value={ruleForm.antilCategory}
                    onChange={(e) => setRuleForm({ ...ruleForm, antilCategory: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                  >
                    {Object.values(ANTIL_CATEGORIES).map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center space-x-6 py-2">
                <label className="flex items-center space-x-2 font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    checked={ruleForm.bailable}
                    onChange={(e) => setRuleForm({ ...ruleForm, bailable: e.target.checked })}
                    className="w-4 h-4 text-teal-600 rounded"
                  />
                  <span>Bailable Offence</span>
                </label>

                <label className="flex items-center space-x-2 font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    checked={ruleForm.punishableDeathOrLife}
                    onChange={(e) =>
                      setRuleForm({ ...ruleForm, punishableDeathOrLife: e.target.checked })
                    }
                    className="w-4 h-4 text-rose-600 rounded"
                  />
                  <span>Punishable with Death / Life</span>
                </label>
              </div>

              {/* Mandatory Reason for Version Audit */}
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 space-y-1">
                <label className="block font-bold text-amber-950">
                  Reason for Version Change (Mandatory Audit Requirement) *
                </label>
                <textarea
                  rows={2}
                  required
                  value={ruleForm.reason}
                  onChange={(e) => setRuleForm({ ...ruleForm, reason: e.target.value })}
                  placeholder="e.g. Updated based on High Court interpretation regarding sentencing threshold"
                  className="w-full px-3 py-2 bg-white border border-amber-300 rounded-lg"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-teal-500 hover:bg-teal-600 text-white rounded-lg font-bold shadow disabled:opacity-50"
                >
                  {saving ? 'Creating Version...' : 'Save New Version'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Version History Modal */}
      {showVersionsModal && selectedOffence && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white max-w-xl w-full rounded-2xl shadow-2xl p-6 space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <History className="w-5 h-5 text-teal-600" />
                <h3 className="font-bold text-base text-slate-900">
                  Version History: {selectedOffence.section}
                </h3>
              </div>
              <button
                onClick={() => setShowVersionsModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Audit trail of every modification to this rule used by the calculation engine.
            </p>

            <div className="overflow-y-auto space-y-2 flex-1 pr-1">
              {selectedOffence.versions?.map((ver, idx) => (
                <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-900">Version {ver.versionNumber}</span>
                    <span className="text-[10px] text-slate-400">
                      Effective: {new Date(ver.effectiveFrom).toLocaleDateString('en-IN')}
                    </span>
                  </div>
                  <p className="text-slate-700 font-medium">
                    {ver.title} &bull; Max Sentence: {ver.maxSentenceYears} yrs &bull; {ver.bailable ? 'Bailable' : 'Non-bailable'} &bull; {ver.antilCategory}
                  </p>
                  <p className="text-slate-500 italic text-[11px]">Reason: "{ver.reason || 'N/A'}"</p>
                </div>
              ))}
            </div>

            <div className="pt-2 text-right">
              <button
                onClick={() => setShowVersionsModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg"
              >
                Close History
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OffenceRules;
