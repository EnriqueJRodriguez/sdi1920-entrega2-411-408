module.exports = function(app, swig, gestorBD) {
    app.get("/friends/add/:id", function (req, res) {
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
                        res.redirect("/home" + "?mensaje=Ha ocurrido un problema tramitar invitacion" +
                            "&tipoMensaje=alert-danger ");
                    } else {
                       let aceptador = {
                           "friends" : req.session.usuario.friends,
                           "invites" : req.session.usuario.invites
                       }
                       gestorBD.modificarUsuario(criterioAceptador, aceptador, function(accepterUser) {
                           if (accepterUser == null) {
                               res.redirect("/home" + "?mensaje=Ha ocurrido un problema tramitar invitacion" +
                                   "&tipoMensaje=alert-danger ");
                           }else{
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
        gestorBD.obtenerUsuariosPg(criterio, pg, function(usuarios,total) {
            if (usuarios == null) {
                res.redirect("/home"+ "?mensaje=Ha ocurrido un problema al mostar sus amigos"+
                    "&tipoMensaje=alert-danger ");
            } else {
                let ultimaPg = total / 5;
                if (total % 5 > 0) { // Sobran decimales
                    ultimaPg = ultimaPg + 1;
                }
                let paginas = []; // paginas mostrar
                for (let i = pg - 2; i <= pg + 2; i++) {
                    if (i > 0 && i <= ultimaPg) {
                        paginas.push(i);
                    }
                }
                usuarios = calcularAmistadesUsuario(usuarios,req.session.usuario);
                if(usuarios != null) {
                    let respuesta = swig.renderFile('views/bfriendslist.html', {
                        usuario: req.session.usuario,
                        usuarios: usuarios,
                        paginas: paginas,
                        actual: pg
                    });
                    res.send(respuesta);
                } else{
                    res.redirect("/home"+ "?mensaje=Ha ocurrido un problema al mostar sus amigos"+
                        "&tipoMensaje=alert-danger ");
                }
            }
        });
    });

    function calcularAmistadesUsuario(usuarios,usuario){
        if(usuarios == null || usuario == null){
            return null;
        }
        let userFriends = [];
        let pointer = 0;
        for(i=0; i<usuarios.length;i++){
            if(usuario.friends.includes(usuarios[i]._id.toString())){
                userFriends[pointer] = usuarios[i];
                pointer++;
            }
        }
        return userFriends;
    }
}