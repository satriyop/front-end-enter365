/**
 * Utility for merging Tailwind CSS classes with conflict resolution
 * Inspired by shadcn/ui's cn utility
 */

type ClassValue = string | number | boolean | undefined | null | ClassValue[]
type ClassDictionary = Record<string, boolean | undefined | null>
type ClassInput = ClassValue | ClassDictionary

/**
 * Merge class names, filtering out falsy values
 * Handles arrays, objects, and primitive values
 */
function clsx(...inputs: ClassInput[]): string {
  const classes: string[] = []

  for (const input of inputs) {
    if (!input) continue

    if (typeof input === 'string' || typeof input === 'number') {
      classes.push(String(input))
    } else if (Array.isArray(input)) {
      const nested = clsx(...input)
      if (nested) classes.push(nested)
    } else if (typeof input === 'object') {
      for (const [key, value] of Object.entries(input)) {
        if (value) classes.push(key)
      }
    }
  }

  return classes.join(' ')
}

/**
 * Tailwind class groups for conflict resolution
 */
const CLASS_GROUPS: Record<string, RegExp> = {
  // Spacing
  padding: /^p[xytrbl]?-/,
  margin: /^-?m[xytrbl]?-/,
  // Sizing
  width: /^w-/,
  height: /^h-/,
  minWidth: /^min-w-/,
  minHeight: /^min-h-/,
  maxWidth: /^max-w-/,
  maxHeight: /^max-h-/,
  // Typography
  fontSize: /^text-(xs|sm|base|lg|xl|2xl|3xl|4xl|5xl|6xl|7xl|8xl|9xl)$/,
  fontWeight: /^font-(thin|extralight|light|normal|medium|semibold|bold|extrabold|black)$/,
  textColor: /^text-/,
  // Background
  bgColor: /^bg-/,
  // Border
  borderWidth: /^border(-[trbl])?(-\d+)?$/,
  borderColor: /^border-/,
  borderRadius: /^rounded/,
  // Display
  display: /^(block|inline|inline-block|flex|inline-flex|grid|inline-grid|hidden)$/,
  // Flex
  flexDirection: /^flex-(row|col)/,
  justifyContent: /^justify-/,
  alignItems: /^items-/,
  gap: /^gap-/,
  // Position
  position: /^(static|fixed|absolute|relative|sticky)$/,
  // Shadow
  shadow: /^shadow/,
  // Ring
  ring: /^ring-/,
  // Opacity
  opacity: /^opacity-/,
  // Cursor
  cursor: /^cursor-/,
}

/**
 * Get the class group for a given class
 */
function getClassGroup(className: string): string | null {
  for (const [group, regex] of Object.entries(CLASS_GROUPS)) {
    if (regex.test(className)) {
      return group
    }
  }
  return null
}

/**
 * Merge Tailwind classes with conflict resolution
 * Later classes override earlier ones in the same group
 */
export function cn(...inputs: ClassInput[]): string {
  const merged = clsx(...inputs)
  const classes = merged.split(' ').filter(Boolean)

  // Track the last class for each group
  const groupMap = new Map<string, string>()
  const result: string[] = []

  // Process in reverse to keep last occurrence
  for (let i = classes.length - 1; i >= 0; i--) {
    const className = classes[i]!
    const group = getClassGroup(className)

    if (group) {
      if (!groupMap.has(group)) {
        groupMap.set(group, className)
        result.unshift(className)
      }
      // Skip if we already have a class in this group
    } else {
      // No conflict resolution needed
      result.unshift(className)
    }
  }

  // Remove duplicates while preserving order
  return [...new Set(result)].join(' ')
}

export default cn
