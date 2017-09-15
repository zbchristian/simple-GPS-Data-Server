// gmutils.js
// Version 2.0.1
// 29. 5. 2017
// www.j-berkemeier.de

"use strict";

window.JB = window.JB || {};

JB.Map = function(mapcanvas,id) {
	JB.Debug_Info("","gmutils.js Version 2.0.1 vom 29. 5. 2017",false);
	if(!JB.debuginfo && typeof(console) != "undefined" && typeof(console.log) == "function" )
		console.log("gmutils.js Version 2.0.1 vom 29. 5. 2017");
	var dieses = this;
	dieses.id = id;
	dieses.mapcanvas = mapcanvas;
	this.cluster_zoomhistory = [];
	// Optionen für die Map und Map anlegen
	var large = mapcanvas.offsetHeight>190 && mapcanvas.offsetWidth>200;
	var myOptions = {
		mapTypeId: google.maps.MapTypeId.ROADMAP,
		//panControl: large,
		zoomControl: true, //large,
		/*zoomControlOptions: {
			style: google.maps.ZoomControlStyle[JB.gc.largemapcontrol?"LARGE":"SMALL"]
		},*/
		mapTypeControl: large & JB.gc.showmaptypecontroll,
		mapTypeControlOptions: {
			style: google.maps.MapTypeControlStyle.DROPDOWN_MENU,
			position: google.maps.ControlPosition.TOP_RIGHT,
			mapTypeIds: [google.maps.MapTypeId.ROADMAP, google.maps.MapTypeId.SATELLITE, google.maps.MapTypeId.HYBRID, google.maps.MapTypeId.TERRAIN, 'osm','osmde','cycle','landscape','nomap']
		},
		scaleControl: large,
		streetViewControl: large,
		//overviewMapControl: JB.gc.overviewmapcontrol,
		//overviewMapControlOptions: { opened: true  },
		scrollwheel: JB.gc.scrollwheelzoom
	};
	this.map = new google.maps.Map(mapcanvas,myOptions);
	
	// Google Karten
	this.maptypes = {
		Karte: google.maps.MapTypeId.ROADMAP,
		Satellit: google.maps.MapTypeId.SATELLITE,
		Hybrid: google.maps.MapTypeId.HYBRID,
		Oberflaeche: google.maps.MapTypeId.TERRAIN,
		Oberfläche: google.maps.MapTypeId.TERRAIN,
		Gelaende: google.maps.MapTypeId.TERRAIN,
		Gelände: google.maps.MapTypeId.TERRAIN
	};

	// Weitere Karten
	var osmmap = this.defineMap("https://tile.openstreetmap.org/",19,"OSM","Open Streetmap","");
	this.maptypes.OSM = "osm";
	this.map.mapTypes.set('osm', osmmap);
	
	var osmmapde = this.defineMap("https://c.tile.openstreetmap.de/tiles/osmde/",19,"OSM DE","Open Streetmap German Style","");
	this.maptypes.OSMDE = "osmde";
	this.map.mapTypes.set('osmde', osmmapde);
	
	if(JB.GPX2GM.OSM_Cycle_Api_Key && JB.GPX2GM.OSM_Cycle_Api_Key.length>0) {
		var osmcycle = this.defineMap("https://a.tile.thunderforest.com/cycle/",18,"OSM Cycle","Open Streetmap Cycle",JB.GPX2GM.OSM_Cycle_Api_Key);
		this.maptypes.OSM_Cycle = "cycle";
		this.map.mapTypes.set('cycle', osmcycle);
	}
	
	if(JB.GPX2GM.OSM_Landscape_Api_Key && JB.GPX2GM.OSM_Landscape_Api_Key.length>0) {
		var osmlandscape = this.defineMap("https://b.tile.thunderforest.com/landscape/",18,"OSM\u00A0Landscape","Open Streetmap Landscape",JB.GPX2GM.OSM_Landscape_Api_Key);
		this.maptypes.OSM_Landscape = "landscape";
		this.map.mapTypes.set('landscape', osmlandscape);
	}
	
  var grau = new google.maps.ImageMapType({
    getTileUrl: function(ll, z) {
      return JB.GPX2GM.Path+"Icons/Grau256x256.png";
    },
    tileSize: new google.maps.Size(256, 256),
    isPng: true,
    maxZoom: 19,
    name: "Keine Karte",
    alt: "Keine Karte"
  });
	if(JB.gc.doclang!="de") grau.alt = grau.name = "No Map";
	this.maptypes.Keine_Karte = "nomap";
	this.map.mapTypes.set('nomap', grau);

	// Copyright für OSM
	var osmcopyright = document.createElement('div');
	osmcopyright.id = 'copyright-control';
	osmcopyright.style.fontSize = '10px';
	osmcopyright.style.fontFamily = 'Arial, sans-serif';
	osmcopyright.style.whiteSpace = 'nowrap';
	osmcopyright.index = 1; 
	osmcopyright.style.color = "black";
	osmcopyright.style.backgroundColor = "rgba(255,255,255,0.5)";
	this.map.controls[google.maps.ControlPosition.BOTTOM_RIGHT].push(osmcopyright);
	dieses.maxzoom = 19;
/*	dieses.watch("maxzoom",function(id,oldval,newval) { // ------------------------------------------------- watch -----------------
		console.error(id,oldval+" -> "+newval);
		return newval;
	});*/
	google.maps.event.addListener(this.map, "maptypeid_changed", function() {
		var maptype = dieses.map.getMapTypeId();
		if (dieses.map.getMapTypeId() == 'osm') {
			osmcopyright.innerHTML = 'Map data &copy; <a href="https://www.openstreetmap.org/" target="_blank">OpenStreetMap</a> and contributors <a href="https://creativecommons.org/licenses/by-sa/2.0/" target="_blank">CC-BY-SA</a>';
			dieses.maxzoom = 19;
		} 
		else if (dieses.map.getMapTypeId() == 'osmde') {
			osmcopyright.innerHTML = 'Map data &copy; <a href="https://www.openstreetmap.org/" target="_blank">OpenStreetMap</a> and contributors <a href="https://creativecommons.org/licenses/by-sa/2.0/" target="_blank">CC-BY-SA</a>';
			dieses.maxzoom = 19;
		} 
		else if (dieses.map.getMapTypeId() == 'cycle') {
			osmcopyright.innerHTML = 'Map data &copy; <a href="https://www.thunderforest.com/" target="_blank">OpenCycleMap</a> and contributors <a href="https://creativecommons.org/licenses/by-sa/2.0/" target="_blank">CC-BY-SA</a>';
			dieses.maxzoom = 18;
		} 
		else if (dieses.map.getMapTypeId() == 'landscape') {
			osmcopyright.innerHTML = 'Map data &copy; <a href="https://www.thunderforest.com/" target="_blank">OpenLandscapeMap</a> and contributors <a href="https://creativecommons.org/licenses/by-sa/2.0/" target="_blank">CC-BY-SA</a>';
			dieses.maxzoom = 18;
		} 
		else if(maptype == 'satellite' || maptype == "hybrid") {
			dieses.maxzoom = 19;
/*			var pos = new google.maps.LatLng(0.0,0.0);
			if(dieses.map.getCenter()) pos = dieses.map.getCenter();
			var mzs = new google.maps.MaxZoomService();
			mzs.getMaxZoomAtLatLng(pos, function(MZR) { if(MZR.status=="OK") dieses.maxzoom = MZR.zoom; }); */
		}
		else {
			osmcopyright.innerHTML = '';
			dieses.maxzoom = 21;
		}
		JB.Debug_Info(dieses.id,"Maptype: "+maptype+", Maxzoom: "+dieses.maxzoom,false);
	});

	// Mein Copyright und Versionshinweis
	var jbcp = document.createElement('a');
	jbcp.href='https://www.j-berkemeier.de/GPXViewer';
	jbcp.innerHTML = "JB";
	jbcp.style.color = "white";
	jbcp.style.textDecoration = "none"; 
	jbcp.style.margin = " 0 0 0 8px";
	jbcp.style.fontSize = '10px';
	jbcp.style.fontFamily = 'Arial, sans-serif';
	jbcp.title = "GPX Viewer " + JB.GPX2GM.ver;
	this.map.controls[google.maps.ControlPosition.LEFT_BOTTOM].push(jbcp);

	// Button für Full Screen / normale Größe
	if(JB.gc.fullscreenbutton) {
		var fsbdiv = document.createElement("button");
		fsbdiv.style.backgroundColor = "transparent";
		fsbdiv.style.border = "none"; 
		fsbdiv.style.padding = "7px 7px 7px 0";
		var fsbim = document.createElement("img");
		fsbim.src = JB.GPX2GM.Path+"Icons/lupe+.png";
		fsbim.title = "Full Screen";
		fsbim.large = false;
		var ele = mapcanvas.parentNode;
		fsbdiv.onclick = function() {
			this.blur();
			if(fsbim.large) {
				document.body.style.overflow = "";
				fsbim.src = JB.GPX2GM.Path+"Icons/lupe+.png";
				fsbdiv.title = fsbim.title = fsbim.alt = "Full Screen";
				ele.style.left = ele.oleft + "px";
				ele.style.top = ele.otop + "px";
				ele.style.width = ele.owidth + "px";
				ele.style.height = ele.oheight + "px";
        ele.style.margin = ele.omargin;
        ele.style.padding = ele.opadding;
				window.setTimeout(function() {
					JB.removeClass("JBfull",ele);
					ele.style.position = ele.sposition; 
					ele.style.left = ele.sleft;
					ele.style.top = ele.stop;
					ele.style.width = ele.swidth;
					ele.style.height = ele.sheight;
					//ele.style.zIndex = ele.szindex;
				},1000);
			}
			else {
				document.body.style.overflow = "hidden";
				fsbim.src = JB.GPX2GM.Path+"Icons/lupe-.png";
				if(JB.gc.doclang=="de") fsbdiv.title = fsbim.title = fsbim.alt = "Normale Gr\u00F6\u00dfe";
				else                    fsbdiv.title = fsbim.title = fsbim.alt = "Normal Size";
				var scrollY = 0;
				if(document.documentElement.scrollTop && document.documentElement.scrollTop!=0)  scrollY = document.documentElement.scrollTop;
				else if(document.body.scrollTop && document.body.scrollTop!=0)  scrollY = document.body.scrollTop;
				else if(window.scrollY) scrollY = window.scrollY;
				else if(window.pageYOffset) scrollY = window.pageYOffset;
				var rect = JB.getRect(ele);
			  ele.oleft = rect.left;
				ele.otop =  rect.top - scrollY;
				ele.owidth = rect.width;
				ele.oheight = rect.height;
				//ele.szindex = ele.style.zIndex;
				ele.sposition = ele.style.position;
        ele.omargin = ele.style.margin;
        ele.opadding = ele.style.padding;
				ele.sleft = ele.style.left;
				ele.stop = ele.style.top;
				ele.swidth = ele.style.width;
				ele.sheight = ele.style.height;
				ele.style.position = "fixed";
				ele.style.left = ele.oleft+"px";
				ele.style.top = ele.otop+"px";
				ele.style.width = ele.owidth+"px";
				ele.style.height = ele.oheight+"px";
				//ele.style.zIndex = "1001";
				window.setTimeout(function() {
					JB.addClass("JBfull",ele);
					ele.style.width = "100%";
					ele.style.height = "100%";
					ele.style.left = "0px";
					ele.style.top = "0px";
          ele.style.margin = "0px";
          ele.style.padding = "0px";
				},100);
			}
			fsbim.large = !fsbim.large;
		};
		fsbdiv.appendChild(fsbim);
		fsbdiv.index = 0;
		this.map.controls[google.maps.ControlPosition.TOP_RIGHT].push(fsbdiv);
	} // fullscreenbutton
	
	// Button für Traffic-Layer
	if(JB.gc.trafficbutton) {
		JB.Debug_Info("","Trafficlayer wird eingerichtet.",false);
		var trbnr=-1,trafficLayer=null;
		google.maps.event.addListener(this.map, "maptypeid_changed", function() {
			var maptype = dieses.map.getMapTypeId();
			var trb = document.createElement("button");
			trb.style.backgroundColor = "white";
			trb.style.color = "#444";
			trb.style.fontSize = "14px";
			trb.style.fontWeight = "bold";
			trb.style.border = "none"; 
			trb.style.display = "inline-block"; 
			trb.style.position = "relative"; 
			trb.style.width = "28px"; 
			trb.style.height = "28px";
			trb.style.margin = "10px 10px 0 0";
			trb.style.borderRadius = "2px";
			trb.innerText = "T";
			if(JB.gc.doclang=="de") trb.title = "Verkehr anzeigen";
			else                    trb.title = "Show traffic layer";
			trb.onclick = function() {
				this.blur();
				if(!trafficLayer) {
					trafficLayer = new google.maps.TrafficLayer(); 
					trafficLayer.setMap(dieses.map);
					trb.style.color = "#bbb";
					if(JB.gc.doclang=="de") trb.title = "Verkehr verbergen";
					else                    trb.title = "Hide traffic layer";
				}
				else {
					trafficLayer.setMap(null);
					trafficLayer = null;
					trb.style.color = "#444";
					if(JB.gc.doclang=="de") trb.title = "Verkehr anzeigen";
					else                    trb.title = "Show traffic layer";
				}
			}
			if( maptype=="roadmap" || maptype=="terrain" || maptype=="hybrid") {
				if(trbnr==-1) trbnr = dieses.map.controls[google.maps.ControlPosition.RIGHT_BOTTOM].push(trb);
				if(JB.gc.trafficonload) trb.click();
			}
			else {
				if(trafficLayer) {
					trafficLayer.setMap(null);
					trafficLayer = null;
				}
				if(trbnr>-1) dieses.map.controls[google.maps.ControlPosition.RIGHT_BOTTOM].removeAt(trbnr-1);
				trbnr = -1;
			}
		}); // maptypeid_changed-Handler
	} // Traffic-Layer
	
	// Button für Anzeige aktuelle Position
	if(JB.gc.currentlocationbutton) {
		var clb = document.createElement("button");
		clb.style.backgroundColor = "white";
		clb.style.border = "none"; 
		clb.style.display = "inline-block"; 
		clb.style.position = "relative"; 
		clb.style.width = "28px"; 
		clb.style.height = "28px";
		clb.style.margin = "10px 10px 0 0";
		clb.style.borderRadius = "2px";
		if(JB.gc.doclang=="de") clb.title = "Aktuelle Position anzeigen";
		else                    clb.title = "Show current location";
		var clbimg = document.createElement("img");
		clbimg.style.position = "absolute";
		clbimg.style.top = "50%";
		clbimg.style.left = "50%";
		clbimg.style.transform = "translate(-50%, -50%)";
		clbimg.src = JB.GPX2GM.Path+"Icons/whereami.svg";
		var wpid = -1, marker = null, first;
		clb.onclick = function() {
			this.blur();
			if (navigator.geolocation) {
				var geolocpos = function(position) {
					var lat = position.coords.latitude;
					var lon = position.coords.longitude;
					marker.setPosition(new google.maps.LatLng(lat,lon));
					if(first) { 
						dieses.map.setCenter(new google.maps.LatLng(lat,lon));
						first = false;
					}
				}
				var geolocerror = function(error) {
					var errorCodes = ["Permission Denied","Position unavailible","Timeout"];
					var errorString = (error.code<=3)?errorCodes[error.code-1]:"Error code: "+error.code;
					JB.Debug_Info("Geolocation-Dienst fehlgeschlagen!",errorString+". "+error.message,true);
				}
				first = true;
				if(!marker) marker = dieses.Marker({lat:0,lon:0},JB.icons.CL)[0];
				if ( wpid == -1 ) {
					if(JB.gc.doclang=="de") clb.title = "Aktuelle Position verbergen";
					else                    clb.title = "Hide current location";
					wpid = navigator.geolocation.watchPosition(geolocpos,geolocerror,{enableHighAccuracy:true, timeout: 5000, maximumAge: 60000});
					marker.setMap(dieses.map);
					JB.Debug_Info("","Geolocation-Dienst wird eingerichtet.",false);
				}
				else {
					if(JB.gc.doclang=="de") clb.title = "Aktuelle Position anzeigen";
					else                    clb.title = "Show current location";
					navigator.geolocation.clearWatch(wpid);
					wpid = -1;
					marker.setMap(null);
					JB.Debug_Info("","Geolocation-Dienst wird abgeschaltet.",false);
				}
			}
			else JB.Debug_Info("geolocation","Geolocation wird nicht unterstützt!",true);
		} // click-Handler
		clb.appendChild(clbimg);
		dieses.map.controls[google.maps.ControlPosition.RIGHT_BOTTOM].push(clb);
	} // currentlocationbutton

	// Scalieren nach MAP-Resize
	dieses.zoomstatus = {};
	dieses.zoomstatus.iszoomed = false;
	dieses.zoomstatus.zoom_changed = function() {
		dieses.zoomstatus.iszoomed = true; 
		dieses.zoomstatus.level = dieses.map.getZoom();
		dieses.zoomstatus.w = mapcanvas.offsetWidth;
		dieses.zoomstatus.h = mapcanvas.offsetHeight;
	}
	google.maps.event.addListener(this.map, "dragend", function() {
		dieses.mapcenter = dieses.map.getCenter();
	});
	JB.onresize(mapcanvas,function(w,h) {
		if(w*h==0) return;
		google.maps.event.trigger(dieses.map, 'resize');
		dieses.map.setCenter(dieses.mapcenter);
		large = h>190 && w>200;
		myOptions = {
			panControl: large,
			zoomControl: large,
			mapTypeControl: large,
			scaleControl: large,
			streetViewControl: large,
		};
		dieses.map.setOptions(myOptions);
		google.maps.event.removeListener(dieses.zoomstatus.zcev);
		if(dieses.zoomstatus.iszoomed) { 
			var dz = Math.round(Math.min(Math.log(w/dieses.zoomstatus.w)/Math.LN2,Math.log(h/dieses.zoomstatus.h)/Math.LN2));
			dieses.map.setZoom(dieses.zoomstatus.level+dz);
		}
		else {
			if(dieses.bounds){
				dieses.map.fitBounds(dieses.bounds);
				dieses.map.setCenter(dieses.mapcenter);
				dieses.zoomstatus.level = dieses.map.getZoom();
				dieses.zoomstatus.w = w;
				dieses.zoomstatus.h = h;
			}
		}
		dieses.zoomstatus.zcev = google.maps.event.addListener(dieses.map, "zoom_changed", dieses.zoomstatus.zoom_changed);
	});
} // JB.Map

