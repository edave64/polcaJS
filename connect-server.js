var connect = require('connect');
connect(
    connect.logger(
        '\033[90m:method\033[0m \033[36m:url\033[0m \033[90m:status :response-timems -> :res[Content-Type]\033[0m'),
    connect.static(__dirname)
).listen(80);