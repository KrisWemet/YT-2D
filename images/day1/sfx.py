#!/usr/bin/env python3
"""Procedural sound for the Day 1 cold open -> public/day1/sfx/*.wav (48 kHz, 16-bit, peak -1 dBFS).

usage: python3 sfx.py          (needs numpy + scipy; reads ../../src/day1/cues.json)

Beds that follow the picture (flicker buzz, chime, heartbeat, drone, breathing) are rendered
on the composition clock, starting at 0 s, so Sfx.tsx plays them from frame 0.
"""
import json, math, os, wave
import numpy as np
from scipy import signal

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, '../../public/day1/sfx')
C = json.load(open(os.path.join(HERE, '../../src/day1/cues.json')))
SR = 48000
CUT = C['beats']['cut']
rng = np.random.default_rng(1)
os.makedirs(OUT, exist_ok=True)


def save(name, x, peak_db=-1.0):
    x = np.asarray(x, np.float64)
    if x.ndim == 1:
        x = x[:, None]
    f = int(0.002 * SR)
    if len(x) > 2 * f:
        x[:f] *= np.linspace(0, 1, f)[:, None]
        x[-f:] *= np.linspace(1, 0, f)[:, None]
    x = x / (np.abs(x).max() + 1e-12) * 10 ** (peak_db / 20)
    with wave.open(os.path.join(OUT, f'{name}.wav'), 'wb') as w:
        w.setnchannels(x.shape[1]); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((np.clip(x, -1, 1) * 32767).astype('<i2').tobytes())
    print(f'{name:16s} {len(x) / SR:6.2f}s {x.shape[1]}ch')


def tt(d): return np.arange(int(round(d * SR))) / SR
def noise(d): return rng.standard_normal(int(round(d * SR)))
def bp(x, lo, hi, order=2): return signal.sosfilt(signal.butter(order, [lo, hi], 'bandpass', fs=SR, output='sos'), x)
def lp(x, fc, order=2): return signal.sosfilt(signal.butter(order, fc, 'lowpass', fs=SR, output='sos'), x)
def hp(x, fc, order=2): return signal.sosfilt(signal.butter(order, fc, 'highpass', fs=SR, output='sos'), x)
def reson(x, f, q):
    b, a = signal.iirpeak(f, q, fs=SR); return signal.lfilter(b, a, x)
def env_exp(d, tau, attack=0.002):
    t = tt(d); return np.minimum(1, t / max(attack, 1e-4)) * np.exp(-t / tau)
def place(buf, x, at, gain=1.0):
    i = int(round(at * SR))
    if i >= len(buf): return
    n = min(len(x), len(buf) - i)
    buf[i:i + n] += gain * x[:n]
def pan(x, p):  # p in [-1, 1]
    a = (p + 1) * math.pi / 4
    return np.stack([x * math.cos(a), x * math.sin(a)], 1)
def conv_reverb(x, rt=1.2, wet=0.3, tone=4000):
    n = int(rt * SR); t = np.arange(n) / SR
    ir = lp(rng.standard_normal(n), tone) * np.exp(-6.9 * t / rt)
    ir /= np.sqrt((ir ** 2).sum())
    y = np.concatenate([signal.fftconvolve(x, ir), [0.0]])[:len(x) + n]
    dry = np.concatenate([x, np.zeros(n)])
    return dry + wet * y * (np.abs(x).max() / (np.abs(y).max() + 1e-9))

# ---------------------------------------------------------------- the light flicker (same as kit.tsx)
def jhash(n):
    s = math.sin(n * 127.1 + 311.7) * 43758.5453
    return s - math.floor(s)
def vnoise(x):
    i = math.floor(x); f = x - i; u = f * f * (3 - 2 * f)
    return (jhash(i) * (1 - u) + jhash(i + 1) * u) * 2 - 1
def flick(t):
    dip = 0.0
    for t0, d, depth in C['flicker']:
        if t0 <= t < t0 + d:
            fr = math.floor((t - t0) * 60)
            st = 0.75 + 0.25 * jhash(fr + t0 * 100) if d > 0.15 else 1
            dip = max(dip, depth * st)
    return 1 - dip + 0.025 * vnoise(t * 23)

