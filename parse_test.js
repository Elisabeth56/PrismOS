const output = "```markdown\n## Manifest\n```\n```tsx\nimport React\n```\n```markdown\n### file2\n```\n```ts\nconsole.log\n```";

const regex = /```(?:\w+)?\n([\s\S]*?)```/g
let match;
let i = 1;
while ((match = regex.exec(output)) !== null) {
  let content = match[1];
  let path = `file_${i}.txt`;
  const blockHeader = output.substring(match.index, match.index + 20);
  console.log(`Match ${i}: blockHeader='${blockHeader.replace(/\n/g, '\\n')}' length=${content.length}`);
  i++;
}
