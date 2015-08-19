# FileFactory

*I wrote this code during my job at [infoFACTORY](http://www.infofactory.it/en/).*  
FileFactory is a easy to use utility for managing files built for Cordova, compatible with Angular and Ionic.

It is useful in case you need to download a lot of content for your mobile applications.  
It can be used for check if exist a file or directory, download, unzip and delete files or directories.

Below there's the dependecies list:
- [cordova-plugin-device](http://docs.phonegap.com/en/edge/cordova_device_device.md.html)
- [cordova-plugin-file](https://github.com/apache/cordova-plugin-file)
- [Q library](https://github.com/kriskowal/q)
- [cordova-plugin-dialogs](https://github.com/apache/cordova-plugin-dialogs) ] *(only for askUser)*
- [cordova-plugin-file-transfer](https://github.com/apache/cordova-plugin-file-transfer) *(only for downloadFile)*
- [cordova-plugin-zip](https://github.com/MobileChromeApps/cordova-plugin-zip) *(only for unZipFile)*
- [cordova-plugin-file-opener2](https://github.com/pwlin/cordova-plugin-file-opener2) *(only for openFile)*

The first three dependencies are mandatory, the others only if you need the specific functionalities.

*FileFactory v1.0.1 - 3.72KB gzipped / 19.42KB uncompressed*

## Usage
Easly call the code in your head tag.
```html
<script src="js/FileFactory.js"></script>
```
FileFactory expose two names into the global namespace, **FileFactory** and **FF**.  
```Javascript
// For call the functions, you can use
FileFactory.checkFile('path/to/file', 'file');
// or the shortened version
FF.checkFile('path/to/file', 'file');
```
You don't have to pass the path of your system, FileFactory automatically defines the [right path](https://github.com/apache/cordova-plugin-file) for the current system.
```Javascript
if (global.cordova.platformId === 'android')
  defaultPath = cordova.file.externalDataDirectory || cordova.file.dataDirectory;

if (global.cordova.platformId === 'ios')
  defaultPath = cordova.file.documentsDirectory;
```

## API Reference  
Here is the list of public API's exposed by FileFactory as well as a brief description of their use and how they work.

- <a href="#getFreeDiskSpace">.getFreeDiskSpace()</a>
- <a href="#checkFile">.checkFile()</a>
- <a href="#downloadFile">.downloadFile()</a>
- <a href="#unZipFile">.unZipFile()</a>
- <a href="#openFile">.openFile()</a>
- <a href="#deleteFile">.deleteFile()</a>
- <a href="#askUser">.askUser()</a>
- <a href="#getTaskProgress">.getTaskProgress()</a>

<a name="getFreeDiskSpace"></a>
### .getFreeDiskSpace()  
Gets the free space in disk (in KiloByte).

@return {Object} [Promise - Success/Error]  
```
return freeSpace:int
```

<a name="checkFile"></a>
### .checkFile(filePath, fileName)  
Check if exist a file or a directory.  
If there are not errors, it returns an object with 3 parameters,  
found (true/false), isFile (true/false) and isDirectory (true/false)

@param  {String} filePath [path of the file/dir]  
@param  {String} fileName [name of the file/dir]  
@return {Object}          [Promise - Success/Error]  
```
return {  
    found: true/false:boolean,  
    isFile: true/false:boolean,  
    isDir: true/false:boolean  
  }:object || error:object
```

<a name="downloadFile"></a>
### .downloadFile(url, filePath, fileName, logs, idProgressBar)  
Downloads a file.  
Before start the download checks if already exist a file with the same name in the given directory.  
If given, during the download it updates the progress bar via the html id.  
If the first download fails, it automatically makes a second attempt.

@param  {String} url           [Download url]  
@param  {String} filePath      [path of the file]  
@param  {String} fileName      [name of the file]  
@param  {Boolean} logs         [enable the logs]  
@param  {String} idProgressBar [id of the progress bar]  
@return {Object}               [Promise - Success/Error]  
```
return true:boolean || error:object
```

<a name="unZipFile"></a>
### .unZipFile(filePath, fileName, unzipPath, unzipFile, logs)  
Unzip a given file.  
Before start the unzip checks if the file exist and if there is a file with the same name in the given directory.

@param  {String} filePath  [path of the zipped file]  
@param  {String} fileName  [name of the zipped file]  
@param  {String} unzipPath [path of the unzipped file]  
@param  {String} unzipFile [name of the unzipped file]  
@param  {Boolean} logs     [enable the logs]  
@return {Object}           [Promise - Success/Error]  
```
return true:boolean || error:object
```

<a name="openFile"></a>
### .openFile(filePath, fileName, fileType, logs)  
Opens a file (if exist).

@param  {String} filePath   [Path of the file to open]  
@param  {String} fileName   [Name of the file to open]  
@param  {String} fileType   [Type of the file to open]  
@return {Object}            [Promise Success/Error]  
```
return true:boolean || error:object
```

<a name="deleteFile"></a>
### .deleteFile(filePath, fileName, logs)  
Deletes a file or a directory (if exist).

@param  {String} filePath   [Path of the file/dir to delete]  
@param  {String} fileName   [Path of the file/dir to delete]  
@return {Object}            [Promise Success/Error]  
```
return {
    success: true:boolean,
    fileRemoved: fileEntry:string
  }:object || error:object
  ```

<a name="askUser"></a>
### .askUser(title, message, btn1, btn2)  
Ask to the user something via confirm.

@param  {String} title   [Title of the confim]  
@param  {String} message [Message of the confirm]  
@param  {String} btn1    [Button 1 text (Yes)]  
@param  {String} btn2    [Button 2 text (No)]  
@return {Object}         [Promise Success/Error]  
```
return true:boolean || false:boolean
```

<a name="getTaskProgress"></a>
### .getTaskProgress()  
Return the current taskProgress.

@return {Number} [taskProgress]
```
return taskProgress:int
```  

## Error codes:
| Code        | Text         |
| ------------- |-------------|
| 1 | file already exist |
| 2 | file not found |
| 3 | not enough space |
| 4 | file/directory cannot start with / |
| 5 | input is not a file or directory |
| 6 | Device offline |


## Contributing  
If you feel you can help in any way, be it with examples, extra testing, or new features please open a pull request or open an issue.

*I would make a special thanks to [infoFACTORY](http://www.infofactory.it/en/) for allowing me to publish this code.  
'Open Source code is very important and is a way to say thanks or help others developers.' they said!*
______________________________________________________________________________________________________________________
## License
The code is released under the GNU GPLv2 license.

The software is provided "as is", without warranty of any kind, express or implied, including but not limited to the warranties of merchantability, fitness for a particular purpose and noninfringement. In no event shall the authors or copyright holders be liable for any claim, damages or other liability, whether in an action of contract, tort or otherwise, arising from, out of or in connection with the software or the use or other dealings in the software.