JB.Map.prototype.defineMap = function(tileurl,maxZoom,name,alt,key) {
	if(key.length)
		return new google.maps.ImageMapType({
			getTileUrl: function(ll, z) {
				var X = ll.x % (1 << z); if(X<0) X += (1 << z);
				return tileurl + z + "/" + X + "/" + ll.y + ".png?apikey="+key;
			},
			tileSize: new google.maps.Size(256, 256),
			isPng: true,
			maxZoom: maxZoom,
			name: name,
			alt: alt
		});
	else
		return new google.maps.ImageMapType({
			getTileUrl: function(ll, z) {
				var X = ll.x % (1 << z); if(X<0) X += (1 << z);
				return tileurl + z + "/" + X + "/" + ll.y + ".png";
			},
			tileSize: new google.maps.Size(256, 256),
			isPng: true,
			maxZoom: maxZoom,
			name: name,
			alt: alt
		});
} // defineMap

JB.Map.prototype.addMapEvent = function(event,fkt) {	
	return google.maps.event.addListener(this.map,event,fkt );
} // addMapEvent

JB.Map.prototype.addMapEventOnce = function(event,fkt) {	
	return google.maps.event.addListenerOnce(this.map,event,fkt );
} // addMapEventOnce

JB.Map.prototype.removeEvent = function(eventid) {	
	google.maps.event.removeListener(eventid);
} // removeMapEvent

