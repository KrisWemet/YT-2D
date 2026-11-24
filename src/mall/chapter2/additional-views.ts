import type {PictureMode} from './picture-edit';

export type ShotView = 'base' | 'wide' | 'danny' | 'theo' | 'detail';
type ViewCue = {
  section: number;
  phrase: string;
  view: ShotView;
  mode?: PictureMode;
  after?: number;
};

// Picture changes inside longer recorded beats. The original action keeps running
// across camera cuts, so a new view cannot replay a climb, fall or rescue.
export const ADDITIONAL_VIEWS: ViewCue[] = [
  {section: 1, phrase: 'The cleaner who used', view: 'detail'},
  {section: 1, phrase: 'His trainers are braced', view: 'theo'},
  {section: 2, phrase: 'Vera never asked about the window', view: 'danny'},
  {section: 5, phrase: "wrist where he'd pushed", view: 'detail'},
  {section: 6, phrase: 'here, I said. The words', view: 'danny'},
  {section: 6, phrase: 'A firefighter. His dad.', view: 'danny'},
  {section: 6, phrase: 'About ten days. Maybe.', view: 'detail'},
  {section: 7, phrase: "an engagement ring he'd dropped", view: 'detail'},
  {section: 7, phrase: 'Down inside the big column', view: 'detail'},
  {section: 7, phrase: 'How much can you carry', view: 'detail'},
  {section: 7, phrase: 'He looked at them. Looked at me.', view: 'theo'},
  {section: 7, phrase: 'We bring water back', view: 'theo'},
  {section: 8, phrase: 'Then I climbed down and started again', view: 'danny'},
  {section: 8, phrase: "I would've given almost anything", view: 'danny', mode: 'confront'},
  {section: 8, phrase: 'I stopped. Theo looked back.', view: 'theo'},
  {section: 9, phrase: 'There was a difference between', view: 'danny'},
  {section: 9, phrase: 'Now your knee', view: 'detail'},
  {section: 9, phrase: 'their faces turned toward', view: 'detail'},
  {section: 10, phrase: 'You have to let go', view: 'danny'},
  {section: 10, phrase: 'His sleeve was bunched', after: 5.02, view: 'detail'},
  {section: 10, phrase: 'Then his hand was back', view: 'detail'},
  {section: 11, phrase: 'treat it with the gear', view: 'danny'},
  {section: 11, phrase: 'Theo eased himself', after: 5.06, view: 'detail'},
  {section: 11, phrase: "After that, we'd have to", view: 'danny'},
  {section: 12, phrase: "I'd checked that lock so many times", view: 'detail', mode: 'lock'},
  {section: 13, phrase: 'folding both down until', view: 'detail'},
  {section: 13, phrase: 'quiet. Tell me if you', view: 'theo'},
  {section: 14, phrase: 'But we had three flashes', view: 'theo'},
  {section: 14, phrase: 'Somebody else had joined it', view: 'danny', mode: 'roof-lowered'},
  {section: 14, phrase: 'The last red tag hung', view: 'detail'},
];
