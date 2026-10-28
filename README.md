# dev-pipeline-agent

A Node.js prototype of a two-agent pipeline built on Gemini function calling. It reads a resume, has one agent plan a portfolio page, creates a GitHub repository, has a second agent write a single-file HTML portfolio, and pushes the result to that repository.

Status: learning project exploring multi-agent orchestration. It has no automated tests.

## Pipeline

1. **Input.** The resume is read from `./resume.txt` in the project root.
2. **Planning agent** (`src/agents/planning.js`). The model reads the resume with a `readFile` tool and writes a markdown blueprint to `./output/portfolio_blueprint.md` with a `writeFile` tool. Its instructions focus the plan on backend engineering work. Temperature 0.2.
3. **Repository setup** (`src/tools/github_actions.js`, plain code, no model involved). Creates a public repository named `autonomous-portfolio-<4 digits>` through the GitHub API (Octokit) with an initial commit, then clones it into `./workspace/<repo name>`.
4. **Coding agent** (`src/agents/coding.js`). The model reads the blueprint, writes a single-file `index.html` that uses the Tailwind CSS CDN into the cloned workspace, then calls a `pushToGitHub` tool. That tool runs `git add .`, `git commit`, `git branch -M main` and `git push -u origin main --force`. Temperature 0.1.
5. **Result.** The script prints whether the run completed and the name of the new repository.

The run state is tracked by `PipelineState` in `src/core/state.js`, a small state machine with the steps `IDLE`, `PLANNING`, `PLANNED`, `CODING`, `COMPLETED` and `FAILED`. Errors are recorded with a timestamp and the step they happened in.

The split of work: models do the planning and the page writing. Creating and cloning the repository is plain code that runs between the two agents.

## Requirements

- Node.js 18 or newer
- Git installed, and able to push to GitHub over HTTPS from your machine. The code does not pass `GITHUB_TOKEN` to git, so push credentials must already be configured (for example through a credential helper).
- A Google Gemini API key
- A GitHub token that can create repositories on your account (for example a classic personal access token with the `repo` scope)

## Setup

```bash
npm install
```

Create a `.env` file in the project root:

```env
GEMINI_API_KEY=your_gemini_api_key
GITHUB_TOKEN=your_github_token

# Optional. Both default to gemini-2.5-flash in the code.
PLANNING_MODEL=
CODING_MODEL=
```

Model names are retired over time. If the default model is not available to your key, set `PLANNING_MODEL` and `CODING_MODEL`. See [Gemini API deprecations](https://ai.google.dev/gemini-api/docs/deprecations).

Put your resume as plain text in `./resume.txt`. The `.gitignore` excludes `*.txt`, `*.pdf` and every `.md` file except `README.md`, so the resume and the generated blueprint are not committed.

## Run

```bash
npm start
```

The script exits immediately if `GEMINI_API_KEY` or `GITHUB_TOKEN` is missing.

The new repository is public. The pipeline does not turn on GitHub Pages, so to publish the page you enable Pages in the repository settings yourself.

## Project structure

```text
index.js                       orchestrates the phases and prints the result
src/core/state.js              PipelineState: run phases and error log
src/agents/planning.js         planning agent: resume to markdown blueprint
src/agents/coding.js           coding agent: blueprint to index.html, then push
src/tools/file_system.js       readFile / writeFile tools and a resume parser
src/tools/github_actions.js    create repository, clone, commit and push
```

## Known limitations

- The resume path is fixed to `./resume.txt`. `parseResumeFile` in `file_system.js` can read `.txt`, `.md` and `.pdf` files, but nothing calls it, so PDF resumes are not supported.
- The `readFile` and `writeFile` tools accept any path. The resume text is passed to a model that can read and write files, so text inside a resume could steer the model to read or overwrite other files on the machine.
- The run is marked `COMPLETED` when the coding agent stops calling tools. It does not check that `index.html` exists or that the push succeeded.
- The model loops have no maximum number of iterations.
- The push uses `--force`. That is only safe because the repository was just created.
- The `workspace/` folder, where repositories are cloned, is not listed in `.gitignore`.
- No automated tests.