module.exports = function(app, swig, gestorBD, logger) {
    /*
     * Petición GET que le devuelve la view "index" al usuario
     * que la realiza.
     */
    app.get("/", function(req, res) {
        logger.info("Usuario accede al index");
        let respuesta = swig.renderFile('views/index.html',{usuario: req.session.usuario});
        res.send(respuesta);
    });

    /*
     * Petición GET que le devuelve la view de registro de usuario
     * que la realiza.
     */
    app.get("/registrarse", function(req, res) {
        logger.info("Usuario accede a la página de registro");
        let respuesta = swig.renderFile('views/bregistro.html', {});
        res.send(respuesta);
    });

    /*
     * Petición GET que le devuelve la view de autenticación al usuario
     * que la realiza.
     */
    app.get("/identificarse", function(req, res) {
        logger.info("Usuario accede a la página de autenticación");
        let respuesta = swig.renderFile('views/bidentificacion.html', {});
        res.send(respuesta);
    });

    /*
     * Petición POST que registra un nuevo usuario en la base
     * de datos. Este usuario tendrá:
     *  - email
     *  - nombre
     *  - apellidos
     *  - contraseña
     *  - rol
     *  - Lista de amigos (vacía al principio)
     *  - Lista de invitaciones de amistad (vacía al principio)
     */
    app.post('/usuario', function(req, res) {
        logger.info("Usuario intenta registrarse");
        if(req.body.email=="" || req.body.name=="" ||req.body.surname=="" ||req.body.password==""||req.body.repassword==""){
            logger.info("Fallo en el registro de usuario, hay campos vacíos");
            res.redirect("/registrarse" +
                "?mensaje=No puede haber campos vacios"+
                "&tipoMensaje=alert-danger ");
            return;
        }
        if(req.body.password != req.body.repassword){
            logger.info("Fallo en el registro de usuario, las contraseñas no coinciden");
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
        // Comprobamos que el email no esté ya registrado en el sistema
        comprobarEmailSinUso(req.body.email,function (usable) {
            if(usable){
                gestorBD.insertarUsuario(usuario, function(id) {
                    if (id == null){
                        logger.info("Fallo en el registro de usuario");
                        res.redirect("/registrarse"+ "?mensaje=Ha ocurrido un problema al insertar usuario"+
                            "&tipoMensaje=alert-danger ");
                    } else {
                        logger.info("El usuario se registró con éxito");
                        req.session.usuario = usuario;
                        res.redirect("/home" +"?mensaje=Se ha registrado con exito"+
                            "&tipoMensaje=alert-success");
                    }
                });
            }else{
                logger.info("Fallo en el registro de usuario, el email ya está en uso por el sistema");
                res.redirect("/registrarse"+ "?mensaje=Email ya en uso por el sistema"+
                    "&tipoMensaje=alert-danger ");
            }
        })

    });

    /*
     * Petición POST que identifica al usuario que la realiza,
     * recibe un email y una contraseña.
     */
    app.post("/identificarse", function(req, res) {
        logger.info("Usuario intenta identificarse");
        if(req.body.email=="" || req.body.password ==""){
            logger.info("Fallo en la identificación, campos vacíos");
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
                logger.info("Fallo en la identificación, usuario o contraseña incorrectos");
                req.session.usuario = null;
                res.redirect("/identificarse" +"?mensaje=Usuario o contraseñas incorrectos"+
                    "&tipoMensaje=alert-danger ");
                return;
            } else {
                logger.info("Usuario identificado con éxito");
                req.session.usuario = usuarios[0];
                res.redirect("/home");
            }
        });
    });

    /*
     * Petición GET que devuelve una lista de usuarios no administradores
     * al usuario que la realiza. Tampoco se devuelve al propio usuario en
     * sesión.
     */
    app.get("/user/list", function (req, res) {
        logger.info("Usuario " + req.session.usuario.email + " intenta obtener la lista de usuarios del sistema");
        let criterio;
        if( req.query.busqueda != null &&  req.query.busqueda != ""){
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
                logger.info("No se pudo obtener la lista de usuarios del sistema");
                res.redirect("/home"+ "?mensaje=Ha ocurrido un problema al mostar los usuarios de la red social"+
                    "&tipoMensaje=alert-danger ");
                return;
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
                    logger.info("Usuario " + req.session.usuario.email + " obtiene la lista de usuarios del sistema con éxito");
                    let respuesta = swig.renderFile('views/buserlist.html', {
                        usuario: req.session.usuario,
                        usuarios: usuarios,
                        paginas: paginas,
                        actual: pg,
                        busqueda: req.query.busqueda
                    });
                    res.send(respuesta);
                } else{
                    logger.info("No se pudo obtener la lista de usuarios del sistema");
                    res.redirect("/home"+ "?mensaje=Ha ocurrido un problema al mostar los usuarios de la red social"+
                        "&tipoMensaje=alert-danger ");
                }
            }
        });
    });

    /*
     * Comprueba que el email que recibe como argumento
     * no esté ya siendo utilizado por el sistema.
     */
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

    /*
     * Recibe una lista de usuarios y calcula la relación que
     * tienen con el usuario en sesión. Estos estados pueden ser:
     *  - Invited : Existe una invitación de amistad entre ambos usuarios
     *  - Friend : Ambos usuarios son amigos
     *  - Unknown : No existe un estado definido entre ambos usuarios
     */
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
