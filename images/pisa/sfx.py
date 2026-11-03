#!/usr/bin/env python3
"""Procedural SFX for the Pisa Short -> public/pisa/sfx/*.wav (48 kHz mono, peak -1 dBFS)"""
import wave
import numpy as np
SR = 48000
rng = np.random.default_rng(7)

def save(name, x):
    x = x / (np.abs(x).max() + 1e-9) * 10 ** (-1 / 20)
    with wave.open(f'../../public/pisa/sfx/{name}.wav', 'wb') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((x * 32767).astype(np.int16).tobytes())

def onepole_lp(x, fc):
    a = np.exp(-2 * np.pi * fc / SR); y = np.zeros_like(x); s = 0.0
    for i, v in enumerate(x):
        s = (1 - a) * v + a * s; y[i] = s
    return y

# earthquake rumble: low brown noise + a wobbling sub, 3.5 s, slow attack, long tail
n = int(3.5 * SR); t = np.arange(n) / SR
brown = np.cumsum(rng.standard_normal(n)); brown -= onepole_lp(brown, 2.0)
low = onepole_lp(onepole_lp(brown, 90), 90)
sub = np.sin(2 * np.pi * (34 + 6 * np.sin(2 * np.pi * 0.7 * t)) * t)
grit = onepole_lp(rng.standard_normal(n), 900) * (0.5 + 0.5 * np.sin(2 * np.pi * 9 * t) ** 2)
env = np.minimum(1, t / 0.35) * np.minimum(1, (3.5 - t) / 1.4)
x = (low / (np.abs(low).max() + 1e-9) + 0.55 * sub + 0.12 * grit / (np.abs(grit).max() + 1e-9)) * env
save('rumble', x)

# stone creak: stick-slip pulses gliding down in pitch, through a resonant band
n = int(0.75 * SR); t = np.arange(n) / SR
f = 190 - 70 * t / 0.75
ph = np.cumsum(f / SR)
pulses = (np.mod(ph, 1) < 0.08).astype(float) * (0.6 + 0.4 * rng.random(n))
w0 = 2 * np.pi * 700 / SR; r = 0.985
y = np.zeros(n); y1 = y2 = 0.0
for i in range(n):
    v = pulses[i] + 2 * r * np.cos(w0) * y1 - r * r * y2; y2, y1 = y1, v; y[i] = v
env = np.minimum(1, t / 0.05) * np.exp(-2.2 * t)
save('creak', y * env)
print('ok')
