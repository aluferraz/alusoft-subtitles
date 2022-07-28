/**
 * This file is used specifically for security reasons.
 * Here you can access Nodejs stuff and inject functionality into
 * the renderer thread (accessible there through the "window" object)
 *
 * WARNING!
 * If you import anything from node_modules, then make sure that the package is specified
 * in package.json > dependencies and NOT in devDependencies
 *
 * Example (injects window.myAPI.doAThing() into renderer thread):
 *
 *   import { contextBridge } from 'electron'
 *
 *   contextBridge.exposeInMainWorld('myAPI', {
 *     doAThing: () => {}
 *   })
 */

import { contextBridge, ipcRenderer } from 'electron'
import { channels } from './alusoft-channels';

contextBridge.exposeInMainWorld('alusoftAPI', {
    // convertSample: async () => { return await ipcRenderer.invoke(channels.sample.convert) },
    // uploadSample: async () => { return await ipcRenderer.invoke(channels.sample.upload) },
    store: async (string) => { return await ipcRenderer.invoke(channels.storage.store, string) },
    read: async () => { return await ipcRenderer.invoke(channels.storage.read) },
    clear: async () => { return await ipcRenderer.invoke(channels.storage.clear) },
    openCredentials: async () => { return await ipcRenderer.invoke(channels.file.openCredFile) },
    openFile: async () => { return await ipcRenderer.invoke(channels.file.open) },
    createSubtitle: async (data) => { return await ipcRenderer.invoke(channels.subtitle.create, data) },
    subtitleUpdate: (callback) => ipcRenderer.on('subtitle-update', callback)
});