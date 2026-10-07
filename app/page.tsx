"use client";

import { ContractAnalysisResult, FieldItem } from "@/types/contract";
import React, { useEffect, useState } from "react";

export default function ContractReviewPage() {
  const [file, setFile] = useState<File | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ContractAnalysisResult | null>(null);
  const [activeTab, setActiveTab] = useState<"fields" | "risks" | "json">("fields");

  // Clean up object URL on unmount or when pdfUrl changes
  useEffect(() => {
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [pdfUrl]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];

      // Revoke previous URL to avoid memory leak
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }

      setFile(selected);
      setPdfUrl(URL.createObjectURL(selected));

      // Reset previous analysis data when a new file is uploaded
      setData(null);
    }
  };

  const analyzeContract = async () => {
    if (!file) return;
    setLoading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/analyse", { method: "POST", body: formData });
      const result = await res.json();
      console.log("RESULT ===", result);
      setData(result);
    } catch (err) {
      alert("Error analyzing contract");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 text-gray-900 font-sans">
      {/* Left Panel: PDF Viewer */}
      <div className="w-1/2 border-r border-gray-200 flex flex-col p-4 bg-white">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-xl font-bold text-gray-800">CaseDocker Legal Workdesk</h1>
          <input type="file" accept=".pdf" onChange={handleFileUpload} className="text-sm" />
        </div>
        {pdfUrl ? (
          <iframe src={pdfUrl} className="w-full flex-grow rounded border border-gray-300" title="PDF Document" />
        ) : (
          <div className="flex-grow flex items-center justify-center text-gray-400 border-2 border-dashed border-gray-200 rounded">
            Upload a contract PDF to begin review
          </div>
        )}
      </div>

      {/* Right Panel: Extraction Results & Risks */}
      <div className="w-1/2 flex flex-col p-6 overflow-y-auto">
        {/* Analyze Button (shows whenever a file is attached and not yet analyzed) */}
        {file && !data && (
          <button
            onClick={analyzeContract}
            disabled={loading}
            className="mb-6 w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold rounded shadow transition"
          >
            {loading ? "Analyzing Document..." : "Run AI Contract Extraction"}
          </button>
        )}

        {/* Scanned Document Warning (Rendered inside panel to preserve UI) */}
        {data?.code === "SCANNED_DOCUMENT" && (
          <div className="p-4 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-800 rounded shadow mb-4">
            <strong className="font-bold">Warning:</strong> This PDF appears to be a scanned document. Scanned documents are not supported yet. Please select another file above.
          </div>
        )}

        {/* Successful Analysis Output */}
        {data && data.code !== "SCANNED_DOCUMENT" && (
          <div>
            {/* Header / Summary */}
            <div className="bg-white p-4 rounded shadow border mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-semibold uppercase text-blue-600">{data.contract_tpe}</span>
                <span className="text-xs text-gray-500">{data.document_name}</span>
              </div>
              <p className="text-sm text-gray-700 italic">{data.summary}</p>
            </div>

            {/* Navigation Tabs */}
            <div className="flex space-x-4 border-b border-gray-200 mb-4">
              <button
                onClick={() => setActiveTab("fields")}
                className={`pb-2 text-sm font-medium ${activeTab === "fields" ? "border-b-2 border-blue-600 text-blue-600" : "text-gray-500"}`}
              >
                Extracted Fields ({data.fields ? Object.keys(data.fields).length : 0})
              </button>
              <button
                onClick={() => setActiveTab("risks")}
                className={`pb-2 text-sm font-medium ${activeTab === "risks" ? "border-b-2 border-blue-600 text-blue-600" : "text-gray-500"}`}
              >
                Risk Flags ({data.risks?.length || 0})
              </button>
              <button
                onClick={() => setActiveTab("json")}
                className={`pb-2 text-sm font-medium ${activeTab === "json" ? "border-b-2 border-blue-600 text-blue-600" : "text-gray-500"}`}
              >
                JSON Schema Output
              </button>
            </div>

            {/* Tab 1: Fields Grid */}
            {activeTab === "fields" && data.fields && (
              <div className="space-y-3">
                {Object.entries(data.fields).map(([key, field]) => (
                  <FieldCard key={key} label={key.replace(/_/g, " ")} field={field as FieldItem} />
                ))}
              </div>
            )}

            {/* Tab 2: Risk Flags */}
            {activeTab === "risks" && data.risks && (
              <div className="space-y-3">
                {data.risks.map((risk, idx) => (
                  <div key={idx} className="p-4 bg-white rounded border border-gray-200 shadow-sm">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-semibold text-gray-800">{risk.title}</span>
                      <SeverityBadge severity={risk.severity} />
                    </div>
                    <p className="text-xs text-gray-600 mb-2">{risk.reason}</p>
                    <div className="bg-gray-50 p-2 rounded text-xs text-gray-500 font-mono">
                      "{risk.source_text}"
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Tab 3: Schema JSON Output */}
            {activeTab === "json" && (
              <div className="bg-gray-900 text-green-400 p-4 rounded font-mono text-xs overflow-x-auto">
                <button
                  onClick={() => navigator.clipboard.writeText(JSON.stringify(data, null, 2))}
                  className="mb-2 px-2 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded text-xs"
                >
                  Copy JSON
                </button>
                <pre>{JSON.stringify(data, null, 2)}</pre>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function FieldCard({ label, field }: { label: string; field: FieldItem }) {
  return (
    <div className="p-3 bg-white rounded border border-gray-200 shadow-sm">
      <div className="flex justify-between items-start">
        <span className="text-xs font-bold text-gray-500 uppercase">{label}</span>
        {field.found ? (
          <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full font-medium">
            {(field.confidence * 100).toFixed(0)}% Conf.
          </span>
        ) : (
          <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-medium">Not Found</span>
        )}
      </div>
      <div className="mt-1 font-medium text-sm text-gray-900">
        {field.found ? (Array.isArray(field.value) ? field.value.join(", ") : field.value) : "Not found"}
      </div>
      {field.found && field.source_text && (
        <p className="mt-2 text-xs text-gray-500 bg-gray-50 p-2 rounded italic">"{field.source_text}"</p>
      )}
    </div>
  );
}

function SeverityBadge({ severity }: { severity: "High" | "Medium" | "Low" }) {
  const colors = {
    High: "bg-red-100 text-red-800 border-red-300",
    Medium: "bg-amber-100 text-amber-800 border-amber-300",
    Low: "bg-blue-100 text-blue-800 border-blue-300"
  };
  return <span className={`text-xs px-2 py-0.5 border rounded font-semibold ${colors[severity]}`}>{severity}</span>;
}