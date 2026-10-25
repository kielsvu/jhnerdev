'use client'

import type { SVGProps } from 'react'

type Props = SVGProps<SVGSVGElement> & { name: string }

function LetterIcon({ letter, ...props }: SVGProps<SVGSVGElement> & { letter: string }) {
  return <svg viewBox="0 0 24 24" fill="none" {...props}>
    <rect x="3" y="3" width="18" height="18" rx="3" fill="currentColor" />
    <text x="12" y="15.8" textAnchor="middle" fontSize={letter.length > 3 ? "6.2" : "8.5"} fontWeight="800" fontFamily="Arial,sans-serif" fill="var(--tech-icon-bg,#080808)">{letter}</text>
  </svg>
}

function ReactIcon(p: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.1" {...p}>
      <ellipse cx="12" cy="12" rx="11" ry="4.2"/>
      <ellipse cx="12" cy="12" rx="11" ry="4.2" transform="rotate(60 12 12)"/>
      <ellipse cx="12" cy="12" rx="11" ry="4.2" transform="rotate(120 12 12)"/>
      <circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none"/>
    </svg>
  )
}

function NextIcon(p: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...p}>
      <path d="M11.572 0c-.176 0-.31.001-.358.007a19.76 19.76 0 0 1-.364.033C7.443.346 4.25 2.185 2.228 5.012a11.875 11.875 0 0 0-2.119 5.243c-.096.659-.108.854-.108 1.747s.012 1.089.108 1.748c.652 4.506 3.86 8.292 8.209 9.695.779.25 1.6.422 2.534.525.363.04 1.935.04 2.299 0 1.611-.178 2.977-.577 4.323-1.264.207-.106.247-.134.219-.158-.02-.013-.9-1.193-1.955-2.62l-1.919-2.592-2.404-3.558a338.739 338.739 0 0 0-2.422-3.556c-.009-.002-.018 1.579-.023 3.51-.007 3.38-.01 3.515-.052 3.595a.426.426 0 0 1-.206.214c-.075.037-.14.044-.495.044H7.81l-.108-.068a.438.438 0 0 1-.157-.171l-.05-.106.006-4.703.007-4.705.072-.092a.645.645 0 0 1 .174-.143c.096-.047.134-.051.54-.051.478 0 .558.018.682.154.035.038 1.337 1.999 2.895 4.361a10760.433 10760.433 0 0 0 4.735 7.17l1.9 2.879.096-.063a12.317 12.317 0 0 0 2.466-2.163 11.944 11.944 0 0 0 2.824-6.134c.096-.66.108-.854.108-1.748 0-.893-.012-1.088-.108-1.747-.652-4.506-3.859-8.292-8.208-9.695a12.597 12.597 0 0 0-2.499-.523A33.119 33.119 0 0 0 11.573 0zm4.069 7.217c.347 0 .408.005.486.047a.473.473 0 0 1 .237.277c.018.06.023 1.365.018 4.304l-.006 4.218-.744-1.14-.746-1.14v-3.066c0-1.982.01-3.097.023-3.15a.478.478 0 0 1 .233-.296c.096-.05.13-.054.499-.054z"/>
    </svg>
  )
}

function TypeScriptIcon(p: SVGProps<SVGSVGElement>) { return <LetterIcon letter="TS" {...p}/> }
function JavaScriptIcon(p: SVGProps<SVGSVGElement>) { return <LetterIcon letter="JS" {...p}/> }
function HtmlIcon(p: SVGProps<SVGSVGElement>) { return <LetterIcon letter="HTML" {...p}/> }
function CssIcon(p: SVGProps<SVGSVGElement>) { return <LetterIcon letter="CSS" {...p}/> }

function TailwindIcon(p: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...p}>
      <path d="M12.001 4.8c-3.2 0-5.2 1.6-6 4.8 1.2-1.6 2.6-2.2 4.2-1.8.913.228 1.565.89 2.288 1.624C13.666 10.618 15.027 12 18.001 12c3.2 0 5.2-1.6 6-4.8-1.2 1.6-2.6 2.2-4.2 1.8-.913-.228-1.565-.89-2.288-1.624C16.337 6.182 14.976 4.8 12.001 4.8zm-6 7.2c-3.2 0-5.2 1.6-6 4.8 1.2-1.6 2.6-2.2 4.2-1.8.913.228 1.565.89 2.288 1.624 1.177 1.194 2.538 2.576 5.512 2.576 3.2 0 5.2-1.6 6-4.8-1.2 1.6-2.6 2.2-4.2 1.8-.913-.228-1.565-.89-2.288-1.624C10.337 13.382 8.976 12 6.001 12z"/>
    </svg>
  )
}

