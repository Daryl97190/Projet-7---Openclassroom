import { DonneesRestaurant } from "./donneesRestaurant.js"
import { GoogleMap } from "./googleMap.js"
export class Main {
    constructor() {
        {
            $script("https://maps.googleapis.com/maps/api/js?key=AIzaSyAdXVJEBNlfp2ocuj3ynGnG8vayUtpOIwo&libraries=places", () => {
            // Test si la géolocalisation grace à l'API javascript  est disponible //
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition((position) => {
                    $.getJSON("styleCarte.json", (styleCarte) => {
                        // obtient le style nuit pour la carte via une requete JSON
                        this.styleCarte = styleCarte;
                        this.googleMap = new GoogleMap(position, this);
                        this.DonneesRestaurant = new DonneesRestaurant(this, this.googleMap);
                        this.initialisationDeLaListeRestaurant();
                        this.filtrerLesRestaurants();
                        this.configurationModal();
                    })
                })
            } else {
                alert("La géolocalisation n'est pas supportée par le navigateur")
            }
        });
    }
}
initialisationDeLaListeRestaurant() {
    // Méthode qui charge la fonction asynchrone pour récuper les données et les marqueurs des restaurants
    this.DonneesRestaurant.requeteRestaurantAproximite( () => {
        this.DonneesRestaurant.listeRestaurantSauvegarder.forEach(restaurantSauvegarder => {
            this.DonneesRestaurant.listeRestaurant.unshift(restaurantSauvegarder)
        });
        this.filtreRestaurantAuDemarrage();
        this.DonneesRestaurant.affichageListeRestaurant(this.DonneesRestaurant.listeRestaurant)
        this.googleMap.reinitialisationDesMarqueurs(this.DonneesRestaurant.listeRestaurant);
    });
}
miseAjourDesRestaurant() {
    // lorsqu'un nouveau restaurant est ajouté au tableau, on met a jour le tableau des restaurant
    this.DonneesRestaurant.affichageListeRestaurant(this.DonneesRestaurant.listeRestaurant)
    this.googleMap.reinitialisationDesMarqueurs(this.DonneesRestaurant.listeRestaurant);
}
moyenneCommentaireRestaurantSelectionner() {
    // calcul de la moyenne des commentaires et non de la moyenne du restaurant qui est donnée par l'API
    this.googleMap.restaurantSelectionner.moyenneCommentaires = this.googleMap.restaurantSelectionner.ratings.reduce((somme, rating) => {
        return somme += rating.stars
    }, 0) / this.googleMap.restaurantSelectionner.ratings.length
}
filtreRestaurantAuDemarrage() {
    // filtre les restaurant au démarrage en fonction de leur moyenne fixé par l'API
    this.DonneesRestaurant.listeRestaurant = this.DonneesRestaurant.listeRestaurant.filter(restaurant =>
        restaurant.moyenne >= parseInt($("#minStarRank").val()) && (restaurant.moyenne <= parseInt($("#maxStarRank").val())))
    }
    filtrerLesRestaurants() {
        // lorsque l'utilisateur veut un restaurant compris en en X et y étoile. Il utilise cette fonction
        $("#minStarRank, #maxStarRank").change( () => this.initialisationDeLaListeRestaurant() );
    }
    configurationModal() {
        $("#ajouterCommentaire").click( () => $("#fenetreModale").show())
        $(".croixFermeture, #boutonFermetureFormulaire, #btnFermetureFormulaireNouveauRestaurant").click( () => {
            $("#fenetreModale, #fenetreModaleRestaurant").hide();
            $("#espaceCommentaire, #noteRestaurant").val("");
            if (this.googleMap.infoBulleNewRestaurant) {
                this.googleMap.infoBulleNewRestaurant.close();
            }
        })
        $(window).click( (e) => {
            if (e.target == document.getElementById("fenetreModale")) {
                $("#fenetreModale").hide();
                $("#espaceCommentaire, #noteRestaurant").val("");
            } else if (e.target == document.getElementById("fenetreModaleRestaurant")) {
                $("#fenetreModaleRestaurant").hide();
                $("#nomDuNouveauRestaurant, #espaceCommentaireNouveauRestaurant, #noteNouveauRestaurant ").val("");
                if (this.googleMap.infoBulleNewRestaurant) {
                    this.googleMap.infoBulleNewRestaurant.close();
                }
            }
        })
        $("#revenir").click(() => {
            $("#revenir, #ajouterCommentaire, #descriptionRestaurant").hide();
            $(".restaurantList, #restaurantRank").show();
        })
    }
}


