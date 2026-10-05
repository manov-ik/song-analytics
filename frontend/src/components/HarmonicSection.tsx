"use client";
import StatCard from "@/components/StatCard";
import WaveformChart from "@/components/WaveformChart";
import ChromaChart from "@/components/ChromaChart";
import { AnalysisResult } from "@/types/analysis";

interface HarmonicSectionProps {
  result: AnalysisResult;
  currentTime?: number;
  onSeek?: (time: number) => void;
}

export default function HarmonicSection({ result, currentTime = 0, onSeek }: HarmonicSectionProps) {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold font-sans text-gray-900  mt-8">Harmonic Features</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Chroma radar */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 break-inside-avoid">
          <div className="mb-2">
            <h3 className="text-sm font-semibold text-gray-800 font-sans">Chroma / Pitch Classes</h3>
            <p className="text-xs text-gray-400 mt-0.5 font-mono">Relative presence of each musical note</p>
          </div>
          <ChromaChart labels={result.chroma.labels} grid={result.chroma.grid} />
        </div>

        {/* Energy + Beats */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 break-inside-avoid">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-gray-800 font-sans">Energy + Beats Overview</h3>
            <p className="text-xs text-gray-400 mt-0.5 font-mono">Energy curve with beat position markers</p>
          </div>
        <div className="relative w-full">
          {currentTime > 0 && result.duration > 0 && (
            <div 
              className="absolute top-0 bottom-6 w-[2px] bg-red-500 z-10 pointer-events-none"
              style={{ left: `calc(16px + (100% - 24px) * ${Math.min(1, currentTime / result.duration)})` }} 
            />
          )}
          <WaveformChart
            times={result.rms.times}
            values={result.rms.values}
            beatTimes={result.beat_times}
            color="#f97316"
            onSeek={onSeek}
          />
        </div>
        </div>
      </div>
    </div>
  );
}
