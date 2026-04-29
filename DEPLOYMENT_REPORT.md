# Zonite Frontend Heroku Deployment Report

**Date:** April 29, 2026  
**Status:** ⚠️ RUNTIME ERROR - Build Succeeds, Application Crashes on Startup

---

## Executive Summary

We are attempting to deploy the Zonite frontend application as a standalone service on Heroku using a separate GitHub repository (`Zonite-client`). The build process completes successfully, but the Node.js application crashes immediately upon startup with a TypeError during Express route setup.

---

## Objective: What We're Trying to Do

### Goal

- **Deploy frontend independently** from the monorepo (separate Heroku app)
- **Use separate GitHub repo** (`Zonite-client`) as the source for Heroku deployments
- **Keep frontend self-contained** - all shared types/enums bundled locally
- **Maintain CI/CD pipeline** using Heroku's Node.js buildpack

### Architecture

```
Zonite Monorepo (main)
├── apps/frontend (source)
├── apps/backend
└── packages/shared (types/enums)
                ↓
        git subtree push
                ↓
Zonite-Client Repo (separate)
├── [Frontend code only]
├── [Shared types inlined]
└── src/shared/ (copied from monorepo)
                ↓
        Heroku Deploy
                ↓
Heroku Dynos (zonite-client-*.herokuapp.com)
```

---

## Progress: What We've Accomplished ✅

### 1. **Configuration Files Created**

- ✅ `Procfile` - Defines start command: `web: node server.js`
- ✅ `.slugignore` - Excludes backend files from Heroku slug
- ✅ `.nvmrc` - Pins Node.js 22.x
- ✅ `.env.example` - Template for environment variables
- ✅ `package.json` - Updated engines for Node 22.x, npm 10.x-11.x

### 2. **Dependency Resolution Fixed**

- ✅ Removed `@zonite/shared` npm dependency
- ✅ Copied `packages/shared/src/` → `apps/frontend/src/shared/`
- ✅ Updated all imports from `@zonite/shared` → `../shared`
- ✅ Frontend now has zero external package dependencies for types/contracts

### 3. **TypeScript Configuration Standalone**

- ✅ Created standalone `apps/frontend/tsconfig.json`
- ✅ Removed monorepo path references (`../../tsconfig.base.json`)
- ✅ Configured for Vite + React 18 strict mode

### 4. **Build Process**

- ✅ **Build succeeds** in Heroku
  - Node 22.22.2 installed
  - npm 11.13.0 installed
  - 313 packages installed
  - Vite build completes: `✓ 104 modules transformed`
  - `dist/` folder created with production build

### 5. **Git Integration**

- ✅ Added `frontend` remote pointing to `Zonite-Client` repo
- ✅ `git subtree push --prefix apps/frontend frontend main` working
- ✅ Code syncing to separate repo successfully

### 6. **Commits Created**

| Hash      | Message                                                        |
| --------- | -------------------------------------------------------------- |
| `d703eb9` | Include shared types locally, remove @zonite/shared dependency |
| `4641850` | Update all imports to use local shared folder                  |
| `be5b547` | Add proper error handling and use path.resolve                 |

---

## Current Issue: Runtime Error 🔴

### Error Signature

```
TypeError: [Function Name Unknown - Truncated Logs]
    at Function.route (/app/node_modules/router/index.js:428:17)
    at Function.route (/app/node_modules/express/lib/application.js:257:22)
    at app.<computed> [as get] (/app/node_modules/express/lib/application.js:478:22)

Error Properties:
  originalPath: '*'

Node.js: v22.22.2
Process Exit Code: 1
```

### Timeline of Error

1. **Build Phase:** ✅ Completes successfully
2. **Startup Phase:** ❌ Crashes during app initialization
3. **Specific Point of Failure:** During `app.get('*', ...)` route setup
4. **Duration:** Immediate (< 1 second after process start)

### Heroku Logs

```
2026-04-29T00:24:37.667272+00:00 app[web.1]: TypeError: [Details Truncated]
2026-04-29T00:24:37.703250+00:00 heroku[web.1]: Process exited with status 1
2026-04-29T00:24:37.762865+00:00 heroku[web.1]: State changed from starting to crashed
2026-04-29T00:24:40.000000+00:00 app[api]: Build succeeded ← (Contradictory: Build OK, Runtime fails)
```

---

## Root Cause Analysis

### Hypothesis 1: Express Route Handler Issue

**Evidence:**

- Error occurs exactly at `app.get('*', ...)` line
- Error mentions `Function.route` in Express internals
- Truncated error makes root cause unclear

**Server Code (Current):**

```javascript
app.get('*', (req, res) => {
  try {
    res.sendFile(path.resolve(distDir, 'index.html'));
  } catch (err) {
    console.error('Error sending file:', err);
    res.status(500).send('Server error');
  }
});
```

**Possibilities:**

- `path.resolve()` returning unexpected type
- `distDir` variable malformed or undefined
- `res.sendFile()` signature mismatch
- Express version incompatibility with Node 22.22.2

### Hypothesis 2: Missing Dist Folder

**Evidence:**

- Logs show `vite build` completes successfully
- No "dist folder not found" error logged
- But `sendFile()` targets `dist/index.html`

**Risk:**

