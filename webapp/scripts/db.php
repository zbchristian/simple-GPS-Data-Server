<?php
// SQLite DB with tables
// - devicelist "device_list"
// - gps data: table name given by entry "devno_".$devno in corresponding device entry
//
//
// Author: C.Zeitnitz 2017
//


$db_filename = "db/gpstracker.db";

$devicelist_tbl = "device_list";
$devicelist_schema="devno INTEGER PRIMARY KEY AUTOINCREMENT, tstamp TEXT, name TEXT, desc TEXT, id TEXT, keys TEXT, imei TEXT, history INTEGER";
// devno:  is unique and used for the data table of the device "devno_nn"
// id:     is unique and selected by the administrator. Used to post data via the web
// keys:   is unique and selected by the administrator. Used to retrieve data via the web
// imei    device is sending GPS data via TCP-HTTPS-Bridge (tag imei of request)
// history:defines the length of time in days to store data for the device. 
$gps_schema="ID INTEGER PRIMARY KEY AUTOINCREMENT, tstamp TEXT, tstored TEXT, lat REAL, lon REAL, alt REAL, acc REAL, spd REAL";
// lat,lon: in degrees ; alt, acc: in meters spd :  in m/sec

$db=NULL;

$querydate_start=0;
$querydate_end=0;

function sanity_check_gps(&$data) {
    if(!is_array($data)) return false;
// mandatory parameters
    if(!isset($data["time"]) || ($d=new DateTime($data["time"]))===NULL)    return false;
    if(!isset($data["tstored"])     || ($d=new DateTime($data["tstored"]))===NULL)  return false;
    if(!isset($data["lat"])     || is_numeric($data["lat"])===false)        return false;
    if(!isset($data["lon"])     || is_numeric($data["lon"])===false)        return false;
// not mandatory parameters
    if(isset($data["alt"])  && !is_numeric($data["alt"]))       return false;
    if(isset($data["acc"])  && !is_numeric($data["acc"]))       return false;
    if(isset($data["spd"])  && !is_numeric($data["spd"]))       return false; // optional
    if(!isset($data["alt"])) $data["alt"]=-10000.0; // default altitude -10km
    if(!isset($data["acc"])) $data["acc"]=-1.0; // default no accuracy 
    if(!isset($data["spd"])) $data["spd"]=-1.0; // default no speed
    return true;
}

function check_db($tbl_name="") {
    global $db,$db_filename,$gps_schema,$devicelist_tbl,$devicelist_schema,$relpath;
//  echo "Check db ...";
    if($db !== NULL) $db->close();
    if(($db=new SQLite3($relpath."/".$db_filename)) === NULL) return false;
    $db->exec('CREATE TABLE IF NOT EXISTS "'.$devicelist_tbl.'" ('.$devicelist_schema.')');
    if(!empty($tbl_name)) $db->exec('CREATE TABLE IF NOT EXISTS "'.$tbl_name.'" ('.$gps_schema.')');
//  echo " OK<br>";
    return true;
}

// loop over devices and cleanup the GPS data
function cleanup_GPS_data() {
    global $db;
    if(($devs = retrieve_devicelist_db()) === false) return false;
    foreach($devs as $dev) {
        if(!isset($dev["devno"]) || !isset($dev["history"])) continue;
        cleanup_table_db($dev["devno"],$dev["history"]);
    }
}

// remove all entries for device $devno which are older than $hist days
function cleanup_table_db($devno,$hist) {
    global $db;
    if(!is_numeric($devno) || $hist <= 0 || !check_db("")) return false;
    $table=gps_tablename($devno);
    if(!table_exists($table)) return false;
    $now=gmdate("c",time());    // current date/time UTC
    $date=gmdate("c",strtotime("-$hist days",strtotime($now))); // subtract history time
    $res=$db->query('DELETE FROM "'.$table.'" WHERE tstamp < "'.$date.'"'); // delete old entries
    if($res !== false) {
        $res=$db->query('SELECT count(*) FROM "'.$table.'"');       // check if table is empty
        $cnt=$res->fetchArray();
        $res->finalize();
        if($cnt['count(*)'] == 0) $db->query('DROP TABLE IF EXISTS "'.$table.'"'); // remove empty table
    }
}