def buzz_track(offset, dur):
    """fluorescent / ballast hum whose level follows the flicker, with a zap at each drop-out"""
    t = tt(dur)
    lvl = np.array([max(0.0, min(1.0, flick(x + offset))) for x in t[::48]])
    lvl = np.interp(t, t[::48], lvl)
    hum = sum(np.sin(2 * np.pi * 120 * k * t + k) / k ** 1.3 for k in range(1, 9))
    fizz = bp(noise(dur), 2500, 7000) * (0.5 + 0.5 * np.sign(np.sin(2 * np.pi * 120 * t)))
    x = (0.6 * hum + 0.35 * fizz) * (0.15 + 0.85 * lvl ** 1.5)
    for t0, d, depth in C['flicker']:
        for edge in (t0 - offset, t0 + d - offset):
            if 0 <= edge < dur:
                z = bp(noise(0.06), 1500, 9000) * env_exp(0.06, 0.012) * (0.4 + 0.8 * depth)
                z += 0.6 * np.sign(np.sin(2 * np.pi * 120 * tt(0.06))) * env_exp(0.06, 0.02) * depth
                place(x, z, edge, 1.2)
    return x

save('buzz_canopy', buzz_track(0.0, 8.6))
save('buzz_lamp', buzz_track(0.37, CUT + 0.2))

# ---------------------------------------------------------------- night bed: crickets + wind
def night(dur):
    t = tt(dur)
    wind = lp(noise(dur), 500) * (0.6 + 0.4 * np.sin(2 * np.pi * 0.11 * t) + 0.2 * np.sin(2 * np.pi * 0.37 * t + 1))
    wind = np.stack([wind, np.roll(wind, 900)], 1) * 0.5
    crick = np.zeros((len(t), 2))
    for k, (f, rate, p) in enumerate([(4300, 0.55, -0.7), (4700, 0.7, 0.6), (3900, 0.9, 0.1), (5100, 0.62, -0.2)]):
        chirp = np.zeros(int(0.12 * SR))
        ct = tt(0.12)
        for j in range(3):
            g = np.exp(-((ct - 0.02 - j * 0.033) / 0.008) ** 2)
            chirp += g * np.sin(2 * np.pi * f * ct)
        mono = np.zeros(len(t))
        at = rng.uniform(0, rate)
        while at < dur:
            place(mono, chirp, at, rng.uniform(0.5, 1.0))
            at += rate * rng.uniform(0.9, 1.1)
        crick += pan(mono, p) * (0.25 if k > 1 else 0.35)
    return wind + crick

bed = night(CUT + 0.2)
save('night_bed', bed)
save('night_muffled', np.stack([lp(bed[:, 0], 600, 4), lp(bed[:, 1], 600, 4)], 1))

# ---------------------------------------------------------------- truck door-ajar chime (0 -> 8.4 s)
def ding():
    d = 0.5; t = tt(d)
    return (np.sin(2 * np.pi * 1245 * t) + 0.3 * np.sin(2 * np.pi * 2490 * t) + 0.12 * np.sin(2 * np.pi * 3820 * t)) * env_exp(d, 0.11, 0.003)
ch = np.zeros(int(8.6 * SR))
for i in range(10):
    place(ch, ding(), 0.25 + i * 0.86)
save('chime', ch)

# ---------------------------------------------------------------- cut hits, riser into the fast cuts
def impact(d=1.4, f0=90, f1=38):
    t = tt(d)
    f = f1 + (f0 - f1) * np.exp(-t / 0.08)
    sub = np.sin(2 * np.pi * np.cumsum(f) / SR) * env_exp(d, 0.35, 0.003)
    snap = lp(noise(d), 2500) * env_exp(d, 0.03, 0.001)
    return conv_reverb(sub + 0.5 * snap, 1.4, 0.25, 1500)
save('hit', impact())
d = 0.6; t = tt(d); u = t / d
save('riser_short', bp(noise(d), 300, 6000) * u ** 2.5 * (0.3 + 0.7 * np.sin(np.pi * np.minimum(u, 0.98) / 2)))

# ---------------------------------------------------------------- gas glugging (shot 2, 5.0-6.5)
def glug_phase(x): return x * 5.2 + 0.35 * math.sin(x * 3.3)
s0, s1 = C['shots']['can']
d = s1 - s0 + 0.3
gl = np.zeros(int(d * SR))
k_prev = math.floor(glug_phase(s0))
for i in range(int(d * 1000)):
    tc = s0 + i / 1000
    k = math.floor(glug_phase(tc))
    if k != k_prev:
        k_prev = k
        bd = 0.09; bt = tt(bd)
        f = 170 * (2.4 ** (bt / bd))
        bub = np.sin(2 * np.pi * np.cumsum(f) / SR) * env_exp(bd, 0.03, 0.004)
        thump = np.sin(2 * np.pi * 85 * bt) * env_exp(bd, 0.025)
        place(gl, 0.8 * bub + 0.6 * thump, tc - s0, rng.uniform(0.6, 1.0))
