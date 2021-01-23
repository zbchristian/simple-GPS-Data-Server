<?php
// Extra Simple GPS data server
// ============================
// Format of URL
// Store GPS location: ?time=%UTC&lat=LATITUDE&lon=LONGITUDE&alt=ALTITUDE&acc=ACCURACY&id=DEVICEID
// or                  ?id=DEVICEID&gprmc=<GPRMC-RECORD>
// or                  ?timestamp=%TIMESTAMP&lat=LATITUDE&lon=LONGITUDE&altitude=ALTITUDE&accuracy=ACCURACY&id=DEVICEID
// Retrieve locations as GPX file: ?id=DEVICE_IDENTIFICATION&dt=TIMEINTHEPAST&DATE=ENDDATETIME
// DEVICEID (defines in config.php) relates to the device name
//
// Author: C.Zeitnitz 2017
//

include "scripts/config.php";
include "scripts/webpages.php";
include "scripts/utils.php";
include "scripts/db.php";
include "scripts/tcp_service.php";

//var_dump($_GET);
$inputs = filter_GET_inputs(); // filter all quotes and some characters from keys and values
if(isset($inputs["checkserver"]) && $inputs["checkserver"]==$secretkey ) {
	checkTCP_UDP_Service();
	exit();
}
if(isset($inputs["gprmc"])) $inputs=convert_GPRMC_data($inputs);
// var_dump($inputs);

$inputs= replace_alternative_var_names($inputs); // accept alternative names for time, alt, acc etc.

$dev=false;
// valid device requested
$devno=isset($inputs["id"]) && (($dev=retrieve_device_db("id",$inputs["id"],false))!== false) && isset($dev["devno"]) ? $dev["devno"] : false;
if($devno === false)
	$devno=isset($inputs["imei"]) && (($dev=retrieve_device_db("imei",$inputs["imei"],false))!== false) && isset($dev["devno"]) ? $dev["devno"] : false;
if($devno === false) {
	if(isset($inputs["imei"])) {
		echo $inputs["imei"]." REJECTED";
		exit();	
	}
	display_id_input();
	if($dev===false) sleep(10);
	exit();
}

// check if data coming in or retrieval of gpx data?
if(isset($inputs["lat"]) ) {
// store gps location in DB
//	echo "<br>Received location for $devname<br>";
	$parnames = array("lat","lon","alt","acc","time","spd");	// parameters to store in DB
	$gps=array();
	foreach($parnames as $par) if(array_key_exists($par,$inputs)) 	$gps[$par]=$inputs[$par];
	$gps["devno"]=$devno;
	$gps["tstored"]=date("Y-m-d H:i:s");
	if(isset($inputs["imei"])) $devno = $inputs["imei"];
	if(isset($inputs["id"])) $devno = $inputs["id"];
	if(insert_gps_db($gps)) echo "$devno OK";
	else			echo "$devno FAILED";
	cleanup_GPS_data();
	checkTCP_UDP_Service();
}
else { // display/retrieve GPX file for given device and time range
	cleanup_GPS_data();
//	echo "<br>Retrieve stored locations for $devname<br>";
	$dt="24h";
	if(isset($inputs["dt"])) 	$dt=$inputs["dt"];
	$dt=timerange2minutes($dt);
	$date=correctDate($inputs);
	if($date > ($d=date("Y-m-d H:i:s"))) $date = $d;
	$gps=retrieve_gps_db($devno,$date,$dt);
	if(count($gps) == 0 || $gps[0]["n"] == 0) $error="No data available";
	$gps[0]["date"] = $date;
	$gps[0]["dt"] = $dt;
	cleanup_temp();
	// get start and end of track in local time
	if(($gpx = create_gpx_data($devno,$gps)) === false) die("<h2>Error creating GPX</h2>");
	if(isset($inputs["gpx"])) download_gpx($devno,$gpx);
	else display_gpx($devno,$gpx,$gps);
	checkTCP_UDP_Service();
}
?>
