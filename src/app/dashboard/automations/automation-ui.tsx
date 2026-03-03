'use client'

import { ChevronLeft, Pencil, Trash2 } from 'lucide-react'
import type { AutomationAgent } from '@/lib/actions/automations'
import { cn } from '@/lib/utils'
import {
  asString,
  formatExecutionLabel,
  getRecipePreview,
  type AutomationCardModel,
  type Recipe,
  type RecipeField,
  type RecipeValues,
} from './automation-recipes'

export function RecipeCard({
  recipe,
  onSelect,
  disabled,
}: {
  recipe: Recipe
  onSelect: (recipeId: string) => void
  disabled?: boolean
}) {
  const Icon = recipe.icon

  return (
    <button
      type="button"
      onClick={() => onSelect(recipe.id)}
      disabled={disabled}
      className={cn(
        'group w-full rounded-3xl border border-white/5 bg-[#1c1c1e] p-5 text-left transition-all duration-200',
        disabled
          ? 'cursor-not-allowed opacity-50'
          : 'hover:border-white/10 hover:bg-[#232326] hover:-translate-y-0.5'
      )}
    >
      <div className="flex items-start gap-4">
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border"
          style={{
            color: recipe.color,
            borderColor: `${recipe.color}20`,
            backgroundColor: `${recipe.color}14`,
          }}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-[15px] font-semibold text-white">{recipe.name}</p>
          <p className="mt-1 text-[13px] leading-relaxed text-[#86868b]">
            {getRecipePreview(recipe)}
          </p>
        </div>
      </div>
    </button>
  )
}

function InlineRecipeField({
  field,
  value,
  onChange,
  agents,
}: {
  field: RecipeField
  value: unknown
  onChange: (nextValue: unknown) => void
  agents: AutomationAgent[]
}) {
  const commonClassName =
    'rounded-2xl border border-white/10 bg-[#111113] px-3 py-2 text-[15px] font-medium text-white outline-none transition-colors focus:border-[#0a84ff]/50'

  if (field.type === 'number') {
    const defaultValue = typeof field.min === 'number' ? field.min : 1

    return (
      <input
        type="number"
        min={field.min}
        max={field.max}
        value={typeof value === 'number' ? value : defaultValue}
        onChange={(event) => onChange(Number(event.target.value))}
        className={cn(commonClassName, 'w-[78px] text-center')}
      />
    )
  }

  if (field.type === 'select') {
    const options =
      field.options ??
      agents.map((agent) => ({
        value: agent.id,
        label: agent.full_name?.trim() || agent.email,
      }))

    return (
      <select
        value={asString(value)}
        onChange={(event) => onChange(event.target.value)}
        className={cn(commonClassName, 'min-w-[180px]')}
      >
        <option value="">
          {options.length > 0 ? 'Choisir un agent' : 'Aucun agent disponible'}
        </option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    )
  }

  return (
    <input
      type="text"
      value={asString(value)}
      onChange={(event) => onChange(event.target.value)}
      placeholder={field.placeholder}
      className={cn(commonClassName, 'min-w-[220px]')}
    />
  )
}

function RecipeSentence({
  recipe,
  values,
  onValueChange,
  agents,
}: {
  recipe: Recipe
  values: RecipeValues
  onValueChange: (key: string, nextValue: unknown) => void
  agents: AutomationAgent[]
}) {
  const parts = recipe.phraseTemplate.split(/(\{[^}]+\})/g).filter(Boolean)

  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-3 text-[18px] font-medium leading-relaxed text-white">
      {parts.map((part, index) => {
        const placeholder = part.match(/^\{(.+)\}$/)?.[1]
        if (!placeholder) {
          return (
            <span key={`${part}-${index}`} className="text-[#f5f5f7]">
              {part}
            </span>
          )
        }

        const field = recipe.fields.find((entry) => entry.key === placeholder)
        if (!field || field.type === 'textarea') return null

        return (
          <InlineRecipeField
            key={field.key}
            field={field}
            value={values[field.key]}
            onChange={(nextValue) => onValueChange(field.key, nextValue)}
            agents={agents}
          />
        )
      })}
    </div>
  )
}

