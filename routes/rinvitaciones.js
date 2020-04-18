module.exports = function(app, swig, gestorBD) {
    app.get("/invitations/add/:id", function (req, res) {
        req.session.usuario.invites[req.session.usuario.invites.length] = req.params.id;
        let criterioInvitador = {
            "_id" : gestorBD.mongo.ObjectID(req.session.usuario._id),
        };
        let criterioBuscarInvitado = {
            "_id" : gestorBD.mongo.ObjectID(req.params.id)
        };
        gestorBD.obtenerUsuarios(criterioBuscarInvitado, function(usuarios) {
            if (usuarios == null) {
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
                        res.redirect("/home"+ "?mensaje=Ha ocurrido un problema tramitar invitacion"+
                            "&tipoMensaje=alert-danger ");
                    }
                    else{
                        res.redirect("/user/list"+ "?mensaje=Se ha tramitado con exito su invitacion"+
                            "&tipoMensaje=alert-success");
                    }
                })
            }
        })
    });
}