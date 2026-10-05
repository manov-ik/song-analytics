"use client";
import StatCard from "@/components/StatCard";
import WaveformChart from "@/components/WaveformChart";
import MelHeatmap from "@/components/MelHeatmap";
import OnsetChart from "@/components/OnsetChart";
import { AnalysisResult } from "@/types/analysis";
import { formatDuration } from "@/lib/utils";

interface OverviewSectionProps {
  result: AnalysisResult;
  currentTime?: number;
  onSeek?: (time: number) => void;
}

export default function OverviewSection({ result, currentTime = 0, onSeek }: OverviewSectionProps) {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold font-sans text-gray-900 ">Overview</h2>
      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatCard label="Tempo" value={`${result.tempo} BPM`} accent />
        <StatCard label="Duration" value={formatDuration(result.duration)} />
        <StatCard label="Key" value={result.key} sub={`${(result.key_confidence * 100).toFixed(0)}% conf.`} />
        <StatCard label="Loudness" value={`${result.loudness_lufs} LUFS`} />
        <StatCard label="Beats" value={`${result.beat_count}`} sub="detected beats" />
      </div>

      {/* Second row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Dynamic Range" value={`${result.dynamic_range_db} dB`} />
        <StatCard label="Avg Energy" value={result.avg_energy.toFixed(4)} />
        <StatCard label="Peak Energy" value={result.max_energy.toFixed(4)} />
        <StatCard label="Avg Centroid" value={`${(result.avg_centroid_hz / 1000).toFixed(2)} kHz`} sub="brightness" />
      </div>

      {/* RMS Energy Chart */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 break-inside-avoid">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-gray-800 font-sans">Energy Flow</h3>
            <p className="text-xs text-gray-400 mt-0.5 font-mono">RMS amplitude over time · beat markers shown</p>
          </div>
          <div className="flex items-center gap-4 text-xs text-gray-400 font-mono">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-orange-400 inline-block rounded" /> RMS Energy
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-px h-3 bg-orange-300 inline-block" /> Beat
            </span>
          </div>
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
            label="RMS Energy"
            onSeek={onSeek}
          />
        </div>
      </div>

      {/* Mel Spectrogram */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 break-inside-avoid">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-gray-800 font-sans">Mel Spectrogram</h3>
            <p className="text-xs text-gray-400 mt-0.5 font-mono">Perceptual frequency content over time (magma scale)</p>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-400 font-mono">
            <div className="w-16 h-3 rounded" style={{ background: "linear-gradient(to right, #000004, #3b0f70, #8c2981, #de4968, #fe9f6d, #fcfdbf)" }} />
            <span>low → high</span>
          </div>
        </div>
        <MelHeatmap grid={result.mel.grid} />
      </div>

      {/* Onset Strength */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 break-inside-avoid">
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-gray-800 font-sans">Beat / Onset Strength</h3>
          <p className="text-xs text-gray-400 mt-0.5 font-mono">Peaks indicate strong beats and transients</p>
        </div>
        <div className="relative w-full">
          {currentTime > 0 && result.duration > 0 && (
            <div 
              className="absolute top-0 bottom-6 w-[2px] bg-red-500 z-10 pointer-events-none"
              style={{ left: `calc(16px + (100% - 24px) * ${Math.min(1, currentTime / result.duration)})` }} 
            />
          )}
          <OnsetChart 
            times={result.onset.times} 
            strength={result.onset.strength} 
            onSeek={onSeek}
          />
        </div>
      </div>
    </div>
  );
}
