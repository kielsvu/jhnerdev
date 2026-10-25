export type Project = {
  id: string
  title: string
  description: string
  image_url?: string
  live_url?: string
}

export type TechStack = {
  id: string
  name: string
  logo_url?: string
}

export const projects: Project[] = [
  { id: "portfolio", title: "Jhner", description: "A modern personal portfolio focused on clean interface design, responsive layouts, and smooth interactions.", live_url: "https://jhner.dev" },
]

export const techStacks: TechStack[] = [
  { id: "html", name: "HTML" },
  { id: "css", name: "CSS" },
  { id: "javascript", name: "JavaScript" },
  { id: "typescript", name: "TypeScript" },
  { id: "react", name: "React" },
  { id: "nextjs", name: "Next.js" },
  { id: "tailwind", name: "Tailwind CSS" },
  { id: "git", name: "Git" },
]