JB.Map.prototype.getZoom = function() {
	return {zoom:this.map.getZoom(),maxzoom:this.maxzoom};
}

JB.Map.prototype.change = function(maptype) {
	var mt = this.maptypes[maptype]?this.maptypes[maptype]:google.maps.MapTypeId.SATELLITE;
	this.map.setMapTypeId(mt);
	JB.Debug_Info("this.id","Maptype, gewählt: "+maptype+", eingestellt: "+mt,false);
} // change

JB.Map.prototype.getPixelPerKM = function(gpxdaten) {
	var bounds = this.map.getBounds();
	if(bounds) {
		var latlon1 = new google.maps.LatLng(bounds.getNorthEast().lat(),bounds.getNorthEast().lng());
		var latlon2 = new google.maps.LatLng(bounds.getSouthWest().lat(),bounds.getSouthWest().lng());
		var korrfak = 1;
	}
	else {
		JB.Debug_Info(" getPixelPerKM","Bounds konnten nicht gelesen werden, nehme Min/Max-Werte aus GPX-Daten",false);
		var latlon1 = new google.maps.LatLng(gpxdaten.latmax,gpxdaten.lonmax);
		var latlon2 = new google.maps.LatLng(gpxdaten.latmin,gpxdaten.lonmin);
		var korrfak = 0.7;
	}
	JB.entf.init(latlon1.lat(),latlon1.lng(),0);
	var dist = JB.entf.rechne(latlon2.lat(),latlon2.lng(),0);
	JB.entf.init(latlon1.lat(),latlon1.lng(),0);
	var xdist = JB.entf.rechne(latlon1.lat(),latlon2.lng(),0);
	JB.entf.init(latlon1.lat(),latlon1.lng(),0);
	var ydist = JB.entf.rechne(latlon2.lat(),latlon1.lng(),0);
	var w = this.mapcanvas.offsetWidth;
	var h = this.mapcanvas.offsetHeight;
	var wh = Math.sqrt(w*w+h*h);
	var ppk = Math.min(w/xdist,h/ydist);
	ppk = Math.min(ppk,wh/dist);
	ppk *= korrfak;
	return ppk;
} // getPixelPerKM

