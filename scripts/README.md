# Scripts

## generate-fixtures.ts

Generates test fixtures for performance testing.

### Usage

```bash
pnpm generate-fixtures
```

### What it does

This script creates monorepo fixtures in `test/fixture/performance/` with the following structure:

- **3 package managers**: pnpm, yarn, npm
- **3 sizes per package manager**:
  - `small`: 5 packages
  - `medium`: 20 packages  
  - `large`: 100 packages

Each fixture includes:
- Root `package.json` with workspace configuration
- Package manager specific lock files
- Workspace configuration files (e.g., `pnpm-workspace.yaml`)
- Package directories under `packages/`
- Each package has its own `package.json` and `index.js`

### Example output structure

```
test/fixture/performance/
├── pnpm-small/
│   ├── package.json
│   ├── pnpm-workspace.yaml
│   ├── pnpm-lock.yaml
│   └── packages/
│       ├── pnpm-pkg-1/
│       ├── pnpm-pkg-2/
│       └── ...
├── pnpm-medium/
├── pnpm-large/
├── yarn-small/
├── yarn-medium/
├── yarn-large/
├── npm-small/
├── npm-medium/
└── npm-large/
```

### Note

The generated fixtures are excluded from git via `.gitignore` to keep the repository size small. Run the script before running benchmarks if the fixtures don't exist.
