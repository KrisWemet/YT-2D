#!/usr/bin/env python3
"""The Night Guard, Chapter 2 (about 21 minutes): the voiced script, and everything made from it.

This file is the script for the voice. It follows images/mall/chapter2/manuscript.md line for line,
except that a dialogue tag ("Theo said") is dropped where a different voice already makes the speaker
obvious, as Chapter 1's script did. Running it writes:
  - images/mall/chapter2/script.md       the script to read, segment by segment, with pictures
  - images/mall/chapter2/lines.json      every line's id, segment, speaker, words and picture
  - images/mall/vo/ch2/plan.json         the voice plan (voice_gemini.py), approved recipe
  - images/mall/vo/ch2/cands.json        Danny's lines, several takes each, for pick_takes.py
  - images/mall/vo/ch2/cands-cast.json   Theo's and Vera's lines (recorded the same way, picked by ear or
                                         against their own earlier takes)

usage: python3 images/mall/chapter2/make_plans.py
"""
import json
import pathlib
import re

HERE = pathlib.Path(__file__).resolve().parent
MALL = HERE.parent
VO = MALL / "vo" / "ch2"

# Loudness of each kind of line (LUFS, one fixed gain per line; see voice-recipe.md), as in Chapter 1.
S, T, D = -18.0, -20.0, -22.5  # story, tense, danger close
THEO = -21.0  # Theo in the same room, keeping his voice down
RADIO = -19.5  # Vera on the walkie-talkie

THEO_VOICE = "Achird"  # chosen in vo/ch2/theo-audition: the youngest of four voices (about 113 Hz with this profile)
THEO_PITCH = 1.5  # semitones up in the mix (rubberband), so he sits about 5 semitones above Danny

DANNY_PROFILE = ("Danny, a regular guy in his late thirties. He is genuinely a little scared and still shaken, and he tells "
                 "what happened plainly and honestly, in a natural voice with very little inflection, keeping his pitch fairly "
                 "level and even, like a real person, not an actor.")
VOICES = {
    "danny": {"voice_name": "Algenib", "audio_profile": DANNY_PROFILE, "accent": "American (Gen)"},
    "theo": {"voice_name": THEO_VOICE,
             "audio_profile": ("Theo, fifteen. A skinny teenage boy with a light, young voice that has only just started to "
                               "break. He has lived alone in a mall's ceiling for four months: guarded, quick and a little "
                               "defiant, and he talks in short sentences. A real teenager, not an actor."),
             "accent": "American (Gen)"},
    "vera": {"voice_name": "Gacrux",
             "audio_profile": ("Vera, a woman in her forties. Calm, warm and funny, and she never raises her voice. She sounds "
                               "friendly and in control, which is what makes her frightening."),
             "accent": "American (Gen)"},
}
SCENES = {
    "theo": "In a dark, locked store in a mall full of the dead, a runaway teenager talks quietly with the night guard.",
    "theo_close": "Up in the ceiling over a crowd of the dead, a teenager gives the man beside him short, urgent instructions, keeping his voice down.",
    "vera": "A woman talks over a security walkie-talkie at night, unhurried and amused, to a man hiding in a locked store.",
    "vera_sad": "A woman talks over a security walkie-talkie at night, gently, about a hungry child she says is with her.",
}
DANNY_SCENE = ("A man quietly tells what happened during the first days of a zombie outbreak at the mall where he works. "
               "Close to the microphone, plain and natural, no music.")


def n(cid, text, lufs=S, gap=0.2, pic="", takes=2):
    """a line of Danny's narration (or something Danny says)"""
    return {"id": cid, "who": "danny", "text": text, "lufs": lufs, "gap": gap, "pic": pic, "takes": takes}


def theo(cid, text, lufs=THEO, gap=0.3, pic="", scene="theo", takes=2):
    return {"id": cid, "who": "theo", "text": text, "lufs": lufs, "gap": gap, "pic": pic, "style": "Deadpan", "radio": None,
            "scene": SCENES[scene], "takes": takes, "pitch": THEO_PITCH}


def vera(cid, text, gap=0.3, pic="Radio waves. UNKNOWN.", style="Deadpan", scene="vera", takes=2):
    return {"id": cid, "who": "vera", "text": text, "lufs": RADIO, "gap": gap, "pic": pic, "style": style, "radio": "vera",
            "scene": SCENES[scene], "takes": takes}


def together(cid, lines, lufs, gap, takes=3, max_pause=None):
    """short lines of Danny's recorded as one take, then cut apart: lines are (text, gap after, picture)"""
    return {"id": cid, "who": "danny", "lines": [{"text": t, "gap": g, "pic": p} for t, g, p in lines], "lufs": lufs, "gap": gap,
            "takes": takes, "style": "Deadpan", "radio": None, "scene": None, "max_pause": max_pause}


