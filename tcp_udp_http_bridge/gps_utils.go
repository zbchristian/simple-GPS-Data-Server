// utils to filter message from GPS device received from TCP port and create openGTS HTTP request (GPRMC record)
// =============================================================================================================
// input: raw tcp string
// output: response for TCP-client, query string for HTTP request, error code
package main

import (
	"bufio"
	"crypto/aes"
	"crypto/cipher"
	"crypto/sha1"
	"encoding/base64"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"math"
	"net/url"
	"os"
	"regexp"
	"strconv"
	"strings"

	"golang.org/x/crypto/pbkdf2" // go get -u golang.org/x/crypto/pbkdf2
)

const (
	NONE    int = iota
	S1      int = iota
	S2      int = iota
	S3      int = iota
	DEVID   int = iota
	DEVIMEI int = iota
	GPRMC   int = iota
	TIME    int = iota
	ACTIVE  int = iota
	LAT     int = iota
	LON     int = iota
	NS      int = iota
	EW      int = iota
	SPEED   int = iota
	ANGLE   int = iota
	DATE    int = iota
	ALT     int = iota
	ACC     int = iota
	LASTKEY int = iota
	DEGMIN  int = iota
	KMPERH  int = iota
	MPERS   int = iota
	KNOTS   int = iota
	DEGREE  int = iota
	HEAD    int = iota
	CHECK   int = iota
	MAGN    int = iota
	YYMMDD  int = iota
)

var keywords = map[string]int{
	"NONE":    NONE,
	"S1":      S1,
	"S2":      S2,
	"S3":      S3,
	"DEVID":   DEVID,
	"DEVIMEI": DEVIMEI,
	"GPRMC":   GPRMC,
	"TIME":    TIME,
	"ACTIVE":  ACTIVE,
	"LAT":     LAT,
	"LON":     LON,
	"NS":      NS,
	"EW":      EW,
	"SPEED":   SPEED,
	"ANGLE":   ANGLE,
	"DATE":    DATE,
	"ALT":     ALT,
	"ACC":     ACC,
	"DEGMIN":  DEGMIN,
	"KMPERH":  KMPERH,
	"MPERS":   MPERS,
	"KNOTS":   KNOTS,
	"DEGREE":  DEGREE,
	"HEAD":    HEAD,
	"CHECK":   CHECK,
	"MAGN":    MAGN,
	"YYMMDD":  YYMMDD,
}

type bitsMatch struct { // match bit pattern and define result
	Pat []string // bit pattern as hex string (e.g. 0x2ff)
	Res []string // result: "" = number , "N:S" = val&pattern!=0 "N" else "S"
}

type MsgPattern struct { // regular expressions describing the message + response
	Mode       string    // Mode is String or binary
	Msg        string    // message pattern
	Resp       string    // response
	Msg1       string    // optional 2. message
	Resp1      string    // optional 2. response
	Order      []int     // define the Order of the incoming parameters (see list of keywords)
	Units      []int     // for unit conversion provide unit of parameter (enum UNITS)
	Scale      []float64 // scale factor for value (e.g. lat is given as integer. Scale back to minutes/degree.)
	Bits       bitsMatch // match bit patterns
	MsgRegexp  *regexp.Regexp
	Msg1Regexp *regexp.Regexp
}

type devPattern struct {
	Device    string // device name/imei
	Mode      string // "string" or "binary"
	Login     MsgPattern
	Heartbeat MsgPattern
	Gps_data  MsgPattern
}

// regular expression for GPRMC record w/o header, magnetic deviation and checksum
const (
	REGEXP_GPRMC = "(([0-9]{6}),([A|V]*),([0-9.]+),([N|S]),([0-9.]+),([E|W]),([0-9.]+),([0-9.]+),([0-9]{6}))"

// time  active/void    lat               lon                 speed   angle    date
)

// Items associated with GPRMC regex
var gprmcItems = "%TIME%,%ACTIVE%, %LAT%,  %NS%,   %LON%,  %EW%,  %SPEED%,%ANGLE%, %DATE%"

