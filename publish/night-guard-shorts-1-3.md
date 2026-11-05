# The Night Guard: Shorts 1–3 upload details

Files: `out/shorts/night-guard-short-1.mp4`, `-2.mp4` and `-3.mp4`. Each is 1080×1920 at 30 fps, −15 LUFS, with burned-in captions.

Post them in order, one a day. Each title is the Short's hook, not a part number, so a viewer can start anywhere. The end card points to the next part.

## Short 1: The Gate (about 0:24)

All the copy-paste fields and settings are in `night-guard-youtube-setup.md`.

## Short 2: Forty-Two Keys (about 1:01)

- **Title:** The man who gave me these keys said never to use the last one
- **Description:** 42 keys, one for every store. The last one has a tag that says B3, and there is no B3 on the mall map. #shorts #zombie #mystery #story #animation
- **Pinned comment:** Part 3: my best friend's last radio call.

## Short 3: One-Forty (about 0:48)

- **Title:** My best friend's last radio call
- **Description:** Every night at 1 a.m. he told me a terrible joke. Tonight he whispered. #shorts #zombie #survival #story #animation
- **Pinned comment:** Part 4 is next: what was walking up the ramp.

## Notes

- Short 1 has its own thumbnail, `thumbnails/night-guard-short-1-thumbnail.jpg`. How to set it is in `night-guard-youtube-setup.md`. For Shorts 2 and 3, the first frame (the hook) is the thumbnail for now.
- To re-render after a change: `npx remotion render src/index.ts MallShort1 out/shorts/raw-1.mp4 --crf=18 --pixel-format=yuv420p --audio-bitrate=256k`, then `bash images/mall/finish.sh out/shorts/raw-1.mp4 out/shorts/night-guard-short-1.mp4`. Do the same for 2 and 3.
