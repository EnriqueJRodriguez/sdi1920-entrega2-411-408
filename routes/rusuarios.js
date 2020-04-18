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
            res.redirect("/registrarse");
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
        gestorBD.insertarUsuario(usuario, function(id) {
            if (id == null){
                res.redirect("/usuario");
            } else {
                req.session.usuario = usuario;
                res.redirect("/home");
            }
        });
    });

    app.post("/identificarse", function(req, res) {
        let seguro = app.get("crypto").createHmac('sha256', app.get('clave'))
            .update(req.body.password).digest('hex');
        let criterio = {
            email : req.body.email,
            password : seguro
        }
        gestorBD.obtenerUsuarios(criterio, function(usuarios) {
            if (usuarios == null || usuarios.length == 0) {
                req.session.usuario = null;
                res.redirect("/identificarse");
            } else {
                req.session.usuario = usuarios[0];
                res.redirect("/home");
            }
        });
    });

    app.get("/user/list", function (req, res) {
        let criterio = {};
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
        console.log(criterio);
        gestorBD.obtenerUsuarios(criterio, function (usuarios) {
            if (usuarios == null ){
                // ERROR a lanzar;
                return;
            } else {
                console.log(usuarios);
                let respuesta = swig.renderFile('views/buserlist.html', {usuario: req.session.usuario, usuarios: usuarios});
                res.send(respuesta);
            }
        })
    });

};