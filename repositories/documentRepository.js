var oracledb = require('oracledb');
var dbConfig = require('../dbconfig.js');

var numRows = 10;  // number of rows to return from each call to getRows()

oracledb.getConnection(
  {
    user          : dbConfig.user,
    password      : dbConfig.password,
    connectString : dbConfig.connectString
  },
  function(err, connection)
  {
    if (err) { console.error(err.message); return; }
    var bindvars = {
      pid_course:  407622,
      creturn:  { type: oracledb.CURSOR, dir : oracledb.BIND_OUT }
    };
    connection.execute(
      "BEGIN pkg_wax_offering_doc.cs_es_offering_to_index(:pid_course, :creturn); END;",
      bindvars,
      function(err, result)
      {
        if (err) {
          console.error(err.message);
          doRelease(connection);
          return;
        }
        console.log(result.outBinds.creturn.metaData);
        fetchRowsFromRS(connection, result.outBinds.creturn, numRows);
      });
  });

function fetchRowsFromRS(connection, resultSet, numRows)
{
  resultSet.getRows( // get numRows rows
    numRows,
    function (err, rows)
    {
      if (err) {
        console.log(err);
        doClose(connection, resultSet); // always close the result set
      } else if (rows.length === 0) {    // no rows, or no more rows
        doClose(connection, resultSet); // always close the result set
      } else if (rows.length > 0) {
        console.log("fetchRowsFromRS(): Got " + rows.length + " rows");
        console.log(rows);
        fetchRowsFromRS(connection, resultSet, numRows);
      }
    });
}

function doRelease(connection)
{
  connection.release(
    function(err)
    {
      if (err) { console.error(err.message); }
    });
}

function doClose(connection, resultSet)
{
  resultSet.close(
    function(err)
    {
      if (err) { console.error(err.message); }
      doRelease(connection);
    });
}
