/**
 * Created by romans on 10/6/14.
 */
var connect = require('connect'),
    serveStatic = require('serve-static');

var app = connect();

app.use(serveStatic("./appstyles.html"));
app.listen(5000);
