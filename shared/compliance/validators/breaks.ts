import type { ComplianceProfile } from '../../constants/compliance'
import { BREAK, DRIVING, LINE_50KM, COMPLIANCE_ISSUE_CODES } from '../constants'
import type { ComplianceIssue, ComplianceTimelineEvent } from '../types'

type BreakProfileRules = {
  minTotal: number
  splitFirst: number
  splitSecond: number
  allowThreePartLine: boolean
}

function breakRules(profile: ComplianceProfile): BreakProfileRules {
  if (profile === 'LINE_50KM_FPERSV') {
    return {
      minTotal: BREAK.MIN_TOTAL_MIN,
      splitFirst: LINE_50KM.BREAK_LONG_STOP_MIN,
      splitSecond: LINE_50KM.BREAK_LONG_STOP_MIN,
      allowThreePartLine: true,
    }
  }
  return {
    minTotal: BREAK.MIN_TOTAL_MIN,
    splitFirst: BREAK.SPLIT_STANDARD_FIRST_MIN,
    splitSecond: BREAK.SPLIT_STANDARD_SECOND_MIN,
    allowThreePartLine: false,
  }
}

function qualifiesBreak(totalMinutes: number, rules: BreakProfileRules): boolean {
  if (totalMinutes >= rules.minTotal) return true
  return false
}

function qualifiesSplitBreak(parts: number[], rules: BreakProfileRules): boolean {
  const sum = parts.reduce((a, b) => a + b, 0)
  if (sum < rules.minTotal) return false

  if (rules.allowThreePartLine) {
    const sorted = [...parts].sort((a, b) => b - a)
    const longest = sorted[0]
    const secondLongest = sorted[1]
    if (longest !== undefined && secondLongest !== undefined && longest >= LINE_50KM.BREAK_LONG_STOP_MIN && secondLongest >= LINE_50KM.BREAK_LONG_STOP_MIN) {
      return true
    }
    if (sorted.length >= 3 && sorted.every((p) => p >= BREAK.SPLIT_LINE_3_PART_MIN)) {
      return true
    }
  }

  const first = parts.find((p) => p >= rules.splitFirst)
  const second = parts.find((p) => p >= rules.splitSecond && p !== first)
  return Boolean(first && second && sum >= rules.minTotal)
}

export function validateDrivingBreaks(
  events: ComplianceTimelineEvent[],
  profile: ComplianceProfile,
): ComplianceIssue[] {
  const issues: ComplianceIssue[] = []
  const rules = breakRules(profile)

  let drivingSinceBreak = 0
  let breakParts: number[] = []

  const resetBreakWindow = () => {
    drivingSinceBreak = 0
    breakParts = []
  }

  const consumeBreakParts = () => {
    if (qualifiesBreak(breakParts.reduce((a, b) => a + b, 0), rules)) {
      resetBreakWindow()
      return true
    }
    if (qualifiesSplitBreak(breakParts, rules)) {
      resetBreakWindow()
      return true
    }
    return false
  }

  for (const event of events) {
    if (event.type === 'drive') {
      drivingSinceBreak += event.minutes
      if (drivingSinceBreak > DRIVING.BLOCK_BEFORE_BREAK_MIN) {
        if (!consumeBreakParts()) {
          issues.push({
            code: COMPLIANCE_ISSUE_CODES.DRIVING_BLOCK_WITHOUT_BREAK,
            severity: 'error',
            message: `Lenkblock über ${DRIVING.BLOCK_BEFORE_BREAK_MIN / 60}h ohne ausreichende Pause`,
            context: {
              drivingMinutes: drivingSinceBreak,
              requiredBreakMinutes: rules.minTotal,
            },
          })
        }
      }
      continue
    }

    if (event.minutes >= rules.splitFirst) {
      breakParts.push(event.minutes)
    }

    if (qualifiesBreak(event.minutes, rules)) {
      resetBreakWindow()
      continue
    }

    if (qualifiesSplitBreak(breakParts, rules)) {
      resetBreakWindow()
    }
  }

  return issues
}
