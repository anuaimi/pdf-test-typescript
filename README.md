# PDF Planner Generator

## Status

The code works but has very basic functionality at the moment

## Overview

This program will generate insert pages for a weekly planner. This removes the need to buy new inserts each year.

The pages will be either A4 or letter sized and can be printed either single-sided or double-sided.  Right now only a weekly planner format is supported.

## Building

```bash
npm install
npm run build
```

the working code will be in the `.build` directory

## Usage

```bash
node .build/index.js
```

There are options for the following:

`--start-date <yyyy-mm-dd>`: what date you want insert pages from
`--months <number>`: how many months you want to print
`--single-sided`: pages will be printed as single-sided. this affects where the guides are for hole punch
`--double-sided`: pages will be printed as double-sided
