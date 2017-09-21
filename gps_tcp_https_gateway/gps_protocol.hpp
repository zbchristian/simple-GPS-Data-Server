#define 	STRLEN	256
 
typedef struct { const char *msg,*resp; } ReqRespPat;

enum DEVTYPE {TK103B_CZ, TK103, GL103};

enum GPSDATA {INVALID, DEVID, ACTIVE, TIME, DATE, LAT, NS, LON, EW, SPEED, ANGLE, ELEVATION, PRECISION}; 

#define MAXPARMS PRECISION+1

enum UNITS {NONE, DEGREE, DEGMIN, KNOTS, KMPERH, MPERS};

typedef struct {
	const char *device;	// device number 
	DEVTYPE	type;		// one of the DEVTYPE values
	ReqRespPat login, heartbeat, gps_data;	// regular expressions describing the message + response
	int order[MAXPARMS];		// define the order of the incoming parameters. List in above GPSDATA enum
	int units[MAXPARMS];		// for unit conversion provide unit of parameter (enum UNITS)
} dev_pattern;

#define NO_DEVS		3

// Regular expressions for TCP communications patterns of tracking devices
// Pattern matching is done with the BOOST::regex lib 
dev_pattern devs[NO_DEVS]={
// ------------
	{.device="TK103B - NOT typical for TK103", .type=TK103B_CZ,
	 .login 	= {.msg=NULL, .resp=NULL},
//      example heartbeat: *HQ,355488020824039,XT,V,0,0#
//                               IMEI
	 .heartbeat 	= {.msg="^\\*\\w{2},(\\d{15}),XT,[V|A]*,([0-9]+),([0-9]+)#.*$", .resp=NULL},
//      example data: *HQ,355488020824039,V1,114839,A,   5123.85516,N,  00703.64046,E,  0.03,  0,    010917,EFE7FBFF#
//                        imei               time   A/V  lat        N/S long        E/W speed  angle date   Status bits
	 .gps_data	= {.msg="^\\*\\w{2},([0-9]{15}),V1,([0-9]{6}),([A|V]*),([0-9.]+),([N|S]),([0-9.]+),([E|W]),([0-9.]+),([0-9.]+),([0-9]{6}),([\\w0-9]+)#.*$", .resp=NULL},
	 .order         = {DEVID,TIME,ACTIVE,LAT,NS,LON,EW,SPEED,ANGLE,DATE},
	 .units		= {NONE,NONE,NONE,DEGMIN,NONE,DEGMIN,NONE,KMPERH,DEGREE,NONE,NONE}},
// ------------
	{.device="TK103-untested and incomplete", .type=TK103,
	 .login 	= {.msg="^\\((\\d{12})(BP05)([A-Z0-9.]*)\\).*$", .resp="%DATE%%TIME%AP05HSO"},
	 .heartbeat 	= {.msg=NULL, .resp=NULL},
	 .gps_data	= {.msg="^\\((\\d{12})(B[A-Z]\\d{2})([A-Z0-9.]*)\\).*$", .resp=NULL},
	 .order         = {DEVID},
	 .units		= {NONE}},

// -----------
	{.device="GL103-untested and incomplete", .type=GL103,
	 .login 	= {.msg="^##,imei:(\\d+),A;.*$", .resp="LOAD"},
	 .heartbeat 	= {.msg="^imei:(\\d+);.*$", .resp="ON"},
	 .gps_data	= {.msg="^imei:(\\d+),(\\d+|A),?(\\d*),?(\\d+),?([a-z0-9,%.]+);.*$", .resp=NULL},
	 .order         = {DEVID},
	 .units		= {NONE}}
};


typedef struct {
	char 	name[STRLEN];
	char	response[STRLEN];
	char  	devid[15+1];
	bool	active;
	char	date[6+1];
	char	time[6+1];
	float	lat,lon;
	char	NS,EW;
	float	speed,angle,elevation,precision;
} gps_struct;
 
