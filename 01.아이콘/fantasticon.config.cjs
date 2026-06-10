module.exports = {
  inputDir: './svg/output-optimize',
  outputDir: './svg/output-font',
  name: 'icon',
  prefix: 'icon',
  fontTypes: ['woff2', 'woff'],
  assetTypes: ['css', 'scss', 'html', 'json'],
  fontsUrl: '.',
  normalize: true,
  round: 10e12,
  templates: {
    css: './fantasticon.css.hbs',
    scss: './fantasticon.scss.hbs'
  }
};
