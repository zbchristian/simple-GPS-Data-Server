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
        "os"
        "io/ioutil"
        "bufio"
        "strings"
        "encoding/json"
        "encoding/base64"
        "crypto/sha1"
        "crypto/aes"
        "crypto/cipher"
        "golang.org/x/crypto/pbkdf2"   // go get -u golang.org/x/crypto/pbkdf2
)

const ( 
    NONE    int = iota
    DEVID   int = iota
    DEVIMEI int = iota
    GPRMC   int = iota  
    TIME    int = iota
    ACTIVE  int = iota
    LAT int = iota
    LON int = iota
    NS  int = iota
    EW  int = iota
    SPEED   int = iota
    ANGLE   int = iota
    DATE    int = iota
    ALT int = iota
    ACC int = iota
    DEGMIN  int = iota
    KMPERH  int = iota
    MPERS   int = iota
    KNOTS   int = iota
    DEGREE  int = iota
    HEAD    int = iota
    CHECK   int = iota
    MAGN    int = iota
)

var keywords = map[string]int{
    "NONE":     NONE,
    "DEVID":    DEVID,
    "DEVIMEI":  DEVIMEI,
    "GPRMC":    GPRMC,  
    "TIME":     TIME,
    "ACTIVE":   ACTIVE,
    "LAT":      LAT,
    "LON":      LON,
    "NS":       NS,
    "EW":       EW,
    "SPEED":    SPEED,
    "ANGLE":    ANGLE,
    "DATE":     DATE,
    "ALT":      ALT,
    "ACC":      ACC,
    "DEGMIN":   DEGMIN,
    "KMPERH":   KMPERH,
    "MPERS":    MPERS,
    "KNOTS":    KNOTS,
    "DEGREE":   DEGREE,
    "HEAD":     HEAD,
    "CHECK":    CHECK,
    "MAGN":     MAGN,
}

type keys struct {
    key string
    
}

type ReqRespPat struct { // regular expressions describing the message + response
    Msg     string
    Resp    string
    MsgRegexp *regexp.Regexp
}

type devPattern struct {
    Device      string      // device name/imei 
    Login       ReqRespPat
    Heartbeat   ReqRespPat
    Gps_data    ReqRespPat 
    Order       []int       // define the Order of the incoming parameters. List in above GPSDATA enum
    Units       []int       // for unit conversion provide unit of parameter (enum UNITS)
} 

// 
// regular expression for GPRMC record w/o header, magnetic deviation and checksum 
const (
    REGEXP_GPRMC  = "([0-9]{6},[A|V]*,[0-9.]+,[N|S],[0-9.]+,[E|W],[0-9.]+,[0-9.]+,[0-9]{6})"
//                     time  active/void  lat          lon          speed   angle    date 
)

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

func readDeviceConfig(fileconf string) (err error) {
    logger.Printf("Configuration file - %s",fileconf)
    fconf, err := os.Open(fileconf)
    if err != nil {return}
    defer fconf.Close()
    scanner := bufio.NewScanner(fconf)
    jsonBlob := ""
// remove comment lines
    for scanner.Scan() {
            line := strings.TrimSpace(scanner.Text())
        if len(line)> 0 && line[:1] != "/" { jsonBlob += scanner.Text() }
    }
// replace keywords
    jsonBlob = strings.Replace(jsonBlob,"%REGEXP_GPRMC%",REGEXP_GPRMC,-1)
    for key, idx := range keywords {
        jsonBlob = strings.Replace(jsonBlob,"%"+key+"%",strconv.Itoa(idx),-1)
    }
// find remaining keywords
    re := regexp.MustCompile("\\%\\w+\\%")
    byMatch := re.Find([]byte(jsonBlob))
    if byMatch != nil { fmt.Printf("Unknown key %s found \n",string(byMatch)); return }
//  fmt.Print(jsonBlob)
    devs = nil
    err = json.Unmarshal([]byte(jsonBlob),&devs)
    if err != nil { fmt.Println(err.Error()); return }
//  strjson,_ := json.Marshal(devs)
//  fmt.Println(string(strjson))
// remove Dummy device at the end of the list
    if devs[len(devs)-1].Device == "" { devs = devs[:len(devs)-1] }
// list found devices and check regexp of msg
    logger.Printf("Found %d device configurations",len(devs))
    for _,dev := range devs {
        if dev.Login.Msg != "" { 
            dev.Login.MsgRegexp = regexp.MustCompile(dev.Login.Msg) 
            if dev.Login.MsgRegexp == nil { fmt.Printf("error in regexp of Login: %s \n",dev.Login.Msg); return }
        }
        if dev.Heartbeat.Msg != "" { 
            dev.Heartbeat.MsgRegexp = regexp.MustCompile(dev.Heartbeat.Msg) 
            if dev.Heartbeat.MsgRegexp == nil { fmt.Printf("error in regexp of Heartbeat: %s \n",dev.Heartbeat.Msg); return }
        }
        if dev.Gps_data.Msg != "" { 
            dev.Gps_data.MsgRegexp = regexp.MustCompile(dev.Gps_data.Msg) 
            if dev.Gps_data.MsgRegexp == nil { fmt.Printf("error in regexp of Gps_data: %s \n",dev.Gps_data.Msg); return }
        }
        logger.Printf("Device %s - OK",dev.Device)
    }
    return
}

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
        if len(dev.Login.Msg)>0 {
            if dev.Login.MsgRegexp == nil { dev.Login.MsgRegexp = regexp.MustCompile(dev.Login.Msg) }
            matchedStrings = dev.Login.MsgRegexp.FindStringSubmatch(msg)
            if nmatch=len(matchedStrings); nmatch > 2 {
                isLogin = true
                response = dev.Login.Resp
                break
            }
        }
        if len(dev.Heartbeat.Msg)>0 {
            if dev.Heartbeat.MsgRegexp == nil { dev.Heartbeat.MsgRegexp = regexp.MustCompile(dev.Heartbeat.Msg) }
            matchedStrings = dev.Heartbeat.MsgRegexp.FindStringSubmatch(msg)
            if nmatch=len(matchedStrings); nmatch > 2 {
                isHeart = true
                response = dev.Heartbeat.Resp
                break
            }
        }
        if len(dev.Gps_data.Msg)>0  {
            if dev.Gps_data.MsgRegexp == nil { dev.Gps_data.MsgRegexp = regexp.MustCompile(dev.Gps_data.Msg) }
            matchedStrings = dev.Gps_data.MsgRegexp.FindStringSubmatch(msg)
            if nmatch=len(matchedStrings); nmatch > 2 {
                isData = true
                response = dev.Gps_data.Resp
                break
            }
        }
    }
