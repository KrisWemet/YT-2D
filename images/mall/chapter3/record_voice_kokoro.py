#!/usr/bin/env python3
"""Record Chapter Three with free Kokoro voices (open source, Apache-2.0), running locally.

Usage: record_voice_kokoro.py [--danny am_michael] [--theo am_puck] [--vera af_heart] [--only id,id]

Use this for a listening draft when Kie's Gemini voices are unavailable. It copies the plan from
vo/ch3 into vo/ch3-kokoro, writes one take per chunk as takes/<chunk>-1.wav with the same whisper
assessment, then runs `record_voice.py --build-only` for the identical levels, pauses, radio filter,
export, word alignment and captions, all written under out/chapter3-kokoro/ so the project's
published Chapter Three files are untouched. Kokoro is deterministic, so a chunk that fails the check is
retried at slightly different speeds.

Model files (not in git) go in images/mall/kokoro-models: onnx/model.onnx and voices-us.npz, built
from the onnx-community/Kokoro-82M-v1.0-ONNX repository on Hugging Face.
"""
import argparse, ast, json, os, subprocess, sys, time
from pathlib import Path
import numpy as np
import soundfile as sf

P = argparse.ArgumentParser()
P.add_argument('--danny', default='am_michael'); P.add_argument('--theo', default='am_puck')
P.add_argument('--vera', default='af_heart'); P.add_argument('--only'); P.add_argument('--no-build', action='store_true')
args = P.parse_args()
HERE = Path(__file__).resolve().parent; MALL = HERE.parent; ROOT = HERE.parents[2]
# A listening draft: its own voice folder (never mixed into the Gemini takes) and outputs under out/.
VO = MALL / 'vo/ch3-kokoro'; takes = VO / 'takes'; DRAFT = ROOT / 'out/chapter3-kokoro'
takes.mkdir(parents=True, exist_ok=True); DRAFT.mkdir(parents=True, exist_ok=True)
(VO / 'plan.json').write_text((MALL / 'vo/ch3/plan.json').read_text())
plan = json.loads((VO / 'plan.json').read_text())
VOICES = {'danny': args.danny, 'theo': args.theo, 'vera': args.vera}

# Reuse the audited take checks (validate, load16) from voice_gemini.py, as record_voice.py does.
os.environ.setdefault('KIE_API_KEY', 'unused-for-kokoro')  # its Kie helper module wants a key at import
source = ast.parse((MALL / 'voice_gemini.py').read_text())
stop = next(i for i, n in enumerate(source.body) if isinstance(n, ast.If) and isinstance(n.test, ast.Compare)
            and isinstance(n.test.left, ast.Constant) and n.test.left.value == '--check')
ns = {'__file__': str(MALL / 'voice_gemini.py'), '__name__': 'chapter3_kokoro_helpers'}
old = sys.argv; sys.argv = [str(MALL / 'voice_gemini.py'), str(VO / 'plan.json'), str(VO), '--build-only']
exec(compile(ast.Module(body=source.body[:stop], type_ignores=[]), str(MALL / 'voice_gemini.py'), 'exec'), ns)
sys.argv = old

from faster_whisper import WhisperModel
from kokoro_onnx import Kokoro
import parselmouth

MODELS = MALL / 'kokoro-models'
tts = Kokoro(str(MODELS / 'onnx/model.onnx'), str(MODELS / 'voices-us.npz'))
whisper = WhisperModel('small.en', device='cpu', compute_type='int8', download_root=str(HERE / 'models'))


def assess(c, path):
    ok, sim, dur, expected, transcript = ns['validate'](whisper, c, path)
    pcm = ns['load16'](path)
    f = parselmouth.Sound(pcm.astype(np.float64), sampling_frequency=16000).to_pitch_ac(
        pitch_floor=60, pitch_ceiling=350).selected_array['frequency']
    f = f[f > 0]
    return {'ok': ok, 'similarity': sim, 'duration': dur, 'pitch': float(np.median(f)) if len(f) else 0,
            'transcript': transcript, 'words': [], 'engine': 'kokoro', 'voice': VOICES[c['who']]}


chunks = [c for c in plan['chunks'] if not args.only or c['id'] in args.only.split(',')]
record = {}; began = time.monotonic(); failed = []
for n, c in enumerate(chunks, 1):
    dst = takes / f"{c['id']}-1.wav"; note = takes / f"{c['id']}-1.assessment.json"
    if note.exists() and json.loads(note.read_text()).get('voice') == VOICES[c['who']]:
        continue
    best = None
    for speed in (1.0, 0.96, 1.05, 0.92, 0.86, 0.8):  # short lines can come out too quick at 1.0
        audio, sr = tts.create(c.get('synthesis_text', c['text']), voice=VOICES[c['who']], speed=speed, lang='en-us')
        sf.write(dst, audio, sr)
        a = assess(c, dst); a['speed'] = speed
        if best is None or (a['ok'], a['similarity']) > (best[1]['ok'], best[1]['similarity']):
            best = (audio.copy(), a, sr)
        if a['ok']:
            break
    audio, a, sr = best
    sf.write(dst, audio, sr)
    note.write_text(json.dumps(a, indent=1))
    if not a['ok']:
        failed.append(c['id'])
    print(f"{n}/{len(chunks)} {c['id']} {c['who']} {'ok' if a['ok'] else 'CHECK'} sim {a['similarity']:.2f} "
          f"{a['duration']:.1f}s speed {a['speed']} ({(time.monotonic() - began) / 60:.1f} min)", flush=True)
if failed:
    print('Chunks that never matched the script exactly (best take kept, listen to these):', ','.join(failed), flush=True)
    for cid in failed:  # keep the closest take; the build only uses accepted ones
        note = takes / f'{cid}-1.assessment.json'; a = json.loads(note.read_text())
        if a['similarity'] >= 0.8:
            a['ok'] = True; a['accepted_by'] = 'closest Kokoro take, similarity >= 0.8'; note.write_text(json.dumps(a, indent=1))
if args.only or args.no_build:
    raise SystemExit('Takes written. Run without --only to assemble the chapter.')
env = {**os.environ, 'KIE_API_KEY': os.environ.get('KIE_API_KEY', 'unused-for-build'), 'HF_HUB_DISABLE_XET': '1',
       'CH3_VO': 'vo/ch3-kokoro', 'CH3_MP3': str(DRAFT / 'night-guard-chapter-3-kokoro-draft.mp3'),
       'CH3_JSON': str(DRAFT / 'ch3.json'), 'CH3_SRT': str(DRAFT / 'night-guard-chapter-3-kokoro-draft.srt')}
subprocess.run([sys.executable, str(HERE / 'record_voice.py'), '--build-only'], check=True, env=env)
