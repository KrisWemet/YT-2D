"""Frozen Part Two timing and illustration brief. Run from repository root."""
import json
from pathlib import Path
from collections import Counter

ROOT = Path(__file__).resolve().parents[4]
OUT = Path(__file__).resolve().parent
START, STORY_END, TAIL = 18436, 36280, 60

# Each row begins at an exact final-mix time relative to Part Two.
# Multiple views of one painting still count as multiple image uses.
beats = [
 (0,'fountain-idea','Theo answers the water question'),
 (6.3,'fountain-idea','A tank beneath the fountain'),
 (10.95,'fountain-door','The pump-room doorway is buried behind bodies'),
 (18.3,'fountain-door','The route downstairs is blocked'),
 (23.9,'chalk-route','Theo comes from above'),
 (31.2,'chalk-route','Cinema to walkway to service column'),
 (38.5,'chalk-route','The route ends behind a locked door'),
 (43.7,'small-jugs','They choose containers small enough for the route'),
 (51.2,'small-jugs','Theo measures the narrow gap'),
 (59.4,'small-jugs','Two small jugs, not a huge water barrel'),
 (67.5,'agreement','Theo considers whether Danny can make the crossing'),
 (75.75,'radio-night','Vera says the girl has stopped asking for food'),
 (83,'radio-night','Danny grips the radio while Vera speaks'),
 (89.4,'agreement','Danny offers food in exchange for a route to water'),
 (98,'agreement','They agree to bring the water home'),
 (107,'family-window','Danny thinks of Lily and the days running out'),
 (116,'ready-boots','Theo asks whether Danny is coming'),
 (124,'quiet-kit','Before dawn, empty jugs, flashlight and climbing strap'),
 (131.5,'keys-sock','Battery removed from radio; keys muffled inside a sock'),
 (138.65,'rack-training','Theo catches Danny reaching for a ceiling hanger'),
 (146,'rack-training','The thin hanger cannot support his weight'),
 (152.5,'rack-training','Theo guides Danny to the heavy structural steel'),
 (159.4,'keys-sock','A lifetime of jingling keys must now stay quiet'),
 (166.8,'steel-path','They climb above the store onto heavy supports'),
 (174.5,'steel-path','Warm dusty pipes and fragile ceiling tiles'),
 (181.5,'cinema-nest','Theo has lived beside the projection room'),
 (189,'cinema-nest','Blanket, three empty bottles, folded hoodie'),
 (195.2,'photo-hidden','Theo hides a face-down photograph beneath the blanket'),
 (201.6,'service-key','Key seventeen opens CINEMA SERVICE'),
 (209,'service-key','Theo watches the lock turn'),
 (214.2,'walkway-reveal','A narrow service walkway above the crowded court'),
 (222.2,'walkway-reveal','Heads below the handrail; Theo leads'),
 (230,'walkway-end','The proper walkway ends at exposed ceiling supports'),
 (237,'walkway-end','Do not mistake the ceiling tile for a floor'),
 (244,'beam-cross','Theo crawls first; Danny follows on his knees'),
 (251,'beam-cross','Danny tries to copy the younger boy'),
 (258,'sweat','Danny wipes sweat before it can fall'),
 (265,'sweat','Emergency light flickers beneath the steel'),
 (271.3,'hand-guide','Next hand, then knee: Theo gives quiet instructions'),
 (278.7,'hand-guide','Danny learns to move on the strong steel'),
 (285.4,'court-below','An empty dark fountain, coins and a packed crowd'),
 (293.2,'pass-jug','Danny passes an empty jug forward'),
 (300.2,'pass-jug','Theo puts it down on solid steel before collecting the second'),
 (307.1,'marcus-rounds','Marcus continues his rounds, two pulls on each gate'),
 (314,'brace-bend','Danny moves his knee; the thin brace folds'),
 (321.1,'leg-through','His right leg punches through the ceiling'),
 (328.4,'leg-through','Debris drops toward the fountain'),
 (335.7,'grip-slip','Theo catches Danny at the edge'),
 (342.7,'marcus-up','Below, Marcus lifts his face toward the boot'),
 (349.1,'grip-slip','Theo reaches for Dannys other wrist'),
 (356.8,'grip-slip','Give me your hand'),
 (363.8,'crowd-hole','The crowd gathers under the broken ceiling'),
 (371.5,'crowd-hole','Marcus stands among them, looking upward'),
 (378.3,'marcus-up','Danny recognizes the worn patch on Marcuss cap'),
 (386.9,'strap-wrap','Look at me: Theo reaches for the climbing strap'),
 (394.8,'strap-wrap','One hand holds Danny while the other loops the heavy beam'),
 (402.8,'release','Danny makes himself release Theos sleeve'),
 (410.8,'strap-wrap','The strap tightens around structural steel'),
 (418,'brace-slip','Theos trainer slips against the sharp brace'),
 (424.8,'elbow','Elbow up: Danny has to help pull himself onto steel'),
 (432.1,'elbow','Theo leans back; Dannys right foot slides out of its boot'),
 (439.3,'rescue','Danny pulls his knee over the edge'),
 (446.3,'platform-breath','Both lie safely on the solid platform'),
 (453.6,'boot-fall','The abandoned right boot falls into the fountain'),
 (460.7,'platform-breath','They wait for the pushing below to stop'),
 (468,'theo-cut','Theo covers a scrape from the metal brace'),
 (477.6,'theo-cut','Danny has one boot; Theo is hurt'),
 (484.3,'column-ladder','The only descent: ladder inside the service column'),
 (493.7,'column-ladder','Danny leads with his booted left foot on each rung'),
 (501,'tank-reveal','A large tank with water behind its inspection window'),
 (508.8,'tank-hand','Danny rests his hand against the water tank'),
 (516.5,'tank-hand','They must carry the water back and treat it in the store'),
 (524.1,'theo-rung','Theo sits on the bottom rung, favouring his scraped calf'),
 (531.4,'fill-jugs','They fill the two small camping containers'),
 (539.3,'heavy-handles','Danny feels the weight of the full containers'),
 (547.3,'heavy-handles','The thought of another crossing stops him'),
 (555.5,'pump-door','A shoe scrapes beyond the closed pump-room door'),
 (563.7,'pump-door','Dust shakes from the frame; Theo recognizes the place'),
 (571.9,'drill-witness','Theo remembers the drill people'),
 (578.6,'drill-witness','Three people, behind the pretzel shop on the first night'),
 (585.5,'clock-memory','One-thirty: ten minutes before Marcuss warning'),
 (593.2,'drill-wall','They were cutting through the wall'),
]

