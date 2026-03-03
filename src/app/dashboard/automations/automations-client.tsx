'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, X, Zap } from 'lucide-react'
import {
  createAutomation,
  deleteAutomation,
  toggleAutomation,
  updateAutomation,
  type AutomationAgent,
  type AutomationInput,
  type AutomationLimits,
  type AutomationRow,
} from '@/lib/actions/automations'
import { cn } from '@/lib/utils'
import {
  RECIPES,
  RECIPE_MAP,
  buildRecipeName,
  enrichRecipeValues,
  getAutomationCard,
  matchRecipe,
  type RecipeValues,
  validateRecipe,
} from './automation-recipes'
import {
  AutomationListCard,
  DeleteModal,
  RecipeCard,
  RecipeForm,
} from './automation-ui'

export default function AutomationsClient({
  initialAutomations,
  limits,
  agents,
  canManage,
}: {
  initialAutomations: AutomationRow[]
  limits: AutomationLimits
  agents: AutomationAgent[]
  canManage: boolean
}) {
  const router = useRouter()
  const [automations, setAutomations] = useState(initialAutomations)
  const [showModal, setShowModal] = useState(false)
  const [selectedRecipeId, setSelectedRecipeId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [draftValues, setDraftValues] = useState<RecipeValues>({})
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setAutomations(initialAutomations)
  }, [initialAutomations])

  const selectedRecipe = selectedRecipeId ? RECIPE_MAP[selectedRecipeId] ?? null : null
  const atLimit =
    limits.max !== Infinity && automations.length >= limits.max && !editingId

  const automationCards = useMemo(
    () => automations.map((automation) => getAutomationCard(automation, agents)),
    [agents, automations]
  )

  function resetModalState() {
    setSelectedRecipeId(null)
    setEditingId(null)
    setDraftValues({})
    setError(null)
    setSaving(false)
  }

  function openPicker() {
    resetModalState()
    setShowModal(true)
  }

  function closeModal() {
    setShowModal(false)
    resetModalState()
  }

  function chooseRecipe(recipeId: string, values?: RecipeValues) {
    const recipe = RECIPE_MAP[recipeId]
    if (!recipe) return

    setSelectedRecipeId(recipeId)
    setDraftValues({ ...recipe.defaults, ...(values ?? {}) })
    setError(null)
    setShowModal(true)
  }

  function openEdit(automationId: string) {
    const automation = automations.find((entry) => entry.id === automationId)
    if (!automation) return

    const matched = matchRecipe(automation, agents)
    setEditingId(automation.id)

    if (!matched) {
      setSelectedRecipeId(null)
      setDraftValues({})
      setError(
        'Cette règle utilise un ancien format. Choisissez une recette pour la recréer dans le nouveau format simplifié.'
      )
      setShowModal(true)
      return
    }

    chooseRecipe(matched.recipe.id, matched.values)
  }

  async function handleSave() {
    if (!selectedRecipe) return

    const validationError = validateRecipe(selectedRecipe, draftValues)
    if (validationError) {
      setError(validationError)
      return
    }

    const enrichedValues = enrichRecipeValues(draftValues, agents)
    const serverData = selectedRecipe.toServerData(enrichedValues)
    const payload: AutomationInput = {
      name: buildRecipeName(selectedRecipe, enrichedValues),
      description: selectedRecipe.toSummary(enrichedValues),
      ...serverData,
    }

    setSaving(true)
    setError(null)

    const result = editingId
      ? await updateAutomation(editingId, payload)
      : await createAutomation(payload)

    setSaving(false)

    if (!result.success) {
      setError(result.error ?? 'Impossible d’enregistrer cette règle.')
      return
    }

    closeModal()
    router.refresh()
  }

  async function handleToggle(automationId: string, isActive: boolean) {
    if (!canManage) return

    setAutomations((current) =>
      current.map((automation) =>
        automation.id === automationId
          ? { ...automation, is_active: !isActive }
          : automation
      )
    )

    const result = await toggleAutomation(automationId, !isActive)
    if (!result.success) {
      setAutomations((current) =>
        current.map((automation) =>
          automation.id === automationId
            ? { ...automation, is_active: isActive }
            : automation
        )
      )
    }
  }

  async function handleDelete() {
    if (!deleteId) return

    const result = await deleteAutomation(deleteId)
    if (result.success) {
      setAutomations((current) =>
        current.filter((automation) => automation.id !== deleteId)
      )
    }

    setDeleteId(null)
    router.refresh()
  }

  return (
    <div className="h-full overflow-y-auto bg-transparent custom-scrollbar pb-8">
      <div className="mx-auto mt-4 max-w-[1100px] space-y-8 px-4 md:px-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-[24px] font-semibold tracking-tight text-white">
                Automatisations
              </h1>
              <span className="rounded-full bg-[#2c2c2e] px-2.5 py-0.5 text-[12px] font-medium text-[#86868b]">
                {automations.length}/{limits.max === Infinity ? '∞' : limits.max}
              </span>
              {!canManage && (
                <span className="rounded-full bg-white/[0.05] px-2.5 py-0.5 text-[12px] font-medium text-[#86868b]">
                  Lecture seule
                </span>
              )}
            </div>
            <p className="mt-1 max-w-2xl text-[14px] text-[#86868b]">
              Activez des recettes simples pour escalader, router ou relancer vos
              tickets sans config technique.
            </p>
          </div>

          <button
            type="button"
            onClick={openPicker}
            disabled={!canManage || atLimit}
            className={cn(
              'inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-[13px] font-semibold transition-all',
              !canManage || atLimit
                ? 'cursor-not-allowed bg-[#2c2c2e] text-[#5a5a5f]'
                : 'bg-[#0a84ff] text-white hover:bg-[#409cff] active:scale-[0.98]'
            )}
          >
            <Plus className="h-4 w-4" />
            Nouvelle règle
          </button>
        </div>

        {atLimit && (
          <div className="rounded-3xl border border-[#ff9f0a]/20 bg-[#ff9f0a]/10 px-5 py-4 text-[13px] text-[#f5f5f7]">
            Vous avez atteint la limite de votre plan. Supprimez une règle
            existante ou changez d’abonnement pour en créer une nouvelle.
          </div>
        )}

        {automations.length === 0 ? (
          <div className="space-y-6">
            <div className="rounded-3xl border border-white/5 bg-[#1c1c1e] p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.04]">
                  <Zap className="h-5 w-5 text-[#86868b]" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-[18px] font-semibold text-white">
                    Choisir une automatisation
                  </h2>
                  <p className="mt-1 max-w-2xl text-[14px] leading-relaxed text-[#86868b]">
                    Commencez avec une recette prête à l’emploi. Vous modifiez 1 à
                    3 champs, puis vous activez la règle.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {RECIPES.map((recipe) => (
                <RecipeCard
                  key={recipe.id}
                  recipe={recipe}
                  onSelect={chooseRecipe}
                  disabled={!canManage || atLimit}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {automationCards.map((item) => (
              <AutomationListCard
                key={item.automation.id}
                item={item}
                canManage={canManage}
                onToggle={handleToggle}
                onEdit={openEdit}
                onDelete={setDeleteId}
              />
            ))}

            {canManage && !atLimit && (
              <div className="rounded-3xl border border-dashed border-white/10 bg-white/[0.01] p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-[14px] font-medium text-white">
                      Ajouter une nouvelle recette
                    </p>
                    <p className="mt-1 text-[12px] text-[#86868b]">
                      Choisissez parmi 6 automatisations prêtes à l’emploi.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={openPicker}
                    className="inline-flex items-center gap-2 rounded-2xl bg-white/[0.05] px-4 py-2.5 text-[13px] font-medium text-white transition-colors hover:bg-white/[0.08]"
                  >
                    <Plus className="h-4 w-4" />
                    Choisir une recette
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={closeModal} />
          <div className="relative mx-4 max-h-[90vh] w-full max-w-[760px] overflow-y-auto rounded-3xl border border-white/10 bg-[#121216] p-6 shadow-2xl custom-scrollbar">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <p className="text-[12px] font-medium uppercase tracking-[0.16em] text-[#86868b]">
                  Automatisations
                </p>
                <p className="mt-1 text-[20px] font-semibold tracking-tight text-white">
                  {selectedRecipe ? 'Configurer la règle' : 'Choisir une automatisation'}
                </p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="rounded-xl p-2 text-[#86868b] transition-colors hover:bg-white/[0.05] hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {!selectedRecipe ? (
              <div className="space-y-5">
                {error && (
                  <div className="rounded-2xl border border-[#ff9f0a]/20 bg-[#ff9f0a]/10 px-4 py-3 text-[13px] text-[#f5f5f7]">
                    {error}
                  </div>
                )}

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {RECIPES.map((recipe) => (
                    <RecipeCard
                      key={recipe.id}
                      recipe={recipe}
                      onSelect={chooseRecipe}
                      disabled={!canManage || atLimit}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <RecipeForm
                recipe={selectedRecipe}
                values={draftValues}
                onValueChange={(key, nextValue) =>
                  setDraftValues((current) => ({ ...current, [key]: nextValue }))
                }
                onBack={() => {
                  setSelectedRecipeId(null)
                  setError(null)
                }}
                onSave={handleSave}
                saving={saving}
                error={error}
                agents={agents}
                editing={Boolean(editingId)}
              />
            )}
          </div>
        </div>
      )}

      {deleteId && (
        <DeleteModal onCancel={() => setDeleteId(null)} onConfirm={handleDelete} />
      )}
    </div>
  )
}
