"""
Song Analytics API – FastAPI backend
Returns all audio features as JSON for the React frontend.
Deploy to Render or Railway (not Vercel – librosa is too large).
"""

import io, base64, tempfile, os
import numpy as np
import librosa
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

SR         = 22050
N_FFT      = 2048
HOP_LENGTH = 512
N_MELS     = 128
FMAX       = 8000
TOP_DB     = 80

app = FastAPI(title="Song Analytics API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

KEYS = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]
MODES = ["Major", "Minor"]

# Krumhansl-Schmuckler key profiles
MAJ_PROFILE = np.array([6.35,2.23,3.48,2.33,4.38,4.09,2.52,5.19,2.39,3.66,2.29,2.88])
MIN_PROFILE = np.array([6.33,2.68,3.52,5.38,2.60,3.53,2.54,4.75,3.98,2.69,3.34,3.17])

def detect_key(chroma_mean: np.ndarray):
    """Detect musical key using Krumhansl-Schmuckler profiles."""
    best_r, best_key, best_mode = -999, 0, 0
    for i in range(12):
        maj_r = np.corrcoef(np.roll(MAJ_PROFILE, i), chroma_mean)[0, 1]
        min_r = np.corrcoef(np.roll(MIN_PROFILE, i), chroma_mean)[0, 1]
        if maj_r > best_r:
            best_r, best_key, best_mode = maj_r, i, 0
        if min_r > best_r:
            best_r, best_key, best_mode = min_r, i, 1
    return f"{KEYS[best_key]} {MODES[best_mode]}", round(float(best_r), 3)

def rms_to_lufs(rms_mean: float) -> float:
    """Approximate LUFS from mean RMS (not true LUFS but a good proxy)."""
    if rms_mean <= 0:
        return -70.0
    return round(20 * np.log10(rms_mean) - 0.691, 1)

def downsample(arr: np.ndarray, target: int = 1000) -> list:
    """Downsample array to ~target points for JSON transmission."""
    if len(arr) <= target:
        return arr.tolist()
    indices = np.linspace(0, len(arr) - 1, target, dtype=int)
    return arr[indices].tolist()

def normalize_to_01(arr: np.ndarray) -> np.ndarray:
    mn, mx = arr.min(), arr.max()
    if mx == mn:
        return np.zeros_like(arr)
    return (arr - mn) / (mx - mn)

