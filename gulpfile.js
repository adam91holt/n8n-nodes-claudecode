const { src, dest } = require('gulp');

exports['build:icons'] = () => {
  return src('nodes/**/*.svg')
    .pipe(dest('dist/nodes'));
};