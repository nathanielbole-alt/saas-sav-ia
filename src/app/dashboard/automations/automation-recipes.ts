import type { ElementType } from 'react'
import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  Clock,
  MessageSquare,
  UserCheck,
  Zap,
} from 'lucide-react'
import type {
  AutomationAgent,
  AutomationInput,
  AutomationRow,
  Condition,
} from '@/lib/actions/automations'

export type RecipeField = {
  key: string
  type: 'number' | 'text' | 'textarea' | 'select'
  label: string
  placeholder?: string
  options?: { value: string; label: string }[]
  min?: number
  max?: number
  rows?: number
  required?: boolean
}

export type RecipeValues = Record<string, unknown>

export type Recipe = {
  id: string
  name: string
  icon: ElementType
  color: string
  phraseTemplate: string
  fields: RecipeField[]
  defaults: Record<string, unknown>
  toServerData: (values: Record<string, unknown>) => {
    trigger_type: AutomationInput['trigger_type']
    trigger_config: Record<string, unknown>
    conditions: Condition[]
    action_type: AutomationInput['action_type']
    action_config: Record<string, unknown>
  }
  toSummary: (values: Record<string, unknown>) => string
}

export type RecipeMatch = {
  recipe: Recipe
  values: RecipeValues
}

export type AutomationCardModel = {
  automation: AutomationRow
  title: string
  summary: string
  icon: ElementType
  color: string
  editable: boolean
}

const ACK_MESSAGE_DEFAULT =
  'Merci pour votre message. Nous l’avons bien reçu et notre équipe vous répond au plus vite.'

const FOLLOW_UP_MESSAGE_DEFAULT =
  'Bonjour, nous revenons vers vous concernant votre demande. Avez-vous toujours besoin d’aide de notre part ?'

function toPositiveInt(value: unknown, fallback: number): number {
  const parsed =
    typeof value === 'number'
      ? value
      : typeof value === 'string'
        ? Number.parseInt(value, 10)
        : Number.NaN

  if (!Number.isFinite(parsed) || parsed <= 0) return fallback
  return Math.floor(parsed)
}

export function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback
}

function normalizeKeywords(value: unknown): string {
  return asString(value)
    .split(',')
    .map((keyword) => keyword.trim())
    .filter(Boolean)
    .join(', ')
}

function firstKeyword(value: unknown): string | null {
  const normalized = normalizeKeywords(value)
  if (!normalized) return null
  return normalized.split(',')[0]?.trim() ?? null
}

function getAgentLabel(agentId: unknown, agents: AutomationAgent[]): string {
  const id = asString(agentId)
  if (!id) return 'un agent'
  const match = agents.find((agent) => agent.id === id)
  return match?.full_name?.trim() || match?.email || 'un agent'
}

export function enrichRecipeValues(
  values: RecipeValues,
  agents: AutomationAgent[]
): RecipeValues {
  return {
    ...values,
    agentLabel: getAgentLabel(values.agentId, agents),
    keywords: normalizeKeywords(values.keywords),
  }
}

export function buildRecipeName(recipe: Recipe, values: RecipeValues): string {
  switch (recipe.id) {
    case 'escalation':
      return `Escalade ${toPositiveInt(values.hours, 4)}h`
    case 'keyword-routing': {
      const keyword = firstKeyword(values.keywords)
      return keyword ? `Routage ${keyword}` : recipe.name
    }
    case 'follow-up':
      return `Suivi ${toPositiveInt(values.days, 3)}j`
    case 'auto-close':
      return `Fermeture ${toPositiveInt(values.days, 5)}j`
    default:
      return recipe.name
  }
}