@app.post("/analyze")
async def analyze(file: UploadFile = File(...)):
    allowed = (".mp3", ".wav", ".flac", ".m4a", ".ogg")
    if not file.filename.lower().endswith(allowed):
        raise HTTPException(400, "Unsupported file type.")

    suffix = os.path.splitext(file.filename)[1]
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        tmp.write(await file.read())
        tmp_path = tmp.name

    try:
        # Load
        y, sr = librosa.load(tmp_path, sr=SR)
        if len(y) == 0:
            raise HTTPException(400, "Audio file is empty.")
        y = librosa.util.normalize(y)
        duration = len(y) / sr

        # ── Tempo & Beats ──────────────────────────────────────────
        tempo_arr, beat_frames = librosa.beat.beat_track(y=y, sr=sr, hop_length=HOP_LENGTH)
        tempo = float(np.asarray(tempo_arr).flatten()[0])
        beat_times = librosa.frames_to_time(beat_frames, sr=sr, hop_length=HOP_LENGTH).tolist()

        # ── RMS Energy ────────────────────────────────────────────
        rms = librosa.feature.rms(y=y, frame_length=N_FFT, hop_length=HOP_LENGTH)[0]
        rms_times = librosa.times_like(rms, sr=sr, hop_length=HOP_LENGTH)
        loudness_lufs = rms_to_lufs(float(np.mean(rms)))
        dynamic_range = round(float(20 * np.log10((rms.max() + 1e-9) / (rms.mean() + 1e-9))), 1)

        # ── Waveform (downsampled) ─────────────────────────────────
        waveform_ds = downsample(y, 2000)
        waveform_times = np.linspace(0, duration, len(waveform_ds)).tolist()

        # ── Spectral Features ─────────────────────────────────────
        centroid  = librosa.feature.spectral_centroid(y=y, sr=sr, hop_length=HOP_LENGTH)[0]
        rolloff   = librosa.feature.spectral_rolloff(y=y, sr=sr, hop_length=HOP_LENGTH)[0]
        bandwidth = librosa.feature.spectral_bandwidth(y=y, sr=sr, hop_length=HOP_LENGTH)[0]
        zcr       = librosa.feature.zero_crossing_rate(y, hop_length=HOP_LENGTH)[0]
        spec_times = librosa.times_like(centroid, sr=sr, hop_length=HOP_LENGTH)

        # ── Onset Strength ─────────────────────────────────────────
        onset_env = librosa.onset.onset_strength(y=y, sr=sr, hop_length=HOP_LENGTH)
        onset_times_arr = librosa.times_like(onset_env, sr=sr, hop_length=HOP_LENGTH)

        # ── Chroma ────────────────────────────────────────────────
        chroma = librosa.feature.chroma_cqt(y=y, sr=sr, hop_length=HOP_LENGTH)
        chroma_mean = chroma.mean(axis=1)
        key_name, key_confidence = detect_key(chroma_mean)

        # ── MFCC ──────────────────────────────────────────────────
        mfcc = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=13, hop_length=HOP_LENGTH)
        mfcc_mean = mfcc.mean(axis=1).tolist()
        mfcc_times = librosa.times_like(mfcc[0], sr=sr, hop_length=HOP_LENGTH)

        # ── Mel Spectrogram (heatmap as 2D array, downsampled cols) ─
        mel = librosa.feature.melspectrogram(y=y, sr=sr, n_fft=N_FFT, hop_length=HOP_LENGTH, n_mels=64, fmax=FMAX)
        mel_db = librosa.power_to_db(mel, ref=np.max, top_db=TOP_DB)
        # Downsample time axis to 300 columns
        n_cols = min(300, mel_db.shape[1])
        col_idx = np.linspace(0, mel_db.shape[1]-1, n_cols, dtype=int)
        mel_grid = mel_db[:, col_idx].tolist()  # shape [64, 300]

        # ── Build time series for charts (downsampled) ─────────────
        n = 600
        rms_ds         = downsample(rms, n)
        rms_t_ds       = downsample(rms_times, n)
        centroid_ds    = downsample(normalize_to_01(centroid) * FMAX, n)
        rolloff_ds     = downsample(normalize_to_01(rolloff)  * FMAX, n)
        bandwidth_ds   = downsample(normalize_to_01(bandwidth) * FMAX, n)
        zcr_ds         = downsample(zcr, n)
        spec_t_ds      = downsample(spec_times, n)
        onset_ds       = downsample(onset_env, n)
        onset_t_ds     = downsample(onset_times_arr, n)
        chroma_t_ds    = downsample(librosa.times_like(chroma[0], sr=sr, hop_length=HOP_LENGTH), n)

        # Chroma: 12 rows × n cols
        chroma_grid = [downsample(chroma[i], n) for i in range(12)]

        # MFCC: 13 rows × n cols
        mfcc_grid = [downsample(mfcc[i], min(n, mfcc.shape[1])) for i in range(13)]
        mfcc_t_ds = downsample(mfcc_times, min(n, len(mfcc_times)))

        return JSONResponse({
            # ── Meta ─────────────────────────────────────────────
            "song_name": file.filename,
            "duration": round(duration, 2),
            "tempo": round(tempo, 1),
            "key": key_name,
            "key_confidence": key_confidence,
            "loudness_lufs": loudness_lufs,
            "dynamic_range_db": dynamic_range,
            "avg_energy": round(float(np.mean(rms)), 4),
            "max_energy": round(float(np.max(rms)), 4),
            "avg_centroid_hz": round(float(np.mean(centroid)), 1),
            "avg_zcr": round(float(np.mean(zcr)), 4),
            "beat_count": len(beat_times),

            # ── Time Series ───────────────────────────────────────
            "waveform": {
                "times": waveform_times,
                "values": waveform_ds,
            },
            "rms": {
                "times": rms_t_ds,
                "values": rms_ds,
            },
            "spectral": {
                "times": spec_t_ds,
                "centroid": centroid_ds,
                "rolloff": rolloff_ds,
                "bandwidth": bandwidth_ds,
                "zcr": zcr_ds,
            },
            "onset": {
                "times": onset_t_ds,
                "strength": onset_ds,
            },
            "beat_times": beat_times[:200],  # first 200 beats max

            # ── Grids ─────────────────────────────────────────────
            "chroma": {
                "times": chroma_t_ds,
                "labels": KEYS,
                "grid": chroma_grid,   # [12][n]
            },
            "mfcc": {
                "times": mfcc_t_ds,
                "mean": mfcc_mean,
                "grid": mfcc_grid,     # [13][n]
            },
            "mel": {
                "grid": mel_grid,      # [64][300]
                "n_cols": n_cols,
                "n_rows": 64,
            },
        })
    finally:
        os.unlink(tmp_path)

@app.get("/health")
async def health():
    return {"status": "ok"}
