'use strict';

require('jasmine-expect');

const fs = require('fs');
const FileCache = require('../index.js');

describe('FileCache', () => {
  let fileCache;

  beforeEach(() => {
    fileCache = new FileCache();
    fileCache._cacheDir = ".test-cache";
  });

  afterEach(() => {
    if (fs.existsSync(fileCache.cacheDir)) {
      fileCache.clearCache();
    }
  });

  it('should clear cache', () => {
    const link = 'test/test1/test.txt';
    fileCache._cacheFile(link, 'hello');
    expect(fileCache._findFile(link) ? true : false).toEqual(true);
    fileCache.clearCache();
    expect(fileCache._findFile(link) ? true : false).toEqual(false);
  });

  it('should cache files', () => {
    const link = 'github:test/test1/test.txt';
    const ghRes = fileCache._getCachedPath(link);
    fileCache._cacheFile(link, 'hello');
    expect(fs.existsSync(ghRes)).toEqual(true);
  });

  it('should shorten filenames if they are longer then 256 symbols', () => {
    const longUrl = 'https://longlonglonglongurl.com/longlonglonglongurl/'
    + 'longlonglonglongurl/longlonglonglongurl/longlonglonglongurl/longlonglonglongurl/'
    + 'longlonglonglongurl/longlonglonglongurl/longlonglonglongurl/longlonglonglongurl/'
    + 'longlonglonglongurl/longlonglonglongurl/longlonglonglongurl/longlonglonglongurl/'
    + 'longlonglonglongurl/longlonglonglongurl/longesturl.js';
    expect(longUrl.length > 256).toEqual(true);
    expect(fileCache._getCachedPath(longUrl).length < 256).toEqual(true);
  });

  it('should generate unique paths for different url links', () => {
    const linksSet = new Set();
    const links = ['http://a/b/c.js',
                   'http://a/b/c.js?1',
                   'http://a/b/c.js?2',
                   'http://a/b/c.js?t=12',
                   'https://a/b/c.js',
                   'http://b/a/c.js',
                   'http://a.b/c.js',
                   'http://a.b/c.j?s=2',
                   'http://a/b/a-b-c.js',
                   'http://a/b-c_js/c.js',
                   'http://a/b/c_js.js',
                   'http://a/b/c/js',
                   'http://a.b.c/js'
                  ];
    links.forEach(link => {
      const path = fileCache._getCachedPath(link);
      expect(linksSet.has(path)).toEqual(false);
      linksSet.add(path);
    });
  });

   it('should exclude files from cache by name', () => {
    const path = __dirname + '/exclude/';
    const linkList = [
      'https://raw.githubusercontent.com/nobitlost/Builder/v2.0.0/src/AstParser.js',
      'https://raw.githubusercontent.com/nobitlost/Builder/v2.0.0/src/AstParser.js?nut=2',
      'http://raw.githubusercontent.com/nobitlost/Builder/src/AstParser.js',
      'http://raw.githubusercontent.com/nobitlost/Builder/src/AstParser.nut'
    ];

    const testFilesList = [
      'exclude-all.exclude',
      'exclude-nothing.exclude',
      'exclude-http.exclude',
      'exclude-js.exclude',
      'exclude-Builder.exclude',
      'exclude-tagged.exclude'
    ];

    const answerList = [
      /^(.*)$/,
      /^$/,
      /^http[^s](.*)$/,
      /^(.*)\.js(.*)$/,
      /^(.*)\/Builder\/(.*)$/,
      /^(.*)v\d\.\d\.\d(.*)$/
    ];

    for (let i = 0; i < testFilesList.length; i++) {
      fileCache.excludeList = path + testFilesList[i];
      linkList.forEach((link) => {
        expect(fileCache._isExcludedFromCache(link)).toEqual(answerList[i].test(link) || false);
      });
    }
  });

});
