import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  PhoneCall,
  Mail,
  MapPin,
  ExternalLink,
  ShieldCheck,
  Search,
  Building,
  Filter,
  CheckCircle2
} from 'lucide-react';
import api from '../../api/client';

export const LegalAidDirectory = () => {
  const { t } = useTranslation();
  const [contacts, setContacts] = useState([]);
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchContacts = async () => {
    try {
      setLoading(true);
      const params = {};
      if (selectedDistrict) params.district = selectedDistrict;
      if (searchTerm) params.search = searchTerm;

      const { data } = await api.get('/legal-aid', { params });
      if (data?.success) {
        setContacts(data.contacts || []);
      }
    } catch (err) {
      console.error('Failed to load legal aid directory:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, [selectedDistrict]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchContacts();
  };

  const districtsList = [
    'Chennai',
    'Coimbatore',
    'Madurai',
    'Tiruchirappalli',
    'Salem',
    'Tirunelveli',
    'Vellore',
    'State Authority (TNSLSA)'
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Banner */}
      <div className="bg-gradient-to-r from-navy-900 to-navy-800 rounded-2xl p-6 text-white shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-teal-400 bg-navy-950/60 px-2.5 py-1 rounded-md mb-2 inline-block">
            Article 39A Free Legal Services
          </span>
          <h1 className="text-2xl font-bold tracking-tight">Tamil Nadu Legal Aid Directory (DLSA)</h1>
          <p className="text-xs text-slate-300 mt-1 max-w-xl">
            Official contact points for District Legal Services Authorities (DLSA) and State Authority (TNSLSA). Undertrials without counsel are entitled to free, appointed legal defense.
          </p>
        </div>

        {/* National Helpline Callout */}
        <div className="bg-teal-500/20 border border-teal-400/30 p-3 rounded-xl flex items-center space-x-3 flex-shrink-0">
          <PhoneCall className="w-6 h-6 text-teal-400 animate-pulse" />
          <div>
            <span className="text-[10px] text-teal-300 font-semibold block uppercase">NALSA National Toll-Free</span>
            <a href="tel:15100" className="text-base font-bold text-white hover:underline">
              15100
            </a>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center gap-3">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by district, office name, or court address..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:bg-white"
          />
        </form>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400 flex-shrink-0" />
          <select
            value={selectedDistrict}
            onChange={(e) => setSelectedDistrict(e.target.value)}
            className="w-full sm:w-48 py-2 px-3 bg-slate-50 border border-slate-300 rounded-lg text-xs"
          >
            <option value="">All Districts (Tamil Nadu)</option>
            {districtsList.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Contacts Grid */}
      {loading ? (
        <div className="p-12 text-center">
          <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-xs text-slate-500">Loading verified DLSA directory...</p>
        </div>
      ) : contacts.length === 0 ? (
        <div className="p-12 bg-white rounded-2xl border border-slate-200 text-center text-xs text-slate-500">
          No legal aid authority found matching your filter criteria.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {contacts.map((contact) => (
            <div
              key={contact._id}
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-slate-300 transition-all flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                    {contact.district}
                  </span>
                  <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 flex items-center space-x-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <span>Verified: {new Date(contact.verificationDate).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}</span>
                  </span>
                </div>

                <h3 className="font-bold text-sm text-slate-900 leading-snug">{contact.officeName}</h3>
                {contact.secretaryName && (
                  <p className="text-xs text-teal-700 font-medium mt-0.5">{contact.secretaryName}</p>
                )}

                <div className="mt-3 space-y-2 text-xs text-slate-600">
                  <div className="flex items-start space-x-2">
                    <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                    <span className="leading-relaxed">{contact.address}</span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <PhoneCall className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    <a
                      href={`tel:${contact.phone.split('/')[0].trim()}`}
                      className="text-slate-800 font-semibold hover:text-teal-600"
                    >
                      {contact.phone}
                    </a>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Mail className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    <a
                      href={`mailto:${contact.email}`}
                      className="text-teal-600 hover:underline truncate"
                    >
                      {contact.email}
                    </a>
                  </div>
                </div>
              </div>

              {/* Source Link */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
                <span className="text-slate-400">Public Authority Directory:</span>
                <a
                  href={contact.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="font-semibold text-teal-600 hover:text-teal-700 flex items-center space-x-1"
                >
                  <span>eCourts / SLSA Portal</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LegalAidDirectory;
