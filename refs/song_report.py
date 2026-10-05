import os
import glob
import traceback

import librosa
import numpy as np
import pandas as pd

from sklearn.preprocessing import StandardScaler
from sklearn.decomposition import PCA
from sklearn.cluster import KMeans

import matplotlib.pyplot as plt

SONG_FOLDER = "./songs_others"
OUTPUT_DIR = "./artist_report_others"

os.makedirs(OUTPUT_DIR, exist_ok=True)

rows = []

audio_files = []

for ext in ["*.mp3", "*.wav", "*.flac", "*.m4a", "*.ogg"]:
    audio_files.extend(
        glob.glob(
            os.path.join(
                SONG_FOLDER,
                "**",
                ext
            ),
            recursive=True
        )
    )

print(f"Found {len(audio_files)} songs")

for file_path in audio_files:

    try:

        song_name = os.path.basename(file_path)

        print(f"Processing: {song_name}")

        y, sr = librosa.load(
            file_path,
            sr=22050
        )

        if len(y) == 0:
            print("Empty file")
            continue

        y = librosa.util.normalize(y)

        # ----------------------------
        # Tempo
        # ----------------------------

        tempo, _ = librosa.beat.beat_track(
            y=y,
            sr=sr
        )

        tempo = float(
            np.asarray(tempo).squeeze()
        )

        # ----------------------------
        # Features
        # ----------------------------

        rms = librosa.feature.rms(y=y)

        centroid = librosa.feature.spectral_centroid(
            y=y,
            sr=sr
        )

        bandwidth = librosa.feature.spectral_bandwidth(
            y=y,
            sr=sr
        )

        zcr = librosa.feature.zero_crossing_rate(y)

        mfcc = librosa.feature.mfcc(
            y=y,
            sr=sr,
            n_mfcc=13
        )

        row = {
            "song": song_name,
            "tempo": tempo,
            "rms": float(np.mean(rms)),
            "centroid": float(np.mean(centroid)),
            "bandwidth": float(np.mean(bandwidth)),
            "zcr": float(np.mean(zcr))
        }

        for i in range(13):
            row[f"mfcc_{i+1}"] = float(
                np.mean(mfcc[i])
            )

        rows.append(row)

        print("✓ Success")

    except Exception:

        print(f"\nFAILED: {song_name}")
        traceback.print_exc()

        continue

# ---------------------------------
# Build DataFrame
# ---------------------------------

df = pd.DataFrame(rows)

print("\nRows extracted:", len(df))

if len(df) == 0:
    raise Exception(
        "No songs processed successfully."
    )

# Save raw features

df.to_csv(
    os.path.join(
        OUTPUT_DIR,
        "artist_features.csv"
    ),
    index=False
)

print("artist_features.csv saved")

# ---------------------------------
# Numeric features only
# ---------------------------------

numeric_df = df.select_dtypes(
    include=np.number
)

# ---------------------------------
# Correlation Heatmap
# ---------------------------------

corr = numeric_df.corr()

plt.figure(figsize=(12, 10))

plt.imshow(
    corr,
    aspect="auto"
)

plt.colorbar()

plt.xticks(
    range(len(corr.columns)),
    corr.columns,
    rotation=90
)

plt.yticks(
    range(len(corr.columns)),
    corr.columns
)

plt.tight_layout()

plt.savefig(
    os.path.join(
        OUTPUT_DIR,
        "correlation_heatmap.png"
    )
)

plt.close()

# ---------------------------------
# PCA
# ---------------------------------

X = StandardScaler().fit_transform(
    numeric_df
)

pca = PCA(
    n_components=2
)

points = pca.fit_transform(X)

plt.figure(figsize=(10, 8))

for i, song in enumerate(df["song"]):

    plt.scatter(
        points[i, 0],
        points[i, 1]
    )

    plt.text(
        points[i, 0],
        points[i, 1],
        song[:15],
        fontsize=8
    )

plt.title(
    "Artist Song Map (PCA)"
)

plt.savefig(
    os.path.join(
        OUTPUT_DIR,
        "song_map_pca.png"
    )
)

plt.close()

# ---------------------------------
# KMeans
# ---------------------------------

clusters = KMeans(
    n_clusters=min(3, len(df)),
    random_state=42,
    n_init=20
).fit_predict(X)

df["cluster"] = clusters

df.to_csv(
    os.path.join(
        OUTPUT_DIR,
        "song_clusters.csv"
    ),
    index=False
)

# ---------------------------------
# Artist Fingerprint
# ---------------------------------

artist_profile = numeric_df.mean()

artist_profile.to_csv(
    os.path.join(
        OUTPUT_DIR,
        "artist_fingerprint.csv"
    )
)

print("\nDone.")
print(f"Results saved to {OUTPUT_DIR}")