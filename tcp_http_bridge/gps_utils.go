// utils to filter message from GPS device received from TCP port and create openGTS HTTP request (GPRMC record)
// =============================================================================================================
// input: raw tcp string
// output: response for TCP-client, query string for HTTP request, error code
// 
package main

import (
        "fmt"
		"regexp"
		"errors"
		"strconv"
		"math"
		"net/url"
)

type devtype int
const (
	TK103B_CZ 	devtype = iota
	TK103 		devtype = iota
	GL103 		devtype = iota
)

const (	
	NONE 	int = iota
	DEVID	int = iota
	TIME	int = iota
	ACTIVE	int = iota
	LAT		int = iota
	LON		int = iota
	NS		int = iota
	EW		int = iota
	SPEED	int = iota
	ANGLE	int = iota
	DATE	int = iota
	ALT		int = iota
	ACC		int = iota
	DEGMIN	int = iota
	KMPERH 	int = iota
	MPERS 	int = iota
	KNOTS	int = iota
	DEGREE 	int = iota
	HEAD	int = iota
	CHECK 	int = iota
	MAGN 	int = iota
)

type ReqRespPat struct { // regular expressions describing the message + response
	msg 	string
	resp 	string
	msgRegexp *regexp.Regexp
}

type devPattern struct {
	device 		string		// device name/imei 
	Type		devtype		// one of the DEVTYPE values
	login 		ReqRespPat
	heartbeat	ReqRespPat
	gps_data	ReqRespPat 
	order		[]int		// define the order of the incoming parameters. List in above GPSDATA enum
	units		[]int		// for unit conversion provide unit of parameter (enum UNITS)
} 

// 

var devs = []devPattern {
// ------------  TK103_CZ
		devPattern {device:"TK103B - NOT typical for TK103", Type:TK103B_CZ,
			login: ReqRespPat{msg:"", resp:"",msgRegexp:nil},
			//example heartbeat: *HQ,355488020824039,XT,V,0,0#
			//                               IMEI
			heartbeat: ReqRespPat{msg:"^\\*\\w{2},(\\d{15}),XT,[V|A]*,([0-9]+),([0-9]+)#.*$", resp:""},
			//example data: *HQ,355488020824039,V1,114839,A,   5123.85516,N,  00703.64046,E,  0.03,  0,    010917,EFE7FBFF#
			//                  imei               time   A/V  lat        N/S long        E/W speed  angle date   Status bits
			gps_data: ReqRespPat{msg:"^\\*\\w{2},([0-9]{15}),V1,([0-9]{6}),([A|V]*),([0-9.]+),([N|S]),([0-9.]+),([E|W]),([0-9.]+),([0-9.]+),([0-9]{6}),([\\w0-9]+)#.*$", resp:""},
			order: []int{DEVID,TIME,ACTIVE,LAT,NS,LON,EW,SPEED,ANGLE,DATE},
			units: []int{NONE,NONE,NONE,DEGMIN,NONE,DEGMIN,NONE,KMPERH,DEGREE,NONE,NONE},
		},
	}
// ------------ TK103
//	{.device="TK103-untested and incomplete", .type=TK103,
//	 .login 	= {.msg="^\\((\\d{12})(BP05)([A-Z0-9.]*)\\).*$", .resp="%DATE%%TIME%AP05HSO"},
//	 .heartbeat 	= {.msg=NULL, .resp=NULL},
//	 .gps_data	= {.msg="^\\((\\d{12})(B[A-Z]\\d{2})([A-Z0-9.]*)\\).*$", .resp=NULL},
//	 .order         = {DEVID},
//	 .units		= {NONE}},

// ----------- GL103
//	{.device="GL103-untested and incomplete", .type=GL103,
//	 .login 	= {.msg="^##,imei:(\\d+),A;.*$", .resp="LOAD"},
//	 .heartbeat 	= {.msg="^imei:(\\d+);.*$", .resp="ON"},
//	 .gps_data	= {.msg="^imei:(\\d+),(\\d+|A),?(\\d*),?(\\d+),?([a-z0-9,%.]+);.*$", .resp=NULL},
//	 .order         = {DEVID},
//	 .units		= {NONE}}
//};

func filter_gps_device(msg string) (response string, query string, err error) {
	response = ""
	query = ""
	err = nil

	// try to match msg to one of the knows devices
	id := 0
	isLogin := false
	isHeart := false
	isData := false
	var matchedStrings []string
	for i:=0; i<len(devs); i++ {
		dev := devs[i];
		id = i;
		nmatch := 0
		if len(dev.login.msg)>0	{
			if dev.login.msgRegexp == nil { dev.login.msgRegexp = regexp.MustCompile(dev.login.msg) }
			matchedStrings = dev.login.msgRegexp.FindStringSubmatch(msg)
			if nmatch=len(matchedStrings); nmatch > 2 {
				isLogin = true
				response = dev.login.resp
				break
			}
		}
		if len(dev.heartbeat.msg)>0	{
			if dev.heartbeat.msgRegexp == nil { dev.heartbeat.msgRegexp = regexp.MustCompile(dev.heartbeat.msg) }
			matchedStrings = dev.heartbeat.msgRegexp.FindStringSubmatch(msg)
			if nmatch=len(matchedStrings); nmatch > 2 {
				isHeart = true
				response = dev.heartbeat.resp
				break
			}
		}
		if len(dev.gps_data.msg)>0	{
			if dev.gps_data.msgRegexp == nil { dev.gps_data.msgRegexp = regexp.MustCompile(dev.gps_data.msg) }
			matchedStrings = dev.gps_data.msgRegexp.FindStringSubmatch(msg)
			if nmatch=len(matchedStrings); nmatch > 2 {
				isData = true
				response = dev.gps_data.resp
				break
			}
		}
	}
//	fmt.Println(matchedStrings)
	if isLogin || isHeart || isData {
		logger.Print("Matched device - "+devs[id].device) 
		if isData { query,err = createGPRMCQuery(devs[id],matchedStrings) }
	} else { 
		err = errors.New("Unknown device")
		logger.Print("Unknown device") 
	}
	return
} 

