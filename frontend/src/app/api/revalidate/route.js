import { NextResponse } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';

// In-memory cooldown tracker to prevent cache stampedes / revalidation storms
const lastRevalidated = new Map();
const COOLDOWN_MS = 1000; // 1 second cooldown per tag/path

function isCooldownActive(key) {
  const now = Date.now();
  const last = lastRevalidated.get(key) || 0;
  if (now - last < COOLDOWN_MS) {
    return true;
  }
  lastRevalidated.set(key, now);
  return false;
}

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { path, tag, paths = [], tags = [] } = body;

    const allTags = new Set(tags);
    if (tag) allTags.add(tag);

    const allPaths = new Set(paths);
    if (path) allPaths.add(path);

    if (allTags.size === 0 && allPaths.size === 0) {
      allTags.add('vacancies');
      allPaths.add('/');
    }

    const revalidatedTags = [];
    const revalidatedPaths = [];

    for (const t of allTags) {
      if (!isCooldownActive(`tag:${t}`)) {
        revalidateTag(t, 'max');
        revalidatedTags.push(t);
      }
    }

    for (const p of allPaths) {
      if (!isCooldownActive(`path:${p}`)) {
        revalidatePath(p);
        revalidatedPaths.push(p);
      }
    }

    // Clean up old cooldown entries periodically
    if (lastRevalidated.size > 200) {
      const now = Date.now();
      for (const [key, ts] of lastRevalidated.entries()) {
        if (now - ts > COOLDOWN_MS * 5) {
          lastRevalidated.delete(key);
        }
      }
    }

    return NextResponse.json({
      revalidated: true,
      tags: revalidatedTags,
      paths: revalidatedPaths,
      timestamp: Date.now(),
    });
  } catch (err) {
    return NextResponse.json(
      { message: 'Error revalidating', error: String(err) },
      { status: 500 }
    );
  }
}
