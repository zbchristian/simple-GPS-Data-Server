<?php
include "config.php";
$relpath="..";
include "db.php";

// this is an interactive script to view/modify the SQLite DB on the command line

if(!check_db("")) die("DB not available");

// cleanup_db(30);

// show all existing tables and return entries in the table
$tables = $db->query("SELECT name FROM sqlite_master WHERE type='table'");     // get list of tables
while ($table = $tables->fetchArray()) {
	$cnt=$db->query('SELECT count(*) FROM "'.$table["name"].'"');
	$cnt=$cnt->fetchArray();
	echo $table["name"]." with ".$cnt['count(*)']." entries\n";
}


// $db->exec('ALTER TABLE "Camper_K-TA-1779" RENAME TO "devno_1"');
// $db->exec('ALTER TABLE "Handy_CZ" RENAME TO "devno_2"');

// $table = "device_list";
// add column to table 
// $res=$db->exec('ALTER TABLE '.$table.' ADD COLUMN history INTEGER DEFAULT 30');

// rename column (copy table to new schema)
// echo "Schema = $schema \n";
// $db->exec('ALTER TABLE '.$table.' RENAME TO tabtemp');	// rename original
// $db->exec('DROP TABLE '.$table);
// $res=$db->exec('CREATE TABLE IF NOT EXISTS '.$table.' ('.$schema.')');	// create new 
// $res=$db->query('INSERT INTO '.$table.' SELECT * FROM tabtemp');	// copy data
// $db->exec('DROP TABLE tabtemp');	// drop only original when everything is ok!

//$res=$db->exec('UPDATE '.$table.' SET spd=ISNULL(spd,-1)');

// set all NULL values to -1
// $res=$db->exec('UPDATE '.$table.' SET spd=ISNULL(spd,-1)');

// select values from DB
$table="device_list";
// $table = "devno_1";
$now=gmdate("c",time());        // current date/time UTC
$date=gmdate("c",strtotime("-10 hours",strtotime($now)));
echo "cut date = ".$date."\n";
// $res=$db->query('SELECT * FROM '.$table.' WHERE tstamp > "'.$date.'"');
$res=$db->query('SELECT * FROM '.$table);
// while ($row = $res->fetchArray()) {var_dump($row);echo "\n";}
// while ($row = $res->fetchArray()) {echo " t: ".$row["tstamp"]." lat = ".$row["lat"]." lon =  ".$row["lon"]."\n";}
?>
