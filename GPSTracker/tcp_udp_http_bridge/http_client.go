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
)

func sendHTTPrequest(host string, urlpath string, query string) (string, error) {
	Url := strings.TrimSpace(host)
	ishttp, err := regexp.MatchString("^(http|https)://.+$", Url)
	if !ishttp { Url = "https://"+Url }
	query = strings.TrimSpace(query)
	Url += "/" + urlpath + "?" + query
	if VERBOSE { logger.Print("URL: " + Url) }
	timeout := time.Duration(5 * time.Second)
	client := http.Client{Timeout: timeout,}
	strBody := ""
	resp,err := client.Get(Url)
	if err == nil { 
		defer resp.Body.Close()
		body, err := ioutil.ReadAll(resp.Body)
		if err == nil {strBody = strings.TrimSpace(string(body))}
	}
	return strBody,err
}
