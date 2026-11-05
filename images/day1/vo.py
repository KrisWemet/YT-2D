#!/usr/bin/env python3
"""Voice lines for "Day 1: Before We Go" with Kokoro TTS (offline, onnx), then processed per character.

usage: vo.py MODEL_DIR            (MODEL_DIR holds kokoro-v1.0.onnx and voices-v1.0.bin from
                                   github.com/thewh1teagle/kokoro-onnx/releases/tag/model-files-v1.0)
writes: vo_raw/*.wav (dry takes), ../../public/day1/vo/*.wav (processed), vo.json (lengths + word times)

Marcus is off screen, shouting from the roof: pitched up a little, driven, bright, with a
slap-back off the station wall. Samantha's voice-over is close and dry.
"""
import json, os, subprocess, sys
import numpy as np
import soundfile as sf
from kokoro_onnx import Kokoro

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, '../../public/day1/vo')
RAW = os.path.join(HERE, 'vo_raw')
SR = 24000
os.makedirs(OUT, exist_ok=True); os.makedirs(RAW, exist_ok=True)
k = Kokoro(os.path.join(sys.argv[1], 'kokoro-v1.0.onnx'), os.path.join(sys.argv[1], 'voices-v1.0.bin'))

# name, voice, speed, text, kind, pitch (semitones), drive
LINES = [
    ('m1', 'am_fenrir', 1.05, 'Sam!', 'shout', 1.5, 3.0),
    ('m2', 'am_fenrir', 1.18, "Don't look down!", 'shout', 1.5, 3.0),
    ('m3', 'am_fenrir', 1.15, 'Look at me!', 'shout', 2.0, 3.5),
    ('m4', 'am_fenrir', 1.0, 'Look at me!', 'scream', 3.0, 5.0),
    ('s1', 'af_heart', 0.9, 'Three days before this, my biggest worry was a missed paycheck.', 'vo', 0, 0),
]

def biquad(x, b, a):
    y = np.zeros_like(x); x1 = x2 = y1 = y2 = 0.0
    b0, b1, b2 = b; _, a1, a2 = a
    for i in range(len(x)):
        xi = x[i]; yi = b0 * xi + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2
        x2, x1, y2, y1 = x1, xi, y1, yi; y[i] = yi
    return y

def coeffs(kind, f, sr, q=0.707, gain_db=0.0):
    A = 10 ** (gain_db / 40); w = 2 * np.pi * f / sr; al = np.sin(w) / (2 * q); c = np.cos(w)
    if kind == 'hp':
        b = [(1 + c) / 2, -(1 + c), (1 + c) / 2]; a = [1 + al, -2 * c, 1 - al]
    elif kind == 'lp':
        b = [(1 - c) / 2, 1 - c, (1 - c) / 2]; a = [1 + al, -2 * c, 1 - al]
    else:  # peak
        b = [1 + al * A, -2 * c, 1 - al * A]; a = [1 + al / A, -2 * c, 1 - al / A]
    return [v / a[0] for v in b], [1.0] + [v / a[0] for v in a[1:]]

def eq(x, kind, f, sr, q=0.707, g=0.0):
    b, a = coeffs(kind, f, sr, q, g); return biquad(x, b, a)

def pitch(x, sr, semis):
    """pitch shift with ffmpeg rubberband (keeps length, keeps formants roughly)"""
    if abs(semis) < 0.01: return x
    p = subprocess.run(['ffmpeg', '-v', 'error', '-f', 'f32le', '-ar', str(sr), '-ac', '1', '-i', '-',
                        '-af', f'rubberband=pitch={2 ** (semis / 12):.5f}:formant=preserved', '-f', 'f32le', '-'],
                       input=x.astype(np.float32).tobytes(), capture_output=True, check=True)
    return np.frombuffer(p.stdout, np.float32).astype(np.float64)

