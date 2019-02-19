///Raster to points: MODIS MOD11A1
///code to extract MODIS raster data at points (shapefile) that have been loaded 
///to your account as assets; Here it is assumed that you imported the shapefile/points/assets and called them "table"
//This code returns all band data from dates specified and exports it as a .csv,  
//to your google drive account into the folder of your choice
//usage: import your asset as "table", edit the dates to those you want in the .filterDate line, 
//       create a geometry object that covers the spatial area you want and run


//load pts data from assests
var pts = ee.FeatureCollection(table);

//IMPORT MODIS IMAGE DATA, filter spatially with a geometery object and temporally by dates
var mod = ee.ImageCollection('MODIS/006/MOD11A1') 
.filterBounds(geometry)
.filterDate('2013-05-01','2013-07-30')

//This code below is a function to extract points called "table" from raster called "myraster"
// Empty Collection to fill
var ft = ee.FeatureCollection(ee.List([]))


//With removal of null values ------------------------------------------
//Function to extract values from image collection based on point file and 
//export as a table 
var fill = function(img, ini) {

  // type cast
  var inift = ee.FeatureCollection(ini);

  // gets the values for the points in the current img
  var ft2 = img.reduceRegions(pts, ee.Reducer.first(),1000);

  // gets the date of the img
  var date = img.date().format();

  // writes the date in each feature
  var ft3 = ft2.map(function(f){return f.set("date", date)});

  // merges the FeatureCollections

  var ft3a = ft3.filter(ee.Filter.neq('LST_Day_1km', null));//filter first to remove null values
  return inift.merge(ft3a);
};

// Iterates over the ImageCollection
var newft = ee.FeatureCollection(mod.iterate(fill, ft))

//Export to a csv file called "myfile.csv" into your Google Drive folder called "Engine" and label the task "mylabel"
//this will cause a label called "mylabel" to appear in the task pane, click on this and select "run"
Export.table.toDrive(newft,
"mylabel",
"Engine",
"myfile")
