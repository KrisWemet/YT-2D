from pathlib import Path
import json,collections,math
HERE=Path(__file__).resolve().parent;REPO=HERE.parents[2]
c=json.loads((REPO/'src/mall/chapter1/ch1.json').read_text())
# One entry per spoken paragraph. Reframes still count against image reuse.
raw='''0 marcus-z-radio
1 hall-crowd
2 radio-on-chest
3 crown
4 crown
5 keys-hold
6 b3-key
7 keys-hold
8 bus-stop
9 rounds-pretzel
10 kid-drawing
11 family-tower
12 lily-lamp
13 parking-signal
14 lily-sos
15 parking-signal
16 walt-handoff
17 walt-handoff
18 b3-key
19 ch2/gate-check
20 b3-door
21 ch2/v10/office-radio
22 ch2/v10/office-radio
23 marcus-book
24 marcus-empty-pockets
25 desk-radio
26 marcus-joke
27 marcus-joke
28 ch2/v10/office-radio
29 desk-radio
30 garage-ramp
31 office-concern
32 garage-approach
33 office-concern
34 desk-radio
35 office-concern
36 monitor-wall
37 raccoon
38 cctv-garage
39 cctv-attack
40 ramp-crowd
41 ramp-crowd
42 marcus-ground
43 office-door
44 desk-phone
45 phone-calls
46 ramp-crowd
47 monitor-invasion
48 camera-black
49 foodcourt-crowd
50 office-math
51 mall-map
52 keys-hold
53 gate-row
54 pharmacy
55 foodcourt-crowd
56 dept-bed
57 summit-supplies
58 zombie-plan
59 running-concourse
60 running-fountain
61 summit-front
62 glass-burst
63 gate-lower
64 ch2/gate-check
65 hide-between-tents
66 hall-pass
67 hide-between-tents
68 gate-pressure
69 kid-drawing
70 tent-wait
71 tent-wait
72 knock-hand
73 knock-hand
74 office-knock
75 marcus-hurt
76 hide-between-tents
77 marcus-hurt
78 marcus-hurt
79 keys-chest
80 marcus-pleads
81 bite-arm
82 hall-still
83 ch2/gate-check
84 keys-chest
85 marcus-understands
86 marcus-understands
87 back-to-back
88 fitting-rescue
89 marcus-seated
90 back-to-back
91 marcus-seated
92 marcus-last-joke
93 marcus-last-joke
94 marcus-last-joke
95 laugh-bag
96 marcus-seated
97 marcus-still
98 marcus-rise
99 marcus-z-radio
100 marcus-z-radio
101 danny-floor-radio
102 danny-floor-radio
103 dept-dark
104 two-radios
105 hall-turn
106 hall-crowd
107 gate-pressure
108 gate-pressure
109 radio-on-chest
110 radio-off
111 reach-radio
112 reach-close
113 clip-upside-down
114 fall-back-radio
115 radio-bag
116 crowd-drift
117 ch2/marcus-gate
118 radio-bag
119 talk-button
120 danny-listen
121 danny-listen
122 radio-bag
123 keys-chest
124 danny-listen
125 huddled-radio
126 huddled-radio
127 awake-tent
128 mall-map
129 ch2/v10/patrol-corridor
130 empty-concourse
131 dept-dark
132 wake-bag
133 gray-concourse
134 crawl-gate
135 morning-crowd
136 gray-concourse
137 marcus-rounds
138 marcus-rounds
139 marcus-rounds
140 ch2/marcus-gate
141 cleaner-cart
142 morning-crowd
143 breakfast
144 bear-store
145 phone-notification
146 phone-message
147 phone-message
148 lita-lily
149 phone-reply
150 phone-reply
151 crank-radio
152 crank-radio
153 crank-radio
154 danny-plan-day
155 summit-supplies
156 supplies-wide
157 water-bottles
158 insulin-worry
159 insulin-hand
160 insulin-worry
161 ladder-day
162 roof-hatch-day
163 roof-highway-day
164 roof-highway-day
165 road-dead
166 helicopter
167 helicopter
168 hotel-help
169 tower-day
170 roof-distance-day
171 roof-distance-day
172 garage-filled
173 tower-danger
174 roof-afternoon
175 blackout
176 night-black
177 roof-flashlight
178 night-black
179 night-black
180 roof-flashlight
181 tower-signal
182 tower-signal
183 danny-relief
184 roof-sit
185 roof-radio-glow
186 roof-radio-glow
187 danny-watched
188 tower-signal'''
mapping={int(n):asset for n,asset in (line.split() for line in raw.splitlines())}
aliases={'garage-approach':'garage-ramp','cctv-garage':'cctv-attack','marcus-ground':'cctv-attack','office-math':'office-door','zombie-plan':'mall-map','running-concourse':'running-fountain','awake-tent':'tent-wait','marcus-understands':'marcus-pleads','marcus-last-joke':'back-to-back','radio-off':'two-radios','reach-close':'reach-radio','clip-upside-down':'reach-radio','talk-button':'huddled-radio','bear-store':'summit-supplies','phone-notification':'phone-message','danny-plan-day':'insulin-worry','water-bottles':'supplies-wide','insulin-hand':'lita-lily','tower-danger':'tower-day','roof-afternoon':'roof-distance-day','roof-sit':'roof-radio-glow','lily-sos':'lily-lamp'}
mapping={i:aliases.get(a,a) for i,a in mapping.items()}
assert set(mapping)==set(range(len(c['segments'])))
rows=[]
for i,s in enumerate(c['segments']):
 rows.append(dict(start=0 if i==0 else round(s['s']*30),asset=mapping[i],cue=s['text'],segment=i,view='wide'))