function NodeIcon(p: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...p}>
      <path d="M11.998 24c-.321 0-.641-.084-.922-.247l-2.936-1.737c-.438-.245-.224-.332-.08-.383.585-.203.703-.25 1.328-.605.065-.037.151-.023.218.017l2.256 1.339c.082.045.198.045.272 0l8.795-5.076c.082-.047.134-.141.134-.238V6.921c0-.099-.052-.19-.137-.242l-8.791-5.072c-.081-.047-.189-.047-.271 0L3.075 6.68c-.087.05-.139.146-.139.241v10.15c0 .097.052.19.139.235l2.409 1.392c1.307.654 2.108-.116 2.108-.891V7.787c0-.142.114-.253.256-.253h1.115c.139 0 .255.111.255.253v10.021c0 1.745-.95 2.745-2.604 2.745-.508 0-.909 0-2.026-.551L2.28 18.675a1.85 1.85 0 0 1-.919-1.604V6.921c0-.658.353-1.271.919-1.601l8.795-5.082c.551-.315 1.284-.315 1.832 0l8.794 5.082c.566.33.92.943.92 1.601v10.15c0 .658-.354 1.273-.92 1.604l-8.794 5.078c-.279.163-.6.247-.909.247zm2.718-6.998c-3.851 0-4.655-1.767-4.655-3.252 0-.142.113-.253.255-.253h1.138c.127 0 .232.091.253.215.172 1.161.686 1.747 3.009 1.747 1.851 0 2.638-.419 2.638-1.4 0-.566-.224-.986-3.093-1.268-2.399-.238-3.883-.767-3.883-2.688 0-1.769 1.49-2.822 3.989-2.822 2.806 0 4.196.974 4.37 3.066a.254.254 0 0 1-.064.196.249.249 0 0 1-.191.085h-1.142a.253.253 0 0 1-.248-.208c-.274-1.215-.938-1.603-2.725-1.603-2.007 0-2.239.699-2.239 1.222 0 .634.276.819 2.998 1.177 2.694.355 3.977.859 3.977 2.763 0 1.908-1.592 3.003-4.366 3.003z"/>
    </svg>
  )
}

function GitIcon(p: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...p}>
      <path d="M23.546 10.93L13.067.452c-.604-.603-1.582-.603-2.188 0L8.708 2.627l2.76 2.76c.645-.215 1.379-.07 1.889.441.516.515.658 1.258.438 1.9l2.658 2.66c.645-.223 1.387-.078 1.9.435.721.72.721 1.884 0 2.604-.719.719-1.881.719-2.6 0-.539-.541-.674-1.337-.404-1.996L12.86 8.955v6.525c.176.086.342.203.488.348.713.721.713 1.883 0 2.6-.719.721-1.889.721-2.609 0-.719-.719-.719-1.879 0-2.598.182-.18.387-.316.605-.406V8.835c-.217-.091-.424-.222-.604-.404-.541-.541-.674-1.341-.404-1.996L7.636 3.7.45 10.881c-.6.605-.6 1.584 0 2.189l10.48 10.477c.604.604 1.582.604 2.186 0l10.43-10.43c.605-.603.605-1.582 0-2.187"/>
    </svg>
  )
}

function GithubIcon(p: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...p}>
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
    </svg>
  )
}

function LuaIcon(p: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" {...p}>
      <circle cx="11" cy="13" r="9.5" fill="currentColor"/>
      <circle cx="14.5" cy="9" r="3" fill="var(--tech-icon-bg,#080808)"/>
      <circle cx="21.5" cy="2.5" r="2.5" fill="currentColor"/>
    </svg>
  )
}

function CIcon(p: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" {...p}>
      <path d="M19 8.5A8 8 0 1 0 19 15.5"/>
    </svg>
  )
}

function CppIcon(p: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...p}>
      <path d="M22.394 6c-.167-.29-.398-.543-.652-.69L12.926.22c-.509-.294-1.34-.294-1.848 0L2.26 5.31c-.508.293-.923 1.013-.923 1.6v10.18c0 .294.104.62.271.91.167.29.398.543.652.69l8.816 5.09c.508.293 1.34.293 1.848 0l8.816-5.09c.254-.147.485-.4.652-.69.167-.29.27-.616.27-.91V6.91c.003-.294-.1-.62-.268-.91zM12 19.109c-3.92 0-7.109-3.189-7.109-7.109S8.08 4.891 12 4.891a7.133 7.133 0 0 1 6.156 3.552l-3.076 1.781A3.567 3.567 0 0 0 12 8.445c-1.96 0-3.554 1.595-3.554 3.555S10.04 15.555 12 15.555a3.57 3.57 0 0 0 3.08-1.778l3.077 1.78A7.135 7.135 0 0 1 12 19.109zm7.109-6.714h-.79v.79h-.79v-.79h-.79v-.79h.79v-.79h.79v.79h.79zm2.962 0h-.79v.79h-.79v-.79h-.79v-.79h.79v-.79h.79v.79h.79z"/>
    </svg>
  )
}