JB.Map.prototype.rescale = function(gpxdaten) {
  var dieses = this;
	var sw = new google.maps.LatLng(gpxdaten.latmin,gpxdaten.lonmin);
	var ne = new google.maps.LatLng(gpxdaten.latmax,gpxdaten.lonmax);
	this.bounds = new google.maps.LatLngBounds(sw,ne);
	this.map.fitBounds(this.bounds);
	google.maps.event.removeListener(dieses.zoomstatus.zcev);
	dieses.zoomstatus.iszoomed = false;	
	var tlev = google.maps.event.addListener(this.map, "tilesloaded", function() { // für Scalierung nach MAP-Resize
		dieses.mapcenter = dieses.map.getCenter();
		dieses.zoomstatus.level = dieses.map.getZoom();
		dieses.zoomstatus.w = dieses.mapcanvas.offsetWidth;
		dieses.zoomstatus.h = dieses.mapcanvas.offsetHeight;
		google.maps.event.removeListener(tlev);
		dieses.zoomstatus.zcev = google.maps.event.addListener(dieses.map, "zoom_changed", dieses.zoomstatus.zoom_changed);
	});
} // rescale

JB.Map.prototype.gminfowindow = function(infotext,coord) {
	var infowindow = new google.maps.InfoWindow({ });
	//infowindow.setOptions({maxWidth:Math.round(this.mapcanvas.offsetWidth)*0.7});
	infowindow.setContent(infotext);
	infowindow.setPosition(new google.maps.LatLng(coord.lat,coord.lon));
	infowindow.open(this.map);
}

