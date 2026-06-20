import data from "./projects.json";

export type Project = {
  slug: string;
  title: string;
  blurb: string;
  description: string;
  year: number;
  category: "AI" | "Web" | "Design" | "Tooling";
  tags: string[];
  featured: boolean;
  link?: string;
};

// Source of truth: projects.json (edited via the admin dashboard).
export const projects: Project[] = data as Project[];
export const featuredProjects = projects.filter((p) => p.featured);
