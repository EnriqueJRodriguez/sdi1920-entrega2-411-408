var _this = this;
var amigos;
var idUsuarioSeleccionado;
/*
 * Realiza una petición GET a /amigo/list,
 * listando todos los amigos del usuario en
 * sesión, representados por objetos.
 */
function cargarAmigos() {
    $.ajax({
        url : URLbase + "/amigo/list",
        type: "GET",
        data: { },
        dataType: 'json',
        headers: { "token": token },
        success : function(respuesta) {
            amigos = respuesta;
            actualizarTabla(amigos);
        },
        error : function(error) {
            $("#contenedor-principal").load("widget-login.html");
        }
    });
}
/*
 * Actualiza la tabla de amigos, mostrando su
 * email, nombre y apellidos, así como un enlace 
 * que lleva a los mensajes que ambos usuarios se han
 * escrito.
 */
function actualizarTabla(amigosMostrar) {
    $("#tablaCuerpo").empty(); // Vaciar la tabla
    for(i = 0; i < amigosMostrar.length; i++) {
        $("#tablaCuerpo").append(
            "<tr id=" + amigosMostrar[i]._id + ">" +
            "<td>" + amigosMostrar[i].name + "</td>" +
            "<td>" + amigosMostrar[i].surname + "</td>" +
            "<td>" + amigosMostrar[i].email + "</td>" +
            "<td>" +
            "<a onclick=mensajes('" + amigosMostrar[i]._id + "')>Mensajes</a>" +
            "</td>" +
            "</tr>");
    }
}
/*
 * Guarda el amigo con el que el usuario en sesión quiere chatear
 * y carga el widget de mensajes en el contenedor principal.
 */
function mensajes(_id) {
    idUsuarioSeleccionado = _id;
    $("#contenedor-principal").load("widget-mensajes.html");
}
/*
 * Filtra los amigos del usuario en sesión por nombre.
 */
$('#filtro-nombre').on('input', function(e) {
    var amigosFiltrados = [];
    var nombreFiltro = $("#filtro-nombre").val();
    for (i = 0; i < amigos.length; i++) {
        if (amigos[i].name.indexOf(nombreFiltro) != -1) {
            amigosFiltrados.push(amigos[i]);
        }
    }
    actualizarTabla(amigosFiltrados);
});
/*
 * En cuanto el documento esté listo se cambiará el estado
 * del cliente a "amigos" y se cargarán los amigos del usuario
 * en sesión.
 */
$(document).ready(function() {
    window.history.pushState("", "", "/cliente.html?w=amigos");
    _this.cargarAmigos();
});
