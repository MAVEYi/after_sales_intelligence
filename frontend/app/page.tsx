"use client";

import { useState } from "react";

type GuidanceResponse = {
  investigationId: string;
  guidance: {
    summary: string;
    suggestedSteps: string[];
    contacts: Array<{
      type: string;
      value: string;
      city?: string;
      description?: string;
    }>;
    expectations: string;
    legalRights: string;
    confidenceLevel: string;
    similarCases: number;
    severity: string;
  };
};

export default function HomePage() {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";
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
    } catch (err: any) {
      setError(err.message || "Something went wrong");
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
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <header className="text-center mb-10 pt-8">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-3">
            ConsuMaarg
          </h1>
          <p className="text-gray-600 text-lg">
            After-Sales Intelligence for Indian Consumers
          </p>
          <div className="inline-block mt-2 px-4 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
            Alpha-2 · AI-Powered
          </div>
        </header>

        {/* Form */}
        {!result && (
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 border border-gray-100">
            <h2 className="text-2xl font-semibold mb-6 text-gray-800">
              Describe Your Issue
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Brand Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    placeholder="e.g., Samsung, LG, OnePlus"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Product *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.product}
                    onChange={(e) => setFormData({ ...formData, product: e.target.value })}
                    placeholder="e.g., Refrigerator, Smartphone"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Issue Description *
                </label>
                <textarea
                  required
                  value={formData.issue}
                  onChange={(e) => setFormData({ ...formData, issue: e.target.value })}
                  placeholder="Describe your problem in detail..."
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition resize-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    City
                  </label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="e.g., Mumbai, Delhi"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    State
                  </label>
                  <input
                    type="text"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    placeholder="e.g., Maharashtra, Delhi"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold py-4 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Analyzing..." : "Get Guidance"}
              </button>
            </form>

            {error && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                <strong>Error:</strong> {error}
              </div>
            )}
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="space-y-6">
            {/* Summary Card */}
            <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-semibold text-gray-800">Your Guidance</h2>
                <div className="flex gap-2">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    result.guidance.severity === "high" || result.guidance.severity === "critical"
                      ? "bg-red-100 text-red-700"
                      : result.guidance.severity === "medium"
                      ? "bg-yellow-100 text-yellow-700"
                      : "bg-green-100 text-green-700"
                  }`}>
                    {result.guidance.severity.toUpperCase()}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    result.guidance.confidenceLevel === "high"
                      ? "bg-green-100 text-green-700"
                      : "bg-blue-100 text-blue-700"
                  }`}>
                    {result.guidance.similarCases} Similar Cases
                  </span>
                </div>
              </div>
              <p className="text-gray-700 leading-relaxed">{result.guidance.summary}</p>
            </div>

            {/* Suggested Steps */}
            <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Suggested Steps</h3>
              <ol className="space-y-3">
                {result.guidance.suggestedSteps.map((step, idx) => (
                  <li key={idx} className="flex items-start">
                    <span className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold mr-3">
                      {idx + 1}
                    </span>
                    <span className="text-gray-700 pt-1">{step}</span>
                  </li>
                ))}
              </ol>
            </div>

            {/* Contact Information */}
            {result.guidance.contacts && result.guidance.contacts.length > 0 && (
              <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">Contact Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {result.guidance.contacts.map((contact, idx) => (
                    <div key={idx} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="text-sm text-gray-600 mb-1">{contact.description}</div>
                      <div className="font-medium text-gray-800">{contact.value}</div>
                      {contact.city && <div className="text-sm text-gray-500 mt-1">{contact.city}</div>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Expectations & Rights */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
                <h3 className="text-xl font-semibold text-gray-800 mb-3">What to Expect</h3>
                <p className="text-gray-700 leading-relaxed">{result.guidance.expectations}</p>
              </div>

              <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
                <h3 className="text-xl font-semibold text-gray-800 mb-3">Your Rights</h3>
                <p className="text-gray-700 leading-relaxed">{result.guidance.legalRights}</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-center">
              <button
                onClick={handleReset}
                className="px-8 py-3 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-700 transition shadow-lg"
              >
                Submit Another Issue
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="text-center mt-12 text-gray-500 text-sm">
          <p>ConsuMaarg is an independent intelligence system.</p>
          <p className="mt-1">Not a replacement for official brand support or legal advice.</p>
        </footer>
      </div>
    </main>
  );
}
