import { dialog } from 'electron';
const fs = require('fs');
const path = require('path')

export const openCredFile = async function () {
    const { canceled, filePaths } = await dialog.showOpenDialog()
    if (canceled) {
        return [null,null];
    } else {
        const credentialFilePath = filePaths[0];
        const credentialFilename = credentialFilePath.split(path.sep).pop();
        const credJSON = fs.readFileSync(credentialFilePath).toString();
        return [credJSON, credentialFilename];
    }
}

export const openFile = async function () {
    const { canceled, filePaths } = await dialog.showOpenDialog()
    if (canceled) {
        return false;
    } else {
        return filePaths[0];
    }
}