export const RECIPES: Recipe[] = [
  {
    id: 'escalation',
    name: 'Escalade automatique',
    icon: AlertTriangle,
    color: '#ff453a',
    phraseTemplate:
      'Si aucune réponse agent après {hours} heures, passer le ticket en priorité urgente.',
    fields: [
      {
        key: 'hours',
        type: 'number',
        label: 'heures',
        min: 1,
        max: 168,
        required: true,
      },
    ],
    defaults: { hours: 4 },
    toServerData(values) {
      const hours = toPositiveInt(values.hours, 4)
      return {
        trigger_type: 'no_reply_timeout',
        trigger_config: { timeout_hours: hours },
        conditions: [],
        action_type: 'change_priority',
        action_config: { priority: 'urgent' },
      }
    },
    toSummary(values) {
      return `Si pas de réponse après ${toPositiveInt(values.hours, 4)}h → priorité urgente`
    },
  },
  {
    id: 'keyword-routing',
    name: 'Routage par mot-clé',
    icon: UserCheck,
    color: '#0a84ff',
    phraseTemplate: 'Quand le sujet contient {keywords}, assigner à {agentId}.',
    fields: [
      {
        key: 'keywords',
        type: 'text',
        label: 'mots-clés',
        placeholder: 'remboursement, livraison',
        required: true,
      },
      {
        key: 'agentId',
        type: 'select',
        label: 'agent',
        required: true,
      },
    ],
    defaults: { keywords: 'remboursement', agentId: '' },
    toServerData(values) {
      return {
        trigger_type: 'keyword_detected',
        trigger_config: { keywords: normalizeKeywords(values.keywords) },
        conditions: [],
        action_type: 'assign_agent',
        action_config: { agent_id: asString(values.agentId) },
      }
    },
    toSummary(values) {
      const keywords = normalizeKeywords(values.keywords) || 'un mot-clé'
      const agent = asString(values.agentLabel, 'un agent')
      return `Si le sujet contient "${keywords}" → ${agent}`
    },
  },
  {
    id: 'acknowledgement',
    name: 'Accusé de réception',
    icon: MessageSquare,
    color: '#30d158',
    phraseTemplate:
      'Envoyer automatiquement ce message à chaque nouveau ticket.',
    fields: [
      {
        key: 'message',
        type: 'textarea',
        label: 'Message automatique',
        placeholder: ACK_MESSAGE_DEFAULT,
        rows: 4,
        required: true,
      },
    ],
    defaults: { message: ACK_MESSAGE_DEFAULT },
    toServerData(values) {
      return {
        trigger_type: 'ticket_created',
        trigger_config: {},
        conditions: [],
        action_type: 'send_reply',
        action_config: {
          message: asString(values.message, ACK_MESSAGE_DEFAULT).trim(),
        },
      }
    },
    toSummary() {
      return 'Envoie un message à chaque nouveau ticket'
    },
  },
  {
    id: 'priority-alert',
    name: 'Alerte priorité haute',
    icon: Bell,
    color: '#ff9f0a',
    phraseTemplate:
      'Quand un ticket passe en priorité haute ou urgente, notifier l’équipe.',
    fields: [],
    defaults: {},
    toServerData() {
      return {
        trigger_type: 'priority_changed',
        trigger_config: { to_priorities: ['high', 'urgent'] },
        conditions: [],
        action_type: 'notify_slack',
        action_config: { audience: 'team' },
      }
    },
    toSummary() {
      return 'Quand la priorité passe à haute ou urgente → notifier l’équipe'
    },
  },
  {
    id: 'follow-up',
    name: 'Suivi automatique',
    icon: Clock,
    color: '#ffd60a',
    phraseTemplate: 'Envoyer un suivi après {days} jours sans réponse client.',
    fields: [
      {
        key: 'days',
        type: 'number',
        label: 'jours',
        min: 1,
        max: 30,
        required: true,
      },
      {
        key: 'message',
        type: 'textarea',
        label: 'Message de suivi',
        placeholder: FOLLOW_UP_MESSAGE_DEFAULT,
        rows: 4,
        required: true,
      },
    ],
    defaults: { days: 3, message: FOLLOW_UP_MESSAGE_DEFAULT },
    toServerData(values) {
      const days = toPositiveInt(values.days, 3)
      return {
        trigger_type: 'no_reply_timeout',
        trigger_config: { timeout_hours: days * 24, mode: 'follow_up' },
        conditions: [{ field: 'status', operator: 'equals', value: 'pending' }],
        action_type: 'send_reply',
        action_config: {
          message: asString(values.message, FOLLOW_UP_MESSAGE_DEFAULT).trim(),
        },
      }
    },
    toSummary(values) {
      return `Envoyer un suivi après ${toPositiveInt(values.days, 3)}j sans réponse client`
    },
  },
  {
    id: 'auto-close',
    name: 'Fermeture automatique',
    icon: CheckCircle2,
    color: '#30d158',
    phraseTemplate:
      'Fermer les tickets résolus depuis {days} jours sans nouvelle activité.',
    fields: [
      {
        key: 'days',
        type: 'number',
        label: 'jours',
        min: 1,
        max: 30,
        required: true,
      },
    ],
    defaults: { days: 5 },
    toServerData(values) {
      const days = toPositiveInt(values.days, 5)
      return {
        trigger_type: 'no_reply_timeout',
        trigger_config: { timeout_hours: days * 24, mode: 'auto_close' },
        conditions: [{ field: 'status', operator: 'equals', value: 'resolved' }],
        action_type: 'change_status',
        action_config: { status: 'closed' },
      }
    },
    toSummary(values) {
      return `Fermer les tickets résolus depuis ${toPositiveInt(values.days, 5)}j sans activité`
    },
  },
]

