var _this = this;    
var mensajes;
/*
 * Carga los mensajes entre el usuario en sesión
 * y el amigo con el que está chateando. El id de dicho
 * amigo se obtiene de la variable idUsuarioSeleccionado,
 * cuyo valor se asigna en el widget de amigos cuando clicamos
 * en el enlace de "Mensajes".
 */
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
/*
 * Muestra en la vista los mensajes que se le pasan como argumento.
 * Los mensajes del usuario en sesión se muestran con fondo negro y
 * letra blanca y los del otro usuario con fondo verde claro y letra negra.
 */
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
/*
 * Agrega el mensaje creado por el usuario en sesión 
 * a la base de datos.
 */
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
    // La función "cargarMensajes" se ejecutará cada segundo
    setInterval(_this.cargarMensajes, 1000);
});