// remove all entries in DB which are older than $history days
/*function cleanup_db($history) {
    global $db,$devicelist_tbl;;
    if(!check_db("")) return false;
    $now=gmdate("c",time());    // current date/time UTC
    $date=gmdate("c",strtotime("-$history days",strtotime($now)));  // subtract history time
    $res = $db->query("SELECT name FROM sqlite_master WHERE type='table';");    // get list of tables
    if($res === false) return false;
    $tables=array();
    while ($table = $res->fetchArray()) $tables[] = $table["name"];
    $res->finalize();
    foreach($tables as $i => $table) {  // loop over tables
        if($table === "sqlite_sequence") continue;  // ignore sqlite internal table
        if($table === $devicelist_tbl) continue;    // ignore device list
        $db->query('DELETE FROM "'.$table.'" WHERE tstamp < "'.$date.'"');  // delete old entries
        $res=$db->query('SELECT count(*) FROM "'.$table.'"');       // check if table is empty
        $cnt=$res->fetchArray();
        $res->finalize();
        if($cnt['count(*)'] == 0) $db->query('DROP TABLE IF EXISTS "'.$table.'"'); // remove empty table
    }
} */

function gps_tablename($devno) { return  "devno_".$devno; }

define("TIME1024WEEKS",1024*7*24*60*60);
function insert_gps_db($data) {
    global $db;
    if(!sanity_check_gps($data)) return false;
    $tbl_name=gps_tablename($data["devno"]);
    if(!check_db($tbl_name)) return false;
    // try to correct for GPS week rollover
    // if "time" is 1024 weeks ago wrt to today, add 1024 weeks
    $ts=strtotime($data["time"]);
    if(abs(time()-$ts-TIME1024WEEKS) < 86400) { // 1024 weeks difference +- 1 day
        $ts += TIME1024WEEKS;
    }
    $tstamp= gmdate('c',$ts);
    $tstored= gmdate('c',strtotime($data["tstored"]));
    // check for already existing entry (same tstamp) and ignore
    if(!val_exists_db($tbl_name,"tstamp",$tstamp)) {
        $db->exec('INSERT INTO "'.$tbl_name.'" (tstamp,tstored,lat,lon,alt,acc,spd) VALUES
            ("'.$tstamp.'","'.$tstored.'",'.$data["lat"].','.$data["lon"].','.$data["alt"].','.$data["acc"].','.$data["spd"].')' );
        if(($id=$db->lastInsertRowid()) == 0) return false;
//      echo "<h2>Insert ID $id</h2>";
    }
    return true;
}

function retrieve_gps_db($devno,$enddate,$dt="24") {
    global $db,$prog;
    $tbl=gps_tablename($devno);
    if(!check_db($tbl)) die("<h2>No data available</h2>");
    if(($d=new DateTime($enddate))===NULL) return false;
    if(!is_numeric($dt)) return false;
    $enddate= gmdate('c',strtotime($enddate));
    $startdate= gmdate('c',strtotime("-$dt min",strtotime($enddate)));
    $results = $db->query('SELECT tstamp,lat,lon,alt,acc,spd FROM "'.$tbl.'" WHERE tstamp BETWEEN "'.$startdate.'" AND "'.$enddate.'" ORDER BY tstamp ASC');
    $n=0;
    $gps=array();
    if($results !== false) {
        while ($row = $results->fetchArray()) {
            if(!isset($row["tstamp"])||!isset($row["lat"])||!isset($row["lon"])||!isset($row["alt"])||!isset($row["acc"])) continue;
            $gps[$n]["lat"] = $row["lat"];
            $gps[$n]["lon"] = $row["lon"];
            $gps[$n]["time"]= $row["tstamp"];
            if(isset($row["alt"]) && $row["alt"] > -10000) $gps[$n]["alt"] = number_format($row["alt"],0,".","");
            if(isset($row["acc"]) && $row["acc"]>= 0) $gps[$n]["acc"]= number_format($row["acc"],0,".","");
            if(isset($row["spd"]) && $row["spd"]>= 0) $gps[$n]["spd"]= number_format($row["spd"],1,".","");
            ++$n;
        }
    }
    $gps[0]["n"]=$n;
    $gps[0]["query_startdate"] = $startdate;
    $gps[0]["query_enddate"]   = $enddate;
    if($n>0) {
        $gps[0]["startdate"]=$gps[0]["time"];
        $gps[0]["enddate"]=$gps[$n-1]["time"];
    }
    return $gps;
}

// mode: "add", "change", "delete"
function handle_device_db($devinfo,$mode) {
    global $db,$devicelist_tbl;
    if(!check_db("")) return "DB not available";
    if(!isset($devinfo["name"]) || !isset($devinfo["id"]) ) return false;
    if(in_array($mode,array("add","change"))) {
        if(strlen(trim($devinfo["name"])) < 5 || strlen(trim($devinfo["id"]))<5 ) return "Device name or ID too short";
        $tstamp= gmdate('c',time());
        $name = trim($devinfo["name"]);
        $id = preg_replace('/\s+/', '', trim($devinfo["id"]));
        $keys = preg_replace('/\s+/', '', trim($devinfo["keys"]));
        $imei = preg_replace('/\s+/', '', trim($devinfo["imei"]));
        $desc = isset($devinfo["desc"]) ? trim($devinfo["desc"]) : "";
        $hist = isset($devinfo["history"]) ? trim($devinfo["history"]) : 0;
    }
    $devno = isset($devinfo["devno"]) ? trim($devinfo["devno"]) : 0;
    if($mode == "add") {
        if(val_exists_device_db("name",$name)) return "Device with name $name already existing";
        if(val_exists_device_db("id",$id)) return "Device with ID $id already existing";
        if(val_exists_device_db("keys",$keys)) return "Device with KEYS $keys already existing";
        if(!empty($imei) && val_exists_device_db("imei",$imei)) return "Device with IMEI $imei already existing";
        if(!empty($imei) && strlen($imei)!=15) return "Provided IMEI $imei does not have 15 digits";
        $db->exec('INSERT INTO "'.$devicelist_tbl.'" (tstamp,name,desc,id,keys,imei,history) VALUES
            ("'.$tstamp.'","'.$name.'","'.$desc.'","'.$id.'","'.$keys.'","'.$imei.'",'.$hist.')' );
        if(($id=$db->lastInsertRowid()) == 0) return false;
//      echo "<h2>Registered new device $name with ID $id</h2>";
    }
    else if ($mode == "change") {
        if(($curr = retrieve_device_db("devno",$devno) === false)) return "Change of device failed";
        if(val_exists_device_db("name",$name,$devno)) return "Device NAME $name already exists";
        if(val_exists_device_db("id",$id,$devno)) return "Device ID $id already exists";
        if(val_exists_device_db("keys",$keys,$devno)) return "Device with KEYS $keys already existing";
        if(!empty($imei) && val_exists_device_db("imei",$imei,$devno)) return "Device IMEI $imei already exists";
        if(!empty($imei) && strlen($imei)!=15) return "Provided IMEI $imei does not have 15 digits";
        $db->exec('UPDATE "'.$devicelist_tbl.'" SET tstamp="'.$tstamp.'",name="'.$name.'",desc="'.$desc.'",id="'.$id.'",keys="'.$keys.'",imei="'.$imei.'",history='.$hist.' WHERE devno='.$devno);
//      echo "<h2>Device $name with ID $id has been modified</h2>";
    }
    else if (in_array($mode, array("clear","delete")) ) {
        $gpstbl = gps_tablename($devno);
        if(table_exists($gpstbl)) $db->exec('DROP TABLE '.$gpstbl);
        if($mode=="delete" && $db->exec('DELETE FROM '.$devicelist_tbl.' WHERE devno='.$devno) === false) return "Delete of device failed";
    }
    return true;
}

function retrieve_devicelist_db() {
    global $db,$devicelist_tbl;
    if(!check_db("")) return false;
    $results = $db->query('SELECT * FROM '.$devicelist_tbl);
    $n=0;
    $devs=array();
    if($results !== false) {
        while ($row = $results->fetchArray()) {
            if(!isset($row["name"]) || !isset($row["id"]) || !isset($row["desc"]) ||  !isset($row["history"])) continue;
            $devs[] = $row;
            ++$n;
        }
    }
    $devs[0]["n"]=$n;
    return $devs;
}

function  match_in_list($needle, $list, $isCase=true) {
    $flag= $isCase ? "" : "i";
    return !empty($needle) && !empty($list) && preg_match('/\b'.$needle.'\b/'.$flag,$list);
}

function retrieve_device_db($col,$val,$isCase=true,$isList=false,$excl="") {
    global $db,$devicelist_tbl;
    if(!check_db("")) return false;
    $qadd  = !empty($excl) ? ' AND NOT('.$excl.')' : "";
    $qadd .= $isCase ? "" : " COLLATE NOCASE";
    $results = $db->query('SELECT * FROM '.$devicelist_tbl.' WHERE '.$col.'="'.$val.'" '.$qadd);
    if ($results !== false && ($row = $results->fetchArray())) return $row;
    if ( $isList ) { // handle a comma separated list
           $results = $db->query('SELECT * FROM '.$devicelist_tbl.' WHERE '.$col.' LIKE "%'.$val.'%" '.$qadd);
           while( $results !== false && ($row = $results->fetchArray()) && isset($row[$col])
                  && match_in_list($val, $row[$col]) ) return $row;
    }
    return false;
}

function val_exists_device_db($col,$val,$dev_excl=-1) {
        $vals=explode(",",$val);
        $ret=false;
        foreach ($vals as $val)  
            $ret |= retrieve_device_db($col,$val,false,true,"devno=".$dev_excl)!== false;
        return $ret;
}

function val_exists_db($table,$col,$val,$excl="",$isCase=true) {
    global $db;
    $query='SELECT count(*) FROM "'.$table.'" WHERE '.$col.'="'.$val.'"';
    if(!empty($excl)) $query .=' AND NOT('.$excl.')';
    if(!$isCase) $query .= " COLLATE NOCASE";
    $cnt=$db->query($query);
    if($cnt === false) return false;
    $cnt=$cnt->fetchArray();
    return $cnt['count(*)']>0;
}


function imei_exists_db() {
    global $db, $devicelist_tbl;
    if(!check_db("")) return false;
    $query='SELECT count(*) FROM "'.$devicelist_tbl.'" WHERE imei!=""';
    $cnt=$db->query($query);
    if($cnt === false) return false;
    $cnt=$cnt->fetchArray();
    return $cnt['count(*)']>0;
}

function get_devname_db($devno) {
    if(($dev = retrieve_device_db("devno",$devno))===false || !isset($dev["name"]) ) return array(false,false);
    $name = $dev["name"];
    $namenb = preg_replace('/\s+/u', '_', $name);
    $namenb = repl_special($namenb);
    return array($name,$namenb);
}

function table_exists($tab) {
    global $db;
    if(!check_db("")) return false; 
    $cnt = $db->query("SELECT count(*) FROM sqlite_master WHERE type = 'table' AND name = ".'"'.$tab.'"');
    if($cnt === false) return false;
    $cnt=$cnt->fetchArray();
    return $cnt['count(*)']>0;
}

?>
