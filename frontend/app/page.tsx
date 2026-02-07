"use client";

import { useState, useEffect } from "react";
import MatrixBackground from "@/components/MatrixBackground";

type GuidanceResponse = {
  queryId: string;
  guidance: {
    summary: string;
    suggestedSteps: string[];
    contacts: Array<{
      type: string;
      value: string;
      city?: string;
      purpose?: string;
      priority?: number;
    }>;
    expectations: string;
    legalRights: string;
    confidenceLevel: string;
    similarCases: number;
    severity: string;
  };
};

export default function HomePage() {
  // Dark mode state
  const [darkMode, setDarkMode] = useState(false);
  const [mounted, setMounted] = useState(false);

  const [formData, setFormData] = useState({
    brand: "",
    product: "",
    issue: "",
    city: "",
    state: "",
  });

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GuidanceResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Initialize dark mode from localStorage after mount
  useEffect(() => {
    setMounted(true);
    const savedMode = localStorage.getItem("darkMode");
    if (savedMode !== null) {
      setDarkMode(savedMode === "true");
    }
  }, []);

  // Apply dark mode class to html element
  useEffect(() => {
    if (!mounted) return;
    
    const html = document.documentElement;
    if (darkMode) {
      html.classList.add("dark");
    } else {
      html.classList.remove("dark");
    }
    
    // Save to localStorage
    localStorage.setItem("darkMode", String(darkMode));
  }, [darkMode, mounted]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const apiUrl =
        process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";
      const response = await fetch(`${apiUrl}/api/user/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to get guidance");
      }

      setResult(data);
    } catch (err) {
      const error = err as Error;
      setError(error.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({ brand: "", product: "", issue: "", city: "", state: "" });
    setResult(null);
    setError(null);
  };

  return (
    <>
      <MatrixBackground />
      <main className="relative min-h-screen p-6 transition-colors duration-300">
        <div className="max-w-4xl mx-auto">
          {/* Dark Mode Toggle - Top Right */}
          <div className="flex justify-end mb-4">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="relative w-14 h-7 rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2"
              style={{
                backgroundColor: darkMode ? '#374151' : '#D1D5DB',
                boxShadow: darkMode ? '0 2px 8px rgba(0,0,0,0.3)' : '0 2px 4px rgba(0,0,0,0.1)'
              }}
              aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              <span
                className="absolute top-0.5 w-6 h-6 bg-white rounded-full shadow-md transition-all duration-300 flex items-center justify-center"
                style={{
                  left: darkMode ? 'calc(100% - 26px)' : '2px'
                }}
              >
                {darkMode ? (
                  // Modern Moon icon - crescent
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <path 
                      d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" 
                      fill="#475569" 
                      stroke="#475569" 
                      strokeWidth="1.5"
                      strokeLinecap="round" 
                      strokeLinejoin="round"
                    />
                  </svg>
                ) : (
                  // Modern Sun icon - circle with rays
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="4" fill="#F59E0B" />
                    <path 
                      d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32l1.41 1.41M2 12h2m16 0h2M4.93 19.07l1.41-1.41m11.32-11.32l1.41-1.41" 
                      stroke="#F59E0B" 
                      strokeWidth="2" 
                      strokeLinecap="round"
                    />
                  </svg>
                )}
              </span>
            </button>
          </div>

          {/* Header with Split ConsuMaarg */}
          <header className="text-center mb-10 pt-2">
            <h1 className="text-5xl font-bold mb-3">
              <span className="transition-colors duration-300" style={{ color: 'var(--text-primary)' }}>Consu</span>
              <span style={{ color: 'var(--accent-primary)' }}>Maarg</span>
            </h1>
            <p className="text-lg transition-colors duration-300" style={{ color: 'var(--text-secondary)' }}>
              After-Sales Intelligence for Indian Consumers
            </p>
            <div className="inline-block mt-2 px-4 py-1 rounded-full text-sm font-medium transition-colors duration-300" style={{ backgroundColor: darkMode ? '#7C2D12' : '#FFDDD4', color: darkMode ? '#FED7AA' : '#B02E0E' }}>
              Alpha-2 · AI-Powered
            </div>
          </header>

        {/* Form */}
        {!result && (
          <div className="rounded-2xl shadow-xl p-8 mb-8 border transition-all duration-300" style={{ backgroundColor: 'var(--bg-form)', borderColor: 'var(--border-color)' }}>
            <h2 className="text-2xl font-semibold mb-6 transition-colors duration-300" style={{ color: 'var(--text-primary)' }}>
              Describe Your Issue
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium mb-2 transition-colors duration-300" style={{ color: 'var(--text-secondary)' }}>
                    Brand Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    placeholder="e.g., Samsung, LG, OnePlus"
                    className="w-full px-4 py-3 border rounded-lg focus:ring-4 focus:outline-none transition-all duration-300"
                    style={{ backgroundColor: 'var(--bg-form)', color: 'var(--text-primary)', borderColor: 'var(--border-color)' }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 transition-colors duration-300" style={{ color: 'var(--text-secondary)' }}>
                    Product *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.product}
                    onChange={(e) => setFormData({ ...formData, product: e.target.value })}
                    placeholder="e.g., Refrigerator, Smartphone"
                    className="w-full px-4 py-3 border rounded-lg focus:ring-4 focus:outline-none transition-all duration-300"
                    style={{ backgroundColor: 'var(--bg-form)', color: 'var(--text-primary)', borderColor: 'var(--border-color)' }}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 transition-colors duration-300" style={{ color: 'var(--text-secondary)' }}>
                  Issue Description *
                </label>
                <textarea
                  required
                  value={formData.issue}
                  onChange={(e) => setFormData({ ...formData, issue: e.target.value })}
                  placeholder="Describe your problem in detail..."
                  rows={4}
                  className="w-full px-4 py-3 border rounded-lg focus:ring-4 focus:outline-none transition-all duration-300 resize-none"
                  style={{ backgroundColor: 'var(--bg-form)', color: 'var(--text-primary)', borderColor: 'var(--border-color)' }}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium mb-2 transition-colors duration-300" style={{ color: 'var(--text-secondary)' }}>
                    City
                  </label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="e.g., Mumbai, Delhi"
                    className="w-full px-4 py-3 border rounded-lg focus:ring-4 focus:outline-none transition-all duration-300"
                    style={{ backgroundColor: 'var(--bg-form)', color: 'var(--text-primary)', borderColor: 'var(--border-color)' }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 transition-colors duration-300" style={{ color: 'var(--text-secondary)' }}>
                    State
                  </label>
                  <input
                    type="text"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    placeholder="e.g., Maharashtra, Delhi"
                    className="w-full px-4 py-3 border rounded-lg focus:ring-4 focus:outline-none transition-all duration-300"
                    style={{ backgroundColor: 'var(--bg-form)', color: 'var(--text-primary)', borderColor: 'var(--border-color)' }}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-linear-to-r from-[#DD4114] to-[#C73510] hover:from-[#C73510] hover:to-[#B02E0E] disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold py-4 px-6 rounded-lg hover:shadow-2xl hover:shadow-[#DD4114]/50 hover:-translate-y-0.5 active:translate-y-0 active:shadow-lg disabled:cursor-not-allowed disabled:hover:translate-y-0 focus:ring-4 focus:ring-[#DD4114]/50 focus:ring-offset-2 transition-all duration-300"
              >
                {loading ? "Analyzing..." : "Get Guidance"}
              </button>
            </form>

            {error && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 transition-colors duration-300">
                <strong>Error:</strong> {error}
              </div>
            )}
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="space-y-6">
            {/* Summary Card */}
            <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100 transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-semibold text-gray-800 transition-colors duration-300">Your Guidance</h2>
                <div className="flex gap-2">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium transition-colors duration-300 ${
                    result.guidance.severity === "high" || result.guidance.severity === "critical"
                      ? "bg-red-100 text-red-700"
                      : result.guidance.severity === "medium"
                      ? "bg-yellow-100 text-yellow-700"
                      : "bg-green-100 text-green-700"
                  }`}>
                    {result.guidance.severity.toUpperCase()}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium transition-colors duration-300 ${
                    result.guidance.confidenceLevel === "high"
                      ? "bg-green-100 text-green-700"
                      : "bg-blue-100 text-blue-700"
                  }`}>
                    {result.guidance.similarCases} Similar Cases
                  </span>
                </div>
              </div>
              <p className="text-gray-700 leading-relaxed transition-colors duration-300">
                {result.guidance.summary}
              </p>
            </div>

            {/* Suggested Steps */}
            <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100 transition-all duration-300">
              <h3 className="text-xl font-semibold text-gray-800 mb-4 transition-colors duration-300">
                Suggested Steps
              </h3>
              <ol className="space-y-3">
                {result.guidance.suggestedSteps.map((step, idx) => (
                  <li key={idx} className="flex items-start">
                    <span className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold mr-3">
                      {idx + 1}
                    </span>
                    <span className="text-gray-700 pt-1 transition-colors duration-300">{step}</span>
                  </li>
                ))}
              </ol>
            </div>

            {/* Contact Information */}
            {result.guidance.contacts && result.guidance.contacts.length > 0 && (
              <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100 transition-all duration-300">
                <h3 className="text-xl font-semibold text-gray-800 mb-4 transition-colors duration-300">
                  Contact Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {result.guidance.contacts.map((contact, idx) => (
                    <div
                      key={idx}
                      className="p-4 bg-gray-50 rounded-lg border border-gray-200 transition-colors duration-300"
                    >
                      <div className="text-sm text-gray-600 mb-1 capitalize transition-colors duration-300">
                        {contact.type.replace('_', ' ')}
                      </div>
                      <div className="font-medium text-gray-800 transition-colors duration-300">
                        {contact.value}
                      </div>
                      {contact.purpose && (
                        <div className="text-xs text-blue-600 mt-1 transition-colors duration-300">
                          For: {contact.purpose.replace('_', ' ')}
                        </div>
                      )}
                      {contact.city && (
                        <div className="text-sm text-gray-500 mt-1 transition-colors duration-300">
                          📍 {contact.city}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Expectations & Rights */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100 transition-all duration-300">
                <h3 className="text-xl font-semibold text-gray-800 mb-3 transition-colors duration-300">What to Expect</h3>
                <p className="text-gray-700 leading-relaxed transition-colors duration-300">{result.guidance.expectations}</p>
              </div>

              <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100 transition-all duration-300">
                <h3 className="text-xl font-semibold text-gray-800 mb-3 transition-colors duration-300">Your Rights</h3>
                <p className="text-gray-700 leading-relaxed transition-colors duration-300">{result.guidance.legalRights}</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-center">
              <button
                onClick={handleReset}
                className="px-8 py-3 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-700:bg-gray-600 transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                Submit Another Issue
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="text-center mt-12 text-sm transition-colors duration-300" style={{ color: 'var(--text-tertiary)' }}>
          <p>ConsuMaarg is an independent intelligence system.</p>
          <p className="mt-1">Not a replacement for official brand support or legal advice.</p>
        </footer>
        </div>
      </main>
    </>
  );
}
