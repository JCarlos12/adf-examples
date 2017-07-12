/*!
 * @license
 * Copyright 2016 Alfresco Software, Ltd.
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

import { Component, Input, OnInit, Optional, ViewChild, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Params } from '@angular/router';
import { MdDialog } from '@angular/material';
import { AlfrescoContentService, FolderCreatedEvent, NotificationService, AppConfigService } from 'ng2-alfresco-core';
import { DocumentListComponent } from 'ng2-alfresco-documentlist';
import { UploadService, FileUploadCompleteEvent } from 'ng2-alfresco-upload';
import { MinimalNodeEntryEntity } from 'alfresco-js-api';
import { RestVariable } from 'alfresco-js-api';
import { CreateFolderDialog } from '../../dialogs/create-folder.dialog';

@Component({
    selector: 'sentiment-component',
    templateUrl: './sentiment.component.html',
    styleUrls: ['./sentiment.component.css']
})
export class SentimentComponent implements OnInit {
    // The identifier of a node. You can also use one of these well-known aliases: -my- | -shared- | -root-
    currentFolderId: string = '-my-';

    errorMessage: string = null;
    fileNodeId: any;
    fileShowed: boolean = false;
    mimeType: string = null;

    useCustomToolbar = true;

    @Input()
    multipleFileUpload: boolean = false;

    @Input()
    disableWithNoPermission: boolean = false;

    @Input()
    folderUpload: boolean = false;

    @Input()
    acceptedFilesTypeShow: boolean = false;

    @Input()
    versioning: boolean = false;

    @Input()
    acceptedFilesType: string = '.jpg,.pdf,.js';

    @Input()
    enableUpload: boolean = true;

    @ViewChild(DocumentListComponent)
    documentList: DocumentListComponent;

    inputProcessVariable: RestVariable[] = null;

    appId: string;

    constructor(private changeDetector: ChangeDetectorRef,
                private notificationService: NotificationService,
                private uploadService: UploadService,
                private contentService: AlfrescoContentService,
                private dialog: MdDialog,
                @Optional() private route: ActivatedRoute,
                private appConfigService: AppConfigService) {
        this.appId = <String>this.appConfigService.get('appId');
    }

    sentimentAction(event) {
        this.fileShowed = false;

        if (event.value.entry.isFile) {
            this.fileNodeId = event.value.entry.id;

            this.inputProcessVariable = [];

            let variable: any = {};
            variable.name = 'nodeId';
            variable.value = event.value.entry.id;

            this.inputProcessVariable.push(variable);

            this.contentService.apiService.getInstance().nodes.getNodeInfo(this.fileNodeId).then((data: MinimalNodeEntryEntity) => {
                this.mimeType = data.content.mimeType;
                this.fileShowed = true;
            }, function () {
            });
        }
    }

    ngOnInit() {
        if (this.route) {
            this.route.params.forEach((params: Params) => {
                if (params['id']) {
                    this.currentFolderId = params['id'];
                    this.changeDetector.detectChanges();
                }
            });
        }

        this.uploadService.fileUploadComplete.debounceTime(300).subscribe(value => this.onFileUploadComplete(value));
        this.contentService.folderCreated.subscribe(value => this.onFolderCreated(value));
    }

    onNavigationError(err: any) {
        if (err) {
            this.errorMessage = err.message || 'Navigation error';
        }
    }

    resetError() {
        this.errorMessage = null;
    }

    onFileUploadComplete(event: FileUploadCompleteEvent) {
        if (event && event.file.options.parentId === this.documentList.currentFolderId) {
            this.documentList.reload();
        }
    }

    onFolderCreated(event: FolderCreatedEvent) {
        console.log('FOLDER CREATED');
        console.log(event);
        if (event && event.parentId === this.documentList.currentFolderId) {
            this.documentList.reload();
        }
    }

    handlePermissionError(event: any) {
        this.notificationService.openSnackMessage(
            `You don't have the ${event.permission} permission to ${event.action} the ${event.type} `,
            4000
        );
    }

    onCreateFolderClicked(event: Event) {
        let dialogRef = this.dialog.open(CreateFolderDialog);
        dialogRef.afterClosed().subscribe(folderName => {
            if (folderName) {
                this.contentService.createFolder('', folderName, this.documentList.currentFolderId).subscribe(
                    node => console.log(node),
                    err => console.log(err)
                );
            }
        });
    }
}
