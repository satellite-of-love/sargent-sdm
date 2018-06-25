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

import {
    ArtifactListenerRegistration,
    ToDefaultBranch,
} from "@atomist/sdm";
import { LoggingProgressLog } from "@atomist/sdm/api-helper/log/LoggingProgressLog";
import {
    asSpawnCommand,
    spawnAndWatch,
} from "@atomist/sdm/api-helper/misc/spawned";

export const OWASPDependencyCheck: ArtifactListenerRegistration = {
    name: "OWASP dependency check",
    pushTest: ToDefaultBranch,
    action: async ali => {
        const command = `dependency-check --project ${ali.deployableArtifact.name} --out . --scan ${ali.deployableArtifact.filename} -f JSON`;
        await spawnAndWatch(
            asSpawnCommand(command),
            {
                cwd: ali.deployableArtifact.cwd,
            },
            new LoggingProgressLog(command),
        );
        await ali.addressChannels(`Dependency check success`);
        // const json = fs.readFileSync(`${ali.deployableArtifact.cwd}/dependency-check-report.json`).toString();
        // await ali.addressChannels(json);
    },
};
