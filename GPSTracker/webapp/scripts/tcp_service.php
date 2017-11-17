<?php
// TCP/IP functions for GPStracker
// ===============================
//
// Author: C.Zeitnitz 2017
//

define("USE_GO_SERVER",true);

function checkTCP_UDP_Service() {
	global $startTCPUDPserver;
	$isRunning = controlTCPService("STATUS") === true;
	if($startTCPUDPserver && !$isRunning) return controlTCPService("START");
	if(!$startTCPUDPserver && $isRunning) return controlTCPService("STOP");
	return true;
}

// possible actions: "START", "STOP", "STATUS" of server
function controlTCPService($action) {
	global	$TCPBridge, $TCPport, $HTTPSserver, $secretkey, $urlpath;
	if($action === "START") {
		$logfile=dirname($TCPBridge)."/log.txt";
		if(USE_GO_SERVER) 	exec("nohup $TCPBridge -port $TCPport -httpserver $HTTPSserver -urlpath $urlpath -key $secretkey > $logfile &");
		else 				exec("nohup $TCPBridge $TCPport $HTTPSserver $urlpath $secretkey &> $logfile 2>&1 &");
		sleep(2);	// wait for service to start
		$action = "STATUS";	// check status after start
	}	
	// create socket and connect to localhost
	if(($socket=@socket_create(AF_INET, SOCK_STREAM, SOL_TCP))=== false || 
	    @socket_set_option($socket,SOL_SOCKET, SO_RCVTIMEO, array("sec"=>2, "usec"=>0)) === false ||
	   ($isConnected = @socket_connect($socket, "localhost", $TCPport)) === false && $action==="STATUS") 
			return "TCP service not running/not started";
	if($isConnected === false && $action === "STOP") return true;
	$cmd= $action === "STATUS" ? "status ".$secretkey." " : "exit ".$secretkey." ";
	@socket_write($socket, $cmd);
	$response = @socket_read($socket,20);
	@socket_close($socket);
	return $response === "OK";
}

?>