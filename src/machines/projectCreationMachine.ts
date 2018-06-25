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
import { SoftwareDeliveryMachine } from "@atomist/sdm";
import { createSoftwareDeliveryMachine } from "@atomist/sdm-core";
import { tagRepo } from "@atomist/sdm-core";
import {
    CommonJavaGeneratorConfig,
    springBootGenerator,
    springBootTagger,
} from "@atomist/sdm-pack-spring";
import { SoftwareDeliveryMachineConfiguration } from "@atomist/sdm/api/machine/SoftwareDeliveryMachineOptions";
import {
    CommonGeneratorConfig,
    nodeGenerator,
} from "../pack/node/generators/nodeGenerator";

/**
 * Assemble a machine that performs only project creation and tagging,
 * for Spring/Java and Node.
 * See generatorConfig.ts to customize generation defaults.
 * @return {SoftwareDeliveryMachine}
 */
export function projectCreationMachine(
                                       configuration: SoftwareDeliveryMachineConfiguration): SoftwareDeliveryMachine {
    const sdm = createSoftwareDeliveryMachine({name: "Project creation machine", configuration});
    sdm.addGenerators(
        springBootGenerator({
            ...CommonJavaGeneratorConfig,
            seed: () => new GitHubRepoRef("spring-team", "spring-rest-seed"),
        }, { intent: "create spring",
        }),
        nodeGenerator({
            ...CommonGeneratorConfig,
            seed: () => new GitHubRepoRef("spring-team", "typescript-express-seed"),
        }, {  intent: "create node",
        }),
        nodeGenerator({
            ...CommonGeneratorConfig,
            seed: () => new GitHubRepoRef("spring-team", "minimal-node-seed"),
        }, {   intent: "create minimal node",
        }))
        .addNewRepoWithCodeActions(
            tagRepo(springBootTagger),
        );
    return sdm;
}
