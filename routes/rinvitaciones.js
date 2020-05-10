module.exports = function(app, swig, gestorBD, logger) {
    /*
     * Petición GET que tramita una petición de amistad
     * entre el usuario cuya id es recibida como argumento
     * y el usuario en sesión.
     */
    app.get("/invitations/add/:id", function (req, res) {
        logger.info("Usuario " + req.session.usuario.email + " intenta crear una invitación de amistad");
        req.session.usuario.invites[req.session.usuario.invites.length] = req.params.id;
        let criterioBuscarInvitado = {
            "_id" : gestorBD.mongo.ObjectID(req.params.id)
        };
        gestorBD.obtenerUsuarios(criterioBuscarInvitado, function(usuarios) {
            if (usuarios == null) {
                logger.info("Fallo al crear la invitación de amistad");
                res.redirect("/home"+ "?mensaje=Ha ocurrido un problema al buscar al usuario invitado"+
                    "&tipoMensaje=alert-danger ");
            } else{
                let usuarioInvitado = usuarios[0];
                usuarioInvitado.invites[usuarioInvitado.invites.length] = req.session.usuario._id;
                let criterioInvitado ={
                    "_id" : gestorBD.mongo.ObjectID(usuarioInvitado._id),
                }
                let invitado = {
                    "invites" : usuarios[0].invites
                };
                gestorBD.modificarUsuario(criterioInvitado, invitado, function(receiverUser) {
                    if(receiverUser == null){
                        logger.info("Fallo al crear la invitación de amistad");
                        res.redirect("/home"+ "?mensaje=Ha ocurrido un problema tramitar invitacion"+
                            "&tipoMensaje=alert-danger ");
                    }
                    else{
                        logger.info("El usuario " + req.session.usuario.email + " crea la invitación de amistad con éxito");
                        res.redirect("/user/list"+ "?mensaje=Se ha tramitado con exito su invitacion"+
                            "&tipoMensaje=alert-success");
                    }
                })
            }
        })
    });
    /*
     * Petición GET que devuelve una lista con las peticiones 
     * de amistad del usuario que la realiza.
     */
    app.get("/invitation/list", function (req, res) {
        logger.info("Usuario " + req.session.usuario.email + " intenta obtener una lista de sus invitaciones de amistad");
        let criterio;
        let invitesList = [];
        for(i= 0; i<req.session.usuario.invites.length; i++){
            invitesList.push(gestorBD.mongo.ObjectID(req.session.usuario.invites[i]));
        }
        if( req.query.busqueda != null &&  req.query.busqueda != ""){

            criterio = {
                '_id': {$not: {$eq: gestorBD.mongo.ObjectID(req.session.usuario._id)}},
                '_id': {$in: invitesList},
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
                '_id': {$in: invitesList},
                'rol': {$not: {$eq: "ADMINISTRADOR"}}
            };
        }
        let pg = parseInt(req.query.pg); // Es String !!!
        if ( req.query.pg == null){ // Puede no venir el param
            pg = 1;
        }
        gestorBD.obtenerUsuariosPg(criterio, pg, function(usuarios,total) {
            if (usuarios == null) {
                logger.info("Fallo al obtener la lista de invitaciones de amistad");
                res.redirect("/home"+ "?mensaje=Ha ocurrido un problema al mostar sus invitaciones de amistad"+
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
                if(usuarios != null) {
                    logger.info("El usuario " + req.session.usuario.email + " obtiene su lista de invitaciones de amistad con éxito"); 
                    let respuesta = swig.renderFile('views/binvitationslist.html', {
                        usuario: req.session.usuario,
                        usuarios: usuarios,
                        paginas: paginas,
                        actual: pg,
                        busqueda: req.query.busqueda
                    });
                    res.send(respuesta);
                } else{
                    logger.info("Fallo al obtener la lista de invitaciones de amistad");
                    res.redirect("/home"+ "?mensaje=Ha ocurrido un problema al mostar sus invitaciones de amistad"+
                        "&tipoMensaje=alert-danger ");
                }
            }
        });
    });

}
