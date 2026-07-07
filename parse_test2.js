const output = "```markdown\n## Change manifest\n### file1\n```tsx\nimport x\n```\n```";

const regex = /```(?:\w+)?\n([\s\S]*?)```/g
let match;
let i = 1;
while ((match = regex.exec(output)) !== null) {
  let content = match[1];
  let path = `file_${i}.txt`;
  console.log(`Match ${i}: content='${content.replace(/\n/g, '\\n')}'`);
  i++;
}