export const RECIPE_MAP = Object.fromEntries(
  RECIPES.map((recipe) => [recipe.id, recipe])
) as Record<string, Recipe>

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return 'Jamais exécutée'
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "À l'instant"
  if (mins < 60) return `Dernière il y a ${mins} min`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `Dernière il y a ${hours}h`
  const days = Math.floor(hours / 24)
  return `Dernière il y a ${days}j`
}

function describeTrigger(auto: AutomationRow): string {
  const config = auto.trigger_config

  switch (auto.trigger_type) {
    case 'ticket_created':
      return 'À chaque nouveau ticket'
    case 'ticket_updated':
      return 'Quand un ticket est modifié'
    case 'no_reply_timeout':
      return `Après ${toPositiveInt(config.timeout_hours, 4)}h sans réponse`
    case 'keyword_detected':
      return `Quand le sujet contient "${normalizeKeywords(config.keywords) || 'un mot-clé'}"`
    case 'priority_changed':
      return 'Quand la priorité change'
    default:
      return auto.trigger_type
  }
}

function describeAction(auto: AutomationRow, agents: AutomationAgent[]): string {
  const config = auto.action_config

  switch (auto.action_type) {
    case 'assign_agent':
      return `assigner à ${getAgentLabel(config.agent_id, agents)}`
    case 'change_priority':
      return `passer en priorité ${asString(config.priority, 'haute')}`
    case 'change_status':
      return `passer au statut ${asString(config.status, 'résolu')}`
    case 'send_reply':
      return 'envoyer un message automatique'
    case 'add_tag':
      return `ajouter le tag "${asString(config.tag_name, 'tag')}"`
    case 'notify_slack':
      return 'notifier l’équipe'
    default:
      return auto.action_type
  }
}

export function getRecipePreview(recipe: Recipe): string {
  switch (recipe.id) {
    case 'escalation':
      return 'Si pas de réponse après X heures, passer en priorité urgente'
    case 'keyword-routing':
      return 'Quand le sujet contient certains mots-clés, assigner à un agent'
    case 'acknowledgement':
      return 'Envoyer un message automatique à chaque nouveau ticket'
    case 'priority-alert':
      return 'Quand un ticket devient prioritaire, notifier l’équipe'
    case 'follow-up':
      return 'Envoyer un suivi après X jours sans réponse client'
    case 'auto-close':
      return 'Fermer les tickets résolus depuis X jours sans activité'
    default:
      return recipe.name
  }
}

