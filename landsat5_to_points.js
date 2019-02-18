///Raster to points: Landsat 5
///code to extract Landsat raster data at points (shapefile) that have been loaded 
///to your account as assets; Here it is assumed that you imported the shapefile/points/assets and called them "table"
//This code returns all band data from dates specified and exports it as a .csv,  
//to your google drive account into the folder of your choice
///This code can limit returned data to only low cloud scenes (< than a % of scene, as specified below) 
//This code can also limit the return of cloudy pixels through the cloudMAskL457 function
//usage: import your asset as "table", edit the dates to those you want in the .filterDate line, 
//       check that .filterMetadata('Cloud_Cover', 'less_than', xx) meets your needs, where xx is the percent of clouds
//       create a geometry object that covers the spatial area you want and run

var pts = ee.FeatureCollection(table);

/**
 * Function to mask clouds based on the pixel_qa band of Landsat SR data, missions 4,5,7.
 * @param {ee.Image} image Input Landsat SR image
 * @return {ee.Image} Cloudmasked Landsat image
 */
var cloudMaskL457 = function(image) {
  var qa = image.select('pixel_qa');
  // If the cloud bit (5) is set and the cloud confidence (7) is high
  // or the cloud shadow bit is set (3), then it's a bad pixel.
  var cloud = qa.bitwiseAnd(1 << 5)
                  .and(qa.bitwiseAnd(1 << 7))
                  .or(qa.bitwiseAnd(1 << 3));
  // Remove edge pixels that don't occur in all bands
  var mask2 = image.mask().reduce(ee.Reducer.min());
  return image.updateMask(cloud.not()).updateMask(mask2);
};

//IMPORT raster, here we use Landsat 5, 
//limit the spatial location with filterBounds(geometry) 
//where geometry is a shape you've drawn on the map with the drawing tool in the lower map window
//limit the dates with filterDate
//limit cloudy scenes with the 'CLOUD_COVER' scene metadata variable
var myraster = ee.ImageCollection('LANDSAT/LT05/C01/T1_SR') 
.filterBounds(geometry)  
.filterDate('2008-12-01','2010-06-05')
//remove images where whole image has lots of cloud cover
.filterMetadata('CLOUD_COVER' , 'less_than', 30)
//remove cloudy pixels for Landsat 4,5, or 7
.map(cloudMaskL457);



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
  var ft2 = img.reduceRegions(pts, ee.Reducer.first(),30);

  // gets the date of the img
  var date = img.date().format();

  // writes the date in each feature
  var ft3 = ft2.map(function(f){return f.set("date", date)});

  // merges the FeatureCollections

  var ft3a = ft3.filter(ee.Filter.neq('B1', null));//filter first to remove null values
  return inift.merge(ft3a);
};

//Iterates over the ImageCollection
var newft = ee.FeatureCollection(myraster.iterate(fill, ft))

//Export to a csv file called "myfile.csv" into your Google Drive folder called "Engine" and labeled the task "mylabel"
//this will cause a label called "mylabel" to appear in the task pane, click on this and select "run"
Export.table.toDrive(newft,
"mylabel",
"Engine",
"myfile")

