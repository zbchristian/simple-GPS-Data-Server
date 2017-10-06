// Simple HTTP-Client w/ timeout
// =============================
// accepts http://example.com, https://example.com or example.com (https is asummed in this case)
// query string is trimmed to a single line and url-escaped
// returns the body of the response
//

package main

import (
        "io/ioutil"
        "net/http"
		"strings"
		"regexp"
		"time"
		"crypto/tls"
)

func sendHTTPrequest(host string, urlpath string, query string) (string, error) {
	host = strings.TrimSpace(host)
	skipVerify := false
	// disable certificate verify for access to localhost
	if host == "localhost" || host == "127.0.0.1" { skipVerify = true } 	
	Url := host
	ishttp, err := regexp.MatchString("^(http|https)://.+$", Url)
	if !ishttp { Url = "https://"+Url }
	query = strings.TrimSpace(query)
	Url += "/" + urlpath + "?" + query
	if isVerbose { logger.Print("URL: " + Url) }
	timeout := time.Duration(5 * time.Second)
	tr := &http.Transport{TLSClientConfig: &tls.Config{InsecureSkipVerify: skipVerify},} 
	client := http.Client{Timeout: timeout,Transport: tr,}
 	strBody := ""
	resp,err := client.Get(Url)
	if err == nil { 
		defer resp.Body.Close()
		body, err := ioutil.ReadAll(resp.Body)
		if err == nil {strBody = strings.TrimSpace(string(body))}
	}
	return strBody,err
}
