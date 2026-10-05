"use client";
import { useState, useRef, useCallback, useEffect } from "react";
import UploadZone from "@/components/UploadZone";
import OverviewSection from "@/components/OverviewSection";
import SpectralSection from "@/components/SpectralSection";
import HarmonicSection from "@/components/HarmonicSection";
import TimbralSection from "@/components/TimbralSection";
import { AnalysisResult } from "@/types/analysis";
import { API_URL, formatTime } from "@/lib/utils";

export default function Home() {
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);

  async function handleAnalyze(file: File) {
    setLoading(true);
    setError(null);
    setResult(null);
    setAudioUrl(URL.createObjectURL(file));
    setCurrentTime(0);
    setIsPlaying(false);
    setDuration(0);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch(`${API_URL}/analyze`, {
        method: "POST",
        body: form,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: "Server error" }));
        throw new Error(err.detail || "Unknown error");
      }
      const data: AnalysisResult = await res.json();
      setResult(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  const handleDownloadPDF = () => {
    window.print();
  };

  const togglePlay = useCallback(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying((prev) => !prev);
    }
  }, [isPlaying]);

  const handleSeek = useCallback((time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }
      if (e.code === "Space" && audioUrl) {
        e.preventDefault();
        togglePlay();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [audioUrl, togglePlay]);

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      {/* ── Top Nav ─────────────────────────────────────────── */}
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-50 print:hidden">
        <div className="max-w-[1280px] mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-bold text-gray-900 text-sm tracking-tight font-sans">
              Song Analytics
            </span>
            <span className="text-[10px] bg-orange-100 text-orange-600 font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider font-mono">
              v1
            </span>
          </div>
          <div className="text-xs text-gray-400 font-mono">@manov_ik</div>
        </div>
      </nav>

      <main className="max-w-[1280px] mx-auto px-6 py-8">
        {/* ── Empty & Loading States (Centered) ──────────────── */}
        {!result && (
          <div className="flex flex-col items-center justify-center min-h-[calc(100vh-140px)]">
            {!loading ? (
              <div className="flex flex-col items-center gap-8 w-full">
                <div className="text-center max-w-lg mx-auto mb-2">
                  <h1 className="text-2xl md:text-3xl font-semibold text-gray-900 tracking-tight font-sans">
                    Look how your{" "}
                    <span className=" text-orange-600 ">Music Sounds</span> Like
                  </h1>
                  <p className="text-[13px] text-gray-500 mt-3 leading-relaxed font-sans">
                    Upload an audio file and get instant deep analysis — tempo,
                    key, spectrograms, energy flow, harmonic content, and
                    timbral fingerprint.
                  </p>
                </div>
                <UploadZone onAnalyze={handleAnalyze} loading={loading} />
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-5 py-3 font-sans">
                    ❌ {error}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center gap-6">
                <div className="relative">
                  <div className="w-16 h-16 rounded-full border-4 border-orange-100 border-t-orange-500 animate-spin" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-gray-700 font-sans">
                    Analyzing audio…
                  </p>
                  <p className="text-xs text-gray-400 mt-1 font-mono">
                    Computing spectrograms, features & harmonics
                  </p>
                </div>
                <div className="flex items-end gap-1">
                  {[12, 20, 16, 24, 18, 14, 22, 10, 20, 16].map((h, i) => (
                    <div
                      key={i}
                      className="w-1.5 bg-orange-400 rounded-full animate-pulse"
                      style={{ height: h, animationDelay: `${i * 0.1}s` }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Results Dashboard ─────────────────────────────── */}
        {result && !loading && (
          <div className="space-y-6">
            {/* Song header */}
            <div className="flex items-center justify-between print:hidden">
              <div>
                <h2 className="text-lg font-bold text-gray-900 truncate max-w-lg font-sans">
                  {result.song_name}
                </h2>
                <p className="text-xs text-gray-400 mt-0.5 font-mono">
                  Analysis complete · {new Date().toLocaleDateString()}
                </p>
              </div>
              <div className="flex gap-4 items-center">
                {audioUrl && (
                  <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-full pl-1.5 pr-4 h-[38px] shadow-sm min-w-[160px]">
                    <audio
                      ref={audioRef}
                      src={audioUrl}
                      onTimeUpdate={(e) =>
                        setCurrentTime(e.currentTarget.currentTime)
                      }
                      onLoadedMetadata={(e) =>
                        setDuration(e.currentTarget.duration)
                      }
                      onEnded={() => setIsPlaying(false)}
                      className="hidden"
                    />
                    <button
                      onClick={togglePlay}
                      className="text-orange-500 hover:text-orange-600 w-7 h-7 flex items-center justify-center transition-colors bg-orange-50 hover:bg-orange-100 rounded-full shrink-0"
                    >
                      {isPlaying ? (
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                        >
                          <rect x="6" y="4" width="4" height="16" />
                          <rect x="14" y="4" width="4" height="16" />
                        </svg>
                      ) : (
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                          className="ml-0.5"
                        >
                          <polygon points="5 3 19 12 5 21 5 3" />
                        </svg>
                      )}
                    </button>
                    <div className="text-[12px] font-mono text-gray-600 flex-1 text-center">
                      {formatTime(currentTime)} / {formatTime(duration)}
                    </div>
                  </div>
                )}
                <div className="flex gap-2">
                  <button
                    onClick={handleDownloadPDF}
                    className="text-[12px] h-[38px] flex items-center justify-center font-semibold bg-orange-500 text-white hover:bg-orange-600 px-5 rounded-full transition-all font-sans"
                  >
                    Download PDF
                  </button>
                  <button
                    onClick={() => {
                      setResult(null);
                      setAudioUrl(null);
                    }}
                    className="text-[12px] h-[38px] flex items-center justify-center font-medium text-gray-600 hover:text-gray-900 border border-gray-200 hover:border-gray-300 px-5 rounded-full transition-all font-sans bg-white"
                  >
                    New Analysis
                  </button>
                </div>
              </div>
            </div>

            <div
              id="analytics-dashboard"
              className="space-y-6 bg-[#f8fafc] p-2"
            >
              <div className="hidden print:block text-center py-4 border-b border-gray-200">
                <h1 className="text-2xl font-bold font-sans">
                  {result.song_name}
                </h1>
                <p className="text-sm font-mono text-gray-500">
                  Song Analytics Report
                </p>
              </div>

              <OverviewSection
                result={result}
                currentTime={currentTime}
                onSeek={handleSeek}
              />
              <SpectralSection
                result={result}
                currentTime={currentTime}
                onSeek={handleSeek}
              />
              <HarmonicSection
                result={result}
                currentTime={currentTime}
                onSeek={handleSeek}
              />
              <TimbralSection result={result} />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
