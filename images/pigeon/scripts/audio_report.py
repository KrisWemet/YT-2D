#!/usr/bin/env python3
"""audio_report.py files... -> duration, peak/rms dBFS, envelope (100 ms), spectral centroid & flatness, dominant pitch"""
import sys, subprocess
import numpy as np
def load(f, sr=22050):
    pcm = subprocess.run(['ffmpeg', '-v', 'error', '-i', f, '-ac', '1', '-ar', str(sr), '-f', 'f32le', '-'], capture_output=True, check=True).stdout
    return np.frombuffer(pcm, np.float32), sr
for f in sys.argv[1:]:
    a, sr = load(f)
    if len(a) == 0: print(f, 'empty'); continue
    pk = 20 * np.log10(np.abs(a).max() + 1e-9); rms = 20 * np.log10(np.sqrt((a ** 2).mean()) + 1e-9)
    hop = int(0.1 * sr); n = len(a) // hop
    env = [20 * np.log10(np.sqrt((a[i * hop:(i + 1) * hop] ** 2).mean()) + 1e-9) for i in range(n)]
    spec = np.abs(np.fft.rfft(a[: min(len(a), sr * 4)] * np.hanning(min(len(a), sr * 4)))) + 1e-9
    fr = np.fft.rfftfreq(min(len(a), sr * 4), 1 / sr)
    cent = (spec * fr).sum() / spec.sum()
    flat = np.exp(np.log(spec).mean()) / spec.mean()
    top = fr[np.argsort(spec)[-5:]][::-1]
    print(f'{f}: {len(a)/sr:.2f}s peak {pk:.1f} rms {rms:.1f} centroid {cent:.0f}Hz flatness {flat:.3f} top {np.round(top).astype(int)}')
    print('   env', ' '.join(f'{e:.0f}' for e in env[:60]))
