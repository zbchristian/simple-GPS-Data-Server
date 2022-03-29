<?php
// Utility functions for GPStracker
// ================================
//
// Author: C.Zeitnitz 2017
//

function filter_ident($id) {
    return preg_replace("/[^a-zA-Z0-9]+/u", '', $id);
}

// IMEI has to be 15 digits long
function filter_imei($imei) {   
    return preg_replace("/[^0-9]/u", '', $imei);
}

function filter_devno($n) {
    return preg_replace("/\D/u", '', $n);
}

function replace_alternative_var_names($inputs) {
    if(array_key_exists("timestamp",$inputs)) $inputs["time"]=abs($inputs["timestamp"]/time()) < 10 ? gmdate("c",$inputs["timestamp"]) : gmdate("c",$inputs["timestamp"]/1000);
    if(array_key_exists("speed",$inputs)) $inputs["spd"]=$inputs["speed"];
    if(array_key_exists("altitude",$inputs)) $inputs["alt"]=$inputs["altitude"];
    if(array_key_exists("accuracy",$inputs)) $inputs["acc"]=$inputs["accuracy"];
    return $inputs;
}


function convert_GPRMC_data($inputs) {
    if(!isset($inputs["gprmc"])) return false;
    $gprmc = explode(",",$inputs["gprmc"]);
    if(!is_array($gprmc) || count($gprmc)<12 || $gprmc[0]!== '$GPRMC') {
        unset($inputs["gprmc"]);
        return $inputs;
    }
// build date/time UTC
    if(is_numeric($gprmc[1]) && is_numeric($gprmc[9])) {
        sscanf(explode(".",$gprmc[1])[0],"%2d%2d%2d",$h,$m,$s); // time might be hhmmss.ss
        sscanf($gprmc[9],"%2d%2d%2d",$D,$M,$Y);
        $Y+=2000;
        $date="$Y-$M-$D"."T$h:$m:$s"."Z";
        $inputs["time"] = gmdate("c",strtotime("$date"));
    }
// latitude
    if(is_numeric($gprmc[3])) {
        $deg = intval($gprmc[3]/100);
        $min = $gprmc[3]-$deg*100;
        $deg += $min/60.0;
        $deg *= $gprmc[4]=="S" ? -1 : 1;
        $inputs["lat"]=number_format($deg,6,".","");
    }
// longitude
    if(is_numeric($gprmc[5])) {
        $lat = intval($gprmc[5]/100);
        $min = $gprmc[5]-$lat*100;
        $lat += $min/60.0;
        $lat *= $gprmc[6]=="W" ? -1 : 1;
        $inputs["lon"]=number_format($lat,6,".","");
    }
// speed
    if(is_numeric($gprmc[7])) $inputs["spd"] = floatval($gprmc[7])*1.852/3.6; // speed in m/sec

    $inputs["acc"]="-1";
    if(!isset($inputs["alt"])) $inputs["alt"]="0";
    return $inputs; 
}

// modify the time string for the gpx file
function gpx_time($time) {
    global $timezone;
    if (!empty($timezone)) date_default_timezone_set($timezone);
    $t=date("c",strtotime($time));
    return $t;
}