JB.Map.prototype.simpleLine = function(slat,slon,elat,elon) {
	var options = {
		path: [new google.maps.LatLng(slat,slon),new google.maps.LatLng(elat,elon)],
		strokeColor: "#000",
		strokeOpacity: 1,
		strokeWeight: 1
	}
	var line = new google.maps.Polyline(options);
	line.setMap(this.map);
	return line;
} // simpleLine

JB.Map.prototype.Polyline = function(daten,controls,route_oder_track,cols) {
	var dieses = this;
	var coords = daten.daten;
	var npt = coords.length, latlng = [], infofenster, line=[];
	var cbtype;
	if(route_oder_track == "Track") cbtype = "click_Track";
	else if(route_oder_track == "Route") cbtype = "click_Route";
	else cbtype = "?";
	var infotext = daten.info;
	for(var i=0;i<npt;i++) latlng.push(new google.maps.LatLng(coords[i].lat,coords[i].lon));
	var options = {
		strokeOpacity: controls.opac,
		strokeWeight: controls.width
	}
	var line_i;
	if(cols && cols.length) {
		for(var i=0;i<npt-1;i++) {
			options.strokeColor = cols[i];
			options.path = [new google.maps.LatLng(coords[i].lat,coords[i].lon),new google.maps.LatLng(coords[i+1].lat,coords[i+1].lon)];
			line_i = new google.maps.Polyline(options);
			line_i.setMap(this.map);
			line.push(line_i);
		}
	}
	else {
		options.path = latlng;
		if(JB.GPX2GM.Farben && JB.GPX2GM.Farben[daten.name]) options.strokeColor = JB.GPX2GM.Farben[daten.name];
		else options.strokeColor = controls.col;
		line[0] = new google.maps.Polyline(options);
		line[0].setMap(this.map);
	}
	if( (JB.gc.arrowtrack && route_oder_track == "Track") || (JB.gc.arrowroute && route_oder_track == "Route") ) {
		var range = Math.min(10,Math.ceil(npt/100)),lat,lon,ct,latlng_s=[];
		latlng_s.push(new google.maps.LatLng(coords[0].lat,coords[0].lon));
		for(var i=1;i<npt-1;i++) { 
			lat = lon = ct = 0;
			for(var j=Math.max(0,i-range);j<Math.min(npt,i+range);j++) { 
				lat += coords[j].lat;
				lon += coords[j].lon;
				ct ++;
			}
			latlng_s.push(new google.maps.LatLng(lat/ct,lon/ct));
		}
		latlng_s.push(new google.maps.LatLng(coords[npt-1].lat,coords[npt-1].lon));
		var lineSymbol = {
			path: google.maps.SymbolPath.FORWARD_OPEN_ARROW,
			scale: 3,
			strokeColor: controls.col,
			strokeOpacity: controls.opac
		};
		options.icons = [{
			icon: lineSymbol,
			offset: '100px', // '5%',
			repeat: '200px' //'10%'
		}];
		options.path = latlng_s;
		options.strokeColor = "black";
		options.strokeOpacity = 0.01;
		line_i = new google.maps.Polyline(options);
		line_i.setMap(this.map);
		line.push(line_i);
	} // if arrowtrack
	var eventline = line.length;
	options.path = latlng;
	options.icons = null;
	options.strokeColor = "black"; //controls.col;
	options.strokeOpacity = 0.01;
	options.strokeWeight = controls.width*5;
	options.zIndex = 10;
	line[eventline] = new google.maps.Polyline(options);
	line[eventline].setMap(this.map);
	var mapcenter,clk_ev;
	if(JB.gc.trackclick) {
		var infowindow = new google.maps.InfoWindow({ });
		google.maps.event.addListener(infowindow,"closeclick", function() { dieses.map.panTo(mapcenter); google.maps.event.removeListener(clk_ev) });
		google.maps.event.addListener(line[eventline], 'click', function(o) {
			var retval = true;
			if(typeof(JB.GPX2GM.callback)=="function") 
				retval = JB.GPX2GM.callback({type:cbtype,infotext:infotext,id:dieses.id,name:daten.name});
			if(retval) {
				if(daten.link) {
					if(daten.link.search("~")==0) window.location.href = daten.link.substr(1);
					else window.open(daten.link,"",JB.gc.popup_Pars);
				}
				else {
					mapcenter = dieses.map.getCenter();
					clk_ev = google.maps.event.addListener(dieses.map,'click',function() { infowindow.close(); dieses.map.panTo(mapcenter); google.maps.event.removeListener(clk_ev) });
					infowindow.setOptions({maxWidth:Math.round(dieses.mapcanvas.offsetWidth)*0.7});
					if(route_oder_track == "Track") infotext = daten.info;
					infowindow.setContent(infotext);
					infowindow.setPosition(o.latLng);
					infowindow.open(dieses.map);
				}
			}
		}); // click-Handler
	} // trackclick
	if(JB.gc.trackover) {
		var oline;
		infofenster = JB.Infofenster(this.map);
		google.maps.event.addListener(line[eventline], 'mouseover', function(o) {
			options.strokeColor = controls.ocol;
			options.strokeOpacity = 1.0;
			options.strokeWeight = controls.owidth;
			options.zIndex = 2;
			oline = new google.maps.Polyline(options);
			oline.setMap(this.map);
			if(route_oder_track == "Track") infotext = daten.info;
			infofenster.content(infotext);
			infofenster.show();
		});
		google.maps.event.addListener(line[eventline], 'mouseout', function(o) {
			oline.setMap(null);
			infofenster.hide();
		});
	} // trackover
	return line;
} // Polyline
  
