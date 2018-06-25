/*
 * Copyright © 2018 Atomist, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { GitHubRepoRef } from "@atomist/automation-client/operations/common/GitHubRepoRef";
import {
    ExtensionPack,
    hasFile,
    SoftwareDeliveryMachine,
    ToDefaultBranch,
} from "@atomist/sdm";

import * as build from "@atomist/sdm/api-helper/dsl/buildDsl";

import { nodeBuilder } from "@atomist/sdm-core";
import { IsNode } from "@atomist/sdm-core";
import { PackageLockFingerprinter } from "@atomist/sdm-core";
import { tslintFix } from "@atomist/sdm-core";
import { AddAtomistTypeScriptHeader } from "../../autofix/addAtomistHeader";
import { CommonTypeScriptErrors } from "../../reviewer/typescript/commonTypeScriptErrors";
import { DontImportOwnIndex } from "../../reviewer/typescript/dontImportOwnIndex";
import { AddBuildScript } from "./autofix/addBuildScript";
import {
    CommonGeneratorConfig,
    nodeGenerator,
} from "./generators/nodeGenerator";

/**
 * Add configuration common to Node SDMs, wherever they deploy
 * @param {SoftwareDeliveryMachine} sdm
 * @param options config options
 */
export const NodeSupport: ExtensionPack = {
    name: "Node support",
    vendor: "Atomist",
    version: "0.1.0",
    configure: (sdm: SoftwareDeliveryMachine) => {
        const hasPackageLock = hasFile("package-lock.json");

        sdm.addGenerators(nodeGenerator({
            ...CommonGeneratorConfig,
            seed: () => new GitHubRepoRef("spring-team", "typescript-express-seed"),
        }, { intent: "create node",
        }));
        sdm.addGenerators(nodeGenerator({
            ...CommonGeneratorConfig,
            seed: () => new GitHubRepoRef("atomist", "sdm"),
        }, { intent: "copy sdm",
        }))
            .addGenerators(nodeGenerator({
                ...CommonGeneratorConfig,
                seed: () => new GitHubRepoRef("spring-team", "minimal-node-seed"),
            }, {    intent: "create minimal node",
            }))
            .addGenerators(nodeGenerator({
                ...CommonGeneratorConfig,
                seed: () => new GitHubRepoRef("spring-team", "buildable-node-seed"),
            }, {   intent: "create buildable node",
            }))
            .addAutofixes(
                AddAtomistTypeScriptHeader,
                tslintFix,
                AddBuildScript,
            )
            .addReviewerRegistrations(
                CommonTypeScriptErrors,
                DontImportOwnIndex,
            )
            .addFingerprinterRegistrations(new PackageLockFingerprinter())
            .addBuildRules(
                build.when(IsNode, ToDefaultBranch, hasPackageLock)
                    .itMeans("npm run build")
                    .set(nodeBuilder(sdm.configuration.sdm.projectLoader, "npm ci", "npm run build")),
                build.when(IsNode, hasPackageLock)
                    .itMeans("npm run compile")
                    .set(nodeBuilder(sdm.configuration.sdm.projectLoader, "npm ci", "npm run compile")),
                build.when(IsNode, ToDefaultBranch)
                    .itMeans("npm run build - no package lock")
                    .set(nodeBuilder(sdm.configuration.sdm.projectLoader, "npm i", "npm run build")),
                build.when(IsNode)
                    .itMeans("npm run compile - no package lock")
                    .set(nodeBuilder(sdm.configuration.sdm.projectLoader, "npm i", "npm run compile")));

    },
};
