export class DonneesRestaurant {
   constructor(main, googleMap) {
      this.main = main;
      this.googleMap = googleMap;
      this.listeRestaurant = [];
      this.listeRestaurantSauvegarder = [];
      this.ajouterAvis();
      this.ajouterUnNouveauRestaurant();
      this.trouverDesRestaurantDansLaZone();
   }
   requeteRestaurantAproximite(callback) {
      // Requete asynchrone de recherche de proximité à 500 metres;
      const restaurantProximite = {
         type: ["restaurant"],
         location: {
            lat: this.googleMap.location.latitude,
            lng: this.googleMap.location.longitude
         },
         radius: "500"
      };
      const service = new google.maps.places.PlacesService(this.googleMap.map);
      service.nearbySearch(restaurantProximite, (resultats, statut) => {
         // requete passé en parametre de nearbySearch propriété de l'API Google
         this.rechercheRestaurant(resultats, statut, callback)
         
      });
   }
   rechercheRestaurant(resultats, statut, callback) {
      // les différentes données que je souhaite récuperer.
      if (statut == google.maps.places.PlacesServiceStatus.OK) {
         this.listeRestaurant = resultats.map(restaurant => { //stocke tous les restaurants recu dans un tableau
            return {
               placeId: restaurant.place_id,
               restaurantName: restaurant.name,
               address: restaurant.vicinity,
               lat: restaurant.geometry.location.lat(),
               long: restaurant.geometry.location.lng(),
               ratings: [],
               moyenne: restaurant.rating
            };
         });
         callback();
      }
   }
    affichageListeRestaurant(listeDesRestaurants) {
      // function qui affiche la liste des restaurants récupérés depuis la recherche
      function afficheListe(restaurant, listeDesRestaurants) {
         return `<div class="restaurant" id="${listeDesRestaurants.indexOf(restaurant)}">
         <p> ${restaurant.restaurantName} <strong> (${Math.round(restaurant.moyenne * 100)/100} étoiles)</strong></p>
         <p> ${restaurant.address} </p>
         </div>`};
         $("#restaurantRank").show();
         $(".restaurantList").html(`${listeDesRestaurants.map( (restaurant) => afficheListe(restaurant, listeDesRestaurants)).join(" ")}`)
      }
      ajouterAvis() {  
         // ajouter un avis avec la modale ajouter un avis
         $("#formulaireCommentaire").submit( (e) => {
            e.preventDefault(); // permet de supprimer le comportement normal d'un submit
            let nouveauCommentaire = $("#espaceCommentaire").val();
            let nouvelleNote = parseInt($("#noteRestaurant").val());
            this.googleMap.restaurantSelectionner.ratings.unshift({
               "stars": nouvelleNote,
               "comment": nouveauCommentaire,
            }); // pousse les nouveaux élement dans le restaurant selectionner
            
            this.main.moyenneCommentaireRestaurantSelectionner(); 
            this.googleMap.ficheRestaurant(this.googleMap.restaurantSelectionner); // réactualise la fiche du restaurant
            $("#fenetreModale").hide();
            $("#espaceCommentaire, #noteRestaurant").val("");
         });
      }
      ajouterUnNouveauRestaurant() {
         $("#formulaireAjoutRestaurant").submit((e) => {
            e.preventDefault(); // permet de supprimer le comportement normal d'un submit
            const geocoder = new google.maps.Geocoder(); //Le géocoder est un processus de conversion des adresses en coordonnées géographiques 
            geocoder.geocode({ "address": $("#adresseDuNouveauRestaurant").val()}, (resultat, statut) => {
               // j'utilise cet élement pour placer le nouveau restaurant sur la carte avec les données recues
               if (statut == "OK") {
                  let nouveauRestaurant = {
                     "restaurantName": $("#nomDuNouveauRestaurant").val(),
                     "address": $("#adresseDuNouveauRestaurant").val(),
                     "lat": resultat[0].geometry.location.lat(),
                     "long": resultat[0].geometry.location.lng(),
                     "ratings": [{
                        "stars": parseInt($("#noteNouveauRestaurant").val()) || 0,
                        "comment": $("#espaceCommentaireNouveauRestaurant").val()
                     }],
                  };
                  nouveauRestaurant.moyenne = nouveauRestaurant.ratings.reduce((somme, rating) => {
                     // calcul de la moyenne du restaurant
                     return somme += rating.stars
                  }, 0) / nouveauRestaurant.ratings.length
                  nouveauRestaurant.moyenneCommentaires = nouveauRestaurant.moyenne
                  this.listeRestaurant.unshift(nouveauRestaurant); // pousse le nouveau restaurant dans la liste des restaurants
                  this.listeRestaurantSauvegarder.push(nouveauRestaurant); // je garde le nouveau restaurant en mémoire dans un tableau
                  this.main.miseAjourDesRestaurant();
                  this.googleMap.infoBulleNewRestaurant.close();
                  $("#fenetreModaleRestaurant").hide();
                  $("#nomDuNouveauRestaurant, #espaceCommentaireNouveauRestaurant, #noteNouveauRestaurant").val("");
               } else {
                  alert("Le système géocode n'est pas disponible. L'adresses n'est pas disponible ")
               }
            })
         })
      }
      trouverDesRestaurantDansLaZone() {
         
         $("#conteneurBouttonRecherche").show();
         $("#bouttonRecherche").click("center_changed", () => {
            // fonction évenement de l'API qui permet de changer le centre de la map
            this.googleMap.location.latitude = this.googleMap.map.center.lat();
            this.googleMap.location.longitude = this.googleMap.map.center.lng();
            // je change le centre de la map et je relance l'application.
            this.main.initialisationDeLaListeRestaurant();
         })
      }
   }
   
