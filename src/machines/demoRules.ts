import { dryRunEditorCommand } from "@atomist/sdm-core/pack/dry-run/dryRunEditorCommand";
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

import { Project } from "@atomist/automation-client/project/Project";
import { doWithFiles } from "@atomist/automation-client/project/util/projectUtils";
import { editorAutofixRegistration, SoftwareDeliveryMachine } from "@atomist/sdm";

export function demoRules(sdm: SoftwareDeliveryMachine) {
    sdm.addPushReactions(async pu => {
        const readme = await pu.project.getFile("README.md");
        if (!readme) {
            return pu.addressChannels(`Project at ${pu.id.url} has no readme. This makes me sad. :crying_cat_face:`);
        } else {
            return pu.addressChannels("This project has a readme");
        }
    });
    sdm.addNewIssueListeners(async i => {
        const extra = i.issue.title.toLowerCase().includes("please") ? "Thank you! :thank_you:" : "Not very polite, are you :scowl:";
        return i.addressChannels(`_${i.issue.openedBy.person.chatId.screenName}_, you opened issue #${i.issue.number}. ${extra}`);
    });

    sdm.addCommands({
        name: "vermont",
        intent: "vermont",
        listener: async cli => {
            return cli.addressChannels("Hello Burlington!");
        },
    });

    sdm.addEditor({
        name: "topping",
        intent: "topping",
        editor: async p => {
            return p.addFile("topping", "maple syrup");
        },
        editorCommandFactory: dryRunEditorCommand,
    });

    sdm.addEditor({
        name: "maintainFileCount",
        intent: "filecount",
        editor: fileCountEditor,
    });

    sdm.addAutofixes(editorAutofixRegistration({
            name: "filecounter",
            editor: fileCountEditor,
        }),
    );
}

async function fileCountEditor(p: Project): Promise<any> {
    let count = 0;
    await doWithFiles(p, "**/*.java", f => {
        ++count;
    });
    return p.addFile("filecount.md", `The number of Java files is ${count}`);
}
