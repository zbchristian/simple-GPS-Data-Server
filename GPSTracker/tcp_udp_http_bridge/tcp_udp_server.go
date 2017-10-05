// Command line Arguments: -host -port -urlpath -key
//
// Command to close connection: close <SecretKEy>
// Command to exit server: exit <SecretKEy>

package main

import (
    "net"
    "os"
	"flag"
	"strconv"
	"strings"
	"time"
	"regexp"
	"log"
	"sync"
	"errors"
)

const (VERBOSE = false )

const (
	DEFAULT_HOST = "localhost"
	DEFAULT_PORT = 20202
	DEFAULT_KEY  = "12345"
	DEFAULT_URLPATH = "index.php"
	TIMEOUT = 2
)

var Host string
var Port int
var UrlPath string
var SecretKey string

var isExit 	bool
var isClose bool

var logger = log.New(os.Stdout, "GPS-TCP/UDP-HTTP-Bridge - ", log.Ldate|log.Ltime)
var regexExit *regexp.Regexp
var wg sync.WaitGroup // create wait group to sync exit of all processes 

func main() {
// get the arguments to run the server
	flag.StringVar(&Host,"httpserver",DEFAULT_HOST,"name of HTTP server")
	flag.IntVar(&Port,"port",DEFAULT_PORT,"port number")
	flag.StringVar(&UrlPath,"urlpath",DEFAULT_URLPATH,"relative url path")
	flag.StringVar(&SecretKey,"key",DEFAULT_KEY,"secret key to terminate program via TCP/UDP port")
	flag.Parse()
	
	if Host == "localhost" { Host = "127.0.0.1" }

	logger.Print("Starting servers on Port:"+strconv.Itoa(Port)+" HTTP-server:"+Host+" urlpath:"+UrlPath+" Key:"+SecretKey)
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
	isExit = false

    for !isExit {
        // Listen for an incoming connection.
		l.SetDeadline(time.Now().Add(TIMEOUT*time.Second))
		conn, err := l.Accept()
		if err != nil {
			if opErr, ok := err.(*net.OpError); ok && opErr.Timeout() {	continue }
			logger.Print("Error accepting: ", err.Error())
            break
        }
        // Handle connections in a new goroutine.
		wg.Add(1)
        go handleRequest(conn)
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
		response, err := handleMessage(string(buf[:n]),"UDP")
		if err == nil && len(response)>0 {
			if VERBOSE  { logger.Print("Response - "+response) }
			l.WriteToUDP([]byte(response),destSrv) 
		} else if err != nil {
			logger.Print(err.Error())
		}
	}
	logger.Print("Exit UDP-server ...")
}


// Handles incoming requests.
func handleRequest(conn net.Conn) {
	defer wg.Done()
	defer conn.Close()
	isClose= false
	var response string = ""
	// Make a buffer to hold incoming data.
	buf := make([]byte, 1024)

	for !isClose && !isExit {
		conn.SetDeadline(time.Now().Add(TIMEOUT*time.Second))
		// Read the incoming connection into the buffer.
		nb, err := conn.Read(buf)
		if err != nil { 
			if opErr, ok := err.(*net.OpError); ok && opErr.Timeout() {	continue }
			break; 
		}
		if nb > 0 {
			response, err = handleMessage(string(buf[:nb]),"TCP")
			// Send the response
			if err == nil && len(response)>0 {
				if VERBOSE { logger.Print("Response: "+response) }
				conn.Write([]byte(response)) 
			} else if err != nil {
				logger.Print(err.Error())
				break
			}
		}
	}
	// Close the connection when you're done with it.
	if VERBOSE {logger.Print("Close TCP connection ...") }
}

func handleMessage(msg string, connType string) (response string, err error) {
	msg = strings.TrimSpace(msg)
// fill regexp for close/exit message
	if regexExit == nil {regexExit = regexp.MustCompile("^(close|exit|status)\\s+("+SecretKey+")\\s*$") }

	logger.Print("Message via "+connType+": " + msg)
	response = ""
	query := ""
	err = nil
	// check for close | exit
	strMatched := regexExit.FindStringSubmatch(msg)
	if len(strMatched) > 2 {
		isClose = strMatched[1] == "close" && connType == "TCP"
		isExit  = strMatched[1] == "exit"
		if isClose || isExit { 
			if VERBOSE { logger.Print("close/exit message received") }
			err = errors.New("Close connection")
			return 
		} else {
			if strMatched[1] == "status" { response = "OK" }
			return 
		}
	}
	// check if incoming message matches a known device 
	response, query, err = filter_gps_device(msg)
		
	// send HTTPS request to server
	responseHTTP := ""
	if err == nil { responseHTTP, err = sendHTTPrequest(Host,UrlPath,query) }
	n := len(responseHTTP)
	if n>80 { n=80 }
	if VERBOSE { logger.Print("HTTP response: "+responseHTTP[:n]) }
	ans, isOK := analyseHTTPResponse(responseHTTP)
	if VERBOSE { logger.Print(ans) }
	if !isOK && VERBOSE { err = errors.New("device rejected or invalid response") }
	return
}