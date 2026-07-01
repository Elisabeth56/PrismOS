// src/lib/constants.ts

import { AgentType } from './types'

export const AGENT_CONFIG: Record<
  AgentType,
  { label: string; color: string; hex: string; tagColor: string; description: string; outputs: string[] }
> = {
  context_analyst: {
    label: 'Context Analyst',
    color: 'emerald',
    hex: '#10b981',
    tagColor: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
    description: 'Maps your existing product before any planning begins. Detects stack, models, routes, and integration risks.',
    outputs: ['Product context summary', 'Stack detection', 'Constraint report'],
  },
  pm: {
    label: 'PM Agent',
    color: 'orange',
    hex: '#f97316',
    tagColor: 'bg-orange-500/15 text-orange-400 border-orange-500/20',
    description: 'Translates feature requests into structured requirements. Defines scope, user stories, and MVP boundary.',
    outputs: ['PRD document', 'User stories', 'MVP boundary'],
  },
  architect: {
    label: 'Architect',
    color: 'amber',
    hex: '#f59e0b',
    tagColor: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
    description: 'Owns technical design. Selects stack patterns, defines data models, and API contracts.',
    outputs: ['Component diagram', 'API schema', 'Tradeoff log'],
  },
  uiux_designer: {
    label: 'UI/UX Designer',
    color: 'rose',
    hex: '#f43f5e',
    tagColor: 'bg-rose-500/15 text-rose-400 border-rose-500/20',
    description: 'Defines screen hierarchy, layout, component structure, and every interaction state before code is written.',
    outputs: ['Screen hierarchy', 'Component spec', 'Interaction states'],
  },
  engineer: {
    label: 'Engineer',
    color: 'blue',
    hex: '#3b82f6',
    tagColor: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
    description: 'Writes production-ready code. Pushes back on over-engineered designs. No pseudocode.',
    outputs: ['Runnable code', 'File structure', 'Setup guide'],
  },
  qa: {
    label: 'QA Agent',
    color: 'teal',
    hex: '#14b8a6',
    tagColor: 'bg-teal-500/15 text-teal-400 border-teal-500/20',
    description: 'Intentionally attacks the implementation. Runs frontend and backend checks. Issues a binding verdict.',
    outputs: ['Test scenarios', 'Bug report', 'Ship verdict'],
  },
  release_manager: {
    label: 'Release Manager',
    color: 'purple',
    hex: '#8b5cf6',
    tagColor: 'bg-purple-500/15 text-purple-400 border-purple-500/20',
    description: 'Resolves conflicts between agents. Issues binding decisions with logged rationale.',
    outputs: ['Conflict log', 'Decision record', 'Final path'],
  },
}

export const AGENT_ORDER: AgentType[] = [
  'context_analyst',
  'pm',
  'architect',
  'uiux_designer',
  'engineer',
  'qa',
  'release_manager',
]

export const NAV_LINKS = [
  { label: 'How it works', href: '#how' },
  { label: 'Agents', href: '#agents' },
  { label: 'Benchmark', href: '#benchmark' },
  { label: 'Pricing', href: '#pricing' },
]

export const PRICING_TIERS = [
  {
    name: 'Builder',
    price: { monthly: 29, yearly: 20 },
    description: 'For solo developers shipping fast.',
    cta: 'Join waitlist',
    featured: false,
    socialProof: '300+ solo devs',
    features: [
      '50 agent runs / month',
      'All 7 agents',
      'Project memory (1 project)',
      'Conflict log history',
      'Code download',
      'Community support',
    ],
  },
  {
    name: 'Team',
    price: { monthly: 99, yearly: 69 },
    description: 'For engineering teams shipping together.',
    cta: 'Join waitlist',
    featured: true,
    socialProof: '250+ growing teams',
    features: [
      '300 agent runs / month',
      'Everything in Builder',
      'Project memory (unlimited)',
      'Shared session history',
      'Priority processing',
      'Benchmark analytics',
      'Slack notifications',
    ],
  },
  {
    name: 'Enterprise',
    price: null,
    description: 'Unlimited runs with dedicated infrastructure.',
    cta: 'Join waitlist',
    featured: false,
    socialProof: null,
    features: [
      'Unlimited agent runs',
      'Custom agent prompts',
      'Private deployment',
      'SLA + dedicated support',
      'SSO + audit logs',
    ],
  },
]

export const WORKFLOW_STEPS = [
  { num: '00', label: 'Memory Load', desc: 'Project memory injected before discovery begins.', color: '#6366f1' },
  { num: '01', label: 'Discovery', desc: 'Context Analyst maps your existing product.', color: '#10b981' },
  { num: '02', label: 'Intake', desc: 'Feature classified and structured.', color: '#f97316' },
  { num: '03', label: 'PM Phase', desc: 'PRD and user stories produced.', color: '#f59e0b' },
  { num: '04', label: 'Debate', desc: 'Architect, Designer, Engineer, QA argue independently.', color: '#f43f5e' },
  { num: '05', label: 'Resolution', desc: 'Release Manager issues binding decisions.', color: '#8b5cf6' },
  { num: '06', label: 'UX Design', desc: 'Designer produces full interaction spec.', color: '#f43f5e' },
  { num: '07', label: 'Build', desc: 'Engineer writes production code against UX spec.', color: '#3b82f6' },
  { num: '08', label: 'QA', desc: 'Tests run. Frontend and backend checks. Verdict issued.', color: '#14b8a6' },
  { num: '09', label: 'Ship', desc: 'Final package: code, tests, conflicts, memory updated.', color: '#22c55e' },
]
