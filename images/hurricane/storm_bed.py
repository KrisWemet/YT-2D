#!/usr/bin/env python3
"""Procedural stormy-beach bed (waves + gusting wind), 22 s -> public/hurricane/sfx/storm_bed.wav"""
import wave
import numpy as np
SR = 48000; D = 22.0; n = int(D * SR)
rng = np.random.default_rng(5)
t = np.arange(n) / SR
def onepole_lp(x, fc):
    a = np.exp(-2 * np.pi * fc / SR); y = np.zeros_like(x); s = 0.0
    for i in range(len(x)): s = (1 - a) * x[i] + a * s; y[i] = s
    return y
w = rng.standard_normal(n)
# waves: low rumble swelling every ~5.5 s, with a brighter crash on each swell
swell = 0.5 + 0.5 * np.sin(2 * np.pi * t / 5.5 - 1.2) ** 2
low = onepole_lp(w, 380) * swell
crash_env = np.zeros(n)
for c in np.arange(1.8, D, 5.5):
    crash_env += np.exp(-((t - c) / 0.7) ** 2) * (t > c - 1.5)
hi = (w - onepole_lp(w, 1500)) * crash_env * 0.35
# wind: band-ish noise with a slowly wandering brightness and gusts
gust = 0.55 + 0.45 * (0.5 + 0.5 * np.sin(2 * np.pi * t / 3.7 + 0.5)) * (0.6 + 0.4 * np.sin(2 * np.pi * t / 8.3))
w2 = rng.standard_normal(n)
wind = (onepole_lp(w2, 900) - onepole_lp(w2, 250)) * gust * 1.6
x = 0.9 * low / np.abs(low).max() + hi / (np.abs(hi).max() + 1e-9) * 0.5 + wind / np.abs(wind).max() * 0.6
f = int(0.5 * SR); x[:f] *= np.linspace(0, 1, f); x[-f:] *= np.linspace(1, 0, f)
x = x / np.abs(x).max() * 10 ** (-1 / 20)
with wave.open('../../public/hurricane/sfx/storm_bed.wav', 'wb') as wv:
    wv.setnchannels(1); wv.setsampwidth(2); wv.setframerate(SR); wv.writeframes((x * 32767).astype(np.int16).tobytes())
print('storm_bed written')
