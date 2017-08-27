// GPX2GM.js
// Darstellung von GPS-Daten aus einer GPX-Datei in Google Maps
// Version 5.19.1
// 29. 5. 2017 Jürgen Berkemeier
// www.j-berkemeier.de

"use strict";

window.JB = window.JB || {};
window.JB.GPX2GM = window.JB.GPX2GM || {};
JB.GPX2GM.ver = "5.19.1";
JB.GPX2GM.dat = "29. 5. 2017";
JB.GPX2GM.fname = "GPX2GM.js";

if(typeof(GPXVIEW_Debuginfo)=="undefined") 
	JB.debuginfo = (location.search.toLowerCase().search("debuginfo")!=-1) 
							&& (location.search.toLowerCase().search("debuginfo=false")==-1) ;    
else
	JB.debuginfo = GPXVIEW_Debuginfo;
if(JB.debuginfo) JB.gpxview_Start = (new Date()).getTime();

(function() {
	JB.GPX2GM.Path = "";
	JB.GPX2GM.autoload = false;
	var scr = document.getElementsByTagName("script");
	for(var i=scr.length-1;i>=0;i--) if(scr[i].src && scr[i].src.length) {
		var path = scr[i].src;
		var pos = path.search(JB.GPX2GM.fname);
		if(pos!=-1) {
			JB.GPX2GM.autoload = !(path.search("autoload=false")>pos);
			JB.GPX2GM.Path = path.substring(0,pos);
			break;
		}
	}
})();

window.requestAnimationFrame = window.requestAnimationFrame || function(callback) { window.setTimeout(callback,1) };

JB.Scripte = { GPX2GM_Defs:0, googlemaps:0, gra:0, plot:0, gmutils:0 };

JB.setgc = function() {  
	JB.gc = {};
	JB.gc.doclang = (typeof(Doclang)!="undefined") ? Doclang : "auto"; // de oder en
	JB.gc.unit = (typeof(Unit)!="undefined") ? Unit : "si"; // enus oder air oder water = airwater
	JB.gc.largemapcontrol = (typeof(Largemapcontrol)!="undefined") ? Largemapcontrol : false;
	JB.gc.overviewmapcontrol = (typeof(Overviewmapcontrol)!="undefined") ? Overviewmapcontrol : false;
	JB.gc.showmaptypecontroll = (typeof(Showmaptypecontroll)!="undefined") ? Showmaptypecontroll : true;
	JB.gc.scrollwheelzoom = (typeof(Scrollwheelzoom)!="undefined") ? Scrollwheelzoom : true;
	JB.gc.fullscreenbutton = (typeof(Fullscreenbutton)!="undefined") ? Fullscreenbutton : false;
	JB.gc.trafficbutton = (typeof(Trafficbutton)!="undefined") ? Trafficbutton : false;
	JB.gc.trafficonload = (typeof(Trafficonload)!="undefined") ? Trafficonload : true;
	JB.gc.legende = (typeof(Legende)!="undefined") ? Legende : true;
	JB.gc.legende_fnm = (typeof(Legende_fnm)!="undefined") ? Legende_fnm  : true;
	JB.gc.legende_rr = (typeof(Legende_rr)!="undefined") ? Legende_rr  : true;
	JB.gc.legende_trk = (typeof(Legende_trk)!="undefined") ? Legende_trk : true;
	JB.gc.legende_rte = (typeof(Legende_rte)!="undefined") ? Legende_rte : true;
	JB.gc.legende_wpt = (typeof(Legende_wpt)!="undefined") ? Legende_wpt : true;
	JB.gc.gpxtracks = (typeof(Gpxtracks)!="undefined") ? Gpxtracks : true;
	JB.gc.gpxrouten = (typeof(Gpxrouten)!="undefined") ? Gpxrouten : true;
	JB.gc.gpxwegpunkte = (typeof(Gpxwegpunkte)!="undefined") ? Gpxwegpunkte : true;
	JB.gc.tracks_verbinden = (typeof(Tracks_verbinden)!="undefined") ? Tracks_verbinden : false;    
	JB.gc.tracks_dateiuebergreifend_verbinden = (typeof(Tracks_dateiuebergreifend_verbinden)!="undefined") ? Tracks_dateiuebergreifend_verbinden : false;
	if(JB.gc.tracks_dateiuebergreifend_verbinden) JB.gc.tracks_verbinden = true;
	JB.gc.dateitrenner = (typeof(Dateitrenner)!="undefined") ? Dateitrenner : ",";
	JB.gc.readspeed = (typeof(Readspeed)!="undefined") ? Readspeed : true;
	JB.gc.speedfaktor = (typeof(Speedfaktor)!="undefined") ? Speedfaktor : 1; // 3.6 bei m/s, 1,609344 bei mph
	JB.gc.hfaktor = (typeof(Hfaktor)!="undefined") ? Hfaktor : 1;
	JB.gc.sfaktor = (typeof(Sfaktor)!="undefined") ? Sfaktor : 1;
	JB.gc.vfaktor = (typeof(Vfaktor)!="undefined") ? Vfaktor : 1;
	JB.gc.wfaktor = (typeof(Wfaktor)!="undefined") ? Wfaktor : 1;
	JB.gc.trackover = (typeof(Trackover)!="undefined") ? Trackover : true;
	JB.gc.trackclick = (typeof(Trackclick)!="undefined") ? Trackclick : true;
	JB.gc.shwpname = (typeof(Shwpname)!="undefined") ? Shwpname : true;
	JB.gc.shwpcmt = (typeof(Shwpcmt)!="undefined") ? Shwpcmt : true;
	JB.gc.shwpdesc = (typeof(Shwpdesc)!="undefined") ? Shwpdesc : false;
	JB.gc.shwptime = (typeof(Shwptime)!="undefined") ? Shwptime : false;
	JB.gc.shwpshadow = (typeof(Shwpshadow)!="undefined") ? Shwpshadow : true;
	JB.gc.wpcluster = (typeof(Wpcluster)!="undefined") ? Wpcluster : false;
	JB.gc.bildpfad = (typeof(Bildpfad)!="undefined") ? Bildpfad : "";
	JB.gc.gpxpfad = (typeof(Gpxpfad)!="undefined") ? Gpxpfad : ""; 
	JB.gc.bildwegpunkticon = (typeof(Bildwegpunkticon)!="undefined") ? Bildwegpunkticon : "Bild"; // Bei "" Icon aus sym-Tag
	JB.gc.shtrcmt = (typeof(Shtrcmt)!="undefined") ? Shtrcmt : false;
	JB.gc.shtrdesc = (typeof(Shtrdesc)!="undefined") ? Shtrdesc : false;
	JB.gc.shtrx = (typeof(Shtrx)!="undefined") ? Shtrx : true;
	JB.gc.shtrt = (typeof(Shtrt)!="undefined") ? Shtrt : true;
	JB.gc.shtrtwob = (typeof(Shtrtwob)!="undefined") ? Shtrtwob : false;
	JB.gc.shtrtabs = (typeof(Shtrtabs)!="undefined") ? Shtrtabs : false;
	JB.gc.shtrtges = (typeof(Shtrtges)!="undefined") ? Shtrtges : false;
	JB.gc.shtrtgeswob = (typeof(Shtrtgeswob)!="undefined") ? Shtrtgeswob : false;
	JB.gc.shtrv = (typeof(Shtrv)!="undefined") ? Shtrv : true;
	JB.gc.shtrh = (typeof(Shtrh)!="undefined") ? Shtrh : true;
	JB.gc.shtrs = (typeof(Shtrs)!="undefined") ? Shtrs : true;
	JB.gc.shtrhr = (typeof(Shtrhr)!="undefined") ? Shtrhr : true;
	JB.gc.shtrcad = (typeof(Shtrcad)!="undefined") ? Shtrcad : true;
	JB.gc.shtrvmitt = (typeof(Shtrvmitt)!="undefined") ? Shtrvmitt : false;
	JB.gc.shtrvmittwob = (typeof(Shtrvmittwob)!="undefined") ? Shtrvmittwob : false;
	JB.gc.shtrvmittpace = (typeof(Shtrvmittpace)!="undefined") ? Shtrvmittpace : false;
	JB.gc.shtrvmittpacewob = (typeof(Shtrvmittpacewob)!="undefined") ? Shtrvmittpacewob : false;
	JB.gc.arrowtrack = (typeof(Arrowtrack)!="undefined") ? Arrowtrack : false;
	JB.gc.shrtcmt = (typeof(Shrtcmt)!="undefined") ? Shrtcmt : false;
	JB.gc.shrtdesc = (typeof(Shrtdesc)!="undefined") ? Shrtdesc : false;
	JB.gc.shtrstart = (typeof(Shtrstart)!="undefined") ? Shtrstart : false;
	JB.gc.shtrziel = (typeof(Shtrziel)!="undefined") ? Shtrziel : false;
	JB.gc.shrtstart = (typeof(Shrtstart)!="undefined") ? Shrtstart : false;
	JB.gc.shrtziel = (typeof(Shrtziel)!="undefined") ? Shrtziel : false;
	JB.gc.arrowroute = (typeof(Arrowroute)!="undefined") ? Arrowroute : false
	JB.gc.groesseminibild	= (typeof(Groesseminibild)!="undefined") ? Groesseminibild : 60; // in Pixel, max. 149
	JB.gc.displaycolor = (typeof(Displaycolor)!="undefined") ? Displaycolor : false;
	JB.gc.laengen3d = (typeof(Laengen3d)!="undefined") ? Laengen3d : false;
	JB.gc.usegpxbounds = (typeof(Usegpxbounds)!="undefined") ? Usegpxbounds : false;
	JB.gc.hglattlaen = (typeof(Hglattlaen)!="undefined") ? Hglattlaen : 500; // in Meter
	JB.gc.vglattlaen = (typeof(Vglattlaen)!="undefined") ? Vglattlaen : 100; // in Meter
	JB.gc.vglatt = (typeof(Vglatt)!="undefined") ? Vglatt : false;
	JB.gc.hglatt = (typeof(Hglatt)!="undefined") ? Hglatt : false;
	JB.gc.tdiff = (typeof(Tdiff)!="undefined") ? Tdiff : 0; // in Stunden
	JB.gc.tkorr = (typeof(Tkorr)!="undefined") ? Tkorr : true;
	JB.gc.maxzoomemove = (typeof(Maxzoomemove)!="undefined") ? Maxzoomemove : 30; // 1 ... , 30: aus
	JB.gc.plotframecol = (typeof(Plotframecol)!="undefined") ? Plotframecol : "black";
	JB.gc.plotgridcol = (typeof(Plotgridcol)!="undefined") ? Plotgridcol : "gray";
	JB.gc.plotlabelcol = (typeof(Plotlabelcol)!="undefined") ? Plotlabelcol : "black";
	JB.gc.plotmarkercol = (typeof(Plotmarkercol)!="undefined") ? Plotmarkercol : "black";
	JB.gc.profilfillopac = (typeof(Profilfillopac)!="undefined") ? Profilfillopac : 0; //   0 ... 1, 0:aus
	JB.gc.trcolmod = (typeof(Trcolmod)!="undefined") ? Trcolmod : ""; // h s v hr cad
	JB.gc.tcols = ["#ff0000","#00ff00","#0000ff","#eeee00","#ff00ff","#00ffff","#000000"]; // Trackfarben in #rrggbb für rot grün blau
	JB.gc.rcols = ["#800000","#008000","#000080","#808000","#800080","#008080","#808080"]; // Routenfarben
	JB.gc.ocol = "#000000";   // Track- und Routenfarbe bei Mouseover
	JB.gc.owidth = (typeof(Owidth)!="undefined") ? Owidth : 3.0;  // Linienstärke Track und Route bei Mouseover
	JB.gc.twidth = (typeof(Twidth)!="undefined") ? Twidth : 2.0;  // Linienstärke Track
	JB.gc.rwidth = (typeof(Rwidth)!="undefined") ? Rwidth : 2.0;  // Linienstärke Route
	JB.gc.topac = (typeof(Topac)!="undefined") ? Topac : 0.8;   // Transparenz Trackfarbe
	JB.gc.ropac = (typeof(Ropac)!="undefined") ? Ropac : 0.8;   // Transparenz Routenfarbe
	JB.gc.popup_Pars = "width=900,height=790,screenX=970,screenY=0,status=yes,scrollbars=yes";

	if(JB.debuginfo) {
		var t = "";
		for(var o in JB.gc) t += "<br>&nbsp;&nbsp;" + o + ": " + JB.gc[o];
		JB.Debug_Info("Start","Steuervariablen: "+t+"<br>",false);
	}
}

