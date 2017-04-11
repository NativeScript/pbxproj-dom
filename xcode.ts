import * as parser from "./parser";
import * as pbx from "./pbx";
import * as fs from "fs";

export interface ManualSigning {
    team: string;
    uuid: string;
    name: string;
    identity?: "iPhone Developer" | "iPhone Distribution" | string;
}

export interface AutomaticSigning {
    team: string;
}

/**
 * Facade encapsulating common Xcode interractions.
 */
export class Xcode {
    /**
     * Readonly, pbx project dom.
     */
    public document: pbx.Document;

    /**
     * Readonly, project file path.
     */
    public path: string;

    /**
     * Opens an existing Xcode project file.
     */
    public static open(path: string): Xcode {
        const xcode = new Xcode();
        xcode.document = pbx.parse(parser.parse(fs.readFileSync(path).toString()));
        xcode.path = path;
        return xcode;
    }

    /**
     * Save the project back to the project file.
     */
    public save() {
        fs.writeFileSync(this.path, this.toString(), { encoding: 'utf8' });
    }

    /**
     * Sets Manual signing style for a target in the pbx.Document.
     */
    setManualSigningStyle(targetName: string, {team, uuid, name, identity}: ManualSigning = { team: undefined, uuid: undefined, name: undefined }) {
        this.document.projects.forEach(project => {
            let targets = project.targets.filter(target => target.name === targetName);
            if (targets.length > 0) {
                project.buildConfigurationsList.buildConfigurations.forEach(config =>
                    config.patch({ buildSettings: { "CODE_SIGN_IDENTITY[sdk=iphoneos*]": identity } })
                );
                targets.forEach(target => {
                    project.patch({
                        attributes: {
                            TargetAttributes: {
                                [target.key]: {
                                    DevelopmentTeam: team,
                                    ProvisioningStyle: "Manual"
                                }
                            }
                        }
                    });
                    target.buildConfigurationsList.buildConfigurations.forEach(config => {
                        config.patch({
                            buildSettings: {
                                "CODE_SIGN_IDENTITY[sdk=iphoneos*]": identity /* delete or set the CODE_SIGN_IDENTITY[sdk=iphoneos*] */,
                                DEVELOPMENT_TEAM: team,
                                PROVISIONING_PROFILE: uuid,
                                PROVISIONING_PROFILE_SPECIFIER: name
                            }
                        });
                    });
                });
            }
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
                            DEVELOPMENT_TEAM: developmentTeam,
                            PROVISIONING_PROFILE: undefined,
                            PROVISIONING_PROFILE_SPECIFIER: undefined
                        }
                    });
                });
            });
    }

    /**
     * Read the signing configuration for a target.
     */
    getSigning(targetName: string): { style: "Automatic", team: string } | { style: "Manual", configurations: { [config: string]: ManualSigning } } | undefined {
        for (let project of this.document.projects) {
            for (let target of project.targets) {
                if (target.name === targetName) {
                    const targetAttributes = project.ast.get("attributes").get("TargetAttributes").get(target.key);

                    const style = targetAttributes.get("ProvisioningStyle").text;
                    const team = targetAttributes.get("DevelopmentTeam").text;

                    if (style === "Automatic") {
                        return { style, team };
                    } else if (style === "Manual") {
                        const configurations: { [config: string]: ManualSigning } = {};
                        for (let config of target.buildConfigurationsList.buildConfigurations) {
                            const buildSettings = config.ast.get("buildSettings");
                            const uuid = buildSettings.get("PROVISIONING_PROFILE").text;
                            const name = buildSettings.get("PROVISIONING_PROFILE_SPECIFIER").text;
                            const identity = buildSettings.get("CODE_SIGN_IDENTITY[sdk=iphoneos*]").text;
                            const team = buildSettings.get("DEVELOPMENT_TEAM").text;

                            configurations[config.name] = { uuid, name, identity, team };
                        }
                        return { style, configurations };
                    } else {
                        return undefined;
                    }
                }
            }
        }
        return undefined;
    }

    /**
     * Serializes the project back to string format.
     */
    toString() {
        return this.document.toString();
    }
}
