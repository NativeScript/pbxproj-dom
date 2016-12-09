Parser and DOM over the xcode pbxproj

Sample usage:

```
import { Xcode } from "pbxproj-dom/xcode";

const xcode = Xcode.open(pbxprojPath);
xcode.setManualSigningStyle("MyAppTarget");
xcode.save();
```
