#!/usr/bin/env python3
"""The Night Guard, Chapter 1 (about 15 minutes): the script, and everything made from it.

This file is the script. Running it writes:
  - images/mall/chapter1/script.md       the script to read, segment by segment, with pictures
  - images/mall/chapter1/lines.json      every line's id, segment, speaker, words and picture
  - images/mall/vo/ch1/plan.json         the voice plan (voice_gemini.py), approved recipe
  - images/mall/vo/ch1/cands.json        the new lines, several takes each, for pick_takes.py
and copies the approved takes it reuses (Shorts 1-3 and the first minute) into vo/ch1/takes/.

usage: python3 images/mall/chapter1/make_plans.py
"""
import json
import pathlib
import re
import shutil

HERE = pathlib.Path(__file__).resolve().parent
MALL = HERE.parent
VO = MALL / "vo" / "ch1"

# Loudness of each kind of line (LUFS, one fixed gain per line; see voice-recipe.md). The long
# chapter keeps the quiet lines closer to the story than the 25-second cold open did, so the
# middle of the chapter is still easy to hear on a phone.
S, T, D = -18.0, -20.0, -22.5  # story, tense, danger close
GATE = -21.0  # Marcus talking through the bars
RADIO = -19.5  # Marcus and the woman on the walkie-talkie
BROADCAST = -20.0

DANNY_PROFILE = ("Danny, a regular guy in his late thirties. He is genuinely a little scared and still shaken, and he tells "
                 "what happened plainly and honestly, in a natural voice with very little inflection, keeping his pitch fairly "
                 "level and even, like a real person, not an actor.")
VOICES = {
    "danny": {"voice_name": "Algenib", "audio_profile": DANNY_PROFILE, "accent": "American (Gen)"},
    "marcus": {"voice_name": "Orus", "audio_profile": "Marcus, 22, a big, easygoing young man with a deep voice, talking low into his walkie-talkie.",
               "accent": "American (Gen)"},
    "marcus_gate": {"voice_name": "Orus",
                    "audio_profile": ("Marcus, 22, a big, easygoing young man with a deep voice. He is badly hurt and worn out, sitting "
                                      "against the bars of a store gate in the dark, talking to his best friend on the other side. He "
                                      "still sounds like himself, warm and a little funny."),
                    "accent": "American (Gen)"},
    "vera": {"voice_name": "Gacrux",
             "audio_profile": ("Vera, a woman in her forties. Calm, warm and funny, and she never raises her voice. She sounds "
                               "friendly and in control, which is what makes her frightening."),
             "accent": "American (Gen)"},
    "broadcast": {"voice_name": "Charon",
                  "audio_profile": "An official announcer reading a recorded emergency alert, steady, clear and unhurried.",
                  "accent": "American (Gen)"},
}
SCENES = {
    "marcus_gate": "Two best friends talk quietly through the bars of a locked store gate in a dark mall, during a zombie outbreak.",
    "vera": "A woman talks over a security walkie-talkie at night, unhurried and amused, to a man hiding in a locked store.",
    "vera_scared": "A frightened woman whispers into a security walkie-talkie, hiding upstairs in a dark department store at night.",
    "broadcast": "A recorded emergency alert plays on a hand-crank camping radio.",
    "marcus_joke": "Late at night in a parking garage, a cheerful young security guard tells his friend a corny joke over a walkie-talkie, grinning.",
    "marcus_hurt": "A badly hurt young security guard speaks into his walkie-talkie from the floor of a parking garage.",
}
DANNY_SCENE = ("A man quietly tells what happened during the first hour of a zombie outbreak at the mall where he works. "
               "Close to the microphone, plain and natural, no music.")

# where the reused takes and their chunk definitions live
REUSE_PLANS = {"s1": "vo/shorts/s1/plan.json", "s2": "vo/shorts/s2/plan.json", "s3": "vo/shorts/s3/plan.json",
               "v10": "vo/v10/b/plan.json"}
REUSE_TAKES = {"s1": "vo/shorts/takes", "s2": "vo/shorts/takes", "s3": "vo/shorts/takes", "v10": "vo/v9/takes"}


def reuse(src, cid, lufs, gap, pic):
    return {"reuse": src, "id": cid, "lufs": lufs, "gap": gap, "pic": pic}


def n(cid, text, lufs=S, gap=0.2, pic="", takes=2):
    """a line of Danny's narration"""
    return {"id": cid, "who": "danny", "text": text, "lufs": lufs, "gap": gap, "pic": pic, "takes": takes}


def say(cid, who, text, lufs, gap=0.3, pic="", style="Deadpan", radio=None, scene=None, takes=3):
    """a line from someone else: Marcus at the gate, or a voice on a radio"""
    return {"id": cid, "who": who, "text": text, "lufs": lufs, "gap": gap, "pic": pic, "style": style, "radio": radio,
            "scene": scene, "takes": takes}


