var _this = this;    
var mensajes;
function cargarMensajes() {
    $.ajax({
        url : URLbase + "/mensaje/" + idUsuarioSeleccionado,
        type: "GET",
        data: { },
        dataType: 'json',
        headers: { "token": token },
        success : function(respuesta) {
            mensajes = respuesta;
            actualizarVista(mensajes);
        },
        error : function(error) {
            $("#contenedor-principal").load("widget-login.html");
        }
    });
}
function actualizarVista(mensajesMostrar) {
    $("#div-mensajes").empty(); // Vaciar la tabla
    for(i = 0; i < mensajesMostrar.length; i++) {
        if (mensajesMostrar[i].emisor == idUsuarioSeleccionado) {
            $("#div-mensajes").append(
                "<div class='chat left'>" +
                "<p class='topleft'>" + mensajesMostrar[i].texto + "</p>" +
                "</div>");
        } else {
            $("#div-mensajes").append(
                "<div class='chat right'>" +
                "<p class='topleft'>" + mensajesMostrar[i].texto + "</p>" +
                "</div>");
        }
    }
}
function agregarMensaje() {
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
            $("#contenedor-principal").load("widget-canciones.html");
        },
        error : function(error) {
            $("#div-errores").show();
            var result = "";
            for (i = 0; i < error.responseJSON.errores.length; i++) {
                result = result.concat(error.responseJSON.errores[i].toString() + "\n");
            }
            $("#div-errores").text("Errors: \n");
        }
    });
    $("#agregar-texto").val("");
}
$(document).ready(function() {
    setInterval(_this.cargarMensajes, 1000);
});