def comp(x, sr, thr_db=-20, ratio=4, att=0.003, rel=0.08):
    env = 0.0; g = np.ones_like(x); aa = np.exp(-1 / (att * sr)); ar = np.exp(-1 / (rel * sr))
    for i, v in enumerate(np.abs(x)):
        env = aa * env + (1 - aa) * v if v > env else ar * env + (1 - ar) * v
        lv = 20 * np.log10(env + 1e-9)
        if lv > thr_db: g[i] = 10 ** ((thr_db + (lv - thr_db) / ratio - lv) / 20)
    return x * g

def room(x, sr, wet, rt=0.5, pre=0.012, slap=(0.075, 0.3)):
    """outdoor-ish space: one slap-back off a wall plus a short diffuse tail (FFT convolution)"""
    rng = np.random.default_rng(3)
    n = int(rt * sr); t = np.arange(n) / sr
    ir = rng.standard_normal(n) * np.exp(-6.9 * t / rt)
    ir = eq(ir, 'lp', 3500, sr); ir /= np.sqrt((ir ** 2).sum())
    ir = np.concatenate([np.zeros(int(pre * sr)), ir])
    s = int(slap[0] * sr); ir2 = np.zeros(max(len(ir), s + 1)); ir2[:len(ir)] += ir * 0.6; ir2[s] += slap[1] * 3
    L = len(x) + len(ir2)
    y = np.fft.irfft(np.fft.rfft(x, L) * np.fft.rfft(ir2, L), L)
    y = y[:len(x) + int(rt * sr)]
    dry = np.concatenate([x, np.zeros(len(y) - len(x))])
    return dry + wet * y * (np.abs(x).max() / (np.abs(y).max() + 1e-9))

def process(x, kind, semis, drive):
    x = x / (np.abs(x).max() + 1e-9)
    if kind in ('shout', 'scream'):
        x = pitch(x, SR, semis)
        x = eq(x, 'hp', 170, SR)
        x = eq(x, 'peak', 2600, SR, 0.9, 6 if kind == 'shout' else 8)  # strain / bite
        x = eq(x, 'peak', 900, SR, 0.8, 3)
        x = np.tanh(drive * x) / np.tanh(drive)  # vocal-cord drive
        x = comp(x, SR, -16, 5)
        x = eq(x, 'lp', 8500, SR)  # he is a few metres away
        x = room(x, SR, 0.32 if kind == 'shout' else 0.38)
    else:
        x = eq(x, 'hp', 75, SR)
        x = eq(x, 'peak', 220, SR, 0.8, 1.5)  # a little warmth
        x = eq(x, 'peak', 5000, SR, 1.0, 1.5)
        x = comp(x, SR, -22, 3, 0.005, 0.12)
    return x / (np.abs(x).max() + 1e-9) * 10 ** (-1 / 20)

info = {}
for name, voice, speed, text, kind, semis, drive in LINES:
    audio, sr, timing = k.create_timed(text, voice=voice, speed=speed, lang='en-us')
    assert sr == SR
    sf.write(os.path.join(RAW, f'{name}.wav'), audio, SR)
    y = process(audio.astype(np.float64), kind, semis, drive)
    sf.write(os.path.join(OUT, f'{name}.wav'), y.astype(np.float32), SR, subtype='PCM_16')
    a = np.abs(audio); on = np.nonzero(a > 0.02 * a.max())[0]
    info[name] = {'text': text, 'voice': voice, 'dur': round(len(y) / SR, 3), 'speech': round(len(audio) / SR, 3),
                  'first': round(on[0] / SR, 3), 'last': round(on[-1] / SR, 3),
                  'phonemes': [{'p': getattr(m, 'text', str(m)), 's': round(float(getattr(m, 'start', 0)), 3), 'e': round(float(getattr(m, 'end', 0)), 3)} for m in timing]}
    print(f'{name}: {info[name]["speech"]:.2f}s speech, first {info[name]["first"]:.2f}, last {info[name]["last"]:.2f}  "{text}"')
json.dump(info, open(os.path.join(HERE, 'vo.json'), 'w'), indent=1)
