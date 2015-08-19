/*
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
 */

/**
 * Errors codes:
 * 	1: file already exist
 *  2: file not found
 *  3: not enough space
 *  4: file/directory cannot start with \/
 *  5: input is not a file or directory
 *  6: Device offline
 */

(function(global) {
  /**
   * Object declaration
   */
  var FileFactory = function() {
    return new FileFactory.init();
  };

  // Var scoped only in the library
  var downloadAttempts = 0;
  var defaultPath = '';
  var taskProgress = 0;

  /**
   * Checks if the given variable is of a given type,
   * if not, it throws an error.
   * (Not exposed to the global namespace.)
   *
   * @param  {String} functionName [name of the function]
   * @param  {-} variable          [variable to test]
   * @param  {String} type         [type of the variable]
   */
  var checkType = function(functionName, variable, type) {
    if (typeof variable !== type)
      throw ('FileFactory error: ' + variable + ' is not a ' + type + ' at ' + functionName + '()');
  };

  /**
   * Prototype holds methods
   */
  FileFactory.prototype = {
    /**
     * Return the current taskProgress.
     *
     * @return {Number} [progress of the task]
     *                            return taskProgress:int
     */
    getTaskProgress: function() {
      return taskProgress;
    },

    /**
     * Gets the free space in disk (in KiloByte).
     *
     * @return {Object} [Promise - Success/Error]
     *                           return freeSpace:int
     */
    getFreeDiskSpace: function() {
      var q = Q.defer();

      cordova.exec(function(result) {
        q.resolve(result);
      }, function(error) {
        q.reject(error);
      }, 'File', 'getFreeDiskSpace', []);

      return q.promise;
    },

    /**
     * Check if exist a file or a directory.
     * If there are not errors, it returns an object with 3 parameters,
     * found (true/false), isFile (true/false) and isDirectory (true/false)
     *
     * @param  {String} filePath [path of the file/dir]
     * @param  {String} fileName [name of the file/dir]
     * @return {Object}          [Promise - Success/Error]
     *                                    return {
     * 	                                  	found: true/false:boolean,
     *                                     	isFile: true/false:boolean,
     *                                      isDir: true/false:boolean
     *                                    }:object || error:object
     */
    checkFile: function(filePath, fileName) {
      checkType('checkFile', filePath, 'string');
      checkType('checkFile', fileName, 'string');

      var q = Q.defer();

      if ((/^\//.test(fileName))) {
        q.reject({
          code: 4,
          text: 'file/directory cannot start with \/'
        });

      } else {
        try {
          var fullPath = defaultPath + filePath + fileName;
          global.resolveLocalFileSystemURL = global.resolveLocalFileSystemURL || global.webkitResolveLocalFileSystemURL;
          global.resolveLocalFileSystemURL(fullPath, function(fileSystem) {
            if (fileSystem.isFile === true || fileSystem.isDirectory)
              q.resolve({
                found: fileSystem.isFile || fileSystem.isDirectory,
                isFile: fileSystem.isFile,
                isDir: fileSystem.isDirectory
              });
            else
              q.reject({
                code: 5,
                text: 'input is not a file or directory'
              });

          }, function(error) {
            // File not found
            if (error.code === 1)
              q.resolve({
                found: false,
                isFile: false,
                isDir: false
              });
            else
              q.reject(error);
          });

        } catch (err) {
          q.reject(err);
        }
      }
      return q.promise;
    },

    /**
     * Downloads a file.
     * Before start the download checks if already exist a file with the same name in the given directory.
     * If given, during the download it updates the progress bar via the html id.
     * If the first download fails, it automatically makes a second attempt.
     *
     * @param  {String} url           [Download url]
     * @param  {String} filePath      [path of the file]
     * @param  {String} fileName      [name of the file]
     * @param  {Boolean} logs         [enable the logs]
     * @param  {String} idProgressBar [id of the progress bar]
     * @param  {Object} headers [headers]
     * @return {Object}               [Promise - Success/Error]
     *                                         return true:boolean || error:object
     */
    downloadFile: function(url, filePath, fileName, logs, idProgressBar, headers) {
      if (!global.FileTransfer)
        throw 'FileFactory error: missing cordova-plugin-file-transfer plugin';

      checkType('downloadFile', url, 'string');
      checkType('downloadFile', filePath, 'string');
      checkType('downloadFile', fileName, 'string');
      checkType('downloadFile', logs, 'boolean');
      checkType('downloadFile', idProgressBar || '', 'string');
      checkType('downloadFile', headers || {}, 'object');

      var q = Q.defer();
      var self = this;
      var checkFreeSpaceFirstTime = false;

      self.checkFile(filePath, fileName)
        .then(function(fileFound) {
          if (fileFound.found) {
            if (logs)
              console.log('downloadFile: there is already a file with the same name');
            q.reject({
              code: 1,
              text: 'downloadFile: there is already a file with the same name'
            });

          } else {
            return self.getFreeDiskSpace();
          }
        })
        .then(function(freeSpace) {
            if (logs) {
              var startTime = Date.now();
              console.log('Starting download..');
            }

            var fileTransfer = new FileTransfer();

            fileTransfer.download(
              url,
              defaultPath + filePath + fileName,
              function() {
                if (logs) {
                  var elapsedTime = (Date.now() - startTime) / 1000;
                  console.log('Download succeded');
                  console.log('-- task completed in ' + elapsedTime + ' seconds');
                }
                downloadAttempts = 0;
                q.resolve(true);
              },

              function(error) {
                if (logs)
                  console.log('Download failed: ', error);
                downloadAttempts += 1;
                if (error.code === 3) {
                  fileTransfer.abort();
                  q.reject({
                    code: 6,
                    text: 'Device offline'
                  });
                } else if (downloadAttempts === 1) {
                  if (logs)
                    console.log('Make a second attempt..');
                  self.downloadFile(url, filePath, fileName, logs, idProgressBar);
                }
              },
              false, {
                headers: headers
              }
            );

            fileTransfer.onprogress = function(progress) {
              if (!checkFreeSpaceFirstTime) {
                checkFreeSpaceFirstTime = true;
                if (freeSpace * 1024 < progress.total) {
                  fileTransfer.abort();
                  if (logs)
                    console.log('downloadFile() -> not enough space in disk -> free space: ', (freeSpace * 1024), ' - file size: ', progress.total);
                  q.reject({
                    code: 3,
                    text: 'Not enough space in disk'
                  });
                }
              }

              taskProgress = parseInt(Math.round((progress.loaded / progress.total) * 100).toFixed(0), 10);
              if (idProgressBar)
                document.getElementById(idProgressBar).value = taskProgress;
              if (logs)
                console.log('Download progress: ', (progress.loaded / progress.total) * 100);
            };
          },
          function(error) {
            if (logs)
              console.log('downloadFile() error -> checkFile() error ->', error);
            q.reject(error);
          });

      return q.promise;
    },

    /**
     * Unzip a given file.
     * Before start the unzip checks if the file exist and if there is a file with the same name in the given directory.
     *
     * @param  {String} filePath  [path of the zipped file]
     * @param  {String} fileName  [name of the zipped file]
     * @param  {String} unzipPath [path of the unzipped file]
     * @param  {String} unzipFile [name of the unzipped file]
     * @param  {Boolean} logs     [enable the logs]
     * @return {Object}           [Promise - Success/Error]
     *                                     return true:boolean || error:object
     */
    unZipFile: function(filePath, fileName, unzipPath, unzipFile, logs) {
      if (!global.zip)
        throw 'FileFactory error: missing cordova-plugin-zip plugin';

      checkType('unZipFile', filePath, 'string');
      checkType('unZipFile', fileName, 'string');
      checkType('unZipFile', unzipPath, 'string');
      checkType('unZipFile', unzipFile, 'string');
      checkType('unZipFile', logs, 'boolean');

      var q = Q.defer();
      var self = this;
      var checkFreeSpaceFirstTime = false;
      var fileSize = 0;

      self.checkFile(filePath, fileName)
        .then(function(fileFound) {
          if (!fileFound.found) {
            if (logs)
              console.log('unZipFile: file not found.');
            q.reject({
              code: 2,
              text: 'unZipFile: file not found'
            });
          } else {
            return self.checkFile(unzipPath, unzipFile);
          }

        }).then(function(fileFound) {
          if (fileFound.found) {
            if (logs)
              console.log('unZipFile: there is already a file with the same name');
            q.reject({
              code: 1,
              text: 'unZipFile: there is already a file with the same name'
            });
          } else {
            return self.getFreeDiskSpace();
          }
        })
        .then(function() {
            if (logs) {
              var startTime = Date.now();
              console.log('Starting unzip..');
            }

            global.zip.unzip(
              defaultPath + filePath + fileName,
              defaultPath + unzipPath + unzipFile,
              function(code) {
                if (code === -1) {
                  if (freeSpace * 1024 < fileSize) {
                    if (logs)
                      console.log('unZipFile() -> not enough space in disk -> free space: ', (freeSpace * 1024), ' - file size: ', fileSize);
                    q.reject({
                      code: 3,
                      text: 'Not enough space in disk'
                    });
                  }
                } else {
                  if (logs) {
                    var elapsedTime = (Date.now() - startTime) / 1000;
                    console.log('Success unzip');
                    console.log('-- task completed in ' + elapsedTime + ' seconds');
                  }
                  q.resolve(true);
                }
              },

              function(progress) {
                if (!checkFreeSpaceFirstTime) {
                  checkFreeSpaceFirstTime = true;
                  fileSize = progress.total;
                }
                if (logs)
                  console.log('Unzip progress: ', (progress.loaded / progress.total) * 100);
              });
          },
          function(error) {
            if (logs)
              console.log('unZipFile() error -> checkFile() error ->', error);
            q.reject(error);
          });

      return q.promise;
    },

    /**
     * Opens a file (if exist).
     *
     * @param  {String} filePath   [Path of the file to open]
     * @param  {String} fileName   [Name of the file to open]
     * @param  {String} fileType   [Type of the file to open]
     * @return {Object}            [Promise Success/Error]
     *                                      return true:boolean || error:object
     */
    openFile: function(filePath, fileName, fileType, logs) {
      if (!global.fileOpener2)
        throw 'FileFactory error: missing cordova-plugin-file-opener2 plugin';

      checkType('openFile', filePath, 'string');
      checkType('openFile', fileName, 'string');
      checkType('openFile', fileType, 'string');
      checkType('openFile', logs, 'boolean');

      var q = $Q.defer();

      this.checkFile(filePath, fileName)
        .then(function(fileFound) {
            if (!fileFound.found) {
              if (logs)
                console.log('openFile: file not found');
              q.reject({
                code: 2,
                text: 'openFile: file not found'
              });

            } else {
              global.fileOpener2.open((defaultPath + filePath + fileName), fileType, {
                error: function(error) {
                  if (logs)
                    console.log('openFile error: ', error);
                  q.reject(error);
                },
                success: function() {
                  if (logs)
                    console.log('openFile succeded!');
                  q.resolve(true);
                }
              });
            }
          },
          function(error) {
            if (logs)
              console.log('openFile() error -> checkFile() error ->', error);
            q.reject(error);
          });

      return q.promise;
    },

    /**
     * Deletes a file or a directory (if exist).
     *
     * @param  {String} filePath   [Path of the file/dir to delete]
     * @param  {String} fileName   [Name of the file/dir to delete]
     * @return {Object}         [Promise Success/Error]
     *                                   return {
     *                                   		success: true:boolean,
     *                                   		fileRemoved: fileEntry:string
     *                                   	}:object || error:object
     */
    deleteFile: function(filePath, fileName, logs) {
      checkType('askDownload', filePath, 'string');
      checkType('askDownload', fileName, 'string');
      checkType('askDownload', logs, 'boolean');

      var q = Q.defer();

      this.checkFile(filePath, fileName)
        .then(function(fileFound) {
            if (!fileFound.found) {
              if (logs)
                console.log('deleteFile: file not found.');
              q.reject({
                code: 2,
                text: 'deleteFile: file not found'
              });
            } else {
              if (fileFound.isFile) {
                if ((/^\//.test(fileName)))
                  q.reject({
                    code: 4,
                    text: 'file/directory cannot start with \/'
                  });

                try {
                  global.resolveLocalFileSystemURL((defaultPath + filePath), function(fileSystem) {
                    fileSystem.getFile(fileName, {
                      create: false
                    }, function(fileEntry) {
                      fileEntry.remove(function() {
                        if (logs)
                          console.log('File successfully removed');
                        q.resolve({
                          success: true,
                          fileRemoved: fileEntry
                        });
                      }, function(error) {
                        if (logs)
                          console.log('There was an error while removing the file', error);
                        q.reject(error);
                      });
                    }, function(err) {
                      q.reject(err);
                    });
                  }, function(er) {
                    q.reject(er);
                  });
                } catch (e) {
                  q.reject(e);
                }
              } else {
                if ((/^\//.test(fileName)))
                  q.reject('file-name cannot start with \/');

                try {
                  global.resolveLocalFileSystemURL((defaultPath + filePath), function(fileSystem) {
                    fileSystem.getDirectory(fileName, {
                      create: false
                    }, function(dirEntry) {
                      dirEntry.removeRecursively(function() {
                        if (logs)
                          console.log('Directory successfully removed');
                        q.resolve({
                          success: true,
                          fileRemoved: dirEntry
                        });
                      }, function(error) {
                        if (logs)
                          console.log('There was an error while removing the directory', error);
                        q.reject(error);
                      });
                    }, function(err) {
                      q.reject(err);
                    });
                  }, function(er) {
                    q.reject(er);
                  });
                } catch (e) {
                  q.reject(e);
                }
              }
            }
          },
          function(error) {
            if (logs)
              console.log('deleteFile() error -> checkFile() error ->', error);
            q.reject(error);
          });

      return q.promise;
    },

    /**
     * Ask to the user something via confirm.
     *
     * @param  {String} title   [Title of the confim]
     * @param  {String} message [Message of the confirm]
     * @param  {String} btn1    [Button 1 text (Yes)]
     * @param  {String} btn2    [Button 2 text (No)]
     * @return {Object}         [Promise Success/Error]
     *                                   return true:boolean || false:boolean
     */
    askUser: function(title, message, btn1, btn2) {
      if (!global.navigator.notification)
        throw 'FileFactory error: missing cordova-plugin-dialogs plugin';

      checkType('askUser', title, 'string');
      checkType('askUser', message, 'string');
      checkType('askUser', btn1, 'string');
      checkType('askUser', btn2, 'string');

      var q = Q.defer();

      navigator.notification.confirm(message, onConfirm, title, [btn1, btn2]);

      function onConfirm(btnIndex) {
        if (btnIndex === 1)
          q.resolve(true);
        else
          q.resolve(false);
      }

      return q.promise;
    }
  };

  /**
   * The FileFactory object is created here.
   */
  FileFactory.init = function() {
    document.addEventListener('deviceready', function() {
      if (!global.cordova)
        throw 'FileFactory error: missing Cordova';

      if (!global.cordova.file)
        throw 'FileFactory error: missing cordova-plugin-file plugin';

      if (!global.Q)
        throw 'FileFactory error: missing Q library';

      if (global.cordova.platformId === 'android')
        defaultPath = cordova.file.externalDataDirectory || cordova.file.dataDirectory;

      if (global.cordova.platformId === 'ios')
        defaultPath = cordova.file.documentsDirectory;
    });
  };

  // Trick borrowed from jQuery for don't use the 'new' keyword
  FileFactory.init.prototype = FileFactory.prototype;

  // Attach FileFactory to the global object.
  global.FileFactory = global.FF = FileFactory();

}(window));
