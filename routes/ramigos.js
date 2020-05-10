module.exports = function(app, swig, gestorBD, logger) {
    app.get("/friends/add/:id", function (req, res) {
        logger.info("Usuario " + req.session.usuario.email + " intenta aceptar una invitación de amigo");
        req.session.usuario.friends[req.session.usuario.friends.length] = req.params.id;
        let newInvitesArray = req.session.usuario.invites.filter(function(e) { return e != req.params.id });
        req.session.usuario.invites = newInvitesArray;
        let criterioAceptador = {
            "_id": gestorBD.mongo.ObjectID(req.session.usuario._id),
        };
        let criterioBuscarAmigo = {
            "_id": gestorBD.mongo.ObjectID(req.params.id)
        };
        gestorBD.obtenerUsuarios(criterioBuscarAmigo, function (usuarios) {
            if (usuarios == null) {
                logger.info("No se pudo aceptar la petición de amigo");
                res.redirect("/home" + "?mensaje=Ha ocurrido un problema al buscar al usuario invitador" +
                    "&tipoMensaje=alert-danger ");
            } else {
                let usuarioAceptado = usuarios[0];
                usuarioAceptado.friends[usuarioAceptado.friends.length] = req.session.usuario._id;
                let criterioAceptado = {
                    "_id": gestorBD.mongo.ObjectID(usuarioAceptado._id),
                }
                let aceptado = {
                    "friends": usuarios[0].friends
                };
                gestorBD.modificarUsuario(criterioAceptado, aceptado, function (receiverUser) {
                    if (receiverUser == null) {
                        logger.info("No se pudo aceptar la petición de amigo");
                        res.redirect("/home" + "?mensaje=Ha ocurrido un problema tramitar invitacion" +
                            "&tipoMensaje=alert-danger ");
                    } else {
                        let aceptador = {
                            "friends" : req.session.usuario.friends,
                            "invites" : req.session.usuario.invites
                        }
                        gestorBD.modificarUsuario(criterioAceptador, aceptador, function(accepterUser) {
                            if (accepterUser == null) {
                                logger.info("No se pudo aceptar la petición de amigo");
                                res.redirect("/home" + "?mensaje=Ha ocurrido un problema tramitar invitacion" +
                                    "&tipoMensaje=alert-danger ");
                            }else{
                                logger.info("El usuario " + req.session.usuario.email + " aceptó con exito la invitación de amistad");
                                res.redirect("/invitation/list"+ "?mensaje=Se ha tramitado con exito su aceptación de amigo"+
                                    "&tipoMensaje=alert-success");
                            }
                        })
                    }
                })
            }
        })
    });

    app.get("/friend/list", function (req, res) {
        logger.info("Usuario " + req.session.usuario.email + " intenta obtener una lista de sus amigos");
        let criterio;
        let friendsList = [];
        for(i= 0; i<req.session.usuario.friends.length; i++){
            friendsList.push(gestorBD.mongo.ObjectID(req.session.usuario.friends[i]));
        }
        if( req.query.busqueda != null &&  req.query.busqueda != ""){
            criterio = {
                '_id': {$not: {$eq: gestorBD.mongo.ObjectID(req.session.usuario._id)}},
                '_id': {$in: friendsList},
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
                '_id': {$in: friendsList},
                'rol': {$not: {$eq: "ADMINISTRADOR"}}
            };
        }
        let pg = parseInt(req.query.pg); // Es String !!!
        if ( req.query.pg == null){ // Puede no venir el param
            pg = 1;
        }
        gestorBD.obtenerUsuariosPg(criterio, pg, function(usuarios,total) {
            if (usuarios == null) {
                logger.info("No se pudo obtener la lista de amigos");
                res.redirect("/home"+ "?mensaje=Ha ocurrido un problema al mostar sus amigos"+
                    "&tipoMensaje=alert-danger ");
            } else {
                let ultimaPg = usuarios.length / 5;
                if (usuarios.length % 5 > 0) { // Sobran decimales
                    ultimaPg = ultimaPg + 1;
                }
                let paginas = []; // paginas mostrar
                for (let i = pg - 2; i <= pg + 2; i++) { // Revisar esto
                    if (i > 0 && i <= ultimaPg) {
                        paginas.push(i);
                    }
                }
                if(usuarios != null) {
                    logger.info("El usuario " + req.session.usuario.email + " obtiene su lista de amigos con éxito");
                    let respuesta = swig.renderFile('views/bfriendslist.html', {
                        usuario: req.session.usuario,
                        usuarios: usuarios,
                        paginas: paginas,
                        actual: pg,
                        busqueda: req.query.busqueda,
                    });
                    res.send(respuesta);
                } else{
                    logger.info("No se pudo obtener la lista de amigos");
                    res.redirect("/home"+ "?mensaje=Ha ocurrido un problema al mostar sus amigos"+
                        "&tipoMensaje=alert-danger ");
                }
            }
        });
    });

}
