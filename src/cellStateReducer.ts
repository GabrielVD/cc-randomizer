import { addRiskToCode, removeRiskFromCode, type Difficulty, type GeneratedRisk } from './generateCode'
import { findRiskGroup, getKeyAndExtraCodes, getKeyCodes } from './risks'
import type { ShareSettings } from './share'
import type { CellState } from './Cell'

// Static module-level data: key codes and key+extra codes never change at
// runtime, so compute the Sets once.
const KEY_CODES_SET = new Set(getKeyCodes())
const KEY_EXTRA_CODES_SET = new Set(getKeyAndExtraCodes())

export type CellsState = {
  difficulty: Difficulty
  useKey: boolean
  risk: GeneratedRisk | null
  lockedCodes: string[]
  bannedCodes: string[]
}

export type CellsAction =
  | { type: 'cellClick'; code: string }
  | { type: 'setDifficulty'; difficulty: Difficulty }
  | { type: 'toggleKey' }
  | { type: 'setRisk'; risk: GeneratedRisk | null }
  | { type: 'reset' }
  | { type: 'applyShareSettings'; settings: ShareSettings }

/**
 * Compute the set of codes that conflict with a locked code in the same group
 * (excluding other locked codes and key codes). Pure so it can be shared by the
 * reducer (for transitions) and App (for rendering).
 */
export function computeLockedConflictSet(lockedCodes: string[]): Set<string> {
  const set = new Set<string>()
  const lockedSet = new Set(lockedCodes)
  for (const lockedCode of lockedCodes) {
    const group = findRiskGroup(lockedCode)
    if (!group) continue
    for (const r of group.risks) {
      if (r.code !== lockedCode && !lockedSet.has(r.code) && !KEY_CODES_SET.has(r.code)) {
        set.add(r.code)
      }
    }
  }
  return set
}

export function initialCellsState(settings: ShareSettings | null): CellsState {
  return {
    difficulty: settings?.difficulty ?? 'normal',
    useKey: settings?.useKey ?? true,
    risk: null,
    lockedCodes: settings?.lockedCodes ?? [],
    bannedCodes: settings?.bannedCodes ?? [],
  }
}

export function cellsReducer(state: CellsState, action: CellsAction): CellsState {
  switch (action.type) {
    case 'cellClick':
      return handleCellClick(state, action.code)
    case 'setDifficulty':
      return { ...state, difficulty: action.difficulty, risk: null }
    case 'toggleKey':
      return toggleKey(state)
    case 'setRisk':
      return { ...state, risk: action.risk }
    case 'reset':
      return { ...state, risk: null, lockedCodes: [], bannedCodes: [] }
    case 'applyShareSettings':
      return {
        ...state,
        difficulty: action.settings.difficulty,
        useKey: action.settings.useKey,
        lockedCodes: action.settings.lockedCodes,
        bannedCodes: action.settings.bannedCodes,
        risk: null,
      }
  }
}

function toggleKey(state: CellsState): CellsState {
  const next = !state.useKey
  if (!next) {
    return {
      ...state,
      useKey: next,
      risk: null,
      lockedCodes: state.lockedCodes.filter(c => !KEY_EXTRA_CODES_SET.has(c)),
      bannedCodes: state.bannedCodes.filter(c => !KEY_EXTRA_CODES_SET.has(c)),
    }
  }
  return { ...state, useKey: next, risk: null }
}

function deriveCellState(
  code: string,
  lockedSet: Set<string>,
  bannedSet: Set<string>,
  pickSet: Set<string>,
  conflictSet: Set<string>,
  lockedConflictSet: Set<string>,
): CellState {
  if (lockedSet.has(code)) return 'locked'
  if (lockedConflictSet.has(code)) return 'conflict'
  if (bannedSet.has(code)) return 'banned'
  if (pickSet.has(code)) return 'selected'
  if (conflictSet.has(code)) return 'conflict'
  return 'unselected'
}

