# Proxy to save files as Zip and allow downloading

## How to run

Set env variable `FILE_PROXY_KEY` or rename `key.secret.json.template` to `key.secret.json` and set your password in there (plaintext).

Also env variable `PORT` is used to set the port, you can also set the port in the key.secret.json file

```js
let port = process.env.PORT || require('./key.secret.json').port;
```

run:

```sh
npm install
npm start
```