JB.Map.prototype.setMarker = function(option,options,icon) {
	var marker = [];
	if (icon) {
		if (icon.icon) {
			option.icon = icon.icon; 
			if( icon.icon.url.length-icon.icon.url.lastIndexOf(".svg") == 4) option.optimized = false;
		}
	}
	marker.push(new google.maps.Marker(option));
	if(JB.gc.shwpshadow) {
		if (icon) {
			if (icon.shadow) {
				options.icon = icon.shadow;
				marker.push(new google.maps.Marker(options));
			}
		}
		else {
			options.icon = JB.icons.DefShadow.shadow;
			marker.push(new google.maps.Marker(options));
		}
	}
	return marker;
} // setMarker

JB.Map.prototype.Marker = function(coord,icon) { 
	var options = { position: new google.maps.LatLng(coord.lat,coord.lon), map: this.map, clickable: false, zIndex: 190 };
	var option  = { position: new google.maps.LatLng(coord.lat,coord.lon), map: this.map, clickable: false, zIndex: 200 };
	return this.setMarker(option,options,icon);
} // Marker

JB.Map.prototype.Marker_Link = function(coord,icon,titel,url,popup_Pars) { 
	var option  = { position: new google.maps.LatLng(coord.lat,coord.lon), map: this.map, title: titel, zIndex: 200 };
	var options = { position: new google.maps.LatLng(coord.lat,coord.lon), map: this.map, clickable: false, zIndex: 190 };
	var marker = this.setMarker(option,options,icon);
	google.maps.event.addListener(marker[0], 'click', function() {
		if(url.search("~")==0) window.location.href = url.substr(1);
		else window.open(url,"",popup_Pars);
	});
	return marker;
} // Marker_Link

