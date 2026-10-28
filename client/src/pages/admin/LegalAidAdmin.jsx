import React, { useState, useEffect } from 'react';
import {
  PhoneCall,
  Plus,
  Edit2,
  Trash2,
  Search,
  CheckCircle2,
  ExternalLink,
  MapPin,
  Mail
} from 'lucide-react';
import api from '../../api/client';
import { useToast } from '../../context/ToastContext';

export const LegalAidAdmin = () => {
  const { addToast } = useToast();
  const [contacts, setContacts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [contactForm, setContactForm] = useState({
    district: 'Chennai',
    officeName: '',
    address: '',
    phone: '',
    email: '',
    secretaryName: '',
    sourceUrl: 'https://slsa.tn.gov.in',
    verificationDate: new Date().toISOString().split('T')[0]
  });
  const [saving, setSaving] = useState(false);

  const fetchContacts = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/admin/legal-aid', {
        params: { search: searchTerm }
      });
      if (data?.success) {
        setContacts(data.contacts || []);
      }
    } catch (err) {
      console.error('Failed to load legal aid admin:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, []);

  const openCreateModal = () => {
    setEditingId(null);
    setContactForm({
      district: 'Chennai',
      officeName: '',
      address: '',
      phone: '',
      email: '',
      secretaryName: '',
      sourceUrl: 'https://slsa.tn.gov.in',
      verificationDate: new Date().toISOString().split('T')[0]
    });
    setShowModal(true);
  };

  const openEditModal = (contact) => {
    setEditingId(contact._id);
    setContactForm({
      district: contact.district,
      officeName: contact.officeName,
      address: contact.address,
      phone: contact.phone,
      email: contact.email,
      secretaryName: contact.secretaryName || '',
      sourceUrl: contact.sourceUrl,
      verificationDate: new Date(contact.verificationDate).toISOString().split('T')[0]
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Archive this legal aid authority contact?')) return;
    try {
      await api.delete(`/admin/legal-aid/${id}`);
      addToast({ type: 'info', title: 'Archived', message: 'Contact record archived.' });
      fetchContacts();
    } catch (err) {
      addToast({ type: 'error', title: 'Error', message: 'Failed to archive contact.' });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingId) {
        await api.put(`/admin/legal-aid/${editingId}`, contactForm);
        addToast({ type: 'success', title: 'Updated', message: 'Contact updated successfully.' });
      } else {
        await api.post('/admin/legal-aid', contactForm);
        addToast({ type: 'success', title: 'Created', message: 'Contact created successfully.' });
      }
      setShowModal(false);
      fetchContacts();
    } catch (err) {
      addToast({ type: 'error', title: 'Error', message: 'Failed to save contact.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Legal Aid Directory Administration</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Administer Tamil Nadu DLSA contact details, phone numbers, and source verifications.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white rounded-xl text-xs font-semibold flex items-center space-x-1.5 shadow"
        >
          <Plus className="w-4 h-4" />
          <span>Add DLSA Contact</span>
        </button>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between gap-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchContacts()}
            placeholder="Search by district or court name..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
          />
        </div>
        <button
          onClick={fetchContacts}
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
        >
          Search
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-xs text-slate-500">Loading contacts...</p>
          </div>
        ) : contacts.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500">No legal aid contacts found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">District</th>
                  <th className="py-3 px-4">Office Name</th>
                  <th className="py-3 px-4">Contact Info</th>
                  <th className="py-3 px-4">Verified Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {contacts.map((c) => (
                  <tr key={c._id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900">{c.district}</td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900">{c.officeName}</div>
                      <p className="text-[11px] text-slate-400 truncate max-w-xs">{c.address}</p>
                    </td>
                    <td className="py-3.5 px-4 text-[11px]">
                      <div>{c.phone}</div>
                      <div className="text-teal-600">{c.email}</div>
                    </td>
                    <td className="py-3.5 px-4 text-[11px] text-slate-500">
                      {new Date(c.verificationDate).toLocaleDateString('en-IN', {
                        month: 'short',
                        year: 'numeric'
                      })}
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      <button
                        onClick={() => openEditModal(c)}
                        className="p-1 text-slate-600 hover:text-teal-600"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(c._id)}
                        className="p-1 text-slate-400 hover:text-rose-600"
                        title="Archive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-900">
                {editingId ? 'Edit DLSA Authority' : 'Add New DLSA Authority'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">District *</label>
                <input
                  type="text"
                  required
                  value={contactForm.district}
                  onChange={(e) => setContactForm({ ...contactForm, district: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Office Name *</label>
                <input
                  type="text"
                  required
                  value={contactForm.officeName}
                  onChange={(e) => setContactForm({ ...contactForm, officeName: e.target.value })}
                  placeholder="e.g. District Legal Services Authority, Tirunelveli"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Address *</label>
                <textarea
                  rows={2}
                  required
                  value={contactForm.address}
                  onChange={(e) => setContactForm({ ...contactForm, address: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Phone *</label>
                  <input
                    type="text"
                    required
                    value={contactForm.phone}
                    onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Email *</label>
                  <input
                    type="email"
                    required
                    value={contactForm.email}
                    onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Source Verification Link *</label>
                <input
                  type="url"
                  required
                  value={contactForm.sourceUrl}
                  onChange={(e) => setContactForm({ ...contactForm, sourceUrl: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-teal-500 hover:bg-teal-600 text-white rounded-lg font-bold shadow disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Contact'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LegalAidAdmin;
