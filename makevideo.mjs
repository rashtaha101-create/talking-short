// Stitches frames/ into out/short_silent.mp4 (needs ffmpeg on PATH)
import { spawnSync } from 'node:child_process'; import fs from 'node:fs';
fs.mkdirSync('out', { recursive: true });
const r = spawnSync('ffmpeg', ['-y', '-framerate', '30', '-i', 'frames/f%04d.jpg', '-c:v', 'libx264', '-crf', '17', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', 'out/short_silent.mp4'], { stdio: 'inherit' });
if (r.error) console.error('ffmpeg not found. Install it from https://ffmpeg.org/download.html and run again.');
else console.log(r.status === 0 ? 'Wrote out/short_silent.mp4' : 'ffmpeg failed');
