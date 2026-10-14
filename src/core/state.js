/**
 * Production Pattern: A deterministic State Tracker (Finite State Machine).
 * Serves as the single source of truth for the global pipeline execution context.
 * It manages multi-agent handoffs, stores dynamic file system coordinates, and maps error states.
 */
export class PipelineState {
  constructor() {
    // Standard linear workflow phases
    this.validSteps = ['IDLE', 'PLANNING', 'PLANNED', 'CODING', 'COMPLETED', 'FAILED'];
    
    this.currentStep = 'IDLE';
    this.blueprintPath = null;   // Absolute local path to 'portfolio_blueprint.md'
    this.workspacePath = null;   // Absolute local path to the cloned repository sandbox
    this.githubRepoUrl = null;   // The live remote repository endpoint
    this.errors = [];            // Storage array for tracking structural runtime faults
    this.startTimestamp = Date.now();
  }

  /**
   * Transition the system to the next structural phase safely.
   */
  transitionTo(nextStep) {
    if (!this.validSteps.includes(nextStep)) {
      this.logError('StateTracker', `Invalid state transition requested: Attempted to move to '${nextStep}'`);
      return;
    }

    const elapsedSeconds = ((Date.now() - this.startTimestamp) / 1000).toFixed(1);
    console.log(`\n [State Machine] (${elapsedSeconds}s elapsed): '${this.currentStep}' ➔ '${nextStep}'`);
    this.currentStep = nextStep;
  }

  /**
   * Formally logs a tool or model failure, updating the operational status to blocked.
   */
  logError(agentName, errorMessage) {
    const timestamp = new Date().toISOString().split('T')[1].slice(0, 8);
    const errorLog = `[${timestamp}] [${agentName}] Fault in step '${this.currentStep}': ${errorMessage}`;
    
    console.error(`${errorLog}`);
    this.errors.push(errorLog);
    this.currentStep = 'FAILED';
  }

  /**
   * Generates a lightweight runtime health diagnostic report summary.
   */
  getSummaryReport() {
    return {
      status: this.currentStep,
      durationMs: Date.now() - this.startTimestamp,
      artifacts: {
        blueprint: this.blueprintPath,
        workspace: this.workspacePath,
        remoteRepo: this.githubRepoUrl
      },
      errorCount: this.errors.length,
      logs: this.errors
    };
  }
}
