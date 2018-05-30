let express = require('express'),
    http = require('http'),
    https = require('https'),
    path = require('path'),
    archiver = require('archiver'),
    fs = require('fs');

let app = express();

let tempPath = 'tmp';

let port = process.env.PORT || require('./key.secret.json').port;

let httpsReg = /https:\/\//;

app.get('/files/', (req, res) => {
    fs.readdir(tempPath, (err, files) => {

        if(err) {
            res.status(500).end();
            console.error(err);
            return;
        }

        let msg = "*******************************************************************************<br />";
        msg += "********************** <strong>If you aren't meant to be here piss off</strong> ************************<br />";
        msg += "*******************************************************************************";
        msg += '<br /><ul>';

        files.forEach(file => {
            msg += `<li>${file}</li>`;
        });
        msg += "</ul>";

        res.send(msg);
    });
});

app.get('/remove', (req, res) => {

    if(!verifyKey(req.query.key, res)) return;

    let filename = path.join(tempPath, req.query.name);
    if(!req.query.name || !fs.existsSync(filename)) {
        res.status(404)
            .send(`File not found`);
        return;
    }

    if(/[\/\\]/.test(req.query.name)) {
        res.status(400)
            .send();
        return;
    }

    fs.unlink(filename, (err) => {
        if(err) {
            res.status(500)
                .send(err);
            return;
        }

        res.status(200)
            .send(`Removed ${filename}`);
    });
});

app.get('/file', (req, res) => {

    if(!verifyKey(req.query.key, res)) return;

    if(!req.query.add) {
        res.status(400).end();
        return;
    }

    getFile(req.query.add)
        .then(res => {
            return new Promise((resolve, reject) => {
                let filename = tempPath + '/' + `down_${Date.now()}_${Math.floor(Math.random()*10)}`;
                let file = fs.createWriteStream(filename);

                res.pipe(file);

                file.on('finish', function () {
                    file.close();

                    zipUp(filename)
                        .then((f) => {
                            resolve(f);
                            fs.unlink(filename);
                        }).catch(err => reject(err));
                });

                file.on('error', (err) => { 
                    fs.unlink(filename);
                    reject(err);
                });
            });

    }).then(filename => {
        
        console.log("Sending back the file ..");

        res.sendFile(__dirname + '/' + filename, {}, (err) => {
            if(err) console.error(err);
            else {
                console.log('sent file,', filename);
            }

        });

    }).catch(err => {
        console.error('Error downloading the file', err);

        res.status(500)
            .send(err);
        });
});

app.set('views', __dirname + "/views");
app.set('view engine', 'pug');

app.get('/app-ui', function (req, res) {
    listFiles().then(files => {
        res.render('index', { files: files });
    }).catch(err => res.status(500).send());
});

app.use(express.static(__dirname + '/tmp'));
app.use(express.static(__dirname + '/views'));
app.listen(port);

console.log(`[${process.pid}] Listening on port ${port}`);

function verifyKey(key, res) {
    if(key == getKey()) {
        return true;
    }

    res.status(403)
        .end();

    return false;
}

function zipUp(filename) {
    return new Promise((resolve, reject) => {
        var archive = archiver('zip', {
            zlib: { level: 0 } // Sets the compression level.
        });

        var output = fs.createWriteStream(`${filename}.zip`);

        output.on('close', function () {
            console.log(archive.pointer() + ' total bytes');

            resolve(`${filename}.zip`);
        });

        archive.on('error', function(err) {
            reject(err);
        });

        archive.pipe(output);

        archive.file(filename, { name: 'your_file' });

        archive.finalize();
    });
}

function getKey() {
    return process.env.FILE_PROXY_KEY || require('./key.secret.json').key;
}

function getFile(url) {
    return new Promise((resolve, reject) => {
        let handler = httpsReg.test(url) ? https : http;

        handler.get(url, function (response) {
            resolve(response);
        }).on('error', function (err) {
            reject(err);
        });
    });
}

function listFiles() {
    return new Promise((resolve, reject) => {
        fs.readdir(tempPath, (err, files) => {
            if(err) reject(err);
            else resolve(files);
        });
    });
}