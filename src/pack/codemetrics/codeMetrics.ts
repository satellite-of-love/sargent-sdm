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

import { logger } from "@atomist/automation-client";
import { RemoteRepoRef } from "@atomist/automation-client/operations/common/RepoId";
import {
    ExtensionPack,
    FingerprinterRegistration,
    FingerprintListener,
    PushTest,
    SoftwareDeliveryMachine,
} from "@atomist/sdm";
import {
    CodeStats,
    reportForLanguages,
} from "@atomist/sdm-pack-sloc/slocReport";
import { TypedFingerprint } from "@atomist/sdm/api-helper/code/fingerprint/TypedFingerprint";

const CodeMetricsFingerprintName = "CodeMetrics";

/**
 * Add this registration to a machine
 * @param publisher listener that will publish relevant fingerprints
 */
export function codeMetrics(publisher: FingerprintListener,
                            pushTest?: PushTest): ExtensionPack {
    return {
        name: CodeMetricsFingerprintName,
        vendor: "Atomist",
        version: "0.1.0",
        configure: addCodeMetrics(publisher, pushTest),
    };
}

export interface CodeMetrics {
    project: { url: string, owner: string, repo: string, branch: string };
    timestamp: string;
    languages: CodeStats[];

    totalFiles: number;

    /**
     * Lines recognized
     */
    lines: number;
    files: number;
}

function lineCounter(pushTest: PushTest): FingerprinterRegistration {
    return {
        name: CodeMetricsFingerprintName,
        pushTest,
        action: async pu => {
            const report = await reportForLanguages(pu.project);
            const fingerprintData: CodeMetrics = {
                project: {
                    url: (pu.project.id as RemoteRepoRef).url,
                    owner: pu.project.id.owner,
                    repo: pu.project.id.repo,
                    branch: pu.push.branch,
                },
                timestamp: pu.push.timestamp,
                languages: report.languageReports.map(r => r.stats),
                totalFiles: await pu.project.totalFileCount(),
                files: report.relevantLanguageReports
                    .map(r => r.fileReports.length)
                    .reduce((tot1, tot2) => tot1 + tot2),
                lines: report.relevantLanguageReports
                    .map(r => r.stats.total)
                    .reduce((tot1, tot2) => tot1 + tot2),
            };
            return new TypedFingerprint(CodeMetricsFingerprintName, "lc", "0.1.0", fingerprintData);
        },
    };
}

function addCodeMetrics(publisher: FingerprintListener, pushTest: PushTest) {
    return (sdm: SoftwareDeliveryMachine) => {
        sdm.addFingerprinterRegistrations(lineCounter(pushTest))
            .addFingerprintListeners(lineCountPublisher(publisher));
    };
}

/**
 * Publish the fingerprint data wherever we want
 * @return {FingerprintListener}
 */
function lineCountPublisher(publisher: FingerprintListener): FingerprintListener {
    return async fp => {
        if (fp.fingerprint.name === CodeMetricsFingerprintName) {
            return publisher(fp);
        } else {
            logger.info("Ignoring fingerprint named '%s'", fp.fingerprint.name);
        }
    };
}
