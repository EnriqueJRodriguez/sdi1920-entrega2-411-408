module.exports = function(app,gestorBD,logger) { 
    /*
     * Petición POST que autentica a un usuario.
     *
     * Recibe un email y una contraseña.
     */
    app.post("/api/autenticar/", function(req, res) {
        let seguro = app.get("crypto").createHmac('sha256', app.get('clave')).update(req.body.password).digest('hex');
        let criterio = {
            email : req.body.email,
            password : seguro
        }
        gestorBD.obtenerUsuarios(criterio, function(usuarios) {
            if (usuarios == null || usuarios.length == 0) {
                logger.info("Usuario anónimo se autentica de forma incorrecta");
                res.status(401); // Unauthorized
                res.json({
                    autenticado : false,
                    error: "Inicio de sesión no correcto"
                });
            } else {
                var token = app.get('jwt').sign({
                    usuario : criterio.email,
                    tiempo : Date.now() / 1000
                }, "secreto");
                logger.info("Usuario " + criterio.email + " se autentica de forma correcta");
                res.status(200);
                res.json({
                    autenticado : true,
                    token : token
                });
            }
        });
    });
    /*
     * Petición GET que devuelve una lista de 
     * identificadores de los amigos del usuario
     * que la solicita.
     */
    app.get("/api/amigo", function(req, res) {
        let usuario = res.usuario;
        let criterio = { "email" : usuario };
        logger.info("El usuario " + usuario + " realiza una petición para obtener los identificadores de sus amigos");
        gestorBD.obtenerUsuarios(criterio, function(usuarios) {
            if (usuarios == null) {
                logger.info("La petición del usuario " + usuario + " para obtener los ids de sus amigos no se pudo realizar");
                res.status(500);
                res.json({
                    error : "se ha producido un error"
                });
            } else {
                logger.info("La petición del usuario " + usuario + " para obtener los ids de sus amigos se realizó correctamente");
                res.status(200);
                res.send(JSON.stringify(usuarios[0].friends));
            }
        });
    });
    /*
     * Petición GET que devuelve una lista de
     * objetos representando a los amigos del
     * usuario que la solicita.
     */
    app.get("/api/amigo/list", function(req, res) {
        let usuario = res.usuario;
        let criterio = { "email" : usuario };
        logger.info("El usuario " + usuario + " realiza una petición para obtener sus amigos");
        // Obtenemos el usuario en sesión
        gestorBD.obtenerUsuarios(criterio, function(usuarios) {
            if (usuarios == null) {
                logger.info("La petición del usuario " + usuario + " para obtener sus amigos no se pudo realizar");
                res.status(500);
                res.json({
                    error : "se ha producido un error"
                });
            } else {
                let criterio_usuarios = {
                    '_id': {$not: {$eq: gestorBD.mongo.ObjectID(usuarios[0]._id)}},
                    'rol': {$not: {$eq: "ADMINISTRADOR"}}
                };
                /*
                 * Obtenemos todos los usuarios excepto:
                 *  - Administradores
                 *  - El usuario en sesión
                 */
                gestorBD.obtenerUsuarios(criterio_usuarios, function(other_users) {
                    if (other_users == null) {
                        logger.info("La petición del usuario " + usuario + " para obtener sus amigos no se pudo realizar");
                        res.status(500);
                        res.json({
                            error : "se ha producido un error"
                        });
                    } else {
                        // Obtenemos los amigos del usuario que realiza la petición
                        let userFriends = [];
                        let pointer = 0;
                        for(i = 0; i < other_users.length; i++) {
                            if (usuarios[0].friends.includes(other_users[i]._id.toString())) {
                                userFriends[pointer] = other_users[i];
                                pointer++;
                            }
                        }
                        logger.info("La petición del usuario " + usuario + " para obtener sus amigos se realizó correctamente");
                        res.status(200);
                        res.send(JSON.stringify(userFriends));
                    }
                });
            }
        });
    });
    /*
     * Petición GET que obtiene los mensajes del usuario
     * que la realiza con el usuario cuya id recibe en forma
     * de parámetro.
     */
    app.get("/api/mensaje/:id", function(req, res) {
        let usuario = res.usuario;
        let criterio = { "email" : usuario };
        logger.info("El usuario " + usuario + " realiza una petición para obtener los mensajes de su amigo " + req.params.id);
        // Obtenemos el usuario en sesión
        gestorBD.obtenerUsuarios(criterio, function(usuarios) {
            if (usuarios == null) {
                logger.info("El usuario " + usuario + " no pudo obtener los mensajes de su amigo " + req.params.id);
                res.status(500);
                res.json({
                    error : "se ha producido un error"
                });
            } else {
                let criterio_mensaje = { $or: [ 
                    { "emisor": gestorBD.mongo.ObjectID(usuarios[0]._id), "destino": gestorBD.mongo.ObjectID(req.params.id) }, 
                    { "emisor": gestorBD.mongo.ObjectID(req.params.id), "destino": gestorBD.mongo.ObjectID(usuarios[0]._id) } 
                ] };
                // Obtenemos los mensajes entre ambos usuarios
                gestorBD.obtenerMensajes(criterio_mensaje, function(mensajes) {
                    if (mensajes == null) {
                        logger.info("El usuario " + usuario + " no pudo obtener los mensajes de su amigo " + req.params.id);
                        res.status(500);
                        res.json({
                            error : "se ha producido un error"
                        });
                    } else {
                        logger.info("El usuario " + usuario + " pudo obtener los mensajes de su amigo " + req.params.id);
                        res.status(200);
                        res.send(JSON.stringify(mensajes));
                    }
                });
            }
        });
    });
    /*
     * Petición POST que crea un mensaje entre 
     * el usuario que la realiza y el usuario cuya
     * id viene dada en el cuerpo de la petición, representado
     * por el campo "destino".
     */
    app.post("/api/mensaje", function(req,res) { 
        let usuario = res.usuario;
        let criterio = { "email" : usuario };
        logger.info("El usuario " + usuario + " crea un mensaje cuyo destino es su amigo " + req.body.destino);
        gestorBD.obtenerUsuarios(criterio, function(usuarios) {
            if (usuarios == null) {                
                logger.info("El usuario " + usuario + " no pudo crear el mensaje para su amigo " + req.body.destino);
                res.status(500);
                res.json({
                    errores : [ "se ha producido un error" ]
                });
            } else {
                var mensaje = {
                    emisor : gestorBD.mongo.ObjectID(usuarios[0]._id),
                    destino : gestorBD.mongo.ObjectID(req.body.destino),
                    texto : req.body.texto,
                    leido : false
                }        
                // Comprobamos que el mensaje sea correcto
                validarMensaje(mensaje, function(valido, errores) {
                    if (valido) {
                        gestorBD.insertarMensaje(mensaje, function(id) { 
                            if (id == null) { 
                                logger.info("El usuario " + usuario + " no pudo crear el mensaje para su amigo " + req.body.destino);
                                errores.push("Se ha producido un error al insertar el mensaje");
                                res.status(500);                    
                                res.json({
                                    errores : errores
                                });
                            } else {
                                logger.info("El usuario " + usuario + " pudo crear el mensaje para su amigo " + req.body.destino);
                                res.status(201);
                                res.json({ 
                                    mensaje : "mensaje insertado",
                                    _id : id
                                });
                            }
                        });
                    } else {
                        res.status(400);
                        res.json({
                            errores : errores
                        });
                    }
                });
            }
        });
    });
    /*
     * Función que recibe un mensaje y comprueba 
     * que todos sus campos sean correctos:
     *  
     *  - Los campos no pueden ser nulos o estar vacíos
     *  - El usuario de destino debe existir
     */
    function validarMensaje(mensaje, functionCallback) {
        let errores = [];
        if (mensaje.emisor == null || mensaje.emisor == "") {
            errores.push("Los datos del emisor son incorrectos");
        }
        if (mensaje.destino == null || mensaje.destino == "") {
            errores.push("Los datos del destino son incorrectos");
        }
        if (mensaje.texto == null || mensaje.destino == "") {
            errores.push("Los datos del texto del mensaje son incorrectos");
        }
        let criterio_destino = { "_id": mensaje.destino };
        gestorBD.obtenerUsuarios(criterio_destino, function(usuarios) {
            if (usuarios == null || usuarios.length <= 0) {
                errores.push("El usuario de destino no existe");
                functionCallback(false, errores);
            } else {
                if (errores.length == 0) {
                    functionCallback(true, errores);
                } else {
                    functionCallback(false, errores);
                }
            }
        });
    }
}
