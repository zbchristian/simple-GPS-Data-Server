<?php
// GPStracker device administation script
// ======================================
// - should be protected by webserver login  (e.g. .htaccess) 
//
// Author: C.Zeitnitz 2017
//
$relpath="../";
include "$relpath/scripts/config.php";
include "$relpath/scripts/webpages.php";
include "$relpath/scripts/utils.php";
include "$relpath/scripts/db.php";
include "$relpath/scripts/tcp_service.php";

$inputs=filter_GET_inputs();
if(isset($inputs["devno"])) $inputs["devno"] = filter_devno($inputs["devno"]);
if(isset($inputs["id"])) $inputs["id"] = filter_ident($inputs["id"]);
if(isset($inputs["imei"]) && !empty($inputs["imei"])) {
	$imei = filter_imei($inputs["imei"]);
	$inputs["imei"] = $imei !== false ? $imei : "";
}
// var_dump($inputs);
if(isset($inputs["admin_device"]) ) {
	if(in_array($inputs["admin_device"],array("add","change","clear","delete")) ) {
		$dev["name"]  = isset($inputs["name"])  ?  $inputs["name"]  : "";
		$dev["id"]    = isset($inputs["id"])    ?  $inputs["id"]    : "";
		$dev["imei"]  = isset($inputs["imei"])  ?  $inputs["imei"]  : "";
		$dev["desc"]  = isset($inputs["desc"])  ?  $inputs["desc"]  : "";
		$dev["devno"] = isset($inputs["devno"]) ?  $inputs["devno"] : 0;
		$dev["history"] = isset($inputs["history"]) ?  $inputs["history"] : -1;
		if(in_array($inputs["admin_device"],array("clear","delete")) && !isset($inputs["confirmed"]) )
			display_confirm($dev,$inputs["admin_device"]);
		else if(($err=handle_device_db($dev,$inputs["admin_device"])) !== true || ($err=checkTCPService()) !== true)
			$error = "<h2>$err</h2>";
	}
}
$devlist=retrieve_devicelist_db();
display_admin($devlist,$inputs);
?>