export function matchRecipe(
  auto: AutomationRow,
  agents: AutomationAgent[]
): RecipeMatch | null {
  const triggerConfig = auto.trigger_config
  const actionConfig = auto.action_config

  if (auto.trigger_type === 'ticket_created' && auto.action_type === 'send_reply') {
    return {
      recipe: RECIPE_MAP.acknowledgement!,
      values: { message: asString(actionConfig.message, ACK_MESSAGE_DEFAULT) },
    }
  }

  if (auto.trigger_type === 'keyword_detected' && auto.action_type === 'assign_agent') {
    return {
      recipe: RECIPE_MAP['keyword-routing']!,
      values: enrichRecipeValues(
        {
          keywords: normalizeKeywords(triggerConfig.keywords),
          agentId: asString(actionConfig.agent_id),
        },
        agents
      ),
    }
  }

  if (
    auto.trigger_type === 'no_reply_timeout' &&
    auto.action_type === 'change_priority' &&
    asString(actionConfig.priority) === 'urgent'
  ) {
    return {
      recipe: RECIPE_MAP.escalation!,
      values: { hours: toPositiveInt(triggerConfig.timeout_hours, 4) },
    }
  }

  if (auto.trigger_type === 'priority_changed' && auto.action_type === 'notify_slack') {
    return {
      recipe: RECIPE_MAP['priority-alert']!,
      values: {},
    }
  }

  if (auto.trigger_type === 'no_reply_timeout' && auto.action_type === 'send_reply') {
    return {
      recipe: RECIPE_MAP['follow-up']!,
      values: {
        days: Math.max(1, Math.round(toPositiveInt(triggerConfig.timeout_hours, 72) / 24)),
        message: asString(actionConfig.message, FOLLOW_UP_MESSAGE_DEFAULT),
      },
    }
  }

  if (
    auto.trigger_type === 'no_reply_timeout' &&
    auto.action_type === 'change_status' &&
    asString(actionConfig.status) === 'closed'
  ) {
    return {
      recipe: RECIPE_MAP['auto-close']!,
      values: {
        days: Math.max(1, Math.round(toPositiveInt(triggerConfig.timeout_hours, 120) / 24)),
      },
    }
  }

  return null
}

export function getAutomationCard(
  automation: AutomationRow,
  agents: AutomationAgent[]
): AutomationCardModel {
  const matched = matchRecipe(automation, agents)

  if (!matched) {
    return {
      automation,
      title: automation.name || 'Automatisation personnalisée',
      summary:
        automation.description ??
        `${describeTrigger(automation)} → ${describeAction(automation, agents)}`,
      icon: Zap,
      color: '#86868b',
      editable: false,
    }
  }

  const enrichedValues = enrichRecipeValues(matched.values, agents)

  return {
    automation,
    title: automation.name || buildRecipeName(matched.recipe, enrichedValues),
    summary: matched.recipe.toSummary(enrichedValues),
    icon: matched.recipe.icon,
    color: matched.recipe.color,
    editable: true,
  }
}

export function validateRecipe(recipe: Recipe, values: RecipeValues): string | null {
  for (const field of recipe.fields) {
    if (!field.required) continue

    if (field.type === 'number') {
      const number = toPositiveInt(values[field.key], field.min ?? 1)
      if (field.min && number < field.min) {
        return `La valeur "${field.label}" doit être supérieure ou égale à ${field.min}.`
      }
      continue
    }

    const stringValue = asString(values[field.key]).trim()
    if (!stringValue) {
      return `Le champ "${field.label}" est requis.`
    }
  }

  return null
}

export function formatExecutionLabel(
  count: number,
  lastExecutedAt: string | null
): string {
  const executions = `${count} exécution${count > 1 ? 's' : ''}`
  return `${executions} · ${timeAgo(lastExecutedAt)}`
}
