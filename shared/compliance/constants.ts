// Regulation (EC) 561/2006 + FPersV §1 (line <=50km) + ArbZG hints

export const DRIVING = {
  MAX_DAILY_MIN: 540,
  MAX_DAILY_EXTENDED_MIN: 600,
  MAX_DAILY_EXTENSIONS_PER_WEEK: 2,
  MAX_WEEKLY_MIN: 3360,
  MAX_FORTNIGHTLY_MIN: 5400,
  BLOCK_BEFORE_BREAK_MIN: 270,
} as const

export const BREAK = {
  MIN_TOTAL_MIN: 45,
  SPLIT_STANDARD_FIRST_MIN: 15,
  SPLIT_STANDARD_SECOND_MIN: 30,
  SPLIT_LINE_2_PART_MIN: 20,
  SPLIT_LINE_3_PART_MIN: 15,
} as const

export const LINE_50KM = {
  BREAK_LONG_STOP_MIN: 30,
  HARD_BREAK_AFTER_CONTINUOUS_DRIVING_MIN: 45,
} as const

export const WORKING_TIME = {
  DE_ARBZG_MAX_DAILY_MIN: 600,
  BREAK_AFTER_WORK_MIN: 360,
} as const

export const COMPLIANCE_ISSUE_CODES = {
  DAILY_DRIVING_EXCEEDED: 'daily_driving_exceeded',
  DAILY_DRIVING_EXTENDED_EXCEEDED: 'daily_driving_extended_exceeded',
  WEEKLY_DRIVING_EXCEEDED: 'weekly_driving_exceeded',
  FORTNIGHT_DRIVING_EXCEEDED: 'fortnight_driving_exceeded',
  DRIVING_BLOCK_WITHOUT_BREAK: 'driving_block_without_break',
  INSUFFICIENT_BREAK_SPLIT: 'insufficient_break_split',
  DAILY_WORK_TIME_WARNING: 'daily_work_time_warning',
  TOUR_NO_STOPS: 'tour_no_stops',
} as const