// GPRMC format digested by openGTS server
var gprmcOrder = []int{HEAD, TIME, ACTIVE, LAT, NS, LON, EW, SPEED, ANGLE, DATE, MAGN}

var devs []devPattern

// how to define device patterns:
// - add new devices to devices.conf
// - regexp pattern required for login, heartbeat and actual data message
// - for each case a response can be defined. Currently NO dynamic response possible
// - in each case the device has to be identified by the IMEI or a deviceid
// - for data message
//  o if device sends a GPRMC record, use the predefined constant (see above)
//  o assign to each matched pattern (in parentheses) a key word (DEVIMEI, DEVID, ACTIVE, LAT, LON, NS, EW, SPEED, ANGLE, DATE)
//  o for unit conversion give for each matched pattern (LAT, LON, SPEED, ANGLE) the unit

func compileMsg(msgPat *MsgPattern, name string) bool {
	isOk := true
	if msgPat.Msg != "" {
		msgPat.MsgRegexp = regexp.MustCompile("(?i)" + msgPat.Msg)
		if msgPat.MsgRegexp == nil {
			fmt.Printf("error in regexp of Msg of %s: %s \n", name, msgPat.Msg)
			isOk = false
		}
	}
	if msgPat.Msg1 != "" {
		msgPat.Msg1Regexp = regexp.MustCompile("(?i)" + msgPat.Msg1)
		if msgPat.Msg1Regexp == nil {
			fmt.Printf("error in regexp of Msg1 of %s: %s \n", name, msgPat.Msg1)
			isOk = false
		}
	}
	return isOk
}

func readDeviceConfig(fileconf string) (err error) {
	logger.Printf("Configuration file - %s", fileconf)
	fconf, err := os.Open(fileconf)
	if err != nil {
		return
	}
	defer fconf.Close()
	scanner := bufio.NewScanner(fconf)
	jsonBlob := ""
	// remove comment lines
	for scanner.Scan() {
		line := strings.TrimSpace(scanner.Text())
		if len(line) > 0 && line[:1] != "/" {
			jsonBlob += scanner.Text()
		}
	}
	// expand regeular expression and corresponding items
	jsonBlob = strings.Replace(jsonBlob, "%REGEXP_GPRMC%", REGEXP_GPRMC, -1)
	jsonBlob = strings.Replace(jsonBlob, "%GPRMC%", "%GPRMC%,"+gprmcItems, -1)
	// replace keywords
	for key, idx := range keywords {
		jsonBlob = strings.Replace(jsonBlob, "%"+key+"%", strconv.Itoa(idx), -1)
	}
	// find remaining keywords
	re := regexp.MustCompile(`\%\w+\%`)
	byMatch := re.Find([]byte(jsonBlob))
	if byMatch != nil {
		fmt.Printf("Unknown key %s found \n", string(byMatch))
		return
	}
	//  fmt.Print(jsonBlob)
	devs = nil
	err = json.Unmarshal([]byte(jsonBlob), &devs)
	if err != nil {
		fmt.Println(err.Error())
		return
	}
	//  strjson,_ := json.Marshal(devs)
	//  fmt.Println(string(strjson))
	// remove Dummy device at the end of the list
	if devs[len(devs)-1].Device == "" {
		devs = devs[:len(devs)-1]
	}
	// list found devices and check regexp of msg
	logger.Printf("Found %d device configurations", len(devs))
	for id := range devs {
		dev := &devs[id]
		dev.Mode = strings.ToLower(dev.Mode)
		if dev.Mode == "" {
			dev.Mode = "string"
		}
		compileMsg(&dev.Login, "Login")
		if dev.Login.Mode == "" {
			dev.Login.Mode = dev.Mode
		}
		compileMsg(&dev.Heartbeat, "Heartbeat")
		if dev.Heartbeat.Mode == "" {
			dev.Heartbeat.Mode = dev.Mode
		}
		compileMsg(&dev.Gps_data, "Gps_data")
		if dev.Gps_data.Mode == "" {
			dev.Gps_data.Mode = dev.Mode
		}
		logger.Printf("Device %s - OK", dev.Device)
	}

	// create regex with all keywords
	reStr := "NONE"
	for key, idx := range keywords {
		if idx > 0 && idx < LASTKEY {
			reStr += "|" + key
		}
	}
	reStr = "\\\\(" + reStr + ")\\\\"
	searchPat = regexp.MustCompile(reStr)
	return
}

