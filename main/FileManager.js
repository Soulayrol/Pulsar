import { basename, join } from 'path'
import { mkdir, readFileSync, statSync, writeFile, unlink } from 'fs'
import format from 'string-format'
import glob from 'glob'

import { findSequencesOnDisk } from 'fileseq'

import File from './File'
import Sequence from './Sequence'
import Logger from './Logger'

/**
 * A class that reads files and directories on the local system
 */
class FileManager {
  /**
   * @static getDirectories - Get the directories from a path that is created from the assetId
   *
   * @param {Object}   asset  The AssetId used to reconstruct the path
   * @param {function} cb     A callback function, the found directories are passed to this function as argument
   */
  static getDirectories (asset, cb) {
    const formattedPath = FileManager.formatPath(asset)
    const slicedPath = FileManager.slicePath(formattedPath)
    glob(`${slicedPath}*/`, {}, (err, dirs) => {
      if (err) {
        Logger.error(err)
      } else {
        cb(dirs)
      }
    })
  }

  /**
   * @static createDirectory - Create a new directory
   *
   * @param {string}    path The path where the directory has to be created
   * @param {string}    name The name of the new directory
   * @param {functions} cb   A callback function
   *
   * @returns {type} Description
   */
  static createDirectory (path, name, cb) {
    const dirPath = join(path, name)
    mkdir(dirPath, (err) => {
      if (err) throw err
      cb()
    })
  }

  /**
   * @static getFiles - Get the files from a path that is created from the assetId
   *
   * @param {Object}   asset The AssetId used to reconstruct the path
   * @param {function} cb    A callback function, the found files are passed to this function as argument
   */
  static getFiles (asset, cb) {
    if ('version' in asset.groups) {
      FileManager.getDirectories(asset, dirs => {
        const allFiles = []
        const formattedDirs = FileManager.formatDirs(dirs)
        for (let i = 0; i < dirs.length; i++) {
          const files = glob.sync(`${dirs[i]}*`, { nodir: true })
          const formattedFiles = FileManager.formatDirs(files)
          let state, version
          if ('state' in asset.groups) {
            const dirSplit = formattedDirs[i].split('_')
            state = dirSplit[0]
            version = state === 'wip' || state === 'render' ? '_' : dirSplit[1] === 'valid' ? dirSplit[1] : dirSplit[1].substr(1)
          } else {
            // version = parseInt(formattedDirs[i].substr(1));
            version = formattedDirs[i]
          }
          let comment = ''
          const tags = []

          for (let j = 0; j < files.length; j++) {
            const f = formattedFiles[j]
            const fileSplit = f.split('.')
            const ext = fileSplit[fileSplit.length - 1]
            if (formattedFiles[j] === 'comment.txt') {
              comment = readFileSync(files[j], 'utf8')
            } else if (ext === 'tag') {
              tags.push(fileSplit[0])
            }
          }
          for (let j = 0; j < files.length; j++) {
            const f = formattedFiles[j]
            const fileSplit = f.split('.')
            const ext = fileSplit[fileSplit.length - 1]
            if (formattedFiles[j] !== 'comment.txt' && ext !== 'tag') {
              const stats = statSync(files[j])

              const file = new File(
                fileSplit[0],
                ext,
                stats.size,
                stats.mtime,
                comment,
                tags,
                files[j]
              )
              if ('state' in asset.groups) {
                file.state = state
              }
              file.version = version
              allFiles.push(file)
            }
          }
        }
        cb(allFiles)
      })
    } else {
      const formattedPath = FileManager.formatPath(asset)
      const slicedPath = FileManager.slicePath(formattedPath)
      const allFiles = []
      const files = glob.sync(`${slicedPath}*`, { nodir: true })
      const formattedFiles = FileManager.formatDirs(files)

      let comment = ''
      const tags = []

      for (let j = 0; j < files.length; j++) {
        const f = formattedFiles[j]
        const fileSplit = f.split('.')
        const ext = fileSplit[fileSplit.length - 1]
        if (formattedFiles[j] === 'comment.txt') {
          comment = readFileSync(files[j], 'utf8')
        } else if (ext === 'tag') {
          tags.push(fileSplit[0])
        }
      }
      for (let j = 0; j < files.length; j++) {
        const f = formattedFiles[j]
        const fileSplit = f.split('.')
        const ext = fileSplit[fileSplit.length - 1]
        if (formattedFiles[j] !== 'comment.txt' && ext !== 'tag') {
          const stats = statSync(files[j])

          const file = new File(
            fileSplit[0],
            ext,
            stats.size,
            stats.mtime,
            comment,
            tags,
            files[j]
          )
          allFiles.push(file)
        }
      }
      cb(allFiles)
    }
  }

