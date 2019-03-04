// Platz für weitere Definitionen
// 4. 1. 2019

"use strict";

window.JB = window.JB || {};
window.JB.GPX2GM = window.JB.GPX2GM || {};

// Google Maps API Key
// JB.GPX2GM.GM_Api_key = "";
// Key für OSM Cycle
// JB.GPX2GM.OSM_Cycle_Api_Key = "";
// Key für OSM Landscape
// JB.GPX2GM.OSM_Landscape_Api_Key = "";

//var Mapapi = "gm";

// Definition der Icons, bei eigenen Icons nur Kleinbuchstaben verwenden.
JB.Icons = function(baseurl) {
	this.DefShadow	= { shadow: { anchor: {x:10,y:35}, url: baseurl+"Icons/shadow50.png" } };
	this.Bild				= { icon:   { anchor: {x: 6,y:31}, url: baseurl+"Icons/scenic.png" },
											shadow: { anchor: {x:10,y:31}, url: baseurl+"Icons/shadow.png" } };
	//this.MoveMarker	= { icon:   { anchor: {x: 6,y: 6}, url: baseurl+"Icons/marker.gif" } };
	this.MoveMarker	= { icon:   { anchor: {x: 6,y: 6}, url: baseurl+"Icons/marker.svg", 
											scaledSize: { width: 11, height: 11, widthUnit: "px", heightUnit: "px" },
											size: { width: 11, height: 11, widthUnit: "px", heightUnit: "px" } } };
	//this.Cluster		= { icon:   { anchor: {x:16,y:16}, url: baseurl+"Icons/cluster.png" } };
	this.Cluster 		= { icon:   { anchor: {x:16,y:16}, url: baseurl+"Icons/cluster.svg", 
											scaledSize: { width: 31, height: 31, widthUnit: "px", heightUnit: "px" },
											size: { width: 31, height: 31, widthUnit: "px", heightUnit: "px" } } };
	this.Kreis			= { icon:   { anchor: {x:38,y:38}, url: baseurl+"Icons/kreis.png" } };
	this.marker_bw	= { icon:   { anchor: {x:13,y:41}, url: baseurl+"Icons/marker-icon_bw.png" } };
	this.CL   			= { icon:   { anchor: {x:16,y:16}, url: baseurl+"Icons/current_location.svg", 
											scaledSize: { width: 31, height: 31, widthUnit: "px", heightUnit: "px" },
											size: { width: 31, height: 31, widthUnit: "px", heightUnit: "px" } } };
	this.lodging		= { icon:   { anchor: {x:15,y:36}, url: baseurl+"Icons/hotel2.png" },
	//this.lodging		= { icon:   { anchor: {x:15,y:31}, url: baseurl+"Icons/hotel.png" },
											shadow: { anchor: {x:10,y:31}, url: baseurl+"Icons/shadow.png" } };
	this.hotel = this.lodging;
	this.museum			= { icon:   { anchor: {x:15,y:36}, url: baseurl+"Icons/museum.png" },
											shadow: { anchor: {x:10,y:31}, url: baseurl+"Icons/shadow.png" } };
	this.residence	= { icon:   { anchor: {x:15,y:36}, url: baseurl+"Icons/villa.png" },
											shadow: { anchor: {x:10,y:31}, url: baseurl+"Icons/shadow.png" } };
	this.library		= { icon:   { anchor: {x:15,y:36}, url: baseurl+"Icons/library.png" },
											shadow: { anchor: {x:10,y:31}, url: baseurl+"Icons/shadow.png" } };
	this.park				= { icon:   { anchor: {x:15,y:36}, url: baseurl+"Icons/park.png" },
											shadow: { anchor: {x:10,y:31}, url: baseurl+"Icons/shadow.png" } };
	this.castle			= { icon:   { anchor: {x:15,y:36}, url: baseurl+"Icons/castle.png" },
											shadow: { anchor: {x:10,y:31}, url: baseurl+"Icons/shadow.png" } };
	this.airport		= { icon:   { anchor: {x:15,y:36}, url: baseurl+"Icons/airport.png" },
											shadow: { anchor: {x:10,y:31}, url: baseurl+"Icons/shadow.png" } };
	this.church			= { icon:   { anchor: {x:15,y:36}, url: baseurl+"Icons/church2.png" },
											shadow: { anchor: {x:10,y:31}, url: baseurl+"Icons/shadow.png" } };
	this.bridge			= { icon:   { anchor: {x:15,y:36}, url: baseurl+"Icons/bridge.png" },
											shadow: { anchor: {x:10,y:31}, url: baseurl+"Icons/shadow.png" } };
	this.bar				= { icon:   { anchor: {x:15,y:36}, url: baseurl+"Icons/bar.png" },
											shadow: { anchor: {x:10,y:31}, url: baseurl+"Icons/shadow.png" } };
	this.restaurant	= { icon:   { anchor: {x:15,y:36}, url: baseurl+"Icons/restaurant.png" },
											shadow: { anchor: {x:10,y:31}, url: baseurl+"Icons/shadow.png" } };
	this.start			= { icon:   { anchor: {x:15,y:36}, url: baseurl+"Icons/start.png" },
											shadow: { anchor: {x:10,y:31}, url: baseurl+"Icons/shadow.png" } };
	this.finish			= { icon:   { anchor: {x:15,y:36}, url: baseurl+"Icons/finish.png" },
											shadow: { anchor: {x:10,y:31}, url: baseurl+"Icons/shadow.png" } };
	this.cycling		= { icon:   { anchor: {x:15,y:36}, url: baseurl+"Icons/cycling.png" },
											shadow: { anchor: {x:10,y:31}, url: baseurl+"Icons/shadow.png" } };
	this.hiking			= { icon:   { anchor: {x:15,y:36}, url: baseurl+"Icons/hiking.png" },
											shadow: { anchor: {x:10,y:31}, url: baseurl+"Icons/shadow.png" } };
	this.flag				= { icon:   { anchor: {x:15,y:36}, url: baseurl+"Icons/flag.png" },
											shadow: { anchor: {x:10,y:31}, url: baseurl+"Icons/shadow.png" } };
	this.harbor			= { icon:   { anchor: {x:15,y:36}, url: baseurl+"Icons/harbor.png" },
											shadow: { anchor: {x:10,y:31}, url: baseurl+"Icons/shadow.png" } };
	this.anchor			= this.harbor;
	this.campground	= { icon:   { anchor: {x:15,y:36}, url: baseurl+"Icons/tent.png" },
											shadow: { anchor: {x:10,y:31}, url: baseurl+"Icons/shadow.png" } };
	this.summit     = { icon:   { anchor: {x:15,y:36}, url: baseurl+"Icons/peak.png" },
											shadow: { anchor: {x:10,y:31}, url: baseurl+"Icons/shadow.png" } };
	this.railway    = { icon:   { anchor: {x:15,y:36}, url: baseurl+"Icons/train.png" },
											shadow: { anchor: {x:10,y:31}, url: baseurl+"Icons/shadow.png" } };
	this["shopping center"] = { icon:   { anchor: {x:15,y:36}, url: baseurl+"Icons/shoppingmall.png" },
											shadow: { anchor: {x:10,y:31}, url: baseurl+"Icons/shadow.png" } };
	this["ground transportation"] = { icon:   { anchor: {x:15,y:36}, url: baseurl+"Icons/subway.png" },
											shadow: { anchor: {x:10,y:31}, url: baseurl+"Icons/shadow.png" } };
	this["scenic area"] = { icon:   { anchor: {x:15,y:36}, url: baseurl+"Icons/photo.png" },
											shadow: { anchor: {x:10,y:31}, url: baseurl+"Icons/shadow.png" } };
	this["boat ramp"]   = { icon:   { anchor: {x:15,y:36}, url: baseurl+"Icons/boat.png" },
											shadow: { anchor: {x:10,y:31}, url: baseurl+"Icons/shadow.png" } };
	this.circle_red 		= { icon:   { anchor: {x:8,y:6}, url: baseurl+"Icons/circle_red.svg", 
											scaledSize: { width: 15, height: 15, widthUnit: "px", heightUnit: "px" },
											size: { width: 15, height: 15, widthUnit: "px", heightUnit: "px" } } };
	this.circle_green		= { icon:   { anchor: {x:8,y:8}, url: baseurl+"Icons/circle_green.svg", 
											scaledSize: { width: 15, height: 15, widthUnit: "px", heightUnit: "px" },
											size: { width: 15, height: 15, widthUnit: "px", heightUnit: "px" } } };
	this.square_red 		= { icon:   { anchor: {x:8,y:8}, url: baseurl+"Icons/square_red.svg", 
											scaledSize: { width: 15, height: 15, widthUnit: "px", heightUnit: "px" },
											size: { width: 15, height: 15, widthUnit: "px", heightUnit: "px" } } };
	this.square_green		= { icon:   { anchor: {x:8,y:8}, url: baseurl+"Icons/square_green.svg", 
											scaledSize: { width: 15, height: 15, widthUnit: "px", heightUnit: "px" },
											size: { width: 15, height: 15, widthUnit: "px", heightUnit: "px" } } };

	//this.myicon       = { icon:   { anchor: {x:15,y:36}, url: baseurl+"Icons/myicon.png" },
	//                    shadow: { anchor: {x:10,y:31}, url: baseurl+"Icons/shadow.png" } };
	// Most Icons from https://mapicons.mapsmarker.com/
} ;   