JB.Map.prototype.Marker_Text = function(coord,icon,titel,closefkt) {
	var dieses = this;
	var mapcenter,clk_ev;
	var option  = { position: new google.maps.LatLng(coord.lat,coord.lon), map: this.map, title: titel, zIndex: 200 };
	var options = { position: new google.maps.LatLng(coord.lat,coord.lon), map: this.map, clickable: false, zIndex: 190 };
	var marker = this.setMarker(option,options,icon);
	var infowindow = new google.maps.InfoWindow({  } );
	if(closefkt) infowindow.closefkt = closefkt;
	google.maps.event.addListener(infowindow,"closeclick", function() { 
		dieses.map.panTo(mapcenter); 
		google.maps.event.removeListener(clk_ev); 
		if(closefkt) closefkt();
	});
	google.maps.event.addListener(marker[0], 'click', function() {
		mapcenter = dieses.map.getCenter();
		clk_ev = google.maps.event.addListener(dieses.map,'click',function() { 
			infowindow.close(); 
			dieses.map.panTo(mapcenter); 
			google.maps.event.removeListener(clk_ev) 
			if(closefkt) closefkt();
		});
		var retval = true;
		var text = coord.info;
		if(typeof(JB.GPX2GM.callback)=="function") 
			retval = JB.GPX2GM.callback({type:"click_Marker_Text",coord:coord,titel:titel,text:text,id:dieses.id});
		if(retval) {
			infowindow.setOptions({maxWidth:Math.round(dieses.mapcanvas.offsetWidth*0.7)});
			infowindow.setContent("<div class='JBinfofenster_gm'>"+text+"</div>");
			infowindow.open(dieses.map,marker[0]);			
		}
	});
	return marker;
} // Marker_Text

JB.Map.prototype.Marker_Bild = function(coord,icon,bild) {
	var dieses = this;
	var mapcenter,clk_ev;
	var option  = { position: new google.maps.LatLng(coord.lat,coord.lon), map: this.map, zIndex: 200 };
	var options = { position: new google.maps.LatLng(coord.lat,coord.lon), map: this.map, clickable: false, zIndex: 190 };
	var marker = this.setMarker(option,options,icon);
	var infowindow = new google.maps.InfoWindow({  });
	google.maps.event.addListener(infowindow,"closeclick", function() { dieses.map.panTo(mapcenter); google.maps.event.removeListener(clk_ev) });
	google.maps.event.addListener(marker[0], 'click', function() {
		var text = coord.info;
		var retval = true;
		if(typeof(JB.GPX2GM.callback)=="function") 
			retval = JB.GPX2GM.callback({type:"click_Marker_Bild",coord:coord,src:bild,text:text,id:dieses.id});
		if(retval) {
			mapcenter = dieses.map.getCenter();
			var img = new Image();
			clk_ev = google.maps.event.addListener(dieses.map,'click',function() { 
				infowindow.close(); 
				dieses.map.panTo(mapcenter); 
				google.maps.event.removeListener(clk_ev) 
			});
			img.onload = function() { 
				var w = img.width, h = img.height;
				var mapdiv = dieses.map.getDiv();
				var mw = mapdiv.offsetWidth-200, mh = mapdiv.offsetHeight-200;
				if(mw<50 || mh<50) return;
				if(w>mw) { h = Math.round(h*mw/w); w = mw; }; 
				if(h>mh) { w = Math.round(w*mh/h); h = mh; }
				var container = document.createElement("div");
				container.style.padding = "10px";
				container.style.maxWidth = (w) + "px";
				container.style.maxHeight = (mh+50) + "px";
				container.style.backgroundColor = "white";
				container.style.overflow = "auto";
				container.innerHTML = "<img src='"+bild+"' width="+w+" height="+h+"><br>"+text;
				infowindow.setContent(container);
				infowindow.open(dieses.map,marker[0]);
				if(container.clientHeight<container.scrollHeight) container.style.maxWidth = (w+20) + "px";
			}
      img.onerror = function() {
        JB.Debug_Info(this.src,"konnte nicht geladen werden!",false);
      }
			img.src = bild;
		}
	});
	google.maps.event.addListener(marker[0], 'mouseover', function() {
		var img = new Image();
		img.onload = function() { 
			var w = img.width, h = img.height, mw, mh;
			if(w>h) { mw = JB.gc.groesseminibild; mh = Math.round(h*mw/w); }
			else    { mh = JB.gc.groesseminibild; mw = Math.round(w*mh/h); }
			var minibild = new google.maps.Marker({
				position: new google.maps.LatLng(coord.lat,coord.lon), 
				map: dieses.map,
				zIndex: 200,
				icon: { 
					url: bild,
					anchor: {x:23,y:0},
					scaledSize: {width:mw,height:mh}
				}
			});
			var ev_mouseout1 = google.maps.event.addListener(marker[0], 'mouseout', function() { 
				google.maps.event.removeListener(ev_mouseout1);
				google.maps.event.removeListener(ev_mouseout2);
				minibild.setMap(null); 
			});
		}
    img.onerror = function() {
      JB.Debug_Info(this.src,"konnte nicht geladen werden!",false);
    }
		var ev_mouseout2 = google.maps.event.addListener(marker[0], 'mouseout', function() { 
			google.maps.event.removeListener(ev_mouseout2);
			img.onload = null; 
		});
		img.src = bild;
	});
	return marker;
} // Marker_Bild 
 
