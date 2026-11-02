#!/usr/bin/env python3
"""Procedural cartoon SFX + looped beds -> public/pigeon/sfx/*.wav (48 kHz mono, peak -1 dBFS)"""
import subprocess, wave
import numpy as np

SR = 48000
OUT = '../../public/pigeon/sfx'
rng = np.random.default_rng(7)

def save(name, x):
    x = np.asarray(x, np.float64)
    fade = int(0.003 * SR)
    if len(x) > 2 * fade:
        x[:fade] *= np.linspace(0, 1, fade); x[-fade:] *= np.linspace(1, 0, fade)
    x = x / (np.abs(x).max() + 1e-12) * 10 ** (-1 / 20)
    with wave.open(f'{OUT}/{name}.wav', 'wb') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((x * 32767).astype(np.int16).tobytes())

def tt(d): return np.arange(int(d * SR)) / SR
def noise(d): return rng.standard_normal(int(d * SR))
def sweep(f0, f1, d, curve='exp'):
    t = tt(d)
    f = f0 * (f1 / f0) ** (t / d) if curve == 'exp' else f0 + (f1 - f0) * t / d
    return np.sin(2 * np.pi * np.cumsum(f) / SR)
def svf_bp(x, fc, q=2.0):
    """state-variable band-pass with per-sample centre frequency"""
    fc = np.broadcast_to(np.asarray(fc, np.float64), x.shape)
    low = band = 0.0; y = np.zeros_like(x)
    for i in range(len(x)):
        f = 2 * np.sin(np.pi * min(fc[i], SR / 6) / SR)
        high = x[i] - low - band / q
        band += f * high; low += f * band; y[i] = band
    return y
def svf_lp(x, fc):
    fc = np.broadcast_to(np.asarray(fc, np.float64), x.shape)
    low = band = 0.0; y = np.zeros_like(x)
    for i in range(len(x)):
        f = 2 * np.sin(np.pi * min(fc[i], SR / 6) / SR)
        high = x[i] - low - band * 1.2
        band += f * high; low += f * band; y[i] = low
    return y
def env_exp(d, tau, attack=0.002):
    t = tt(d); return np.minimum(1, t / attack) * np.exp(-t / tau)

# footstep ticks
d = 0.06
save('tick', svf_bp(noise(d), 4200, 3) * env_exp(d, 0.006) + 0.35 * np.sin(2 * np.pi * 900 * tt(d)) * env_exp(d, 0.01))
save('tick_soft', svf_bp(noise(d), 1800, 2.5) * env_exp(d, 0.009) + 0.4 * np.sin(2 * np.pi * 420 * tt(d)) * env_exp(d, 0.012))
# pops
save('pop', sweep(1100, 420, 0.12) * env_exp(0.12, 0.04) + 0.15 * svf_bp(noise(0.12), 3000) * env_exp(0.12, 0.004))
save('pop_big', sweep(700, 260, 0.2) * env_exp(0.2, 0.06) + 0.12 * svf_bp(noise(0.2), 2500) * env_exp(0.2, 0.005))
save('bloop', sweep(320, 780, 0.16) * env_exp(0.16, 0.06, 0.004))
# stamp (X)
d = 0.25
save('stamp', sweep(150, 65, d) * env_exp(d, 0.06) + 0.6 * svf_bp(noise(d), 900, 1.2) * env_exp(d, 0.03))
# whooshes
d = 0.42; t = tt(d); u = t / d
fc = 500 * (3000 / 500) ** np.sin(np.pi * np.minimum(u / 0.75, 1) / 2) * (1 - 0.6 * np.maximum(0, u - 0.75) / 0.25)
save('whoosh', svf_bp(noise(d), fc, 1.4) * np.sin(np.pi * u) ** 2 * (1 + 0.3 * np.sin(np.pi * u)))
d = 0.95; t = tt(d); u = t / d
save('whoosh_soft', svf_lp(noise(d), 250 + 1100 * np.sin(np.pi * u)) * np.sin(np.pi * u) ** 1.5)
d = 0.24; t = tt(d); u = t / d
save('zip', svf_bp(noise(d), 1500 + 3000 * u, 2) * np.sin(np.pi * u) ** 2)
d = 0.85; t = tt(d); u = t / d
slow = svf_bp(noise(d), 2600 * (300 / 2600) ** u, 1.6) * np.sin(np.pi * u) ** 1.2 + 0.25 * sweep(620, 140, d) * np.sin(np.pi * u)
save('slowdown', slow)
save('speedup', slow[::-1])
# boing (balance)
d = 0.95; t = tt(d)
f = 250 + 150 * np.sin(2 * np.pi * 12 * t) * np.exp(-3 * t)
ph = 2 * np.pi * np.cumsum(f) / SR
save('boing', (np.sin(ph) + 0.25 * np.sin(2 * ph)) * env_exp(d, 0.35, 0.005))
# sweat drop plip
save('plip', sweep(900, 2300, 0.09) * env_exp(0.09, 0.025, 0.002))
# wing flutter
d = 0.42; x = np.zeros(int(d * SR))
for k in range(7):
    s = int((0.008 + k * 0.055) * SR); b = svf_bp(noise(0.05), 1300, 1.3) * env_exp(0.05, 0.012)
    x[s:s + len(b)] += b * (1 - k / 9)