var searchPat *regexp.Regexp

// Replace "\KEY\" in inStr with corresponding value found in msg
func replaceMatched(inStr string, dev *MsgPattern, matchedStrings []string) string {
	if inStr == "" {
		return ""
	}
	matchAll := searchPat.FindAllStringSubmatch(inStr, -1)
	for _, match := range matchAll {
		idx := -1
		for key, j := range keywords {
			if key == match[1] {
				idx = j
				break
			}
		}
		// get value for key
		res, _ := getGPSValue(*dev, matchedStrings, idx)
		inStr = strings.Replace(inStr, match[0], res, -1)
	}
	if isVerbose {
		fmt.Println("Replaced string :" + inStr)
	}
	return inStr
}

func checkMsg(msg string, msgPat *MsgPattern) (isOk bool, response string, matchedStrings []string) {
	isOk = false
	response = ""
	isHex := msgPat.Mode == "binary" || msgPat.Mode == "bcd"
	if isHex { // binary/bcd data -> hex string
		msg = strings.TrimSpace(fmt.Sprintf("%X ", []byte(msg)))
		if isVerbose {
			logger.Printf("CheckMsg - Message: %s\n", msg)
		}
	} else {
		msg = strings.TrimSpace(msg)
	}
	matchedStrings = []string{}
	if len(msg) > 0 {
		if len(msgPat.Msg) > 0 && msgPat.MsgRegexp != nil {
			matchedStrings = msgPat.MsgRegexp.FindStringSubmatch(msg)
			if len(matchedStrings) > 0 {
				isOk = true
				response = msgPat.Resp
			}
		}
		if !isOk && len(msgPat.Msg1) > 0 && msgPat.Msg1Regexp != nil {
			matchedStrings = msgPat.Msg1Regexp.FindStringSubmatch(msg)
			if len(matchedStrings) > 0 {
				isOk = true
				response = msgPat.Resp1
			}
		}
	}
	response = replaceMatched(response, msgPat, matchedStrings)
	if len(response) > 0 && isHex {
		s, err := hex.DecodeString(response)
		if err == nil {
			response = string(s)
		} else {
			if isVerbose {
				logger.Println("Conversion of response to binary failed - need to be a hex string")
			}
		}
	}

	return isOk, response, matchedStrings
}

func filter_gps_device(msg string, status *statInfo) (response string, query string, err error) {
	response = ""
	query = ""
	err = nil

	// try to match msg to one of the knows devices
	id := 0
	isLogin := false
	isHeart := false
	isData := false
	var matchedStrings []string

	for i := 0; i < len(devs); i++ {
		dev := &devs[i]
		id = i
		msg1 := msg
		if isLogin, response, matchedStrings = checkMsg(msg1, &dev.Login); isLogin {
			break
		}
		if isHeart, response, matchedStrings = checkMsg(msg1, &dev.Heartbeat); isHeart {
			break
		}
		if isData, response, matchedStrings = checkMsg(msg1, &dev.Gps_data); isData {
			break
		}
	}
	if (isHeart || isData) && status != nil && len(devs[id].Login.Msg) == 0 {
		status.isLogin = true
	} // no login expected

	if isLogin {
		logger.Print("Login message of " + devs[id].Device)
		if status != nil {
			if status.isLogin {
				response = ""
			} // do not send login response multiple times
			status.isLogin = true
			status.DeviceID, _ = getGPSValue(devs[id].Login, matchedStrings, DEVID)
			if status.DeviceID == "" {
				status.DeviceID, _ = getGPSValue(devs[id].Login, matchedStrings, DEVIMEI)
			}
			status.DeviceID = url.QueryEscape(status.DeviceID)
			if isVerbose && len(status.DeviceID) > 0 {
				logger.Printf("Device id found: %s\n", status.DeviceID)
			}
		}
	} else if isHeart {
		logger.Print("Heartbeat message of " + devs[id].Device)
	} else if isData {
		logger.Print("GPS-data of " + devs[id].Device)
		if isData {
			query, err = createGPRMCQuery(devs[id].Gps_data, matchedStrings)
			DevID := ""
			if status.isLogin && len(status.DeviceID) > 2 {
				DevID = status.DeviceID
			} else {
				DevID, _ = getGPSValue(devs[id].Gps_data, matchedStrings, DEVID)
			}
			DevIMEI, _ := getGPSValue(devs[id].Gps_data, matchedStrings, DEVIMEI)
			if len(DevID) > 2 || len(DevIMEI) > 2 {
				if len(DevID) > 2 {
					query = "id=" + url.QueryEscape(DevID) + "&" + query
				}
				if len(DevIMEI) > 2 {
					query = "imei=" + url.QueryEscape(DevIMEI) + "&" + query
				}
			} else {
				query = ""
				err = errors.New("no device ID or IMEI found")
			}
		}
	} else {
		err = errors.New("unknown device")
		if isVerbose {
			logger.Print("Unknown Device")
		}
	}
	return
}

