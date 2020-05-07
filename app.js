// Módulos
var express = require('express');
var app = express();

let mongo = require('mongodb');
let gestorBD = require("./modules/gestorBD.js");
gestorBD.init(app,mongo);

app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Credentials", "true");
    res.header("Access-Control-Allow-Methods", "POST, GET, DELETE, UPDATE, PUT");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, token");
    // Debemos especificar todas las headers que se aceptan. Content-Type, token
    next();
});

let jwt = require('jsonwebtoken');
app.set('jwt', jwt);

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

// routerUsuarioToken
var routerUsuarioToken = express.Router();
routerUsuarioToken.use(function(req, res, next) {
    // obtener el token, vía headers (opcionalmente GET y/o POST).
    var token = req.headers['token'] || req.body.token || req.query.token;
    if (token != null) {
        // verificar el token
        jwt.verify(token, 'secreto', function(err, infoToken) {
            if (err || (Date.now()/1000 - infoToken.tiempo) > 240 ) {
                res.status(403); // Forbidden
                res.json({
                    acceso : false,
                    error: 'Token invalido o caducado'
                });
                // También podríamos comprobar que intoToken.usuario existe
                return;
            } else {
                // dejamos correr la petición
                res.usuario = infoToken.usuario;
                next();
            }
        });
    } else {
        res.status(403); // Forbidden
        res.json({
            acceso : false,
            mensaje: 'No hay Token'}
        );
    }
});

// Aplicar routerUsuarioToken
app.use('/api/amigo', routerUsuarioToken);
app.use('/api/mensaje', routerUsuarioToken);

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
require("./api/routes/rapiusuarios.js")(app, gestorBD);

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
