/**
 * Lightweight JSON / DeveloperCV Diff Helper
 * Compares two DeveloperCV objects (e.g. previous version vs new adapted version)
 * and produces structured change items indicating what was added, changed, or removed.
 */

export function computeCVDiff(prevCV, nextCV) {
  if (!prevCV || !nextCV) return [];
  const diffs = [];

  // 1. Headline
  if (prevCV.headline !== nextCV.headline) {
    diffs.push({
      field: 'Headline',
      type: 'changed',
      oldValue: prevCV.headline,
      newValue: nextCV.headline,
    });
  }

  // 2. Summary
  if (prevCV.summary !== nextCV.summary) {
    diffs.push({
      field: 'Summary',
      type: 'changed',
      oldValue: prevCV.summary,
      newValue: nextCV.summary,
    });
  }

  // 3. Skills
  const prevSkills = new Set(prevCV.skills || []);
  const nextSkills = new Set(nextCV.skills || []);

  const addedSkills = [...nextSkills].filter((s) => !prevSkills.has(s));
  const removedSkills = [...prevSkills].filter((s) => !nextSkills.has(s));

  if (addedSkills.length > 0) {
    diffs.push({
      field: 'Skills Added',
      type: 'added',
      items: addedSkills,
    });
  }
  if (removedSkills.length > 0) {
    diffs.push({
      field: 'Skills Removed / Omitted',
      type: 'removed',
      items: removedSkills,
    });
  }

  // 4. Work Experience Highlights & Titles
  const prevJobs = prevCV.workExperience || [];
  const nextJobs = nextCV.workExperience || [];

  const jobMap = new Map();
  for (const job of prevJobs) {
    const key = (job.company?.name || job.id || job.title || '').trim().toLowerCase();
    if (key) jobMap.set(key, job);
  }

  for (const job of nextJobs) {
    const key = (job.company?.name || job.id || job.title || '').trim().toLowerCase();
    const prevJob = jobMap.get(key);
    const companyName = job.company?.name || job.title || 'Role';

    if (!prevJob) {
      diffs.push({
        field: `Experience: ${companyName}`,
        type: 'added',
        newValue: `${job.title} at ${job.company?.name || ''}`,
      });
    } else {
      if (prevJob.title !== job.title) {
        diffs.push({
          field: `Title at ${companyName}`,
          type: 'changed',
          oldValue: prevJob.title,
          newValue: job.title,
        });
      }
      if (prevJob.summary !== job.summary && (prevJob.summary || job.summary)) {
        diffs.push({
          field: `Role Summary at ${companyName}`,
          type: 'changed',
          oldValue: prevJob.summary || 'None',
          newValue: job.summary || 'None',
        });
      }

      // Check highlights
      const prevHighlights = prevJob.highlights || [];
      const nextHighlights = job.highlights || [];

      const addedH = nextHighlights.filter((h) => !prevHighlights.includes(h));
      const removedH = prevHighlights.filter((h) => !nextHighlights.includes(h));

      if (addedH.length > 0) {
        diffs.push({
          field: `Highlights refined at ${companyName}`,
          type: 'added',
          items: addedH,
        });
      }
      if (removedH.length > 0) {
        diffs.push({
          field: `Highlights omitted at ${companyName}`,
          type: 'removed',
          items: removedH,
        });
      }
    }
  }

  return diffs;
}
