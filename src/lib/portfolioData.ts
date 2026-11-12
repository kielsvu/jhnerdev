export type LocalProject = {
  id: string
  title: string
  description: string
  image_url?: string
  image_urls?: string[]
  live_url?: string
  github_url?: string
  technologies?: string
  key_features?: string
}


export type LocalTechStack = {
  id: string
  name: string
  logo_key: string
}

export const projects: LocalProject[] = [
  {
  id: 'jhnermusic',
  title: 'JhnerMusic',
  description: 'A modern music app with a clean Apple Music-inspired interface. Enjoy ad-free listening and download your favorite music for offline playback.',
  technologies: 'Kotlin, Jetpack Compose, Android SDK',
  image_url: '/projects/JhnerMusic.jpg',
  },
  {
  id: 'keepj',
  title: 'KeepJ',
  description: 'A modern password manager with a clean interface and secure vault for storing your accounts. Protect your credentials with PIN authentication and encryption while keeping everything organized and easy to access.',
  technologies: 'Kotlin, Jetpack Compose, Android SDK, Room Database, Android Keystore',
  image_url: '/projects/KeepJ.jpg',
  },
  {
  id: 'younggod',
  title: 'Young God Worldwide',
  description: 'A modern community platform with a clean interface for connecting members, showcasing profiles, and building a strong digital identity. Designed with responsive layouts, smooth animations, and an engaging user experience.',
  technologies: 'Next.js, React, TypeScript, Tailwind CSS, Framer Motion, JavaScript',
  image_url: '/projects/ygw.jpg',
  }
  {
  id: 'Nexora',
  title: 'Nexora Hub',
  description: 'NexoraHub is a Roblox hub with features like Aimbot, ESP and Camera controls. It comes with a clean dark interface with pink accents and easy-to-use settings for customizing the gameplay experience.',
  technologies: 'Lua, Luau',
  image_url: '/projects/NexoraHub.jpg',
  }
]


export const techStacks: LocalTechStack[] = [
  { id: 'react', name: 'React', logo_key: 'react' },
  { id: 'nextjs', name: 'Next.js', logo_key: 'nextjs' },
  { id: 'typescript', name: 'TypeScript', logo_key: 'typescript' },
  { id: 'javascript', name: 'JavaScript', logo_key: 'javascript' },
  { id: 'html', name: 'HTML5', logo_key: 'html' },
  { id: 'css', name: 'CSS3', logo_key: 'css' },
  { id: 'tailwind', name: 'Tailwind CSS', logo_key: 'tailwind' },
  { id: 'node', name: 'Node.js', logo_key: 'node' },
  { id: 'git', name: 'Git', logo_key: 'git' },
  { id: 'github', name: 'GitHub', logo_key: 'github' },
  { id: 'tsx', name: 'TSX', logo_key: 'tsx' },
  { id: 'jsx', name: 'JSX', logo_key: 'jsx' },
  { id: 'sql', name: 'SQL', logo_key: 'sql' },
  { id: 'lua', name: 'Lua', logo_key: 'lua' },
  { id: 'c', name: 'C', logo_key: 'c' },
  { id: 'cpp', name: 'C++', logo_key: 'cpp' },
  { id: 'csharp', name: 'C#', logo_key: 'csharp' },
  { id: 'php', name: 'PHP', logo_key: 'php' },
  { id: 'python', name: 'Python', logo_key: 'python' },
  { id: 'java', name: 'Java', logo_key: 'java' },
  { id: 'kotlin', name: 'Kotlin', logo_key: 'kotlin' },
  { id: 'assembly', name: 'Assembly', logo_key: 'assembly' },
]
