[![Build Status](https://travis-ci.org/LevOspennikov/FileCache.svg?branch=master)](https://travis-ci.org/LevOspennikov/FileCache)

_WebFileCache_ is a Node.js tool for generalizing cache process. You can use any function that return string value as result and cache it. Especially it is useful when you need static web files and you don't want to load them everytime. Flexible settings allow you to use _WebFileCache_ while developing another application or module.  

# Usage

## Installation

Run ```npm install webfilecache```.

## Running

Main point of entry is `async read(loadFunction, includedPath)` function from `WebFileCache` class. `loadFunction` is the function with one parameter (the included path). `includedPath` is the name of included file (for example URL). Then _WebFileCache_ checks is file ignored, outdated or already cached. If it is true, `read()` function call `loadFunction(includedPath)` and cache the result. If `includedPath` already cached then result will return without call of `loadFunction`. 

## Settings 

You can enable/disable cache option by setting `useCache` variable to `true` or `false`. In case of `false` FileCache will reload files every time.

You can add `cache.exclude` file in the directory of your project for ignoring some urls and paths. Pattern matching syntax is a similar to that of `.gitignore`. A string is a wildcard pattern if it contains '?' or '*' characters. Empty strings or strings that start with '#' are ignored.



