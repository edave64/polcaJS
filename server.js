/* A small server for static content
 * Released into the public domain
 */

var $ = require('./scripts/protojazz-min'),
    fs = require('fs'),
    path = require('path'),
    http = require('http');

mimetable = {
    '.html' : 'text/html',
    '.js'   : 'application/javascript',
    '.css'  : 'text/css',
    '.png'  : 'image/png',
    '.jpg'  : 'image/jpeg',
    '.gif'  : 'image/gif',
    '.ogg'  : 'audio/ogg'
}

server = {
    port: 80,

    listener: function (request, response) {
        new server.call (request, response)
    },

    startup: function () {
        http.createServer(this.listener).listen(this.port);
        console.log('Server running at http://127.0.0.1:80/');
    },

    call: $.proto({
        init: function (request, response) {
            this.starttime = Date.now()
            this.req = request
            this.res = response
            try {
                this.req.url = this.pageUrl()
                this.res.setHeader('Content-Type', mimetable[path.extname(this.req.url)]);
                this.flush()
            } catch (e) {
                this.res.statusCode = '503'
                this.res.write('503 - Internal server error.')
                this.res.end()
                console.log('ERROR: '+e.message)
            }
        },

        flush: function () {
            path.exists(this.req.url, (function (exists) {
                if (!exists){
                    console.log('asdf')
                    this.res.statusCode = '404'
                    this.res.write('404 - File not found.')
                    this.res.end()
                    this.log()
                } else {
                    this.res.statusCode = '200'
                    var file = fs.createReadStream(this.req.url)
                    file.on('end', this.log.bind(this))
                    file.pipe(this.res, {close :true})
                }
            }).bind(this));
        },

        pageUrl: function () {
            var page
            if (this.req.url.indexOf('..') != -1 ||
                this.req.url.indexOf('server.js') != -1 ||
                this.req.url == '/') page = '/index.html'
            else page = this.req.url

            return '.'+page
        },

        log: function () {
            console.log(this.req.url + ' -> ' + this.res.statusCode +
                        ' after: '+(Date.now()-this.starttime).toString())
        }
    })
}

server.startup()