def together(cid, who, lines, lufs, gap, takes=3, style="Deadpan", radio=None, scene=None, max_pause=None):
    """short lines recorded as one take (so they sound like one moment), then cut apart:
    lines are (text, gap after, picture). max_pause keeps longer pauses inside the take (counted beats)."""
    return {"id": cid, "who": who, "lines": [{"text": t, "gap": g, "pic": p} for t, g, p in lines], "lufs": lufs, "gap": gap,
            "takes": takes, "style": style, "radio": radio, "scene": scene, "max_pause": max_pause}


SEGMENTS = [
    {"n": 1, "title": "The Gate", "tag": "NIGHT 1 · 2:45 A.M.", "lines": [
        reuse("s1", "w1", D, 0.25, "Through the bars: dead Marcus pressed against the sporting goods gate."),
        reuse("s1", "s1_b2", D, 0.25, "The hallway behind him, full of them."),
        reuse("s1", "w2", D, 0.35, "Close on the radio clipped to his chest, circled. Danny on the floor, hand over his mouth."),
        reuse("s1", "q1n1", -18.5, 4.0, "Danny in Lily's paper crown holding up his keys. Rewind. Then the title card: CHAPTER ONE, THE KING OF THE MALL."),
    ]},
    {"n": 2, "title": "Forty-Two Keys", "tag": "9:00 P.M. · THE NIGHT IT STARTED", "lines": [
        reuse("s2", "k1", S, 0.2, "Danny holds up the key ring in the concourse."),
        reuse("s2", "k2", S, 0.35, "Close on the ring: one key with a red tag."),
        reuse("v10", "n2", S, 0.2, "Danny in the concourse. Name tag: DANNY RUIZ, NIGHT GUARD."),
        reuse("s2", "k4", S, 0.25, "The bus stop, the 3:15 clock, Lily running off the bus."),
        n("c2r", "My shift is nine to five. Mostly I walk, I check doors, and I eat the pretzels the food court guy was going to throw out anyway.", S, 0.25,
          "Danny on his rounds with a pretzel, checking a door."),
        n("c2a", "She's seven, and she thinks I'm the king of the mall. She drew me a picture once, me in a crown, holding up my keys. "
                 "It's taped to the monitor in the security office.", S, 0.25,
          "Lily's crayon drawing, MY DAD IS THE KING OF THE MALL, taped to a monitor."),
        reuse("s2", "k5", S, 0.25, "Night: Parkview tower across the highway. Tenth floor, fourth window, circled."),
        reuse("s2", "k6", S, 0.2, "The window blinks: one, two, three. 9:00 PM."),
        reuse("s2", "k7", S, 0.35, "Danny in the parking lot answers with three flashes."),
        reuse("s2", "k8", S, 0.25, "The window blinks SOS."),
        n("c2b", "I really hope she never has to use it.", S, 0.4, "Danny looks up at the lit window.", takes=3),
        reuse("s2", "k9", S, 0.2, "The security office: old Walt hands Danny the ring."),
        reuse("s2", "k10", -20.0, 0.3, "Close on Walt, serious."),
        reuse("s2", "k11", S, 0.35, "The tag reads B3. The mall map, with no B3 anywhere."),
        reuse("s2", "q2", T, 0.35, "The padlock on the sporting goods gate."),
        reuse("s2", "k13", S, 1.4, "A steel door in the dark, stencilled B3."),
    ]},
    {"n": 3, "title": "One-Forty", "tag": "1:00 A.M.", "lines": [
        reuse("s3", "m1", S, 0.2, "Danny in the security office, radio in hand. 1:00 AM."),
        reuse("s3", "m2", T, 0.35, "Close on the radio."),
        reuse("s3", "m3", S, 0.25, "Marcus in the garage with his nursing book. MARCUS, 22, NURSING STUDENT, OWES ME $20."),
        n("c3a", "He lost a bet on a football game back in September, and he's been dodging me ever since.", S, 0.3,
          "Marcus grinning, turning out empty pockets."),
        reuse("s3", "m4", S, 0.3, "The radio on the desk crackles."),
        reuse("s3", "j12", RADIO, 0.3, "Marcus grinning into his radio, then laughing at his own joke."),
        reuse("s3", "m7", S, 0.35, "Danny, half a smile."),
        reuse("s3", "m8", T, 0.3, "1:40 AM."),
        reuse("s3", "r1", RADIO, 0.3, "Marcus crouched by a car. A man limping up the ramp."),
        reuse("s3", "m10", T, 0.3, "Close on Danny's face."),
        reuse("s3", "j3", RADIO - 0.5, 0.4, "Marcus stepping toward the man."),
        reuse("s3", "m12", T, 0.3, "Danny stares at the radio."),
        reuse("s3", "m13", -21.0, 1.4, "The waves stop. NO SIGNAL."),
    ]},
    {"n": 4, "title": "Camera Six", "tag": "1:41 A.M. · SECURITY OFFICE", "lines": [
        n("c4z", "I said his name into the radio. Then I said it again. Nothing.", T, 0.3, "Danny with the radio to his mouth."),
        n("c4a", "The security office has a wall of screens, one for every camera in the building.", S, 0.2,
          "The office: the wall of monitors glowing."),
        n("c4b", "In six years, the most exciting thing I've seen on them is a raccoon in the food court. Twice. Same raccoon.", S, 0.3,
          "A security-camera shot of the food court with a raccoon on a table. Then the same raccoon again."),
        n("c4c", "I pulled up camera six. The garage, level two.", T, 0.2, "Security camera: garage, level two. CAM 6."),
        n("c4d", "Marcus was on the ground, and the man from the ramp was on top of him.", T, 0.25,
          "Security camera: Marcus down, the man over him."),
        n("c4e", "Behind them, more were coming up the ramp from the highway. Six. Ten. Thirty.", T, 0.25,
          "Security camera: the ramp filling up. Counter: 6, 10, 30."),
        n("c4f", "They weren't running. They just walked, all at the same slow speed, like a crowd leaving a stadium.", T, 0.2,
          "The crowd on the ramp, all walking the same way."),
        say("c4g", "marcus", "[weak, hurting] Danny... don't come down. Lock up.", RADIO, 0.35,
            "Security camera: Marcus on the ground, his hand on his radio.", radio="marcus", scene=SCENES["marcus_hurt"]),
        n("c4h", "I'd like to tell you I ran down there. I didn't. I stood in that office with my hand on the door, and I watched.", T, 0.25,
          "Danny frozen at the office door, hand on the handle, the screens glowing behind him."),
        n("c4i", "Then I picked up the phone and called nine-one-one. It rang and rang, and then a recording said all circuits were busy.", T, 0.25,
          "Danny with the desk phone. ALL CIRCUITS ARE BUSY."),
        n("c4j", "My mom's phone went straight to voicemail. So did the next nine calls.", T, 0.3,
          "Danny's phone: MOM, calling. Voicemail. A call log, ten times."),
        n("c4k", "And then every one of them on that screen turned the same way. Not toward the street. Toward the mall.", T, 0.25,
          "Security camera: the whole crowd turns toward the mall."),
        n("c4l", "One camera after another, I watched them come inside. The loading dock. The service hall. The doors by the restrooms.", S, 0.2,
          "The monitor wall, screen after screen showing them coming in."),
        n("c4m", "The only screen that stayed black was camera fourteen, the hallway behind the food court. It had been out since "
                 "Tuesday. I'd put in a ticket.", S, 0.3, "One black monitor: CAM 14, NO SIGNAL. A sticky note: TICKET PUT IN TUESDAY."),
        n("c4n", "They were all heading for the food court. And the food court is made of glass.", T, 1.4,
          "The food court's glass wall, and the crowd massing outside it."),
    ]},
    {"n": 5, "title": "Four Minutes", "tag": "1:44 A.M.", "lines": [
        n("c5a", "I did the math. At the speed they were walking, I had about four minutes.", T, 0.2, "A countdown: 4:00."),
        n("c5b", "Four minutes to pick the one store I'd survive in. Which one would you pick?", S, 0.3,
          "The mall map with four stores marked, and a question mark."),
        n("c5c", "Here's the thing about malls. They're built to let people in. That's the whole point of them.", S, 0.2,
          "The wide concourse, entrances everywhere."),
        n("c5d", "But every store has a steel gate. And I have every key.", S, 0.3, "Store gates; the key ring."),
        together("c5e", "danny", [
            ("The pharmacy has medicine. It's also all glass.", 0.3, "The pharmacy: all glass front. A red X."),
            ("The food court has food, and that's exactly where they're going.", 0.3, "The food court, the crowd heading for it. A red X."),
            ("The department store has beds, and nine different entrances.", 0.3, "The department store, nine arrows. A red X."),
            ("And Summit Outdoors has tents, water filters, baseball bats, and one way in.", 0.3,
             "Summit Outdoors: tents, bats, one gate. A green check."),
        ], S, 0.3, takes=3),
        n("c5e2", "Every night guard has a zombie plan. Mine was Summit Outdoors. I just never thought I'd actually use it.", S, 0.25,
          "Danny's old doodle of the plan on a napkin: SUMMIT OUTDOORS, circled."),
        n("c5f", "Mall cops aren't exactly famous for running. I ran.", S, 0.2, "Danny running down the concourse."),
        n("c5g", "Down the escalator, past the fountain, past the pretzel place, with the keys already in my hand.", T, 0.25,
          "Running past the escalator and the fountain, speed lines."),
        n("c5h", "I was ten feet from the gate when I heard it.", T, 0.2, "Danny at the Summit Outdoors front, freezing."),
        n("c5i", "Behind me, the food court doors exploded.", T, 1.4, "The food court glass bursts inward."),
    ]},
    {"n": 6, "title": "Key Thirty-One", "tag": "1:48 A.M. · SUMMIT OUTDOORS", "lines": [
        n("c6a", "Key thirty-one. Under the gate, pull it down, lock it.", T, 0.2, "The gate coming down; the padlock; tag 31."),
        n("c6b", "I've done that a thousand times. I have never done it that fast.", T, 0.3, "Danny's hands on the lock."),
        n("c6c", "Then I sat down in the dark, between the tents, with my hand over my mouth.", D, 0.25,
          "Danny sitting between the tents, hand over his mouth."),
        n("c6d", "Through the gate, I could hear them filling up the hallway. Shuffling. Bumping into things. Dozens of feet that "
                 "never quite left the floor.", D, 0.25, "Shapes passing beyond the gate."),
        n("c6e", "I did the breathing thing Lily learned in second grade. In for four. Out for four.", D, 0.3,
          "Danny breathing slowly; a little memory of Lily showing him."),
        n("c6f", "Once, something leaned on my gate, and the whole thing groaned. Then it moved on.", D, 0.3,
          "The gate bulges inward, then settles."),
        n("c6g", "Lily's drawing was still up in the security office. I remember thinking, the king of the mall is hiding in a tent.", T, 0.3,
          "The crayon drawing; then Danny peeking out of a tent."),
        n("c6h", "Twenty minutes went by. Then thirty.", T, 0.3, "Clock: 2:08. Then 2:18.", takes=3),
        n("c6h2", "I started to think maybe that was it. They'd wander off, and in the morning it'd be on the news, and I'd be a funny story.", T, 0.3,
          "Danny's head back against a tent pole, almost smiling."),
        together("c6i", "danny", [
            ("And then somebody knocked.", 0.35, "The dark gate."),
            ("One knock. Two quick ones. One more.", 0.3, "Knuckles on the gate."),
            ("Our knock. The one Marcus and I use on the office door.", 0.35, "Danny's eyes, wide."),
        ], D, 0.35, takes=3),
        say("c6k", "marcus_gate", "Danny. It's me.", GATE, 0.35, "A shape at the gate.", scene=SCENES["marcus_gate"]),
        n("c6l", "He knew which store I'd pick. Of course he did.", T, 0.25, "Danny, closing his eyes."),
        n("c6m", "I turned on my flashlight for one second.", D, 0.25, "Click: the flashlight beam."),
        n("c6n", "His face was gray. And his whole sleeve was dark and wet.", D, 0.3, "Marcus behind the bars, gray, his sleeve dark."),
        n("c6o", "I had the key in my hand.", D, 1.4, "Close on the key in Danny's hand.", takes=3),
    ]},
    {"n": 7, "title": "The Last Joke", "tag": "2:00 A.M.", "lines": [
        say("c7a", "marcus_gate", "Come on, man. Open it. Please.", GATE, 0.35, "Marcus at the gate, hand on the bars.",
            scene=SCENES["marcus_gate"]),
        n("c7b", "There was a bite on his arm. I could see it in the light.", D, 0.25, "His arm, a dark mark on it."),
        n("c7c", "And past him, at the end of the hall, there were dozens of them. Standing still. Listening.", D, 0.25,
          "The far end of the hallway: a crowd standing still."),
        n("c7d", "If I opened that gate, they'd all come in with him.", T, 0.25, "The lock, the key, the crowd beyond."),
        n("c7e", "My hand was shaking so hard the keys were rattling. I had to press them against my chest to make them stop.", D, 0.3,
          "Shaking keys, pressed to his chest."),
        n("c7f", "Marcus watched my face. And he got it before I did.", T, 0.35, "Marcus's face, understanding."),
        say("c7g", "marcus_gate", "Hey. It's okay. I wouldn't open it either.", GATE, 0.4, "Marcus, a tired smile.",
            scene=SCENES["marcus_gate"]),
        n("c7h", "He sat down with his back against the bars, and I sat down on my side, and we whispered for forty minutes.", T, 0.25,
          "The two of them back to back, the gate between them."),
        n("c7i", "About stupid stuff. The Bills. His mom's lasagna. The time he got locked in a fitting room at the department store "
                 "and I had to come get him out.", T, 0.3, "Warm memory pictures: a football game, a lasagna, Marcus in a fitting room."),
        say("c7j", "marcus_gate", "I'm not gonna lie, man. I'm kind of scared.", GATE, 0.35, "Marcus, head back against the bars.",
            scene=SCENES["marcus_gate"]),
        n("c7k", "So was I. I told him I was right here, and I wasn't going anywhere. Which was true. That was the whole problem.", T, 0.3,
          "Danny's hand flat against the gate."),
        say("c7l", "marcus_gate", "Tell Lily the king's still in his castle.", GATE, 0.35, "Marcus, eyes closed.",
            scene=SCENES["marcus_gate"]),
        n("c7m", "Then, because he's Marcus, he told me one more terrible joke.", T, 0.25, "Marcus grins."),
        together("c7n", "marcus_gate", [
            ("What's a zombie's favorite kind of bean?", 0.6, "Marcus, grinning."),
            ("A human bean.", 0.35, "Marcus laughing weakly."),
        ], GATE, 0.35, takes=3, style="Vocal Smile", scene=SCENES["marcus_gate"]),
        n("c7o", "It wasn't funny. I laughed so hard I had to put my face in a sleeping bag.", T, 0.35,
          "Danny with his face in a sleeping bag, shoulders shaking."),
        say("c7p", "marcus_gate", "And Danny? I still owe you twenty bucks.", GATE, 0.5, "Marcus's hand on the bars.",
            scene=SCENES["marcus_gate"]),
        together("c7q", "danny", [
            ("At two thirty-one, Marcus stopped breathing.", 0.7, "Clock: 2:31 AM. Marcus still."),
            ("At two thirty-nine, he stood up.", 1.6, "Clock: 2:39 AM. Marcus rising."),
        ], D, 1.6, takes=3),
    ]},
    {"n": 8, "title": "The Radio", "tag": "2:45 A.M.", "lines": [
        n("c8a", "He didn't look at me. He just stood there with his face against the bars.", D, 0.3, "Dead Marcus at the gate."),
        n("c8b", "Two forty-five in the morning. That's where you came in.", T, 0.35, "The cold-open picture again. 2:45 AM."),
        n("c8c", "Then my radio crackled.", D, 0.3, "Danny's radio on the floor, its light on.", takes=3),
        say("c8d", "vera", "Is anyone still in the mall? I'm on the second floor of the department store. Please. I'm not alone up here.",
            RADIO, 0.3, "A radio wave icon. The department store, dark, second floor.", style="Whisper", radio="vera",
            scene=SCENES["vera_scared"]),
        n("c8d2", "A woman. Whispering. Somewhere upstairs in my mall.", D, 0.3, "The dark department store upstairs.", takes=3),
        n("c8e", "Her voice came out of my radio. And then, one second later, out of the radio on Marcus's chest.", D, 0.25,
          "Both radios, one after the other."),
        together("c8f", "danny", [
            ("Every head in that hallway turned.", 0.3, "Every head turns."),
            ("Forty of them. One gate.", 0.3, "The crowd and the one gate."),
        ], D, 0.3),
        n("c8h", "They didn't run at it. They leaned on it, all at once, the way a crowd leans on the doors on Black Friday.", T, 0.25,
          "The crowd pressing on the gate; a flash of Black Friday shoppers at the doors."),
        together("c8i", "danny", [
            ("And the steel started to bend.", 0.35, "The gate bending."),
            ("And she was about to call again.", 1.4, "The radio on Marcus's chest, its light on."),
        ], D, 1.4),
    ]},
    {"n": 9, "title": "Through the Bars", "tag": "2:46 A.M.", "lines": [
        n("c9a", "I switched my radio off. But his was still on.", D, 0.25, "Click. Danny's radio dark. Marcus's still lit."),
        n("c9b", "There was only one way to shut it up. I had to reach through the bars and take it off his chest.", D, 0.25,
          "Danny's hand reaching through the bars."),
        n("c9c", "His teeth were about an inch from my wrist. The whole time, he was looking right at me.", D, 0.25,
          "Close: the hand, the radio, Marcus's face."),
        n("c9d", "And the clip stuck. He always wore it upside down. I must have told him a hundred times.", D, 0.3,
          "The clip, upside down."),
        n("c9e", "I twisted it, and it came loose, and I fell back on the floor with it.", D, 0.25, "Danny falling back with the radio."),
        n("c9f", "I stuffed it as deep into a sleeping bag as it would go, and I lay there, not breathing.", D, 0.3,
          "The radio pushed into a sleeping bag."),
        together("c9g", "danny", [
            ("Without the noise, they forgot about me. It took maybe ten minutes. One by one, they drifted back down the hall.", 0.35,
             "The crowd drifting away."),
            ("All except Marcus.", 0.4, "Marcus alone at the gate."),
        ], T, 0.4),
        n("c9i", "Then, from inside the sleeping bag, she said my name.", D, 1.4, "The sleeping bag. A faint glow inside."),
    ]},
    {"n": 10, "title": "She Knew My Name", "tag": "3:05 A.M.", "lines": [
        n("c10a", "When I grabbed that radio, I must have squeezed the talk button.", T, 0.3, "The radio's talk button."),
        say("c10b", "vera", "Danny, right? The night guard. I can hear you breathing.", RADIO, 0.3, "Radio waves.",
            radio="vera", scene=SCENES["vera"]),
        n("c10c", "She didn't sound scared anymore. She sounded like someone ordering a coffee.", T, 0.3, "Danny staring at the radio."),
        together("c10d", "vera", [
            ("Don't worry. I'm not one of them.", 0.5, "Radio waves."),
            ("You've got all the keys, don't you?", 0.35, "The key ring on Danny's belt."),
        ], RADIO, 0.35, radio="vera", scene=SCENES["vera"]),
        n("c10e", "I didn't say a word.", D, 0.35, "Danny's hand over the radio.", takes=3),
        say("c10f", "vera", "That's okay. Get some sleep, Danny. We'll talk tomorrow.", RADIO, 0.4, "Radio waves.",
            radio="vera", scene=SCENES["vera"]),
        n("c10f2", "Then the little light on the radio went out.", T, 0.3, "The radio's light goes out.", takes=3),
        n("c10g", "I didn't sleep. I lay there and listened to Marcus lean on the gate every few minutes, like he was checking that "
                  "it was still locked.", T, 0.3, "Danny awake between the tents; Marcus leaning on the gate."),
        together("c10h", "danny", [
            ("Here's what bothered me.", 0.3, "The mall map."),
            ("The mall closes at nine. At midnight, I walked every hallway and checked every door, like I do every night. "
             "The department store was locked. I locked it.", 0.3, "Danny on his midnight rounds, rattling the department store gate."),
            ("Nobody was in here.", 0.35, "The empty mall at midnight."),
        ], S, 0.35),
        n("c10i", "So who was she? And what was she doing in my mall at two in the morning?", T, 1.4,
          "The department store, dark, a light moving on the second floor."),
    ]},
    {"n": 11, "title": "Rounds", "tag": "DAY 1 · 6:40 A.M.", "lines": [
        n("c11a", "I don't remember falling asleep. I remember waking up.", S, 0.25, "Danny waking between the tents."),
        n("c11b", "Gray light was coming down through the skylights, and the mall was quiet. Really quiet.", S, 0.2,
          "Morning light in the concourse."),
        n("c11c", "I waited an hour before I moved at all. Then I crawled to the gate, an inch at a time, to look.", T, 0.25,
          "Danny crawling to the gate."),
        n("c11d", "Out in the hallway, the dead were just standing there. Like they were waiting for the stores to open.", S, 0.3,
          "The dead standing still in the morning concourse."),
        n("c11d2", "In the daylight, it all looked fake. Like a movie set somebody forgot to take down.", S, 0.3,
          "The morning concourse, wide and still."),
        together("c11e", "danny", [
            ("Then, way off down the hall, I heard a gate rattle.", 0.35, "Far down the hall."),
            ("Then another one. Closer.", 0.3, "Closer."),
        ], T, 0.3),
        n("c11g", "It was Marcus. He was walking the loop, shaking every gate he passed, the way he did every single night.", T, 0.25,
          "Dead Marcus walking the loop, rattling gates."),
        n("c11h", "He shook mine too. He didn't even look in.", T, 0.3, "Marcus rattles Danny's gate and walks on."),
        n("c11i", "Down by the escalator, the night cleaner from the food court was still pushing her cart into the same wall. "
                  "Over and over.", S, 0.25, "A dead cleaner pushing her cart into a wall."),
        n("c11j", "That's when I figured out the first rule. They follow sound. And when it's quiet, they go back to whatever they "
                  "used to do.", S, 0.3, "RULE 1: THEY FOLLOW SOUND."),
        n("c11k", "I had breakfast. A protein bar that tasted like a yoga mat.", S, 0.3, "Danny chewing a protein bar."),
        n("c11k2", "Summit Outdoors by daylight: tents, kayaks, a whole wall of camping food, and a cardboard bear that scared me twice.", S, 0.3,
          "The store by daylight; a cardboard bear cutout."),
        n("c11l", "Then my phone buzzed. One message, sent at two-fourteen a.m.", T, 1.4, "Danny's phone lights up: 1 NEW MESSAGE, 2:14 AM."),
    ]},
    {"n": 12, "title": "Thirty Days", "tag": "DAY 1 OF 30", "lines": [
        together("c12a", "danny", [
            ("It was from my mom.", 0.3, "The phone: MOM."),
            ("Lily is with me. Door locked. Do not come. And she typed the word not in all capitals.", 0.3,
             "The text: LILY IS WITH ME. DOOR LOCKED. DO NOT COME."),
        ], S, 0.3),
        n("c12c", "My mom is seventy, and she's the toughest person I've ever met.", S, 0.3, "Lita, Danny's mom, arms folded."),
        n("c12d", "I texted back. Stay put. I love you. Tell Lily the king's still in his castle.", S, 0.3, "Danny typing the reply."),
        n("c12e", "It said delivered. Then the bars on my phone went to zero, and they never came back.", S, 0.3,
          "DELIVERED. The signal bars drop to nothing."),
        n("c12f", "There's a camping radio in the store, the kind with a hand crank. I found the emergency channel.", S, 0.25,
          "Danny cranking a camping radio."),
        say("c12g", "broadcast", "This is an emergency broadcast. Shelter in place. Rescue teams will reach every area within thirty days.",
            BROADCAST, 0.4, "EMERGENCY BROADCAST: SHELTER IN PLACE. RESCUE WITHIN 30 DAYS.", radio="broadcast",
            scene=SCENES["broadcast"], takes=2),
        n("c12g2", "It played the same thirty seconds, over and over, all day.", S, 0.3, "The camping radio, its dial glowing."),
        n("c12h", "Thirty days. Okay. I can do thirty days. I've done diets longer than that.", S, 0.3, "DAY 1 OF 30."),
        together("c12i", "danny", [
            ("So I counted what I had.", 0.3, "The store's shelves."),
            ("Seventy-two bottles of water. Forty protein bars. A shelf of freeze-dried meals, a camp stove, water filters, and more "
             "baseball bats than anybody needs.", 0.3, "Supplies counted up on screen."),
        ], S, 0.3),
        n("c12k", "If I'm careful, that's water for about twelve days.", S, 0.3, "WATER: 12 DAYS."),
        n("c12l", "Then I remembered something, and my stomach dropped.", T, 0.25, "Danny goes still."),
        n("c12m", "My mom is diabetic. Her insulin lasts about ten days.", T, 0.35, "An insulin pen. INSULIN: 10 DAYS."),
        n("c12n", "Rescue was thirty days away. My mom's insulin would run out in ten.", T, 1.4, "Two countdowns: 30 and 10."),
    ]},
    {"n": 13, "title": "The Roof", "tag": "DAY 1 · 3:00 P.M.", "lines": [
        n("c13a", "There's a ladder in the stockroom that goes up to a hatch on the roof.", S, 0.2, "The stockroom ladder and the hatch."),
        n("c13b", "Six years I've worked here, and I'd never once been up there.", S, 0.3, "Danny climbing out onto the roof."),
        n("c13c", "From the roof, you can see the whole highway.", S, 0.2, "The highway from the roof."),
        n("c13c2", "The sun was out. That felt kind of rude.", S, 0.25, "Blue sky over the highway.", takes=3),
        n("c13d", "Eight lanes of cars, all stopped, doors hanging open. And the dead, walking between them like they'd forgotten "
                  "where they parked.", T, 0.25, "Stopped cars, open doors, the dead walking between them."),
        n("c13e", "Smoke over downtown. A helicopter that flew right over me and didn't stop.", T, 0.25,
          "Smoke on the skyline; a helicopter passing over."),
        n("c13e2", "I waved at it like an idiot. Both arms.", S, 0.3, "Danny waving both arms at the sky.", takes=3),
        n("c13f", "On the roof of the hotel next door, somebody had painted help on a bedsheet. Nobody came for them either.", T, 0.3,
          "A bedsheet on a roof: HELP."),
        n("c13g", "And on the other side of all of it, a mile and a half away, Parkview. Tenth floor, fourth window from the left.", S, 0.25,
          "Parkview tower in the distance; the window circled."),
        n("c13h", "I could see my daughter's window from the roof of this mall. It might as well have been the moon.", S, 0.35,
          "Danny small on the roof; the tower far away."),
        n("c13i", "I know what you're thinking. Just go.", S, 0.25, "Danny looking at the highway.", takes=3),
        n("c13j", "My car is in the garage, with them. There are eight lanes of the dead between me and that building.", T, 0.2,
          "The garage; the highway full of the dead."),
        n("c13k", "And if I somehow made it, I'd be leading every one of them straight to her door.", T, 0.3,
          "A line of the dead following one figure to the tower's door."),
        n("c13l", "So I stayed up there, and I watched her window all afternoon. I counted every window on that building twice.", S, 0.3,
          "The sun moving down; Danny watching."),
        n("c13m", "At eight fifty-nine, the whole city went dark. Including her window.", T, 1.4, "8:59 PM. The city goes black."),
    ]},
    {"n": 14, "title": "Three Blinks", "tag": "DAY 1 · 9:00 P.M.", "lines": [
        n("c14a", "No streetlights. No windows. I could barely see the shape of her building against the sky.", T, 0.3,
          "The black city; the tower's outline against the sky."),
        n("c14a2", "At nine, I turned on my flashlight and pointed it at her building, just in case.", T, 0.35,
          "Danny on the dark roof, flashlight pointed at the tower."),
        together("c14b", "danny", [
            ("Nine o'clock. Nothing.", 0.6, "9:00 PM. Nothing."),
            ("Nine-oh-one. Nothing.", 0.4, "9:01 PM. Nothing."),
        ], T, 0.4, max_pause=0.45),
        n("c14d", "I stood there with my flashlight, telling myself the power's out, she can't, it's fine.", T, 0.3,
          "Danny on the roof with his flashlight."),
        together("c14e", "danny", [
            ("Then, one. Two. Three.", 0.4, "A light in the window: one, two, three."),
            ("Not her lamp. A flashlight. In the tenth-floor window.", 0.35, "The tenth-floor window."),
        ], T, 0.35, max_pause=0.5),
        n("c14g", "She's alive. She figured it out. She's seven years old, and she figured it out.", S, 0.3, "Danny's face."),
        n("c14h", "I blinked back three times. Then I sat down on the roof, and I couldn't stop shaking.", S, 0.35,
          "Danny blinks back three times, then sits down."),
        n("c14i", "Then the radio in my pocket clicked on. Marcus's radio. I'd carried it around all day.", T, 0.3,
          "Marcus's radio in Danny's pocket, its light on."),
        say("c14j", "vera", "That's sweet, Danny.", RADIO, 0.5, "Radio waves.", style="Vocal Smile", radio="vera", scene=SCENES["vera"]),
        n("c14k", "She'd been watching.", D, 0.5, "Danny, very still.", takes=3),
        say("c14l", "vera", "Who's in the window?", RADIO, 0.0, "The tower window, tiny, far away.", radio="vera", scene=SCENES["vera"]),
    ]},
]


