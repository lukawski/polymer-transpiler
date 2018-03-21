#!/usr/bin/env node
const program = require('commander');
const path = require('path');
const fs = require('fs');

const files = require('./src/files');
const transpile = require('./src/p');

program
  .version('1.0.0')
  .option('-p, --path [path]', 'Path in which transpiler should look for components.')
  .option('-e, --extends [extends]', 'Base clas to extend by transpiled component. Defaults to `Polymer.Element`.')
  .parse(process.argv);


const ignored = ['/demo', 'test', 'node_modules', 'bower_components', 'index', 'all-imports', 'behavior'];

const travel = (dir) => {
  fs.readdir(dir, (err, list) => {
    if (err) throw err;

    if (!list.length) return console.warn('Empty directory');

    for (let i = 0, listLen = list.length; i < listLen; i++) {
      const filePath = path.resolve(dir, list[i]);
      fs.stat(filePath, (err, stat) => {
        if (err) throw err;

        if (stat.isDirectory()) {
          travel(filePath);
        } else {
          const isIgnored = Boolean(ignored.filter(ignore => filePath.indexOf(ignore) !== -1).length);
          if (path.extname(filePath) !== '.html' || isIgnored) return;
          fs.readFile(filePath, 'utf8', (err, data) => {
            const transpiled = transpile(data, program.extends);
            if (!transpiled) {
              console.log(`${filePath} is already a class`);
              return;
            }
            fs.writeFile(filePath, transpiled, 'utf-8', (err) => console.log(`${filePath} was transpiled and saved.`));
          });
        }
      });
    }
  });
};

const userPath = program.path ? program.path : './';
travel(userPath);
