//
//  Extract Owntracks GPS data from MQTT Broker and send via tcp to tcp_udp_bridge
//  ==============================================================================
//
// example record
// {"_type":"location","BSSID":"34:fc:b9:00:00:00","SSID":"WhoKnows","acc":15,"alt":485,"batt":37,"bs":1,"conn":"w","created_at":1655292680,"lat":43.2127445,"lon":6.0005451,"m":2,"tid":"1","tst":1655292679,"vac":1,"vel":2}
//
// Infos at
// https://owntracks.org/booklet/tech/json/
//
// output format
// id/date,time,latitude,longitude,altitude,velocity,accuracy
// example
// k08844/150622,154343,43.2127445,6.0005451,483,0.0,5
//
// encrypted payload _type = "encrypted" can be decrypted. Requires the preshared key used by the devices
//
// CZ 2022 - 2024

package main

import (
    "fmt"
    mqtt "github.com/eclipse/paho.mqtt.golang"
    "time"
    "encoding/json"
    "encoding/base64"
    "strings"
    "strconv"
    "net"
    "syscall"
    "os"
    "os/signal"
    "flag"
    "math"
    "golang.org/x/crypto/nacl/secretbox"
)

const (
    DEFAULT_HOST    = "localhost"
    DEFAULT_PORT    = 1883
    DEFAULT_USER    = "admin"
    DEFAULT_PW      = "secret"
    DEFAULT_TOPIC   = "owntracks"
    DEFAULT_TCPHOST = "localhost"
    DEFAULT_TCPPORT = 20202
)


var isExit = false
var isKill = false
var Host = ""
var Port = 0
var User = ""
var Password = ""
var Topic = ""
var tcpHost = ""
var tcpPort = 0
var preSharedKey = ""

func main() {

// catch interrupt, stop and kill
    sigs := make(chan os.Signal, 1)
    signal.Notify(sigs, os.Interrupt, syscall.SIGINT, syscall.SIGTERM,syscall.SIGQUIT,syscall.SIGHUP)
    go func() {
        <-sigs
        fmt.Println("EXIT Signal received")
        isKill = true
    }()
    time.Sleep(5*time.Second)

    opts := mqtt.NewClientOptions()
    opts.AddBroker(fmt.Sprintf("tcp://%s:%d", Host, Port))
    opts.SetClientID("simple-gps-server-mqtt-client")
    opts.SetUsername(User)
    opts.SetPassword(Password)
    opts.SetDefaultPublishHandler(messagePubHandler)
    opts.OnConnect = connectHandler
    opts.OnConnectionLost = connectLostHandler
    for !isKill {
      fmt.Print("Try to connect to MQTT Broker ... ")
      client := mqtt.NewClient(opts)
      if token := client.Connect(); token.Wait() && token.Error() != nil {
          fmt.Println(token.Error())
          isExit=true;
          fmt.Println("failed")
      } else {
        fmt.Println("success")
        sub(client)
      }
      for !isExit {
         time.Sleep(time.Second)
      }
      client.Disconnect(250)
      client = nil
      time.Sleep(5*time.Second)
   }
}


var messagePubHandler mqtt.MessageHandler = func(client mqtt.Client, msg mqtt.Message) {
    jsonBlob := msg.Payload()
    topic := msg.Topic()
    fmt.Printf("\nReceived message: %s from topic: %s\n", jsonBlob, topic)
    var gps_data map[string]interface{}
    if err := json.Unmarshal(jsonBlob, &gps_data); err != nil {
         fmt.Println(err.Error())
         return
    }
    fmt.Println(gps_data)
    if gps_data["_type"].(string) == "encrypted" {
       datab,err := base64.StdEncoding.DecodeString(gps_data["data"].(string))
       if err == nil {
         var nonce [24]byte
         copy(nonce[:], datab[:24])
         data_enc := []byte(datab[24:])
         var psk [32]byte
         pp := []byte(preSharedKey)
         l := int(math.Min(float64(len(pp)),32))
         copy(psk[:],pp[:l])
         data_decr,_ := secretbox.Open(nil, data_enc, &nonce, &psk)
         fmt.Println(string(data_decr))
         if err := json.Unmarshal(data_decr, &gps_data); err != nil {
            fmt.Println(err.Error())
            return
         }
       }
    }
    if gps_data["_type"].(string) == "location" {
      id  := topic[strings.LastIndex(topic,"/")+1:]
      lat := fmt.Sprintf("%.7f",gps_data["lat"].(float64)) // degree
      lon := fmt.Sprintf("%.7f",gps_data["lon"].(float64)) // degree
      alt := fmt.Sprintf("%.0f",gps_data["alt"].(float64)) // m
      vel := fmt.Sprintf("%.1f",gps_data["vel"].(float64)) // km/h
      acc := fmt.Sprintf("%.0f",gps_data["acc"].(float64)) // m
      tm := time.Unix(int64(gps_data["tst"].(float64)), 0)
      gpsDate := fmt.Sprintf("%6s",tm.Format("020106"))
      gpsTime := fmt.Sprintf("%6s",tm.Format("150405"))
      gpsRecord := id + "/" + gpsDate + "," + gpsTime  + "," + lat  + "," + lon  + "," + alt  + "," + vel + "," + acc
      fmt.Println(gpsRecord)
      connClient, _ := net.Dial("tcp", tcpHost+":"+strconv.Itoa(tcpPort))
      fmt.Fprint(connClient, gpsRecord)
      connClient.Close()
   }
}

var connectHandler mqtt.OnConnectHandler = func(client mqtt.Client) {
    fmt.Println("Connected")
}

var connectLostHandler mqtt.ConnectionLostHandler = func(client mqtt.Client, err error) {
    fmt.Printf("Connect lost: %v", err)
//    isExit = true;
}

func sub(client mqtt.Client) {
    topic := Topic +"/#"
    token := client.Subscribe(topic, 1, nil)
    token.Wait()
    fmt.Printf("Subscribed to topic: %s", topic)
}

// initialize the server (command line arguments and list of known devices)
func init() {
    flag.StringVar(&Host,"mqtt_server",DEFAULT_HOST,"address of the MQTT broker")
    flag.IntVar(&Port,"mqtt_port",DEFAULT_PORT,"port number of MQTT broker")
    flag.StringVar(&User,"user",DEFAULT_USER,"username to authenticate with the MQTT broker")
    flag.StringVar(&Password,"password",DEFAULT_PW,"password to authenticate with the MQTT broker")
    flag.StringVar(&Topic,"mqtt_topic",DEFAULT_TOPIC,"Topic to subscribe to (e.g. owntracks/gps)")
    flag.StringVar(&tcpHost,"tcp_server",DEFAULT_TCPHOST,"address of the TCP server to deliver the data to")
    flag.IntVar(&tcpPort,"tcp_port",DEFAULT_TCPPORT,"port of the TCP server to deliver the data to")
    flag.StringVar(&preSharedKey,"psk_enc","","PSK to decrypt the payload")
    flag.Parse()
    fmt.Println("MQTT Bridge starting - MQTT Broker expected at : "+Host+"  Port :"+strconv.Itoa(Port))
    fmt.Println("                       TCP server expected at : "+tcpHost+"  Port :"+strconv.Itoa(tcpPort))
}

