// src/agents/planning/agent.js
import path from 'path';
import { readFile, writeFile } from '../tools/file_system.js';

export const planningInstructions = `
You are an expert Frontend Architect specializing in Developer Portfolios. Your sole job is to review a user's raw text resume, extract their technical achievements, and design a structured web portfolio layout plan.

You must follow these strict operational rules:
1. You must call the 'readFile' tool to read the user's raw resume file.
2. Analyze the data and focus heavily on highlighting backend engineering complexities (like throughput, scaling metrics, system architecture, and API optimizations).
3. Design a multi-section layout blueprint. Do not write any HTML, CSS, or JavaScript code. Only design the content strategy and technical structure.
4. You must call the 'writeFile' tool to save this structured architectural plan as a clear markdown contract file.
5. Once the contract is saved, stop executing.
`;

export async function runPlanningAgent(client, state, resumePath) {
  state.transitionTo('PLANNING');
  console.log("[Planning Agent]: Initializing autonomous architect loop via generateContent...");

  try {
    const absoluteResumePath = path.resolve(resumePath);
    const absoluteBlueprintPath = path.resolve('src/agents/planning/portfolio_blueprint.md');

    const initialPrompt = `
      Begin your system planning workflow:
      1. Call 'readFile' to pull data from this path: "${absoluteResumePath}".
      2. Synthesize that raw material into a backend-focused developer portfolio architecture layout contract.
      3. Call 'writeFile' to save your markdown design blueprint exactly here: "${absoluteBlueprintPath}".
    `;

    // Production Pattern: Initialize manual array to manage history state
    let contentsHistory = [
      { role: 'user', parts: [{ text: initialPrompt }] }
    ];

    // Request initial processing step
    let response = await client.models.generateContent({
      model: process.env.PLANNING_MODEL || 'gemini-2.5-flash',
      contents: contentsHistory,
      config: {
        systemInstruction: planningInstructions,
        tools: [{ functionDeclarations: planningToolDeclarations }],
        temperature: 0.2
      }
    });

    // The Manual ReAct Loop
    while (response.functionCalls && response.functionCalls.length > 0) {
      // 1. Append the model's response (containing its tool selection intent) to history
      contentsHistory.push(response.candidates[0].content);

      // 2. Process requested tools sequentially
      const functionResponses = [];
      for (const call of response.functionCalls) {
        const { name, args, id } = call;
        console.log(`[Planning Agent Thought]: Invoking tool '${name}' with args:`, args);

        let toolResult;
        if (name === 'readFile') {
          toolResult = readFile(args);
        } else if (name === 'writeFile') {
          toolResult = writeFile(args);
        } else {
          toolResult = { error: `Tool '${name}' is not registered.` };
        }

        console.log(`[Tool System Output]:`, toolResult);

        // Map the execution outcome into a valid functionResponse object matching call ID
        functionResponses.push({
          name: name,
          response: { result: toolResult },
          id: id
        });
      }

      // 3. Append the execution observation results to history block as 'user' role
      contentsHistory.push({
        role: 'user',
        parts: functionResponses.map(res => ({ functionResponse: res }))
      });

      // 4. Request the next cognitive processing step passing full manual sequence
      response = await client.models.generateContent({
        model: process.env.PLANNING_MODEL || 'gemini-2.5-flash',
        contents: contentsHistory,
        config: {
          systemInstruction: planningInstructions,
          tools: [{ functionDeclarations: planningToolDeclarations }],
          temperature: 0.2
        }
      });
    }

    state.blueprintPath = absoluteBlueprintPath;
    state.transitionTo('PLANNED');
    console.log(`[Planning Agent]: Blueprint contract safely completed and saved.`);
    return true;
  } catch (error) {
    state.logError('PlanningAgent', error.message);
    return false;
  }
}
