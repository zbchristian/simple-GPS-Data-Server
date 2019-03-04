// filter received message for known message pattern
// identify device and create GPRMC record to be send to HTTPS server
//
#include <stdio.h>
#include <stdbool.h>
#include <unistd.h>
#include <stdlib.h>
#include <string.h>
#include <math.h>
#include <algorithm>
#include <boost/regex.hpp>
#include "gps_protocol.hpp"

bool filter_gps_device(char *, gps_struct *);
bool createGPRMCRecord(gps_struct *, char *,int);
int regexp_match_copy(char *, char *, char *, int );
bool writelog(const char *);

void analyze_HTTPresponse(std::string response) {
	char logstr[512];
	char subStr[4][STRLEN];
	char expr[]="^HTTP/[0-9.]{3}\\s+(\\d+).+[\\r\\n|\\n|\\r]+([0-9a-zA-Z]+)\\s+(OK|REJECTED|FAILED).*$";    // check for return code and message in body
	if(regexp_match_copy(expr, (char*)response.c_str(), (char*)subStr, 3)==3 && atoi(subStr[0]) == 200) { 
		snprintf(logstr,512,"HTML code %d device imei %s - %s\n",atoi(subStr[0]),subStr[1],subStr[2]);
		writelog(logstr);
	}
}


bool GetQueryString(char * msg, char *response, char *query, int n) {
	char logstr[512];
	gps_struct   gps_data;
	response[0]='\0';
	query[0]='\0';
	if(filter_gps_device(msg,&gps_data)) {
		snprintf(logstr,512,"Device %s - %s\n",gps_data.name,gps_data.active?"active" : "inactive");
       	if(gps_data.lat > -91.0 && gps_data.active) {
        	createGPRMCRecord(&gps_data,query,n); 
		   	if(strlen(gps_data.response) > 0) {
				strncpy(response,gps_data.response,std::min((int)strlen(gps_data.response),n-1));
				response[n-1]='\0';
			}
       	}
	}
    else snprintf(logstr,512,"Unkown device\n");
	writelog(logstr);
	if(gps_data.active && strlen(query)>0) writelog(query);
	return strlen(response)>0 || strlen(query)>0;
}


bool createGPRMCRecord(gps_struct *gps, char *req,int nc) {
	snprintf(req+strlen(req),nc-strlen(req),"imei=%s",gps->devid);
// altitude and accuracy are not part of the GPRMC record -> add if available 
	if(gps->elevation > -9999) snprintf(req+strlen(req),nc-strlen(req),"&alt=%.0f",gps->elevation);
	if(gps->precision > 0) snprintf(req+strlen(req),nc-strlen(req),"&acc=%.0f",gps->precision);
// build GPRMC record
	std::string gprmc("$GPRMC,");
	gprmc+=gps->time;
	if(gps->active) gprmc+=",A,";
	else gprmc+=",V,";
	int deg=(int)gps->lat;
	float min=(gps->lat - deg)*60.;
	char cstr[STRLEN];
	snprintf(cstr,STRLEN,"%02d%05.2f",abs(deg),min);
	gprmc+=cstr;
	if(deg>=0) gprmc+=",N,";
	else gprmc=",S,"; 
	deg=(int)gps->lon;
	min=(gps->lon - deg)*60.;
	snprintf(cstr,STRLEN,"%03d%05.2f",abs(deg),min);
	gprmc+=cstr;
	if(deg>=0) gprmc+=",E,";
	else gprmc=",W,";
	snprintf(cstr,STRLEN,"%.1f,",gps->speed);
	gprmc+=cstr;
	snprintf(cstr,STRLEN,"%.1f,",gps->angle);
	gprmc+=cstr;
	gprmc+=gps->date;
	gprmc+=",0.0,E,A*";
	// calculate GPRMC checksum
	char cs=0;
	for(char c : gprmc) if(c!='$' && c!='*') cs ^= c;
	snprintf(cstr,STRLEN,"%02X",(int)cs);
	gprmc+=cstr;
	snprintf(req+strlen(req),nc-strlen(req),"&gprmc=%s",gprmc.c_str());
/*	std::string logentry("createGPRMC : ");
	logentry +=req;
	writelog(logentry.c_str());
	return true;
*/
}

// match message to regular expression and copy matched strings to return array
// needs BOOST library

#include <boost/regex.hpp>
#include <string>
#include <iostream>

int regexp_match_copy(char * devexpr, char *msg, char *cpyStr, int nsubs) {

	std::string s = msg;
	char	(*parms)[STRLEN]=(char (*)[STRLEN])cpyStr;
	boost::regex expr(devexpr);
	boost::cmatch m_parms;
	int n=0;

    if (boost::regex_match(s.c_str(), m_parms, expr)) {
		for(int i=1; i< m_parms.size() && i<=nsubs; ++i) {
			std::string sm(m_parms[i].first,m_parms[i].second);
			int num = std::min(STRLEN-1,(int)sm.size());
			strncpy(parms[n],sm.c_str(),num);
			parms[n][num] = '\0';
			++n;
		}
	}
	return n;
}

