export interface CVWorkJob {
  id?: string;
  title?: string;
  company?: { name?: string };
  summary?: string;
  highlights?: string[];
}

export interface DeveloperCV {
  headline?: string;
  summary?: string;
  skills?: string[];
  workExperience?: CVWorkJob[];
}

export interface CVDiffItem {
  field: string;
  type: 'added' | 'changed' | 'removed';
  oldValue?: string;
  newValue?: string;
  items?: string[];
}

function getJobKey(job: CVWorkJob): string {
  return (job.company?.name || job.id || job.title || '').trim().toLowerCase();
}

function getJobCompanyName(job: CVWorkJob): string {
  return job.company?.name || job.title || 'Role';
}

function compareTopLevelFields(prevCV: DeveloperCV, nextCV: DeveloperCV): CVDiffItem[] {
  const diffs: CVDiffItem[] = [];
  if (prevCV.headline !== nextCV.headline) {
    diffs.push({
      field: 'Headline',
      type: 'changed',
      oldValue: prevCV.headline,
      newValue: nextCV.headline,
    });
  }
  if (prevCV.summary !== nextCV.summary) {
    diffs.push({
      field: 'Summary',
      type: 'changed',
      oldValue: prevCV.summary,
      newValue: nextCV.summary,
    });
  }
  return diffs;
}

function compareSkills(prevSkillsList?: string[], nextSkillsList?: string[]): CVDiffItem[] {
  const diffs: CVDiffItem[] = [];
  const prevSkills = new Set(prevSkillsList || []);
  const nextSkills = new Set(nextSkillsList || []);

  const addedSkills = [...nextSkills].filter((s) => !prevSkills.has(s));
  const removedSkills = [...prevSkills].filter((s) => !nextSkills.has(s));

  if (addedSkills.length > 0) {
    diffs.push({ field: 'Skills Added', type: 'added', items: addedSkills });
  }
  if (removedSkills.length > 0) {
    diffs.push({ field: 'Skills Removed / Omitted', type: 'removed', items: removedSkills });
  }
  return diffs;
}

function compareJobHighlights(
  companyName: string,
  prevHighlights: string[],
  nextHighlights: string[]
): CVDiffItem[] {
  const diffs: CVDiffItem[] = [];
  const addedH = nextHighlights.filter((h) => !prevHighlights.includes(h));
  const removedH = prevHighlights.filter((h) => !nextHighlights.includes(h));

  if (addedH.length > 0) {
    diffs.push({ field: `Highlights refined at ${companyName}`, type: 'added', items: addedH });
  }
  if (removedH.length > 0) {
    diffs.push({ field: `Highlights omitted at ${companyName}`, type: 'removed', items: removedH });
  }
  return diffs;
}

function compareJobSummary(prevSummary?: string, nextSummary?: string, companyName?: string): CVDiffItem[] {
  if (prevSummary === nextSummary) return [];
  if (!prevSummary && !nextSummary) return [];
  return [
    {
      field: `Role Summary at ${companyName || 'Role'}`,
      type: 'changed',
      oldValue: prevSummary || 'None',
      newValue: nextSummary || 'None',
    },
  ];
}

function compareMatchedJob(prevJob: CVWorkJob, job: CVWorkJob, companyName: string): CVDiffItem[] {
  const diffs: CVDiffItem[] = [];
  if (prevJob.title !== job.title) {
    diffs.push({
      field: `Title at ${companyName}`,
      type: 'changed',
      oldValue: prevJob.title,
      newValue: job.title,
    });
  }
  diffs.push(...compareJobSummary(prevJob.summary, job.summary, companyName));
  diffs.push(...compareJobHighlights(companyName, prevJob.highlights || [], job.highlights || []));
  return diffs;
}

function buildJobLookupMap(jobs: CVWorkJob[]): Map<string, CVWorkJob> {
  const jobMap = new Map<string, CVWorkJob>();
  for (const job of jobs) {
    const key = getJobKey(job);
    if (key) jobMap.set(key, job);
  }
  return jobMap;
}

function diffSingleJob(job: CVWorkJob, jobMap: Map<string, CVWorkJob>): CVDiffItem[] {
  const prevJob = jobMap.get(getJobKey(job));
  const companyName = getJobCompanyName(job);
  if (!prevJob) {
    return [
      {
        field: `Experience: ${companyName}`,
        type: 'added',
        newValue: `${job.title || ''} at ${job.company?.name || ''}`,
      },
    ];
  }
  return compareMatchedJob(prevJob, job, companyName);
}

function compareWorkExperience(prevJobs?: CVWorkJob[], nextJobs?: CVWorkJob[]): CVDiffItem[] {
  const jobMap = buildJobLookupMap(prevJobs || []);
  const diffs: CVDiffItem[] = [];
  for (const job of nextJobs || []) {
    diffs.push(...diffSingleJob(job, jobMap));
  }
  return diffs;
}

export function computeCVDiff(prevCV?: DeveloperCV | null, nextCV?: DeveloperCV | null): CVDiffItem[] {
  if (!prevCV || !nextCV) return [];
  return [
    ...compareTopLevelFields(prevCV, nextCV),
    ...compareSkills(prevCV.skills, nextCV.skills),
    ...compareWorkExperience(prevCV.workExperience, nextCV.workExperience),
  ];
}
