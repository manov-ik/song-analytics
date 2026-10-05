#!/usr/bin/env python3
"""
Generate Energy Flow PDF Booklet
-------------------------------
Compiles all songs' energy profiles (RMS energy curves) into a single,
high-fidelity A4 Landscape PDF booklet. Fits all songs into a maximum of 4 pages
using a dynamic layout. Replicates the visual style of song_deep_pdf_gen.py.
"""

import os
import sys
import glob
import math
import argparse
import datetime
import traceback
import numpy as np
import matplotlib.pyplot as plt
from matplotlib.backends.backend_pdf import PdfPages

# Audio Settings
SR = 22050
HOP_LENGTH = 512
N_FFT = 2048

# Color Themes
THEMES = {
    "light": {
        "bg": "#ffffff",
        "panel_bg": "#ffffff",
        "border": "#cccccc",
        "text": "#000000",
        "subtext": "#555555",
        "accent": "C0",            # Standard Matplotlib Blue
        "grid": "#cccccc",
        "grid_alpha": 0.5,
        "use_fill": False,
        "fill_alpha": 0.0
    },
    "dark": {
        "bg": "#0f172a",          # Slate 900
        "panel_bg": "#1e293b",    # Slate 800
        "border": "#334155",      # Slate 700
        "text": "#f8fafc",        # Slate 50
        "subtext": "#94a3b8",     # Slate 400
        "accent": "#06b6d4",      # Cyan 500
        "grid": "#334155",
        "grid_alpha": 0.4,
        "use_fill": True,
        "fill_alpha": 0.15
    }
}

def clean_title(base_name):
    """Clean filenames to build professional titles."""
    name = base_name
    name = os.path.splitext(name)[0]
    
    # Remove known suffixes
    suffixes = [
        "_rms", "_mel", "_stft", "_centroid", "_rolloff", "_bandwidth", 
        "_zcr", "_chroma", "_mfcc", "_recurrence", "_tempo"
    ]
    for suffix in suffixes:
        if name.endswith(suffix):
            name = name[:-len(suffix)]
            
    # Clean website promotional tags
    tags = [
        "MassTamilan.com", "MassTamilan.fm", "MassTamilan.dev", 
        "MassTamilan", "com", "fm", "dev"
    ]
    for tag in tags:
        name = name.replace(tag, "")
        name = name.replace(tag.lower(), "")
        name = name.replace(tag.upper(), "")

    # Clean punctuation and spacing
    name = name.replace("_", " ").replace("-", " ")
    name = " ".join(name.split())
    return name.title()

