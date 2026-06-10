const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execFileSync } = require('child_process');

const baseDir = path.resolve(__dirname, '..');
const outputDir = path.join(baseDir, 'svg', 'output-font');
const inputDir = path.join(baseDir, 'svg', 'output-optimize');
const fantasticonBin = path.join(baseDir, 'node_modules', '.bin', 'fantasticon');
const generatedHtml = path.join(outputDir, 'icon.html');
const demoHtml = path.join(outputDir, 'demo.html');
const fontJsonPath = path.join(outputDir, 'icon.json');
const mixinScssPath = path.join(outputDir, 'icon-mixin.scss');
const fontFiles = ['icon.woff2', 'icon.woff'];

if (!fs.existsSync(inputDir)) {
  execFileSync('npm', ['run', 'build:svgs'], {
    cwd: baseDir,
    stdio: 'inherit',
  });
}

fs.rmSync(outputDir, { recursive: true, force: true });
fs.mkdirSync(outputDir, { recursive: true });

execFileSync(fantasticonBin, ['--config', 'fantasticon.config.cjs'], {
  cwd: baseDir,
  stdio: 'inherit',
});

if (fs.existsSync(generatedHtml)) {
  fs.renameSync(generatedHtml, demoHtml);
}

if (fs.existsSync(demoHtml)) {
  const html = fs.readFileSync(demoHtml, 'utf8')
    .replace('<title>icon</title>', '<title>Icon Fonts</title>')
    .replace('<h1>icon</h1>', '<h1>Icon Fonts</h1>');
  fs.writeFileSync(demoHtml, html);
}

if (fs.existsSync(fontJsonPath)) {
  const codepoints = JSON.parse(fs.readFileSync(fontJsonPath, 'utf8'));
  const entries = Object.entries(codepoints);
  const versionSource = fontFiles
    .map((fileName) => fs.readFileSync(path.join(outputDir, fileName)))
    .reduce((acc, buffer) => acc.update(buffer), crypto.createHash('md5'))
    .digest('hex');
  for (const fileName of ['icon.css', 'icon.scss']) {
    const filePath = path.join(outputDir, fileName);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8').replace(/\?[a-f0-9]{32}/g, `?${versionSource}`);
      fs.writeFileSync(filePath, content);
    }
  }
  const fontSrc = [
    `url("./icon.woff2?${versionSource}") format("woff2")`,
    `url("./icon.woff?${versionSource}") format("woff")`,
  ].join(',\n    ');

  const mapLines = entries
    .map(([name, codepoint]) => `    "${name}": "\\${codepoint.toString(16)}",`)
    .join('\n');

  const mixinLines = [
    '$icon-font: "icon";',
    '',
    '@font-face {',
    '    font-family: $icon-font;',
    '    src: ' + fontSrc + ';',
    '}',
    '',
    '.icon {',
    '    font-family: $icon-font !important;',
    '    font-style: normal;',
    '    font-weight: normal !important;',
    '    font-variant: normal;',
    '    text-transform: none;',
    '    line-height: 1;',
    '    -webkit-font-smoothing: antialiased;',
    '    -moz-osx-font-smoothing: grayscale;',
    '}',
    '',
    '$icon-map: (',
    mapLines,
    ');',
    '',
    '@mixin icon($icon, $position: before) {',
    '    &::#{$position} {',
    '        @if map-has-key($icon-map, $icon) {',
    '            content: map-get($icon-map, $icon);',
    '        } @else {',
    '            @warn "Unknown icon `#{$icon}`";',
    '        }',
    '    }',
    '}',
    '',
  ];

  fs.writeFileSync(mixinScssPath, mixinLines.join('\n'));
}

if (fs.existsSync(demoHtml)) {
  const demoStyle = `
    <style>
    </style>`;

  const html = fs.readFileSync(demoHtml, 'utf8')
    .replace('</head>', `${demoStyle}\n</head>`)
    .replace('<title>icon</title>', '<title>Icon Fonts</title>')
    .replace('<h1>icon</h1>', '<h1>Icon Fonts</h1>');
  fs.writeFileSync(demoHtml, html);
}