save('flutter', x)
# landing thud
d = 0.2
save('thud', sweep(120, 58, d) * env_exp(d, 0.05) + 0.4 * svf_lp(noise(d), 700) * env_exp(d, 0.02))
# button click
d = 0.05
save('click', np.sin(2 * np.pi * 3200 * tt(d)) * env_exp(d, 0.004, 0.0005) + 0.6 * np.sin(2 * np.pi * 1100 * tt(d)) * env_exp(d, 0.008, 0.0005))
# motor whir start
d = 0.8; t = tt(d); u = t / d
f = 55 + 70 * np.minimum(u / 0.6, 1)
ph = 2 * np.pi * np.cumsum(f) / SR
save('whir', (np.sin(ph) + 0.5 * np.sin(2 * ph) + 0.3 * np.sin(3 * ph) + 0.15 * svf_bp(noise(d), 900, 1)) * np.minimum(1, u / 0.5) * np.minimum(1, (1 - u) / 0.3))
# shimmer + sparkle
def tings(freqs, gap, tau, d):
    x = np.zeros(int(d * SR))
    for i, fq in enumerate(freqs):
        s = int(i * gap * SR); n = len(x) - s
        x[s:] += np.sin(2 * np.pi * fq * np.arange(n) / SR) * np.minimum(1, np.arange(n) / (0.004 * SR)) * np.exp(-np.arange(n) / (tau * SR)) * (0.9 ** i)
    return x
save('shimmer', tings([2093, 2637, 3136, 4186], 0.07, 0.25, 0.9))
save('sparkle', tings([2637, 3951, 5274], 0.05, 0.3, 0.8) + 0.05 * svf_bp(noise(0.8), 7000, 2) * env_exp(0.8, 0.15))
# camera shutter: two clicks + short mechanism
d = 0.2; x = np.zeros(int(d * SR))
c1 = svf_bp(noise(0.012), 3800, 1.5) * env_exp(0.012, 0.003)
c2 = svf_bp(noise(0.02), 2600, 1.2) * env_exp(0.02, 0.005)
x[:len(c1)] += c1; s = int(0.07 * SR); x[s:s + len(c2)] += 1.3 * c2
x += 0.15 * svf_lp(noise(d), 1500) * env_exp(d, 0.04, 0.01)
save('shutter', x)
# falling whistle, snap, gulp
d = 1.1; t = tt(d)
f = 2000 * (850 / 2000) ** (t / d) * (1 + 0.01 * np.sin(2 * np.pi * 6 * t))
save('whistle', np.sin(2 * np.pi * np.cumsum(f) / SR) * np.minimum(1, t / 0.15))
d = 0.06
save('snap', svf_bp(noise(d), 2500, 2) * env_exp(d, 0.005, 0.0005) + 0.5 * np.sin(2 * np.pi * 1700 * tt(d)) * env_exp(d, 0.008, 0.0005))
d = 0.22; t = tt(d)
save('gulp', sweep(230, 135, d) * np.sin(np.pi * t / d) ** 0.7 * (1 - 0.5 * np.exp(-((t - 0.09) / 0.02) ** 2)))
save('btick', np.sin(2 * np.pi * 5200 * tt(0.04)) * env_exp(0.04, 0.005, 0.0005) + 0.5 * svf_bp(noise(0.04), 3000, 2) * env_exp(0.04, 0.004))

# beds from the generated clips
def load(f):
    pcm = subprocess.run(['ffmpeg', '-v', 'error', '-i', f, '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-'], capture_output=True, check=True).stdout
    return np.frombuffer(pcm, np.float32).astype(np.float64)
def xfade_join(parts, xf):
    n = int(xf * SR); out = parts[0].copy()
    for p in parts[1:]:
        r = np.linspace(0, 1, n)
        out[-n:] = out[-n:] * np.sqrt(1 - r) + p[:n] * np.sqrt(r)
        out = np.concatenate([out, p[n:]])
    return out
c0 = load('sfx_raw/s_city_0.mp3')[int(2.0 * SR):]
c1 = load('sfx_raw/s_city_1.mp3')[int(2.0 * SR):]
# level-match the two clips
c1 *= np.sqrt((c0 ** 2).mean() / (c1 ** 2).mean())
bed = xfade_join([c0, c1, c0, c1], 0.8)[: int(27 * SR)]
save('city_bed', bed)
h = load('sfx_raw/s_hum_0.mp3')[int(0.3 * SR): int(2.6 * SR)]
save('hum_bed', xfade_join([h] * 6, 0.3)[: int(9 * SR)])
print('done')