// try to match the received msg a known device command pattern
// return true if device could be matches (name, data and response in gps structure)

bool filter_gps_device(char *msg, gps_struct *gps) {
	dev_pattern dev;
	char subStr[20][STRLEN];
	bool isLogin=false;
	bool isHeart=false;
	bool isData=false;
	int id,nmatch;
	for(int i=0;i<NO_DEVS;++i) {
		dev = devs[i];
		id = i;
		if(dev.login.msg     != NULL 	&& (nmatch=regexp_match_copy((char*)dev.login.msg, msg, (char*)subStr,20))>0) {
			isLogin = true;
			break;
		}
		if(dev.heartbeat.msg != NULL 	&& (nmatch=regexp_match_copy((char*)dev.heartbeat.msg, msg, (char*)subStr,20))>0) {
			isHeart = true;
			break;
		}
		if(dev.gps_data.msg  != NULL 	&& (nmatch=regexp_match_copy((char*)dev.gps_data.msg, msg, (char*)subStr,20))>0) {
			isData = true;
			break;
		}
	}
	gps->name[0]='\0';
	if(nmatch==0) return false;
	if(isLogin) strncpy(gps->name,"Login - ",STRLEN-1);
	if(isHeart) strncpy(gps->name,"Heartbeat - ",STRLEN-1);
	if(isData) strncpy(gps->name,"GPS-data - ",STRLEN-1);
	strncat(gps->name,devs[id].device,std::min(STRLEN-(int)strlen(gps->name)-1,(int)strlen(devs[id].device)));
	char *resp=NULL;
	if(isLogin) resp = (char *)devs[id].login.resp;
	if(isHeart) resp = (char *)devs[id].heartbeat.resp;
	if(isData)  resp = (char *)devs[id].gps_data.resp;
	if(resp != NULL) strncpy(gps->response,resp,std::min(STRLEN-1,(int)strlen(resp)));
	else gps->response[0]='\0';
    gps->devid[0]='\0';
    gps->active=false;
    gps->date[0]='\0';
    gps->time[0]='\0';
    gps->NS='\0';
    gps->EW='\0';
	gps->lat=-9999;
	gps->lon=-9999;
	gps->speed = -1;
	gps->angle = -9999;
	gps->elevation = -9999;
	gps->precision = 0;
	for(int j=0;j<MAXPARMS;++j) {
		switch(devs[id].order[j]) {
			default: break;
			case DEVID:
				strncpy(gps->devid,subStr[j],15);
				gps->devid[15]='\0';
				break;
			case TIME:
				strncpy(gps->time,subStr[j],6);
				gps->time[6]='\0';
				break;
			case DATE:
				strncpy(gps->date,subStr[j],6);
				gps->date[6]='\0';
				break;
			case ACTIVE:
				gps->active = strcmp(subStr[j],"A")==0;
				break;
			case NS:
				gps->NS = subStr[j][0];
				break;
			case EW:
				gps->EW = subStr[j][0];
				break;
			case LAT:
				sscanf(subStr[j],"%f",&gps->lat);
				if(devs[id].units[j] == DEGMIN) {	// get degree
			                float deg = ((int)gps->lat)/100;
					float min = gps->lat - (int)deg*100;
					deg += min/60.;
					gps->lat = deg;
				}
				gps->lat *= gps->NS=='S' ? -1 : 1;	// convert to signed degree
				break;
			case LON:
				sscanf(subStr[j],"%f",&gps->lon);
				if(devs[id].units[j] == DEGMIN) {	// get degree
			                float deg = ((int)gps->lon)/100;
					float min = gps->lon - ((int)deg*100);
					deg += min/60.;
					gps->lon = deg;
				}
				gps->lon *= gps->EW=='W' ? -1 : 1;	// convert to signed degree
				break;
			case SPEED:
				sscanf(subStr[j],"%f",&gps->speed);
				if(devs[id].units[j] == KNOTS) gps->speed /= 0.514;	// get m/s
				else if(devs[id].units[j] == KMPERH) gps->speed /= 3.6;	// get m/s
				break;
			case ANGLE:
				sscanf(subStr[j],"%f",&gps->angle);
				break;
			case ELEVATION:
				sscanf(subStr[j],"%f",&gps->elevation);
				break;
			case PRECISION:
				sscanf(subStr[j],"%f",&gps->precision);
				break;
		}
	}
/*	std::string vals("GPS data : ");
	vals += "imei = ";
	vals += gps->devid;
	vals += "lat = ";
	vals += std::to_string(gps->lat);
	vals += "time = ";
	vals += gps->time;
*/	
	return true;
}

