const fs = require('fs');
const path = require('path');

module.exports = {
  isDirectory(path) {
    // return new Promise((resolve, reject) => {
    //   fs.stat(path, (err, stats) => {
    //     if (err) reject(err);
    //     resolve(stats.isDirectory());
    //   });
    // });
    return fs.statSync(path).isDirectory();
  },

  readDir(path) {
    return new Promise((resolve, reject) => {
      fs.readdir(path, (err, files) => {
        if (err) reject(err);
        resolve(files);
      });
    });
  },

  readFile(path) {
    return new Promise((resolve, reject) => {
      fs.readFile(path, 'utf-8', (err, data) => {
        if (err) reject(err);
        resolve(data);
      });
    });
  },

  writeFile(path, data) {
    return new Promise((resolve, reject) => {
      fs.writeFile(path, data, (err) => {
        if (err) reject(err);
        resolve(true);
      });
    });
  },

  filterByExt(ext = '.html', files = []) {
    return files.filter(file => path.extname(file) === ext);
  }
}