JB.GPX2GM.units = {};
JB.GPX2GM.units.si =  {
	way: "km",
	speed: "km/h",
	alt: "m",
	pace: "min/km"
};
JB.GPX2GM.units.enus =  {
	way: "miles",
	speed: "mph",
	alt: "ft",
	pace: "min/mile"
};
JB.GPX2GM.units.airwater = JB.GPX2GM.units.water =  {
	way: "sm",
	speed: "kn",
	alt: "ft",
	pace: "min/sm"
};
JB.GPX2GM.units.air =  {
	way: "NM",
	speed: "kn",
	alt: "ft",
	pace: "min/NM"
};

JB.GPX2GM.strings = {};
JB.GPX2GM.strings.de = {
	lenght: "L\u00e4nge",
	way: "Strecke",
	duration: "Dauer",
	tstart: "Startzeit",
	time: "Zeit",
	time_unit: "Stunden",
	altdiff: "H\u00F6hendifferenz",
	alt: "H\u00F6he",
	in: " in ",
	grade: "Stg.",
	grade_unit: "%",
	avspeed: "V<sub>m</sub>",
	speed2: "Geschw.",
	speed: "V",
	pace: "Pace",
	hr2: "Puls",
	hr: "HF",
	hr_unit: "1/min",
	cad: "Cadenz",  
	cad_unit: "UpM",
	wpt: "Wegpunkt",
	wpts: "Wegpunkte",
	pwpt: "Bildwegpunkt",
	trk: "Track",
	trks: "Tracks",
	rte: "Route",
	rtes: "Routen",
	inmo: "in Bewegung",
	// wait: "Bitte warten.<br />Daten werden geladen.",
	wait: "",  // Wartebild nehmen
	clkz: "Zum Zoomen klicken",
	zb: "Zurück zoomen",
	frage_datenschutz_gm: "Diese Seite verwendet Karten und ein Api von Google sowie möglicherweise auch OSM-Karten. Dadurch werden Besucherdaten an den jeweiligen Dienstanbieter übertragen. Mehr dazu im Impressum. Ist das OK?",
	antwort_datenschutz_gm: "Die Zustimmung zur Nutzung des Google Maps API wurde verweigert. Beim erneuten Laden der Seite können Sie ihre Meinung ändern.",
	frage_datenschutz_osm: "Diese Seite verwendet OSM-Karten. Dadurch werden Besucherdaten an den jeweiligen Dienstanbieter übertragen. Mehr dazu im Impressum. Ist das OK?",
	antwort_datenschutz_osm: "Die Zustimmung zur Nutzung der OSM-Karten wurde verweigert. Beim erneuten Laden der Seite können Sie ihre Meinung ändern.",
	fullScreen: "Full Screen",
	normalSize: "Normale Gr\u00F6\u00dfe",
	showCurrentLocation: "Aktuelle Position anzeigen",
	hideCurrentLocation: "Aktuelle Position verbergen",
	showTrafficLayer: "Verkehr anzeigen",
	hideTrafficLayer: "Verkehr verbergen",
	noMap: "Keine Karte"
}
// Französische Texte von Jean-Jacques und Pierre-Michel Sarton
JB.GPX2GM.strings.fr = {
	lenght: "Distance au point donné",
	way: "Distance totale",
	duration: "Durée totale",
	tstart: "Date du trajet",
	time: "Durée à ce point",
	time_unit: "heures",
	altdiff: "Dénivelés",
	alt: "Altitude", //"Altitude",
	//alt_unit: "m",
	in: " en ",
	grade: "Pente",
	grade_unit: "%",
	avspeed: "Vitesse moyenne",
	speed2: "Vitesse instantannée",
	speed: "V",
	pace: "Pace",
	hr2: "Pouls",
	hr: "Pouls",
	hr_unit: "1/min",
	cad: "Cadence", 
	cad_unit: "t/min",
	wpt: "Point d'intérêt",
	wpts: "Points d'intérêts",
	pwpt: "Picture Waypoint",
	trk: "Tracé",
	trks: "Tracés",
	rte: "Itinéraire",
	rtes: "Itinéraires",
	inmo: "En mouvement",
	// wait: "Please wait.<br />Loading data.",
	wait: "",  // Wartebild nehmen
	clkz: "Cliquez pour agrandir",
	zb: "Retour du Zoom",
	frage_datenschutz_gm: "Cette page utilise des cartes et une API de Google et éventuellement aussi de cartes OSM. Cela transfère les données des visiteurs au fournisseur des services respectifs. Pour savoir plus voire les mentions légales. Est-ce que tout va bien ?",
	antwort_datenschutz_gm: "L'autorisation d'utiliser l'API Google Maps a été refusée. Vous pouvez changer d'avis lorsque vous rechargez la page.",
	frage_datenschutz_osm: "Cette page utilise des cartes OSM (OpenStreetMap). Les données des visiteurs sont transférées au fournisseur des services respectifs. En poursuivant votre navigation sur ce site, vous acceptez la transmission de vos informations",
	antwort_datenschutz_osm: "L'autorisation d'utiliser les cartes OSM a été refusée. Vous pouvez changer d'avis lorsque vous rechargez la page.",
	fullScreen: "Plein écran",
	normalSize: "Taille normale",
	showCurrentLocation: "Afficher la position actuelle",
	hideCurrentLocation: "cacher la position actuelle",
	showTrafficLayer: "Afficher le traffic",
	hideTrafficLayer: "Cacher le traffic",
	noMap: "Pas de carte"
}
JB.GPX2GM.strings.en = {
	lenght: "Length",
	way: "Way",
	duration: "Duration",
	tstart: "Start time",
	time: "Time",
	time_unit: "hours",
	altdiff: "Elevation difference",
	alt: "Elevation", //"Altitude",
	//alt_unit: "m",
	in: " in ",
	grade: "Grade",
	grade_unit: "%",
	avspeed: "V<sub>m</sub>",
	speed2: "Speed",
	speed: "V",
	pace: "Pace",
	hr2: "Heart rate",
	hr: "HR",
	hr_unit: "1/min",
	cad: "Cadence", 
	cad_unit: "rpm",
	wpt: "Waypoint",
	wpts: "Waypoints",
	pwpt: "Picture Waypoint",
	trk: "Track",
	trks: "Tracks",
	rte: "Route",
	rtes: "Routes",
	inmo: "in motion",
	// wait: "Please wait.<br />Loading data.",
	wait: "",  // Wartebild nehmen
	clkz: "Click to zoom",
	zb: "Zoom back",
	frage_datenschutz_gm: "This page uses maps and an api from Google and possibly also OSM maps. This transfers visitor data to the respective service provider. Read more about this in the imprint. Is that all right?",
	antwort_datenschutz_gm: "Permission to use the Google Maps API has been denied. You can change your mind when you reload the page.",
	frage_datenschutz_osm: "This page uses OSM maps. This transfers visitor data to the respective service provider. Read more about this in the imprint. Is that all right?",
	antwort_datenschutz_osm: "Permission to use the OSM maps has been denied. You can change your mind when you reload the page.",
	fullScreen: "Full Screen",
	normalSize: "Normal Size",
	showCurrentLocation: "Show current location",
	hideCurrentLocation: "Hide current location",
	showTrafficLayer: "Show traffic",
	hideTrafficLayer: "Hide traffic",
	noMap: "No Map"
}