rows.append(dict(start=math.ceil(21.75*30),asset='crown',cue='Chapter One / The King of the Mall',segment=None,view='wide',overlay='title'))
rows.append(dict(start=math.ceil(c['duration']*30),asset='blackout',cue='Next: Chapter Two / The Boy in the Ceiling',segment=None,view='wide',overlay='end'))
rows.sort(key=lambda x:x['start'])
# Keep short adjacent spoken phrases in one visual hold when the image is unchanged.
merged=[]
for r in rows:
 if merged and merged[-1]['asset']==r['asset'] and not r.get('overlay') and not merged[-1].get('overlay') and r['start']-merged[-1]['start']<300:
  merged[-1]['cue']+=' '+r['cue'];continue
 merged.append(r)
shots=[]
for i,r in enumerate(merged):
 end=merged[i+1]['start'] if i+1<len(merged) else 26465
 while end-r['start']>300:
  a={**r,'frames':210};shots.append(a);r={**r,'start':r['start']+210,'view':'detail'}
 shots.append({**r,'frames':end-r['start']})
counts=collections.Counter(s['asset'] for s in shots)
assert max(counts.values())<=3,{k:v for k,v in counts.items() if v>3}
# Reuse count determines a different crop; no crop creates a new image identity.
seen=collections.Counter()
for s in shots:
 seen[s['asset']]+=1
 if not s.get('overlay') and seen[s['asset']]>1:s['view']=['wide','detail','character'][seen[s['asset']]-1]
plan=dict(version=1,fps=30,frames=26465,voiceSeconds=c['duration'],shots=shots)
(REPO/'src/mall/chapter1/painted-edit.json').write_text(json.dumps(plan,indent=2)+'\n')
(HERE/'image-use-plan.json').write_text(json.dumps(dict(shots=len(shots),images=len(counts),newImages=len([k for k in counts if not k.startswith('ch2/')]),uses=counts),indent=2)+'\n')
print(len(shots),'shots,',len(counts),'images,',len([k for k in counts if not k.startswith('ch2/')]),'new; max',max(counts.values()))
print('New assets:',' '.join(k for k in counts if not k.startswith('ch2/')))
