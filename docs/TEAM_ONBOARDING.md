# Team Onboarding - Coding Standards

## Quick Start

Welcome to the Home Swap Platform development team! This document will get you up to speed with our coding standards.

## Essential Reading

📖 **[Coding Standards](../CODING_STANDARDS.md)** - Complete coding standards document

## Setup Checklist

### 1. Development Environment

- [ ] Node.js 18+ installed
- [ ] VS Code or preferred IDE configured
- [ ] Git configured with your credentials

### 2. Project Setup

```bash
# Clone and setup
git clone <repository-url>
cd home-swap
npm install

# Verify setup
npm run type-check
npm run lint
npm run format:check
```

### 3. IDE Configuration

#### VS Code Extensions (Recommended)

- ESLint
- Prettier - Code formatter
- TypeScript Importer
- Tailwind CSS IntelliSense
- Auto Rename Tag

#### VS Code Settings

Add to your `.vscode/settings.json`:

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.preferences.importModuleSpecifier": "relative"
}
```

## Daily Workflow

### Before Starting Work

```bash
git pull origin main
npm install  # If package.json changed
```

### Before Committing

```bash
npm run type-check    # Check TypeScript
npm run lint:fix      # Fix linting issues
npm run format        # Format code
```

### Commit Message Format

```
feat(auth): add user login functionality

- Implement JWT authentication
- Add login form validation
- Update user state management
```

## Key Standards Summary

### File Naming

- Components: `PascalCase.tsx` (UserProfile.tsx)
- Utilities: `kebab-case.ts` (api-client.ts)
- Directories: `kebab-case/` (user-management/)

### Code Style

- Use TypeScript strict mode
- Always define prop interfaces
- Prefer named exports
- Use Tailwind for styling
- Handle errors explicitly

### Component Structure

```typescript
interface Props {
  // Define props here
}

export function ComponentName({ prop1, prop2 }: Props) {
  // Component logic
  return <div>JSX here</div>;
}
```

## Getting Help

- 📚 Check [Coding Standards](../CODING_STANDARDS.md) for detailed guidelines
- 💬 Ask questions in team chat
- 🔍 Review existing code for patterns
- 📝 Suggest improvements via pull requests

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

---

**Questions?** Reach out to the team chat or create an issue in the repository.
