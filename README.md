# 🎵 Song Analytics

**Song Analytics** is a full-stack web application that allows users to upload audio files (MP3, WAV, FLAC, etc.) and instantly receive deep, mathematical acoustic analysis. 

The application is built with a blazing-fast **Next.js** frontend styled with **Tailwind CSS** (featuring a premium, minimalist SaaS aesthetic) and powered by a **FastAPI** Python backend utilizing the industry-standard **Librosa** audio processing library.

---

## ✨ Features & Analysis Capabilities

When you upload a track, the engine processes the audio and returns a detailed dashboard of interactive charts. Here is exactly what the app tells you about your music:

### 1. Overview & Core Metrics
* **Tempo (BPM):** Calculates the exact beats-per-minute of the track.
* **Key & Scale Detection:** Identifies the musical key (e.g., C Major, F# Minor) using the Krumhansl-Schmuckler key-finding algorithm.
* **RMS Energy:** Plots the loudness and dynamic range over time, overlaid with detected beat events.

### 2. Spectral Analysis
* **Spectrogram:** A visual representation of the spectrum of frequencies as it varies with time. 
* **Spectral Centroid:** The "center of mass" of the spectrum, indicating the perceived "brightness" of the sound.
* **Spectral Rolloff:** The frequency below which 85% of the spectral energy lies, useful for distinguishing harmonic from noisy sounds.

### 3. Harmonic Content
* **Chroma Features:** Projects the entire audio spectrum onto 12 bins representing the 12 distinct semitones (pitch classes) of the musical octave. This shows exactly which notes are most prominent throughout the song.
* **Harmonic & Percussive Separation:** Separates the audio into harmonic (melodic) components and percussive (rhythmic) transients.

### 4. Timbral Fingerprint
* **MFCC (Mel-Frequency Cepstral Coefficients):** Extracts 13 coefficients that compactly represent the short-term power spectrum of the sound. MFCCs capture the exact "texture" or "timbre" of the song (e.g., vocal character, instrument richness).
* **Loudness (LUFS):** Estimates the overall perceived loudness of the track.
* **Zero Crossing Rate (ZCR):** Tracks the rate of sign-changes along a signal, acting as a strong indicator of noisiness and percussive content.

### 5. Onset Detection
* Pinpoints the exact moments of sudden energy bursts (transients/beats), measuring the onset strength across the duration of the track.

---

## 🛠️ Technology Stack

**Frontend:**
* **Framework:** React + Next.js (App Router)
* **Styling:** Tailwind CSS
* **Typography:** Geist Sans & Geist Mono
* **Visualization:** Recharts (React wrapper for D3)

**Backend:**
* **Framework:** FastAPI (Python)
* **Audio Processing:** `librosa`
* **Math & Scientific:** `numpy`, `scipy`

---

## 🚀 Running Locally

You need two terminal windows open to run this project locally.

### 1. Start the Backend
```bash
cd song-analytics
# Create and activate a virtual environment
python3 -m venv venv
source venv/bin/activate
# Install dependencies
pip install -r requirements.txt
# Run the FastAPI server
uvicorn main:app --reload
```
*The API will run on `http://localhost:8000`*

### 2. Start the Frontend
```bash
cd song-analytics/frontend
# Install dependencies
npm install
# Run the development server
npm run dev
```
*The app will run on `http://localhost:3000`*

---

## 🌍 Deployment Guide

**Warning:** You cannot deploy the FastAPI backend on Vercel. Vercel's Serverless Functions (AWS Lambda) have a strict 250MB limit for uncompressed packages. `librosa` and `scipy` alone exceed 300MB, causing Vercel builds to fail.

Here is the correct deployment strategy:

### Deploy the Backend to Render (Free)
Render uses standard Docker containers without the severe size limits.
1. Push your repository to GitHub.
2. Go to **Render.com** and create a **Web Service**.
3. Select your repository.
4. **Build Command:** `pip install -r requirements.txt`
5. **Start Command:** `uvicorn main:app --host 0.0.0.0 --port 10000`
6. Once deployed, copy your Render URL.

### Deploy the Frontend to Vercel (Free)
1. Go to **Vercel.com** and create a new Project.
2. Select your repository.
3. Edit the **Root Directory** to point to the `frontend` folder.
4. Add an Environment Variable:
   - **Name:** `NEXT_PUBLIC_API_URL`
   - **Value:** *[Your Render URL]*
5. Click **Deploy**.

Your blazing-fast Vercel frontend will now communicate seamlessly with your heavy-lifting Render Python backend.