pour = bp(noise(d), 700, 3500) * 0.12
splat = hp(noise(d), 3000) * 0.05 * (0.5 + 0.5 * np.sin(2 * np.pi * 5.2 * tt(d)) ** 2)
clunk = (np.sin(2 * np.pi * 180 * tt(0.3)) + 0.5 * np.sin(2 * np.pi * 410 * tt(0.3))) * env_exp(0.3, 0.06)
place(gl, clunk, 0.0, 0.7)
save('glug', gl + pour + splat)

# ---------------------------------------------------------------- slam on the passenger window + smear
d = 1.2; t = tt(d)
thud = np.sin(2 * np.pi * np.cumsum(55 + 60 * np.exp(-t / 0.05)) / SR) * env_exp(d, 0.22, 0.002)
knock = np.sin(2 * np.pi * 160 * t) * env_exp(d, 0.06)
panel = reson(noise(d) * env_exp(d, 0.01), 110, 8) * 4 + reson(noise(d) * env_exp(d, 0.01), 240, 10) * 2
rattle = bp(noise(d), 2500, 7000) * env_exp(d, 0.18) * (0.6 + 0.4 * np.sign(np.sin(2 * np.pi * 34 * t)))
crack = lp(noise(d), 4000) * env_exp(d, 0.012, 0.0005)
save('slam', conv_reverb(thud + 0.6 * knock + 0.5 * panel + 0.45 * rattle + 0.8 * crack, 0.5, 0.2, 2500))

d = 0.8; t = tt(d)
f = 820 + 240 * np.sin(2 * np.pi * 1.7 * t) + 90 * signal.sosfilt(signal.butter(1, 6, fs=SR, output='sos'), rng.standard_normal(len(t))) * 40
ph = 2 * np.pi * np.cumsum(f) / SR
saw = 2 * ((ph / (2 * np.pi)) % 1) - 1
gate = (signal.sosfilt(signal.butter(2, 30, fs=SR, output='sos'), rng.standard_normal(len(t))) > -0.002).astype(float)
squeak = bp(saw * lp(gate, 200), 700, 3500) * np.sin(np.pi * t / d) ** 0.6
save('squeak', squeak)

# ---------------------------------------------------------------- groans (formant synth)
def groan(d, f0=95, vowel='ah', rough=0.6, seed=0):
    r = np.random.default_rng(seed)
    t = tt(d)
    drift = signal.sosfilt(signal.butter(1, 3, fs=SR, output='sos'), r.standard_normal(len(t))) * 60
    f = f0 * (1 + 0.12 * np.sin(2 * np.pi * 0.7 * t) + drift * 0.05 - 0.25 * (t / d) ** 2)
    ph = 2 * np.pi * np.cumsum(f) / SR
    src = 2 * ((ph / (2 * np.pi)) % 1) - 1
    sub = np.sign(np.sin(ph / 2))
    src = src * (1 + rough * 0.6 * sub) + 0.5 * r.standard_normal(len(t)) * (0.4 + 0.6 * rough)
    F = {'ah': [(650, 6), (1080, 8), (2450, 10)], 'oh': [(450, 6), (800, 8), (2350, 10)], 'uh': [(520, 6), (1190, 8), (2390, 10)]}[vowel]
    y = sum(g * reson(src, fr, q) for (fr, q), g in zip(F, [1, 0.55, 0.25]))
    trem = 1 + 0.25 * np.sin(2 * np.pi * (5 + r.uniform(0, 2)) * t)
    e = np.minimum(1, t / 0.25) * np.minimum(1, (d - t) / 0.5).clip(0) * trem
    return lp(np.tanh(2.2 * y / (np.abs(y).max() + 1e-9)) * e, 3200)

for i, (d, f0, v, rough) in enumerate([(1.8, 88, 'uh', 0.7), (1.5, 110, 'ah', 0.5), (2.2, 76, 'oh', 0.8), (1.3, 125, 'ah', 0.6), (2.0, 95, 'uh', 0.9), (1.6, 70, 'oh', 0.7)]):
    save(f'groan{i}', groan(d, f0, v, rough, seed=i + 3))