SEGMENTS = [
    {"n": 1, "title": "Right Under Me", "tag": "DAY 4 · 8:49 P.M. · ABOVE THE CENTER COURT", "lines": [
        n("c1a", "Right now my leg is hanging through the ceiling over a hundred dead people, and my best friend is walking right under it.",
          D, 0.3, "From below: Danny's leg hanging through a broken ceiling tile over the crowd in the center court."),
        n("c1b", "The edge of the hole is cutting into my thigh. My boot is caught on something sharp. Every time I move, a little more "
                 "white dust falls past my foot.", D, 0.25, "Close: the boot snagged on bent metal; white dust falling."),
        together("c1c", [
            ("A piece the size of my thumbnail lands on the fountain rim.", 0.5, "A chip of tile falls toward the fountain."),
            ("Tick.", 0.6, "It hits the fountain rim. TICK."),
            ("In a mall this quiet, that's a dinner bell.", 0.3, "Heads begin to turn."),
        ], D, 0.3, max_pause=0.5),
        n("c1d", "Under my leg, faces start turning up. A woman with one earring. A man still holding a shopping bag. The cleaner who "
                 "used to put out a yellow cone even when the floor was dry.", D, 0.3,
          "Faces turned up: a woman with one earring, a man with a shopping bag, a cleaner."),
        together("c1e", [
            ("And Marcus.", 0.4, "Marcus in his guard uniform among them."),
            ("He comes around the fountain in his guard uniform, stops at a gate, and shakes it twice. Same as every night.", 0.3,
             "Marcus rattles a store gate."),
        ], D, 0.3),
        n("c1f", "Lying on a beam above me is a fifteen-year-old I almost threw out of my store. He's got both hands around my wrist, and "
                 "he's pulling so hard his whole face shakes.", D, 0.3, "Theo flat on a steel beam, both hands around Danny's wrist."),
        theo("c1g", "Danny. Stop moving.", D, 0.35, "Theo, close, whispering.", scene="theo_close"),
        together("c1h", [
            ("I stop.", 0.4, "Danny freezes."),
            ("Another piece breaks off anyway.", 0.4, "Another chunk of tile falls."),
        ], D, 0.4),
        together("c1i", [
            ("And in eleven minutes, my seven-year-old is going to blink her goodnight at an empty roof.", 0.5,
             "Danny's watch: 8:49. Then the mall roof, empty under the night sky."),
            ("Let me back up.", 3.0, "Rewind. Then the title card: CHAPTER TWO, THE BOY IN THE CEILING."),
        ], T, 3.0),
    ]},
    {"n": 2, "title": "The Woman in the Fitting Room", "tag": "NIGHT 1 · 9:02 P.M. · THE ROOF", "lines": [
        n("c2a", "The woman on the radio asked who was in my daughter's window, and I didn't say a word.", S, 0.25,
          "Danny on the roof, Marcus's radio in his hand, the tower across the highway."),
        n("c2b", "For six years, answering that radio was my job. Somebody called, I answered, and they knew help was coming.", S, 0.2,
          "Memory: Danny at the security desk, answering the radio."),
        n("c2c", "Now I stood on the roof with my thumb an inch from the button and made myself leave it alone.", T, 0.3,
          "Close: Danny's thumb hovering over the talk button."),
        vera("c2d", "Danny? You still there?"),
        n("c2e", "Across the roofs, a light moved behind the department store's roof door. Then it was gone.", T, 0.3,
          "The department store roof: a light behind the roof door, then dark."),
        together("c2f", [
            ("I pressed the button.", 0.3, "Danny presses the button."),
            ("How did you get inside my mall?", 0.3, "Danny, into the radio."),
        ], S, 0.3),
        vera("c2g", "[amused] That's a pretty rude first question.", style="Vocal Smile"),
        n("c2h", "You asked me one.", S, 0.3, "Danny, flat.", takes=3),
        vera("c2i", "Fair. I'm Vera. I was trying on a coat on the second floor, sat down in the fitting room, and fell asleep. When I "
                    "woke up, they'd locked the place.", pic="The department store's second floor, dark. A fitting room."),
        n("c2j", "The store closes at nine. At midnight, I'd walked the hallway behind those fitting rooms. Nobody was there.", T, 0.3,
          "Memory: Danny's midnight round behind the fitting rooms, empty."),
        n("c2k", "What coat?", S, 0.3, "Danny.", takes=3),
        vera("c2l", "Sorry, what?"),
        n("c2m", "The coat you were trying on.", S, 0.3, "Danny.", takes=3),
        vera("c2n", "Danny, there are people eating people downstairs. I think we're past the return policy.", style="Vocal Smile"),
        n("c2o", "Then her voice went soft.", T, 0.3, "Close on the radio.", takes=3),
        vera("c2p", "There's a little girl up here with me. She's hungry. Have you got anything to eat?", style="Empathetic",
             scene="vera_sad"),
        n("c2q", "I looked across the highway at my daughter's dark window.", T, 0.3, "Lily's window, dark, far away."),
        n("c2r", "How old?", T, 0.3, "Danny.", takes=3),
        vera("c2s", "Six. Maybe seven. She won't tell me much.", style="Empathetic", scene="vera_sad"),
        together("c2t", [
            ("Seven.", 0.6, "Close on Lily's dark window."),
            ("Vera never asked about the window again that night.", 0.3, "Danny lowers the radio."),
            ("She'd found another question I couldn't walk away from.", 1.4, "Danny alone on the roof, radio in hand."),
        ], T, 1.4),
    ]},
    {"n": 3, "title": "Somebody in My Store", "tag": "DAY 2 · SUMMIT OUTDOORS", "lines": [
        n("c3a", "Somebody stole my water while I slept inside a locked store.", S, 0.25, "Summit Outdoors at dawn, the gate locked."),
        n("c3b", "I'd counted it the night before. Seventy-two bottles. If I was careful, twelve days.", S, 0.25, "WATER: 12 DAYS."),
        n("c3c", "In the morning there were seventy-one. And one of my two protein bars was gone, which meant somebody had eaten breakfast "
                 "in my store, and it wasn't me.", S, 0.3, "71 BOTTLES. One protein bar left."),
        n("c3d", "The gate was locked. Key thirty-one was still on my belt.", T, 0.3, "The padlock; tag 31 on Danny's belt."),
        together("c3e", [
            ("The dead don't pick padlocks. They don't eat protein bars, either.", 0.35, "Danny looks at the gate."),
            ("Something else was in here with me.", 0.35, "Danny turns to the dark store."),
        ], T, 0.35),
        together("c3f", [
            ("I searched every tent. Every shelf. Behind the kayaks, and behind the cardboard bear, which got me for the third time.", 0.4,
             "Danny searching; the cardboard bear makes him jump."),
            ("Nothing.", 0.4, "The empty store."),
        ], S, 0.4),
        n("c3g", "That night, I put the food and water in a plastic box and slept with it next to my head.", S, 0.25,
          "Danny lying down with the plastic box beside his head."),
        n("c3h", "Vera called while I was lying there.", S, 0.3, "The radio's light comes on.", takes=3),
        vera("c3i", "How's my favorite night guard?", style="Vocal Smile"),
        n("c3j", "I haven't agreed to anything.", S, 0.3, "Danny.", takes=3),
        vera("c3k", "She asked for her mom today. I didn't know what to tell her.", style="Empathetic", scene="vera_sad"),
        n("c3l", "I didn't either. I let the radio go quiet.", T, 0.35, "The radio's light goes out."),
        n("c3m", "I don't remember falling asleep. I remember waking up, because the lid of the box was back on, and one of the latches "
                 "hadn't quite clicked shut.", T, 0.3, "Close: the box lid back on, one latch open."),
        together("c3n", [
            ("Two more bars were gone. Two more bottles.", 0.35, "69 BOTTLES."),
            ("Whoever was doing this had stood close enough to watch me sleep.", 1.4,
             "Danny asleep beside the box; a shadow standing over him."),
        ], T, 1.4),
    ]},
    {"n": 4, "title": "The Footprints", "tag": "DAY 3 · 4:50 A.M.", "lines": [
        n("c4a", "I put climbing chalk on the floor, and the footprints went up the wall.", S, 0.25, "Chalk footprints climbing a wall."),
        n("c4b", "That was my entire investigation. Six years in mall security, and my big plan was waiting for somebody to step in powder.",
          S, 0.25, "Danny with a bag of climbing chalk."),
        n("c4c", "I spread it around the food box, under the stockroom door, and between the tents. Then I lay down with my boots on and "
                 "pretended to sleep.", S, 0.3, "White chalk around the box; Danny lying still, eyes open."),
        together("c4d", [
            ("Sometime before dawn, I heard plastic bend.", 0.4, "Darkness. A plastic box flexing."),
            ("By the time I got my flashlight on, the store was still again.", 0.3, "Flashlight on: nobody there."),
        ], D, 0.3),
        n("c4e", "Small sneakers. A split in the right sole that left a little square of clean floor in every print.", T, 0.25,
          "Close: a small chalk footprint with a square gap in the sole."),
        n("c4f", "The trail came from behind the climbing wall display. It went to the food box. Then it went back.", T, 0.25,
          "The trail of prints, there and back."),
        n("c4g", "Behind the display there's a tall metal rack bolted to the wall. A chalk print on the bottom shelf. Another one halfway "
                 "up the wall. A handprint on a dusty pipe.", T, 0.25, "The rack, prints climbing it, a handprint on a pipe."),
        n("c4h", "I followed the pipe up with my light.", T, 0.25, "The flashlight beam climbs the pipe."),
        n("c4i", "One ceiling tile was cleaner around the edges than all the others.", T, 0.3, "One clean ceiling tile."),
        n("c4j", "Every door locked. Every window whole. I'd checked that gate so many times my hand hurt.", T, 0.25,
          "The gate, the padlock."),
        n("c4k", "I hadn't looked up once.", T, 0.35, "Danny looking up.", takes=3),
        n("c4l", "And if a thief could get into my store through the ceiling, so could the woman on the radio.", T, 0.3,
          "The department store, dark, upstairs."),
        n("c4m", "A little white flake drifted down out of the seam above me.", D, 0.3, "A flake drifting down through the beam."),
        n("c4n", "I turned off the flashlight.", D, 0.35, "Click. Dark.", takes=3),
        together("c4o", [
            ("Whoever was up there had seen the light.", 0.4, "The dark ceiling."),
            ("And they were still there.", 1.4, "The clean tile, in the dark."),
        ], D, 1.4),
    ]},
    {"n": 5, "title": "A Pair of Sneakers", "tag": "DAY 3 · 6:10 A.M.", "lines": [
        n("c5a", "I caught the thief, and his shoes were held together with duct tape.", S, 0.25, "Sneakers wrapped in duct tape."),
        n("c5b", "I waited behind the display until my knee went stiff. Out in the hall, Marcus rattled my gate and moved on.", T, 0.3,
          "Danny crouched behind the display; Marcus's shadow at the gate."),
        together("c5c", [
            ("Then the tile lifted.", 0.4, "The ceiling tile lifts."),
            ("Two fingers. Then a head. Then a very skinny boy, lowering himself onto the top shelf like he'd done it a hundred times. "
             "He even stepped around the one bar that squeaks. I didn't know it squeaked. It's my store.", 0.3,
             "A skinny boy climbing down the rack."),
        ], D, 0.3),
        n("c5d", "He went straight to the food box. I waited until he bent over it.", D, 0.3, "The boy at the food box."),
        n("c5e", "Then I stood up.", T, 0.35, "Danny stands up behind him.", takes=3),
        n("c5f", "He had a protein bar in his hand. His sweatshirt hung past his fingers. He was about as dusty as the pipe, and he looked "
                 "hungry enough to eat the wrapper.", S, 0.25, "Theo frozen, protein bar in hand, sleeves past his fingers."),
        n("c5g", "I'd practiced this moment for an hour. In my head, the thief was a grown man.", S, 0.3, "Danny, a little lost."),
        n("c5h", "Put it down.", T, 0.3, "Danny.", takes=3),
        together("c5i", [
            ("He put it down.", 0.35, "Theo puts it down."),
            ("Then he ran straight at me.", 0.3, "Theo charges."),
        ], T, 0.3),
        n("c5j", "He got past me and two shelves up the rack before I caught the back of his sweatshirt. He twisted so hard the stitching "
                 "tore. The whole rack banged against the wall.", T, 0.3, "Danny grabbing Theo's sweatshirt on the rack."),
        together("c5k", [
            ("Out in the hall, something stopped walking.", 0.4, "The gate, a shape beyond it."),
            ("We both froze.", 0.4, "Danny and Theo, frozen."),
        ], D, 0.4),
        n("c5l", "A shadow slid across the gate. It leaned on the bars, and the gate creaked.", D, 0.3, "A shadow leaning on the gate."),
        n("c5m", "Then it moved on.", D, 0.35, "The shadow moves on.", takes=3),
        n("c5n", "The boy let out a breath and glared at me like this was my fault.", T, 0.3, "Theo glaring."),
        theo("c5o", "Don't do that again.", D, 0.3, "Theo, whispering.", scene="theo_close"),
        n("c5p", "You're stealing my food.", T, 0.3, "Danny.", takes=3),
        theo("c5q", "You're loud.", D, 0.3, "Theo."),
        n("c5r", "How old are you?", T, 0.3, "Danny.", takes=3),
        theo("c5s", "I'm fifteen.", D, 0.3, "Theo."),
        n("c5t", "Who else is up there?", T, 0.3, "Danny.", takes=3),
        n("c5u", "His hand tightened on the pipe.", T, 0.3, "Theo's hand on the pipe.", takes=3),
        theo("c5v", "Nobody. That's why I stay up there.", THEO, 1.4, "Theo on the rack, looking down."),
    ]},
    {"n": 6, "title": "Four Months", "tag": "DAY 3 · SUMMIT OUTDOORS", "lines": [
        n("c6a", "A fifteen-year-old had been living in my mall for four months, and I'd never noticed.", S, 0.25,
          "Theo on an upside-down bucket."),
        n("c6b", "His name was Theo. He sat on an upside-down bucket, close enough to the rack to run.", S, 0.25,
          "Name tag: THEO, 15, LIVES IN THE CEILING."),
        n("c6c", "Where do you sleep?", S, 0.3, "Danny.", takes=3),
        theo("c6d", "Above the cinema. There's a space next to the projection room."),
        n("c6e", "For four months? How do you eat?", S, 0.3, "Danny."),
        theo("c6f", "People throw out a lot of food."),
        n("c6g", "And the doors?", S, 0.3, "Danny.", takes=3),
        theo("c6h", "I go around them."),
        n("c6i", "I looked at the keys on my belt. Forty-two keys, and a kid had beaten every one of them with a ceiling tile.", S, 0.3,
          "The key ring; a ceiling tile."),
        theo("c6j", "You check the same doors twice when you're on the phone. And you sing in the freight elevator."),
        n("c6k", "I stared at him.", S, 0.3, "Danny staring.", takes=3),
        theo("c6l", "Same song every time. You only know half the words."),
        n("c6m", "My face went hot. Even now. Even with all of that outside.", S, 0.3, "Danny, red-faced."),
        n("c6n", "You can't stay here.", T, 0.35, "Danny.", takes=3),
        n("c6o", "It came out before I'd thought about it. But I knew where it came from.", T, 0.25, "The gate."),
        n("c6p", "The first night, a guy I loved sat outside that gate and trusted me to know what to do. I didn't. Now this kid was "
                 "sitting six feet from the same gate, waiting for me to be in charge.", T, 0.3,
          "Memory: Marcus behind the bars. Then Theo on the bucket, six feet from the gate."),
        n("c6q", "I wanted somebody better for him. A firefighter. A parent. Anybody.", S, 0.25, "Danny looking away."),
        n("c6r", "He was looking at the only adult available.", S, 0.3, "Theo looking at Danny.", takes=3),
        n("c6s", "Theo stood up. He didn't argue. He didn't take anything, because he'd brought nothing.", S, 0.25,
          "Theo standing, empty-handed."),
        n("c6t", "He was halfway up the rack when he stopped.", S, 0.3, "Theo stops halfway up the rack."),
        theo("c6u", "How much water have you got?"),
        n("c6v", "About ten days. For one person.", T, 0.3, "WATER: 10 DAYS."),
        n("c6w", "He looked toward the front of the mall.", S, 0.3, "Theo looking out.", takes=3),
        theo("c6x", "I know where there's eight thousand gallons.", THEO, 1.4, "Theo, looking down from the rack."),
    ]},
    {"n": 7, "title": "The Fountain", "tag": "DAY 3 · SUMMIT OUTDOORS", "lines": [
        n("c7a", "The water I needed was sitting under a hundred dead people.", S, 0.25, "The fountain, ringed by the dead."),
        theo("c7b", "The fountain."),
        n("c7c", "In six years I'd fished coins out of that fountain, two phones, and once an engagement ring a guy dropped before he got "
                 "to the question.", S, 0.25, "Memory: Danny fishing a ring out of the fountain."),
        n("c7d", "I'd never wondered where the water came from.", S, 0.3, "The fountain."),
        theo("c7e", "There's a tank underneath. In the pump room. It says eight thousand gallons right on the side."),
        n("c7f", "The pump room door is in the center court, right beside the pretzel place. On the cameras, that doorway was buried in "
                 "bodies.", T, 0.3, "Security camera: the pump room door behind a crowd."),
        theo("c7g", "I don't use the door. I come from above."),
        n("c7h", "He drew the route in the chalk with his finger. Up through my ceiling. Over the cinema. Along a service walkway above "
                 "the center court. Down a ladder inside the big column by the fountain.", S, 0.25, "A route drawn in chalk on the floor."),
        theo("c7i", "Twenty minutes. If you're quiet."),
        n("c7j", "When do we go?", S, 0.3, "Danny.", takes=3),
        theo("c7k", "Tomorrow night. Eight o'clock."),
        n("c7l", "Why at night?", S, 0.3, "Danny.", takes=3),
        n("c7m", "He looked at the floor.", S, 0.3, "Theo looking down.", takes=3),
        theo("c7n", "In the day, some people watch the court from upstairs. At night they sleep."),
        n("c7o", "What people?", S, 0.3, "Danny.", takes=3),
        theo("c7p", "Just people."),
        n("c7q", "Eight o'clock. Twenty minutes there, fill up, twenty minutes back. On the roof by ten to nine. Easy.", S, 0.35,
          "A plan on the floor: 8:00 to 8:50. Easy."),
        n("c7r", "That night, Vera called again.", T, 0.3, "The radio's light comes on.", takes=3),
        vera("c7s", "She's stopped asking for food, Danny.", style="Empathetic", scene="vera_sad"),
        n("c7t", "I held the radio so tight the plastic creaked. I'm a dad. She knew exactly where to push.", T, 0.3,
          "Danny's knuckles white on the radio."),
        n("c7u", "I started putting two protein bars and a bottle of water in a bag. I'd leave it at the department store gate.", S, 0.25,
          "Danny packing a bag."),
        n("c7v", "Theo watched me from the rack.", S, 0.3, "Theo watching.", takes=3),
        theo("c7w", "Don't do it."),
        n("c7x", "There's a little kid up there.", T, 0.3, "Danny."),
        theo("c7y", "I don't like her voice."),
        n("c7z", "You've never heard her.", T, 0.3, "Danny.", takes=3),
        n("c7za", "Theo didn't look away.", T, 0.35, "Theo, steady.", takes=3),
        theo("c7zb", "Yes, I have.", THEO, 1.4, "Theo."),
    ]},
    {"n": 8, "title": "Key Seventeen", "tag": "DAY 4 · 8:00 P.M.", "lines": [
        n("c8a", "To get water, I had to crawl through the ceiling right over their heads.", S, 0.25, "Danny climbing the rack."),
        n("c8b", "I never took that bag to Vera's gate. I never unpacked it, either.", S, 0.3, "The packed bag beside the tent."),
        n("c8c", "At eight, we went up. I took the battery out of Marcus's radio. One squawk over that court and we'd both be dinner. "
                 "Then I wrapped my keys in a sock so they couldn't jingle.", S, 0.3, "The battery out of the radio; keys going into a sock."),
        theo("c8d", "You always carry that many?"),
        n("c8e", "Every night.", S, 0.3, "Danny.", takes=3),
        theo("c8f", "Must be annoying."),
        n("c8g", "It was. I'd have given anything to be annoyed by them on a normal Tuesday.", S, 0.3, "The sock full of keys."),
        n("c8h", "Above my store, the air was hot and full of dust. Theo pointed with his flashlight.", S, 0.3,
          "Inside the ceiling: beams, dust, Theo's flashlight."),
        theo("c8i", "The big steel beams hold you. The tiles don't. Those thin wires hold the ceiling up. They won't hold you, either."),
        n("c8j", "I went on my hands and knees, beam to beam. Every time I breathed too hard, the tiles shifted under me.", T, 0.3,
          "Danny crawling beam to beam."),
        n("c8k", "Over the cinema, he stopped beside a blanket. Three empty water bottles. A folded hoodie. A photo, face down. He slid it "
                 "under the blanket before I could see it.", S, 0.3, "Theo's nest: a blanket, bottles, a hoodie, a photo face down."),
        n("c8l", "Next to his bed was a little metal door. CINEMA SERVICE.", S, 0.3, "A small door: CINEMA SERVICE."),
        together("c8m", [
            ("Key seventeen fit.", 0.35, "Key 17 in the lock."),
            ("Theo watched the lock turn like I'd done a magic trick.", 0.3, "Theo watching, amazed."),
        ], S, 0.3),
        n("c8n", "On the other side, a narrow walkway ran out over the center court. Through the gaps, I could see the tops of their heads.",
          T, 0.3, "The walkway over the court; heads far below."),
        n("c8o", "Halfway across, the walkway just ended. After that, there were only two beams.", T, 0.3, "The walkway ends. Two beams."),
        n("c8p", "Theo looked back at me.", T, 0.3, "Theo looking back.", takes=3),
        theo("c8q", "Don't put your foot where you think the floor is.", D, 1.4, "Theo, on the beam.", scene="theo_close"),
    ]},
    {"n": 9, "title": "The Rattle Below", "tag": "DAY 4 · 8:46 P.M. · ABOVE THE CENTER COURT", "lines": [
        n("c9a", "My best friend walked his rounds while I crawled over his head.", T, 0.25, "Marcus below, Danny above."),
        n("c9b", "Theo crossed the first gap like it was a sidewalk. I watched where his hands went and tried to put mine in the same "
                 "places.", T, 0.25, "Theo crossing easily."),
        n("c9c", "There's a big difference between watching a skinny fifteen-year-old do something and asking a thirty-eight-year-old's "
                 "knees to do it.", S, 0.3, "Danny's knees on the beam."),
        n("c9d", "Sweat ran down my nose. I caught it on my sleeve before it could drip.", D, 0.3, "A bead of sweat."),
        theo("c9e", "Next hand. Now your knee.", D, 0.3, "Theo whispering.", scene="theo_close"),
        n("c9f", "Below us, the fountain was dark, with coins on the bottom. The dead stood around it shoulder to shoulder, all facing the "
                 "food court.", D, 0.3, "From above: the dark fountain and the crowd around it."),
        n("c9g", "I stopped counting at a hundred.", D, 0.3, "Counter: 100.", takes=3),
        n("c9h", "My watch said eight forty-seven. We were behind.", T, 0.3, "Danny's watch: 8:47."),
        n("c9i", "Then a gate rattled at the far end of the hall.", D, 0.3, "Far down the hall."),
        n("c9j", "I knew who it was before I saw him.", D, 0.3, "Danny, still.", takes=3),
        n("c9k", "Marcus came around the corner and stopped at the first store. Two pulls on the gate. A pause. Then the next one.", D, 0.3,
          "Marcus rattling gates."),
        n("c9l", "I caught myself waiting for him to look up.", D, 0.3, "Danny watching Marcus."),
        n("c9m", "Theo touched my shoulder. He needed room.", D, 0.3, "Theo's hand on Danny's shoulder."),
        together("c9n", [
            ("I moved my knee.", 0.35, "Danny shifts his knee."),
            ("The metal under it folded like a soda can.", 0.3, "The metal folds."),
        ], D, 0.3),
        n("c9o", "My stomach hit the beam. My right leg punched straight through a tile. Something sharp caught my boot and held on.", T, 0.3,
          "Danny's leg through the tile."),
        together("c9p", [
            ("Day four. Eight forty-nine p.m.", 0.45, "The cold-open picture again. 8:49 PM."),
            ("That's where you came in.", 0.6, "The cold-open picture again."),
        ], T, 0.6),
        together("c9q", [
            ("Below me, Marcus stopped walking.", 0.5, "Marcus stops."),
            ("And he looked up.", 1.4, "Marcus looking up at Danny's foot."),
        ], D, 1.4),
    ]},
    {"n": 10, "title": "Hold On", "tag": "DAY 4 · 8:50 P.M.", "lines": [
        n("c10a", "The kid I'd told to leave was the only thing keeping me out of that crowd.", T, 0.25, "Theo holding Danny's wrist."),
        n("c10b", "Theo lay flat on the beam and grabbed my other wrist. His fingers slipped on my sleeve.", D, 0.3,
          "Theo's fingers slipping."),
        n("c10c", "A long piece of tile broke off and hit somebody's shoulder. Under me, they started pushing in toward the hole. Slowly. "
                  "One body leaning into the next.", D, 0.3, "The crowd pushing in under the hole."),
        n("c10d", "Marcus stood in the middle of them, looking up at my foot.", D, 0.3, "Marcus among them, looking up."),
        n("c10e", "I could see the worn spot on his cap, where he used to pick at it while he told me a joke I'd already heard.", D, 0.3,
          "Close: the worn spot on Marcus's cap."),
        n("c10f", "I almost said his name.", D, 0.3, "Danny, close.", takes=3),
        n("c10g", "Theo smacked my arm.", D, 0.3, "Theo smacks Danny's arm.", takes=3),
        theo("c10h", "Look at me.", D, 0.3, "Theo.", scene="theo_close"),
        n("c10i", "He'd pulled the climbing strap off my belt and looped it around the steel beam with one hand.", D, 0.3,
          "The strap around the beam."),
        theo("c10j", "Let go of me. I need my other hand.", D, 0.3, "Theo.", scene="theo_close"),
        n("c10k", "I'd been squeezing his sleeve so hard it was twisted around his arm. I made my fingers open.", D, 0.3,
          "Danny's fist opening."),
        n("c10l", "He leaned back on the strap, braced his sneaker against a pipe, and pulled.", T, 0.3, "Theo pulling on the strap."),
        theo("c10m", "Elbow up. You have to help.", D, 0.3, "Theo, straining.", scene="theo_close"),
        n("c10n", "I got an elbow onto the steel. Pushed until my shoulder felt like it was coming apart.", T, 0.3, "Danny's elbow on the beam."),
        together("c10o", [
            ("My boot stayed where it was.", 0.4, "The boot, stuck."),
            ("My foot came out of it.", 0.4, "Danny's foot slides out of the boot."),
        ], T, 0.4),
        n("c10p", "For a second I thought that meant I was falling.", T, 0.3, "Danny's face."),
        n("c10q", "Then my knee slid over the edge, and Theo dragged me onto the beam beside him.", T, 0.3, "Theo hauling Danny up."),
        n("c10r", "Below us, my boot let go. It landed in the empty fountain with a bang that went on forever, and every head in that court "
                  "turned toward it.", T, 0.35, "The boot falls into the fountain. Every head turns."),
        n("c10s", "We lay there breathing into our sleeves. Theo's pant leg was torn at the calf. There was blood on the brace he'd crawled "
                  "across to reach me.", D, 0.3, "Theo's torn pant leg, blood on the brace."),
        n("c10t", "My watch said eight fifty-eight.", T, 0.3, "Danny's watch: 8:58.", takes=3),
        n("c10u", "Going back meant crossing the broken part in the half dark, in one boot, in a hurry. The water was twenty feet below us.",
          T, 0.3, "Behind them, the broken section. Below, the column."),
        n("c10v", "Lily needed me alive more than she needed me on time.", S, 0.35, "Danny, deciding."),
        n("c10w", "Keep going, I whispered.", D, 1.4, "Danny and Theo moving on.", takes=3),
    ]},
    {"n": 11, "title": "Eight Thousand Gallons", "tag": "DAY 4 · 9:00 P.M. · THE PUMP ROOM", "lines": [
        n("c11a", "At nine o'clock, while my daughter blinked at an empty roof, I was standing in front of eight thousand gallons of water.",
          T, 0.3, "Split: Lily's window blinking at an empty roof; Danny before the tank."),
        n("c11b", "The ladder ran down inside the column. At the bottom, a hatch opened into the pump room under the fountain.", S, 0.25,
          "The ladder down the column; the hatch."),
        n("c11c", "The tank filled most of the room. Eight thousand gallons, right on the side. Behind a little glass window, water.", S, 0.3,
          "The tank: 8,000 GALLONS. Water behind the glass."),
        n("c11d", "I put my hand flat on the tank and left it there. For the first time in four days, I wasn't counting bottles.", S, 0.3,
          "Danny's hand on the tank."),
        n("c11e", "Theo came down the last rungs slowly, favoring his leg.", S, 0.3, "Theo on the ladder, favoring his leg."),
        n("c11f", "You hurt?", S, 0.3, "Danny.", takes=3),
        theo("c11g", "Caught it."),
        n("c11h", "I saw.", S, 0.3, "Danny.", takes=3),
        theo("c11i", "Then why'd you ask?"),
        n("c11j", "I almost smiled.", S, 0.3, "Danny, almost smiling.", takes=3),
        n("c11k", "We filled the containers. Outside the pump room door, a shoe scraped along the floor, and dust shook out of the frame.",
          T, 0.3, "Filling containers; dust shaking out of the door frame."),
        n("c11l", "Theo stared at that door.", T, 0.3, "Theo staring at the door.", takes=3),
        theo("c11m", "This is where they were."),
        n("c11n", "Who was here?", T, 0.3, "Danny.", takes=3),
        theo("c11o", "The drill people. Three of them. A woman and two men. Right out there, behind the pretzel place. The first night."),
        n("c11p", "What time?", T, 0.3, "Danny.", takes=3),
        theo("c11q", "One-thirty. I could see the clock."),
        together("c11r", [
            ("One-thirty.", 0.6, "Clock: 1:30 AM."),
            ("Ten minutes before Marcus called me about a man walking wrong up the ramp.", 1.4, "Memory: Marcus on the radio, 1:40 AM."),
        ], T, 1.4),
    ]},
    {"n": 12, "title": "Somebody Called Them", "tag": "DAY 4 · THE PUMP ROOM", "lines": [
        n("c12a", "The dead didn't come to my mall by accident. Somebody called them.", T, 0.3, "The crowd in the court."),
        theo("c12b", "They were cutting through the wall. Loud as a chainsaw. I could hear it all the way over the cinema."),
        n("c12c", "He wiped his nose on his sleeve.", S, 0.3, "Theo wiping his nose.", takes=3),
        theo("c12d", "Then people started coming in. Through the service hall. They just kept coming. One of the men saw them and ran back. "
                     "He said they had to stop."),
        n("c12e", "And the woman?", T, 0.3, "Danny.", takes=3),
        theo("c12f", "She kept saying, one more minute."),
        n("c12g", "The food court glass. The crowd on my cameras, all turning the same way at once. I'd thought they were wandering in "
                  "through any door they found.", T, 0.3, "Memory: the food court glass; the crowd turning on the cameras."),
        n("c12h", "They weren't wandering. They were following a drill.", T, 0.3, "A drill cutting through a wall."),
        n("c12i", "And Marcus was standing in their way.", T, 0.35, "Marcus on the ramp.", takes=3),
        n("c12j", "The woman on my radio.", T, 0.3, "Danny.", takes=3),
        theo("c12k", "Same voice. I heard her in your store last night, through the ceiling. It's her."),
        n("c12l", "Was there a little girl with them?", T, 0.3, "Danny."),
        theo("c12m", "There wasn't."),
        n("c12n", "You're sure?", T, 0.3, "Danny.", takes=3),
        theo("c12o", "Three people and a drill, Danny. No kid."),
        n("c12p", "I thought about the bag sitting next to my tent. Two bars and a bottle, for a little girl who didn't exist.", T, 0.3,
          "The packed bag beside the tent."),
        n("c12q", "I wanted to go straight to the department store, stand at her gate, and make her say it.", T, 0.3,
          "The department store gate."),
        n("c12r", "My keys were still in the sock. I squeezed them until the teeth bit through.", T, 0.3, "Danny's fist around the sock."),
        theo("c12s", "Hey. Danny."),
        n("c12t", "His leg. The blood drying on his sneaker. He'd brought me here. Now he was waiting for me to get him home.", S, 0.3,
          "Theo's leg, the blood on his sneaker."),
        n("c12u", "I picked up the water.", S, 0.3, "Danny picks up the containers.", takes=3),
        n("c12v", "The way back took half an hour, the long way around the broken part, with my boot lying in the fountain under us the "
                  "whole time.", S, 0.3, "Crawling back; the boot in the fountain below."),
        n("c12w", "At nine forty-one, I climbed out onto the roof.", T, 0.35, "The roof hatch. 9:41 PM."),
        together("c12x", [
            ("Lily's window was dark.", 0.7, "Lily's window, dark. Hold."),
            ("For the first time ever, I'd missed nine o'clock.", 1.6, "Danny alone on the roof."),
        ], T, 1.6),
    ]},
    {"n": 13, "title": "Pick a Tent", "tag": "DAY 5 · SUMMIT OUTDOORS", "lines": [
        n("c13a", "I told the boy who saved my life to pick a tent, and he asked what it would cost.", S, 0.25, "Theo by the rack."),
        n("c13b", "I'd cleaned the cut on his leg with bottled water and put a bandage on it. He let me, without looking at me once.", S, 0.3,
          "A bandage on Theo's calf."),
        n("c13c", "In the morning he was standing by the rack with his blanket rolled under his arm.", S, 0.3,
          "Theo with his blanket rolled under his arm."),
        n("c13d", "Where are you going?", S, 0.3, "Danny.", takes=3),
        theo("c13e", "Going back."),
        n("c13f", "Your leg's hurt.", S, 0.3, "Danny.", takes=3),
        theo("c13g", "It's fine."),
        n("c13h", "Pick a tent. Any of them. Except that one. That one's mine.", S, 0.3, "Danny pointing at the tents."),
        n("c13i", "He didn't move.", S, 0.3, "Theo, still.", takes=3),
        theo("c13j", "What do you want for it?"),
        n("c13k", "That made me put down the box I was holding. Somebody had taught this kid that nothing was free.", S, 0.3,
          "Danny putting down a box."),
        n("c13l", "Help with the water. Keep it quiet. Tell me if you hear anybody up there.", S, 0.3, "Danny."),
        n("c13m", "He waited for the rest.", S, 0.3, "Theo waiting.", takes=3),
        n("c13n", "That's it.", S, 0.35, "Danny.", takes=3),
        n("c13o", "I found him a clean sweatshirt. He folded it so carefully before he put it down that I had to look at something else.",
          S, 0.35, "Theo folding a sweatshirt."),
        n("c13p", "Vera called at dusk.", T, 0.3, "The radio's light comes on.", takes=3),
        vera("c13q", "You weren't on the roof last night, Danny."),
        n("c13r", "I went cold.", T, 0.3, "Danny, still.", takes=3),
        vera("c13s", "I was worried. I hope everything's all right.", style="Empathetic"),
        n("c13t", "So she watched every night. She'd watched me not show up.", T, 0.3, "The department store roof at night."),
        n("c13u", "I pressed the button.", T, 0.3, "Danny presses the button.", takes=3),
        n("c13v", "What's the little girl's name?", T, 0.3, "Danny."),
        n("c13w", "A pause. Just a little too long.", T, 0.4, "Radio static."),
        vera("c13x", "She hasn't told me yet. She's shy."),
        n("c13y", "And the coat you were trying on. What color?", T, 0.3, "Danny."),
        vera("c13z", "Oatmeal. One day you'll have to explain this interest in my shopping.", style="Vocal Smile"),
        n("c13za", "I let go of the button and left her talking to nobody.", T, 0.35, "Danny lowers the radio."),
        n("c13zb", "At five to nine, I took the flashlight off the shelf. I didn't know if anyone would be in that window tonight.", T, 0.3,
          "Danny takes the flashlight. 8:55 PM."),
        n("c13zc", "Theo pulled on the clean sweatshirt.", S, 0.3, "Theo pulling on the sweatshirt."),
        theo("c13zd", "Can I come?", THEO, 1.4, "Theo."),
    ]},
    {"n": 14, "title": "Somebody Answered", "tag": "DAY 5 · 9:00 P.M. · THE ROOF", "lines": [
        n("c14a", "A stranger just blinked my daughter's goodnight signal at her window.", T, 0.3,
          "The department store roof, a light pointed at the tower."),
        n("c14b", "Theo stayed back in the shadow of the hatch, keeping his weight off his bandaged leg.", S, 0.25,
          "Theo in the shadow of the roof hatch."),
        n("c14c", "Across the highway, I found the tenth floor and counted four windows from the left. I always count. Even when I know "
                  "exactly where to look.", S, 0.3, "The tower across the highway; the tenth floor, fourth window."),
        together("c14d", [
            ("Nine o'clock.", 0.7, "9:00 PM. The window, dark."),
            ("Nothing.", 1.0, "The dark window. Hold."),
        ], T, 1.0, max_pause=0.6),
        together("c14e", [
            ("Then a flashlight came on.", 0.4, "A light in the window."),
            ("One. Two. Three.", 0.5, "One, two, three."),
        ], T, 0.5, max_pause=0.5),
        n("c14f", "She was there. I'd missed her last night, and she came back to the window anyway. She's seven years old.", S, 0.3,
          "Danny's face."),
        n("c14g", "I answered with mine. My hands were steadier than they'd been in days. I had water downstairs, and somebody beside me "
                  "who could hear a tile crack and pull me out.", S, 0.3, "Danny blinks back; Theo behind him."),
        n("c14h", "I was so happy I almost missed the light to my right.", S, 0.3, "A light to the right."),
        n("c14i", "It came from the department store roof.", T, 0.35, "The department store roof.", takes=3),
        together("c14j", [
            ("One.", 0.5, "One."),
            ("Two.", 0.5, "Two."),
            ("Three.", 0.6, "Three."),
        ], D, 0.6, max_pause=0.6),
        together("c14k", [
            ("Pointed across the highway.", 0.4, "The beam pointing across the highway."),
            ("At her window.", 0.6, "Lily's window."),
        ], D, 0.6),
        n("c14l", "I lowered my flashlight. I wanted to blink again, to tell Lily which light was mine. But we only had two signals. Three "
                  "blinks for I love you, and SOS. I'd never taught her what to do if somebody else answered.", T, 0.3,
          "Danny lowering the flashlight."),
        n("c14m", "The department store roof went dark.", T, 0.35, "The department store roof goes dark.", takes=3),
        theo("c14n", "Who is that?", D, 0.3, "Theo.", scene="theo_close"),
        n("c14o", "The woman.", D, 0.35, "Danny.", takes=3),
        n("c14p", "He was looking at my keys. The sock had slipped off when I grabbed the flashlight, and the last key hung against my hand. "
                  "The one with the red tag.", T, 0.3, "The key with the red tag, B3."),
        theo("c14q", "What's B3?"),
        n("c14r", "Why do you ask?", T, 0.3, "Danny.", takes=3),
        theo("c14s", "That's what she kept saying, that night. Down to B3. Get to the door."),
        n("c14t", "I closed my fist around the tag.", T, 0.3, "Danny's fist around the tag.", takes=3),
        theo("c14u", "They weren't trying to rob a store. They were trying to get underneath it."),
        n("c14v", "I thought of old Walt tapping the last key. That one, you never use. Don't ask.", T, 0.3, "Memory: Walt tapping the key."),
        n("c14w", "Across the highway was my daughter. Across the roof was a woman copying her signal.", T, 0.3,
          "Wide: the tower on one side, the department store roof on the other."),
        n("c14x", "And the one thing that woman wanted was hanging from my belt.", T, 0.35, "The B3 key on Danny's belt."),
        n("c14y", "What did she think was behind that door?", T, 2.0, "A steel door in the dark, stenciled B3."),
    ]},
]


