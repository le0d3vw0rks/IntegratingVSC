const { read } = require("node:fs");

async function main() {
  const chunks = [];
  for await (const chunk of process.stdin) {
    chunks.push(chunk);
  }
  const toolArgs = JSON.parse(Buffer.concat(chunks).toString());

  const readPath =
    toolArgs.tool_input?.file_path || toolArgs.tool_input?.path || "";
  const bashCommand = toolArgs.tool_input?.command || "";

  if (readPath.includes(".env") || bashCommand.includes(".env")) {
    console.log("You cannot read the .env file");
    process.exit(2);
  }
}

main();