  /**
   * @static getSequenceFiles - Get the sequences from a path that is created from the assetId
   *
   * @param {Object}   asset The AssetId used to reconstruct the path
   * @param {function} cb    A callback function, the found sequences are passed to this function as argument
   */
  static getSequenceFiles (asset, cb) {
    if ('version' in asset.groups) {
      FileManager.getDirectories(asset, dirs => {
        const allFiles = []
        const formattedDirs = FileManager.formatDirs(dirs)
        for (let i = 0; i < dirs.length; i++) {
          // let files = glob.sync(`${dirs[i]}*`, {nodir: true});
          const fileSequences = findSequencesOnDisk(dirs[i])
          // let formattedFiles = FileManager.formatDirs(files);
          let state, version
          if ('state' in asset.groups) {
            const dirSplit = formattedDirs[i].split('_')
            state = dirSplit[0]
            version = state === 'wip' || state === 'render' ? '_' : dirSplit[1].substr(1)
          } else {
            // version = parseInt(formattedDirs[i].substr(1));
            version = formattedDirs[i]
          }
          let comment = ''
          const tags = []

          for (let j = 0; j < fileSequences.length; j++) {
            //     let f = formattedFiles[j];
            const s = fileSequences[j]
            const fileSplit = s.split('.')
            //     let ext = fileSplit[fileSplit.length-1];
            if (s.basename + s.extension === 'comment.txt') {
              comment = readFileSync(s.dirname + s.basename + s.extension, 'utf8')
            } else if (s.extension === 'tag') {
              tags.push(fileSplit[0])
            }
          }
          for (let j = 0; j < fileSequences.length; j++) {
            const s = fileSequences[j]
            // let f = formattedFiles[j];
            // let fileSplit = f.split(".");
            // let ext = fileSplit[fileSplit.length-1];
            const ext = s.extension.substr(1)
            if (s.basename + s.extension !== 'comment.txt' && ext !== 'tag' && s._frameSet !== undefined) {
              // let stats = statSync(files[j]);
              //
              const sequence = new Sequence(s, comment, tags)
              if ('state' in asset.groups) {
                sequence.state = state
              }
              sequence.version = version
              allFiles.push(sequence)
            }
          }
        }
        cb(allFiles)
      })
    } else {
      const formattedPath = FileManager.formatPath(asset)
      const slicedPath = FileManager.slicePath(formattedPath)
      const allFiles = []
      const files = glob.sync(`${slicedPath}*`, { nodir: true })
      const formattedFiles = FileManager.formatDirs(files)

      let comment = ''
      const tags = []

      for (let j = 0; j < files.length; j++) {
        const f = formattedFiles[j]
        const fileSplit = f.split('.')
        const ext = fileSplit[fileSplit.length - 1]
        if (formattedFiles[j] === 'comment.txt') {
          comment = readFileSync(files[j], 'utf8')
        } else if (ext === 'tag') {
          tags.push(fileSplit[0])
        }
      }
      for (let j = 0; j < files.length; j++) {
        const f = formattedFiles[j]
        const fileSplit = f.split('.')
        const ext = fileSplit[fileSplit.length - 1]
        if (formattedFiles[j] !== 'comment.txt' && ext !== 'tag') {
          const stats = statSync(files[j])

          const file = new File(
            fileSplit[0],
            ext,
            stats.size,
            stats.mtime,
            comment,
            tags,
            files[j]
          )
          allFiles.push(file)
        }
      }
      cb(allFiles)
    }
    // FileManager.getDirectories(asset, dirs => {
    //   let allFiles = [];
    //   let formattedDirs = FileManager.formatDirs(dirs);
    //   for(let i = 0; i < dirs.length; i++) {
    //     let files = glob.sync(`${dirs[i]}*`, {nodir: true});
    //     let formattedFiles = FileManager.formatDirs(files);
    //     let dirSplit = formattedDirs[i].split("_");
    //     let state = dirSplit[0];
    //     let version = state == "wip" ? "_" : dirSplit[1];
    //
    //     let comment = "";
    //     let tags = [];
    //     let sequences = [];
    //
    //     for(let j = 0; j < files.length; j++) {
    //       let f = formattedFiles[j];
    //       let fileSplit = f.split(".");
    //       let ext = fileSplit[fileSplit.length-1];
    //       if(fileSplit.length === 3 && !Number.isNaN(fileSplit[1]) && !sequences.includes(fileSplit[0])){
    //         sequences.push(fileSplit[0]);
    //       }
    //       if(formattedFiles[j] == "comment.txt") {
    //         comment = readFileSync(files[j], "utf8");
    //       } else if(ext == "tag") {
    //         tags.push(fileSplit[0]);
    //       }
    //     }
    //     sequences.forEach((sequence, i) => {
    //       sequences[i] = new Sequence(sequence);
    //     });
    //
    //     for(let j = 0; j < files.length; j++) {
    //       let f = formattedFiles[j];
    //       let fileSplit = f.split(".");
    //       let ext = fileSplit[fileSplit.length-1];
    //       let stats = statSync(files[j]);
    //
    //       if(fileSplit.length === 3 && !Number.isNaN(fileSplit[1])){
    //         var k = 0;
    //         sequences.forEach((sequence, i) => {
    //           if(sequence.name === fileSplit[0]){
    //             sequence.addFile(
    //               fileSplit[0],
    //               state,
    //               version,
    //               ext,
    //               stats.size,
    //               stats.mtime,
    //               comment,
    //               tags,
    //               files[j],
    //               fileSplit[1]
    //             )
    //           }
    //         });
    //       }
    //       else{
    //         if(formattedFiles[j] != "comment.txt" && ext != "tag") {
    //
    //           let file = new File(
    //             fileSplit[0],
    //             state,
    //             version,
    //             ext,
    //             stats.size,
    //             stats.mtime,
    //             comment,
    //             tags,
    //             files[j]
    //           );
    //           allFiles.push(file);
    //         }
    //       }
    //     }
    //     var k = 0;
    //     console.log(sequences);
    //     sequences.forEach((sequence, i) => {
    //       allFiles.push(sequence);
    //     });
    //   }
    //   cb(allFiles);
    // });
  }

