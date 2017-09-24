#include <boost/asio.hpp>
#include <boost/asio/ssl.hpp>
#include <boost/regex.hpp>
#include <iostream>
#include <string>

bool writelog(const char *);

std::string send_https_request(std::string server, std::string reqString) {
	boost::system::error_code ec;
    	using boost::asio::ip::tcp;
    	namespace ssl = boost::asio::ssl;
    	typedef ssl::stream<tcp::socket> ssl_socket;

//		std::string logentry("HTTPS-Client called : "+reqString);
//		writelog(logentry.c_str());
    	if(reqString.length() == 0) return 0;

		bool isLocalhost = (server=="localhost" || server=="127.0.0.1");

    	reqString  = "GET "+reqString+" HTTP/1.1\r\n";
    	reqString += "Host: "+server+"\r\n";
    	reqString += "User-Agent: GPS-TCP-HTTP-Bridge\r\n";
    	reqString += "Connection: close\r\n\r\n";

// Create a context that uses the default paths for
// finding CA certificates.
    	ssl::context ctx(ssl::context::sslv23);
    	ctx.set_default_verify_paths();

// Open a socket and connect it to the remote host.
    	boost::asio::io_service io_service;
    	ssl_socket ssock(io_service, ctx);
	if(!isLocalhost) {
	    	tcp::resolver resolver(io_service);
    		tcp::resolver::query query(server, "https");
    		boost::asio::connect(ssock.lowest_layer(), resolver.resolve(query));
	}
	else
    		ssock.lowest_layer().connect({ {}, 443 }); // connect to localhost
    ssock.lowest_layer().set_option(tcp::no_delay(true));

// Perform SSL handshake and verify (except for localhost) the remote host's certificate
	if(!isLocalhost) { 
	    	ssock.set_verify_mode(ssl::verify_peer);
    		ssock.set_verify_callback(ssl::rfc2818_verification(server));
	}
  	ssock.handshake(ssl_socket::client);

// send request
    	std::string request(reqString);
    	boost::asio::write(ssock, boost::asio::buffer(request));

// read response
    	std::string response("");
    	do {
        	char buf[1024];
        	size_t bytes_transferred = ssock.read_some(boost::asio::buffer(buf), ec);
        	if (!ec) response.append(buf, buf + bytes_transferred);
    	} while (!ec);
	return response;
}