function create_gpx_data($devno,$gps) {
    global $prog,$tmp,$timezone,$SplitTrackSec,$WayPointSec,$error,$date_fmt;
    if(count($gps) == 0) return false;
    if(!empty($error) ||  $gps[0]["n"] == 0 ) return array();
    list($name,$namenb)=get_devname_db($devno); 
    if($name === false) return false;
    $fname=$namenb.".gpx";
    $gpx  = '<?xml version="1.0" encoding="UTF-8" standalone="no" ?>';
    $gpx .= '<gpx xmlns="http://www.topografix.com/GPX/1/1" version="1.1" creator="'.$prog.'" ';
    $gpx .= 'xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" ';
    $gpx .= 'xsi:schemaLocation="http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd">';
    $gpx .= '<metadata><name>'.$fname.'</name><desc>GPS locations for device '.$name.' from '.$gps[0]["startdate"].' to '.$gps[0]["enddate"].' </desc><author>'.$prog.'</author></metadata>';
    $gpx .= '<trk><trkseg>';
    $li=0;
    $wayp["type"]=array();
    $wayp["idx"]=array();
    $wayp["trk"]=array();
    $tlast = date($date_fmt,0);
    $ntrk=0;
    $lspd = -999.0;
    foreach($gps as $i => $row) {
        $row["time"]=gpx_time($row["time"]);
        // remove consecutive entries  with exact same positions
        if($i>0 && $llon == $row["lon"] && $llat == $row["lat"]) continue;
        // remove consecutive points with speed = 0 
        if($i>0 && $lspd == 0.0 && isset($row["spd"]) && $row["spd"] == 0.0) continue;
                if(!empty($tlast) && (strtotime($row["time"])-strtotime($tlast)) > $SplitTrackSec ) {
                        $gpx .= '</trkseg></trk>';
            if($i>1) {
                $wayp["type"][]="End";
                $wayp["idx"][]=$li; // $i-1;
                $wayp["trk"][]=$ntrk;
            }
                        $gpx .= '<trk><trkseg>';
            ++$ntrk;
            $wayp["type"][]="Start";
            $wayp["idx"][]=$i;
            $wayp["trk"][]=$ntrk;
                }
                else if(!empty($tlast) && (strtotime($row["time"])-strtotime($tlast)) > $WayPointSec )  {
            $wayp["type"][]="Pause";
            $wayp["idx"][]=$i-1;
            $wayp["trk"][]=$ntrk;
        }
        $lat = number_format($row["lat"],6,".","");
        $lon = number_format($row["lon"],6,".","");
        $llat = $row["lat"];
        $llon = $row["lon"];
        $gpx .= '<trkpt lat="'.$lat.'" lon="'.$lon.'">';
        $gpx .= '<time>'.$row["time"].'</time>';
        if(isset($row["alt"]) && $row["alt"] > -10000 )$gpx .= '<ele>'.$row["alt"].'</ele>';
        if(isset($row["acc"]) && $row["acc"] >= 0 ) $gpx .= '<pdop>'.$row["acc"].'</pdop>';
        if(isset($row["spd"])) {
            $gpx .= '<extensions>';
// nmea:speed would require additional nmea XML namespace 
//          $knots=number_format($row["spd"]/1.852,2,".","");
//          $gpx .= '<nmea:speed>'.$knots.'</nmea:speed>';
            $mpersec=number_format($row["spd"],2,".","");
            $gpx .= '<speed>'.$mpersec.'</speed>';          // m/sec
            $gpx .= '</extensions>';
            $lspd = $row["spd"];
        }
        $gpx .= '</trkpt>';
        $tlast = $row["time"];
        $li = $i;
    }
    $wayp["type"][]="End";
    $wayp["idx"][]=$li;
    $wayp["trk"][]=$ntrk;
    $gpx .= '</trkseg></trk>';
// show waypoint for last position, if not same as end of last track
    if($li < $i) {
        $wayp["type"][]="Last pos";
        $wayp["idx"][]=$i;
        $wayp["trk"][]=-1;
    }
    foreach($wayp["idx"] as $i => $idx) {
        $gps[$idx]["time"]=gpx_time($gps[$idx]["time"]);
        $lat = number_format($gps[$idx]["lat"],6,".","");
        $lon = number_format($gps[$idx]["lon"],6,".","");
        $gpx .= '<wpt lat="'.$lat.'" lon="'.$lon.'">';
        $datetime=date($date_fmt,strtotime($gps[$idx]["time"]));
        if($wayp["trk"][$i] >= 0) $gpx .= '<name>'.$wayp["type"][$i].' track '.$wayp["trk"][$i].' at '.$datetime.'</name>';
        else $gpx .= '<name>'.$wayp["type"][$i].' at '.$datetime.'</name>';
        $gpx .= '<time>'.$gps[$idx]["time"].'</time>';
        if(isset($gps[$idx]["alt"]) && $gps[$idx]["alt"] > -10000 ) $gpx .= '<ele>'.$gps[$idx]["alt"].'</ele>';
        $gpx .= '</wpt>';
    }
    $gpx .= '</gpx>  ';
    return $gpx;
}

// remove all files from temp directory
function cleanup_temp() {
    global $tmp;
    if(($files=glob($tmp."/".'*.*')) === false) return;
    foreach($files as $f) unlink($f);
}

