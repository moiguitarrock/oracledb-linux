var dbhelper = require('../dbhelper.js');

// get long data in a cursor

var params = {
  pid_course: 3738,
  dt_earned: null,
  creturn: ''
};

dbhelper.executeReader(
  "pkg_wax_course_publication.search",
  params
).then(function(response){
  console.log(response.meta);
  console.log('total rows: ' + response.data.length);
  console.log(response.data);
}, function(err){
  console.log(err);
});


// get data in a cursor with a clob column

// var params = {
//   pid_course: 470026,
//   creturn: ''
// };
//
// dbhelper.executeReaderLob(
//   "pkg_wax_offering_doc.cs_es_offering_to_index",
//   params,
//   'COMPONENTS'
// ).then(function(response){
//   // console.log(response.meta);
//   console.log('total rows: ' + response.data.length);
//   console.log(response.data);
// }, function(err){
//   console.log(err);
// });

//Execute non query and auto-commit

// var params = {
//   pid_elastic_search_queue: 811654,
//   pcd_status: 'IDUART'
// };
//
// dbhelper.executeNonQuery(
//   "pkg_wax_elastic_search_queue.save",
//   params
// ).then(function(response){
//   console.log('DONE!');
// }, function(err){
//   console.log(err);
// });


//Execute function

// var params = {
//   id_course: 470210,
//   in_active: 1,
//   in_completed: 1
// };
//
// dbhelper.executeFunction(
//   "pkg_wax_course.status_course",
//   params
// ).then(function(response){
//   console.log(response);
// }, function(err){
//   console.log(err);
// });