JB.Map.prototype.Marker_Cluster = function(cluster,wpts,strings) { 
	var dieses = this;
	var marker,latmin,latmax,lonmin,lonmax,title;
	var zbb;
	var option = { position: new google.maps.LatLng(cluster.lat,cluster.lon), map: this.map, zIndex: 200 };
	option.icon = JB.icons.Cluster.icon; 
	option.title = cluster.members.length+" "+strings.wpts+":"; // " Wegpunkte:";
	option.label = { text: cluster.members.length+"", fontWeight: "bold" };
	for(var i=0;i<cluster.members.length;i++) {
		title = wpts[cluster.members[i]].name;
		if (title.indexOf("data:image")!=-1) title = strings.pwpt; // "Bildwegpunkt";
		else if (JB.checkImageName(title)) title = title.substring(title.lastIndexOf("/")+1,title.lastIndexOf("."));
//		option.title += "\n- " + (JB.checkImageName(wpts[cluster.members[i]].name)?"Bildwegpunkt":wpts[cluster.members[i]].name);
		option.title += "\n- " + title;
	}
	option.title += "\n"+strings.clkz; // "\nZum Zoomen klicken";
	marker = new google.maps.Marker(option);
	google.maps.event.addListener(marker, 'click', function() {
		if(dieses.cluster_zoomhistory.length==0) {
			var zbbe = document.createElement("button");
			zbbe.innerHTML = "&#x21b5";
			zbbe.style.color = "#444";
			zbbe.style.backgroundColor = "white";
			zbbe.style.fontWeight ="bold";
			zbbe.style.fontSize = "14px";
			zbbe.style.margin = "10px 10px 0 0";
			zbbe.style.display = "inline-block";
			zbbe.style.width = "28px";
			zbbe.style.height = "28px";
			zbbe.style.border = "none";
			zbbe.style.borderRadius = "2px";
			zbbe.title = strings.zb; // "Zurück zoomen";
			zbb = dieses.map.controls[google.maps.ControlPosition.RIGHT_BOTTOM].push(zbbe);
			zbbe.onclick = function() {
				this.blur();
				var zc = dieses.cluster_zoomhistory.pop();
				dieses.map.setZoom(zc.z);
				dieses.map.setCenter(zc.c);
				if(dieses.cluster_zoomhistory.length==0) dieses.map.controls[google.maps.ControlPosition.RIGHT_BOTTOM].removeAt(zbb-1);			
			};
		}
		dieses.cluster_zoomhistory.push({z:dieses.map.getZoom(),c:dieses.map.getCenter()});
		latmin = lonmin = 1000;
		latmax = lonmax = -1000;
		for(var i=0;i<cluster.members.length;i++) {
			var wp = wpts[cluster.members[i]];
			if(wp.lat<latmin) latmin = wp.lat;
			if(wp.lon<lonmin) lonmin = wp.lon;
			if(wp.lat>latmax) latmax = wp.lat;
			if(wp.lon>lonmax) lonmax = wp.lon;
		}
		dieses.rescale({latmin:latmin,lonmin:lonmin,latmax:latmax,lonmax:lonmax});
	});
	return [marker];
} // Marker_Cluster

JB.RemoveElement = function(element) {
	element.setMap(null);
} // JB.RemoveElement    
 
JB.MoveMarker = (function() {
	var MoveMarker_O = function() {
		var marker, infofenster, Map;
		this.init = function(mp,icon) {
			if(mp) {
				Map = mp;
				marker = Map.Marker({lat:0,lon:0},icon)[0]; 
				infofenster = JB.Infofenster(Map.map);
				infofenster.show();
			}
		}
		this.pos = function(coord,infotext,maxzoomemove) { 
			if(Map) {
				marker.setPosition(new google.maps.LatLng(coord.lat,coord.lon));
				infofenster.content(infotext);
				if(Map.map.getZoom() >= maxzoomemove) Map.map.setCenter(new google.maps.LatLng(coord.lat,coord.lon));
				else infofenster.pos(coord);  
			}      
		}
		this.remove = function() { 
			if(Map) {
				marker.setMap(null); 
				infofenster.remove();
			}
		}
	} // MoveMarker_O
	return new MoveMarker_O();
})(); // JB.MoveMarker

JB.Infofenster = function(map) {
	var Infofenster_O = function() {
		var div = document.createElement("div");
		JB.addClass("JBinfofenster",div);
		this.div_ = div;
		this.cnr = map.controls[google.maps.ControlPosition.TOP_LEFT].push(this.div_);
		this.map = map;
		this.setMap(map);
		this.set('visible', false);
	}
	Infofenster_O.prototype = new google.maps.OverlayView();
	Infofenster_O.prototype.draw = function() {}
	Infofenster_O.prototype.content = function(content) { 
		if(typeof(content)=="string") this.div_.innerHTML = content;
		else                          this.div_.appendChild(content);
	}
	Infofenster_O.prototype.hide = function() { this.set('visible', false); this.visible = false; }
	Infofenster_O.prototype.show = function() { this.set('visible', true); this.visible = true; }
	Infofenster_O.prototype.remove = function() { 
		this.map.controls[google.maps.ControlPosition.TOP_LEFT].removeAt(this.cnr-1);
		this.visible = false;
	}
	Infofenster_O.prototype.visible_changed = function() { 
		this.div_.style.display = this.get('visible') ? '' : 'none';
	}
	Infofenster_O.prototype.pos = function(coord) { 
		var projection = this.getProjection();
		if (projection) {
			var point = projection.fromLatLngToContainerPixel(new google.maps.LatLng(coord.lat,coord.lon));
			this.div_.style.left = Math.round(point.x) + 5 + "px";
			this.div_.style.top  = Math.round(point.y) - 15 - this.div_.offsetHeight + "px"; 
		} 
	} 
	return new Infofenster_O();
}// JB.Infofenster

// Ende gmutils.js

