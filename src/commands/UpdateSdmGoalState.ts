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
    AutomationContextAware,
    CommandHandler,
    HandleCommand,
    HandlerContext,
    HandlerResult,
    MappedParameter,
    MappedParameters,
    Parameter,
    Tags,
} from "@atomist/automation-client";
import { QueryNoCacheOptions } from "@atomist/automation-client/spi/graph/GraphClient";
import { addressEvent } from "@atomist/automation-client/spi/message/MessageClient";
import * as _ from "lodash";
import { SdmGoalById } from "../typings/types";

/**
 * Update SDM goal.
 */
@CommandHandler("Update SDM goal")
@Tags("sdm goal", "update")
export class UpdateSdmGoalState implements HandleCommand {

    @Parameter({ description: "id", pattern: /^.*$/, required: true })
    public id: string;

    @Parameter({ description: "state", pattern: /^.*$/, required: true })
    public state: "success" | "requested";

    @MappedParameter(MappedParameters.SlackUserName, false)
    public slackRequester: string;

    @MappedParameter(MappedParameters.GitHubUserLogin, false)
    public githubRequester: string;

    @MappedParameter(MappedParameters.SlackTeam, false)
    public teamId: string;

    @MappedParameter(MappedParameters.SlackChannel, false)
    public channel: string;

    public async handle(ctx: HandlerContext): Promise<HandlerResult> {

        const goalResult = await ctx.graphClient.query<SdmGoalById.Query, SdmGoalById.Variables>({
            name: "sdmGoalById",
            variables: {
                id: this.id,
            },
            options: QueryNoCacheOptions,
        });

        const goal = _.cloneDeep(goalResult.SdmGoal[0]);
        const actx = ctx as any as AutomationContextAware;

        const prov: SdmGoalById.Provenance = {
            name: actx.context.operation,
            registration: actx.context.name,
            version: actx.context.version,
            correlationId: actx.context.correlationId,
            ts: Date.now(),
            channelId: this.channel,
            userId: this.slackRequester ? this.slackRequester : this.githubRequester,
        };

        goal.provenance = [
            ...goal.provenance,
            prov,
        ];

        // Don't set approval for restart updates
        if (this.state === "success") {
            goal.approval = prov;
        }

        goal.state = this.state;
        goal.ts = Date.now();
        delete goal.id;

        return ctx.messageClient.send(goal, addressEvent("SdmGoal"));
    }
}