function filter_GET_inputs() {
        $inputs=array();
        foreach($_GET as $key => $val) {
        $key = trim($key);
        $val = trim($val);
//echo "$key = $val <br>";
//echo bin2hex($val);
                $key=strip_str($key);
                $val=strip_str($val);
//      $key=repl_special($key);
//      $val=repl_special($val);
                if(!check_ascii($key) || !check_ascii($val)) continue;
                $inputs[$key]=$val;
        }
        return $inputs;
}

function check_ascii($str) {
        $pat='/^([a-z0-9\:\;\_\.\,\-\#\$\*\&\/ ÄÖÜäöüß\(\)]+)$/i';  //only these ascii characters allowed
        $ret = true;
        if(is_array($str))      foreach($str as $i => $s) $ret &=  empty($s)||preg_match($pat,$s);
        else                            $ret = empty($str)||preg_match($pat,$str);
        return $ret;
}
function strip_str($str) {
        if(empty($str)) return "";
    $pat = "/[\'\"\`\´\?;\%\&\!]/";
        if(is_array($str))      {
                $ret = array();
                foreach($str as $i => $s)
                $ret[] = strip_tags(preg_replace($pat,"",$s));
        }
        else    $ret = strip_tags(preg_replace($pat,"",$str)); // remove quotes
        return $ret;
}

function repl_special($string)
{
    $search = array("Ä", "Ö", "Ü", "ä", "ö", "ü", "ß", "´");
    $replace = array("Ae", "Oe", "Ue", "ae", "oe", "ue", "ss", "");
    $str= str_replace($search, $replace, $string);
    return $str;
}

// get time range in minutes
// format nnnu exampe 10m (10 minutes)
// nnn: integer number
// u: unit m(inutes), h(ours), d(ays), y(ears)
// w/o unit hours are assumed
function timerange2minutes($dt) {
    $dt = preg_replace('/\s+/', '', $dt);
        if(is_numeric($dt)) $dt=$dt*60;  // just a number -> time range given in hours
        else {
                $i=sscanf($dt,"%d%s",$n,$unit);
        $unit = trim(strtolower($unit));
        if(preg_match("/^da*y*s*$/",$unit)) $unit="d";
        else if(preg_match("/^ho*u*r*s*$/",$unit)) $unit="h";
        else if(preg_match("/^mi*n*u*t*e*s*$/",$unit)) $unit="m";
        else if(preg_match("/^ye*a*r*s*$/",$unit)) $unit="y";
                if($i<=0) $dt=24*60;
                else {
                        switch($unit) {
                                default:
                                case 'm': $dt = $n; break;
                                case 'h': $dt = $n*60; break;
                                case 'd': $dt = $n*60*24; break;
                                case 'y': $dt = $n*365*24*60; break;
                        }
                }
        }
    return $dt;
}

function correctDate($inputs) {
    global $date_fmt;
    $dateFmts=array($date_fmt,"d.m.y","d.m.Y","Y-m-d","m/d/y","m/d/Y");
    $timeFmts=array("","","H:i","H:i:s");
    $ok=false;
    $date="";
        if(array_key_exists("date",$inputs))    {
        foreach($dateFmts as $dfmt) {
            foreach($timeFmts as $tfmt) {
                $fmt=trim("!".$dfmt." ".$tfmt);
                $date=DateTime::createFromFormat($fmt,$inputs["date"]);
                if($date !== false) {
                    $ok=true;
                    $date=$date->format("Y-m-d H:i:s");
                    break;
                }
            }
            if($ok) break;
        }
    }
        if(!$ok) $date=date("Y-m-d H:i:s");
    if($date > ($d=date("Y-m-d H:i:s"))) $date = $d;
    if(date('H:i:s', strtotime($date)) === "00:00:00" ) $date=date('Y-m-d 23:59:59', strtotime($date));
    return $date;
}

function  distanceInMeters($lon1,$lat1,$lon2,$lat2) {
    define("NM",1852);      // nautical mile in m
    define("mPerDeg",60*NM);    // meter per degree (longitude only at aquator)
    $mlon1 = mPerDeg*cos(deg2rad($lat1));
    $mlon2 = mPerDeg*cos(deg2rad($lat2));
    $mlat1 = mPerDeg*$lat1;
    $mlat2 = mPerDeg*$lat2;
    return sqrt(pow(mlon1-mlat1,2)+pow(mlon2-mlat2,2));
}

?>

