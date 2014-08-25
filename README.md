jqSPFileuupload
===============

jqSPFileuupload

This is a sharepoint 2013 client side file upload plugin. this can be used to:
  1) Upload large files (upto 2gb).
  2) Upload file to Document Library or add as attachment to a list item.
  3) Create a folder in a Document Library and upload file into that folder
  
Limitation:
  1) Requires jquery plugin.
  2) Works for SharePoint 2013 version only.
  3) Requires the client browser to have HTML5 support (IE 10+).
  
The detailed parameter description is as below:
  Parameter Description
    1. isMultiple: set this true to enable multiple file upload only works for Document Library.
    2. isList: set this to true to upload the file as a list item attachment.
    3. szListName: set this to blank if uploading to Document Library else specify the name of the list to which file has to be added as attachment.
    4. szDocLibInternalName: set this to blank if uploading to List as attachment else specify the internal name of the Document Library to which file has to be added.
    5. szDocLibDisplayName:set this to blank if uploading to List as attachment else specify the display name of the Document Library to which file has to be added.
    6. szSiteURL:set this to the site url in which the list or library exists.
    7. szFolderName:specify the name of the folder in the document library to which you wish to upload the file, this plugin support creating a single folder level (i.e. if folder path is doclib/a and if folder a does not exist the plugin will create it on the other hand if path is doclib/a/b and if both folder a and b do not exist then the lugin will throw an error).
    8. templateViewHTML:template html for showing uploaded files