def load_reused():
    chunks = {}
    for key, rel in REUSE_PLANS.items():
        for c in json.loads((MALL / rel).read_text())["chunks"]:
            chunks[(key, c["id"])] = c
    return chunks


def main():
    reused = load_reused()
    takes = VO / "takes"
    takes.mkdir(parents=True, exist_ok=True)
    plan_chunks, cands, rows, words = [], [], [], 0
    md = ["# The Night Guard, Chapter 1: The King of the Mall", "",
          "About fifteen minutes: the 14 segments of Chapter 1 in `../series-outline.md`, told straight through. Segments 1-3 "
          "are Shorts 1-3, with their approved takes. Lines in **bold caps** are other voices; everything else is Danny. "
          "Levels follow `../voice-recipe.md`, with the quiet lines kept closer to the story level over a long chapter.", ""]
    for seg in SEGMENTS:
        md += [f"## {seg['n']}. {seg['title']}", "", f"*On screen: {seg['tag']}*", "", "| Id | Who | Line | Picture |", "|---|---|---|---|"]
        for ln in seg["lines"]:
            if "reuse" in ln:
                c = json.loads(json.dumps(reused[(ln["reuse"], ln["id"])]))
                c["lufs"], c["gap"] = ln["lufs"], ln["gap"]
                src = MALL / REUSE_TAKES[ln["reuse"]] / f"{ln['id']}.wav"
                shutil.copy2(src, takes / src.name)
                pics = [ln["pic"]] * (len(c["lines"]) if "lines" in c else 1)
            else:
                c = {"id": ln["id"], "who": ln["who"], "style": ln.get("style") or "Deadpan", "pace": "Natural",
                     "lufs": ln["lufs"], "gap": ln["gap"]}
                if ln.get("scene"):
                    c["scene"] = ln["scene"]
                if ln.get("radio"):
                    c["radio"] = ln["radio"]
                if ln.get("max_pause"):
                    c["max_pause"] = ln["max_pause"]
                if "lines" in ln:
                    c["lines"] = [{"text": x["text"], "gap": x["gap"]} for x in ln["lines"]]
                    c["rejoin"] = True
                    c["text"] = " ".join(x["text"] for x in ln["lines"])
                    pics = [x["pic"] for x in ln["lines"]]
                else:
                    c["text"] = ln["text"]
                    pics = [ln["pic"]]
                for k in range(1, ln["takes"] + 1):
                    cand = {key: v for key, v in c.items() if key not in ("lufs", "gap", "rejoin", "radio", "max_pause")}
                    cand["id"] = f"{c['id']}-{k}"
                    cands.append(cand)
            plan_chunks.append(c)
            texts = [x["text"] for x in c["lines"]] if "lines" in c else [c["text"]]
            who = c["who"]
            for i, (t, p) in enumerate(zip(texts, pics)):
                clean = re.sub(r"\[[^\]]*\]\s*", "", t)
                words += len(re.findall(r"[A-Za-z0-9']+", clean))
                lid = c["id"] if len(texts) == 1 else f"{c['id']}.{i + 1}"
                rows.append({"id": lid, "chunk": c["id"], "seg": seg["n"], "who": who, "radio": bool(c.get("radio")), "text": clean, "pic": p})
                shown = clean if who == "danny" else f"**{('MARCUS' if who.startswith('marcus') else who.upper())}"
                if who != "danny":
                    shown += (" (RADIO)" if c.get("radio") else "") + f":** {clean}"
                md.append(f"| {lid}{' (approved take)' if 'reuse' in ln else ''} | {who} | {shown} | {p} |")
        md.append("")
    plan = {"voices": VOICES, "scene": DANNY_SCENE, "sample_context": "A first-person story told plainly, in a natural, slightly scared voice.",
            "takes_dir": "takes", "level": "fixed", "tempo": 1.08, "max_pause": 0.22, "chunks": plan_chunks}
    (VO / "plan.json").write_text(json.dumps(plan, indent=1))
    (VO / "cands.json").write_text(json.dumps({k: v for k, v in plan.items() if k not in ("chunks", "takes_dir")} | {"chunks": cands}, indent=1))
    (HERE / "lines.json").write_text(json.dumps(rows, indent=1))
    md.insert(4, f"{words} words.")
    md.insert(5, "")
    (HERE / "script.md").write_text("\n".join(md) + "\n")
    new = [c for c in cands]
    print(f"{words} words, {len(plan_chunks)} chunks ({sum(1 for s in SEGMENTS for l in s['lines'] if 'reuse' in l)} reused), "
          f"{len(new)} candidate takes to record")


if __name__ == "__main__":
    main()
