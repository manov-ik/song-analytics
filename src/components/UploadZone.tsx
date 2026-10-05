"use client";
import { useCallback, useState } from "react";


interface UploadZoneProps {
  onAnalyze: (file: File) => void;
  loading: boolean;
}

export default function UploadZone({ onAnalyze, loading }: UploadZoneProps) {
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);

  const setValidFile = (f: File) => {
    const allowed = [".mp3", ".wav", ".flac", ".m4a", ".ogg"];
    const ext = "." + f.name.split(".").pop()?.toLowerCase();
    if (allowed.includes(ext)) setFile(f);
    else alert("Please upload MP3, WAV, FLAC, M4A, or OGG.");
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) setValidFile(f);
  }, []);

  const handleSubmit = () => {
    if (file) onAnalyze(file);
  };

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Drop Zone */}
      <div
        className={`w-full max-w-lg border border-dashed rounded-2xl p-10 flex flex-col items-center gap-4 cursor-pointer transition-colors duration-300
          ${dragging
            ? "border-orange-500 bg-orange-50/30"
            : file
            ? "border-gray-200 bg-white"
            : "border-gray-300 hover:border-gray-400 bg-transparent"
          }`}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => !file && document.getElementById("fileInput")?.click()}
      >
        <input
          id="fileInput"
          type="file"
          className="hidden"
          accept=".mp3,.wav,.flac,.m4a,.ogg"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) setValidFile(f); }}
        />

        {file ? (
          <>
            <div className="w-12 h-12 bg-gray-50 border border-gray-100 rounded-full flex items-center justify-center text-gray-600 mb-2">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18V5l12-2v13"></path><circle cx="6" cy="18" r="3"></circle><circle cx="18" cy="16" r="3"></circle></svg>
            </div>
            <div className="text-center">
              <p className="text-[15px] font-medium text-gray-900 font-sans">{file.name}</p>
              <p className="text-xs text-gray-400 mt-1.5 font-mono">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
            <button
              className="text-xs text-gray-500 hover:text-gray-900 mt-2 flex items-center gap-1 transition-colors font-medium font-sans"
              onClick={(e) => { e.stopPropagation(); setFile(null); }}
            >
              Remove
            </button>
          </>
        ) : (
          <>
            <div className="w-12 h-12 bg-gray-50 border border-gray-100 rounded-full flex items-center justify-center text-gray-500 mb-2">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
            </div>
            <div className="text-center">
              <p className="text-[15px] font-medium text-gray-900 font-sans">Drop your audio file here</p>
              <p className="text-xs text-gray-400 mt-2 font-mono uppercase tracking-wider">MP3 · WAV · FLAC · M4A · OGG</p>
            </div>
            <button
              className="text-[13px] bg-gray-900 text-white px-5 py-2.5 rounded-full hover:bg-gray-800 transition-colors font-medium mt-2 font-sans"
              onClick={(e) => { e.stopPropagation(); document.getElementById("fileInput")?.click(); }}
            >
              Browse files
            </button>
          </>
        )}
      </div>

      {/* Analyze Button */}
      {file && (
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="flex items-center gap-2 bg-gray-900 hover:bg-gray-800 disabled:bg-gray-200 disabled:text-gray-400 text-white font-medium px-6 py-2.5 rounded-full transition-colors text-[13px] font-sans"
        >
          {loading ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
              Analyzing audio...
            </>
          ) : (
            <>
              Analyze Track
            </>
          )}
        </button>
      )}
    </div>
  );
}
