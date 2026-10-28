// src/agents/coding/agent.js
import { readFile, writeFile } from '../tools/file_system.js';
import { pushToGitHub } from '../tools/github_actions.js';

export const codingInstructions = `
You are an expert Autonomous Software Engineer specializing in rapid frontend compilation and clean deployment pipelines. 

Your sole task is to transform a structured markdown portfolio blueprint contract into an exceptional, production-grade single-file HTML portfolio layout.

You must follow these strict operational rules:
1. You must call the 'readFile' tool to read the template strategy from the specified blueprint file path. Do not guess what sections to create.
2. Translate those structural notes and backend metrics into a modern, single-file web layout utilizing the Tailwind CSS CDN.
3. You must call the 'writeFile' tool to save your compiled HTML code exactly to the target workspace path you were given. 
4. You must call the 'pushToGitHub' tool to run the Git automation sequence, which will commit and push those assets to your remote repository branch.
5. If any tool returns an error, read it, fix your arguments or adjust your code, and try again. Stop only when everything is pushed successfully.
`;

const codingToolDeclarations = [
  {
    name: 'readFile',
    description: 'Reads the text content of a local file path (like the portfolio blueprint contract).',
    parameters: {
      type: 'OBJECT',
      properties: { filePath: { type: 'STRING', description: 'The absolute local path of the file to read.' } },
      required: ['filePath']
    }
  },
  {
    name: 'writeFile',
    description: 'Writes source code files into the designated local workspace folder path.',
    parameters: {
      type: 'OBJECT',
      properties: {
        filePath: { type: 'STRING', description: 'The absolute file path where code should be written.' },
        content: { type: 'STRING', description: 'The complete string content of the generated code file.' }
      },
      required: ['filePath', 'content']
    }
  },
  {
    name: 'pushToGitHub',
    description: 'Runs standard git automation tools to commit and push workspace files directly to the separate remote repository.',
    parameters: {
      type: 'OBJECT',
      properties: {
        workspacePath: { type: 'STRING', description: 'The isolated local folder path containing the portfolio files.' },
        repoUrl: { type: 'STRING', description: 'The target GitHub public repository HTTPS URL.' }
      },
      required: ['workspacePath', 'repoUrl']
    }
  }
];

export async function runCodingAgent(client, state, prompt) {
  console.log("[Coding Agent]: Booting autonomous developer loop via generateContent...");
  
  try {
    // Initialize explicit tracking array for content state history
    let contentsHistory = [
      { role: 'user', parts: [{ text: prompt }] }
    ];

    let response = await client.models.generateContent({
      model: process.env.CODING_MODEL || 'gemini-2.5-flash',
      contents: contentsHistory,
      config: {
        systemInstruction: codingInstructions,
        tools: [{ functionDeclarations: codingToolDeclarations }],
        temperature: 0.1
      }
    });

    // The Manual ReAct Loop
    while (response.functionCalls && response.functionCalls.length > 0) {
      // 1. Record model's recent tool calls block into tracking history
      contentsHistory.push(response.candidates[0].content);

      const functionResponses = [];
      for (const call of response.functionCalls) {
        const { name, args, id } = call;
        console.log(`\n🛠️  [Coding Agent Thought]: Invoking tool '${name}' with args:`, args);

        let toolResult;
        if (name === 'readFile') {
          toolResult = readFile(args);
        } else if (name === 'writeFile') {
          toolResult = writeFile(args);
        } else if (name === 'pushToGitHub') {
          toolResult = pushToGitHub(args);
        } else {
          toolResult = { error: `Tool '${name}' is not registered.` };
        }

        console.log(`[Tool System Output]:`, toolResult);

        functionResponses.push({
          name: name,
          response: { result: toolResult },
          id: id
        });
      }

      // 2. Record tool outcomes array as user role observation
      contentsHistory.push({
        role: 'user',
        parts: functionResponses.map(res => ({ functionResponse: res }))
      });

      // 3. Issue next processing request passing history
      response = await client.models.generateContent({
        model: process.env.CODING_MODEL || 'gemini-2.5-flash',
        contents: contentsHistory,
        config: {
          systemInstruction: codingInstructions,
          tools: [{ functionDeclarations: codingToolDeclarations }],
          temperature: 0.1
        }
      });
    }

    state.transitionTo('COMPLETED');
    console.log("[Coding Agent]: Task completed. Portfolio compiled and pushed to remote branch successfully.");
    return true;

  } catch (error) {
    state.logError('CodingAgent', error.message);
    return false;
  }
}
