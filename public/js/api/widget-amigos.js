var _this = this;
var amigos;
var idUsuarioSeleccionado;
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
function mensajes(_id) {
    idUsuarioSeleccionado = _id;
    $("#contenedor-principal").load("widget-mensajes.html");
}
$('#filtro-nombre').on('input', function(e) {
    var amigosFiltrados = [];
    var nombreFiltro = $("#filtro-nombre").val();
    for (i = 0; i < amigos.length; i++) {
        if (amigos[i].name.indexOf(nombreFiltro) != -1) {
            amigosFiltrados.push(amigos[i]);
        }
    }
    actualizarTabla(amigosFiltrados);
})
$(document).ready(function() {
    window.history.pushState("", "", "/cliente.html?w=amigos");
    _this.cargarAmigos();
});
