<?php
// GPStracker function to display webpages
// =======================================
// - read templates from html directory
// - replace placeholder strings (%...%) with current values
// - show the page
//
// Author: C.Zeitnitz 2017
//

function display_admin($devlist,$vals) {
	global $prog,$relpath,$error,$TCPport;
	$isError = !empty($error);
        $fhtml=$relpath."/html/admin_html.template";
        if(!file_exists($fhtml)) die("<h2>HTML template missing</h2>");
	$isEdit=$isEditRetry=false;
	if (isset($vals["admin_device"]) &&  isset($vals["devno"]) ) {
		$isEdit=$vals["admin_device"]=="edit" || $vals["admin_device"]=="change";
	}
	$isEditRetry = $isError && $isEdit;
        $html=file_get_contents($fhtml);
        $html = str_replace("%PAGETITLE%","$prog",$html);
	$url=parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
	$url=preg_replace('/\/+/','/',$url);
	$html = str_replace("%URL%","$url",$html);
	$devno=0;
	$mode = $isEdit ? "change" : "add";
	if($isEdit && !$isEditRetry && ($dev=retrieve_device_db("devno",$vals["devno"])) !== false) {
		$name = isset($dev["name"]) ? $dev["name"] : "";
		$id   = isset($dev["id"])   ? $dev["id"] : "";
		$imei = isset($dev["imei"]) ? $dev["imei"] : 30;
		$desc = isset($dev["desc"]) ? $dev["desc"] : "";
		$hist = isset($dev["history"]) ? $dev["history"] : 30;
		$devno =  $vals["devno"];
	}
	else {
		$name = $isError && isset($vals["name"]) ? $vals["name"] : "";
		$id   = $isError && isset($vals["id"])   ? $vals["id"]   : "";
		$imei = $isError && isset($vals["imei"])   ? $vals["imei"]   : "";
		$desc = $isError && isset($vals["desc"]) ? $vals["desc"] : "";
		$hist = $isError && isset($vals["history"]) ? $vals["history"] : 30;
		$devno = !$isEditRetry ? 0 : $vals["devno"];
	}
	$html = str_replace("%MODE%",$mode,$html);
	$html = str_replace("%DEVNO%",$devno,$html);
	$html = str_replace("%NAME%",$name,$html);
	$html = str_replace("%ID%",$id,$html);
	$html = str_replace("%IMEI%",$imei,$html);
	$html = str_replace("%TCPPORT%",$TCPport,$html);
	$html = str_replace("%DESC%",$desc,$html);
	$html = str_replace("%HISTORY%",$hist,$html);
	$newtitle = !$isError ? "New device" : $error;
	$newtitle = $isEdit && !$isEditRetry ? "Admin device" : $newtitle;
	$html = str_replace("%NEWDEVICE%",$newtitle,$html);
	$buttontxt = !$isEdit ? "add new device" : "change settings";
	$html = str_replace("%CHANGEBUTTONTXT%",$buttontxt,$html);
	$buttons = "";
	if($isEdit) {
		$buttons = '<a class="but" href="'.$url.'?admin_device=clear&devno='.$devno.'">clear data</a>&nbsp;&nbsp; <a class="but" href="'.$url.'?admin_device=delete&devno='.$devno.'">remove device</a>';
	}
	$html = str_replace("%ADMINBUTTONS%",$buttons,$html);
	$devtable='<table><tr><th style="width:5%;"></th><th style="width:20%;">Name</th><th style="width:15%;">ID</th><th style="width:35%;">Description</th><th style="width:10%;">Days</th><th style="width:15%;">IMEI (TCP/UDP only)</th></tr>';
	foreach($devlist as $dev) {
		$devtable .='<tr>';
//		$devtable .='<td><form action="'.$url.'"><input type="hidden" name="edit"><input type="hidden" name="id" value="'.$dev["id"].'"><input type="submit" value="edit"></form></td>';
		$devtable .='<td><a class="but" href="'.$url.'?admin_device=edit&devno='.$dev["devno"].'">edit</a></td>';
		$devtable .='<td>'.$dev["name"].'</td><td>'.$dev["id"].'</td><td>'.$dev["desc"].'</td><td>'.$dev["history"].'</td><td>'.$dev["imei"].'</td>';
		$devtable .='</tr>';
	}
	$devtable .="</table>\n";
	$html = str_replace("%DEVICELIST%",$devtable,$html);
	echo $html;
}

