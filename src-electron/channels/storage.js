
import { safeStorage } from 'electron';
const fs = require('fs');
const dbFilename = './userData.enc';
const success = { success: true };

export const storeData = async (envt, string) => {
    if (!safeStorage.isEncryptionAvailable()) {
        throw new Error("Criptografia não disponível");
    }
    const encryptedData = safeStorage.encryptString(string);


    if (fs.existsSync(dbFilename)) fs.unlinkSync(dbFilename);
    const stream = fs.createWriteStream(dbFilename);

    await stream.once('open', () => {
        stream.write(encryptedData)
        stream.end();
    })
    return success;
}

export const readData = async (envt) => {
    if (!safeStorage.isEncryptionAvailable()) {
        throw new Error("Criptografia não disponível");
    }
    if (!fs.existsSync(dbFilename)) return {};
    const encryptedData = fs.readFileSync(dbFilename);
    return JSON.parse(safeStorage.decryptString(encryptedData));

}
export const clearData = async (envt) => {
    if (fs.existsSync(dbFilename)) fs.unlinkSync(dbFilename);
    return success;
}