func createGPRMCQuery(dev MsgPattern, matches []string) (query string, err error) {
	err = nil
	query = ""
	val := ""
	if len(matches) < 2 {
		return
	}
	// check, if GPRMC record already included in data string
	isGPRMC := false
	for i := 0; !isGPRMC && i < len(dev.Order); i++ {
		isGPRMC = dev.Order[i] == GPRMC
	}
	if isGPRMC {
		if val, _ = getGPSValue(dev, matches, GPRMC); len(val) > 0 {
			query += "$GPRMC," + val + ",0.0,W"
		} // add header and dummy magn deviation
	} else {
		for i := 0; i < len(gprmcOrder); i++ {
			switch gprmcOrder[i] {
			case HEAD:
				query += "$GPRMC"
			case MAGN: // add dummy magnetic deviation
				query += ",0.0,W"
			default:
				query += ","
				if val, _ = getGPSValue(dev, matches, gprmcOrder[i]); len(val) > 0 {
					query += url.QueryEscape(val)
				}
			}
		}
	}
	if len(query) > 0 {
		// add trailing ACTIVE (NMEA 2.1)
		query += ",A*"
		// calculate single byte GPRMC checksum between $ and *
		var cs byte = 0
		for _, c := range []byte(strconv.QuoteToASCII(query)) {
			if c != '$' && c != '*' {
				cs ^= c
			}
		}
		query = query + fmt.Sprintf("%02X", cs)
		query = "gprmc=" + query // openGTS HTTP request
		if val, _ = getGPSValue(dev, matches, ALT); len(val) > 0 {
			query = "alt=" + url.QueryEscape(val) + "&" + query
		}
		if val, _ = getGPSValue(dev, matches, ACC); len(val) > 0 {
			query = "acc=" + url.QueryEscape(val) + "&" + query
		}
	}
	//  fmt.Println("GPRMC-record : "+query)
	return
}

func getKeyword(id int) string {
	for key, idx := range keywords {
		if idx == id {
			return key
		}
	}
	return "NONE"
}

