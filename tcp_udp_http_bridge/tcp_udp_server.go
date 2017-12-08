//
// TCP/UDP server for GPS devices - Bridge to HTTP(S) server (OpenGTS format) 
// ==========================================================================
// Command line Arguments: -host -port -urlpath -key
//
// - listen on given TCP/UDP port
// - send data via HTTP to HOST and provided URLPATH
// - server recognizes commands: 
// - Command (via TCP/UDP port) to close connection: close <SecretKEy>
// - Command to exit server: exit <SecretKEy>
//
// Author: Christian Zeitnitz 2017
//

package main

import (
	"net"
	"os"
	"os/signal"
	"syscall"
	"flag"
	"strconv"
	"strings"
	"time"
	"regexp"
	"log"
	"sync"
	"errors"
	"runtime"
	"path/filepath"
)


const (
	CONFIG_FILE	= "devices.config"
	DEFAULT_HOST 	= "http://localhost"
	DEFAULT_PORT 	= 20202
	DEFAULT_KEY  	= "12345"
	DEFAULT_URLPATH = "index.php"
	TIMEOUT 		= 2
	MAXCHILDS		= 20
	MAXTCPCONN 		= 2*60	// after this number of minutes the TCP connection is closed
	MAXTCPINACTIVE 	= 300	// after this number of seconds w/o received data, the TCP connection is closed
)

var Host string
var Port int
var UrlPath string
var SecretKey string

var isExit   = false
var isReload = false
var isVerbose bool

var logger = log.New(os.Stdout, "GPS-TCP/UDP-HTTP-Bridge - ", log.Ldate|log.Ltime)
var regexCMD *regexp.Regexp
var wg sync.WaitGroup // create wait group to sync exit of all processes 

var fconf = ""

// initialize the server (command line arguments and list of known devices)
func init() {
// get the arguments to run the server
	flag.StringVar(&Host,"httpserver",DEFAULT_HOST,"name of HTTP server")
	flag.IntVar(&Port,"port",DEFAULT_PORT,"port number")
	flag.StringVar(&UrlPath,"urlpath",DEFAULT_URLPATH,"relative url path")
	flag.StringVar(&SecretKey,"key",DEFAULT_KEY,"secret key to terminate program via TCP/UDP port")
	flag.BoolVar(&isVerbose,"verbose",false,"enable verbose logging output")
	flag.Parse()
	logger.Print("Starting servers on Port:"+strconv.Itoa(Port)+" HTTP-server:"+Host+" urlpath:"+UrlPath+" Key:"+SecretKey)
	initConf()
}

func initConf() {
	var err error
	if fconf == "" {
		dir, err := filepath.Abs(filepath.Dir(os.Args[0]))
		if err == nil { 
			fconf = dir+"/"+CONFIG_FILE 
			_, err = os.Stat(fconf) 
		}
	}
    	if err != nil ||  readDeviceConfig(fconf)!=nil {
        	logger.Print("Cannot locate or read configuration file "+fconf+" ... EXIT")
		if(isReload) { 
			isExit = true 
		} else {
			os.Exit(1)
		}
    	}
	isReload = false
}

func main() {
// catch interrupt, stop and kill 
	sigs := make(chan os.Signal, 1)
	signal.Notify(sigs, os.Interrupt, syscall.SIGINT, syscall.SIGTERM,syscall.SIGQUIT,syscall.SIGHUP)
	go func() {
		<-sigs
		logger.Print("EXIT Signal received")
		isExit = true
	}()    

// Listen for incoming connections.
	l, err := net.ListenTCP("tcp", &net.TCPAddr{IP:nil,Port:Port,})	
	if err != nil {
		logger.Print("Error listening:", err.Error())
		os.Exit(1)
	}
	defer l.Close()
	// start UDP server
	go UDPServer()
	wg.Add(1)
	logger.Print("Listening on TCP-port " + strconv.Itoa(Port))

	for !isExit {
        	// Listen for an incoming connection.
		l.SetDeadline(time.Now().Add(TIMEOUT*time.Second))
		conn, err := l.Accept()
		if err != nil {
			if opErr, ok := err.(*net.OpError); ok && opErr.Timeout() {	continue }
			logger.Print("Error accepting: ", err.Error())
			break
		}
		if runtime.NumGoroutine() < MAXCHILDS {
			// Handle connections in a new goroutine.
			wg.Add(1)
			go handleRequest(conn)
		} else { 	// too many childs running
			conn.Close()
			logger.Print("Reject connection - max number of connections exceeded")
		}
	}
	logger.Print("Exit TCP server ...")
	wg.Wait()	// wait for other processes to finish
}

