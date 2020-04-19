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
}