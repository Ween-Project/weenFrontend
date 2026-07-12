import type { Activity, Feature, Opportunity, Stat } from "@/types";

export const features: Feature[] = [
  {
    icon: "spark",
    title: "Find your cause",
    description: "Discover local opportunities matched to the issues and skills you care about.",
  },
  {
    icon: "people",
    title: "Meet your people",
    description: "Join a curious, generous community that believes small actions create real change.",
  },
  {
    icon: "chart",
    title: "See your impact",
    description: "Track every hour, project, and milestone in one clear personal impact profile.",
  },
];

export const stats: Stat[] = [
  { label: "Total impact", value: "48 hrs", change: "+12% this month", tone: "green" },
  { label: "Projects joined", value: "12", change: "3 active now", tone: "purple" },
  { label: "People reached", value: "286", change: "+34 this week", tone: "orange" },
];

export const activities: Activity[] = [
  { id: 1, title: "Coastal cleanup", organization: "Blue Tomorrow", date: "Jun 28, 2026", hours: 4, status: "Completed" },
  { id: 2, title: "Community garden", organization: "Grow Together", date: "Jul 6, 2026", hours: 3, status: "Upcoming" },
  { id: 3, title: "Youth coding club", organization: "Code Forward", date: "Jul 11, 2026", hours: 2, status: "Upcoming" },
];

export const opportunities: Opportunity[] = [
  { id: 1, title: "City park revival", organization: "Green City", date: "Jul 8", spots: 8, category: "Environment" },
  { id: 2, title: "Homework buddies", organization: "Open Books", date: "Jul 12", spots: 4, category: "Education" },
];

export const weeklyImpact = [38, 55, 44, 68, 52, 82, 64];
