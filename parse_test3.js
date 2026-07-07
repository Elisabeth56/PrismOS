function parseFiles(output) {
  let cleanOutput = output.trim();
  const outerBlockRegex = /^```(?:markdown)?\s*\n([\s\S]*)\n```$/i;
  const matchOuter = cleanOutput.match(outerBlockRegex);
  if (matchOuter) {
    cleanOutput = matchOuter[1];
  }

  const files = [];
  const regex = /```(?:\w+)?\n([\s\S]*?)```/g;
  let match;
  let i = 1;
  let lastIndex = 0;

  while ((match = regex.exec(cleanOutput)) !== null) {
    let content = match[1];
    let path = `file_${i}.txt`;
    
    const precedingText = cleanOutput.substring(lastIndex, match.index);
    lastIndex = regex.lastIndex;

    const pathRegex = /(?:`|\b)([a-zA-Z0-9_\-\.\/]+\.[a-zA-Z0-9]+)(?:`|\b)/g;
    let pathMatch;
    let foundPath = null;
    while ((pathMatch = pathRegex.exec(precedingText)) !== null) {
      const p = pathMatch[1];
      if (p.includes('/') || ['tsx', 'ts', 'py', 'js', 'jsx', 'css', 'html'].some(ext => p.endsWith('.' + ext))) {
        foundPath = p;
      }
    }
    if (foundPath) path = foundPath;

    if (path.startsWith('file_')) {
      const firstLine = content.split('\n')[0].trim()
      if (firstLine.includes('.') && (firstLine.startsWith('//') || firstLine.startsWith('#') || firstLine.startsWith('/*'))) {
        const possibleName = firstLine.replace(/[\/\/#*]/g, '').trim()
        if (possibleName && possibleName.includes('.')) {
          path = possibleName
          content = content.substring(content.indexOf('\n') + 1)
        }
      } else if (firstLine.startsWith('// src/') || firstLine.startsWith('// app/')) {
          path = firstLine.replace('//', '').trim()
          content = content.substring(content.indexOf('\n') + 1)
      } else {
          const blockHeader = cleanOutput.substring(match.index, match.index + 20)
          if (blockHeader.includes('typescript') || blockHeader.includes('ts')) path = `file_${i}.ts`
          else if (blockHeader.includes('tsx')) path = `file_${i}.tsx`
          else if (blockHeader.includes('javascript') || blockHeader.includes('js')) path = `file_${i}.js`
          else if (blockHeader.includes('python') || blockHeader.includes('py')) path = `file_${i}.py`
      }
    }
    
    files.push({ path, content: content.trim() })
    i++
  }

  if (files.length === 0) {
    return [{ path: 'implementation.txt', content: cleanOutput }]
  }
  return files;
}

const mockOutput = "```markdown\n## Change manifest\n### `src/components/Button.tsx` [NEW]\n```tsx\nimport React from 'react';\n```\n### `src/utils.ts`\n```ts\nconsole.log(1)\n```\n```";
console.log(parseFiles(mockOutput));