func UDPServer() {
	defer wg.Done()
	addr, err := net.ResolveUDPAddr("udp",":"+strconv.Itoa(Port))
	l, err := net.ListenUDP("udp", addr)
	defer l.Close()
	if err != nil {
		logger.Print("Error listening UDP:", err.Error())
		return
	}
	// Close the listener when the application closes.
	defer l.Close()
	logger.Print("Listening on UDP-port " + strconv.Itoa(Port))
	buf := make([]byte, 1024)
	for !isExit {
        // Listen for an incoming connection.
		l.SetDeadline(time.Now().Add(TIMEOUT*time.Second))
		n,destSrv,err := l.ReadFromUDP(buf)
		if err != nil {
			if opErr, ok := err.(*net.OpError); ok && opErr.Timeout() {	continue }
			logger.Print("Error accepting UDP: ", err.Error())
			break
		}
		response, _, err := handleMessage(string(buf[:n]),"UDP")
		if err == nil && len(response)>0 {
			if isVerbose  { logger.Print("Response - "+response) }
			l.WriteToUDP([]byte(response),destSrv) 
		} else if err != nil {
			logger.Print(err.Error())
		}
	}
	logger.Print("Exit UDP-server ...")
}


// Handles a single TCP connection
func handleRequest(conn net.Conn) {
	defer wg.Done()
	defer conn.Close()
	isClose:= false
	var response string = ""
	// Make a buffer to hold incoming data.
	buf := make([]byte, 1024)

	startTime := time.Now()
	timeInactive := 0
	for !isClose && !isExit && time.Since(startTime).Minutes() < MAXTCPCONN && timeInactive < MAXTCPINACTIVE {	
		conn.SetDeadline(time.Now().Add(TIMEOUT*time.Second))
		// Read the incoming connection into the buffer.
		nb, err := conn.Read(buf)
		if err != nil { 
			if opErr, ok := err.(*net.OpError); ok && opErr.Timeout() {	timeInactive+=TIMEOUT; continue }
			break; 
		}
		if nb > 0 {
			timeInactive = 0
			response, isClose, err = handleMessage(string(buf[:nb]),"TCP")
			// Send the response
			if err == nil && len(response)>0 {
				if isVerbose { logger.Print("Response: "+response) }
				conn.Write([]byte(response)) 
			} else if err != nil {
				logger.Print(err.Error())
				break
			}
		}
	}
	if isVerbose {logger.Print("Close TCP connection ...") }
}

func handleMessage(msg string, connType string) (response string, isClose bool, err error) {
	msg = strings.TrimSpace(msg)
	// fill regexp for close/exit message
	if regexCMD == nil {regexCMD = regexp.MustCompile("^(close|exit|status|reload)\\s+("+SecretKey+")\\s*$") }
	response = ""
	query := ""
	err = nil
	// check for close | exit
	strMatched := regexCMD.FindStringSubmatch(msg)
	if len(strMatched) > 2 {
		if isVerbose { logger.Print("Command received via "+connType+": " + msg) }
		cmd := strMatched[1]
		isClose = cmd == "close" && connType == "TCP"
		isExit  = cmd == "exit"
		isReload  = cmd == "reload"
		if isClose || isExit { 
			if isVerbose { logger.Print("close/exit message received") }
			err = errors.New("Close connection")
			return 
		} else if cmd == "status" { 
			response = "OK"
			return 
		} else if isReload { 
			isClose = true
			initConf()
			return
		} else  { 
			return 
		}
	}
	logger.Print("Message via "+connType+": " + msg) 
	// check if incoming message matches a known device 
	response, query, err = filter_gps_device(msg)
		
	// send HTTPS request to server
	responseHTTP := ""
	if err == nil && len(query)>0 {
		responseHTTP, err = sendHTTPrequest(Host,UrlPath,query) 
		n := len(responseHTTP)
		if n>80 { n=80 }
		if isVerbose && err==nil { logger.Print("HTTP response: "+responseHTTP[:n]) }
		_,err = analyseHTTPResponse(responseHTTP)
	}
	return
}