  /**
   * @static formatPath - Get a path from an AssetId
   *
   * @param {Object} asset The AssetId used to create the path
   *
   * @returns {string} The path made from the AssetId
   */
  static formatPath (asset) {
    const formattedPath = format(asset.path, asset.groups)
    return formattedPath
  }

  /**
   * @static slicePath - Remove undefined parths of a path
   *
   * @param {string} path The path with undefined values
   *
   * @returns {string} The sliced path
   */
  static slicePath (path) {
    const index = path.indexOf('<>')
    const slicedPath = path.slice(0, index)
    return slicedPath
  }

  /**
   * @static formatDirs - Change an array of directories with full paths to an array with only the base names of the directories
   *
   * @param {string[]} dirs An array of directories with complete paths
   *
   * @returns {string[]} An array of directories with only their base names
   */
  static formatDirs (dirs) {
    const formattedDirs = []
    for (let i = 0; i < dirs.length; i++) {
      // let dirPath = dirs[i].slice(0, -1);
      // let index = dirPath.lastIndexOf("/");
      // let dir = dirPath.slice(index+1);
      const dir = basename(dirs[i])
      formattedDirs.push(dir)
    }

    return formattedDirs
  }

  /**
   * @static removeDoubles - Remove doubles from a list of directories
   *
   * @param {string[]} allDirs An array of directories
   *
   * @returns {string[]} An array of directories without doubles
   */
  static removeDoubles (allDirs) {
    const dirs = []
    for (let i = 0; i < allDirs.length; i++) {
      if (!dirs.includes(allDirs[i])) {
        dirs.push(allDirs[i])
      }
    }
    return dirs
  }

  /**
   * @static writeFile - Write to a file
   *
   * @param {string} path The path to the file to write
   * @param {string} data The data that should be written to the file
   */
  static writeFile (path, data) {
    writeFile(path, data, 'utf8', (err) => {
      if (err) throw err
      console.log('The file has been saved!')
    })
  }

  /**
   * @static deleteFile - Delete a file
   *
   * @param {string} path The path to the file to delete
   */
  static deleteFile (path) {
    unlink(path, (err) => {
      if (err) throw err
      console.log(`${path} was deleted`)
    })
  }
}

export default FileManager
