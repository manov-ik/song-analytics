export interface AnalysisResult {
  song_name: string;
  duration: number;
  tempo: number;
  key: string;
  key_confidence: number;
  loudness_lufs: number;
  dynamic_range_db: number;
  avg_energy: number;
  max_energy: number;
  avg_centroid_hz: number;
  avg_zcr: number;
  beat_count: number;

  waveform: { times: number[]; values: number[] };
  rms: { times: number[]; values: number[] };
  spectral: {
    times: number[];
    centroid: number[];
    rolloff: number[];
    bandwidth: number[];
    zcr: number[];
  };
  onset: { times: number[]; strength: number[] };
  beat_times: number[];

  chroma: { times: number[]; labels: string[]; grid: number[][] };
  mfcc: { times: number[]; mean: number[]; grid: number[][] };
  mel: { grid: number[][]; n_cols: number; n_rows: number };
}
