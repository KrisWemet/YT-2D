#!/usr/bin/env python3
"""Procedural SFX for the hurricane Short -> public/hurricane/sfx/*.wav (48 kHz mono, peak -1 dBFS)"""
import subprocess, wave, shutil
import numpy as np
SR = 48000
OUT = '../../public/hurricane/sfx'
rng = np.random.default_rng(11)
def save(name, x):
    x = np.asarray(x, np.float64); f = int(0.003 * SR)
    if len(x) > 2 * f: x[:f] *= np.linspace(0, 1, f); x[-f:] *= np.linspace(1, 0, f)
    x = x / (np.abs(x).max() + 1e-12) * 10 ** (-1 / 20)
    with wave.open(f'{OUT}/{name}.wav', 'wb') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes((x * 32767).astype(np.int16).tobytes())
def tt(d): return np.arange(int(d * SR)) / SR
def noise(d): return rng.standard_normal(int(d * SR))
def sweep(f0, f1, d):
    t = tt(d); f = f0 * (f1 / f0) ** (t / d); return np.sin(2 * np.pi * np.cumsum(f) / SR)
def svf(x, fc, q=1.2, mode='lp'):
    fc = np.broadcast_to(np.asarray(fc, np.float64), x.shape); low = band = 0.0; y = np.zeros_like(x)
    for i in range(len(x)):
        f = 2 * np.sin(np.pi * min(fc[i], SR / 6) / SR); high = x[i] - low - band / q
        band += f * high; low += f * band; y[i] = low if mode == 'lp' else band
    return y
def env(d, tau, att=0.004):
    t = tt(d); return np.minimum(1, t / att) * np.exp(-t / tau)
# big boom (goes in the pause after "bomb")
d = 2.6; t = tt(d)
sub = sweep(70, 26, d) * env(d, 0.5, 0.006)
body = svf(noise(d), 3200 * (180 / 3200) ** np.minimum(t / 1.4, 1), 0.9) * env(d, 0.38, 0.003)
crack = np.zeros(int(d * SR))
for _ in range(90):
    s = int(rng.uniform(0.05, 1.8) * SR); n = int(0.004 * SR)
    crack[s:s + n] += rng.standard_normal(n) * np.exp(-((s / SR) / 0.7))
crack = svf(crack, 2000, 1.5, 'bp')
save('boom_big', 1.0 * sub + 0.9 * body + 0.35 * crack)
d = 0.8; t = tt(d)
save('boom_small', sweep(120, 45, d) * env(d, 0.14) + 0.8 * svf(noise(d), 2200 * (300 / 2200) ** (t / d), 0.9) * env(d, 0.12))
# fuse sizzle (3 s, loops fine)
d = 3.0; x = svf(noise(d), 5200, 2.0, 'bp')
am = np.ones(int(d * SR)) * 0.35
for _ in range(220):
    s = int(rng.uniform(0, d - 0.01) * SR); n = int(rng.uniform(0.002, 0.008) * SR)
    am[s:s + n] += rng.uniform(0.5, 1.6)
save('fuse', x * am)
# clock tick
d = 0.05
save('tick', svf(noise(d), 3500, 3, 'bp') * env(d, 0.004, 0.0005) + 0.5 * np.sin(2 * np.pi * 1250 * tt(d)) * env(d, 0.008, 0.0005))
# cartoon yawn: falling, wobbly tone with breath
d = 1.0; t = tt(d)
f = 420 * (150 / 420) ** (t / d) * (1 + 0.04 * np.sin(2 * np.pi * 6 * t))
ph = 2 * np.pi * np.cumsum(f) / SR
yawn = (np.sin(ph) + 0.3 * np.sin(2 * ph) + 0.15 * np.sin(3 * ph)) * np.sin(np.pi * np.minimum(t / d, 1)) ** 0.8
save('yawn', yawn + 0.15 * svf(noise(d), 900, 1.0, 'bp') * np.sin(np.pi * t / d))
# geiger counter: random clicks, density rising
d = 5.0; x = np.zeros(int(d * SR)); tcur = 0.0
while True:
    rate = 5 + 20 * (tcur / d) ** 1.3
    tcur += rng.exponential(1 / rate)
    if tcur >= d - 0.01: break
    s = int(tcur * SR); n = int(0.004 * SR)
    x[s:s + n] += np.sin(2 * np.pi * 2600 * np.arange(n) / SR) * np.exp(-np.arange(n) / (0.0012 * SR)) * rng.uniform(0.6, 1.0)
save('geiger', x)
# thunder rumble = the hurricane laughing ("ho ho ho" pulses)
d = 2.0; t = tt(d)
pulses = sum(np.exp(-((t - c) / 0.11) ** 2) for c in (0.15, 0.55, 0.95, 1.3)) * np.exp(-t / 1.4)
save('laugh_rumble', svf(noise(d), 260, 0.9) * (0.25 + pulses) + 0.3 * np.sin(2 * np.pi * 55 * t) * pulses)
# reuse from the pigeon Short
for n in ['whoosh', 'whoosh_soft', 'zip', 'pop', 'pop_big', 'plip', 'whistle', 'sparkle', 'bloop']:
    shutil.copy(f'../../public/pigeon/sfx/{n}.wav', f'{OUT}/{n}.wav')
print('done')
