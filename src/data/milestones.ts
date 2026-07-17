export interface Milestone {
  week: string;
  theme: string;
  deliverable: string;
  reviewWeek: boolean;
  description: string;
  submissionDeadline: string;
  reviewDeadline: string;
}

export const MILESTONES: Milestone[] = [
  {
    week: "Week 1",
    theme: "Project management",
    deliverable: "Project management platform",
    reviewWeek: true,
    description:
      "Build the project management platform the cohort will use to track work, deadlines, and motivation for the rest of the pilot.",
    submissionDeadline: "2026-07-17T17:00:00",
    reviewDeadline: "2026-07-20T17:00:00",
  },
  {
    week: "Week 2",
    theme: "Internal communications",
    deliverable: "Internal communications platform",
    reviewWeek: true,
    description:
      "Build the internal communications platform that replaces Discord as the cohort's primary channel.",
    submissionDeadline: "2026-07-24T17:00:00",
    reviewDeadline: "2026-07-27T17:00:00",
  },
  {
    week: "Week 3",
    theme: "Vibe marketing",
    deliverable: "Vibe marketing platform",
    reviewWeek: true,
    description:
      "Build a vibe marketing platform that presents the cohort — and each participant's work — with energy that attracts attention and partners.",
    submissionDeadline: "2026-07-31T17:00:00",
    reviewDeadline: "2026-08-03T17:00:00",
  },
  {
    week: "Week 4",
    theme: "Ludwitt learning",
    deliverable: "Learning engineer integration to Ludwitt",
    reviewWeek: false,
    description:
      "Build and register a learning application on Ludwitt; success is measured by verified external user adoption.",
    submissionDeadline: "2026-08-07T17:00:00",
    reviewDeadline: "2026-08-10T17:00:00",
  },
  {
    week: "Week 5",
    theme: "Startup",
    deliverable: "Startup / entrepreneurship",
    reviewWeek: false,
    description:
      "Ship a venture package: investor materials, business plan, and a production application with external-user evidence.",
    submissionDeadline: "2026-08-14T17:00:00",
    reviewDeadline: "2026-08-17T17:00:00",
  },
  {
    week: "Week 6",
    theme: "Open source swarm",
    deliverable: "Open source swarm",
    reviewWeek: false,
    description:
      "Contribute as a swarm: land at least one merged pull request in a qualified open-source project before pilot end.",
    submissionDeadline: "2026-08-21T17:00:00",
    reviewDeadline: "2026-08-24T17:00:00",
  },
];