# Narrative stills, not stock images. The first reference locks the approved art.
tasks = {
 'fountain-idea': 'Inside Summit Outdoors, Danny on LEFT listens as Theo on RIGHT points down through the floor and explains a tank below the mall fountain. Camping shelves, closed grille and tents, both full figures integrated into painted shadows. No exposed tank in the store.',
 'fountain-door': 'Indoor mall center court seen from above. Empty dry fountain occupies foreground; a closed gray pump-room service door beside a closed pretzel shop is obscured by a dense silent crowd of olive-headed BLACK STICK FIGURES. No Danny or Theo on floor. No water flowing in fountain; coins on dry basin floor.',
 'chalk-route': 'Overhead oblique close view inside the camping store: Theo on RIGHT kneels and traces a simple chalk route on blue floor tiles with one black mitten finger, Danny on LEFT watches. Chalk sketch shows a cinema rectangle, thin walkway, tall column and tank. No labels/text. Two empty small camping jugs nearby.',
 'small-jugs': 'Danny LEFT and Theo RIGHT at a low camping display, choosing exactly TWO SMALL translucent camping water jugs with molded handles, compact enough to crawl with. Theo holds black mitten hands a short distance apart indicating the narrow gap. Both have their normal shoes. Indoor store with tents and closed grille.',
 'agreement': 'Night inside dark camping store. Danny on LEFT sits beside a camping bucket, Theo on RIGHT stands near a tall storage rack and tent. Two small EMPTY camping jugs between them. Danny offers one protein bar while indicating a plan together. Small warm battery lantern; rich blue shadows. Both wear normal footwear. No radio conversation occurring in this image.',
 'radio-night': 'Night in the camping store. Medium close view of Danny alone, navy cap and pale softly lit head, gripping a small black handheld radio close to his face, worried by the woman speaking. Thin single black torso stroke, gold keys at hip. Dark tent and blurred camping bucket behind, only battery lantern light.',
 'ready-boots': 'Low angle inside camping store, Danny stands LEFT beside two small empty jugs, both black boots firmly on tiled floor. Theo RIGHT with gray-green scarf looks down at Dannys boots skeptically. Shaded pale heads and single thin stick bodies. Calm blue early dawn light through a closed grille.',
 'quiet-kit': 'Before dawn in the camping store. Danny LEFT kneels to pack exactly TWO SMALL EMPTY translucent camping jugs, black flashlight and a rolled dark climbing strap; Theo RIGHT waits by tall storage rack looking upward. Gold keys partly wrapped in a gray sock. Slim black stick bodies without clothes below scarf/cap.',
 'keys-sock': 'Intimate painted close view of Dannys black mitten hands wrapping a large ring of gold keys inside a gray sock to stop rattling. On a camping crate lies a black handheld radio with its small battery removed and lying beside it, plus coiled climbing strap. Lower edge of pale shaded face and navy cap at left; blue camping store in soft focus. No human fingers/skin.',
 'rack-training': 'In a cramped ceiling plenum above the camping store: Danny on LEFT balances on the second shelf of a metal rack and reaches toward a THIN vertical ceiling hanger. Theo on RIGHT gently catches his wrist and points it toward a separate THICK horizontal structural I-BEAM overhead. Show clear difference between fragile hanger and heavy load-bearing steel. Danny both boots on, jugs left below on floor. Thin stick bodies.',
 'steel-path': 'Wide cinematic view inside a dusty ceiling plenum over indoor mall shops. Theo on RIGHT crawls forward on HEAVY dark structural I-beams; Danny on LEFT follows on hands and knees. Both keep weight on steel; fragile pale ceiling tiles below them. Ducts, pipes, small flashlight beam, cool blue-gray and warm dust motes. Both Danny boots still on. Exactly two small empty jugs on steel nearby.',
 'cinema-nest': 'A small ledge beside an indoor cinema projection-room door inside the service ceiling. Theo RIGHT kneels beside his stained folded blanket, exactly three empty water bottles, a folded gray hoodie and a small photograph face DOWN. Danny LEFT approaches quietly with navy cap, gold keys muffled in sock and both black boots. Painted industrial pipes, dusty blue-gray steel, subtle warm flashlight glow.',
 'photo-hidden': 'Medium close cinematic view of Theo RIGHT kneeling on a service platform, sliding a small FACE-DOWN photograph beneath a stained blanket with his black mitten hand before Danny LEFT can see it. Both pale spherical shaded heads and thin stick bodies. No visible picture contents. Three empty bottles and folded hoodie beside blanket. Danny both boots on.',
 'service-key': 'Danny LEFT uses a gold key at the lock of a closed gray steel cinema-service door on a small platform above the mall. Theo RIGHT watches in quiet surprise, scarf draped around narrow stick neck. Small metal key tag 17. Door has a plain rectangular blank sign plate above handle; no other words. Two small empty jugs on platform. Both Dannys boots on.',
 'walkway-reveal': 'Establishing wide view from a cinema service door onto a narrow metal service walkway high ABOVE an indoor mall center court. Railings frame a dizzying view down to an empty fountain and packed olive round-headed black stick crowd. Theo on RIGHT leads onto the walkway; Danny LEFT cautiously follows with exactly two small empty handled jugs. Danny has both boots. Thick beams, suspended ceiling edges, blue emergency light. Not a bridge outdoors.',
 'walkway-end': 'Inside mall ceiling, the safe metal walkway with railing ENDS at left foreground. Beyond it only two heavy dark steel supports span above fragile cream ceiling tiles, with a deep view to the mall below through gaps. Theo on RIGHT looks back and points at the steel; Danny LEFT freezes at the edge. Both Danny boots on, two small empty jugs. No rope bridge or outdoor landscape.',
 'beam-cross': 'Side perspective in mall ceiling: Theo ahead on RIGHT crawls easily along a heavy horizontal I-beam, Danny behind on LEFT awkwardly copies on hands and knees. Dangerous gap between beams, ceiling tiles below, pipes above and dim center court far below. Both Danny boots still on. Two small empty handled jugs near Theo. Shaded pale heads, very thin black bodies.',
 'sweat': 'Close cinematic view of Danny on LEFT crouched low along dark structural steel high above a mall. One black mitten wipes a bead of sweat from his pale round head before it can fall through a gap. Theo waits patiently ahead on RIGHT. Small emergency lamp below casts cool intermittent light. Danny both boots still on, two empty small jugs on steel in background. No skin/body or shirt.',
 'hand-guide': 'Inside the mall ceiling, Theo RIGHT crouches facing back toward Danny LEFT and points to the next safe position on a heavy I-beam. Danny slowly moves one black mitten and bent knee on the heavy steel. Emphasize measured deliberate support, fragile white tiles only below, not bearing their weight. Both Danny boots on. Shaded spherical heads, scarf and navy cap.',
 'court-below': 'Dizzying top-down view THROUGH a narrow gap in indoor mall ceiling steel: a completely DRY dark round fountain has a few coins in its basin, around it a dense crowd of pale olive round heads, two small black oval eyes and BLACK SINGLE-LINE stick bodies facing distant closed food-court doors. In top left foreground the edge of Dannys navy cap and black mitten grip a thick beam. No realistic zombies or clothing on crowd, no rain, no flowing water.',
 'pass-jug': 'On heavy steel supports in a mall ceiling Danny LEFT carefully passes one small EMPTY translucent water jug to Theo RIGHT. Theo sets a second identical empty jug onto a solid service platform beside him before returning. Both have black stick limbs and pale shaded round heads; Danny both boots still on. Deep blue mall below through ceiling gap. Only two jugs total.',
 'brace-bend': 'A tense close side view of Dannys BLACK BOOTED RIGHT KNEE pressing a thin metal ceiling brace which is visibly bending downward. Danny LEFT is crouched on a thick I-beam with a worried pale round face and navy cap; Theo RIGHT reaches back to touch his shoulder. Ceiling tile cracks beneath his RIGHT leg but leg has NOT yet dropped. Heavy steel above is intact. No human flesh or trousers.',
 'leg-through': 'Cross-section cinematic side view INSIDE a mall ceiling plenum. Danny LEFT lies belly-down across a heavy intact beam, his RIGHT stick leg and RIGHT black boot dangling through a fresh broken ceiling tile hole toward the mall below, left leg remains above. Theo RIGHT lies on solid platform and reaches for Dannys wrists. Dust and small plaster shards fall. Exactly two small empty jugs safely on platform behind Theo. Clear geography, no huge clothed torso, no blood.',
 'grip-slip': 'Tense intimate angle in mall ceiling, Danny LEFT suspended at the broken tile edge with RIGHT leg and black boot through hole, LEFT leg on steel. Theo RIGHT lies flat on solid platform grabbing Dannys black wrist with one hand and reaching for the second, fabric cuff under Theos scarf slightly slipping. Both stick people pale spherical head/two oval eyes, navy cap Danny, scarf Theo. Two small empty jugs set safely behind Theo. Structural I-beam above, sharp thin brace near Theos calf.',
 'crowd-hole': 'Low wide view in mall center court looking toward a jagged hole in suspended ceiling above a dry fountain. Dannys one black RIGHT boot on a thin black stick leg hangs through the hole. Under it crowd of olive round-headed SINGLE-BLACK-STROKE stick bodies presses together looking up. Marcus foreground wears navy security cap with worn patch, olive head, EMPTY small square radio clip on narrow strap, NO radio and NO keys. Coins in fountain. Implied danger without gore.',
 'marcus-up': 'Medium close low angle on undead Marcus in indoor mall center court. Olive softly shaded spherical head, only two black oval eyes, navy cap with a small visibly worn fabric patch. ONE black wire-thin line from head to hip, black stick arms, tiny EMPTY square radio clip attached to a narrow dark strap, no radio no keys no torso clothing. He looks upward at a single black boot through broken ceiling above. Other olive stick heads behind, muted blue emergency glow.',
 'strap-wrap': 'High tension inside mall ceiling. Theo on RIGHT lies on solid platform, one black mitten holds Dannys wrist LEFT while the other loops a dark climbing strap AROUND a thick structural steel I-beam directly above. Danny LEFT hangs at the broken tile hole, right boot and leg still below, left knee on beam. Pale shaded round heads, cap and scarf, thin single-line black bodies. Two small empty jugs safely behind Theo. Strap clearly loops solid beam, not a duct.',
 'release': 'Close painted view in mall ceiling: Dannys LEFT black mitten slowly opens to RELEASE its grip on Theos gray sleeve/scarf cuff, allowing Theo RIGHT to pull a black climbing strap around a heavy steel beam. Dannys other wrist is held securely. Their worried shaded pale round heads edge frame, navy cap left, scarf right. Danger below visible through broken tile edge. No fleshy arms, sleeves only a small cuff near mitten.',
 'brace-slip': 'Close shot inside mall ceiling: Theos right dark TRAINER slips on a sharp narrow brace below the load-bearing beam while he leans backward on a taut climbing strap around a thick I-beam. Theo RIGHT strains to pull Danny LEFT out of a hole. A tiny fabric tear at Theos calf with restrained dark-red scrape, no exposed flesh. Dannys right black boot still caught below; no other injuries. Fine thin black limbs, large softly shaded pale heads.',
 'elbow': 'Danny LEFT pushes his BLACK elbow onto thick structural steel as Theo RIGHT leans back in a climbing strap looped securely around a beam and pulls Dannys hand. Dannys RIGHT stick foot in a dirty gray SOCK is slipping OUT of the black boot caught below the broken tile. LEFT foot remains in its black boot above. No dangling full second shoe or mirrored feet. Large pale spherical heads and thin single-line black bodies; two small empty jugs safe on rear platform.',
 'rescue': 'Theo RIGHT drags Danny LEFT onto a solid service platform inside mall ceiling. Danny now has LEFT black boot and RIGHT dirty gray sock, both legs above the broken tile edge. Theo is anchored by a dark climbing strap around the heavy structural I-beam. Dannys loose black RIGHT boot remains caught at the jagged hole just below them. Exactly two small empty handled jugs safely at back right. Thin black stick bodies, richly painted shadows.',
 'platform-breath': 'Inside mall ceiling, Danny lies LEFT and Theo lies RIGHT together on a wide solid steel platform beside a jagged ceiling hole, quietly exhausted, faces near their forearms. Danny navy cap, LEFT black boot and RIGHT dirty gray sock. Theo scarf, dark trainers and a tiny torn gray fabric cuff with restrained scrape on right calf. Exactly two small empty jugs on safe rear platform, climbing strap looped around beam. Soft dust and cool emergency light.',
 'boot-fall': 'Dramatic downward view from the mall ceiling. ONE loose black RIGHT boot falls through the air toward a completely DRY indoor fountain, no leg attached, its heel nearly touches the coin-scattered basin. Crowds of olive round-headed BLACK SINGLE-LINE stick figures stand beyond the rim looking toward it, Marcus navy cap/empty chest clip among them. Upper foreground: Dannys gray socked right foot now safely above on solid steel. No water splash, no new shoes.',
 'theo-cut': 'On safe steel platform inside mall ceiling, Danny LEFT crouches facing Theo RIGHT. Theo quietly pulls a narrow torn gray fabric cuff over a small scraped area at his RIGHT calf, faint dark red smear on the sharp brace nearby. Very restrained injury without gore. Both oversized pale shaded heads and thin black stick bodies. Danny LEFT black boot and RIGHT dirty gray sock. Two EMPTY small jugs on platform; strap at beam. Theo trying to hide discomfort.',
 'column-ladder': 'ONE continuous descent inside a narrow enclosed industrial service column. Danny BELOW on LEFT descends a vertical metal ladder facing the rungs, placing his LEFT black boot on a rung first; RIGHT foot in dirty gray sock. Theo ABOVE on RIGHT follows carefully with scarf and subtly scraped right calf. Two compact empty jugs strapped at Dannys side. Ladder leads down to a small open hatch at bottom into dim pump room. Only this ladder, no repeated ladders.',
 'tank-reveal': 'Wide painted establishing view from inside a cramped industrial PUMP ROOM underneath a DRY mall fountain. Huge dark steel water tank dominates background, visible still water behind rectangular inspection glass and a small plain blank capacity plate below it. Danny LEFT just off the service ladder, navy cap, LEFT black boot/RIGHT dirty gray sock, Theo RIGHT beside bottom rung with scarf and minor scraped right calf. Exactly two small EMPTY jugs on floor. Pipes, valves, blue emergency light, no aquarium or pool.',
 'tank-hand': 'Medium intimate view inside pump room, Danny LEFT presses a black mitten hand flat against a huge steel water tank beside its inspection window with visible water. He pauses in relief. Theo RIGHT eases onto bottom ladder rung favouring right calf. Danny LEFT boot and RIGHT dirty gray sock; cap, no keys hanging loose (muffled in sock). Exactly two small EMPTY translucent jugs on floor, valves and dark pipes. No drinking directly from tank.',
 'theo-rung': 'Pump room: Theo on RIGHT sits low on the bottom ladder rung favouring his scraped RIGHT calf, looks up with a dry understated expression. Danny on LEFT crouches beside him, navy cap, LEFT black boot and RIGHT dirty gray sock, listening. Huge steel tank and inspection window behind. Two small empty jugs near a low tap. Soft painterly blue-gray shadows, subtle warm flashlight bounce. Same very thin black line bodies and pale shaded heads.',
 'fill-jugs': 'In cramped pump room, Danny LEFT holds one small translucent handled camping jug under a low tap on a huge steel tank, water flowing visibly INTO it, while Theo RIGHT steadies the second jug on the floor, half full. Exactly TWO jugs, compact not barrels. Danny LEFT boot and RIGHT dirty gray sock; Theo scarf, scraped right calf. Dark painted pipes, inspection window, dim practical flashlight; no drinking or treating water here.',
 'heavy-handles': 'Inside pump room, Danny LEFT lifts exactly TWO now FULL small translucent camping jugs, one in each black mitten hand, arms stretched by their weight. Danny pale shaded head/navy cap, LEFT black boot and RIGHT dirty gray sock. Theo RIGHT beside ladder points upward, determined to find a safer crossing; slight scrape at right calf. Huge steel tank, pipes, CLOSED gray service door on rear wall. No spare jugs.',
 'pump-door': 'Inside cramped pump room, camera faces a fully CLOSED gray industrial door, fine dust falling from its upper frame after a shoe scrapes OUTSIDE. Danny on LEFT lowers one of two full small jugs silently to floor and turns toward door. Theo on RIGHT watches door with sudden recognition; ladder behind right, huge tank left. Danny LEFT black boot RIGHT dirty gray sock, Theo scraped right calf and scarf. No hole in this door or open exit.',
 'drill-witness': 'Pump room two-shot of Danny LEFT and Theo RIGHT beside two FULL small camping jugs on floor. Theo gestures toward the CLOSED gray service door and recalls three people drilling outside on the first night, tense but speaking quietly. Danny lowers a jug, surprised. Huge tank and ladder frame the intimate scene; no visible drill or intruders in current room. Danny LEFT boot RIGHT dirty gray sock. Theo scarf and small scrape on right calf.',
 'clock-memory': 'A remembered indoor mall staff corridor on first night: wall-mounted analog clock clearly has minute hand at SIX and hour hand halfway between ONE and TWO (1:30). In left foreground only a partial navy security cap and pale round head of Danny as a memory framing element, thin black shoulder line. At far right a closed pretzel-shop service door and dim amber emergency light. No digital clock, no apocalypse daylight, no crowd or readable extra text.',
 'drill-wall': 'Cliffhanger flashback, first night inside an indoor mall staff passage behind a closed pretzel shop. Exactly THREE anonymous adult STICK FIGURES: one woman with a pale spherical shaded head and simple dark short hair on LEFT watches, two male pale round-headed thin black stick figures on RIGHT operate a large portable core drill held against an unmarked CONCRETE WALL. Dust and a shallow circular cutting mark, no open tunnel or revealed room. The woman stays mostly in shadow, do not reveal identity. NO children, Danny, Theo, gore or realistic anatomy. Men have black stick spines/limbs, only gloves and small accessory belts. Richly painted blue-gray, restrained orange machine light. No B3 tag yet.',
}

