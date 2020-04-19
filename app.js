// Módulos
var express = require('express');
var app = express();

let mongo = require('mongodb');
let gestorBD = require("./modules/gestorBD.js");
gestorBD.init(app,mongo);


let crypto = require('crypto');
let expressSession = require('express-session');
app.use(expressSession({
    secret: 'abcdefg',
    resave: true,
    saveUninitialized: true
}));

const log4js = require('log4js');
log4js.configure({
    appenders: { logger: { type: 'file', filename: 'logger.log' } },
    categories: { default: { appenders: ['logger'], level: 'info' } }
});

const logger = log4js.getLogger('logger');

let swig = require('swig');
let bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static('public'));
app.use(express.static('public/img'));

// Variables
app.set('port', 8081);
app.set('db','mongodb://admin:robertocornellananoexistesonlospadres@sdi1920-entrega2-411-408-shard-00-00-axx04.mongodb.net:27017,sdi1920-entrega2-411-408-shard-00-01-axx04.mongodb.net:27017,sdi1920-entrega2-411-408-shard-00-02-axx04.mongodb.net:27017/test?ssl=true&replicaSet=sdi1920-entrega2-411-408-shard-0&authSource=admin&retryWrites=true&w=majority');
app.set('clave','abcdefg');
app.set('crypto',crypto);

//Rutas/controladores por lógica
require("./routes/rusuarios.js")(app,swig, gestorBD); // (app, param1, param2, etc.)
require("./routes/rinvitaciones.js")(app,swig, gestorBD); // (app, param1, param2, etc.)
require("./routes/ramigos.js")(app,swig, gestorBD); // (app, param1, param2, etc.)

// routerUsuarioSession
let routerUsuarioSession = express.Router();
routerUsuarioSession.use(function(req, res, next) {
    console.log("routerUsuarioSession");
    if ( req.session.usuario ) {
        // dejamos correr la petición
        next();
    } else {
        console.log("va a : "+ req.session.destino)
        res.redirect("/identificarse");
    }
});

//Aplicar routerUsuarioSession
app.use("/desconectarse",routerUsuarioSession);
app.use("/home",routerUsuarioSession);
app.use("/user/list",routerUsuarioSession);
app.use("/invitations/",routerUsuarioSession);
app.use("/friends/",routerUsuarioSession);

app.use(express.static('public'));

app.get('/desconectarse', function (req, res) {
    req.session.usuario = null;
    res.redirect("/");
});
app.get("/home", function(req, res) {
    let respuesta = swig.renderFile('views/home.html',{usuario: req.session.usuario});
    res.send(respuesta);
});

// lanzar el servidor
app.listen(app.get('port'), function() {
    console.log("Servidor activo en el puerto 8081");
})