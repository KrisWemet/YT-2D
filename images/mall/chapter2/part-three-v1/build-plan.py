"""Final installment: original Chapter Two ending plus six seconds of overlap."""
import json
from collections import Counter
from pathlib import Path

ROOT=Path(__file__).resolve().parents[4]
HERE=Path(__file__).resolve().parent
START,END=36099,49732
CHOICE=39629-START
# seconds, painting, narrative purpose; source images may have at most three cuts.
beats=[
 (0,'part-two-v1/clock-memory','Six-second lead-in begins at a complete sentence: One-thirty'),
 (133/30,'part-two-v1/drill-wall','Reprise the final line and continue straight into the next exchange'),
 (11.4,'drill-alarm','The drill noise draws the dead through the staff hall'),
 (20.3,'pump-voice','Theo says the woman ordered them to keep drilling'),
 (27.5,'pump-voice','Danny recognizes the woman on the radio'),
 (35,'pump-voice','Theo is certain: he heard her from above'),
 (42,'crew-delay','One man returned running; she demanded another minute'),
 (49.5,'crew-retreat','The crew took the machine and used the staff door'),
 (55,'monitor-clue','Danny reconsiders the crowd routes he watched on CCTV'),
 (64,'pump-question','Was there a little girl with them?'),
 (73.3,'jug-catch','Danny hits his shoulder on the ladder; Theo catches a jug'),
 (79.2,'jug-catch','Theo prevents a full container from crashing down'),
 (85,'keys-fist','Danny clenches the keys through their sock wrapping'),
 (92.4,'keys-fist','He wants to confront Vera, but Theo needs to get home'),
 (99.8,'pump-question','Danny notices the injured calf and picks up the water'),
 (107,'return-cross','They skirt the broken ceiling by another support'),
 (112.3,'return-cross','His lost boot and Marcus remain below'),
 (CHOICE/30,'return-cross','Visual choice begins: two full containers on the support'),
 ((CHOICE+90)/30,'choice-buckle','Theo loses footing on his injured leg'),
 ((CHOICE+150)/30,'choice-catch','Danny catches Theo; a full jug starts sliding'),
 ((CHOICE+240)/30,'choice-release','Danny commits both hands to Theo and lets the jug go'),
 ((CHOICE+330)/30,'choice-fall','Water is lost; the container lands on a lower ledge'),
 ((CHOICE+420)/30,'choice-haul','Danny hauls Theo onto solid steel'),
 ((CHOICE+570)/30,'choice-retrieve','Danny retrieves the damaged empty jug with the strap'),
 ((CHOICE+720)/30,'photo-home','Theo collects his blanket and hides his photograph'),
 (148.4,'rack-home','Theo steadies the storage rack as Danny climbs down'),
 (158.9,'lock-return','The padlock is still closed; it did not bring them home'),
 (167.8,'lock-return','Theo sits on the bucket beside their surviving water'),
 (175.5,'first-aid','Danny gets the first-aid box'),
 (181,'roof-solo','Night four: Danny signals Lily alone'),
 (187.5,'sleep-home','He checks the hatch; Theo sleeps beside the water'),
 (193.4,'first-aid','Danny cleans and bandages Theos scraped calf'),
 (203.3,'wrappers','Theo packs his bandage and food wrappers very small'),
 (212.1,'wrappers','A habit from months living above the cinema'),
 (220.7,'leaving','Theo prepares to return to the ceiling'),
 (229.3,'leaving','He says his leg is fine while taking weight off it'),
 (237.9,'pick-tent','Danny tells him to pick a tent'),
 (246.6,'pick-tent','Theo waits for the price of staying'),
 (254.4,'clean-offer','Danny only asks for quiet, help and honesty'),
 (262.6,'clean-offer','He offers Theo a clean sweatshirt'),
 (270.3,'clean-offer','Theo folds the clean garment carefully'),
 (275.4,'vera-call','Vera calls near dusk, asking for room at the inn'),
 (283.3,'answer-coat','Danny returns to her story about trying on a coat'),
 (291.3,'vera-call','Her amused answer no longer reassures him'),
 (297,'theo-request','Theo watches from the open tent as Danny leaves her waiting'),
 (304.1,'theo-request','Theo asks to see the nightly signal'),
 (310.1,'roof-both','Night five: Theo joins Danny behind the hatch'),
 (317.3,'roof-both','Parkview across the highway; count the tenth floor'),
 (324.2,'lily-window','Lily flashes three times at nine'),
 (333,'danny-answer','Danny answers with his own three flashes'),
 (341,'roof-both','For a moment, having another person there steadies him'),
 (343.3,'vera-signal','A second light blinks from the department store roof'),
 (350.8,'vera-signal','It is pointed toward Lilys window'),
 (358,'switch-still','Danny stops himself from answering again'),
 (366.2,'switch-still','He has never taught Lily how to distinguish two senders'),
 (374.6,'theo-question','Theo asks who is on the other roof'),
 (382.1,'night-quiet','Danny answers: the woman; his radio stays off'),
 (390.7,'night-quiet','Lilys window goes dark; Theo touches his sleeve'),
 (399.9,'keys-loose','The sock comes loose and exposes the last red tag'),
 (407.7,'b3-close','What is B3?'),
 (417,'b3-close','Vera had said down to B3, get to the door'),
 (425.7,'walt-memory','Danny remembers Walts warning'),
 (430.3,'b3-final','Daughter across the highway, Vera across the roof'),
 (438.5,'b3-final','What she wants is hanging from Dannys belt'),
 (446.8,'b3-close','Final original question: what did she think was behind that door?'),
]