func getGPSValue(dev MsgPattern, matches []string, key int) (val string, idx int) {
	isBinary := dev.Mode == "binary"
	isBCD := dev.Mode == "bcd"
	isHex := isBinary || isBCD
	if isVerbose {
		logger.Printf("GetValue for %s\n", getKeyword(key))
	}
	if isVerbose && isHex {
		logger.Printf("   Binary/BCD mode\n")
	}
	val = ""
	i := 0
	for i = 0; i < len(dev.Order) && dev.Order[i] != key; i++ {
	}
	if i < len(dev.Order) && dev.Order[i] == key && len(matches) > (i+1) {
		val = matches[i+1]
		if isVerbose {
			logger.Printf("  Match:  %s\n", val)
		}
		// handle bit patterns
		if len(dev.Bits.Pat) > i && dev.Bits.Pat[i] != "" { // check for bit patterns
			if isVerbose {
				logger.Printf("   Bit pattern %s\n", dev.Bits.Pat[i])
			}
			pat, err := strconv.ParseUint(dev.Bits.Pat[i], 16, 64) // pattern is a hex string
			if err == nil {
				value, err := strconv.ParseUint(val, 16, 64) // input string is expected to be hex (max 16 digits = 64bits)
				if err == nil {
					if dev.Bits.Res[i] != "" {
						res := strings.Split(dev.Bits.Res[i], ":")
						if len(res) == 2 {
							if value&pat == 0 {
								val = res[1]
							} else {
								val = res[0]
							}
						} else {
							val = ""
						}
					} else {
						if isHex {
							val = fmt.Sprintf("%X", value&pat)
						} else {
							val = fmt.Sprintf("%d", value&pat)
						}
					}
				}
				if isVerbose {
					logger.Printf("   Result %s\n", val)
				}
			}
		}
		// handle scale factor
		fac := 1.0
		if len(dev.Scale) > i {
			fac = dev.Scale[i]
		}
		valFloat := -1e6
		if isBinary {
			valInt, err := strconv.ParseInt(val, 16, 64)
			if err == nil {
				valFloat = float64(valInt)
			}
		} else if isBCD {
			valInt, err := strconv.ParseInt(val, 10, 64)
			if err == nil {
				valFloat = float64(valInt)
			}
		} else {
			valF, err := strconv.ParseFloat(val, 64)
			if err == nil {
				valFloat = valF
			}
		}
		valFloat *= fac

		switch key {
		case TIME:
			fallthrough
		case DATE:
			isInv := len(dev.Units) > i && dev.Units[i] == YYMMDD
			if !isInv { // DDMMYY and hhmmss format
				if isBinary {
					valByte, err := hex.DecodeString(val)
					if err != nil {
						break
					}
					val = ""
					for _, valB := range valByte {
						val = val + fmt.Sprintf("%02d", valB)
					}
				} else {
					val = fmt.Sprintf("%6s", val)
				}
			} else { // YYMMDD format
				if isBinary {
					valByte, err := hex.DecodeString(val)
					if err != nil {
						break
					}
					val = ""
					for _, valB := range valByte {
						val = fmt.Sprintf("%02d", valB) + val
					}
				} else {
					val = fmt.Sprintf("%2s%2s%2s", val[4:5], val[2:3], val[0:1])
				}
			}
		case ALT:
			val = fmt.Sprintf("%d", int(valFloat))
		case ACTIVE:

		case ANGLE:
			val = fmt.Sprintf("%f", valFloat)

		case LAT:
			fallthrough
		case LON:
			degval := math.Abs(valFloat)                      // Sign of LAT/LON used to obtain N/S, E/W (see below)
			if len(dev.Units) > i && dev.Units[i] == DEGREE { // calculate degree*100 + minutes
				deg := float64(int(degval))
				min := (degval - deg) * 60.0
				degval = deg*100.0 + min
			}
			val = fmt.Sprintf("%.5f", degval)
		case SPEED: // get value in m/s (GPRMC stores KNOTS, openGTS expects m/s)
			v := valFloat
			if len(dev.Units) > i { // need speed in knots
				if dev.Units[i] == KMPERH {
					v /= 1.852
				} else if dev.Units[i] == MPERS {
					v *= 3.6 / 1.852
				}
			}
			val = fmt.Sprintf("%.1f", v)
		case DEVIMEI: // imei too short -> extend to 15 digits
			if len(val) < 15 {
				v, err := strconv.Atoi(val)
				if err != nil {
					break
				}
				val = fmt.Sprintf("%015d", v)
			}
		default:
		}
	} else { // key not in input string -> use default, or determine from different source
		switch key {
		case NS:
			val = "N"
			_, idx = getGPSValue(dev, matches, LAT) // check sign of latitude value
			if idx > 0 && idx < len(matches) {
				degval, err := strconv.ParseFloat(matches[idx], 32)
				if err == nil && degval < 0.0 {
					val = "S"
				}
			}
		case EW:
			val = "E"
			_, idx = getGPSValue(dev, matches, LON) // check sign of longitude value
			if idx > 0 && idx < len(matches) {
				degval, err := strconv.ParseFloat(matches[idx], 32)
				if err == nil && degval < 0.0 {
					val = "W"
				}
			}
		case ACTIVE:
			val = "A"
		case DEVIMEI:
			fallthrough
		case DEVID:
			val = ""
		default:
			val = "0.0" // default for non-existing keys
		}
	}
	return
}

