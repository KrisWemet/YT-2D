"""Move illustrated Part One onto the current retention edit.

The Part One plan and captions are timed in final-clock frames. When the retention edit changes,
each time is carried through its source frame: old final frame -> source frame (old edit map) ->
new final frame (current edit map), within the same clip. Times in footage the new edit dropped
move to the nearest kept frame of that clip.

    python3 images/mall/chapter2/retime-part-one.py <git ref holding the old edit map>
"""
import json, re, subprocess, sys
from pathlib import Path

repo = Path(__file__).resolve().parents[3]
edit_path = 'src/mall/chapter2/retention-edit.json'
plan_path = repo / 'src/mall/chapter2/illustrated-part-one.json'
srt_path = repo / 'images/mall/chapter2/style-review-part-one.srt'

old = json.loads(subprocess.check_output(['git', 'show', f'{sys.argv[1]}:{edit_path}'], cwd=repo))
new = json.loads((repo / edit_path).read_text())
assert len(old['clips']) == len(new['clips']), 'clip structure differs'
plan = json.loads(plan_path.read_text())
assert plan.get('editVersion', old['version']) == old['version'], 'plan is not on the old edit'


def retime(frame, end=False):
    """Final-clock frame (may be fractional) on the old edit -> the same moment on the new edit."""
    for a, b in zip(old['clips'], new['clips']):
        inside = a['start'] < frame <= a['start'] + a['frames'] if end else a['start'] <= frame < a['start'] + a['frames']
        if not inside:
            continue
        assert a['label'] == b['label'] and a['kind'] == b['kind'], 'clips differ'
        moved = b['start'] + (a.get('source', 0) + frame - a['start'] - b.get('source', 0))
        return min(max(moved, b['start']), b['start'] + b['frames'])
    raise ValueError(f'frame {frame} is outside the old edit')


bounds = [s['start'] for s in plan['shots']] + [plan['frames']]
moved = [round(retime(f, end=i == len(bounds) - 1)) for i, f in enumerate(bounds)]
for shot, a, b in zip(plan['shots'], moved, moved[1:]):
    assert b > a, f"shot at {shot['start']} vanished"
    shot['start'], shot['frames'] = a, b - a
plan = {'version': plan['version'], 'fps': plan['fps'], 'editVersion': new['version'], 'frames': moved[-1],
        **{k: v for k, v in plan.items() if k not in ('version', 'fps', 'editVersion', 'frames')}}
plan_path.write_text(json.dumps(plan, indent=2) + '\n')


def stamp(text):
    h, m, s, ms = map(int, re.split('[:,]', text))
    seconds = retime((h * 3600 + m * 60 + s + ms / 1000) * 30) / 30
    ms = round(seconds * 1000)
    return f'{ms // 3600000:02d}:{ms // 60000 % 60:02d}:{ms // 1000 % 60:02d},{ms % 1000:03d}'


srt = re.sub(r'(\d\d:\d\d:\d\d,\d\d\d) --> (\d\d:\d\d:\d\d,\d\d\d)',
             lambda m: f'{stamp(m.group(1))} --> {stamp(m.group(2))}', srt_path.read_text())
srt_path.write_text(srt)
print(f"Part One: {bounds[-1]} -> {moved[-1]} frames on edit v{new['version']}")
