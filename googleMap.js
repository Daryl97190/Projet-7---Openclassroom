export class GoogleMap {
    constructor(position, main) {
        this.main = main;
        this.marqueurs = [];
        this.restaurantSelectionner = null;
        this.location = new Object();
        this.location.latitude = position.coords.latitude;
        this.location.longitude = position.coords.longitude;
        this.creationGoogleMap();
        this.eventMap();
        this.creationMarqueurUtilisateur();
    }
    creationGoogleMap() {
        // création de la carte Google avec le style  carte nuit 
        this.map = new google.maps.Map(document.getElementById("map"), {
            zoom: 15,
            center: {lat: this.location.latitude,lng: this.location.longitude},
            styles: this.main.styleCarte // recupérés via un fichier JSON
        });
    }
    creationMarqueurUtilisateur() {
        // création d'un marqueur utilisateur positionné sur le centre de la carte
        // avec une animation
        this.marqueurUtilisateur = new google.maps.Marker({
            position: {lat: this.location.latitude,lng: this.location.longitude},
            map: this.map,
            title: "Vous etes ici !",
            animation: google.maps.Animation.BOUNCE,
            icon: "img/iconMap.ico" // Marqueur spécial bleu pour l"utilisateur
        });
        this.infoBulleUtilisateur = new google.maps.InfoWindow({
            content: `<p><span>Vous etes-ici</span></p>
            <img src="img/iconUtilisateur.jpg" style="height : 80px;
            " alt="iconeUtilisateur">`
        })
        this.marqueurUtilisateur.addListener("click", () => {
            this.infoBulleUtilisateur.open(this.map, this.marqueurUtilisateur);
        });
        this.map.addListener("click", () => {
            if (this.infoBulleUtilisateur) {
                this.infoBulleUtilisateur.close();
            }
        });
    }
    creationUnMarqueurRestaurant(restaurant) {
        // création des marqueurs avec la position des restaurants
        const marqueur = new google.maps.Marker({
            position: {lat: restaurant.lat,lng: restaurant.long},
            map: this.map,
            title: restaurant.restaurantName,
            animation: google.maps.Animation.DROP,
            icon: "img/iconRestaurant.ico"
        });
        // regroupement des marqueurs dans un tableau
        this.marqueurs.push(marqueur);
        return marqueur;
    }
    afficherMarqueurRestaurant(listeRestaurant) {
        // affiche tous les marqueurs de restaurant sur la carte 
        for (let restaurant of listeRestaurant) {
            const marqueursRestaurants = this.creationUnMarqueurRestaurant(restaurant);
            this.eventMarqueurRestaurant(restaurant, marqueursRestaurants);
        }
    }
    reinitialisationDesMarqueurs(listeRestaurant) {
        for (const marqueur of this.marqueurs) {
            marqueur.setMap(null); 
            // boucle sur la propriété setMap de l'API GoogleMap qui permet de supprimer les marqueurs
        }
        this.marqueurs = []; // vider le tableau des marqueurs
        this.afficherMarqueurRestaurant(listeRestaurant);
        this.descriptionRestaurant(listeRestaurant);
    }
    eventMap() {
        this.map.addListener("rightclick", posClick => {
            // créer une infobulle à chaque clique droit et récupère la postion du clique
            this.infoBulleNewRestaurant = new google.maps.InfoWindow({
                content: `<button type="button" id="ajouterNouveauRestaurant" class="btn btn-link">Ajouter un nouveau restaurant ?</button>`
            });
            this.infoBulleNewRestaurant.setPosition(posClick.latLng); // obtient la position de l"infobulle sur le click
            this.infoBulleNewRestaurant.open(this.map);
            this.map.addListener("click", () => {
                if (this.infoBulleNewRestaurant) {
                    this.infoBulleNewRestaurant.close();
                }
            });
            // création de l'objet geocoder pour récuper la LatLng de la position cliqué sur la map
            const geocoder = new google.maps.Geocoder();
            let recupPosClick = {lat: posClick.latLng.lat(),lng: posClick.latLng.lng()};
            //obtention de l'adresse demandée via la position du clique avec le géocoder
            geocoder.geocode({location: recupPosClick},(resultat, statut) => {
                if (statut == "OK") {
                    let adressePreRemplit = resultat[0].formatted_address;
                    $("#adresseDuNouveauRestaurant").val(adressePreRemplit);
                    $("#ajouterNouveauRestaurant").click( () => {
                        $("#fenetreModaleRestaurant").show();
                    });
                } else {
                    alert("Le système géocode n'est pas disponible " + statut);
                }
            }
            );
        });
    }
    descriptionRestaurant(listeRestaurant) {
            // lorsqu'on clique sur un des restaurants de la liste. Les infos s'affiche
        for (let restaurant of listeRestaurant) {
            $(`#${listeRestaurant.indexOf(restaurant)}`).click(() => {
                $("#revenir, #ajouterCommentaire, #descriptionRestaurant").show();
                $("#restaurantRank, .restaurantList").hide();
                this.requeteDetails(restaurant) // lancement de la requete pour récuperer les avis et les commentaires                
            });
        }
    }
    eventMarqueurRestaurant(restaurant, marqueur) {
        marqueur.addListener("click", () => {
            // lorsqu'on clique sur un marqueur de la carte. Affiche de la fiche d'information restaurant
            this.infoBulleRestaurant = new google.maps.InfoWindow({
                content: `<h5>${restaurant.restaurantName}</h5>
                <img src="img/logorestaurant.png" style="height : 100px;
                " alt="logo du site" class="logo">`,
                position: {lat: restaurant.lat,lng: restaurant.long}
            });
            $("#revenir, #ajouterCommentaire, #descriptionRestaurant").show();
            $(".restaurantList, #restaurantRank").hide();
            this.infoBulleRestaurant.open(this.map, marqueur);
            this.requeteDetails(restaurant);
        });
        this.map.addListener("click", () => {
            if (this.infoBulleRestaurant) {
                this.infoBulleRestaurant.close();
            }
        });
    }
    requeteDetails(restaurant) {
    
        if (restaurant.placeId) {
            // si le restaurant disposed'un PlaceID, je lance la requete 
            const detailRestaurant = {
                // les elements que je souhaite récuperer avec la requete
                placeId: restaurant.placeId || [],
                fields: ["rating", "reviews", "opening_hours"]
            };
            this.promesse = new Promise((resolve, reject) => {
                // je stocke la requeteGetDetails dans une promesse
                const service = new google.maps.places.PlacesService(this.map)
                service.getDetails(detailRestaurant, (resultatDetails, statutDetail) => {
                    if (statutDetail === "OK") {
                        // si la promesse fonctionne je recupère les resultats
                        resolve(resultatDetails) 
                    } else {
                        reject("La promesse n'a pas fonctionné en raison de " + statutDetails)
                    }
                })
            }) 
            this.informationDetailRestaurant(restaurant);
        } else {
            // les  nouveaux restaurant ne possède pas de placeID donc tous ces restaurant passe dans le else. 
            this.ficheRestaurant(restaurant);
            this.restaurantSelectionner = restaurant;            
        }
    }
    informationDetailRestaurant(restaurant) {
        this.promesse.then(resultat => {
            // si le restaurant a des commentaires, je calcul la moyenne des commentaires
            if (resultat.reviews) {
                resultat.moyenneCommentaire = resultat.reviews.reduce((somme, note) => {
                    return (somme += note.rating);
                }, 0)/resultat.reviews.length;
            } else {
                resultat.moyenneCommentaire = 0;
            }
            this.infoDetailsComplementaire(restaurant);
        })
    }
    infoDetailsComplementaire(restaurant) {
        this.promesse.then(resultat => {
            // recuperation des informations complémentaires
            const horaireRestaurant = resultat.opening_hours ? resultat.opening_hours.weekday_text : ["Les horaires ne sont pas disponibles"];
            const avisEtCommentaires = resultat.reviews ? resultat.reviews : ["Les commentaires ne sont pas disponibles"];
            const restaurantGooglePlace = {
                restaurantName: restaurant.restaurantName,
                address: restaurant.address,
                lat: restaurant.lat,
                long: restaurant.long,
                ratings: [],
                moyenne: restaurant.moyenne, // récuperation de la moyenne fournie par l'API
                horaires: [],
                moyenneCommentaires: (resultat.moyenneCommentaire) ? resultat.moyenneCommentaire : ["Il N'y a pas de moyenne disponible"]
            };
            restaurantGooglePlace.horaires.push(horaireRestaurant);
            avisEtCommentaires.forEach(avisEtCommentaire => {
                restaurantGooglePlace.ratings.push({
                    stars: avisEtCommentaire.rating,
                    comment: avisEtCommentaire.text
                });
            });
            if (restaurantGooglePlace.ratings.length === 0 && restaurant.ratings) {
                restaurantGooglePlace.ratings = restaurant.ratings;
            }
            this.ficheRestaurant(restaurantGooglePlace)
            this.restaurantSelectionner = restaurantGooglePlace;  
        });
    }
    ficheRestaurant(restaurant) {
        // fiche restaurant qui regroupe toutes les infos détaillée d'un restaurant
        $("#descriptionRestaurant").html(
            `<div id="descriptionRestaurantDynamique">
            <img src="https://maps.googleapis.com/maps/api/streetview?size=450x240&location=${restaurant.lat},${restaurant.long}
            &fov=80&heading=0&pitch=0 
            &key=AIzaSyAdXVJEBNlfp2ocuj3ynGnG8vayUtpOIwo"/>` +
            `<h4>${restaurant.restaurantName} (${Math.round(restaurant.moyenne * 100)/100} étoiles)</h4>
            <p>${restaurant.address}<br><br>
            <span id="horaire">Horaire d'ouverture </span> <br><br>
            ${this.horaireOuverture(restaurant)}<br><br>
            <span id="moyenneCommentaire">Moyenne commentaire : ${Math.round(restaurant.moyenneCommentaires * 100) / 100}/5</span>
            ${restaurant.ratings.map(rating => `<p class="comments"><span>Commentaires : </span>  ${rating.comment} </p>`).join(" ")}</p>
            </div>`
            );
        }
        horaireOuverture(restaurant) {
            // affiche les horaires si l'API les fournie
            if (restaurant.horaires) {
                return `${restaurant.horaires[0].join(" <br/> ")}`;
            } else {
                return "Les horaires ne sont pas disponibles";
            }
        }

    }