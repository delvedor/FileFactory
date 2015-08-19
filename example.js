/**
 * Project: FileFactory
 * Version: 1.0.1
 * Author: delvedor - infoFACTORY
 * Twitter: @delvedor - @info_factory
 * License: GNU GPLv2
 * GitHub: https://github.com/delvedor/FileFactory
 * Dependencies: - cordova-plugin-device
 * 							 - cordova-plugin-file
 *         			 - Q library
 * 							 - cordova-plugin-dialogs (only for askUser)
 * 							 - cordova-plugin-file-transfer (only for downloadFile)
 * 							 - cordova-plugin-zip (only for unZipFile)
 * 							 - cordova-plugin-file-opener2 (only for openFile)
 *
 *
 * FileFactory is completely built with the Javascript promises via the Q library,
 * so you can easily chain the methods.
 * Below you can find an example.
 *
 * If you are using Angular with FileFactory remember to call $scope.apply() at the end of your FileFactory code,
 * this because FileFactory is outside of the Angular digest loop.
 */

FF.checkFile('path/to/file', 'filename')
  .then(function(fileFound) {
    // file not exist
    if (!fileFound.found)
      return FF.askUser('title', 'message', 'Yes', 'No');
  })
  .then(function(confirmed) {
    // confirm "confirmed"
    if (confirmed)
      return FF.downloadFile('url', 'path/to/file', 'filename', false, 'id-progress-bar', {});
  })
  .then(function(success) {
    // download succeded
    if (success)
      return FF.unZipFile('path/to/file', 'filename', 'path/to/file', 'fileUnzipped', false);
  }, function(error) {
    // file already exist
    if (error.code === 1)
      return FF.unZipFile('path/to/file', 'filename', 'path/to/file', 'fileUnzipped', false);
  })
  .then(function(success) {
    FF.deleteFile('path/to/file', 'filename', false);
  });
