/*   
Parameter Description
1. isMultiple: set this true to enable multiple file upload only works for Document Library.
2. isList: set this to true to upload the file as a list itme attachment.
3. szListName: set this to blank if uploading to Document Library else specify the name of the list to which file has to be added as attachment.
4. szDocLibInternalName: set this to blank if uploading to List as attachment else specify the internal name of the Document Library to which file has to be added.
5. szDocLibDisplayName:set this to blank if uploading to List as attachment else specify the display name of the Document Library to which file has to be added.
6. szSiteURL:set this to the site url in which the list or library exists.
7. szFolderName:specify the name of the folder in the document library to which you wish to upload the file, this plugin support creating a single folder level (i.e. if folder path is doclib/a and if folder a does not exist the plugin will create it on the other hand if path is doclib/a/b and if both folder a and b do not exist then the lugin will throw an error).
8. templateViewHTML:template html for showing uploaded files
*/
(function ($) {
    $.fn.jqueryUploadFile = function (userOptions) {
        var mainDiv = $(this);
        $.fn.jqueryUploadFile.defaults = {
            isMultiple: userOptions.isMultiple,
            isList:userOptions.isList,
            szListName:userOptions.szListName,
            szDocLibInternalName: userOptions.szDocLibInternalName,
            szDocLibDisplayName: userOptions.szDocLibInternalName,
            szSiteURL: userOptions.szSiteURL,
            szFolderName: userOptions.szFolderName,
            collFiles:[],
            checkCounter:0
        };
        var templateUploadMultipleHTML = "<input type='file' id='files' name='files[]' multiple />"+
                                         "<input type='hidden' class='hdnItemID' />"+
                                         "<div id='list'></div>"+
                                         "<div class='resultDiv'></div>";
        var templateUploadSingleHTML="<input type='file' id='files' name='files[]' />"+
                                     "<input type='hidden' class='hdnItemID' />"+
                                     "<div id='list'></div>"+
                                     "<div class='resultDiv'></div>";
        var templateViewHTML= "<table class='maintable'>"+
                                    "<tr class='headerRow'>"+
                                        "<th class='headerFileName'>File Name</th>"+
                                        "<th class='headerFileSize'>File Size</th>"+                                        
                                        "<th class='headerDelete'>Remove</th>"+
                                    "</tr>"+                                                                  
                                "</table>" +
                                "<div id='contentRowWrapperID' class='contentRowWrapper'>"+                                
                                "<input type='button' id='btnUpload' name='Upload' value='Upload'/>"+
                                "<input type='button' name='Cancel' value='Cancel'/>";
        "</div>";
        var templateItemHTML=  "<tr class='contentRow'>"+
                                    "<td class='contentFileName'>{0}</td>"+
                                    "<td class='contentFileSize'>{1}</td>"+                                    
                                    "<td class='contentDelete'><a class='contentItemDelete' href='{2}'>Remove</a></td>"+
                                "</tr>";
        
        var obj = $.extend({}, $.fn.jqueryUploadFile.defaults, userOptions);

        return this.each(function () {
            InitializeObjects();
        });

        function InitializeObjects() {
            
            if (jQuery("#__REQUESTDIGEST").val() == "InvalidFormDigest") {
                var recreateToken = recreateRequestDigest()
                recreateToken.done(function (data, textStatus, jqXHR) {                    
                    //console.log("recreated token: ", data.d.GetContextWebInformation["FormDigestValue"]);
                    jQuery("#__REQUESTDIGEST").val(data.d.GetContextWebInformation["FormDigestValue"]);
                    PopulateUploadFileView();
                });
                recreateToken.fail(function (jqXHR, textStatus, errorThrown) {
                    //console.log(jqXHR, textStatus, errorThrown);
                });
            } else {
                //console.log("original token", jQuery("#__REQUESTDIGEST").val());
                PopulateUploadFileView();
            }
        }
        //Recreate request digest if it does not exist
        function recreateRequestDigest() {
            var promise = $.ajax({
                url: _spPageContextInfo.webAbsoluteUrl+"/_api/contextinfo",
                type: "POST",
                headers: {
                    "accept": "application/json;odata=verbose",
                }
            });
            return promise;
        }
        //Create the HTML elemenst onto the target div
        function PopulateUploadFileView() {           
            if(obj.isMultiple){
                mainDiv.html(templateUploadMultipleHTML);
            }
            else{
                mainDiv.html(templateUploadSingleHTML);
            }   
            var e1 = mainDiv.find('#files');
            mainDiv.find('#files').change(function(){handleFileSelect(this)});                
        }
        //Event handler to handle file select in the file upload control
        function handleFileSelect(evt) {
        
            mainDiv.find('#list').html(templateViewHTML);

            var files = evt.files; // FileList object                
            var output = [];
            
            mainDiv.find("#btnUpload").click(function(){uploadDocument(this)});            
            for (var i = 0, f; f = files[i]; i++) {
                if(isValid(f.name)){
                    handleFileUpload(f, i);
                    renderGrid(files,false);
                }               
            }          
        }
        //Function to check if File Name is Valid
        function isValid(str) {
            var iChars = "~`!#$%^&*+=-[]\\\';,/{}|\":<>?";

            for (var i = 0; i < str.length; i++) {
                if (iChars.indexOf(str.charAt(i)) != -1) {
                    alert ("File name"+str+" has special characters ~`!#$%^&*+=-[]\\\';,/{}|\":<>? \nThese are not allowed\n");
                    return false;
                }
            }
            return true;
        }
        //Render the grid with the uploaded file information
        function renderGrid(fileCollection, isDelete) {
            var viewHTML="";
            for (var i = 0, f; f = fileCollection[i]; i++) {
                var itemHTML=templateItemHTML;
                var progressHTML="<progress id='readProgress" + i + "'></progress>";
                var szProgresID="readProgress" + i ;
                if(isDelete){
                    itemHTML=String.format(itemHTML,f.fileName,formatSizeUnits(f.fileArray.byteLength),szProgresID);
                }
                else{
                    itemHTML=String.format(itemHTML,f.name,formatSizeUnits(f.size),szProgresID);
                }                                                  
                viewHTML+=itemHTML;                
            }
            mainDiv.find(".maintable").find("tr.contentRow").length>0?mainDiv.find(".maintable").find("tr.contentRow").remove():
            mainDiv.find(".maintable").append(viewHTML);
            mainDiv.find(".maintable").find(".contentItemDelete").click(function(){removeFile(this)});
        }
        //function to remove the file if Delete button is clicked in the grid
        function removeFile(e) {
            if(event.preventDefault){
                event.preventDefault();
            } 
            else{
                event.returnValue = false;
            }
            var szID=$(e).attr('href');
            
            obj.collFiles=$.grep(obj.collFiles,function(value){return value.fileProgressID != szID;});            

            $(e).parent().parent().remove();

            if(obj.collFiles.length==0){
                mainDiv.find("#list").html("");
            }            
        }
        //function to handle the Upload button click
        function uploadDocument(ele){
            ShowWaitScreen();
            var folderPath;
            if(obj.szFolderName!=''){
                folderPath=obj.szSiteURL+"/"+obj.szDocLibInternalName+"/"+obj.szFolderName;
            }
            else{
                folderPath=obj.szSiteURL+"/"+obj.szDocLibInternalName;
            }            

            addFilesToSharePoint(folderPath);
        }
        //Event handler to handle file select in the file upload control
        function handleFileUpload(file, index) {
            obj.collFiles=[];
            var progressControl;
            var progressID = "readProgress" + index;

            var reader = new FileReader();            
            reader.onload = function (e) {
                addItemToCollection(e.target.result, file.name, progressID);            
            }
            reader.onerror = function (e) {
                alert(e.target.error);
            }            
            reader.onloadend = function (event) {
                var contents = event.target.result,
                    error = event.target.error;
                if (error != null) {
                    alert("File could not be read! Code " + error.code);
                } 
            }
            reader.readAsArrayBuffer(file);
        }
        //function to build the object collection
        function addItemToCollection(buffer, fileName, index) {
            obj.collFiles.push({fileArray:buffer,fileName:fileName,fileProgressID:index});
        }
        //function to upload the documents to the document library
        function addFilesToSharePoint(folderPath) {
            if(obj.isList){
                if(obj.isMultiple){
                    alert("error in the settings!! multiple file upload is not supported for file attachments");
                }
                else{
                    addDocumentToList();
                }                
            }   
            else{
                addDocumentToFolder(folderPath);
            }            
        }    
        //function to add the document to the specified folder in the document library
        function addDocumentToFolder(folderPath){
            var callCheckFolderExists = checkIfFolderExists(folderPath);
            callCheckFolderExists.done(function(data, textStatus, jqXHR) {
                
                for (var i = 0, f; f = obj.collFiles[i]; i++) 
                { 
                    var callAddDocToLibrary = addDocToLib(f.fileArray, folderPath, f.fileName);    
                    callAddDocToLibrary.done(function(data, textStatus, jqXHR) {
                        
                        obj.checkCounter++;               
                        /*Function call to get the SPListItem of the SPFile object
                        var call2GetSPItem = getItem(data.d);        
                            call2GetSPItem.done(function(data, textStatus, jqXHR) {
                                var item = data.d;                                  
                                //console.log("call2GetSPItem done", item.Id);
                            });         
                            call2GetSPItem.fail(function(jqXHR, textStatus, errorThrown) {
                                failHandler(jqXHR, textStatus, errorThrown, true);
                            });
                        */
                        if(obj.checkCounter==obj.collFiles.length){
                            CloseWaitDialog();
                            /*Function to reset the plugin alternatively you may choose to perform any other function here
                            mainDiv.jqueryUploadFile({
                                isMultiple:true,
                                szDocLibInternalName: "FileUploadPOC",
                                szSiteURL: szSiteURL,
                                szFolderName: ''
                            });*/
                        }
                    });     
                    callAddDocToLibrary.fail(function(jqXHR, textStatus, errorThrown) {
                        failHandler(jqXHR, textStatus, errorThrown,true);
                    });                    
                }
            });
            callCheckFolderExists.fail(function(jqXHR, textStatus, errorThrown) {
                //console.log("Folder does not exist");  
                //REST call to create the folder
                var callCreateFolder=createFolder(folderPath);
                callCreateFolder.done(function(data,textStatus,jqXHR){
                    //console.log("Folder Created successfully");
                    addDocumentToFolder(folderPath);
                });
                callCreateFolder.fail(function(jqXHR,textStatus,errorThrown){
                    //console.log("Folder creation failed");
                    failHandler(jqXHR, textStatus, errorThrown,true);
                })
                failHandler(jqXHR, textStatus, errorThrown,false);       
            });
        }
        //function to handle the delete button click of the uploaded file
        function deleteFileEvent(e){
            if(event.preventDefault){
                event.preventDefault();
            } 
            else{
                event.returnValue = false;
            }            
            var szFile=$(e).attr('href');
            var call=deleteFile(szFile);
            call.done(function(data, textStatus, jqXHR){
                $(e).parent().parent().remove();
            });
            call.fail(function(data, textStatus, jqXHR){
                //console.log("failed");
            });
        }
        //add document to list as an attachment
        function addDocumentToList(){
            var szId = mainDiv.find(".hdnItemID").val();
            for (var i = 0, f; f = obj.collFiles[i]; i++) 
            {                                   
                var callAddDocToList = addDocToList(f.fileArray, szId, f.fileName);    
                callAddDocToList.done(function(data, textStatus, jqXHR) {                    
                    obj.checkCounter++;               
                    mainDiv.find(".resultDiv").append("<table><tr><td>"+data.d.FileName+"</td><td><a class='contentFileDelete' href='"+data.d.ServerRelativeUrl+"' >Delete</a></td></tr></table>");
                    mainDiv.find(".resultDiv").find(".contentFileDelete").click(function(){deleteFileEvent(this)});
                    CloseWaitDialog();
                    mainDiv.find("#list").html('');
                });     
                callAddDocToList.fail(function(jqXHR, textStatus, errorThrown) {
                    failHandler(jqXHR, textStatus, errorThrown,true);
                });
            }
        }
        //delete the file
        function deleteFile(fileUrl) {     
            var url;
            url = String.format("{0}/_api/web/GetFileByServerRelativeUrl('{1}')",_spPageContextInfo.webAbsoluteUrl, fileUrl);            
            var call = jQuery.ajax({
                url: url,
                type: "POST",                
                headers: {
                    "Accept": "application/json;odata=verbose",
                    "X-RequestDigest": jQuery("#__REQUESTDIGEST").val(),
                    "X-HTTP-Method":"DELETE"
                },
                success: function () {
                    
                },
                error: function (xhr) {
                    console.log(xhr);
                    console.log(xhr.status);
                }
            });

            return call;
        }
        //async function to add file as attachment
        function addDocToList(buffer, itemID, fileName) {            
            var url;
            url = String.format("{0}/_api/web/lists/GetByTitle('{1}')/items({2})/AttachmentFiles/add(FileName='{3}')",_spPageContextInfo.webAbsoluteUrl, obj.szListName, itemID, fileName);
            
            var call = jQuery.ajax({
                url: url,
                type: "POST",
                data: buffer,
                processData: false,
                headers: {
                    "Accept": "application/json;odata=verbose",
                    "X-RequestDigest": jQuery("#__REQUESTDIGEST").val(),
                    "Content-Length": buffer.byteLength
                },
                success: function () {
                    //console.log('File added to list successfully');
                },
                error: function (xhr) {
                    alert(xhr);
                    alert(xhr.status);
                }
            });

            return call;
        }
        //async function to add the file as an item in Document Library
        function addDocToLib(buffer, folderPath, fileName) {            
            var url;
            url = String.format("{0}/_api/Web/GetFolderByServerRelativeUrl('{1}')/Files/Add(url='{2}', overwrite=true)", _spPageContextInfo.webAbsoluteUrl, folderPath, fileName);

            var call = jQuery.ajax({
                url: url,
                type: "POST",
                data: buffer,
                processData: false,
                headers: {
                    "Accept": "application/json;odata=verbose",
                    "X-RequestDigest": jQuery("#__REQUESTDIGEST").val(),
                    "Content-Length": buffer.byteLength
                },
                success: function() {
                    //console.log('File added to document library successfully');
                },
                error: function(xhr) {
                    alert(xhr);
                    alert(xhr.status);
                }
            });

            return call;
        }
        //async function to create folder
        function createFolder(newFolderName) {
            var url;
            var relativeFolderPath= newFolderName;
            url = String.format("{0}/_api/Web/folders/add('{1}')", _spPageContextInfo.webAbsoluteUrl,relativeFolderPath);

            var call = jQuery.ajax({
                url: url,
                type: "POST",
                processData: false,
                headers: {
                    "Accept": "application/json;odata=verbose",
                    "X-RequestDigest": jQuery("#__REQUESTDIGEST").val(),
                    "content-type": "application/json;odata=verbose"
                },
                success: function() {
                    //console.log('Folder Created successfully!');
                },
                error: function(xhr) {
                    alert(xhr);
                    alert(xhr.status);
                }
            });

            return call;
        }
        //async function to get the SPItem of the SPFile
        function getItem(file) {
            var call = jQuery.ajax({
                url: file.ListItemAllFields.__deferred.uri,
                type: "GET",
                dataType: "json",
                headers: {
                    Accept: "application/json;odata=verbose"
                }
            });

            return call;
        }  
        //async function to check if the folder exists
        function checkIfFolderExists(folderPath) {
            var url;
            url = String.format("{0}/_api/Web/GetFolderByServerRelativeUrl('{1}')", _spPageContextInfo.webAbsoluteUrl, folderPath);

            var call = jQuery.ajax({
                url: url,
                type: "GET",
                processData: false,
                headers: {
                    "Accept": "application/json;odata=verbose",
                    "X-RequestDigest": jQuery("#__REQUESTDIGEST").val()
                },
                success: function() {
                    //console.log('Folder exists');
                },
                error: function(xhr) {
                    //console.log(xhr);
                    //console.log(xhr.status);
                }
            });

            return call;
        }
        //function to handle the failed events
        function failHandler(jqXHR, textStatus, errorThrown,isAlert) {
            CloseWaitDialog();
            var response = JSON.parse(jqXHR.responseText);
            var message = response ? response.error.message.value : textStatus;
            if(isAlert){alert("Call failed. Error: " + message);}            
            //console.log("Call failed. Error: ", message);
        }
        
        var waitDialog;
        // Show wait dialog screen
        function ShowWaitScreen() {
            EnsureScript('sp.ui.dialog.js', typeof (SP.UI.ModalDialog), function () {
                waitDialog = SP.UI.ModalDialog.showWaitScreenWithNoClose('Processing...');
            });
        }
        // Close the wait dialog screen
        function CloseWaitDialog() {
            if (typeof (waitDialog) != 'undefined' && waitDialog != null) {
                waitDialog.close();
                waitDialog = null;
            }
        }
        //function to format the size
        function formatSizeUnits(bytes) {
            if (bytes >= 1073741824) {
                bytes = (bytes / 1073741824).toFixed(2) + ' GB';
            } else if (bytes >= 1048576) {
                bytes = (bytes / 1048576).toFixed(2) + ' MB';
            } else if (bytes >= 1024) {
                bytes = (bytes / 1024).toFixed(2) + ' KB';
            } else if (bytes > 1) {
                bytes = bytes + ' bytes';
            } else if (bytes == 1) {
                bytes = bytes + ' byte';
            } else {
                bytes = '0 byte';
            }
            return bytes;
        }
    }
    $.fn.jqueryUploadFileUtilityFunctions = function (userOptions) {
    }
})(jQuery);
