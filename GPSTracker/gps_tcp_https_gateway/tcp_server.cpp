/* A simple server in the internet domain using TCP
   ================================================
   Parameters:
   tcp port number
   HTTPS server name or IP address (can be localhost)
   url path of HTTPS page (e.g. /gpstracker)
   secret_key (key to authorize close command via TCP port) 
 */
#include <stdio.h>
#include <stdbool.h>
#include <unistd.h>
#include <fcntl.h>
#include <stdlib.h>
#include <string.h>
#include <math.h>
#include <sys/types.h>
#include <sys/socket.h>
#include <netinet/in.h>
#include <signal.h>
#include <pcre.h>
#include <sqlite3.h>
#include <time.h>
#include <signal.h>
#include <algorithm>
#include <boost/regex.hpp>
#include <libgen.h>

#define logfile	"/log.txt"

//using namespace std;

#define	tcp_timeout	10

pid_t 	pid;
bool	isExit;
char 	secret_key[80];
time_t	now;
char 	logname[256];
FILE	*logfd;
char 	logstr[512];

std::string send_https_request(std::string, std::string);
void handle_connection(int,std::string,std::string);
bool GetQueryString(char * , char *, char *, int);
void analyze_HTTPresponse(std::string);

void signalHandler(int signo) {
	isExit = true;
}

// write a single line into log file given by logname
// trims the string and removes all line feeds
bool writelog(char *text) {
	time (&now);
	char Date[80];
	snprintf(Date,80,"%s",ctime(&now));
	Date[strlen(Date)-1]='\0';	// remove trailing line feed of ctime
	int n=0;
	int i=0;
	char *loc = text;
	// trim string and remove all line feeds - > single line log entry
	for(i=0;i<strlen(text);++i) if(text[i]=='\n' || text[i]=='\r') text[i]=' ';
	while((i++)<strlen(text)-1 && isspace(*loc)) ++loc;
	i = strlen(text)-1;
	while(i>=0 &&  isspace(text[i])) text[i--]='\0';
	while((logfd = fopen(logname,"a")) == NULL && ++n<10) usleep(100);
	if(logfd == NULL) return false;
	fprintf(logfd,"%s - %s\n",Date,loc);
	fclose(logfd);
	return true;
}

void error(const char *msg) {
    	perror(msg);
    	exit(1);
}

int main(int argc, char *argv[]) {
	int 	sockfd, newsockfd, portno,pid;
     	socklen_t clilen;
     	struct sockaddr_in serv_addr, cli_addr;
     	if (argc < 5) {
        	fprintf(stderr,"Usage: tcp_port HTTP_server_name url_path secret_key\n");
         	exit(1);
     	}
		pid = getpid();
		char prog[256];
		strncpy(prog,argv[0],256);
		strncpy(logname,dirname(prog),256);
		strncat(logname,logfile,256-strlen(logname));
		logname[255]='\0';
		logfd=fopen(logname,"w");	// clear old data in logfile 
		if(logfd == NULL) { fprintf(stderr,"Can not open logfile ... exit"); exit(1); }
		fclose(logfd);
		strncpy(secret_key,argv[4],80);
		secret_key[79]='\0';
     	portno = atoi(argv[1]);
     	std::string httpserver(argv[2]);
     	std::string urlpath(argv[3]);
     	isExit = false;
		// avoid zombies -> ignore signals from childs
     	struct sigaction sigchld_action ;
     	sigchld_action.sa_handler = SIG_DFL;
     	sigchld_action.sa_flags = SA_NOCLDWAIT;
     	sigaction(SIGCHLD, &sigchld_action, NULL);
     	signal(SIGINT, signalHandler);

		sockfd = socket(AF_INET, SOCK_STREAM, 0);
    	if (sockfd < 0) error("ERROR opening socket");
     	fcntl(sockfd, F_SETFL, O_NONBLOCK);	// non-blocking accept
     	int optval = 1;
     	setsockopt(sockfd, SOL_SOCKET, SO_REUSEADDR, &optval, sizeof(optval)); // allow reconnect to port

     	bzero((char *) &serv_addr, sizeof(serv_addr));
     	serv_addr.sin_family = AF_INET;
     	serv_addr.sin_addr.s_addr = INADDR_ANY;
     	serv_addr.sin_port = htons(portno);
     	if (bind(sockfd, (struct sockaddr *) &serv_addr,sizeof(serv_addr)) < 0)
              	error("ERROR on binding");
     	listen(sockfd,5);
     	clilen = sizeof(cli_addr);
		time (&now);
		snprintf(logstr,512,"%s starting - PID = %d",argv[0],(unsigned int)pid);
		writelog(logstr);
     	while (!isExit) {
			newsockfd = accept(sockfd,(struct sockaddr *) &cli_addr, &clilen);
         	if (newsockfd < 0) {usleep(100); continue;}	// non-blocking -> loop and wait for connection
         	pid = fork();
         	if (pid < 0) error("ERROR on fork");
         	if (pid == 0) {
             		close(sockfd);
             		handle_connection(newsockfd,httpserver,urlpath);
					if(isExit) kill(pid, SIGINT);;
             		exit(0);
         	}
         	else close(newsockfd);
     	}
     	close(sockfd);
		snprintf(logstr,512,"%s shutdown\n",argv[0]);
		writelog(logstr);
     	return 0;
}

// handle a single connection
// filter the message and determine the GPS device type
// send corresponding response or close directly
void handle_connection(int sock,std::string httpserver,std::string url) {

	#define close_timeout		1000	// close socket after n seconds w/o activity
	#define BUFSIZE				4096

   	int 	n;
   	char 	buffer[BUFSIZE],response[BUFSIZE],query[BUFSIZE];
   	int  	waittime;

   	bool 	first=true;
   	waittime = 0;
	struct 	timeval tv;
   	tv.tv_sec = tcp_timeout;
   	tv.tv_usec = 0;
   	setsockopt(sock, SOL_SOCKET, SO_RCVTIMEO, (const char*)&tv,sizeof(struct timeval));
//
	char closecmd[80], statuscmd[80];
	sprintf(closecmd,"close %s",secret_key);
	sprintf(statuscmd,"status %s",secret_key);
	bool isClose=false;
   	while(waittime < close_timeout && !isClose && !isExit) {
     		bzero(buffer,BUFSIZE);
     		n = read(sock,buffer,BUFSIZE);
     		if (n < 0) {
       			waittime += tcp_timeout;
  //     			printf(" Waited for %d sec\n",waittime);
       			continue;
     		}
     		if(n==0) break;	// assume closed connection
     		waittime=0;
     		snprintf(logstr,512,"Incoming message: %s\n",buffer);
			writelog(logstr);
			response[0]='\0';
			isClose = strstr(buffer,statuscmd);	// status requested -> close after response
			isExit  = strstr(buffer,closecmd);	// exit of server requested -> set Exit flag
			if(isExit || isClose) {
				if(isClose) sprintf(response,"OK");	// status response
				if(isExit) sprintf(response,"SHUTDOWN");	// exit server
			}
			else if(GetQueryString(buffer,response,query,BUFSIZE)) {
				if(strlen(query)>0) {
					url += "?";
					url += query;
					std::string response = send_https_request(httpserver,url);
//        			std::cout << "Response received: '" << response << "'\n";
					analyze_HTTPresponse(response);
				}
			}
			if(strlen(response)>0) {
				n = write(sock,response,strlen(response));
				if (n < 0) error("ERROR writing to socket");
			}
	}
	close(sock);
}