JB.makeMap = function (ID) {

	JB.Debug_Info(ID,"",false);

	var hscale=[],sscale=[],vscale=[],hrscale=[],cadscale=[];
	if(typeof(JB.Scaling)!="undefined") {
		if(typeof(JB.Scaling.hmin)!="undefined" && typeof(JB.Scaling.hmax)!="undefined") 
			hscale = [{x:.0001,h:JB.Scaling.hmin} ,{x:.0002,h:JB.Scaling.hmax}] ;
		if(typeof(JB.Scaling.smin)!="undefined" && typeof(JB.Scaling.smax)!="undefined") 
			sscale = [{x:.0001,s:JB.Scaling.smin} ,{x:.0002,s:JB.Scaling.smax}] ;
		if(typeof(JB.Scaling.vmin)!="undefined" && typeof(JB.Scaling.vmax)!="undefined") 
			vscale = [{x:.0001,v:JB.Scaling.vmin} ,{x:.0002,v:JB.Scaling.vmax}] ;
		if(typeof(JB.Scaling.hrmin)!="undefined" && typeof(JB.Scaling.hrmax)!="undefined") 
			hrscale = [{x:.0001,hr:JB.Scaling.hrmin} ,{x:.0002,hr:JB.Scaling.hrmax}] ;
		if(typeof(JB.Scaling.cadmin)!="undefined" && typeof(JB.Scaling.cadmax)!="undefined") 
			cadscale = [{x:.0001,cad:JB.Scaling.cadmin} ,{x:.0002,cad:JB.Scaling.cadmax}] ;
	}
	
	var doc_lang = JB.gc.doclang.toLowerCase();
	if(doc_lang == "auto" && document.documentElement.hasAttribute("lang")) doc_lang = document.documentElement.getAttribute("lang");
	if(doc_lang in JB.GPX2GM.strings) JB.gc.doclang = doc_lang;
	else                              JB.gc.doclang = doc_lang = "de";
	var strings = JB.GPX2GM.strings[doc_lang];
	if(JB.gc.unit == "airwater" || JB.gc.unit == "air" || JB.gc.unit == "water") {
		var units = JB.GPX2GM.units[JB.gc.unit];
		if(typeof(Wfaktor)=="undefined") JB.gc.wfaktor = 1/1.852;
		if(typeof(Hfaktor)=="undefined") JB.gc.hfaktor = 1/0.3048;
		if(typeof(Sfaktor)=="undefined") JB.gc.sfaktor = 0.3048 / 1.852;
	}
	else if(JB.gc.unit == "enus") {
		var units = JB.GPX2GM.units.enus;
		if(typeof(Wfaktor)=="undefined") JB.gc.wfaktor = 1/1.609344;
		if(typeof(Hfaktor)=="undefined") JB.gc.hfaktor = 1/0.3048;
		if(typeof(Sfaktor)=="undefined") JB.gc.sfaktor = 0.3048 / 1.609344;
	}
	else 
		var units = JB.GPX2GM.units.si;
	JB.Debug_Info(ID,"Sprache: "+doc_lang+" Einheiten: "+JB.gc.unit,false);

	var dieses = this;
	var gpxdaten;
	var id = ID;
	var markers=[],trackpolylines=[],routepolylines=[];
	var file,maptype;
	var Map;
	var newfile;

	if(typeof(JB.GPX2GM.callback)=="function") 
		JB.GPX2GM.callback({id:id,type:"Map_div_v"});
	var div = document.getElementById(id);
	JB.addClass("JBmapdiv",div);
	var MapHead = document.createElement("div");
	MapHead.id = "map_head"+id;
	JB.addClass("JBmaphead",MapHead);
	MapHead.appendChild(document.createTextNode(": "));
	var mapdiv = document.createElement("div");
	mapdiv.id = "map_"+id;
	while(div.hasChildNodes()) div.removeChild(div.firstChild);
	if(!JB.gc.legende) MapHead.style.display="none";
	var odiv = document.createElement("div");
	odiv.style.width = odiv.style.height = "100%";
	odiv.appendChild(MapHead);
	odiv.appendChild(mapdiv);
	div.appendChild(odiv);
	if (JB.gc.legende) JB.addClass("JBmapdiv_map_mit_legende",mapdiv);
	else               JB.addClass("JBmapdiv_map",mapdiv);   
	if (JB.gc.trcolmod.length) {
		try { mapdiv.style.width = "calc(100% - 90px)"; } catch(e) {}
		odiv.style.position = "relative";
		var FB;
		var fb_onresize;
	}
	if(typeof(JB.GPX2GM.callback)=="function") 
		JB.GPX2GM.callback({id:id,type:"Map_div_n"});
	JB.Debug_Info(ID,"Mapdiv angelegt "+mapdiv.offsetWidth+"*"+mapdiv.offsetHeight,false);

	JB.gc.profilflag = false;
	var profil = {
		hp:{x:"x",y:"h"},hpt:{x:"t",y:"h"},
		wp:{x:"t",y:"x"},
		sp:{x:"x",y:"s"},spt:{x:"t",y:"s"},
		vp:{x:"x",y:"v"},vpt:{x:"t",y:"v"},
		hrp:{x:"x",y:"hr"},hrpt:{x:"t",y:"hr"},
		cadp:{x:"x",y:"cad"},cadpt:{x:"t",y:"cad"}
	};
	profil.hpt.ytext = profil.hp.ytext = strings.alt+" in "+units.alt;
	profil.spt.ytext = profil.sp.ytext = strings.grade+" in "+strings.grade_unit;
	profil.vpt.ytext = profil.vp.ytext = strings.speed+" in "+units.speed;
	profil.hrpt.ytext = profil.hrp.ytext = strings.hr+" in "+strings.hr_unit;
	profil.cadpt.ytext = profil.cadp.ytext = strings.cad+" in "+strings.cad_unit;
	profil.wp.ytext = strings.way+" in "+units.way;
	profil.hp.xtext = profil.vp.xtext = profil.sp.xtext = profil.hrp.xtext = profil.cadp.xtext = strings.way+" in "+units.way;
	profil.hpt.xtext = profil.vpt.xtext = profil.spt.xtext = profil.hrpt.xtext = profil.cadpt.xtext = profil.wp.xtext = strings.time+" in "+strings.time_unit; 
	profil.hpt.scale = profil.hp.scale = hscale;
	profil.spt.scale = profil.sp.scale = sscale;
	profil.vpt.scale = profil.vp.scale = vscale;
	profil.hrpt.scale = profil.hrp.scale = hrscale;
	profil.cadpt.scale = profil.cadp.scale = cadscale;
	profil.setflags = function(tr,ct) {
		if(ct==-1) {
			profil.hp.pflag = profil.sp.pflag = tr.hflag;
			profil.hpt.pflag = profil.spt.pflag = tr.hflag && tr.tflag;
			profil.vpt.pflag = profil.vp.pflag = tr.tflag;
			profil.hrpt.pflag = profil.hrp.pflag = tr.hrflag;
			profil.hrpt.pflag &= tr.tflag;
			profil.cadpt.pflag = profil.cadp.pflag = tr.cadflag;
			profil.cadpt.pflag &= tr.tflag;
			profil.wp.pflag = tr.tflag;
		}
		else {
			profil.hp.pflag = profil.sp.pflag = ct==1?tr.hflag:tr.hflagall;
			profil.hpt.pflag = profil.spt.pflag = ct==1?tr.hflagall&&tr.tflag:tr.hflagall&&tr.tflagall;
			profil.vpt.pflag = profil.vp.pflag = ct==1?tr.tflag:tr.tflagall;
			profil.hrpt.pflag = profil.hrp.pflag = ct==1?tr.hrflag:tr.hrflagall;
			profil.hrpt.pflag &= ct==1?tr.tflag:tr.tflagall;
			profil.cadpt.pflag = profil.cadp.pflag = ct==1?tr.cadflag:tr.cadflagall;
			profil.cadpt.pflag &= ct==1?tr.tflag:tr.tflagall;
			profil.wp.pflag = ct==1?tr.tflag:tr.tflagall;
		}
	}

	for(var p in profil) {
		profil[p].id = ID+"_"+p;
		profil[p].ele = document.getElementById(profil[p].id);
		if(profil[p].ele) {
			JB.addClass("JBprofildiv",profil[p].ele);
			JB.gc.profilflag = true;
			JB.Debug_Info(id,"Profil, ID: "+profil[p].id+" gefunden",false);
		}
	}

	if(JB.gc.profilflag || JB.gc.trcolmod.length) { 
		if(JB.Scripte.gra==0) {
			JB.Scripte.gra = 1;
			JB.LoadScript(JB.GPX2GM.Path+'gra_canvas.js', function(){ JB.Scripte.gra = 2; });
			JB.Scripte.plot = 1;
			JB.LoadScript(JB.GPX2GM.Path+"plot.js", function(){ JB.Scripte.plot = 2; }); 
			JB.Debug_Info(ID,"Grafikscripte werden geladen",false);
		}
	}
	
	this.ShowGPX = function(fn,mpt) {
		var filenames = [];
		file = []; 
		for(var i=0;i<fn.length;i++) {
			if(typeof fn[i] === "string") file[i] = { name:JB.gc.gpxpfad+fn[i] , fileobject:null };
			else if(typeof fn[i] === "object") file[i] = { name:JB.gc.gpxpfad+fn[i].name , fileobject:fn[i] };
			filenames[i] = file[i].name;
		}
		maptype = mpt;
		JB.Debug_Info(id,"ShowGPX, Filename(s): "+filenames.join(","),false);

		var infodiv = document.createElement("div");
		JB.addClass("JBinfodiv",infodiv);
		infodiv.innerHTML = strings.wait.length > 0 ? strings.wait : "<br><img src='" + JB.GPX2GM.Path + "Icons/Loading_icon.gif'>";
		div.appendChild(infodiv);
		JB.Debug_Info(id,"Info da",false);
		JB.Debug_Info(id,"Lade "+filenames.join(","),false);
		JB.lpgpx(file,id,function(daten) {
			newfile = true;
			gpxdaten = daten;
			if(JB.gc.tkorr) getTimezone(gpxdaten);
			gpxdaten = pict2WP(gpxdaten);
			gpxdaten = div2WP(gpxdaten);
			gpxdaten = sort_tracks(gpxdaten);
			gpxdaten = wp_dist(gpxdaten);
			setMapHead();
			show();
			div.removeChild(infodiv);
			JB.Debug_Info(id,"Info weg",false);
		});
	} // ShowGPX

	this.Rescale = function() {
		var daten;
		if(arguments.length == 0) daten = gpxdaten;
		else if(arguments.length == 1) daten = arguments[0];
		else if(arguments.length == 3) daten = JB.bounds(arguments[0],arguments[1],arguments[2]); 
		//                             daten = JB.bounds(center_lat,  center_lon,  radius); 
		JB.Debug_Info(id,"Rescale: lat: "+daten.latmin+"..."+daten.latmax+", lon: "+daten.lonmin+"..."+daten.lonmax,false);
		Map.rescale(daten);
	} // Rescale

	this.GetMap = function() {
		return Map;
	} // GetMap

	this.Clear = function() {
	  var p,pr,i;
		if(mapidleevent) Map.removeEvent(mapidleevent);
		Map = null;
		for(p in profil) {
			pr = profil[p];                                                                  
			if(pr.diag) pr.diag.clear();                       
		}
		profil = null;	
		gpxdaten = null;
		for(i=0;i<markers.length;i++) JB.RemoveElement(markers[i]);
		markers = [];
		for(i=0;i<trackpolylines.length;i++) JB.RemoveElement(trackpolylines[i]);
		trackpolylines = [];
		for(i=0;i<routepolylines.length;i++) JB.RemoveElement(routepolylines[i]);
		routepolylines = [];

	} // Clear

	function wp_dist(daten) { 
		var wp = daten.wegpunkte.wegpunkt;
		var wpi,wpj;
		for(var i=0;i<wp.length;i++) {
			wpi = wp[i]; 
			wp[i].dist = [];
			for(var j=0;j<wp.length;j++) {
				wpj = wp[j];
				JB.entf.init(wpi.lat,wpi.lon,0.0);
				wp[i].dist[j] = [j,JB.entf.rechne(wpj.lat,wpj.lon,0.0)];
			}
			wp[i].dist.sort(function(a,b){return a[1]-b[1]}); 
			wp[i].cluster = -1;
		}
		daten.wegpunkte.wegpunkt = wp;
		return daten;
	} // wp_dist

	function sort_tracks(daten) {
		if(JB.gc.tracks_dateiuebergreifend_verbinden) {
			daten.tracks.track.sort(function(a,b){
				return(a.t0-b.t0);
			});
			var x0,t0;
			for(var k=1;k<daten.tracks.track.length;k++) {
				x0 = daten.tracks.track[k-1].daten[daten.tracks.track[k-1].daten.length-1].x;
				t0 = daten.tracks.track[k-1].daten[daten.tracks.track[k-1].daten.length-1].t;
				for(var i=0;i<daten.tracks.track[k].daten.length;i++) {
					daten.tracks.track[k].daten[i].x += x0;
					daten.tracks.track[k].daten[i].t += t0;
				}
			}
		}
		else if(JB.gc.tracks_verbinden) {
			daten.tracks.track.sort(function(a,b){
				if(a.fnr<b.fnr) return -1;
				else if(a.fnr>b.fnr) return 1;
				else return(a.t0-b.t0);
			});
			var x0,t0;
			for(var k=1;k<daten.tracks.track.length;k++) {
				if(daten.tracks.track[k-1].fnr == daten.tracks.track[k].fnr) {
					x0 = daten.tracks.track[k-1].daten[daten.tracks.track[k-1].daten.length-1].x;
					t0 = daten.tracks.track[k-1].daten[daten.tracks.track[k-1].daten.length-1].t;
					for(var i=0;i<daten.tracks.track[k].daten.length;i++) {
						daten.tracks.track[k].daten[i].x += x0;
						daten.tracks.track[k].daten[i].t += t0;
					}
				}
			}
		}
		return daten;
	} // sort_tracks
	
	function pict2WP(daten) {
		var pict = document.getElementById(ID+"_img");
		if(pict) {
			var im = pict.querySelectorAll("img, a");
			JB.Debug_Info(id,im.length +" Bilder zum Geotaggen gefunden",false);
			for(var i=0;i<im.length;i++) {
				var geodata = im[i].getAttribute("data-geo");
				if(geodata) {
					geodata = geodata.split(",");
					if(geodata.length==2) {
						var wp = {};
						for(var j=0;j<2;j++) {
							var par = geodata[j].split(":");
							if(par.length==2) {
								wp[par[0]] = parseFloat(par[1]);
							}
						}
						if(wp.lat && wp.lon) {
							if(!JB.gc.usegpxbounds) {
								if(wp.lat<daten.latmin) daten.latmin=wp.lat; if(wp.lat>daten.latmax) daten.latmax=wp.lat;
								if(wp.lon<daten.lonmin) daten.lonmin=wp.lon; if(wp.lon>daten.lonmax) daten.lonmax=wp.lon;
							}
							if(im[i].alt) wp.cmt = im[i].alt; 
							else if (im[i].innerHTML) wp.cmt = im[i].innerHTML;
							else wp.cmt = "";
							wp.desc = wp.cmt;
							wp.link ="";
							wp.sym = "default";
							wp.time = 0;
							if(im[i].src)	wp.name = im[i].src;
							else if(im[i].href) wp.name = im[i].href;
							else wp.name = "";
							daten.wegpunkte.wegpunkt.push(wp);
						}
					}
				}
			}
			daten.wegpunkte.anzahl = daten.wegpunkte.wegpunkt.length;
		}
		return daten;
	} // pict2WP

	function div2WP(daten) {
		var divs = document.getElementById(ID+"_wp");
		if(divs) {
			var dv = divs.querySelectorAll("div");
			JB.Debug_Info(id,dv.length +" Divs zum Geotaggen gefunden",false);
			for(var i=0;i<dv.length;i++) {
				var geodata = dv[i].getAttribute("data-geo");
				if(geodata) {
					geodata = geodata.split(",");
					if(geodata.length==2) {
						var wp = {};
						for(var j=0;j<2;j++) {
							var par = geodata[j].split(":");
							if(par.length==2) {
								wp[par[0]] = parseFloat(par[1]);
							}
						}
						if(wp.lat && wp.lon) {
							if(!JB.gc.usegpxbounds) {
								if(wp.lat<daten.latmin) daten.latmin=wp.lat; if(wp.lat>daten.latmax) daten.latmax=wp.lat;
								if(wp.lon<daten.lonmin) daten.lonmin=wp.lon; if(wp.lon>daten.lonmax) daten.lonmax=wp.lon;
							}
							wp.cmt = dv[i].innerHTML?dv[i].innerHTML:"";
							wp.desc = wp.cmt;
							wp.link ="";
							wp.sym = dv[i].getAttribute("data-icon")?dv[i].getAttribute("data-icon"):"default" ;
							wp.time = 0;
							wp.name = dv[i].getAttribute("data-name")?dv[i].getAttribute("data-name"):"";
							daten.wegpunkte.wegpunkt.push(wp);
						}
					}
				}
			}
			daten.wegpunkte.anzahl = daten.wegpunkte.wegpunkt.length;
		}
		return daten;
	} // div2WP

	var chkwpt,chktrk,chkrt;
	function setMapHead() {
		JB.Debug_Info(id,"setMapHead",false);
		var str = " <div> ";
		if(div.title) {
			str += div.title;
		}
		else {
			if(JB.gc.legende_fnm) {    
				for(var i=0;i<file.length-1;i++) str += file[i].name.replace(/.+\//,"") + ", ";
				str += file[file.length-1].name.replace(/.+\//,"") + ": ";
			}
		}
		str += "</div>";
		MapHead.innerHTML = str;
		if(gpxdaten.wegpunkte.anzahl) {
			if(gpxdaten.wegpunkte.anzahl==1) var texte = [strings.wpt];
			else if(gpxdaten.wegpunkte.anzahl>1) var texte = [strings.wpts];
			chkwpt = new JB.CheckBoxGroup(MapHead.id,texte,ID+"_wpt",[],JB.gc.legende_wpt,show,null);
		}
		if(gpxdaten.tracks.anzahl) {
			var texte = [];
			if(gpxdaten.tracks.anzahl==1) {
				if(JB.gc.legende_rr) {
					texte[0] = strings.trk+" ("+Number(gpxdaten.tracks.track[0].laenge.toPrecision(10).toString(10))+units.way;
					if(typeof(gpxdaten.tracks.track[0].rauf)!="undefined") 
						texte[0] += ", +"+gpxdaten.tracks.track[0].rauf+units.alt+", -"+gpxdaten.tracks.track[0].runter+units.alt+") ";
					else 
						texte[0] += ") ";
				}
				else
					texte[0] = strings.trk+" ("+Number(gpxdaten.tracks.track[0].laenge.toPrecision(10).toString(10))+units.way+") ";
			}
			else if(gpxdaten.tracks.anzahl>1) { 
				if(JB.gc.legende_rr) {
					var rrflag=true;  
					for(var i=0;i<gpxdaten.tracks.anzahl;i++) {
						texte[i+1] = gpxdaten.tracks.track[i].name+" ("+Number(gpxdaten.tracks.track[i].laenge.toPrecision(10).toString(10))+units.way;
						if(typeof(gpxdaten.tracks.track[i].rauf)!="undefined") {
							texte[i+1] += ", +"+ gpxdaten.tracks.track[i].rauf +units.alt+", -"+gpxdaten.tracks.track[i].runter+units.alt+") ";
						}
						else {
							texte[i+1] += ")";
							rrflag = false;
						}
					}
					texte[0] = strings.trks+" ("+Number(gpxdaten.tracks.laenge.toPrecision(10).toString(10))+units.way
					if(rrflag) texte[0] += ", +"+gpxdaten.tracks.rauf+units.alt+", -"+gpxdaten.tracks.runter+units.alt+") ";
					else       texte[0] += ") ";
				}
				else {
					texte[0] = strings.trks+" ("+Number(gpxdaten.tracks.laenge.toPrecision(10).toString(10))+units.way+") ";
					for(var i=0;i<gpxdaten.tracks.anzahl;i++) texte[i+1] = gpxdaten.tracks.track[i].name+" ("+Number(gpxdaten.tracks.track[i].laenge.toPrecision(10).toString(10))+units.way+")";
				}
			}
			var farben = []; for(var i=0;i<gpxdaten.tracks.anzahl;i++) farben[i] = gpxdaten.tracks.track[i].farbe;
			var zoomFunc = [];
			zoomFunc[0] = function() { dieses.Rescale() }
			for(var i=0;i<gpxdaten.tracks.anzahl;i++) {
				(function(daten) {
					zoomFunc[i+1] = function() { dieses.Rescale(daten) };
				})(gpxdaten.tracks.track[i]);
			};
			chktrk = new JB.CheckBoxGroup(MapHead.id,texte,ID+"_trk",farben,JB.gc.legende_trk,show,zoomFunc);
		}
		if(gpxdaten.routen.anzahl) {
			var texte = [];
			if(gpxdaten.routen.anzahl==1)
				texte[0] = strings.rte+" ("+Number(gpxdaten.routen.route[0].laenge.toPrecision(10).toString(10))+units.way+") ";
			else if(gpxdaten.routen.anzahl>1) {
				texte[0] = strings.rtes+" ("+Number(gpxdaten.routen.laenge.toPrecision(10).toString(10))+units.way+") ";
				for(var i=0;i<gpxdaten.routen.anzahl;i++) texte[i+1] = gpxdaten.routen.route[i].name+" ("+Number(gpxdaten.routen.route[i].laenge.toPrecision(10).toString(10))+units.way+") ";
			}
			var zoomFunc = [];
			zoomFunc[0] = function() { dieses.Rescale() }
			for(var i=0;i<gpxdaten.routen.anzahl;i++) {
				(function(daten) {
					zoomFunc[i+1] = function() { dieses.Rescale(daten) };
				})(gpxdaten.routen.route[i]);
			};
			chkrt = new JB.CheckBoxGroup(MapHead.id,texte,ID+"_rt",JB.gc.rcols,JB.gc.legende_rte,show,zoomFunc);
		}
	} // setMapHead
	
	var profilcanvas="X";
	var mapidleevent=null;

	function show() {
		JB.Debug_Info(id,"show",false);
		if(JB.gc.profilflag) {
			JB.Wait(ID,["gra","plot"], function() { 
				showProfiles(); 
				if(profilcanvas=="X") {
					profilcanvas = document.getElementById(ID+"_profiles");
					if(profilcanvas) 
						JB.onresize(profilcanvas,function(w,h) {
							for(var p in profil) {
								var pr = profil[p];                                                
								if(pr.ele) {
									pr.diag.clear();  
									pr.diag = null;
								}
							}
							showProfiles();
						});
				}
			}); 
		}
		JB.Wait(id,["googlemaps","gmutils"],function() {
			if(!Map) {
				if(typeof(JB.GPX2GM.callback)=="function") 
					JB.GPX2GM.callback({id:id,type:"Map_v",gpxdaten:gpxdaten,profil:profil,Map:Map});
				Map = new JB.Map(mapdiv,id);
				JB.Debug_Info(ID,"Karte erstellt",false);
				if(typeof(JB.GPX2GM.callback)=="function") 
					JB.GPX2GM.callback({id:id,type:"Map_n",gpxdaten:gpxdaten,profil:profil,Map:Map});
			}
			if(newfile) { 
				if (maptype!="") Map.change(maptype); 
				if(mapdiv.offsetWidth*mapdiv.offsetHeight!=0) dieses.Rescale(); 
				else {
					var resev = JB.onresize(mapdiv,function(w,h){
						dieses.Rescale();
						JB.offresize(resev);
					});
				}
				newfile = false;
			}
			showTracks();
			showRoutes();
			if(JB.gc.wpcluster) { 
				Map.addMapEventOnce("idle", showWpts);
				if(!mapidleevent) mapidleevent = Map.addMapEvent("zoom_changed", function(){Map.addMapEventOnce("idle", showWpts);});
				else showWpts();
			}
			else {
				if(mapidleevent) Map.removeEvent(mapidleevent);
				showWpts();
			}
		});
	} // show
	
	function showWpts() {
		var mrk;
		JB.Debug_Info(id,"showWpts",false);
		for(var i=0;i<markers.length;i++) JB.RemoveElement(markers[i]);
		markers = [];
		if (!(chkwpt && chkwpt.status[0])) return;
		if(gpxdaten.wegpunkte.anzahl>0 && typeof(JB.GPX2GM.callback)=="function") 
			JB.GPX2GM.callback({id:id,type:"Wegpunkte_v",gpxdaten:gpxdaten,profil:profil,Map:Map});
		if(JB.gc.wpcluster && gpxdaten.wegpunkte.anzahl>1) {
			var clusters = wpcluster();
			mrk = showClusters(clusters);
			for(var m=0;m<mrk.length;m++) markers.push(mrk[m]);
		}
		for(var i=0;i<gpxdaten.wegpunkte.anzahl;i++) { 
			if(gpxdaten.wegpunkte.wegpunkt[i].cluster == -1) {
				mrk = showWpt(gpxdaten.wegpunkte.wegpunkt[i]);
				for(var m=0;m<mrk.length;m++) markers.push(mrk[m]);
			}
		}
		if(markers.length>0 && typeof(JB.GPX2GM.callback)=="function")
			JB.GPX2GM.callback({id:id,type:"Wegpunkte_n",gpxdaten:gpxdaten,profil:profil,Map:Map});
	} // showWpts 
	
	function showWpt(waypoint) {
		var sym = waypoint.sym.toLowerCase() ;
		var icon = JB.icons[sym]?JB.icons[sym]:null;
		JB.Debug_Info(id,"Symbol: "+sym,false);
		var imgsrc="";
		if (JB.checkImageName(waypoint.name)) imgsrc = waypoint.name;
		else if (JB.checkImageName(waypoint.link)) imgsrc = waypoint.link;
		wpinfo(waypoint);
		var mrk;
		if(imgsrc.length) {
			if(JB.gc.bildwegpunkticon != "") sym = JB.gc.bildwegpunkticon;
			mrk = Map.Marker_Bild(waypoint,JB.icons[sym]?JB.icons[sym]:JB.icons.Bild,JB.gc.bildpfad+imgsrc);
		}
		else if (waypoint.link && waypoint.link.length)
			mrk = Map.Marker_Link(waypoint,icon,waypoint.name,waypoint.link,JB.gc.popup_Pars);
		else if (waypoint.name.length || waypoint.cmt.length || waypoint.desc.length)
			mrk = Map.Marker_Text(waypoint,icon,waypoint.name);
		else
			mrk = Map.Marker(waypoint,icon);
		return mrk;
	} // showWpt
	
	function showClusters(clusters) {
		var zoomstatus = Map.getZoom();
		var mrks=[],mrk;
		for(var i=0;i<clusters.length;i++) {
			var cluster = clusters[i];
			if(zoomstatus.zoom<zoomstatus.maxzoom) {
				JB.Debug_Info(id,"Symbol: Cluster",false);
				mrk = Map.Marker_Cluster(cluster,gpxdaten.wegpunkte.wegpunkt,strings);
				for(var m=0;m<mrk.length;m++) mrks.push(mrk[m]);
			}
			else {
				var mindist = 40.0/Map.getPixelPerKM(gpxdaten);
				var dphi = 2*Math.PI/cluster.members.length;
				for(var j=0;j<cluster.members.length;j++) {
					var wporg = gpxdaten.wegpunkte.wegpunkt[cluster.members[j]];
					var wpcopy = {},e;
					for(e in wporg) wpcopy[e] = wporg[e];
					wpcopy.lat = cluster.lat + mindist*Math.cos(j*dphi)*180/(6378.137*Math.PI);
					wpcopy.lon = cluster.lon + mindist*Math.sin(j*dphi)*180/(6378.137*Math.PI*Math.cos(cluster.lat*Math.PI/180));
					mrk = showWpt(wpcopy);
					for(var m=0;m<mrk.length;m++) mrks.push(mrk[m]); 
					mrks.push(Map.simpleLine(wporg.lat,wporg.lon,wpcopy.lat,wpcopy.lon));
				}
			}
		}
		return mrks;
	}

	function wpcluster() {
		var wps = gpxdaten.wegpunkte.wegpunkt;
		var mindist = 40.0/Map.getPixelPerKM(gpxdaten);
		var clusters = [];
		var wppointer = [];
		for(var i=0;i<wps.length;i++) {
			for(var ct=0;ct<wps.length;ct++) if(wps[i].dist[ct][1]>mindist) break;
			wppointer[i] = [i,ct];
		}
		wppointer.sort(function(a,b) {return a[1]-b[1];});
		var clusternr=-1;
		for(var i=0;i<wps.length;i++) wps[i].cluster = -1;
		for(var ii=0;ii<wps.length;ii++) { 
			var i= wppointer[ii][0];
			var wp = wps[i];
			if(wp.cluster==-1 && wp.dist[1][1]<mindist) {
				clusternr = clusters.length;
				var cluster = {lat:0, lon:0, members: []};
				for(var j=0;j<wp.dist.length;j++) { 
					if(wp.dist[j][1]<mindist) { 
						if(wps[wp.dist[j][0]].cluster==-1) {
							cluster.members.push(wp.dist[j][0]);
							wps[wp.dist[j][0]].cluster = clusternr; 
						} 
					}
				}	
				if(cluster.members.length>1) clusters.push(cluster);
				else if(cluster.members.length==1) wps[cluster.members[0]].cluster = -1;
			}
		}
		for(var i=0;i<wps.length;i++) {
			var wp = wps[i];
			if(wp.cluster==-1) {
				for(var j=0;j<wp.dist.length;j++) { 
					if(wp.dist[j][1]<mindist) { 
						if(wps[wp.dist[j][0]].cluster>-1) {
							wps[i].cluster = wps[wp.dist[j][0]].cluster;
							clusters[wps[i].cluster].members.push(i);
							break;
						}
					}
				}
			}
		}
		for(var i=0;i<clusters.length;i++) {
			var lat=0,lon=0;
			for(var j=0;j<clusters[i].members.length;j++) {
				var wp = wps[clusters[i].members[j]];
				lat += wp.lat;
				lon += wp.lon;
			}
			clusters[i].lat = lat/clusters[i].members.length;
			clusters[i].lon = lon/clusters[i].members.length;
		}
		JB.Debug_Info(id,clusters.length+" Wegpunktcluster angelegt",false);
		return clusters;
	} // wpcluster

	function showRoutes() {
		JB.Debug_Info(id,"showRoutes",false);
		for(var i=0;i<routepolylines.length;i++) JB.RemoveElement(routepolylines[i]);
		routepolylines = [];
		if (!(chkrt && chkrt.status[0])) return;
		if(gpxdaten.routen.anzahl>0 && typeof(JB.GPX2GM.callback)=="function")
			JB.GPX2GM.callback({id:id,type:"Routen_v",gpxdaten:gpxdaten,profil:profil,Map:Map});
		for(var i=0;i<gpxdaten.routen.anzahl;i++) if(chkrt.status[gpxdaten.routen.anzahl==1?0:i+1]) {
			var routei = gpxdaten.routen.route[i];
			var info = "";
			routinfo(routei);
			var controls = {
				col: routei.farbe,
				ocol: JB.gc.ocol,
				opac: JB.gc.ropac,
				width: JB.gc.rwidth
			}
			var rts = Map.Polyline(routei,controls,"Route");
			for(var r=0;r<rts.length;r++) routepolylines.push(rts[r]);
			if(JB.gc.shrtstart) {
			  rts = Map.Marker(routei.daten[0],JB.icons.start);
				for(var r=0;r<rts.length;r++) routepolylines.push(rts[r]);
			}
			if(JB.gc.shrtziel) {
				rts = Map.Marker(routei.daten[routei.daten.length-1],JB.icons.finish)
				for(var r=0;r<rts.length;r++) routepolylines.push(rts[r]);
			}
		}
		if(routepolylines.length>0 && typeof(JB.GPX2GM.callback)=="function") 
			JB.GPX2GM.callback({id:id,type:"Routen_n",gpxdaten:gpxdaten,profil:profil,Map:Map});
	} // showRoutes

	function showTracks() {
		var colmod=JB.gc.trcolmod,colmodflag=false,min=1e10,max=-1e10,minmax={};
		JB.Debug_Info(id,"showTracks",false);
		for(var i=0;i<trackpolylines.length;i++) JB.RemoveElement(trackpolylines[i]);
		trackpolylines = [];
		if(colmod.length) {
			if(FB) FB.del();
			JB.offresize(fb_onresize);
		}
		if (!(chktrk && chktrk.status[0])) return;
		if(gpxdaten.tracks.anzahl>0 && typeof(JB.GPX2GM.callback)=="function") 
			JB.GPX2GM.callback({id:id,type:"Tracks_v",gpxdaten:gpxdaten,profil:profil,Map:Map});
		if( (colmod=="h" && gpxdaten.tracks.hflag) || (colmod=="v" && gpxdaten.tracks.tflag) || (colmod=="hr" && gpxdaten.tracks.hrflag) || (colmod=="cad" && gpxdaten.tracks.cadflag) ) {
			colmodflag = true;
			var coltab = JB.farbtafel(1000);
			for(var i=0;i<gpxdaten.tracks.anzahl;i++) if(chktrk.status[gpxdaten.tracks.anzahl==1?0:i+1]) {
				var tracki = gpxdaten.tracks.track[i];
				if(colmod=="h" && tracki.hflag) {
					if(typeof(JB.Scaling)!="undefined" && typeof(JB.Scaling.hmin)!="undefined" && typeof(JB.Scaling.hmax)!="undefined") {
						minmax.min = JB.Scaling.hmin;
						minmax.max = JB.Scaling.hmax;
						if(!JB.Scaling.hardscaling) minmax = getminmax(tracki.daten,"h",minmax);
					}
					else 
						minmax = getminmax(tracki.daten,"h");
				}
				else if(colmod=="v" && tracki.tflag) {
					if(typeof(JB.Scaling)!="undefined" && typeof(JB.Scaling.vmin)!="undefined" && typeof(JB.Scaling.vmax)!="undefined") {
						minmax.min = JB.Scaling.vmin;
						minmax.max = JB.Scaling.vmax;
						if(!JB.Scaling.hardscaling) minmax = getminmax(tracki.daten,"v",minmax);
					}
					else 
						minmax = getminmax(tracki.daten,"v");
				}
				else if(colmod=="hr" && tracki.hrflag) {
					if(typeof(JB.Scaling)!="undefined" && typeof(JB.Scaling.hrmin)!="undefined" && typeof(JB.Scaling.hrmax)!="undefined") {
						minmax.min = JB.Scaling.hrmin;
						minmax.max = JB.Scaling.hrmax;
						if(!JB.Scaling.hardscaling) minmax = getminmax(tracki.daten,"hr",minmax);
					}
					else 
						minmax = getminmax(tracki.daten,"hr");
				}
				else if(colmod=="cad" && tracki.cadflag) {
					if(typeof(JB.Scaling)!="undefined" && typeof(JB.Scaling.cadmin)!="undefined" && typeof(JB.Scaling.cadmax)!="undefined") {
						minmax.min = JB.Scaling.cadmin;
						minmax.max = JB.Scaling.cadmax;
						if(!JB.Scaling.hardscaling) minmax = getminmax(tracki.daten,"cad",minmax);
					}
					else 
						minmax = getminmax(tracki.daten,"cad");
				}
				min = Math.min(min,minmax.min); max = Math.max(max,minmax.max);
			}
		}
		else if(colmod=="s" && gpxdaten.tracks.hflag) {
			colmodflag = true;
			var coltab = JB.farbtafel_bipolar();
			for(var i=0;i<gpxdaten.tracks.anzahl;i++) if(chktrk.status[gpxdaten.tracks.anzahl==1?0:i+1]) {
				var tracki = gpxdaten.tracks.track[i];
				if(tracki.hflag) {
					if(typeof(JB.Scaling)!="undefined" && typeof(JB.Scaling.smin)!="undefined" && typeof(JB.Scaling.smax)!="undefined") {
						minmax.min = JB.Scaling.smin;
						minmax.max = JB.Scaling.smax;
						if(!JB.Scaling.hardscaling) minmax = getminmax(tracki.daten,"s",minmax);
					}
					else 
						minmax = getminmax(tracki.daten,"s");
				}
				min = Math.min(min,minmax.min); max = Math.max(max,minmax.max);
			}
			if(min*max<0) {
				if(-min<max) min = -max;
				else max = -min;
			}
			else {
				if(min>0) min = -max;
				else max = -min;
			}
		}
		if(colmodflag) {
			if(max<min) { max = 0.5; min = -0.5; }
			else if(max==min) { max += 0.5; min -= 0.5; }
			JB.Wait(ID,["gra","plot"], function() { 
			  if(!FB) FB = new JB.farbbalken(odiv);
				FB.create(0,30,10,coltab,min,max,profil[colmod+"p"].ytext);
				JB.Debug_Info(id,"Farbbalken für "+colmod+" erstellt.",false);
				fb_onresize = JB.onresize(odiv,function(w,h) {
					FB.del();
					FB.create(0,30,10,coltab,min,max,profil[colmod+"p"].ytext);
				});
			});
		}
		for(var i=0;i<gpxdaten.tracks.anzahl;i++) if(chktrk.status[gpxdaten.tracks.anzahl==1?0:i+1]) {
			var tracki = gpxdaten.tracks.track[i];
			trackinfo(tracki);
			var controls = {
				col: tracki.farbe,
				ocol: JB.gc.ocol,
				opac: JB.gc.topac,
				width: JB.gc.twidth
			};
			var trs;
			if(colmodflag) {
				var cols=[],colindex;
				for(var j=0;j<tracki.daten.length;j++) {
					colindex = Math.round( (coltab.length-1) * (tracki.daten[j][colmod] - min)/(max - min) );
					colindex = Math.max(Math.min(colindex,coltab.length-1),0);
					cols[j] = coltab[colindex];
				}
				controls.width *= 2;
				trs = Map.Polyline(tracki,controls,"Track",cols);
			}
			else trs = Map.Polyline(tracki,controls,"Track");
			for(var t=0;t<trs.length;t++) trackpolylines.push(trs[t]);
			if(JB.gc.shtrstart) {
				trs = Map.Marker(tracki.daten[0],JB.icons.start);
				for(var t=0;t<trs.length;t++) trackpolylines.push(trs[t]);
			}
			if(JB.gc.shtrziel) {
				trs = Map.Marker(tracki.daten[tracki.daten.length-1],JB.icons.finish)
				for(var t=0;t<trs.length;t++) trackpolylines.push(trs[t]);
			}
		}
		if(trackpolylines.length>0 && typeof(JB.GPX2GM.callback)=="function") 
			JB.GPX2GM.callback({id:id,type:"Tracks_n",gpxdaten:gpxdaten,profil:profil,Map:Map});
	} // showTracks
	
	function getTimezone(gpxdaten) {
		var t,lat,lon,track=gpxdaten.tracks.track,wp=gpxdaten.wegpunkte.wegpunkt,daten,tzurl;
		for(var i=0;i<gpxdaten.tracks.anzahl;i++) {
			( function(tnr) { 
				tzurl ="https://maps.googleapis.com/maps/api/timezone/json?location=";
				daten = track[tnr].daten[0];
				t = Math.round(daten.tabs*3600); 
				lat = daten.lat;
				lon = daten.lon;
				tzurl += lat+","+lon+"&timestamp="+t;
				window.setTimeout( function(){ JB.loadFile({name:tzurl}, "a", function(result,status) {
					if(status == 200) {
						var tz = JSON.parse(result.asciidata);
						if(tz.status=="OK") {
							JB.Debug_Info(track[tnr].name,"dstOffset:"+tz.dstOffset+", rawOffset:"+tz.rawOffset,false);
							gpxdaten.tracks.track[tnr].tzoff = ( tz.dstOffset + tz.rawOffset );
							trackinfo(gpxdaten.tracks.track[tnr]);
							for(var j=0;j<gpxdaten.tracks.track[tnr].daten.length;j++) 
								gpxdaten.tracks.track[tnr].daten[j].tabs += ( tz.dstOffset + tz.rawOffset ) / 3600;
						}
					}
				})},tnr*110);
			} )(i);
		}
		for(var i=0;i<gpxdaten.wegpunkte.anzahl;i++) {
			( function(wnr) { 
				tzurl ="https://maps.googleapis.com/maps/api/timezone/json?location=";
				daten = wp[wnr];
				t = Math.round(daten.time);
				lat = daten.lat;
				lon = daten.lon;
				tzurl += lat+","+lon+"&timestamp="+t;
				window.setTimeout( function(){ JB.loadFile({name:tzurl}, "a", function(result,status) {
					if(status == 200) {
						var tz = JSON.parse(result.asciidata);
						if(tz.status=="OK") {
							JB.Debug_Info(gpxdaten.wegpunkte.wegpunkt[wnr].name,"dstOffset:"+tz.dstOffset+", rawOffset:"+tz.rawOffset,false);
							gpxdaten.wegpunkte.wegpunkt[wnr].time += ( tz.dstOffset + tz.rawOffset );
							wpinfo(gpxdaten.wegpunkte.wegpunkt[wnr]);
						}
					}
				})},(wnr+gpxdaten.tracks.anzahl)*110);
			} )(i);
		}
	} // getTimezone

	function trackinfo(tracki) {
		var info = "<strong>"+tracki.name+"</strong>";
		if(JB.gc.shtrx) 
			info += "<br />"+strings.way+":&nbsp;"+Number(tracki.laenge.toPrecision(10).toString(10))+"&nbsp;"+units.way;
		if(JB.gc.shtrtges && tracki.tges>0)
			info += "<br />"+strings.duration+": "+JB.Zeitstring(tracki.tges*3600);
		if(JB.gc.shtrtgeswob && tracki.tgeswob>0)
			info += "<br />"+strings.duration+"&nbsp;"+strings.inmo+": "+JB.Zeitstring(tracki.tgeswob*3600);
		if(JB.gc.shtrs && typeof(tracki.rauf)!="undefined" ) 
			info += "<br /><span style='white-space:nowrap;'>"+strings.altdiff+": +"+tracki.rauf+" "+units.alt+" / -"+tracki.runter+" "+units.alt+"</span>";
		if(JB.gc.shtrt && tracki.t0>0) 
			info += "<br />"+strings.tstart+":  <span style='white-space:nowrap;'>" + JB.sec2string(tracki.t0*3600,JB.gc.tdiff*3600+tracki.tzoff) + "</span>"; 
		if(JB.gc.shtrvmitt && tracki.vmitt>0)
			info += "<br /><span style='white-space:nowrap;'>"+strings.avspeed+" = " + tracki.vmitt + " "+units.speed+"</span>";
		if(JB.gc.shtrvmittwob && tracki.vmittwob>0)
			info += "<br /><span style='white-space:nowrap;'>"+strings.avspeed+" = " + tracki.vmittwob + " "+units.speed+" "+strings.inmo+"</span>";
		if(JB.gc.shtrvmittpace && tracki.vmitt>0)
			info += "<br /><span style='white-space:nowrap;'>"+strings.pace+" = " + (60/tracki.vmitt).toFixed(1) + " "+units.pace+"</span>";
		if(JB.gc.shtrvmittpacewob && tracki.vmittwob>0)
			info += "<br /><span style='white-space:nowrap;'>"+strings.pace+" = " + (60/tracki.vmittwob).toFixed(1) + " "+units.pace+" "+strings.inmo+"</span>";
		if(JB.gc.shtrcmt) info += "<br />"+tracki.cmt;
		if(JB.gc.shtrdesc) info += "<br />"+tracki.desc;
		tracki.info = info;
	} // trackinfo
	
	function routinfo(routei) {
			var info = "<strong>"+routei.name+"</strong>";
			if(JB.gc.shtrx)
				info += "<br />"+strings.way+"&nbsp;"+Number(routei.laenge.toPrecision(10).toString(10))+"&nbsp;"+units.way;
			if(JB.gc.shrtcmt) info += "<br />"+routei.cmt;
			if(JB.gc.shrtdesc) info += "<br />"+routei.desc;
			routei.info = info;
	} // routinfo
	
	function wpinfo(wp) {
		var imgsrc="";
		if (JB.checkImageName(wp.name)) imgsrc = wp.name;
		else if (JB.checkImageName(wp.link)) imgsrc = wp.link;
		var info = ((JB.gc.shwpname&&!imgsrc.length)?"<strong>"+wp.name+"</strong><br />":"")
						 + (JB.gc.shwpcmt?wp.cmt:"") 
						 + (JB.gc.shwpcmt&&JB.gc.shwpdesc?"<br />":"") 
						 + (JB.gc.shwpdesc?wp.desc:"");
		if(JB.gc.shwptime && wp.time>0) info += "<br /><span style='white-space:nowrap;'>("
																					+ JB.sec2string(wp.time,JB.gc.tdiff) +")</span>"; 
		wp.info = info;
	} // wpinfo
		
	function getminmax(daten,o,minmax) {
		var min=1e10,max=-1e10;
		if(typeof(minmax)!="undefined") { min = minmax.min; max = minmax.max; }
		for(var j=0;j<daten.length;j++) { 
			var wert = daten[j][o];
			if(wert<min) min = wert;
			if(wert>max) max = wert;
		}
		return {min:min,max:max};
	} // getminmax

	function showProfiles() {
		JB.Debug_Info(id,"showProfiles",false); 
		if(profil) profil.setflags(gpxdaten.tracks,-1);
		if(typeof(JB.GPX2GM.callback)=="function") 
			JB.GPX2GM.callback({id:id,type:"Profile_v",gpxdaten:gpxdaten,profil:profil,Map:Map});
		for(var p in profil) {
			if(profil[p].ele && !profil[p].diag) {
				profil[p].diag = new JB.plot(profil[p].id,profil[p].x,profil[p].y);
				if (profil[p].ele.className && profil[p].ele.className.search(/(^|\s)no_x(\s|$)/i)!=-1) profil[p].xtext = "";
				JB.Debug_Info(id,"Profil: "+profil[p].id+" Diagramm angelegt",false);
				profil[p].diag.framecol = JB.gc.plotframecol;
				profil[p].diag.gridcol = JB.gc.plotgridcol;
				profil[p].diag.labelcol = JB.gc.plotlabelcol;
				profil[p].diag.markercol = JB.gc.plotmarkercol;
				profil[p].diag.fillopac = JB.gc.profilfillopac;
				if(p.search("pt")>-1) profil[p].diag.xscale60 = true;
			}
		}
		for(var p in profil) {
			var pr = profil[p];                                                
			if(pr.ele /*&& pr.pflag*/) pr.diag.clear();                       
		}
		if(!(chktrk && chktrk.status[0])) return;
		if(!gpxdaten) return;
		for(var i=0;i<gpxdaten.tracks.anzahl;i++) {
			var tracki = gpxdaten.tracks.track[i];
			var daten = tracki.daten;
			profil.setflags(tracki,-1);
			if(daten.length>1 && chktrk.status[gpxdaten.tracks.anzahl==1?0:i+1]) {
				for(var p in profil) { 
					pr = profil[p];
					if(pr.ele) {
						if(pr.scale && pr.scale.length==2) { 
							pr.scale[0][pr.x] = daten[0][pr.x];
							pr.scale[1][pr.x] = daten[daten.length-1][pr.x];
							pr.diag.scale(pr.scale);
							if(!JB.Scaling.hardscaling) pr.diag.scale(daten); 
						}
						else
							pr.diag.scale(daten);                  
					}
				}
			}
		} 
		profil.setflags(gpxdaten.tracks,-1);
		for(var p in profil) { 
			var pr = profil[p]; 
			if(pr.ele) {
				pr.diag.frame(50,35,pr.xtext,pr.ytext); 
			}
		}
		for(var i=0;i<gpxdaten.tracks.anzahl;i++) if(chktrk.status[gpxdaten.tracks.anzahl==1?0:i+1]) { 
			var tracki = gpxdaten.tracks.track[i];
			if(tracki.daten.length>1) { 
				profil.setflags(tracki,-1);
				for(var p in profil) {
					var pr = profil[p];
					if(pr.ele && pr.pflag) pr.diag.plot(tracki.daten,tracki.farbe);   
				}
			}
		}
		var ct=0,cf=0;
		if(chktrk.status.length==1) {
			if(chktrk.status[0]) cf = ct = 1;
		}
		else {
			var fa={};
			for(var i=1;i<chktrk.status.length;i++) { 
				if(chktrk.status[i]) {
					ct++;
					var fnri = gpxdaten.tracks.track[i-1].fnr;
					if(!fa[fnri]) { fa[fnri] = 1; cf++; }
				}
			}
		}        
		if((cf==1 || JB.gc.tracks_dateiuebergreifend_verbinden) && (JB.gc.tracks_verbinden || ct==1)) {
			var d_t = [];
			profil.setflags(gpxdaten.tracks,ct);
			if(gpxdaten.tracks.anzahl==1) 
				d_t = d_t.concat(gpxdaten.tracks.track[0].daten);
			else
				for(var i=0;i<gpxdaten.tracks.anzahl;i++) if(chktrk.status[i+1]) d_t = d_t.concat(gpxdaten.tracks.track[i].daten);
			if(d_t.length) {
				for(var p in profil) {
					var pr = profil[p];
					if(pr.ele && pr.pflag) pr.diag.markeron(d_t,markerstart,markerstop,markermove,markerclick,"Linie") ;
				}
			}
		}
		if(typeof(JB.GPX2GM.callback)=="function") 
			JB.GPX2GM.callback({id:id,type:"Profile_n",gpxdaten:gpxdaten,profil:profil,Map:Map});
	} // showProfiles

	function markerstart() {
		JB.Debug_Info(id,"markerstart",false);
		JB.MoveMarker.init(Map,JB.icons.MoveMarker);
		profil.setflags(gpxdaten.tracks,-1);
		for(var p in profil) {
			var pr = profil[p];
			if(pr.ele && pr.pflag) pr.diag.showmarker("Linie");
		}
	} // markerstart
	function markerstop() {
		JB.Debug_Info(id,"markerstop",false);
		JB.MoveMarker.remove();
		profil.setflags(gpxdaten.tracks,-1);
		for(var p in profil) {
			var pr = profil[p];
			if(pr.ele && pr.pflag) pr.diag.hidemarker();
		}
	} // markerstop
	function markermove(p,a) {
		var info = "";
		if(JB.gc.shtrx)                                    info += strings.way+":&nbsp;"+a.x.toFixed(1)+units.way;
		if(JB.gc.shtrh &&    typeof a.h    != "undefined") info += "<br />"+strings.alt+":&nbsp;"+Math.round(a.h)+units.alt;
		if(JB.gc.shtrv &&    typeof a.v    != "undefined") info += "<br />"+strings.speed2+":&nbsp;"+Math.round(a.v)+units.speed;
		if(JB.gc.shtrs &&    typeof a.s    != "undefined") info += "<br />"+strings.grade+":&nbsp;"+Math.round(a.s)+strings.grade_unit;
		if(JB.gc.shtrhr &&   typeof a.hr   != "undefined") info += "<br />"+strings.hr+":&nbsp;"+Math.round(a.hr)+"&nbsp;"+strings.hr_unit;
		if(JB.gc.shtrcad &&  typeof a.cad  != "undefined") info += "<br />"+strings.cad+":&nbsp;"+Math.round(a.cad)+"&nbsp;"+strings.cad_unit;
		if(JB.gc.shtrtabs && typeof a.t    != "undefined") info += "<br />"+strings.time+":&nbsp;"+JB.sec2string(a.tabs*3600,JB.gc.tdiff*3600);
		if(JB.gc.shtrt &&    typeof a.t    != "undefined") info += "<br />"+strings.time+":&nbsp;"+JB.Zeitstring(a.t*3600);
		if(JB.gc.shtrtwob && typeof a.twob != "undefined") info += "<br />"+strings.time+":&nbsp;"+strings.inmo+":&nbsp;"+JB.Zeitstring(a.twob*3600); 
		profil.setflags(gpxdaten.tracks,-1);
		for(var pp in profil) {
			var pr = profil[pp];
			if(pr.ele && pr.pflag) pr.diag.setmarker(a,"Linie");
		}
		JB.MoveMarker.pos(a,info,JB.gc.maxzoomemove);
	} // markermove
	function markerclick(p,a) {
		var info = "";
		if(JB.gc.shtrx)                                    info += strings.way+":&nbsp;"+a.x.toFixed(1)+units.way;
		if(JB.gc.shtrh &&    typeof a.h    != "undefined") info += "<br />"+strings.alt+":&nbsp;"+Math.round(a.h)+units.alt;
		if(JB.gc.shtrv &&    typeof a.v    != "undefined") info += "<br />"+strings.speed2+":&nbsp;"+Math.round(a.v)+units.speed;
		if(JB.gc.shtrs &&    typeof a.s    != "undefined") info += "<br />"+strings.grade+":&nbsp;"+Math.round(a.s)+strings.grade_unit;
		if(JB.gc.shtrhr &&   typeof a.hr   != "undefined") info += "<br />"+strings.hr+":&nbsp;"+Math.round(a.hr)+"&nbsp;"+strings.hr_unit;
		if(JB.gc.shtrcad &&  typeof a.cad  != "undefined") info += "<br />"+strings.cad+":&nbsp;"+Math.round(a.cad)+"&nbsp;"+strings.cad_unit;
		if(JB.gc.shtrtabs && typeof a.t    != "undefined") info += "<br />"+strings.time+":&nbsp;"+JB.sec2string(a.tabs*3600,JB.gc.tdiff*3600);
		if(JB.gc.shtrt &&    typeof a.t    != "undefined") info += "<br />"+strings.time+":&nbsp;"+JB.Zeitstring(a.t*3600);
		if(JB.gc.shtrtwob && typeof a.twob != "undefined") info += "<br />"+strings.time+":&nbsp;"+strings.inmo+":&nbsp;"+JB.Zeitstring(a.twob*3600); 
		Map.gminfowindow(info,a);
	} // markerclick

} // JB.makeMap

JB.checkImageName = function(url) {
	var ext = url.substr(url.lastIndexOf(".")+1).toLowerCase();
	return (ext=="jpg" || ext=="jpeg" || ext=="png" || ext=="gif" || url.indexOf("data:image")>-1) ;
} //  checkImageName                 

JB.CheckBoxGroup = function(id,Texte,Label,Farbe,def_stat,clickFunc,clickFunc2) {
	var dieses = this;
	var nbx = Texte.length;
	this.status = []; for(var i=0;i<nbx;i++) this.status[i] = def_stat ;
	var ele;
	var box=document.createElement("div");
	JB.addClass("JBcheckbox",box);
	for(var i=0;i<nbx;i++) {
		ele = document.createElement("input");
		ele.type = "checkbox";
		ele.id = Label + i;
		ele.nr = i;
		if(i==0) ele.onclick = function() {
			var l = nbx;
			var n = Label;
			var status = this.checked;
			dieses.status[0] = status;
			for(var j=1;j<l;j++) {
				document.getElementById(n+j).checked = status;
				dieses.status[j] = status;
			}
			clickFunc(dieses,this);
		};
		else     ele.onclick = function() {
			var l = nbx;
			var n = Label;
			var status = false;
			for(var j=1;j<l;j++) status |= document.getElementById(n+j).checked;
			document.getElementById(n+"0").checked = status;
			dieses.status[0] = status;
			dieses.status[this.nr] = this.checked;
			clickFunc(dieses,this);
		};
		box.appendChild(ele);
		ele.checked = def_stat;
		ele=document.createElement("span");
		if(Farbe.length) {
			if(i==0 && nbx==1) ele.style.color=Farbe[0];
			else if(i) ele.style.color=Farbe[(i-1)%Farbe.length];
		}
		ele.appendChild(document.createTextNode(Texte[i]));
		box.appendChild(ele);
		if(clickFunc2) {
			ele = document.createElement("img");
			ele.src = JB.GPX2GM.Path+"Icons/lupe+.png";;
			ele.style.cursor = "Pointer";
			(function(func) {
				ele.onclick = func;   
			})(clickFunc2[i]);
			box.appendChild(ele);
		}
		if(i<Texte.length-1) box.appendChild(document.createElement("br"));
	}
	ele=document.getElementById(id);
	ele.appendChild(box);
	var spn=document.createElement("span"); // Platzhalter
	spn.appendChild(document.createTextNode("xX"+Texte[0]+"xX"));
	spn.style.visibility="hidden";
	ele.appendChild(spn);
} // JB.CheckBoxGroup

JB.sec2string = function(sec,off) {
	var d = new Date(sec*1000 + off*1000);
	return d.getUTCDate()+".&nbsp;"+(d.getUTCMonth()+1)+".&nbsp;"+d.getUTCFullYear()+",&nbsp;"+d.getUTCHours()+":"+(d.getUTCMinutes()<10?"0":"")+d.getUTCMinutes()+(JB.gc.tkorr ? "" : " UTC");
//	return (new Date(sec*1000 + off*1000)).toLocaleString('X-X',{timeZone:'UTC'});
} // JB.sec2string

JB.Zeitstring = function(sekunden) {
	var h=0,m=0,s=Math.floor(sekunden);
	m = Math.floor(s/60);
	s = s%60; if(s<10) s = "0"+s;
	h = Math.floor(m/60)
	m = m%60; if(m<10) m = "0"+m;
	return h+":"+m+":"+s+"h"; 
} // JB.Zeitstring

JB.bounds = function(center_lat,center_lon,radius) {
// https://de.wikipedia.org/wiki/Wegpunkt-Projektion
	var d = radius/6378.137;
	var fak = Math.PI/180;
	var lat = center_lat * fak;
	var lon = center_lon * fak;
	var sind = Math.sin(d);
	var cosd = Math.cos(d);
	var sinlat = Math.sin(lat);
	var coslat = Math.cos(lat);
	var latmin = (Math.asin(sinlat*cosd - coslat*sind))/fak;
	var latmax = (Math.asin(sinlat*cosd + coslat*sind))/fak;
	var lonmin = (lon - Math.asin(sind/coslat))/fak;
	var lonmax = (lon + Math.asin(sind/coslat))/fak;
	return {latmin:latmin,latmax:latmax,lonmin:lonmin,lonmax:lonmax};
} // JB.bounds

JB.Debug_Info = function(id,Infotext,errorflag) {
	if(JB.debuginfo) {
		var dt = ((new Date()).getTime()-JB.gpxview_Start).toString(10);
		while(dt.length<6) dt = "0"+dt;
		if(typeof(console) != "undefined" && typeof(console.log) == "function") 
			console.log(dt+" Map "+id+": "+Infotext.replace(/<br>/g,"\n").replace(/&nbsp;/g,"  "));
	}
	if(errorflag) {
		if(typeof(console) != "undefined" && typeof(console.error) == "function")
			console.error(id+": "+Infotext);
		// else	
			alert(Infotext);
	}
} // Debug_Info

JB.Wait = function(id,scripte,callback,ct) {
	var Text = "";
	var flag = true; 
	ct = ct || 1;
	for(var i=0;i<scripte.length;i++) {
		var t = JB.Scripte[scripte[i]];
		flag &= t == 2;
		Text += scripte[i] + ": "+ t + ", ";
	}
	JB.Debug_Info(id+" Wait",Text+" flag="+(flag?"true ":"false ")+ct,false);
	if(flag) window.requestAnimationFrame(callback);
	else if(ct<15) window.setTimeout(function() { JB.Wait(id,scripte,callback,ct+1) },100+(1<<ct));
	else JB.Debug_Info(id+" Wait",Text+" nicht geladen.",false);
} // Wait

// lpgpx.js
// Version 2.14
// 26. 2. 2017
// www.j-berkemeier.eu
JB.loadFile = function(file, format, callback) {
	if(!file.fileobject) { // ajax
		JB.loadFile_xml(file, format, callback);
	}
	else { //File API
		JB.LoadFile_local(file, format, callback);
	}
} // loadFile

JB.loadFile_xml = function(file, format, callback) {
	var id = "loadFile_xml";
	var request,url=file.name;
	var result={asciidata:"<gpx></gpx>"};
	if(url.length==0) {
		JB.Debug_Info(id,"Kein Dateiname",false);
		callback(result, 0);
		return;
	}
	request = new XMLHttpRequest();
	if(request) {
		request.addEventListener('load', function(event) {
			if ((request.status >= 200 && request.status < 300) || request.status == 0) {
				if(format=="b") result.binarydata = new Uint8Array(request.response);
				else { result.asciidata = request.responseText }
				JB.Debug_Info(id,"Datei konnte geladen werden, Status: "+request.status+", Datei: "+url,false);
				callback(result, request.status);
			} 
			else {
				JB.Debug_Info(id,"Datei konnte nicht geladen werden, Status: "+request.status+", Datei: "+url,true);
				callback(result,request.status);
			}
		});
		request.addEventListener('error', function(event) {
			JB.Debug_Info(id,"Datei konnte nicht geladen werden, Status: "+request.status+", Datei: "+url,true);
			callback(result,request.status);
		});
		request.open("GET",url);
		if(format=="b") request.responseType = "arraybuffer";
		request.send();
	}
	else {
		JB.Debug_Info(id,"HTTP-Request konnte nicht erstellt werden, Datei: "+url,true)
		callback(result,-1);
	} 		
} // loadFile_xml

JB.LoadFile_local = function(file, format, callback) {
	var id = "loadFile_local";
	if(typeof(FileReader)=="function" || typeof(FileReader)=="object") {
		var reader = new FileReader();
		var result={};
		reader.readAsDataURL(file.fileobject); 
		reader.onload = function(evt) {
			result.dataurl = evt.target.result;
			if(format=="b") reader.readAsArrayBuffer(file.fileobject);
			else reader.readAsText(file.fileobject); 
			reader.onload = function(evt) {
				if(format=="b") result.binarydata = new Uint8Array(evt.target.result);
				else result.asciidata = evt.target.result; 
				callback(result,200);
			}
			reader.onerror = function(evt) {
				JB.Debug_Info(id,"Datei konnte nicht geladen werden, Status: "+evt.target.error.name+", Datei: "+file.name,true);
				callback({},42);
			}
		}
		reader.onerror = function(evt) {
			JB.Debug_Info(id,"Datei konnte nicht geladen werden, Status: "+evt.target.error.name+", Datei: "+file.name,true);
			callback({},42);
		}
	}
	else {
		JB.Debug_Info(id,"FileReader wird vom Browser nicht unterst\u00fctzt.",true);
		JB.Debug_Info(id,"FileReader = "+FileReader+"; typeof(FileReader) = "+typeof(FileReader),false);
	}	
} // JB.LoadFile_local

JB.entf = (function() {
	var fak = Math.PI/180,ls,le,hs,he,be,sinbs,sinbe,cosbs,cosbe,dh,arg,e;
	var si = Math.sin, co = Math.cos, ac = Math.acos, ro = Math.round, sq = Math.sqrt;
	function entf_o() {
		this.init = function(b,l,h) {
			le = l*fak;
			be = b*fak;
			he = h;
			sinbe = si(be);
			cosbe = co(be);
		}
		this.rechne = function(b,l,h) {
			ls = le ;
			le = l*fak;
			hs = he ;
			he = h;
			be = b*fak;
			dh = (h - hs)/1000;
			sinbs = sinbe;
			cosbs = cosbe;
			sinbe = si(be);
			cosbe = co(be);
			arg = sinbs*sinbe + cosbs*cosbe*co(ls-le);
			arg = ro(arg*100000000000000)/100000000000000;
			e = ac ( arg ) * 6378.137;
			if(dh!=0) e = sq(e*e+dh*dh);
			return e;
		}
	}
	return new entf_o();
})() // entf

JB.lpgpx = function(fns,id,callback) { 

	function xmlParse(str) {
		JB.Debug_Info(id,"xmlParse -",false);
		if(str) {
			str = str.replace(/>\s+</g,"><");
			str = str.replace(/gpxtpx:/g,"");
			str = str.replace(/gpxx:/g,"");
			str = str.replace(/cadence>/g,"cad>");
			str = str.replace(/heartrate>/g,"hr>");
			if (typeof ActiveXObject != 'undefined' && typeof GetObject != 'undefined') {
				var doc = new ActiveXObject('Microsoft.XMLDOM');
				doc.loadXML(str);
				JB.Debug_Info(id,"- ActiveX",false);
				return doc;
			}
			if (typeof DOMParser != 'undefined') {
				JB.Debug_Info(id,"- DOMParser",false);
				return (new DOMParser()).parseFromString(str, 'text/xml');
			}
		}
		JB.Debug_Info(id,"xml konnte nicht geparsed werde!",false);
		return document.createElement("div");
	} // xmlParse
	
	function rauf_runter(t) {
		var l=t.length;
		if(l<2) return { rauf:0, runter:0 } ;   
		t = smooth(t,"x","hs","hs",JB.gc.hglattlaen);
		var rauf = 0;
		var runter = 0;
		var h = t[0].hs;
		var hm,dh;
		for(var i=1;i<l;i++) {
			hm = h;
			h = t[i].hs;
			dh = h - hm;
			if(dh>0) rauf += dh;
			else runter -= dh;
		}
		var korrektur = ( (t[t.length-1].h-t[0].h) - (rauf-runter) ) / 2;
		rauf   += korrektur;
		runter -= korrektur;
		rauf = Math.round(rauf);
		runter = Math.round(runter);
		return { rauf:rauf, runter:runter } ;    
	} // rauf_runter
	
	function getTag_qs(ele,tagname,defval,child) {
		var tag, val=defval;
		if(child) tag = ele.querySelector(':scope > '+tagname);
		else tag = ele.querySelector(tagname);
		if( tag && tag.firstChild ) { val = tag.firstChild.data; }
		return val;
	} // getTag_qs
	
	function getLink_qs(ele,defval,child) {
		var tag, val=defval;
		if(child) tag = ele.querySelector(':scope > link');
		else tag = ele.querySelector("link");
		if( tag ) {
				if( tag.hasAttribute("href") ) { val = tag.getAttribute("href"); }
				else if( tag.firstChild ) { val = tag.firstChild.data; }
		} 
		return val;
	} // getLink_qs

	function getTag_ge(ele,tagname,defval,child) {
		var tag = ele.getElementsByTagName(tagname), val=defval, tag0;
		if( tag && tag.length ) {
			tag0 = tag[0];
			if( tag0.firstChild && (child?(tag0.parentNode==ele):true) )
				val = tag0.firstChild.data;
		}
		return val;
	} // getTag_ge
	
	function getLink_ge(ele,defval,child) {
		var tag = ele.getElementsByTagName("link"), val=defval, tag0;
		if( tag && tag.length ) {
			tag0 = tag[0];
			if( (child?(tag0.parentNode==ele):true) ) {
				if( tag0.hasAttribute("href") ) { val = tag0.getAttribute("href"); }
				else if( tag0.firstChild ) { val = tag0.firstChild.data; }
			}
		} 
		return val;
	} // getLink_ge

	var getTag,getLink;
	(function(){
		var neu=false;
		try {
			var t1 = document.body.appendChild(document.createElement("div"));
			var t2 = document.body.querySelector(':scope > div');
			neu = true;	
			document.body.removeChild(t1);
		}
		catch(e) {}
		if(neu) {
			getTag = getTag_qs;
			getLink = getLink_qs;
		}
		else {
			getTag = getTag_ge;
			getLink = getLink_ge;
		}
	})();
	
	function utc2sec(utcdate) {
		var jahr = utcdate.substr(0,4);
		var monat = utcdate.substr(5,2)*1-1;
		var tag = utcdate.substr(8,2);
		var stunde = utcdate.substr(11,2);
		var minute = utcdate.substr(14,2);
		var sekunde = utcdate.substr(17,2);
		return Date.UTC(jahr,monat,tag,stunde,minute,sekunde)/1000;
	} // utc2sec

	function smooth(a,x,y,ys,range) {
		var fak,faksum,sum,xi,xmin,xmax,xj,i,j,ai,aj,ti;
		var l = a.length;
		var t = []; 
		for(i=0;i<l;i++) { 
			ti = {}; 
			ai = a[i];
			ti[ys] = ai[y]; 
			for(var o in ai) ti[o] = ai[o]; 
			t[i] = ti;
		}
		var x0 = a[0][x];
		var xl = a[l-1][x];
		range /= 2000;
		if(range>(xl-x0)/4 || range==0) return t;
		for(i=0;i<l;i++) {
			ai = a[i];
			xi = ai[x];
			xmin = xi - range;
			xmax = xi + range;
			sum = ai[y] * range;
			faksum = range;
			j = i - 1;
			if(j>=0) {
				aj = a[j];
				xj = aj[x];
				while(xj>xmin) {
					fak = range - xi + xj;
					sum += aj[y]*fak;
					faksum += fak;
					j--;
					if(j<0) break;
					aj = a[j];
					xj = aj[x];
				}
			}
			j = i + 1;
			if(j<l) {
				aj = a[j];
				xj = aj[x];
				while(xj<xmax) {
					fak = range + xi - xj;
					sum += aj[y]*fak;
					faksum += fak;
					j++;
					if(j>=l) break;
					aj = a[j];
					xj = aj[x];
				}
			}
			t[i][ys] = sum/faksum;
		}
		return t;
	} // smooth

	function diff(a,x,y,d,fak) {
		var l=a.length,l1=l-1;
		if(l<3) { for(var i=0;i<l;i++) a[i][d] = 0; return a; }
		var dx,dy;
		dx = a[1][x]-a[0][x];
		dy = a[1][y]-a[0][y];
		if(dx==0) a[0][d] = 0;
		else      a[0][d] = fak*dy/dx;
		for(var i=1;i<l1;i++) {
			dx = a[i+1][x]-a[i-1][x];
			dy = a[i+1][y]-a[i-1][y];
			if(dx==0) a[i][d] = a[i-1][d];
			else      a[i][d] = fak*dy/dx;
		}
		dx = a[l1-1][x]-a[l1][x];
		dy = a[l1-1][y]-a[l1][y] ;
		if(dx==0) a[l1][d] = a[l1-1][d];
		else      a[l1][d] = fak*dy/dx;
		return a;
	} // diff

	function korr(daten,y) {
		var npt = daten.length;
		var anzfehl=0,nf=false,fehlst_n,fehlst=[],kflag = false;
		for(var i=0;i<npt;i++) {
			if(daten[i][y] == "nf") {              // Fehlstelle?
				anzfehl ++;                         // Zählen
				if(!nf) {                           // erste Fehlstelle im Block
					fehlst_n = {s:i,e:npt-1};
					nf = true;
				}
			}
			else {
				if(nf) {                              // Erster Wert nach Fehlstelle?
					fehlst_n.e = i;                     // Ende Fehlstellenblock
					fehlst.push(fehlst_n);
					nf = false;
				}
			}
		}
		if(nf) {                                // Letzer Punkt im Fehlstellenblock
			fehlst_n.e = i;                       // Ende Fehlstellenblock
			fehlst.push(fehlst_n);
		}
		JB.Debug_Info(id,y+": "+anzfehl+" Fehlende Werte in "+fehlst.length+" Bl\u00F6cken",false);  
		for(var i=0;i<fehlst.length;i++) 
			JB.Debug_Info(id,"Fehlerblock Nr. "+i+":"+fehlst[i].s+" - "+fehlst[i].e,false);   
		if(anzfehl/npt < 0.3) { // weniger als 30% Fehlstellen
			kflag = true;
			for(var i=0;i<fehlst.length;i++) {
				var s = fehlst[i].s, e = fehlst[i].e;
				if(s==0)
					for(var j=s;j<e;j++) daten[j][y] = daten[e][y];
				else if(e==npt)
					for(var j=s;j<e;j++) daten[j][y] = daten[s-1][y];
				else 
					for(var j=s;j<e;j++) daten[j][y] = daten[s-1][y] + (daten[e][y]-daten[s-1][y])*(j-s)/(e-s);
			}
		}
		return kflag;
	} // korr

	var fnr = 0;
	var t0 = 0;
	var gpxdaten = {tracks:{},routen:{},wegpunkte:{}};
	var tnr, rnr, fnr, latmin, latmax, lonmin ,lonmax;

	function parseGPX(xml,gpxdaten,id,fnr) {	
		JB.Debug_Info(id,"parseGPX",false);
		var usegpxbounds=false;
		if(JB.gc.usegpxbounds) {
			var gpxmetadata = xml.documentElement.getElementsByTagName("metadata"); 
			if(gpxmetadata.length) var gpxbounds = gpxmetadata[0].getElementsByTagName("bounds");
			if(gpxbounds && gpxbounds.length) usegpxbounds = true; 
		}
		JB.gc.usegpxbounds = usegpxbounds;
		if(fnr == 0) {
			gpxdaten.tracks.laenge = 0;
			gpxdaten.tracks.rauf = 0;
			gpxdaten.tracks.runter = 0;
			gpxdaten.tracks.hflag = gpxdaten.tracks.tflag = gpxdaten.tracks.vflag = gpxdaten.tracks.hrflag = gpxdaten.tracks.cadflag = false;
			gpxdaten.tracks.hflagall = gpxdaten.tracks.tflagall = gpxdaten.tracks.vflagall = gpxdaten.tracks.hrflagall = gpxdaten.tracks.cadflagall = true;
			gpxdaten.tracks.track = [];
			gpxdaten.routen.laenge = 0;
			gpxdaten.routen.route = [];
			gpxdaten.wegpunkte.wegpunkt = [];
			tnr = rnr = -1;
			if(usegpxbounds) {
				latmin = parseFloat(gpxbounds[0].getAttribute("minlat"));
				latmax = parseFloat(gpxbounds[0].getAttribute("maxlat"));
				lonmin = parseFloat(gpxbounds[0].getAttribute("minlon"));
				lonmax = parseFloat(gpxbounds[0].getAttribute("maxlon"));
			}
			else {
				latmin=1000;latmax=-1000;lonmin=1000;lonmax=-1000;
			}
		}
		if(usegpxbounds && fnr!=0) {
			var t = parseFloat(gpxbounds[0].getAttribute("minlat"));
			if(t<latmin) latmin = t;
			t = parseFloat(gpxbounds[0].getAttribute("maxlat"));
			if(t>latmax) latmax = t;
			t = parseFloat(gpxbounds[0].getAttribute("minlon"));
			if(t<lonmin) lonmin = t;
			t = parseFloat(gpxbounds[0].getAttribute("maxlon"));
			if(t>lonmax) lonmax = t;
		}
		
		// Tracks 
		var trk = xml.documentElement.getElementsByTagName("trk"); 
		JB.Debug_Info(id,trk.length +" Tracks gefunden",false);   
		if(JB.gc.gpxtracks) for(var k=0;k<trk.length;k++) { 
			var trkk = trk[k];
			var trkpts = trkk.getElementsByTagName("trkpt"); // Trackpunkte
			var trkptslen = trkpts.length;
			if(trkptslen>1) {
				tnr++; 
				var tracki = { laenge:0, rauf:0, runter:0, t0:0, tzoff:0, vmitt:0, vmittwop:0, fnr:fnr};
				tracki.name = getTag(trkk,"name","Track "+k,true);
				tracki.cmt = getTag(trkk,"cmt","",true);
				tracki.desc = getTag(trkk,"desc","",true);
				tracki.link = getLink(trkk,"",true);
				tracki.farbe = JB.gc.tcols[tnr%JB.gc.tcols.length];
				tracki.latmin=1000;tracki.latmax=-1000;
				tracki.lonmin=1000;tracki.lonmax=-1000;
				if(JB.gc.displaycolor) {
					var ext = trkk.getElementsByTagName("extensions");
					if(ext.length) tracki.farbe = getTag(ext[0],"DisplayColor",JB.gc.tcols[tnr%JB.gc.tcols.length],false)
				}
				var daten = [];
				var hflag=true,tflag=true,vflag=JB.gc.readspeed,hrflag=true,cadflag=true,h,t,v,hr,cad,tabs,tmp,cadfound=false;
				JB.Debug_Info(id,trkptslen+" Trackpunkte in Track "+k+" gefunden",false);
				for(var i=0;i<trkptslen;i++) { // Trackdaten erfassen
					var trkptsi = trkpts[i];
					var lat = parseFloat(trkptsi.getAttribute("lat"));
					var lon = parseFloat(trkptsi.getAttribute("lon"));
					if(!usegpxbounds) {
						if(lat<latmin) latmin=lat; if(lat>latmax) latmax=lat;
						if(lon<lonmin) lonmin=lon; if(lon>lonmax) lonmax=lon;
					}
					if(lat<tracki.latmin) tracki.latmin=lat; if(lat>tracki.latmax) tracki.latmax=lat;
					if(lon<tracki.lonmin) tracki.lonmin=lon; if(lon>tracki.lonmax) tracki.lonmax=lon;
					h = getTag(trkptsi,"ele","nf",false);
					if(h=="nf") hflag = false;
					else h = parseFloat(h.replace(",",".")) * JB.gc.hfaktor;
					tmp = getTag(trkptsi,"time","nf",false);
					if(tmp!="nf") { 
						tabs = utc2sec(tmp)/3600;
						if( i==0 ) {
							tracki.t0 = tabs;
								t = 0; 
								t0 = tracki.t0;
						}
						else 
							t = tabs - t0;
					}
					else {
						tflag = false;
						tabs = t = 0;
					}
					if(vflag) {
						if((tmp=getTag(trkptsi,"speed","nf",false)) != "nf")
							v = parseFloat(tmp) * JB.gc.speedfaktor;
						else {
							v = 0;
							vflag = false;
						}
					}
					hr = getTag(trkptsi,"hr","nf",false);
					if(hr=="nf") hrflag = false;
					else hr = parseFloat(hr);
					if(cadflag) {
						if((tmp=getTag(trkptsi,"cad","nf",false)) != "nf") {
							cad = parseFloat(tmp);
							cadfound = true;
						}
						else {
							cad = 0;
						}
					}
					var dateni = {lat:lat,lon:lon,t:t,h:h,v:v,hr:hr,cad:cad,tabs:tabs};
					daten.push(dateni);
				} // Trackdaten erfassen
				if(!hflag) hflag = korr(daten,"h"); // Höhen korrigieren
				if(!hrflag) hrflag = korr(daten,"hr"); // Puls korrigieren
				cadflag &= cadfound;
				var tracklen = 0;
				daten[0].x = tracklen;
				daten[0].dx = 0;
				var dateni,dx; 
				dateni = daten[0];
				JB.entf.init(dateni.lat,dateni.lon,0.0) ;
				for(var i=1;i<trkptslen;i++) {
					dateni = daten[i];
					dx = JB.entf.rechne(dateni.lat,dateni.lon,0.0) * JB.gc.wfaktor;
					tracklen += dx;
					daten[i].x = tracklen;
					daten[i].dx = dx;
				}
				if(hflag) {
					daten = smooth(daten,"x","h","hs",JB.gc.hglattlaen);
					if(JB.gc.hglatt) for(var i=0;i<trkptslen;i++) daten[i].h = daten[i].hs;
				}
				if(hflag && JB.gc.laengen3d) {
					tracklen = 0;
					dateni = daten[0];
					JB.entf.init(dateni.lat,dateni.lon,dateni.hs) ;
					for(var i=1;i<trkptslen;i++) {
				  	dateni = daten[i];
						dx = JB.entf.rechne(dateni.lat,dateni.lon,dateni.hs) * JB.gc.wfaktor;
						tracklen += dx;
						daten[i].x = tracklen;
						daten[i].dx = dx;
					}
				}
				if(hflag) {
					daten = diff(daten,"x","hs","s",0.1*JB.gc.sfaktor);
					daten = smooth(daten,"x","s","s",JB.gc.hglattlaen);
					var rr = rauf_runter(daten);
					JB.Debug_Info(id,"Rauf: "+rr.rauf+"   Runter: "+rr.runter,false);
					tracki.rauf = rr.rauf;
					tracki.runter = rr.runter;
					gpxdaten.tracks.rauf += rr.rauf;      
					gpxdaten.tracks.runter += rr.runter;     
				}
				if(tflag && !vflag) {
					if(JB.gc.vglatt) {
						daten = smooth(daten,"t","x","xs",JB.gc.vglattlaen);
						daten = diff(daten,"t","xs","v",1*JB.gc.vfaktor);
						daten = smooth(daten,"x","v","v",JB.gc.vglattlaen);
					}
					else {
						daten = diff(daten,"t","x","v",1*JB.gc.vfaktor);
					}
				}
				if(!hrflag) for(var i=0;i<daten.length;i++) delete daten[i].hr;
				if(!cadflag) for(var i=0;i<daten.length;i++) delete daten[i].cad;
				JB.Debug_Info(id,""+(hflag?"":"Keine ")+"H\u00F6hendaten gefunden",false);
				JB.Debug_Info(id,""+(tflag?"":"Keine ")+"Zeitdaten gefunden",false);
				JB.Debug_Info(id,""+(vflag?"":"Keine ")+"Geschwindigkeitsdaten gefunden",false);
				JB.Debug_Info(id,""+(hrflag?"":"Keine ")+"Herzfrequenzdaten gefunden",false);
				JB.Debug_Info(id,""+(cadflag?"":"Keine ")+"Cadenzdaten gefunden",false);
				if(tflag) {
					tracki.tges = daten[daten.length-1].t-daten[0].t;
					tracki.vmitt = tracklen/(daten[daten.length-1].t-daten[0].t); // *3600;
					tracki.vmitt = Math.round(tracki.vmitt*10)/10;
					if(JB.gc.shtrvmittwob || JB.gc.shtrvmittpacewob || JB.gc.shtrtgeswob || JB.gc.shtrtwob) {
						var tpause = 0;
						daten[0].twob = daten[0].t;
						for(var i=0;i<daten.length-1;i++) {
							if(daten[i].v < 1) tpause += daten[i+1].t-daten[i].t ;
							daten[i+1].twob = daten[i+1].t - tpause;
						}
						tracki.vmittwob = tracklen/(daten[daten.length-1].t-daten[0].t-tpause)
						tracki.vmittwob = Math.round(tracki.vmittwob*10)/10;
						tracki.tgeswob = tracki.tges - tpause;
					}
				}
				tracki.daten = daten;
				tracki.laenge = Math.round(tracklen*10)/10;
				tracki.hflag = hflag;
				tracki.tflag = tflag;
				tracki.vflag = vflag;
				tracki.hrflag = hrflag;
				tracki.cadflag = cadflag;
				gpxdaten.tracks.hflag |= hflag;
				gpxdaten.tracks.tflag |= tflag;
				gpxdaten.tracks.vflag |= vflag;
				gpxdaten.tracks.hrflag |= hrflag;
				gpxdaten.tracks.cadflag |= cadflag;
				gpxdaten.tracks.hflagall &= hflag;
				gpxdaten.tracks.tflagall &= tflag;
				gpxdaten.tracks.vflagall &= vflag;
				gpxdaten.tracks.hrflagall &= hrflag;
				gpxdaten.tracks.cadflagall &= cadflag;
				gpxdaten.tracks.track.push(tracki);
				gpxdaten.tracks.laenge += Math.round(tracklen*10)/10;
			}
		}
		gpxdaten.tracks.anzahl = gpxdaten.tracks.track.length;
		gpxdaten.tracks.t0 = gpxdaten.tracks.anzahl ? gpxdaten.tracks.track[0].t0 : 0;
		
		// Routen
		var rte = xml.documentElement.getElementsByTagName("rte"); 
		JB.Debug_Info(id,rte.length +" Routen gefunden",false);
		if(JB.gc.gpxrouten) for(var j=0;j<rte.length;j++) {
			rnr++;
			var rtej = rte[j];
			var rtepts = rtej.getElementsByTagName("rtept");
			JB.Debug_Info(id,rtepts.length +" Zwischenziele gefunden",false);
			var routei = { laenge:0, farbe:JB.gc.rcols[rnr%JB.gc.rcols.length] };
			var routlen = 0;
			routei.name = getTag(rtej,"name","Route "+j,true);
			routei.cmt = getTag(rtej,"cmt","",true);
			routei.desc = getTag(rtej,"desc","",true);
			routei.link = getLink(rtej,"",true);
			routei.latmin=1000;routei.latmax=-1000;
			routei.lonmin=1000;routei.lonmax=-1000;
			var daten = [];
			for(var i=0;i<rtepts.length;i++) { // Zwischenziele
				var rteptsi = rtepts[i];
				var lat = parseFloat(rteptsi.getAttribute("lat"));
				var lon = parseFloat(rteptsi.getAttribute("lon"));
				if(i==0) JB.entf.init(lat,lon,0.0) ;
				else     routlen += JB.entf.rechne(lat,lon,0.0)*JB.gc.wfaktor;      
				if(!usegpxbounds) {
					if(lat<latmin) latmin=lat; if(lat>latmax) latmax=lat;
					if(lon<lonmin) lonmin=lon; if(lon>lonmax) lonmax=lon;
				}
				if(lat<routei.latmin) routei.latmin=lat; if(lat>routei.latmax) routei.latmax=lat;
				if(lon<routei.lonmin) routei.lonmin=lon; if(lon>routei.lonmax) routei.lonmax=lon;
				daten.push({lat:lat,lon:lon});
				var rpts = rteptsi.getElementsByTagName("rpt"); // Routenpunkte
				if(rpts.length>0) JB.Debug_Info(id,rpts.length +" Routenpunkte (Garmin) gefunden",false);
				for(var k=0;k<rpts.length;k++) {
					var rptsk = rpts[k];
					var lat = parseFloat(rptsk.getAttribute("lat"));
					var lon = parseFloat(rptsk.getAttribute("lon"));
					routlen += JB.entf.rechne(lat,lon,0.0)*JB.gc.wfaktor;
					if(!usegpxbounds) {
						if(lat<latmin) latmin=lat; if(lat>latmax) latmax=lat;
						if(lon<lonmin) lonmin=lon; if(lon>lonmax) lonmax=lon;
					}
					daten.push({lat:lat,lon:lon});
				}
			}
			routei.daten = daten;
			routei.laenge = Math.round(routlen*10)/10;
			gpxdaten.routen.route.push(routei);
			gpxdaten.routen.laenge += Math.round(routlen*10)/10;
		}
		gpxdaten.routen.anzahl = gpxdaten.routen.route.length;
		
		// Waypoints
		var wpts = xml.documentElement.getElementsByTagName("wpt"); 
		JB.Debug_Info(id,wpts.length +" Wegpunkte gefunden",false);
		if(JB.gc.gpxwegpunkte) for(var i=0;i<wpts.length;i++) { // Wegpunktdaten
			var wpt = wpts[i];
			var lat = parseFloat(wpt.getAttribute("lat"));
			var lon = parseFloat(wpt.getAttribute("lon"));
			if(!usegpxbounds) {
				if(lat<latmin) latmin=lat; if(lat>latmax) latmax=lat;
				if(lon<lonmin) lonmin=lon; if(lon>lonmax) lonmax=lon;
			}
			var waypoint = {};
			waypoint.lat = lat;
			waypoint.lon = lon;
			waypoint.name = getTag(wpt,"name","",false);
			waypoint.cmt = getTag(wpt,"cmt","",false);
			waypoint.desc = getTag(wpt,"desc","",false);
			waypoint.link = getLink(wpt,"",false);
			waypoint.sym = getTag(wpt,"sym","default",false);
			waypoint.time = utc2sec(getTag(wpt,"time","1980-01-01T12:00:00Z",false));
			gpxdaten.wegpunkte.wegpunkt.push(waypoint);
		}
		gpxdaten.wegpunkte.anzahl = gpxdaten.wegpunkte.wegpunkt.length;
		gpxdaten.latmin = latmin;
		gpxdaten.latmax = latmax;
		gpxdaten.lonmin = lonmin;
		gpxdaten.lonmax = lonmax;
		return gpxdaten
	} // parseGPX

	function lpgpxResponse(response,status) {
		if(status == 200 || status == 0) 
			gpxdaten = parseGPX(xmlParse(response.asciidata),gpxdaten,id,fnr);
		else 
			JB.Debug_Info(id,fns[fnr].name+" konnte nicht gelesen werden",true);
		if(fns[++fnr]) {
			JB.Debug_Info(id,fns[fnr].name,false);
			JB.loadFile(fns[fnr],"a",lpgpxResponse);
		}
		else {
			callback(gpxdaten);
		}
	} // lpgpxResponse
	JB.Debug_Info(id,fns[fnr].name,false);
	window.requestAnimationFrame(function() { JB.loadFile(fns[fnr],"a",lpgpxResponse); });
} // JB.lpgpx
// Ende lpgpx.js

JB.LoadScript = function(url,callback) {
	var scr = document.createElement('script');
	scr.type = "text/javascript";
	scr.async = "async";
	if(typeof(callback)=="function") {
		scr.onloadDone = false;
		scr.onload = function() { 
			if ( !scr.onloadDone ) {
				scr.onloadDone = true;
				JB.Debug_Info(url,"loaded",false);
				callback(); 
			}
		};
		scr.onreadystatechange = function() { 
			if ( ( "loaded" === scr.readyState || "complete" === scr.readyState ) && !scr.onloadDone ) {
				scr.onloadDone = true; 
				JB.Debug_Info(url,"ready",false);
				callback();
			}
		}
	}
	scr.onerror = function() {
		JB.Debug_Info(url,"Konnte nicht geladen werden.",false);
	}
	scr.src = url;
	document.getElementsByTagName('head')[0].appendChild(scr);
} // LoadScript

JB.LoadCSS = function(url) {
	var l = document.createElement("link");
	l.type = "text/css";
	l.rel = "stylesheet";
	l.href = url;
	document.getElementsByTagName("head")[0].appendChild(l);
	JB.Debug_Info(url,"load",false);
	l.onerror = function() {
		JB.Debug_Info(url,"Konnte nicht geladen werden.",false);
	}
} // LoadCSS

JB.onresize = function(ele,callback) {
	var w = ele.offsetWidth;
	var h = ele.offsetHeight;
	return window.setInterval(function() {
		var ww = ele.offsetWidth;
		var hh = ele.offsetHeight;
		if(w != ww || h != hh) {
			w = ww;
			h = hh;
			callback(w,h);
		}
	},200);
} // onresize

JB.offresize = function(id) {
	window.clearInterval(id);
} // offresize

JB.farbtafel = function(n) {
	var gauss = function(a,hwb,pos,x) {
		var t = (x-pos)/hwb;
		return Math.round(a*Math.exp(-t*t));
	}
	var tafel = [],r,g,b,i,n2=n*n;
	for(i=0;i<n;i++) {
		b = gauss(255,n/3,0.25*n,i); // + gauss(220,n/15,1.00*n,i);
		g = gauss(255,n/3,0.50*n,i); // + gauss(220,n/15,1.00*n,i);
		r = gauss(255,n/3,0.75*n,i); // + gauss(200,n/15,1.00*n,i);
		r = Math.min(255,r);
		g = Math.min(255,g);
		b = Math.min(255,b);
		tafel.push("rgb("+r+","+g+","+b+")");
	}
	return tafel;
} // farbtafel

JB.farbtafel_bipolar = function() {
	var tafel = [],r,g,b,i;
	for(i=0;i<255;i++) {
		g = 255;
		r = i;
		b = 0;//i;
		tafel.push("rgb("+r+","+g+","+b+")");
	}
	for(i=0;i<255;i++) {
		r = 255;
		g = 255 - i;
		b = 0;//255 - i;
		tafel.push("rgb("+r+","+g+","+b+")");
	}
	return tafel;
} // farbtafel_bipolar

JB.addClass = function(classname,element) {
	if(element.classList) element.classList.add(classname);
	else {
		var cn = element.className;
		if(cn.indexOf(classname)!=-1) {
			return;
		}
		if(cn!='') {
			classname = ' '+classname;
		}
		element.className = cn+classname;
	}
} // addClass
			
JB.removeClass = function(classname,element) {
	if(element.classList) element.classList.remove(classname);
	else {
		var cn = element.className;
		var rxp = new RegExp("\\s?\\b"+classname+"\\b","g");
		cn = cn.replace(rxp,'');
		element.className = cn;
	}
}	// removeClass		

JB.getRect = function (o) {
	var r = { top:0, left:0, width:0, height:0 };
	if(!o) return r;
	else if(typeof o == 'string' ) o = document.getElementById(o);
	if(typeof o != 'object') return r;
	if(typeof o.offsetTop != 'undefined') {
		r.height = o.offsetHeight;
		r.width = o.offsetWidth;
		r.left = r.top = 0;
		while (o && o.tagName != 'BODY') {
			r.top  += parseInt( o.offsetTop );
			r.left += parseInt( o.offsetLeft );
			o = o.offsetParent;
		}
	}
	return r;
} // getRect

JB.gmcb = function() {
	JB.Scripte.googlemaps = 2;
	JB.Debug_Info("Start","maps.google.com/maps/api/js?libraries=geometry&callback=JB.gmcb",false);
} // gmcb

JB.GPX2GM.start = function() {
	JB.Debug_Info("","GPXViewer "+JB.GPX2GM.ver+" vom "+JB.GPX2GM.dat,false);
	if(!JB.debuginfo && typeof(console) != "undefined" && typeof(console.log) == "function" )
		console.log("GPXViewer "+JB.GPX2GM.ver+" vom "+JB.GPX2GM.dat);
	JB.LoadCSS(JB.GPX2GM.Path+"GPX2GM.css");
	JB.LoadScript(JB.GPX2GM.Path+"GPX2GM_Defs.js", function() { 
		var gmurl = "https://maps.google.com/maps/api/js?libraries=geometry&callback=JB.gmcb";
		if(JB.GPX2GM.GM_Api_key && (location.protocol=="https:" || location.protocol=="http:")) gmurl += "&key="+JB.GPX2GM.GM_Api_key;
		if(document.documentElement.hasAttribute("lang") && document.documentElement.getAttribute("lang")!="de") gmurl += "&language=en";
		JB.LoadScript(gmurl, function() {});
		JB.setgc();
		JB.Scripte.GPX2GM_Defs = 2;
		JB.Scripte.gmutils = 1;
		JB.LoadScript(JB.GPX2GM.Path+"gmutils.js", function() { JB.Scripte.gmutils = 2; } );
		JB.icons = new JB.Icons(JB.GPX2GM.Path);
		JB.Debug_Info("Start","Icons vorbereitet",false);
		var Map_Nr=0;
		var divs = document.querySelectorAll("div[class*='gpxview:'],figure[class*='gpxview:']");
		var typ = undefined;
		var maps=[];
		for(var i=0;i<divs.length;i++) {
			var div = divs[i];
			var Klasse = div.className;
			var CN = Klasse.search(/(^|\s)gpxview/i);
			if(div.id) var Id = div.id;
			else {
				var Id = "map"+(Map_Nr++);
				div.id = Id;
			}
			var GPX = Klasse.substring(CN).split()[0];
			if(GPX.search(";")>=0 && JB.gc.dateitrenner != ";") GPX = GPX.split(";");    
			else GPX = GPX.split(":");                     
			if(GPX.length==3) {
				typ = GPX[2];
			}
			maps["Karte_"+Id] = div.makeMap = new JB.makeMap(Id);
			maps["Karte_"+Id].ShowGPX(GPX[1].split(JB.gc.dateitrenner),typ);
		}
		var buttons = document.querySelectorAll("button[class*='gpxview:']");
		for(var i=0;i<buttons.length;i++) {
			var button = buttons[i];
			var Klasse = button.className;
			var CN = Klasse.search(/gpxview:/i); 
			var cmd = Klasse.substring(CN).split(" ")[0];
			if(cmd.search(";")>=0 && JB.gc.dateitrenner != ";") cmd = cmd.split(";") ;
			else cmd = cmd.split(":") ;
			if(cmd.length>2) {
				var Id = cmd[1];
				switch(cmd[2]) {
					case "skaliere":
						( function() {
							var mapid = "Karte_"+Id;
							if(cmd.length == 3) 
								button.onclick = function(){maps[mapid].Rescale()};
							else if(cmd.length == 4) {
								var pars = cmd[3].split(",");
								button.onclick = function(){maps[mapid].Rescale(pars[0],pars[1],pars[2])};
							}
						} )();
						break;
					case "lade":
						if(cmd.length>3) {
							if(cmd.length>4) typ = cmd[4];
							else typ = ""; //undefined;
							( function() {
								var fn = cmd[3].split(JB.gc.dateitrenner);
								var mapid = "Karte_"+Id;
								var tp = typ;
								button.onclick = function(){maps[mapid].ShowGPX(fn,tp)};
							} )();
						}
						break;
					default:
						break;
				}
			}
		}
		var selects = document.querySelectorAll("select[class^='gpxview']");
		for(var i=0;i<selects.length;i++) {
			var select = selects[i];
			select.onchange = function() {
				var cmd = this.options[this.options.selectedIndex].value.split(":");
				if(cmd.length<2) return;
				if(cmd.length<3) cmd[2] = ""; //undefined;
				maps["Karte_"+cmd[0]].ShowGPX(cmd[1].split(JB.gc.dateitrenner),cmd[2]);
			}
		}
	}); // JB.LoadScript("GPX2GM_Defs.js")
} // JB.GPX2GM.start

if(JB.GPX2GM.autoload) {
	if(window.addEventListener) {
		window.addEventListener("DOMContentLoaded",JB.GPX2GM.start,false);
	}
	else {
		window.onload = function() { 
			document.querySelectorAll("div[class*='gpxview:'],figure[class*='gpxview:']")[0].innerHTML = "<p style='font-weight:bold;padding:2em;text-align:center;background-color:#fb5'>Leider wird Ihr Browser vom GPX-Viewer nicht mehr unterstützt.</p>";
			console.error("Leider wird Ihr Browser vom GPX-Viewer nicht mehr unterstützt.");
		}
	}
}
