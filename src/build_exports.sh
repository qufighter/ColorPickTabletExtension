#!/bin/sh

cat options_prefs.js | awk -f build_exports.awk > EXPORT_options_prefs.js
cat options_prefs_helpers.js | awk -f build_exports.awk > EXPORT_options_prefs_helpers.js


echo "EXPORT_ versions of common js files created!!!"
