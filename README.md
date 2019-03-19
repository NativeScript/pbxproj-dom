Parser and DOM over the xcode pbxproj

[![Build Status](https://travis-ci.org/NativeScript/pbxproj-dom.svg?branch=master)](https://travis-ci.org/NativeScript/pbxproj-dom)

Sample usage:

```
import { Xcode } from "pbxproj-dom/xcode";

const xcode = Xcode.open(pbxprojPath);
xcode.setManualSigningStyle("MyAppTarget");
xcode.save();
```

The ultimate goal would be one day the module to support a JavaScript API for Xcode modifications similar to the Cocoapods ruby:
```
post_install do |installer|
 installer.pods_project.targets.each do |target|
   target.build_configurations.each do |config|
     config.build_settings['SWIFT_VERSION'] = '3.0'
   end
 end
end
```
