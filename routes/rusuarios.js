module.exports = function(app, swig, gestorBD) {
    app.get("/", function(req, res) {
        let respuesta = swig.renderFile('views/index.html',{usuario: req.session.usuario});
        res.send(respuesta);
    });

    app.get("/registrarse", function(req, res) {
        let respuesta = swig.renderFile('views/bregistro.html', {});
        res.send(respuesta);
    });

    app.get("/identificarse", function(req, res) {
        let respuesta = swig.renderFile('views/bidentificacion.html', {});
        res.send(respuesta);
    });

    app.post('/usuario', function(req, res) {
        if(req.body.password != req.body.repassword){
            // TEMPORAL MAS TARDE LANZAR ERROR
            res.redirect("/registrarse" +
                "?mensaje=Las contraseñas no coinciden"+
                "&tipoMensaje=alert-danger ");
            return;
        }
        let seguro = app.get("crypto").createHmac('sha256', app.get('clave'))
            .update(req.body.password).digest('hex');
        let usuario = {
            email : req.body.email,
            name : req.body.name,
            surname : req.body.surname,
            password : seguro,
            rol : "USUARIO"
        };
        comprobarEmailSinUso(req.body.email,function (usable) {
            if(usable){
                gestorBD.insertarUsuario(usuario, function(id) {
                    if (id == null){
                        res.redirect("/registrarse"+ "?mensaje=Ha ocurrido un problema al insertar usuario"+
                            "&tipoMensaje=alert-danger ");
                    } else {
                        req.session.usuario = usuario;
                        res.redirect("/home");
                    }
                });
            }else{
                res.redirect("/registrarse"+ "?mensaje=Email ya en uso por el sistema"+
                    "&tipoMensaje=alert-danger ");
            }
        })

    });

    app.post("/identificarse", function(req, res) {
        let seguro = app.get("crypto").createHmac('sha256', app.get('clave'))
            .update(req.body.password).digest('hex');
        let criterio = {
            email : req.body.email,
            password : seguro
        };
        gestorBD.obtenerUsuarios(criterio, function(usuarios) {
            if (usuarios == null || usuarios.length == 0) {
                req.session.usuario = null;
                res.redirect("/identificarse" +"?mensaje=Usuario o contraseñas incorrectos"+
                    "&tipoMensaje=alert-danger ");
            } else {
                req.session.usuario = usuarios[0];
                res.redirect("/home");
            }
        });
    });

    app.get("/user/list", function (req, res) {
        let criterio;
        if( req.query.busqueda != null ){
            criterio = {
                '_id': {$not: {$eq: gestorBD.mongo.ObjectID(req.session.usuario._id)}},
                $or:[
                    {'name': new RegExp(req.query.busqueda + "+", 'i')},
                    {'surname': new RegExp(req.query.busqueda + "+", 'i')},
                    {'email': new RegExp(req.query.busqueda + "+", 'i')},
                ],
                'rol': {$not: {$eq: "ADMINISTRADOR"}}
            };
        }else {
            criterio = {
                '_id': {$not: {$eq: gestorBD.mongo.ObjectID(req.session.usuario._id)}},
                'rol': {$not: {$eq: "ADMINISTRADOR"}}
            };
        }
        gestorBD.obtenerUsuarios(criterio, function (usuarios) {
            if (usuarios == null ){
                res.redirect("/home"+ "?mensaje=Ha ocurrido un problema al mostar los usuarios de la red social"+
                    "&tipoMensaje=alert-danger ");
            } else {
                let respuesta = swig.renderFile('views/buserlist.html', {usuario: req.session.usuario, usuarios: usuarios});
                res.send(respuesta);
            }
        })
    });

    function comprobarEmailSinUso(email,functionCallback){
        if(email == null){
            res.redirect("/registrarse"+ "?mensaje=Ha ocurrido un problema al insertar usuario: Email no valido"+
                "&tipoMensaje=alert-danger ");
        } else{
            let criterio = {
                email : email
            };
            gestorBD.obtenerUsuarios(criterio, function (usuarios) {
                if(usuarios == null || usuarios.length > 0){
                    functionCallback(false);
                } else{
                    functionCallback(true);
                }
            })
        }
    }
};