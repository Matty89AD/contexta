---
paths:
  - "**/*.ts"
  - "**/*.tsx"
  - "**/*.js"
  - "**/*.jsx"
---

# Function Documentation Rule

Every function, method, or arrow function assigned to a named variable **must** have a JSDoc comment block directly above it.

## Required format

```ts
/**
 * Brief one-line description of what the function does.
 *
 * @param paramName - Description of the parameter.
 * @returns Description of the return value (omit for `void`).
 */
function myFunction(paramName: string): string {
  ...
}
```

## Rules

- All exported functions must have JSDoc.
- All non-trivial internal functions (more than 2 lines or non-obvious purpose) must have JSDoc.
- Trivial one-liner helpers (e.g., `const double = (n: number) => n * 2`) are exempt.
- React components count as functions and require a JSDoc comment describing their purpose and any notable props.
- Do not add `@param` or `@returns` tags with no meaningful content — omit the tag entirely if it adds no value beyond repeating the type.
- When modifying an existing function that lacks documentation, add the JSDoc block as part of the change.