export function RecipeForm({
  recipe,
  values,
  onValueChange,
  onBack,
  onSave,
  saving,
  error,
  agents,
  editing,
}: {
  recipe: Recipe
  values: RecipeValues
  onValueChange: (key: string, nextValue: unknown) => void
  onBack: () => void
  onSave: () => void
  saving: boolean
  error: string | null
  agents: AutomationAgent[]
  editing: boolean
}) {
  const Icon = recipe.icon
  const textareas = recipe.fields.filter((field) => field.type === 'textarea')

  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-2 rounded-full bg-white/[0.04] px-3 py-1.5 text-[12px] font-medium text-[#86868b] transition-colors hover:bg-white/[0.08] hover:text-white"
      >
        <ChevronLeft className="h-3.5 w-3.5" />
        Retour
      </button>

      <div className="flex items-start gap-4">
        <div
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border"
          style={{
            color: recipe.color,
            borderColor: `${recipe.color}20`,
            backgroundColor: `${recipe.color}14`,
          }}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <h2 className="text-[22px] font-semibold tracking-tight text-white">
            {recipe.name}
          </h2>
          <p className="mt-1 text-[13px] text-[#86868b]">
            Configurez cette règle en langage naturel, sans paramètres techniques.
          </p>
        </div>
      </div>

      <div className="rounded-3xl border border-white/5 bg-white/[0.02] p-5">
        <RecipeSentence
          recipe={recipe}
          values={values}
          onValueChange={onValueChange}
          agents={agents}
        />

        {textareas.length > 0 && (
          <div className="mt-5 space-y-4">
            {textareas.map((field) => (
              <div key={field.key}>
                <p className="mb-2 text-[12px] font-medium uppercase tracking-[0.14em] text-[#86868b]">
                  {field.label}
                </p>
                <textarea
                  value={asString(values[field.key])}
                  onChange={(event) => onValueChange(field.key, event.target.value)}
                  rows={field.rows ?? 4}
                  placeholder={field.placeholder}
                  className="w-full rounded-2xl border border-white/10 bg-[#111113] px-4 py-3 text-[14px] leading-relaxed text-white outline-none transition-colors placeholder:text-[#5a5a5f] focus:border-[#0a84ff]/50"
                />
              </div>
            ))}
          </div>
        )}

        {recipe.id === 'keyword-routing' && agents.length === 0 && (
          <p className="mt-4 text-[12px] text-[#ff9f0a]">
            Aucun agent disponible dans l’équipe pour le routage automatique.
          </p>
        )}

        {error && (
          <div className="mt-5 rounded-2xl border border-[#ff453a]/15 bg-[#ff453a]/10 px-4 py-3 text-[13px] text-[#ff453a]">
            {error}
          </div>
        )}

        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className="mt-6 inline-flex w-full items-center justify-center rounded-2xl bg-[#0a84ff] px-4 py-3 text-[14px] font-semibold text-white transition-all hover:bg-[#409cff] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving
            ? 'Enregistrement...'
            : editing
              ? 'Enregistrer les modifications'
              : 'Activer cette règle'}
        </button>
      </div>
    </div>
  )
}

export function AutomationListCard({
  item,
  canManage,
  onToggle,
  onEdit,
  onDelete,
}: {
  item: AutomationCardModel
  canManage: boolean
  onToggle: (automationId: string, isActive: boolean) => void
  onEdit: (automationId: string) => void
  onDelete: (automationId: string) => void
}) {
  const Icon = item.icon

  return (
    <div className="rounded-3xl border border-white/5 bg-[#1c1c1e] p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 flex-1 items-start gap-4">
          <div
            className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border"
            style={{
              color: item.color,
              borderColor: `${item.color}20`,
              backgroundColor: `${item.color}14`,
            }}
          >
            <Icon className="h-5 w-5" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => onToggle(item.automation.id, item.automation.is_active)}
                disabled={!canManage}
                className={cn(
                  'inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors',
                  item.automation.is_active
                    ? 'bg-[#30d158]/10 text-[#30d158]'
                    : 'bg-[#ff453a]/10 text-[#ff453a]',
                  !canManage && 'cursor-default opacity-80'
                )}
              >
                <span
                  className={cn(
                    'h-2.5 w-2.5 rounded-full',
                    item.automation.is_active ? 'bg-[#30d158]' : 'bg-[#ff453a]'
                  )}
                />
                {item.automation.is_active ? 'Active' : 'Désactivée'}
              </button>

              <p className="truncate text-[16px] font-semibold text-white">{item.title}</p>
            </div>

            <p className="mt-2 max-w-3xl text-[14px] leading-relaxed text-[#86868b]">
              &quot;{item.summary}&quot;
            </p>

            <p className="mt-3 text-[12px] text-[#86868b]">
              {formatExecutionLabel(
                item.automation.execution_count,
                item.automation.last_executed_at
              )}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={() => onEdit(item.automation.id)}
            disabled={!canManage}
            className={cn(
              'rounded-xl p-2 text-[#86868b] transition-colors hover:bg-white/[0.05] hover:text-white',
              !canManage && 'cursor-not-allowed opacity-40'
            )}
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(item.automation.id)}
            disabled={!canManage}
            className={cn(
              'rounded-xl p-2 text-[#86868b] transition-colors hover:bg-[#ff453a]/10 hover:text-[#ff453a]',
              !canManage && 'cursor-not-allowed opacity-40'
            )}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

export function DeleteModal({
  onCancel,
  onConfirm,
}: {
  onCancel: () => void
  onConfirm: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onCancel} />
      <div className="relative mx-4 w-full max-w-[400px] rounded-3xl bg-[#1c1c1e] p-6 shadow-2xl">
        <div className="flex flex-col items-center text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#ff453a]/10">
            <Trash2 className="h-6 w-6 text-[#ff453a]" />
          </div>
          <h3 className="text-[18px] font-semibold text-white">
            Supprimer cette règle ?
          </h3>
          <p className="mt-2 text-[13px] leading-relaxed text-[#86868b]">
            Cette automatisation sera supprimée définitivement.
          </p>
          <div className="mt-6 flex w-full gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 rounded-2xl bg-[#2c2c2e] py-2.5 text-[13px] font-medium text-white transition-colors hover:bg-[#3a3a3c]"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className="flex-1 rounded-2xl bg-[#ff453a] py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-[#ff6961]"
            >
              Supprimer
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
