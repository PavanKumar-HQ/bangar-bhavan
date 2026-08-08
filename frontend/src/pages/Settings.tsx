import React, { useState, useEffect } from 'react';
import { ShopSettings } from '../types';
import { api } from '../lib/api';
import { usePrinter } from '../context/PrinterContext';
import { getShopSettingsLocal, saveShopSettingsLocal } from '../lib/db';
import {
  Printer,
  Store,
  Database,
  Archive as ArchiveIcon,
  Save,
  Download,
  RefreshCw,
  CheckCircle,
  FileText
} from 'lucide-react';
import { sound } from '../lib/sound';

export const Settings: React.FC = () => {
  const { isConnected, deviceName, connectPrinter, disconnectPrinter, testPrint } = usePrinter();

  const [settings, setSettings] = useState<ShopSettings>({
    id: '',
    tenantId: '',
    shopName: 'Bangar Bhavan Chats',
    address: 'Near Central Bus Stand, Bengaluru',
    phone: '+91 98765 43210',
    footerText: 'Authentic Taste • Quality Guaranteed! Visit Again!',
    parcelCharge: 5.0,
    currency: '₹'
  });

  const [archives, setArchives] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [archiveMsg, setArchiveMsg] = useState<string>('');

  const loadData = async () => {
    setIsLoading(true);
    try {
      if (navigator.onLine) {
        const [settingsRes, archivesRes] = await Promise.all([
          api.get('/settings'),
          api.get('/archive')
        ]);
        if (settingsRes?.data) {
          setSettings(settingsRes.data);
          saveShopSettingsLocal(settingsRes.data);
        }
        if (Array.isArray(archivesRes?.data)) setArchives(archivesRes.data);
      } else {
        setSettings(getShopSettingsLocal());
      }
    } catch (err) {
      console.warn('Failed to load settings from server, loading local settings:', err);
      setSettings(getShopSettingsLocal());
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      saveShopSettingsLocal(settings);
      if (navigator.onLine) {
        const res = await api.put('/settings', settings);
        if (res?.data) setSettings(res.data);
      }
      sound.playSuccess();
      alert('Shop settings updated successfully!');
    } catch (err) {
      saveShopSettingsLocal(settings);
      sound.playSuccess();
      alert('Shop settings updated successfully!');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTriggerArchive = async () => {
    if (!window.confirm('Trigger auto-archiving for orders older than 30 days?')) return;
    try {
      const res = await api.post('/archive/trigger');
      sound.playSuccess();
      setArchiveMsg(`Archived ${res.data.archivedCount} orders (${res.data.periodLabel})`);
      loadData();
    } catch (err) {
      alert('Failed to trigger archive');
    }
  };

  const handleRestoreArchive = async (archiveId: string) => {
    if (!window.confirm('Restore this archived period back to live billing history?')) return;
    try {
      const res = await api.post(`/archive/${archiveId}/restore`);
      sound.playSuccess();
      alert(res.data.message);
      loadData();
    } catch (err) {
      alert('Failed to restore archive');
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6 pb-20">
      {/* Header */}
      <div className="bg-white p-4 rounded-xl border border-cream-300 shadow-sm">
        <h1 className="font-display font-black text-xl text-darkbrown-900">System & Shop Settings</h1>
        <p className="text-xs text-darkbrown-600">Bluetooth receipt printer, receipt footer, parcel fees, and database archiving</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* 1. Bluetooth Thermal Printer Setup */}
        <div className="bg-white p-5 rounded-xl border-2 border-cream-300 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-cream-200">
            <Printer className="w-5 h-5 text-deepred-800" />
            <h2 className="font-display font-extrabold text-base text-darkbrown-900">
              Bluetooth ESC/POS Printer
            </h2>
          </div>

          <div className="bg-cream-50 p-4 rounded-xl border border-cream-300 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-darkbrown-700">Connection Status:</span>
              <span
                className={`px-3 py-1 rounded-full text-xs font-black ${
                  isConnected ? 'bg-successgreen-800 text-white' : 'bg-deepred-800 text-white'
                }`}
              >
                {isConnected ? 'CONNECTED' : 'DISCONNECTED'}
              </span>
            </div>

            {deviceName && (
              <p className="text-xs font-bold text-darkbrown-900">
                Connected Device: <span className="text-deepred-800 font-mono">{deviceName}</span>
              </p>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
              {!isConnected ? (
                <button
                  type="button"
                  onClick={() => connectPrinter()}
                  className="py-2.5 px-4 rounded-xl bg-deepred-800 hover:bg-deepred-900 text-cream-50 font-black text-xs flex items-center justify-center gap-2 shadow"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Connect Printer</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={disconnectPrinter}
                  className="py-2.5 px-4 rounded-xl bg-cream-200 hover:bg-cream-300 text-darkbrown-900 font-black text-xs flex items-center justify-center gap-2"
                >
                  <span>Disconnect</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => testPrint(settings)}
                disabled={!isConnected}
                className="py-2.5 px-4 rounded-xl bg-softyellow-200 hover:bg-softyellow-300 text-darkbrown-900 font-black text-xs flex items-center justify-center gap-2 disabled:opacity-40 border border-softyellow-400"
              >
                <FileText className="w-4 h-4" />
                <span>Test Print Receipt</span>
              </button>
            </div>
          </div>
        </div>

        {/* 2. Shop & Receipt Details Form */}
        <div className="bg-white p-5 rounded-xl border-2 border-cream-300 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-cream-200">
            <Store className="w-5 h-5 text-deepred-800" />
            <h2 className="font-display font-extrabold text-base text-darkbrown-900">
              Shop Receipt Details
            </h2>
          </div>

          <form onSubmit={handleSaveSettings} className="space-y-3 text-xs font-bold">
            <div>
              <label className="block mb-1 text-darkbrown-700">Shop Name</label>
              <input
                type="text"
                required
                value={settings.shopName}
                onChange={(e) => setSettings({ ...settings, shopName: e.target.value })}
                className="w-full p-2.5 bg-cream-50 border-2 border-cream-300 rounded-xl text-darkbrown-900 font-semibold focus:outline-none focus:border-deepred-700"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block mb-1 text-darkbrown-700">Phone</label>
                <input
                  type="text"
                  required
                  value={settings.phone}
                  onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                  className="w-full p-2.5 bg-cream-50 border-2 border-cream-300 rounded-xl text-darkbrown-900 font-semibold focus:outline-none focus:border-deepred-700"
                />
              </div>

              <div>
                <label className="block mb-1 text-darkbrown-700">Parcel Fee (₹)</label>
                <input
                  type="number"
                  required
                  step="1"
                  value={settings.parcelCharge}
                  onChange={(e) => setSettings({ ...settings, parcelCharge: parseFloat(e.target.value) })}
                  className="w-full p-2.5 bg-cream-50 border-2 border-cream-300 rounded-xl text-darkbrown-900 font-semibold focus:outline-none focus:border-deepred-700"
                />
              </div>
            </div>

            <div>
              <label className="block mb-1 text-darkbrown-700">Address</label>
              <input
                type="text"
                required
                value={settings.address}
                onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                className="w-full p-2.5 bg-cream-50 border-2 border-cream-300 rounded-xl text-darkbrown-900 font-semibold focus:outline-none focus:border-deepred-700"
              />
            </div>

            <div>
              <label className="block mb-1 text-darkbrown-700">Receipt Footer Text</label>
              <input
                type="text"
                required
                value={settings.footerText}
                onChange={(e) => setSettings({ ...settings, footerText: e.target.value })}
                className="w-full p-2.5 bg-cream-50 border-2 border-cream-300 rounded-xl text-darkbrown-900 font-semibold focus:outline-none focus:border-deepred-700"
              />
            </div>

            <button
              type="submit"
              disabled={isSaving}
              className="w-full py-3 rounded-xl bg-deepred-800 hover:bg-deepred-900 text-cream-50 font-black text-xs uppercase tracking-wider shadow flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Saving...' : 'Save Receipt Settings'}</span>
            </button>
          </form>
        </div>
      </div>

      {/* 3. Database Auto Archiving & Backups */}
      <div className="bg-white p-5 rounded-xl border-2 border-cream-300 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-cream-200">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-deepred-800" />
            <h2 className="font-display font-extrabold text-base text-darkbrown-900">
              Data Auto-Archiving (&gt;30 Days)
            </h2>
          </div>

          <button
            onClick={handleTriggerArchive}
            className="px-4 py-2 rounded-xl bg-darkbrown-900 hover:bg-black text-softyellow-200 font-black text-xs flex items-center gap-1.5 shadow"
          >
            <ArchiveIcon className="w-4 h-4" />
            <span>Run Auto-Archive Now</span>
          </button>
        </div>

        {archiveMsg && (
          <div className="p-3 bg-softyellow-100 border border-softyellow-300 text-xs font-bold text-darkbrown-900 rounded-lg">
            {archiveMsg}
          </div>
        )}

        <div className="space-y-2">
          <h3 className="text-xs font-black uppercase text-darkbrown-600">Saved Archives</h3>
          {archives.length === 0 ? (
            <p className="text-xs font-medium text-darkbrown-500 italic">No archived historical periods yet.</p>
          ) : (
            <div className="divide-y divide-cream-200 border border-cream-300 rounded-xl overflow-hidden">
              {archives.map((a) => (
                <div key={a.id} className="p-3 bg-cream-50 flex items-center justify-between text-xs font-bold">
                  <div>
                    <span className="font-mono text-deepred-800 text-sm">{a.periodLabel}</span>
                    <span className="text-darkbrown-600 ml-2">({a.orderCount} orders, ₹{a.totalAmount})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <a
                      href={`/api/v1/archive/${a.id}/export?format=csv`}
                      className="px-3 py-1 bg-cream-200 hover:bg-cream-300 text-darkbrown-900 rounded font-black text-[10px] flex items-center gap-1"
                    >
                      <Download className="w-3 h-3" />
                      CSV
                    </a>
                    <a
                      href={`/api/v1/archive/${a.id}/export?format=json`}
                      className="px-3 py-1 bg-cream-200 hover:bg-cream-300 text-darkbrown-900 rounded font-black text-[10px] flex items-center gap-1"
                    >
                      <Download className="w-3 h-3" />
                      JSON
                    </a>
                    <button
                      onClick={() => handleRestoreArchive(a.id)}
                      className="px-3 py-1 bg-successgreen-800 hover:bg-successgreen-700 text-white rounded font-black text-[10px]"
                    >
                      Restore
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