function display_confirm($dev,$mode) {
        global $prog,$relpath;
        $fhtml=$relpath."/html/confirm_html.template";
        if(!file_exists($fhtml)) die("<h2>HTML template missing</h2>");
        $html=file_get_contents($fhtml);
        $html = str_replace("%PAGETITLE%","$prog",$html);
        $url=parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
        $url=preg_replace('/\/+/','/',$url);
        $html = str_replace("%URL%","$url",$html);
        $html = str_replace("%MODE%","$mode",$html);
        $html = str_replace("%DEVNO%",$dev["devno"],$html);
	if(($dev=retrieve_device_db("devno",$dev["devno"])) !== false) {
		$txt = $mode==="delete" ? 'Delete the device "'.$dev["name"].'"?' : 'Clear all GPS data of device "'.$dev["name"].'"?';
		$html = str_replace("%CONFIRMQUESTION%","$txt",$html);
		echo $html;
		die();
	}
}

function display_id_input() {
	global $prog;
        $fhtml="html/getid_html.template";
        if(!file_exists($fhtml)) die("<h2>HTML template missing</h2>");
        $html=file_get_contents($fhtml);
        $html = str_replace("%PAGETITLE%","$prog",$html);
	$url=parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
        $url=preg_replace('/\/+/','/',$url);
	$html = str_replace("%URL%","$url",$html);
	echo $html;
}

function display_gpx($devno,$gpx, $gps) {
	global $tmp, $prog,$timezone,$error,$date_fmt,$mapstyle;
	$isError=!empty($error);
	list($name,$namenb)=get_devname_db($devno); 
	if($name === false) return array();
	$fname = "$tmp/$namenb.gpx";
        $dev = retrieve_device_db("devno",$devno);
	$desc = $dev !== false &&  isset($dev["desc"]) ? $dev["desc"] : "";
	$devid = $dev !== false &&  isset($dev["id"]) ? $dev["id"] : 0;
	if(!$isError && !file_put_contents("$fname",$gpx)) die("<h2>Error creating GPX file</h2>");
	if($isError) touch($fname);
	$fhtml="html/gpxviewer_html.template";
	if(!file_exists($fhtml)) die("<h2>HTML template missing</h2>");
        date_default_timezone_set($timezone);
        $tstart = !$isError ? date($date_fmt,strtotime($gps[0]["startdate"])) : date($date_fmt,strtotime($gps[0]["query_startdate"]));
        $tend = !$isError ? date($date_fmt,strtotime($gps[0]["enddate"])) : date($date_fmt,strtotime($gps[0]["query_enddate"]));
	$html=file_get_contents($fhtml);
	$html = str_replace("%PAGETITLE%","$prog",$html);
	$html = str_replace("%DEVICE%","$name",$html);
	$html = str_replace("%DEVICEDESC%","<p>Details of device: $desc</p>",$html);
	$html = str_replace("%STARTDATE%","$tstart",$html);
	$html = str_replace("%ENDDATE%","$tend",$html);
	if($isError) 	$html = str_replace("%GPXFILE%","",$html);
	else 		$html = str_replace("%GPXFILE%","$fname",$html);
	$gpxurl=!$isError ? $_SERVER["REQUEST_URI"]."&gpx" : "";
	$html = str_replace("%LINKTOGPX%","$gpxurl",$html);
	$url=parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
	$html = str_replace("%URL%","$url",$html);
	$html = str_replace("%DEVID%","$devid",$html);
	$date = date($date_fmt, strtotime($gps[0]["date"]));
	$html = str_replace("%DATE%","$date",$html);
	$dt = $gps[0]["dt"];
	if($dt%60 == 0) {
		$dt /= 60;
		if($dt%24 == 0) {
			$dt /=24;
			$dt .="d";	// days
		}
		else $dt .= "h"; //hours

	}
	else $dt .="m"; //  minutes
	$html = str_replace("%TRANGE%",$dt,$html);
	if($isError) $html = str_replace("%ERROR%","<h2>$error</h2>",$html);
	else $html = str_replace("%ERROR%","",$html);
	$html = str_replace("%MAPSTYLE%",$mapstyle,$html);
	echo $html;
}

function download_gpx($devno,$gpx) {
	global $tmp;
	if(count($gpx)==0) die();
	list($name,$namenb)=get_devname_db($devno); 
        header("Content-type: application/gpx+xml");
        header('Content-Disposition: attachment; filename="'.$namenb.'.gpx"');
        header("Content-Length: " . strlen($gpx));
        echo $gpx;
	die();
}

?>

