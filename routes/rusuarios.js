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
        if(req.body.email=="" || req.body.name=="" ||req.body.surname=="" ||req.body.password==""||req.body.repassword==""){
            res.redirect("/registrarse" +
                "?mensaje=No puede haber campos vacios"+
                "&tipoMensaje=alert-danger ");
            return;
        }
        if(req.body.password != req.body.repassword){
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
            rol : "USUARIO",
            friends : [],
            invites : [],
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
        if(req.body.email=="" || req.body.password==""){
            res.redirect("/identificarse" +
                "?mensaje=No puede haber campos vacios"+
                "&tipoMensaje=alert-danger ");
            return;
        }
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
                return;
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
        let pg = parseInt(req.query.pg); // Es String !!!
        if ( req.query.pg == null){ // Puede no venir el param
            pg = 1;
        }
        gestorBD.obtenerUsuariosPg(criterio, pg , function(usuarios, total ) {
            if (usuarios == null) {
                res.redirect("/home"+ "?mensaje=Ha ocurrido un problema al mostar los usuarios de la red social"+
                    "&tipoMensaje=alert-danger ");
            } else {
                let ultimaPg = total/5;
                if (total % 5 > 0 ){ // Sobran decimales
                    ultimaPg = ultimaPg+1;
                }
                let paginas = []; // paginas mostrar
                for(let i = pg-2 ; i <= pg+2 ; i++){
                    if ( i > 0 && i <= ultimaPg){
                        paginas.push(i);
                    }
                }
                if(calculateOtherUserStatusesWithCurrentUser(usuarios,req.session.usuario)) {
                    let respuesta = swig.renderFile('views/buserlist.html', {
                        usuario: req.session.usuario,
                        usuarios: usuarios,
                        paginas: paginas,
                        actual: pg
                    });
                    res.send(respuesta);
                } else{
                    res.redirect("/home"+ "?mensaje=Ha ocurrido un problema al mostar los usuarios de la red social"+
                        "&tipoMensaje=alert-danger ");
                }
            }
        });
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

    function calculateOtherUserStatusesWithCurrentUser(usuarios, usuario){
        if(usuarios == null || usuario == null){
            return false;
        }
        let estadoNoActualizado = true;
        for(i=0; i<usuarios.length; i++){
           if(usuario.invites.includes(usuarios[i]._id.toString()) || usuarios[i].invites.includes(usuario._id.toString())){
               usuarios[i].status = "invited";
               estadoNoActualizado = false;
           }
           if(usuario.friends.includes(usuarios[i]._id.toString()) || usuarios[i].friends.includes(usuario._id.toString())){
               usuarios[i].status = "friend";
               estadoNoActualizado = false;
           }
           if(estadoNoActualizado){
               usuarios[i].status = "unknown";
               estadoNoActualizado = false;
           }
           estadoNoActualizado = true;
        }
        return true;
    }
};