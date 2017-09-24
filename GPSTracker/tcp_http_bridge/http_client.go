package main

import (
        "fmt"
        "io/ioutil"
        "net/http"
		"net/url"
)

func sendHTTPrequest(host string, urlpath string, query string) {
	fmt.Println("Query: "+query)
	url := "https://" + host + "/" + urlpath + "?" + url.QueryEscape(query)
	fmt.Println("url : " + url) 
	resp,err := http.Get(url)
	if err != nil {
		fmt.Println("Error")    // handle error
    } else { 
		defer resp.Body.Close()
		body, err := ioutil.ReadAll(resp.Body)
		if err == nil {fmt.Println(string(body))}
	}
}
