const fs = require('fs');
const { createFFmpeg, fetchFile } = require('@ffmpeg/ffmpeg');
const ffmpeg = createFFmpeg({ log: true });
const { Storage } = require('@google-cloud/storage');
import moment from "moment-timezone";
import path from "path";
const speech = require('@google-cloud/speech');
import { stringifySync } from 'subtitle'
const { ipcRenderer, Notification } = require("electron");


const workdir = './workdir';

async function extractAudio(videoPath) {
    if (!ffmpeg.isLoaded()) await ffmpeg.load();
    ffmpeg.FS('writeFile', 'video.mp4', await fetchFile(videoPath));
    const timestamp = moment().tz("America/Fortaleza").format("YYYY-MM-DDTHH-mm-ss-SSS");
    const outputFilename = `audio-${timestamp}.wav`;
    await ffmpeg.run('-i', 'video.mp4',
        '-ac', '1',
        '-acodec', 'pcm_s16le',
        '-ar', '16000',
        '-f', 'wav',
        'audio.wav');
    await fs.promises.writeFile(`${workdir}/${outputFilename}`, ffmpeg.FS('readFile', 'audio.wav'));
    try {
        ffmpeg.FS('unlink', 'video.mp4');
        ffmpeg.FS('unlink', 'audio.mp4');
    } catch (_) { }
    return outputFilename;
}
async function uploadAudioToGCS(bucket, filename, credentials) {
    const storage = new Storage({ credentials });
    // Replace with your bucket name and filename.
    const res = await storage.bucket(bucket).upload(workdir + '/' + filename);
    // `mediaLink` is the URL for the raw contents of the file.
    const url = res[0].metadata.mediaLink;
    return url;
}


async function speech2srt(bucket, filename, credentials, media, mainWindow) {
    const client = new speech.SpeechClient({ credentials });
    //file
    const gcsUri = `gs://${bucket}/${filename}`;
    //config
    const encoding = 'LINEAR16';
    const sampleRateHertz = 16000;
    const languageCode = 'pt-BR';
    const enableAutomaticPunctuation = true;
    const enableWordTimeOffsets = true;
    const maxAlternatives = 1;

    const config = {
        encoding,
        sampleRateHertz,
        languageCode,
        enableAutomaticPunctuation,
        enableWordTimeOffsets,
        maxAlternatives,
    };
    const audio = {
        uri: gcsUri,
    };

    const request = {
        config: config,
        audio: audio,
    };
    // Detects speech in the audio file. This creates a recognition job that you
    // can wait for now, or get its result later.
    console.log('Requesting transcription');
    const [operation] = await client.longRunningRecognize(request);
    // Get a Promise representation of the final result of the job
    const [response] = await operation.promise();
    console.log('Transcription finish');

    let subs = [];

    sendMessage('Criando legendas no diretório original .. 📝', mainWindow);
    for (let i in response.results) {
        subs = break_sentences(40, subs, response.results[i].alternatives[0])
    }
    const subtitleFilePath = media.replace('.mp4', '.vtt');
    fs.writeFileSync(subtitleFilePath, stringifySync(subs, { format: 'WebVTT' }));

    // const subtitleFilePathSrt = media.replace('.mp4', '.srt');
    // fs.writeFileSync(subtitleFilePathSrt, stringifySync(subs, { format: 'SRT' }));
    return subs;
}


function break_sentences(max_chars, subs, alternative) {
    let firstword = true
    let charcount = 0
    let idx = subs.length + 1;
    let content = "";
    let start = null;
    for (let i in alternative.words) {
        let w = alternative.words[i];
        if (firstword) {
            start = w.startTime.seconds * 1000;
        }
        charcount += w.word.length;
        content += " " + w.word.trim()
        if (
            w.word.indexOf(".") !== -1 ||
            w.word.indexOf("!") !== -1 ||
            w.word.indexOf("?") !== -1 ||
            charcount > max_chars ||
            (w.word.indexOf(",") !== -1 && !firstword)) {
            subs.push(
                {
                    type: 'cue',
                    data: {
                        start,
                        end: w.endTime.seconds * 1000,
                        text: content
                    }
                }
            );
            firstword = true;
            idx += 1;
            content = "";
            charcount = 0;
        } else {
            firstword = false
        }
    }
    return subs;
}
async function clear() {
    console.log('keeping the house clean!');

    const directory = workdir;

    fs.readdir(directory, (err, files) => {
        files.forEach(file => {
            if (file.split('.')[1] == 'wav') fs.unlinkSync(directory + path.sep + file);
        });
    });
    //await new Storage({ credentials }).bucket(bucket).delete('./workdir/' + audioFile); //Bucket lifecycle

}
export const createSubs = async (evt, data, mainWindow) => {
    let result = true;
    try {
        if (!fs.existsSync(workdir)) {
            fs.mkdirSync(workdir);
        }
        const { media, bucket, credentials } = data;
        sendMessage('Extraindo audio do vídeo .. 🎧', mainWindow);
        const audioFile = await extractAudio(media);
        sendMessage('Enviando aúdio para núvem .. ☁️', mainWindow);
        const audioFileUrl = await uploadAudioToGCS(bucket, audioFile, credentials);
        console.log(`File uploaded to bucket: ${audioFileUrl}`);
        sendMessage('Reconhendo fala com Inteligência Artificial .. (Demora um pouquinho ) 🤖', mainWindow);
        await speech2srt(bucket, audioFile, credentials, media, mainWindow);
    } catch (ex) {
        sendMessage(ex.message, mainWindow, true);
        result = ex.message;
    } finally {
        sendMessage('Limpando a bagunça .. 🧹', mainWindow);
        clear();
    }
    mainWindow.once('focus', () => mainWindow.flashFrame(false))
    mainWindow.flashFrame(true)
    return result;
}

function sendMessage(msg, mainWindow, error = false) {
    error ? console.error(msg) : '';
    mainWindow.webContents.send("subtitle-update", msg);
}