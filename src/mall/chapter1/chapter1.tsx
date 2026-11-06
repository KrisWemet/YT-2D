import type {ShortData} from '../cues';
import type {ChapterDef} from '../MallChapter';
import ch1 from './ch1.json';
import {SHOTS_1_3} from './shots01';
import {SHOTS_4_7} from './shots02';
import {SHOTS_8_11} from './shots03';
import {SHOTS_12_14} from './shots04';

/* The Night Guard, Chapter 1: The King of the Mall (about 15 minutes, 16:9).
   The script is images/mall/chapter1/make_plans.py; the voice is images/mall/vo/ch1. */

export const CHAPTER1_DEF: ChapterDef = {
  data: ch1 as unknown as ShortData,
  vo: 'mall/ch1/vo.mp3',
  shots: [...SHOTS_1_3, ...SHOTS_4_7, ...SHOTS_8_11, ...SHOTS_12_14],
  tail: 9,
  radioNames: {marcus: 'MARCUS', marcus0: 'MARCUS', marcus1: 'MARCUS', marcus2: 'MARCUS', vera: 'UNKNOWN', broadcast: 'EMERGENCY ALERT'},
  tags: [
    {at: '0', text: 'NIGHT 1 · 2:45 A.M.'},
    {at: 'I have a key', text: '9:00 P.M. · THE NIGHT IT STARTED'},
    {at: 'Every night at one', text: '1:00 A.M.'},
    {at: 'I said his name', text: '1:41 A.M. · SECURITY OFFICE'},
    {at: 'I did the math', text: '1:44 A.M.'},
    {at: 'Key thirty-one', text: '1:48 A.M. · SUMMIT OUTDOORS'},
    {at: 'Come on man', text: '2:00 A.M.'},
    {at: "He didn't look at me", text: '2:45 A.M.'},
    {at: 'I switched my radio off', text: '2:46 A.M.'},
    {at: 'When I grabbed that radio', text: '3:05 A.M.'},
    {at: "I don't remember falling", text: 'DAY 1 · 6:40 A.M.'},
    {at: 'It was from my mom', text: 'DAY 1 OF 30'},
    {at: "There's a ladder", text: 'DAY 1 · 3:00 P.M.'},
    {at: 'No streetlights', text: 'DAY 1 · 9:00 P.M.'},
  ],
  hits: [
    // 1. cold open
    {file: 'breath', at: 0.2, db: -12},
    {file: 'crackle', at: 'about to tell', db: -16},
    {file: 'rewind', at: 'Let me back', db: -9, offset: 0.05},
    {file: 'slam', at: '>+back up', db: -10},
    // 2. forty-two keys
    {file: 'keys', at: 'I have a key', db: -14},
    {file: 'musicbox', at: "She's seven", db: -22},
    {file: 'keys', at: 'Forty-two keys', db: -16},
    {file: 'lock', at: "Tonight I'd only", db: -14, offset: 0.6},
    {file: 'slam', at: 'In thirty days', db: -16},
    // 3. one-forty
    {file: 'static', at: 'At one on the dot', db: -14},
    {file: 'static', at: 'At one-forty', db: -14},
    {file: 'crackle', at: 'Sir Sir', db: -20},
    // 4. camera six
    {file: 'static', at: 'I said his name', db: -16},
    {file: 'busy', at: 'all circuits', db: -18, offset: -0.6},
    {file: 'buzz', at: "My mom's phone", db: -20},
    {file: 'slam', at: 'made of glass', db: -14},
    // 5. four minutes
    {file: 'glass', at: 'exploded', db: -6, offset: -0.15},
    // 6. key thirty-one
    {file: 'gate', at: 'Under the gate', db: -10},
    {file: 'lock', at: 'lock it', db: -10},
    {file: 'creak', at: 'groaned', db: -14, offset: -0.3},
    {file: 'knock', at: '>+somebody knocked', db: -8},
    // 7. the last joke
    {file: 'breath', at: 'At two thirty-nine', db: -12, offset: 1.0},
    {file: 'slam', at: 'stood up', db: -9},
    // 8. the radio
    {file: 'crackle', at: 'Then my radio crackled', db: -12},
    {file: 'creak', at: 'And the steel started', db: -10},
    // 9. through the bars
    {file: 'static', at: 'I switched my radio off', db: -14, offset: 0.4},
    {file: 'breath', at: 'His teeth were', db: -12},
    {file: 'crackle', at: 'she said my name', db: -18},
    // 10. she knew my name
    {file: 'static', at: 'Then the little light', db: -18, offset: 1.0},
    {file: 'rattle', at: 'listened to Marcus lean', db: -20, offset: 1.0},
    {file: 'rattle', at: 'The department store was locked', db: -18},
    // 11. rounds
    {file: 'rattle', at: 'I heard a gate rattle', db: -22},
    {file: 'rattle', at: 'Then another one', db: -16},
    {file: 'rattle', at: 'It was Marcus', db: -12},
    {file: 'rattle', at: 'He shook mine', db: -8},
    {file: 'buzz', at: 'Then my phone buzzed', db: -10},
    // 12. thirty days
    {file: 'alert', at: 'This is an emergency', db: -22, offset: -0.6},
    {file: 'slam', at: 'Rescue was thirty', db: -14},
    // 13. the roof
    {file: 'helicopter', at: 'A helicopter', db: -10, offset: -0.4},
    {file: 'slam', at: 'went dark', db: -10},
    // 14. three blinks
    {file: 'musicbox', at: "She's seven years old", db: -20},
    {file: 'crackle', at: 'Then the radio in my pocket', db: -14},
    {file: 'slam', at: '>+in the window', db: -8},
  ],
  beds: [
    // 1
    {file: 'groans', from: 0, to: 'An hour ago', db: [[0, -30], [0.4, -25], [1, -26]]},
    {file: 'shuffle', from: 0, to: 'An hour ago', db: -30},
    {file: 'drone', from: 0, to: 'An hour ago', db: [[0, -34], [0.3, -26], [1, -24]]},
    // 2-3: the quiet night before
    {file: 'mallhum', from: 'I have a key', to: 'I work nights', db: -32},
    {file: 'suburb', from: 'I work nights', to: 'My shift is nine', db: -28},
    {file: 'mallhum', from: 'My shift is nine', to: 'Marcus guards', db: -32},
    {file: 'garage', from: 'Marcus guards', to: 'It went completely silent', db: -34},
    {file: 'drone', from: "There's a guy on the ramp", to: 'It went completely silent', db: [[0, -36], [1, -26]]},
    // 4
    {file: 'mallhum', from: 'I said his name', to: 'I did the math', db: -33},
    {file: 'groans', from: 'Behind them more', to: 'They were all heading', db: -32},
    {file: 'drone', from: 'They were all heading', to: 'I did the math', db: -28},
    // 5
    {file: 'tick', from: 'I did the math', to: 'Behind me the food court', db: -22},
    {file: 'heartbeat', from: "Mall cops aren't", to: 'exploded', db: -24},
    {file: 'groans', from: 'exploded', to: 'Key thirty-one', db: -24},
    // 6
    {file: 'groans', from: 'Through the gate', to: 'Twenty minutes went by', db: -30},
    {file: 'shuffle', from: 'Through the gate', to: 'Twenty minutes went by', db: -30},
    {file: 'mallhum', from: 'Twenty minutes went by', to: "Danny It's me", db: -34},
    {file: 'heartbeat', from: "Danny It's me", to: 'Come on man', db: -26},
    // 7
    {file: 'drone', from: 'Come on man', to: "He didn't look at me", db: [[0, -34], [0.7, -32], [1, -26]]},
    // 8-9
    {file: 'groans', from: "He didn't look at me", to: 'Without the noise', db: [[0, -32], [0.5, -24], [1, -26]]},
    {file: 'shuffle', from: 'Every head in that hallway', to: 'Without the noise', db: -28},
    {file: 'heartbeat', from: 'I had to reach through', to: 'All except Marcus', db: -24},
    // 10
    {file: 'mallhum', from: 'When I grabbed that radio', to: "I don't remember falling", db: -34},
    {file: 'drone', from: 'So who was she', to: "I don't remember falling", db: -28},
    // 11-12: morning
    {file: 'mallhum', from: "I don't remember falling", to: "There's a ladder", db: -31},
    {file: 'static', from: 'This is an emergency', to: 'It played the same', db: -32},
    {file: 'heartbeat', from: 'My mom is diabetic', to: "There's a ladder", db: -26},
    // 13
    {file: 'wind', from: 'Six years I\'ve worked', to: 'At eight fifty-nine', db: -24},
    {file: 'groans', from: 'Eight lanes of cars', to: 'Smoke over downtown', db: -36},
    {file: 'drone', from: 'At eight fifty-nine', to: 'No streetlights', db: -26},
    // 14
    {file: 'wind', from: 'No streetlights', to: "That's sweet Danny", db: -30},
    {file: 'heartbeat', from: "Nine o'clock Nothing", to: 'Then one Two Three', db: -24},
    {file: 'drone', from: "That's sweet Danny", to: 'end', db: [[0, -30], [0.5, -24], [1, -34]]},
  ],
};
