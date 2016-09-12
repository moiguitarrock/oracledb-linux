import {executeReader} from '../dbhelpers';

export function getWithExecuteReader(){
  var params = {
    pid_course: 3738,
    dt_earned: null,
    creturn: ''
  };

  executeReader(
    "pkg_wax_course_publication.search",
    params
  ).then(function(response){
    console.log(response.meta);
    console.log('total rows: ' + response.data.length);
    console.log(response.data);
  }, function(err){
    console.log(err);
  });
}