g = groan(1.4, 92, 'uh', 0.8, seed=11)
save('groan_muffled', lp(g, 700, 4))

# the crowd below (ladder shots): many groans stacked, getting closer, stereo
s0 = C['shots']['ladder'][0]
d = CUT - s0 + 0.2
crowd = np.zeros((int(d * SR), 2))
at = 0.2
k = 0
while at < d:
    gd = rng.uniform(1.2, 2.4)
    x = groan(gd, rng.uniform(65, 130), ['ah', 'oh', 'uh'][k % 3], rng.uniform(0.5, 0.95), seed=100 + k)
    close = min(1.0, at / d * 1.3)
    x = lp(x, 900 + 2500 * close)
    gain = 0.35 + 0.65 * close
    xx = pan(x, rng.uniform(-0.8, 0.8)) * gain
    i0 = int(at * SR); n = min(len(xx), len(crowd) - i0)
    crowd[i0:i0 + n] += xx[:n]
    at += rng.uniform(0.25, 0.6) * (1.2 - 0.6 * close)
    k += 1
save('crowd', crowd)

# ---------------------------------------------------------------- ladder: creaks, clang, taps, scuff
def creak(d=0.9, seed=0):
    r = np.random.default_rng(seed)
    t = tt(d)
    rate = 45 + 35 * np.sin(np.pi * t / d) + 10 * r.standard_normal(len(t)).cumsum() / SR * 30
    ph = np.cumsum(rate) / SR
    imp = (np.diff(np.floor(ph), prepend=0) > 0).astype(float) * (0.5 + r.random(len(t)))
    y = reson(imp, 1100, 20) + 0.7 * reson(imp, 2300, 25) + 0.4 * reson(imp, 3700, 30) + 0.5 * reson(imp, 520, 15)
    return y * np.sin(np.pi * t / d) ** 0.8
for i in range(3):
    save(f'creak{i}', creak(rng.uniform(0.7, 1.2), seed=i + 20))

def clang(d=1.6, base=1.0, bright=1.0):
    t = tt(d)
    parts = [(420, 0.7, 1), (1130, 0.45, 0.6), (1870, 0.32, 0.45), (2950, 0.22, 0.3 * bright), (4100, 0.15, 0.2 * bright)]
    y = sum(a * np.sin(2 * np.pi * f * base * t + rng.uniform(0, 6)) * env_exp(d, dd, 0.001) for f, dd, a in parts)
    return y + 0.6 * hp(noise(d), 2000) * env_exp(d, 0.008, 0.0005)
save('clang', conv_reverb(clang(1.6, 1.0), 0.8, 0.25))
save('tap', clang(0.5, 1.35, 0.5) * env_exp(0.5, 0.12))
save('scuff', bp(noise(0.25), 500, 2500) * np.sin(np.pi * tt(0.25) / 0.25) ** 0.5)
d = 0.6
save('flakes', np.concatenate([
    np.concatenate([np.zeros(int(rng.uniform(0, 0.05) * SR)), hp(noise(0.02), 2500) * env_exp(0.02, 0.003) * rng.uniform(0.3, 1)]) for _ in range(14)
]))

# ---------------------------------------------------------------- Samantha: shaky breathing + gasp
def breath_in(d=0.32):
    t = tt(d)
    return bp(noise(d), 900, 3200) * np.sin(np.pi * t / d) ** 1.5 * (1 + 0.5 * np.sin(2 * np.pi * 13 * t))
def breath_out(d=0.38):
    t = tt(d)
    return bp(noise(d), 350, 1600) * np.sin(np.pi * t / d) ** 1.2 * (1 + 0.6 * np.sin(2 * np.pi * 11 * t))
s0 = C['shots']['ladder'][0]
d = CUT - s0
br = np.zeros(int(d * SR))
at = 0.1
while at < d - 0.5:
    place(br, breath_in(), at, 0.7)
    place(br, breath_out(), at + 0.34, 0.9)
    at += 0.78 - 0.18 * (at / d)
save('breath', br)
d = 0.3; t = tt(d)
save('gasp', bp(noise(d), 800, 3800) * np.minimum(1, t / 0.03) * np.exp(-t / 0.12) * (1 + 0.4 * np.sin(2 * np.pi * 90 * t)))