def format_time(sec):
    """Format seconds into m:ss format."""
    m = int(sec // 60)
    s = int(sec % 60)
    return f"{m}:{s:02d}"

def auto_detect_sources():
    """Detect available folders containing features or raw audio."""
    # Checked in order of preference
    feature_dirs = ["./saved_features", "./saved_features_others", "./saved_features_sogg"]
    for d in feature_dirs:
        if os.path.isdir(d):
            rms_files = glob.glob(os.path.join(d, "*_rms.npy"))
            if rms_files:
                return "features", d
                
    audio_dirs = ["./songs", "./songs_others", "./sogg"]
    for d in audio_dirs:
        if os.path.isdir(d):
            audio_files = []
            for ext in ["*.mp3", "*.wav", "*.flac", "*.m4a", "*.ogg"]:
                audio_files.extend(glob.glob(os.path.join(d, "**", ext), recursive=True))
            if audio_files:
                return "audio", d
                
    return None, None

def load_songs_from_features(features_dir):
    """Load RMS and tempo data from pre-saved feature directories."""
    print(f"Scanning features directory: {features_dir}")
    rms_files = sorted(glob.glob(os.path.join(features_dir, "*_rms.npy")))
    
    songs = []
    for r_file in rms_files:
        try:
            base = os.path.basename(r_file).replace("_rms.npy", "")
            
            # Load RMS array
            rms = np.load(r_file).squeeze()
            if rms.ndim > 1:
                rms = rms.mean(axis=0) # fallback in case of multi-channel
                
            # Read duration
            duration = (len(rms) * HOP_LENGTH) / SR
            
            # Load Tempo if available
            tempo = 0.0
            tempo_file = os.path.join(features_dir, f"{base}_tempo.npy")
            if os.path.exists(tempo_file):
                tempo_arr = np.load(tempo_file)
                tempo = float(tempo_arr.flatten()[0])
            
            songs.append({
                "name": base,
                "rms": rms,
                "duration": duration,
                "tempo": tempo,
                "avg_energy": float(np.mean(rms)),
                "max_energy": float(np.max(rms))
            })
        except Exception as e:
            print(f"Warning: Failed to load features for {r_file}: {e}")
            
    return songs

def process_songs_from_audio(audio_dir):
    """Extract RMS and tempo from raw audio files recursively."""
    print(f"Scanning audio directory: {audio_dir}")
    import librosa
    
    extensions = ["*.mp3", "*.wav", "*.flac", "*.m4a", "*.ogg"]
    audio_files = []
    for ext in extensions:
        audio_files.extend(glob.glob(os.path.join(audio_dir, "**", ext), recursive=True))
    audio_files = sorted(audio_files)
    
    songs = []
    for idx, path in enumerate(audio_files):
        base = os.path.splitext(os.path.basename(path))[0]
        print(f"[{idx+1}/{len(audio_files)}] Processing audio: {base}")
        try:
            y, sr = librosa.load(path, sr=SR)
            if len(y) == 0:
                print(f"  Skipping (empty file)")
                continue
                
            y = librosa.util.normalize(y)
            
            # Compute RMS
            rms = librosa.feature.rms(y=y, frame_length=N_FFT, hop_length=HOP_LENGTH)[0]
            duration = len(y) / sr
            
            # Compute Tempo
            tempo, _ = librosa.beat.beat_track(y=y, sr=sr, hop_length=HOP_LENGTH)
            if isinstance(tempo, np.ndarray):
                tempo = tempo[0]
            tempo = float(tempo)
            
            songs.append({
                "name": base,
                "rms": rms,
                "duration": duration,
                "tempo": tempo,
                "avg_energy": float(np.mean(rms)),
                "max_energy": float(np.max(rms))
            })
        except Exception as e:
            print(f"Error processing {path}: {e}")
            traceback.print_exc()
            
    return songs

def main():
    parser = argparse.ArgumentParser(description="Generate A4 Landscape PDF booklet containing music energy flow graphs.")
    parser.add_argument("--features-dir", type=str, help="Path to pre-extracted numpy features folder.")
    parser.add_argument("--audio-dir", type=str, help="Path to raw audio folder.")
    parser.add_argument("--output", type=str, default="song_energy_flow_booklet.pdf", help="Output PDF filename.")
    parser.add_argument("--theme", type=str, choices=["dark", "light"], default="light", help="Color theme (dark or light).")
    args = parser.parse_args()
    
    # 1. Determine Input Source
    source_type, source_path = None, None
    if args.features_dir:
        source_type = "features"
        source_path = args.features_dir
    elif args.audio_dir:
        source_type = "audio"
        source_path = args.audio_dir
    else:
        source_type, source_path = auto_detect_sources()
        if not source_type:
            print("Error: Could not auto-detect any features or audio folders.")
            print("Please specify source folder using --features-dir or --audio-dir.")
            sys.exit(1)
        print(f"Auto-detected input source: {source_type} at {source_path}")
        
    # 2. Load Songs
    if source_type == "features":
        songs = load_songs_from_features(source_path)
    else:
        songs = process_songs_from_audio(source_path)
        
    if not songs:
        print("No valid song data loaded. Exiting.")
        sys.exit(1)
        
    print(f"Loaded {len(songs)} songs. Generating PDF: {args.output}")
    
    # 3. Layout configuration (enforcing exactly 4 songs per page)
    songs_per_page = 4
    total_pages = int(math.ceil(len(songs) / songs_per_page))
    
    # 4. Apply Matplotlib Theme Settings
    theme = THEMES[args.theme]
    plt.rcParams.update({
        "figure.facecolor": theme["bg"],
        "axes.facecolor": theme["panel_bg"],
        "axes.edgecolor": theme["border"],
        "axes.labelcolor": theme["text"],
        "xtick.color": theme["subtext"],
        "ytick.color": theme["subtext"],
        "text.color": theme["text"],
        "grid.color": theme["grid"],
        "grid.linewidth": 0.5,
        "font.family": "sans-serif",
    })
    
    # 5. Render PDF Pages
    with PdfPages(args.output) as pdf:
        for page_idx in range(total_pages):
            print(f"Rendering page {page_idx + 1} of {total_pages}...")
            
            # A4 Landscape size: 11.69 x 8.27 inches
            fig, axes = plt.subplots(
                songs_per_page, 1, 
                figsize=(11.69, 8.27),
                gridspec_kw={
                    "top": 0.88, 
                    "bottom": 0.08, 
                    "left": 0.07, 
                    "right": 0.93, 
                    "hspace": 0.50
                }
            )
            
            # Normalize axes array
            if songs_per_page == 1:
                axes = [axes]
                
            start_song_idx = page_idx * songs_per_page
            
            for plot_idx in range(songs_per_page):
                ax = axes[plot_idx]
                song_idx = start_song_idx + plot_idx
                
                if song_idx < len(songs):
                    song = songs[song_idx]
                    rms = song["rms"]
                    duration = song["duration"]
                    
                    t_rms = np.linspace(0, duration, len(rms))
                    
                    # Plot Curve
                    ax.plot(t_rms, rms, color=theme["accent"], linewidth=1)
                    if theme["use_fill"]:
                        ax.fill_between(
                            t_rms, rms, 
                            color=theme["accent"], 
                            alpha=theme["fill_alpha"]
                        )
                    
                    # Style Subplot to match song_deep_pdf_gen.py style
                    ax.set_title("Energy Flow", loc="center", fontsize=10, pad=4)
                    ax.set_title(f"{song_idx + 1}. {clean_title(song['name'])}", loc="left", fontsize=11, fontweight="bold", pad=4)
                    
                    # Extra stats on the right title
                    stats_text = f"Tempo: {song['tempo']:.1f} BPM  |  Avg: {song['avg_energy']:.3f}  Max: {song['max_energy']:.3f}"
                    ax.set_title(stats_text, loc="right", fontsize=9, color=theme["subtext"], pad=4)
                    
                    ax.set_ylabel("Energy", fontsize=9)
                    ax.set_xlabel("Time (mm:ss)", fontsize=9)
                    ax.set_xlim(0, duration)
                    ax.set_ylim(0, max(0.1, float(np.max(rms)) * 1.15))
                    
                    # Exact 15-second tick interval style from song_deep_pdf_gen.py
                    ticks_sec = np.arange(0, duration + 1, 15)
                    tick_labels = [format_time(t) for t in ticks_sec]
                    
                    ax.set_xticks(ticks_sec)
                    ax.set_xticklabels(tick_labels, fontsize=8)
                    ax.grid(True, which="both", axis="both", alpha=theme["grid_alpha"])
                    
                    # Clean borders
                    for spine in ax.spines.values():
                        spine.set_linewidth(0.8)
                else:
                    # Hide empty axes on the last page to keep consistent heights
                    ax.set_visible(False)
                    
         
            
            # Header line
            hdr_ax = fig.add_axes([0.07, 0.915, 0.86, 0.001])
            hdr_ax.axis("off")
            hdr_ax.axhline(0, color=theme["border"], linewidth=0.8)
            
            # Add Page Footer
            source_display_name = os.path.basename(source_path.rstrip("/\\"))
            fig.text(
                0.07, 0.03, 
                f"Source: {source_type.title()} ({source_display_name})  |  {len(songs)} tracks total", 
                fontsize=8.5, color=theme["subtext"], ha="left"
            )
            fig.text(
                0.93, 0.03, 
                f"Page {page_idx + 1} of {total_pages}", 
                fontsize=8.5, color=theme["subtext"], ha="right"
            )
            
            # Footer line
            ftr_ax = fig.add_axes([0.07, 0.055, 0.86, 0.001])
            ftr_ax.axis("off")
            ftr_ax.axhline(0, color=theme["border"], linewidth=0.8)
            
            # Save figure to PDF using tight layout boundaries
            pdf.savefig(fig, facecolor=theme["bg"])
            plt.close(fig)
            
    print(f"Success: PDF generated successfully -> {args.output}")

if __name__ == "__main__":
    main()
