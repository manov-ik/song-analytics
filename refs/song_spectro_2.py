import os
import glob
import numpy as np
import librosa
import librosa.display
import matplotlib.pyplot as plt
from matplotlib.backends.backend_pdf import PdfPages

# ─────────────────────────────────────────────
# AUDIO ANALYSIS SETTINGS
# ─────────────────────────────────────────────

SR = 22050

# Higher = better frequency detail
N_FFT = 4096

# Lower = better time detail
HOP_LENGTH = 512

# Mel bands
N_MELS = 256

# Frequency display range
FMAX = 8000

# Dynamic range for visualization
TOP_DB = 80


# ─────────────────────────────────────────────
# SELF SIMILARITY MATRIX
# ─────────────────────────────────────────────

def generate_self_similarity(y, sr):
    """
    Generates recurrence/self-similarity matrix.
    Helps visualize repeated song structures.
    """

    chroma = librosa.feature.chroma_cqt(
        y=y,
        sr=sr,
        hop_length=HOP_LENGTH
    )

    recurrence = librosa.segment.recurrence_matrix(
        chroma,
        mode='affinity',
        sym=True
    )

    return recurrence


# ─────────────────────────────────────────────
# MAIN PAGE GENERATOR
# ─────────────────────────────────────────────

def generate_song_analysis_page(file_path, pdf_instance):

    song_name = os.path.basename(file_path)

    print(f"Analyzing: {song_name}")

    try:

        # ─────────────────────────────────────
        # LOAD + NORMALIZE AUDIO
        # ─────────────────────────────────────

        y, sr = librosa.load(file_path, sr=SR)

        if len(y) == 0:
            print("Empty file.")
            return

        # Normalize loudness
        y = librosa.util.normalize(y)

        # ─────────────────────────────────────
        # STFT
        # ─────────────────────────────────────

        stft = librosa.stft(
            y,
            n_fft=N_FFT,
            hop_length=HOP_LENGTH
        )

        stft_db = librosa.amplitude_to_db(
            np.abs(stft),
            ref=np.max,
            top_db=TOP_DB
        )

        # ─────────────────────────────────────
        # MEL SPECTROGRAM
        # ─────────────────────────────────────

        mel_spec = librosa.feature.melspectrogram(
            y=y,
            sr=sr,
            n_fft=N_FFT,
            hop_length=HOP_LENGTH,
            n_mels=N_MELS,
            fmax=FMAX
        )

        mel_db = librosa.power_to_db(
            mel_spec,
            ref=np.max,
            top_db=TOP_DB
        )

        # ─────────────────────────────────────
        # RMS ENERGY CURVE
        # ─────────────────────────────────────

        rms = librosa.feature.rms(
            y=y,
            frame_length=N_FFT,
            hop_length=HOP_LENGTH
        )[0]

        times = librosa.times_like(rms, sr=sr, hop_length=HOP_LENGTH)

        # ─────────────────────────────────────
        # ONSET DETECTION
        # ─────────────────────────────────────

        onset_frames = librosa.onset.onset_detect(
            y=y,
            sr=sr,
            hop_length=HOP_LENGTH
        )

        onset_times = librosa.frames_to_time(
            onset_frames,
            sr=sr,
            hop_length=HOP_LENGTH
        )

        # ─────────────────────────────────────
        # SELF SIMILARITY MATRIX
        # ─────────────────────────────────────

        recurrence = generate_self_similarity(y, sr)

        # ─────────────────────────────────────
        # CREATE FIGURE
        # ─────────────────────────────────────

        fig, axes = plt.subplots(
            4,
            1,
            figsize=(14, 12)
        )

        fig.suptitle(
            f"Artist Sonic Analysis: {song_name}",
            fontsize=16,
            fontweight='bold'
        )

        # ─────────────────────────────────────
        # 1. LOG SPECTROGRAM
        # ─────────────────────────────────────

        librosa.display.specshow(
            stft_db,
            sr=sr,
            hop_length=HOP_LENGTH,
            x_axis='time',
            y_axis='log',
            cmap='magma',
            ax=axes[0]
        )

        axes[0].set_title(
            "Log-Frequency Spectrogram"
        )

        axes[0].set_ylim(20, FMAX)

        # Draw onset markers
        for t in onset_times:
            axes[0].axvline(
                x=t,
                color='cyan',
                alpha=0.15,
                linewidth=0.5
            )

        # ─────────────────────────────────────
        # 2. MEL SPECTROGRAM
        # ─────────────────────────────────────

        librosa.display.specshow(
            mel_db,
            sr=sr,
            hop_length=HOP_LENGTH,
            x_axis='time',
            y_axis='mel',
            cmap='magma',
            ax=axes[1]
        )

        axes[1].set_title(
            "Mel Spectrogram (Perceptual View)"
        )

        # ─────────────────────────────────────
        # 3. RMS ENERGY CURVE
        # ─────────────────────────────────────

        axes[2].plot(times, rms)

        axes[2].set_title(
            "Energy Flow Across Time"
        )

        axes[2].set_xlabel("Time")

        axes[2].set_ylabel("Energy")

        # ─────────────────────────────────────
        # 4. SELF SIMILARITY MATRIX
        # ─────────────────────────────────────

        librosa.display.specshow(
            recurrence,
            x_axis='time',
            y_axis='time',
            cmap='inferno',
            ax=axes[3]
        )

        axes[3].set_title(
            "Self Similarity Matrix (Song Structure)"
        )

        # ─────────────────────────────────────
        # CLEAN LAYOUT
        # ─────────────────────────────────────

        plt.tight_layout(
            rect=[0, 0, 1, 0.96]
        )

        # Save to PDF
        pdf_instance.savefig(fig)

        plt.close(fig)

        # ─────────────────────────────────────
        # SAVE RAW DATA FOR ML
        # ─────────────────────────────────────

        base_name = os.path.splitext(song_name)[0]

        os.makedirs("saved_features", exist_ok=True)

        np.save(
            f"saved_features/{base_name}_mel.npy",
            mel_db
        )

        np.save(
            f"saved_features/{base_name}_stft.npy",
            stft_db
        )

        np.save(
            f"saved_features/{base_name}_recurrence.npy",
            recurrence
        )

    except Exception as e:

        print(f"Error processing {song_name}: {e}")

        plt.close()


# ─────────────────────────────────────────────
# MAIN EXPORT FUNCTION
# ─────────────────────────────────────────────

def export_artist_analysis(root_folder, output_pdf):

    extensions = (
        '*.mp3',
        '*.wav',
        '*.flac',
        '*.m4a',
        '*.ogg'
    )

    audio_files = []

    for ext in extensions:
        audio_files.extend(
            glob.glob(
                os.path.join(root_folder, '**', ext),
                recursive=True
            )
        )

    if not audio_files:
        print("No audio files found.")
        return

    print(f"Found {len(audio_files)} songs.")

    with PdfPages(output_pdf) as pdf:

        for i, file_path in enumerate(audio_files):

            print(f"[{i+1}/{len(audio_files)}]")

            generate_song_analysis_page(
                file_path,
                pdf
            )

    print(f"\nSaved analysis booklet to: {output_pdf}")


# ─────────────────────────────────────────────
# ENTRY POINT
# ─────────────────────────────────────────────

if __name__ == '__main__':

    TARGET_FOLDER = "./songs"

    OUTPUT_PDF = "artist_deep_analysis.pdf"

    export_artist_analysis(
        TARGET_FOLDER,
        OUTPUT_PDF
    )