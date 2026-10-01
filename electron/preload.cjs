const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,
  platform: process.platform,
  saveVideoFile: (buffer, defaultName) => ipcRenderer.invoke('save-video-file', { buffer, defaultName })
});