//  fmt.Println(matchedStrings)
    if isLogin {
        logger.Print("Login message of "+devs[id].Device) 
    } else if isHeart {
        logger.Print("Heartbeat message of "+devs[id].Device) 
    } else if isData {
        logger.Print("GPS-data of "+devs[id].Device) 
        if isData { query,err = createGPRMCQuery(devs[id],matchedStrings) }
    } else { 
        err = errors.New("Unknown Device")
        if isVerbose { logger.Print("Unknown Device") } 
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
    // check, if GPRMC record already included in data string
    isGPRMC := false
    for i:=0; !isGPRMC && i<len(dev.Order); i++ { isGPRMC=dev.Order[i]==GPRMC }
    if isGPRMC {
        if val,_=getGPSValue(dev,matches,GPRMC); len(val)>0 { query += "$GPRMC,"+val+",0.0,W" } // add header and dummy magn deviation
    } else {
        for i:=0; i<len(gprmcOrder);i++ {
            switch gprmcOrder[i] {
                    case HEAD:
                        query +="$GPRMC"
                    case MAGN:  // add dummy magnetic deviation
                        query +=",0.0,W";                   
                    default:
                        query += ","
                        if val,_=getGPSValue(dev,matches,gprmcOrder[i]); len(val)>0 { query += url.QueryEscape(val) }
            }
        }
    }
    if len(query)>0 {
        // add trailing ACTIVE (NMEA 2.1)
        query += ",A*"
        // calculate single byte GPRMC checksum between $ and *
        var cs byte=0
        for _,c := range []byte(strconv.QuoteToASCII(query)) { if c!='$' && c!='*' { cs ^= c }}
        query = query+fmt.Sprintf("%02X",cs)
        query = "gprmc="+query  // openGTS HTTP request
        if val,_=getGPSValue(dev,matches,DEVID); len(val)>0     { query = "id="+url.QueryEscape(val)+"&"+query }
        if val,_=getGPSValue(dev,matches,DEVIMEI); len(val)>0   { query = "imei="+url.QueryEscape(val)+"&"+query }
        if val,_=getGPSValue(dev,matches,  ALT); len(val)>0     { query = "alt="+url.QueryEscape(val)+"&"+query }
        if val,_=getGPSValue(dev,matches,  ACC); len(val)>0     { query = "acc="+url.QueryEscape(val)+"&"+query }       
    }
//  fmt.Println("GPRMC-record : "+query)
    return
}


