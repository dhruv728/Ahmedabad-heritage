import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import {
  ShieldCheck,
  Upload,
  AlertCircle,
  CheckCircle2,
  Loader2,
  LogOut,
  FileText
} from 'lucide-react';

export default function HostVerificationPending() {
  const { user, setUser, logout } = useAuth();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isFetchingLive, setIsFetchingLive] = useState<boolean>(true);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  // Requirement 1: Dynamic User Fetching on Mount
  useEffect(() => {
    const fetchLiveUserStatus = async () => {
      if (!user?.id) return;
      setIsFetchingLive(true);
      try {
        const token = localStorage.getItem('access_token');
        const headers: Record<string, string> = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const res = await axios.get(`http://127.0.0.1:8000/api/v1/users/me/?id=${user.id}`, { headers });
        if (res.data) {
          const freshData = res.data;
          const updatedUser = {
            ...user,
            is_verified: Boolean(freshData.is_verified),
            is_id_verified: Boolean(freshData.is_id_verified),
            verification_status: freshData.verification_status || (freshData.is_verified ? 'VERIFIED' : 'PENDING_VERIFICATION'),
            id_document_url: freshData.id_document_url || user.id_document_url,
            resubmitted_at: freshData.resubmitted_at || user.resubmitted_at,
          };
          setUser(updatedUser);
          localStorage.setItem('user_profile', JSON.stringify(updatedUser));
        }
      } catch (err) {
        console.warn('Could not fetch live user status on mount');
      } finally {
        setIsFetchingLive(false);
      }
    };

    fetchLiveUserStatus();
  }, [user?.id]);

  const rawStatus = (user?.verification_status || (user?.is_verified ? 'VERIFIED' : 'PENDING_VERIFICATION')).toUpperCase();
  const isReverification = rawStatus === 'REVERIFICATION_REQUIRED';
  const isRejected = rawStatus === 'REJECTED' || rawStatus === 'REJECTED_BY_ADMIN';
  const isPending = !isReverification && !isRejected;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  // Requirement 3: Upload Handler Implementation
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;
    if (!selectedFile) {
      setErrorNotice('Please select a valid Govt ID / Aadhaar file before submitting.');
      return;
    }

    setIsSubmitting(true);
    setErrorNotice(null);
    setSuccessNotice(null);

    try {
      const token = localStorage.getItem('access_token');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const docName = selectedFile.name;

      // Call endpoint to resubmit document
      await axios.patch(
        `http://127.0.0.1:8000/api/v1/users/${user.id}/submit_reverification/`,
        { id_document_url: docName },
        { headers }
      );

      const updatedUser = {
        ...user,
        is_verified: false,
        is_id_verified: false,
        verification_status: 'PENDING_VERIFICATION',
        id_document_url: docName,
      };
      setUser(updatedUser);
      localStorage.setItem('user_profile', JSON.stringify(updatedUser));
      setSelectedFile(null);
      setSuccessNotice('Fresh document uploaded successfully! Pending Admin review.');
    } catch {
      setErrorNotice('Failed to upload document. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-stone-800 font-sans flex flex-col selection:bg-[#B84A22] selection:text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#FAF8F5]/90 backdrop-blur-md border-b border-stone-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <span className="text-2xl sm:text-3xl font-bold font-serif tracking-tight text-[#1E5A5B]">
              Amdavad Heritage
            </span>
          </Link>

          <div className="flex items-center gap-4">
            {/* Status Badge */}
            <span
              className={`text-xs font-semibold px-3 py-1 rounded-full border ${
                isRejected
                  ? 'bg-rose-100 text-rose-800 border-rose-300'
                  : isReverification
                  ? 'bg-amber-100 text-amber-900 border-amber-300'
                  : 'bg-amber-100 text-amber-800 border-amber-300'
              }`}
            >
              {isRejected ? 'REJECTED_BY_ADMIN' : isReverification ? 'REVERIFICATION_REQUIRED' : 'PENDING_VERIFICATION'}
            </span>

            <button
              onClick={logout}
              className="text-xs font-bold text-stone-600 hover:text-[#B84A22] flex items-center gap-1.5 bg-white border border-stone-200 px-3 py-1.5 rounded-full shadow-sm"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-3xl mx-auto px-4 py-12 w-full space-y-8">
        
        {/* Success Alert */}
        {successNotice && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-sm font-semibold flex items-center gap-3 shadow-md animate-fade-in">
            <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />
            <span>{successNotice}</span>
          </div>
        )}

        {/* Error Alert */}
        {errorNotice && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-300 text-rose-900 text-sm font-semibold flex items-center gap-3 shadow-md animate-fade-in">
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
            <span>{errorNotice}</span>
          </div>
        )}

        {/* Verification Modal Card */}
        <div className="bg-white rounded-3xl p-8 sm:p-10 border border-stone-200/80 shadow-xl space-y-6">
          
          {/* Card Icon */}
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto shadow-sm transition-all"
            style={{
              backgroundColor: isRejected ? '#FFE4E6' : '#FEF3C7',
              color: isRejected ? '#BE123C' : '#B45309',
            }}
          >
            {isRejected ? <AlertCircle className="w-8 h-8" /> : <ShieldCheck className="w-8 h-8" />}
          </div>

          {/* Heading & Description for 3 Distinct States */}
          <div className="space-y-3 text-center max-w-lg mx-auto">
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${
                isRejected
                  ? 'bg-rose-50 text-rose-800 border-rose-200'
                  : isReverification
                  ? 'bg-amber-50 text-amber-900 border-amber-200'
                  : 'bg-amber-50 text-amber-800 border-amber-200'
              }`}
            >
              {isRejected ? 'REJECTED_BY_ADMIN' : isReverification ? 'REVERIFICATION_REQUIRED' : 'PENDING_VERIFICATION'}
            </span>

            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900">
              {isReverification
                ? 'Re-verification Requested by Admin'
                : isRejected
                ? 'Verification Rejected by Admin'
                : 'Host Verification Required'}
            </h1>

            <p className="text-sm text-stone-600 leading-relaxed font-medium">
              {isReverification
                ? 'Admin has requested an updated document verification. Please upload your fresh Govt ID / Aadhaar below.'
                : isRejected
                ? 'Your previous document was rejected. Please re-upload a clear and valid document to request review again.'
                : 'Your host account is currently under review by Admin. You will gain portal access once verified.'}
            </p>
          </div>

          {/* User Profile Summary */}
          <div className="bg-stone-50 rounded-2xl p-5 border border-stone-200 text-left space-y-3 max-w-md mx-auto text-xs">
            <div className="flex items-center justify-between border-b border-stone-200 pb-2">
              <span className="text-stone-500 font-semibold">Applicant Name:</span>
              <span className="font-bold text-stone-800">{user?.full_name || 'Host Applicant'}</span>
            </div>
            <div className="flex items-center justify-between border-b border-stone-200 pb-2">
              <span className="text-stone-500 font-semibold">Email Address:</span>
              <span className="font-bold text-stone-800">{user?.email}</span>
            </div>
            <div className="flex items-center justify-between border-b border-stone-200 pb-2">
              <span className="text-stone-500 font-semibold">Submitted Document:</span>
              <span className="font-mono text-[#1E5A5B] font-semibold truncate max-w-[200px]">
                {user?.id_document_url || 'Govt_ID_Verification.pdf'}
              </span>
            </div>
            <div className="flex items-center justify-between pt-1">
              <span className="text-stone-500 font-semibold">Current Status:</span>
              <span
                className={`font-bold px-2.5 py-0.5 rounded-full ${
                  isRejected
                    ? 'bg-rose-100 text-rose-800'
                    : isReverification
                    ? 'bg-amber-100 text-amber-900'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {isRejected ? 'REJECTED_BY_ADMIN' : isReverification ? 'REVERIFICATION_REQUIRED' : 'PENDING_VERIFICATION'}
              </span>
            </div>
          </div>

          {/* Interactive File Upload Component (Rendered ONLY in State A & State B, NOT in State C) */}
          {(isReverification || isRejected) && (
            <form onSubmit={handleSubmit} className="space-y-5 max-w-md mx-auto text-left pt-2">
              <div className="space-y-2">
                <label className="block text-xs font-bold text-stone-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Upload className="w-4 h-4 text-[#1E5A5B]" />
                  <span>Select Govt ID / Aadhaar Document (.pdf, .jpg, .jpeg, .png)</span>
                </label>

                <div className="relative border-2 border-dashed border-stone-300 hover:border-[#1E5A5B] bg-stone-50/80 rounded-2xl p-5 text-center transition cursor-pointer">
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <div className="space-y-1">
                    <FileText className="w-8 h-8 text-[#1E5A5B] mx-auto" />
                    <p className="text-xs font-semibold text-stone-700">
                      {selectedFile ? selectedFile.name : 'Click or Drag & Drop File Here'}
                    </p>
                    <p className="text-[11px] text-stone-400">
                      Supports PDF, PNG, JPG (Max 10MB)
                    </p>
                  </div>
                </div>

                {selectedFile && (
                  <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-between">
                    <span className="truncate max-w-[280px]">Selected: {selectedFile.name}</span>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  </div>
                )}
              </div>

              {/* Requirement 2 & 3: Green "Upload & Resubmit Document" Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 rounded-full bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white text-xs font-bold shadow-md flex items-center justify-center gap-2 transition hover:scale-105 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Uploading & Resubmitting...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    <span>Upload & Resubmit Document</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* Footer Action Buttons (State C renders Sign Out button only) */}
          <div className="pt-2 flex items-center justify-center">
            <button
              onClick={logout}
              className="w-full sm:w-auto px-8 py-3 rounded-full border border-stone-300 text-stone-700 hover:bg-stone-50 text-xs font-semibold transition"
            >
              Sign Out
            </button>
          </div>

        </div>
      </main>
    </div>
  );
}
