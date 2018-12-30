const fs = require('fs-extra');
const path = require('path');
const minimatch = require('minimatch');
const XXHash = require('xxhashjs');

const DEFAULT_EXCLUDE_FILE_NAME = 'cache.exclude';
const CACHE_LIFETIME = 1; // in days
const HASH_SEED = 0xE1EC791C;
const MAX_FILENAME_LENGTH = 250;


class WebFileCache {
  constructor(fileName = '') {
    this.useCache = true;
    this.cacheDirPrivate = `.${path.sep}.cache`;
    this.excludeListPrivate = [];
    this.outdateTime = CACHE_LIFETIME * 86400000; // precalc milliseconds in one day
    this.excludeListName = fileName;
  }

  /**
   * Transform url or github link to path and filename
   * It is important, that path and filename are unique,
   * because collision can break the build
   * @param {string} link link to the file
   * @return {string} folder and name, where cache file can be found
   * @private
   */
  getCachedPath(link) {
    let modifiedLink = link.replace(/:\/\//, '#'); // replace '://' for '#' in url
    modifiedLink = modifiedLink.replace(/\//g, '-'); // replace '/' for '-'
    const parts = modifiedLink.match(/^([^?]*)(\?(.*))?$/); // delete get parameters from url
    if (parts && parts[3]) {
      modifiedLink = parts[1] + XXHash.h64(parts[3], HASH_SEED);
    }
    if (modifiedLink.length > MAX_FILENAME_LENGTH) {
      const startPart = modifiedLink.substr(0, 100);
      const endPart = modifiedLink.substr(modifiedLink.length - 100);
      const middlePart = XXHash.h64(modifiedLink, HASH_SEED);
      modifiedLink = startPart + endPart + middlePart;
    }
    return path.join(this.cacheDir, modifiedLink);
  }

  /**
   * Create all subfolders and write file to them
   * @param {string} path path to the file
   * @param {string} content content of the file
   * @private
   */
  cacheFile(filePath, content) {
    const cachedPath = this.getCachedPath(filePath);
    try {
      fs.ensureDirSync(path.dirname(cachedPath));
      fs.writeFileSync(cachedPath, content);
    } catch (err) {
      // did not fail if something goes wrong with cache
      console.error(err);
    }
  }

  /**
   * Check, is file exist by link and return path if exist
   * @param {{dirPath : string, fileName : string} | false} link link to the file
   * @return {string|false} result
   */
  findFile(link) {
    const finalPath = this.getCachedPath(link);
    return fs.existsSync(finalPath) ? finalPath : false;
  }

  /**
   * Check, has file to be excluded from cache
   * @param {string} path to the file
   * @return {boolean} result
   */
  isExcludedFromCache(includedPath) {
    return this.excludeListPrivate.some(regexp => regexp.test(includedPath));
  }

  /**
   * Check, should file be cached
   * @param {string} includePath to the file
   * @return {boolean} result
   */
  toBeCached(includePath) {
    return this.useCache && !this.isExcludedFromCache(includePath);
  }

  readCachedFile(includePath) { // eslint-disable-line class-methods-use-this
    return fs.readFileSync(includePath, 'utf-8');
  }

  /**
   * Check, is file outdated
   * @param {string} path to the file
   * @return {boolean} result
   */
  isCacheFileOutdate(pathname) {
    const stat = fs.statSync(pathname);
    return Date.now() - stat.mtime > this.outdateTime;
  }

  /**
   * Read includePath and use cache if needed
   * @param {function} reader reader
   * @param {string} includePath link to the source
   * @return {string} content of cached file
   * @private
   */
  read(loadFunction, includePath) {
    let readFunction = loadFunction;
    let includedPath = includePath;
    let needCache = false;
    if (this.toBeCached(includePath)) {
      const result = this.findFile(includePath);
      if (result && !this.isCacheFileOutdate(result)) {
        // includedPath reader to local reader
        includedPath = result;
        readFunction = this.readCachedFile;
      } else {
        needCache = true;
      }
    }

    const content = readFunction(includedPath);

    if (needCache && this.useCache) {
      this.cacheFile(includePath, content);
    }
    return content;
  }

  clearCache() {
    fs.removeSync(this.cacheDir);
  }

  set cacheDir(value) {
    this.cacheDirPrivate = value.replace(/\//g, path.sep);
  }

  get cacheDir() {
    return this.cacheDirPrivate;
  }

  /**
   * Construct exclude regexp list from filename
   * @param {string} name of exclude file. '' for default
   */
  set excludeList(fileName = DEFAULT_EXCLUDE_FILE_NAME) {
    const newPath = fileName;
    // check is fileName exist
    if (!fs.existsSync(newPath)) {
      if (fileName === DEFAULT_EXCLUDE_FILE_NAME) {
        // if it isn't exist and it is default, then put empty list
        this.excludeListPrivate = [];
        return;
      }
      throw new Error(`${newPath} file does not exist`);
    }

    const content = fs.readFileSync(newPath, 'utf8');
    const filenames = content.split(/\n|\r\n/);
    // filters not empty strings, and makes regular expression from template
    const patterns = filenames.map(value => value.trimLeft()) // trim for "is commented" check
      .filter(value => (value !== '' && value[0] !== '#'))
      .map(value => minimatch.makeRe(value));
    this.excludeListPrivate = patterns;
  }
}

module.exports = WebFileCache;
