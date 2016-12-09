Parser and DOM over the xcode pbxproj

[![Build Status](https://travis-ci.org/PanayotCankov/pbxproj-dom.svg?branch=master)](https://travis-ci.org/PanayotCankov/pbxproj-dom)

Sample usage:

```
import { Xcode } from "pbxproj-dom/xcode";

const xcode = Xcode.open(pbxprojPath);
xcode.setManualSigningStyle("MyAppTarget");
xcode.save();
```