# ---------------------------------------------------------------- heartbeat (8.4 s -> cut), speeding up
s0 = C['shots']['ladder'][0]
d = CUT - s0
hb = np.zeros(int(d * SR))
def beat(f, dd=0.16, tau=0.05):
    t = tt(dd)
    return np.sin(2 * np.pi * np.cumsum(f * (1 + 0.6 * np.exp(-t / 0.02))) / SR) * env_exp(dd, tau, 0.004)
at = 0.15
while at < d:
    u = at / d
    g = 0.45 + 0.55 * u
    place(hb, beat(48), at, g)
    place(hb, beat(58, 0.14, 0.04), at + 0.13, 0.7 * g)
    bpm = 92 + 66 * u ** 1.4
    at += 60 / bpm
save('heartbeat', lp(hb, 160))

# ---------------------------------------------------------------- tension drone (0 -> cut), dies instantly at the cut
d = CUT
t = tt(d)
def saw(f): ph = np.cumsum(f * np.ones_like(t)) / SR; return 2 * (ph % 1) - 1
low = lp(saw(55) + saw(58.27) + 0.5 * saw(27.5), 260)
swell = 0.35 + 0.65 * (t / d) ** 1.6
mid = (np.sin(2 * np.pi * 220 * t) + np.sin(2 * np.pi * 311.1 * t + 1)) * (0.15 + 0.85 * np.clip((t - 8.4) / 9, 0, 1)) * 0.3
wf = 1700 + 450 * np.clip((t - 14.5) / 3, 0, 1) ** 2 + 18 * np.sin(2 * np.pi * 5.5 * t)
whine = np.sin(2 * np.pi * np.cumsum(wf) / SR) * np.clip((t - 13.8) / 3.7, 0, 1) ** 2 * 0.22
u = np.clip((t - 15.4) / (d - 15.4), 0, 1)
riser = bp(noise(d), 200, 7000) * u ** 3 * 0.9
dr = low * swell * 0.5 + mid + whine + riser
save('drone', np.stack([dr, np.roll(dr, 240)], 1))

# ---------------------------------------------------------------- black + title
d = 5.5; t = tt(d)
chord = sum(np.sin(2 * np.pi * f * t + i) * a for i, (f, a) in enumerate([(146.8, 1), (220, 0.7), (293.7, 0.5), (329.6, 0.35), (440, 0.2)]))
chord = lp(chord + 0.3 * np.sin(2 * np.pi * 73.4 * t), 1800)
padenv = np.minimum(1, t / 1.6) * np.minimum(1, (d - t) / 1.8).clip(0)
save('pad', np.stack([chord * padenv, np.roll(chord * padenv, 480)], 1))

d = 4.0; t = tt(d)
sub = np.sin(2 * np.pi * np.cumsum(32 + 40 * np.exp(-t / 0.15)) / SR) * env_exp(d, 1.0, 0.003)
braam = lp(sum(saw(f)[:len(t)] for f in (55, 82.4, 110, 130.8)), 600) * env_exp(d, 0.9, 0.01)
snap = lp(noise(d), 3000) * env_exp(d, 0.02, 0.0005)
save('title_hit', conv_reverb(sub + 0.35 * braam + 0.4 * snap, 2.6, 0.35, 2000))
d = 0.09; t = tt(d)
save('zap', bp(noise(d), 1200, 9000) * env_exp(d, 0.02) + 0.7 * np.sign(np.sin(2 * np.pi * 120 * t)) * env_exp(d, 0.03))
d = 0.06; t = tt(d)
save('type', hp(noise(d), 1500) * env_exp(d, 0.006, 0.0005) + 0.6 * np.sin(2 * np.pi * 180 * t) * env_exp(d, 0.012))
d = 6.0; t = tt(d)
save('room', lp(noise(d), 180) * np.minimum(1, t / 0.5) * np.minimum(1, (d - t) / 1.5).clip(0))

# ---------------------------------------------------------------- long beds -> mp3 (keeps the repo small)
import subprocess
for f in sorted(os.listdir(OUT)):
    if f.endswith('.wav'):
        src = os.path.join(OUT, f)
        with wave.open(src) as w:
            dur = w.getnframes() / w.getframerate()
        if dur >= 2.5:
            subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', src, '-c:a', 'libmp3lame', '-b:a', '224k', src[:-4] + '.mp3'], check=True)
            os.remove(src)
            print('mp3', f[:-4])