- Vite build output might not be where Express expects it
- Relative vs absolute path issue in Heroku environment

### Hypothesis 3: ES Module Compatibility

**Evidence:**

- Server uses `import` statements (ES modules)
- `package.json` has `"type": "module"`
- Node 22.x may have stricter ES module validation

**Risk:**

- `path` module import might be resolving incorrectly
- `fileURLToPath` and `path.dirname` might not work as expected

---

## What We Know for Certain

| Aspect                     | Status     | Evidence                               |
| -------------------------- | ---------- | -------------------------------------- |
| **Code builds**            | ✅ YES     | Vite completes, 313 packages installed |
| **Dist folder created**    | ✅ YES     | Build log shows transform completion   |
| **Server file exists**     | ✅ YES     | Procfile references it, pushed to repo |
| **Heroku dyno starts**     | ✅ YES     | Process begins, then crashes           |
| **Express installed**      | ✅ YES     | node_modules includes express v5.2.1   |
| **Error in route setup**   | ✅ YES     | Stack trace points to app.get()        |
| **Full error message**     | ❌ NO      | Logs are truncated                     |
| **Dist folder accessible** | ❓ UNKNOWN | No file access errors logged           |

---

## Critical Information Missing

To diagnose further, we need:

1. **Full Error Stack Trace**

   ```bash
   heroku logs --tail --lines=100
   ```

   - Current logs truncate the actual error message
   - Need to see the complete TypeError details

2. **Server Startup Logs**

   ```bash
   heroku logs --app zonite-client-beaacf2fbe05 -s app
   ```

   - Check if `console.log()` statements in server.js execute
   - Verify `__dirname` and `distDir` values

3. **Dist Folder Contents**
   - Confirm `dist/index.html` exists
   - Check permissions and file structure

4. **Environment at Runtime**
   - Heroku build image version
   - Actual file paths in `/app/`
   - Working directory when server starts

---

## Next Steps (Diagnostics Only)

### Step 1: Enable Detailed Logging

Modify `server.js` to log every step:

```javascript
console.log('1. __filename:', __filename);
console.log('2. __dirname:', __dirname);
console.log('3. distDir:', distDir);
console.log('4. distDir exists:', require('fs').existsSync(distDir));
console.log('5. Creating express app...');
const app = express();
console.log('6. Express app created');
console.log('7. Setting static route...');
app.use(express.static(distDir));
console.log('8. Static route set');
console.log('9. Setting wildcard route...');
app.get('*', (req, res) => { ... });
console.log('10. Wildcard route set');
```

### Step 2: Collect Complete Logs

```bash
# Get full logs with timestamps
heroku logs --tail -a zonite-client-beaacf2fbe05

# Export to file
heroku logs -a zonite-client-beaacf2fbe05 > /tmp/heroku-logs.txt
```

### Step 3: Test Server Locally

```bash
# In Zonite-Client repo
npm install
npm run build
npm start
```

- If it fails locally, error is in code
- If it works locally, error is Heroku environment-specific

### Step 4: Simplify Server to Minimum

Try the absolute simplest server:

```javascript
import express from 'express';
const app = express();
app.get('/', (req, res) => res.send('OK'));
const port = process.env.PORT || 3000;
app.listen(port, () => console.log('Running on', port));
```

- If this works, issue is in path/static/sendFile logic
- If this fails, issue is Express/Node environment

---

## File Structure in Heroku

```
/app/
├── node_modules/          (installed dependencies)
├── dist/                  (built by Vite - should contain index.html)
│   ├── index.html
│   ├── assets/
│   │   ├── *.js
│   │   └── *.css
│   └── ...
├── src/                   (source TypeScript/React)
│   ├── shared/           (copied from monorepo)
│   ├── components/
│   ├── pages/
│   └── ...
├── package.json
├── Procfile              (defines: web: node server.js)
├── server.js             (Express server - FAILING HERE)
├── vite.config.ts
├── tsconfig.json
└── .slugignore
```

---

## Summary Table

| Component          | Build? | Deploy? | Runtime? | Issue                           |
| ------------------ | ------ | ------- | -------- | ------------------------------- |
| **Vite Build**     | ✅     | ✅      | —        | None                            |
| **npm install**    | ✅     | ✅      | —        | None                            |
| **dist/ folder**   | ✅     | ✅      | ?        | Unknown if accessible           |
| **Express Import** | ✅     | ✅      | ❌       | Crashes during route setup      |
| **server.js**      | ✅     | ✅      | ❌       | TypeError in path/route handler |
| **Heroku Dyno**    | —      | ✅      | ❌       | Process exits with code 1       |

---

## Conclusion

✅ **What Works:**

- Monorepo to separate repo workflow
- Frontend extracted successfully
- Build pipeline (npm install → Vite build)
- GitHub integration

❌ **What Fails:**

- Runtime server startup
- Express route handler setup
- Unclear root cause (logs truncated)

**Recommended Action:**
Collect complete error logs and implement verbose logging before attempting further fixes. The issue is likely:

1. Path resolution in Heroku environment
2. Missing/inaccessible dist folder
3. ES module/Node 22 compatibility issue

---

**Generated:** 2026-04-29  
**Last Updated:** After 6 deployment attempts with incremental fixes
