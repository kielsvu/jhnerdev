'use client'

import { useEffect, useState } from 'react'
import {
  projects as localProjects,
  techStacks as localTechStacks,
} from '@/lib/portfolioData'

export default function usePortfolio() {
  const [projects, setProjects] = useState(localProjects)
  const [techStacks, setTechStacks] = useState(localTechStacks)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setProjects(localProjects)
    setTechStacks(localTechStacks)
    setLoading(false)
  }, [])

  return {
    projects,
    techStacks,
    loading,
  }
}
