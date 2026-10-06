"use client";
import StatCard from "@/components/StatCard";
import WaveformChart from "@/components/WaveformChart";
import SpectralChart from "@/components/SpectralChart";
import InfoTooltip from "@/components/InfoTooltip";
import { AnalysisResult } from "@/types/analysis";

interface SpectralSectionProps {
  result: AnalysisResult;
  currentTime?: number;
  onSeek?: (time: number) => void;
}

export default function SpectralSection({ result, currentTime = 0, onSeek }: SpectralSectionProps) {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold font-sans text-gray-900 mt-8">Spectral Features</h2>
      {/* Spectral stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <StatCard label="Spectral Centroid" value={`${(result.avg_centroid_hz / 1000).toFixed(2)} kHz`} sub="avg brightness" accent />
        <StatCard label="Avg ZCR" value={result.avg_zcr.toFixed(4)} sub="zero crossing rate" />
        <StatCard label="Dynamic Range" value={`${result.dynamic_range_db} dB`} sub="peak vs mean" />
      </div>

      {/* Spectral shape */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 break-inside-avoid">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div>
              <h3 className="text-sm font-semibold text-gray-800 font-sans inline-flex items-center">
                Spectral Shape
                <InfoTooltip text="Spectral Centroid indicates the perceived brightness of the sound. Spectral Rolloff is the frequency below which 85% of the spectral energy lies, useful for distinguishing harmonic from noisy sounds." />
              </h3>
              <p className="text-xs text-gray-400 mt-0.5 font-mono">Centroid · Rolloff · Bandwidth over time</p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-xs font-mono">
            <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-amber-500 inline-block rounded" /> Centroid</span>
            <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-cyan-500 inline-block rounded" /> Rolloff</span>
            <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-rose-500 inline-block rounded" /> Bandwidth</span>
          </div>
        </div>
        <div className="relative w-full">
          {currentTime > 0 && result.duration > 0 && (
            <div 
              className="absolute top-0 bottom-6 w-[2px] bg-red-500 z-10 pointer-events-none"
              style={{ left: `calc(22px + (100% - 30px) * ${Math.min(1, currentTime / result.duration)})` }} 
            />
          )}
          <SpectralChart
            times={result.spectral.times}
            centroid={result.spectral.centroid}
            rolloff={result.spectral.rolloff}
            bandwidth={result.spectral.bandwidth}
            onSeek={onSeek}
          />
        </div>
      </div>

      {/* ZCR */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 break-inside-avoid">
          <div className="flex items-center gap-2">
            <div>
              <h3 className="text-sm font-semibold text-gray-800 font-sans inline-flex items-center">
                Zero Crossing Rate
                <InfoTooltip text="Tracks the rate of sign-changes along a signal, acting as a strong indicator of noisiness and percussive content." />
              </h3>
              <p className="text-xs text-gray-400 mt-0.5 font-mono">High = percussion/noise · Low = vocals/tonal</p>
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
            times={result.spectral.times}
            values={result.spectral.zcr}
            beatTimes={result.beat_times}
            color="#06b6d4"
            label="ZCR"
            onSeek={onSeek}
          />
        </div>
      </div>
    </div>
  );
}