tasks['marcus-rounds'] = 'Marcus alone, olive spherical head, worn navy cap, empty square radio clip, no radio or keys, repeats two pulls at a closed mall store grille. Dense olive black-stick crowd around dry fountain behind him.'

tasks['family-window'] = 'New close view of Danny alone on roof remembering home across the dark highway, switched-off flashlight, ten-floor Parkview deep background. No active signal, no Theo, no feet visible.'

def write_json(path, obj):
 path.write_text(json.dumps(obj,indent=2)+'\n')

if __name__=='__main__':
 duration=STORY_END-START+TAIL
 shots=[]
 # Split any long beat into evenly spaced camera views no longer than 10s.
 for i,(seconds,asset,note) in enumerate(beats):
  a=round(seconds*30); b=round(beats[i+1][0]*30) if i+1<len(beats) else duration
  n=(b-a+299)//300
  for j in range(n):
   start=a+round((b-a)*j/n);end=a+round((b-a)*(j+1)/n)
   shots.append(dict(start=start,frames=end-start,asset='part-two-v1/'+asset,view=['wide','detail','character'][(i+j)%3],note=note))
 usage=Counter(s['asset'] for s in shots)
 assert max(usage.values())<=3, usage
 plan=dict(version=1,fps=30,frames=duration,retentionStartFrame=START,retentionStoryEndFrame=STORY_END,tailFrames=TAIL,ending='They were cutting through the wall.',shots=shots)
 write_json(ROOT/'src/mall/chapter2/illustrated-part-two.json',plan)
 write_json(OUT/'artwork-tasks.json',[dict(name=k,scene=v) for k,v in tasks.items()])
 print('duration',duration/30,'shots',len(shots),'assets',len(usage),'new',len(tasks),'max uses',max(usage.values()))
