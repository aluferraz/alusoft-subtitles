const fs = require('fs');
const { createFFmpeg, fetchFile } = require('@ffmpeg/ffmpeg');
const ffmpeg = createFFmpeg({ log: true });
const { Storage } = require('@google-cloud/storage');

const success = { success: true };

import { openFile, openCredFile } from './channels/file'
import {
    storeData,
    readData,
    clearData,
} from './channels/storage'

import { createSubs } from './channels/subtitles'

export {
    openCredFile,
    openFile,
    storeData,
    readData,
    clearData,
    createSubs,
};




export const convertSample = async () => {
    if (!ffmpeg.isLoaded()) await ffmpeg.load();
    ffmpeg.FS('writeFile', 'test.mp4', await fetchFile('./test.mp4'));
    await ffmpeg.run('-i', 'test.mp4',
        '-ac', '1',
        '-acodec', 'pcm_s16le',
        '-ar', '16000',
        '-f', 'wav',
        'test.wav');
    await fs.promises.writeFile('./test.wav', ffmpeg.FS('readFile', 'test.wav'));
    return success;
};

export const uploadSample = async () => {

    const storage = new Storage({ keyFilename: './alusoft-a7002eff3c61.json' });
    // Replace with your bucket name and filename.
    const bucketname = 'srtin.alusoft.com.br';
    const filename = 'test.wav';
    const res = await storage.bucket(bucketname).upload('./' + filename);
    // `mediaLink` is the URL for the raw contents of the file.
    const url = res[0].metadata.mediaLink;
    return url;
};

