// index.js
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';

import { PipelineState } from './src/core/state.js';

// Import our Multi-Agent Workflows
import { runPlanningAgent } from './src/agents/planning.js';
import { runCodingAgent } from './src/agents/coding.js';

// Import our Infrastructure Automation Tools
import { createGitHubRepository, cloneRepository } from './src/tools/github_actions.js';

// Load secure tokens from .env file
dotenv.config();

// Critical Validation: Verify environment parameters exist
if (!process.env.GEMINI_API_KEY || !process.env.GITHUB_TOKEN) {
  console.error("Critical Error: Verification failed. Ensure GEMINI_API_KEY and GITHUB_TOKEN are configured in your .env file.");
  process.exit(1);
}

// Initialize the official Google GenAI Client
const client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });


async function executeDevPipeline() {
  console.log("=====================================================");
  console.log("🚀 INITIALIZING AUTONOMOUS DEVPIPELINE-AGENT ENGINE");
  console.log("=====================================================\n");

  const pipelineState = new PipelineState();
  const inputRequirementsPath = './resume1.txt';
  
  // Choose an intuitive, unique name for your new automated portfolio repo
  const dynamicRepoName = `portfolio-site`;

  // =================================================================
  // PHASE 1: SYSTEM ARCHITECTURE PLANNING (Planning Agent)
  // =================================================================
  const planningSuccess = await runPlanningAgent(client, pipelineState, inputRequirementsPath);
  
  if (!planningSuccess || pipelineState.currentStep === 'FAILED') {
    console.error("Pipeline Aborted: Architecture planning phase failed.");
    return;
  }

  // =================================================================
  // PHASE 2: CLOUD INFRASTRUCTURE PROVISIONING (Deterministic JS Code)
  // =================================================================
  console.log(`\n [Handoff]: State validated as '${pipelineState.currentStep}'. Triggering environment setup...`);
  
  // 1. Invoke GitHub REST API to provision a clean repository asset
  const githubRepoInfo = await createGitHubRepository({
    repoName: dynamicRepoName,
    description: "A portfolio compiled and deployed autonomously by DevPipeline-Agent."
  });

  if (githubRepoInfo.error) {
    pipelineState.logError("Orchestrator", githubRepoInfo.error);
    return;
  }
  console.log(`[Infrastructure]: ${githubRepoInfo.result}`);

  // 2. Clone the remote repository down locally into our isolated workspace folder
  const cloneResult = cloneRepository({
    repoUrl: githubRepoInfo.cloneUrl,
    repoName: dynamicRepoName
  });

  if (cloneResult.error) {
    pipelineState.logError("Orchestrator", cloneResult.error);
    return;
  }
  
  // Feed the absolute sandbox path safely into our tracking state machine
  pipelineState.workspacePath = cloneResult.workspacePath;
  pipelineState.transitionTo('CODING');

  // =================================================================
  // PHASE 3: COMPILATION & REMOTE DEPLOYMENT (Coding Agent)
  // =================================================================
  const absoluteBlueprintPath = path.resolve(pipelineState.blueprintPath);
  const absoluteTargetFilePath = path.join(pipelineState.workspacePath, "index.html");

  // Construct the unchangeable execution prompt for the coding loop
  const codingTaskPrompt = `
    The independent workspace environment has been prepared. Execute your technical tasks using these exact paths:
    
    1. Call 'readFile' using this path to pull down the layout blueprint: "${absoluteBlueprintPath}".
    2. Translate the markdown specifications into a robust single-file HTML layout using Tailwind CSS CDN. Focus heavily on layout visual metrics.
    3. Call 'writeFile' to drop your final output code directly here: "${absoluteTargetFilePath}".
    4. Call 'pushToGitHub' with workspace path "${pipelineState.workspacePath}" and target repo URL "${githubRepoInfo.cloneUrl}" to deploy it live.
  `;

  console.log("\n[Orchestrator]: Environment ready. Passing parameters to Coding Agent...");
  const codingSuccess = await runCodingAgent(client, pipelineState, codingTaskPrompt);

  // =================================================================
  // PIPELINE LIFECYCLE CONCLUSION
  // =================================================================
  console.log("\n=====================================================");
  if (codingSuccess && pipelineState.currentStep === 'COMPLETED') {
    console.log(`DEVPIPELINE RUN COMPLETE!`);
    console.log(`Your autonomous project was created and pushed to GitHub.`);
    console.log(`Check your GitHub profile for the repo named: ${dynamicRepoName}`);
  } else {
    console.log(`DEVPIPELINE RUN FAILED`);
    console.log(`Error Log Summary:`, pipelineState.errors);
  }
  console.log("=====================================================");
}

// Launch the software engineering pipeline
executeDevPipeline();