/* // Prototyp für Callbackfunktion
JB.GPX2GM.callback = function(pars) {
	JB.Debug_Info("callback",pars.id+" "+pars.type,false);
	switch(pars.type) {
		case "Map_div_v" :
			break;
		case "Map_div_n" :
			break;
		case "Map_v":
			break;
		case "Map_n":
			break;
		case "Wegpunkte_v":
			break;
		case "Wegpunkte_n":
			break;
		case "Routen_v":
			break;
		case "Routen_n":
			break;
		case "Tracks_v":
			alert(pars.gpxdaten.tracks.laenge);
			for(var i=0;i<pars.gpxdaten.tracks.track.length;i++)
				alert(pars.gpxdaten.tracks.track[i].laenge); 
			break;
		case "Tracks_n":
			break;
		case "Profile_v":
			break;
		case "Profile_n":
			break;
		case "click_Marker_Text":
			break;
		case "click_Marker_Bild":
			break;
		case "click_Route":
			break;
		case "click_Track":
			console.info(pars);
			break;
	}
	return true;
} // JB.GPX2GM.callback */

/* // Autoscale in den Profilen abschalten
JB.Scaling = {   // nur paarweise verwenden
	hmin:0,hmax:1000,  // Höhenplot
	smin:-30,smax:30,  // Steigungsplot
	vmin:0,vmax:100,   // Geschwindigkeitsplot
	hrmin:50,hrmax:200,   // Herzfrequenz
	cadmin:0,cadmax:150,   // Trittfrequenz
	hardscaling:false   // Skalierwerte bindend (true) oder Minwerte(false)
}; */