def main():
    VO.mkdir(parents=True, exist_ok=True)
    plan_chunks, cands, cast, rows, words = [], [], [], [], 0
    md = ["# The Night Guard, Chapter 2: The Boy in the Ceiling", "",
          "The voiced script, made by `make_plans.py` from `manuscript.md`. A dialogue tag is dropped where a different voice "
          "already makes the speaker obvious. Lines in **bold caps** are other voices; everything else is Danny. Levels follow "
          "`../voice-recipe.md`.", ""]
    for seg in SEGMENTS:
        md += [f"## {seg['n']}. {seg['title']}", "", f"*On screen: {seg['tag']}*", "", "| Id | Who | Line | Picture |", "|---|---|---|---|"]
        for ln in seg["lines"]:
            c = {"id": ln["id"], "who": ln["who"], "style": ln.get("style") or "Deadpan", "pace": "Natural",
                 "lufs": ln["lufs"], "gap": ln["gap"]}
            if ln.get("scene"):
                c["scene"] = ln["scene"]
            if ln.get("radio"):
                c["radio"] = ln["radio"]
            if ln.get("max_pause"):
                c["max_pause"] = ln["max_pause"]
            if ln.get("pitch"):
                c["pitch"] = ln["pitch"]
            if "lines" in ln:
                c["lines"] = [{"text": x["text"], "gap": x["gap"]} for x in ln["lines"]]
                c["rejoin"] = True
                c["text"] = " ".join(x["text"] for x in ln["lines"])
                pics = [x["pic"] for x in ln["lines"]]
            else:
                c["text"] = ln["text"]
                pics = [ln["pic"]]
            for k in range(1, ln["takes"] + 1):
                cand = {key: v for key, v in c.items() if key not in ("lufs", "gap", "rejoin", "radio", "max_pause", "pitch")}
                cand["id"] = f"{c['id']}-{k}"
                (cands if c["who"] == "danny" else cast).append(cand)
            plan_chunks.append(c)
            texts = [x["text"] for x in c["lines"]] if "lines" in c else [c["text"]]
            who = c["who"]
            for i, (t, p) in enumerate(zip(texts, pics)):
                clean = re.sub(r"\[[^\]]*\]\s*", "", t)
                words += len(re.findall(r"[A-Za-z0-9']+", clean))
                lid = c["id"] if len(texts) == 1 else f"{c['id']}.{i + 1}"
                rows.append({"id": lid, "chunk": c["id"], "seg": seg["n"], "who": who, "radio": bool(c.get("radio")), "text": clean, "pic": p})
                shown = clean if who == "danny" else f"**{who.upper()}" + (" (RADIO)" if c.get("radio") else "") + f":** {clean}"
                md.append(f"| {lid} | {who} | {shown} | {p} |")
        md.append("")
    plan = {"voices": VOICES, "scene": DANNY_SCENE, "sample_context": "A first-person story told plainly, in a natural, slightly scared voice.",
            "takes_dir": "takes", "level": "fixed", "tempo": 1.08, "max_pause": 0.22, "chunks": plan_chunks}
    head = {k: v for k, v in plan.items() if k not in ("chunks", "takes_dir")}
    (VO / "plan.json").write_text(json.dumps(plan, indent=1))
    (VO / "cands.json").write_text(json.dumps(head | {"chunks": cands}, indent=1))
    (VO / "cands-cast.json").write_text(json.dumps(head | {"chunks": cast}, indent=1))
    (HERE / "lines.json").write_text(json.dumps(rows, indent=1))
    md.insert(4, f"{words} words.")
    md.insert(5, "")
    (HERE / "script.md").write_text("\n".join(md) + "\n")
    print(f"{words} words, {len(plan_chunks)} chunks, {len(cands)} Danny takes and {len(cast)} cast takes to record")


if __name__ == "__main__":
    main()