// GPRMC format digested by openGTS server
var gprmcOrder = []int{HEAD,TIME,ACTIVE,LAT,NS,LON,EW,SPEED,ANGLE,DATE,MAGN}

func createGPRMCQuery(dev devPattern, matches []string) (query string, err error) {
	err = nil
	query = ""
	val := ""
	if len(matches) < 2 { return }
	for i:=0; i<len(gprmcOrder);i++ {
		switch gprmcOrder[i] {
				case HEAD:
					query +="$GPRMC"
				case MAGN:	// add dummy magnetic deviation
					query +=",0.0";					
				default:
					query += ","
					if val,_=getGPSValue(dev,matches,gprmcOrder[i]); len(val)>0 { query += url.QueryEscape(val) }
		}
	}
	if len(query)>0 {
		// add trailing ACTIVE
		query += ",A*"
		// calculate single byte GPRMC checksum between $ and *
		var cs byte=0
		for _,c := range []byte(strconv.QuoteToASCII(query)) { if c!='$' && c!='*' { cs ^= c }}
		query = "gprmc="+query+fmt.Sprintf("%02X",cs)
		if val,_=getGPSValue(dev,matches,DEVID); len(val)>0 	{ query = "imei="+url.QueryEscape(val)+"&"+query }
		if val,_=getGPSValue(dev,matches,  ALT); len(val)>0 	{ query = "alt="+url.QueryEscape(val)+"&"+query }
		if val,_=getGPSValue(dev,matches,  ACC); len(val)>0 	{ query = "acc="+url.QueryEscape(val)+"&"+query }		
	}
//	fmt.Println("GPRMC-record : "+query)
	return
}


func getGPSValue(dev devPattern, matches []string, key int) (val string, idx int) {
	i:=0
	val = ""
	for i=0; i<len(dev.order) && dev.order[i]!=key;i++ {}
	if i<len(dev.order) && dev.order[i]==key && len(matches)>(i+1) { 
		val = matches[i+1] 
		switch key {
			case TIME:	fallthrough
			case DATE:
				val = fmt.Sprintf("%6s",val)
			case ACTIVE:
				
			case LAT:	fallthrough
			case LON:
				if dev.units[i] == DEGMIN { break }	// correct unit for GPRMC -> do nothing
				degval,err:=strconv.ParseFloat(val,32)
				if err != nil {break}
				if dev.units[i] == DEGREE {		// calculate degree*100 + minutes
					deg := float64(int(degval))		
					min := (degval - deg)*60.0;
					degfmt := "%02d%05.2f"
					if key == LON { degfmt = "%03d%05.2f" }
					val = fmt.Sprintf(degfmt,math.Abs(deg),min)
				}
			case SPEED:	// get value in m/s (GPRMC stores KNOTS, openGTS expects m/s)
				v,err:=strconv.ParseFloat(val,32)
				if err != nil {break}
				if dev.units[i] == KMPERH 	{ v /= 3.6 }	// get m/s   1000m/3600s = 1/3.6
				if dev.units[i] == MPERS 	{}
				if dev.units[i] == KNOTS 	{ v *= 0.514 }	// get m/s   1852m/3600s = 0.514
				val = fmt.Sprintf("%.1f",v)
			default:
		}
	} else {	// key not in input string -> use default, or determine from different source
		switch key {
			case NS:
				val = "N"
				_,idx = getGPSValue(dev,matches,LAT)	// check sign of lattitude value
				if idx > 0 && idx < len(matches) { 
					degval,err:=strconv.ParseFloat(matches[idx],32)
					if err == nil && degval < 0.0 { val = "S" }
				}
			case EW:
				val = "E"
				_,idx = getGPSValue(dev,matches,LON)	// check sign of longitude value
				if idx > 0 && idx < len(matches) { 
					degval,err:=strconv.ParseFloat(matches[idx],32)
					if err == nil && degval < 0.0 { val = "W" }
				}				
			case ACTIVE:
				val = "A"
			default:
				val = "0.0"	// default for non-existing keys
		}
	}	
	return 
}


var regexpHTTPResponse = regexp.MustCompile("^\\s*[0-9]+\\s+(OK|REJECTED)")

func analyseHTTPResponse(response string) (ans string) {
	ans = "no valid response - check connection to HTTP server"
logger.Print("response - "+response)
	if response != "" {
		matchedStrings := regexpHTTPResponse.FindStringSubmatch(response)
		if nmatch:=len(matchedStrings); nmatch > 1 {
			ans = "device "+matchedStrings[1]
		} 
	}
	return
}
