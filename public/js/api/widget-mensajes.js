var _this = this;    
var mensajes;
function cargarMensajes() {
    console.log("ID Usuario (Destiono - Cargar): " + idUsuarioSeleccionado);
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
    console.log("HEEEEY");
    $("#tablaCuerpo").empty(); // Vaciar la tabla
    for(i = 0; i < mensajesMostrar.length; i++) {
        console.log("Mensaje: " + mensajesMonstrar[i]._id);
        $("#tablaCuerpo").append(
            "<tr id=" + mensajesMostrar[i]._id + ">" +
            "<td>" + mensajesMostrar[i].emisor + "</td>" +
            "<td>" + mensajesMostrar[i].destino + "</td>" +
            "<td>" + mensajesMostrar[i].texto + "</td>" +
            "<td>" + mensajesMostrar[i].leido + "</td>" +
            "</tr>");
    }
}
function agregarMensaje() {
    console.log("ID Usuario (Destino - Agregar): " + idUsuarioSeleccionado);
    $.ajax({
        url: URLbase +"/mensaje",
        type: "POST",
        data: {
            texto: $("#agregar-texto").val(),
            destino: idUsuarioSeleccionado
        },
        dataType: 'json',
        headers: {"token":token },
        success : function(respuesta) {
            console.log(respuesta); // <-- Prueba
            $("#contenedor-principal").load("widget-canciones.html");
        },
        error : function(error) {
            $("#div-errores").show();
            console.log(error.responseJSON);
            var result = "";
            for (i = 0; i < error.responseJSON.errores.length; i++) {
                console.log(error.responseJSON.errores[i]);
                result = result.concat(error.responseJSON.errores[i].toString() + "\n");
            }
            $("#div-errores").text("Errors: \n");
        }
    });
}
$(document).ready(function() {
    _this.cargarMensajes();
});