func getGPSValue(dev devPattern, matches []string, key int) (val string, idx int) {
    i:=0
    val = ""
    for i=0; i<len(dev.Order) && dev.Order[i]!=key;i++ {}
    if i<len(dev.Order) && dev.Order[i]==key && len(matches)>(i+1) { 
        val = matches[i+1] 
        switch key {
            case TIME:  fallthrough
            case DATE:
                val = fmt.Sprintf("%6s",val)
            case ALT:
                alt,err := strconv.ParseFloat(val,32)
                if err != nil {break}
                val = fmt.Sprintf("%d",int(alt))
           case ACTIVE:
                
            case LAT:   fallthrough
            case LON:
                if dev.Units[i] == DEGMIN { break } // correct unit for GPRMC -> do nothing
                degval,err:=strconv.ParseFloat(val,32)
                if err != nil {break}
                if dev.Units[i] == DEGREE {     // calculate degree*100 + minutes
                    deg := float64(int(degval))     
                    min := (degval - deg)*60.0;
                    degfmt := "%02d%08.5f"
                    if key == LON { degfmt = "%03d%08.5f" }
                    val = fmt.Sprintf(degfmt,int(math.Abs(deg)),min)
                }
            case SPEED: // get value in m/s (GPRMC stores KNOTS, openGTS expects m/s)
                v,err:=strconv.ParseFloat(val,32)
                if err != nil {break}
                if dev.Units[i] == KMPERH   { v /= 1.852 }      // calc knots
                if dev.Units[i] == MPERS    { v *= 3.6/1.852 }  // calc knots
                if dev.Units[i] == KNOTS    { }                 // nothing to do    
                val = fmt.Sprintf("%.1f",v)
            case DEVIMEI:   // imei too short -> extend to 15 digits
                if len(val) < 15 {
                    v,err:=strconv.Atoi(val)
                    if err != nil {break}
                    val = fmt.Sprintf("%015d",v)
                }
            default:
        }
    } else {    // key not in input string -> use default, or determine from different source
        switch key {
            case NS:
                val = "N"
                _,idx = getGPSValue(dev,matches,LAT)    // check sign of latitude value
                if idx > 0 && idx < len(matches) { 
                    degval,err:=strconv.ParseFloat(matches[idx],32)
                    if err == nil && degval < 0.0 { val = "S" }
                }
            case EW:
                val = "E"
                _,idx = getGPSValue(dev,matches,LON)    // check sign of longitude value
                if idx > 0 && idx < len(matches) { 
                    degval,err:=strconv.ParseFloat(matches[idx],32)
                    if err == nil && degval < 0.0 { val = "W" }
                }               
            case ACTIVE:
                val = "A"
            case DEVIMEI:   fallthrough
            case DEVID:
                val = ""
            default:
                val = "0.0" // default for non-existing keys
        }
    }   
    return 
}

// expected response from web server: device-ID/IMEI OK|REJECTED
var regexpHTTPResponse = regexp.MustCompile("^\\s*[0-9A-Za-z]+\\s+(OK|REJECTED)\\s*")

func analyseHTTPResponse(response string) (ans string, err error) {
    ans = "no valid response - check connection to HTTP server"
    err = errors.New(ans)
    if response != "" {
        matchedStrings := regexpHTTPResponse.FindStringSubmatch(response)
        if nmatch:=len(matchedStrings); nmatch > 1 {
            ans = "device "+matchedStrings[1]
            if isVerbose { logger.Print(ans) } 
            if matchedStrings[1] == "OK" { err = nil } 
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
    ENC_HEADER  = "$enc$"
    PASSWORD=""
    MIN_MSG_LEN = 128+8+24 
    ITERATION_COUNT  = 10000
    KEY_LENGTH      = 128/8  // key length in bytes

)

 var preshared_key=""
 
func decryptMessage(msg string) (plaintxt string, err error) {
    plaintxt = msg
    err = errors.New("Message is not encrypted")
    if len(msg) >= MIN_MSG_LEN  {
        txtcomp := strings.Split(msg,"-")
        if len(txtcomp) == 4 {
            if strings.Compare(txtcomp[0],ENC_HEADER)!=0 { return }
            if len(preshared_key) == 0 { return }
            salt,err1   := base64.StdEncoding.DecodeString(txtcomp[1])
            if err1 != nil { err = err1; return }
            IV,err1     := base64.StdEncoding.DecodeString(txtcomp[2])
            if err1 != nil { err = err1; return }
            enctxt,err1 := base64.StdEncoding.DecodeString(txtcomp[3])
            if err1 != nil { err = err1; return }
            key := pbkdf2.Key([]byte(preshared_key), salt, ITERATION_COUNT, KEY_LENGTH, sha1.New)
            blockCiph,err1 := aes.NewCipher(key) 
            if err1 != nil { err = err1; return }
            ciphCBC := cipher.NewCBCDecrypter(blockCiph,IV)
            plain := make([]byte, len(enctxt))
            ciphCBC.CryptBlocks(plain, enctxt)
            err = nil
            // replace all special characters
            for id,val := range plain {
                if val<0x20 || val>0x7f { plain[id] = 0x20 }
            }
            ptxt := strings.Trim(string(plain)," ")
            if len(ptxt) < 10 { 
                err= errors.New("Message too short")
            } else {
                plaintxt = ptxt
            }
        }
    }
    return
}

func read_psk(fpsk string) (err error) {
    key := ""
    bkey, err := ioutil.ReadFile(fpsk)
    if err == nil {
        key = strings.Trim(string(bkey)," \n\t")
    }
    preshared_key = key
    if err == nil { 
        logger.Print("PSK read successfully") 
    } else { logger.Print("FAILED to read PSK") }
    return 
}
