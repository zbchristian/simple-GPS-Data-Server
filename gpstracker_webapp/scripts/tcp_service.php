<?php
// TCP/IP functions for GPStracker
// ===============================
//
// Author: C.Zeitnitz 2017
//

function checkTCPService() {
	// check if service is needed and start/stop if neede (only if devices with IMEI exist) 
	$needService = imei_exists_db();
	$isRunning = controlTCPService("STATUS") === true;
	if($needService && !$isRunning) return controlTCPService("START");
	if(!$needService && $isRunning) return controlTCPService("STOP");
	return true;
}

// possible actions: "START", "STOP", "STATUS"
function controlTCPService($action) {
	global	$TCPBridge, $TCPport, $secretkey;
	if($action === "START") {
		$logfile=dirname($TCPBridge)."/log.txt";
		exec("nohup $TCPBridge >> $logfile 2>&1 &",$out);
		if(!is_array($out) || (int)$out[0] <= 0) return "Failed to start TCP service";	// check if PID > 0 
		sleep(2);
		$action = "STATUS";	// check status after start
	}
	if(($socket=socket_create(AF_INET, SOCK_STREAM, SOL_TCP))=== false || 
	   ($isConnected = socket_connect($socket, "localhost", $TCPport)) === false && $action==="STATUS") return "TCP service not running/not started";
	if($isConnected === false && $action === "STOP") return true;
	$cmd= $action === "STATUS" ? "status ".$secretkey : "close ".$secretkey;
	socket_write($socket, $cmd, strlen($cmd));
	$response = socket_read($socket,10);
	socket_close($socket);
	return $response === "OK";
}

?>