// expected response from web server: device-ID/IMEI OK|REJECTED
var regexpHTTPResponse = regexp.MustCompile(`^\s*[0-9A-Za-z]+\s+(OK|REJECTED)\s*`)

func analyseHTTPResponse(response string) (ans string, err error) {
	ans = "no valid response - check connection to HTTP server"
	err = errors.New(ans)
	if response != "" {
		matchedStrings := regexpHTTPResponse.FindStringSubmatch(response)
		if nmatch := len(matchedStrings); nmatch > 1 {
			ans = "device " + matchedStrings[1]
			if isVerbose {
				logger.Print(ans)
			}
			if matchedStrings[1] == "OK" {
				err = nil
			}
		}
	}
	return
}

// decrypt AES/CBC encrypted message
// structure: salt-IV-ENCTEXT
// Base64 encoded
//
// USED in GPSLogger:
//  KEY_FACTORY = "PBKDF2WithHmacSHA256"
//  CIPHER      = "AES/CBC/PKCS7PADDING"

const (
	ENC_HEADER      = "$enc$"
	PASSWORD        = ""
	MIN_MSG_LEN     = 128 + 8 + 24
	ITERATION_COUNT = 10000
	KEY_LENGTH      = 128 / 8 // key length in bytes

)

var preshared_key = ""

func decryptMessage(msg string) (plaintxt string, err error) {
	plaintxt = msg
	err = errors.New("message is not encrypted")
	if len(msg) >= MIN_MSG_LEN {
		txtcomp := strings.Split(msg, "-")
		if len(txtcomp) == 4 {
			if strings.Compare(txtcomp[0], ENC_HEADER) != 0 {
				return
			}
			if len(preshared_key) == 0 {
				return
			}
			salt, err1 := base64.StdEncoding.DecodeString(txtcomp[1])
			if err1 != nil {
				err = err1
				return
			}
			IV, err1 := base64.StdEncoding.DecodeString(txtcomp[2])
			if err1 != nil {
				err = err1
				return
			}
			enctxt, err1 := base64.StdEncoding.DecodeString(txtcomp[3])
			if err1 != nil {
				err = err1
				return
			}
			key := pbkdf2.Key([]byte(preshared_key), salt, ITERATION_COUNT, KEY_LENGTH, sha1.New)
			blockCiph, err1 := aes.NewCipher(key)
			if err1 != nil {
				err = err1
				return
			}
			ciphCBC := cipher.NewCBCDecrypter(blockCiph, IV)
			plain := make([]byte, len(enctxt))
			ciphCBC.CryptBlocks(plain, enctxt)
			err = nil
			// replace all special characters
			for id, val := range plain {
				if val < 0x20 || val > 0x7f {
					plain[id] = 0x20
				}
			}
			ptxt := strings.Trim(string(plain), " ")
			if len(ptxt) < 10 {
				err = errors.New("message too short")
			} else {
				plaintxt = ptxt
			}
		}
	}
	return
}

func read_psk(fpsk string) (err error) {
	key := ""
	bkey, err := os.ReadFile(fpsk)
	if err == nil {
		key = strings.Trim(string(bkey), " \n\t")
	}
	preshared_key = key
	if err == nil {
		logger.Print("PSK read successfully")
	} else {
		logger.Print("FAILED to read PSK")
	}
	return
}
