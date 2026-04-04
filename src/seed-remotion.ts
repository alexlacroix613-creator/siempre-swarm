#!/usr/bin/env node
/**
 * Seed Remotion video capability into creative department memory.
 */
import { SupermemoryClient } from './memory/supermemory-client.js';

const API_KEY = process.env.SUPERMEMORY_API_KEY;
if (!API_KEY) { console.error('Set SUPERMEMORY_API_KEY'); process.exit(1); }

const client = new SupermemoryClient(API_KEY);

async function seed() {
  const entries = [
    {
      content: 'VIDEO PRODUCTION CAPABILITY (added 2026-04-04): Remotion skill is now available — a React-based video creation framework. Enables programmatic video with animations, 3D (Three.js/R3F), data visualization charts, text animations, transitions, captions/subtitles, audio visualization, AI voiceover (ElevenLabs TTS), Lottie animations, maps (Mapbox), GIFs, light leak effects, and FFmpeg integration. 38 rule files cover the full pipeline. Videos can be parameterized with Zod schemas for templated/dynamic production runs. This means the creative department can now produce video content programmatically — social media videos, brand sizzle reels, product showcases, animated data stories, and event recap videos.',
      containerTag: 'dept_creative',
      metadata: { type: 'capability', importance: 'high', added: '2026-04-04' },
    },
    {
      content: 'Remotion video workflow: The Interactive Web Specialist agent is the primary owner of video production (React-based, aligns with HTML/CSS/JS expertise). Digital Designer provides visual direction and assets. Proofreader reviews captions/copy in videos. Tim (ECD) reviews all video creative for brand consistency. For voiceover, use ElevenLabs TTS integration. For data-driven videos (market reports, sales dashboards), coordinate with Sales Intel department for data and use Remotion charts capability.',
      containerTag: 'dept_creative',
      metadata: { type: 'workflow', importance: 'high' },
    },
    {
      content: 'Video content types the creative team can now produce: (1) Social media videos — Instagram Reels, TikTok, short-form. (2) Product showcase videos — animated bottle reveals, tasting note overlays. (3) Brand sizzle reels — event highlights, brand story. (4) Data story videos — animated market reports, sales performance, investor updates. (5) Event recap videos — Badlands festival content, tasting events. (6) Ad creative — digital video ads for Meta/Google. All produced programmatically in React — no video editing software needed.',
      containerTag: 'dept_creative',
      metadata: { type: 'content_types', importance: 'medium' },
    },
  ];

  for (const e of entries) {
    try {
      await client.addMemory(e);
      console.log(`✓ [${e.containerTag}] ${e.content.slice(0, 70)}...`);
      await new Promise(r => setTimeout(r, 800));
    } catch (err) {
      console.log(`✗ [${e.containerTag}] ${err}`);
    }
  }
  console.log('Done.');
}

seed();
