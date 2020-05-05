$(document).ready(function() {
    var mensajes;
    function cargarMensajes() {
        $.ajax({
            url : URLbase + "/mensaje",
            type: "GET",
            data: {
                other_user: idUsuarioSeleccionado
            },
            dataType: 'json',
            headers: { "token": token },
            success : function(respuesta) {
                mensajes = respuesta;
                actualizarTabla(mensajes);
            },
            error : function(error) {
                $("#contenedor-principal").load("widget-login.html");
            }
        });
    }
    function actualizarTabla(mensajesMostrar) {
        $("#tablaCuerpo").empty(); // Vaciar la tabla
        for(i = 0; i < mensajesMostrar.length; i++) {
            $("#tablaCuerpo").append(
                "<tr id=" + mensajesMostrar[i]._id + ">" +
                "<td>" + mensajesMostrar[i].emisor + "</td>" +
                "<td>" + mensajesMostrar[i].destino + "</td>" +
                "<td>" + mensajesMostrar[i].texto + "</td>" +
                "<td>" + mensajesMostrar[i].leido + "</td>" +
                "</tr>");
        }
    }
    cargarMensajes();
});
