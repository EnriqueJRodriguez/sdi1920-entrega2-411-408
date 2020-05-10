/*
 * En cuanto el documento termine de cargarse
 * se cambiará el estado del cliente a "login" 
 * y se le asignará un listener al botón de login.
 */
$(document).ready(function() {
    window.history.pushState("", "", "/cliente.html?w=login");
    /*
     * Cuando el usuario pulse en el botón de login se realizará
     * una petición POST a /api/autenticar que permitirá que el usuario
     * se identifique y sus datos se guarden en forma de cookies.
     */
    $("#boton-login").click(function() {
        $.ajax({
            url : URLbase + "/autenticar",
            type : "POST",
            data : {
                email : $("#email").val(),
                password : $("#password").val()
            },
            dataType : 'json',
            success : function(respuesta) {
                token = respuesta.token;
                Cookies.set('token', respuesta.token);
                $("#contenedor-principal").load("widget-amigos.html");
            },
            error : function(error) {
                Cookies.remove('token');
                $("#widget-login").prepend("<div class='alert alert-danger'>Datos incorrectos</div>");
            }
        });
    });
});
