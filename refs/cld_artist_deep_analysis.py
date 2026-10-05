import os
import glob
import numpy as np
import librosa
import matplotlib.pyplot as plt
import matplotlib.gridspec as gridspec
from matplotlib.backends.backend_pdf import PdfPages

SR         = 22050
HOP_LENGTH = 512
N_MELS     = 128
FMAX       = 8000

SAVE_FOLDER = "./saved_features_sogg"
OUTPUT_PDF  = "artist_deep_analysis_sogg.pdf"

# ── style ──────────────────────────────────────────────────────────────────────
BG        = "#ffffff"
PANEL_BG  = "#ffffff"
BORDER    = "#dddddd"
TEXT      = "#111111"
SUBTEXT   = "#888888"
ACCENT    = "#7e57e2"

plt.rcParams.update({
    "figure.facecolor":  BG,
    "axes.facecolor":    PANEL_BG,
    "axes.edgecolor":    BORDER,
    "axes.labelcolor":   TEXT,
    "xtick.color":       SUBTEXT,
    "ytick.color":       SUBTEXT,
    "text.color":        TEXT,
    "grid.color":        BORDER,
    "grid.linewidth":    0.5,
    "font.family":       "monospace",
})

def format_time(sec):
    m, s = int(sec // 60), int(sec % 60)
    return f"{m}:{s:02d}"

def load(base, name):
    path = os.path.join(SAVE_FOLDER, f"{base}_{name}.npy")
    return np.load(path) if os.path.exists(path) else None

def apply_ticks(ax, duration, interval=15, fontsize=7, axis="x"):
    ticks  = np.arange(0, duration + 1, interval)
    labels = [format_time(t) for t in ticks]
    if axis == "x":
        ax.set_xticks(ticks)
        ax.set_xticklabels(labels, fontsize=fontsize, rotation=0)
        ax.set_xlim(0, duration)
    else:
        ax.set_yticks(ticks)
        ax.set_yticklabels(labels, fontsize=fontsize)
        ax.set_ylim(0, duration)

def style_panel(ax, title, ylabel="", xlabel=""):
    ax.set_title(title, fontsize=9, color=TEXT, pad=6, loc="left")
    ax.set_ylabel(ylabel, fontsize=8, color=SUBTEXT)
    ax.set_xlabel(xlabel, fontsize=8, color=SUBTEXT)
    for spine in ax.spines.values():
        spine.set_edgecolor(BORDER)
        spine.set_linewidth(0.8)

# ─────────────────────────────────────────────────────────────────────────────
mel_files = sorted(glob.glob(os.path.join(SAVE_FOLDER, "*_mel.npy")))
print(f"Found {len(mel_files)} songs")

with PdfPages(OUTPUT_PDF) as pdf:
    for mel_file in mel_files:
        base = os.path.basename(mel_file).replace("_mel.npy", "")

        mel        = load(base, "mel")
        stft       = load(base, "stft")
        rms        = load(base, "rms")
        centroid   = load(base, "centroid")
        rolloff    = load(base, "rolloff")
        bandwidth  = load(base, "bandwidth")
        zcr        = load(base, "zcr")
        chroma     = load(base, "chroma")
        mfcc       = load(base, "mfcc")
        recurrence = load(base, "recurrence")
        beat_times = load(base, "beats")
        tempo_arr  = load(base, "tempo")

        if any(x is None for x in [mel, stft, rms, recurrence]):
            print(f"Skipping {base} — missing core features")
            continue

        rms      = rms.squeeze()
        duration = (len(rms) * HOP_LENGTH) / SR
        tempo    = float(tempo_arr[0]) if tempo_arr is not None else 0.0
        t_rms    = np.linspace(0, duration, len(rms))

        print(f"{base} | {duration:.1f}s | {tempo:.1f} BPM")

        # ═════════════════════════════════════════════════════════════════════
        # PAGE 1 — landscape, all panels equal height
        # ═════════════════════════════════════════════════════════════════════
        fig = plt.figure(figsize=(20, 14), constrained_layout=True, facecolor=BG)

        title_str = f"{base.upper()}   ·   {tempo:.1f} BPM   ·   {format_time(duration)}"
        fig.suptitle(title_str, fontsize=13, fontweight="bold", color=TEXT, x=0.01, ha="left")

        # 5 rows, equal height
        gs = gridspec.GridSpec(5, 1, figure=fig)
        ax_stft = fig.add_subplot(gs[0])
        ax_mel  = fig.add_subplot(gs[1])
        ax_rms  = fig.add_subplot(gs[2])
        ax_spec = fig.add_subplot(gs[3])
        ax_rec  = fig.add_subplot(gs[4])

        # ── 1. STFT ──────────────────────────────────────────────────────────
        ax_stft.imshow(stft, aspect="auto", origin="lower", cmap="magma",
                       extent=[0, duration, 0, SR / 2])
        ax_stft.set_ylim(0, FMAX)
        if beat_times is not None:
            for bt in beat_times:
                ax_stft.axvline(bt, color="white", alpha=0.12, linewidth=0.3)
        style_panel(ax_stft, "LOG SPECTROGRAM", ylabel="Hz")
        apply_ticks(ax_stft, duration)

        # ── 2. MEL — no centroid overlay ─────────────────────────────────────
        mel_freqs = librosa.mel_frequencies(n_mels=N_MELS, fmin=0, fmax=FMAX)
        ax_mel.imshow(mel, aspect="auto", origin="lower", cmap="magma",
                      extent=[0, duration, mel_freqs[0], mel_freqs[-1]])
        hz_ticks = [f for f in [100, 250, 500, 1000, 2000, 4000, 8000] if f <= FMAX]
        ax_mel.set_yticks(hz_ticks)
        ax_mel.set_yticklabels([str(f) for f in hz_ticks], fontsize=7)
        style_panel(ax_mel, "MEL SPECTROGRAM", ylabel="Hz")
        apply_ticks(ax_mel, duration)

        # ── 3. RMS ENERGY — full fill ─────────────────────────────────────────
        ax_rms.fill_between(t_rms, rms, alpha=0.85, color=ACCENT)
        ax_rms.plot(t_rms, rms, linewidth=0.6, color=ACCENT)
        ax_rms.set_xlim(0, duration)
        ax_rms.grid(axis="x", alpha=0.3)
        style_panel(ax_rms, "ENERGY FLOW  (RMS)", ylabel="RMS")
        apply_ticks(ax_rms, duration)

        # ── 4. SPECTRAL SHAPE ─────────────────────────────────────────────────
        if centroid is not None:
            t_c = np.linspace(0, duration, len(centroid))
            ax_spec.plot(t_c, centroid / SR * 2, color="#f0a500", linewidth=0.8, label="Centroid")
        if rolloff is not None:
            t_r = np.linspace(0, duration, len(rolloff))
            ax_spec.plot(t_r, rolloff / SR * 2,  color="#00e5ff", linewidth=0.8, label="Rolloff")
        if bandwidth is not None:
            t_b = np.linspace(0, duration, len(bandwidth))
            ax_spec.plot(t_b, bandwidth / SR * 2, color="#ff4081", linewidth=0.8, label="Bandwidth")
        ax_spec.set_xlim(0, duration)
        ax_spec.legend(fontsize=7, loc="upper right", framealpha=0.85,
                       labelcolor=TEXT, edgecolor=BORDER, bbox_to_anchor=(0.99, 0.99))
        ax_spec.grid(axis="x", alpha=0.3)
        style_panel(ax_spec, "SPECTRAL SHAPE  (centroid · rolloff · bandwidth, norm 0–1)")
        apply_ticks(ax_spec, duration)

        # ── 5. RECURRENCE ─────────────────────────────────────────────────────
        ax_rec.imshow(recurrence, origin="lower", cmap="hot", aspect="auto",
                      extent=[0, duration, 0, duration])
        apply_ticks(ax_rec, duration, axis="x")
        apply_ticks(ax_rec, duration, axis="y")
        style_panel(ax_rec, "SELF SIMILARITY  (diagonal blocks = repeated sections)",
                    ylabel="Time", xlabel="Time (mm:ss)")

        pdf.savefig(fig, bbox_inches="tight", facecolor=BG)
        plt.close()

        # ═════════════════════════════════════════════════════════════════════
        # PAGE 2 — landscape, derived data
        # ═════════════════════════════════════════════════════════════════════
        fig2 = plt.figure(figsize=(20, 14), constrained_layout=True, facecolor=BG)
        fig2.suptitle(f"{base.upper()}   ·   DERIVED ANALYSIS",
                      fontsize=13, fontweight="bold", color=TEXT, x=0.01, ha="left")

        gs2 = gridspec.GridSpec(3, 1, figure=fig2)
        ax_chroma = fig2.add_subplot(gs2[0])
        ax_mfcc   = fig2.add_subplot(gs2[1])
        ax_zcr    = fig2.add_subplot(gs2[2])   # now full width

        # ── CHROMA ────────────────────────────────────────────────────────────
        if chroma is not None:
            pitch_classes = ["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"]
            ax_chroma.imshow(chroma, aspect="auto", origin="lower", cmap="Reds",
                             extent=[0, duration, 0, 12], vmin=0, vmax=1)
            ax_chroma.set_yticks(np.arange(12) + 0.5)
            ax_chroma.set_yticklabels(pitch_classes, fontsize=7)
        style_panel(ax_chroma, "CHROMAGRAM  (pitch classes · harmonic content over time)")
        apply_ticks(ax_chroma, duration)

        # ── MFCC ──────────────────────────────────────────────────────────────
        if mfcc is not None:
            ax_mfcc.imshow(mfcc, aspect="auto", origin="lower", cmap="magma",
                           extent=[0, duration, 0, mfcc.shape[0]])
            ax_mfcc.set_ylabel("Coeff", fontsize=8, color=SUBTEXT)
        style_panel(ax_mfcc, "MFCC  (timbral fingerprint — vocal texture & instrument character)")
        apply_ticks(ax_mfcc, duration)

        # ── ZCR — full width ──────────────────────────────────────────────────
        if zcr is not None:
            t_zcr = np.linspace(0, duration, len(zcr))
            ax_zcr.fill_between(t_zcr, zcr, alpha=0.7, color="coral")
            ax_zcr.plot(t_zcr, zcr, linewidth=0.6, color="coral")
            ax_zcr.set_xlim(0, duration)
            ax_zcr.grid(axis="x", alpha=0.3)
        style_panel(ax_zcr,
                    "ZERO CROSSING RATE  (high = percussion/noise   low = vocals/tonal)",
                    ylabel="ZCR", xlabel="Time (mm:ss)")
        apply_ticks(ax_zcr, duration)

        pdf.savefig(fig2, bbox_inches="tight", facecolor=BG)
        plt.close()

        print(f"  Added: {base}")

print(f"Saved → {OUTPUT_PDF}")