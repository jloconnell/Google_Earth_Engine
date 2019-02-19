//load pts data from assests
var pts = ee.FeatureCollection(table);

//IMPORT MODIS IMAGE DATA
var mod = ee.ImageCollection('MODIS/006/MOD11A1') 
.filterBounds(geometry)
.filterDate('2013-05-01','2015-07-30')

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


Export.table.toDrive(newft,
"mod_11a1_006",  
"Engine",
"mod11a1_006_test")
