[![Build Status](https://travis-ci.org/LevOspennikov/FileCache.svg?branch=master)](https://travis-ci.org/LevOspennikov/FileCache)

_WebFileCache_ is a Node.js tool for generalizing cache process. You can use any function that return string value as result and cache it. Especially it is useful when you need static web files and you don't want to load them everytime. Flexible settings allow you to use _WebFileCache_ while developing another application or module.  

#### Current version: 1.0.0

# Usage

## Installation

Run ```npm install webfilecache```.

## Running

Main point of entry is `read(loadFunction, includedPath)` function from `WebFileCache` class. `loadFunction` is the function with one parameter (the included path). `includedPath` is the name of included file (for example URL). Then _WebFileCache_ checks if file doesn't ignored, outdated or already cached, and incase of true `read()` function call `loadFunction(includedPath)` and cache result. If `includedPath` already cached then result is returned without `loadFunction` call. 

## Settings 

You can enable/disable cache option by assigning `useCache` variable `true` or `false` value. In case of `false` FileCache will reload files evetytime.

You can add `cache.exclude` file in the directory of your project for ignoring some urls and paths. Pattern matching syntax is a similar to that of `.gitignore`. A string is a wildcard pattern if it contains '?' or '*' characters. Empty strings or strings that starts with '#' are ignored.



