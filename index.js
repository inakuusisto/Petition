const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const cookieParser = require("cookie-parser");
const cookieSession = require('cookie-session');
const hb  = require('express-handlebars');
var router = require('./routers/router');


app.engine('handlebars', hb());
app.set('view engine', 'handlebars');

app.use(bodyParser.urlencoded({
    extended: false
}));

app.use(cookieParser());

app.use(cookieSession({
    secret: 'funny string',
    maxAge: 1000 * 60 * 60 * 24 * 14
}));


app.use('/public', express.static(__dirname + '/public/'));

app.use((req, res, next) => {
    if (!req.session.user) {
        if (req.url != '/register' && req.url != '/login') {
            res.redirect('/register');
        } else {
            next();
        }
    } else {
        if (req.url == '/register' || req.url == '/login') {
            res.redirect('/petition');
        } else {
            next();
        }
    }
});


app.use(router);

app.listen(process.env.PORT || 8080, function() {console.log('listening on port 8080');});
