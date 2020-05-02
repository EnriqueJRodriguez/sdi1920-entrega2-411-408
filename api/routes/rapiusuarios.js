module.exports = function(app,gestorBD) { 
    app.post("/api/autenticar/", function(req, res) {
        let seguro = app.get("crypto").createHmac('sha256', app.get('clave')).update(req.body.password).digest('hex');
        let criterio = {
            email : req.body.email,
            password : seguro
        }
        gestorBD.obtenerUsuarios(criterio, function(usuarios) {
            if (usuarios == null || usuarios.length == 0) {
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
                res.status(200);
                res.json({
                    autenticado : true,
                    token : token
                });
            }
        });
    });
    app.get("/api/amigo", function(req, res) {
        let usuario = res.usuario;
        let amigos = usuario.friends;
        res.status(200);
        res.send(JSON.stringify(amigos));
    });
    app.get("/api/mensaje", function(req, res) {
        let usuario = res.usuario;
        let criterio_mensaje = { $or: [ 
            { "emisor": req.body.usuario1, "destino": req.body.usuario2 }, 
            { "emisor": req.body.usuario2, "destino": req.body.usuario1 } 
        ] };
        gestorBD.obtenerMensajes(criterio_mensaje, function(mensajes) {
            if (mensajes == null) {
                res.status(500);
                res.json({
                    error : "se ha producido un error"
                });
            } else {
                res.status(200);
                res.send(JSON.stringify(mensajes));
            }
        });
    });
    app.post("/api/mensaje", function(req,res) { 
        var mensaje = {
            emisor : res.usuario,
            destino : req.body.destino,
            texto : req.body.texto,
            leido : false
        }        
        validarMensaje(mensaje, function(valido, errores) {
            if (valido) {
                gestorBD.insertarMensaje(mensaje, function(id) { 
                    if (id == null) { 
                        errores.push("Se ha producido un error al insertar el mensaje");
                        res.status(500);                    
                        res.json({
                            errores : errores
                        });
                    } else {
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
    });
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
