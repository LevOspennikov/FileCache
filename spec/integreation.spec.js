'use strict';

require('jasmine-expect');

const fs = require('fs');
const FileCache = require('../index.js');

describe('FileCache', () => {
  let fileCache;

  beforeEach(() => {
    fileCache = new FileCache();
    fileCache.cacheDir = '.test-cache';
  });

  afterEach(() => {
    if (fs.existsSync(fileCache.cacheDir)) {
      fileCache.clearCache();
    }
  });

  it('should cache file', async () => {
    const link = 'file/files/cache';
    await fileCache.read((x) => '1', link);
    expect(fileCache.findFile(link) ? true : false).toEqual(true);
    expect(await fileCache.read(x => '2', link)).toEqual('1');
  });

  it('should cache files with similar names', async () => {
    const link = 'file/files/cache';
    const similarLink = 'file/files/cachee';
    await fileCache.read((x) => '1', link);
    await fileCache.read((x) => '2', similarLink);
    expect(fileCache.findFile(link) ? true : false).toEqual(true);
    expect(await fileCache.read((x) => '2', link)).toEqual('1');
    expect(fileCache.findFile(similarLink) ? true : false).toEqual(true);
    expect(await fileCache.read((x) => '1', similarLink)).toEqual('2');
  });

  it('shouldn\'t cache file, when cache is off', async () => {
    fileCache.useCache = false;
    const link = 'file/files/cache';
    fileCache.read((x) => '1', link);
    expect(fileCache.findFile(link) ? true : false).toEqual(false);
    expect(await fileCache.read((x) => '2', link)).toEqual('2');
  });
});
