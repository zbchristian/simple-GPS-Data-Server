package main

import (
    "fmt"
    "net"
    "os"
	"flag"
	"strconv"
)


// Argruments:
// -host -port -urlpath -key

var Host string
var Port int
var UrlPath string
var SecretKey string

func main() {
// get the arguments to run the server
	flag.StringVar(&Host,"host","localhost","hostname")
	flag.IntVar(&Port,"port",20202,"port number")
	flag.StringVar(&UrlPath,"urlpath","index.php","relative url path")
	flag.StringVar(&SecretKey,"key","123456","secret key to terminate program via TCP port")
	flag.Parse()
	
	fmt.Println("Host:"+Host+" Port:"+strconv.Itoa(Port)+" Key:"+SecretKey)
// Listen for incoming connections.
    l, err := net.Listen("tcp", ":"+strconv.Itoa(Port))
    if err != nil {
        fmt.Println("Error listening:", err.Error())
        os.Exit(1)
    }
    // Close the listener when the application closes.
    defer l.Close()
    fmt.Println("Listening on port " + strconv.Itoa(Port))
    for {
        // Listen for an incoming connection.
        conn, err := l.Accept()
       if err != nil {
            fmt.Println("Error accepting: ", err.Error())
            os.Exit(1)
        }
        // Handle connections in a new goroutine.
        go handleRequest(conn)
    }
}

// Handles incoming requests.
func handleRequest(conn net.Conn) {
  // Make a buffer to hold incoming data.
  buf := make([]byte, 1024)
  // Read the incoming connection into the buffer.
  reqLen, err := conn.Read(buf)
  if err != nil {
    fmt.Println("Error reading:", err.Error())
  } else {
	fmt.Println("Incoming message : " + string(buf[:reqLen]))
	sendHTTPrequest(Host,UrlPath,string(buf[:reqLen]))
  }
  // Send a response back to person contacting us.
  conn.Write([]byte("Message received."))
  // Close the connection when you're done with it.
  conn.Close()
}
