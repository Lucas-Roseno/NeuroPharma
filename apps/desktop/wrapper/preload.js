const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('neuropharmaDesktop', {
  selectWorkspaceParent: () => ipcRenderer.invoke('neuropharma:select-workspace-parent'),
});