function CSharpIcon(p: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" {...p}>
      <path d="M12 8A5 5 0 1 0 12 16" strokeWidth="2.4"/>
      <line x1="13.5" y1="9"    x2="19.5" y2="9"    strokeWidth="1.4"/>
      <line x1="13.5" y1="14"   x2="19.5" y2="14"   strokeWidth="1.4"/>
      <line x1="15.5" y1="6.5"  x2="15.5" y2="16.5" strokeWidth="1.4"/>
      <line x1="18.5" y1="6.5"  x2="18.5" y2="16.5" strokeWidth="1.4"/>
    </svg>
  )
}

function PhpIcon(p: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <ellipse cx="12" cy="12" rx="10.5" ry="5.8" strokeWidth="1.3"/>
      <g transform="translate(1.3 0)">
        <path d="M4.2 14.5V9.5h1.5a1.4 1.4 0 0 1 0 2.8H4.2" strokeWidth="1.15"/>
        <path d="M9 9.5v5M9 12h2.8M11.8 9.5v5" strokeWidth="1.15"/>
        <path d="M14.3 14.5V9.5h1.5a1.4 1.4 0 0 1 0 2.8H14.3" strokeWidth="1.15"/>
      </g>
    </svg>
  )
}

function PythonIcon(p: SVGProps<SVGSVGElement>) {
  // Python logo: two interlocked P-shaped snakes with eye dots
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...p}>
      {/* Top snake — head faces right */}
      <path d="M12 2c-2.8 0-5 .9-5 3.2V8h5v1H5.8C3.2 9 2 10.4 2 13c0 2.5 1.2 4 3.8 4H7v-2.2C7 12.6 8.2 12 10 12h4c2 0 3-1.1 3-3.2V5.2C17 2.9 14.8 2 12 2z"/>
      <circle cx="9.8" cy="5.2" r="1.1" fill="var(--tech-icon-bg,#080808)"/>
      {/* Bottom snake — head faces left */}
      <path d="M12 22c2.8 0 5-.9 5-3.2V16h-5v-1h6.2c2.6 0 3.8-1.4 3.8-4 0-2.5-1.2-4-3.8-4H17v2.2c0 2.2-1.2 2.8-3 2.8h-4c-2 0-3 1.1-3 3.2v3.6C7 21.1 9.2 22 12 22z"/>
      <circle cx="14.2" cy="18.8" r="1.1" fill="var(--tech-icon-bg,#080808)"/>
    </svg>
  )
}

function JavaIcon(p: SVGProps<SVGSVGElement>) { return <LetterIcon letter="JAVA" {...p}/> }

function KotlinIcon(p: SVGProps<SVGSVGElement>) {
  // Kotlin mark: solid angular K geometry with the lower section fully closed.
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...p}>
      <path d="M1.3 24 12.6 12.5 24 24H1.3ZM0 0h12L0 12.5V0ZM13.4 0 0 14v10l12-12L24 0H13.4Z"/>
    </svg>
  )
}

function AssemblyIcon(p: SVGProps<SVGSVGElement>) {
  return <svg viewBox="0 0 24 24" fill="none" {...p}>
    <path d="M7 4.5h10M5.5 7v10M18.5 7v10M7 19.5h10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
    <path d="M7 7h10v10H7z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
    <path d="M9 10h6M9 12h6M9 14h4.2" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round"/>
    <path d="M4 8v2M4 14v2M20 8v2M20 14v2M8 4v-1M12 4v-1M16 4v-1M8 20v1M12 20v1M16 20v1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
  </svg>
}

export default function TechStackIcon({ name, ...props }: Props) {
  const key = name.toLowerCase()
  if (key === 'react') return <ReactIcon {...props} />
  if (key === 'nextjs' || key === 'next.js') return <NextIcon {...props} />
  if (key === 'typescript') return <TypeScriptIcon {...props} />
  if (key === 'javascript') return <JavaScriptIcon {...props} />
  if (key === 'html' || key === 'html5') return <HtmlIcon {...props} />
  if (key === 'css' || key === 'css3') return <CssIcon {...props} />
  if (key === 'tailwind' || key === 'tailwind css') return <TailwindIcon {...props} />
  if (key === 'node' || key === 'node.js') return <NodeIcon {...props} />
  if (key === 'git') return <GitIcon {...props} />
  if (key === 'github') return <GithubIcon {...props} />
  if (key === 'tsx') return <LetterIcon letter="TSX" {...props} />
  if (key === 'jsx') return <LetterIcon letter="JSX" {...props} />
  if (key === 'sql') return <LetterIcon letter="SQL" {...props} />
  if (key === 'lua') return <LuaIcon {...props} />
  if (key === 'c') return <CIcon {...props} />
  if (key === 'c++' || key === 'cpp') return <CppIcon {...props} />
  if (key === 'c#' || key === 'csharp') return <CSharpIcon {...props} />
  if (key === 'php') return <PhpIcon {...props} />
  if (key === 'python') return <PythonIcon {...props} />
  if (key === 'java') return <JavaIcon {...props} />
  if (key === 'kotlin') return <KotlinIcon {...props} />
  if (key === 'assembly' || key === 'asm') return <AssemblyIcon {...props} />
  return null
}