# Reuse only the six-second bridge and a Chapter One memory. All present-day
# continuation scenes are new paintings with current shoe/keys/injury state.
tasks={
 'drill-alarm': ('crew','FIRST-NIGHT FLASHBACK. Exactly three adult stick figures in the staff passage behind a pretzel shop: woman with short dark hair LEFT keeps pointing at the core drill, two pale-headed men RIGHT operate it against an unmarked concrete wall. In FAR background beyond a partly open staff door, olive-headed stick undead begin crowding toward the noise. No Danny or Theo on ground. The visible shop grille is closed; no open tunnel, no B3 sign.'),
 'pump-voice': ('pump','Present-day ENCLOSED pump room: Danny LEFT and Theo RIGHT sit close beside the bottom ladder rung, talking quietly about the womans voice. Exactly two small FULL translucent camping jugs on floor. Huge tank, pipes, solid concrete ceiling, CLOSED service door. Danny one boot/one dirty sock, gray keys pouch. Theo scarf, scraped calf with torn gray fabric cuff, not yet a fresh bandage.'),
 'crew-delay': ('crew','FIRST-NIGHT FLASHBACK in same pretzel-shop staff corridor: the dark-haired woman LEFT firmly gestures for another minute, one pale stick man CENTER returns from the staff doorway looking frightened and pointing toward approaching olive stick heads in far background. The other pale stick man RIGHT remains at the core drill against the concrete wall. Exactly three living crew adults, no Danny/Theo, no child.'),
 'crew-retreat': ('crew','FIRST-NIGHT FLASHBACK. Same THREE living crew members retreat through an indoor staff door with the portable core drill on its wheeled base: short-haired woman LEFT leads, two pale round-headed black-stick men RIGHT roll machine after her. Dusty partially cut concrete wall stays closed behind them. A small distant olive-headed crowd follows sound down corridor. No Danny, Theo or children; no keys or B3 label.'),
 'monitor-clue': ('style','A FIRST-NIGHT MEMORY: close side view of Danny alone at LEFT in the dark security office watching four CCTV monitors showing the indoor mall staff corridors filling with olive round-headed black-stick undead. No drill/crew visible on CCTV: he did not see them. Screens show only the routes of the crowd. Crop Danny below chest so no footwear state is shown. Faint monitor blue, no text or captions.'),
 'pump-question': ('pump','ENCLOSED pump room. Danny LEFT holds one FULL small camping jug low beside his dirty gray sock, turns toward Theo RIGHT and asks a difficult question about a little girl. Theo shakes his head, then indicates his scraped calf, ready to leave. Second FULL small jug upright on floor. Two people only, no little girl depicted. CLOSED door and solid ceiling, blue pipes. Danny keys remain in opaque sock pouch.'),
 'jug-catch': ('pump','ENCLOSED pump room action: Danny LEFT has just stood too fast and recoils after bumping his LEFT shoulder on the ladder side rail. A FULL small jug tilts in front of him; Theo RIGHT reaches with BOTH black mittens and catches its HANDLE before it hits floor. Other full jug upright safe beside tank. Nothing spilled/broken yet. Danny one black boot/gray sock, Theo scraped calf, gray keys pouch; no gore, no open ceiling.'),
 'keys-fist': ('pump','Tight cinematic view inside pump room. Danny LEFT grips the tied OPAQUE GRAY SOCK containing his keys so firmly it creases under his black mitten. NO exposed gold keys or text. His pale head beneath navy cap looks angry and torn; Theo RIGHT in background waits beside the two full small jugs, favouring injured calf. Ladders and tank, enclosed dark concrete room. Hands are black mittens, no flesh.'),
 'return-cross': ('ceiling','RETURN TRIP high above the mall, AFTER Dannys rescue. On a DIFFERENT intact heavy steel support around the broken ceiling section, Danny LEFT and Theo RIGHT crawl cautiously home. Exactly TWO FULL compact handled translucent jugs rest on the broad steel between them. Danny LEFT black boot/RIGHT dirty gray sock, keys sock pouch; Theo scarf/trainers, scraped calf, slight limp. Through the gap far below: dense olive stick crowd around DRY fountain, with ONE loose abandoned black boot lying in basin and navy-capped olive Marcus among crowd. Danny/Theo remain high above, not on mall floor.'),
 'choice-buckle': ('return','Same RETURN steel beam. Danny LEFT crouches on solid steel, Theo RIGHT loses footing as his injured calf buckles and one trainer slips over the jagged edge. Danny reaches toward Theos wrist. Exactly TWO FULL small jugs on the beam, one safe LEFT of Danny, one RIGHT beside Theo. Dense olive stick crowd far BELOW, dry fountain. Danny one boot/gray sock, keys muffled. Theo is the one slipping this time; Danny is the rescuer.'),
 'choice-catch': ('return','Return-trip rescue. Danny firmly on LEFT solid platform catches THEOS right-side wrist while Theo RIGHT hangs at the edge, gray-green scarf, feet below edge. One full small jug is safely on FAR LEFT; the SECOND FULL jug slides along the beam on RIGHT near the edge. Danny momentarily extends his free mitten toward the sliding jug while his other hand holds Theo. Clearly only two people, two jugs, no extra arms. Danny one black boot/gray sock, gray keys pouch; crowd far below.'),
 'choice-release': ('return','Return-trip CHOICE, cinematic side shot. Danny LEFT on solid steel now uses BOTH black mitten hands to hold and pull Theo RIGHT up from the edge. He lets the SECOND FULL water jug fall away at far RIGHT, just below platform. The FIRST FULL jug stays safe FAR LEFT. Theo is being rescued, Danny is firmly above on platform, one boot/gray sock, keys pouch. The falling jug has no arm attached. Dense olive heads far below, dry fountain; no Danny/Theo on ground.'),
 'choice-fall': ('return','Close detail of the LOST SECOND small water jug striking a LOWER STEEL LEDGE inside the mall ceiling space, a short distance below the upper beam. Jug cap comes off and clear water pours away in a stream toward the mall far below; its handle bent, casing cracked. At TOP LEFT edge of frame only Dannys gray-socked foot on upper platform; Theo and Danny otherwise out of frame. A separate FULL first jug remains visible safely on upper LEFT beam. Dense olive stick crowd far below, fountain DRY, water comes only from jug. No jug reaching the ground; it remains retrievable from ledge.'),
 'choice-haul': ('return','Danny LEFT hauls Theo RIGHT onto solid steel using both black mitten hands, teen now lying on platform, scarf and scraped calf/trainers. Danny kneels securely with one BLACK boot and one GRAY sock. One FULL jug safe on far LEFT. The damaged EMPTY second jug is on a LOWER LEDGE at far RIGHT, visible but beyond Theos foot. They are ABOVE the mall crowd. No new falling, no reversal of rescue roles. Keys gray pouch.'),
 'choice-retrieve': ('return','AFTER Theo is safely seated on TOP platform RIGHT, Danny LEFT crouches on the same upper beam and retrieves the damaged EMPTY second jug from a LOWER LEDGE using a loop of climbing strap under its bent handle. He does not climb down. The surviving FULL first jug remains safely on upper FAR LEFT. Theo watches, accepting Dannys help; scarf and scraped calf. One boot/gray sock, gray keys pouch. Crowd remains far below around dry fountain.'),
 'photo-home': ('cinema','Return to ENCLOSED cinema service platform. Danny LEFT looks down at one FULL small jug and one visibly cracked EMPTY jug while Theo RIGHT rolls his stained blanket around a FACE-DOWN photograph so Danny cannot see picture. Three old empty bottles and folded hoodie at nest. Danny has one black boot/gray sock, keys pouch; Theo scarf/trainers and scraped calf. No working projector or outside sky.'),
 'rack-home': ('store','Inside Summit Outdoors, return via the CEILING RACK, not front gate. Danny on LEFT descends the tall storage shelves from the raised ceiling tile, one black boot/one dirty sock. Theo on RIGHT already on shop floor steadies rack upright with black mittens, favouring scraped calf. Exactly one FULL jug and the cracked EMPTY second jug stand on floor beside him. Tents and camping stock painted richly, front grille CLOSED and padlocked, no zombies inside shop. No ladder descent repeated.'),
 'lock-return': ('store','Inside camping store, Danny LEFT has one black mitten resting on CLOSED padlock of fully CLOSED metal shop grille, then looks back toward Theo RIGHT sitting on an overturned camping bucket. One FULL jug and cracked EMPTY jug beside Theo, small scrape on calf, scarf. All zombies are in corridor OUTSIDE closed grille. Danny one black boot/gray sock, gray keys pouch. The emotional point is that Theo brought them home through the ceiling, not by this gate.'),
 'first-aid': ('store','Inside camping store. Danny LEFT crouches with open FIRST-AID BOX, carefully cleans a restrained small scrape on Theos RIGHT black-stick calf and applies a small CLEAN WHITE bandage. Theo RIGHT sits on bucket, gray-green scarf, trainers, trusts reluctantly. One small bottle of clean water and one opened bandage wrapper on floor. One FULL camping jug and cracked EMPTY jug behind. Danny one black boot/gray sock, keys pouch. No flesh or gore, thin stick anatomy remains; white bandage only on calf.'),
 'roof-solo': ('roof','NIGHT FOUR: Danny ALONE on mall rooftop LEFT seen from behind/three-quarter view, navy cap, one black boot/one gray sock if feet in frame, keys still sock-wrapped. He holds a switched-OFF flashlight pointed toward a dark TEN-FLOOR apartment building on RIGHT across unlit highway traffic. Apartment front facade clear with FOUR equal window columns and TEN rows; uppermost row is tenth floor, far-right window blank dim-gray unlit. No Theo on roof, no active light or beam. Use wide full composition suitable for precise three-pulse light added later.'),
 'sleep-home': ('store','Night in camping store. Theo RIGHT asleep wrapped in his old blanket beside the ONE surviving FULL water jug, cracked EMPTY jug visible nearby. Danny LEFT partly seen at the open roof-hatch doorway above storage steps, looking down checking boy is still there, flashlight OFF. Closed camping-store grille in distance, tents and blue shadows. Fresh small white bandage on Theos calf. Danny one black boot/gray sock, keys pouch.'),
 'wrappers': ('store','Day five inside camping store, intimate view of Theo on RIGHT folding a used bandage wrapper inside another wrapper and compressing the tiny packet with black mittens, empty protein-bar wrapper nearby. Clean WHITE bandage on right calf, scarf, gray trainers. Danny LEFT watches quietly holding the closed first-aid box. One full jug and cracked empty jug, tents and shelf. Danny one black boot/gray sock. No new injury or blood, no medical procedure here.'),
 'leaving': ('store','Morning day five. Theo RIGHT stands beside tall stockroom rack under raised ceiling tile, his stained blanket rolled under one arm, ready to return above the cinema. He leans weight away from freshly bandaged right calf. Danny LEFT pauses with a storage box in his mittens and asks where he is going. Theo scarf/trainers, Danny cap/one black boot/gray sock, gray keys pouch. Two tents visible deeper in shop, full jug and cracked empty jug at base of rack; front grille closed.'),
 'pick-tent': ('store','Danny LEFT gestures with an open black mitten toward TWO camping tents inside Summit Outdoors: one already contains Dannys navy sleeping bag, the other is open and empty for Theo. Theo RIGHT with rolled blanket watches uncertainly, white bandage at calf, scarf. This is an offer to stay, no eviction or trade. One full jug and damaged empty jug nearby, closed front grille in background. Danny one black boot/gray sock, keys pouch, thin black single-line torso.'),
 'clean-offer': ('store','Danny LEFT offers Theo RIGHT a CLEAN LIGHT-GRAY FOLDED SWEATSHIRT from a camping shelf. Theo holds it carefully and folds it precisely, no large filled clothing on bodies: black single-line stick anatomy stays visible. Theo scarf, gray trainers, white calf bandage, rolled blanket now by open tent. Danny navy cap, one black boot/gray sock. One full jug and cracked empty jug. Warm small camping lantern and slate-blue shop, closed grille.'),
 'vera-call': ('store','Dusk in camping store. Danny LEFT holds a black handheld radio close to his pale head, listening with suspicion, navy cap, thin stick body and one black boot/gray sock, gray keys pouch. Theo RIGHT watches from the open tent, a folded clean light-gray sweatshirt inside, white calf bandage/scarf/trainers. One full jug and cracked empty jug at tent. No Vera or little girl visible in store. Radio orange tiny indicator on, front grille closed.'),
 'answer-coat': ('store','Dusk camping-store close two-shot. Danny LEFT deliberately holds radio button down with his black mitten, asking about the coat. Theo RIGHT watches Dannys face from open tent behind. Danny pale head/navy cap, suspicious still gaze, gray keys pouch (if visible), no feet needed in close framing. Theo scarf, only two black oval eyes. Paint detailed tents/stock softly behind, no cut to Vera shopping and no imaginary little girl.'),
 'theo-request': ('store','Five to nine in camping store. Danny LEFT takes a switched-OFF flashlight from a shelf while leaving his black radio set down OFF on the table. Theo RIGHT beside his chosen open tent looks up asking to see the signal, pulling a clean light-gray garment into small collar/cuffs at neck/wrists; keep the delicate black SINGLE-LINE spine and limbs exposed rather than a filled uniform torso. Keep gray-green scarf as identity accent, white bandage at calf/trainers. Danny one black boot/gray sock, gray key pouch. Lantern low, no zombies inside.'),
 'roof-both': ('roof','NIGHT FIVE mall rooftop. Danny LEFT and Theo RIGHT stand just in front of the CLOSED roof hatch, looking across a dark unlit highway to ten-floor Parkview apartment tower in deep RIGHT background. Danny pale head/navy cap/one black boot/gray sock, flashlight OFF and pointed low. Theo pale head/scarf, small clean gray neck/wrist cuffs, thin exposed black stick spine, white bandage on right calf, grey trainers, keeping weight off it. Keys still completely inside gray sock pouch. No woman or beam yet. Sky and streets dark; only subtle moon edge light, all apartment windows dark.'),
 'lily-window': ('roof','NIGHT FIVE over-the-shoulder view of Danny LEFT and Theo RIGHT as cropped foreground heads/shoulders, watching Parkview across highway. Place TEN-FLOOR apartment tower CLEARLY in RIGHT HALF of frame, nearly front-on facade exactly FOUR window columns and TEN rows. The UPPERMOST FAR-RIGHT window is the fourth from left on tenth floor, plain dim-gray glass, no light baked in. Other windows dark, no silhouettes crossing them. Black highway and stopped traffic below, no streetlamps. Both flashlights OFF; Danny navy cap, Theo scarf and small gray cuff collar, thin black single-line bodies. Design this still for animated window flashes added later.'),
 'danny-answer': ('roof','NIGHT FIVE medium close view of Danny LEFT holding his switched-OFF flashlight aimed diagonally toward Parkview tower HIGH RIGHT across highway. Clearly show lamp lens near center-left at safe margin, not cut off. Theo RIGHT stands next to roof hatch watching him, scarf and small clean gray cuff collar, pale spherical head, black stick spine. NO light beam or glare baked into lens, no other light signals. Keys wrapped, one black boot/gray sock if feet visible. Dark painterly city, apartment dim. This picture will receive timed flashlight pulses.'),
 'vera-signal': ('roof','NIGHT FIVE, intrusion. Over Danny LEFT and Theo RIGHT foreground shoulders, both on safe mall roof, look diagonally RIGHT toward a LOWER DEPARTMENT-STORE ROOF in middle-right distance. An anonymous dark-haired woman silhouette stands on THAT distant roof near a roof door, holding an OFF flashlight pointed diagonally up-right toward Parkview tower across highway in FAR UPPER-RIGHT background. No baked beam, glow or active windows: light pulses will be added in animation. Dannys own flashlight held lowered and OFF. Navy cap Danny, scarf/small gray cuff collar Theo. Both retain black stick bodies. Keep woman a small distant stick silhouette, no child, no woman on Dannys roof, no street lights.'),
 'switch-still': ('roof','NIGHT FIVE close dramatic view of Danny LEFT staring toward department-store roof OFFSCREEN RIGHT, his black thumb rests motionless on OFF flashlight switch held low in foreground. Theo RIGHT watches his face, scarf and small clean-gray collar, pale head/two oval eyes. Neither flashlight nor radio has any glow. Danny keeps key bundle inside gray sock pouch. No visible active window signals; cool painted night, rooftop hatch edge and black highway behind. No mouths/noses/flesh.'),
 'theo-question': ('roof','NIGHT FIVE intimate rooftop two-shot. Theo RIGHT looks from the now-DARK distant department-store rooftop toward Danny LEFT and quietly asks who it is. Danny lowers his flashlight toward his pocket, OFF; both softly shaded pale heads and thin black spines, cap and scarf/small clean gray collar. A bandaged calf visible only if wide. No radio transmission or active lights, no third person on this roof. Dark apartment tower across highway in background.'),
 'night-quiet': ('roof','NIGHT FIVE wide quiet rooftop. Danny LEFT stands still looking toward now completely DARK Parkview windows across highway. Theo RIGHT touches Dannys thin black forearm/sleeve cuff gently with one black mitten. Danny OFF flashlight inside pocket/held low, no beam. Theo scarf, small light-gray collar/cuffs, white bandage on calf and gray trainers; Danny one black boot/gray sock, keys still gray pouch at hip. Department-store roof distant RIGHT also DARK and anonymous woman not visible. No city street lights.'),
 'keys-loose': ('roof','NIGHT FIVE close rooftop detail with partial Danny navy-capped head at LEFT and Theo scarf/pale head at RIGHT, both looking DOWN at Dannys hip. The gray sock wrapping has loosened, revealing a bundle of gold keys and ONE worn RED rectangular key tag facing camera near center. Tag face blank weathered dark red, no letters yet; typography will be added later. Danny black mitten closes around the ring. Dark rooftop and distant highway behind, no lit windows. No extra keys on Theo.'),
 'b3-close': ('key','Preserve the reference key bundle, one black mitten hand, long old metal key and the clearly readable worn RED B3 tag exactly. Change ONLY its blurred mall-directory/daylight backdrop to a richly painted DARK NIGHT ROOFTOP with soft blue parapet stone and a faint distant dark apartment building across highway. No directory/map indoors, no active signals, no new characters or extra text. A close-up key seen during the final rooftop conversation.'),
 'b3-final': ('roof','FINAL rooftop confrontation with the mystery, not a new physical door. Danny LEFT and Theo RIGHT, close waist-up, both pale shaded spherical heads/two black oval eyes and single-line black torsos. Danny navy guard cap holds a large old key with worn RED rectangular tag near center foreground in his black mitten. Tag front blank dark red, no letters; text added later. Theo scarf/small clean-gray collar watches it. Gray sock hangs loose from key ring. FAR RIGHT background very dim ten-floor Parkview and LOWER department-store roof, both dark, a black highway between them. No actual B3 door, no invented underground room, no active flashlight, no woman next to Danny. Rich painted blue night and restrained warm edge light.'),
}

