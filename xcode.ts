import * as parser from "./parser";
import * as pbx from "./pbx";
import * as fs from "fs";

/**
 * Facade encapsulating common Xcode interractions.
 */
export class Xcode {
    public document: pbx.Document;

    public static open(path: string): Xcode {
        const xcode = new Xcode();
        xcode.document = pbx.parse(parser.parse(fs.readFileSync(path).toString()));
        return xcode;
    }

    /**
     * Sets Manual signing style for a target in the pbx.Document.
     */
    setManualSigningStyle(targetName: string) {
        this.document.targets
            .filter(target => target.name === targetName)
            .forEach(target => {
                this.document.projects
                    .filter(project => project.targets.indexOf(target) >= 0)
                    .forEach(project => {
                        project.patch({
                            attributes: {
                                TargetAttributes: {
                                    [target.key]: {
                                        DevelopmentTeam: undefined /* deletes DevelopmentTeam */,
                                        ProvisioningStyle: "Manual"
                                    }
                                }
                            }
                        });
                    });
                target.buildConfigurationsList.buildConfigurations.forEach(config => {
                    config.patch({
                        buildSettings: {
                            "CODE_SIGN_IDENTITY[sdk=iphoneos*]": undefined /* deletes the CODE_SIGN_IDENTITY[sdk=iphoneos*] */,
                            DEVELOPMENT_TEAM: ""
                        }
                    });
                });
            });
    }

    /**
     * Sets Automatic signing style for a target in the pbx.Document.
     */
    setAutomaticSigningStyle(targetName: string, developmentTeam: string) {
        this.document.targets
            .filter(target => target.name === targetName)
            .forEach(target => {
                this.document.projects
                    .filter(project => project.targets.indexOf(target) >= 0)
                    .forEach(project => {
                        project.patch({
                            attributes: {
                                TargetAttributes: {
                                    [target.key]: {
                                        DevelopmentTeam: developmentTeam,
                                        ProvisioningStyle: "Automatic"
                                    }
                                }
                            }
                        });
                    });
                target.buildConfigurationsList.buildConfigurations.forEach(config => {
                    config.patch({
                        buildSettings: {
                            "CODE_SIGN_IDENTITY[sdk=iphoneos*]": "iPhone Developer",
                            DEVELOPMENT_TEAM: developmentTeam
                        }
                    });
                });
            });
    }

    toString() {
        return this.document.toString();
    }
}