function handleCellClick(state: CellsState, code: string): CellsState {
  if (!state.useKey && KEY_EXTRA_CODES_SET.has(code)) return state

  const lockedSet = new Set(state.lockedCodes)
  const bannedSet = new Set(state.bannedCodes)
  const pickSet = new Set(state.risk?.picks)
  const conflictSet = new Set(state.risk?.conflicts)
  const lockedConflictSet = computeLockedConflictSet(state.lockedCodes)

  const currentState = deriveCellState(
    code, lockedSet, bannedSet, pickSet, conflictSet, lockedConflictSet,
  )

  if (KEY_CODES_SET.has(code)) {
    return handleKeyCellClick(state, code, currentState, lockedSet, bannedSet, pickSet)
  }
  return handleRegularCellClick(state, code, currentState, lockedSet, bannedSet, pickSet)
}

function handleKeyCellClick(
  state: CellsState,
  code: string,
  currentState: CellState,
  lockedSet: Set<string>,
  bannedSet: Set<string>,
  pickSet: Set<string>,
): CellsState {
  if (currentState === 'conflict') return state
  if (currentState === 'locked') {
    const newLocked = new Set(lockedSet)
    newLocked.delete(code)
    let newRisk = state.risk
    if (newRisk && !pickSet.has(code)) {
      newRisk = addRiskToCode(newRisk, code)
    }
    return { ...state, lockedCodes: [...newLocked], risk: newRisk }
  }
  const group = findRiskGroup(code)
  const otherKeyCodes = group?.risks
    .filter(r => r.code !== code)
    .map(r => r.code) ?? []
  const newLocked = new Set(lockedSet)
  const newBanned = new Set(bannedSet)
  let newRisk = state.risk
  newLocked.add(code)
  for (const c of otherKeyCodes) {
    newLocked.delete(c)
    newBanned.delete(c)
  }
  if (newRisk) {
    for (const c of otherKeyCodes) {
      if (pickSet.has(c)) newRisk = removeRiskFromCode(newRisk, c)
    }
    if (!pickSet.has(code)) newRisk = addRiskToCode(newRisk, code)
  }
  return { ...state, lockedCodes: [...newLocked], bannedCodes: [...newBanned], risk: newRisk }
}

function handleRegularCellClick(
  state: CellsState,
  code: string,
  currentState: CellState,
  lockedSet: Set<string>,
  bannedSet: Set<string>,
  pickSet: Set<string>,
): CellsState {
  let newState: CellState
  if (currentState === 'unselected' || currentState === 'selected') newState = 'banned'
  else if (currentState === 'banned') newState = 'locked'
  else if (currentState === 'locked') newState = 'unselected'
  else return state

  const newLocked = new Set(lockedSet)
  const newBanned = new Set(bannedSet)
  let newRisk = state.risk

  const group = findRiskGroup(code)
  const otherGroupCodes = group?.risks
    .filter(r => r.code !== code)
    .map(r => r.code) ?? []

  if (newState === 'banned') {
    newBanned.add(code)
    if (currentState === 'selected' && newRisk) {
      newRisk = removeRiskFromCode(newRisk, code)
      newRisk = {
        ...newRisk,
        conflicts: newRisk.conflicts.filter(c => !otherGroupCodes.includes(c)),
      }
    }
  } else if (newState === 'locked') {
    newBanned.delete(code)
    newLocked.add(code)
    for (const c of otherGroupCodes) {
      newBanned.delete(c)
    }
    if (newRisk) {
      for (const c of otherGroupCodes) {
        if (pickSet.has(c)) {
          newRisk = removeRiskFromCode(newRisk, c)
        }
      }
      newRisk = addRiskToCode(newRisk, code)
    }
  } else {
    // locked -> unselected
    newLocked.delete(code)
    if (newRisk) {
      newRisk = removeRiskFromCode(newRisk, code)
      newRisk = {
        ...newRisk,
        conflicts: newRisk.conflicts.filter(c => !otherGroupCodes.includes(c)),
      }
    }
  }

  return { ...state, lockedCodes: [...newLocked], bannedCodes: [...newBanned], risk: newRisk }
}