refs={
 'crew':'public/mall/ch2/story-art/part-two-v1/drill-wall.png',
 'pump':'public/mall/ch2/story-art/part-two-v1/drill-witness.png',
 'style':'public/mall/ch2/story-art/theo-perch.png',
 'ceiling':'public/mall/ch2/story-art/part-two-v1/theo-cut.png',
 'return':'public/mall/ch2/story-art/part-three-v1/return-cross.png',
 'cinema':'public/mall/ch2/story-art/part-two-v1/cinema-nest.png',
 'store':'public/mall/ch2/story-art/theo-perch.png',
 'roof':'public/mall/ch2/story-art/part-two-v1/family-window.png',
 'key':'public/mall/ch1/story-art/painted-v1/b3-key.png',
}

if __name__=='__main__':
 shots=[];frames=END-START
 for i,(t,asset,note) in enumerate(beats):
  a=round(t*30);b=round(beats[i+1][0]*30) if i+1<len(beats) else frames
  n=(b-a+299)//300
  for j in range(n):
   start=a+round((b-a)*j/n);end=a+round((b-a)*(j+1)/n)
   path=asset if '/' in asset else 'part-three-v1/'+asset
   shots.append(dict(start=start,frames=end-start,asset=path,view=['wide','detail','character'][(i+j)%3],note=note))
 counts=Counter(s['asset'] for s in shots);assert max(counts.values())<=3,counts
 plan=dict(version=1,fps=30,frames=frames,retentionStartFrame=START,retentionStoryEndFrame=END,tailFrames=0,overlapFrames=36280-START,ending='What did she think was behind that door?',shots=shots)
 (ROOT/'src/mall/chapter2/illustrated-part-three.json').write_text(json.dumps(plan,indent=2)+'\n')
 (HERE/'artwork-tasks.json').write_text(json.dumps([dict(name=k,scene=s,refs=[refs[r]],edit=k=='b3-close') for k,(r,s) in tasks.items()],indent=2)+'\n')
 print(dict(seconds=frames/30,shots=len(shots),images=len(counts),new=len(tasks),maxUses=max(counts.values()),overlapSeconds=(36280-START)/30))
