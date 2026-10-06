"use client";
import StatCard from "@/components/StatCard";
import MfccChart from "@/components/MfccChart";
import InfoTooltip from "@/components/InfoTooltip";
import { AnalysisResult } from "@/types/analysis";

interface TimbralSectionProps {
  result: AnalysisResult;
}

export default function TimbralSection({ result }: TimbralSectionProps) {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold font-sans text-gray-900 mt-8">Timbral Features</h2>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="MFCC-1 (Energy)" value={result.mfcc.mean[0].toFixed(1)} accent />
        <StatCard label="MFCC-2 (Brightness)" value={result.mfcc.mean[1].toFixed(1)} />
        <StatCard label="Avg ZCR" value={result.avg_zcr.toFixed(4)} sub="noise indicator" />
        <StatCard label="Loudness" value={`${result.loudness_lufs} LUFS`} />
      </div>

      {/* MFCC bar chart */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 break-inside-avoid">
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-gray-800 font-sans inline-flex items-center">
            Timbral Fingerprint (MFCC)
            <InfoTooltip text="13 Mel-Frequency Cepstral Coefficients that compactly represent the short-term power spectrum. Captures the exact 'texture' or 'timbre' of the song." />
          </h3>
          <p className="text-xs text-gray-400 mt-0.5 font-mono">13 Mel-Frequency Cepstral Coefficients — mean values</p>
        </div>
        <MfccChart mean={result.mfcc.mean} />
        <p className="text-xs text-gray-400 mt-4 leading-relaxed font-sans">
          MFCCs capture the timbral texture of a song — vocal
          character, instrument richness, and overall tone. C1
          represents overall energy, C2–C5 capture brightness and
          vocal timbre.
        </p>
      </div>
    </div>
  );
}
