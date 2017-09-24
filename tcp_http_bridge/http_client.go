package main

import (
        "fmt"
        "io/ioutil"
        "net/http"
)

func sendHTTPrequest(query string) {
        resp,err := http.Get("http://zeitnitz.eu/gps/index.php?"+query)
        if err != nil {
                fmt.Println("Error")    // handle error
        } else { 
                defer resp.Body.Close()
                body, err := ioutil.ReadAll(resp.Body)
                if err == nil {fmt.Println(string(body))}
        }
}
