// Command line Arguments: -host -port -urlpath -key
//
// Command to close connection: close <SecretKEy>
// Command to exit server: exit <SecretKEy>

package main

import (
    "fmt"
    "net"
    "os"
	"flag"
	"strconv"
	"strings"
	"time"
	"regexp"
)

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

var isExit bool

func main() {
// get the arguments to run the server
	flag.StringVar(&Host,"host",DEFAULT_HOST,"hostname")
	flag.IntVar(&Port,"port",DEFAULT_PORT,"port number")
	flag.StringVar(&UrlPath,"urlpath",DEFAULT_URLPATH,"relative url path")
	flag.StringVar(&SecretKey,"key",DEFAULT_KEY,"secret key to terminate program via TCP port")
	flag.Parse()
	
	fmt.Println("Host:"+Host+" Port:"+strconv.Itoa(Port)+" Key:"+SecretKey)
// Listen for incoming connections.
    // l, err := net.Listen("tcp", ":"+strconv.Itoa(Port))
	l, err := net.ListenTCP("tcp4", &net.TCPAddr{IP:nil,Port:Port,})
	
    if err != nil {
        fmt.Println("Error listening:", err.Error())
        os.Exit(1)
    }
    // Close the listener when the application closes.
    defer l.Close()
    fmt.Println("Listening on port " + strconv.Itoa(Port))
	isExit = false
    for !isExit {
        // Listen for an incoming connection.
		l.SetDeadline(time.Now().Add(TIMEOUT*time.Second))
		conn, err := l.Accept()
		if err != nil {
			if opErr, ok := err.(*net.OpError); ok && opErr.Timeout() {	continue }
			fmt.Println("Error accepting: ", err.Error())
            os.Exit(1)
        }
        // Handle connections in a new goroutine.
        go handleRequest(conn)
    }
	fmt.Println("Exit server ...")
}

// Handles incoming requests.
func handleRequest(conn net.Conn) {
	var isClose bool = false
	defer conn.Close()
	var response string = ""
	var query string = ""

	// regexp to recognize close and exit command
	regex := regexp.MustCompile("^(close|exit)\\s+("+SecretKey+")\\s*$")

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
			msg := strings.TrimSpace(string(buf[:nb]))

			// check for close | exit
			strMatched := regex.FindStringSubmatch(msg)
			if len(strMatched) > 2 {
				isClose = strMatched[1] == "close"
				isExit  = strMatched[1] == "exit"
				if isClose || isExit { break }
			}

			fmt.Println("Incoming message :" + msg)
			
			// check if incoming message matches a known device 
			response, query, err = filter_gps_device(msg)
			
			// send HTTPS request to server
			if err == nil { response,err = sendHTTPrequest(Host,UrlPath,query) }

			// Send the response
			if err == nil && len(response)>0 { conn.Write([]byte(response)) }
		}
	}
	// Close the connection when you're done with it.
	fmt.Println("Close connection ...")
}
