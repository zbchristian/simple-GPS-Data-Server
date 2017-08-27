<?php

//timezone
$timezone="Europe/Berlin";

// map style -  google: "Karte" or "Satellit" or "Hybrid"; openstreetmap: "OSM" or "OSMDE" or "OSM_Cycle"
// GOOGLE and OSM_Cycle require an API key in the script js/GM_Utils/GPX2GM_Defs.js

$mapstyle="OSMDE";

// date format to use for webpage
$date_fmt="d.m.y H:i"; // european
//$date_fmt="m/d/y H:i";	 // US style

$SplitTrackSec=300;	// min. seconds to determine stop and create new track

$prog="Simple GPS data server";
$tmp="temp";	// temp directory to store gpx files

// some initializations
$error="";
$relpath=".";

setlocale(LC_ALL,"en_US.UTF-8");
?>
