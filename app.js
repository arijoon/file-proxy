let express = require('express'),
    http = require('http'),
    https = require('https'),
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

app.get('/file/:key', (req, res) => {
    if (req.params.key != getKey()) {
        res.status(404).end();
        return;
    }

    if(!req.query.add) {
        res.status(400).end();
        return;
    }

    getFile(req.query.add)
        .then(res => {
            return new Promise((resolve, reject) => {
                let filename = tempPath + '/' + `down_${Math.floor(Math.random()*100000)}.zip`;
                let file = fs.createWriteStream(filename);

                res.pipe(file);

                file.on('finish', function () {
                    file.close(() => resolve(filename));
                });

                file.on('error', () => reject());
            });

    }).then(filename => {
        
        console.log("Sending back the file ..");
        res.sendFile(filename);

    }).catch(err => {
        console.error('Error downloading the file', err);

        res.status(500)
            .statusMessage("Error in download")
            .send(err);
    });
});

app.use(express.static(__dirname + '/tmp'));
app.listen(port);

console.log(`[${process.pid}] Listening on port ${port}`);


function getKey() {
    return require('./key.secret.json').key;
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