# Channel setup: Chris Ouimet (@kriswemet-q6w)

Upload or paste each item below in YouTube Studio. Changes show on the channel straight away.

## Banner and picture

| File | Size | Where it goes |
|---|---|---|
| `publish/channel-banner.png` | 2560×1440, 1.4 MB (YouTube's limit is 6 MB) | Studio → Customization → Profile → **Banner image** |
| `publish/channel-picture.png` | 800×800, 0.4 MB (limit 4 MB) | Studio → Customization → Profile → **Picture** |

Older versions of Studio put these under Customization → Branding. In the YouTube app, open your channel, tap the pencil icon, then tap the banner or the picture.

- **Banner:** the slogan and the scientist sit in the middle strip that phones show. Computers also show the hurricane and the pigeon, and TVs show the whole picture, including the science doodles.
- **Picture:** YouTube shows it as a circle. When it asks you to crop, keep the whole square.

Both images are drawn in code (`src/channel/Channel.tsx`), so the slogan or colours can be changed and the images rendered again:

```bash
npx remotion still src/index.ts ChannelBanner publish/channel-banner.png
npx remotion still src/index.ts ChannelPicture publish/channel-picture.png
```

## Name and handle (optional, recommended)

The channel name appears under every Short in the feed. "Chris Ouimet" doesn't tell viewers what the channel is about, while a name that matches the content is easier to place and remember. Some options that fit the banner and the scientist:

- **Professor Hmm:** named after the thinking scientist.
- **Cutout Science:** named after the cut-out cartoon style.
- **Weird Questions Lab:** matches the slogan.

The handle `@kriswemet-q6w` looks automatically generated (the `-q6w` part). Change it to match the name you pick. The handle field in Studio shows straight away whether a handle is free. YouTube allows two name changes and two handle changes in any 14 days.

## Description

Studio → Customization → Profile → **Description** (536 of 1,000 characters):

```
Weird questions, real science.

Can we nuke a hurricane? Why do pigeons bob their heads? Each Short takes one surprising science question and answers it in under 30 seconds, with cartoon animation and facts checked against real research. The sources are listed in every video's description.

Expect animal facts, weather and Earth science, space, the human body and everyday physics: science explained simply, without the hype.

New animated science Shorts are on the way. Subscribe if you like your science facts short, funny and true.
```

## Keywords

Studio → Settings → Channel → Basic info → **Keywords**:

```
science facts, science facts shorts, science explained, interesting science facts, animated science, science animation, science shorts, cartoon science, fun facts, animal facts, weather facts, science trivia, educational shorts, weird questions real science
```

These come from vidIQ keyword data (November 2026):
- "science facts shorts" gets about 81,000 searches a month and is growing (+33%), with less competition than plain "science facts".
- "science explained" (about 172,000 a month, +25%) and "interesting science facts" are also good matches.

## Links

Studio → Customization → Profile → **Links**: add every other place you post the Shorts, such as Instagram or TikTok, so viewers can follow you there. Skip this while YouTube is the only place.

## Once the two Shorts are up

- **Playlist:** make a public playlist called "Weird questions, answered" with both Shorts. Add topic playlists (Animals, Weather and Earth, Space, The human body) once each has two or three videos, so none of them looks empty.
- **Home tab:** Studio → Customization → Home tab → add a Shorts section and the playlist.
- **First post:** Studio → Create → Create post. Share the banner image and ask "What weird science question should I answer next?" The answers are video ideas, and the post fills out a new channel page.
- **Upload defaults:** Studio → Settings → Upload defaults. Set the category to Education, add the keywords above as tags, and use this description template:

```
Sources:
•

Weird questions, real science.
#shorts #science #sciencefacts
```
