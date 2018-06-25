'use strict';

const fs = require('fs-extra');
const path = require('path');
const minimatch = require('minimatch');
const XXHash = require('xxhashjs');

const DEFAULT_EXCLUDE_FILE_NAME = 'cache.exclude';
const CACHE_LIFETIME = 1; // in days
const HASH_SEED = 0xE1EC791C;
const MAX_FILENAME_LENGTH = 250;


class FileCache {

  constructor(fileName = '') {
    this._useCache = true;
    this._cacheDir = '.' + path.sep + '.cache';
    this._excludeList = [];
    this._outdateTime = CACHE_LIFETIME * 86400000; // precalc milliseconds in one day
    this.excludeList = fileName;
  }

  /**
   * Transform url or github link to path and filename
   * It is important, that path and filename are unique,
   * because collision can break the build
   * @param {string} link link to the file
   * @return {string} folder and name, where cache file can be found
   * @private
   */
  _getCachedPath(link) {
    link = link.replace(/^github\:/, 'github#'); // replace ':' for '#' in github protocol
    link = link.replace(/\:\/\//, '#'); // replace '://' for '#' in url
    link = link.replace(/\//g, '-'); // replace '/' for '-'
    const parts = link.match(/^([^\?]*)(\?(.*))?$/); // delete get parameters from url
    if (parts && parts[3]) {
      link = parts[1] + XXHash.h64(parts[3], HASH_SEED);
    }
    if (link.length > MAX_FILENAME_LENGTH) {
      const startPart = link.substr(0, 100);
      const endPart = link.substr(link.length - 100);
      const middlePart = XXHash.h64(link, HASH_SEED);
      link = startPart + endPart + middlePart;
    }
    return path.join(this._cacheDir, link);
  }

  /**
   * Create all subfolders and write file to them
   * @param {string} path path to the file
   * @param {string} content content of the file
   * @private
   */
  _cacheFile(filePath, content) {
    const cachedPath = this._getCachedPath(filePath);
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
  _findFile(link) {
    const finalPath = this._getCachedPath(link);
    return fs.existsSync(finalPath) ? finalPath : false;
  }

  /**
   * Check, has file to be excluded from cache
   * @param {string} path to the file
   * @return {boolean} result
   */
  _isExcludedFromCache(includedPath) {
    return this._excludeList.some((regexp) => regexp.test(includedPath));
  }

  /**
   * Check, should file be cached
   * @param {string} includePath to the file
   * @return {boolean} result
   */
  _toBeCached(includePath) {
    return this.useCache && !this._isExcludedFromCache(includePath);
  }

  _readCachedFile(includePath) {
    return fs.readFileSync(includePath, 'utf-8');
  }

  /**
   * Check, is file outdated
   * @param {string} path to the file
   * @return {boolean} result
   */
  _isCacheFileOutdate(pathname) {
    const stat = fs.statSync(pathname);
    return Date.now() - stat.mtime > this._outdateTime;
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
    let needCache = false;
    if (this._toBeCached(includePath)) {
        let result;
        if ((result = this._findFile(includePath)) && !this._isCacheFileOutdate(result)) {
          // change reader to local reader
          includePath = result;
          // this.machine.logger.info(`Read source from local path "${includePath}"`);
          readFunction = this._readCachedFile;
        } else {
          needCache = true;
        }
    }

    let content = readFunction(includePath);

    if (needCache && this.useCache) {
      console.log(`Caching file "${includePath}"`);
      this._cacheFile(includePath, content);
    }
    return content;
  }

  clearCache() {
    fs.removeSync(this.cacheDir);
  }

  /**
   * Use cache?
   * @return {boolean}
   */
  get useCache() {
    return this._useCache || false;
  }

  /**
   * @param {boolean} value
   */
  set useCache(value) {
    this._useCache = value;
  }

  set cacheDir(value) {
    this._cacheDir = value.replace(/\//g, path.sep);
  }

  get cacheDir() {
    return this._cacheDir;
  }

  get excludeList() {
    return this._excludeList;
  }

  /**
   * Construct exclude regexp list from filename
   * @param {string} name of exclude file. '' for default
   */
  set excludeList(fileName) {
    if (fileName == '') {
      fileName = DEFAULT_EXCLUDE_FILE_NAME;
    }

    const newPath = fileName;
    // check is fileName exist
    if (!fs.existsSync(newPath)) {
      if (fileName == DEFAULT_EXCLUDE_FILE_NAME) {
        // if it isn't exist and it is default, then put empty list
        this._excludeList = [];
        return;
      } else {
        throw new Error(`${newPath} file does not exist`);
      }
    }

    const content = fs.readFileSync(newPath, 'utf8');
    const filenames = content.split(/\n|\r\n/);
    // filters not empty strings, and makes regular expression from template
    const patterns = filenames.map((value) => value.trimLeft()) // trim for "is commented" check
      .filter((value) => (value != '' && value[0] != '#'))
      .map((value) => minimatch.makeRe(value));
    this._excludeList = patterns;
  }
}

module.exports = FileCache;
