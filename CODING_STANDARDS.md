# Coding Standards - Home Swap Platform

## Overview

This document defines the coding standards for the Home Swap Platform project to ensure consistency, readability, and maintainability across the codebase.

## Technology Stack

- **Framework**: Next.js 16.1.1
- **Language**: TypeScript 5.x
- **UI Library**: React 19.2.3
- **Styling**: Tailwind CSS 4.x
- **Linting**: ESLint with Next.js configuration

## General Principles

1. **Consistency**: Follow established patterns throughout the codebase
2. **Readability**: Write code that tells a story
3. **Maintainability**: Structure code for easy updates and debugging
4. **Performance**: Consider performance implications of coding decisions

## File and Folder Structure

### Naming Conventions

- **Files**: Use kebab-case for file names (`user-profile.tsx`, `api-client.ts`)
- **Components**: Use PascalCase for React components (`UserProfile.tsx`, `PropertyCard.tsx`)
- **Directories**: Use kebab-case (`user-management/`, `property-listings/`)
- **Constants**: Use SCREAMING_SNAKE_CASE (`API_BASE_URL`, `MAX_UPLOAD_SIZE`)

### Project Structure

```
src/
├── app/                    # Next.js App Router pages
├── components/             # Reusable UI components
│   ├── ui/                # Base UI components
│   └── features/          # Feature-specific components
├── lib/                   # Utility functions and configurations
├── hooks/                 # Custom React hooks
├── types/                 # TypeScript type definitions
├── constants/             # Application constants
└── styles/                # Global styles and Tailwind config
```

## TypeScript Standards

### Type Definitions

```typescript
// Use interfaces for object shapes
interface User {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
}

// Use type aliases for unions and primitives
type Status = 'pending' | 'approved' | 'rejected';
type UserId = string;
```

### Function Signatures

```typescript
// Always specify return types for functions
function calculatePrice(basePrice: number, fees: number[]): number {
  return basePrice + fees.reduce((sum, fee) => sum + fee, 0);
}

// Use arrow functions for simple operations
const formatCurrency = (amount: number): string =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(
    amount
  );
```

### Strict Mode

- Always use TypeScript strict mode (enabled in `tsconfig.json`)
- Avoid `any` type - use `unknown` or proper typing instead
- Use optional chaining (`?.`) and nullish coalescing (`??`) operators

## React Component Standards

### Component Structure

```typescript
import { useState, useEffect } from 'react';
import { ComponentProps } from './types';

interface Props {
  title: string;
  onSubmit: (data: FormData) => void;
  isLoading?: boolean;
}

export function ComponentName({ title, onSubmit, isLoading = false }: Props) {
  const [state, setState] = useState<string>('');

  useEffect(() => {
    // Effect logic
  }, []);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    // Handle submit
  };

  return (
    <div className="component-container">
      <h2>{title}</h2>
      {/* Component JSX */}
    </div>
  );
}
```

### Component Guidelines

1. **Props Interface**: Always define props interface above the component
2. **Default Props**: Use default parameters instead of `defaultProps`
3. **Event Handlers**: Prefix with `handle` (`handleClick`, `handleSubmit`)
4. **State**: Use descriptive names and proper typing
5. **Exports**: Use named exports for components

### Hooks Usage

```typescript
// Custom hooks should start with 'use'
function useUserData(userId: string) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUser(userId)
      .then(setUser)
      .finally(() => setLoading(false));
  }, [userId]);

  return { user, loading };
}
```

## Styling Standards

### Tailwind CSS

- Use Tailwind utility classes for styling
- Group related classes together
- Use responsive prefixes consistently (`sm:`, `md:`, `lg:`)
- Extract repeated patterns into components

```typescript
// Good
<div className="flex items-center justify-between p-4 bg-white rounded-lg shadow-md">
  <h3 className="text-lg font-semibold text-gray-900">Title</h3>
  <button className="px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-700">
    Action
  </button>
</div>
```

### CSS Custom Properties

For complex styling needs, use CSS custom properties:

```css
:root {
  --color-primary: #3b82f6;
  --color-secondary: #64748b;
  --spacing-unit: 0.25rem;
}
```

## Code Formatting and Linting

### ESLint Configuration

The project uses ESLint with Next.js configuration. Key rules:

- No unused variables
- Consistent quote style (single quotes for strings)
- Semicolons required
- Consistent indentation (2 spaces)

### Prettier Integration

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2
}
```

## API and Data Handling

### API Client Structure

```typescript
// lib/api-client.ts
class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  async get<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`);
    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }
    return response.json();
  }
}
```

### Error Handling

```typescript
// Use Result pattern for error handling
type Result<T, E = Error> =
  | { success: true; data: T }
  | { success: false; error: E };

async function fetchUser(id: string): Promise<Result<User>> {
  try {
    const user = await apiClient.get<User>(`/users/${id}`);
    return { success: true, data: user };
  } catch (error) {
    return { success: false, error: error as Error };
  }
}
```

## Testing Standards

### Unit Tests

```typescript
// __tests__/components/UserProfile.test.tsx
import { render, screen } from '@testing-library/react';
import { UserProfile } from '../UserProfile';

describe('UserProfile', () => {
  it('displays user name correctly', () => {
    const user = { id: '1', name: 'John Doe', email: 'john@example.com' };
    render(<UserProfile user={user} />);

    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });
});
```

## Performance Guidelines

1. **Code Splitting**: Use dynamic imports for large components
2. **Memoization**: Use `React.memo`, `useMemo`, and `useCallback` appropriately
3. **Image Optimization**: Use Next.js `Image` component
4. **Bundle Analysis**: Regular bundle size monitoring

## Git Commit Standards

### Commit Message Format

```
type(scope): description

[optional body]

[optional footer]
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

### Examples

```
feat(auth): add user authentication flow
fix(api): handle network timeout errors
docs(readme): update installation instructions
```

## Code Review Guidelines

### Before Submitting

- [ ] Code follows established patterns
- [ ] All tests pass
- [ ] ESLint warnings resolved
- [ ] TypeScript compilation successful
- [ ] Performance implications considered

### Review Checklist

- [ ] Code is readable and well-documented
- [ ] Proper error handling implemented
- [ ] Security considerations addressed
- [ ] Accessibility requirements met
- [ ] Mobile responsiveness verified

## Documentation Standards

### Code Comments

```typescript
/**
 * Calculates the total price including taxes and fees
 * @param basePrice - The base price before additional costs
 * @param taxRate - Tax rate as decimal (e.g., 0.08 for 8%)
 * @param fees - Array of additional fees
 * @returns Total price including all costs
 */
function calculateTotalPrice(
  basePrice: number,
  taxRate: number,
  fees: number[]
): number {
  const tax = basePrice * taxRate;
  const totalFees = fees.reduce((sum, fee) => sum + fee, 0);
  return basePrice + tax + totalFees;
}
```

### README Updates

Keep project README updated with:

- Setup instructions
- Development workflow
- Deployment process
- Architecture decisions

## Enforcement

### Automated Checks

- ESLint runs on pre-commit hooks
- TypeScript compilation required for builds
- Automated testing in CI/CD pipeline

### Team Responsibilities

- Code reviews enforce standards
- Regular team discussions on standard updates
- Documentation of exceptions and rationale

---

**Last Updated**: January 2026
**Version**: 1.0
**Next Review**: March 2026
