module.exports = function(app, swig, gestorBD) {
    app.get("/invitations/add/:id", function (req, res) {
        req.session.usuario.invites[req.session.usuario.invites.length] = req.params.id;
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
    app.get("/invitation/list", function (req, res) {
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
                res.redirect("/home"+ "?mensaje=Ha ocurrido un problema al mostar sus invitaciones de amistad"+
                    "&tipoMensaje=alert-danger ");
            } else {
                usuarios = calcularInvitacionesUsuario(usuarios,req.session.usuario);
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
                if(usuarios != null) {
                    let respuesta = swig.renderFile('views/binvitationslist.html', {
                        usuario: req.session.usuario,
                        usuarios: usuarios,
                        paginas: paginas,
                        actual: pg
                    });
                    res.send(respuesta);
                } else{
                    res.redirect("/home"+ "?mensaje=Ha ocurrido un problema al mostar sus invitaciones de amistad"+
                        "&tipoMensaje=alert-danger ");
                }
            }
        });
    });

    function calcularInvitacionesUsuario(usuarios,usuario){
        if(usuarios == null || usuario == null){
            return null;
        }
        let userInvites = [];
        let pointer = 0;
        for(i=0; i<usuarios.length;i++){
            if(usuario.invites.includes(usuarios[i]._id.toString())){
                userInvites[pointer] = usuarios[i];
                pointer++;
            }
        }
        return userInvites;
    }
}