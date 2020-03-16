import { Main } from "./main.js";

$(document).ready(() => { // méthode qui permet d'exécuter du code JavaScript après que le DOM est fini de chargé
    $("#bouttonRecherche").hide();
    $("#logoLancement").click( () => {
        $("#conteneurLogoLancement").hide();
        $("header, #map, #bouttonRecherche").show();
        $(".conteneur").css("background-color", "white");
        new Main();
    })
});