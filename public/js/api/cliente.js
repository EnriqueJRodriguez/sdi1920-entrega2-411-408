var URLbase = "http://localhost:8081/api";
$(document).ready(function () {
    var token;
    $("#contenedor-principal").load("widget-login.html");

    if (Cookies.get('token') != null) { 
        token = Cookies.get('token');
        var url = new URL(window.location.href);
        var w = url.searchParams.get("w");
        if (w == "login") { 
            $("#contenedor-principal").load("widget-login.html");
        }
        if (w == "amigos") { 
            $("#contenedor-principal").load("widget-amigos.html");
        }
    }

    $("#div-errores").hide();
});

function widgetAmigos() { 
    $("#contenedor-principal").load("widget-amigos.html");
}

