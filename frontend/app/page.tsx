"use client";

import { useState, useEffect } from "react";

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

// Minimal Sun Icon (outline)
const SunIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
);

// Minimal Moon Icon (outline)
const MoonIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
  </svg>
);

export default function HomePage() {
  // Dark mode state (default: dark)
  const [darkMode, setDarkMode] = useState(true);
  
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

  // Load dark mode preference from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("darkMode");
    if (saved !== null) {
      setDarkMode(saved === "true");
    }
  }, []);

  // Save and apply dark mode
  useEffect(() => {
    localStorage.setItem("darkMode", darkMode.toString());
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

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
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:bg-gradient-to-br dark:from-gray-950 dark:via-gray-900 dark:to-black p-6 transition-colors duration-300">
      <div className="max-w-4xl mx-auto">
        {/* Dark Mode Toggle - Top Left */}
        <div className="flex justify-between items-center mb-6">
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="p-3 rounded-lg bg-white/80 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 hover:bg-white dark:hover:bg-gray-700 transition-all duration-300 shadow-md hover:shadow-lg group"
            aria-label="Toggle dark mode"
          >
            <div className="relative w-5 h-5">
              <div className={`absolute inset-0 transition-all duration-300 ${darkMode ? 'opacity-0 rotate-90 scale-0' : 'opacity-100 rotate-0 scale-100'} text-yellow-500`}>
                <SunIcon />
              </div>
              <div className={`absolute inset-0 transition-all duration-300 ${darkMode ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-0'} text-blue-400`}>
                <MoonIcon />
              </div>
            </div>
          </button>
        </div>

        {/* Header */}
        <header className="text-center mb-10 pt-2">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-3">
            ConsuMaarg
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg transition-colors duration-300">
            After-Sales Intelligence for Indian Consumers
          </p>
          <div className="inline-block mt-2 px-4 py-1 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-full text-sm font-medium transition-colors duration-300">
            Alpha-2 · AI-Powered
          </div>
        </header>

        {/* Form */}
        {!result && (
          <div className="bg-white dark:bg-gradient-to-br dark:from-gray-800 dark:to-gray-900 rounded-2xl shadow-xl dark:shadow-2xl p-8 mb-8 border border-gray-100 dark:border-gray-700 transition-all duration-300">
            <h2 className="text-2xl font-semibold mb-6 text-gray-800 dark:text-gray-100 transition-colors duration-300">
              Describe Your Issue
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors duration-300">
                    Brand Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    placeholder="e.g., Samsung, LG, OnePlus"
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all duration-300 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors duration-300">
                    Product *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.product}
                    onChange={(e) => setFormData({ ...formData, product: e.target.value })}
                    placeholder="e.g., Refrigerator, Smartphone"
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all duration-300 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors duration-300">
                  Issue Description *
                </label>
                <textarea
                  required
                  value={formData.issue}
                  onChange={(e) => setFormData({ ...formData, issue: e.target.value })}
                  placeholder="Describe your problem in detail..."
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all duration-300 resize-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors duration-300">
                    City
                  </label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="e.g., Mumbai, Delhi"
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all duration-300 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors duration-300">
                    State
                  </label>
                  <input
                    type="text"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    placeholder="e.g., Maharashtra, Delhi"
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all duration-300 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold py-4 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Analyzing..." : "Get Guidance"}
              </button>
            </form>

            {error && (
              <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 transition-colors duration-300">
                <strong>Error:</strong> {error}
              </div>
            )}
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="space-y-6">
            {/* Summary Card */}
            <div className="bg-white dark:bg-gradient-to-br dark:from-gray-800 dark:to-gray-900 rounded-2xl shadow-xl dark:shadow-2xl p-8 border border-gray-100 dark:border-gray-700 transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 transition-colors duration-300">Your Guidance</h2>
                <div className="flex gap-2">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium transition-colors duration-300 ${
                    result.guidance.severity === "high" || result.guidance.severity === "critical"
                      ? "bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300"
                      : result.guidance.severity === "medium"
                      ? "bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-300"
                      : "bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300"
                  }`}>
                    {result.guidance.severity.toUpperCase()}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium transition-colors duration-300 ${
                    result.guidance.confidenceLevel === "high"
                      ? "bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300"
                      : "bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300"
                  }`}>
                    {result.guidance.similarCases} Similar Cases
                  </span>
                </div>
              </div>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed transition-colors duration-300">
                {result.guidance.summary}
              </p>
            </div>

            {/* Suggested Steps */}
            <div className="bg-white dark:bg-gradient-to-br dark:from-blue-950 dark:to-purple-950 rounded-2xl shadow-xl dark:shadow-2xl p-8 border border-gray-100 dark:border-blue-900/50 transition-all duration-300">
              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4 transition-colors duration-300">
                Suggested Steps
              </h3>
              <ol className="space-y-3">
                {result.guidance.suggestedSteps.map((step, idx) => (
                  <li key={idx} className="flex items-start">
                    <span className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold mr-3">
                      {idx + 1}
                    </span>
                    <span className="text-gray-700 dark:text-gray-300 pt-1 transition-colors duration-300">{step}</span>
                  </li>
                ))}
              </ol>
            </div>

            {/* Contact Information */}
            {result.guidance.contacts && result.guidance.contacts.length > 0 && (
              <div className="bg-white dark:bg-gradient-to-br dark:from-gray-800 dark:to-gray-900 rounded-2xl shadow-xl dark:shadow-2xl p-8 border border-gray-100 dark:border-gray-700 transition-all duration-300">
                <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4 transition-colors duration-300">
                  Contact Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {result.guidance.contacts.map((contact, idx) => (
                    <div
                      key={idx}
                      className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700 transition-colors duration-300"
                    >
                      <div className="text-sm text-gray-600 dark:text-gray-400 mb-1 capitalize transition-colors duration-300">
                        {contact.type.replace('_', ' ')}
                      </div>
                      <div className="font-medium text-gray-800 dark:text-gray-200 transition-colors duration-300">
                        {contact.value}
                      </div>
                      {contact.purpose && (
                        <div className="text-xs text-blue-600 dark:text-blue-400 mt-1 transition-colors duration-300">
                          For: {contact.purpose.replace('_', ' ')}
                        </div>
                      )}
                      {contact.city && (
                        <div className="text-sm text-gray-500 dark:text-gray-400 mt-1 transition-colors duration-300">
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
              <div className="bg-white dark:bg-gradient-to-br dark:from-emerald-950 dark:to-teal-950 rounded-2xl shadow-xl dark:shadow-2xl p-8 border border-gray-100 dark:border-emerald-900/50 transition-all duration-300">
                <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-3 transition-colors duration-300">What to Expect</h3>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed transition-colors duration-300">{result.guidance.expectations}</p>
              </div>

              <div className="bg-white dark:bg-gradient-to-br dark:from-amber-950 dark:to-orange-950 rounded-2xl shadow-xl dark:shadow-2xl p-8 border border-gray-100 dark:border-amber-900/50 transition-all duration-300">
                <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-3 transition-colors duration-300">Your Rights</h3>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed transition-colors duration-300">{result.guidance.legalRights}</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-center">
              <button
                onClick={handleReset}
                className="px-8 py-3 bg-gray-600 dark:bg-gray-700 text-white font-semibold rounded-lg hover:bg-gray-700 dark:hover:bg-gray-600 transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                Submit Another Issue
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="text-center mt-12 text-gray-500 dark:text-gray-400 text-sm transition-colors duration-300">
          <p>ConsuMaarg is an independent intelligence system.</p>
          <p className="mt-1">Not a replacement for official brand support or legal advice.</p>
        </footer>
      </div>
    </main>
  );
}
